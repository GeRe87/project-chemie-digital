"""Normal IC story: binomial mechanism, eta/phi/Phi, limits and sample means."""
import json
import math
import statistics
from pathlib import Path
import xml.etree.ElementTree as ET
from rdflib import RDF
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE
import histogram_statistics


class NormalICStoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(
            str(EX['path-level5-normal-ic']), BASE+'paths/level5-normal-ic'))
        cls.scenes = {s['id']:s for s in cls.document['scenes']}

    def scene(self, name):
        return self.scenes[f'ex:{name}--scene']

    def rdf_list(self, head):
        values=[]
        while head != RDF.nil:
            values.append(next(self.union.objects(head,RDF.first)))
            head=next(self.union.objects(head,RDF.rest))
        return values

    def test_main_path_preserves_foundations_and_continues_directly_from_binomial_to_normal_to_chi(self):
        ids=list(self.scenes)
        self.assertEqual(83,len(ids))
        names=['nn-case','nn-model-scene','nn-growth-live','nn-growth-saved','nn-four',
               'nn-binomial-live','nn-phi-scene','nn-eta-scene','nn-devices-scene',
               'nn-cdf-scene','nn-tail-scene','nn-threshold-live','nn-ecdf-live',
               'nn-decision-scene','nn-bands-scene','nn-means-scene','nn-means-live',
               'nn-limits-scene','nn-bridge']
        self.assertEqual([f'ex:{n}--scene' for n in names],ids[11:30])
        self.assertEqual('ex:cf-binomial--scene',ids[10])
        self.assertEqual('ex:ic-process--scene',ids[30])
        self.assertEqual('ex:mc-scope--scene',ids[-1])
        self.assertLess(ids.index('ex:rev-f-decision--scene'),ids.index('ex:dep-log-process--scene'))
        self.assertNotIn('ex:al-control-story--scene',ids)  # Not the older SD=0.30 case.
        self.assertNotIn('ex:ix-phi-scene--scene',ids)  # New gradual phi/Phi introduction.
        command=json.loads((Path(__file__).resolve().parents[1]/'package.json').read_text())['scripts']['preview:level5:generate']
        self.assertIn('path-level5-multiplicative-story',command)
        for name in ['cf-experiment','cf-cumulative','cf-interval-scene','cf-histogram',
                     'cf-link-scene','cf-area-scene','cf-discrete-scene','cf-quantile-scene']:
            self.assertIn(f'ex:{name}--scene',ids[:10])

    def test_intro_data_and_later_known_model_are_explicitly_separate(self):
        observations=sorted(self.union.objects(EX['nn-intro-data'],CD.hasObservation),
                            key=lambda o:int(next(self.union.objects(o,CD.position))))
        xs=[float(next(self.union.objects(o,CD.numericValue))) for o in observations]
        self.assertEqual([10.03,9.95,10.08,9.98,10.12,9.94],xs)
        self.assertAlmostEqual(10.016666666666666,statistics.mean(xs))
        self.assertNotAlmostEqual(.10,statistics.stdev(xs),places=3)
        case=json.dumps(self.scene('nn-case'))
        for x in xs:self.assertIn(f'{x:.2f}',case)
        self.assertIn('not used to set the later theoretical parameters',case)
        self.assertIn('independently of the six',self.scene('nn-eta-scene')['narration'])
        standardized=str(next(self.union.objects(EX['nn-eta'],CD.latex)))
        for term in (r'Z=\frac{X-\mu}',r'z=\frac{x-\mu}',r'0.10^2',r'\frac{1}{\sigma}\varphi'):
            self.assertIn(term,standardized)
        self.assertNotIn(r'\eta',standardized)

    def test_exact_signed_contribution_masses_and_fixed_variance_scaling(self):
        observed=[]
        for o in sorted(self.union.objects(EX['nn-four-data'],CD.hasObservation),
                        key=lambda o:int(next(self.union.objects(o,CD.position)))):
            observed.append(float(next(self.union.objects(o,CD.numericValue))))
        self.assertEqual([1,4,6,4,1],[round(p*16) for p in observed])
        for n in (4,16,50,200):
            probabilities=[math.comb(n,k)*.5**n for k in range(n+1)]
            a=.10/math.sqrt(n)
            errors=[a*(2*k-n) for k in range(n+1)]
            self.assertAlmostEqual(1,sum(probabilities))
            self.assertAlmostEqual(0,sum(p*e for p,e in zip(probabilities,errors)))
            self.assertAlmostEqual(.01,sum(p*e*e for p,e in zip(probabilities,errors)))
            spacing=2/math.sqrt(n)
            self.assertAlmostEqual(1,sum((p/spacing)*spacing for p in probabilities))
        self.assertIn('finite model is still discrete',self.scene('nn-binomial-live')['narration'])

    def test_saved_thousand_readings_replay_every_count_and_ecdf_fraction(self):
        state=20261102;normal=statistics.NormalDist();xs=[]
        for _ in range(1000):
            state=16807*state%2147483647
            xs.append(10+.10*normal.inv_cdf(state/2147483647))
        edges=[float(v) for v in self.rdf_list(EX['nn-ge0'])]
        counts=[int(v) for v in self.rdf_list(EX['nn-gc0'])]
        self.assertEqual(1000,sum(counts))
        self.assertEqual(counts,[b['count'] for b in histogram_statistics.bins(xs,edges)])
        self.assertEqual([21,526,978],[sum(x<=t for x in xs) for t in [9.8,10,10.2]])
        self.assertEqual(22,sum(x>10.2 for x in xs))
        self.assertAlmostEqual(9.996703971087724,statistics.mean(xs))
        self.assertAlmostEqual(.10021984188737493,statistics.stdev(xs))
        self.assertFalse(list(self.union.objects(EX['nn-growth-chart'],DCTERMS.hasPart)))
        self.assertIn('978/1,000',json.dumps(self.scene('nn-ecdf-live')))

    def test_eta_density_cdf_threshold_and_central_coverages(self):
        normal=statistics.NormalDist()
        self.assertAlmostEqual(2,(10.2-10)/.1)
        self.assertAlmostEqual(1,(10.2-10)/.2)
        self.assertAlmostEqual(.05399096651318806,normal.pdf(2))
        self.assertAlmostEqual(.9772498680518208,normal.cdf(2))
        self.assertAlmostEqual(.0227501319481792,1-normal.cdf(2))
        cutoff=10+.1*normal.inv_cdf(.99)
        self.assertAlmostEqual(10.232634787404084,cutoff)
        self.assertAlmostEqual(.01,1-normal.cdf((cutoff-10)/.1))
        for k,coverage in [(1,.6826894921370859),(2,.9544997361036416),(3,.9973002039367398)]:
            self.assertAlmostEqual(coverage,2*normal.cdf(k)-1)
        self.assertIn('legal limit',self.scene('nn-decision-scene')['narration'])
        self.assertIn('per individual',json.dumps(self.scene('nn-decision-scene')))
        self.assertIn('not a third function',json.dumps(self.scene('nn-eta-scene')))

    def test_mean_variance_identity_is_distinguished_from_exact_normality_and_limits(self):
        self.assertAlmostEqual(.040824829046386304,.1/math.sqrt(6))
        text=self.scene('nn-means-scene')['narration']
        self.assertIn('normality is not required',text.lower())
        self.assertIn('exactly normal sample mean for every',text)
        self.assertIn('not removed by averaging',text)
        limits=self.scene('nn-limits-scene')['narration']
        for term in ('drift','interference','censor','not an actual nitrate detection limit'):
            self.assertIn(term,limits)
        self.assertIn('censor',json.dumps(self.scene('nn-limits-scene')).lower())

    def test_every_displayed_formula_has_covered_visible_authored_legend(self):
        for name in ('nn-model-scene','nn-four','nn-phi-scene','nn-eta-scene',
                     'nn-devices-scene','nn-cdf-scene','nn-tail-scene',
                     'nn-decision-scene','nn-bands-scene','nn-means-scene'):
            scene=self.scene(name)
            self.assertTrue(any(b['kind']=='definition-list' and b.get('emphasis')=='supporting'
                                for b in scene['blocks']),name)
            for b in scene['blocks']:
                if b['kind']!='math':continue
                resource=EX[b['source'][0]['resourceId'].removeprefix('ex:')]
                symbols=set(self.union.objects(resource,CD.hasSymbol))
                covered={s for legend in self.union.objects(resource,DCTERMS.hasPart)
                         for entry in self.union.objects(legend,CD.hasDefinitionListEntry)
                         for s in self.union.objects(entry,DCTERMS.references)}
                self.assertTrue(symbols);self.assertLessEqual(symbols,covered)

    def test_optional_experiments_are_trig_authored_and_visual_is_accessible(self):
        for name in ('nn-growth-live','nn-binomial-live','nn-threshold-live','nn-ecdf-live','nn-means-live'):
            block=next(b for b in self.scene(name)['blocks'] if b['kind']=='code')
            self.assertEqual('r',block['language'])
            self.assertTrue(block['editable']);self.assertTrue(block['executable'])
        root_path=Path(__file__).resolve().parents[1]/'apps/pitch/public/chemometrics/level5-normal-eta-phi.svg'
        root=ET.parse(root_path).getroot();ns={'s':'http://www.w3.org/2000/svg'}
        self.assertIsNotNone(root.find('s:title',ns));self.assertIsNotNone(root.find('s:desc',ns))
        self.assertIn('prefers-color-scheme:dark',root_path.read_text(encoding='utf-8'))
        self.assertFalse(root.findall('.//s:script',ns))


if __name__=='__main__':
    unittest.main()
