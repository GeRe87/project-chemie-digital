"""C14 separates exact moments from distributional limits and replays every frequency."""
import json
import math
import re
import statistics
import subprocess
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal


class CentralLimitLectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset();cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening'))
        cls.scenes=[next(s for s in cls.document['scenes'] if s['id']==f'ex:l5-c14{suffix}-scene--scene') for suffix in 'abcde']
        code=re.search(r'```javascript\n(.*?)\n```',str(cls.union.value(EX['l5-c14-protocol'],CD.body)),re.S).group(1)
        output=subprocess.run(['node','--input-type=module','-'],input=code+'\nconsole.log(JSON.stringify(comparison()));',text=True,capture_output=True,check=True,timeout=30)
        cls.replay=json.loads(output.stdout)

    def test_five_complete_english_views_follow_c13(self):
        self.assertGreaterEqual(len(self.document['scenes']),38)
        self.assertEqual(['ex:l5-c14'+s+'-scene--scene' for s in 'abcde'],[s['id'] for s in self.scenes])
        for scene in self.scenes:
            self.assertNotIn('?',scene['narration'])
            self.assertTrue(all(b.get('disclosure',{}).get('mode')!='progressive' for b in scene['blocks']))
        for graph in ('knowledge/level5-clt','specifications/level5-clt','specifications/level5-clt-data','scenes/level5-clt'):
            for _,_,value in self.dataset.graph(BASE+graph):
                if isinstance(value,Literal):
                    if value.language:self.assertEqual('en',value.language)
                    self.assertNotIn('\u2014',str(value))

    def test_exact_sd_values_are_not_estimated_or_presented_as_clt_approximations(self):
        chart=self.scenes[0]['blocks'][1]
        self.assertEqual([9,4.5,2.25,1.125],[d['value'] for d in chart['data']])
        for size,datum in zip((1,4,16,64),chart['data']):self.assertEqual(9/math.sqrt(size),datum['value'])
        self.assertIn('not approximations',self.scenes[0]['narration'])
        m,s=self.replay['m'],self.replay['s']
        self.assertAlmostEqual(10,math.exp(m+s*s/2),places=12)
        self.assertAlmostEqual(81,(math.exp(s*s)-1)*math.exp(2*m+s*s),places=11)

    def test_independent_reference_replay_uses_one_continuous_stream_without_reusing_samples(self):
        state=20261031
        def uniform():
            nonlocal state
            state=(state+0x6d2b79f5)&0xffffffff;t=state
            t=((t^(t>>15))*(t|1))&0xffffffff
            t^=(t+(((t^(t>>7))*(t|61))&0xffffffff))&0xffffffff
            return ((t^(t>>14))&0xffffffff)/4294967296
        m,s=self.replay['m'],self.replay['s']
        for group in self.replay['groups']:
            expected=[]
            for _ in range(5000):
                row=[math.exp(m+s*math.sqrt(-2*math.log(1-uniform()))*math.cos(2*math.pi*uniform())) for _ in range(group['n'])]
                expected.append(sum(row)/group['n'])
            self.assertEqual(5000,len(group['means']))
            for a,b in zip(expected,group['means']):self.assertAlmostEqual(a,b,places=10)
        self.assertAlmostEqual(3.6776570580960026,self.replay['groups'][0]['means'][0],places=12)
        self.assertNotAlmostEqual(5.181410018887113,self.replay['groups'][1]['means'][0],places=8)

    def test_polygons_match_published_frequencies_and_keep_all_tail_values_in_the_protocol(self):
        for group in self.replay['groups']:
            counts=[sum(i<=x<i+1 for x in group['means']) for i in range(40)]
            self.assertEqual(counts,group['counts'])
            self.assertEqual(5000,sum(counts)+group['outside'])
            points=runtime.line_series_payload(self.dataset,EX['l5-c14-poly'+str(group['n'])],'en')['data']
            self.assertEqual((0,40),(points[0]['x'],points[-1]['x']))
            for point in points:
                index=min(39,int(point['x']))
                self.assertAlmostEqual(counts[index]/5000,point['y'],places=12)
            for i,count in enumerate(counts):
                x=i+.5
                a,b=next((a,b) for a,b in zip(points,points[1:]) if a['x']<=x<=b['x'])
                interpolated=a['y']+(b['y']-a['y'])*(x-a['x'])/(b['x']-a['x'])
                self.assertAlmostEqual(count/5000,interpolated,places=12)
            area=sum((b['x']-a['x'])*(a['y']+b['y'])/2 for a,b in zip(points,points[1:]))
            self.assertAlmostEqual(1-group['outside']/5000,area,places=12)
        self.assertEqual([80,0,0,0],[g['outside'] for g in self.replay['groups']])
        self.assertGreater(max(self.replay['groups'][0]['means']),40)

    def test_raw_comparisons_keep_identical_axes_and_visible_outside_counts(self):
        first=next(b for b in self.scenes[1]['blocks'] if b['kind']=='chart')
        second=next(b for b in self.scenes[2]['blocks'] if b['kind']=='chart')
        self.assertEqual(first['xAxis'],second['xAxis']);self.assertEqual(first['yAxis'],second['yAxis'])
        self.assertEqual([0,.38],first['yDomain']);self.assertEqual(first['yDomain'],second['yDomain'])
        for chart in (first,second):
            self.assertEqual('complete',chart['presentation']);self.assertFalse(chart['showPoints'])
            self.assertEqual(2,len(chart['series']))
            self.assertTrue(all((s['data'][0]['x'],s['data'][-1]['x'])==(0,40) for s in chart['series']))
        self.assertIn('80 and 0',first['description']);self.assertIn('No renormalization',first['description'])

    def test_standardized_histogram_keeps_all_values_and_uses_unfitted_standard_normal(self):
        chart=self.scenes[3]['blocks'][1];z=self.replay['standardized']
        self.assertEqual(self.replay['zCounts'],chart['binCounts'])
        self.assertEqual(5000,sum(chart['binCounts']));self.assertEqual([],chart['data'])
        bins=runtime.histogram_bins(z,chart['edges'],'density')
        self.assertEqual([b['count'] for b in bins],chart['binCounts'])
        self.assertEqual((-6,6),(chart['edges'][0],chart['edges'][-1]))
        self.assertEqual('1',chart['xAxis']['unit']);self.assertEqual('1',chart['yAxis']['unit'])
        for mean,value in zip(self.replay['groups'][3]['means'],z):self.assertAlmostEqual(8*(mean-10)/9,value,places=12)
        for p in chart['curves'][0]['data']:self.assertAlmostEqual(math.exp(-p['x']**2/2)/math.sqrt(2*math.pi),p['y'],places=11)
        self.assertNotEqual(0,statistics.mean(z));self.assertNotEqual(1,statistics.pstdev(z))

    def test_exact_and_limit_formulas_have_separate_complete_legends(self):
        for scene in (self.scenes[0],self.scenes[3]):
            formula,legend=scene['blocks'][2:]
            resource=EX[formula['source'][0]['resourceId'].removeprefix('ex:')]
            self.assertTrue(list(self.union.objects(resource,DCTERMS.hasPart)))
            self.assertEqual(4,len(legend['entries']))
            self.assertEqual(4,len(set(self.union.objects(resource,CD.hasSymbol))))
            self.assertTrue(all(e['description'] for e in legend['entries']))
        script=self.scenes[4]['narration']
        for phrase in ('finite positive variance','no universal rule','original individual population does not change','exactly normal for every positive sample size'):
            self.assertIn(phrase,script)
