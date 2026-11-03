"""Concrete chemistry stories precede model notation without replacing mathematics."""
from rdflib import URIRef
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, EX, CD, BASE


class DistributionStoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.reference=runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening')
        cls.document=runtime.compile_scene_document(cls.dataset,cls.reference)
        cls.by_id={s['id']:s for s in cls.document['scenes']}

    def scene(self,name):
        return self.by_id[f'ex:l5-{name}-scene--scene']

    def test_six_insertions_precede_original_model_scenes(self):
        scenes=self.document['scenes']
        self.assertEqual(70,len(scenes))
        for position,story,model,topic in (
            (17,'n09-story1','n09-story2','Continuous models · Normal'),
            (18,'n09-story2','n09a','Continuous models · Normal'),
            (29,'l12-story','l12a','Continuous models · Lognormal'),
            (46,'t16-variance-story','t16a','Sampling · Chi-square'),
            (49,'t16-mean-story','t16c','Sampling · Student-t'),
            (55,'f17-story','f17a','Sampling · F distribution')):
            self.assertEqual(self.scene(story),scenes[position-1])
            self.assertEqual(self.scene(model),scenes[position])
            self.assertEqual(topic,self.scene(story)['topic']['label'])

    def test_stories_are_formula_free_direct_explanations_with_english_provenance(self):
        stories=[s for s in self.document['scenes'] if '-story' in s['id']]
        self.assertEqual(6,len(stories))
        for scene in stories:
            self.assertTrue(scene['narration'])
            self.assertNotIn('—',scene['narration'])
            self.assertNotIn('?',scene['narration'])
            for block in scene['blocks']:
                self.assertNotIn(block['kind'],('math','prompt','group'))
                self.assertEqual('initial',block.get('disclosure',{}).get('mode','initial'))
                self.assertTrue(block['source'])
                if block['kind']=='chart':
                    self.assertFalse(block.get('interactive',False))
                    if block['chartType']=='bar':self.assertEqual('complete',block['presentation'])
            self.assertTrue(all('topic' in s for s in stories))

    def test_nitrate_stories_reuse_existing_readings_and_mean(self):
        original=self.scene('s15a')['blocks'][1]
        for name in ('n09-story1','t16-mean-story'):
            chart=self.scene(name)['blocks'][1]
            self.assertEqual(original['groups'][0]['data'],chart['groups'][0]['data'])
            for key in ('id','value'):
                self.assertEqual(original['groups'][0]['summary'][key],chart['groups'][0]['summary'][key])
            self.assertIn('ex:l5-s15-mean',[ref['resourceId'] for ref in chart['groups'][0]['summary']['source']])
        self.assertIn('not an SD inferred',self.scene('n09-story2')['narration'])
        self.assertIn('population SD is not supplied as known',self.scene('t16-mean-story')['narration'])

    def test_variance_and_method_stories_reuse_original_data(self):
        self.assertEqual(self.scene('t16a')['blocks'][1]['data'],self.scene('t16-variance-story')['blocks'][1]['data'])
        self.assertEqual(self.scene('f17a')['blocks'][1]['data'],self.scene('f17-story')['blocks'][1]['data'])
        self.assertIn('do not invent',self.scene('f17-story')['narration'])
        self.assertIn('not selected extremes or measured laboratory evidence',self.scene('t16-variance-story')['narration'])

    def test_factor_story_is_a_constructed_illustration_not_new_evidence(self):
        chart=self.scene('l12-story')['blocks'][1]
        self.assertEqual([1,2,4],[d['value'] for d in chart['data']])
        self.assertIn('deterministic scenarios',self.scene('l12-story')['narration'])
        self.assertIn('not sampled sites',self.scene('l12-story')['narration'])

    def test_removing_only_story_steps_restores_original_order_and_content(self):
        dataset=rdf_dataset.assemble_dataset()
        path=dataset.graph(URIRef(BASE+'paths/level5-binomial-opening'))
        steps=sorted(path.objects(EX['path-level5-binomial-opening'],CD.hasStep),key=lambda step:int(path.value(step,CD.position)))
        originals=[step for step in steps if '-story' not in str(step)]
        from rdflib import Literal
        for step in steps:
            if step not in originals:path.remove((EX['path-level5-binomial-opening'],CD.hasStep,step))
        for position,step in enumerate(originals,1):path.set((step,CD.position,Literal(position)))
        baseline=runtime.compile_scene_document(dataset,self.reference)
        current=[s for s in self.document['scenes'] if '-story' not in s['id']]
        self.assertEqual(64,len(baseline['scenes']))
        for before,after in zip(baseline['scenes'],current):
            for key in ('id','blocks','readingOrder','narration','topic'):
                self.assertEqual(before.get(key),after.get(key))
