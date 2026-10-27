"""Owner revision #296: source fidelity, staged evidence and isolation contracts."""
import copy
from pathlib import Path
import sys
import unittest
from rdflib import Graph, Namespace, URIRef
from rdflib.namespace import SH
from pyshacl import validate

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import generate_canonical_runtime as R
import generate_ted_revision_assets as A
from presentation_collection import build_collection_artifact
from static_course_artifact import media_uris


class TedRevisionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = R.assemble_dataset()
        cls.artifact = build_collection_artifact(R.EX + "talks")
        cls.scenes = cls.artifact["sceneDocuments"][0]["scenes"]

    def scene(self, name):
        return next(scene for scene in self.scenes if scene["id"] == f"ex:ted-scene-{name}--scene")

    def block(self, name, kind):
        return next(block for block in self.scene(name)["blocks"] if block["kind"] == kind)

    def test_new_slides_follow_the_exact_requested_anchors(self):
        ids = [s["id"] for s in self.scenes]
        for anchor, follow in [("markers", "process-variance"), ("heating-rate", "temperature-program"), ("sample-comparison", "fifo-design"), ("semantic-pipeline", "validation")]:
            self.assertEqual(ids[ids.index(f"ex:ted-scene-{anchor}--scene")+1], f"ex:ted-scene-{follow}--scene")
        self.assertEqual(len(ids), 29)

    def test_temperature_program_uses_the_actual_export_not_schedule_constants(self):
        chart = self.block("temperature-program", "chart")
        self.assertEqual([(p["x"], p["y"]) for p in chart["series"][0]["data"]], [(0, 200), (2, 200), (32, 500), (38, 500)])
        self.assertEqual(chart["xAxis"]["unit"], "min")
        self.assertEqual(chart["yAxis"]["unit"], "°C")
        self.assertEqual([(p["x"],p["y"]) for p in chart["series"][1]["data"]], [(0,200),(2,200),(22,500),(28,500)])
        self.assertIn("settling", self.scene("temperature-program")["narration"])
        self.assertIn("separate", self.scene("temperature-program")["narration"])
        self.assertEqual(self.block("heating", "list")["items"][0]["text"].splitlines()[1], "  - **Range:** 25–1000 °C")

    def test_sorption_claims_are_qualitative_and_conditioned(self):
        text = " ".join(p["text"] for p in self.block("capture", "list")["items"])
        self.assertIn("small fraction", text)
        self.assertIn("Recondition", text)
        self.assertIn("blanks", text)
        self.assertIn("no quantitative recovery", self.scene("capture")["narration"])

    def test_timeline_run_labels_belong_to_extraction_and_gc_only(self):
        for name in ("bottleneck", "nesting", "calibration-time"):
            chart = self.block(name, "chart")
            labels = {c["id"]: c["label"] for c in chart["categories"]}
            for scenario in chart["scenarios"]:
                for lane in scenario["lanes"]:
                    for interval in lane["intervals"]:
                        self.assertEqual(interval["showRunLabel"], labels[interval["categoryId"]] in {"TGA extraction", "GC-MS"})

    def test_marker_inset_is_a_separate_source_linked_stage_and_packaged_asset(self):
        chart = self.block("markers", "chart")
        annotations = chart["annotations"]
        self.assertEqual([a["id"] for a in annotations], ["ex:ted-select-eic", "ex:ted-marker-candidate-a", "ex:ted-marker-spectrum", "ex:ted-marker-area"])
        self.assertEqual(annotations[1]["datumId"], annotations[2]["datumId"])
        self.assertIn(annotations[2]["media"]["uri"], list(media_uris([chart])))
        self.assertEqual(annotations[2]["media"]["darkUri"], "/talks-media/ted-marker-spectrum-dark.svg")
        self.assertIn(annotations[2]["media"]["darkUri"], list(media_uris([chart])))
        self.assertIn("not a measured spectrum", annotations[2]["media"]["alternativeText"])
        self.assertIn("Synthetic mirror-spectrum inset", R.static_fallback(self.artifact))

    def test_five_supplied_points_are_unmodified_and_uv_comparison_is_artificial(self):
        dataset = A.data()
        measured = A.pairs(dataset, A.EX['ted-calibration-pairs'])[5:10]
        self.assertEqual(measured, [(20, 4901.712198), (60, 22356.264737), (100, 18928.276037), (129, 29822.911832), (204, 31251.142802)])
        self.assertAlmostEqual(A.fit(measured)[2], 0.7408299947774601)
        self.assertAlmostEqual(A.fit(A.pairs(dataset, A.EX['ted-uv-comparison-data']))[2], 0.99, places=8)
        for scene in (self.scene("process-variance"), self.scene("fair")):
            formula = next(b for b in scene["blocks"] if b["kind"] == "math")
            legends = [b for b in scene["blocks"] if b["kind"] == "definition-list" and any(s.get("relationPath") == "dct:hasPart" and s["resourceId"] == formula["source"][0]["resourceId"] for s in b["source"])]
            self.assertEqual(len(legends), 1)
            self.assertTrue(legends[0]["entries"][0]["description"])
        self.assertIn("not a representative", self.scene("process-variance")["narration"])
        self.assertIn("Replication does not fix bias", self.scene("process-variance")["narration"])

    def test_generated_assets_are_deterministic_and_do_not_embed_active_content(self):
        import xml.etree.ElementTree as ET
        for name, content in A.assets().items():
            self.assertEqual((R.ROOT / "apps/pitch/public/talks-media" / name).read_text(encoding="utf-8"), content)
            for element in ET.fromstring(content).iter():
                self.assertNotIn(element.tag.split("}")[-1], {"script", "foreignObject", "image", "style"})
                self.assertFalse(any(key.startswith("on") for key in element.attrib))

    def test_fifo_exact_source_values_and_limits_survive_export(self):
        chart = self.block("fifo-design", "chart")
        self.assertEqual(len(chart["series"]), 3)
        expected = {"Recursive cyclic": [0.5925, 0.2637, 0.1682], "Fixed shuffled cycle": [0.6389, 0.2617, 0.1694], "Random mass/day": [0.6735, 0.2860, 0.1754]}
        for series in chart["series"]:
            self.assertEqual([p["x"] for p in series["data"]], [5, 15, 30])
            self.assertEqual([p["y"] for p in series["data"]], expected[series["label"]])
        for caveat in ("no sample-signal noise", "not a coefficient of determination", "excluded fits", "drift", "not been independently reproduced"):
            self.assertIn(caveat, self.scene("fifo-design")["narration"])

    def test_stage_three_highlights_all_processing_interfaces(self):
        diagram = self.block("processing", "diagram")
        self.assertEqual([e["label"] for e in diagram["edges"]], ["EICs", "Features", "Components", "Marker areas"])
        self.assertEqual(diagram["states"][2]["activeEdgeIds"], [e["id"] for e in diagram["edges"]])
        self.assertCountEqual(diagram["states"][2]["activeNodeIds"], [n["id"] for n in diagram["nodes"]])

    def test_part_endpoint_arrows_preserve_source_and_target_membership(self):
        diagram = self.block("processing-unit", "diagram")
        first, second = diagram["edges"]
        self.assertEqual(first["sourcePartId"], "ex:ted-unit-part-concept")
        self.assertNotIn("targetPartId", first)
        self.assertEqual(second["sourcePartId"], "ex:ted-unit-part-step")
        self.assertEqual(second["targetPartId"], "ex:ted-unit-part-average")
        self.assertEqual(diagram["states"][1]["activeEdgeIds"], [first["id"]])
        self.assertEqual(diagram["states"][2]["activeEdgeIds"], [first["id"], second["id"]])
        broken = copy.deepcopy(self.dataset)
        edge = URIRef(R.EX + "ted-unit-edge1")
        for graph in broken.graphs():
            graph.remove((edge, URIRef(R.CD + "sourceDiagramPart"), None))
        broken.graph(URIRef("https://w3id.org/project-chemie-digital/graph/diagrams/talks-ted-processing-units")).add((edge, URIRef(R.CD + "sourceDiagramPart"), URIRef(R.EX + "ted-unit-part-average")))
        with self.assertRaisesRegex(ValueError, "endpoint part"):
            R.flow_diagram_payload(broken, URIRef(R.EX + "ted-unit-flow"), "en")

    def test_shacl_teaching_failure_and_correction_are_real_selected_checks(self):
        demo = Namespace("https://example.org/ted-validation/")
        base = "https://w3id.org/project-chemie-digital/graph/"
        for version, expected in (("v1", False), ("v2", True)):
            shapes = Graph()
            for triple in self.dataset.graph(URIRef(base + "shapes/ted-validation-demo")):
                shapes.add(triple)
            shapes.add((demo.CompatibleConnectionShape, SH.targetNode, demo['connection-' + version]))
            conforms, report, _ = validate(self.dataset.graph(URIRef(base + 'examples/ted-validation-' + version)), shacl_graph=shapes)
            self.assertEqual(conforms, expected)
            self.assertEqual(bool(list(report.objects(None, SH.result))), not expected)
        diagram = self.block("validation", "diagram")
        self.assertEqual(len(diagram["states"]), 2)
        self.assertIn("conforms: false", diagram["nodes"][2]["description"])
        self.assertEqual(diagram["states"][0]["nodePresentations"][0]["thumbnail"]["uri"], "/talks-media/ted-validation-failure.svg")
        report = next(p for p in diagram["states"][1]["nodePresentations"] if p["nodeId"] == "ex:ted-validation-report")
        self.assertIn("conforms: true", report["description"])
        self.assertNotIn("thumbnail", report)

    def test_closing_contact_details_preserve_the_talk_address_and_qr(self):
        text = " ".join(b.get("text", "") for b in self.scene("thanks")["blocks"])
        for value in ("talks.odea-project.org", "Gerrit Renner", "gerrit.renner@uni-due.de", "www.uni-due.de/iac"):
            self.assertIn(value, text)
        self.assertEqual(self.block("thanks", "media-reference")["uri"], "/talks-media/talks-website-qr.svg")

    def test_chromatogram_title_uses_an_explicit_readable_word_break(self):
        trace = next(n for n in self.block("detection", "diagram")["nodes"] if n["id"] == "ex:ted-signal-node-trace")
        self.assertEqual(trace["label"], "Chromato-\ngram")

    def test_ai_finale_is_a_semantic_tool_architecture_not_an_unqualified_success_claim(self):
        diagram = self.block("ai", "diagram")
        self.assertEqual(diagram["diagramType"], "network")
        self.assertEqual(len(diagram["nodes"]), 6)
        self.assertEqual(len(diagram["states"]), 3)
        self.assertEqual([n["label"] for n in diagram["nodes"]], ["Standardized semantics", "Algorithms", "MCP server", "AI agent", "Validated pipeline", "Execution engine"])
        self.assertIn("not a separately enumerated MCP tool", self.scene("ai")["narration"])


if __name__ == "__main__":
    unittest.main()
