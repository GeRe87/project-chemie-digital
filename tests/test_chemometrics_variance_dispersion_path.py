from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

DATASET_SPEC = importlib.util.spec_from_file_location(
    "rdf_dataset", SCRIPTS / "rdf_dataset.py"
)
assert DATASET_SPEC and DATASET_SPEC.loader
RDF_DATASET = importlib.util.module_from_spec(DATASET_SPEC)
DATASET_SPEC.loader.exec_module(RDF_DATASET)

if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import validate_semantics as VALIDATION  # noqa: E402

from course_path_selection import (  # noqa: E402
    CoursePathReference,
    CourseUnitPathSelectionRequest,
    select_course_unit_path,
)

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
PATH = EX["path-chemometrics-variance-dispersion-lecture"]
PATH_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/paths/chemometrics-variance-dispersion-lecture"
)
COURSE_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/specifications/course-scale"
)

EXPECTED_TOPICS = {
    EX["variance"],
    EX["standard-deviation"],
    EX["standard-error"],
    EX["relative-standard-deviation"],
}

EXPECTED_STEPS = {
    EX["path-step-chemometrics-variance-dispersion-variance"]: (
        1,
        {
            EX["population-variance-formula"],
            EX["sample-variance-formula"],
            EX["variance-unit-rule"],
        },
    ),
    EX["path-step-chemometrics-variance-dispersion-standard-deviation"]: (
        2,
        {
            EX["sd-definition-university-en"],
            EX["sample-sd-formula"],
            EX["population-sd-formula"],
            EX["sd-unit-rule"],
            EX["normal-empirical-rule-interpretation"],
        },
    ),
    EX["path-step-chemometrics-variance-dispersion-bessel"]: (
        3,
        {
            EX["sample"],
            EX["population"],
            EX["sample-variance"],
            EX["population-variance"],
            EX["n-minus-one"],
            EX["degrees-of-freedom"],
        },
    ),
    EX["path-step-chemometrics-variance-dispersion-standard-error"]: (
        4,
        {
            EX["sem-population-formula"],
            EX["sem-estimated-formula"],
            EX["sem-scope-interpretation"],
        },
    ),
    EX["path-step-chemometrics-variance-dispersion-rsd"]: (
        5,
        {
            EX["relative-standard-deviation-formula"],
            EX["relative-standard-deviation-scope-interpretation"],
        },
    ),
    EX["path-step-chemometrics-variance-dispersion-practice"]: (
        6,
        {EX["exercise-summary-statistics-r"]},
    ),
}


class ChemometricsVarianceDispersionPathTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.path_graph = cls.dataset.graph(PATH_GRAPH)
        cls.course_graph = cls.dataset.graph(COURSE_GRAPH)

    def test_exact_path_identity_and_same_graph_course_context(self) -> None:
        self.assertEqual({PATH}, set(self.path_graph.subjects(RDF.type, CD.LearningPath)))
        self.assertEqual(
            {EX["learning-unit-variance-dispersion"]},
            set(self.path_graph.objects(PATH, CD.forLearningUnit)),
        )
        self.assertEqual(
            {Literal("Chemometrics Variance and Dispersion lecture path", lang="en")},
            set(self.path_graph.objects(PATH, Namespace("http://www.w3.org/2004/02/skos/core#").prefLabel)),
        )
        self.assertEqual(
            {Literal(True)},
            set(self.path_graph.objects(PATH, CD.authoredResource)),
        )

    def test_topics_are_exactly_the_unordered_learning_unit_focus_set(self) -> None:
        path_topics = set(self.path_graph.objects(PATH, CD.forTopic))
        unit_topics = set(
            self.course_graph.objects(
                EX["learning-unit-variance-dispersion"],
                CD.hasFocusConcept,
            )
        )
        self.assertEqual(EXPECTED_TOPICS, path_topics)
        self.assertEqual(EXPECTED_TOPICS, unit_topics)
        self.assertEqual(unit_topics, path_topics)

    def test_path_has_exactly_six_stable_steps_with_contiguous_positions(self) -> None:
        steps = set(self.path_graph.objects(PATH, CD.hasStep))
        self.assertEqual(set(EXPECTED_STEPS), steps)

        positions = []
        for step, (expected_position, _resources) in EXPECTED_STEPS.items():
            with self.subTest(step=step):
                self.assertEqual({CD.PathStep}, set(self.path_graph.objects(step, RDF.type)))
                position_values = set(self.path_graph.objects(step, CD.position))
                self.assertEqual({Literal(expected_position)}, position_values)
                positions.extend(int(value) for value in position_values)

        self.assertEqual(list(range(1, 7)), sorted(positions))
        self.assertEqual(6, len(set(positions)))

    def test_each_step_uses_exactly_the_manager_approved_reviewed_resources(self) -> None:
        for step, (_position, expected_resources) in EXPECTED_STEPS.items():
            with self.subTest(step=step):
                self.assertEqual(
                    expected_resources,
                    set(self.path_graph.objects(step, CD.usesResource)),
                )
                for resource in expected_resources:
                    self.assertTrue(
                        any(self.graph.triples((resource, None, None))),
                        f"Reviewed canonical resource is absent: {resource}",
                    )
                    self.assertIn(
                        Literal(True),
                        set(self.graph.objects(resource, CD.authoredResource)),
                    )

    def test_path_graph_authors_only_path_and_path_step_identities(self) -> None:
        typed = {
            (subject, object_type)
            for subject, _predicate, object_type in self.path_graph.triples((None, RDF.type, None))
        }
        expected_typed = {(PATH, CD.LearningPath)} | {
            (step, CD.PathStep) for step in EXPECTED_STEPS
        }
        self.assertEqual(expected_typed, typed)
        self.assertEqual([], list(self.path_graph.triples((None, CD.body, None))))

    def test_path_is_intentionally_scene_free(self) -> None:
        self.assertEqual([], list(self.path_graph.triples((None, CD.usesScene, None))))
        self.assertEqual([], list(self.path_graph.triples((None, RDF.type, CD.SceneDefinition))))
        self.assertEqual([], list(self.path_graph.triples((None, RDF.type, CD.SceneItem))))

    def test_course_discovery_exposes_exact_variance_dispersion_path_reference(self) -> None:
        selection = select_course_unit_path(
            self.dataset,
            CourseUnitPathSelectionRequest(
                offering_id=str(EX["teaching-offering-chemometrics-applied-statistics"]),
                placement_id=str(EX["unit-placement-chemometrics-variance-dispersion"]),
                unit_id=str(EX["learning-unit-variance-dispersion"]),
            ),
        )
        self.assertEqual(
            CoursePathReference(str(PATH), str(PATH_GRAPH)),
            selection.path,
        )

    def test_random_variables_and_mean_values_paths_and_scenes_remain_present(self) -> None:
        for unit, path, expected_step_count in (
            (
                EX["learning-unit-random-variables"],
                EX["path-chemometrics-random-variables-lecture"],
                5,
            ),
            (
                EX["learning-unit-mean-values"],
                EX["path-chemometrics-mean-values-lecture"],
                8,
            ),
        ):
            with self.subTest(unit=unit):
                self.assertEqual(
                    {path},
                    set(self.graph.subjects(CD.forLearningUnit, unit)),
                )
                steps = set(self.graph.objects(path, CD.hasStep))
                self.assertEqual(expected_step_count, len(steps))
                for step in steps:
                    self.assertEqual(1, len(set(self.graph.objects(step, CD.usesScene))))

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
