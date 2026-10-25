"""The introductory talk remains RDF-authored, visual-led and scientifically bounded."""
import json
import sys
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import generate_canonical_runtime as R
from presentation_collection import build_collection_artifact


class TedIntroductionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.artifact = build_collection_artifact(R.EX + "talks")
        cls.scenes = cls.artifact["sceneDocuments"][0]["scenes"]

    def test_title_and_six_content_scenes_in_authored_order(self):
        self.assertEqual([scene["id"] for scene in self.scenes], [
            "ex:scene-talk-microplastics-title--scene",
            *[f"ex:ted-scene-{name}--scene" for name in ["overview", "heating", "capture", "injection", "detection", "markers"]],
        ])
        self.assertEqual(self.scenes[0]["presentationTitle"]["authors"][0]["name"], "Gerrit Renner")
        self.assertEqual(len(self.artifact["presentationCollection"]["talks"]), 1)
        self.assertEqual(self.artifact["teachingOfferingDocuments"], [])
        self.assertEqual(self.artifact["sceneDocumentBindings"][0]["pathGraphId"],
                         "https://w3id.org/project-chemie-digital/graph/paths/talk-microplastics-ted-gc-ms")

    def test_every_content_scene_is_visual_first_and_bullets_are_concise(self):
        for scene in self.scenes[1:]:
            self.assertTrue(any(block["kind"] in {"diagram", "chart", "media-reference"} for block in scene["blocks"]))
            self.assertTrue(scene.get("narration"))
            self.assertFalse(any(block["kind"] == "math" for block in scene["blocks"]))
            for block in scene["blocks"]:
                if block["kind"] == "list":
                    self.assertEqual(len(block["items"]), 3)
                    for item in block["items"]:
                        self.assertLessEqual(len(item["text"].split()), 11)
                        self.assertTrue("**" in item["text"] or "==" in item["text"])

    def test_animation_states_are_authored_not_derived_from_slide_ids(self):
        diagrams = [b for scene in self.scenes for b in scene["blocks"] if b["kind"] == "diagram"]
        self.assertEqual([len(d["states"]) for d in diagrams], [5, 3])
        for diagram in diagrams:
            nodes = {n["id"] for n in diagram["nodes"]}
            for state in diagram["states"]:
                self.assertIn(state["focusNodeId"], nodes)
                self.assertTrue(state["source"][0]["provenanceIds"])

    def test_schematic_chromatogram_has_real_rdf_points_but_no_measurement_claim(self):
        chart = next(b for b in self.scenes[-1]["blocks"] if b["kind"] == "chart")
        self.assertEqual(chart["chartType"], "line")
        self.assertIn("not measured", chart["label"].lower())
        self.assertIn("synthetic", chart["description"].lower())
        tic, eic = chart["series"]
        for series in (tic, eic):
            data = series["data"]
            self.assertEqual(len(data), 81)
            self.assertTrue(all(a["x"] < b["x"] for a, b in zip(data, data[1:])))
        self.assertTrue(all(a["x"] == b["x"] and a["y"] >= b["y"] for a, b in zip(tic["data"], eic["data"])))
        select, marker, area = chart["annotations"]
        self.assertTrue(select["focusSeries"])
        self.assertEqual(select["seriesId"], eic["id"])
        self.assertEqual(marker["seriesId"], area["seriesId"])
        ids = [datum["id"] for datum in eic["data"]]
        self.assertLess(ids.index(area["startDatumId"]), ids.index(marker["datumId"]))
        self.assertLess(ids.index(marker["datumId"]), ids.index(area["endDatumId"]))
        self.assertEqual([annotation["kind"] for annotation in chart["annotations"]], ["point", "point", "x-range"])
        self.assertEqual(chart["yAxis"]["unit"], "a.u.")
        notes = self.scenes[-1]["narration"].lower()
        for required in ["matrix", "calibration", "blanks", "not particle count", "no named polymer"]:
            self.assertIn(required, notes)

    def test_illustrations_are_original_inert_vector_drawings_with_rdf_alternatives(self):
        media = [b for scene in self.scenes for b in scene["blocks"] if b["kind"] == "media-reference"]
        self.assertEqual(len(media), 3)
        for block in media:
            self.assertEqual(block["mediaType"], "image/svg+xml")
            self.assertIn("schematic", block["alternativeText"].lower())
            root = ET.parse(R.ROOT / "apps/pitch/public" / block["uri"].lstrip("/")).getroot()
            self.assertEqual(root.attrib["viewBox"], "0 0 800 520")
            for element in root.iter():
                self.assertIn(element.tag.split("}")[-1], {"svg", "rect", "path", "ellipse", "circle"})
                self.assertFalse(any(name.startswith("on") or name in {"href", "style"} for name in element.attrib))

    def test_sources_and_method_boundaries_survive_public_export_and_static_fallback(self):
        serialized = json.dumps(self.artifact, ensure_ascii=False)
        self.assertNotIn("cogniflow", serialized.lower())
        self.assertIn("2021.100117", serialized)
        notes = " ".join(scene.get("narration", "") for scene in self.scenes)
        self.assertIn("ions form", self.scenes[5]["blocks"][1]["states"][1]["label"].lower())
        self.assertIn("sorbent", notes.lower())
        self.assertIn("liquid", self.scenes[3]["narration"])
        fallback = R.static_fallback(self.artifact)
        self.assertIn("ted-heating.svg", fallback)
        self.assertIn("Schematic chromatogram", fallback)
        self.assertIn("Gerrit Renner", fallback)


if __name__ == "__main__":
    unittest.main()
