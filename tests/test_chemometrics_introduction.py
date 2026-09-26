from __future__ import annotations

import sys
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, SKOS, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import generate_canonical_runtime as RUNTIME  # noqa: E402
import rdf_dataset as RDF_DATASET  # noqa: E402
import validate_semantics as VALIDATION  # noqa: E402

from course_path_selection import (  # noqa: E402
    CoursePathReference,
    CourseUnitPathSelectionRequest,
    select_course_unit_path,
)

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")

COURSE_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/specifications/course-scale"
)
CONTENT_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-introduction"
)
PATH_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/paths/chemometrics-introduction"
)
SCENE_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/scenes/chemometrics-introduction"
)

OFFERING = EX["teaching-offering-chemometrics-applied-statistics"]
UNIT = EX["learning-unit-chemometrics-introduction"]
PLACEMENT = EX["unit-placement-chemometrics-introduction"]
PATH = EX["path-chemometrics-introduction"]

EXPECTED_TOPICS = {
    EX["chemometrics-course-overview"],
    EX["chemometrics-lecturer-context"],
    EX["chemometrics-course-format"],
    EX["chemometrics-course-roadmap"],
    EX["chemometrics-introduction-round"],
}

EXPECTED_STEP_MATRIX = {
    EX["path-step-chemometrics-introduction-overview"]: (
        1,
        {EX["chemometrics-course-overview-note"]},
        EX["scene-chemometrics-introduction-overview"],
    ),
    EX["path-step-chemometrics-introduction-lecturer"]: (
        2,
        {
            EX["attribution-chemometrics-gerrit-renner"],
            EX["chemometrics-lecturer-context-note"],
        },
        EX["scene-chemometrics-introduction-lecturer"],
    ),
    EX["path-step-chemometrics-introduction-format"]: (
        3,
        {EX["chemometrics-course-format-list"]},
        EX["scene-chemometrics-introduction-format"],
    ),
    EX["path-step-chemometrics-introduction-roadmap"]: (
        4,
        {EX["chemometrics-course-roadmap-list"]},
        EX["scene-chemometrics-introduction-roadmap"],
    ),
    EX["path-step-chemometrics-introduction-round"]: (
        5,
        {EX["exercise-chemometrics-introduction-round"]},
        EX["scene-chemometrics-introduction-round"],
    ),
}

EXPECTED_SCENE_MATRIX = {
    EX["scene-chemometrics-introduction-overview"]: (
        EX["chemometrics-course-overview"],
        (
            (
                EX["scene-item-chemometrics-introduction-overview-heading"],
                1,
                EX["chemometrics-course-overview"],
                CD.HeadingRole,
                "skos:prefLabel@en",
            ),
            (
                EX["scene-item-chemometrics-introduction-overview-note"],
                2,
                EX["chemometrics-course-overview-note"],
                CD.StatementRole,
                "cd:body",
            ),
        ),
    ),
    EX["scene-chemometrics-introduction-lecturer"]: (
        EX["chemometrics-lecturer-context"],
        (
            (
                EX["scene-item-chemometrics-introduction-lecturer-heading"],
                1,
                EX["chemometrics-lecturer-context"],
                CD.HeadingRole,
                "skos:prefLabel@en",
            ),
            (
                EX["scene-item-chemometrics-introduction-lecturer-attribution"],
                2,
                EX["attribution-chemometrics-gerrit-renner"],
                CD.AttributionRole,
                "cd:body",
            ),
            (
                EX["scene-item-chemometrics-introduction-lecturer-note"],
                3,
                EX["chemometrics-lecturer-context-note"],
                CD.StatementRole,
                "cd:body",
            ),
        ),
    ),
    EX["scene-chemometrics-introduction-format"]: (
        EX["chemometrics-course-format"],
        (
            (
                EX["scene-item-chemometrics-introduction-format-heading"],
                1,
                EX["chemometrics-course-format"],
                CD.HeadingRole,
                "skos:prefLabel@en",
            ),
            (
                EX["scene-item-chemometrics-introduction-format-list"],
                2,
                EX["chemometrics-course-format-list"],
                CD.DefinitionListRole,
                "cd:hasDefinitionListEntry",
            ),
        ),
    ),
    EX["scene-chemometrics-introduction-roadmap"]: (
        EX["chemometrics-course-roadmap"],
        (
            (
                EX["scene-item-chemometrics-introduction-roadmap-heading"],
                1,
                EX["chemometrics-course-roadmap"],
                CD.HeadingRole,
                "skos:prefLabel@en",
            ),
            (
                EX["scene-item-chemometrics-introduction-roadmap-list"],
                2,
                EX["chemometrics-course-roadmap-list"],
                CD.DefinitionListRole,
                "cd:hasDefinitionListEntry",
            ),
        ),
    ),
    EX["scene-chemometrics-introduction-round"]: (
        EX["chemometrics-introduction-round"],
        (
            (
                EX["scene-item-chemometrics-introduction-round-heading"],
                1,
                EX["chemometrics-introduction-round"],
                CD.HeadingRole,
                "skos:prefLabel@en",
            ),
            (
                EX["scene-item-chemometrics-introduction-round-exercise"],
                2,
                EX["exercise-chemometrics-introduction-round"],
                CD.ExerciseRole,
                "cd:body",
            ),
        ),
    ),
}


def request() -> CourseUnitPathSelectionRequest:
    return CourseUnitPathSelectionRequest(
        offering_id=str(OFFERING),
        placement_id=str(PLACEMENT),
        unit_id=str(UNIT),
        requested_path_id=str(PATH),
        requested_path_graph_id=str(PATH_GRAPH),
    )


class ChemometricsIntroductionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.course_graph = cls.dataset.graph(COURSE_GRAPH)
        cls.content_graph = cls.dataset.graph(CONTENT_GRAPH)
        cls.path_graph = cls.dataset.graph(PATH_GRAPH)
        cls.scene_graph = cls.dataset.graph(SCENE_GRAPH)
        cls.artifact = RUNTIME.build_artifact(request())
        cls.document = cls.artifact["sceneDocuments"][0]

    def test_course_order_starts_with_introduction_then_existing_units(self) -> None:
        placements = []
        for placement in self.course_graph.objects(OFFERING, CD.hasUnitPlacement):
            position = int(next(self.course_graph.objects(placement, CD.position)))
            unit = next(self.course_graph.objects(placement, CD.placesLearningUnit))
            placements.append((position, placement, unit))
        self.assertEqual(
            [
                (10, PLACEMENT, UNIT),
                (
                    20,
                    EX["unit-placement-chemometrics-random-variables"],
                    EX["learning-unit-random-variables"],
                ),
                (
                    30,
                    EX["unit-placement-chemometrics-mean-values"],
                    EX["learning-unit-mean-values"],
                ),
                (
                    40,
                    EX["unit-placement-chemometrics-variance-dispersion"],
                    EX["learning-unit-variance-dispersion"],
                ),
            ],
            sorted(placements),
        )

    def test_introduction_learning_unit_has_exactly_five_focus_concepts(self) -> None:
        self.assertEqual(
            {Literal("Introduction", lang="en")},
            set(self.course_graph.objects(UNIT, SKOS.prefLabel)),
        )
        self.assertEqual(EXPECTED_TOPICS, set(self.course_graph.objects(UNIT, CD.hasFocusConcept)))
        for concept in EXPECTED_TOPICS:
            with self.subTest(concept=concept):
                self.assertEqual({CD.Concept}, set(self.content_graph.objects(concept, RDF.type)))
                self.assertEqual(1, len(set(self.content_graph.objects(concept, CD.hasDefinition))))
                self.assertEqual({Literal(True)}, set(self.content_graph.objects(concept, CD.authoredResource)))

    def test_manager_approved_intro_bodies_are_exact(self) -> None:
        expected = {
            EX["chemometrics-course-overview-note"]:
                "Chemometrics and Applied Statistics connects statistical reasoning, quantitative data analysis and modeling with problems from analytical chemistry. The course emphasizes understanding what a method measures, the assumptions behind it, how results are interpreted, and how calculations can be reproduced.",
            EX["attribution-chemometrics-gerrit-renner"]:
                "Gerrit Renner — Analytical Data Science, Instrumental Analytical Chemistry, University of Duisburg-Essen",
            EX["chemometrics-lecturer-context-note"]:
                "Teaching and research connect chemometrics, analytical data science and instrumental analytical chemistry, with a focus on processing and interpreting complex analytical data.",
            EX["exercise-chemometrics-introduction-round"]:
                "Briefly introduce yourself: your study programme or scientific background, your previous experience with statistics or chemometrics, your experience with R or other data-analysis tools, and one thing you would like to take away from this course.",
        }
        for resource, body in expected.items():
            with self.subTest(resource=resource):
                self.assertEqual(
                    {Literal(body, lang="en")},
                    set(self.content_graph.objects(resource, CD.body)),
                )
                self.assertEqual(
                    {Literal(True)},
                    set(self.content_graph.objects(resource, CD.authoredResource)),
                )

        self.assertEqual(
            {CD.Attribution},
            set(self.content_graph.objects(EX["attribution-chemometrics-gerrit-renner"], RDF.type)),
        )
        self.assertEqual(
            {CD.Exercise},
            set(self.content_graph.objects(EX["exercise-chemometrics-introduction-round"], RDF.type)),
        )

    def test_course_format_definition_list_is_exact_and_contiguous(self) -> None:
        owner = EX["chemometrics-course-format-list"]
        expected = (
            (
                "Lecture",
                "Concepts, assumptions, derivations, worked examples and interpretation.",
            ),
            (
                "Tutorial",
                "Guided exercises, calculations, discussion of solutions and transfer to analytical-data problems.",
            ),
            (
                "Reproducible computation",
                "Selected exercises use code examples where this helps make calculations transparent and reproducible.",
            ),
            (
                "Questions and discussion",
                "Use the tutorial to test reasoning, compare approaches and resolve open questions from the lecture.",
            ),
        )
        entries = sorted(
            self.content_graph.objects(owner, CD.hasDefinitionListEntry),
            key=lambda entry: int(next(self.content_graph.objects(entry, CD.position))),
        )
        self.assertEqual(4, len(entries))
        for position, (entry, (term, description)) in enumerate(zip(entries, expected, strict=True), start=1):
            self.assertEqual({Literal(position)}, set(self.content_graph.objects(entry, CD.position)))
            self.assertEqual({Literal(term, lang="en")}, set(self.content_graph.objects(entry, SKOS.prefLabel)))
            self.assertEqual({Literal(description, lang="en")}, set(self.content_graph.objects(entry, CD.body)))

    def test_course_roadmap_definition_list_is_exact_and_excludes_non_linear_regression(self) -> None:
        owner = EX["chemometrics-course-roadmap-list"]
        expected = (
            ("Statistical foundations", "Random variables, mean values, variance and dispersion, quantiles, distributions and moments."),
            ("Statistical inference", "Hypothesis testing, t-tests and analysis of variance."),
            ("Regression and uncertainty", "Linear regression, model assessment, measurement uncertainty, confidence/prediction and validation."),
            ("Design of experiments", "Full-factorial and advanced experimental designs, effects, interactions and optimization."),
            ("Multivariate analysis", "Distance and similarity, clustering, principal-component analysis and dimensionality reduction."),
            ("Machine learning", "Prediction and classification, trees/random forests, validation and model interpretation."),
        )
        entries = sorted(
            self.content_graph.objects(owner, CD.hasDefinitionListEntry),
            key=lambda entry: int(next(self.content_graph.objects(entry, CD.position))),
        )
        self.assertEqual(6, len(entries))
        bodies = []
        for position, (entry, (term, description)) in enumerate(zip(entries, expected, strict=True), start=1):
            self.assertEqual({Literal(position)}, set(self.content_graph.objects(entry, CD.position)))
            self.assertEqual({Literal(term, lang="en")}, set(self.content_graph.objects(entry, SKOS.prefLabel)))
            self.assertEqual({Literal(description, lang="en")}, set(self.content_graph.objects(entry, CD.body)))
            bodies.append(description)
        self.assertNotIn("Non-linear Regression", " ".join(bodies))
        self.assertNotIn("non-linear regression", " ".join(bodies).lower())

    def test_exact_five_step_path_uses_exact_resources_and_scenes(self) -> None:
        self.assertEqual({PATH}, set(self.path_graph.subjects(RDF.type, CD.LearningPath)))
        self.assertEqual({UNIT}, set(self.path_graph.objects(PATH, CD.forLearningUnit)))
        self.assertEqual(EXPECTED_TOPICS, set(self.path_graph.objects(PATH, CD.forTopic)))
        self.assertEqual(set(EXPECTED_STEP_MATRIX), set(self.path_graph.objects(PATH, CD.hasStep)))
        positions = []
        for step, (position, resources, scene) in EXPECTED_STEP_MATRIX.items():
            with self.subTest(step=step):
                self.assertEqual({Literal(position)}, set(self.path_graph.objects(step, CD.position)))
                self.assertEqual(resources, set(self.path_graph.objects(step, CD.usesResource)))
                self.assertEqual({scene}, set(self.path_graph.objects(step, CD.usesScene)))
                positions.append(position)
        self.assertEqual([1, 2, 3, 4, 5], sorted(positions))

    def test_scene_graph_matches_exact_five_scene_role_selector_matrix(self) -> None:
        self.assertEqual(
            set(EXPECTED_SCENE_MATRIX),
            set(self.scene_graph.subjects(RDF.type, CD.SceneDefinition)),
        )
        for scene, (focus, items) in EXPECTED_SCENE_MATRIX.items():
            with self.subTest(scene=scene):
                self.assertEqual({focus}, set(self.scene_graph.objects(scene, CD.focusConcept)))
                self.assertEqual(
                    {item[0] for item in items},
                    set(self.scene_graph.objects(scene, CD.hasSceneItem)),
                )
                for item, position, resource, role, selector in items:
                    self.assertEqual({Literal(position)}, set(self.scene_graph.objects(item, CD.position)))
                    self.assertEqual({resource}, set(self.scene_graph.objects(item, CD.selectsResource)))
                    self.assertEqual({role}, set(self.scene_graph.objects(item, CD.communicativeRole)))
                    self.assertEqual({Literal(selector)}, set(self.scene_graph.objects(item, CD.selectionPath)))
                    self.assertEqual({Literal("en")}, set(self.scene_graph.objects(item, CD.language)))

    def test_course_path_selection_resolves_introduction_exactly(self) -> None:
        selection = select_course_unit_path(self.dataset, request())
        self.assertEqual(CoursePathReference(str(PATH), str(PATH_GRAPH)), selection.path)

    def test_runtime_compiles_five_ordered_generic_intro_scenes(self) -> None:
        self.assertEqual(str(PATH).replace(str(EX), "ex:"), self.document["sourcePathId"])
        self.assertEqual(
            [
                "ex:scene-chemometrics-introduction-overview--scene",
                "ex:scene-chemometrics-introduction-lecturer--scene",
                "ex:scene-chemometrics-introduction-format--scene",
                "ex:scene-chemometrics-introduction-roadmap--scene",
                "ex:scene-chemometrics-introduction-round--scene",
            ],
            [scene["id"] for scene in self.document["scenes"]],
        )
        self.assertEqual(
            [
                ["prose", "prose"],
                ["prose", "prose", "prose"],
                ["prose", "definition-list"],
                ["prose", "definition-list"],
                ["prose", "prompt"],
            ],
            [[block["kind"] for block in scene["blocks"]] for scene in self.document["scenes"]],
        )

        lecturer = self.document["scenes"][1]["blocks"][1]
        self.assertEqual("Gerrit Renner — Analytical Data Science, Instrumental Analytical Chemistry, University of Duisburg-Essen", lecturer["text"])
        self.assertEqual({"kind": "emphasize"}, lecturer["intent"])

        course_format = self.document["scenes"][2]["blocks"][1]
        self.assertEqual(
            ["Lecture", "Tutorial", "Reproducible computation", "Questions and discussion"],
            [entry["term"] for entry in course_format["entries"]],
        )

        roadmap = self.document["scenes"][3]["blocks"][1]
        self.assertEqual(
            ["Statistical foundations", "Statistical inference", "Regression and uncertainty", "Design of experiments", "Multivariate analysis", "Machine learning"],
            [entry["term"] for entry in roadmap["entries"]],
        )

        prompt = self.document["scenes"][4]["blocks"][1]
        self.assertEqual("free-text", prompt["responseMode"])
        self.assertEqual({"kind": "practice"}, prompt["intent"])

    def test_existing_three_subject_paths_remain_discoverable(self) -> None:
        expected = {
            EX["learning-unit-random-variables"]: EX["path-chemometrics-random-variables-lecture"],
            EX["learning-unit-mean-values"]: EX["path-chemometrics-mean-values-lecture"],
            EX["learning-unit-variance-dispersion"]: EX["path-chemometrics-variance-dispersion-lecture"],
        }
        for unit, path in expected.items():
            with self.subTest(unit=unit):
                self.assertEqual({path}, set(self.graph.subjects(CD.forLearningUnit, unit)))

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
