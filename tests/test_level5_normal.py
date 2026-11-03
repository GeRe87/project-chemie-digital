"""Authored normal-measurement model: coordinates, units, legends and full tail."""
import math
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal


class NormalMeasurementTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.reference = runtime.CoursePathReference(str(EX['path-level5-binomial-opening']), BASE+'paths/level5-binomial-opening')
        cls.document = runtime.compile_scene_document(cls.dataset, cls.reference)
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.scenes = [next(s for s in cls.document['scenes'] if s['id']==f'ex:l5-{name}-scene--scene') for name in ('n09a','n09b','n09c','n10a')]

    def test_four_complete_scenes_follow_the_accepted_functions_block(self):
        self.assertGreaterEqual(len(self.document['scenes']),20)
        self.assertEqual(['ex:l5-'+key+'-scene--scene' for key in ('n09a', 'n09b', 'n09c', 'n10a')], [s['id'] for s in self.scenes])
        for scene in self.scenes:
            self.assertEqual(['prose', 'chart', 'math', 'definition-list'], [b['kind'] for b in scene['blocks']])
            self.assertNotIn('?', scene['narration'])
            self.assertEqual('complete', scene['blocks'][1]['presentation'])
            self.assertFalse(scene['blocks'][1]['showPoints'])
            self.assertEqual('linear', scene['blocks'][1]['interpolation'])

    def test_each_formula_has_a_complete_linked_same_slide_symbol_legend(self):
        for scene in self.scenes:
            formula, legend = scene['blocks'][2:]
            resource = EX[formula['source'][0]['resourceId'].removeprefix('ex:')]
            self.assertTrue(list(self.union.objects(resource, DCTERMS.hasPart)))
            self.assertEqual(len(set(self.union.objects(resource, CD.hasSymbol))), len(legend['entries']))
            self.assertTrue(all(e['description'] for e in legend['entries']))
            self.assertNotIn('Mathematische', formula['spokenText'])
            self.assertNotIn('progressive', str(formula.get('disclosure', {})))

    def test_density_coordinates_match_normal_formula_and_are_not_empirical(self):
        for name, mean, sd in [('base', 10.0, .30), ('shift', 10.6, .30), ('wide', 10.0, .60)]:
            data = runtime.line_series_payload(self.dataset, EX['l5-normal-'+name], 'en')['data']
            self.assertAlmostEqual(mean-4*sd, data[0]['x'], places=12)
            self.assertAlmostEqual(mean+4*sd, data[-1]['x'], places=12)
            for point in data:
                expected = math.exp(-.5*((point['x']-mean)/sd)**2)/(sd*math.sqrt(2*math.pi))
                self.assertAlmostEqual(expected, point['y'], places=11)
            for left, right in zip(data, reversed(data)):
                self.assertAlmostEqual(2*mean, left['x']+right['x'], places=12)
                self.assertEqual(left['y'], right['y'])
            area = math.fsum((b['x']-a['x'])*(a['y']+b['y'])/2 for a, b in zip(data, data[1:]))
            self.assertLess(abs(area-1), .0001)
            self.assertIn('Theoretical' if name != 'base' else 'theoretical', str(self.union.value(EX['l5-normal-'+name], CD.body)))

    def test_parameter_comparison_changes_location_or_spread_not_probability(self):
        chart = self.scenes[1]['blocks'][1]
        self.assertEqual(3, len(chart['series']))
        peaks = sorted((max(series['data'], key=lambda p: p['y']) for series in chart['series']), key=lambda p: (p['x'], -p['y']))
        self.assertEqual([10.0, 10.0, 10.6], [p['x'] for p in peaks])
        self.assertAlmostEqual(peaks[0]['y'], 2*peaks[1]['y'], places=12)
        self.assertAlmostEqual(peaks[0]['y'], peaks[2]['y'], places=12)
        self.assertEqual('mg/L', chart['xAxis']['unit'])
        self.assertEqual('L/mg', chart['yAxis']['unit'])
        self.assertIn('variance as its second parameter', self.scenes[1]['narration'])

    def test_standardization_and_tail_use_full_cdf_not_the_display_polygon(self):
        chart = self.scenes[3]['blocks'][1]
        self.assertAlmostEqual(1.5, (10.45-10.0)/.30, places=12)
        probability = .5*math.erfc(1.5/math.sqrt(2))
        self.assertAlmostEqual(.06680720126885809, probability, places=14)
        self.assertEqual(6.68, round(100*probability, 2))
        self.assertEqual('x-range', chart['annotations'][0]['kind'])
        points = chart['series'][0]['data']
        self.assertEqual(10.45, next(p['x'] for p in points if p['id'] == chart['annotations'][0]['startDatumId']))
        self.assertEqual(11.2, next(p['x'] for p in points if p['id'] == chart['annotations'][0]['endDatumId']))
        self.assertIn('full normal CDF', self.scenes[3]['narration'])
        self.assertIn('not a confidence interval', self.scenes[3]['narration'])
        self.assertIn('not a sample mean', chart['description'])

    def test_script_distinguishes_bias_normality_and_environmental_variation(self):
        script = self.scenes[0]['narration']
        for phrase in ('constant bias', 'not a natural law', 'different environmental sites', 'Drift', 'matrix effects', 'correlation', 'negative measurement results', 'additional assumption'):
            self.assertIn(phrase, script)
        self.assertIn('not a histogram, simulation or fitted', script)

    def test_new_authored_text_is_english_without_questions_or_em_dashes(self):
        for region in ('knowledge', 'specifications', 'scenes'):
            for _, _, value in self.dataset.graph(BASE+region+'/level5-normal'):
                if isinstance(value, Literal):
                    if value.language:
                        self.assertEqual('en', value.language)
                    self.assertNotIn('\u2014', str(value))
                    self.assertNotIn('?', str(value))
