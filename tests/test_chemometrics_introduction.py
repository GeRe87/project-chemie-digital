from __future__ import annotations

import sys
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, SKOS, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import generate_canonical_runtime_media as RUNTIME  # noqa: E402
import rdf_dataset as RDF_DATASET  # noqa: E402
import validate_semantics as VALIDATION  # noqa: E402

from course_path_selection import (  # noqa: E402
    CoursePathReference,
    CourseUnitPathSelectionRequest,
    select_course_unit_path,
)

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")

COURSE_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/specifications/course-scale"
)
CONTENT_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-introduction"
)
PATH_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/paths/chemometrics-introduction"
)
SCENE_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/scenes/chemometrics-introduction"
)

OFFERING = EX["teaching-offering-chemometrics-applied-statistics"]
UNIT = EX["learning-unit-chemometrics-introduction"]
PLACEMENT = EX["unit-placement-chemometrics-introduction"]
PATH = EX["path-chemometrics-introduction"]

EXPECTED_TOPICS = {
    EX["chemometrics-course-title"],
    EX["chemometrics-course-overview"],
    EX["chemometrics-lecturer-context"],
    EX["chemometrics-course-format"],
    EX["chemometrics-course-roadmap"],
    EX["chemometrics-introduction-round"],
}

EXPECTED_SCENES = [
    EX["scene-chemometrics-introduction-title"],
    EX["scene-chemometrics-introduction-overview"],
    EX["scene-chemometrics-introduction-lecturer"],
    EX["scene-chemometrics-introduction-format"],
    EX["scene-chemometrics-introduction-roadmap"],
    EX["scene-chemometrics-introduction-round"],
]

EXPECTED_BLOCK_KINDS = [
    ["prose"],
    ["prose", "group", "table", "chart", "list", "prose"],
    ["prose", "list", "prose"],
    ["prose", "prose", "diagram", "prose"],
    ["prose", "diagram"],
    ["prose", "prose", "prose", "definition-list", "prose"],
]


def request() -> CourseUnitPathSelectionRequest:
    return CourseUnitPathSelectionRequest(
        offering_id=str(OFFERING),
        placement_id=str(PLACEMENT),
        unit_id=str(UNIT),
        requested_path_id=str(PATH),
        requested_path_graph_id=str(PATH_GRAPH),
    )


class ChemometricsIntroductionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.course_graph = cls.dataset.graph(COURSE_GRAPH)
        cls.content_graph = cls.dataset.graph(CONTENT_GRAPH)
        cls.path_graph = cls.dataset.graph(PATH_GRAPH)
        cls.scene_graph = cls.dataset.graph(SCENE_GRAPH)
        cls.artifact = RUNTIME.build_artifact(request())
        cls.document = cls.artifact["sceneDocuments"][0]

    def test_course_order_is_unchanged_and_introduction_has_six_focus_concepts(self) -> None:
        placements = []
        for placement in self.course_graph.objects(OFFERING, CD.hasUnitPlacement):
            position = int(next(self.course_graph.objects(placement, CD.position)))
            unit = next(self.course_graph.objects(placement, CD.placesLearningUnit))
            placements.append((position, placement, unit))
        self.assertEqual(
            [
                (10, PLACEMENT, UNIT),
                (
                    20,
                    EX["unit-placement-chemometrics-random-variables"],
                    EX["learning-unit-random-variables"],
                ),
                (
                    30,
                    EX["unit-placement-chemometrics-mean-values"],
                    EX["learning-unit-mean-values"],
                ),
                (
                    40,
                    EX["unit-placement-chemometrics-variance-dispersion"],
                    EX["learning-unit-variance-dispersion"],
                ),
            ],
            sorted(placements),
        )
        self.assertEqual(EXPECTED_TOPICS, set(self.course_graph.objects(UNIT, CD.hasFocusConcept)))
        for concept in EXPECTED_TOPICS:
            with self.subTest(concept=concept):
                self.assertEqual({CD.Concept}, set(self.content_graph.objects(concept, RDF.type)))
                self.assertEqual(1, len(set(self.content_graph.objects(concept, CD.hasDefinition))))

    def test_title_slide_is_a_single_hero_heading_scene(self) -> None:
        scene = self.document["scenes"][0]
        self.assertEqual(["prose"], [block["kind"] for block in scene["blocks"]])
        heading = scene["blocks"][0]
        self.assertEqual("Chemometrics & Applied Statistics", heading["text"])
        self.assertEqual({"kind": "introduce"}, heading["intent"])

    def test_course_overview_is_a_single_nitrate_case_study(self) -> None:
        problem = str(next(self.content_graph.objects(EX["chemometrics-nitrate-case-problem"], CD.body)))
        self.assertIn("Three water samples", problem)
        self.assertIn("measured four times", problem)

        media = EX["media-chemometrics-nitrate-water-samples"]
        self.assertEqual(
            {Literal("/chemometrics/nitrate-water-samples.svg", datatype=URIRef("http://www.w3.org/2001/XMLSchema#anyURI"))},
            set(self.content_graph.objects(media, CD.uri)),
        )
        self.assertEqual({"image/svg+xml"}, {str(value) for value in self.content_graph.objects(media, CD.mediaType)})

        table = EX["table-chemometrics-nitrate-replicates"]
        rows = sorted(
            self.content_graph.objects(table, CD.hasTableRow),
            key=lambda row: int(next(self.content_graph.objects(row, CD.position))),
        )
        self.assertEqual(3, len(rows))
        table_values = []
        for row in rows:
            cells = sorted(
                self.content_graph.objects(row, CD.hasTableCell),
                key=lambda cell: int(next(self.content_graph.objects(cell, CD.position))),
            )
            table_values.append([str(next(self.content_graph.objects(cell, CD.body))) for cell in cells])
        self.assertEqual(
            [
                ["A · upstream", "2.1", "2.4", "2.0", "2.3"],
                ["B · tap water", "4.8", "5.1", "4.9", "5.0"],
                ["C · runoff", "18.5", "19.2", "18.9", "19.1"],
            ],
            table_values,
        )

        chart = EX["chart-chemometrics-nitrate-means"]
        self.assertEqual({CD.BarChart}, set(self.content_graph.objects(chart, CD.chartType)))
        dataset = next(self.content_graph.objects(chart, CD.usesDataset))
        observations = sorted(
            self.content_graph.objects(dataset, CD.hasObservation),
            key=lambda observation: int(next(self.content_graph.objects(observation, CD.position))),
        )
        self.assertEqual(
            ["A · upstream", "B · tap water", "C · runoff"],
            [str(next(self.content_graph.objects(observation, SKOS.prefLabel))) for observation in observations],
        )
        self.assertEqual(
            [2.20, 4.95, 18.925],
            [float(next(self.content_graph.objects(observation, CD.numericValue))) for observation in observations],
        )
        chart_body = str(next(self.content_graph.objects(chart, CD.body)))
        self.assertIn("Sample SD (mg/L)", chart_body)
        self.assertIn("A 0.18", chart_body)
        self.assertIn("B 0.13", chart_body)
        self.assertIn("C 0.31", chart_body)

        discussion = sorted(
            self.content_graph.objects(EX["chemometrics-nitrate-case-discussion"], CD.hasKeyPoint),
            key=lambda point: int(next(self.content_graph.objects(point, CD.position))),
        )
        self.assertEqual(3, len(discussion))
        self.assertIn("Sample C is clearly highest", str(next(self.content_graph.objects(discussion[0], CD.body))))
        self.assertIn("Repeated measurements vary", str(next(self.content_graph.objects(discussion[1], CD.body))))
        self.assertIn("defensible decision", str(next(self.content_graph.objects(discussion[2], CD.body))))

    def test_nitrate_case_study_asset_is_local_transparent_svg(self) -> None:
        asset = ROOT / "apps" / "pitch" / "public" / "chemometrics" / "nitrate-water-samples.svg"
        self.assertTrue(asset.is_file())
        svg = asset.read_text(encoding="utf-8")
        self.assertIn("<svg", svg)
        self.assertIn('viewBox="0 0 720 520"', svg)
        self.assertIn(">A</text>", svg)
        self.assertIn(">B</text>", svg)
        self.assertIn(">C</text>", svg)
        self.assertNotIn("<rect width=\"720\" height=\"520\"", svg)

    def test_lecturer_slide_has_three_keypoint_cards_and_affiliation_takeaway(self) -> None:
        owner = EX["chemometrics-lecturer-pillars"]
        points = sorted(
            self.content_graph.objects(owner, CD.hasKeyPoint),
            key=lambda point: int(next(self.content_graph.objects(point, CD.position))),
        )
        self.assertEqual(3, len(points))
        bodies = [str(next(self.content_graph.objects(point, CD.body))) for point in points]
        self.assertTrue(bodies[0].startswith("ANALYTICAL DATA SCIENCE\n"))
        self.assertTrue(bodies[1].startswith("INSTRUMENTAL ANALYTICAL CHEMISTRY\n"))
        self.assertTrue(bodies[2].startswith("RESEARCH + TEACHING\n"))
        takeaway = str(next(self.content_graph.objects(EX["chemometrics-lecturer-takeaway"], CD.body)))
        self.assertIn("IAC", takeaway)
        self.assertIn("UNIVERSITY OF DUISBURG-ESSEN", takeaway)

    def test_course_format_is_exact_four_node_linear_flow(self) -> None:
        diagram = EX["diagram-chemometrics-course-format"]
        self.assertEqual({CD.FlowDiagram}, set(self.content_graph.objects(diagram, RDF.type)))
        nodes = sorted(
            self.content_graph.objects(diagram, CD.hasDiagramNode),
            key=lambda node: int(next(self.content_graph.objects(node, CD.position))),
        )
        edges = sorted(
            self.content_graph.objects(diagram, CD.hasDiagramEdge),
            key=lambda edge: int(next(self.content_graph.objects(edge, CD.position))),
        )
        self.assertEqual(
            ["LECTURE", "TUTORIAL", "REPRODUCE", "DISCUSS"],
            [str(next(self.content_graph.objects(node, SKOS.prefLabel))) for node in nodes],
        )
        self.assertEqual(4, len(nodes))
        self.assertEqual(3, len(edges))
        for index, edge in enumerate(edges):
            self.assertEqual({nodes[index]}, set(self.content_graph.objects(edge, CD.sourceNode)))
            self.assertEqual({nodes[index + 1]}, set(self.content_graph.objects(edge, CD.targetNode)))
        banner = str(next(self.content_graph.objects(EX["chemometrics-course-format-banner"], CD.body)))
        self.assertIn("LEARN → PRACTICE → REPRODUCE → DISCUSS", banner)

    def test_course_roadmap_is_exact_six_node_linear_flow(self) -> None:
        diagram = EX["diagram-chemometrics-course-roadmap"]
        self.assertEqual({CD.FlowDiagram}, set(self.content_graph.objects(diagram, RDF.type)))
        nodes = sorted(
            self.content_graph.objects(diagram, CD.hasDiagramNode),
            key=lambda node: int(next(self.content_graph.objects(node, CD.position))),
        )
        edges = sorted(
            self.content_graph.objects(diagram, CD.hasDiagramEdge),
            key=lambda edge: int(next(self.content_graph.objects(edge, CD.position))),
        )
        self.assertEqual(6, len(nodes))
        self.assertEqual(5, len(edges))
        self.assertEqual(
            [
                "STATISTICAL FOUNDATIONS",
                "INFERENCE",
                "REGRESSION + UNCERTAINTY",
                "DESIGN OF EXPERIMENTS",
                "MULTIVARIATE ANALYSIS",
                "MACHINE LEARNING",
            ],
            [str(next(self.content_graph.objects(node, SKOS.prefLabel))) for node in nodes],
        )
        for index, edge in enumerate(edges):
            self.assertEqual(
                {nodes[index]},
                set(self.content_graph.objects(edge, CD.sourceNode)),
            )
            self.assertEqual(
                {nodes[index + 1]},
                set(self.content_graph.objects(edge, CD.targetNode)),
            )

    def test_introduction_round_is_four_prompt_cards(self) -> None:
        owner = EX["chemometrics-introduction-round-prompts"]
        entries = sorted(
            self.content_graph.objects(owner, CD.hasDefinitionListEntry),
            key=lambda entry: int(next(self.content_graph.objects(entry, CD.position))),
        )
        self.assertEqual(
            ["Your background", "Statistics & chemometrics", "Data-analysis tools", "Your goal"],
            [str(next(self.content_graph.objects(entry, SKOS.prefLabel))) for entry in entries],
        )
        self.assertEqual([1, 2, 3, 4], [
            int(next(self.content_graph.objects(entry, CD.position))) for entry in entries
        ])

    def test_path_is_exact_six_step_sequence(self) -> None:
        steps = sorted(
            self.path_graph.objects(PATH, CD.hasStep),
            key=lambda step: int(next(self.path_graph.objects(step, CD.position))),
        )
        self.assertEqual(6, len(steps))
        self.assertEqual([1, 2, 3, 4, 5, 6], [
            int(next(self.path_graph.objects(step, CD.position))) for step in steps
        ])
        self.assertEqual(
            [
                EX["scene-chemometrics-introduction-title"],
                EX["scene-chemometrics-introduction-overview"],
                EX["scene-chemometrics-introduction-lecturer"],
                EX["scene-chemometrics-introduction-format"],
                EX["scene-chemometrics-introduction-roadmap"],
                EX["scene-chemometrics-introduction-round"],
            ],
            [next(self.path_graph.objects(step, CD.usesScene)) for step in steps],
        )
        self.assertEqual(EXPECTED_TOPICS, set(self.path_graph.objects(PATH, CD.forTopic)))

    def test_scenes_compile_to_existing_visual_layout_structures(self) -> None:
        self.assertEqual(
            [str(scene).replace(str(EX), "ex:") + "--scene" for scene in EXPECTED_SCENES],
            [scene["id"] for scene in self.document["scenes"]],
        )
        self.assertEqual(
            EXPECTED_BLOCK_KINDS,
            [[block["kind"] for block in scene["blocks"]] for scene in self.document["scenes"]],
        )

        overview = self.document["scenes"][1]
        problem_group = overview["blocks"][1]
        self.assertEqual("group", problem_group["kind"])
        self.assertEqual(["prose", "media-reference"], [child["kind"] for child in problem_group["children"]])
        self.assertEqual("/chemometrics/nitrate-water-samples.svg", problem_group["children"][1]["uri"])
        self.assertEqual("image/svg+xml", problem_group["children"][1]["mediaType"])

        data_table = overview["blocks"][2]
        self.assertEqual("Nitrate measurements", data_table["caption"])
        self.assertEqual(5, len(data_table["columns"]))
        self.assertEqual(3, len(data_table["rows"]))

        analysis = overview["blocks"][3]
        self.assertEqual("bar", analysis["chartType"])
        self.assertEqual(["A · upstream", "B · tap water", "C · runoff"], [datum["category"] for datum in analysis["data"]])
        self.assertEqual([2.2, 4.95, 18.925], [datum["value"] for datum in analysis["data"]])

        discussion = overview["blocks"][4]
        self.assertEqual("unordered", discussion["listStyle"])
        self.assertEqual(3, len(discussion["items"]))

        lecturer_cards = self.document["scenes"][2]["blocks"][1]
        self.assertEqual("unordered", lecturer_cards["listStyle"])
        self.assertEqual(3, len(lecturer_cards["items"]))

        format_diagram = self.document["scenes"][3]["blocks"][2]
        self.assertEqual("flow", format_diagram["diagramType"])
        self.assertEqual(4, len(format_diagram["nodes"]))
        self.assertEqual(3, len(format_diagram["edges"]))

        roadmap = self.document["scenes"][4]["blocks"][1]
        self.assertEqual("flow", roadmap["diagramType"])
        self.assertEqual(6, len(roadmap["nodes"]))
        self.assertEqual(5, len(roadmap["edges"]))

        round_cards = self.document["scenes"][5]["blocks"][3]
        self.assertEqual(4, len(round_cards["entries"]))

    def test_course_path_selection_resolves_introduction_exactly(self) -> None:
        selection = select_course_unit_path(self.dataset, request())
        self.assertEqual(CoursePathReference(str(PATH), str(PATH_GRAPH)), selection.path)

    def test_existing_subject_paths_remain_discoverable(self) -> None:
        expected = {
            EX["learning-unit-random-variables"]: EX["path-chemometrics-random-variables-lecture"],
            EX["learning-unit-mean-values"]: EX["path-chemometrics-mean-values-lecture"],
            EX["learning-unit-variance-dispersion"]: EX["path-chemometrics-variance-dispersion-lecture"],
        }
        for unit, path in expected.items():
            with self.subTest(unit=unit):
                self.assertEqual({path}, set(self.graph.subjects(CD.forLearningUnit, unit)))

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
