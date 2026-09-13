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

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
OFFERING = EX["teaching-offering-cogniflow-standardized-data-processing"]
PLACEMENT = EX["unit-placement-cogniflow-standardized-data-processing"]
UNIT = EX["learning-unit-cogniflow-standardized-data-processing"]
PATH = EX["path-cogniflow-standardized-data-processing"]
PATH_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/paths/cogniflow-standardized-data-processing")
SCENE_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/scenes/cogniflow-standardized-data-processing")
TITLE = "Standardized Data Processing - Project CogniFlow"
GERRIT = "Gerrit Renner — Instrumental Analytical Chemistry, University of Duisburg-Essen"
RICARDO = "Ricardo Cunha — IUTA"

EXPECTED_SCENES = [
    "ex:scene-cogniflow-title--scene",
    "ex:scene-cogniflow-coupling-problem--scene",
    "ex:scene-cogniflow-service-architecture--scene",
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

    def test_cogniflow_compiles_curated_eight_scene_narrative(self) -> None:
        artifact = RUNTIME.build_artifact(request())
        document = artifact["sceneDocuments"][0]
        self.assertEqual("ex:path-cogniflow-standardized-data-processing", document["sourcePathId"])
        self.assertEqual("1.2", document["version"])
        self.assertEqual(EXPECTED_SCENES, [scene["id"] for scene in document["scenes"]])
        self.assertNotIn("ex:scene-cogniflow-service-usage--scene", EXPECTED_SCENES)
        self.assertNotIn("ex:scene-cogniflow-signal-to-peak--scene", EXPECTED_SCENES)

    def test_title_scene_compiles_exact_requested_title_and_attributions(self) -> None:
        artifact = RUNTIME.build_artifact(request())
        document = artifact["sceneDocuments"][0]
        self.assertEqual(8, len(document["scenes"]))
        scene = document["scenes"][0]
        self.assertEqual("ex:scene-cogniflow-title--scene", scene["id"])
        self.assertEqual([TITLE, GERRIT, RICARDO], [block["text"] for block in scene["blocks"]])
        self.assertEqual(["prose", "prose", "prose"], [block["kind"] for block in scene["blocks"]])
        self.assertEqual("primary", scene["blocks"][0]["emphasis"])
        self.assertEqual(["supporting", "supporting"], [block["emphasis"] for block in scene["blocks"][1:]])
        self.assertEqual(
            [
                "ex:cogniflow-standardized-data-processing",
                "ex:attribution-cogniflow-gerrit-renner",
                "ex:attribution-cogniflow-ricardo-cunha",
            ],
            [block["source"][0]["resourceId"] for block in scene["blocks"]],
        )
        self.assertEqual(["skos:prefLabel@en", "cd:body", "cd:body"], [block["source"][0]["relationPath"] for block in scene["blocks"]])
        fallback = RUNTIME.static_fallback(artifact)
        self.assertIn(TITLE, fallback)
        self.assertIn(GERRIT, fallback)
        self.assertIn(RICARDO, fallback)

    def test_opening_sequence_states_problem_then_decoupled_answer(self) -> None:
        document = RUNTIME.build_artifact(request())["sceneDocuments"][0]
        problem = document["scenes"][1]
        architecture = document["scenes"][2]

        problem_heading = next(block for block in problem["blocks"] if block["kind"] == "prose")
        problem_diagram = next(block for block in problem["blocks"] if block["kind"] == "diagram")
        architecture_heading = next(block for block in architecture["blocks"] if block["kind"] == "prose")
        architecture_diagram = next(block for block in architecture["blocks"] if block["kind"] == "diagram")

        self.assertEqual("One Dependency Can Break the Workflow", problem_heading["text"])
        self.assertEqual(
            [
                "Scientific workflow",
                "Package A",
                "Package B",
                "Library E · v1.x",
                "Library E · v2.x",
                "DEPENDENCY CONFLICT",
            ],
            [node["label"] for node in problem_diagram["nodes"]],
        )
        self.assertEqual("One Interface. Specialized Providers.", architecture_heading["text"])
        self.assertEqual(
            [
                "User / AI Agent",
                "MCP Server",
                "CogniFlow Orchestrator",
                "Semantic Provider",
                "Data Provider",
                "Artifact + Provenance Provider",
            ],
            [node["label"] for node in architecture_diagram["nodes"]],
        )
        self.assertEqual("ex:node-cogniflow-dep-conflict", problem_diagram["focusNodeId"])
        self.assertEqual("ex:node-cogniflow-mcp", architecture_diagram["focusNodeId"])

    def test_semantic_views_and_provenance_form_single_core_argument(self) -> None:
        document = RUNTIME.build_artifact(request())["sceneDocuments"][0]
        semantic = document["scenes"][3]
        multi_view = document["scenes"][4]
        provenance = document["scenes"][5]

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
        proof = document["scenes"][6]
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
        take_home = document["scenes"][7]
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
        semantic = document["scenes"][3]
        multi_view = document["scenes"][4]
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
