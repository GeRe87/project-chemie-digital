"""V03: fixed-concentration repeats and a dimensionally consistent logistic family."""
import math
from rdflib.namespace import DCTERMS, XSD
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal


class DetectionReserveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX['path-level5-screening-reserve']),BASE+'paths/level5-screening-reserve'))
        cls.scenes=cls.document['scenes'][3:6]
        cls.protocol=str(cls.union.value(EX['l5-v03-protocol'],CD.body))

    def test_three_complete_english_views_extend_only_the_optional_reserve(self):
        self.assertGreaterEqual(len(self.document['scenes']),6)
        self.assertEqual(['ex:l5-v03'+s+'-scene--scene' for s in 'abc'],[s['id'] for s in self.scenes])
        main=runtime.compile_scene_document(self.dataset,runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening'))
        self.assertEqual(70,len(main['scenes']))
        self.assertTrue(set(s['id'] for s in main['scenes']).isdisjoint(s['id'] for s in self.document['scenes']))
        for scene in self.scenes:
            self.assertNotIn('?',scene['narration'])
            self.assertTrue(all(b.get('disclosure',{}).get('mode')!='progressive' for b in scene['blocks']))
        for graph in ('knowledge/level5-detection-reserve','specifications/level5-detection-reserve','scenes/level5-detection-reserve'):
            for _,_,value in self.dataset.graph(BASE+graph):
                if isinstance(value,Literal):
                    if value.language:self.assertEqual('en',value.language)
                    self.assertNotIn('\u2014',str(value))

    def test_fixed_concentration_pmf_is_exact_normalized_and_not_forced_to_its_mean(self):
        chart=self.scenes[0]['blocks'][1]
        self.assertEqual('complete',chart['presentation'])
        masses=[p['value'] for p in chart['data']]
        self.assertEqual([math.comb(10,k)/1024 for k in range(11)],masses)
        self.assertEqual(1,sum(masses))
        self.assertEqual(5,sum(k*p for k,p in enumerate(masses)))
        self.assertEqual(2.5,sum((k-5)**2*p for k,p in enumerate(masses)))
        self.assertLess(masses[5],1)
        self.assertTrue(all(p>0 for p in masses))
        self.assertIn('not observations or a simulation',self.scenes[0]['narration'])

    def test_every_logistic_coordinate_satisfies_chosen_log_odds_with_correct_units(self):
        chart=self.scenes[1]['blocks'][1]
        self.assertEqual([0,1],chart['yDomain'])
        self.assertFalse(chart['showPoints'])
        self.assertEqual('complete',chart['presentation'])
        self.assertEqual('mg/L',chart['xAxis']['unit'])
        self.assertEqual('1',chart['yAxis']['unit'])
        points=chart['series'][0]['data']
        self.assertEqual((0,4),(points[0]['x'],points[-1]['x']))
        self.assertEqual(17,len(points))
        for point in points:
            c,p=point['x'],point['y']
            self.assertAlmostEqual(1/(1+math.exp(4-2*c)),p,places=11)
            self.assertGreater(p,0);self.assertLess(p,1)
            self.assertAlmostEqual(-4+2*c,math.log(p/(1-p)),places=9)
            # c in micrograms/L is 1000*c, requiring slope 0.002 L/microgram.
            self.assertAlmostEqual(p,1/(1+math.exp(4-.002*(1000*c))),places=11)
        self.assertTrue(all(a['y']<b['y'] for a,b in zip(points,points[1:])))
        self.assertEqual(.5,next(p['y'] for p in points if p['x']==2))

    def test_authored_observation_values_remain_decimal_literals(self):
        for prefix,count in (('k',11),('p',17)):
            for i in range(count):
                value=self.union.value(EX['l5-v03-'+prefix+str(i)],CD.numericValue)
                self.assertEqual(XSD.decimal,value.datatype)

    def test_two_formulas_have_complete_separate_same_slide_legends(self):
        for scene in self.scenes[:2]:
            formula,legend=scene['blocks'][2:]
            resource=EX[formula['source'][0]['resourceId'].removeprefix('ex:')]
            self.assertTrue(list(self.union.objects(resource,DCTERMS.hasPart)))
            self.assertEqual(4,len(legend['entries']))
            self.assertEqual(4,len(set(self.union.objects(resource,CD.hasSymbol))))
            self.assertTrue(all(e['description'] for e in legend['entries']))
        self.assertIn('natural logarithm',str(self.union.value(EX['l5-v03b-log'],CD.body)))
        self.assertIn('2 L/mg',str(self.union.value(EX['l5-v03b-parameters'],CD.body)))

    def test_model_scope_independence_and_separation_from_v02_are_explicit(self):
        for phrase in ('not a fit to V02','not automatically an analytical detection limit','not a natural law','Changing concentration units','not raw measurements'):
            self.assertIn(phrase,self.scenes[1]['narration'])
        for phrase in ('independence claim','decision rule','matrix','preparation','carry uncertainty','different asymptotes','not analytical validation'):
            self.assertIn(phrase,self.scenes[2]['narration'])
        self.assertIn('not target-population prevalence',str(self.union.value(EX['l5-v03-definition'],CD.body)))

    def test_static_alternatives_preserve_numeric_probabilities_and_guardrails(self):
        html=runtime.static_fallback({'sceneDocuments':[{**self.document,'scenes':self.scenes}]})
        for phrase in ('0.24609375','0.119202922022','Calibration needs evidence','not a validated detection limit'):
            self.assertIn(phrase,html)
