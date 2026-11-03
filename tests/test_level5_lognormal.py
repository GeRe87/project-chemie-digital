"""L12 keeps concentration/log-ratio observations paired and population targets clear."""
import math
import statistics
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal


class LognormalLectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(str(EX['path-level5-binomial-opening']), BASE+'paths/level5-binomial-opening'))
        cls.scenes = [next(s for s in cls.document['scenes'] if s['id']==f'ex:l5-l12{suffix}-scene--scene') for suffix in 'abcd']
        cls.raw = next(b for b in cls.scenes[0]['blocks'] if b['kind']=='chart')
        cls.logged = next(b for b in cls.scenes[1]['blocks'] if b['kind']=='chart')

    def test_four_complete_scenes_follow_n11_without_new_controls_or_stages(self):
        self.assertGreaterEqual(len(self.document['scenes']),30)
        self.assertEqual(['ex:l5-l12'+s+'-scene--scene' for s in 'abcd'],[s['id'] for s in self.scenes])
        self.assertEqual('1.13',self.document['version'])
        for scene in self.scenes:
            self.assertNotIn('?',scene['narration'])
            self.assertTrue(all(b.get('disclosure',{}).get('mode')!='progressive' for b in scene['blocks']))
            self.assertFalse(any('binaryExperiment' in b for b in scene['blocks']))
        self.assertEqual(4,len(self.scenes[3]['blocks'][1]['entries']))

    def test_each_logged_observation_maps_to_the_same_original_without_resampling(self):
        raw, logged = self.raw['data'],self.logged['data']
        self.assertEqual((20,20),(len(raw),len(logged)))
        for original, transformed in zip(raw,logged):
            self.assertGreater(original['value'],0)
            self.assertAlmostEqual(math.log(original['value']),transformed['value'],places=13)
            original_id=EX[original['id'].removeprefix('ex:')]
            transformed_id=EX[transformed['id'].removeprefix('ex:')]
            self.assertEqual([original_id],list(self.union.objects(transformed_id,CD.derivedFromResource)))
        self.assertEqual(7,len(set(p['value'] for p in raw)))
        self.assertEqual(7,len(set(p['value'] for p in logged)))
        self.assertEqual('mg/L',self.raw['xAxis']['unit'])
        self.assertEqual('1',self.logged['xAxis']['unit'])
        self.assertEqual('L/mg',self.raw['yAxis']['unit'])
        self.assertEqual('1',self.logged['yAxis']['unit'])
        self.assertIn('not merely',self.scenes[1]['narration'])
        previous=next(s for s in self.document['scenes'] if s['id']=='ex:l5-n11c-scene--scene')
        previous_ids={p['id'] for p in next(b for b in previous['blocks'] if b['kind']=='chart')['data']}
        self.assertFalse(previous_ids & {p['id'] for p in raw})

    def test_both_histograms_count_all_twenty_values_and_preserve_area(self):
        counts=[]
        for chart in (self.raw,self.logged):
            self.assertEqual('histogram',chart['chartType'])
            self.assertEqual('density',chart['normalization'])
            self.assertNotIn('binAdjustment',chart)
            self.assertEqual(1,len(chart['curves']))
            bins=runtime.histogram_bins([p['value'] for p in chart['data']],chart['edges'],'density')
            counts.append([b['count'] for b in bins])
            self.assertEqual(20,sum(b['count'] for b in bins))
            self.assertAlmostEqual(1,sum((b['upper']-b['lower'])*b['height'] for b in bins),places=12)
            self.assertTrue(any(s.get('relationPath')=='dct:hasPart' for s in chart['source']))
        self.assertEqual([1,2,4,6,4,2,1],[c for c in counts[1] if c])

    def test_reference_coordinates_match_both_models_without_a_hidden_fit(self):
        m,s=math.log(2),.75
        for point in self.raw['curves'][0]['data']:
            x=point['x']
            expected=0 if x==0 else math.exp(-.5*((math.log(x)-m)/s)**2)/(x*s*math.sqrt(2*math.pi))
            self.assertAlmostEqual(expected,point['y'],places=11)
        for point in self.logged['curves'][0]['data']:
            expected=math.exp(-.5*((point['x']-m)/s)**2)/(s*math.sqrt(2*math.pi))
            self.assertAlmostEqual(expected,point['y'],places=11)
        self.assertAlmostEqual(.01593979198110751,1-statistics.NormalDist(m,s).cdf(math.log(10)),places=14)
        self.assertIn('not fitted',str(self.union.value(EX['l5-lognormal-values'],CD.body)))
        self.assertIn('not a fit',str(self.union.value(EX['l5-lognormal-log-density'],CD.body)))

    def test_population_median_geometric_mean_and_expectation_are_distinct_from_sample_mean(self):
        values=[p['value'] for p in self.raw['data']]
        geometric=math.exp(statistics.mean(math.log(v) for v in values))
        self.assertAlmostEqual(2,geometric,places=13)
        self.assertAlmostEqual(2,statistics.median(values),places=13)
        self.assertAlmostEqual(2.5898149491398517,statistics.mean(values),places=13)
        expectation=2*math.exp(.75**2/2)
        self.assertAlmostEqual(2.649569517457731,expectation,places=13)
        chart=self.scenes[2]['blocks'][1]
        self.assertEqual('complete',chart['presentation'])
        self.assertEqual([0,.4],chart['yDomain'])
        markers={a['label']:next(p['x'] for p in chart['series'][0]['data'] if p['id']==a['datumId']) for a in chart['annotations']}
        self.assertEqual(2,markers['Median'])
        self.assertAlmostEqual(expectation,markers['Mean'],places=13)
        self.assertNotAlmostEqual(expectation,statistics.mean(values),places=2)
        self.assertIn('not generally the sample arithmetic mean',self.scenes[2]['narration'])

    def test_two_formulas_keep_complete_linked_legends_including_dimensionless_logs(self):
        for scene in self.scenes[1:3]:
            formula,legend=scene['blocks'][2:]
            resource=EX[formula['source'][0]['resourceId'].removeprefix('ex:')]
            self.assertTrue(list(self.union.objects(resource,DCTERMS.hasPart)))
            self.assertEqual(4,len(legend['entries']))
            self.assertEqual(len(set(self.union.objects(resource,CD.hasSymbol))),len(legend['entries']))
            self.assertTrue(all(e['description'] for e in legend['entries']))
            self.assertIn('c_0',formula['expression'])
            self.assertNotIn('Mathematische',formula['spokenText'])
        self.assertIn('dimensionless ratio',self.scenes[1]['narration'])
        self.assertIn('converting the reference too',self.scenes[1]['narration'])

    def test_cautions_do_not_justify_zeros_or_claim_logarithms_guarantee_normality(self):
        script=self.scenes[3]['narration']
        for phrase in ('true zero','arbitrary constant','censored information','Missing observations','Mixtures','dependent observations','not a guarantee of normality','not an arithmetic mean'):
            self.assertIn(phrase,script)
        self.assertIn('not automatically lognormal',self.scenes[0]['narration'])
        self.assertIn('not the forty site values from N11',self.scenes[0]['narration'])

    def test_new_authored_text_is_english_and_static_alternatives_preserve_both_scales(self):
        for region in ('knowledge','specifications','scenes'):
            for _,_,value in self.dataset.graph(BASE+region+'/level5-lognormal'):
                if isinstance(value,Literal):
                    if value.language:self.assertEqual('en',value.language)
                    self.assertNotIn('\u2014',str(value))
                    self.assertNotIn('?',str(value))
        html=runtime.static_fallback({'sceneDocuments':[{**self.document,'scenes':self.scenes}]})
        self.assertIn('Reference curve:',html)
        self.assertIn('dimensionless log ratio',html)
        self.assertIn('2.649569517457731',html)
