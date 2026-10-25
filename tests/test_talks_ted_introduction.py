"""The introductory talk remains RDF-authored, visual-led and scientifically bounded."""
import json
import math
import sys
import unittest
import xml.etree.ElementTree as ET
from rdflib import Dataset, URIRef
from rdflib.compare import to_isomorphic
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import generate_canonical_runtime as R
from presentation_collection import build_collection_artifact


class TedIntroductionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.artifact = build_collection_artifact(R.EX + "talks")
        cls.scenes = cls.artifact["sceneDocuments"][0]["scenes"]

    def test_title_and_content_scenes_in_authored_order(self):
        self.assertEqual([scene["id"] for scene in self.scenes], [
            "ex:scene-talk-microplastics-title--scene",
            *[f"ex:ted-scene-{name}--scene" for name in ["heating", "capture", "injection", "detection", "markers", "bottleneck", "nesting", "heating-rate", "calibration-time", "running-calibration", "sample-comparison", "processing", "fair", "semantics", "processing-step", "composable-steps", "processing-unit", "semantic-pipeline", "automatic-execution"]],
        ])
        self.assertEqual(self.scenes[0]["presentationTitle"]["authors"][0]["name"], "Gerrit Renner")
        self.assertEqual(len(self.artifact["presentationCollection"]["talks"]), 1)
        self.assertEqual(self.artifact["teachingOfferingDocuments"], [])
        self.assertEqual(self.artifact["sceneDocumentBindings"][0]["pathGraphId"],
                         "https://w3id.org/project-chemie-digital/graph/paths/talk-microplastics-ted-gc-ms")

    def test_every_content_scene_is_visual_first_and_bullets_are_concise(self):
        for scene in self.scenes[1:]:
            self.assertTrue(any(block["kind"] in {"diagram", "chart", "media-reference", "definition-list"} for block in scene["blocks"]))
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
        self.assertEqual([len(d["states"]) for d in diagrams], [3, 0, 0, 0, 0, 0, 0, 0])
        for diagram in diagrams:
            nodes = {n["id"] for n in diagram["nodes"]}
            for state in diagram["states"]:
                self.assertIn(state["focusNodeId"], nodes)
                self.assertTrue(state["source"][0]["provenanceIds"])

    def test_processing_overview_has_five_illustrated_steps_without_stages(self):
        scene = next(s for s in self.scenes if s["id"] == "ex:ted-scene-processing--scene")
        diagram = next(b for b in scene["blocks"] if b["kind"] == "diagram")
        self.assertEqual(diagram["states"], [])
        self.assertEqual(len(diagram["edges"]), 4)
        self.assertEqual([n["visualMotif"] for n in diagram["nodes"]],
                         ["data-import", "peak-search", "shared-peak-shape", "marker-selection", "regression"])
        self.assertTrue(all(n["visualMotifRole"] == "highlight" for n in diagram["nodes"]))
        self.assertIn("GQD", diagram["nodes"][0]["description"])
        self.assertFalse(any(b["kind"] == "math" for b in scene["blocks"]))

    def test_fair_principles_are_not_reduced_to_rdf_syntax(self):
        scene = next(s for s in self.scenes if s["id"] == "ex:ted-scene-fair--scene")
        cards = next(b for b in scene["blocks"] if b["kind"] == "definition-list")
        self.assertEqual([e["term"] for e in cards["entries"]],
                         ["F: Findable", "A: Accessible", "I: Interoperable", "R: Reusable"])
        self.assertIn("not a substitute", scene["narration"])
        self.assertIn("controlled access", scene["narration"])

    def test_processing_unit_transfer_is_static_and_preserves_compatible_interfaces(self):
        diagrams = []
        for name in ("processing-step", "composable-steps", "processing-unit"):
            scene = next(s for s in self.scenes if s["id"] == f"ex:ted-scene-{name}--scene")
            diagram = next(b for b in scene["blocks"] if b["kind"] == "diagram")
            self.assertEqual(diagram["states"], [])
            self.assertEqual(len(diagram["nodes"]), 3)
            self.assertEqual(len(diagram["edges"]), 2)
            self.assertEqual(diagram["diagramType"], "flow")
            diagrams.append(diagram)
        self.assertEqual([n["label"] for n in diagrams[0]["nodes"]], ["Input", "Process", "Output"])
        chain = diagrams[1]["nodes"]
        for left, right in zip(chain, chain[1:]):
            output = left["description"].split("OUT: ")[1]
            input_value = right["description"].split("IN: ")[1].splitlines()[0]
            self.assertEqual(output, input_value)
        unit = next(s for s in self.scenes if s["id"] == "ex:ted-scene-processing-unit--scene")
        self.assertIn("Input, Output and Parameter", unit["narration"])
        self.assertIn("ProcessingStep is atomic", unit["narration"])
        self.assertIn("not a ranking", unit["narration"])
        model = diagrams[2]
        self.assertEqual([n["label"] for n in model["nodes"]], ["Shared vocabulary", "Specializations", "Concrete operation"])
        self.assertEqual([len(n["parts"]) for n in model["nodes"]], [3, 3, 3])
        self.assertEqual(model["nodes"][2]["parts"][0]["label"], "qalg:Average")
        self.assertIn("Average_binding", model["nodes"][2]["parts"][2]["description"])
        self.assertIn("not data flow", model["description"])
        fallback = R.static_fallback(self.artifact)
        self.assertIn("Average_values", fallback)
        self.assertIn("Average_binding", fallback)
        self.assertIn("PortRole", fallback)

    def test_ted_pipeline_has_five_processing_steps_and_explicit_compatible_connections(self):
        scene = next(s for s in self.scenes if s["id"] == "ex:ted-scene-semantic-pipeline--scene")
        diagram = next(b for b in scene["blocks"] if b["kind"] == "diagram")
        self.assertEqual(len(diagram["nodes"]), 5)
        self.assertEqual(len(diagram["edges"]), 4)
        self.assertTrue(all(n["description"].startswith("ProcessingStep\n") for n in diagram["nodes"]))
        for index, edge in enumerate(diagram["edges"]):
            left, right = diagram["nodes"][index:index+2]
            self.assertEqual(edge["sourceNodeId"], left["id"])
            self.assertEqual(edge["targetNodeId"], right["id"])
            self.assertEqual(left["description"].split("OUT: ")[1], right["description"].split("IN: ")[1].splitlines()[0])
        self.assertIn("calibration data/model", scene["narration"])
        self.assertIn("Bind the actual implementations separately", scene["narration"])

    def test_ready_measurement_event_is_separate_from_pipeline_execution(self):
        scene = next(s for s in self.scenes if s["id"] == "ex:ted-scene-automatic-execution--scene")
        diagram = next(b for b in scene["blocks"] if b["kind"] == "diagram")
        self.assertEqual([n["label"] for n in diagram["nodes"]], ["Event server", "Execution engine", "Pipeline execution"])
        self.assertEqual([n["visualMotif"] for n in diagram["nodes"]], ["event-server", "execution-engine", "workflow-results"])
        self.assertIn("Measurement ended", diagram["nodes"][0]["description"])
        self.assertIn("File fully saved", diagram["nodes"][0]["description"])
        self.assertEqual([e["label"] for e in diagram["edges"]], ["trigger", "execute"])
        self.assertIn("file-created event alone must not", scene["narration"])
        self.assertIn("not a live integration", scene["narration"])
        self.assertIn("provenance", scene["narration"])

    def test_port_popups_are_serialized_from_the_exact_authored_named_graphs(self):
        scene = next(s for s in self.scenes if s["id"] == "ex:ted-scene-semantic-pipeline--scene")
        diagram = next(b for b in scene["blocks"] if b["kind"] == "diagram")
        authored = R.assemble_dataset()
        for edge, suffix in zip(diagram["edges"], ["eics", "features", "components", "marker-areas"]):
            detail = edge["codeDetail"]
            self.assertEqual(detail["language"], "trig")
            parsed = Dataset()
            parsed.parse(data=detail["code"], format="trig")
            graph = URIRef("https://w3id.org/project-chemie-digital/graph/shapes/ted-port-" + suffix)
            self.assertEqual(to_isomorphic(parsed.graph(graph)), to_isomorphic(authored.graph(graph)))
            self.assertIn("Input", detail["code"])
            self.assertIn("Output", detail["code"])
            self.assertIn("conformsTo", detail["code"])
            self.assertIn("property", detail["code"])
            self.assertTrue(detail["source"])
        fallback = R.static_fallback(self.artifact)
        self.assertIn("EICs: shared port contract", fallback)
        self.assertIn("massToCharge", fallback)

    def test_system_name_is_omitted_from_all_audience_text_and_speaker_notes(self):
        audience_keys = {"label", "description", "text", "term", "narration", "code", "fallback", "prompt"}
        def inspect(value):
            if isinstance(value, dict):
                for key, child in value.items():
                    if key in audience_keys and isinstance(child, str):
                        self.assertNotIn("cogniflow", child.lower())
                    inspect(child)
            elif isinstance(value, list):
                for child in value: inspect(child)
        inspect(self.scenes)

    def test_semantic_example_code_and_graph_preserve_the_same_assertions(self):
        scene = next(s for s in self.scenes if s["id"] == "ex:ted-scene-semantics--scene")
        code = next(b for b in scene["blocks"] if b["kind"] == "code")
        diagram = next(b for b in scene["blocks"] if b["kind"] == "diagram")
        self.assertEqual(diagram["presentation"], "dialog")
        self.assertEqual(len(diagram["nodes"]), 4)
        self.assertEqual(len(diagram["edges"]), 4)
        self.assertFalse(code["executable"])
        parsed = Dataset()
        parsed.parse(data=code["code"], format="trig")
        dataset = R.assemble_dataset()
        graph_id = URIRef("https://w3id.org/project-chemie-digital/graph/ted-demo-affiliations")
        self.assertEqual(set(parsed.graph(graph_id)), set(dataset.graph(graph_id)))
        self.assertEqual(len(parsed.graph(graph_id)), 9)
        # Each diagram relation points back to exactly one assertion predicate.
        cd = lambda name: R.iri(R.CD, name)
        owners = {n["id"]: URIRef(n["source"][0]["resourceId"].replace("ex:", R.EX)) for n in diagram["nodes"]}
        refs = {key: R.one(dataset, owner, R.DCTERMS.references) for key, owner in owners.items()}
        for edge in diagram["edges"]:
            owner = URIRef(edge["source"][0]["resourceId"].replace("ex:", R.EX))
            predicate = R.one(dataset, owner, R.DCTERMS.references)
            self.assertIn((refs[edge["sourceNodeId"]], predicate, refs[edge["targetNodeId"]]), dataset.graph(graph_id))
        self.assertEqual(list(dataset.graph(graph_id).objects(URIRef("https://example.org/fair-demo/ude"), URIRef("https://schema.org/alternateName")))[0].toPython(), "UDE")

    def test_schematic_chromatogram_has_real_rdf_points_but_no_measurement_claim(self):
        marker_scene = next(s for s in self.scenes if s["id"] == "ex:ted-scene-markers--scene")
        chart = next(b for b in marker_scene["blocks"] if b["kind"] == "chart")
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
        notes = marker_scene["narration"].lower()
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

    def test_schedule_models_preserve_source_totals_and_six_runs(self):
        scene = next(s for s in self.scenes if s["id"] == "ex:ted-scene-nesting--scene")
        chart = next(b for b in scene["blocks"] if b["kind"] == "chart")
        self.assertEqual(chart["chartType"], "timeline")
        self.assertEqual(self.artifact["sceneDocuments"][0]["version"], "1.14")
        totals = [max(i["end"] for lane in s["lanes"] for i in lane["intervals"]) for s in chart["scenarios"]]
        self.assertEqual(totals, [630, 423, 338])
        for scenario in chart["scenarios"]:
            self.assertEqual([len(l["intervals"]) for l in scenario["lanes"]], [12, 18])
            self.assertTrue(all(i["source"] for l in scenario["lanes"] for i in l["intervals"]))

    def test_heating_study_retains_digitized_values_and_credit_without_fabricated_fit(self):
        scene = next(s for s in self.scenes if s["id"] == "ex:ted-scene-heating-rate--scene")
        chart = next(b for b in scene["blocks"] if b["kind"] == "chart")
        self.assertEqual(len(chart["series"]), 1)
        self.assertEqual([(p["x"], p["y"]) for p in chart["series"][0]["data"]], [(10, 34.6), (12.5, 27), (15, 25.3), (17.5, 29.2), (20, 34.1)])
        self.assertIn("Rajshree Jeewon", scene["narration"])
        self.assertIn("not stated", chart["description"])
        self.assertEqual(chart["yMinimum"],20)

    def test_calibration_timing_and_windows_are_authored_without_em_dashes(self):
        time_scene = next(s for s in self.scenes if s["id"] == "ex:ted-scene-calibration-time--scene")
        time_chart = next(b for b in time_scene["blocks"] if b["kind"] == "chart")
        self.assertEqual(max(i["end"] for l in time_chart["scenarios"][0]["lanes"] for i in l["intervals"]), 550)
        self.assertEqual(sum(len(l["intervals"]) for l in time_chart["scenarios"][0]["lanes"]), 50)
        scene = next(s for s in self.scenes if s["id"] == "ex:ted-scene-running-calibration--scene")
        chart = next(b for b in scene["blocks"] if b["kind"] == "chart")
        self.assertEqual(len(chart["data"]), 44)
        self.assertEqual([len(w["datumIds"]) for w in chart["windows"]], [5, 15, 15])
        self.assertEqual(chart["windows"][2]["datumIds"], [p["id"] for p in chart["data"][:15]])
        self.assertEqual(chart["windows"][2]["cycleIntervalMs"],750)
        self.assertNotIn(chr(0x2014), json.dumps(self.artifact, ensure_ascii=False))

    def test_sample_comparison_reuses_dot_groups_with_explicit_error_semantics(self):
        scene = next(s for s in self.scenes if s["id"] == "ex:ted-scene-sample-comparison--scene")
        chart = next(b for b in scene["blocks"] if b["kind"] == "chart")
        self.assertEqual(chart["chartType"],"dot")
        self.assertEqual([g["disclosureStep"] for g in chart["groups"]],[1,1,2,2])
        self.assertEqual([len(g["data"]) for g in chart["groups"]],[3,3,11,11])
        self.assertTrue(all(g["interval"]["role"]=="descriptive-error" for g in chart["groups"]))
        self.assertIn("not confidence intervals",chart["description"])

    def test_sources_and_method_boundaries_survive_public_export_and_static_fallback(self):
        serialized = json.dumps(self.artifact, ensure_ascii=False)
        self.assertNotIn("cogniflow", serialized.lower())
        self.assertIn("2021.100117", serialized)
        notes = " ".join(scene.get("narration", "") for scene in self.scenes)
        detection = next(s for s in self.scenes if s["id"] == "ex:ted-scene-detection--scene")
        self.assertIn("ions form", detection["blocks"][1]["states"][1]["label"].lower())
        self.assertIn("sorbent", notes.lower())
        self.assertIn("liquid", self.scenes[2]["narration"])
        fallback = R.static_fallback(self.artifact)
        self.assertIn("ted-heating.svg", fallback)
        self.assertIn("Schematic TIC", fallback)
        self.assertIn("Gerrit Renner", fallback)

    def test_materialized_sample_results_reproduce_the_authored_recipe(self):
        dataset = R.assemble_dataset()
        cd = lambda name: R.iri(R.CD, name)
        def observations(owner):
            return sorted(R.objects(dataset, owner, cd("hasObservation")), key=lambda o: R.integer(dataset,o,cd("position")))
        def summary_at(calibrants, samples, factor, start, size):
            points = calibrants[start:start+size]
            xm = sum(x for x,y in points)/len(points); ym = sum(y for x,y in points)/len(points)
            slope = sum((x-xm)*(y-ym) for x,y in points)/sum((x-xm)**2 for x,y in points)
            intercept = ym-slope*xm
            return [(area-intercept)/slope/mass*factor for mass,area in samples]
        outputs = list(R.quads(dataset,None,cd("evaluationMode")))
        self.assertEqual(len(outputs),4)
        for output, _predicate, mode, _graph in outputs:
            sample = R.one(dataset,output,R.DCTERMS.source)
            calibration = R.one(dataset,sample,cd("usesCalibrationDataset"))
            pairs = lambda owner: [(R.decimal_number(dataset,o,cd("xValue")),R.decimal_number(dataset,o,cd("numericValue"))) for o in observations(owner)]
            calibrants, samples = pairs(calibration), pairs(sample)
            start = R.integer(dataset,sample,cd("localWindowStart"))-1
            size = R.integer(dataset,sample,cd("calibrationWindowSize")); radius = R.integer(dataset,sample,cd("neighborRadius"))
            factor = R.decimal_number(dataset,sample,cd("normalizationFactor"))
            if str(mode)=="local": expected = summary_at(calibrants,samples,factor,start,size)
            else: expected = [sum(summary_at(calibrants,samples,factor,start+i,size))/len(samples) for i in range(-radius,radius+1)]
            actual = [R.decimal_number(dataset,o,cd("numericValue")) for o in observations(output)]
            self.assertEqual(len(actual),len(expected))
            for a,b in zip(actual,expected): self.assertAlmostEqual(a,b,places=10)
            mean = sum(expected)/len(expected)
            se = math.sqrt(sum((v-mean)**2 for v in expected)/(len(expected)-1)/len(expected))
            group = next(g for g,_p,_o,_graph in dataset.quads((None,cd("usesDataset"),output,None)) if R.is_resource_type(dataset,g,"ChartGroup"))
            result = R.one(dataset,group,cd("summaryResult")); interval = R.one(dataset,group,cd("displayInterval"))
            self.assertAlmostEqual(R.decimal_number(dataset,result,cd("numericValue")),mean,places=10)
            self.assertAlmostEqual(R.decimal_number(dataset,interval,cd("lowerBound")),mean-se,places=10)
            self.assertAlmostEqual(R.decimal_number(dataset,interval,cd("upperBound")),mean+se,places=10)


if __name__ == "__main__":
    unittest.main()
