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

EXPECTED_SCENES = [
    "ex:scene-cogniflow-title--scene",
    "ex:scene-cogniflow-processing-black-box--scene",
    "ex:scene-cogniflow-fair-data-intro--scene",
    "ex:scene-cogniflow-fair-processing-gap--scene",
    "ex:scene-cogniflow-explicit-processing-context--scene",
    "ex:scene-cogniflow-semantic-core--scene",
    "ex:scene-cogniflow-service-process--scene",
    "ex:scene-cogniflow-semantics-as-source--scene",
    "ex:scene-cogniflow-same-semantics-different-views--scene",
    "ex:scene-cogniflow-provenance-pipeline--scene",
    "ex:scene-cogniflow-analytical-proof--scene",
    "ex:scene-cogniflow-take-home--scene",
]


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
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)

    def test_cogniflow_course_context_selects_exact_path_and_english_language(self) -> None:
        selection = RUNTIME.select_course_unit_path(self.dataset, request())
        self.assertEqual(str(PATH), selection.path.path_id)
        self.assertEqual(str(PATH_GRAPH), selection.path.path_graph_id)
        self.assertEqual("en", RUNTIME.effective_path_language(self.dataset, selection.path))
        self.assertEqual(selection, RUNTIME.select_course_unit_path(self.dataset, request()))

    def test_cogniflow_compiles_curated_twelve_scene_narrative(self) -> None:
        artifact = RUNTIME.build_artifact(request())
        document = artifact["sceneDocuments"][0]
        self.assertEqual("ex:path-cogniflow-standardized-data-processing", document["sourcePathId"])
        self.assertEqual("1.3", document["version"])
        self.assertEqual(EXPECTED_SCENES, [scene["id"] for scene in document["scenes"]])
        self.assertNotIn("ex:scene-cogniflow-service-usage--scene", EXPECTED_SCENES)
        self.assertNotIn("ex:scene-cogniflow-signal-to-peak--scene", EXPECTED_SCENES)

    def test_curated_service_process_projects_the_sequence_diagram(self) -> None:
        artifact = RUNTIME.build_artifact(request())
        document = artifact["sceneDocuments"][0]
        scene = document["scenes"][6]
        self.assertEqual("ex:scene-cogniflow-service-process--scene", scene["id"])
        diagram = scene["blocks"][1]
        self.assertEqual("diagram", diagram["kind"])
        self.assertEqual("sequence", diagram["diagramType"])
        self.assertEqual(
            ["ex:role-interface", "ex:role-orchestrator", "ex:role-provider", "ex:role-consumer"],
            [role["id"] for role in diagram["participantRoles"]],
        )
        fallback = RUNTIME.static_fallback(artifact)
        self.assertIn('data-diagram-type="sequence"', fallback)
        self.assertIn("Interface", fallback)
        self.assertIn("Orchestration", fallback)
        self.assertIn("Specialized provider", fallback)
        self.assertIn("Consumer", fallback)
        self.assertIn('data-interaction-message-id="ex:message-request"', fallback)
        self.assertIn('data-active-message-ids="', fallback)
        self.assertIn('data-participant-binding-role-id="ex:role-interface"', fallback)

    def test_media_aware_cogniflow_fallback_preserves_title_logos_and_sequence_semantics(self) -> None:
        base_artifact = RUNTIME.build_artifact(request())
        media_artifact = MEDIA_RUNTIME.build_artifact(request())
        rendered_index = MEDIA_RUNTIME.rendered_index(base_artifact, media_artifact)
        self.assertIn('class="media-reference-fallback"', rendered_index)
        self.assertIn(GERRIT, rendered_index)
        self.assertIn("University of Duisburg-Essen logo", rendered_index)
        self.assertIn(RICARDO.replace("&", "&amp;"), rendered_index)
        self.assertIn("IUTA", rendered_index)
        self.assertIn(FUNDING, rendered_index)
        self.assertIn("Ministry for Environment", rendered_index)
        self.assertIn('data-diagram-type="sequence"', rendered_index)
        self.assertIn('data-participant-role-id="ex:role-interface"', rendered_index)
        self.assertIn('data-interaction-message-id="ex:message-request"', rendered_index)
        self.assertIn('data-active-message-ids="', rendered_index)
        self.assertIn('data-participant-binding-role-id="ex:role-interface"', rendered_index)

    def test_title_scene_compiles_exact_requested_title_attributions_and_funding(self) -> None:
        artifact = RUNTIME.build_artifact(request())
        document = artifact["sceneDocuments"][0]
        self.assertEqual(12, len(document["scenes"]))
        scene = document["scenes"][0]
        self.assertEqual("ex:scene-cogniflow-title--scene", scene["id"])
        self.assertEqual([TITLE, GERRIT, RICARDO, FUNDING], [block["text"] for block in scene["blocks"]])
        self.assertEqual(["prose", "prose", "prose", "prose"], [block["kind"] for block in scene["blocks"]])
        self.assertEqual("primary", scene["blocks"][0]["emphasis"])
        self.assertEqual(["supporting", "supporting", "supporting"], [block["emphasis"] for block in scene["blocks"][1:]])
        self.assertEqual(
            [
                "ex:cogniflow-standardized-data-processing",
                "ex:attribution-cogniflow-gerrit-renner",
                "ex:attribution-cogniflow-ricardo-cunha",
                "ex:attribution-cogniflow-funding",
            ],
            [block["source"][0]["resourceId"] for block in scene["blocks"]],
        )
        self.assertEqual(
            ["skos:prefLabel@en", "cd:body", "cd:body", "cd:body"],
            [block["source"][0]["relationPath"] for block in scene["blocks"]],
        )
        fallback = RUNTIME.static_fallback(artifact)
        self.assertIn(TITLE, fallback)
        self.assertIn(GERRIT, fallback)
        # The static fallback escapes HTML entities, so the IUTA ampersands become &amp;.
        self.assertIn(RICARDO.replace("&", "&amp;"), fallback)
        self.assertIn(FUNDING, fallback)

    def test_opening_cluster_moves_from_black_box_through_fair_intro_to_processing_gap(self) -> None:
        document = RUNTIME.build_artifact(request())["sceneDocuments"][0]
        black_box = document["scenes"][1]
        fair_intro = document["scenes"][2]
        fair_gap = document["scenes"][3]
        explicit = document["scenes"][4]
        semantic_core = document["scenes"][5]
        service_process = document["scenes"][6]

        black_heading = next(block for block in black_box["blocks"] if block["kind"] == "prose")
        black_chart = next(block for block in black_box["blocks"] if block["kind"] == "chart")
        black_table = next(block for block in black_box["blocks"] if block["kind"] == "code")
        black_diagram = next(block for block in black_box["blocks"] if block["kind"] == "diagram")
        fair_intro_heading = next(block for block in fair_intro["blocks"] if block["kind"] == "prose" and block["intent"]["kind"] == "introduce")
        fair_intro_caption = next(block for block in fair_intro["blocks"] if block["kind"] == "prose" and block["intent"]["kind"] == "explain")
        fair_intro_list = next(block for block in fair_intro["blocks"] if block["kind"] == "list")
        fair_intro_table = next(block for block in fair_intro["blocks"] if block["kind"] == "code")
        fair_heading = next(block for block in fair_gap["blocks"] if block["kind"] == "prose" and block["intent"]["kind"] == "introduce")
        fair_diagram = next(block for block in fair_gap["blocks"] if block["kind"] == "diagram")
        fair_example_heading = next(
            block for block in fair_gap["blocks"]
            if block["kind"] == "prose" and block["text"] == "EXAMPLE: SIGNAL-TO-NOISE RATIO"
        )
        fair_lists = [block for block in fair_gap["blocks"] if block["kind"] == "list"]
        fair_example_list = fair_lists[0]
        fair_missing_list = fair_lists[1]
        fair_example_note = next(
            block for block in fair_gap["blocks"]
            if block["kind"] == "prose" and block["text"] == "Same label — different operational definitions."
        )
        fair_missing_heading = next(
            block for block in fair_gap["blocks"]
            if block["kind"] == "prose" and block["text"] == "MISSING CONTEXT"
        )
        explicit_heading = next(
            block for block in explicit["blocks"]
            if block["kind"] == "prose" and block["intent"]["kind"] == "introduce"
        )
        explicit_diagram = next(block for block in explicit["blocks"] if block["kind"] == "diagram")
        explicit_example_heading = next(
            block for block in explicit["blocks"]
            if block["kind"] == "prose" and block["text"] == "EXAMPLE: S/N CALCULATION"
        )
        explicit_lists = [block for block in explicit["blocks"] if block["kind"] == "list"]
        explicit_example_list = explicit_lists[0]
        explicit_context_list = explicit_lists[1]
        explicit_example_note = next(
            block for block in explicit["blocks"]
            if block["kind"] == "prose" and block["text"] == "Now the processing step is no longer a black box."
        )
        explicit_context_heading = next(
            block for block in explicit["blocks"]
            if block["kind"] == "prose" and block["text"] == "EXPLICIT CONTEXT"
        )

        self.assertEqual("What Happened Between the Raw Data and This Result?", black_heading["text"])
        self.assertEqual(["prose", "chart", "code", "diagram"], [block["kind"] for block in black_box["blocks"]])
        self.assertEqual("line", black_chart["chartType"])
        self.assertEqual("Retention time", black_chart["xAxis"]["label"])
        self.assertEqual("min", black_chart["xAxis"]["unit"])
        self.assertEqual("Intensity", black_chart["yAxis"]["label"])
        self.assertEqual("a.u.", black_chart["yAxis"]["unit"])
        opening_trace = black_chart["series"][0]["data"]
        self.assertEqual(61, len(opening_trace))
        self.assertEqual(0.0, opening_trace[0]["x"])
        self.assertEqual(12.0, opening_trace[-1]["x"])
        self.assertLess(max(point["y"] for point in opening_trace), 70.0)
        self.assertIn("Feature\tRT (min)\tm/z\tArea", black_table["code"])
        self.assertIn("F-03\t4.8\t325.134\t101,920", black_table["code"])
        self.assertEqual("flow", black_diagram["diagramType"])
        self.assertEqual(["RAW SIGNAL", "PROCESSING ?", "RESULT"], [node["label"] for node in black_diagram["nodes"]])
        self.assertEqual(["transformed by", "produces"], [edge["label"] for edge in black_diagram["edges"]])
        self.assertEqual("ex:node-cogniflow-black-box-processing", black_diagram["focusNodeId"])

        self.assertEqual("What FAIR Data Means in Practice", fair_intro_heading["text"])
        self.assertEqual(["prose", "list", "prose", "code"], [block["kind"] for block in fair_intro["blocks"]])
        self.assertEqual("FAIR DATA OBJECT\nIllustrative LC-HRMS dataset", fair_intro_caption["text"])
        self.assertEqual(
            [
                "F — FINDABLE\nPersistent identifier + searchable metadata",
                "A — ACCESSIBLE\nRetrievable under clear access conditions",
                "I — INTEROPERABLE\nStructured formats + shared vocabularies",
                "R — REUSABLE\nRich metadata + provenance + clear reuse conditions",
            ],
            [item["text"] for item in fair_intro_list["items"]],
        )
        self.assertEqual("tsv", fair_intro_table["language"])
        self.assertIn("Identifier\tdoi:10.xxxx/sample.017", fair_intro_table["code"])
        self.assertIn("Format\tmzML", fair_intro_table["code"])
        self.assertIn("Reuse\tlicense + provenance", fair_intro_table["code"])

        self.assertEqual("FAIR Data Are Not FAIR Processing", fair_heading["text"])
        self.assertEqual(
            ["prose", "diagram", "prose", "list", "prose", "prose", "list"],
            [block["kind"] for block in fair_gap["blocks"]],
        )
        self.assertEqual("flow", fair_diagram["diagramType"])
        self.assertEqual(
            ["INSTRUMENT", "FAIR / OPEN\nDATA", "CUSTOM PROCESSING", "RESULT"],
            [node["label"] for node in fair_diagram["nodes"]],
        )
        self.assertEqual(
            ["measurement", "processed by", "produces"],
            [edge["label"] for edge in fair_diagram["edges"]],
        )
        self.assertEqual([], fair_diagram["states"])
        self.assertEqual("ex:node-cogniflow-fair-processing", fair_diagram["focusNodeId"])
        fair_processing = next(node for node in fair_diagram["nodes"] if node["label"] == "CUSTOM PROCESSING")
        self.assertEqual("highlight", fair_processing["visualRole"])
        self.assertEqual("EXAMPLE: SIGNAL-TO-NOISE RATIO", fair_example_heading["text"])
        self.assertEqual(
            [
                "S/N = peak height / σ(noise)",
                "S/N = peak height / RMS(noise)",
                "S/N = 2 × peak height / peak-to-peak noise",
                "S/N = peak area / noise estimate",
            ],
            [item["text"] for item in fair_example_list["items"]],
        )
        self.assertEqual("Same label — different operational definitions.", fair_example_note["text"])
        self.assertEqual("MISSING CONTEXT", fair_missing_heading["text"])
        self.assertEqual(
            ["algorithm", "implementation", "version", "parameters", "environment", "dependencies"],
            [item["text"] for item in fair_missing_list["items"]],
        )

        self.assertEqual("Make Nothing Important Implicit", explicit_heading["text"])
        self.assertEqual(
            ["prose", "diagram", "prose", "list", "prose", "prose", "list"],
            [block["kind"] for block in explicit["blocks"]],
        )
        self.assertEqual("flow", explicit_diagram["diagramType"])
        self.assertEqual(
            ["INPUT", "PROCESSING", "OUTPUT"],
            [node["label"] for node in explicit_diagram["nodes"]],
        )
        self.assertEqual(
            ["consumed by", "produces"],
            [edge["label"] for edge in explicit_diagram["edges"]],
        )
        self.assertEqual([], explicit_diagram["groups"])
        self.assertEqual([], explicit_diagram["states"])
        self.assertEqual("ex:node-cogniflow-explicit-processing", explicit_diagram["focusNodeId"])
        explicit_processing = next(node for node in explicit_diagram["nodes"] if node["label"] == "PROCESSING")
        self.assertEqual("highlight", explicit_processing["visualRole"])
        self.assertEqual("EXAMPLE: S/N CALCULATION", explicit_example_heading["text"])
        self.assertEqual(
            [
                "purpose: quantify signal relative to background",
                "input: peak height + defined noise window",
                "output: S/N value",
                "parameters: noise window + RMS estimator",
                "implementation: calculate_snr() in a named package",
                "version: exact package release or commit",
            ],
            [item["text"] for item in explicit_example_list["items"]],
        )
        self.assertEqual("Now the processing step is no longer a black box.", explicit_example_note["text"])
        self.assertEqual("EXPLICIT CONTEXT", explicit_context_heading["text"])
        self.assertEqual(
            [
                "purpose",
                "interface: inputs + outputs",
                "parameters",
                "implementation",
                "version",
                "execution + provenance",
            ],
            [item["text"] for item in explicit_context_list["items"]],
        )

        self.assertEqual("CogniFlow Starts with Meaning", semantic_core["blocks"][0]["text"])
        self.assertEqual(
            "A stable interface coordinates specialized providers",
            service_process["blocks"][0]["text"],
        )

    def test_semantic_core_is_static_colored_meaning_network(self) -> None:
        document = RUNTIME.build_artifact(request())["sceneDocuments"][0]
        semantic_core = document["scenes"][5]
        heading = next(block for block in semantic_core["blocks"] if block["kind"] == "prose")
        diagram = next(block for block in semantic_core["blocks"] if block["kind"] == "diagram")

        self.assertEqual("CogniFlow Starts with Meaning", heading["text"])
        self.assertEqual("network", diagram["diagramType"])
        self.assertEqual(
            [
                "CONCEPT\nProcessing Unit",
                "ATTRIBUTES\nlabel\ndefinition\nversion",
                "RELATIONSHIPS\nconsumes\nproduces\nimplemented by",
                "CONTROLLED MEANING\nagreed terms\nallowed values\nvalidation",
                "CONCEPT DOMAIN\nshared vocabulary\nscope of meaning",
            ],
            [node["label"] for node in diagram["nodes"]],
        )
        self.assertEqual(
            ["described by", "connected by", "constrained by", "defined within"],
            [edge["label"] for edge in diagram["edges"]],
        )
        self.assertEqual(
            {
                "CONCEPT\nProcessing Unit": "concept-core",
                "ATTRIBUTES\nlabel\ndefinition\nversion": "attributes",
                "RELATIONSHIPS\nconsumes\nproduces\nimplemented by": "relationships",
                "CONTROLLED MEANING\nagreed terms\nallowed values\nvalidation": "controlled-meaning",
                "CONCEPT DOMAIN\nshared vocabulary\nscope of meaning": "concept-domain",
            },
            {node["label"]: node["visualRole"] for node in diagram["nodes"]},
        )
        self.assertEqual({"Concept domain", "Semantic components"}, {group["label"] for group in diagram["groups"]})
        self.assertEqual([], diagram["states"])
        self.assertEqual("ex:node-cogniflow-semantic-concept", diagram["focusNodeId"])

    def test_semantic_views_and_provenance_form_single_core_argument(self) -> None:
        document = RUNTIME.build_artifact(request())["sceneDocuments"][0]
        semantic = document["scenes"][7]
        multi_view = document["scenes"][8]
        provenance = document["scenes"][9]

        semantic_heading = next(block for block in semantic["blocks"] if block["kind"] == "prose")
        semantic_code = next(block for block in semantic["blocks"] if block["kind"] == "code")
        multi_view_heading = next(block for block in multi_view["blocks"] if block["kind"] == "prose")
        provenance_heading = next(block for block in provenance["blocks"] if block["kind"] == "prose")
        provenance_diagram = next(block for block in provenance["blocks"] if block["kind"] == "diagram")

        self.assertEqual("Interfaces Need Shared Meaning", semantic_heading["text"])
        self.assertIn("@prefix skos:", semantic_code["code"])
        self.assertIn('skos:prefLabel "Injection 2"@en', semantic_code["code"])
        self.assertEqual("One Meaning. Multiple Views.", multi_view_heading["text"])
        self.assertEqual("The Result Carries Its History", provenance_heading["text"])
        self.assertEqual(
            [
                "INPUT DATA",
                "PROCESSING · method + version + parameters",
                "DERIVED ARTIFACT · linked to input + process",
                "REUSABLE RESULT · data + provenance",
            ],
            [node["label"] for node in provenance_diagram["nodes"]],
        )
        self.assertEqual(
            ["processed by", "produces + records", "packages with history"],
            [edge["label"] for edge in provenance_diagram["edges"]],
        )
        self.assertEqual("ex:node-cogniflow-prov-reusable", provenance_diagram["focusNodeId"])
        provenance_text = " ".join(node["label"] for node in provenance_diagram["nodes"])
        self.assertNotIn("LC–MS", provenance_text)
        self.assertNotIn("qPeaks", provenance_text)

    def test_analytical_proof_keeps_visual_evidence_distinct_from_result_states(self) -> None:
        document = RUNTIME.build_artifact(request())["sceneDocuments"][0]
        proof = document["scenes"][10]
        heading = next(block for block in proof["blocks"] if block["kind"] == "prose")
        chart = next(block for block in proof["blocks"] if block["kind"] == "chart")
        lineage = next(block for block in proof["blocks"] if block["kind"] == "diagram")

        self.assertEqual("From Raw Signal to Reusable Result", heading["text"])
        self.assertEqual("One signal. Five explicit states.", chart["label"])
        self.assertEqual(
            ["Baseline estimate", "Peak apex / model anchor", "Integration window"],
            [annotation["label"] for annotation in chart["annotations"]],
        )
        self.assertEqual(
            ["RAW SIGNAL", "BASELINE ESTIMATE", "ASYMMETRIC MODEL", "AREA + UNCERTAINTY", "FAIR ARTIFACT"],
            [node["label"] for node in lineage["nodes"]],
        )
        self.assertEqual(["estimate", "model", "quantify", "package"], [edge["label"] for edge in lineage["edges"]])
        self.assertEqual("ex:node-cogniflow-proof-fair", lineage["focusNodeId"])

    def test_take_home_is_three_principles_plus_one_sentence(self) -> None:
        document = RUNTIME.build_artifact(request())["sceneDocuments"][0]
        take_home = document["scenes"][11]
        heading = next(block for block in take_home["blocks"] if block["kind"] == "prose" and block["intent"]["kind"] == "introduce")
        principles = next(block for block in take_home["blocks"] if block["kind"] == "list")
        statement = next(block for block in take_home["blocks"] if block["kind"] == "prose" and block["intent"]["kind"] == "explain")

        self.assertEqual("Take-Home", heading["text"])
        self.assertEqual(["DECOUPLED.", "SEMANTIC.", "REPRODUCIBLE."], [item["text"] for item in principles["items"]])
        self.assertEqual("Standardize the contract, not the implementation.", statement["text"])
        self.assertEqual("ex:def-cogniflow-take-home", statement["source"][0]["resourceId"])

    def test_semantic_and_multiview_scenes_use_analytical_replicate_data(self) -> None:
        artifact = RUNTIME.build_artifact(request())
        document = artifact["sceneDocuments"][0]
        semantic = document["scenes"][7]
        multi_view = document["scenes"][8]
        code = next(block for block in semantic["blocks"] if block["kind"] == "code")
        chart = next(block for block in multi_view["blocks"] if block["kind"] == "chart")
        self.assertIn("ex:chart-cogniflow-replicate-peak-area", code["code"])
        self.assertEqual("bar", chart["chartType"])
        self.assertEqual(["Injection 1", "Injection 2", "Injection 3", "Injection 4"], [datum["category"] for datum in chart["data"]])
        self.assertEqual([98.6, 100.3, 99.5, 101.1], [datum["value"] for datum in chart["data"]])

    def test_attribution_role_rejects_wrong_selector(self) -> None:
        dataset = copy_dataset(self.dataset)
        item = EX["scene-item-cogniflow-title-gerrit-renner"]
        graph = dataset.graph(SCENE_GRAPH)
        graph.set((item, CD.selectionPath, Literal("skos:prefLabel@en")))
        with self.assertRaisesRegex(ValueError, "AttributionRole requires direct cd:body"):
            RUNTIME.compile_scene_document(dataset, RUNTIME.CoursePathReference(str(PATH), str(PATH_GRAPH)))
        conforms, _report_graph, _report_text = VALIDATION.validate_dataset(dataset)
        self.assertFalse(conforms)

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
