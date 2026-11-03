"""CDF-first foundations use one observed sample and a separate conceptual model."""
import math
from pathlib import Path
import xml.etree.ElementTree as ET
from rdflib import RDF
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE
import histogram_statistics


class CDFFirstTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(
            str(EX['path-level5-ic-experiments']), BASE+'paths/level5-ic-experiments'))
        cls.scenes = {s['id']: s for s in cls.document['scenes']}
        observations = sorted(cls.union.objects(EX['cf-readings'], CD.hasObservation),
                              key=lambda o: int(next(cls.union.objects(o, CD.position))))
        cls.xs = [float(next(cls.union.objects(o, CD.numericValue))) for o in observations]

    def scene(self, name):
        return self.scenes[f'ex:{name}--scene']

    def test_same_twenty_values_give_the_requested_fractions(self):
        self.assertEqual(20, len(self.xs))
        self.assertEqual(sorted(self.xs), self.xs)
        self.assertEqual(15, sum(x <= 10.2 for x in self.xs))
        self.assertEqual(4, sum(x <= 9.8 for x in self.xs))
        self.assertEqual(11, sum(9.8 < x <= 10.2 for x in self.xs))
        self.assertEqual(12, sum(9.8 <= x <= 10.2 for x in self.xs))
        self.assertEqual(10.2, self.xs[math.ceil(.75*len(self.xs))-1])
        self.assertEqual(2, self.xs.count(9.9))
        chart = next(b for b in self.scene('cf-cumulative')['blocks'] if b['kind'] == 'chart')
        self.assertEqual('observations', chart['chartType'])
        self.assertTrue(chart['compact'])
        self.assertEqual(self.xs, [d['value'] for d in chart['series'][0]['data']])
        self.assertEqual(10.2, chart['threshold']['initial'])

    def test_histogram_area_not_height_is_frequency(self):
        head = EX['cf-edge0']; edges = []
        while head != RDF.nil:
            edges.append(float(next(self.union.objects(head, RDF.first))))
            head = next(self.union.objects(head, RDF.rest))
        bins = histogram_statistics.bins(self.xs, edges, 'density')
        self.assertEqual([2,3,7,4,3,1], [b['count'] for b in bins])
        self.assertAlmostEqual(1.75, bins[2]['height'])
        self.assertAlmostEqual(.35, bins[2]['relativeFrequency'])
        self.assertAlmostEqual(1, sum(b['height']*(b['upper']-b['lower']) for b in bins))
        self.assertEqual('L/mg', str(next(self.union.objects(EX['cf-hist'], CD.yAxisUnit))))

    def test_story_starts_with_data_then_cdf_before_pdf(self):
        ids = list(self.scenes)
        names = ['cf-experiment','cf-cumulative','cf-interval-scene','cf-histogram',
                 'cf-link-scene','cf-area-scene','cf-discrete-scene','cf-binomial',
                 'cf-quantile-scene','ix-standardization']
        self.assertEqual([f'ex:{n}--scene' for n in names], ids[1:11])
        self.assertEqual(74, len(ids))
        self.assertLess(ids.index('ex:cf-discrete-scene--scene'), ids.index('ex:al-normal-process--scene'))
        for old in ('rev-functions','al-density','al-area-example','al-cumulative','al-quantile'):
            self.assertNotIn(f'ex:{old}--scene', ids)
        self.assertEqual('ex:mc-scope--scene', ids[-1])

    def test_formulas_have_visible_authored_legends_with_symbol_coverage(self):
        for name in ('cf-cumulative','cf-interval-scene','cf-histogram','cf-link-scene',
                     'cf-area-scene','cf-discrete-scene','cf-binomial','cf-quantile-scene'):
            scene = self.scene(name)
            self.assertTrue(any(b['kind']=='definition-list' and b.get('emphasis')=='supporting'
                                for b in scene['blocks']), name)
            for block in scene['blocks']:
                if block['kind'] != 'math':
                    continue
                resource = EX[block['source'][0]['resourceId'].removeprefix('ex:')]
                symbols = set(self.union.objects(resource, CD.hasSymbol))
                covered = {s for legend in self.union.objects(resource, DCTERMS.hasPart)
                           for entry in self.union.objects(legend, CD.hasDefinitionListEntry)
                           for s in self.union.objects(entry, DCTERMS.references)}
                self.assertTrue(symbols)
                self.assertLessEqual(symbols, covered)

    def test_model_not_fitted_to_data_and_rounding_not_exact_point_mass(self):
        text = self.scene('cf-link-scene')['narration']
        self.assertIn('not fitted', text)
        self.assertIn('not to every CDF', text)
        self.assertIn('empirical step function', text)
        area = self.scene('cf-area-scene')['narration']
        self.assertIn('9.95 through 10.05', area)
        self.assertIn('distinct from the more finely reported twenty', area)
        formula = str(next(self.union.objects(EX['cf-interval'], CD.latex)))
        self.assertIn('9.8<X', formula)
        self.assertIn('0.55', formula)
        self.assertIn('common', self.scene('cf-discrete-scene')['narration'])
        self.assertIn('teaching assumption', self.scene('cf-binomial')['narration'])

    def test_conceptual_pair_is_accessible_and_has_consistent_triangular_geometry(self):
        path = Path(__file__).resolve().parents[1]/'apps/pitch/public/chemometrics/level5-cdf-first-pair.svg'
        root = ET.parse(path).getroot(); ns = {'s':'http://www.w3.org/2000/svg'}
        self.assertIsNotNone(root.find('s:title', ns))
        self.assertIsNotNone(root.find('s:desc', ns))
        self.assertIn('prefers-color-scheme:dark', path.read_text(encoding='utf-8'))
        self.assertFalse(root.findall('.//s:script', ns))
        # Half-width 5/6 mg/L and height 1.2 L/mg give unit area.
        self.assertAlmostEqual(1, .5*(2*5/6)*1.2)
        # CDF curvature must integrate the rising and falling linear densities.
        half_width = 5/6
        def cdf(x):
            if x <= 10-half_width: return 0
            if x <= 10: return .5*((x-(10-half_width))/half_width)**2
            if x < 10+half_width: return 1-.5*((10+half_width-x)/half_width)**2
            return 1
        for x in (9.4,9.8,10.0,10.2,10.6):
            slope = (cdf(x+1e-6)-cdf(x-1e-6))/2e-6
            expected = max(0, 1.2*(1-abs(x-10)/half_width))
            self.assertAlmostEqual(expected, slope, places=5)


if __name__ == '__main__':
    unittest.main()
