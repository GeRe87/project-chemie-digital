from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import RDF, SKOS, XSD, Dataset, Literal, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

RUNTIME_SPEC = importlib.util.spec_from_file_location(
    "generate_canonical_runtime_semantic_disclosure_tests",
    SCRIPTS / "generate_canonical_runtime.py",
)
assert RUNTIME_SPEC and RUNTIME_SPEC.loader
RUNTIME = importlib.util.module_from_spec(RUNTIME_SPEC)
RUNTIME_SPEC.loader.exec_module(RUNTIME)

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
GRAPH = "https://w3id.org/project-chemie-digital/graph/"

PATH = URIRef(f"{EX}path-semantic-disclosure")
PATH_GRAPH = f"{GRAPH}paths/semantic-disclosure"
RESOURCE_GRAPH = URIRef(f"{GRAPH}tests/semantic-disclosure")
STEP = URIRef(f"{EX}path-step-semantic-disclosure")
SCENE = URIRef(f"{EX}scene-semantic-disclosure")
FOCUS = URIRef(f"{EX}concept-semantic-disclosure")

HEADING_ITEM = URIRef(f"{EX}scene-item-semantic-heading")
TABLE_ITEM = URIRef(f"{EX}scene-item-semantic-table")
CHART_ITEM = URIRef(f"{EX}scene-item-semantic-chart")
INTERPRETATION_ITEM = URIRef(f"{EX}scene-item-semantic-interpretation")

TABLE = URIRef(f"{EX}example-table")
COLUMN = URIRef(f"{EX}example-table-column")
ROW = URIRef(f"{EX}example-table-row")
CELL = URIRef(f"{EX}example-table-cell")
DATASET = URIRef(f"{EX}example-dataset")
OBSERVATION = URIRef(f"{EX}example-observation")
CHART = URIRef(f"{EX}example-chart")
ANNOTATION = URIRef(f"{EX}example-annotation")
INTERPRETATION = URIRef(f"{EX}example-interpretation")


def cd(local: str) -> URIRef:
    return URIRef(CD + local)


def selected_path() -> object:
    return RUNTIME.CoursePathReference(str(PATH), PATH_GRAPH)


def scene_item(
    graph,
    item: URIRef,
    *,
    position: int,
    selected: URIRef,
    role: str,
    selection_path: str,
) -> None:
    graph.add((SCENE, cd("hasSceneItem"), item))
    graph.add((item, RDF.type, cd("SceneItem")))
    graph.add((item, cd("position"), Literal(position, datatype=XSD.integer)))
    graph.add((item, cd("selectsResource"), selected))
    graph.add((item, cd("communicativeRole"), cd(role)))
    graph.add((item, cd("selectionPath"), Literal(selection_path)))
    graph.add((item, cd("language"), Literal("en")))


def semantic_dataset(
    *,
    link_table: bool = True,
    link_interpretation: bool = True,
) -> Dataset:
    dataset = Dataset()
    path_graph = dataset.graph(URIRef(PATH_GRAPH))
    graph = dataset.graph(RESOURCE_GRAPH)

    path_graph.add((PATH, RDF.type, cd("LearningPath")))
    path_graph.add((PATH, cd("hasStep"), STEP))
    path_graph.add((STEP, cd("position"), Literal(1, datatype=XSD.integer)))
    path_graph.add((STEP, cd("usesScene"), SCENE))

    graph.add((FOCUS, RDF.type, cd("Concept")))
    graph.add((FOCUS, SKOS.prefLabel, Literal("Evidence example", lang="en")))
    graph.add((SCENE, RDF.type, cd("SceneDefinition")))
    graph.add((SCENE, cd("focusConcept"), FOCUS))

    scene_item(
        graph,
        HEADING_ITEM,
        position=1,
        selected=FOCUS,
        role="HeadingRole",
        selection_path="skos:prefLabel@en",
    )
    scene_item(
        graph,
        TABLE_ITEM,
        position=2,
        selected=TABLE,
        role="TableRole",
        selection_path="cd:hasTableRow",
    )
    scene_item(
        graph,
        CHART_ITEM,
        position=3,
        selected=CHART,
        role="ChartRole",
        selection_path="cd:body",
    )
    scene_item(
        graph,
        INTERPRETATION_ITEM,
        position=4,
        selected=INTERPRETATION,
        role="StatementRole",
        selection_path="cd:body",
    )

    graph.add((TABLE, RDF.type, cd("TableDefinition")))
    graph.add((TABLE, SKOS.prefLabel, Literal("Raw evidence", lang="en")))
    graph.add((TABLE, cd("hasTableColumn"), COLUMN))
    graph.add((TABLE, cd("hasTableRow"), ROW))
    graph.add((COLUMN, RDF.type, cd("TableColumn")))
    graph.add((COLUMN, SKOS.prefLabel, Literal("Value", lang="en")))
    graph.add((COLUMN, cd("position"), Literal(1, datatype=XSD.integer)))
    graph.add((ROW, RDF.type, cd("TableRow")))
    graph.add((ROW, cd("position"), Literal(1, datatype=XSD.integer)))
    graph.add((ROW, cd("hasTableCell"), CELL))
    graph.add((CELL, RDF.type, cd("TableCell")))
    graph.add((CELL, cd("position"), Literal(1, datatype=XSD.integer)))
    graph.add((CELL, cd("body"), Literal("7", lang="en")))

    graph.add((DATASET, RDF.type, cd("Dataset")))
    graph.add((DATASET, cd("hasObservation"), OBSERVATION))
    graph.add((OBSERVATION, RDF.type, cd("Observation")))
    graph.add((OBSERVATION, SKOS.prefLabel, Literal("Sample", lang="en")))
    graph.add((OBSERVATION, cd("position"), Literal(1, datatype=XSD.integer)))
    graph.add((OBSERVATION, cd("numericValue"), Literal("7", datatype=XSD.decimal)))

    graph.add((CHART, RDF.type, cd("ChartDefinition")))
    graph.add((CHART, SKOS.prefLabel, Literal("Evidence chart", lang="en")))
    graph.add((CHART, cd("body"), Literal("Visualized evidence", lang="en")))
    graph.add((CHART, cd("chartType"), cd("BarChart")))
    graph.add((CHART, cd("xAxisLabel"), Literal("Sample", lang="en")))
    graph.add((CHART, cd("yAxisLabel"), Literal("Value", lang="en")))
    graph.add((CHART, cd("usesDataset"), DATASET))
    graph.add((CHART, cd("hasChartAnnotation"), ANNOTATION))
    if link_table:
        graph.add((CHART, cd("derivedFromResource"), TABLE))

    graph.add((ANNOTATION, RDF.type, cd("ChartPointAnnotation")))
    graph.add((ANNOTATION, cd("position"), Literal(1, datatype=XSD.integer)))
    graph.add((ANNOTATION, cd("body"), Literal("Authored evidence focus", lang="en")))
    graph.add((ANNOTATION, cd("targetObservation"), OBSERVATION))

    graph.add((INTERPRETATION, RDF.type, cd("Interpretation")))
    graph.add((INTERPRETATION, cd("body"), Literal("Interpret the highlighted evidence.", lang="en")))
    if link_interpretation:
        graph.add((INTERPRETATION, cd("interpretsResource"), ANNOTATION))

    return dataset


class SemanticEvidenceDisclosureTests(unittest.TestCase):
    def blocks(self, **kwargs) -> list[dict]:
        document = RUNTIME.compile_scene_document(semantic_dataset(**kwargs), selected_path())
        return document["scenes"][0]["blocks"]

    def test_resource_relations_drive_table_and_interpretation_disclosure(self) -> None:
        blocks = self.blocks()
        table, chart, interpretation = blocks[1], blocks[2], blocks[3]

        self.assertEqual(
            {
                "order": 1,
                "mode": "progressive",
                "step": 1,
                "triggerResourceId": "ex:example-chart",
            },
            table["disclosure"],
        )
        self.assertEqual("bar", chart["chartType"])
        self.assertEqual(
            [{
                "id": "ex:example-annotation",
                "kind": "point",
                "datumId": "ex:example-observation",
                "label": "Authored evidence focus",
                "source": chart["annotations"][0]["source"],
            }],
            chart["annotations"],
        )
        self.assertEqual(
            {
                "order": 3,
                "mode": "progressive",
                "step": 3,
                "triggerResourceId": "ex:example-annotation",
            },
            interpretation["disclosure"],
        )

    def test_table_remains_initial_without_chart_derivation_relation(self) -> None:
        table = self.blocks(link_table=False)[1]
        self.assertEqual({"order": 1, "mode": "initial"}, table["disclosure"])

    def test_interpretation_remains_initial_without_interpretation_relation(self) -> None:
        interpretation = self.blocks(link_interpretation=False)[3]
        self.assertEqual({"order": 3, "mode": "initial"}, interpretation["disclosure"])


if __name__ == "__main__":
    unittest.main()
