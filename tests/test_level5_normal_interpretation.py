"""N10 quantile/coverage and N11 constructed examples with density references."""
import math
import statistics
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal, validate


class NormalInterpretationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(str(EX['path-level5-binomial-opening']), BASE+'paths/level5-binomial-opening'))
        cls.scenes = [next(s for s in cls.document['scenes'] if s['id']==f'ex:l5-{name}-scene--scene') for name in ('n10b','n10c','n11a','n11b','n11c','n11d')]

    def test_six_complete_english_scenes_finish_n10_then_n11(self):
        self.assertGreaterEqual(len(self.document['scenes']),26)
        self.assertEqual(['ex:l5-'+key+'-scene--scene' for key in ('n10b','n10c','n11a','n11b','n11c','n11d')], [s['id'] for s in self.scenes])
        self.assertEqual('1.13', self.document['version'])
        for scene in self.scenes:
            self.assertNotIn('?', scene['narration'])
            self.assertTrue(all(b.get('disclosure', {}).get('mode') != 'progressive' for b in scene['blocks']))
        for region in ('knowledge','specifications','scenes'):
            for _, _, value in self.dataset.graph(BASE+region+'/level5-normal-interpretation'):
                if isinstance(value, Literal):
                    if value.language:
                        self.assertEqual('en', value.language)
                    self.assertNotIn('\u2014', str(value))
                    self.assertNotIn('?', str(value))

    def test_inverse_normal_quantile_and_cdf_coordinates_are_consistent(self):
        chart = self.scenes[0]['blocks'][1]
        q = 10+.30*statistics.NormalDist().inv_cdf(.95)
        self.assertEqual('complete', chart['presentation'])
        self.assertEqual([0,1], chart['yDomain'])
        for point in chart['series'][0]['data']:
            self.assertAlmostEqual(statistics.NormalDist(10,.30).cdf(point['x']), point['y'], places=11)
        marked = next(p for p in chart['series'][0]['data'] if p['id']==chart['annotations'][0]['datumId'])
        self.assertAlmostEqual(q, marked['x'], places=12)
        self.assertEqual(.95, marked['y'])
        self.assertEqual(10.49, round(q,2))
        self.assertIn('94.88%', self.scenes[0]['narration'])

    def test_only_new_formula_has_all_symbols_in_its_linked_same_slide_legend(self):
        formula, legend = self.scenes[0]['blocks'][2:]
        union = validate_semantics.dataset_union(self.dataset)
        resource = EX['l5-n10b-formula']
        self.assertTrue(list(union.objects(resource,DCTERMS.hasPart)))
        self.assertEqual(4, len(legend['entries']))
        self.assertEqual(len(set(union.objects(resource,CD.hasSymbol))),len(legend['entries']))
        self.assertTrue(all(e['description'] for e in legend['entries']))
        self.assertNotIn('Mathematische', formula['spokenText'])
        self.assertEqual(1, sum(b['kind']=='math' for s in self.scenes for b in s['blocks']))

    def test_confidence_and_population_targets_are_not_conflated(self):
        scene = self.scenes[1]
        self.assertEqual(2,len(scene['blocks'][1]['entries']))
        for phrase in ('one-sided threshold','only 90%','fixed unknown population mean','repeated samples','not a general prediction interval'):
            self.assertIn(phrase,scene['narration'])
        self.assertAlmostEqual(.90, 2*statistics.NormalDist().cdf(statistics.NormalDist().inv_cdf(.95))-1,places=12)

    def test_histograms_preserve_every_constructed_value_and_density_area(self):
        for scene in self.scenes[3:5]:
            chart = next(b for b in scene['blocks'] if b['kind']=='chart')
            self.assertEqual('histogram',chart['chartType'])
            self.assertEqual('density',chart['normalization'])
            self.assertEqual(40,len(chart['data']))
            self.assertEqual(1,len(chart['curves']))
            self.assertEqual('mg/L',chart['xAxis']['unit'])
            self.assertEqual('L/mg',chart['yAxis']['unit'])
            bins = runtime.histogram_bins([p['value'] for p in chart['data']], chart['edges'], 'density')
            self.assertEqual(40,sum(b['count'] for b in bins))
            self.assertAlmostEqual(1,sum(b['height']*(b['upper']-b['lower']) for b in bins),places=12)
            self.assertTrue(any(s.get('relationPath')=='dct:hasPart' for s in chart['source']))
            self.assertIn('constructed',scene['narration'])
            self.assertFalse(set(p['id'] for p in chart['data']) & set(p['id'] for p in chart['curves'][0]['data']))

    def test_site_normal_reference_is_moment_matched_but_assigns_negative_mass(self):
        chart = next(b for b in self.scenes[4]['blocks'] if b['kind']=='chart')
        values = [p['value'] for p in chart['data']]
        self.assertTrue(all(v>0 for v in values))
        mean, sd = statistics.mean(values), statistics.pstdev(values)
        self.assertAlmostEqual(1.5125,mean,places=12)
        self.assertAlmostEqual(1.3369157602481916,sd,places=12)
        for point in chart['curves'][0]['data']:
            self.assertAlmostEqual(math.exp(-.5*((point['x']-mean)/sd)**2)/(sd*math.sqrt(2*math.pi)),point['y'],places=11)
        negative_mass = statistics.NormalDist(mean,sd).cdf(0)
        self.assertAlmostEqual(.1289569948968125,negative_mass,places=12)
        self.assertEqual(12.90,round(negative_mass*100,2))
        self.assertLess(chart['edges'][0],0)
        self.assertIn('not proof of lognormality',self.scenes[4]['narration'])
        self.assertIn('denominator thirty-nine',self.scenes[4]['narration'])

    def test_histogram_curve_compiler_and_shacl_reject_wrong_scales_and_units(self):
        shape = self.dataset.graph(BASE+'shapes/histogram-reference-curves')
        self.assertTrue(validate(validate_semantics.dataset_union(self.dataset),shacl_graph=shape,advanced=True)[0])
        for predicate,value in [(CD.histogramNormalization,Literal('count')),(CD.xAxisUnit,Literal('ug/L')),(CD.chartType,CD.Histogram2D)]:
            dataset = rdf_dataset.assemble_dataset()
            dataset.graph(BASE+'specifications/level5-normal-interpretation').set((EX['l5-n11c-chart'],predicate,value))
            self.assertFalse(validate(validate_semantics.dataset_union(dataset),shacl_graph=shape,advanced=True)[0])
            with self.assertRaises(ValueError):
                runtime.chart_payload(dataset,EX['l5-n11c-chart'],'en')
        dataset = rdf_dataset.assemble_dataset()
        dataset.graph(BASE+'specifications/level5-normal-interpretation').set((EX['l5-nref-0'],CD.xValue,Literal('-4.0',datatype=runtime.XSD.decimal)))
        with self.assertRaisesRegex(ValueError,'coordinates'):
            runtime.chart_payload(dataset,EX['l5-n11c-chart'],'en')

    def test_static_projection_includes_curve_coordinates_and_diagnostic_guardrails(self):
        html = runtime.static_fallback({'sceneDocuments':[self.document]})
        self.assertIn('Reference curve:',html)
        self.assertIn('Coordinates are not sample observations.',html)
        self.assertIn('1.5125',html)
        script = self.scenes[5]['narration']
        for phrase in ('not automatically true zero','censoring','Mixtures','correlated','approximately normal analytical errors','not an automatic conclusion'):
            self.assertIn(phrase,script)
