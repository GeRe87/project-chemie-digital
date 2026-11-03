"""Mechanism-first LC-MS/MS lognormal story and the return to precision inference."""
import json
import math
import statistics
from pathlib import Path
import xml.etree.ElementTree as ET
from rdflib import RDF
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE
import histogram_statistics


class LognormalWorkupTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(
            str(EX['path-level5-multiplicative-story']),BASE+'paths/level5-multiplicative-story'))
        cls.scenes={s['id']:s for s in cls.document['scenes']}

    def scene(self,name):return self.scenes[f'ex:{name}--scene']

    def readings(self,name):
        observations=sorted(self.union.objects(EX[name],CD.hasObservation),
                            key=lambda o:int(next(self.union.objects(o,CD.position))))
        return [float(next(self.union.objects(o,CD.numericValue))) for o in observations]

    def rdf_list(self,head):
        values=[]
        while head!=RDF.nil:
            values.append(next(self.union.objects(head,RDF.first)))
            head=next(self.union.objects(head,RDF.rest))
        return values

    def test_main_path_is_normal_then_lognormal_then_chi_square(self):
        ids=list(self.scenes)
        names=['lg-process','lg-data','lg-compare-live','lg-saved','lg-effects-scene',
               'lg-factor-live','lg-log-scale-scene','lg-product-scene','lg-definition-scene',
               'lg-transform-live','lg-centers-scene','lg-geometric-scene','lg-functions-scene',
               'lg-tail-scene','lg-quantile-scene','lg-environment-live','lg-checks',
               'lg-log-variance-scene','lg-bridge']
        self.assertEqual(95,len(ids))
        self.assertEqual('ex:nn-limits-scene--scene',ids[28])
        self.assertEqual([f'ex:{name}--scene' for name in names],ids[29:48])
        self.assertEqual('ex:ic-process--scene',ids[48])
        self.assertNotIn('ex:nn-bridge--scene',ids)
        self.assertNotIn('ex:dep-log-process--scene',ids)
        self.assertEqual('ex:mc-scope--scene',ids[-1])
        command=json.loads((Path(__file__).resolve().parents[1]/'package.json').read_text())['scripts']['preview:level5:generate']
        self.assertIn('path-level5-multiplicative-story',command)

    def test_supplied_unpaired_ten_value_series_and_table_are_consistent(self):
        A=self.readings('lg-example-a');B=self.readings('lg-example-b')
        self.assertEqual([9.9,10.1,10,9.8,10.1,10,10.2,9.9,10,10.1],A)
        self.assertEqual([5.9,7.8,8.3,8.9,9.4,9.7,10.1,11.4,13.7,17.1],B)
        self.assertEqual(sorted(B),B)
        rows=sorted(self.union.objects(EX['lg-table'],CD.hasTableRow),
                    key=lambda r:int(next(self.union.objects(r,CD.position))))
        for row,a,b in zip(rows,A,B):
            cells=sorted(self.union.objects(row,CD.hasTableCell),
                         key=lambda c:int(next(self.union.objects(c,CD.position))))
            self.assertEqual([a,b],[float(next(self.union.objects(c,CD.body))) for c in cells])
        self.assertEqual(10,len(rows))
        text=json.dumps(self.scene('lg-data'))
        self.assertIn('unpaired',text);self.assertIn('ng/L',text)
        self.assertIn('not real validation',self.scene('lg-data')['narration'])

    def test_reciprocal_factors_log_symmetry_and_reference_invariance(self):
        self.assertAlmostEqual(1,.8*1.25)
        self.assertAlmostEqual(19.53125,10*1.25**3)
        self.assertAlmostEqual(5.12,10*.8**3)
        self.assertAlmostEqual(-math.log(.8),math.log(1.25))
        self.assertAlmostEqual(.22314355131420976,math.log(12.5/10))
        xs=self.readings('lg-example-b')
        for reference in (.1,1,10,100):
            geometric=reference*math.exp(statistics.mean(math.log(x/reference) for x in xs))
            self.assertAlmostEqual(statistics.geometric_mean(xs),geometric)
        self.assertIn('not literal recovery',json.dumps(self.scene('lg-product-scene')))
        self.assertIn('additive detector noise',json.dumps(self.scene('lg-product-scene')))
        self.assertIn('remains discrete',self.scene('lg-product-scene')['narration'])

    def test_population_centers_tail_quantile_and_density_chain_rule(self):
        normal=statistics.NormalDist();s=.30;reference=10
        self.assertAlmostEqual(9.139311852712282,reference*math.exp(-s*s))
        self.assertAlmostEqual(10.46027859908717,reference*math.exp(s*s/2))
        eta=math.log(15/reference)/s
        self.assertAlmostEqual(1.351550360360548,eta)
        self.assertAlmostEqual(.08825959961479612,1-normal.cdf(eta))
        quantile=reference*math.exp(s*normal.inv_cdf(.95))
        self.assertAlmostEqual(16.37967408472419,quantile)
        self.assertAlmostEqual(.95,normal.cdf(math.log(quantile/reference)/s))
        for x in (3,8,10,15,25):
            h=1e-5
            slope=(normal.cdf(math.log((x+h)/reference)/s)-normal.cdf(math.log((x-h)/reference)/s))/(2*h)
            self.assertAlmostEqual(normal.pdf(math.log(x/reference)/s)/(x*s),slope,places=8)
        for s in (.15,.3,.6):
            self.assertLess(reference*math.exp(-s*s),reference)
            self.assertGreater(reference*math.exp(s*s/2),reference)

    def test_saved_thousand_preparations_replay_all_counts_and_tail_frequency(self):
        state=20261103;normal=statistics.NormalDist();A=[];B=[]
        for _ in range(1000):
            state=16807*state%2147483647
            A.append(10+.1*normal.inv_cdf(state/2147483647))
            log_total=0
            for _ in range(3):
                state=16807*state%2147483647
                log_total+=.3/math.sqrt(3)*normal.inv_cdf(state/2147483647)
            B.append(10*math.exp(log_total))
        edges=[float(v) for v in self.rdf_list(EX['lg-be0'])]
        counts=[int(v) for v in self.rdf_list(EX['lg-bc0'])]
        self.assertEqual(list(range(0,38,2)),edges)
        self.assertEqual(1000,sum(counts))
        self.assertEqual(counts,[b['count'] for b in histogram_statistics.bins(B,edges)])
        self.assertEqual(100,sum(x>15 for x in B))
        self.assertAlmostEqual(10.503003727232883,statistics.mean(B))
        self.assertGreater(min(B),0)
        self.assertIn('finite simulated frequency',self.scene('lg-saved')['narration'])
        self.assertIn('8.83',self.scene('lg-tail-scene')['narration'])

    def test_environment_and_variance_transfer_keep_scale_population_and_censoring(self):
        environment=self.scene('lg-environment-live')['narration']
        for term in ('one hundred river sites','not the method log SD 0.30',
                     'spatially dependent','Never substitute zero'):
            self.assertIn(term,environment)
        variance=self.scene('lg-log-variance-scene')['narration']
        self.assertIn('not a law for raw lognormal concentration variance',variance)
        self.assertIn('uncensored',variance)
        self.assertIn('mg/L',json.dumps(self.scene('lg-bridge')))
        geometric=json.dumps(self.scene('lg-geometric-scene'))
        self.assertIn('not asserted unbiased',geometric)
        self.assertIn('no universally best mean',geometric.lower())
        self.assertIn('legal limit',self.scene('lg-tail-scene')['narration'])

    def test_every_displayed_formula_has_complete_visible_authored_legend(self):
        for name in ('lg-effects-scene','lg-log-scale-scene','lg-product-scene',
                     'lg-definition-scene','lg-centers-scene','lg-geometric-scene',
                     'lg-functions-scene','lg-tail-scene','lg-quantile-scene','lg-log-variance-scene'):
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

    def test_r_experiments_and_local_media_reuse_existing_contracts(self):
        for name in ('lg-compare-live','lg-factor-live','lg-transform-live','lg-environment-live'):
            block=next(b for b in self.scene(name)['blocks'] if b['kind']=='code')
            self.assertEqual('r',block['language'])
            self.assertTrue(block['editable']);self.assertTrue(block['executable'])
        source=str(next(self.union.objects(EX['lg-transform-code'],CD.code)))
        self.assertNotIn('log(x_ref)',source)
        self.assertIn('dlnorm(x/x_ref',source)
        environment=str(next(self.union.objects(EX['lg-environment-code'],CD.code)))
        self.assertIn('NA_real_',environment)
        self.assertIn('selection-biased',environment)
        for filename in ('level5-lognormal-workup-process.svg','level5-lognormal-ratio-scales.svg'):
            path=Path(__file__).resolve().parents[1]/'apps/pitch/public/chemometrics'/filename
            root=ET.parse(path).getroot();ns={'s':'http://www.w3.org/2000/svg'}
            self.assertIsNotNone(root.find('s:title',ns));self.assertIsNotNone(root.find('s:desc',ns))
            self.assertIn('prefers-color-scheme:dark',path.read_text(encoding='utf-8'))
            self.assertFalse(root.findall('.//s:script',ns))


if __name__=='__main__':unittest.main()
