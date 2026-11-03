"""Lecture story stages are authored RDF snapshots, not sequences of UI clicks."""
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal, XSD, validate

class LectureStageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.reference=runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening')
        cls.document=runtime.compile_scene_document(cls.dataset,cls.reference)

    def test_first_six_stations_have_authored_stages_and_seventh_is_static_media(self):
        self.assertEqual([1,3,1,1,3,1],[len(s['blocks'][1]['binaryExperiment']['stages']) for s in self.document['scenes'][:6]])
        self.assertEqual('media-reference',self.document['scenes'][6]['blocks'][1]['kind'])
        for scene in self.document['scenes'][:6]:
            stages=scene['blocks'][1]['binaryExperiment']['stages']
            self.assertGreater(stages[0]['revealLevel'],0)
            for stage in stages:
                self.assertTrue(stage['prompt'])
                self.assertTrue(any(s.get('relationPath')=='cd:hasBinaryStage' for s in stage['source']))
                self.assertNotIn('click',stage['prompt'].lower())
                self.assertNotIn('?',stage['prompt'])
        for _,_,value in self.dataset.graph(BASE+'specifications/level5-lecture-stages'):
            if isinstance(value,Literal) and value.language:self.assertEqual('en',value.language)

    def test_parameter_story_is_authored_not_inferred_from_scene_identity(self):
        model=self.document['scenes'][4]['blocks'][1]['binaryExperiment']
        self.assertEqual([(10,.2),(10,.5),(100,.2)],[(s.get('trialCount',model['trialCount']),s.get('positiveProbability',model['positiveProbability'])) for s in model['stages']])
        self.assertEqual([1,1,1],[s['revealLevel'] for s in model['stages']])

    def test_compiler_and_shacl_reject_duplicate_stage_positions(self):
        dataset=rdf_dataset.assemble_dataset()
        dataset.graph(BASE+'specifications/level5-lecture-stages').set((EX['l5-b02-s1'],CD.position,Literal(1,datatype=XSD.integer)))
        with self.assertRaisesRegex(ValueError,'contiguous'):
            runtime.compile_scene_document(dataset,self.reference)
        self.assertFalse(validate(validate_semantics.dataset_union(dataset),shacl_graph=dataset.graph(BASE+'shapes/binary-experiment'),advanced=True)[0])

    def test_compiler_rejects_unreachable_formula_reveal(self):
        dataset=rdf_dataset.assemble_dataset()
        dataset.graph(BASE+'scenes/level5-binomial-workshop').set((EX['l5-b03a-math'],CD.revealAtStage,Literal(3,datatype=XSD.integer)))
        dataset.graph(BASE+'scenes/level5-binomial-workshop').set((EX['l5-b03a-math'],CD.revealOn,EX['l5-b03a-flow']))
        with self.assertRaisesRegex(ValueError,'stage count'):
            runtime.compile_scene_document(dataset,self.reference)

    def test_compiler_rejects_out_of_range_case(self):
        dataset=rdf_dataset.assemble_dataset()
        dataset.graph(BASE+'specifications/level5-lecture-stages').set((EX['l5-b06-s1'],CD.binaryCaseIndex,Literal(3,datatype=XSD.integer)))
        with self.assertRaisesRegex(ValueError,'lecture case'):
            runtime.flow_diagram_payload(dataset,EX['l5-b06-flow'],'en')
