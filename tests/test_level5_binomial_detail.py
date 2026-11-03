"""Optional binomial background reuses the shared mathematical-detail contract."""
import math
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, EX, BASE


class BinomialDetailTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(str(EX['path-level5-binomial-opening']), BASE+'paths/level5-binomial-opening'))
        cls.scene = next(s for s in cls.document['scenes'] if s['id']=='ex:l5-b03b-scene--scene')
        cls.formula = next(b for b in cls.scene['blocks'] if b['kind']=='math')
        cls.detail = cls.formula['derivationDetails'][0]

    def test_optional_detail_has_two_connected_steps_without_new_scenes(self):
        self.assertEqual(70, len(self.document['scenes']))
        self.assertEqual('ex:l5-choose-detail', self.detail['id'])
        steps = [step for section in self.detail['sections'] for step in section['steps']]
        self.assertEqual([1, 2], [s['order'] for s in steps])
        self.assertEqual(steps[0]['to']['id'], steps[1]['from']['id'])
        self.assertEqual(r'\binom{n}{k}=\frac{n!}{k!(n-k)!}', steps[0]['from']['expression'])
        self.assertTrue(steps[-1]['to']['expression'].endswith('=45'))
        self.assertEqual(45, math.comb(10, 2))
        self.assertEqual(1, math.comb(0, 0))
        self.assertTrue(all(s['source'] for s in steps))

    def test_counting_factorial_domain_and_symbols_are_authored(self):
        section = self.detail['sections'][0]
        self.assertEqual(5, len(section['legend']))
        text = ' '.join(e['description'] for e in section['legend'])
        for phrase in ('not division', 'No replacement', '0! equals one', 'dimensionless', 'whole number from zero to n'):
            self.assertIn(phrase, text)
        explanation = ' '.join(s['explanation']['text'] for s in section['steps'])
        for phrase in ('2 then 7', '7 then 2', '90 ordered pairs', 'same probability', 'independent trials'):
            self.assertIn(phrase, explanation)
        self.assertIn(r'\binom{n}{k}', self.formula['expression'])
        self.assertTrue(any(b['kind']=='definition-list' for b in self.scene['blocks']))

    def test_static_alternative_contains_the_full_background(self):
        html = runtime.static_fallback({'sceneDocuments': [{**self.document, 'scenes': [self.scene]}]})
        for phrase in ('Meaning of n choose k', '90 ordered pairs', '0! equals one', '45'):
            self.assertIn(phrase, html)
