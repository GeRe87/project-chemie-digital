from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

DATASET_SPEC = importlib.util.spec_from_file_location("rdf_dataset", SCRIPTS / "rdf_dataset.py")
assert DATASET_SPEC and DATASET_SPEC.loader
RDF_DATASET = importlib.util.module_from_spec(DATASET_SPEC)
DATASET_SPEC.loader.exec_module(RDF_DATASET)

VALIDATION_SPEC = importlib.util.spec_from_file_location("validate_semantics", SCRIPTS / "validate_semantics.py")
assert VALIDATION_SPEC and VALIDATION_SPEC.loader
VALIDATION = importlib.util.module_from_spec(VALIDATION_SPEC)
VALIDATION_SPEC.loader.exec_module(VALIDATION)

RUNTIME_SPEC = importlib.util.spec_from_file_location("generate_canonical_runtime", SCRIPTS / "generate_canonical_runtime.py")
assert RUNTIME_SPEC and RUNTIME_SPEC.loader
RUNTIME = importlib.util.module_from_spec(RUNTIME_SPEC)
RUNTIME_SPEC.loader.exec_module(RUNTIME)

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
PATH = EX["path-chemometrics-mean-values-lecture"]
PATH_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/paths/chemometrics-mean-values-lecture")
SCENE_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/scenes/chemometrics-mean-values-lecture")
CONTENT_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-basics")


def item(scene: str, suffix: str, position: int, resource: str, role, selector: str):
    return EX[f"scene-item-chemometrics-mean-values-{scene}-{suffix}"], (position, EX[resource], role, selector)


SCENE_MATRIX = {
    EX["scene-chemometrics-mean-values-arithmetic-mean"]: {
        "focus": EX["arithmetic-mean"],
        "items": dict([
            item("arithmetic-mean", "heading", 1, "arithmetic-mean", CD.HeadingRole, "skos:prefLabel@en"),
            item("arithmetic-mean", "formula", 2, "arithmetic-mean-formula", CD.FormulaRole, "cd:latex"),
            item("arithmetic-mean", "interpretation", 3, "arithmetic-mean-applicability-interpretation", CD.StatementRole, "cd:body"),
        ]),
    },
    EX["scene-chemometrics-mean-values-expected-value"]: {
        "focus": EX["expected-value"],
        "items": dict([
            item("expected-value", "heading", 1, "expected-value", CD.HeadingRole, "skos:prefLabel@en"),
            item("expected-value", "definition", 2, "def-expected-value", CD.StatementRole, "cd:body"),
            item("expected-value", "formula", 3, "discrete-expected-value-formula", CD.FormulaRole, "cd:latex"),
            item("expected-value", "interpretation", 4, "sample-mean-estimator-interpretation", CD.StatementRole, "cd:body"),
        ]),
    },
    EX["scene-chemometrics-mean-values-law-of-large-numbers"]: {
        "focus": EX["law-of-large-numbers"],
        "items": dict([
            item("law-of-large-numbers", "heading", 1, "law-of-large-numbers", CD.HeadingRole, "skos:prefLabel@en"),
            item("law-of-large-numbers", "definition", 2, "def-law-of-large-numbers", CD.StatementRole, "cd:body"),
            item("law-of-large-numbers", "interpretation", 3, "lln-not-standard-error-interpretation", CD.StatementRole, "cd:body"),
        ]),
    },
    EX["scene-chemometrics-mean-values-geometric-mean"]: {
        "focus": EX["geometric-mean"],
        "items": dict([
            item("geometric-mean", "heading", 1, "geometric-mean", CD.HeadingRole, "skos:prefLabel@en"),
            item("geometric-mean", "definition", 2, "def-geometric-mean", CD.StatementRole, "cd:body"),
            item("geometric-mean", "product-formula", 3, "geometric-mean-product-formula", CD.FormulaRole, "cd:latex"),
            item("geometric-mean", "log-formula", 4, "geometric-mean-log-formula", CD.FormulaRole, "cd:latex"),
            item("geometric-mean", "interpretation", 5, "geometric-mean-applicability-interpretation", CD.StatementRole, "cd:body"),
            item("geometric-mean", "example", 6, "worked-example-multiplicative-growth", CD.ExampleRole, "cd:body"),
        ]),
    },
    EX["scene-chemometrics-mean-values-geometric-practice"]: {
        "focus": EX["geometric-mean"],
        "items": dict([
            item("geometric-practice", "heading", 1, "geometric-mean", CD.HeadingRole, "skos:prefLabel@en"),
            item("geometric-practice", "exercise", 2, "exercise-geometric-growth-factors", CD.ExerciseRole, "cd:body"),
        ]),
    },
    EX["scene-chemometrics-mean-values-harmonic-mean"]: {
        "focus": EX["harmonic-mean"],
        "items": dict([
            item("harmonic-mean", "heading", 1, "harmonic-mean", CD.HeadingRole, "skos:prefLabel@en"),
            item("harmonic-mean", "example", 2, "worked-example-equal-distance-speed", CD.ExampleRole, "cd:body"),
            item("harmonic-mean", "definition", 3, "def-harmonic-mean", CD.StatementRole, "cd:body"),
            item("harmonic-mean", "formula", 4, "harmonic-mean-formula", CD.FormulaRole, "cd:latex"),
            item("harmonic-mean", "interpretation", 5, "harmonic-mean-rate-interpretation", CD.StatementRole, "cd:body"),
        ]),
    },
    EX["scene-chemometrics-mean-values-median"]: {
        "focus": EX["median"],
        "items": dict([
            item("median", "heading", 1, "median", CD.HeadingRole, "skos:prefLabel@en"),
            item("median", "example", 2, "worked-example-turbidity-median", CD.ExampleRole, "cd:body"),
            item("median", "definition", 3, "def-median", CD.StatementRole, "cd:body"),
            item("median", "formula", 4, "sample-median-formula", CD.FormulaRole, "cd:latex"),
            item("median", "interpretation", 5, "median-robustness-interpretation", CD.StatementRole, "cd:body"),
        ]),
    },
    EX["scene-chemometrics-mean-values-median-practice"]: {
        "focus": EX["median"],
        "items": dict([
            item("median-practice", "heading", 1, "median", CD.HeadingRole, "skos:prefLabel@en"),
            item("median-practice", "exercise", 2, "exercise-mean-median-outlier", CD.ExerciseRole, "cd:body"),
        ]),
    },
}

ORDERED_SCENES = list(SCENE_MATRIX)


class ChemometricsMeanValuesSceneTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.scene_graph = cls.dataset.graph(SCENE_GRAPH)
        cls.path_graph = cls.dataset.graph(PATH_GRAPH)

    def test_scene_graph_contains_exactly_eight_scene_definitions(self) -> None:
        self.assertEqual(set(SCENE_MATRIX), set(self.scene_graph.subjects(RDF.type, CD.SceneDefinition)))
        for scene, expected in SCENE_MATRIX.items():
            self.assertEqual({expected["focus"]}, set(self.scene_graph.objects(scene, CD.focusConcept)))
            self.assertEqual({Literal(True)}, set(self.scene_graph.objects(scene, CD.authoredResource)))
            self.assertEqual(set(expected["items"]), set(self.scene_graph.objects(scene, CD.hasSceneItem)))

    def test_scene_items_match_exact_matrix_and_formula_contract(self) -> None:
        for scene, expected in SCENE_MATRIX.items():
            positions = []
            for scene_item, (position, resource, role, selector) in expected["items"].items():
                with self.subTest(scene=scene, item=scene_item):
                    self.assertEqual({CD.SceneItem}, set(self.scene_graph.objects(scene_item, RDF.type)))
                    self.assertEqual({Literal(position)}, set(self.scene_graph.objects(scene_item, CD.position)))
                    self.assertEqual({resource}, set(self.scene_graph.objects(scene_item, CD.selectsResource)))
                    self.assertEqual({role}, set(self.scene_graph.objects(scene_item, CD.communicativeRole)))
                    self.assertEqual({Literal(selector)}, set(self.scene_graph.objects(scene_item, CD.selectionPath)))
                    self.assertEqual({Literal("en")}, set(self.scene_graph.objects(scene_item, CD.language)))
                    self.assertEqual({Literal(True)}, set(self.scene_graph.objects(scene_item, CD.authoredResource)))
                    self.assertIn(Literal(True), set(self.graph.objects(resource, CD.authoredResource)))
                    if role == CD.FormulaRole:
                        self.assertEqual("cd:latex", selector)
                        self.assertIn(CD.MathExpression, set(self.graph.objects(resource, RDF.type)))
                    positions.append(position)
            self.assertEqual(list(range(1, len(positions) + 1)), sorted(positions))

    def test_scene_graph_owns_only_scene_instance_metadata(self) -> None:
        typed = {(s, o) for s, _p, o in self.scene_graph.triples((None, RDF.type, None))}
        expected_typed = {(scene, CD.SceneDefinition) for scene in SCENE_MATRIX} | {
            (scene_item, CD.SceneItem)
            for expected in SCENE_MATRIX.values()
            for scene_item in expected["items"]
        }
        self.assertEqual(expected_typed, typed)
        self.assertEqual([], list(self.scene_graph.triples((None, CD.body, None))))
        self.assertEqual([], list(self.scene_graph.triples((None, CD.latex, None))))
        self.assertEqual([], list(self.scene_graph.triples((None, CD.presentationPattern, None))))

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)

    def test_runtime_compiles_exactly_eight_ordered_scenes_with_formula_latex(self) -> None:
        document = RUNTIME.compile_scene_document(
            self.dataset,
            RUNTIME.CoursePathReference(str(PATH), str(PATH_GRAPH)),
        )
        self.assertEqual(8, len(document["scenes"]))
        self.assertEqual(
            [f"ex:{str(scene).removeprefix(str(EX))}--scene" for scene in ORDERED_SCENES],
            [scene["id"] for scene in document["scenes"]],
        )
        for scene_resource, compiled_scene in zip(ORDERED_SCENES, document["scenes"], strict=True):
            ordered_items = sorted(SCENE_MATRIX[scene_resource]["items"].items(), key=lambda entry: entry[1][0])
            self.assertEqual(len(ordered_items), len(compiled_scene["blocks"]))
            for (_scene_item, (_position, resource, role, selector)), block in zip(ordered_items, compiled_scene["blocks"], strict=True):
                self.assertEqual(selector, block["source"][0]["relationPath"])
                if role == CD.FormulaRole:
                    self.assertEqual("math", block["kind"])
                    self.assertEqual(str(next(self.graph.objects(resource, CD.latex))), block["expression"])
                elif role == CD.ExerciseRole:
                    self.assertEqual("prompt", block["kind"])
                else:
                    self.assertEqual("prose", block["kind"])

    def test_random_variables_and_standard_deviation_formula_compatibility_remain_present(self) -> None:
        random_path = EX["path-chemometrics-random-variables-lecture"]
        random_graph = URIRef("https://w3id.org/project-chemie-digital/graph/paths/chemometrics-random-variables-lecture")
        random_document = RUNTIME.compile_scene_document(self.dataset, RUNTIME.CoursePathReference(str(random_path), str(random_graph)))
        self.assertEqual(5, len(random_document["scenes"]))
        self.assertIn(CD.FormulaRole, set(self.graph.objects(EX["scene4-i2"], CD.communicativeRole)))
        self.assertEqual({Literal("cd:latex")}, set(self.graph.objects(EX["scene4-i2"], CD.selectionPath)))


if __name__ == "__main__":
    unittest.main()
