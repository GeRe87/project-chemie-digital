from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, URIRef

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
    "scene-chemometrics-lake-sampling-replicates",
    "scene-chemometrics-why-values-differ",
    "scene-chemometrics-variation-sources",
    "scene-chemometrics-additive-response-model",
    "scene-chemometrics-general-additive-model",
    "scene-chemometrics-model-function-families",
    "scene-chemometrics-variable-value-shapes",
    "scene-chemometrics-variable-value-types",
    "scene-chemometrics-controlled-calibration",
    "scene-chemometrics-context-roles",
    "scene-chemometrics-variable-classification",
    "scene-chemometrics-empirical-probability",
    "scene-chemometrics-variables-checkpoint",
]

EXPECTED_BLOCK_KINDS = [
    ["prose"],
    ["prose", "prose", "prose"],
    ["prose", "media-reference", "prose", "table", "chart"],
    ["prose", "media-reference", "prose", "table", "chart"],
    ["prose", "definition-list", "prose"],
    ["prose", "diagram"],
    ["prose", "math", "definition-list"],
    ["prose", "math", "definition-list"],
    ["prose", "diagram"],
    ["prose", "prose", "definition-list", "math", "definition-list", "math", "definition-list", "math"],
    ["prose", "prose", "definition-list", "math", "definition-list", "math", "definition-list", "math"],
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
        # Exercise retained scene resources separately without reactivating them
        # in the authored presentation path or weakening their content checks.
        retained_dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        path_graph = retained_dataset.graph(PATH_GRAPH)
        path_graph.remove((PATH, CD.hasStep, None))
        retained_scene_graph = retained_dataset.graph(SCENE_GRAPH)
        for position, name in enumerate(EXPECTED_SCENES[11:], start=1):
            step, scene = EX[f"test-retained-step-{position}"], EX[name]
            path_graph.add((PATH, CD.hasStep, step))
            path_graph.add((step, RDF.type, CD.PathStep))
            path_graph.add((step, CD.position, Literal(position)))
            path_graph.add((step, CD.usesScene, scene))
            for item in retained_scene_graph.objects(scene, CD.hasSceneItem):
                for resource in retained_scene_graph.objects(item, CD.selectsResource):
                    path_graph.add((step, CD.usesResource, resource))
        cls.retained_scenes = RUNTIME.compile_scene_document(
            retained_dataset, RUNTIME.CoursePathReference(str(PATH), str(PATH_GRAPH)),
        )["scenes"]

    def test_scene_graph_has_exactly_sixteen_authored_scenes(self) -> None:
        scenes = set(self.scene_graph.subjects(RDF.type, CD.SceneDefinition))
        self.assertEqual({EX[name] for name in EXPECTED_SCENES}, scenes)

    def test_compiled_scene_document_preserves_exact_narrative_order(self) -> None:
        self.assertEqual("ex:path-chemometrics-random-variables-lecture", self.document["sourcePathId"])
        self.assertEqual(
            [f"ex:{name}--scene" for name in EXPECTED_SCENES[:11]],
            [scene["id"] for scene in self.document["scenes"]],
        )
        self.assertEqual(
            EXPECTED_BLOCK_KINDS[:11],
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

    def test_calibration_dataset_is_compact_two_column_evidence(self) -> None:
        scene = self.document["scenes"][2]
        media = scene["blocks"][1]
        self.assertEqual("media-reference", media["kind"])
        self.assertEqual("/chemometrics/uvvis-dilution-series.svg", media["uri"])
        self.assertEqual("image/svg+xml", media["mediaType"])
        self.assertIn("Five volumetric flasks", media["alternativeText"])

        intro = scene["blocks"][2]["text"]
        self.assertIn("prepare five calibration standards", intro)
        self.assertIn("Each row is one observation", intro)
        self.assertIn("each cell contains one variable value", intro)
        self.assertIn("plot shows the same", intro)

        table = scene["blocks"][3]
        self.assertEqual(
            ["Concentration (mg/L)", "Absorbance"],
            [column["label"] for column in table["columns"]],
        )
        self.assertEqual(5, len(table["rows"]))
        self.assertTrue(all(len(row["cells"]) == 2 for row in table["rows"]))
        self.assertNotIn("Wavelength", " ".join(column["label"] for column in table["columns"]))

        chart = scene["blocks"][4]
        self.assertEqual("line", chart["chartType"])
        self.assertEqual("Assigned concentration", chart["xAxis"]["label"])
        self.assertEqual("Absorbance", chart["yAxis"]["label"])

    def test_lake_sampling_scene_groups_five_sites_with_three_replicates_each(self) -> None:
        scene = self.document["scenes"][3]
        self.assertEqual("Sampling locations and replicates", scene["blocks"][0]["text"])

        media = scene["blocks"][1]
        self.assertEqual("media-reference", media["kind"])
        self.assertEqual("/chemometrics/lake-sampling-sites.svg", media["uri"])
        self.assertEqual("image/svg+xml", media["mediaType"])
        self.assertIn("five labeled sampling locations", media["alternativeText"])

        intro = scene["blocks"][2]["text"]
        self.assertIn("five locations", intro)
        self.assertIn("three replicate samples", intro)
        self.assertIn("All 15 samples", intro)
        self.assertIn("approximately the same concentration", intro)

        table = scene["blocks"][3]
        self.assertEqual(
            ["Sampling site", "Replicate 1", "Replicate 2", "Replicate 3"],
            [column["label"] for column in table["columns"]],
        )
        self.assertEqual(5, len(table["rows"]))
        self.assertTrue(all(len(row["cells"]) == 4 for row in table["rows"]))

        chart = scene["blocks"][4]
        self.assertEqual("bar", chart["chartType"])
        self.assertEqual("Sampling site", chart["xAxis"]["label"])
        self.assertEqual("mg/L", chart["yAxis"]["unit"])
        self.assertEqual(15, len(chart["data"]))
        self.assertEqual(
            ["Site 1", "Site 2", "Site 3", "Site 4", "Site 5"],
            list(dict.fromkeys(datum["group"] for datum in chart["data"])),
        )
        for site in ("Site 1", "Site 2", "Site 3", "Site 4", "Site 5"):
            site_data = [datum for datum in chart["data"] if datum["group"] == site]
            self.assertEqual(3, len(site_data))
            self.assertEqual(
                ["Replicate 1", "Replicate 2", "Replicate 3"],
                [datum["category"] for datum in site_data],
            )

    def test_why_values_differ_contrasts_assigned_and_observed_variation(self) -> None:
        scene = self.document["scenes"][4]
        self.assertEqual("Why do values differ?", scene["blocks"][0]["text"])
        self.assertEqual(["prose", "definition-list", "prose"], [block["kind"] for block in scene["blocks"]])
        self.assertFalse(any(
            "The same quantity can take different values" in str(block) for block in scene["blocks"]
        ))
        entries = scene["blocks"][1]["entries"]
        self.assertEqual(
            ["DESIGNED VARIATION", "OBSERVED VARIATION"],
            [entry["term"] for entry in entries],
        )
        self.assertIn("deliberately choose", entries[0]["description"])
        self.assertIn("\n|> Calibration standards:", entries[0]["description"])
        self.assertIn("absorbance is measured", entries[0]["description"])
        self.assertIn("\n|> Lake samples:", entries[1]["description"])
        self.assertIn("environment, sampling and measurement", entries[1]["description"])
        self.assertEqual(
            ["calibration-flasks", "sampling-lake"],
            [entry["visualMotif"] for entry in entries],
        )
        self.assertIn("A variable's role depends", scene["blocks"][2]["text"])

    def test_process_sources_slide_precedes_equation(self) -> None:
        scene = self.document["scenes"][5]
        self.assertEqual("Observed variation has multiple sources", scene["blocks"][0]["text"])
        diagram = scene["blocks"][1]
        self.assertEqual("diagram", diagram["kind"])
        self.assertEqual("flow", diagram["diagramType"])
        self.assertEqual(
            ["input", "process", "output", "influences", "residual"],
            [node["visualRole"] for node in diagram["nodes"]],
        )
        self.assertEqual(4, len(diagram["edges"]))
        self.assertEqual(
            ["cᵢ", None, "Aᵢ", None, "εᵢ"],
            [node.get("notation") for node in diagram["nodes"]],
        )
        self.assertEqual(
            ["We choose the nominal concentration.", "We measure the absorbance."],
            [diagram["nodes"][0]["description"], diagram["nodes"][2]["description"]],
        )
        self.assertTrue(
            all(
                any(ref.get("relationPath") == "skos:notation" for ref in node["source"])
                for node in (diagram["nodes"][0], diagram["nodes"][2], diagram["nodes"][4])
            )
        )
        self.assertEqual("Chemical and analytical process", diagram["nodes"][1]["description"])
        self.assertNotIn("notation", diagram["nodes"][1])
        parts = diagram["nodes"][3]["parts"]
        self.assertEqual(
            ["PREPARATION", "CONDITIONS", "MEASUREMENT"],
            [part["label"] for part in parts],
        )
        self.assertTrue(all(part["source"] for part in parts))

    def test_response_equation_and_three_term_legend_are_separate(self) -> None:
        scene = self.document["scenes"][6]
        self.assertEqual("Describing the observed response", scene["blocks"][0]["text"])
        self.assertEqual(r"A_i = f(c_i) + \varepsilon_i", scene["blocks"][1]["expression"])
        entries = scene["blocks"][2]["entries"]
        self.assertEqual(["Aᵢ", "f(cᵢ)", "εᵢ"], [entry["term"] for entry in entries])
        self.assertIn("Observed absorbance", entries[0]["description"])
        self.assertIn("chosen concentration", entries[1]["description"])
        self.assertIn("not explained", entries[2]["description"])

    def test_general_formula_follows_uvvis_equation_without_adding_distribution_assumptions(self) -> None:
        scene = self.document["scenes"][7]
        self.assertEqual("From the example to a general model", scene["blocks"][0]["text"])
        self.assertEqual(r"y_i = f(x_i) + \varepsilon_i", scene["blocks"][1]["expression"])
        entries = scene["blocks"][2]["entries"]
        self.assertEqual(["yᵢ", "f(xᵢ)", "εᵢ"], [entry["term"] for entry in entries])
        self.assertIn("Observed response", entries[0]["description"])
        self.assertIn("explanatory input", entries[1]["description"])
        self.assertIn("unmodelled influences", entries[2]["description"])

    def test_model_function_families_have_five_svg_thumbnails_and_an_open_other_branch(self) -> None:
        scene = self.document["scenes"][8]
        self.assertEqual("What can f(xᵢ) be?", scene["blocks"][0]["text"])
        diagram = scene["blocks"][1]
        self.assertEqual("diagram", diagram["kind"])
        self.assertEqual("flow", diagram["diagramType"])
        self.assertEqual(6, len(diagram["nodes"]))
        self.assertEqual(5, len(diagram["edges"]))
        root = diagram["nodes"][0]
        self.assertEqual("hierarchy-root", root["visualRole"])
        self.assertEqual("f(xᵢ)", root["notation"])
        self.assertTrue(all(edge["sourceNodeId"] == root["id"] for edge in diagram["edges"]))
        children = diagram["nodes"][1:]
        self.assertEqual(
            ["LINEAR MODELS", "NONLINEAR MODELS", "MULTIVARIATE MODELS", "MACHINE LEARNING", "OTHERS"],
            [node["label"] for node in children],
        )
        self.assertEqual(
            ["regression", "nonlinear-curve", "multiple-inputs", "neural-network", "other-models"],
            [node["visualMotif"] for node in children],
        )
        self.assertEqual(["highlight"] * 5, [node["visualMotifRole"] for node in children])
        self.assertEqual("hierarchy-other", children[4]["visualRole"])
        self.assertEqual(2, len(scene["blocks"]), "Only the heading and diagram belong on this slide")
        content_graph = self.dataset.graph(URIRef(
            "https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-basics"
        ))
        definition = str(content_graph.value(EX["def-model-function-families"], CD.body))
        self.assertIn("overlapping", definition)

    def test_value_shapes_follow_model_families_with_three_numeric_math_cards(self) -> None:
        scene = self.document["scenes"][9]
        self.assertEqual("ex:scene-chemometrics-variable-value-shapes--scene", scene["id"])
        self.assertEqual("Scalars, vectors and matrices", scene["blocks"][0]["text"])
        self.assertIn("Illustrative", scene["blocks"][1]["text"])
        self.assertIn("mg/L", scene["blocks"][1]["text"])
        for index, name in enumerate(["scalar", "vector", "matrix"]):
            card, formula = scene["blocks"][2 + index * 2:4 + index * 2]
            self.assertEqual(name.upper(), card["entries"][0]["term"])
            self.assertEqual("math", formula["kind"])
            self.assertIn("2.55", formula["expression"])
            self.assertIn("milligrams per litre", formula["spokenText"])
            self.assertEqual(
                {"cd:latex", "cd:body"},
                {source["relationPath"] for source in formula["source"]},
            )
            self.assertTrue(all(source["resourceId"] == f"ex:value-shape-{name}-formula" for source in formula["source"]))
        vector, matrix = scene["blocks"][5], scene["blocks"][7]
        self.assertIn(r"\vec{x}", vector["expression"])
        self.assertIn(r"\mathbf{X}", matrix["expression"])
        self.assertIn(r"3\times2", matrix["expression"])
        for nitrate in ["2.55", "3.14", "4.20"]:
            self.assertIn(nitrate, vector["expression"])
            self.assertIn(nitrate + " & ", matrix["expression"])
        self.assertIn("Rows: samples A, B, C", scene["blocks"][6]["entries"][0]["description"])
        self.assertIn("Columns: nitrate, phosphate", scene["blocks"][6]["entries"][0]["description"])
        self.assertEqual(8, len(scene["blocks"]), "No generic footer is selected")

    def test_value_types_follow_value_shapes_using_the_same_infocard_structure(self) -> None:
        scene = self.document["scenes"][10]
        self.assertEqual("ex:scene-chemometrics-variable-value-types--scene", scene["id"])
        self.assertEqual("Types of variable values", scene["blocks"][0]["text"])
        self.assertIn("not the shape", scene["blocks"][1]["text"])
        self.assertEqual(
            [block["kind"] for block in self.document["scenes"][9]["blocks"]],
            [block["kind"] for block in scene["blocks"]],
        )
        for index, name in enumerate(["numbers", "categories", "boolean"]):
            card, formula = scene["blocks"][2 + index * 2:4 + index * 2]
            self.assertEqual(1, len(card["entries"]))
            self.assertEqual(name.upper(), card["entries"][0]["term"])
            self.assertEqual("math", formula["kind"])
            self.assertTrue(formula["spokenText"])
            self.assertEqual(
                {"cd:latex", "cd:body"},
                {source["relationPath"] for source in formula["source"]},
            )
            self.assertTrue(all(source["resourceId"] == f"ex:value-type-{name}-formula" for source in formula["source"]))
            for text in [card["entries"][0]["description"], formula["spokenText"]]:
                self.assertNotIn("\u2014", text)
                self.assertNotIn("\u2013", text)
        numbers = scene["blocks"][3]["expression"]
        for notation in [r"2.55 &\in \mathbb{R}", r"3 &\in \mathbb{Z}", r"2+3i &\in \mathbb{C}"]:
            self.assertIn(notation, numbers)
        categories = scene["blocks"][4]["entries"][0]["description"]
        self.assertIn("tap, lake, runoff", categories)
        self.assertIn("not amounts", categories)
        self.assertEqual(r"c=\text{lake}", scene["blocks"][5]["expression"])
        for truth_value in [r"\mathrm{true}", r"\mathrm{false}"]:
            self.assertIn(truth_value, scene["blocks"][7]["expression"])
        self.assertEqual(8, len(scene["blocks"]), "No generic footer is selected")

        graph = self.dataset.graph(URIRef(
            "https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-basics"
        ))
        definition = str(graph.value(EX["def-variable-value-types"], CD.body))
        self.assertIn("integers contained in the reals", definition)
        self.assertIn("Booleans can also be treated as a special two-category domain", definition)
        self.assertIn("integer code does not make it quantitative", definition)

    def test_controlled_calibration_keeps_design_points_fixed_in_model(self) -> None:
        scene = self.retained_scenes[0]
        self.assertIn("choose the concentration levels", scene["blocks"][1]["text"])
        expression = scene["blocks"][2]["expression"]
        self.assertIn("A_i", expression)
        self.assertIn("beta_0", expression)
        self.assertIn("mathcal{N}", expression)
        assumption = scene["blocks"][4]["text"]
        self.assertIn("simplifying assumption", assumption)
        self.assertIn("does not imply", assumption)

    def test_same_concentration_is_shown_in_four_context_dependent_roles(self) -> None:
        scene = self.retained_scenes[1]
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
        scene = self.retained_scenes[2]
        self.assertIn("several independent questions", scene["blocks"][1]["text"])
        terms = [entry["term"] for entry in scene["blocks"][2]["entries"]]
        self.assertEqual(
            ["QUALITATIVE vs QUANTITATIVE", "NOMINAL vs ORDINAL", "DISCRETE vs CONTINUOUS", "METRIC SCALE"],
            terms,
        )
        self.assertIn("do not tell us whether", scene["blocks"][3]["text"])

    def test_empirical_frequency_is_not_promoted_to_probability_distribution(self) -> None:
        scene = self.retained_scenes[3]
        self.assertIn("deliberately assigned", scene["blocks"][1]["text"])
        entries = scene["blocks"][2]["entries"]
        self.assertEqual(["EMPIRICAL FREQUENCY", "SAMPLING MECHANISM", "PROBABILITY MODEL"], [entry["term"] for entry in entries])
        chart = scene["blocks"][3]
        self.assertEqual("bar", chart["chartType"])
        self.assertEqual([2.0] * 5, [datum["value"] for datum in chart["data"]])
        self.assertIn("not a population probability distribution", chart["description"])
        self.assertIn("stochastic model", scene["blocks"][4]["text"])

    def test_checkpoint_tests_role_generation_and_distribution_distinctions(self) -> None:
        prompts = self.retained_scenes[4]["blocks"][1:]
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
