from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import RDF, SKOS, XSD, Dataset, Literal, URIRef

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
GENERIC_PATH = URIRef(f"{EX}path-generic-scene-runtime")
GENERIC_PATH_GRAPH = f"{GRAPH}paths/generic-scene-runtime"
GENERIC_RESOURCE_GRAPH = f"{GRAPH}tests/generic-scene-runtime"
GENERIC_STEP = URIRef(f"{EX}path-step-generic-scene-runtime")
GENERIC_SCENE = URIRef(f"{EX}scene-generic-scene-runtime")
GENERIC_FOCUS = URIRef(f"{EX}generic-scene-runtime-concept")
GENERIC_HEADING_ITEM = URIRef(f"{EX}generic-scene-runtime-heading")
GENERIC_BODY_ITEM = URIRef(f"{EX}generic-scene-runtime-body")
GENERIC_RESOURCE = URIRef(f"{EX}generic-scene-runtime-resource")


def cd(local: str) -> URIRef:
    return URIRef(CD + local)


def selected_path() -> object:
    return MODULE.CoursePathReference(str(GENERIC_PATH), GENERIC_PATH_GRAPH)


def generic_scene_dataset(
    *,
    role: str,
    resource_type: str,
    selector: str = "cd:body",
    body_values: tuple[Literal, ...] = (Literal("Generic body", lang="en"),),
    body_language: str | None = "en",
    heading_selector: str = "skos:prefLabel@en",
    heading_language: str | None = "en",
    include_english_heading: bool = True,
) -> Dataset:
    current = MODULE.assemble_dataset()
    path_graph = current.graph(URIRef(GENERIC_PATH_GRAPH))
    graph = current.graph(URIRef(GENERIC_RESOURCE_GRAPH))

    path_graph.add((GENERIC_PATH, RDF.type, cd("LearningPath")))
    path_graph.add((GENERIC_PATH, cd("hasStep"), GENERIC_STEP))
    path_graph.add((GENERIC_STEP, cd("position"), Literal(1, datatype=XSD.integer)))
    path_graph.add((GENERIC_STEP, cd("usesScene"), GENERIC_SCENE))

    graph.add((GENERIC_FOCUS, RDF.type, cd("Concept")))
    graph.add((GENERIC_FOCUS, SKOS.prefLabel, Literal("Generisches Laufzeitkonzept", lang="de")))
    if include_english_heading:
        graph.add((GENERIC_FOCUS, SKOS.prefLabel, Literal("Generic runtime concept", lang="en")))
    graph.add((GENERIC_FOCUS, cd("authoredResource"), Literal(True)))

    graph.add((GENERIC_RESOURCE, RDF.type, cd(resource_type)))
    graph.add((GENERIC_RESOURCE, SKOS.prefLabel, Literal("Fallback label must not be selected", lang="en")))
    graph.add((GENERIC_RESOURCE, cd("authoredResource"), Literal(True)))
    for value in body_values:
        graph.add((GENERIC_RESOURCE, cd("body"), value))

    graph.add((GENERIC_SCENE, RDF.type, cd("SceneDefinition")))
    graph.add((GENERIC_SCENE, cd("focusConcept"), GENERIC_FOCUS))
    graph.add((GENERIC_SCENE, cd("hasSceneItem"), GENERIC_HEADING_ITEM))
    graph.add((GENERIC_SCENE, cd("hasSceneItem"), GENERIC_BODY_ITEM))

    graph.add((GENERIC_HEADING_ITEM, RDF.type, cd("SceneItem")))
    graph.add((GENERIC_HEADING_ITEM, cd("position"), Literal(1, datatype=XSD.integer)))
    graph.add((GENERIC_HEADING_ITEM, cd("selectsResource"), GENERIC_FOCUS))
    graph.add((GENERIC_HEADING_ITEM, cd("communicativeRole"), cd("HeadingRole")))
    graph.add((GENERIC_HEADING_ITEM, cd("selectionPath"), Literal(heading_selector)))
    if heading_language is not None:
        graph.add((GENERIC_HEADING_ITEM, cd("language"), Literal(heading_language)))

    graph.add((GENERIC_BODY_ITEM, RDF.type, cd("SceneItem")))
    graph.add((GENERIC_BODY_ITEM, cd("position"), Literal(2, datatype=XSD.integer)))
    graph.add((GENERIC_BODY_ITEM, cd("selectsResource"), GENERIC_RESOURCE))
    graph.add((GENERIC_BODY_ITEM, cd("communicativeRole"), cd(role)))
    graph.add((GENERIC_BODY_ITEM, cd("selectionPath"), Literal(selector)))
    if body_language is not None:
        graph.add((GENERIC_BODY_ITEM, cd("language"), Literal(body_language)))

    return current


def compile_generic(**kwargs):
    return MODULE.compile_scene_document(generic_scene_dataset(**kwargs), selected_path())


class GenericSceneRuntimeProjectionTests(unittest.TestCase):
    def test_english_heading_uses_exact_english_label(self) -> None:
        document = compile_generic(role="StatementRole", resource_type="Definition")
        heading = document["scenes"][0]["blocks"][0]
        self.assertEqual("Generic runtime concept", heading["text"])
        self.assertEqual(
            {
                "resourceId": "ex:generic-scene-runtime-concept",
                "provenanceIds": [GENERIC_RESOURCE_GRAPH],
                "relationPath": "skos:prefLabel@en",
            },
            heading["source"][0],
        )
        self.assertEqual("Generic runtime concept", document["scenes"][0]["accessibility"]["label"])

    def test_statement_role_projects_definition_body_to_prose_explain(self) -> None:
        document = compile_generic(
            role="StatementRole",
            resource_type="Definition",
            body_values=(Literal("Definition body", lang="en"),),
        )
        block = document["scenes"][0]["blocks"][1]
        self.assertEqual("prose", block["kind"])
        self.assertEqual("Definition body", block["text"])
        self.assertEqual({"kind": "explain"}, block["intent"])
        self.assertEqual(
            {
                "resourceId": "ex:generic-scene-runtime-resource",
                "provenanceIds": [GENERIC_RESOURCE_GRAPH],
                "relationPath": "cd:body",
            },
            block["source"][0],
        )

    def test_statement_role_projects_interpretation_body_to_prose_explain(self) -> None:
        document = compile_generic(
            role="StatementRole",
            resource_type="Interpretation",
            body_values=(Literal("Interpretation body", lang="en"),),
        )
        block = document["scenes"][0]["blocks"][1]
        self.assertEqual("prose", block["kind"])
        self.assertEqual("Interpretation body", block["text"])
        self.assertEqual({"kind": "explain"}, block["intent"])
        self.assertEqual("cd:body", block["source"][0]["relationPath"])

    def test_example_role_projects_worked_example_body_to_prose_explain(self) -> None:
        document = compile_generic(
            role="ExampleRole",
            resource_type="WorkedExample",
            body_values=(Literal("Worked example body", lang="en"),),
        )
        block = document["scenes"][0]["blocks"][1]
        self.assertEqual("prose", block["kind"])
        self.assertEqual("Worked example body", block["text"])
        self.assertEqual({"kind": "explain"}, block["intent"])
        self.assertEqual("cd:body", block["source"][0]["relationPath"])

    def test_exercise_role_projects_exact_body_to_free_text_prompt(self) -> None:
        prompt = "Calculate the requested result and explain your reasoning."
        document = compile_generic(
            role="ExerciseRole",
            resource_type="Exercise",
            body_values=(Literal(prompt, lang="en"),),
        )
        block = document["scenes"][0]["blocks"][1]
        self.assertEqual("prompt", block["kind"])
        self.assertEqual(prompt, block["prompt"])
        self.assertEqual("free-text", block["responseMode"])
        self.assertEqual({"kind": "practice"}, block["intent"])
        self.assertEqual(prompt, block["fallback"])
        self.assertEqual(
            {
                "resourceId": "ex:generic-scene-runtime-resource",
                "provenanceIds": [GENERIC_RESOURCE_GRAPH],
                "relationPath": "cd:body",
            },
            block["source"][0],
        )

    def test_english_heading_does_not_fall_back_to_german(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "Missing selected value skos:prefLabel@en for ex:generic-scene-runtime-concept",
        ):
            compile_generic(
                role="StatementRole",
                resource_type="Definition",
                include_english_heading=False,
            )

    def test_heading_language_must_match_selector(self) -> None:
        with self.assertRaisesRegex(ValueError, "Heading language does not match selector"):
            compile_generic(
                role="StatementRole",
                resource_type="Definition",
                heading_selector="skos:prefLabel@en",
                heading_language="de",
            )

    def test_heading_rejects_unsupported_selector(self) -> None:
        with self.assertRaisesRegex(ValueError, "Invalid heading selection"):
            compile_generic(
                role="StatementRole",
                resource_type="Definition",
                heading_selector="cd:body",
                heading_language=None,
            )

    def test_statement_role_rejects_unsupported_resource_kind(self) -> None:
        with self.assertRaisesRegex(ValueError, "StatementRole requires Definition or Interpretation"):
            compile_generic(role="StatementRole", resource_type="WorkedExample")

    def test_example_role_rejects_non_worked_example(self) -> None:
        with self.assertRaisesRegex(ValueError, "ExampleRole requires WorkedExample"):
            compile_generic(role="ExampleRole", resource_type="Definition")

    def test_exercise_role_rejects_non_exercise(self) -> None:
        with self.assertRaisesRegex(ValueError, "ExerciseRole requires Exercise"):
            compile_generic(role="ExerciseRole", resource_type="Definition")

    def test_generic_roles_reject_non_body_selector(self) -> None:
        with self.assertRaisesRegex(ValueError, "StatementRole requires direct cd:body selection"):
            compile_generic(
                role="StatementRole",
                resource_type="Definition",
                selector="cd:hasDefinition",
            )

    def test_direct_body_selector_does_not_fall_back_to_label(self) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "Missing selected value cd:body for ex:generic-scene-runtime-resource",
        ):
            compile_generic(
                role="StatementRole",
                resource_type="Definition",
                body_values=(),
            )

    def test_ambiguous_direct_body_value_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "Ambiguous literal cd:body"):
            compile_generic(
                role="StatementRole",
                resource_type="Definition",
                body_values=(
                    Literal("First body", lang="en"),
                    Literal("Second body", lang="en"),
                ),
                body_language="en",
            )

    def test_body_without_language_is_rejected_when_multiple_languages_exist(self) -> None:
        with self.assertRaisesRegex(ValueError, "Ambiguous literal cd:body"):
            compile_generic(
                role="StatementRole",
                resource_type="Definition",
                body_values=(
                    Literal("English body", lang="en"),
                    Literal("Deutscher Text", lang="de"),
                ),
                body_language=None,
            )


if __name__ == "__main__":
    unittest.main()
