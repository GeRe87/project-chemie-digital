"""Visible data stories, process-first sections and independently checked test decisions."""
import math
import statistics
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE

ROOT = Path(__file__).resolve().parents[1]


class StorylineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(
            str(EX['path-level5-storyline']), BASE+'paths/level5-storyline'))
        cls.scenes = {s['id']: s for s in cls.document['scenes']}

    def scene(self, name):
        return self.scenes[f'ex:{name}--scene']

    def values(self, dataset):
        observations = list(self.union.objects(EX[dataset], CD.hasObservation))
        observations.sort(key=lambda r: int(next(self.union.objects(r, CD.position))))
        return [(float(next(self.union.objects(r, CD.xValue))),
                 float(next(self.union.objects(r, CD.numericValue)))) for r in observations]

    def test_process_first_sections_and_merged_function_opening(self):
        ids = list(self.scenes)
        self.assertEqual(55, len(ids))
        for before, after in [('al-normal-process','al-normal-story'), ('dep-log-process','dep-log-story'),
                              ('rev-df-start','rev-chi-process'), ('rev-df-map','rev-chi-process'),
                              ('rev-chi-process','rev-chi-calc'), ('rev-t-process','rev-t-normal'),
                              ('rev-t-normal','rev-t-estimated'), ('rev-t-estimated','rev-t-convergence'),
                              ('rev-t-convergence','rev-t-report'), ('rev-f-process','rev-f-story'),
                              ('rev-qq-build','rev-qq-read'), ('rev-qq-read','rev-ks-overlay'),
                              ('rev-ks-overlay','rev-ks-table-scene'), ('rev-pearson-sum','rev-pearson-table-scene')]:
            self.assertLess(ids.index(f'ex:{before}--scene'), ids.index(f'ex:{after}--scene'))
        merged = self.scene('rev-functions')
        self.assertEqual(3, len(next(b for b in merged['blocks'] if b['kind']=='definition-list')['entries']))
        self.assertTrue(any(b['kind']=='media-reference' for b in merged['blocks']))
        self.assertNotIn('ex:al-functions--scene', ids)
        self.assertNotIn('ex:dep-functions--scene', ids)
        self.assertEqual('ex:mc-scope--scene', ids[-1])

    def test_quantitative_slides_explain_the_data_question_visibly(self):
        for name in ('al-normal-model','al-normal-probability','al-normal-inverse','al-standardization',
                     'dep-sigma','dep-log-model','dep-log-threshold','dep-log-ranges','dep-log-reporting',
                     'rev-chi-calc','rev-chi-reference','rev-chi-report','rev-t-normal','rev-t-estimated',
                     'rev-t-report','rev-f-reference','rev-f-decision','rev-qq-build','rev-ks-overlay',
                     'rev-pearson-start','rev-pearson-sum'):
            scene = self.scene(name)
            context = [b for b in scene['blocks'] if b['kind']=='definition-list' and b.get('emphasis')!='supporting']
            self.assertTrue(context, name)
            self.assertTrue(any(b['entries'][0].get('description') for b in context), name)
        self.assertIn('not become t-distributed', json.dumps(self.scene('rev-t-estimated')))
        self.assertIn('No finite df', self.scene('rev-t-convergence')['narration'])

    def test_same_five_repeats_link_df_variance_and_mean_inference(self):
        readings = sorted(float(next(self.union.objects(r, CD.numericValue)))
                          for r in self.union.objects(EX['l5-s15-readings'], CD.hasObservation))
        self.assertEqual([9.6,9.8,10,10.2,10.4], readings)
        deviations = [x-statistics.mean(readings) for x in readings]
        self.assertAlmostEqual(0, sum(deviations))
        self.assertAlmostEqual(deviations[-1], -sum(deviations[:-1]))
        self.assertAlmostEqual(.4, sum(d*d for d in deviations))
        self.assertAlmostEqual(.1, statistics.variance(readings))
        self.assertAlmostEqual(math.sqrt(.02), statistics.stdev(readings)/math.sqrt(5))
        self.assertIn('0.40', self.scene('rev-chi-calc')['narration'])
        self.assertIn('same', self.scene('rev-chi-report')['narration'])
        for data, expected in [([9.7,9.9,10,10,10.1,10.3],.04),
                               ([9.4,9.8,10,10,10.2,10.6],.16)]:
            self.assertAlmostEqual(expected, statistics.variance(data))
        self.assertIn('not paired', self.scene('rev-f-process')['narration'])

    def test_qq_pairs_match_authored_plotting_convention_and_svg(self):
        ns = {'s':'http://www.w3.org/2000/svg'}
        svg = ET.parse(ROOT/'apps/pitch/public/chemometrics/level5-qq-pair.svg').getroot()
        nd = statistics.NormalDist(10,.5)
        for suffix in ('a','b'):
            points = self.values('rev-qq-'+suffix)
            self.assertEqual(5, len(points))
            circles = svg.findall(f".//s:g[@id='qq-{suffix}']//s:circle", ns)
            self.assertEqual(5, len(circles))
            for i, ((q,x),circle) in enumerate(zip(points,circles),1):
                self.assertAlmostEqual(nd.inv_cdf((i-.5)/5), q, places=12)
                self.assertAlmostEqual(q, float(circle.attrib['data-x']), places=12)
                self.assertAlmostEqual(x, float(circle.attrib['data-y']), places=12)
                self.assertAlmostEqual(65+(q-9)*87.5, float(circle.attrib['cx']), places=2)
                self.assertAlmostEqual(385-(x-9)*87.5, float(circle.attrib['cy']), places=2)

    def test_ks_distances_check_both_jump_sides_and_survive_fixed_standardization(self):
        nd = statistics.NormalDist(10,.5)
        standard = statistics.NormalDist()
        for suffix, expected in (('a',.14457825838967642),('b',.7257468822499269)):
            xs = [x for q,x in self.values('rev-qq-'+suffix)]
            d = max(max(i/5-nd.cdf(x), nd.cdf(x)-(i-1)/5) for i,x in enumerate(xs,1))
            dz = max(max(i/5-standard.cdf((x-10)/.5), standard.cdf((x-10)/.5)-(i-1)/5)
                     for i,x in enumerate(xs,1))
            self.assertAlmostEqual(expected, d, places=12)
            self.assertAlmostEqual(d, dz, places=12)
            self.assertEqual(suffix=='b', d>.5632751983660635)
        self.assertIn('refitting', self.scene('rev-ks-scale')['narration'])
        self.assertIn('not', self.scene('rev-ks-table-scene')['narration'])

    def test_all_table_entries_have_independent_tail_calibration(self):
        for table, kind in (('rev-ks-table','ks'),('rev-chi-table','chi')):
            rows = list(self.union.objects(EX[table], CD.hasTableRow))
            for row in rows:
                cells = list(self.union.objects(row, CD.hasTableCell))
                cells.sort(key=lambda r:int(next(self.union.objects(r,CD.position))))
                values = [float(next(self.union.objects(c,CD.body))) for c in cells]
                size = int(values[0])
                for d, alpha in zip(values[1:],(.1,.05,.01)):
                    if kind=='ks':
                        # Exact two-sided shortcut applies to these cutoffs, all above 1/2.
                        self.assertGreater(d,.5)
                        tail = 2*d*sum(math.comb(size,k)*(d+k/size)**(k-1)*(1-d-k/size)**(size-k)
                                       for k in range(math.floor(size*(1-d))+1))
                    else:
                        tail = math.exp(-d/2)*sum((d/2)**k/math.factorial(k) for k in range(size//2))
                    self.assertAlmostEqual(alpha,tail,places=6)
        for name in ('rev-ks-table-scene','rev-pearson-table-scene'):
            scene=self.scene(name)
            self.assertTrue(any(b['kind']=='table' for b in scene['blocks']))
            code=next(b for b in scene['blocks'] if b['kind']=='code')
            self.assertFalse(code.get('executable',False))

    def test_pearson_compatible_and_departing_examples_share_reference(self):
        expected=[10,20,40,20,10]
        for observed, q, reject in [([9,21,39,21,10],.225,False),([4,12,44,24,16],11.6,True)]:
            self.assertEqual(100,sum(observed))
            self.assertAlmostEqual(q,sum((o-e)**2/e for o,e in zip(observed,expected)))
            self.assertEqual(reject,q>9.487729036781154)
        self.assertIn('chi-square approximation', self.scene('rev-pearson-table-scene')['narration'])
        self.assertIn('not the repeatability', json.dumps(self.scene('rev-pearson-sum')))

    def test_math_legends_and_accessible_process_graphics(self):
        ns={'s':'http://www.w3.org/2000/svg'}
        for scene in self.scenes.values():
            for block in scene['blocks']:
                if block['kind']=='math':
                    resource=EX[block['source'][0]['resourceId'].removeprefix('ex:')]
                    symbols=set(self.union.objects(resource,CD.hasSymbol))
                    covered={s for legend in self.union.objects(resource,DCTERMS.hasPart)
                             for entry in self.union.objects(legend,CD.hasDefinitionListEntry)
                             for s in self.union.objects(entry,DCTERMS.references)}
                    self.assertTrue(symbols)
                    self.assertLessEqual(symbols,covered)
                    self.assertTrue(any(b['kind']=='definition-list' and b.get('emphasis')=='supporting'
                                        for b in scene['blocks']))
                if block['kind']=='media-reference':
                    self.assertTrue(block['alternativeText'])
                    path=ROOT/'apps/pitch/public'/block['uri'].lstrip('/')
                    svg=ET.parse(path).getroot()
                    self.assertIsNotNone(svg.find('s:title',ns))
                    self.assertIsNotNone(svg.find('s:desc',ns))
                    self.assertIn('prefers-color-scheme:dark',path.read_text(encoding='utf-8'))

    def test_main_preview_uses_storyline_and_retains_historical_paths(self):
        command=json.loads((ROOT/'package.json').read_text())['scripts']['preview:level5:generate']
        self.assertIn('path-level5-multiplicative-story',command)
        for path in ('path-level5-analytical-distributions','path-level5-analytical-distributions-depth',
                     'path-level5-binomial-opening'):
            self.assertTrue(list(self.union.objects(EX[path],CD.hasStep)))
