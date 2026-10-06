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
    "scene-chemometrics-variables-constants-title",
    "scene-chemometrics-variable-definition",
    "scene-chemometrics-measured-variable-example",
    "scene-chemometrics-functional-dependence",
    "scene-chemometrics-observation-random-bridge",
    "scene-chemometrics-random-draw-r",
    "scene-chemometrics-constant-definition",
    "scene-chemometrics-uvvis-example",
    "scene-chemometrics-role-quiz",
]

EXPECTED_BLOCK_KINDS = [
    ["prose"],
    ["prose", "prose", "prose"],
    ["prose", "prose", "table", "chart"],
    ["prose", "prose", "math", "definition-list", "prose"],
    ["prose", "prose", "math", "diagram", "prose"],
    ["prose", "prose", "code"],
    ["prose", "prose", "prose"],
    ["prose", "prose", "table", "chart", "list"],
    ["prose", "prompt", "prompt", "prompt"],
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

    def test_scene_graph_has_exactly_nine_authored_scenes(self) -> None:
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

    def test_title_and_definition_cards_open_the_story(self) -> None:
        self.assertEqual(["Variables and Constants"], [b["text"] for b in self.document["scenes"][0]["blocks"]])
        variable = self.document["scenes"][1]
        self.assertEqual("Variable", variable["blocks"][0]["text"])
        self.assertIn("can take different values", variable["blocks"][1]["text"])
        self.assertIn("Introductory Statistics", variable["blocks"][2]["text"])

    def test_live_measurement_example_has_table_chart_and_authored_update_contract(self) -> None:
        scene = self.document["scenes"][2]
        table = scene["blocks"][2]
        chart = scene["blocks"][3]
        self.assertEqual(6, len(table["rows"]))
        self.assertEqual("line", chart["chartType"])
        self.assertEqual(
            {"intervalMs": 900, "jitterAmplitude": 0.012, "decimalPlaces": 3},
            chart["liveUpdate"],
        )
        self.assertIn("not experimental data", chart["description"])

    def test_dependency_slide_uses_simple_function_notation_without_causal_claim(self) -> None:
        scene = self.document["scenes"][3]
        self.assertIn("explain or predict", scene["blocks"][1]["text"])
        self.assertIn("does not by itself prove causality", scene["blocks"][1]["text"])
        self.assertEqual("y=f(x)", scene["blocks"][2]["expression"])
        descriptions = [entry["description"] for entry in scene["blocks"][3]["entries"]]
        self.assertEqual(["f(x) = 2x", "f(x) = e^(x + 3)", "f(x) = x² + 3x + 4"], descriptions)

    def test_observation_bridge_does_not_equate_variable_with_probability_distribution(self) -> None:
        scene = self.document["scenes"][4]
        self.assertIn("statistical sample", scene["blocks"][1]["text"])
        self.assertIn("x_1=2.55", scene["blocks"][2]["expression"])
        self.assertEqual(3, len(scene["blocks"][3]["nodes"]))
        note = scene["blocks"][4]["text"]
        self.assertIn("Only when a stochastic model", note)
        self.assertIn("not a probability distribution", note)
        self.assertIn("later", note)

    def test_minimal_webr_demo_is_one_read_only_random_draw(self) -> None:
        scene = self.document["scenes"][5]
        code = scene["blocks"][2]
        self.assertEqual("r", code["language"])
        self.assertFalse(code["editable"])
        self.assertTrue(code["executable"])
        self.assertEqual("rnorm(1, mean = 3.0, sd = 0.2)", code["code"])

    def test_constant_definition_and_uvvis_example_resolve_assigned_vs_random_conflict(self) -> None:
        constant = self.document["scenes"][6]
        self.assertEqual("Constant", constant["blocks"][0]["text"])
        self.assertIn("treated as fixed", constant["blocks"][1]["text"])

        uvvis = self.document["scenes"][7]
        self.assertIn("without being a random variable", uvvis["blocks"][1]["text"])
        self.assertEqual(5, len(uvvis["blocks"][2]["rows"]))
        self.assertEqual("line", uvvis["blocks"][3]["chartType"])
        self.assertEqual(3, len(uvvis["blocks"][4]["items"]))

    def test_final_quiz_has_three_role_questions_and_three_ordered_options(self) -> None:
        scene = self.document["scenes"][8]
        prompts = scene["blocks"][1:]
        self.assertEqual(3, len(prompts))
        expected_options = ["Assigned variable", "Random variable", "Constant"]
        for prompt in prompts:
            with self.subTest(prompt=prompt["id"]):
                self.assertEqual("single-choice", prompt["responseMode"])
                self.assertEqual(expected_options, prompt["options"])

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
