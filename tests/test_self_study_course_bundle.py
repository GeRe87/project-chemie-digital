from __future__ import annotations

import sys
import unittest
from pathlib import Path

from rdflib import URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import generate_canonical_runtime as RUNTIME  # noqa: E402

EX = "https://w3id.org/project-chemie-digital/resource/"
GRAPH = "https://w3id.org/project-chemie-digital/graph/"
CD = "https://w3id.org/project-chemie-digital/ontology/"

OFFERING = f"{EX}teaching-offering-chemometrics-applied-statistics"
RANDOM_PATH = f"{EX}path-chemometrics-random-variables-lecture"
RANDOM_GRAPH = f"{GRAPH}paths/chemometrics-random-variables-lecture"
MEAN_PATH = f"{EX}path-chemometrics-mean-values-lecture"
MEAN_GRAPH = f"{GRAPH}paths/chemometrics-mean-values-lecture"
VARIANCE_PATH = f"{EX}path-chemometrics-variance-dispersion-lecture"
VARIANCE_GRAPH = f"{GRAPH}paths/chemometrics-variance-dispersion-lecture"


class SelfStudyCourseBundleTests(unittest.TestCase):
    def test_single_path_artifact_emits_one_exact_absolute_binding(self) -> None:
        artifact = RUNTIME.build_artifact()
        document = artifact["sceneDocuments"][0]
        self.assertEqual(
            [
                {
                    "pathId": f"{EX}path-standard-deviation",
                    "pathGraphId": f"{GRAPH}paths/standard-deviation",
                    "sceneDocumentId": document["id"],
                }
            ],
            artifact["sceneDocumentBindings"],
        )

    def test_current_chemometrics_bundle_keeps_all_units_but_compiles_only_scene_ready_paths(self) -> None:
        artifact = RUNTIME.build_offering_artifact(OFFERING, snapshot_language="en")
        self.assertEqual(1, len(artifact["teachingOfferingDocuments"]))
        document = artifact["teachingOfferingDocuments"][0]
        self.assertEqual(OFFERING, document["offering"]["id"])
        placements = {item["unitId"]: item["position"] for item in document["placements"]}
        random_position = placements[f"{EX}learning-unit-random-variables"]
        mean_position = placements[f"{EX}learning-unit-mean-values"]
        variance_position = placements[f"{EX}learning-unit-variance-dispersion"]
        self.assertLess(random_position, mean_position)
        self.assertLess(mean_position, variance_position)
        self.assertEqual(10, mean_position - random_position)
        self.assertEqual(10, variance_position - mean_position)

        introduction_id = f"{EX}learning-unit-chemometrics-introduction"
        if introduction_id in placements:
            self.assertEqual(10, random_position - placements[introduction_id])

        binding_pairs = {
            (item["pathId"], item["pathGraphId"])
            for item in artifact["sceneDocumentBindings"]
        }
        self.assertIn((RANDOM_PATH, RANDOM_GRAPH), binding_pairs)
        self.assertIn((MEAN_PATH, MEAN_GRAPH), binding_pairs)
        self.assertNotIn((VARIANCE_PATH, VARIANCE_GRAPH), binding_pairs)
        if introduction_id in placements:
            self.assertIn(
                (
                    f"{EX}path-chemometrics-introduction",
                    f"{GRAPH}paths/chemometrics-introduction",
                ),
                binding_pairs,
            )

        expected_renderable_count = 3 if introduction_id in placements else 2
        self.assertEqual(
            expected_renderable_count,
            len(artifact["sceneDocuments"]),
        )
        self.assertEqual(
            {
                item["sceneDocumentId"]
                for item in artifact["sceneDocumentBindings"]
            },
            {
                item["id"]
                for item in artifact["sceneDocuments"]
            },
        )

        variance_unit = next(
            unit
            for unit in document["units"]
            if unit["id"] == f"{EX}learning-unit-variance-dispersion"
        )
        self.assertEqual(
            [{"id": VARIANCE_PATH, "graphId": VARIANCE_GRAPH, "labels": [{"value": "Chemometrics Variance and Dispersion lecture path", "language": "en"}], "descriptions": []}],
            variance_unit["paths"],
        )

    def test_scene_free_variance_path_is_valid_but_not_renderable(self) -> None:
        dataset = RUNTIME.assemble_dataset()
        self.assertFalse(
            RUNTIME.path_is_fully_scene_bound(
                dataset,
                RUNTIME.CoursePathReference(VARIANCE_PATH, VARIANCE_GRAPH),
            )
        )

    def test_partial_scene_binding_fails_closed(self) -> None:
        dataset = RUNTIME.assemble_dataset()
        graph = dataset.graph(URIRef(VARIANCE_GRAPH))
        graph.add(
            (
                URIRef(f"{EX}path-step-chemometrics-variance-dispersion-variance"),
                URIRef(f"{CD}usesScene"),
                URIRef(f"{EX}scene-partial-test"),
            )
        )
        with self.assertRaisesRegex(
            ValueError,
            "has partial or multiple scene bindings",
        ):
            RUNTIME.path_is_fully_scene_bound(
                dataset,
                RUNTIME.CoursePathReference(VARIANCE_PATH, VARIANCE_GRAPH),
            )


if __name__ == "__main__":
    unittest.main()
