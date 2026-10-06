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

EXPECTED_TOPICS = {
    EX["variables-and-constants"],
    EX["variable"],
    EX["independent-dependent-variable-roles"],
    EX["independent-variable"],
    EX["dependent-variable"],
    EX["constant"],
    EX["sample"],
    EX["distribution"],
    EX["random-variable"],
    EX["discrete-random-variable"],
    EX["continuous-random-variable"],
}

EXPECTED_STEPS = [
    ("variables-constants-opener", {EX["diagram-variable-constant-contrast"]}),
    ("variable-definition", {EX["variable-keypoints"], EX["variable-scope-takeaway"]}),
    ("constant-distinction", {EX["def-constant"], EX["variable-constant-cards"], EX["variable-constant-scope-interpretation"]}),
    ("variable-roles", {EX["def-independent-dependent-variable-roles"], EX["independent-dependent-cards"], EX["independent-dependent-variable-role-interpretation"]}),
    ("variable-examples", {EX["diagram-variable-examples"]}),
    ("variable-code-experiment", {
        EX["exercise-variable-constant-code-experiment"],
        EX["code-variable-constant-r"],
        EX["expected-variable-constant-code-experiment"],
    }),
    ("sample-variable", {EX["sample-variable-principles"], EX["table-sample-variable-observations"]}),
    ("distribution-anchor", {EX["def-distribution"], EX["chart-distribution-preview"]}),
    ("random-variable", {EX["random-variable-mapping-formula"], EX["diagram-random-variable-realization"]}),
    ("discrete-random-variable", {EX["def-discrete-random-variable"], EX["chart-discrete-random-variable"], EX["worked-example-discrete-colony-count"]}),
    ("continuous-random-variable", {EX["def-continuous-random-variable"], EX["chart-continuous-random-variable"], EX["worked-example-continuous-concentration"]}),
    ("classify-concentration", {
        EX["exercise-classify-calibration-concentration"],
        EX["poll-classify-calibration-concentration"],
        EX["expected-classify-calibration-concentration"],
    }),
    ("classify-wavelength", {
        EX["exercise-classify-fixed-wavelength"],
        EX["poll-classify-fixed-wavelength"],
        EX["expected-classify-fixed-wavelength"],
    }),
    ("classify-temperature", {
        EX["exercise-classify-recorded-temperature"],
        EX["poll-classify-recorded-temperature"],
        EX["expected-classify-recorded-temperature"],
    }),
]


class ChemometricsVariablesConstantsPathTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.path_graph = cls.dataset.graph(PATH_GRAPH)
        cls.content_graph = cls.dataset.graph(CONTENT_GRAPH)

    def test_stable_path_identity_is_retargeted_to_variables_and_constants(self) -> None:
        self.assertEqual({PATH}, set(self.path_graph.subjects(RDF.type, CD.LearningPath)))
        self.assertEqual(EXPECTED_TOPICS, set(self.path_graph.objects(PATH, CD.forTopic)))
        self.assertEqual(
            {EX["learning-unit-random-variables"]},
            set(self.path_graph.objects(PATH, CD.forLearningUnit)),
        )
        self.assertEqual({Literal(True)}, set(self.path_graph.objects(PATH, CD.authoredResource)))

    def test_path_has_exactly_fourteen_contiguous_scene_bound_steps(self) -> None:
        steps = set(self.path_graph.objects(PATH, CD.hasStep))
        self.assertEqual(14, len(steps))
        for position, (slug, expected_resources) in enumerate(EXPECTED_STEPS, start=1):
            step = EX[f"path-step-chemometrics-{slug}"]
            with self.subTest(step=step):
                self.assertIn(step, steps)
                self.assertEqual({Literal(position)}, set(self.path_graph.objects(step, CD.position)))
                self.assertEqual(expected_resources, set(self.path_graph.objects(step, CD.usesResource)))
                self.assertEqual(1, len(set(self.path_graph.objects(step, CD.usesScene))))
                for resource in expected_resources:
                    self.assertTrue(
                        any(self.content_graph.triples((resource, None, None))),
                        f"Path resource is not in the reviewed Chemometrics content graph: {resource}",
                    )

    def test_path_graph_owns_only_path_and_steps_not_scene_definitions(self) -> None:
        self.assertEqual([], list(self.path_graph.triples((None, RDF.type, CD.SceneDefinition))))
        self.assertEqual([], list(self.path_graph.triples((None, RDF.type, CD.SceneItem))))

    def test_course_discovery_keeps_one_exact_path_for_level_one(self) -> None:
        self.assertEqual(
            {PATH},
            set(self.graph.subjects(CD.forLearningUnit, EX["learning-unit-random-variables"])),
        )

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
