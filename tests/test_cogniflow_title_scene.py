from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import Dataset, Literal, Namespace, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

DATASET_SPEC = importlib.util.spec_from_file_location("rdf_dataset", SCRIPTS / "rdf_dataset.py")
assert DATASET_SPEC and DATASET_SPEC.loader
RDF_DATASET = importlib.util.module_from_spec(DATASET_SPEC)
DATASET_SPEC.loader.exec_module(RDF_DATASET)

VALIDATION_SPEC = importlib.util.spec_from_file_location("validate_semantics", SCRIPTS / "validate_semantics.py")
assert VALIDATION_SPEC and VALIDATION_SPEC.loader
VALIDATION = importlib.util.module_from_spec(VALIDATION_SPEC)
VALIDATION_SPEC.loader.exec_module(VALIDATION)

RUNTIME_SPEC = importlib.util.spec_from_file_location("generate_canonical_runtime", SCRIPTS / "generate_canonical_runtime.py")
assert RUNTIME_SPEC and RUNTIME_SPEC.loader
RUNTIME = importlib.util.module_from_spec(RUNTIME_SPEC)
RUNTIME_SPEC.loader.exec_module(RUNTIME)

MEDIA_RUNTIME_SPEC = importlib.util.spec_from_file_location(
    "generate_canonical_runtime_media",
    SCRIPTS / "generate_canonical_runtime_media.py",
)
assert MEDIA_RUNTIME_SPEC and MEDIA_RUNTIME_SPEC.loader
MEDIA_RUNTIME = importlib.util.module_from_spec(MEDIA_RUNTIME_SPEC)
MEDIA_RUNTIME_SPEC.loader.exec_module(MEDIA_RUNTIME)

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
OFFERING = EX["teaching-offering-cogniflow-standardized-data-processing"]
PLACEMENT = EX["unit-placement-cogniflow-standardized-data-processing"]
UNIT = EX["learning-unit-cogniflow-standardized-data-processing"]
PATH = EX["path-cogniflow-standardized-data-processing"]
PATH_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/paths/cogniflow-standardized-data-processing")
SCENE_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/scenes/cogniflow-standardized-data-processing")
TITLE = "From FAIR Data to FAIR Data Processing — Project CogniFlow"
GERRIT = "Gerrit Renner — Instrumental Analytical Chemistry, University of Duisburg-Essen"
RICARDO = "Ricardo Cunha — Institut für Umwelt & Energie, Technik & Analytik e. V. (IUTA)"
FUNDING = "Funding"


def request():
    return RUNTIME.CourseUnitPathSelectionRequest(
        offering_id=str(OFFERING),
        placement_id=str(PLACEMENT),
        unit_id=str(UNIT),
        requested_path_id=str(PATH),
        requested_path_graph_id=str(PATH_GRAPH),
    )


def copy_dataset(source: Dataset) -> Dataset:
    target = Dataset()
    for subject, predicate, obj, graph_id in source.quads((None, None, None, None)):
        target.graph(graph_id).add((subject, predicate, obj))
    return target


class CogniFlowTitleSceneTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        # The canonical dataset/artifacts are intentionally expensive. Build each once
        # for this class so semantic regression coverage does not dominate validator time.
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.artifact = RUNTIME.build_artifact(request())
        cls.document = cls.artifact["sceneDocuments"][0]
        cls.scenes = {scene["id"]: scene for scene in cls.document["scenes"]}
        cls.static_fallback = RUNTIME.static_fallback(cls.artifact)
        cls.media_artifact = MEDIA_RUNTIME.build_artifact(request())
        cls.media_rendered_index = MEDIA_RUNTIME.rendered_index(cls.artifact, cls.media_artifact)

    def scene(self, scene_id: str) -> dict:
        self.assertIn(scene_id, self.scenes)
        return self.scenes[scene_id]

    def test_cogniflow_course_context_selects_exact_path_and_english_language(self) -> None:
        selection = RUNTIME.select_course_unit_path(self.dataset, request())
        self.assertEqual(str(PATH), selection.path.path_id)
        self.assertEqual(str(PATH_GRAPH), selection.path.path_graph_id)
        self.assertEqual("en", RUNTIME.effective_path_language(self.dataset, selection.path))
        self.assertEqual(selection, RUNTIME.select_course_unit_path(self.dataset, request()))

    def test_cogniflow_compiles_exact_runtime_narrative(self) -> None:
        self.assertEqual("ex:path-cogniflow-standardized-data-processing", self.document["sourcePathId"])
        self.assertEqual("1.5", self.document["version"])
        ids = [scene["id"] for scene in self.document["scenes"]]
        self.assertEqual(
            [
                "ex:scene-cogniflow-title--scene",
                "ex:scene-cogniflow-processing-black-box--scene",
                "ex:scene-cogniflow-fair-data-intro--scene",
                "ex:scene-cogniflow-fair-processing-gap--scene",
                "ex:scene-cogniflow-explicit-processing-context--scene",
                "ex:scene-cogniflow-semantics-first--scene",
                "ex:scene-cogniflow-semantic-triples--scene",
                "ex:scene-cogniflow-semantic-core--scene",
                "ex:scene-cogniflow-semantic-hierarchy--scene",
                "ex:scene-cogniflow-core-grammar--scene",
                "ex:scene-cogniflow-domain-specifications--scene",
                "ex:scene-cogniflow-ui-specifications--scene",
                "ex:scene-cogniflow-presentation-specifications--scene",
                "ex:scene-cogniflow-processing-pipeline--scene",
                "ex:scene-cogniflow-service-process--scene",
                "ex:scene-cogniflow-extension-system--scene",
                "ex:scene-cogniflow-showcase-still--scene",
                "ex:scene-cogniflow-showcase-video-one--scene",
                "ex:scene-cogniflow-showcase-video-two--scene",
                "ex:scene-cogniflow-take-home--scene",
                "ex:scene-cogniflow-closing--scene",
            ],
            ids,
        )

    def test_curated_service_process_projects_marketplace_sequence_without_stages(self) -> None:
        scene = self.scene("ex:scene-cogniflow-service-process--scene")
        self.assertEqual(["prose", "prose", "diagram", "prose"], [block["kind"] for block in scene["blocks"]])
        heading, marketplace, diagram, note = scene["blocks"]
        self.assertEqual("Services Replace Direct Dependencies", heading["text"])
        self.assertEqual(
            "ONLINE MARKETPLACE LOGIC\nsearch by need → match provider → standardized order → standardized delivery",
            marketplace["text"],
        )
        self.assertEqual("sequence", diagram["diagramType"])
        self.assertEqual(
            ["Consumer", "MCP Gateway", "Authority", "Provider"],
            [role["label"] for role in diagram["participantRoles"]],
        )
        self.assertEqual(
            [
                "SEARCH · capability + constraints",
                "MATCH · resolve via Fuseki",
                "ORDER · invoke matched operation",
                "RETURN · cf.service.result.v1",
                "RESULT · standardized envelope",
                "DELIVER · result",
            ],
            [message["label"] for message in diagram["messages"]],
        )
        self.assertNotIn("states", diagram)
        self.assertEqual(
            "CONSUMERS DEPEND ON THE SERVICE CONTRACT — NOT ON CONCRETE PROVIDER IMPLEMENTATIONS",
            note["text"],
        )
        self.assertIn('data-diagram-type="sequence"', self.static_fallback)

    def test_media_aware_fallback_preserves_title_logos_and_sequence_semantics(self) -> None:
        rendered_index = self.media_rendered_index
        self.assertIn('class="media-reference-fallback"', rendered_index)
        self.assertIn(GERRIT, rendered_index)
        self.assertIn("University of Duisburg-Essen logo", rendered_index)
        self.assertIn(RICARDO.replace("&", "&amp;"), rendered_index)
        self.assertIn("IUTA", rendered_index)
        self.assertIn(FUNDING, rendered_index)
        self.assertIn("Ministry for Environment", rendered_index)
        self.assertIn('data-diagram-type="sequence"', rendered_index)
        self.assertIn('data-participant-role-id="ex:role-service-consumer"', rendered_index)
        self.assertIn('data-interaction-message-id="ex:message-service-search"', rendered_index)

    def test_title_scene_compiles_requested_title_attributions_and_funding(self) -> None:
        scene = self.scene("ex:scene-cogniflow-title--scene")
        self.assertEqual([TITLE, GERRIT, RICARDO, FUNDING], [block["text"] for block in scene["blocks"]])
        self.assertEqual(["prose", "prose", "prose", "prose"], [block["kind"] for block in scene["blocks"]])
        self.assertEqual("primary", scene["blocks"][0]["emphasis"])
        self.assertEqual(["supporting", "supporting", "supporting"], [block["emphasis"] for block in scene["blocks"][1:]])
        self.assertIn(TITLE, self.static_fallback)
        self.assertIn(GERRIT, self.static_fallback)
        self.assertIn(RICARDO.replace("&", "&amp;"), self.static_fallback)
        self.assertIn(FUNDING, self.static_fallback)

    def test_opening_cluster_uses_structured_chart_table_diagram_and_definition_lists(self) -> None:
        black_box = self.scene("ex:scene-cogniflow-processing-black-box--scene")
        fair_intro = self.scene("ex:scene-cogniflow-fair-data-intro--scene")
        fair_gap = self.scene("ex:scene-cogniflow-fair-processing-gap--scene")
        explicit = self.scene("ex:scene-cogniflow-explicit-processing-context--scene")

        self.assertEqual(["prose", "chart", "table", "diagram"], [block["kind"] for block in black_box["blocks"]])
        black_chart = next(block for block in black_box["blocks"] if block["kind"] == "chart")
        black_table = next(block for block in black_box["blocks"] if block["kind"] == "table")
        black_diagram = next(block for block in black_box["blocks"] if block["kind"] == "diagram")
        self.assertEqual("line", black_chart["chartType"])
        self.assertEqual(61, len(black_chart["series"][0]["data"]))
        self.assertEqual("cd:hasTableRow", black_table["source"][0]["relationPath"])
        self.assertEqual(["RAW SIGNAL", "PROCESSING ?", "RESULT"], [node["label"] for node in black_diagram["nodes"]])
        self.assertEqual("ex:node-cogniflow-black-box-processing", black_diagram["focusNodeId"])

        self.assertEqual(["prose", "list", "table"], [block["kind"] for block in fair_intro["blocks"]])
        fair_table = next(block for block in fair_intro["blocks"] if block["kind"] == "table")
        self.assertEqual("cd:hasTableRow", fair_table["source"][0]["relationPath"])

        self.assertEqual(
            ["prose", "diagram", "prose", "definition-list", "prose", "prose", "definition-list"],
            [block["kind"] for block in fair_gap["blocks"]],
        )
        gap_lists = [block for block in fair_gap["blocks"] if block["kind"] == "definition-list"]
        self.assertEqual(["S/N", "S/N", "S/N", "S/N"], [entry["term"] for entry in gap_lists[0]["entries"]])
        self.assertEqual(
            ["algorithm", "implementation", "version", "parameters", "environment", "dependencies"],
            [entry["term"] for entry in gap_lists[1]["entries"]],
        )

        self.assertEqual(
            ["prose", "diagram", "prose", "definition-list", "prose", "prose", "definition-list"],
            [block["kind"] for block in explicit["blocks"]],
        )
        explicit_lists = [block for block in explicit["blocks"] if block["kind"] == "definition-list"]
        self.assertEqual(
            ["purpose", "input", "output", "parameters", "implementation", "version"],
            [entry["term"] for entry in explicit_lists[0]["entries"]],
        )
        self.assertEqual(
            ["purpose", "interface", "parameters", "implementation", "version", "execution"],
            [entry["term"] for entry in explicit_lists[1]["entries"]],
        )

    def test_semantics_first_makes_meaning_precede_implementation(self) -> None:
        scene = self.scene("ex:scene-cogniflow-semantics-first--scene")
        heading = next(block for block in scene["blocks"] if block["kind"] == "prose" and block["intent"]["kind"] == "introduce")
        cards = next(block for block in scene["blocks"] if block["kind"] == "list")
        self.assertEqual("Semantics First — Meaning Before Implementation", heading["text"])
        self.assertEqual(3, len(cards["items"]))
        self.assertIn("WHAT + WHY", cards["items"][0]["text"])
        self.assertIn("SEMANTIC CONTRACT", cards["items"][1]["text"])
        self.assertIn("IMPLEMENTATIONS", cards["items"][2]["text"])

    def test_semantic_core_projects_relation_free_grouped_network(self) -> None:
        scene = self.scene("ex:scene-cogniflow-semantic-core--scene")
        heading = next(block for block in scene["blocks"] if block["kind"] == "prose" and block["intent"]["kind"] == "introduce")
        diagram = next(block for block in scene["blocks"] if block["kind"] == "diagram")
        self.assertEqual("CogniFlow Starts with Meaning", heading["text"])
        self.assertEqual("network", diagram["diagramType"])
        self.assertEqual("ex:node-cogniflow-semantic-core", diagram["focusNodeId"])
        self.assertEqual([], diagram["edges"])
        self.assertEqual(["CONCEPT LAYER", "SPECIFICATION LAYER"], [group["label"] for group in diagram["groups"]])
        self.assertEqual(18, len(diagram["nodes"]))

    def test_core_grammar_exposes_meta_tbox_and_concept_domain_trig(self) -> None:
        scene = self.scene("ex:scene-cogniflow-core-grammar--scene")
        heading = next(block for block in scene["blocks"] if block["kind"] == "prose" and block["intent"]["kind"] == "introduce")
        code = next(block for block in scene["blocks"] if block["kind"] == "code")
        primitives = next(block for block in scene["blocks"] if block["kind"] == "list")
        self.assertEqual("A Small Grammar for Meaning", heading["text"])
        self.assertEqual(6, len(primitives["items"]))
        self.assertEqual("trig", code["language"])
        self.assertIn("cfproc:ProcessingUnitConceptDomain", code["code"])
        self.assertIn("cf:definesConcept cfproc:ProcessingUnit", code["code"])

    def test_domain_specifications_explain_processing_unit_before_peak_integration(self) -> None:
        scene = self.scene("ex:scene-cogniflow-domain-specifications--scene")
        heading = next(block for block in scene["blocks"] if block["kind"] == "prose" and block["intent"]["kind"] == "introduce")
        cards = next(block for block in scene["blocks"] if block["kind"] == "list")
        note = scene["blocks"][-1]
        self.assertEqual("A Semantic Model for Data Processing", heading["text"])
        self.assertEqual(3, len(cards["items"]))
        self.assertIn("PROCESSING UNIT", cards["items"][1]["text"])
        self.assertIn("PEAK INTEGRATION", cards["items"][2]["text"])
        self.assertEqual(
            "THE CONCEPT DEFINES THE STRUCTURE — THE SPECIFICATION PROVIDES THE SCIENTIFIC METHOD",
            note["text"],
        )

    def test_processing_pipeline_connects_structured_analytical_steps(self) -> None:
        scene = self.scene("ex:scene-cogniflow-processing-pipeline--scene")
        self.assertEqual(["prose", "prose", "diagram", "prose"], [block["kind"] for block in scene["blocks"]])
        diagram = next(block for block in scene["blocks"] if block["kind"] == "diagram")
        self.assertEqual("flow", diagram["diagramType"])
        self.assertEqual(
            ["BASELINE CORRECTION", "PEAK DETECTION", "PEAK INTEGRATION", "PEAK GROUPING"],
            [node["label"] for node in diagram["nodes"]],
        )
        self.assertEqual(
            ["corrected chromatogram", "peak candidates", "integrated peaks"],
            [edge["label"] for edge in diagram["edges"]],
        )
        self.assertEqual(
            ["ProcessingStep", "ProcessingStep", "ProcessingStep", "ProcessingStep"],
            [node["description"].splitlines()[0] for node in diagram["nodes"]],
        )

    def test_semantic_triples_and_hierarchy_project_current_core_argument(self) -> None:
        triples = self.scene("ex:scene-cogniflow-semantic-triples--scene")
        hierarchy = self.scene("ex:scene-cogniflow-semantic-hierarchy--scene")

        self.assertEqual(
            ["prose", "prose", "list", "diagram", "prose"],
            [block["kind"] for block in triples["blocks"]],
        )
        triples_diagram = next(block for block in triples["blocks"] if block["kind"] == "diagram")
        self.assertEqual("network", triples_diagram["diagramType"])
        self.assertEqual(["Anna", "Essen", "University"], [node["label"] for node in triples_diagram["nodes"]])
        self.assertEqual(["livesIn", "worksAt", "locatedIn"], [edge["label"] for edge in triples_diagram["edges"]])

        self.assertEqual(
            ["prose", "prose", "diagram", "prose"],
            [block["kind"] for block in hierarchy["blocks"]],
        )
        hierarchy_diagram = next(block for block in hierarchy["blocks"] if block["kind"] == "diagram")
        self.assertEqual("flow", hierarchy_diagram["diagramType"])
        self.assertEqual(3, len(hierarchy_diagram["nodes"]))
        self.assertEqual(["defines vocabulary for", "used by"], [edge["label"] for edge in hierarchy_diagram["edges"]])

    def test_ui_and_presentation_specifications_share_semantic_card_pattern(self) -> None:
        ui = self.scene("ex:scene-cogniflow-ui-specifications--scene")
        presentation = self.scene("ex:scene-cogniflow-presentation-specifications--scene")

        self.assertEqual(["prose", "list", "prose"], [block["kind"] for block in ui["blocks"]])
        self.assertEqual(["prose", "list", "prose"], [block["kind"] for block in presentation["blocks"]])

        ui_heading, ui_cards, ui_note = ui["blocks"]
        presentation_heading, presentation_cards, presentation_note = presentation["blocks"]

        self.assertEqual("A Semantic Model for Web Interfaces", ui_heading["text"])
        self.assertEqual(3, len(ui_cards["items"]))
        self.assertIn("SIDEBAR MENU", ui_cards["items"][1]["text"])
        self.assertEqual(
            "THE CONCEPT DEFINES THE STRUCTURE — THE SPECIFICATION PROVIDES THE CONCRETE INTERFACE",
            ui_note["text"],
        )

        self.assertEqual("A Semantic Model for This Presentation", presentation_heading["text"])
        self.assertEqual(3, len(presentation_cards["items"]))
        self.assertIn("INFO BOX", presentation_cards["items"][1]["text"])
        self.assertEqual("SAME SEMANTICS — DIFFERENT PROJECTIONS", presentation_note["text"])

    def test_take_home_preserves_authored_semantics_services_workflows_chain(self) -> None:
        scene = self.scene("ex:scene-cogniflow-take-home--scene")
        heading = next(block for block in scene["blocks"] if block["kind"] == "prose" and block["intent"]["kind"] == "introduce")
        principles = next(block for block in scene["blocks"] if block["kind"] == "list")
        explanatory = [block["text"] for block in scene["blocks"] if block["kind"] == "prose" and block["intent"]["kind"] == "explain"]
        self.assertEqual("Take Home", heading["text"])
        self.assertEqual(["SEMANTICS", "SERVICES", "REUSABLE WORKFLOWS"], [item["text"] for item in principles["items"]])
        self.assertIn("Standardize meaning — not implementations.", explanatory)
        self.assertIn("GET COGNIFLOW\npip install cogniflow", explanatory)

    def test_extension_system_and_showcase_close_runtime_sequence(self) -> None:
        extension = self.scene("ex:scene-cogniflow-extension-system--scene")
        self.assertEqual(
            ["prose", "prose", "prose", "definition-list", "prose"],
            [block["kind"] for block in extension["blocks"]],
        )
        modules = next(block for block in extension["blocks"] if block["kind"] == "definition-list")
        self.assertEqual(
            ["Bootstrap Installer", "Web UI", "Pipeline Engine", "Service Module", "Report Generator"],
            [entry["term"] for entry in modules["entries"]],
        )

        showcase_ids = [
            "ex:scene-cogniflow-showcase-still--scene",
            "ex:scene-cogniflow-showcase-video-one--scene",
            "ex:scene-cogniflow-showcase-video-two--scene",
        ]
        showcase_texts = [
            "CogniFlow Web UI overview before the walkthrough starts.",
            "CogniFlow Web UI walkthrough, part one.",
            "CogniFlow Web UI walkthrough, part two.",
        ]
        for scene_id, text in zip(showcase_ids, showcase_texts, strict=True):
            scene = self.scene(scene_id)
            self.assertEqual(["prose", "prose"], [block["kind"] for block in scene["blocks"]])
            self.assertEqual("CogniFlow Web UI", scene["blocks"][0]["text"])
            self.assertEqual(text, scene["blocks"][1]["text"])

    def test_attribution_role_rejects_wrong_selector(self) -> None:
        dataset = copy_dataset(self.dataset)
        item = EX["scene-item-cogniflow-title-gerrit-renner"]
        graph = dataset.graph(SCENE_GRAPH)
        graph.set((item, CD.selectionPath, Literal("skos:prefLabel@en")))
        with self.assertRaisesRegex(ValueError, "AttributionRole requires direct cd:body"):
            RUNTIME.compile_scene_document(dataset, RUNTIME.CoursePathReference(str(PATH), str(PATH_GRAPH)))

    def test_attribution_role_rejects_non_attribution_resource(self) -> None:
        dataset = copy_dataset(self.dataset)
        attribution = EX["attribution-cogniflow-gerrit-renner"]
        for graph_id in {
            graph_id
            for _s, _p, _o, graph_id in dataset.quads((attribution, RDF.type, CD.Attribution, None))
        }:
            dataset.graph(graph_id).remove((attribution, RDF.type, CD.Attribution))
            dataset.graph(graph_id).add((attribution, RDF.type, CD.Interpretation))
        with self.assertRaisesRegex(ValueError, "AttributionRole requires Attribution"):
            RUNTIME.compile_scene_document(dataset, RUNTIME.CoursePathReference(str(PATH), str(PATH_GRAPH)))

    def test_attribution_resource_rejects_non_attribution_role(self) -> None:
        dataset = copy_dataset(self.dataset)
        item = EX["scene-item-cogniflow-title-gerrit-renner"]
        dataset.graph(SCENE_GRAPH).set((item, CD.communicativeRole, CD.StatementRole))
        with self.assertRaisesRegex(ValueError, "requires AttributionRole"):
            RUNTIME.compile_scene_document(dataset, RUNTIME.CoursePathReference(str(PATH), str(PATH_GRAPH)))


if __name__ == "__main__":
    unittest.main()
