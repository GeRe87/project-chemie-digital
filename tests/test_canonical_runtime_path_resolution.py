from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import RDF, XSD, Dataset, Literal, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

SPEC = importlib.util.spec_from_file_location(
    "generate_canonical_runtime",
    SCRIPTS / "generate_canonical_runtime.py",
)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
LEARNING_PATH = URIRef(f"{CD}LearningPath")
HAS_STEP = URIRef(f"{CD}hasStep")
POSITION = URIRef(f"{CD}position")
USES_SCENE = URIRef(f"{CD}usesScene")
PATH = URIRef(f"{EX}path-standard-deviation")
STEP_1 = URIRef(f"{EX}path-step-1")
STEP_2 = URIRef(f"{EX}path-step-2")
BASIC_DEFINITION = URIRef(f"{EX}sd-definition-basic-de")

EXPECTED_SCENES = [
    "ex:scene-sd-definition--scene",
    "ex:scene-sd-process--scene",
    "ex:scene-sample-population--scene",
    "ex:scene-formula-symbols--scene",
    "ex:scene-unit-interpretation--scene",
    "ex:scene-precision-trueness--scene",
    "ex:scene-dispersion-comparison--scene",
    "ex:scene-chemistry-example--scene",
    "ex:scene-exercise-recap--scene",
]


def dataset() -> Dataset:
    return MODULE.assemble_dataset()


def replace_position(value: Literal) -> Dataset:
    current = dataset()
    current.remove((STEP_2, POSITION, None, None))
    graph = current.graph(URIRef("https://w3id.org/project-chemie-digital/graph/paths/standard-deviation"))
    graph.add((STEP_2, POSITION, value))
    return current


class CanonicalRuntimePathResolutionTests(unittest.TestCase):
    def test_resolves_complete_canonical_path_in_authored_position_order(self) -> None:
        document = MODULE.compile_scene_document(dataset())
        self.assertEqual("ex:path-standard-deviation--scene-document", document["id"])
        self.assertEqual(EXPECTED_SCENES, [scene["id"] for scene in document["scenes"]])

    def test_preserves_semantic_resource_selection_and_relation_paths(self) -> None:
        document = MODULE.compile_scene_document(dataset())
        selected = [
            (
                scene["blocks"][1]["source"][0]["resourceId"],
                scene["blocks"][1]["source"][0]["relationPath"],
            )
            for scene in document["scenes"]
        ]
        self.assertEqual(
            [
                ("ex:sd-definition-basic-de", "cd:hasDefinition"),
                ("ex:worked-example-repeated-ph", "cd:hasDefinition"),
                ("ex:def-population-standard-deviation", "cd:hasDefinition"),
                ("ex:sample-sd-formula", "cd:hasDefinition"),
                ("ex:sd-unit-rule", "cd:hasDefinition"),
                ("ex:correction-sd-accuracy", "cd:hasDefinition"),
                ("ex:comparison-dispersion-measures", "cd:hasDefinition"),
                ("ex:worked-example-repeated-ph", "cd:hasDefinition"),
                ("ex:exercise-calculate-s", "cd:hasDefinition"),
            ],
            selected,
        )

    def test_fails_when_the_canonical_learning_path_is_missing(self) -> None:
        current = dataset()
        current.remove((PATH, RDF.type, LEARNING_PATH, None))
        with self.assertRaisesRegex(ValueError, "Expected exactly one canonical LearningPath, got 0"):
            MODULE.compile_scene_document(current)

    def test_fails_when_a_referenced_path_step_is_missing(self) -> None:
        current = dataset()
        current.remove((STEP_1, None, None, None))
        with self.assertRaisesRegex(ValueError, "Missing cd:position for ex:path-step-1"):
            MODULE.compile_scene_document(current)

    def test_fails_when_a_referenced_scene_is_missing(self) -> None:
        current = dataset()
        current.remove((STEP_1, USES_SCENE, None, None))
        with self.assertRaisesRegex(ValueError, "Missing cd:usesScene for ex:path-step-1"):
            MODULE.compile_scene_document(current)

    def test_fails_when_a_selected_resource_is_missing(self) -> None:
        current = dataset()
        current.remove((BASIC_DEFINITION, None, None, None))
        with self.assertRaisesRegex(ValueError, "No audience-visible value for ex:sd-definition-basic-de"):
            MODULE.compile_scene_document(current)

    def test_rejects_duplicate_positions_deterministically(self) -> None:
        with self.assertRaisesRegex(ValueError, "Path positions must be unique and contiguous"):
            MODULE.compile_scene_document(replace_position(Literal(1, datatype=XSD.integer)))

    def test_rejects_non_integer_positions(self) -> None:
        with self.assertRaisesRegex(ValueError, "Invalid integer cd:position for ex:path-step-2"):
            MODULE.compile_scene_document(replace_position(Literal("1.5", datatype=XSD.decimal)))

    def test_rejects_non_positive_positions(self) -> None:
        with self.assertRaisesRegex(ValueError, "Position must be positive for ex:path-step-2"):
            MODULE.compile_scene_document(replace_position(Literal(0, datatype=XSD.integer)))


if __name__ == "__main__":
    unittest.main()
