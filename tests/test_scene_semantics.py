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


def assembled_data_graph():
    return MODULE.dataset_union(MODULE.assemble_dataset())


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
