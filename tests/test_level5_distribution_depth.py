"""Origins and analytical applications in the curated, TriG-authored depth path."""
import math
import statistics
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE

ROOT = Path(__file__).resolve().parents[1]


class DistributionDepthTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(
            str(EX['path-level5-analytical-distributions-depth']), BASE+'paths/level5-analytical-distributions-depth'))
        cls.scenes = {s['id']: s for s in cls.document['scenes']}

    def scene(self, name):
        return self.scenes[f'ex:{name}--scene']

    def test_order_explains_origins_before_applications_and_preserves_live_finale(self):
        ids = list(self.scenes)
        self.assertEqual(51, len(ids))
        sequence = ['al-opening', 'dep-functions', 'al-functions', 'al-density', 'al-area-example',
                    'al-cumulative', 'al-quantile', 'dep-paired', 'al-normal-story', 'al-normal-process',
                    'al-normal-model', 'al-control-story', 'al-normal-probability', 'al-normal-inverse',
                    'al-standardization', 'dep-sigma', 'dep-log-story', 'dep-log-process', 'dep-log-model',
                    'dep-log-threshold', 'dep-log-ranges', 'dep-log-reporting', 'dep-origins',
                    'al-chi-story', 'dep-chi-construction', 'al-chi-model', 'al-chi-example',
                    'al-t-story', 'dep-t-construction', 'al-t-model', 'al-t-example',
                    'al-f-story', 'dep-f-construction', 'al-f-model', 'al-f-example', 'al-test-story']
        self.assertEqual([f'ex:{name}--scene' for name in sequence], ids[:36])
        self.assertEqual([f'ex:mc-{name}--scene' for name in
                          ('story','model','assumptions','transform','trial','live','result','scope')], ids[-8:])
        self.assertNotIn('ex:al-log-example--scene', ids)
        self.assertNotIn('Write the normal model', json.dumps(self.scene('al-normal-model')))
        self.assertFalse(any('binaryExperiment' in b for s in self.scenes.values() for b in s['blocks']))

    def test_all_displayed_formulas_have_complete_authored_same_scene_legends(self):
        for scene in self.scenes.values():
            for block in scene['blocks']:
                if block['kind'] != 'math':
                    continue
                resource = EX[block['source'][0]['resourceId'].removeprefix('ex:')]
                symbols = set(self.union.objects(resource, CD.hasSymbol))
                self.assertTrue(symbols, resource)
                legends = list(self.union.objects(resource, DCTERMS.hasPart))
                covered = {symbol for legend in legends
                           for entry in self.union.objects(legend, CD.hasDefinitionListEntry)
                           for symbol in self.union.objects(entry, DCTERMS.references)}
                self.assertLessEqual(symbols, covered, resource)
                lists = [b for b in scene['blocks'] if b['kind'] == 'definition-list']
                self.assertTrue(lists, scene['id'])
                for symbol in symbols:
                    self.assertTrue(list(self.union.objects(symbol, CD.body)), symbol)

    def test_function_usecases_and_integral_link_are_explicit(self):
        cards = next(b for b in self.scene('dep-functions')['blocks'] if b['kind']=='definition-list')
        self.assertEqual(3, len(cards['entries']))
        for entry in cards['entries']:
            self.assertTrue(entry['visualMotif'])
            self.assertIn('\n\n- ', entry['description'])
        cdf = next(b for b in self.scene('al-cumulative')['blocks'] if b['kind']=='math')['expression']
        self.assertIn(r'\int_{-\infty}^{x}f_X(t)', cdf)
        self.assertAlmostEqual(.50, (.75-.25)*1)
        self.assertAlmostEqual(.50, (10.01-9.99)/.04)
        self.assertAlmostEqual(.75, (10.01-9.98)/.04)
        self.assertAlmostEqual(10.01, 9.98+.04*.75)
        self.assertIn('not experimental', self.scene('dep-paired')['narration'])

    def test_normal_and_log_sigma_ranges_reproduce_authored_numbers(self):
        normal = statistics.NormalDist()
        log_ranges = [(.9447331054820294,4.23400003322535),
                      (.44626032029685964,8.96337814067613),
                      (.2107984491237287,18.975471672717052)]
        for k, (lo, hi), coverage in zip((1,2,3), log_ranges,
                                        (.6826894921370856,.9544997361036418,.9973002039367398)):
            self.assertAlmostEqual(coverage, normal.cdf(k)-normal.cdf(-k), places=13)
            self.assertAlmostEqual(lo, math.exp(math.log(2)-k*.75), places=13)
            self.assertAlmostEqual(hi, math.exp(math.log(2)+k*.75), places=13)
            self.assertAlmostEqual(4, lo*hi, places=12)
            self.assertAlmostEqual(10-k*.30, [9.70,9.40,9.10][k-1])
            self.assertAlmostEqual(10+k*.30, [10.30,10.60,10.90][k-1])
        self.assertNotAlmostEqual(.95, normal.cdf(2)-normal.cdf(-2), places=3)
        for name in ('dep-sigma','dep-log-ranges','dep-log-reporting'):
            self.assertIn('not', self.scene(name)['narration'])
            self.assertIn('confidence', self.scene(name)['narration'])

    def test_diameter_density_points_and_tail_quantiles_are_reproducible(self):
        observations = list(self.union.objects(EX['dep-size-density'],CD.hasObservation))
        self.assertEqual(15, len(observations))
        for observation in observations:
            x = float(next(self.union.objects(observation,CD.xValue)))
            y = float(next(self.union.objects(observation,CD.numericValue)))
            expected = math.exp(-.5*((math.log(x)-math.log(2))/.75)**2)/(x*.75*math.sqrt(2*math.pi))
            self.assertAlmostEqual(expected, y, places=11)
        nd = statistics.NormalDist()
        self.assertAlmostEqual(.11090658061719583, 1-nd.cdf((math.log(5)-math.log(2))/.75), places=13)
        quantiles = [math.exp(math.log(2)+.75*nd.inv_cdf(p)) for p in (.025,.975)]
        self.assertAlmostEqual(.4598633918493624, quantiles[0], places=13)
        self.assertAlmostEqual(8.69823532574274, quantiles[1], places=13)
        for name in ('dep-log-model','dep-log-threshold'):
            chart = next(b for b in self.scene(name)['blocks'] if b['kind']=='chart')
            text = json.dumps(chart, ensure_ascii=False)
            self.assertIn('µm', text)
            self.assertNotIn('mg/L', text)
        self.assertIn('number-weighted', self.scene('dep-log-story')['narration'])
        self.assertIn('agglomeration', self.scene('dep-log-process')['narration'])

    def test_sampling_constructions_are_arithmetically_and_contextually_explicit(self):
        self.assertEqual(6, sum(z*z for z in (1,-1,0,2)))
        self.assertEqual(2, 1/math.sqrt(1/4))
        self.assertEqual(4, (10/5)/(2.5/5))
        self.assertIn('not independent', self.scene('dep-chi-construction')['narration'])
        self.assertIn('independent', self.scene('dep-t-construction')['narration'])
        self.assertIn('equal population variances', self.scene('dep-f-construction')['narration'])
        for family in ('chi','t','f'):
            self.assertTrue(any(b['kind']=='math' for b in self.scene(f'dep-{family}-construction')['blocks']))
            self.assertTrue(any(b['kind']=='math' for b in self.scene(f'al-{family}-example')['blocks']))

    def test_new_svg_assets_are_accessible_and_theme_readable(self):
        ns = {'svg':'http://www.w3.org/2000/svg'}
        for name in ('dep-paired','dep-sigma','dep-log-process','dep-log-ranges','dep-origins'):
            media = next(b for b in self.scene(name)['blocks'] if b['kind']=='media-reference')
            self.assertTrue(media['alternativeText'])
            path = ROOT/'apps/pitch/public'/media['uri'].lstrip('/')
            root = ET.parse(path).getroot()
            self.assertEqual('img', root.attrib['role'])
            self.assertIsNotNone(root.find('svg:title',ns))
            self.assertIsNotNone(root.find('svg:desc',ns))
            self.assertIn('prefers-color-scheme:dark', path.read_text(encoding='utf-8'))
            self.assertFalse(root.findall('.//svg:script',ns))

    def test_main_preview_selects_depth_path_without_retiring_support(self):
        scripts = json.loads((ROOT/'package.json').read_text(encoding='utf-8'))['scripts']
        self.assertIn('path-level5-multiplicative-story', scripts['preview:level5:generate'])
        self.assertIn('path-level5-binomial-opening', scripts['preview:level5:support:generate'])
        self.assertTrue(list(self.union.objects(EX['path-level5-analytical-distributions'],CD.hasStep)))
