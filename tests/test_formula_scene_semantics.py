from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import RDF, SKOS, XSD, Dataset, Literal, URIRef
from rdflib.collection import Collection

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

VALIDATION_SPEC = importlib.util.spec_from_file_location(
    "validate_semantics",
    SCRIPTS / "validate_semantics.py",
)
assert VALIDATION_SPEC and VALIDATION_SPEC.loader
VALIDATION = importlib.util.module_from_spec(VALIDATION_SPEC)
VALIDATION_SPEC.loader.exec_module(VALIDATION)

RUNTIME_SPEC = importlib.util.spec_from_file_location(
    "generate_canonical_runtime_formula_tests",
    SCRIPTS / "generate_canonical_runtime.py",
)
assert RUNTIME_SPEC and RUNTIME_SPEC.loader
RUNTIME = importlib.util.module_from_spec(RUNTIME_SPEC)
RUNTIME_SPEC.loader.exec_module(RUNTIME)

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
GRAPH = "https://w3id.org/project-chemie-digital/graph/"
SH = "http://www.w3.org/ns/shacl#"

FORMULA_PATH = URIRef(f"{EX}path-formula-scene-runtime")
FORMULA_PATH_GRAPH = f"{GRAPH}paths/formula-scene-runtime"
FORMULA_RESOURCE_GRAPH = f"{GRAPH}tests/formula-scene-runtime"
FORMULA_STEP = URIRef(f"{EX}path-step-formula-scene-runtime")
FORMULA_SCENE = URIRef(f"{EX}scene-formula-scene-runtime")
FORMULA_FOCUS = URIRef(f"{EX}formula-scene-runtime-concept")
FORMULA_HEADING_ITEM = URIRef(f"{EX}formula-scene-runtime-heading")
FORMULA_BODY_ITEM = URIRef(f"{EX}formula-scene-runtime-body")
FORMULA_RESOURCE = URIRef(f"{EX}formula-scene-runtime-resource")
STANDARD_DEVIATION_PATH = URIRef(f"{EX}path-standard-deviation")
STANDARD_DEVIATION_PATH_GRAPH = f"{GRAPH}paths/standard-deviation"
RANDOM_VARIABLES_PATH = URIRef(f"{EX}path-chemometrics-random-variables-lecture")
RANDOM_VARIABLES_PATH_GRAPH = f"{GRAPH}paths/chemometrics-random-variables-lecture"
SAMPLE_FORMULA_LATEX = r"s = \sqrt{\frac{\sum_{i=1}^{n}(x_i-\bar{x})^2}{n-1}}"


def cd(local: str) -> URIRef:
    return URIRef(CD + local)


def selected_formula_path() -> object:
    return RUNTIME.CoursePathReference(str(FORMULA_PATH), FORMULA_PATH_GRAPH)


def formula_scene_dataset(
    *,
    role: str = "FormulaRole",
    resource_type: str = "MathExpression",
    selector: str = "cd:latex",
    include_latex: bool = True,
) -> Dataset:
    current = Dataset()
    path_graph = current.graph(URIRef(FORMULA_PATH_GRAPH))
    graph = current.graph(URIRef(FORMULA_RESOURCE_GRAPH))

    path_graph.add((FORMULA_PATH, RDF.type, cd("LearningPath")))
    path_graph.add((FORMULA_PATH, cd("hasStep"), FORMULA_STEP))
    path_graph.add((FORMULA_STEP, cd("position"), Literal(1, datatype=XSD.integer)))
    path_graph.add((FORMULA_STEP, cd("usesScene"), FORMULA_SCENE))

    graph.add((FORMULA_FOCUS, RDF.type, cd("Concept")))
    graph.add((FORMULA_FOCUS, SKOS.prefLabel, Literal("Formula focus", lang="en")))
    graph.add((FORMULA_FOCUS, cd("authoredResource"), Literal(True)))

    graph.add((FORMULA_RESOURCE, RDF.type, cd(resource_type)))
    graph.add((FORMULA_RESOURCE, cd("authoredResource"), Literal(True)))
    if resource_type == "Definition":
        graph.add((FORMULA_RESOURCE, cd("body"), Literal("Definition body", lang="en")))
    if include_latex:
        graph.add((FORMULA_RESOURCE, cd("latex"), Literal("x = 1")))

    graph.add((FORMULA_SCENE, RDF.type, cd("SceneDefinition")))
    graph.add((FORMULA_SCENE, cd("focusConcept"), FORMULA_FOCUS))
    graph.add((FORMULA_SCENE, cd("hasSceneItem"), FORMULA_HEADING_ITEM))
    graph.add((FORMULA_SCENE, cd("hasSceneItem"), FORMULA_BODY_ITEM))

    graph.add((FORMULA_HEADING_ITEM, RDF.type, cd("SceneItem")))
    graph.add((FORMULA_HEADING_ITEM, cd("position"), Literal(1, datatype=XSD.integer)))
    graph.add((FORMULA_HEADING_ITEM, cd("selectsResource"), FORMULA_FOCUS))
    graph.add((FORMULA_HEADING_ITEM, cd("communicativeRole"), cd("HeadingRole")))
    graph.add((FORMULA_HEADING_ITEM, cd("selectionPath"), Literal("skos:prefLabel@en")))
    graph.add((FORMULA_HEADING_ITEM, cd("language"), Literal("en")))

    graph.add((FORMULA_BODY_ITEM, RDF.type, cd("SceneItem")))
    graph.add((FORMULA_BODY_ITEM, cd("position"), Literal(2, datatype=XSD.integer)))
    graph.add((FORMULA_BODY_ITEM, cd("selectsResource"), FORMULA_RESOURCE))
    graph.add((FORMULA_BODY_ITEM, cd("communicativeRole"), cd(role)))
    graph.add((FORMULA_BODY_ITEM, cd("selectionPath"), Literal(selector)))
    graph.add((FORMULA_BODY_ITEM, cd("language"), Literal("en")))

    return current


class FormulaSceneSemanticTests(unittest.TestCase):
    def shacl_in_values(self, path: URIRef) -> set[object]:
        dataset = VALIDATION.assemble_dataset()
        shapes = dataset.graph(VALIDATION.SHAPES_GRAPH)
        scene_item_shape = cd("SceneItemShape")
        property_shapes = [
            prop
            for prop in shapes.objects(scene_item_shape, URIRef(SH + "property"))
            if (prop, URIRef(SH + "path"), path) in shapes
        ]
        self.assertEqual(1, len(property_shapes))
        list_heads = list(shapes.objects(property_shapes[0], URIRef(SH + "in")))
        self.assertEqual(1, len(list_heads))
        return set(Collection(shapes, list_heads[0]))

    def test_scene_item_shape_preserves_role_allow_list_and_adds_formula_role(self) -> None:
        self.assertEqual(
            {
                cd("HeadingRole"),
                cd("QuotationRole"),
                cd("CitationRole"),
                cd("CodeRole"),
                cd("PollRole"),
                cd("StatementRole"),
                cd("ExampleRole"),
                cd("ExerciseRole"),
                cd("FormulaRole"),
                cd("KeyPointRole"),
                cd("AttributionRole"),
            },
            self.shacl_in_values(cd("communicativeRole")),
        )

    def test_scene_item_shape_preserves_selector_allow_list_and_adds_direct_latex(self) -> None:
        self.assertEqual(
            {
                Literal("skos:prefLabel@de"),
                Literal("skos:prefLabel@en"),
                Literal("cd:hasDefinition"),
                Literal("cd:hasDefinition/cd:hasSource"),
                Literal("cd:hasCodeExample"),
                Literal("cd:hasAudiencePoll"),
                Literal("cd:body"),
                Literal("cd:latex"),
                Literal("cd:hasKeyPoint"),
            },
            self.shacl_in_values(cd("selectionPath")),
        )

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)

    def test_canonical_standard_deviation_formula_metadata_is_explicit(self) -> None:
        dataset = RUNTIME.assemble_dataset()
        item = URIRef(f"{EX}scene4-i2")
        self.assertEqual([Literal(2)], RUNTIME.objects(dataset, item, cd("position")))
        self.assertEqual([URIRef(f"{EX}sample-sd-formula")], RUNTIME.objects(dataset, item, cd("selectsResource")))
        self.assertEqual([cd("FormulaRole")], RUNTIME.objects(dataset, item, cd("communicativeRole")))
        self.assertEqual([Literal("cd:latex")], RUNTIME.objects(dataset, item, cd("selectionPath")))
        self.assertEqual([Literal("de")], RUNTIME.objects(dataset, item, cd("language")))
        self.assertEqual([Literal(True)], RUNTIME.objects(dataset, item, cd("authoredResource")))

    def test_standard_deviation_formula_output_remains_semantically_compatible(self) -> None:
        dataset = RUNTIME.assemble_dataset()
        document = RUNTIME.compile_scene_document(
            dataset,
            RUNTIME.CoursePathReference(str(STANDARD_DEVIATION_PATH), STANDARD_DEVIATION_PATH_GRAPH),
        )
        formula_block = document["scenes"][3]["blocks"][1]
        self.assertEqual("math", formula_block["kind"])
        self.assertEqual(SAMPLE_FORMULA_LATEX, formula_block["expression"])
        self.assertEqual("Mathematische Formel für Standardabweichung", formula_block["spokenText"])
        self.assertEqual({"kind": "explain"}, formula_block["intent"])
        self.assertEqual("primary", formula_block["emphasis"])
        self.assertEqual({"order": 1, "mode": "initial"}, formula_block["disclosure"])
        self.assertEqual("ex:sample-sd-formula", formula_block["source"][0]["resourceId"])
        self.assertEqual("cd:latex", formula_block["source"][0]["relationPath"])

    def test_valid_formula_role_math_expression_and_latex_selector_compiles(self) -> None:
        document = RUNTIME.compile_scene_document(formula_scene_dataset(), selected_formula_path())
        block = document["scenes"][0]["blocks"][1]
        self.assertEqual("math", block["kind"])
        self.assertEqual("x = 1", block["expression"])
        self.assertEqual("cd:latex", block["source"][0]["relationPath"])

    def test_historical_quotation_role_math_expression_combination_fails_closed(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "MathExpression ex:formula-scene-runtime-resource requires FormulaRole with direct cd:latex selection",
        ):
            RUNTIME.compile_scene_document(
                formula_scene_dataset(role="QuotationRole", selector="cd:hasDefinition"),
                selected_formula_path(),
            )

    def test_formula_role_with_wrong_selector_fails_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "FormulaRole requires direct cd:latex selection"):
            RUNTIME.compile_scene_document(
                formula_scene_dataset(selector="cd:body"),
                selected_formula_path(),
            )

    def test_formula_role_with_non_math_resource_fails_closed(self) -> None:
        with self.assertRaisesRegex(ValueError, "FormulaRole requires MathExpression"):
            RUNTIME.compile_scene_document(
                formula_scene_dataset(resource_type="Definition"),
                selected_formula_path(),
            )

    def test_random_variables_scene_compilation_remains_compatible(self) -> None:
        dataset = RUNTIME.assemble_dataset()
        document = RUNTIME.compile_scene_document(
            dataset,
            RUNTIME.CoursePathReference(str(RANDOM_VARIABLES_PATH), RANDOM_VARIABLES_PATH_GRAPH),
        )
        self.assertEqual("ex:path-chemometrics-random-variables-lecture", document["sourcePathId"])
        self.assertEqual(5, len(document["scenes"]))


if __name__ == "__main__":
    unittest.main()
