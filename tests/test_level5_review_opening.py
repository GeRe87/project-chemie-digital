"""First compact-review increment: six visible slides including the title."""
import re
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal, XSD, validate


class ReviewOpeningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(
            str(EX['path-level5-review-opening']), BASE+'paths/level5-review-opening'))

    def test_five_content_scenes_plus_renderer_title_not_a_false_66_slide_claim(self):
        self.assertEqual([f'ex:rv-n0{i}--scene' for i in range(2, 7)], [s['id'] for s in self.document['scenes']])
        for scene in self.document['scenes']:
            self.assertTrue(scene['narration'])
            self.assertTrue(list(self.union.objects(EX[scene['id'].split(':')[1].removesuffix('--scene')], DCTERMS.references)))
        old = runtime.compile_scene_document(self.dataset, runtime.CoursePathReference(
            str(EX['path-level5-multiplicative-story-tf']), BASE+'paths/level5-multiplicative-story-tf'))
        self.assertEqual(111, len(old['scenes']))

    def test_same_data_and_explicit_open_lower_closed_upper_interval(self):
        scene = self.document['scenes'][3]
        chart = next(b for b in scene['blocks'] if b['kind'] == 'chart')
        values = [d['value'] for d in chart['series'][0]['data']]
        self.assertEqual(20, len(values))
        self.assertEqual({'minimum': 9.4, 'maximum': 10.6, 'initial': 10.2, 'step': .05, 'lowerInitial': 9.8}, chart['threshold'])
        self.assertEqual(15, sum(v <= 10.2 for v in values))
        self.assertEqual(4, sum(v <= 9.8 for v in values))
        self.assertEqual(11, sum(9.8 < v <= 10.2 for v in values))
        self.assertEqual(7, sum(v <= 9.9 for v in values))  # both ties enter

    def test_r_is_optional_but_preserved_and_matches_the_shared_observations(self):
        for scene in self.document['scenes'][3:]:
            code = next(b for b in scene['blocks'] if b['kind'] == 'code')
            self.assertEqual('optional', code['disclosure']['mode'])
            self.assertTrue(code['editable'] and code['executable'])
            values = [float(x) for x in re.search(r'x <- c\((.*?)\)', code['fallback'], re.S)[1].split(',')]
            expected = [float(next(self.union.objects(EX[f'cf-x{i:02}'], CD.numericValue))) for i in range(1, 21)]
            self.assertEqual(expected, values)
            orders = [b['disclosure']['order'] for b in scene['blocks'] if 'disclosure' in b]
            self.assertEqual(len(orders), len(set(orders)))
            glossary = next(b for b in scene['blocks'] if b['kind'] == 'definition-list')
            self.assertEqual('optional', glossary['disclosure']['mode'])
        self.assertIn("'\\n'", next(b for b in self.document['scenes'][3]['blocks'] if b['kind'] == 'code')['fallback'])

    def test_targeted_shacl_shapes_validate_and_reject_invalid_optional_metadata(self):
        for name in ('optional-code', 'exploration-options'):
            conforms, _, report = validate(self.union, shacl_graph=self.dataset.graph(BASE+'shapes/'+name), inference='none')
            self.assertTrue(conforms, report)
        broken = validate_semantics.dataset_union(self.dataset)
        broken.set((EX['rv-n05-v'], CD.optionalCode, Literal(True)))
        conforms, _, _ = validate(broken, shacl_graph=self.dataset.graph(BASE+'shapes/optional-code'), inference='none')
        self.assertFalse(conforms)

    def test_density_preserves_all_observations_and_representative_numeric_result(self):
        chart = next(b for b in self.document['scenes'][4]['blocks'] if b['kind'] == 'chart')
        self.assertEqual('density', chart['normalization'])
        self.assertEqual(20, len(chart['data']))
        self.assertEqual({'minimumWidth': .05, 'maximumWidth': .4, 'widthStep': .05}, chart['binAdjustment'])
        values = [d['value'] for d in chart['data']]
        self.assertEqual(7, sum(9.9 <= v < 10.1 for v in values))
        self.assertAlmostEqual(1.75, 7/20/.2)

    def test_invalid_lower_threshold_and_optional_non_code_fail_closed(self):
        graph = self.dataset.graph(BASE+'knowledge/level5-review-opening')
        old = next(graph.objects(EX['rv-interval'], CD.lowerThresholdInitial))
        try:
            graph.set((EX['rv-interval'], CD.lowerThresholdInitial, Literal('10.3', datatype=XSD.decimal)))
            with self.assertRaisesRegex(ValueError, 'Lower threshold'):
                runtime.compile_scene_document(self.dataset, runtime.CoursePathReference(str(EX['path-level5-review-opening']), BASE+'paths/level5-review-opening'))
        finally:
            graph.set((EX['rv-interval'], CD.lowerThresholdInitial, old))
        scenes = self.dataset.graph(BASE+'scenes/level5-review-opening')
        try:
            scenes.add((EX['rv-n05-v'], CD.optionalCode, Literal(True)))
            with self.assertRaisesRegex(ValueError, 'Optional code'):
                runtime.compile_scene_document(self.dataset, runtime.CoursePathReference(str(EX['path-level5-review-opening']), BASE+'paths/level5-review-opening'))
        finally:
            scenes.remove((EX['rv-n05-v'], CD.optionalCode, None))


if __name__ == '__main__':
    unittest.main()
