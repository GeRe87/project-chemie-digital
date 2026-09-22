from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import DCTERMS, RDF, SKOS, XSD, Dataset, Literal, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

RUNTIME_SPEC = importlib.util.spec_from_file_location(
    "generate_canonical_runtime_flow_projection_tests",
    SCRIPTS / "generate_canonical_runtime.py",
)
assert RUNTIME_SPEC and RUNTIME_SPEC.loader
RUNTIME = importlib.util.module_from_spec(RUNTIME_SPEC)
RUNTIME_SPEC.loader.exec_module(RUNTIME)

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
GRAPH = "https://w3id.org/project-chemie-digital/graph/"

PATH = URIRef(f"{EX}path-flow-projection")
PATH_GRAPH = f"{GRAPH}paths/flow-projection"
RESOURCE_GRAPH = URIRef(f"{GRAPH}tests/flow-projection")
STEP = URIRef(f"{EX}path-step-flow-projection")
SCENE = URIRef(f"{EX}scene-flow-projection")
FOCUS = URIRef(f"{EX}concept-flow-projection")
HEADING_ITEM = URIRef(f"{EX}scene-item-flow-heading")
DIAGRAM_ITEM = URIRef(f"{EX}scene-item-flow-diagram")
DIAGRAM = URIRef(f"{EX}flow-diagram-projection")
NODE_ONE = URIRef(f"{EX}flow-projection-node-one")
NODE_TWO = URIRef(f"{EX}flow-projection-node-two")
EDGE_ONE = URIRef(f"{EX}flow-projection-edge-one")
EDGE_TWO = URIRef(f"{EX}flow-projection-edge-two")
OUTSIDE_NODE = URIRef(f"{EX}flow-projection-node-outside")
GROUP_ONE = URIRef(f"{EX}flow-projection-group-one")
GROUP_TWO = URIRef(f"{EX}flow-projection-group-two")
STATE = URIRef(f"{EX}flow-projection-state-drill-down")


def cd(local: str) -> URIRef:
    return URIRef(CD + local)


def selected_path() -> object:
    return RUNTIME.CoursePathReference(str(PATH), PATH_GRAPH)


def flow_scene_dataset(*, include_focus: bool = False, include_heading: bool = True) -> Dataset:
    dataset = Dataset()
    path_graph = dataset.graph(URIRef(PATH_GRAPH))
    graph = dataset.graph(RESOURCE_GRAPH)

    path_graph.add((PATH, RDF.type, cd("LearningPath")))
    path_graph.add((PATH, cd("hasStep"), STEP))
    path_graph.add((STEP, cd("position"), Literal(1, datatype=XSD.integer)))
    path_graph.add((STEP, cd("usesScene"), SCENE))

    graph.add((FOCUS, RDF.type, cd("Concept")))
    graph.add((FOCUS, SKOS.prefLabel, Literal("Diagramtest", lang="de")))
    graph.add((FOCUS, cd("authoredResource"), Literal(True)))

    graph.add((SCENE, RDF.type, cd("SceneDefinition")))
    graph.add((SCENE, cd("focusConcept"), FOCUS))
    if include_heading:
        graph.add((SCENE, cd("hasSceneItem"), HEADING_ITEM))
        graph.add((HEADING_ITEM, RDF.type, cd("SceneItem")))
        graph.add((HEADING_ITEM, cd("position"), Literal(1, datatype=XSD.integer)))
        graph.add((HEADING_ITEM, cd("selectsResource"), FOCUS))
        graph.add((HEADING_ITEM, cd("communicativeRole"), cd("HeadingRole")))
        graph.add((HEADING_ITEM, cd("selectionPath"), Literal("skos:prefLabel@de")))
        graph.add((HEADING_ITEM, cd("language"), Literal("de")))

    graph.add((SCENE, cd("hasSceneItem"), DIAGRAM_ITEM))
    graph.add((DIAGRAM_ITEM, RDF.type, cd("SceneItem")))
    graph.add((DIAGRAM_ITEM, cd("position"), Literal(2 if include_heading else 1, datatype=XSD.integer)))
    graph.add((DIAGRAM_ITEM, cd("selectsResource"), DIAGRAM))
    graph.add((DIAGRAM_ITEM, cd("communicativeRole"), cd("DiagramRole")))
    graph.add((DIAGRAM_ITEM, cd("selectionPath"), Literal("cd:body")))
    graph.add((DIAGRAM_ITEM, cd("language"), Literal("de")))

    graph.add((DIAGRAM, RDF.type, cd("FlowDiagram")))
    graph.add((DIAGRAM, SKOS.prefLabel, Literal("Prozessfluss", lang="de")))
    graph.add((DIAGRAM, SKOS.prefLabel, Literal("Process flow", lang="en")))
    graph.add((DIAGRAM, cd("body"), Literal("Renderer-neutrale Beschreibung.", lang="de")))
    graph.add((DIAGRAM, cd("authoredResource"), Literal(True)))
    graph.add((DIAGRAM, cd("hasDiagramNode"), NODE_TWO))
    graph.add((DIAGRAM, cd("hasDiagramNode"), NODE_ONE))
    graph.add((DIAGRAM, cd("hasDiagramEdge"), EDGE_ONE))
    if include_focus:
        graph.add((DIAGRAM, cd("focusNode"), NODE_TWO))

    graph.add((NODE_ONE, RDF.type, cd("DiagramNode")))
    graph.add((NODE_ONE, SKOS.prefLabel, Literal("Eingang", lang="de")))
    graph.add((NODE_ONE, SKOS.prefLabel, Literal("Input", lang="en")))
    graph.add((NODE_ONE, cd("body"), Literal("Rohdatenquelle", lang="de")))
    graph.add((NODE_ONE, cd("position"), Literal(1, datatype=XSD.integer)))
    graph.add((NODE_ONE, cd("authoredResource"), Literal(True)))

    graph.add((NODE_TWO, RDF.type, cd("DiagramNode")))
    graph.add((NODE_TWO, SKOS.prefLabel, Literal("Output", lang="en")))
    graph.add((NODE_TWO, DCTERMS.title, Literal("Ausgangstitel", lang="de")))
    graph.add((NODE_TWO, cd("position"), Literal(2, datatype=XSD.integer)))
    graph.add((NODE_TWO, cd("authoredResource"), Literal(True)))

    graph.add((EDGE_ONE, RDF.type, cd("DiagramEdge")))
    graph.add((EDGE_ONE, SKOS.prefLabel, Literal("führt zu", lang="de")))
    graph.add((EDGE_ONE, SKOS.prefLabel, Literal("flows to", lang="en")))
    graph.add((EDGE_ONE, cd("position"), Literal(1, datatype=XSD.integer)))
    graph.add((EDGE_ONE, cd("sourceNode"), NODE_ONE))
    graph.add((EDGE_ONE, cd("targetNode"), NODE_TWO))
    graph.add((EDGE_ONE, cd("authoredResource"), Literal(True)))
    return dataset


class FlowDiagramProjectionTests(unittest.TestCase):
    def diagram_block(self, document: dict) -> dict:
        return next(block for block in document["scenes"][0]["blocks"] if block["kind"] == "diagram")

    def test_valid_diagram_projects_as_scene_document_1_2_without_required_focus(self) -> None:
        document = RUNTIME.compile_scene_document(flow_scene_dataset(), selected_path())
        self.assertEqual("1.2", document["version"])
        block = self.diagram_block(document)
        self.assertEqual("flow", block["diagramType"])
        self.assertEqual("Prozessfluss", block["label"])
        self.assertEqual("Renderer-neutrale Beschreibung.", block["description"])
        self.assertNotIn("focusNodeId", block)
        self.assertEqual(
            [RUNTIME.compact(NODE_ONE), RUNTIME.compact(NODE_TWO)],
            [node["id"] for node in block["nodes"]],
        )
        self.assertEqual([RUNTIME.compact(EDGE_ONE)], [edge["id"] for edge in block["edges"]])
        self.assertEqual(
            {"cd:body", "skos:prefLabel@de"},
            {source["relationPath"] for source in block["source"]},
        )
        self.assertEqual("skos:prefLabel@de", block["nodes"][0]["source"][0]["relationPath"])
        self.assertEqual("Rohdatenquelle", block["nodes"][0]["description"])
        self.assertEqual("cd:body", block["nodes"][0]["source"][1]["relationPath"])
        self.assertEqual("Ausgangstitel", block["nodes"][1]["label"])
        self.assertEqual("dct:title", block["nodes"][1]["source"][0]["relationPath"])
        self.assertEqual("skos:prefLabel@de", block["edges"][0]["source"][0]["relationPath"])

    def test_focus_node_id_is_preserved_explicitly(self) -> None:
        document = RUNTIME.compile_scene_document(flow_scene_dataset(include_focus=True), selected_path())
        block = self.diagram_block(document)
        self.assertEqual(RUNTIME.compact(NODE_TWO), block["focusNodeId"])
        focused = next(node for node in block["nodes"] if node["id"] == RUNTIME.compact(NODE_TWO))
        self.assertEqual("primary", focused["emphasis"])

    def test_diagram_only_scene_uses_diagram_label_for_accessibility(self) -> None:
        document = RUNTIME.compile_scene_document(
            flow_scene_dataset(include_heading=False),
            selected_path(),
        )
        self.assertEqual("1.2", document["version"])
        self.assertEqual("Prozessfluss", document["scenes"][0]["accessibility"]["label"])

    def test_static_fallback_preserves_flow_structure_order_focus_and_sources(self) -> None:
        dataset = flow_scene_dataset(include_focus=True, include_heading=False)
        graph = dataset.graph(RESOURCE_GRAPH)
        graph.add((DIAGRAM, cd("hasDiagramEdge"), EDGE_TWO))
        graph.add((EDGE_TWO, RDF.type, cd("DiagramEdge")))
        graph.add((EDGE_TWO, SKOS.prefLabel, Literal("zurück zu", lang="de")))
        graph.add((EDGE_TWO, cd("position"), Literal(2, datatype=XSD.integer)))
        graph.add((EDGE_TWO, cd("sourceNode"), NODE_TWO))
        graph.add((EDGE_TWO, cd("targetNode"), NODE_ONE))
        graph.add((EDGE_TWO, cd("authoredResource"), Literal(True)))

        document = RUNTIME.compile_scene_document(dataset, selected_path())
        fallback = RUNTIME.static_fallback({"sceneDocuments": [document]})

        self.assertIn('<figure class="diagram-fallback" data-diagram-type="flow"', fallback)
        self.assertIn('data-focus-node-id="ex:flow-projection-node-two"', fallback)
        self.assertIn("<strong>Prozessfluss</strong>", fallback)
        self.assertIn("<span>Renderer-neutrale Beschreibung.</span>", fallback)
        self.assertLess(
            fallback.index('data-diagram-node-id="ex:flow-projection-node-one"'),
            fallback.index('data-diagram-node-id="ex:flow-projection-node-two"'),
        )
        self.assertLess(
            fallback.index('data-diagram-edge-id="ex:flow-projection-edge-one"'),
            fallback.index('data-diagram-edge-id="ex:flow-projection-edge-two"'),
        )
        self.assertIn("Eingang — führt zu → Ausgangstitel", fallback)
        self.assertIn("Ausgangstitel — zurück zu → Eingang", fallback)
        self.assertIn('data-resource-id="ex:flow-diagram-projection"', fallback)
        self.assertIn('data-relation-path="cd:body skos:prefLabel@de"', fallback)
        self.assertIn('data-resource-id="ex:flow-projection-node-two"', fallback)
        self.assertIn('data-relation-path="dct:title"', fallback)
        self.assertIn('data-resource-id="ex:flow-projection-edge-two"', fallback)
        self.assertIn('data-relation-path="skos:prefLabel@de"', fallback)

    def test_external_edge_endpoint_fails_closed(self) -> None:
        dataset = flow_scene_dataset()
        graph = dataset.graph(RESOURCE_GRAPH)
        graph.remove((EDGE_ONE, cd("targetNode"), NODE_TWO))
        graph.add((EDGE_ONE, cd("targetNode"), OUTSIDE_NODE))
        with self.assertRaisesRegex(ValueError, "references a node outside"):
            RUNTIME.compile_scene_document(dataset, selected_path())

    def test_non_contiguous_node_positions_fail_closed(self) -> None:
        dataset = flow_scene_dataset()
        graph = dataset.graph(RESOURCE_GRAPH)
        graph.set((NODE_TWO, cd("position"), Literal(3, datatype=XSD.integer)))
        with self.assertRaisesRegex(ValueError, "DiagramNode positions must be unique and contiguous"):
            RUNTIME.compile_scene_document(dataset, selected_path())

    def test_flow_diagram_with_non_diagram_role_fails_closed(self) -> None:
        dataset = flow_scene_dataset()
        graph = dataset.graph(RESOURCE_GRAPH)
        graph.set((DIAGRAM_ITEM, cd("communicativeRole"), cd("QuotationRole")))
        with self.assertRaisesRegex(ValueError, "requires DiagramRole"):
            RUNTIME.compile_scene_document(dataset, selected_path())

    def test_pure_relation_free_network_projects_through_diagram_role(self) -> None:
        dataset = flow_scene_dataset()
        graph = dataset.graph(RESOURCE_GRAPH)
        graph.remove((DIAGRAM, RDF.type, cd("FlowDiagram")))
        graph.add((DIAGRAM, RDF.type, cd("NetworkDiagram")))
        graph.remove((DIAGRAM, cd("hasDiagramEdge"), EDGE_ONE))

        for group, label in ((GROUP_ONE, "Core"), (GROUP_TWO, "Context")):
            graph.add((DIAGRAM, cd("hasDiagramGroup"), group))
            graph.add((group, RDF.type, cd("DiagramGroup")))
            graph.add((group, SKOS.prefLabel, Literal(label, lang="de")))
            graph.add((group, cd("authoredResource"), Literal(True)))

        graph.add((NODE_ONE, cd("memberOfDiagramGroup"), GROUP_ONE))
        graph.add((NODE_TWO, cd("memberOfDiagramGroup"), GROUP_TWO))

        block = self.diagram_block(RUNTIME.compile_scene_document(dataset, selected_path()))

        self.assertEqual("network", block["diagramType"])
        self.assertEqual([], block["edges"])
        self.assertEqual(
            [RUNTIME.compact(GROUP_ONE), RUNTIME.compact(GROUP_TWO)],
            [group["id"] for group in block["groups"]],
        )


    def test_synthetic_network_state_projects_selection_focus_and_context(self) -> None:
        dataset = flow_scene_dataset()
        graph = dataset.graph(RESOURCE_GRAPH)
        graph.add((DIAGRAM, RDF.type, cd("NetworkDiagram")))
        for group, label in ((GROUP_ONE, "Domain"), (GROUP_TWO, "Context")):
            graph.add((DIAGRAM, cd("hasDiagramGroup"), group))
            graph.add((group, RDF.type, cd("DiagramGroup")))
            graph.add((group, SKOS.prefLabel, Literal(label, lang="de")))
            graph.add((group, cd("authoredResource"), Literal(True)))
        graph.add((NODE_ONE, cd("memberOfDiagramGroup"), GROUP_ONE))
        graph.add((NODE_TWO, cd("memberOfDiagramGroup"), GROUP_TWO))
        graph.add((DIAGRAM, cd("hasDiagramState"), STATE))
        graph.add((STATE, RDF.type, cd("DiagramState")))
        graph.add((STATE, SKOS.prefLabel, Literal("Vertiefung", lang="de")))
        graph.add((STATE, cd("authoredResource"), Literal(True)))
        graph.add((STATE, cd("activeDiagramNode"), NODE_ONE))
        graph.add((STATE, cd("activeDiagramEdge"), EDGE_ONE))
        graph.add((STATE, cd("activeDiagramGroup"), GROUP_ONE))
        graph.add((STATE, cd("focusDiagramGroup"), GROUP_ONE))
        graph.add((STATE, cd("contextDiagramGroup"), GROUP_TWO))
        block = self.diagram_block(RUNTIME.compile_scene_document(dataset, selected_path()))
        self.assertEqual("network", block["diagramType"])
        self.assertEqual([RUNTIME.compact(NODE_ONE)], block["states"][0]["activeNodeIds"])
        self.assertEqual([RUNTIME.compact(EDGE_ONE)], block["states"][0]["activeEdgeIds"])
        self.assertEqual(RUNTIME.compact(GROUP_ONE), block["states"][0]["focusGroupId"])
        self.assertEqual([RUNTIME.compact(GROUP_TWO)], block["states"][0]["contextGroupIds"])


if __name__ == "__main__":
    unittest.main()
