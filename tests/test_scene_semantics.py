from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path

from pyshacl import validate
from rdflib import Literal, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "validate_semantics", ROOT / "scripts" / "validate_semantics.py"
)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"


def assembled_data_graph():
    return MODULE.dataset_union(MODULE.assemble_dataset(include_legacy=True))


class SceneSemanticValidationTests(unittest.TestCase):
    def validate_graph(self, graph):
        dataset = MODULE.assemble_dataset(include_legacy=True)
        return validate(
            data_graph=graph,
            shacl_graph=dataset.graph(MODULE.SHAPES_GRAPH),
            inference="rdfs",
            meta_shacl=True,
        )

    def test_reference_scene_conforms_and_traces_graph_relations(self) -> None:
        conforms, report = MODULE.run_validation()
        self.assertTrue(conforms, report)

        graph = assembled_data_graph()
        concept = URIRef(EX + "standard-deviation")
        definition = URIRef(EX + "standard-deviation-definition-basic")
        source = URIRef(EX + "reference-statistics-01")
        authored = URIRef(CD + "authoredResource")
        self.assertIn((concept, URIRef(CD + "hasDefinition"), definition), graph)
        self.assertIn((definition, URIRef(CD + "hasSource"), source), graph)
        self.assertIn((concept, authored, Literal(True)), graph)
        self.assertIn((definition, authored, Literal(True)), graph)
        self.assertIn((source, authored, Literal(True)), graph)

    def test_scene_definition_contains_no_duplicated_audience_prose(self) -> None:
        path = ROOT / "content" / "scenes" / "standard-deviation-definition-with-citation.jsonld"
        document = json.loads(path.read_text(encoding="utf-8"))
        serialized = json.dumps(document, ensure_ascii=False)
        self.assertNotIn("Die Standardabweichung beschreibt", serialized)
        self.assertNotIn("Einführende Statistikreferenz", serialized)
        self.assertNotIn("body", document["@context"])

    def test_missing_selected_resource_is_rejected_despite_rdfs_inference(self) -> None:
        graph = assembled_data_graph()
        definition = URIRef(EX + "standard-deviation-definition-basic")
        source = URIRef(EX + "reference-statistics-01")
        graph.remove((source, None, None))
        self.assertIn((definition, URIRef(CD + "hasSource"), source), graph)
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_typed_but_unmarked_selected_resource_is_rejected(self) -> None:
        graph = assembled_data_graph()
        source = URIRef(EX + "reference-statistics-01")
        graph.remove((source, URIRef(CD + "authoredResource"), None))
        self.assertIn((source, RDF.type, URIRef(CD + "Source")), graph)
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_present_typed_and_authored_selected_resource_is_accepted(self) -> None:
        graph = assembled_data_graph()
        source = URIRef(EX + "reference-statistics-01")
        self.assertIn((source, RDF.type, URIRef(CD + "Source")), graph)
        self.assertIn((source, URIRef(CD + "authoredResource"), Literal(True)), graph)
        conforms, report, _ = self.validate_graph(graph)
        self.assertTrue(conforms, report)

    def test_duplicate_scene_item_position_is_rejected(self) -> None:
        graph = assembled_data_graph()
        item = URIRef(EX + "scene-standard-deviation-citation")
        position = URIRef(CD + "position")
        graph.remove((item, position, None))
        graph.add((item, position, Literal(2)))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)

    def test_unsupported_communicative_role_is_rejected(self) -> None:
        graph = assembled_data_graph()
        item = URIRef(EX + "scene-standard-deviation-definition")
        role = URIRef(CD + "communicativeRole")
        graph.set((item, role, URIRef(CD + "UnsupportedRole")))
        conforms, _, _ = self.validate_graph(graph)
        self.assertFalse(conforms)


if __name__ == "__main__":
    unittest.main()
