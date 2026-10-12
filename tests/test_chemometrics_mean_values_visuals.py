from __future__ import annotations

import json
import subprocess
import sys
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

from rdflib import Namespace, URIRef

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import generate_canonical_runtime as RUNTIME
import rdf_dataset

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-mean-values-examples")


class MeanValuesVisualTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset(include_legacy=False)
        cls.graph = cls.dataset.graph(GRAPH)
        cls.document = RUNTIME.compile_scene_document(cls.dataset, RUNTIME.CoursePathReference(
            str(EX["path-chemometrics-mean-values-lecture"]),
            "https://w3id.org/project-chemie-digital/graph/paths/chemometrics-mean-values-lecture"))
        cls.scenes = {s["id"].removeprefix("ex:scene-chemometrics-mean-values-").removesuffix("--scene"): s
                      for s in cls.document["scenes"]}
        # Exercise the real generic policy, not a copied content-side layout map.
        script = """import {inferRevealCompositionPlan} from './packages/renderer-reveal/src/composition-policy.ts';
let input=''; for await (const chunk of process.stdin) input+=chunk;
console.log(JSON.stringify(JSON.parse(input).scenes.map(scene=>inferRevealCompositionPlan(scene))));"""
        result = subprocess.run(["node", "--experimental-strip-types", "--input-type=module", "-e", script],
                                cwd=ROOT, input=json.dumps(cls.document), text=True, capture_output=True, check=True)
        cls.plans = dict(zip(cls.scenes, json.loads(result.stdout), strict=True))

    def test_supported_theory_structures_use_existing_bounded_compositions(self):
        expected = {
            "arithmetic-mean": ("learning-stage", "formula-legend"),
            "expected-value": ("main-aside-note", "formula-cards"),
            "law-of-large-numbers": ("learning-stage", "definition-deck"),
            "geometric-mean": ("learning-stage", "definition-deck"),
            "harmonic-mean": ("main-aside-note", "mixed"),
            "median": ("main-aside-note", "mixed"),
            "water": ("evidence-stage", "list-data"),
            "layers": ("main-aside-note", "formula-visual"),
            "title": ("visual-stage", "diagram"),
            "speed": ("learning-stage", "single-prompt"),
            "speed-solution": ("learning-stage", "formula-visual"),
            "turbidity": ("evidence-stage", "data-visual"),
        }
        for slug, (kind, profile) in expected.items():
            with self.subTest(slug=slug):
                self.assertEqual(kind, self.plans[slug]["kind"])
                self.assertEqual(profile, self.plans[slug]["profile"])
        self.assertEqual(31, len(self.scenes))

    def test_water_table_preserves_all_measurements_and_equal_weight_means(self):
        scene = self.scenes["water"]
        table = next(b for b in scene["blocks"] if b["kind"] == "table")
        self.assertEqual("Five equal-weight measurements (mg/L)", table["caption"])
        expected = [["1", "8.5", "3.2", "5.2"], ["2", "8.7", "3.5", "4.8"],
                    ["3", "8.6", "3.3", "5.1"], ["4", "8.4", "3.4", "5.0"],
                    ["5", "8.8", "3.6", "4.9"]]
        actual = [[cell["text"] for cell in row["cells"]] for row in table["rows"]]
        self.assertEqual(expected, actual)
        for index, expected_mean in enumerate([8.6, 3.4, 5.0], 1):
            self.assertAlmostEqual(expected_mean, sum(float(row[index]) for row in actual) / len(actual))
        self.assertIn(str(GRAPH), table["source"][0]["provenanceIds"])

    def test_layer_diagram_preserves_series_model_and_qualifications(self):
        diagram = next(b for b in self.scenes["layers"]["blocks"] if b["kind"] == "diagram")
        self.assertEqual(2, len(diagram["nodes"]))
        self.assertEqual(1, len(diagram["edges"]))
        self.assertEqual("same steady flux", diagram["edges"][0]["label"])
        context = self.scenes["layers"]["blocks"][1]["text"]
        for qualifier in ["steady-state", "equal thickness", "area", "series", "no reaction", "partition"]:
            self.assertIn(qualifier, context)

    def test_title_uses_supported_diagram_and_retains_accessible_svg_for_reuse(self):
        diagram = self.scenes["title"]["blocks"][1]
        self.assertEqual("diagram", diagram["kind"])
        self.assertEqual(["FIVE OUTCOMES", "ONE SUM", "REPEAT"], [n["label"] for n in diagram["nodes"]])
        self.assertIn("sample of sums", diagram["description"])
        media = EX["mean-five-dice-sketch"]
        uri = str(self.graph.value(media, CD.uri))
        self.assertEqual("/chemometrics/mean-values-five-dice.svg", uri)
        self.assertIn("sample of sums", str(self.graph.value(media, CD.alternativeText)))
        svg = ET.parse(ROOT / "apps/pitch/public" / uri.lstrip("/")).getroot()
        ns = {"s": "http://www.w3.org/2000/svg"}
        self.assertEqual(5, len(svg.findall(".//s:rect", ns)))
        self.assertIsNotNone(svg.find("s:title", ns))
        self.assertIsNotNone(svg.find("s:desc", ns))
        self.assertEqual([], svg.findall(".//s:script", ns))
        self.assertEqual([], svg.findall(".//s:image", ns))

    def test_general_static_fallback_renders_the_complete_level_two_document(self):
        fallback = RUNTIME.static_fallback({"sceneDocuments": [self.document]})
        self.assertEqual(31, fallback.count('<article data-pitch-step='))
        self.assertIn("Five outcomes, one sum, repeated sampling", fallback)
        self.assertIn('class="prompt-fallback"', fallback)
        self.assertIn("Observed order and sorted order (NTU)", fallback)
        self.assertFalse(any(b["kind"] == "media-reference" for s in self.scenes.values() for b in s["blocks"]))

    def test_speed_visual_keeps_exercise_answer_formula_and_exact_equal_distances(self):
        blocks = self.scenes["speed-solution"]["blocks"]
        prompt = next(b for b in self.scenes["speed"]["blocks"] if b["kind"] == "prompt")
        self.assertEqual(str(self.graph.value(EX["mean-speed-question"], CD.body)), prompt["prompt"])
        self.assertEqual(str(self.graph.value(EX["mean-speed-result"], CD.body)), prompt["expectedResult"])
        self.assertEqual(str(self.graph.value(EX["mean-speed-calculation"], CD.latex)),
                         next(b for b in blocks if b["kind"] == "math")["expression"])
        diagram = next(b for b in blocks if b["kind"] == "diagram")
        self.assertEqual(["FIRST 100 m", "NEXT 100 m"], [n["label"] for n in diagram["nodes"]])
        self.assertIn("10 s", diagram["nodes"][0]["description"])
        self.assertIn("50 s", diagram["nodes"][1]["description"])

    def test_sorted_turbidity_table_does_not_reorder_chart_observations(self):
        blocks = self.scenes["turbidity"]["blocks"]
        table = next(b for b in blocks if b["kind"] == "table")
        cells = [[c["text"] for c in row["cells"]] for row in table["rows"]]
        self.assertEqual(["2.1", "2.3", "2.0", "2.2", "45.0"], [row[1] for row in cells])
        self.assertEqual(["2.0", "2.1", "2.2", "2.3", "45.0"], [row[2] for row in cells])
        self.assertIn("does not pair", table["description"])
        chart = next(b for b in blocks if b["kind"] == "chart")
        self.assertEqual("ex:mean-turbidity-chart", chart["source"][0]["resourceId"])
        self.assertEqual("2.2", cells[2][2])

    def test_no_long_sentences_are_routed_through_automatic_list_markers(self):
        lists = [b for scene in self.scenes.values() for b in scene["blocks"] if b["kind"] == "list"]
        self.assertEqual(1, len(lists))
        self.assertEqual(["Oxygen: 8.6 mg/L", "Nitrate: 3.4 mg/L", "Iron: 5.0 mg/L"],
                         [item["text"] for item in lists[0]["items"]])

    def test_motifs_are_authored_and_projected_with_source_references(self):
        entries = [entry for scene in self.scenes.values() for b in scene["blocks"]
                   if b["kind"] == "definition-list" for entry in b["entries"]]
        decorated = [e for e in entries if e.get("visualMotif")]
        self.assertGreaterEqual(len(decorated), 15)
        for entry in decorated:
            self.assertTrue(any(s["relationPath"] == "cd:visualMotif" for s in entry["source"]))


if __name__ == "__main__":
    unittest.main()
