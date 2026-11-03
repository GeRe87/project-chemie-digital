"""F17 keeps descriptive sample ratios separate from a conditional F reference."""
import math
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal


class FDistributionLectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening'))
        cls.scenes=[next(s for s in cls.document['scenes'] if s['id']==f'ex:l5-f17{suffix}-scene--scene') for suffix in 'abc']

    def test_three_complete_english_views_follow_t16(self):
        self.assertGreaterEqual(len(self.document['scenes']),52)
        self.assertEqual(['ex:l5-f17'+s+'-scene--scene' for s in 'abc'],[s['id'] for s in self.scenes])
        for scene in self.scenes:
            self.assertNotIn('?',scene['narration'])
            self.assertTrue(all(b.get('disclosure',{}).get('mode')!='progressive' for b in scene['blocks']))
        for graph in ('knowledge/level5-f-distribution','specifications/level5-f-distribution','specifications/level5-f-distribution-data','scenes/level5-f-distribution'):
            for _,_,value in self.dataset.graph(BASE+graph):
                if isinstance(value,Literal):
                    if value.language:self.assertEqual('en',value.language)
                    self.assertNotIn('\u2014',str(value))

    def test_sd_ratio_is_two_but_variance_ratio_is_four(self):
        chart=self.scenes[0]['blocks'][1]
        a,b=[v['value'] for v in chart['data']]
        self.assertEqual((.2,.4),(a,b))
        self.assertEqual(2,b/a)
        self.assertEqual(4,b*b/(a*a))
        self.assertEqual('mg/L',chart['yAxis']['unit'])
        self.assertIn('Sample sizes are not supplied',chart['description'])
        self.assertIn('no test decision',chart['description'])

    def test_f_density_coordinates_have_ordered_parameters_and_no_fitted_markers(self):
        chart=self.scenes[1]['blocks'][1]
        self.assertEqual('complete',chart['presentation'])
        self.assertFalse(chart['showPoints'])
        self.assertEqual([0,.7],chart['yDomain'])
        self.assertEqual('1',chart['xAxis']['unit'])
        self.assertEqual('1',chart['yAxis']['unit'])
        points=chart['series'][0]['data']
        self.assertEqual(22,len(points))
        self.assertEqual((0,8),(points[0]['x'],points[-1]['x']))
        # Direct beta normalization is independent of the log-gamma authoring calculation.
        a,b=10,5
        beta=math.gamma(a/2)*math.gamma(b/2)/math.gamma((a+b)/2)
        for p in points:
            expected=(a/b)**(a/2)*p['x']**(a/2-1)/(beta*(1+a*p['x']/b)**((a+b)/2))
            self.assertAlmostEqual(expected,p['y'],places=11)
        self.assertGreater(points[-1]['y'],0)
        self.assertIn('not inferred from the SDs',chart['description'])

    def test_density_normalization_and_mean_check_numerator_denominator_order(self):
        # Transform t = a*x/(b+a*x) onto [0,1]. Simpson quadrature checks the
        # full density, not the piecewise-linear finite drawing or a tail p value.
        a,b=10,5
        beta=math.gamma(a/2)*math.gamma(b/2)/math.gamma((a+b)/2)
        intervals=20000
        integrals=[]
        for moment in (0,1):
            def integrand(t):
                if t in (0,1):return 0
                return t**(a/2-1)*(1-t)**(b/2-1)/beta*(b*t/(a*(1-t)))**moment
            value=sum((4 if i%2 else 2)*integrand(i/intervals) for i in range(1,intervals))/(3*intervals)
            integrals.append(value)
        self.assertAlmostEqual(1,integrals[0],places=8)
        self.assertAlmostEqual(5/3,integrals[1],places=5)
        self.assertNotAlmostEqual(10/8,integrals[1],places=2)

    def test_normalized_chi_square_example_is_explicitly_constructed(self):
        chart=self.scenes[2]['blocks'][1]
        numerator,denominator=[v['value'] for v in chart['data']]
        self.assertEqual(16/10,numerator)
        self.assertEqual(2/5,denominator)
        self.assertEqual(4,numerator/denominator)
        self.assertEqual('1',chart['yAxis']['unit'])
        self.assertIn('Not simulated draws or method A/B data',chart['description'])
        self.assertIn('independence of the two chi-square variables is essential',self.scenes[2]['narration'])
        self.assertIn('Reversing the quotient swaps the degrees of freedom',self.scenes[2]['narration'])

    def test_all_formulas_have_separate_same_slide_authored_legends(self):
        for scene in self.scenes:
            formula,legend=scene['blocks'][2:]
            resource=EX[formula['source'][0]['resourceId'].removeprefix('ex:')]
            self.assertTrue(list(self.union.objects(resource,DCTERMS.hasPart)))
            self.assertEqual(4,len(legend['entries']))
            self.assertEqual(4,len(set(self.union.objects(resource,CD.hasSymbol))))
            self.assertTrue(all(e['description'] for e in legend['entries']))

    def test_null_model_normality_independence_and_no_test_decision_are_explicit(self):
        script=self.scenes[1]['narration']
        for phrase in ('equal population variances','two independent samples','iid normal','Population means need not be equal','not missing facts inferred','No observed-ratio marker, tail probability, critical region or test decision','sensitive to nonnormality','not a universal robust','next session'):
            self.assertIn(phrase,script)
        self.assertIn('population-variance scale factor times an F variable',self.scenes[2]['narration'])
        html=runtime.static_fallback({'sceneDocuments':[{**self.document,'scenes':self.scenes}]})
        self.assertIn('no test decision',html)
        self.assertIn('Sensitive to nonnormality',html)
        self.assertIn('Not simulated draws',html)
