from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import RDF, SKOS, XSD, Dataset, Literal, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

VALIDATION_SPEC = importlib.util.spec_from_file_location(
    "validate_semantics_flow_diagram_tests",
    SCRIPTS / "validate_semantics.py",
)
assert VALIDATION_SPEC and VALIDATION_SPEC.loader
VALIDATION = importlib.util.module_from_spec(VALIDATION_SPEC)
VALIDATION_SPEC.loader.exec_module(VALIDATION)

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
GRAPH = "https://w3id.org/project-chemie-digital/graph/"
RESOURCE_GRAPH = URIRef(f"{GRAPH}tests/flow-diagram")

DIAGRAM = URIRef(f"{EX}flow-diagram-system-fixture")
NODE_ONE = URIRef(f"{EX}flow-node-one")
NODE_TWO = URIRef(f"{EX}flow-node-two")
EDGE_ONE = URIRef(f"{EX}flow-edge-one")
OUTSIDE_NODE = URIRef(f"{EX}flow-node-outside")
SCENE_ITEM = URIRef(f"{EX}flow-diagram-scene-item")


def cd(local: str) -> URIRef:
    return URIRef(CD + local)


def add_node(graph, node: URIRef, position: int, label: str) -> None:
    graph.add((node, RDF.type, cd("DiagramNode")))
    graph.add((node, SKOS.prefLabel, Literal(label, lang="en")))
    graph.add((node, cd("position"), Literal(position, datatype=XSD.integer)))
    graph.add((node, cd("authoredResource"), Literal(True)))


def add_edge(graph, edge: URIRef, position: int, source: URIRef, target: URIRef) -> None:
    graph.add((edge, RDF.type, cd("DiagramEdge")))
    graph.add((edge, SKOS.prefLabel, Literal("flows to", lang="en")))
    graph.add((edge, cd("position"), Literal(position, datatype=XSD.integer)))
    graph.add((edge, cd("sourceNode"), source))
    graph.add((edge, cd("targetNode"), target))
    graph.add((edge, cd("authoredResource"), Literal(True)))


def add_diagram_scene_item(dataset: Dataset, *, role: str = "DiagramRole", selector: str = "cd:body") -> None:
    graph = dataset.graph(RESOURCE_GRAPH)
    graph.add((SCENE_ITEM, RDF.type, cd("SceneItem")))
    graph.add((SCENE_ITEM, cd("position"), Literal(1, datatype=XSD.integer)))
    graph.add((SCENE_ITEM, cd("selectsResource"), DIAGRAM))
    graph.add((SCENE_ITEM, cd("communicativeRole"), cd(role)))
    graph.add((SCENE_ITEM, cd("selectionPath"), Literal(selector)))
    graph.add((SCENE_ITEM, cd("language"), Literal("en")))


def fixture() -> Dataset:
    dataset = VALIDATION.assemble_dataset()
    graph = dataset.graph(RESOURCE_GRAPH)
    graph.add((DIAGRAM, RDF.type, cd("FlowDiagram")))
    graph.add((DIAGRAM, SKOS.prefLabel, Literal("System flow fixture", lang="en")))
    graph.add((DIAGRAM, cd("body"), Literal("A renderer-neutral flow diagram fixture.", lang="en")))
    graph.add((DIAGRAM, cd("authoredResource"), Literal(True)))
    graph.add((DIAGRAM, cd("hasDiagramNode"), NODE_ONE))
    graph.add((DIAGRAM, cd("hasDiagramNode"), NODE_TWO))
    graph.add((DIAGRAM, cd("hasDiagramEdge"), EDGE_ONE))
    graph.add((DIAGRAM, cd("focusNode"), NODE_TWO))
    add_node(graph, NODE_ONE, 1, "Input")
    add_node(graph, NODE_TWO, 2, "Output")
    add_edge(graph, EDGE_ONE, 1, NODE_ONE, NODE_TWO)
    return dataset


class FlowDiagramSemanticTests(unittest.TestCase):
    def assert_conforms(self, dataset: Dataset) -> None:
        conforms, _report_graph, report = VALIDATION.validate_dataset(dataset)
        self.assertTrue(conforms, report)

    def assert_violates(self, dataset: Dataset, message: str) -> None:
        conforms, _report_graph, report = VALIDATION.validate_dataset(dataset)
        self.assertFalse(conforms, report)
        self.assertIn(message, report)

    def test_complete_canonical_dataset_remains_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)

    def test_valid_renderer_neutral_flow_diagram_conforms(self) -> None:
        self.assert_conforms(fixture())

    def test_focus_node_is_optional(self) -> None:
        dataset = fixture()
        graph = dataset.graph(RESOURCE_GRAPH)
        graph.remove((DIAGRAM, cd("focusNode"), NODE_TWO))
        self.assert_conforms(dataset)

    def test_diagram_role_scene_item_conforms(self) -> None:
        dataset = fixture()
        add_diagram_scene_item(dataset)
        self.assert_conforms(dataset)

    def test_flow_diagram_scene_item_requires_diagram_role(self) -> None:
        dataset = fixture()
        add_diagram_scene_item(dataset, role="QuotationRole")
        self.assert_violates(dataset, "A FlowDiagram selected by a scene item requires DiagramRole")

    def test_diagram_role_requires_body_selector(self) -> None:
        dataset = fixture()
        add_diagram_scene_item(dataset, selector="skos:prefLabel@en")
        self.assert_violates(dataset, "DiagramRole requires exactly the cd:body selector")

    def test_focus_node_must_belong_to_diagram(self) -> None:
        dataset = fixture()
        graph = dataset.graph(RESOURCE_GRAPH)
        graph.remove((DIAGRAM, cd("focusNode"), NODE_TWO))
        graph.add((DIAGRAM, cd("focusNode"), OUTSIDE_NODE))
        add_node(graph, OUTSIDE_NODE, 3, "Outside")
        self.assert_violates(dataset, "focusNode must belong to the diagram's own node set")

    def test_edge_endpoints_must_belong_to_diagram(self) -> None:
        dataset = fixture()
        graph = dataset.graph(RESOURCE_GRAPH)
        add_node(graph, OUTSIDE_NODE, 3, "Outside")
        graph.remove((EDGE_ONE, cd("targetNode"), NODE_TWO))
        graph.add((EDGE_ONE, cd("targetNode"), OUTSIDE_NODE))
        self.assert_violates(dataset, "endpoint must belong to the owning FlowDiagram node set")

    def test_node_positions_must_be_unique_and_contiguous(self) -> None:
        dataset = fixture()
        graph = dataset.graph(RESOURCE_GRAPH)
        graph.set((NODE_TWO, cd("position"), Literal(1, datatype=XSD.integer)))
        self.assert_violates(dataset, "DiagramNode positions must be unique")

        dataset = fixture()
        graph = dataset.graph(RESOURCE_GRAPH)
        graph.set((NODE_TWO, cd("position"), Literal(3, datatype=XSD.integer)))
        self.assert_violates(dataset, "DiagramNode positions must be contiguous")

    def test_edge_positions_must_be_unique_and_contiguous(self) -> None:
        dataset = fixture()
        graph = dataset.graph(RESOURCE_GRAPH)
        edge_two = URIRef(f"{EX}flow-edge-two")
        graph.add((DIAGRAM, cd("hasDiagramEdge"), edge_two))
        add_edge(graph, edge_two, 1, NODE_TWO, NODE_ONE)
        self.assert_violates(dataset, "DiagramEdge positions must be unique")

        dataset = fixture()
        graph = dataset.graph(RESOURCE_GRAPH)
        edge_two = URIRef(f"{EX}flow-edge-two")
        graph.add((DIAGRAM, cd("hasDiagramEdge"), edge_two))
        add_edge(graph, edge_two, 3, NODE_TWO, NODE_ONE)
        self.assert_violates(dataset, "DiagramEdge positions must be contiguous")


if __name__ == "__main__":
    unittest.main()
