"""Variance/dispersion scenes: exact path binding, semantic authority and compilability."""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

import rdf_dataset as RDF_DATASET  # noqa: E402
import validate_semantics as VALIDATION  # noqa: E402

RUNTIME_SPEC = importlib.util.spec_from_file_location(
    "variance_runtime", SCRIPTS / "generate_canonical_runtime.py"
)
assert RUNTIME_SPEC and RUNTIME_SPEC.loader
RUNTIME = importlib.util.module_from_spec(RUNTIME_SPEC)
RUNTIME_SPEC.loader.exec_module(RUNTIME)

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
PATH_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/paths/chemometrics-variance-dispersion-lecture")
SCENE_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/scenes/chemometrics-variance-dispersion-lecture")
TEACHING_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-variance-teaching")
SCENE_SUFFIXES = ("variance", "standard-deviation", "bessel", "standard-error", "rsd", "practice")


class VarianceDispersionScenesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.union = VALIDATION.dataset_union(cls.dataset)
        cls.scenes = cls.dataset.graph(SCENE_GRAPH)
        cls.path = cls.dataset.graph(PATH_GRAPH)
        cls.teaching = cls.dataset.graph(TEACHING_GRAPH)

    def test_six_scenes_are_exactly_bound_and_ordered(self):
        expected_scenes = {
            EX[f"scene-chemometrics-variance-dispersion-{part}"]
            for part in SCENE_SUFFIXES
        }
        self.assertEqual(expected_scenes, set(self.scenes.subjects(RDF.type, CD.SceneDefinition)))
        for part in SCENE_SUFFIXES:
            step = EX[f"path-step-chemometrics-variance-dispersion-{part}"]
            scene = EX[f"scene-chemometrics-variance-dispersion-{part}"]
            with self.subTest(step=part):
                self.assertEqual({scene}, set(self.path.objects(step, CD.usesScene)))
                items = list(self.scenes.objects(scene, CD.hasSceneItem))
                self.assertGreaterEqual(len(items), 2)
                self.assertEqual(
                    list(range(1, len(items) + 1)),
                    sorted(int(next(self.scenes.objects(item, CD.position))) for item in items),
                )
                for item in items:
                    resource = next(self.scenes.objects(item, CD.selectsResource))
                    self.assertIn(Literal(True), set(self.union.objects(resource, CD.authoredResource)))
                    self.assertEqual(
                        {Literal("en")}, set(self.scenes.objects(item, CD.language))
                    )

    def test_scenes_are_renderer_neutral(self):
        self.assertEqual([], list(self.scenes.triples((None, CD.body, None))))
        self.assertEqual([], list(self.scenes.triples((None, CD.latex, None))))
        self.assertEqual([], list(self.scenes.triples((None, CD.presentationPattern, None))))
        self.assertEqual([], list(self.path.triples((None, RDF.type, CD.SceneDefinition))))

    def test_reuses_reviewed_two_series_datasets(self):
        resource = EX["variance-equal-mean-example"]
        self.assertEqual(
            {EX["dataset-compare-series-a"], EX["dataset-compare-series-b"]},
            set(self.teaching.objects(resource, CD.usesDataset)),
        )
        example = str(next(self.teaching.objects(resource, CD.body)))
        self.assertIn("1 and 25", example)
        self.assertIn("10 mg/L", example)
        self.assertIn("Same mean", str(next(self.teaching.objects(EX["variance-spread-point-one"], CD.body))))

    def test_bessel_has_explicit_sampling_scope(self):
        body = str(next(self.teaching.objects(EX["variance-bessel-point-two"], CD.body)))
        self.assertIn("independent, identically distributed", body)
        self.assertIn("unbiased", body)
        warning = str(next(self.teaching.objects(EX["variance-bessel-point-three"], CD.body)))
        self.assertIn("does not make s an unbiased estimator", warning)

    def test_selected_path_compiles_into_six_presentation_scenes(self):
        document = RUNTIME.compile_scene_document(
            self.dataset,
            RUNTIME.CoursePathReference(
                str(EX["path-chemometrics-variance-dispersion-lecture"]),
                str(PATH_GRAPH),
            ),
        )
        self.assertEqual(
            [f"ex:scene-chemometrics-variance-dispersion-{part}--scene" for part in SCENE_SUFFIXES],
            [scene["id"] for scene in document["scenes"]],
        )
        self.assertTrue(all(scene["blocks"] for scene in document["scenes"]))

    def test_complete_dataset_remains_shacl_conformant(self):
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
