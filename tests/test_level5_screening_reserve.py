"""Optional V01/V02 reserve: true state, findings and conditional denominators."""
from rdflib.namespace import DCTERMS, XSD
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal


class ScreeningReserveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX['path-level5-screening-reserve']),BASE+'paths/level5-screening-reserve'))
        cls.scenes=cls.document['scenes'][:3]

    def test_three_complete_english_optional_views(self):
        self.assertEqual(['ex:l5-v01-scene--scene','ex:l5-v02a-scene--scene','ex:l5-v02b-scene--scene'],[s['id'] for s in self.scenes])
        for scene in self.scenes:
            self.assertNotIn('?',scene['narration'])
            self.assertTrue(all(b.get('disclosure',{}).get('mode')!='progressive' for b in scene['blocks']))
        for graph in ('knowledge/level5-screening-reserve','specifications/level5-screening-reserve','scenes/level5-screening-reserve'):
            for _,_,value in self.dataset.graph(BASE+graph):
                if isinstance(value,Literal):
                    if value.language:self.assertEqual('en',value.language)
                    self.assertNotIn('?',str(value))
                    self.assertNotIn('\u2014',str(value))

    def test_main_lecture_has_70_scenes_and_reserve_is_separately_selectable(self):
        main=runtime.compile_scene_document(self.dataset,runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening'))
        self.assertEqual(70,len(main['scenes']))
        self.assertTrue(set(s['id'] for s in main['scenes']).isdisjoint(s['id'] for s in self.scenes))
        selection=runtime.select_course_unit_path(self.dataset,runtime.CourseUnitPathSelectionRequest(
            offering_id=str(EX['offering-level5-screening-reserve']),placement_id=str(EX['placement-level5-screening-reserve']),
            unit_id=str(EX['unit-level5-screening-reserve']),requested_path_id=str(EX['path-level5-screening-reserve']),
            requested_path_graph_id=BASE+'paths/level5-screening-reserve'))
        self.assertEqual(str(EX['path-level5-screening-reserve']),selection.path.path_id)

    def test_true_state_signal_and_decision_are_separate(self):
        cards=self.scenes[0]['blocks'][1]['entries']
        self.assertEqual(['True state','Analytical signal','Binary finding'],[e['term'] for e in cards])
        script=self.scenes[0]['narration']
        for phrase in ('different definitions of positivity','negative does not prove absence','suitable reference standard','No legal safety limit','fixed concentration','do not create new independently sampled environmental units'):
            self.assertIn(phrase,script)

    def test_mixture_calculation_does_not_equate_positivity_with_prevalence(self):
        prevalence,sensitivity,fpr=.01,.90,.05
        q=prevalence*sensitivity+(1-prevalence)*fpr
        self.assertAlmostEqual(.0585,q,places=12)
        chart=self.scenes[1]['blocks'][1]
        self.assertEqual('complete',chart['presentation'])
        self.assertEqual('%',chart['yAxis']['unit'])
        for expected,datum in zip((100*prevalence,100*q),chart['data']):
            self.assertAlmostEqual(expected,datum['value'],places=12)
        for name in ('prevalence-percent','positive-percent'):
            self.assertEqual(XSD.decimal,self.union.value(EX['l5-v02-'+name],CD.numericValue).datatype)
        script=self.scenes[1]['narration']
        for phrase in ('do not share a denominator','probabilities from zero to one','chart expresses them as percentages','binomial model','independent units with common positive-result probability'):
            self.assertIn(phrase,script)

    def test_expected_confusion_counts_preserve_both_group_totals(self):
        n=10000;prevalence=.01;sensitivity=.90;fpr=.05
        tp=n*prevalence*sensitivity;fn=n*prevalence*(1-sensitivity)
        fp=n*(1-prevalence)*fpr;tn=n*(1-prevalence)*(1-fpr)
        for actual,expected in zip((tp,fn,fp,tn),(90,10,495,9405)):self.assertAlmostEqual(actual,expected,places=10)
        self.assertAlmostEqual(n,tp+fn+fp+tn,places=10)
        self.assertAlmostEqual(100,tp+fn,places=10)
        self.assertAlmostEqual(9900,fp+tn,places=10)
        self.assertAlmostEqual(585,tp+fp,places=10)
        self.assertAlmostEqual(15.384615384615385,100*tp/(tp+fp),places=12)
        cards=self.scenes[2]['blocks'][1]['entries']
        for entry,value in zip(cards,('90','10','495','9,405')):self.assertIn(value,entry['term'])
        script=self.scenes[2]['narration']
        self.assertIn('model expectations, not observed counts or a guaranteed allocation',script)
        self.assertIn('do not confuse that denominator with sensitivity',script)

    def test_formula_has_complete_separate_same_slide_legend(self):
        formula,legend=self.scenes[1]['blocks'][2:]
        resource=EX[formula['source'][0]['resourceId'].removeprefix('ex:')]
        self.assertTrue(list(self.union.objects(resource,DCTERMS.hasPart)))
        self.assertEqual(4,len(legend['entries']))
        self.assertEqual(4,len(set(self.union.objects(resource,CD.hasSymbol))))
        self.assertTrue(all(e['description'] for e in legend['entries']))
        self.assertIn('not the circle constant',str(self.union.value(EX['l5-v02a-prevalence'],CD.body)))

    def test_static_alternatives_retain_numbers_and_model_status(self):
        html=runtime.static_fallback({'sceneDocuments':[{**self.document,'scenes':self.scenes}]})
        for phrase in ('True state','Analytical signal','Binary finding','5.85','Teaching assumptions','495','9,405','expected'):
            self.assertIn(phrase,html)
