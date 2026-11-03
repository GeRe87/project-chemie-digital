"""S15 distinguishes observed SD, estimated SE, a sampling model and bias."""
import json
import math
import re
import statistics
import subprocess
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal


class StandardErrorLectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening'))
        cls.scenes=[next(s for s in cls.document['scenes'] if s['id']==f'ex:l5-s15{suffix}-scene--scene') for suffix in 'abcd']
        cls.protocol=str(cls.union.value(EX['l5-s15-protocol'],CD.body))
        code=re.search(r'```javascript\n(.*?)\n```',cls.protocol,re.S).group(1)
        result=subprocess.run(['node','--input-type=module','-'],input=code+'\nconsole.log(JSON.stringify(standardErrorSimulation()));',text=True,capture_output=True,check=True,timeout=30)
        cls.replay=json.loads(result.stdout)

    def test_four_complete_english_scenes_follow_c14(self):
        self.assertGreaterEqual(len(self.document['scenes']),42)
        self.assertEqual(['ex:l5-s15'+s+'-scene--scene' for s in 'abcd'],[s['id'] for s in self.scenes])
        for scene in self.scenes:
            self.assertNotIn('?',scene['narration'])
            self.assertTrue(all(b.get('disclosure',{}).get('mode')!='progressive' for b in scene['blocks']))
        for graph in ('knowledge/level5-standard-error','specifications/level5-standard-error','specifications/level5-standard-error-data','scenes/level5-standard-error'):
            for _,_,value in self.dataset.graph(BASE+graph):
                if isinstance(value,Literal):
                    if value.language:self.assertEqual('en',value.language)
                    self.assertNotIn('\u2014',str(value))

    def test_constructed_readings_and_unrounded_sd_se_arithmetic(self):
        values=[float(self.union.value(EX['l5-s15-v'+str(i)],CD.numericValue)) for i in range(1,6)]
        self.assertEqual([9.6,9.8,10,10.2,10.4],values)
        mean=statistics.mean(values)
        self.assertEqual(10,mean)
        self.assertAlmostEqual(.4,sum((x-mean)**2 for x in values),places=12)
        self.assertAlmostEqual(.1,statistics.variance(values),places=12)
        self.assertEqual(mean,float(self.union.value(EX['l5-s15-mean'],CD.numericValue)))
        chart=self.scenes[2]['blocks'][1]
        self.assertEqual('complete',chart['presentation'])
        sd,se=[p['value'] for p in chart['data']]
        self.assertAlmostEqual(statistics.stdev(values),sd,places=12)
        self.assertAlmostEqual(sd/math.sqrt(5),se,places=12)
        self.assertNotAlmostEqual(.316/math.sqrt(5),se,places=7)
        self.assertIn('Not environmental SE',chart['description'])
        self.assertIn('Neither is a confidence interval',self.scenes[2]['narration'])

    def test_simulation_replays_independently_without_resampling_observed_readings(self):
        state=20261031
        def uniform():
            nonlocal state
            state=(state+0x6d2b79f5)&0xffffffff;t=state
            t=((t^(t>>15))*(t|1))&0xffffffff
            t^=(t+(((t^(t>>7))*(t|61))&0xffffffff))&0xffffffff
            return ((t^(t>>14))&0xffffffff)/4294967296
        expected=[]
        for _ in range(5000):
            values=[10+math.sqrt(.1)*math.sqrt(-2*math.log(1-uniform()))*math.cos(2*math.pi*uniform()) for _ in range(5)]
            expected.append(sum(values)/5)
        self.assertEqual(5000,len(self.replay['means']))
        for a,b in zip(expected,self.replay['means']):self.assertAlmostEqual(a,b,places=11)
        self.assertAlmostEqual(9.820659749992945,expected[0],places=12)
        self.assertIn('not known true population parameters',self.protocol)
        self.assertIn('not established',self.protocol)
        self.assertIn('25,000 individuals',self.protocol)
        self.assertIn('not by a size-five CLT guarantee',self.protocol)

    def test_published_counts_retain_all_means_without_midpoint_observations(self):
        chart=self.scenes[1]['blocks'][2]
        self.assertEqual('histogram',chart['chartType'])
        self.assertEqual([],chart['data'])
        self.assertEqual(self.replay['counts'],chart['binCounts'])
        self.assertEqual(5000,sum(chart['binCounts']))
        self.assertEqual(24,len(chart['binCounts']))
        self.assertEqual((8.8,11.2),(chart['edges'][0],chart['edges'][-1]))
        bins=runtime.histogram_bins(self.replay['means'],chart['edges'],'density')
        self.assertEqual(chart['binCounts'],[b['count'] for b in bins])
        self.assertGreaterEqual(min(self.replay['means']),8.8)
        self.assertLessEqual(max(self.replay['means']),11.2)
        html=runtime.static_fallback({'sceneDocuments':[{**self.document,'scenes':self.scenes}]})
        self.assertIn('n=5000',html)
        self.assertIn('not reconstructed',html)
        self.assertIn('Reference curve:',html)
        self.assertIn('estimated standard error',html)

    def test_individual_density_is_separate_and_not_fitted_to_means(self):
        chart=self.scenes[1]['blocks'][2]
        self.assertEqual('mg/L',chart['xAxis']['unit'])
        self.assertEqual('L/mg',chart['yAxis']['unit'])
        self.assertEqual(1,len(chart['curves']))
        for point in chart['curves'][0]['data']:
            expected=math.exp(-.5*((point['x']-10)/math.sqrt(.1))**2)/math.sqrt(2*math.pi*.1)
            self.assertAlmostEqual(expected,point['y'],places=11)
        self.assertLess(statistics.pstdev(self.replay['means']),math.sqrt(.1))
        self.assertNotEqual(10,statistics.mean(self.replay['means']))

    def test_each_formula_has_same_slide_complete_authored_legend(self):
        for index in (0,2):
            formula,legend=self.scenes[index]['blocks'][2:]
            resource=EX[formula['source'][0]['resourceId'].removeprefix('ex:')]
            self.assertTrue(list(self.union.objects(resource,DCTERMS.hasPart)))
            self.assertEqual(4,len(legend['entries']))
            self.assertEqual(4,len(set(self.union.objects(resource,CD.hasSymbol))))
            self.assertTrue(all(e['description'] for e in legend['entries']))
        self.assertIn('estimated standard error',self.scenes[2]['narration'])
        self.assertIn('marked by the hat',self.scenes[2]['narration'])

    def test_bias_dependence_and_measurement_uncertainty_remain_explicit(self):
        script=self.scenes[3]['narration']
        for phrase in ('Averaging five or eighty','not a diagnosis','pairwise covariances','not independent environmental samples','Calibration','Neither the CLT nor a smaller SE corrects bias'):
            self.assertIn(phrase,script)
        cards=self.scenes[3]['blocks'][1]
        self.assertEqual(4,len(cards['entries']))
        self.assertIn('10.0',cards['entries'][0]['term'])
        self.assertIn('10.2',cards['entries'][0]['term'])
        self.assertIn('80',cards['entries'][1]['term'])
        self.assertAlmostEqual(4,math.sqrt(.1/5)/math.sqrt(.1/80),places=12)
