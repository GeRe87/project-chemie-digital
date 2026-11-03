"""Theoretical PMF/CDF/PDF/quantile explanations, with direct complete graphics."""
import math
from rdflib import XSD
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal, validate

class DistributionFunctionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.reference=runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening')
        cls.document=runtime.compile_scene_document(cls.dataset,cls.reference)
        cls.union=validate_semantics.dataset_union(cls.dataset)

    def test_five_new_scenes_are_complete_english_explanations(self):
        self.assertGreaterEqual(len(self.document['scenes']),16)
        self.assertEqual([f'ex:l5-d08{s}-scene--scene' for s in 'abcde'],[s['id'] for s in self.document['scenes'][11:16]])
        self.assertEqual('1.13',self.document['version'])
        for scene in self.document['scenes'][11:16]:
            self.assertNotIn('?',scene['narration'])
            self.assertEqual(['prose','chart','math','definition-list'],[b['kind'] for b in scene['blocks']])
            chart=scene['blocks'][1]
            self.assertEqual('complete',chart['presentation'])
            self.assertTrue(any(s.get('relationPath')=='cd:chartPresentation' for s in chart['source']))
            self.assertTrue(all(b.get('disclosure',{}).get('mode')!='progressive' for b in scene['blocks']))
            formula,legend=scene['blocks'][2:]
            resource=EX[formula['source'][0]['resourceId'].removeprefix('ex:')]
            self.assertTrue(list(self.union.objects(resource,DCTERMS.hasPart)))
            self.assertEqual(len(set(self.union.objects(resource,CD.hasSymbol))),len(legend['entries']))
            self.assertTrue(all(e['description'] for e in legend['entries']))
            self.assertNotIn('Mathematische',formula['spokenText'])

    def test_binomial_mass_and_cdf_match_without_slope_interpolation(self):
        pmf=self.document['scenes'][11]['blocks'][1]
        cdf=self.document['scenes'][12]['blocks'][1]
        expected=[math.comb(10,k)*.2**k*.8**(10-k) for k in range(11)]
        self.assertEqual('step-after',cdf['interpolation']);self.assertEqual([0,1],cdf['yDomain'])
        self.assertEqual(True,cdf['showPoints'])
        for k,p in enumerate(pmf['data']):self.assertAlmostEqual(expected[k],p['value'],places=12)
        self.assertAlmostEqual(1,math.fsum(p['value'] for p in pmf['data']),places=12)
        points=cdf['series'][0]['data']
        self.assertEqual((-1,0),(points[0]['x'],points[0]['y']))
        self.assertEqual((11,1),(points[-1]['x'],points[-1]['y']))
        for k in range(11):self.assertAlmostEqual(math.fsum(expected[:k+1]),points[k+1]['y'],places=12)
        self.assertAlmostEqual(.301989888,pmf['data'][2]['value'],places=12)
        self.assertAlmostEqual(.6777995264,points[3]['y'],places=12)

    def test_density_is_normalized_with_height_above_one_and_exact_interval_area(self):
        chart=self.document['scenes'][13]['blocks'][1]
        points=chart['series'][0]['data']
        area=lambda data:math.fsum((b['x']-a['x'])*(a['y']+b['y'])/2 for a,b in zip(data,data[1:]))
        self.assertAlmostEqual(1,area(points),places=12)
        self.assertAlmostEqual(.75,area(points[1:4]),places=12)
        self.assertEqual(2,max(p['y'] for p in points))
        self.assertEqual('L/mg',chart['yAxis']['unit']);self.assertEqual('mg/L',chart['xAxis']['unit'])
        self.assertFalse(chart['showPoints'])
        self.assertEqual('x-range',chart['annotations'][0]['kind'])
        self.assertIn('not a fitted',self.document['scenes'][13]['narration'])

    def test_continuous_cdf_is_integrated_density_not_an_empirical_ecdf(self):
        chart=self.document['scenes'][14]['blocks'][1]
        self.assertEqual('line',chart['chartType']);self.assertEqual('linear',chart['interpolation'])
        self.assertFalse(chart['showPoints']);self.assertEqual([0,1],chart['yDomain'])
        for point in chart['series'][0]['data']:
            t=point['x']-9.5
            expected=2*t*t if t<=.5 else 1-2*(1-t)**2
            self.assertAlmostEqual(expected,point['y'],places=12)
        vals={p['x']:p['y'] for p in chart['series'][0]['data']}
        self.assertAlmostEqual(.75,vals[10.25]-vals[9.75],places=12)
        self.assertTrue(all(a['y']<=b['y'] for a,b in zip(chart['series'][0]['data'],chart['series'][0]['data'][1:])))
        self.assertIn('left limit',self.document['scenes'][14]['narration'])
        self.assertIn('approximate',self.document['scenes'][14]['narration'])

    def test_quantile_is_first_crossing_not_exact_cdf_equality(self):
        chart=self.document['scenes'][15]['blocks'][1]
        self.assertEqual(2,len(chart['series']))
        self.assertEqual('step-after',chart['interpolation'])
        self.assertTrue(all(p['y']==.5 for p in chart['series'][1]['data']))
        first=next(p for p in chart['series'][0]['data'] if p['y']>=.5)
        self.assertEqual(2,first['x']);self.assertGreater(first['y'],.5)
        self.assertIn('not a revisit',self.document['scenes'][15]['narration'])

    def test_chart_display_shacl_and_compiler_reject_invalid_options(self):
        shape=self.dataset.graph(BASE+'shapes/chart-display-options')
        self.assertTrue(validate(self.union,shacl_graph=shape,advanced=True)[0])
        for subject,predicate,value in [('l5-d08b-chart',CD.lineInterpolation,Literal('smooth')),('l5-d08c-chart',CD.showChartPoints,Literal('false')),('l5-d08b-chart',CD.chartYMaximum,Literal('.5',datatype=XSD.decimal))]:
            dataset=rdf_dataset.assemble_dataset()
            dataset.graph(BASE+'specifications/level5-distribution-functions').set((EX[subject],predicate,value))
            self.assertFalse(validate(validate_semantics.dataset_union(dataset),shacl_graph=shape,advanced=True)[0])
            with self.assertRaises(ValueError):runtime.chart_payload(dataset,EX[subject],'en')

    def test_new_authored_resources_are_english_and_do_not_restore_retired_content(self):
        for graph in ['knowledge/distribution-functions','specifications/level5-distribution-functions','scenes/level5-distribution-functions']:
            for _,_,value in self.dataset.graph(BASE+graph):
                if isinstance(value,Literal) and value.language:self.assertEqual('en',value.language)
                self.assertNotIn('\u2014',str(value))
                self.assertNotIn('pump',str(value).lower());self.assertNotIn('wheel',str(value).lower())
