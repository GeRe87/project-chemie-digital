from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, URIRef

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
PATH = EX["path-chemometrics-random-variables-lecture"]
PATH_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/paths/chemometrics-random-variables-lecture"
)
CONTENT_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-basics"
)

EXPECTED_STEPS = {
    EX["path-step-chemometrics-random-variables-opener"]: (
        1,
        {EX["exercise-dice-realizations"]},
    ),
    EX["path-step-chemometrics-random-variables-core-distinction"]: (
        2,
        {
            EX["def-random-variable"],
            EX["random-variable-realization-interpretation"],
        },
    ),
    EX["path-step-chemometrics-random-variables-measurement-model"]: (
        3,
        {EX["random-measurement-model-interpretation"]},
    ),
    EX["path-step-chemometrics-random-variables-discrete-case"]: (
        4,
        {
            EX["def-discrete-random-variable"],
            EX["worked-example-discrete-colony-count"],
        },
    ),
    EX["path-step-chemometrics-random-variables-continuous-case"]: (
        5,
        {
            EX["def-continuous-random-variable"],
            EX["worked-example-continuous-concentration"],
        },
    ),
}

EXPECTED_SCENES = {
    EX["path-step-chemometrics-random-variables-opener"]: EX[
        "scene-chemometrics-random-variables-opener"
    ],
    EX["path-step-chemometrics-random-variables-core-distinction"]: EX[
        "scene-chemometrics-random-variables-core-distinction"
    ],
    EX["path-step-chemometrics-random-variables-measurement-model"]: EX[
        "scene-chemometrics-random-variables-measurement-model"
    ],
    EX["path-step-chemometrics-random-variables-discrete-case"]: EX[
        "scene-chemometrics-random-variables-discrete-case"
    ],
    EX["path-step-chemometrics-random-variables-continuous-case"]: EX[
        "scene-chemometrics-random-variables-continuous-case"
    ],
}


class ChemometricsRandomVariablesPathTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.path_graph = cls.dataset.graph(PATH_GRAPH)
        cls.content_graph = cls.dataset.graph(CONTENT_GRAPH)

    def test_exact_path_identity_and_same_graph_course_context(self) -> None:
        self.assertEqual({PATH}, set(self.path_graph.subjects(RDF.type, CD.LearningPath)))
        self.assertEqual(
            {EX["random-variable"]},
            set(self.path_graph.objects(PATH, CD.forTopic)),
        )
        self.assertEqual(
            {EX["learning-unit-random-variables"]},
            set(self.path_graph.objects(PATH, CD.forLearningUnit)),
        )
        self.assertEqual(
            {Literal(True)},
            set(self.path_graph.objects(PATH, CD.authoredResource)),
        )

    def test_path_has_exactly_five_stable_steps_with_contiguous_positions(self) -> None:
        steps = set(self.path_graph.objects(PATH, CD.hasStep))
        self.assertEqual(set(EXPECTED_STEPS), steps)

        positions = []
        for step, (expected_position, _resources) in EXPECTED_STEPS.items():
            with self.subTest(step=step):
                self.assertEqual({CD.PathStep}, set(self.path_graph.objects(step, RDF.type)))
                position_values = set(self.path_graph.objects(step, CD.position))
                self.assertEqual({Literal(expected_position)}, position_values)
                positions.extend(int(value) for value in position_values)

        self.assertEqual([1, 2, 3, 4, 5], sorted(positions))
        self.assertEqual(5, len(set(positions)))

    def test_each_step_uses_only_the_manager_approved_issue_108_resources(self) -> None:
        for step, (_position, expected_resources) in EXPECTED_STEPS.items():
            with self.subTest(step=step):
                self.assertEqual(
                    expected_resources,
                    set(self.path_graph.objects(step, CD.usesResource)),
                )
                for resource in expected_resources:
                    self.assertTrue(
                        any(self.content_graph.triples((resource, None, None))),
                        f"Path resource is not owned by the reviewed Chemometrics content graph: {resource}",
                    )

        typed_resources = {
            (subject, object_type)
            for subject, _predicate, object_type in self.path_graph.triples((None, RDF.type, None))
        }
        expected_typed_resources = {(PATH, CD.LearningPath)} | {
            (step, CD.PathStep) for step in EXPECTED_STEPS
        }
        self.assertEqual(expected_typed_resources, typed_resources)

    def test_path_binds_each_step_to_exactly_one_scene_without_defining_scenes(self) -> None:
        for step, expected_scene in EXPECTED_SCENES.items():
            with self.subTest(step=step):
                self.assertEqual(
                    {expected_scene},
                    set(self.path_graph.objects(step, CD.usesScene)),
                )
        self.assertEqual([], list(self.path_graph.triples((None, RDF.type, CD.SceneDefinition))))
        self.assertEqual([], list(self.path_graph.triples((None, RDF.type, CD.SceneItem))))

    def test_first_three_chemometrics_units_have_exact_paths(self) -> None:
        self.assertEqual(
            {PATH},
            set(self.graph.subjects(CD.forLearningUnit, EX["learning-unit-random-variables"])),
        )
        self.assertEqual(
            {EX["path-chemometrics-mean-values-lecture"]},
            set(self.graph.subjects(CD.forLearningUnit, EX["learning-unit-mean-values"])),
        )
        self.assertEqual(
            {EX["path-chemometrics-variance-dispersion-lecture"]},
            set(self.graph.subjects(CD.forLearningUnit, EX["learning-unit-variance-dispersion"])),
        )

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
