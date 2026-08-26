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
LEARNING_PATH = URIRef(f"{CD}LearningPath")
HAS_STEP = URIRef(f"{CD}hasStep")
POSITION = URIRef(f"{CD}position")
USES_SCENE = URIRef(f"{CD}usesScene")
LATEX = URIRef(f"{CD}latex")
CODE = URIRef(f"{CD}code")
PATH = URIRef(f"{EX}path-standard-deviation")
STEP_1 = URIRef(f"{EX}path-step-1")
STEP_2 = URIRef(f"{EX}path-step-2")
BASIC_DEFINITION = URIRef(f"{EX}sd-definition-basic-de")
SAMPLE_FORMULA = URIRef(f"{EX}sample-sd-formula")
R_CODE_EXAMPLE = URIRef(f"{EX}sd-r-code-example")
SPECIFICATION_GRAPH = "https://w3id.org/project-chemie-digital/graph/specifications/standard-deviation"
SAMPLE_FORMULA_LATEX = r"s = \sqrt{\frac{\sum_{i=1}^{n}(x_i-\bar{x})^2}{n-1}}"
R_CODE = "x <- c(6, 8, 10)\nsd(x)"

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


def replace_position(value: Literal) -> Dataset:
    current = dataset()
    current.remove((STEP_2, POSITION, None, None))
    graph = current.graph(URIRef("https://w3id.org/project-chemie-digital/graph/paths/standard-deviation"))
    graph.add((STEP_2, POSITION, value))
    return current


class CanonicalRuntimePathResolutionTests(unittest.TestCase):
    def test_resolves_complete_canonical_path_in_authored_position_order(self) -> None:
        document = MODULE.compile_scene_document(dataset())
        self.assertEqual("ex:path-standard-deviation--scene-document", document["id"])
        self.assertEqual(EXPECTED_SCENES, [scene["id"] for scene in document["scenes"]])

    def test_preserves_semantic_resource_selection_and_relation_paths(self) -> None:
        document = MODULE.compile_scene_document(dataset())
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
        document = MODULE.compile_scene_document(dataset())
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

    def test_resolves_executable_r_code_as_renderer_neutral_code_block(self) -> None:
        document = MODULE.compile_scene_document(dataset())
        exercise_scene = document["scenes"][8]
        self.assertEqual(4, len(exercise_scene["blocks"]))
        code_block = exercise_scene["blocks"][3]
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

    def test_static_fallback_keeps_math_and_code_readable_without_javascript(self) -> None:
        artifact = MODULE.build_artifact()
        fallback = MODULE.static_fallback(artifact)
        self.assertIn('class="math-fallback"', fallback)
        self.assertIn('role="math"', fallback)
        self.assertIn("Mathematische Formel für Standardabweichung", fallback)
        self.assertIn("\\sqrt", fallback)
        self.assertIn('class="code-fallback"', fallback)
        self.assertIn('data-language="r"', fallback)
        self.assertIn("x &lt;- c(6, 8, 10)", fallback)
        self.assertIn("sd(x)", fallback)

    def test_fails_closed_when_selected_formula_has_no_latex(self) -> None:
        current = dataset()
        current.remove((SAMPLE_FORMULA, LATEX, None, None))
        with self.assertRaisesRegex(ValueError, "Missing cd:latex for ex:sample-sd-formula"):
            MODULE.compile_scene_document(current)

    def test_fails_closed_when_executable_code_resource_has_no_code(self) -> None:
        current = dataset()
        current.remove((R_CODE_EXAMPLE, CODE, None, None))
        with self.assertRaisesRegex(ValueError, "Incomplete executable code resource ex:sd-r-code-example"):
            MODULE.compile_scene_document(current)

    def test_fails_when_the_canonical_learning_path_is_missing(self) -> None:
        current = dataset()
        current.remove((PATH, RDF.type, LEARNING_PATH, None))
        with self.assertRaisesRegex(ValueError, "Expected exactly one canonical LearningPath, got 0"):
            MODULE.compile_scene_document(current)

    def test_fails_when_a_referenced_path_step_is_missing(self) -> None:
        current = dataset()
        current.remove((STEP_1, None, None, None))
        with self.assertRaisesRegex(ValueError, "Missing cd:position for ex:path-step-1"):
            MODULE.compile_scene_document(current)

    def test_fails_when_a_referenced_scene_is_missing(self) -> None:
        current = dataset()
        current.remove((STEP_1, USES_SCENE, None, None))
        with self.assertRaisesRegex(ValueError, "Missing cd:usesScene for ex:path-step-1"):
            MODULE.compile_scene_document(current)

    def test_fails_when_a_selected_resource_is_missing(self) -> None:
        current = dataset()
        current.remove((BASIC_DEFINITION, None, None, None))
        with self.assertRaisesRegex(ValueError, "No audience-visible value for ex:sd-definition-basic-de"):
            MODULE.compile_scene_document(current)

    def test_rejects_duplicate_positions_deterministically(self) -> None:
        with self.assertRaisesRegex(ValueError, "Path positions must be unique and contiguous"):
            MODULE.compile_scene_document(replace_position(Literal(1, datatype=XSD.integer)))

    def test_rejects_non_integer_positions(self) -> None:
        with self.assertRaisesRegex(ValueError, "Invalid integer cd:position for ex:path-step-2"):
            MODULE.compile_scene_document(replace_position(Literal("1.5", datatype=XSD.decimal)))

    def test_rejects_non_positive_positions(self) -> None:
        with self.assertRaisesRegex(ValueError, "Position must be positive for ex:path-step-2"):
            MODULE.compile_scene_document(replace_position(Literal(0, datatype=XSD.integer)))


if __name__ == "__main__":
    unittest.main()
