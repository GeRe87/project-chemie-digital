from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import Namespace, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import rdf_dataset as RDF_DATASET  # noqa: E402
import validate_semantics as VALIDATION  # noqa: E402

RUNTIME_SPEC = importlib.util.spec_from_file_location(
    "generate_canonical_runtime", SCRIPTS / "generate_canonical_runtime.py"
)
assert RUNTIME_SPEC and RUNTIME_SPEC.loader
RUNTIME = importlib.util.module_from_spec(RUNTIME_SPEC)
RUNTIME_SPEC.loader.exec_module(RUNTIME)

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
PATH = EX["path-chemometrics-random-variables-lecture"]
PATH_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/paths/chemometrics-random-variables-lecture"
)
SCENE_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/scenes/chemometrics-random-variables-lecture"
)

EXPECTED_SCENES = [
    "scene-chemometrics-variables-constants-opener",
    "scene-chemometrics-variable-definition",
    "scene-chemometrics-constant-distinction",
    "scene-chemometrics-variable-roles",
    "scene-chemometrics-variable-examples",
    "scene-chemometrics-variable-code-experiment",
    "scene-chemometrics-sample-variable",
    "scene-chemometrics-distribution-anchor",
    "scene-chemometrics-random-variable",
    "scene-chemometrics-discrete-random-variable",
    "scene-chemometrics-continuous-random-variable",
    "scene-chemometrics-classify-concentration",
    "scene-chemometrics-classify-wavelength",
    "scene-chemometrics-classify-temperature",
]

EXPECTED_BLOCK_KINDS = [
    ["prose", "prose", "prose"],
    ["prose", "prose"],
    ["prose", "prose", "prose"],
    ["prose", "prose", "prose", "prose"],
    ["prose", "prose", "prose", "prose"],
    ["prose", "prompt", "code"],
    ["prose", "prose"],
    ["prose", "prose"],
    ["prose", "prose", "prose"],
    ["prose", "prose", "prose"],
    ["prose", "prose", "prose"],
    ["prose", "prompt"],
    ["prose", "prompt"],
    ["prose", "prompt"],
]

POLL_IDS = [
    "ex:poll-classify-calibration-concentration",
    "ex:poll-classify-fixed-wavelength",
    "ex:poll-classify-recorded-temperature",
]


class ChemometricsVariablesConstantsSceneTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.scene_graph = cls.dataset.graph(SCENE_GRAPH)
        cls.document = RUNTIME.compile_scene_document(
            cls.dataset,
            RUNTIME.CoursePathReference(str(PATH), str(PATH_GRAPH)),
        )

    def test_scene_graph_has_exactly_fourteen_authored_scenes(self) -> None:
        scenes = set(self.scene_graph.subjects(RDF.type, CD.SceneDefinition))
        self.assertEqual({EX[name] for name in EXPECTED_SCENES}, scenes)

    def test_compiled_scene_document_preserves_exact_narrative_order(self) -> None:
        self.assertEqual("ex:path-chemometrics-random-variables-lecture", self.document["sourcePathId"])
        self.assertEqual(
            [f"ex:{name}--scene" for name in EXPECTED_SCENES],
            [scene["id"] for scene in self.document["scenes"]],
        )
        self.assertEqual(
            EXPECTED_BLOCK_KINDS,
            [[block["kind"] for block in scene["blocks"]] for scene in self.document["scenes"]],
        )

    def test_chapter_opens_with_variables_and_constants_scope(self) -> None:
        first = self.document["scenes"][0]
        self.assertEqual("Variables and Constants", first["blocks"][0]["text"])
        self.assertIn("experimental or data-analytic scope", first["blocks"][1]["text"])
        self.assertIn("depends on the scope", first["blocks"][2]["text"])

    def test_dynamic_calibration_scene_is_prompt_plus_executable_r(self) -> None:
        scene = self.document["scenes"][5]
        prompt = scene["blocks"][1]
        code = scene["blocks"][2]
        self.assertEqual("prompt", prompt["kind"])
        self.assertEqual("free-text", prompt["responseMode"])
        self.assertIn("independent variable", prompt["prompt"])
        self.assertIn("dependent response", prompt["prompt"])
        self.assertEqual("code", code["kind"])
        self.assertEqual("r", code["language"])
        self.assertTrue(code["editable"])
        self.assertTrue(code["executable"])
        self.assertIn("concentration_mg_L", code["code"])
        self.assertIn("wavelength_nm <- 540", code["code"])
        self.assertIn("absorbance", code["code"])

    def test_sample_distribution_and_random_variable_bridge_are_present(self) -> None:
        self.assertIn("sample contains observations", self.document["scenes"][6]["blocks"][1]["text"])
        self.assertIn("Detailed distribution theory is introduced later", self.document["scenes"][7]["blocks"][1]["text"])
        self.assertIn("measurable function", self.document["scenes"][8]["blocks"][1]["text"])
        self.assertIn("realization", self.document["scenes"][8]["blocks"][2]["text"])

    def test_three_final_classification_scenes_are_single_choice_variable_constant(self) -> None:
        for scene, poll_id in zip(self.document["scenes"][11:14], POLL_IDS, strict=True):
            with self.subTest(scene=scene["id"]):
                prompt = scene["blocks"][1]
                self.assertEqual("prompt", prompt["kind"])
                self.assertEqual("single-choice", prompt["responseMode"])
                self.assertEqual(["Variable", "Constant"], prompt["options"])
                self.assertEqual(poll_id, prompt["source"][0]["resourceId"])
                self.assertEqual(
                    {"ex:poll-option-01-variable", "ex:poll-option-02-constant"},
                    {source["resourceId"] for source in prompt["source"][1:]},
                )

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
