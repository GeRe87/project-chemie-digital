from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import RDF, XSD, Dataset, Literal, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

SPEC = importlib.util.spec_from_file_location(
    "generate_canonical_runtime",
    SCRIPTS / "generate_canonical_runtime.py",
)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
GRAPH = "https://w3id.org/project-chemie-digital/graph/"
LEARNING_PATH = URIRef(f"{CD}LearningPath")
FOR_LEARNING_UNIT = URIRef(f"{CD}forLearningUnit")
POSITION = URIRef(f"{CD}position")
USES_SCENE = URIRef(f"{CD}usesScene")
LATEX = URIRef(f"{CD}latex")
CODE = URIRef(f"{CD}code")
HAS_POLL_OPTION = URIRef(f"{CD}hasPollOption")
PATH = URIRef(f"{EX}path-standard-deviation")
PATH_GRAPH = f"{GRAPH}paths/standard-deviation"
UNIT = URIRef(f"{EX}learning-unit-standard-deviation")
STEP_1 = URIRef(f"{EX}path-step-1")
STEP_2 = URIRef(f"{EX}path-step-2")
BASIC_DEFINITION = URIRef(f"{EX}sd-definition-basic-de")
SAMPLE_FORMULA = URIRef(f"{EX}sample-sd-formula")
R_CODE_EXAMPLE = URIRef(f"{EX}sd-r-code-example")
POLL = URIRef(f"{EX}sd-precision-poll")
POLL_OPTION_B = URIRef(f"{EX}sd-precision-option-b")
SPECIFICATION_GRAPH = f"{GRAPH}specifications/standard-deviation"
SAMPLE_FORMULA_LATEX = r"s = \sqrt{\frac{\sum_{i=1}^{n}(x_i-\bar{x})^2}{n-1}}"
R_CODE = "x <- c(6, 8, 10)\nsd(x)"
POLL_TEXT = "Messreihe A: 9, 10, 11. Messreihe B: 6, 8, 10. Welche Messreihe ist präziser?"

EXPECTED_SCENES = [
    "ex:scene-sd-definition--scene",
    "ex:scene-sd-process--scene",
    "ex:scene-sample-population--scene",
    "ex:scene-formula-symbols--scene",
    "ex:scene-unit-interpretation--scene",
    "ex:scene-precision-trueness--scene",
    "ex:scene-dispersion-comparison--scene",
    "ex:scene-chemistry-example--scene",
    "ex:scene-exercise-recap--scene",
]


def dataset() -> Dataset:
    return MODULE.assemble_dataset()


def selected_path() -> object:
    return MODULE.CoursePathReference(str(PATH), PATH_GRAPH)


def replace_position(value: Literal) -> Dataset:
    current = dataset()
    current.remove((STEP_2, POSITION, None, None))
    graph = current.graph(URIRef(PATH_GRAPH))
    graph.add((STEP_2, POSITION, value))
    return current


class CanonicalRuntimePathResolutionTests(unittest.TestCase):
    def test_resolves_complete_canonical_path_in_authored_position_order(self) -> None:
        document = MODULE.compile_scene_document(dataset(), selected_path())
        self.assertEqual("ex:path-standard-deviation--scene-document", document["id"])
        self.assertEqual(EXPECTED_SCENES, [scene["id"] for scene in document["scenes"]])

    def test_preserves_semantic_resource_selection_and_relation_paths(self) -> None:
        document = MODULE.compile_scene_document(dataset(), selected_path())
        selected = [
            (
                scene["blocks"][1]["source"][0]["resourceId"],
                scene["blocks"][1]["source"][0]["relationPath"],
            )
            for scene in document["scenes"]
        ]
        self.assertEqual(
            [
                ("ex:sd-definition-basic-de", "cd:hasDefinition"),
                ("ex:worked-example-repeated-ph", "cd:hasDefinition"),
                ("ex:def-population-standard-deviation", "cd:hasDefinition"),
                ("ex:sample-sd-formula", "cd:hasDefinition"),
                ("ex:sd-unit-rule", "cd:hasDefinition"),
                ("ex:correction-sd-accuracy", "cd:hasDefinition"),
                ("ex:comparison-dispersion-measures", "cd:hasDefinition"),
                ("ex:worked-example-repeated-ph", "cd:hasDefinition"),
                ("ex:exercise-calculate-s", "cd:hasDefinition"),
            ],
            selected,
        )

    def test_resolves_formula_as_math_block_from_canonical_latex_with_provenance(self) -> None:
        document = MODULE.compile_scene_document(dataset(), selected_path())
        formula_block = document["scenes"][3]["blocks"][1]
        self.assertEqual("math", formula_block["kind"])
        self.assertEqual(SAMPLE_FORMULA_LATEX, formula_block["expression"])
        self.assertEqual("Mathematische Formel für Standardabweichung", formula_block["spokenText"])
        self.assertEqual(
            {
                "resourceId": "ex:sample-sd-formula",
                "provenanceIds": [SPECIFICATION_GRAPH],
                "relationPath": "cd:hasDefinition",
            },
            formula_block["source"][0],
        )

    def test_resolves_audience_poll_as_renderer_neutral_prompt_block(self) -> None:
        document = MODULE.compile_scene_document(dataset(), selected_path())
        exercise_scene = document["scenes"][8]
        self.assertEqual(5, len(exercise_scene["blocks"]))
        poll_block = exercise_scene["blocks"][3]
        self.assertEqual("prompt", poll_block["kind"])
        self.assertEqual(POLL_TEXT, poll_block["prompt"])
        self.assertEqual("single-choice", poll_block["responseMode"])
        self.assertEqual(["Messreihe A", "Messreihe B"], poll_block["options"])
        self.assertEqual({"kind": "practice"}, poll_block["intent"])
        self.assertEqual(
            [
                {
                    "resourceId": "ex:sd-precision-poll",
                    "provenanceIds": [SPECIFICATION_GRAPH],
                    "relationPath": "cd:hasAudiencePoll",
                },
                {
                    "resourceId": "ex:sd-precision-option-a",
                    "provenanceIds": [SPECIFICATION_GRAPH],
                    "relationPath": "cd:hasPollOption",
                },
                {
                    "resourceId": "ex:sd-precision-option-b",
                    "provenanceIds": [SPECIFICATION_GRAPH],
                    "relationPath": "cd:hasPollOption",
                },
            ],
            poll_block["source"],
        )

    def test_resolves_executable_r_code_as_renderer_neutral_code_block(self) -> None:
        document = MODULE.compile_scene_document(dataset(), selected_path())
        exercise_scene = document["scenes"][8]
        self.assertEqual(5, len(exercise_scene["blocks"]))
        code_block = exercise_scene["blocks"][4]
        self.assertEqual("code", code_block["kind"])
        self.assertEqual("r", code_block["language"])
        self.assertEqual(R_CODE, code_block["code"])
        self.assertEqual(R_CODE, code_block["fallback"])
        self.assertTrue(code_block["editable"])
        self.assertTrue(code_block["executable"])
        self.assertEqual({"kind": "practice"}, code_block["intent"])
        self.assertEqual(
            {
                "resourceId": "ex:sd-r-code-example",
                "provenanceIds": [SPECIFICATION_GRAPH],
                "relationPath": "cd:hasCodeExample",
            },
            code_block["source"][0],
        )

    def test_static_fallback_keeps_math_poll_and_code_readable_without_javascript(self) -> None:
        artifact = MODULE.build_artifact()
        fallback = MODULE.static_fallback(artifact)
        self.assertIn('class="math-fallback"', fallback)
        self.assertIn('role="math"', fallback)
        self.assertIn("Mathematische Formel für Standardabweichung", fallback)
        self.assertIn("\\sqrt", fallback)
        self.assertIn('class="poll-fallback"', fallback)
        self.assertIn('data-poll-key="ex:sd-precision-poll"', fallback)
        self.assertIn("Welche Messreihe ist präziser?", fallback)
        self.assertIn("Messreihe A", fallback)
        self.assertIn("Messreihe B", fallback)
        self.assertIn('class="code-fallback"', fallback)
        self.assertIn('data-language="r"', fallback)
        self.assertIn("x &lt;- c(6, 8, 10)", fallback)
        self.assertIn("sd(x)", fallback)

    def test_unrelated_second_learning_path_does_not_break_explicit_selected_path(self) -> None:
        current = dataset()
        unrelated_path = URIRef(f"{EX}path-unrelated")
        unrelated_graph = current.graph(URIRef(f"{GRAPH}paths/unrelated"))
        unrelated_graph.add((unrelated_path, RDF.type, LEARNING_PATH))
        unrelated_graph.add((unrelated_path, FOR_LEARNING_UNIT, URIRef(f"{EX}learning-unit-unrelated")))
        document = MODULE.compile_scene_document(current, selected_path())
        self.assertEqual("ex:path-standard-deviation", document["sourcePathId"])

    def test_unresolvable_second_path_for_same_unit_does_not_break_exact_selection(self) -> None:
        current = dataset()
        second_path = URIRef(f"{EX}path-standard-deviation-review")
        second_graph_id = f"{GRAPH}paths/standard-deviation-review"
        second_graph = current.graph(URIRef(second_graph_id))
        second_graph.add((second_path, RDF.type, LEARNING_PATH))
        second_graph.add((second_path, FOR_LEARNING_UNIT, UNIT))
        selection = MODULE.select_course_unit_path(
            current,
            MODULE.CourseUnitPathSelectionRequest(
                offering_id=MODULE.DEFAULT_OFFERING_ID,
                placement_id=MODULE.DEFAULT_PLACEMENT_ID,
                unit_id=MODULE.DEFAULT_UNIT_ID,
                requested_path_id=str(PATH),
                requested_path_graph_id=PATH_GRAPH,
            ),
        )
        document = MODULE.compile_scene_document(current, selection.path)
        self.assertEqual("ex:path-standard-deviation", document["sourcePathId"])

    def test_fails_closed_when_selected_formula_has_no_latex(self) -> None:
        current = dataset()
        current.remove((SAMPLE_FORMULA, LATEX, None, None))
        with self.assertRaisesRegex(ValueError, "Missing cd:latex for ex:sample-sd-formula"):
            MODULE.compile_scene_document(current, selected_path())

    def test_fails_closed_when_executable_code_resource_has_no_code(self) -> None:
        current = dataset()
        current.remove((R_CODE_EXAMPLE, CODE, None, None))
        with self.assertRaisesRegex(ValueError, "Incomplete executable code resource ex:sd-r-code-example"):
            MODULE.compile_scene_document(current, selected_path())

    def test_fails_closed_when_audience_poll_has_fewer_than_two_options(self) -> None:
        current = dataset()
        current.remove((POLL, HAS_POLL_OPTION, POLL_OPTION_B, None))
        with self.assertRaisesRegex(ValueError, "requires at least two options"):
            MODULE.compile_scene_document(current, selected_path())

    def test_fails_when_selected_learning_path_is_not_defined_in_expected_graph(self) -> None:
        current = dataset()
        current.remove((PATH, RDF.type, LEARNING_PATH, URIRef(PATH_GRAPH)))
        with self.assertRaisesRegex(ValueError, "Selected LearningPath ex:path-standard-deviation is not defined in expected graph"):
            MODULE.compile_scene_document(current, selected_path())

    def test_fails_when_a_referenced_path_step_is_missing(self) -> None:
        current = dataset()
        current.remove((STEP_1, None, None, None))
        with self.assertRaisesRegex(ValueError, "Missing cd:position for ex:path-step-1"):
            MODULE.compile_scene_document(current, selected_path())

    def test_fails_when_a_referenced_scene_is_missing(self) -> None:
        current = dataset()
        current.remove((STEP_1, USES_SCENE, None, None))
        with self.assertRaisesRegex(ValueError, "Missing cd:usesScene for ex:path-step-1"):
            MODULE.compile_scene_document(current, selected_path())

    def test_fails_when_a_selected_resource_is_missing(self) -> None:
        current = dataset()
        current.remove((BASIC_DEFINITION, None, None, None))
        with self.assertRaisesRegex(ValueError, "No audience-visible value for ex:sd-definition-basic-de"):
            MODULE.compile_scene_document(current, selected_path())

    def test_rejects_duplicate_positions_deterministically(self) -> None:
        with self.assertRaisesRegex(ValueError, "Path positions must be unique and contiguous"):
            MODULE.compile_scene_document(replace_position(Literal(1, datatype=XSD.integer)), selected_path())

    def test_rejects_non_integer_positions(self) -> None:
        with self.assertRaisesRegex(ValueError, "Invalid integer cd:position for ex:path-step-2"):
            MODULE.compile_scene_document(replace_position(Literal("1.5", datatype=XSD.decimal)), selected_path())

    def test_rejects_non_positive_positions(self) -> None:
        with self.assertRaisesRegex(ValueError, "Position must be positive for ex:path-step-2"):
            MODULE.compile_scene_document(replace_position(Literal(0, datatype=XSD.integer)), selected_path())


if __name__ == "__main__":
    unittest.main()
