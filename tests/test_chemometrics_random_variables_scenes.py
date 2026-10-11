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
    "scene-chemometrics-variables-title",
    "scene-chemometrics-variable-definition",
    "scene-chemometrics-variables-values-observations",
    "scene-chemometrics-why-values-differ",
    "scene-chemometrics-controlled-calibration",
    "scene-chemometrics-context-roles",
    "scene-chemometrics-variable-classification",
    "scene-chemometrics-empirical-probability",
    "scene-chemometrics-variables-checkpoint",
]

EXPECTED_BLOCK_KINDS = [
    ["prose"],
    ["prose", "prose", "prose"],
    ["prose", "prose", "table", "chart", "list"],
    ["prose", "prose", "definition-list", "prose"],
    ["prose", "prose", "math", "chart", "prose"],
    ["prose", "prose", "definition-list", "prose"],
    ["prose", "prose", "definition-list", "prose"],
    ["prose", "prose", "definition-list", "chart", "prose"],
    ["prose", "prompt", "prompt", "prompt"],
]


class ChemometricsVariablesSceneTests(unittest.TestCase):
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

    def test_level_opens_with_general_variable_definition_not_randomness(self) -> None:
        self.assertEqual(["Variables"], [b["text"] for b in self.document["scenes"][0]["blocks"]])
        variable = self.document["scenes"][1]
        self.assertEqual("Variable", variable["blocks"][0]["text"])
        definition = variable["blocks"][1]["text"]
        self.assertIn("can take different values", definition)
        self.assertIn("observed, measured, assigned or controlled", definition)
        self.assertNotIn("probability distribution", definition.lower())

    def test_calibration_dataset_maps_columns_rows_cells_and_plot_points(self) -> None:
        scene = self.document["scenes"][2]
        self.assertIn("observational unit", scene["blocks"][1]["text"])
        table = scene["blocks"][2]
        chart = scene["blocks"][3]
        mapping = [item["text"] for item in scene["blocks"][4]["items"]]
        self.assertEqual(5, len(table["rows"]))
        self.assertEqual("line", chart["chartType"])
        self.assertIn("COLUMN", mapping[0])
        self.assertIn("ROW", mapping[1])
        self.assertIn("CELL", mapping[2])
        self.assertIn("PLOT POINT", mapping[3])

    def test_variability_randomness_and_uncertainty_are_not_synonyms(self) -> None:
        scene = self.document["scenes"][3]
        entries = scene["blocks"][2]["entries"]
        self.assertEqual(["VARIABILITY", "RANDOMNESS", "UNCERTAINTY"], [entry["term"] for entry in entries])
        self.assertIn("descriptive statement", entries[0]["description"])
        self.assertIn("chosen model", entries[1]["description"])
        self.assertIn("not identical to observed random scatter", entries[2]["description"])

    def test_controlled_calibration_keeps_design_points_fixed_in_model(self) -> None:
        scene = self.document["scenes"][4]
        self.assertIn("choose the concentration levels", scene["blocks"][1]["text"])
        expression = scene["blocks"][2]["expression"]
        self.assertIn("A_i", expression)
        self.assertIn("beta_0", expression)
        self.assertIn("mathcal{N}", expression)
        assumption = scene["blocks"][4]["text"]
        self.assertIn("simplifying assumption", assumption)
        self.assertIn("does not imply", assumption)

    def test_same_concentration_is_shown_in_four_context_dependent_roles(self) -> None:
        scene = self.document["scenes"][5]
        entries = scene["blocks"][2]["entries"]
        self.assertEqual(
            ["CALIBRATION STANDARD", "ANALYTICAL RESULT", "ENVIRONMENTAL SAMPLING", "DESIGN OF EXPERIMENTS"],
            [entry["term"] for entry in entries],
        )
        descriptions = " ".join(entry["description"] for entry in entries)
        self.assertIn("controlled design value", descriptions)
        self.assertIn("measurement uncertainty", descriptions)
        self.assertIn("random variable", descriptions)
        self.assertIn("experimental factor", descriptions)

    def test_variable_classifications_are_presented_as_independent_questions(self) -> None:
        scene = self.document["scenes"][6]
        self.assertIn("several independent questions", scene["blocks"][1]["text"])
        terms = [entry["term"] for entry in scene["blocks"][2]["entries"]]
        self.assertEqual(
            ["QUALITATIVE vs QUANTITATIVE", "NOMINAL vs ORDINAL", "DISCRETE vs CONTINUOUS", "METRIC SCALE"],
            terms,
        )
        self.assertIn("do not tell us whether", scene["blocks"][3]["text"])

    def test_empirical_frequency_is_not_promoted_to_probability_distribution(self) -> None:
        scene = self.document["scenes"][7]
        self.assertIn("deliberately assigned", scene["blocks"][1]["text"])
        entries = scene["blocks"][2]["entries"]
        self.assertEqual(["EMPIRICAL FREQUENCY", "SAMPLING MECHANISM", "PROBABILITY MODEL"], [entry["term"] for entry in entries])
        chart = scene["blocks"][3]
        self.assertEqual("bar", chart["chartType"])
        self.assertEqual([2.0] * 5, [datum["value"] for datum in chart["data"]])
        self.assertIn("not a population probability distribution", chart["description"])
        self.assertIn("stochastic model", scene["blocks"][4]["text"])

    def test_checkpoint_tests_role_generation_and_distribution_distinctions(self) -> None:
        prompts = self.document["scenes"][8]["blocks"][1:]
        self.assertEqual(3, len(prompts))
        for prompt in prompts:
            self.assertEqual("single-choice", prompt["responseMode"])
            self.assertTrue(prompt["correctOptionId"])
            self.assertTrue(prompt["expectedResult"])
        self.assertIn("assigned design points", prompts[0]["expectedResult"])
        self.assertIn("observed values vary", prompts[1]["expectedResult"])
        self.assertIn("does not by itself define a probability distribution", prompts[2]["expectedResult"])

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
