from __future__ import annotations

import sys
import unittest
from pathlib import Path
from statistics import geometric_mean, harmonic_mean, mean, median

from rdflib import Literal, Namespace, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import generate_canonical_runtime as RUNTIME
import rdf_dataset

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-mean-values-examples")


class MeanValuesExamplesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset(include_legacy=False)
        cls.graph = cls.dataset.graph(GRAPH)
        cls.document = RUNTIME.compile_scene_document(cls.dataset, RUNTIME.CoursePathReference(
            str(EX["path-chemometrics-mean-values-lecture"]),
            "https://w3id.org/project-chemie-digital/graph/paths/chemometrics-mean-values-lecture",
        ))

    def test_new_formulas_have_exact_english_spoken_descriptions_and_source_graph(self):
        expressions = set(self.graph.subjects(RDF.type, CD.MathExpression))
        self.assertEqual(20, len(expressions))
        math_blocks = {
            block["source"][0]["resourceId"]: block
            for scene in self.document["scenes"] for block in scene["blocks"]
            if block["kind"] == "math"
        }
        for expression in expressions:
            with self.subTest(expression=expression):
                spoken = list(self.graph.objects(expression, CD.body))
                self.assertEqual(1, len(spoken))
                self.assertEqual("en", spoken[0].language)
                resource_id = f"ex:{str(expression).removeprefix(str(EX))}"
                if expression in {EX["mean-oxygen-formula"], EX["mean-nitrate-formula"], EX["mean-iron-formula"]}:
                    # Water concentrations are now shown in a semantic table; their
                    # detailed formulas remain authored and selected by the path.
                    self.assertNotIn(resource_id, math_blocks)
                    continue
                block = math_blocks[resource_id]
                self.assertEqual(str(spoken[0]), block["spokenText"])
                self.assertEqual(str(self.graph.value(expression, CD.latex)), block["expression"])
                self.assertIn(str(GRAPH), block["source"][0]["provenanceIds"])

    def test_paired_infocards_preserve_separate_definitions_and_math(self):
        expected = {"dice-expectation": 2, "real-world": 2,
                    "growth-comparison": 2, "microbial": 2, "ratios": 2, "order": 2, "lead": 2}
        for slug, count in expected.items():
            scene = next(s for s in self.document["scenes"]
                         if s["id"] == f"ex:scene-chemometrics-mean-values-{slug}--scene")
            self.assertEqual(1 + 3 * count, len(scene["blocks"]))
            for index in range(count):
                card, formula, legend = scene["blocks"][1 + index * 3:4 + index * 3]
                self.assertEqual("definition-list", card["kind"])
                self.assertEqual("math", formula["kind"])
                self.assertNotEqual(card["source"][0]["resourceId"], formula["source"][0]["resourceId"])
                self.assertEqual("definition-list", legend["kind"])
                self.assertEqual("dct:hasPart", legend["source"][0]["relationPath"])
                self.assertEqual(formula["source"][0]["resourceId"], legend["source"][0]["resourceId"])

    def test_all_added_exercises_have_answers_and_static_prompt_projection(self):
        exercises = set(self.graph.subjects(RDF.type, CD.Exercise))
        self.assertEqual(13, len(exercises))
        prompts = {block["source"][0]["resourceId"]: block
                   for scene in self.document["scenes"] for block in scene["blocks"]
                   if block["kind"] == "prompt"}
        for exercise in exercises:
            result = self.graph.value(exercise, CD.hasExpectedResult)
            self.assertIsNotNone(result)
            answer = self.graph.value(result, CD.body)
            block = prompts[f"ex:{str(exercise).removeprefix(str(EX))}"]
            self.assertEqual(str(answer), block["expectedResult"])
            self.assertTrue(block["fallback"])
            if exercise == EX["mean-dice-sums-question"]:
                self.assertEqual(set(), set(self.graph.objects(exercise, CD.hasSource)))
            else:
                self.assertEqual({EX["source-legacy-mean-value"]}, set(self.graph.objects(exercise, CD.hasSource)))

    def test_numerical_examples_match_reviewed_results(self):
        self.assertEqual(17.5, 5 * mean(range(1, 7)))
        self.assertEqual(5.0, mean([5.2, 4.8, 5.1, 5.0, 4.9]))
        self.assertEqual(4.0, geometric_mean([2, 8]))
        self.assertEqual(1600, 100 * 4 ** 2)
        self.assertAlmostEqual(215.443469, geometric_mean([10, 100, 10000]), places=5)
        self.assertEqual(3370, mean([10, 100, 10000]))
        self.assertEqual(3.75, harmonic_mean([10, 2, 5]))
        self.assertAlmostEqual(1.99004975e-8, harmonic_mean([2e-6, 1e-8]), places=15)
        self.assertEqual(3.52, mean([0.5, 0.7, 0.6, 0.8, 15.0]))
        self.assertEqual(0.7, median([0.5, 0.7, 0.6, 0.8, 15.0]))
        for resource, expected in {
            "mean-one-die-formula": "=3.5", "mean-five-dice-formula": "=17.5",
            "mean-iron-formula": "=5.0", "mean-growth-geometric-formula": "=1600",
            "mean-microbial-geometric-formula": "215.44", "mean-lead-arithmetic-formula": "=3.52",
        }.items():
            self.assertIn(expected, str(self.graph.value(EX[resource], CD.latex)))

    def test_authored_text_contains_no_legacy_runtime_layout_or_gedankenstriche(self):
        for subject, predicate, value in self.graph:
            if isinstance(value, Literal):
                with self.subTest(subject=subject, predicate=predicate):
                    text = str(value)
                    self.assertNotIn("—", text)
                    self.assertNotIn("–", text)
                    for forbidden in ["<div", "<script", "<!--", "CodeMirror", "Reveal.", "layout={", "position={"]:
                        self.assertNotIn(forbidden, text)


if __name__ == "__main__":
    unittest.main()
