"""KS: jump-side statistic, exact fixed-CDF calibration and fitted-model caveats."""
import math
import re
import statistics
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal


class KolmogorovSmirnovLectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening'))
        cls.scenes=[next(s for s in cls.document['scenes'] if s['id']==f'ex:l5-g19{suffix}-scene--scene') for suffix in 'abcde']
        cls.protocol=str(cls.union.value(EX['l5-g19-protocol'],CD.body))

    def test_five_complete_english_views_precede_closing(self):
        self.assertEqual(['ex:l5-g19'+s+'-scene--scene' for s in 'abcde'],[s['id'] for s in self.scenes])
        self.assertLess(self.document['scenes'].index(self.scenes[-1]),next(i for i,s in enumerate(self.document['scenes']) if s['id']=='ex:l5-e18a-scene--scene'))
        for scene in self.scenes:
            self.assertNotIn('?',scene['narration'])
            self.assertTrue(all(b.get('disclosure',{}).get('mode')!='progressive' for b in scene['blocks']))
        for graph in ('knowledge/level5-ks','specifications/level5-ks','specifications/level5-ks-data','scenes/level5-ks'):
            for _,_,value in self.dataset.graph(BASE+graph):
                if isinstance(value,Literal):
                    if value.language:self.assertEqual('en',value.language)
                    self.assertNotIn('\u2014',str(value))

    def test_ecdf_is_right_continuous_and_counts_exactly_five_readings(self):
        chart=self.scenes[0]['blocks'][1]
        self.assertEqual('step-after',chart['interpolation'])
        self.assertTrue(chart['showPoints'])
        points=chart['series'][0]['data']
        sample=[9.4,9.8,10,10.2,10.6]
        for point in points:self.assertAlmostEqual(sum(x<=point['x'] for x in sample)/5,point['y'],places=12)
        self.assertEqual(5,sum(a['y']!=b['y'] for a,b in zip(points,points[1:])))

    def test_model_cdf_uses_prespecified_not_sample_estimated_parameters(self):
        empirical=self.scenes[0]['blocks'][1];model=self.scenes[1]['blocks'][1]
        self.assertEqual(empirical['xAxis'],model['xAxis'])
        self.assertEqual(empirical['yAxis'],model['yAxis'])
        self.assertEqual([0,1],model['yDomain'])
        self.assertFalse(model['showPoints'])
        self.assertNotEqual('step-after',model.get('interpolation'))
        points=model['series'][0]['data']
        for point in points:
            self.assertAlmostEqual(.5*(1+math.erf((point['x']-10)/(.5*math.sqrt(2)))),point['y'],places=11)
        self.assertGreater(points[0]['y'],0);self.assertLess(points[-1]['y'],1)
        self.assertNotAlmostEqual(.5,statistics.stdev([9.4,9.8,10,10.2,10.6]),places=3)
        self.assertIn('not estimated',self.scenes[1]['narration'])

    def test_both_jump_sides_and_their_argmax_are_computed_analytically(self):
        chart=self.scenes[2]['blocks'][1]
        plus,minus=chart['series']
        self.assertEqual(2,len(chart['series']))
        for i,(p,m) in enumerate(zip(plus['data'],minus['data']),1):
            f=.5*(1+math.erf((p['x']-10)/(.5*math.sqrt(2))))
            self.assertAlmostEqual(i/5-f,p['y'],places=12)
            self.assertAlmostEqual(f-(i-1)/5,m['y'],places=12)
        self.assertEqual(10.2,max(plus['data'],key=lambda p:p['y'])['x'])
        self.assertEqual(9.8,max(minus['data'],key=lambda p:p['y'])['x'])
        d=max(p['y'] for series in chart['series'] for p in series['data'])
        self.assertAlmostEqual(.14457825838967642,d,places=12)
        self.assertAlmostEqual(d,float(self.union.value(EX['l5-g19-distance'],CD.numericValue)),places=12)

    def test_exact_critical_value_replays_and_independent_order_statistic_volume_agrees(self):
        namespace={}
        exec(re.search(r'```python\n(.*?)\n```',self.protocol,re.S).group(1),namespace)
        cutoff=float(self.union.value(EX['l5-g19-cutoff'],CD.numericValue))
        self.assertAlmostEqual(cutoff,namespace['hi'],places=13)
        self.assertAlmostEqual(.05,namespace['exact_large_distance_tail'](cutoff),places=13)
        with self.assertRaises(ValueError):namespace['exact_large_distance_tail'](.144578)
        # Independent exact polynomial integration of the ordered-uniform simplex:
        # constrain each order statistic between i/n-d and (i-1)/n+d.
        n=5;d=cutoff
        bounds=[(max(0,i/n-d),min(1,(i-1)/n+d)) for i in range(1,n+1)]
        knots=sorted({0.,1.,*(x for pair in bounds for x in pair)})
        polynomials=[[1.] for _ in range(len(knots)-1)]
        evaluate=lambda c,x:sum(value*x**j for j,value in enumerate(c))
        for lower,upper in bounds:
            cumulative=0.;updated=[]
            for left,right,coefficients in zip(knots,knots[1:],polynomials):
                if left>=lower and right<=upper:
                    anti=[0.]+[c/(j+1) for j,c in enumerate(coefficients)]
                    anti[0]=cumulative-evaluate(anti,left)
                    cumulative=evaluate(anti,right);updated.append(anti)
                else:updated.append([cumulative])
            polynomials=updated
        cdf=math.factorial(n)*evaluate(polynomials[-1],1)
        self.assertAlmostEqual(.95,cdf,places=11)
        self.assertNotAlmostEqual(1.36/math.sqrt(5),cutoff,places=3)

    def test_decision_and_fitted_discrete_dependent_guardrails_are_explicit(self):
        self.assertIn('do not reject',self.scenes[3]['narration'])
        self.assertIn('not a probability that this model is true',self.scenes[3]['narration'])
        self.assertIn('No observed p value',self.scenes[3]['narration'])
        script=self.scenes[4]['narration']
        for phrase in ('completely specified continuous null','estimated from these same data','no longer valid unchanged','every bootstrap replicate','Lilliefors','rounding with ties','Dependence','Failure to reject','next separate addition'):
            self.assertIn(phrase,script)

    def test_all_three_formulas_have_separate_complete_same_slide_legends(self):
        for scene in self.scenes[:3]:
            formula,legend=scene['blocks'][2:]
            resource=EX[formula['source'][0]['resourceId'].removeprefix('ex:')]
            self.assertTrue(list(self.union.objects(resource,DCTERMS.hasPart)))
            self.assertEqual(4,len(legend['entries']))
            self.assertEqual(4,len(set(self.union.objects(resource,CD.hasSymbol))))
            self.assertTrue(all(e['description'] for e in legend['entries']))
        html=runtime.static_fallback({'sceneDocuments':[{**self.document,'scenes':self.scenes}]})
        self.assertIn('0.144578',html);self.assertIn('0.563275',html)
        self.assertIn('refits every simulated sample',html)
