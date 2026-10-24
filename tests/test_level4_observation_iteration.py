"""Bounded iteration-A checks: no full-project validation or transport writes."""
import sys
import unittest
from pathlib import Path
from rdflib import Graph, Literal, Namespace, RDF
from pyshacl import validate

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import rdf_dataset
import validate_semantics
import generate_canonical_runtime as runtime

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
GRAPH = "https://w3id.org/project-chemie-digital/graph/"
REFERENCE = runtime.CoursePathReference(str(EX["path-chemometrics-level4-distribution-shape-lecture"]), GRAPH + "paths/chemometrics-level4-distribution-shape-lecture")


class ObservationIterationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.document = runtime.compile_scene_document(cls.dataset, REFERENCE)
        # The accepted kernels/scenes survive the new opening and path reordering.
        cls.legacy_scenes = [next(s for s in cls.document["scenes"] if any(b.get("view") == view for b in s["blocks"])) for view in ("compare", "order", "count", "ecdf")]
        cls.charts = [s["blocks"][1] for s in cls.legacy_scenes]

    def test_preserved_discovery_scenes_still_compile(self):
        # Native boxplots raise the containing path to additive version 1.9;
        # the retained observation/ECDF primitive is still compatible with 1.8.
        self.assertEqual("1.10", self.document["version"])
        self.assertEqual(["compare", "order", "count", "ecdf"], [b["view"] for b in self.charts])
        self.assertTrue(all(b["chartType"] == "observations" for b in self.charts))
        self.assertTrue(all(b["kind"] == "chart" for b in self.charts))
        # The new concept/example pair replaces the old active type-7 selection,
        # while the original scene and formula remain reusable RDF resources.
        self.assertIn("ex:l4-scene-quantiles-concept--scene", [s["id"] for s in self.document["scenes"]])
        self.assertIn((EX["l4-scene-type-7"],RDF.type,CD.SceneDefinition),self.union)
        self.assertIn((EX["l4-formula-quantile-interpolation"],CD.derivedFromResource,EX["l4-formula-sample-quantile-type-7"]),self.union)

    def test_canonical_observations_not_duplicated_and_ties_retained(self):
        for chart in self.charts:
            for series in chart["series"]:
                self.assertEqual(7, len(series["data"]))
                self.assertEqual(7, len({d["id"] for d in series["data"]}))
                self.assertEqual([4, 4], [d["value"] for d in series["data"] if d["value"] == 4])
                self.assertTrue(all(d["source"] for d in series["data"]))
        self.assertEqual([6,4,7,2,5,4,5], [d["value"] for d in self.charts[1]["series"][0]["data"]])
        self.assertEqual([6,4,30,2,5,4,5], [d["value"] for d in self.charts[0]["series"][1]["data"]])
        teaching = self.dataset.graph(GRAPH + "specifications/level4-observation-teaching")
        self.assertEqual([], list(teaching.subjects(RDF.type, CD.Dataset)))
        self.assertEqual([], list(teaching.subjects(RDF.type, CD.Observation)))

    def test_formalization_reuses_exact_accepted_resources_only_in_ecdf(self):
        self.assertTrue(all("formal" not in b for b in self.charts[:3]))
        formal = self.charts[3]["formal"]
        self.assertEqual(str(next(self.union.objects(EX["l4-def-empirical-cdf"], CD.body))), formal["definition"])
        self.assertEqual(str(next(self.union.objects(EX["l4-formula-empirical-cdf"], CD.latex))), formal["expression"])
        self.assertIn("ex:l4-formula-empirical-cdf", [s["resourceId"] for s in formal["source"]])

    def test_static_fallback_contains_values_counts_and_formalization(self):
        artifact = {"sceneDocuments": [{**self.document, "scenes": self.legacy_scenes}]}
        text = runtime.static_fallback(artifact)
        self.assertIn("1/7", text)
        self.assertIn("left limit", text)
        self.assertIn("Definition and formula", text)
        self.assertIn("O7: 30.0", text)

    def test_only_new_explorer_shapes_conform(self):
        shapes = self.dataset.graph(GRAPH + "shapes/observation-explorer")
        conforms, _, report = validate(self.union, shacl_graph=shapes, advanced=True)
        self.assertTrue(conforms, report)

    def test_new_shapes_reject_unpaired_formalization(self):
        broken = Graph()
        broken += self.union
        broken.remove((EX["l4-ecdf-chart"], CD.formalDefinition, None))
        conforms, _, report = validate(broken, shacl_graph=self.dataset.graph(GRAPH + "shapes/observation-explorer"), advanced=True)
        self.assertFalse(conforms, report)

    def test_compiler_rejects_lost_observations_and_invalid_domain(self):
        dataset = rdf_dataset.assemble_dataset()
        graph = dataset.graph(GRAPH + "specifications/level4-observation-teaching")
        graph.remove((EX["l4-observation-reference"], CD.hasObservationPlacement, EX["l4-placement-1"]))
        with self.assertRaisesRegex(ValueError, "positions|every dataset observation"):
            runtime.compile_scene_document(dataset, REFERENCE)
        dataset = rdf_dataset.assemble_dataset()
        graph = dataset.graph(GRAPH + "specifications/level4-observation-teaching")
        graph.set((EX["l4-count-chart"], CD.thresholdMinimum, Literal(4)))
        with self.assertRaisesRegex(ValueError, "Threshold domain"):
            runtime.compile_scene_document(dataset, REFERENCE)


if __name__ == "__main__":
    unittest.main()
