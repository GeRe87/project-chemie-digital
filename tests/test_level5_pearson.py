"""Pearson GOF: fixed categorical model, weighted counts and approximate calibration."""
import math
from rdflib.namespace import DCTERMS, XSD
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal


class PearsonLectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening'))
        cls.scenes=[next(s for s in cls.document['scenes'] if s['id']==f'ex:l5-p20{suffix}-scene--scene') for suffix in 'abcde']
        cls.protocol=str(cls.union.value(EX['l5-p20-protocol'],CD.body))

    def test_five_complete_english_views_follow_ks_and_precede_closing(self):
        self.assertEqual(['ex:l5-p20'+s+'-scene--scene' for s in 'abcde'],[s['id'] for s in self.scenes])
        first=self.document['scenes'].index(self.scenes[0])
        last=self.document['scenes'].index(self.scenes[-1])
        self.assertEqual('ex:l5-g19e-scene--scene',self.document['scenes'][first-1]['id'])
        self.assertEqual('ex:l5-e18a-scene--scene',self.document['scenes'][last+1]['id'])
        for scene in self.scenes:
            self.assertNotIn('?',scene['narration'])
            self.assertTrue(all(b.get('disclosure',{}).get('mode')!='progressive' for b in scene['blocks']))
        for graph in ('knowledge/level5-pearson','specifications/level5-pearson','specifications/level5-pearson-data','scenes/level5-pearson'):
            for _,_,value in self.dataset.graph(BASE+graph):
                if isinstance(value,Literal):
                    if value.language:self.assertEqual('en',value.language)
                    self.assertNotIn('\u2014',str(value))

    def test_grouped_observed_and_expected_counts_keep_the_same_total_and_order(self):
        chart=self.scenes[0]['blocks'][1]
        self.assertEqual('complete',chart['presentation'])
        observed=chart['data'][::2];expected=chart['data'][1::2]
        self.assertEqual([4,12,44,24,16],[p['value'] for p in observed])
        self.assertEqual([10,20,40,20,10],[p['value'] for p in expected])
        self.assertEqual([p['group'] for p in observed],[p['group'] for p in expected])
        self.assertEqual(['Observed']*5,[p['category'] for p in observed])
        self.assertEqual(['Expected']*5,[p['category'] for p in expected])
        self.assertEqual(100,sum(p['value'] for p in observed))
        self.assertEqual(100,sum(p['value'] for p in expected))
        for p,datum in zip((.1,.2,.4,.2,.1),expected):self.assertEqual(100*p,datum['value'])
        self.assertGreaterEqual(min(p['value'] for p in expected),10)
        self.assertLess(min(p['value'] for p in observed),5)
        self.assertIn('All particles retained',chart['description'])
        self.assertIn('[40,infinity)',self.protocol)
        self.assertIn('5 belongs to the second band',self.protocol)
        for prefix,count in (('o',5),('e',5),('c',5)):
            for i in range(1,count+1):
                value=self.union.value(EX['l5-p20-'+prefix+str(i)],CD.numericValue)
                self.assertEqual(XSD.decimal,value.datatype)

    def test_each_contribution_and_total_are_recomputed(self):
        counts=self.scenes[0]['blocks'][1]['data'];contributions=self.scenes[1]['blocks'][1]['data']
        for observed,expected,result in zip(counts[::2],counts[1::2],contributions):
            self.assertAlmostEqual((observed['value']-expected['value'])**2/expected['value'],result['value'],places=12)
            self.assertEqual(observed['group'],result['category'])
        self.assertAlmostEqual(11.6,sum(p['value'] for p in contributions),places=12)
        self.assertIn('Zero observed counts would still contribute',self.protocol)
        self.assertIn('not a denominator to divide by',self.protocol)

    def test_df_is_categories_minus_one_not_observations_minus_one(self):
        self.assertIn('k-1=4',str(self.union.value(EX['l5-p20c-formula'],CD.latex)))
        script=self.scenes[2]['narration']
        self.assertIn('not total observations minus one',script)
        self.assertIn('not the observed first count of four',script)
        self.assertIn('its role here is approximate',script)
        curve=self.scenes[2]['blocks'][1]
        self.assertEqual([0,.2],curve['yDomain'])
        self.assertFalse(curve['showPoints'])
        self.assertEqual(runtime.line_series_payload(self.dataset,EX['l5-t16-chi4'],'en')['data'],curve['series'][0]['data'])

    def test_reference_cutoff_and_approximate_p_are_independently_integrated(self):
        cutoff=9.487729036781154;q=11.6
        sf=lambda x:math.exp(-x/2)*(1+x/2)
        self.assertAlmostEqual(.05,sf(cutoff),places=13)
        self.assertAlmostEqual(.020587372268555542,sf(q),places=14)
        # Simpson integration of the chi-square-four density is independent of
        # the survival expression and concerns the reference, not exact counts.
        for x in (cutoff,q):
            intervals=10000;h=x/intervals
            density=lambda t:t*math.exp(-t/2)/4
            cdf=(density(0)+density(x)+sum((4 if i%2 else 2)*density(i*h) for i in range(1,intervals)))*h/3
            self.assertAlmostEqual(1-sf(x),cdf,places=11)
        self.assertGreater(q,cutoff)
        self.assertIn('not an exact multinomial p value',self.scenes[3]['narration'])
        self.assertIn('reject this fully specified set',self.scenes[3]['narration'])
        self.assertIn('not the probability that the null is true or false',self.scenes[3]['narration'])

    def test_fitting_binning_dependence_and_ks_distinction_are_explicit(self):
        script=self.scenes[4]['narration']
        for phrase in ('Expected counts','not a theorem guaranteeing','grouped multinomial likelihood','does not automatically justify','category-selection process','zero observed counts','retain the tails','Dependence','cannot reconstruct the unbinned KS statistic','Neither test proves model truth'):
            self.assertIn(phrase,script)

    def test_three_formulas_have_complete_separate_same_slide_legends(self):
        for scene,count in zip(self.scenes[:3],(4,4,3)):
            formula,legend=scene['blocks'][2:]
            resource=EX[formula['source'][0]['resourceId'].removeprefix('ex:')]
            self.assertTrue(list(self.union.objects(resource,DCTERMS.hasPart)))
            self.assertEqual(count,len(legend['entries']))
            self.assertEqual(count,len(set(self.union.objects(resource,CD.hasSymbol))))
            self.assertTrue(all(e['description'] for e in legend['entries']))
        html=runtime.static_fallback({'sceneDocuments':[{**self.document,'scenes':self.scenes}]})
        for phrase in ('11.6','9.487729','0.0206','Observed','Expected','Expected counts matter'):
            self.assertIn(phrase,html)
