from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

DATASET_SPEC = importlib.util.spec_from_file_location("rdf_dataset", SCRIPTS / "rdf_dataset.py")
assert DATASET_SPEC and DATASET_SPEC.loader
RDF_DATASET = importlib.util.module_from_spec(DATASET_SPEC)
DATASET_SPEC.loader.exec_module(RDF_DATASET)

VALIDATION_SPEC = importlib.util.spec_from_file_location("validate_semantics", SCRIPTS / "validate_semantics.py")
assert VALIDATION_SPEC and VALIDATION_SPEC.loader
VALIDATION = importlib.util.module_from_spec(VALIDATION_SPEC)
VALIDATION_SPEC.loader.exec_module(VALIDATION)

from course_path_selection import CoursePathReference, CourseUnitPathSelectionRequest, select_course_unit_path  # noqa: E402

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
PATH = EX["path-chemometrics-mean-values-lecture"]
PATH_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/paths/chemometrics-mean-values-lecture")
CONTENT_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-basics")
COURSE_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/specifications/course-scale")

EXPECTED_TOPICS = {
    EX["arithmetic-mean"], EX["expected-value"], EX["law-of-large-numbers"],
    EX["geometric-mean"], EX["harmonic-mean"], EX["median"],
}

EXPECTED_STEPS = {
    EX["path-step-chemometrics-mean-values-arithmetic-mean"]: (1, {EX["arithmetic-mean-formula"], EX["arithmetic-mean-applicability-interpretation"]}),
    EX["path-step-chemometrics-mean-values-expected-value"]: (2, {EX["def-expected-value"], EX["discrete-expected-value-formula"], EX["sample-mean-estimator-interpretation"]}),
    EX["path-step-chemometrics-mean-values-law-of-large-numbers"]: (3, {EX["def-law-of-large-numbers"], EX["lln-not-standard-error-interpretation"]}),
    EX["path-step-chemometrics-mean-values-geometric-mean"]: (4, {EX["def-geometric-mean"], EX["geometric-mean-product-formula"], EX["geometric-mean-log-formula"], EX["geometric-mean-applicability-interpretation"], EX["worked-example-multiplicative-growth"]}),
    EX["path-step-chemometrics-mean-values-geometric-practice"]: (5, {EX["exercise-geometric-growth-factors"]}),
    EX["path-step-chemometrics-mean-values-harmonic-mean"]: (6, {EX["worked-example-equal-distance-speed"], EX["def-harmonic-mean"], EX["harmonic-mean-formula"], EX["harmonic-mean-rate-interpretation"]}),
    EX["path-step-chemometrics-mean-values-median"]: (7, {EX["worked-example-turbidity-median"], EX["def-median"], EX["sample-median-formula"], EX["median-robustness-interpretation"]}),
    EX["path-step-chemometrics-mean-values-median-practice"]: (8, {EX["exercise-mean-median-outlier"]}),
}

EXPECTED_SCENES = {
    EX["path-step-chemometrics-mean-values-arithmetic-mean"]: EX["scene-chemometrics-mean-values-arithmetic-mean"],
    EX["path-step-chemometrics-mean-values-expected-value"]: EX["scene-chemometrics-mean-values-expected-value"],
    EX["path-step-chemometrics-mean-values-law-of-large-numbers"]: EX["scene-chemometrics-mean-values-law-of-large-numbers"],
    EX["path-step-chemometrics-mean-values-geometric-mean"]: EX["scene-chemometrics-mean-values-geometric-mean"],
    EX["path-step-chemometrics-mean-values-geometric-practice"]: EX["scene-chemometrics-mean-values-geometric-practice"],
    EX["path-step-chemometrics-mean-values-harmonic-mean"]: EX["scene-chemometrics-mean-values-harmonic-mean"],
    EX["path-step-chemometrics-mean-values-median"]: EX["scene-chemometrics-mean-values-median"],
    EX["path-step-chemometrics-mean-values-median-practice"]: EX["scene-chemometrics-mean-values-median-practice"],
}


class ChemometricsMeanValuesPathTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.path_graph = cls.dataset.graph(PATH_GRAPH)
        cls.content_graph = cls.dataset.graph(CONTENT_GRAPH)
        cls.course_graph = cls.dataset.graph(COURSE_GRAPH)

    def test_exact_path_identity_and_same_graph_course_context(self) -> None:
        self.assertEqual({PATH}, set(self.path_graph.subjects(RDF.type, CD.LearningPath)))
        self.assertEqual({EX["learning-unit-mean-values"]}, set(self.path_graph.objects(PATH, CD.forLearningUnit)))
        self.assertEqual({Literal(True)}, set(self.path_graph.objects(PATH, CD.authoredResource)))

    def test_topics_are_exactly_the_unordered_learning_unit_focus_set(self) -> None:
        path_topics = set(self.path_graph.objects(PATH, CD.forTopic))
        unit_topics = set(self.course_graph.objects(EX["learning-unit-mean-values"], CD.hasFocusConcept))
        self.assertEqual(EXPECTED_TOPICS, path_topics)
        self.assertEqual(EXPECTED_TOPICS, unit_topics)
        self.assertEqual(unit_topics, path_topics)

    def test_path_has_exactly_eight_stable_steps_with_contiguous_positions(self) -> None:
        steps = set(self.path_graph.objects(PATH, CD.hasStep))
        self.assertEqual(set(EXPECTED_STEPS), steps)
        positions = []
        for step, (expected_position, _resources) in EXPECTED_STEPS.items():
            self.assertEqual({CD.PathStep}, set(self.path_graph.objects(step, RDF.type)))
            values = set(self.path_graph.objects(step, CD.position))
            self.assertEqual({Literal(expected_position)}, values)
            positions.extend(int(value) for value in values)
        self.assertEqual(list(range(1, 9)), sorted(positions))

    def test_each_step_preserves_reviewed_resources_and_gains_exact_scene(self) -> None:
        for step, (_position, expected_resources) in EXPECTED_STEPS.items():
            with self.subTest(step=step):
                self.assertEqual(expected_resources, set(self.path_graph.objects(step, CD.usesResource)))
                self.assertEqual({EXPECTED_SCENES[step]}, set(self.path_graph.objects(step, CD.usesScene)))
                for resource in expected_resources:
                    self.assertTrue(any(self.content_graph.triples((resource, None, None))))
                    self.assertIn(Literal(True), set(self.graph.objects(resource, CD.authoredResource)))

    def test_path_graph_authors_only_path_and_path_step_identities(self) -> None:
        typed = {(s, o) for s, _p, o in self.path_graph.triples((None, RDF.type, None))}
        expected_typed = {(PATH, CD.LearningPath)} | {(step, CD.PathStep) for step in EXPECTED_STEPS}
        self.assertEqual(expected_typed, typed)
        self.assertEqual([], list(self.path_graph.triples((None, RDF.type, CD.SceneDefinition))))
        self.assertEqual([], list(self.path_graph.triples((None, RDF.type, CD.SceneItem))))
        self.assertEqual([], list(self.path_graph.triples((None, CD.body, None))))

    def test_course_discovery_exposes_exact_mean_values_path_reference(self) -> None:
        selection = select_course_unit_path(
            self.dataset,
            CourseUnitPathSelectionRequest(
                offering_id=str(EX["teaching-offering-chemometrics-applied-statistics"]),
                placement_id=str(EX["unit-placement-chemometrics-mean-values"]),
                unit_id=str(EX["learning-unit-mean-values"]),
            ),
        )
        self.assertEqual(CoursePathReference(str(PATH), str(PATH_GRAPH)), selection.path)

    def test_random_variables_path_and_scenes_remain_present_and_variance_stays_pathless(self) -> None:
        self.assertEqual({EX["path-chemometrics-random-variables-lecture"]}, set(self.graph.subjects(CD.forLearningUnit, EX["learning-unit-random-variables"])))
        random_steps = set(self.graph.objects(EX["path-chemometrics-random-variables-lecture"], CD.hasStep))
        self.assertEqual(5, len(random_steps))
        for step in random_steps:
            self.assertEqual(1, len(set(self.graph.objects(step, CD.usesScene))))
        self.assertEqual(set(), set(self.graph.subjects(CD.forLearningUnit, EX["learning-unit-variance-dispersion"])))

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
