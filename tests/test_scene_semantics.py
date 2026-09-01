from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from pyshacl import validate
from rdflib import Literal, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("validate_semantics", ROOT / "scripts" / "validate_semantics.py")
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
SKOS = "http://www.w3.org/2004/02/skos/core#"


def assembled_data_graph():
    return MODULE.dataset_union(MODULE.assemble_dataset())


def add_generic_scene_fixture(graph):
    concept = URIRef(EX + "generic-scene-concept")
    definition = URIRef(EX + "generic-scene-definition")
    example = URIRef(EX + "generic-scene-worked-example")
    exercise = URIRef(EX + "generic-scene-exercise")
    scene = URIRef(EX + "generic-scene")

    authored = URIRef(CD + "authoredResource")
    body = URIRef(CD + "body")
    communicative_role = URIRef(CD + "communicativeRole")
    has_definition = URIRef(CD + "hasDefinition")
    has_scene_item = URIRef(CD + "hasSceneItem")
    position = URIRef(CD + "position")
    selection_path = URIRef(CD + "selectionPath")
    selects_resource = URIRef(CD + "selectsResource")

    graph.add((concept, RDF.type, URIRef(CD + "Concept")))
    graph.add((concept, URIRef(SKOS + "prefLabel"), Literal("Generic scene concept", lang="en")))
    graph.add((concept, has_definition, definition))
    graph.add((concept, authored, Literal(True)))

    for resource, resource_type, text in (
        (definition, "Definition", "A generic explanatory statement."),
        (example, "WorkedExample", "A generic worked example."),
        (exercise, "Exercise", "A generic practice task."),
    ):
        graph.add((resource, RDF.type, URIRef(CD + resource_type)))
        graph.add((resource, body, Literal(text, lang="en")))
        graph.add((resource, authored, Literal(True)))

    graph.add((scene, RDF.type, URIRef(CD + "SceneDefinition")))
    graph.add((scene, URIRef(CD + "focusConcept"), concept))

    items = {
        "heading": (concept, "HeadingRole", "skos:prefLabel@en"),
        "statement": (definition, "StatementRole", "cd:body"),
        "example": (example, "ExampleRole", "cd:body"),
        "exercise": (exercise, "ExerciseRole", "cd:body"),
    }
    item_iris = {}
    for index, (name, (resource, role, selector)) in enumerate(items.items(), start=1):
        item = URIRef(EX + f"generic-scene-{name}")
        item_iris[name] = item
        graph.add((scene, has_scene_item, item))
        graph.add((item, RDF.type, URIRef(CD + "SceneItem")))
        graph.add((item, position, Literal(index)))
        graph.add((item, selects_resource, resource))
        graph.add((item, communicative_role, URIRef(CD + role)))
        graph.add((item, selection_path, Literal(selector)))

    return {
        "concept": concept,
        "definition": definition,
        "example": example,
        "exercise": exercise,
        "scene": scene,
        "items": item_iris,
    }


class SceneSemanticValidationTests(unittest.TestCase):
    def validate_graph(self, graph):
        dataset = MODULE.assemble_dataset()
        return validate(data_graph=graph, shacl_graph=dataset.graph(MODULE.SHAPES_GRAPH), inference="rdfs", meta_shacl=True)

    def test_reference_scene_conforms_and_traces_graph_relations(self) -> None:
        conforms, report = MODULE.run_validation()
        self.assertTrue(conforms, report)
        graph = assembled_data_graph()
        concept = URIRef(EX + "standard-deviation")
        definition = URIRef(EX + "sd-definition-basic-de")
        source = URIRef(EX + "source-nist-dispersion")
        authored = URIRef(CD + "authoredResource")
        self.assertIn((concept, URIRef(CD + "hasDefinition"), definition), graph)
        self.assertIn((definition, URIRef(CD + "hasSource"), source), graph)
        self.assertIn((concept, authored, Literal(True)), graph)
        self.assertIn((definition, authored, Literal(True)), graph)
        self.assertIn((source, authored, Literal(True)), graph)

    def test_all_nine_scene_definitions_are_renderer_neutral(self) -> None:
        graph = assembled_data_graph()
        scene_type = URIRef(CD + "SceneDefinition")
        body = URIRef(CD + "body")
        scenes = set(graph.subjects(RDF.type, scene_type))
        self.assertEqual(9, len(scenes))
        for scene in scenes:
            self.assertEqual([], list(graph.objects(scene, body)))

    def test_missing_selected_resource_is_rejected(self) -> None:
        graph = assembled_data_graph()
        source = URIRef(EX + "source-nist-dispersion")
        graph.remove((source, None, None))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_typed_but_unmarked_selected_resource_is_rejected(self) -> None:
        graph = assembled_data_graph()
        source = URIRef(EX + "source-nist-dispersion")
        graph.remove((source, URIRef(CD + "authoredResource"), None))
        self.assertIn((source, RDF.type, URIRef(CD + "Source")), graph)
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_present_typed_and_authored_selected_resource_is_accepted(self) -> None:
        graph = assembled_data_graph()
        source = URIRef(EX + "source-nist-dispersion")
        self.assertIn((source, RDF.type, URIRef(CD + "Source")), graph)
        self.assertIn((source, URIRef(CD + "authoredResource"), Literal(True)), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_duplicate_scene_item_position_is_rejected(self) -> None:
        graph = assembled_data_graph()
        item = URIRef(EX + "scene1-i3")
        position = URIRef(CD + "position")
        graph.set((item, position, Literal(2)))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_code_scene_item_role_and_selection_path_are_accepted(self) -> None:
        graph = assembled_data_graph()
        item = URIRef(EX + "scene9-code")
        self.assertIn((item, URIRef(CD + "communicativeRole"), URIRef(CD + "CodeRole")), graph)
        self.assertIn((item, URIRef(CD + "selectionPath"), Literal("cd:hasCodeExample")), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_poll_scene_item_role_and_selection_path_are_accepted(self) -> None:
        graph = assembled_data_graph()
        item = URIRef(EX + "scene9-poll")
        self.assertIn((item, URIRef(CD + "communicativeRole"), URIRef(CD + "PollRole")), graph)
        self.assertIn((item, URIRef(CD + "selectionPath"), Literal("cd:hasAudiencePoll")), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_generic_english_heading_selection_is_accepted(self) -> None:
        graph = assembled_data_graph()
        fixture = add_generic_scene_fixture(graph)
        item = fixture["items"]["heading"]
        self.assertIn((item, URIRef(CD + "communicativeRole"), URIRef(CD + "HeadingRole")), graph)
        self.assertIn((item, URIRef(CD + "selectionPath"), Literal("skos:prefLabel@en")), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_generic_statement_role_with_direct_body_selection_is_accepted(self) -> None:
        graph = assembled_data_graph()
        fixture = add_generic_scene_fixture(graph)
        item = fixture["items"]["statement"]
        self.assertIn((item, URIRef(CD + "selectsResource"), fixture["definition"]), graph)
        self.assertIn((item, URIRef(CD + "communicativeRole"), URIRef(CD + "StatementRole")), graph)
        self.assertIn((item, URIRef(CD + "selectionPath"), Literal("cd:body")), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_generic_example_role_with_direct_body_selection_is_accepted(self) -> None:
        graph = assembled_data_graph()
        fixture = add_generic_scene_fixture(graph)
        item = fixture["items"]["example"]
        self.assertIn((item, URIRef(CD + "selectsResource"), fixture["example"]), graph)
        self.assertIn((item, URIRef(CD + "communicativeRole"), URIRef(CD + "ExampleRole")), graph)
        self.assertIn((item, URIRef(CD + "selectionPath"), Literal("cd:body")), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_generic_exercise_role_with_direct_body_selection_is_accepted(self) -> None:
        graph = assembled_data_graph()
        fixture = add_generic_scene_fixture(graph)
        item = fixture["items"]["exercise"]
        self.assertIn((item, URIRef(CD + "selectsResource"), fixture["exercise"]), graph)
        self.assertIn((item, URIRef(CD + "communicativeRole"), URIRef(CD + "ExerciseRole")), graph)
        self.assertIn((item, URIRef(CD + "selectionPath"), Literal("cd:body")), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_poll_scene_item_with_unsupported_role_is_rejected(self) -> None:
        graph = assembled_data_graph()
        item = URIRef(EX + "scene9-poll")
        graph.set((item, URIRef(CD + "communicativeRole"), URIRef(CD + "UnsupportedRole")))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_poll_scene_item_with_unsupported_selection_path_is_rejected(self) -> None:
        graph = assembled_data_graph()
        item = URIRef(EX + "scene9-poll")
        graph.set((item, URIRef(CD + "selectionPath"), Literal("cd:unsupportedPollPath")))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_unsupported_communicative_role_is_rejected(self) -> None:
        graph = assembled_data_graph()
        item = URIRef(EX + "scene1-i2")
        graph.set((item, URIRef(CD + "communicativeRole"), URIRef(CD + "UnsupportedRole")))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_unsupported_selection_path_is_rejected(self) -> None:
        graph = assembled_data_graph()
        item = URIRef(EX + "scene9-code")
        graph.set((item, URIRef(CD + "selectionPath"), Literal("cd:unsupportedPath")))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)


if __name__ == "__main__":
    unittest.main()
