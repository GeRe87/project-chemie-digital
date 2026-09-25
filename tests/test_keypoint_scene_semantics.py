from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import RDF, SKOS, XSD, Dataset, Literal, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import validate_semantics as VALIDATION  # noqa: E402

RUNTIME_SPEC = importlib.util.spec_from_file_location(
    "generate_canonical_runtime_keypoint_tests",
    SCRIPTS / "generate_canonical_runtime.py",
)
assert RUNTIME_SPEC and RUNTIME_SPEC.loader
RUNTIME = importlib.util.module_from_spec(RUNTIME_SPEC)
RUNTIME_SPEC.loader.exec_module(RUNTIME)

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
GRAPH = "https://w3id.org/project-chemie-digital/graph/"

PATH = URIRef(f"{EX}path-keypoint-system-fixture")
PATH_GRAPH = f"{GRAPH}tests/keypoint-path"
RESOURCE_GRAPH = f"{GRAPH}tests/keypoint-resource"
STEP = URIRef(f"{EX}path-step-keypoint-system-fixture")
SCENE = URIRef(f"{EX}scene-keypoint-system-fixture")
FOCUS = URIRef(f"{EX}keypoint-system-focus")
DEFINITION = URIRef(f"{EX}keypoint-system-focus-definition")
HEADING_ITEM = URIRef(f"{EX}keypoint-system-heading-item")
KEYPOINT_ITEM = URIRef(f"{EX}keypoint-system-list-item")
OWNER = URIRef(f"{EX}keypoint-system-interpretation")
OWNER_TWO = URIRef(f"{EX}keypoint-system-second-owner")
POINT_ONE = URIRef(f"{EX}keypoint-system-point-one")
POINT_TWO = URIRef(f"{EX}keypoint-system-point-two")
CONSTRAINT_TRIG = (
    ROOT / "ontology" / "dataset" / "concepts.trig",
    ROOT / "ontology" / "dataset" / "shapes.trig",
)


def cd(local: str) -> URIRef:
    return URIRef(CD + local)


def selected_path() -> object:
    return RUNTIME.CoursePathReference(str(PATH), PATH_GRAPH)


def add_fixture(
    dataset: Dataset,
    *,
    positions: tuple[int, int] = (1, 2),
    selector: str = "cd:hasKeyPoint",
    role: str = "KeyPointRole",
    include_points: bool = True,
    second_owner: bool = False,
) -> Dataset:
    path_graph = dataset.graph(URIRef(PATH_GRAPH))
    graph = dataset.graph(URIRef(RESOURCE_GRAPH))

    path_graph.add((PATH, RDF.type, cd("LearningPath")))
    path_graph.add((PATH, cd("forTopic"), FOCUS))
    path_graph.add((PATH, cd("hasStep"), STEP))
    path_graph.add((STEP, RDF.type, cd("PathStep")))
    path_graph.add((STEP, cd("position"), Literal(1, datatype=XSD.integer)))
    path_graph.add((STEP, cd("usesResource"), OWNER))
    path_graph.add((STEP, cd("usesScene"), SCENE))

    graph.add((FOCUS, RDF.type, cd("Concept")))
    graph.add((FOCUS, SKOS.prefLabel, Literal("KeyPoint system fixture", lang="en")))
    graph.add((FOCUS, cd("authoredResource"), Literal(True)))
    graph.add((FOCUS, cd("hasDefinition"), DEFINITION))
    graph.add((DEFINITION, RDF.type, cd("Definition")))
    graph.add((DEFINITION, cd("body"), Literal("Neutral fixture definition.", lang="en")))
    graph.add((DEFINITION, cd("authoredResource"), Literal(True)))

    graph.add((OWNER, RDF.type, cd("Interpretation")))
    graph.add((OWNER, cd("body"), Literal("Full explanatory prose remains available for self-study.", lang="en")))
    graph.add((OWNER, cd("authoredResource"), Literal(True)))

    if include_points:
        for point, position, text in (
            (POINT_ONE, positions[0], "Concise authored point one."),
            (POINT_TWO, positions[1], "Concise authored point two."),
        ):
            graph.add((OWNER, cd("hasKeyPoint"), point))
            graph.add((point, RDF.type, cd("KeyPoint")))
            graph.add((point, cd("position"), Literal(position, datatype=XSD.integer)))
            graph.add((point, cd("body"), Literal(text, lang="en")))
            graph.add((point, cd("authoredResource"), Literal(True)))

    if second_owner:
        graph.add((OWNER_TWO, RDF.type, cd("Interpretation")))
        graph.add((OWNER_TWO, cd("body"), Literal("Second owner.", lang="en")))
        graph.add((OWNER_TWO, cd("authoredResource"), Literal(True)))
        graph.add((OWNER_TWO, cd("hasKeyPoint"), POINT_ONE))

    graph.add((SCENE, RDF.type, cd("SceneDefinition")))
    graph.add((SCENE, cd("focusConcept"), FOCUS))
    graph.add((SCENE, cd("hasSceneItem"), HEADING_ITEM))
    graph.add((SCENE, cd("hasSceneItem"), KEYPOINT_ITEM))

    graph.add((HEADING_ITEM, RDF.type, cd("SceneItem")))
    graph.add((HEADING_ITEM, cd("position"), Literal(1, datatype=XSD.integer)))
    graph.add((HEADING_ITEM, cd("selectsResource"), FOCUS))
    graph.add((HEADING_ITEM, cd("communicativeRole"), cd("HeadingRole")))
    graph.add((HEADING_ITEM, cd("selectionPath"), Literal("skos:prefLabel@en")))
    graph.add((HEADING_ITEM, cd("language"), Literal("en")))

    graph.add((KEYPOINT_ITEM, RDF.type, cd("SceneItem")))
    graph.add((KEYPOINT_ITEM, cd("position"), Literal(2, datatype=XSD.integer)))
    graph.add((KEYPOINT_ITEM, cd("selectsResource"), OWNER))
    graph.add((KEYPOINT_ITEM, cd("communicativeRole"), cd(role)))
    graph.add((KEYPOINT_ITEM, cd("selectionPath"), Literal(selector)))
    graph.add((KEYPOINT_ITEM, cd("language"), Literal("en")))
    return dataset


def constraint_fixture(**kwargs: object) -> Dataset:
    return add_fixture(VALIDATION.assemble_dataset(trig_paths=CONSTRAINT_TRIG), **kwargs)


def runtime_fixture(**kwargs: object) -> Dataset:
    return add_fixture(Dataset(), **kwargs)


class KeyPointSemanticTests(unittest.TestCase):
    def assert_conforms(self, dataset: Dataset) -> None:
        conforms, _report_graph, report = VALIDATION.validate_dataset(dataset, meta_shacl=False)
        self.assertTrue(conforms, report)

    def assert_violates(self, dataset: Dataset, message: str) -> None:
        conforms, _report_graph, report = VALIDATION.validate_dataset(dataset, meta_shacl=False)
        self.assertFalse(conforms, report)
        self.assertIn(message, report)

    def test_complete_canonical_dataset_remains_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)

    def test_valid_source_linked_keypoint_sequence_conforms(self) -> None:
        self.assert_conforms(constraint_fixture())

    def test_orphan_keypoint_is_rejected(self) -> None:
        dataset = constraint_fixture()
        graph = dataset.graph(URIRef(RESOURCE_GRAPH))
        orphan = URIRef(f"{EX}keypoint-system-orphan")
        graph.add((orphan, RDF.type, cd("KeyPoint")))
        graph.add((orphan, cd("position"), Literal(1, datatype=XSD.integer)))
        graph.add((orphan, cd("body"), Literal("Orphan.", lang="en")))
        graph.add((orphan, cd("authoredResource"), Literal(True)))
        self.assert_violates(dataset, "exactly one owning LearningResource")

    def test_multi_owner_keypoint_is_rejected(self) -> None:
        self.assert_violates(constraint_fixture(second_owner=True), "exactly one owning LearningResource")

    def test_duplicate_keypoint_positions_are_rejected(self) -> None:
        self.assert_violates(constraint_fixture(positions=(1, 1)), "positions must be unique")

    def test_non_contiguous_keypoint_sequence_is_rejected(self) -> None:
        self.assert_violates(constraint_fixture(positions=(1, 3)), "contiguous")

    def test_keypoint_role_requires_linked_points(self) -> None:
        self.assert_violates(constraint_fixture(include_points=False), "one or more linked KeyPoints")

    def test_keypoint_role_requires_keypoint_selector(self) -> None:
        self.assert_violates(constraint_fixture(selector="cd:body"), "KeyPointRole requires exactly the cd:hasKeyPoint selector")

    def test_keypoint_selector_requires_keypoint_role(self) -> None:
        self.assert_violates(constraint_fixture(role="StatementRole"), "The cd:hasKeyPoint selector requires KeyPointRole")

    def test_runtime_emits_one_ordered_source_linked_list_block(self) -> None:
        document = RUNTIME.compile_scene_document(runtime_fixture(), selected_path())
        block = document["scenes"][0]["blocks"][1]
        self.assertEqual("list", block["kind"])
        self.assertEqual("unordered", block["listStyle"])
        self.assertEqual(
            ["Concise authored point one.", "Concise authored point two."],
            [item["text"] for item in block["items"]],
        )
        self.assertEqual("ex:keypoint-system-interpretation", block["source"][0]["resourceId"])
        self.assertEqual("cd:hasKeyPoint", block["source"][0]["relationPath"])
        self.assertEqual("ex:keypoint-system-point-one", block["items"][0]["source"][0]["resourceId"])
        self.assertEqual("cd:body", block["items"][0]["source"][0]["relationPath"])

    def test_static_fallback_preserves_stable_list_item_identity(self) -> None:
        document = RUNTIME.compile_scene_document(runtime_fixture(), selected_path())
        rendered = RUNTIME.static_fallback({"sceneDocuments": [document]})
        self.assertIn('data-list-item-id="ex:keypoint-system-point-one--list-item"', rendered)
        self.assertIn('data-list-item-id="ex:keypoint-system-point-two--list-item"', rendered)

    def test_runtime_rejects_missing_keypoints(self) -> None:
        with self.assertRaisesRegex(ValueError, "KeyPointRole requires linked KeyPoints"):
            RUNTIME.compile_scene_document(runtime_fixture(include_points=False), selected_path())

    def test_runtime_rejects_duplicate_positions(self) -> None:
        with self.assertRaisesRegex(ValueError, "KeyPoint positions must be unique"):
            RUNTIME.compile_scene_document(runtime_fixture(positions=(1, 1)), selected_path())

    def test_runtime_rejects_non_contiguous_sequence(self) -> None:
        with self.assertRaisesRegex(ValueError, "KeyPoint positions must be contiguous"):
            RUNTIME.compile_scene_document(runtime_fixture(positions=(1, 3)), selected_path())

    def test_runtime_rejects_multiple_owners(self) -> None:
        with self.assertRaisesRegex(ValueError, "must have exactly one owning LearningResource"):
            RUNTIME.compile_scene_document(runtime_fixture(second_owner=True), selected_path())

    def test_runtime_rejects_wrong_selector(self) -> None:
        with self.assertRaisesRegex(ValueError, "KeyPointRole requires direct cd:hasKeyPoint selection"):
            RUNTIME.compile_scene_document(runtime_fixture(selector="cd:body"), selected_path())


if __name__ == "__main__":
    unittest.main()
