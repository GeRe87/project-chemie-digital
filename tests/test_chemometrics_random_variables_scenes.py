from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, SKOS, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

DATASET_SPEC = importlib.util.spec_from_file_location(
    "rdf_dataset", SCRIPTS / "rdf_dataset.py"
)
assert DATASET_SPEC and DATASET_SPEC.loader
RDF_DATASET = importlib.util.module_from_spec(DATASET_SPEC)
DATASET_SPEC.loader.exec_module(RDF_DATASET)

if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

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
CONTENT_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-basics"
)

SCENE_MATRIX = {
    EX["scene-chemometrics-random-variables-opener"]: {
        "focus": EX["random-variable"],
        "items": {
            EX["scene-item-chemometrics-random-variables-opener-heading"]: (
                1,
                EX["random-variable"],
                CD.HeadingRole,
                "skos:prefLabel@en",
            ),
            EX["scene-item-chemometrics-random-variables-opener-exercise"]: (
                2,
                EX["exercise-dice-realizations"],
                CD.ExerciseRole,
                "cd:body",
            ),
            EX["scene-item-chemometrics-random-variables-opener-code"]: (
                3,
                EX["code-dice-roll-r"],
                CD.CodeRole,
                "cd:hasCodeExample",
            ),
        },
    },
    EX["scene-chemometrics-random-variables-core-distinction"]: {
        "focus": EX["random-variable"],
        "items": {
            EX["scene-item-chemometrics-random-variables-core-distinction-heading"]: (
                1,
                EX["random-variable"],
                CD.HeadingRole,
                "skos:prefLabel@en",
            ),
            EX["scene-item-chemometrics-random-variables-core-distinction-definition"]: (
                2,
                EX["def-random-variable"],
                CD.StatementRole,
                "cd:body",
            ),
            EX["scene-item-chemometrics-random-variables-core-distinction-realization"]: (
                3,
                EX["random-variable-realization-interpretation"],
                CD.StatementRole,
                "cd:body",
            ),
        },
    },
    EX["scene-chemometrics-random-variables-measurement-model"]: {
        "focus": EX["random-variable"],
        "items": {
            EX["scene-item-chemometrics-random-variables-measurement-model-heading"]: (
                1,
                EX["random-variable"],
                CD.HeadingRole,
                "skos:prefLabel@en",
            ),
            EX["scene-item-chemometrics-random-variables-measurement-model-interpretation"]: (
                2,
                EX["random-measurement-model-interpretation"],
                CD.StatementRole,
                "cd:body",
            ),
        },
    },
    EX["scene-chemometrics-random-variables-discrete-case"]: {
        "focus": EX["discrete-random-variable"],
        "items": {
            EX["scene-item-chemometrics-random-variables-discrete-case-heading"]: (
                1,
                EX["discrete-random-variable"],
                CD.HeadingRole,
                "skos:prefLabel@en",
            ),
            EX["scene-item-chemometrics-random-variables-discrete-case-definition"]: (
                2,
                EX["def-discrete-random-variable"],
                CD.StatementRole,
                "cd:body",
            ),
            EX["scene-item-chemometrics-random-variables-discrete-case-example"]: (
                3,
                EX["worked-example-discrete-colony-count"],
                CD.ExampleRole,
                "cd:body",
            ),
        },
    },
    EX["scene-chemometrics-random-variables-continuous-case"]: {
        "focus": EX["continuous-random-variable"],
        "items": {
            EX["scene-item-chemometrics-random-variables-continuous-case-heading"]: (
                1,
                EX["continuous-random-variable"],
                CD.HeadingRole,
                "skos:prefLabel@en",
            ),
            EX["scene-item-chemometrics-random-variables-continuous-case-definition"]: (
                2,
                EX["def-continuous-random-variable"],
                CD.StatementRole,
                "cd:body",
            ),
            EX["scene-item-chemometrics-random-variables-continuous-case-example"]: (
                3,
                EX["worked-example-continuous-concentration"],
                CD.ExampleRole,
                "cd:body",
            ),
        },
    },
}

ORDERED_SCENES = [
    EX["scene-chemometrics-random-variables-opener"],
    EX["scene-chemometrics-random-variables-core-distinction"],
    EX["scene-chemometrics-random-variables-measurement-model"],
    EX["scene-chemometrics-random-variables-discrete-case"],
    EX["scene-chemometrics-random-variables-continuous-case"],
]


def compact(resource: URIRef) -> str:
    return f"ex:{str(resource).removeprefix(str(EX))}"


def english_literal(graph, subject: URIRef, predicate: URIRef) -> str:
    values = [
        value
        for value in graph.objects(subject, predicate)
        if isinstance(value, Literal) and value.language == "en"
    ]
    if len(values) != 1:
        raise AssertionError(f"Expected one English literal for {subject} {predicate}, got {values}")
    return str(values[0])


class ChemometricsRandomVariablesSceneTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.scene_graph = cls.dataset.graph(SCENE_GRAPH)
        cls.content_graph = cls.dataset.graph(CONTENT_GRAPH)

    def test_scene_graph_contains_exactly_the_five_required_scene_definitions(self) -> None:
        self.assertEqual(
            set(SCENE_MATRIX),
            set(self.scene_graph.subjects(RDF.type, CD.SceneDefinition)),
        )
        for scene, expected in SCENE_MATRIX.items():
            with self.subTest(scene=scene):
                self.assertEqual(
                    {expected["focus"]},
                    set(self.scene_graph.objects(scene, CD.focusConcept)),
                )
                self.assertEqual(
                    {Literal(True)},
                    set(self.scene_graph.objects(scene, CD.authoredResource)),
                )
                self.assertEqual(
                    set(expected["items"]),
                    set(self.scene_graph.objects(scene, CD.hasSceneItem)),
                )

    def test_scene_items_match_the_exact_resource_role_selector_matrix(self) -> None:
        all_positions = {}
        for scene, expected in SCENE_MATRIX.items():
            positions = []
            for item, (position, resource, role, selector) in expected["items"].items():
                with self.subTest(scene=scene, item=item):
                    self.assertEqual({CD.SceneItem}, set(self.scene_graph.objects(item, RDF.type)))
                    self.assertEqual({Literal(position)}, set(self.scene_graph.objects(item, CD.position)))
                    self.assertEqual({resource}, set(self.scene_graph.objects(item, CD.selectsResource)))
                    self.assertEqual({role}, set(self.scene_graph.objects(item, CD.communicativeRole)))
                    self.assertEqual({Literal(selector)}, set(self.scene_graph.objects(item, CD.selectionPath)))
                    self.assertEqual({Literal("en")}, set(self.scene_graph.objects(item, CD.language)))
                    self.assertEqual({Literal(True)}, set(self.scene_graph.objects(item, CD.authoredResource)))
                    self.assertIn(
                        Literal(True),
                        set(self.graph.objects(resource, CD.authoredResource)),
                        f"Selected resource lacks authored-resource evidence: {resource}",
                    )
                    positions.append(position)
            self.assertEqual(len(positions), len(set(positions)))
            self.assertTrue(all(position > 0 for position in positions))
            self.assertEqual(1, min(positions))
            all_positions[scene] = sorted(positions)

        self.assertEqual([1, 2, 3], all_positions[ORDERED_SCENES[0]])
        self.assertEqual([1, 2, 3], all_positions[ORDERED_SCENES[1]])
        self.assertEqual([1, 2], all_positions[ORDERED_SCENES[2]])
        self.assertEqual([1, 2, 3], all_positions[ORDERED_SCENES[3]])
        self.assertEqual([1, 2, 3], all_positions[ORDERED_SCENES[4]])

    def test_every_scene_heading_is_position_one_and_selects_exact_english_focus_label(self) -> None:
        for scene, expected in SCENE_MATRIX.items():
            focus = expected["focus"]
            heading_items = [
                item
                for item in expected["items"]
                if (item, CD.communicativeRole, CD.HeadingRole) in self.scene_graph
            ]
            with self.subTest(scene=scene):
                self.assertEqual(1, len(heading_items))
                heading = heading_items[0]
                self.assertEqual({Literal(1)}, set(self.scene_graph.objects(heading, CD.position)))
                self.assertEqual({focus}, set(self.scene_graph.objects(heading, CD.selectsResource)))
                self.assertEqual(
                    {Literal("skos:prefLabel@en")},
                    set(self.scene_graph.objects(heading, CD.selectionPath)),
                )
                self.assertEqual(1, len([
                    label
                    for label in self.graph.objects(focus, SKOS.prefLabel)
                    if isinstance(label, Literal) and label.language == "en"
                ]))

    def test_opener_reuses_existing_dice_exercise_and_code_example_unchanged(self) -> None:
        exercise = EX["exercise-dice-realizations"]
        code = EX["code-dice-roll-r"]
        self.assertEqual({CD.Exercise}, set(self.content_graph.objects(exercise, RDF.type)))
        self.assertEqual(
            {
                Literal(
                    "Run the supplied R expression repeatedly. Record several outcomes and explain why each output is a realization whereas the rule assigning the die-face value is the random variable.",
                    lang="en",
                )
            },
            set(self.content_graph.objects(exercise, CD.body)),
        )
        self.assertEqual({code}, set(self.content_graph.objects(exercise, CD.hasCodeExample)))
        self.assertEqual({CD.CodeExample}, set(self.content_graph.objects(code, RDF.type)))
        self.assertEqual({Literal("sample(1:6, 1)")}, set(self.content_graph.objects(code, CD.code)))
        self.assertEqual({Literal("r")}, set(self.content_graph.objects(code, CD.programmingLanguage)))
        self.assertEqual({Literal(True)}, set(self.content_graph.objects(code, CD.editable)))
        self.assertEqual({Literal(True)}, set(self.content_graph.objects(code, CD.executable)))

    def test_scene_graph_authors_only_scene_instance_identities(self) -> None:
        expected_typed = {
            (scene, CD.SceneDefinition) for scene in SCENE_MATRIX
        } | {
            (item, CD.SceneItem)
            for expected in SCENE_MATRIX.values()
            for item in expected["items"]
        }
        actual_typed = {
            (subject, object_type)
            for subject, _predicate, object_type in self.scene_graph.triples((None, RDF.type, None))
        }
        self.assertEqual(expected_typed, actual_typed)
        for forbidden_type in (
            CD.Concept,
            CD.Definition,
            CD.Interpretation,
            CD.WorkedExample,
            CD.Exercise,
            CD.CodeExample,
            CD.Source,
            CD.MathExpression,
            CD.LearningPath,
            CD.PathStep,
        ):
            with self.subTest(forbidden_type=forbidden_type):
                self.assertEqual([], list(self.scene_graph.triples((None, RDF.type, forbidden_type))))
        self.assertEqual([], list(self.scene_graph.triples((None, CD.body, None))))

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)

    def test_runtime_compiles_random_variables_path_into_exactly_five_ordered_scenes(self) -> None:
        document = RUNTIME.compile_scene_document(
            self.dataset,
            RUNTIME.CoursePathReference(str(PATH), str(PATH_GRAPH)),
        )
        self.assertEqual("1.0", document["version"])
        self.assertEqual(compact(PATH), document["sourcePathId"])
        self.assertEqual(
            [f"{compact(scene)}--scene" for scene in ORDERED_SCENES],
            [scene["id"] for scene in document["scenes"]],
        )
        self.assertEqual(5, len(document["scenes"]))

        for scene_resource, compiled_scene in zip(ORDERED_SCENES, document["scenes"], strict=True):
            expected = SCENE_MATRIX[scene_resource]
            focus = expected["focus"]
            ordered_items = sorted(expected["items"].items(), key=lambda entry: entry[1][0])
            blocks = compiled_scene["blocks"]
            with self.subTest(scene=scene_resource):
                self.assertEqual(len(ordered_items), len(blocks))
                self.assertEqual(
                    english_literal(self.graph, focus, SKOS.prefLabel),
                    compiled_scene["accessibility"]["label"],
                )
                self.assertIn(str(SCENE_GRAPH), compiled_scene["source"][0]["provenanceIds"])

            for (item, (_position, resource, role, selector)), block in zip(
                ordered_items,
                blocks,
                strict=True,
            ):
                with self.subTest(scene=scene_resource, item=item):
                    self.assertEqual(f"{compact(item)}--block", block["id"])
                    self.assertEqual(compact(resource), block["source"][0]["resourceId"])
                    self.assertEqual(selector, block["source"][0]["relationPath"])
                    self.assertIn(str(CONTENT_GRAPH), block["source"][0]["provenanceIds"])

                    if role == CD.HeadingRole:
                        self.assertEqual("prose", block["kind"])
                        self.assertEqual({"kind": "introduce"}, block["intent"])
                        self.assertEqual(
                            english_literal(self.graph, resource, SKOS.prefLabel),
                            block["text"],
                        )
                    elif role in {CD.StatementRole, CD.ExampleRole}:
                        self.assertEqual("prose", block["kind"])
                        self.assertEqual({"kind": "explain"}, block["intent"])
                        self.assertEqual(
                            english_literal(self.graph, resource, CD.body),
                            block["text"],
                        )
                    elif role == CD.ExerciseRole:
                        body = english_literal(self.graph, resource, CD.body)
                        self.assertEqual("prompt", block["kind"])
                        self.assertEqual({"kind": "practice"}, block["intent"])
                        self.assertEqual("free-text", block["responseMode"])
                        self.assertEqual(body, block["prompt"])
                        self.assertEqual(body, block["fallback"])
                    elif role == CD.CodeRole:
                        code = str(next(self.graph.objects(resource, CD.code)))
                        self.assertEqual("code", block["kind"])
                        self.assertEqual({"kind": "practice"}, block["intent"])
                        self.assertEqual("r", block["language"])
                        self.assertEqual(code, block["code"])
                        self.assertEqual(code, block["fallback"])
                        self.assertTrue(block["editable"])
                        self.assertTrue(block["executable"])
                    else:
                        self.fail(f"Unexpected role in test matrix: {role}")


if __name__ == "__main__":
    unittest.main()
