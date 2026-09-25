from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from pyshacl import validate
from rdflib import Literal, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

import validate_semantics as MODULE  # noqa: E402

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
SKOS = "http://www.w3.org/2004/02/skos/core#"
FOCUSED_TRIG = (
    ROOT / "ontology" / "dataset" / "concepts.trig",
    ROOT / "ontology" / "dataset" / "shapes.trig",
)


def clone_graph(source):
    cloned = source.__class__()
    for triple in source:
        cloned.add(triple)
    return cloned


def add_reference_scene_fixture(graph):
    concept = URIRef(EX + "standard-deviation")
    definition = URIRef(EX + "sd-definition-basic-de")
    source = URIRef(EX + "source-nist-dispersion")
    scene = URIRef(EX + "scene-sd-definition")
    heading = URIRef(EX + "scene1-i1")
    statement = URIRef(EX + "scene1-i2")
    citation = URIRef(EX + "scene1-i3")
    code_resource = URIRef(EX + "scene-code-resource")
    poll_resource = URIRef(EX + "scene-poll-resource")
    code_item = URIRef(EX + "scene9-code")
    poll_item = URIRef(EX + "scene9-poll")

    authored = URIRef(CD + "authoredResource")
    body = URIRef(CD + "body")
    communicative_role = URIRef(CD + "communicativeRole")
    focus_concept = URIRef(CD + "focusConcept")
    has_definition = URIRef(CD + "hasDefinition")
    has_scene_item = URIRef(CD + "hasSceneItem")
    has_source = URIRef(CD + "hasSource")
    position = URIRef(CD + "position")
    selection_path = URIRef(CD + "selectionPath")
    selects_resource = URIRef(CD + "selectsResource")

    graph.add((concept, RDF.type, URIRef(CD + "Concept")))
    graph.add((concept, URIRef(SKOS + "prefLabel"), Literal("standard deviation", lang="en")))
    graph.add((concept, has_definition, definition))
    graph.add((concept, authored, Literal(True)))

    graph.add((definition, RDF.type, URIRef(CD + "Definition")))
    graph.add((definition, body, Literal("Reference definition.", lang="en")))
    graph.add((definition, has_source, source))
    graph.add((definition, authored, Literal(True)))

    graph.add((source, RDF.type, URIRef(CD + "Source")))
    graph.add((source, authored, Literal(True)))

    graph.add((code_resource, RDF.type, URIRef(CD + "LearningResource")))
    graph.add((code_resource, authored, Literal(True)))
    graph.add((poll_resource, RDF.type, URIRef(CD + "LearningResource")))
    graph.add((poll_resource, authored, Literal(True)))

    graph.add((scene, RDF.type, URIRef(CD + "SceneDefinition")))
    graph.add((scene, focus_concept, concept))

    items = (
        (heading, 1, concept, "HeadingRole", "skos:prefLabel@en"),
        (statement, 2, definition, "StatementRole", "cd:body"),
        (citation, 3, source, "CitationRole", "cd:body"),
        (poll_item, 4, poll_resource, "PollRole", "cd:hasAudiencePoll"),
        (code_item, 5, code_resource, "CodeRole", "cd:hasCodeExample"),
    )
    for item, item_position, resource, role, selector in items:
        graph.add((scene, has_scene_item, item))
        graph.add((item, RDF.type, URIRef(CD + "SceneItem")))
        graph.add((item, position, Literal(item_position)))
        graph.add((item, selects_resource, resource))
        graph.add((item, communicative_role, URIRef(CD + role)))
        graph.add((item, selection_path, Literal(selector)))

    return graph


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
    @classmethod
    def setUpClass(cls) -> None:
        focused = MODULE.assemble_dataset(trig_paths=FOCUSED_TRIG)
        cls.base_graph = MODULE.dataset_union(focused)
        cls.shapes_graph = MODULE.detached_graph(focused.graph(MODULE.SHAPES_GRAPH))
        cls.canonical_graph = MODULE.dataset_union(MODULE.assemble_dataset())

    def fresh_graph(self):
        graph = clone_graph(self.base_graph)
        return add_reference_scene_fixture(graph)

    def validate_graph(self, graph):
        return validate(
            data_graph=graph,
            shacl_graph=clone_graph(self.shapes_graph),
            inference="rdfs",
            meta_shacl=False,
        )

    def test_reference_scene_conforms_and_traces_graph_relations(self) -> None:
        conforms, report = MODULE.run_validation()
        self.assertTrue(conforms, report)
        graph = self.canonical_graph
        concept = URIRef(EX + "standard-deviation")
        definition = URIRef(EX + "sd-definition-basic-de")
        source = URIRef(EX + "source-nist-dispersion")
        authored = URIRef(CD + "authoredResource")
        self.assertIn((concept, URIRef(CD + "hasDefinition"), definition), graph)
        self.assertIn((definition, URIRef(CD + "hasSource"), source), graph)
        self.assertIn((concept, authored, Literal(True)), graph)
        self.assertIn((definition, authored, Literal(True)), graph)
        self.assertIn((source, authored, Literal(True)), graph)

    def test_all_scene_definitions_are_renderer_neutral(self) -> None:
        graph = self.canonical_graph
        scene_type = URIRef(CD + "SceneDefinition")
        body = URIRef(CD + "body")
        scenes = set(graph.subjects(RDF.type, scene_type))
        for scene in scenes:
            self.assertEqual([], list(graph.objects(scene, body)))

    def test_missing_selected_resource_is_rejected(self) -> None:
        graph = self.fresh_graph()
        source = URIRef(EX + "source-nist-dispersion")
        graph.remove((source, None, None))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_typed_but_unmarked_selected_resource_is_rejected(self) -> None:
        graph = self.fresh_graph()
        source = URIRef(EX + "source-nist-dispersion")
        graph.remove((source, URIRef(CD + "authoredResource"), None))
        self.assertIn((source, RDF.type, URIRef(CD + "Source")), graph)
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_present_typed_and_authored_selected_resource_is_accepted(self) -> None:
        graph = self.fresh_graph()
        source = URIRef(EX + "source-nist-dispersion")
        self.assertIn((source, RDF.type, URIRef(CD + "Source")), graph)
        self.assertIn((source, URIRef(CD + "authoredResource"), Literal(True)), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_duplicate_scene_item_position_is_rejected(self) -> None:
        graph = self.fresh_graph()
        item = URIRef(EX + "scene1-i3")
        position = URIRef(CD + "position")
        graph.set((item, position, Literal(2)))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_code_scene_item_role_and_selection_path_are_accepted(self) -> None:
        graph = self.fresh_graph()
        item = URIRef(EX + "scene9-code")
        self.assertIn((item, URIRef(CD + "communicativeRole"), URIRef(CD + "CodeRole")), graph)
        self.assertIn((item, URIRef(CD + "selectionPath"), Literal("cd:hasCodeExample")), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_poll_scene_item_role_and_selection_path_are_accepted(self) -> None:
        graph = self.fresh_graph()
        item = URIRef(EX + "scene9-poll")
        self.assertIn((item, URIRef(CD + "communicativeRole"), URIRef(CD + "PollRole")), graph)
        self.assertIn((item, URIRef(CD + "selectionPath"), Literal("cd:hasAudiencePoll")), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_generic_english_heading_selection_is_accepted(self) -> None:
        graph = self.fresh_graph()
        fixture = add_generic_scene_fixture(graph)
        item = fixture["items"]["heading"]
        self.assertIn((item, URIRef(CD + "communicativeRole"), URIRef(CD + "HeadingRole")), graph)
        self.assertIn((item, URIRef(CD + "selectionPath"), Literal("skos:prefLabel@en")), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_generic_statement_role_with_direct_body_selection_is_accepted(self) -> None:
        graph = self.fresh_graph()
        fixture = add_generic_scene_fixture(graph)
        item = fixture["items"]["statement"]
        self.assertIn((item, URIRef(CD + "selectsResource"), fixture["definition"]), graph)
        self.assertIn((item, URIRef(CD + "communicativeRole"), URIRef(CD + "StatementRole")), graph)
        self.assertIn((item, URIRef(CD + "selectionPath"), Literal("cd:body")), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_generic_example_role_with_direct_body_selection_is_accepted(self) -> None:
        graph = self.fresh_graph()
        fixture = add_generic_scene_fixture(graph)
        item = fixture["items"]["example"]
        self.assertIn((item, URIRef(CD + "selectsResource"), fixture["example"]), graph)
        self.assertIn((item, URIRef(CD + "communicativeRole"), URIRef(CD + "ExampleRole")), graph)
        self.assertIn((item, URIRef(CD + "selectionPath"), Literal("cd:body")), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_generic_exercise_role_with_direct_body_selection_is_accepted(self) -> None:
        graph = self.fresh_graph()
        fixture = add_generic_scene_fixture(graph)
        item = fixture["items"]["exercise"]
        self.assertIn((item, URIRef(CD + "selectsResource"), fixture["exercise"]), graph)
        self.assertIn((item, URIRef(CD + "communicativeRole"), URIRef(CD + "ExerciseRole")), graph)
        self.assertIn((item, URIRef(CD + "selectionPath"), Literal("cd:body")), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_poll_scene_item_with_unsupported_role_is_rejected(self) -> None:
        graph = self.fresh_graph()
        item = URIRef(EX + "scene9-poll")
        graph.set((item, URIRef(CD + "communicativeRole"), URIRef(CD + "UnsupportedRole")))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_poll_scene_item_with_unsupported_selection_path_is_rejected(self) -> None:
        graph = self.fresh_graph()
        item = URIRef(EX + "scene9-poll")
        graph.set((item, URIRef(CD + "selectionPath"), Literal("cd:unsupportedPollPath")))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_unsupported_communicative_role_is_rejected(self) -> None:
        graph = self.fresh_graph()
        item = URIRef(EX + "scene1-i2")
        graph.set((item, URIRef(CD + "communicativeRole"), URIRef(CD + "UnsupportedRole")))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_unsupported_selection_path_is_rejected(self) -> None:
        graph = self.fresh_graph()
        item = URIRef(EX + "scene9-code")
        graph.set((item, URIRef(CD + "selectionPath"), Literal("cd:unsupportedPath")))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)


if __name__ == "__main__":
    unittest.main()
