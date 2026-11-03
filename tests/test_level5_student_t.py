"""T16: exact normal-sampling laws, theoretical references and a mean interval."""
import json
import math
import re
import statistics
import subprocess
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal


class StudentTLectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening'))
        cls.scenes=[next(s for s in cls.document['scenes'] if s['id']==f'ex:l5-t16{suffix}-scene--scene') for suffix in 'abcdefg']
        cls.protocol=str(cls.union.value(EX['l5-t16-protocol'],CD.body))
        code=re.search(r'```javascript\n(.*?)\n```',cls.protocol,re.S).group(1)
        result=subprocess.run(['node','--input-type=module','-'],input=code+'\nconsole.log(JSON.stringify(varianceSimulation()));',text=True,capture_output=True,check=True,timeout=30)
        cls.replay=json.loads(result.stdout)

    def test_seven_complete_english_views_follow_s15(self):
        self.assertGreaterEqual(len(self.document['scenes']),49)
        self.assertEqual(['ex:l5-t16'+s+'-scene--scene' for s in 'abcdefg'],[s['id'] for s in self.scenes])
        for scene in self.scenes:
            self.assertNotIn('?',scene['narration'])
            self.assertTrue(all(b.get('disclosure',{}).get('mode')!='progressive' for b in scene['blocks']))
        for graph in ('knowledge/level5-student-t','specifications/level5-student-t','specifications/level5-student-t-data','scenes/level5-student-t'):
            for _,_,value in self.dataset.graph(BASE+graph):
                if isinstance(value,Literal):
                    if value.language:self.assertEqual('en',value.language)
                    self.assertNotIn('\u2014',str(value))

    def test_five_displayed_variances_are_first_s15_samples_not_selected_or_constructed(self):
        state=20261031
        def uniform():
            nonlocal state
            state=(state+0x6d2b79f5)&0xffffffff;t=state
            t=((t^(t>>15))*(t|1))&0xffffffff
            t^=(t+(((t^(t>>7))*(t|61))&0xffffffff))&0xffffffff
            return ((t^(t>>14))&0xffffffff)/4294967296
        variances=[]
        for _ in range(5000):
            row=[10+math.sqrt(.1)*math.sqrt(-2*math.log(1-uniform()))*math.cos(2*math.pi*uniform()) for _ in range(5)]
            variances.append(statistics.variance(row))
        self.assertEqual(5000,len(self.replay['variances']))
        for a,b in zip(variances,self.replay['variances']):self.assertAlmostEqual(a,b,places=11)
        chart=self.scenes[0]['blocks'][1]
        for datum,value in zip(chart['data'],variances[:5]):self.assertAlmostEqual(datum['value'],value,places=12)
        self.assertEqual('(mg/L)^2',chart['yAxis']['unit'])
        self.assertAlmostEqual(9.820659749992945,self.replay['means'][0],places=12)
        self.assertIn('not an independent new collection',self.protocol)

    def test_chi_square_coordinates_are_theoretical_not_fitted(self):
        chart=self.scenes[1]['blocks'][1]
        self.assertEqual(1,len(chart['series']))
        for p in chart['series'][0]['data']:
            self.assertAlmostEqual(p['x']*math.exp(-p['x']/2)/4,p['y'],places=11)
        self.assertEqual('1',chart['xAxis']['unit'])
        self.assertEqual('1',chart['yAxis']['unit'])
        self.assertIn('not a finite observed histogram or a fitted model',self.scenes[1]['narration'])
        self.assertIn('not the original dependent centered residuals',self.scenes[1]['narration'])

    def test_all_four_student_t_curves_have_exact_symmetric_coordinates(self):
        for nu in (2,4,10,30):
            points=runtime.line_series_payload(self.dataset,EX['l5-t16-t'+str(nu)],'en')['data']
            self.assertEqual((-6,6),(points[0]['x'],points[-1]['x']))
            self.assertEqual(25,len(points))
            for point in points:
                expected=math.exp(math.lgamma((nu+1)/2)-math.lgamma(nu/2))/math.sqrt(nu*math.pi)*(1+point['x']**2/nu)**(-(nu+1)/2)
                self.assertAlmostEqual(expected,point['y'],places=11)
            self.assertEqual([p['y'] for p in points],[p['y'] for p in points[::-1]])

    def test_comparisons_share_axes_and_reuse_the_same_normal_reference(self):
        charts=[self.scenes[i]['blocks'][1 if i<4 else 2] for i in (2,3,4,5)]
        self.assertEqual([1,2,3,3],[len(c['series']) for c in charts])
        for chart in charts:
            self.assertEqual([0,.42],chart['yDomain'])
            self.assertEqual('complete',chart['presentation'])
            self.assertFalse(chart['showPoints'])
            self.assertEqual(charts[0]['series'][0]['data'],chart['series'][0]['data'])
            self.assertTrue(all((s['data'][0]['x'],s['data'][-1]['x'])==(-6,6) for s in chart['series']))
        self.assertEqual(charts[2]['xAxis'],charts[3]['xAxis'])
        self.assertEqual(charts[2]['yAxis'],charts[3]['yAxis'])
        self.assertIn('2 degrees',charts[2]['series'][1]['label'])
        self.assertIn('4 degrees',charts[2]['series'][2]['label'])
        self.assertIn('10 degrees',charts[3]['series'][1]['label'])
        self.assertIn('30 degrees',charts[3]['series'][2]['label'])

    def test_five_formulas_have_complete_separate_same_slide_legends(self):
        for index in (0,1,2,3,6):
            formula,legend=self.scenes[index]['blocks'][2:]
            resource=EX[formula['source'][0]['resourceId'].removeprefix('ex:')]
            self.assertTrue(list(self.union.objects(resource,DCTERMS.hasPart)))
            self.assertEqual(4,len(legend['entries']))
            self.assertEqual(4,len(set(self.union.objects(resource,CD.hasSymbol))))
            self.assertTrue(all(e['description'] for e in legend['entries']))

    def test_t4_quantile_and_ci_are_verified_by_independent_analytic_cdf(self):
        q=2.7764451051977987
        # t4 density integrates after x = 2*tan(theta) to (3/4)*cos(theta)^3.
        sine=q/math.sqrt(q*q+4)
        cdf=.5+.75*(sine-sine**3/3)
        self.assertAlmostEqual(.975,cdf,places=13)
        values=[float(self.union.value(EX['l5-s15-v'+str(i)],CD.numericValue)) for i in range(1,6)]
        mean=statistics.mean(values);se=statistics.stdev(values)/math.sqrt(len(values));margin=q*se
        bars=self.scenes[6]['blocks'][1]['data']
        self.assertAlmostEqual(se,bars[0]['value'],places=12)
        self.assertAlmostEqual(margin,bars[1]['value'],places=12)
        self.assertEqual((9.60735,10.39265),(round(mean-margin,5),round(mean+margin,5)))
        self.assertGreater(margin,1.959963984540054*se)

    def test_exact_law_and_confidence_coverage_guardrails_are_explicit(self):
        self.assertIn('sample mean and sample variance are independent',self.scenes[3]['narration'])
        self.assertIn('does not have finite variance',self.scenes[4]['narration'])
        self.assertIn('not a universal sample-size-thirty rule',self.scenes[5]['narration'])
        script=self.scenes[6]['narration']
        for phrase in ('procedure covers the common fixed analytical expectation 95 percent','do not assign 95 percent probability','not the environmental sample or a selected simulation series','not a prediction interval for individual values','Without bias control','not automatically cover the true concentration of the collected sample','not a confidence interval for the water-body mean'):
            self.assertIn(phrase,script)
        html=runtime.static_fallback({'sceneDocuments':[{**self.document,'scenes':self.scenes}]})
        self.assertIn('9.60735',html)
        self.assertIn('long-run coverage',html)
