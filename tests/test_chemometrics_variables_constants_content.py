from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, SKOS, URIRef

ROOT = Path(__file__).resolve().parents[1]
DATASET_SPEC = importlib.util.spec_from_file_location(
    "rdf_dataset", ROOT / "scripts" / "rdf_dataset.py"
)
assert DATASET_SPEC and DATASET_SPEC.loader
RDF_DATASET = importlib.util.module_from_spec(DATASET_SPEC)
DATASET_SPEC.loader.exec_module(RDF_DATASET)

if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

import validate_semantics as VALIDATION  # noqa: E402

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
CONTENT_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-basics"
)
PATH_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/paths/chemometrics-random-variables-lecture"
)
SCENE_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/scenes/chemometrics-random-variables-lecture"
)

EXAMPLES = {
    EX["worked-example-calibration-variable-constant"],
    EX["worked-example-injection-variable-constant"],
    EX["worked-example-water-samples-variable-constant"],
}
CLASSIFICATION_EXERCISES = {
    EX["exercise-classify-calibration-concentration"],
    EX["exercise-classify-fixed-wavelength"],
    EX["exercise-classify-recorded-temperature"],
}


class ChemometricsVariablesConstantsContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.content_graph = cls.dataset.graph(CONTENT_GRAPH)
        cls.path_graph = cls.dataset.graph(PATH_GRAPH)
        cls.scene_graph = cls.dataset.graph(SCENE_GRAPH)

    def test_variable_roles_constant_and_distribution_have_exact_core_semantics(self) -> None:
        for concept in (
            EX["variable"],
            EX["independent-variable"],
            EX["dependent-variable"],
            EX["constant"],
            EX["distribution"],
        ):
            with self.subTest(concept=concept):
                self.assertEqual(
                    1,
                    len(list(self.dataset.quads((concept, RDF.type, CD.Concept, None)))),
                )
                self.assertTrue(any(self.graph.objects(concept, CD.hasDefinition)))

        self.assertEqual(
            {EX["constant"]},
            set(self.graph.objects(EX["variable"], CD.contrastsWith)),
        )
        self.assertEqual(
            {EX["variable"]},
            set(self.graph.objects(EX["constant"], CD.contrastsWith)),
        )
        self.assertEqual(
            {EX["variable"], EX["constant"]},
            set(self.graph.objects(EX["variable-constant-comparison"], CD.compares)),
        )
        comparison = str(
            next(self.graph.objects(EX["variable-constant-comparison"], CD.body))
        )
        self.assertIn("scope", comparison)
        self.assertIn("constant", comparison)
        self.assertIn("variable", comparison)

        for specialized in (
            EX["independent-variable"],
            EX["dependent-variable"],
            EX["random-variable"],
        ):
            with self.subTest(specialized=specialized):
                self.assertIn(
                    EX["variable"],
                    set(self.graph.objects(specialized, SKOS.broader)),
                )

        self.assertEqual(
            {EX["dependent-variable"]},
            set(self.graph.objects(EX["independent-variable"], CD.contrastsWith)),
        )
        self.assertEqual(
            {EX["independent-variable"]},
            set(self.graph.objects(EX["dependent-variable"], CD.contrastsWith)),
        )
        self.assertEqual(
            {EX["independent-variable"], EX["dependent-variable"]},
            set(
                self.graph.objects(
                    EX["independent-dependent-variable-comparison"], CD.compares
                )
            ),
        )
        role_interpretation = str(
            next(
                self.graph.objects(
                    EX["independent-dependent-variable-role-interpretation"], CD.body
                )
            )
        )
        self.assertIn("not intrinsic", role_interpretation)
        self.assertIn("does not mean statistically independent", role_interpretation)
        self.assertIn("does not by itself establish causality", role_interpretation)
        self.assertEqual(set(), set(self.graph.objects(EX["distribution"], CD.prerequisite)))
        distribution_note = str(
            next(self.graph.objects(EX["distribution-model-distinction"], CD.body))
        )
        self.assertIn("does not automatically have a probability distribution", distribution_note)
        self.assertIn("assigned experimental settings", distribution_note)
        self.assertIn("random variable", distribution_note)

    def test_exact_three_shared_worked_examples_cover_both_roles(self) -> None:
        self.assertEqual(EXAMPLES, set(self.graph.objects(EX["variable"], CD.hasExample)))
        self.assertEqual(EXAMPLES, set(self.graph.objects(EX["constant"], CD.hasExample)))
        self.assertEqual(EXAMPLES, set(self.graph.objects(EX["independent-variable"], CD.hasExample)))
        self.assertEqual(EXAMPLES, set(self.graph.objects(EX["dependent-variable"], CD.hasExample)))
        for example in EXAMPLES:
            with self.subTest(example=example):
                self.assertEqual({CD.WorkedExample}, set(self.graph.objects(example, RDF.type)))
                body = str(next(self.graph.objects(example, CD.body))).lower()
                self.assertIn("independent", body)
                self.assertIn("dependent", body)
                self.assertIn("constant", body)

    def test_dynamic_code_experiment_has_prose_semantics_and_executable_r(self) -> None:
        exercise = EX["exercise-variable-constant-code-experiment"]
        code = EX["code-variable-constant-r"]
        expected = EX["expected-variable-constant-code-experiment"]

        self.assertEqual({CD.Exercise}, set(self.graph.objects(exercise, RDF.type)))
        body = str(next(self.graph.objects(exercise, CD.body)))
        self.assertIn("calibration code", body)
        self.assertIn("independent variable", body)
        self.assertIn("dependent response", body)
        self.assertIn("experimental/statistical roles", body)
        self.assertEqual({code}, set(self.graph.objects(exercise, CD.hasCodeExample)))
        self.assertEqual({expected}, set(self.graph.objects(exercise, CD.hasExpectedResult)))

        self.assertEqual({CD.CodeExample}, set(self.graph.objects(code, RDF.type)))
        self.assertEqual({"r"}, {str(value) for value in self.graph.objects(code, CD.programmingLanguage)})
        self.assertEqual({Literal(True)}, set(self.graph.objects(code, CD.editable)))
        self.assertEqual({Literal(True)}, set(self.graph.objects(code, CD.executable)))
        code_text = str(next(self.graph.objects(code, CD.code)))
        self.assertIn("rnorm", code_text)
        self.assertIn("concentration_mg_L", code_text)
        self.assertIn("wavelength_nm <- 540", code_text)
        self.assertIn("absorbance", code_text)
        self.assertEqual(
            {
                EX["variable"],
                EX["independent-variable"],
                EX["dependent-variable"],
                EX["constant"],
                EX["sample"],
                EX["distribution"],
            },
            set(self.graph.objects(code, CD.showsResource)),
        )

        expected_body = str(next(self.graph.objects(expected, CD.body)))
        self.assertIn("independent variable", expected_body)
        self.assertIn("dependent response", expected_body)
        self.assertIn("sample", expected_body)
        self.assertIn("empirical variation", expected_body)

    def test_exact_three_classification_exercises_have_expected_results(self) -> None:
        variable_exercises = set(self.graph.objects(EX["variable"], CD.hasExercise))
        constant_exercises = set(self.graph.objects(EX["constant"], CD.hasExercise))
        self.assertEqual(
            CLASSIFICATION_EXERCISES | {EX["exercise-variable-constant-code-experiment"]},
            variable_exercises,
        )
        self.assertEqual(variable_exercises, constant_exercises)

        for exercise in CLASSIFICATION_EXERCISES:
            with self.subTest(exercise=exercise):
                self.assertEqual({CD.Exercise}, set(self.graph.objects(exercise, RDF.type)))
                results = set(self.graph.objects(exercise, CD.hasExpectedResult))
                self.assertEqual(1, len(results))
                result = next(iter(results))
                self.assertEqual({CD.ExpectedResult}, set(self.graph.objects(result, RDF.type)))
                self.assertTrue(str(next(self.graph.objects(result, CD.body))).strip())

    def test_sample_variable_relationship_reuses_sample_and_anchors_distribution(self) -> None:
        self.assertEqual(
            1,
            len(list(self.dataset.quads((EX["sample"], RDF.type, CD.Concept, None)))),
        )
        self.assertIn(EX["variable"], set(self.graph.objects(EX["sample"], SKOS.related)))
        self.assertIn(EX["distribution"], set(self.graph.objects(EX["sample"], SKOS.related)))
        self.assertEqual(
            {EX["sample-variable-interpretation"]},
            set(self.graph.objects(EX["sample"], CD.hasInterpretation)),
        )
        body = str(
            next(self.graph.objects(EX["sample-variable-interpretation"], CD.body))
        )
        self.assertIn("statistical sample", body)
        self.assertIn("observation or realization", body)
        self.assertIn("not the sample itself", body)

        distribution = str(next(self.graph.objects(EX["def-distribution"], CD.body)))
        self.assertIn("random variable", distribution)
        self.assertIn("Detailed distribution theory is introduced later", distribution)

    def test_learning_unit_is_variables_and_constants_with_exact_focus_set(self) -> None:
        unit = EX["learning-unit-random-variables"]
        self.assertEqual(
            {"Variables and Constants"},
            {str(value) for value in self.graph.objects(unit, SKOS.prefLabel)},
        )
        self.assertEqual(
            {
                EX["variables-and-constants"],
                EX["variable"],
                EX["independent-dependent-variable-roles"],
                EX["independent-variable"],
                EX["dependent-variable"],
                EX["constant"],
                EX["random-variable"],
                EX["sample"],
                EX["distribution"],
            },
            set(self.graph.objects(unit, CD.hasFocusConcept)),
        )

    def test_variables_and_constants_path_uses_the_accepted_resource_graph(self) -> None:
        path = EX["path-chemometrics-random-variables-lecture"]
        self.assertEqual(9, len(set(self.path_graph.objects(path, CD.hasStep))))
        self.assertEqual(
            {
                EX["variables-and-constants"],
                EX["variable"],
                EX["independent-dependent-variable-roles"],
                EX["independent-variable"],
                EX["dependent-variable"],
                EX["constant"],
                EX["sample"],
                EX["distribution"],
                EX["random-variable"],
            },
            set(self.path_graph.objects(path, CD.forTopic)),
        )
        self.assertEqual(
            9,
            len(set(self.scene_graph.subjects(RDF.type, CD.SceneDefinition))),
        )

    def test_classification_exercises_have_graph_backed_single_choice_polls(self) -> None:
        polls = {
            EX["poll-classify-calibration-concentration"]: EX["expected-classify-calibration-concentration"],
            EX["poll-classify-fixed-wavelength"]: EX["expected-classify-fixed-wavelength"],
            EX["poll-classify-recorded-temperature"]: EX["expected-classify-recorded-temperature"],
        }
        self.assertEqual(set(polls), set(self.graph.objects(EX["variable"], CD.hasAudiencePoll)))
        for poll, expected in polls.items():
            with self.subTest(poll=poll):
                self.assertEqual({CD.AudiencePoll}, set(self.graph.objects(poll, RDF.type)))
                self.assertEqual(
                    {EX["poll-option-01-variable"], EX["poll-option-02-constant"]},
                    set(self.graph.objects(poll, CD.hasPollOption)),
                )
                self.assertEqual({expected}, set(self.graph.objects(poll, CD.hasExpectedResult)))

    def test_quick_check_polls_author_correct_options_and_feedback(self) -> None:
        expected = {
            EX["poll-quiz-concentration-role"]: EX["poll-option-01-assigned-variable"],
            EX["poll-quiz-wavelength-role"]: EX["poll-option-03-constant"],
            EX["poll-quiz-absorbance-role"]: EX["poll-option-02-random-variable"],
        }
        for poll, correct in expected.items():
            with self.subTest(poll=poll):
                self.assertEqual({correct}, set(self.graph.objects(poll, CD.correctPollOption)))
                self.assertEqual(1, len(set(self.graph.objects(poll, CD.hasExpectedResult))))

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
