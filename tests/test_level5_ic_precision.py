"""One IC precision story: six results, residuals, chi-square decision and replay."""
import math
import statistics
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from rdflib import RDF
from rdflib.namespace import DCTERMS, SKOS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE

ROOT = Path(__file__).resolve().parents[1]


class ICPrecisionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(
            str(EX['path-level5-ic-precision']), BASE+'paths/level5-ic-precision'))
        cls.scenes = {s['id']: s for s in cls.document['scenes']}

    def scene(self, name):
        return self.scenes[f'ex:{name}--scene']

    def readings(self):
        observations=list(self.union.objects(EX['ic-readings'],CD.hasObservation))
        observations.sort(key=lambda r:int(next(self.union.objects(r,CD.position))))
        return [float(next(self.union.objects(r,CD.numericValue))) for r in observations]

    @staticmethod
    def chi5_tail(q):
        t=q/2
        return math.erfc(math.sqrt(t))+math.exp(-t)/math.sqrt(math.pi)*(2*math.sqrt(t)+4/3*t**1.5)

    def test_case_has_the_instructor_six_values_and_correct_spread(self):
        xs=self.readings()
        self.assertEqual([9.95,10.15,9.85,10.25,9.95,10.15],xs)
        self.assertAlmostEqual(10.05,statistics.mean(xs))
        self.assertAlmostEqual(.12,sum((x-10.05)**2 for x in xs))
        self.assertAlmostEqual(.024,statistics.variance(xs))
        self.assertAlmostEqual(.15491933384829668,statistics.stdev(xs))
        residuals=[(x-10.05)/.10 for x in xs]
        for got,expected in zip(residuals,[-1,1,-2,2,-1,1]):
            self.assertAlmostEqual(expected,got)
        self.assertAlmostEqual(12,sum(z*z for z in residuals))
        self.assertAlmostEqual(0,sum(residuals))

    def test_deviation_table_retains_order_duplicates_and_squared_units(self):
        rows=list(self.union.objects(EX['ic-deviation-table'],CD.hasTableRow))
        rows.sort(key=lambda r:int(next(self.union.objects(r,CD.position))))
        self.assertEqual(7,len(rows))
        for row,x in zip(rows[:6],self.readings()):
            cells=list(self.union.objects(row,CD.hasTableCell))
            cells.sort(key=lambda r:int(next(self.union.objects(r,CD.position))))
            values=[str(next(self.union.objects(c,CD.body))) for c in cells]
            self.assertAlmostEqual(x,float(values[0].split(':')[1]))
            self.assertAlmostEqual(x-10.05,float(values[1]))
            self.assertAlmostEqual((x-10.05)**2,float(values[2]))
        self.assertIn('(mg/L)²',str(next(self.union.objects(EX['ic-tc3'], SKOS.prefLabel))))

    def test_df_five_cutoff_and_p_value_are_independently_calibrated(self):
        cutoff=11.07049769351635
        self.assertAlmostEqual(.05,self.chi5_tail(cutoff),places=13)
        self.assertAlmostEqual(.03478778050624185,self.chi5_tail(12),places=13)
        self.assertGreater(12,cutoff)
        # For sigma below sigma0, Q is scaled by (sigma/sigma0)^2.
        for ratio in (.25,.5,.8,1):
            self.assertLessEqual(self.chi5_tail(cutoff/ratio**2),.05+1e-13)
        text=json.dumps(self.scene('ic-reference'))
        self.assertIn('sigma=sigma0',text)
        self.assertIn('not independent',text)
        decision=self.scene('ic-test')['narration']
        for phrase in ('composite null','Bias','uncertainty','does not diagnose'):
            self.assertIn(phrase,decision)

    def test_reference_density_matches_chi_square_five_and_svg_markers(self):
        for observation in self.union.objects(EX['ic-chi5-density'],CD.hasObservation):
            x=float(next(self.union.objects(observation,CD.xValue)))
            y=float(next(self.union.objects(observation,CD.numericValue)))
            expected=0 if x==0 else math.exp(1.5*math.log(x)-x/2-2.5*math.log(2)-math.lgamma(2.5))
            self.assertAlmostEqual(expected,y,places=14)
        root=ET.parse(ROOT/'apps/pitch/public/chemometrics/level5-ic-chi5-tail.svg').getroot()
        ns={'s':'http://www.w3.org/2000/svg'}
        cutoff=root.find('.//s:path[@data-cutoff]',ns)
        observed=root.find('.//s:path[@data-observed]',ns)
        self.assertAlmostEqual(11.07049769351635,float(cutoff.attrib['data-cutoff']))
        self.assertEqual(12,float(observed.attrib['data-observed']))

    def test_ten_thousand_series_replay_all_authored_histogram_counts(self):
        def rdf_list(head):
            values=[]
            while head!=RDF.nil:
                values.append(next(self.union.objects(head,RDF.first)))
                head=next(self.union.objects(head,RDF.rest))
            return values
        expected=[int(v) for v in rdf_list(EX['ic-count0'])]
        self.assertEqual(list(range(33)),[float(v) for v in rdf_list(EX['ic-edge0'])])
        self.assertEqual(10000,sum(expected))
        state=20261101; normal=statistics.NormalDist(); counts=[0]*32; qs=[]
        for _ in range(10000):
            xs=[]
            for _ in range(6):
                state=16807*state%2147483647
                xs.append(10+.10*normal.inv_cdf(state/2147483647))
            mean=statistics.mean(xs)
            q=sum(((x-mean)/.10)**2 for x in xs)
            self.assertTrue(0<=q<32)
            counts[int(q)]+=1;qs.append(q)
        self.assertEqual(expected,counts)
        self.assertAlmostEqual(5.008018586926897,statistics.mean(qs),places=11)
        self.assertEqual(485,sum(q>11.07049769351635 for q in qs))
        self.assertEqual(342,sum(q>=12 for q in qs))
        code=str(next(self.union.objects(EX['ic-simulation-code'],CD.code)))
        for fragment in ('M <- 10000','n <- 6','sigma0 <- 0.10','state <- 20261101','qnorm',
                         'mean(x)','qchisq(.95, df = 5)','nbins = 32'):
            self.assertIn(fragment,code)
        chart=next(b for b in self.scene('ic-repeated-series')['blocks'] if b['kind']=='chart')
        self.assertIn('histogram',json.dumps(chart).lower())

    def test_active_path_uses_one_ic_story_then_explicitly_changes_to_t_example(self):
        ids=list(self.scenes)
        self.assertEqual(61,len(ids))
        names=['ic-process','ic-data','ic-question','ic-deviations','ic-spread-scene',
               'ic-repeated-series','ic-scale-question','ic-squares','ic-reference','ic-test']
        self.assertEqual([f'ex:{name}--scene' for name in names],ids[23:33])
        self.assertNotIn('ex:rev-chi-report--scene',ids)
        self.assertEqual('ex:ic-t-transition--scene',ids[33])
        transition=self.scene('ic-t-transition')['narration']
        self.assertIn('separate constructed five-reading',transition)
        self.assertIn('does not reuse the six IC values',transition)
        self.assertEqual('ex:mc-scope--scene',ids[-1])
        command=json.loads((ROOT/'package.json').read_text())['scripts']['preview:level5:generate']
        self.assertIn('path-level5-multiplicative-story',command)
        old=runtime.compile_scene_document(self.dataset,runtime.CoursePathReference(str(EX['path-level5-storyline']),BASE+'paths/level5-storyline'))
        old_ids=[s['id'] for s in old['scenes']]
        self.assertEqual(old_ids[:22],ids[:22])
        self.assertEqual(old_ids[28:],ids[34:])

    def test_need_for_a_reference_is_visible_before_calculation_and_the_named_law(self):
        ids=list(self.scenes)
        for before,after in [('ic-question','ic-deviations'),('ic-question','ic-spread-scene'),
                             ('ic-spread-scene','ic-repeated-series'),('ic-repeated-series','ic-squares'),
                             ('ic-scale-question','ic-squares'),('ic-reference','ic-test')]:
            self.assertLess(ids.index(f'ex:{before}--scene'),ids.index(f'ex:{after}--scene'))
        question=next(b for b in self.scene('ic-question')['blocks'] if b['kind']=='definition-list')
        question_text=json.dumps(question)
        self.assertIn('how often would six readings',question_text)
        self.assertIn('does not by itself prove',question_text)
        scale=next(b for b in self.scene('ic-scale-question')['blocks'] if b['kind']=='definition-list')
        self.assertIn('same upper-tail probability',json.dumps(scale))
        self.assertIn('not a better summary',self.scene('ic-scale-question')['narration'])
        # The pre-derivation experiment is shown in raw variance units, with no
        # not-yet-explained chi-square curve or already-scaled Q axis.
        self.assertEqual(EX['ic-count0'],next(self.union.objects(EX['ic-variance-counts'],CD.binCounts)))
        self.assertFalse(list(self.union.objects(EX['ic-variance-chart'],DCTERMS.hasPart)))
        self.assertEqual('(mg/L)²',str(next(self.union.objects(EX['ic-variance-chart'],CD.xAxisUnit))))
        head=EX['ic-ve0'];edges=[]
        while head!=RDF.nil:
            edges.append(float(next(self.union.objects(head,RDF.first))))
            head=next(self.union.objects(head,RDF.rest))
        self.assertEqual(33,len(edges))
        for index,edge in enumerate(edges):self.assertAlmostEqual(index*.002,edge)
        self.assertAlmostEqual(12,.024/(.1**2/5))

    def test_new_formula_legends_and_media_are_authored_accessible_and_local(self):
        ns={'s':'http://www.w3.org/2000/svg'}
        for name in ('ic-spread-scene','ic-squares','ic-reference','ic-test'):
            scene=self.scene(name)
            self.assertTrue(any(b['kind']=='definition-list' and b.get('emphasis')!='supporting' for b in scene['blocks']))
            for block in scene['blocks']:
                if block['kind']!='math':continue
                resource=EX[block['source'][0]['resourceId'].removeprefix('ex:')]
                symbols=set(self.union.objects(resource,CD.hasSymbol))
                covered={s for legend in self.union.objects(resource,DCTERMS.hasPart)
                         for entry in self.union.objects(legend,CD.hasDefinitionListEntry)
                         for s in self.union.objects(entry,DCTERMS.references)}
                self.assertTrue(symbols)
                self.assertLessEqual(symbols,covered)
                self.assertTrue(any(b['kind']=='definition-list' and b.get('emphasis')=='supporting' for b in scene['blocks']))
        for name in ('ic-process','ic-squares','ic-reference','ic-test'):
            media=next(b for b in self.scene(name)['blocks'] if b['kind']=='media-reference')
            self.assertTrue(media['alternativeText'])
            path=ROOT/'apps/pitch/public'/media['uri'].lstrip('/')
            root=ET.parse(path).getroot()
            self.assertIsNotNone(root.find('s:title',ns));self.assertIsNotNone(root.find('s:desc',ns))
            self.assertIn('prefers-color-scheme:dark',path.read_text(encoding='utf-8'))
            self.assertFalse(root.findall('.//s:script',ns))
