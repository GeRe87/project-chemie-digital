"""C13 publishes real reproducible Monte Carlo bin counts, not invented midpoint data."""
import json
import math
import re
import statistics
import subprocess
from rdflib.namespace import DCTERMS, RDF
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal, XSD, validate


class SamplingMeanLectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening'))
        cls.scenes=[next(s for s in cls.document['scenes'] if s['id']==f'ex:l5-c13{suffix}-scene--scene') for suffix in 'abc']
        body=str(cls.union.value(EX['l5-c13-simulation'],CD.body))
        code=re.search(r'```javascript\n(.*?)\n```',body,re.S).group(1)
        result=subprocess.run(['node','--input-type=module','-'],input=code+'\nconsole.log(JSON.stringify({run:simulate(),prefix:simulate(100),thousand:simulate(1000)}));',text=True,capture_output=True,check=True,timeout=30)
        cls.replay=json.loads(result.stdout)

    def test_three_complete_english_scenes_follow_l12(self):
        self.assertGreaterEqual(len(self.document['scenes']),33)
        self.assertEqual(['ex:l5-c13'+s+'-scene--scene' for s in 'abc'],[s['id'] for s in self.scenes])
        self.assertEqual('1.13',self.document['version'])
        for scene in self.scenes:
            self.assertNotIn('?',scene['narration'])
            self.assertTrue(all(b.get('disclosure',{}).get('mode')!='progressive' for b in scene['blocks']))
        for region in ('knowledge','specifications','scenes'):
            for _,_,value in self.dataset.graph(BASE+region+'/level5-sampling-means'):
                if isinstance(value,Literal):
                    if value.language:self.assertEqual('en',value.language)
                    self.assertNotIn('\u2014',str(value))

    def test_population_moments_and_curve_match_the_blueprint(self):
        run=self.replay['run'];m,s=run['m'],run['s']
        self.assertAlmostEqual(10,math.exp(m+s*s/2),places=12)
        self.assertAlmostEqual(81,(math.exp(s*s)-1)*math.exp(2*m+s*s),places=11)
        chart=self.scenes[0]['blocks'][1]
        for point in chart['series'][0]['data']:
            x=point['x'];expected=0 if x==0 else math.exp(-.5*((math.log(x)-m)/s)**2)/(x*s*math.sqrt(2*math.pi))
            self.assertAlmostEqual(expected,point['y'],places=11)
        self.assertIn('not the parameters',self.scenes[0]['narration'])

    def test_first_four_draws_and_mean_are_replayed_from_the_authored_protocol(self):
        run=self.replay['run'];row=run['rows'][0]
        chart=self.scenes[1]['blocks'][1]
        self.assertEqual('dot',chart['chartType'])
        self.assertEqual(4,len(chart['groups'][0]['data']))
        for datum,expected in zip(chart['groups'][0]['data'],row):self.assertAlmostEqual(expected,datum['value'],places=12)
        self.assertAlmostEqual(5.181410018887113,statistics.mean(row),places=12)
        self.assertAlmostEqual(statistics.mean(row),chart['groups'][0]['summary']['value'],places=12)
        self.assertEqual('Mean estimate',chart['summaryLabel'])
        self.assertEqual('Individual values',chart['observationLabel'])

    def test_every_mean_uses_four_new_draws_and_nested_replays_keep_the_same_prefix(self):
        run=self.replay['run']
        self.assertEqual(5000,len(run['rows']));self.assertEqual(5000,len(run['means']))
        self.assertEqual(20000,sum(len(row) for row in run['rows']))
        for row,mean in zip(run['rows'],run['means']):
            self.assertTrue(all(v>0 for v in row))
            self.assertAlmostEqual(statistics.mean(row),mean,places=12)
        self.assertEqual(run['rows'][:100],self.replay['prefix']['rows'])
        self.assertEqual(run['rows'][:1000],self.replay['thousand']['rows'])
        self.assertNotEqual(run['rows'][0],run['rows'][1])
        self.assertAlmostEqual(9.99967656233794,statistics.mean(run['means']),places=11)
        self.assertAlmostEqual(4.429316292559388,statistics.pstdev(run['means']),places=11)
        self.assertNotEqual(10,statistics.mean(run['means']))

    def test_published_bins_count_all_5000_means_without_midpoint_substitution(self):
        chart=next(b for b in self.scenes[2]['blocks'] if b['kind']=='chart')
        self.assertEqual([],chart['data'])
        self.assertNotIn('binAdjustment',chart)
        self.assertEqual(self.replay['run']['counts'],chart['binCounts'])
        bins=runtime.histogram_bins(self.replay['run']['means'],chart['edges'],'density')
        self.assertEqual([b['count'] for b in bins],chart['binCounts'])
        self.assertEqual(5000,sum(chart['binCounts']))
        self.assertAlmostEqual(1,sum(b['height']*(b['upper']-b['lower']) for b in bins),places=12)
        self.assertLess(max(self.replay['run']['means']),chart['edges'][-1])
        self.assertTrue(any(s.get('relationPath')=='cd:binCounts' for s in chart['source']))

    def test_comparison_reuses_the_unchanged_population_on_a_shared_concentration_domain(self):
        population=self.scenes[0]['blocks'][1]
        chart=next(b for b in self.scenes[2]['blocks'] if b['kind']=='chart')
        self.assertEqual(population['series'][0],chart['curves'][0])
        points=population['series'][0]['data']
        self.assertEqual([points[0]['x'],points[-1]['x']],[chart['edges'][0],chart['edges'][-1]])
        self.assertEqual((0,80),(chart['edges'][0],chart['edges'][-1]))
        self.assertEqual(population['xAxis'],chart['xAxis'])
        self.assertEqual(population['yAxis'],chart['yAxis'])
        self.assertIn('Bars:',chart['description']);self.assertIn('Line:',chart['description'])
        self.assertIn('not pooled as if they were five thousand means',self.scenes[2]['narration'])
        self.assertIn('does not establish a normal distribution',self.scenes[2]['narration'])

    def test_both_formulas_have_complete_linked_same_slide_legends(self):
        for scene in self.scenes[:2]:
            formula,legend=scene['blocks'][2:]
            resource=EX[formula['source'][0]['resourceId'].removeprefix('ex:')]
            self.assertTrue(list(self.union.objects(resource,DCTERMS.hasPart)))
            self.assertEqual(3,len(legend['entries']))
            self.assertEqual(len(set(self.union.objects(resource,CD.hasSymbol))),len(legend['entries']))
            self.assertTrue(all(e['description'] for e in legend['entries']))
            self.assertNotIn('Mathematische',formula['spokenText'])

    def test_published_count_validation_and_static_fallback_fail_closed(self):
        shape=self.dataset.graph(BASE+'shapes/histogram-published-counts')
        self.assertTrue(validate(self.union,shacl_graph=shape,advanced=True)[0])
        for value in (Literal(-1),Literal('1.5',datatype=XSD.decimal)):
            dataset=rdf_dataset.assemble_dataset()
            dataset.graph(BASE+'specifications/level5-sampling-means').set((EX['l5-c13-count-0'],RDF.first,value))
            self.assertFalse(validate(validate_semantics.dataset_union(dataset),shacl_graph=shape,advanced=True)[0])
            with self.assertRaises(ValueError):runtime.chart_payload(dataset,EX['l5-c13c-chart'],'en')
        for counts in ([0,0],[-1,1],[.5,1],[1],[9007199254740991,1]):
            with self.assertRaises(ValueError):runtime.histogram_counts(counts,[0,1,2],'density')
        html=runtime.static_fallback({'sceneDocuments':[{**self.document,'scenes':self.scenes}]})
        self.assertIn('n=5000',html);self.assertIn('not reconstructed',html);self.assertIn('Reference curve:',html)
