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

EXPECTED_TOPICS = {
    EX["variables-and-constants"],
    EX["variable"],
    EX["independent-dependent-variable-roles"],
    EX["independent-variable"],
    EX["dependent-variable"],
    EX["random-variable"],
    EX["constant"],
    EX["sample"],
    EX["distribution"],
}

EXPECTED_STEPS = [
    ("variables-constants-title", {EX["variables-and-constants"]}),
    ("variable-definition", {EX["def-variable"], EX["source-openstax-statistics"]}),
    ("measured-variable-example", {
        EX["measured-variable-example-intro"],
        EX["table-live-absorbance-observations"],
        EX["chart-live-absorbance-observations"],
    }),
    ("functional-dependence", {
        EX["functional-dependence-intro"],
        EX["functional-dependence-formula"],
        EX["function-example-cards"],
        EX["functional-dependence-caveat"],
    }),
    ("observation-random-bridge", {
        EX["variable-observation-random-intro"],
        EX["observation-values-formula"],
        EX["diagram-variable-observation-sample"],
        EX["random-variable-distribution-note"],
    }),
    ("random-draw-r", {EX["random-draw-r-intro"], EX["code-random-draw-r"]}),
    ("constant-definition", {EX["def-constant"], EX["source-openstax-statistics"]}),
    ("uvvis-example", {
        EX["uvvis-calibration-intro"],
        EX["table-uvvis-calibration-roles"],
        EX["chart-uvvis-calibration-response"],
        EX["uvvis-role-keypoints"],
    }),
    ("role-quiz", {
        EX["poll-quiz-concentration-role"],
        EX["poll-quiz-wavelength-role"],
        EX["poll-quiz-absorbance-role"],
        EX["expected-quiz-concentration-role"],
        EX["expected-quiz-wavelength-role"],
        EX["expected-quiz-absorbance-role"],
    }),
]


class ChemometricsVariablesConstantsPathTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.path_graph = cls.dataset.graph(PATH_GRAPH)

    def test_stable_path_identity_has_new_nine_scene_story(self) -> None:
        self.assertEqual({PATH}, set(self.path_graph.subjects(RDF.type, CD.LearningPath)))
        self.assertEqual(EXPECTED_TOPICS, set(self.path_graph.objects(PATH, CD.forTopic)))
        self.assertEqual(
            {EX["learning-unit-random-variables"]},
            set(self.path_graph.objects(PATH, CD.forLearningUnit)),
        )
        self.assertEqual({Literal(True)}, set(self.path_graph.objects(PATH, CD.authoredResource)))

    def test_path_has_exactly_nine_contiguous_scene_bound_steps(self) -> None:
        steps = set(self.path_graph.objects(PATH, CD.hasStep))
        self.assertEqual(9, len(steps))
        for position, (slug, expected_resources) in enumerate(EXPECTED_STEPS, start=1):
            step = EX[f"path-step-chemometrics-{slug}"]
            with self.subTest(step=step):
                self.assertIn(step, steps)
                self.assertEqual({Literal(position)}, set(self.path_graph.objects(step, CD.position)))
                self.assertEqual(expected_resources, set(self.path_graph.objects(step, CD.usesResource)))
                self.assertEqual(1, len(set(self.path_graph.objects(step, CD.usesScene))))
                for resource in expected_resources:
                    self.assertTrue(
                        any(self.graph.triples((resource, None, None))),
                        f"Path resource is not present in the canonical dataset: {resource}",
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
