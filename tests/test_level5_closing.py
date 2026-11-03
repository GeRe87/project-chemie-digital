"""E18 synthesizes the lecture without audience questions or unsupported decisions."""
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, BASE, Literal


class ClosingLectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening'))
        cls.scenes=[s for s in cls.document['scenes'] if s['id'] in ('ex:l5-e18a-scene--scene','ex:l5-e18b-scene--scene')]

    def test_two_complete_english_closing_views_follow_f17(self):
        self.assertGreaterEqual(len(self.document['scenes']),54)
        self.assertEqual(['ex:l5-e18a-scene--scene','ex:l5-e18b-scene--scene'],[s['id'] for s in self.scenes])
        for scene in self.scenes:
            self.assertEqual(['prose','definition-list'],[b['kind'] for b in scene['blocks']])
            self.assertEqual(4,len(scene['blocks'][1]['entries']))
            self.assertNotIn('?',scene['narration'])
            self.assertTrue(all(b.get('disclosure',{}).get('mode')!='progressive' for b in scene['blocks']))
        for graph in ('specifications/level5-closing','scenes/level5-closing'):
            for _,_,value in self.dataset.graph(BASE+graph):
                if isinstance(value,Literal):
                    if value.language:self.assertEqual('en',value.language)
                    self.assertNotIn('?',str(value))
                    self.assertNotIn('\u2014',str(value))

    def test_summary_keeps_mechanisms_individuals_and_statistics_distinct(self):
        script=self.scenes[0]['narration']
        for phrase in ('fixed number of independent binary trials','defined exposure','positivity and skewness alone do not establish lognormality','not individual values becoming normal','own sampling distributions','Checking model fit','remains a separate topic'):
            self.assertIn(phrase,script)

    def test_reference_example_is_explained_not_asked_or_reported_as_real_evidence(self):
        script=self.scenes[1]['narration']
        for phrase in ('five constructed nitrate','reference of 9.5','9.60735','outside that conditional interval','not evidence that real measurements satisfy','reference value may itself have uncertainty','Do not select the direction after seeing the result','No additional test decision, p value','not an interval for the water-body mean'):
            self.assertIn(phrase,script)
        cards=self.scenes[1]['blocks'][1]['entries']
        self.assertIn('sample SD',cards[0]['description'])
        self.assertIn('independence',cards[1]['description'])
        self.assertIn('iid normal',cards[2]['description'])
        self.assertIn('error rate',cards[3]['description'])

    def test_static_alternative_retains_full_explanations(self):
        html=runtime.static_fallback({'sceneDocuments':[{**self.document,'scenes':self.scenes}]})
        for phrase in ('Target and scope','Selection model','Simulated estimate: 5.18 mg/L','Model sampling SD: 4.5 mg/L','The separate laboratory example','One sample is not the water body','A conditional analytical interval','A complete investigation report'):
            self.assertIn(phrase,html)
