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
    EX["variables-foundation"],
    EX["variable"],
    EX["variables-values-observations"],
    EX["lake-sampling-replicates"],
    EX["variability-randomness-uncertainty"],
    EX["uvvis-variation-sources"],
    EX["uvvis-additive-response-model"],
    EX["general-additive-response-model"],
    EX["model-function-families"],
    EX["variable-value-shapes"],
    EX["controlled-calibration-model"],
    EX["concentration-context-roles"],
    EX["variable-classification"],
    EX["empirical-probability-distribution-distinction"],
    EX["random-variable"],
    EX["distribution"],
}

EXPECTED_STEPS = [
    ("variables-title", {EX["variables-foundation"]}),
    ("variable-definition", {EX["def-variable"], EX["source-openstax-statistics"]}),
    ("variables-values-observations", {
        EX["media-uvvis-dilution-series"],
        EX["variables-values-observations-intro"],
        EX["table-uvvis-calibration-roles"],
        EX["chart-uvvis-calibration-response"],
    }),
    ("lake-sampling-replicates", {
        EX["media-lake-sampling-sites"],
        EX["lake-sampling-replicates-intro"],
        EX["table-lake-analyte-a-replicates"],
        EX["chart-lake-analyte-a-replicates"],
    }),
    ("why-values-differ", {
        EX["variation-origins-cards"],
        EX["why-values-differ-takeaway"],
    }),
    ("variation-sources", {EX["diagram-uvvis-variation-sources"]}),
    ("additive-response-model", {
        EX["uvvis-additive-response-equation"],
        EX["uvvis-additive-response-legend"],
    }),
    ("general-additive-model", {
        EX["general-additive-response-equation"],
        EX["general-additive-response-legend"],
    }),
    ("model-function-families", {
        EX["diagram-model-function-families"],
    }),
    ("variable-value-shapes", {
        EX["worked-example-concentration-value-shapes"],
        EX["concentration-value-shapes-intro"],
        EX["value-shape-scalar-cards"], EX["value-shape-scalar-formula"],
        EX["value-shape-vector-cards"], EX["value-shape-vector-formula"],
        EX["value-shape-matrix-cards"], EX["value-shape-matrix-formula"],
    }),
    ("controlled-calibration", {
        EX["controlled-calibration-intro"],
        EX["controlled-calibration-formula"],
        EX["chart-uvvis-calibration-response"],
        EX["controlled-calibration-assumption"],
    }),
    ("context-roles", {
        EX["concentration-context-intro"],
        EX["concentration-context-cards"],
        EX["concentration-context-takeaway"],
    }),
    ("variable-classification", {
        EX["variable-classification-intro"],
        EX["variable-classification-cards"],
        EX["variable-classification-takeaway"],
    }),
    ("empirical-probability", {
        EX["empirical-probability-intro"],
        EX["distribution-comparison-cards"],
        EX["chart-assigned-concentration-frequency"],
        EX["assigned-frequency-takeaway"],
    }),
    ("variables-checkpoint", {
        EX["poll-variable-randomness-check"],
        EX["poll-variability-check"],
        EX["poll-distribution-check"],
        EX["expected-variable-randomness-check"],
        EX["expected-variability-check"],
        EX["expected-distribution-check"],
    }),
]


class ChemometricsVariablesPathTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.path_graph = cls.dataset.graph(PATH_GRAPH)

    def test_stable_legacy_path_identity_now_serves_variables_level(self) -> None:
        self.assertEqual({PATH}, set(self.path_graph.subjects(RDF.type, CD.LearningPath)))
        self.assertEqual(EXPECTED_TOPICS, set(self.path_graph.objects(PATH, CD.forTopic)))
        self.assertEqual(
            {EX["learning-unit-random-variables"]},
            set(self.path_graph.objects(PATH, CD.forLearningUnit)),
        )
        self.assertEqual({Literal(True)}, set(self.path_graph.objects(PATH, CD.authoredResource)))

    def test_path_has_exactly_fifteen_contiguous_scene_bound_steps(self) -> None:
        steps = set(self.path_graph.objects(PATH, CD.hasStep))
        self.assertEqual(15, len(steps))
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

    def test_path_topics_match_learning_unit_focus_concepts(self) -> None:
        unit = EX["learning-unit-random-variables"]
        self.assertEqual(
            set(self.path_graph.objects(PATH, CD.forTopic)),
            set(self.graph.objects(unit, CD.hasFocusConcept)),
        )

    def test_path_graph_owns_only_path_and_steps_not_scene_definitions(self) -> None:
        self.assertEqual([], list(self.path_graph.triples((None, RDF.type, CD.SceneDefinition))))
        self.assertEqual([], list(self.path_graph.triples((None, RDF.type, CD.SceneItem))))

    def test_course_discovery_keeps_one_exact_stable_path_for_level_one(self) -> None:
        self.assertEqual(
            {PATH},
            set(self.graph.subjects(CD.forLearningUnit, EX["learning-unit-random-variables"])),
        )

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
