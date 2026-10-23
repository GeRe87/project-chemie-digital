"""Contract tests for the first semantics-first Level 4 teaching slice (Issue #288)."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import rdf_dataset as RDF_DATASET  # noqa: E402
import validate_semantics as VALIDATION  # noqa: E402
import generate_canonical_runtime as RUNTIME  # noqa: E402

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
GRAPH = "https://w3id.org/project-chemie-digital/graph/"
PATH_GRAPH = URIRef(GRAPH + "paths/chemometrics-level4-distribution-shape-lecture")
SCENES_GRAPH = URIRef(GRAPH + "scenes/chemometrics-level4-distribution-shape-lecture")
TEACHING_GRAPH = URIRef(GRAPH + "specifications/chemometrics-level4-teaching")
PATH = EX["path-chemometrics-level4-distribution-shape-lecture"]
UNIT = EX["learning-unit-quantiles-moments-shape"]
PLACEMENT = EX["unit-placement-chemometrics-quantiles-moments-shape"]
OFFERING = EX["teaching-offering-chemometrics-applied-statistics"]
SECTION = EX["offering-section-chemometrics-data-characterization"]
TOPICS = {
    "sample-quantile", "quantile-estimation-method", "empirical-cdf",
    "interquartile-range", "median-absolute-deviation", "potential-outlier",
    "empirical-central-moment", "skewness", "kurtosis", "sample-skewness",
    "sample-excess-kurtosis", "moment-estimation-convention",
}
SLUGS = (
    "title", "population-sample", "empirical-cdf", "type-7",
    "type-7-poll", "quantile-r", "iqr", "mad", "synthetic-qc",
    "outlier-poll", "moments", "skewness", "kurtosis", "shape-r", "takeaways",
)
POLL_SLUGS = ("type-7", "outlier")
CODE_SLUGS = ("quantile", "qc", "shape")


class Level4TeachingPathTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.union = VALIDATION.dataset_union(cls.dataset)
        cls.paths = cls.dataset.graph(PATH_GRAPH)
        cls.scenes = cls.dataset.graph(SCENES_GRAPH)
        cls.teaching = cls.dataset.graph(TEACHING_GRAPH)

    def test_fifth_learning_unit_is_placed_once_after_variance(self):
        self.assertEqual({Literal(50)}, set(self.union.objects(PLACEMENT, CD.position)))
        self.assertEqual({UNIT}, set(self.union.objects(PLACEMENT, CD.placesLearningUnit)))
        self.assertIn((OFFERING, CD.hasUnitPlacement, PLACEMENT), self.union)
        self.assertIn((SECTION, CD.groupsUnitPlacement, PLACEMENT), self.union)
        self.assertEqual({PATH}, set(self.union.subjects(CD.forLearningUnit, UNIT)))
        focus = set(self.union.objects(UNIT, CD.hasFocusConcept))
        self.assertEqual({EX[x] for x in TOPICS}, focus)
        self.assertEqual(focus, set(self.paths.objects(PATH, CD.forTopic)))

    def test_path_contains_exactly_fifteen_contiguous_single_scene_steps(self):
        self.assertEqual({PATH}, set(self.paths.subjects(RDF.type, CD.LearningPath)))
        steps = set(self.paths.objects(PATH, CD.hasStep))
        self.assertEqual(len(SLUGS), len(steps))
        for position, slug in enumerate(SLUGS, 1):
            step = EX["l4-step-" + slug]
            scene = EX["l4-scene-" + slug]
            self.assertIn(step, steps)
            self.assertEqual({Literal(position)}, set(self.paths.objects(step, CD.position)))
            self.assertEqual({scene}, set(self.paths.objects(step, CD.usesScene)))
            self.assertIn((scene, RDF.type, CD.SceneDefinition), self.scenes)
            resources = set(self.paths.objects(step, CD.usesResource))
            scene_items = set(self.scenes.objects(scene, CD.hasSceneItem))
            self.assertTrue(resources)
            self.assertTrue(scene_items)
            self.assertEqual(resources, {
                next(self.scenes.objects(item, CD.selectsResource)) for item in scene_items
            })
            self.assertEqual(list(range(1, len(scene_items) + 1)), sorted(
                int(next(self.scenes.objects(item, CD.position))) for item in scene_items
            ))
            for item in scene_items:
                selected = next(self.scenes.objects(item, CD.selectsResource))
                self.assertIn(Literal(True), set(self.union.objects(selected, CD.authoredResource)))
                self.assertIn(Literal(True), set(self.scenes.objects(item, CD.authoredResource)))

    def test_scene_graph_is_pure_selection_without_duplicate_scientific_content(self):
        for predicate in (CD.body, CD.latex, CD.code, CD.numericValue, CD.hasDefinition):
            self.assertEqual([], list(self.scenes.triples((None, predicate, None))))
        self.assertEqual([], list(self.paths.triples((None, RDF.type, CD.SceneDefinition))))
        self.assertEqual([], list(self.teaching.subjects(RDF.type, CD.Concept)))
        self.assertEqual([], list(self.teaching.subjects(RDF.type, CD.MathExpression)))
        self.assertEqual([], list(self.teaching.subjects(RDF.type, CD.Dataset)))
        self.assertEqual([], list(self.teaching.subjects(RDF.type, CD.Observation)))
        for source in self.teaching.subjects(RDF.type, CD.CodeExample):
            self.assertTrue(list(self.teaching.objects(source, CD.showsResource)))

    def test_narrative_heading_contract_and_qc_source_identity(self):
        # A scene heading must select either its focus concept or an authored
        # Interpretation. WorkedExample is not a permissible HeadingRole selector.
        for scene in self.scenes.subjects(RDF.type, CD.SceneDefinition):
            focus = next(self.scenes.objects(scene, CD.focusConcept))
            for item in self.scenes.objects(scene, CD.hasSceneItem):
                if (item, CD.communicativeRole, CD.HeadingRole) not in self.scenes:
                    continue
                selected = next(self.scenes.objects(item, CD.selectsResource))
                if selected != focus:
                    self.assertIn((selected, RDF.type, CD.Interpretation), self.union)
                    self.assertIn((selected, CD.authoredResource, Literal(True)), self.union)
                self.assertEqual({Literal("skos:prefLabel@en")},
                                 set(self.scenes.objects(item, CD.selectionPath)))
                self.assertEqual({Literal("en")}, set(self.scenes.objects(item, CD.language)))

        item = EX["l4-synthetic-qc-i1"]
        title = EX["l4-qc-scene-heading"]
        example = EX["l4-qc-example"]
        self.assertEqual({title}, set(self.scenes.objects(item, CD.selectsResource)))
        self.assertIn((title, RDF.type, CD.Interpretation), self.teaching)
        self.assertIn((title, CD.derivedFromResource, example), self.teaching)
        self.assertEqual({example},
                         set(self.scenes.objects(EX["l4-synthetic-qc-i2"], CD.selectsResource)))
        self.assertIn((example, RDF.type, CD.WorkedExample), self.union)
        step = EX["l4-step-synthetic-qc"]
        self.assertEqual(
            {title, example, EX["l4-task-qc"], EX["l4-code-qc"]},
            set(self.paths.objects(step, CD.usesResource)),
        )

    def test_all_scene_item_roles_match_canonical_resource_types_and_selectors(self):
        # Verify every scene, not just headings, before invoking the compiler:
        # cd:Correction is a valid scientific resource, but is not a StatementRole.
        allowed = {
            CD.StatementRole: (CD.Definition, CD.Interpretation, "cd:body"),
            CD.ExampleRole: (CD.WorkedExample, None, "cd:body"),
            CD.ExerciseRole: (CD.Exercise, None, "cd:body"),
            CD.FormulaRole: (CD.MathExpression, None, "cd:latex"),
            CD.CodeRole: (CD.CodeExample, None, "cd:hasCodeExample"),
            CD.PollRole: (CD.AudiencePoll, None, "cd:hasAudiencePoll"),
        }
        count = 0
        for scene in self.scenes.subjects(RDF.type, CD.SceneDefinition):
            focus = next(self.scenes.objects(scene, CD.focusConcept))
            for item in self.scenes.objects(scene, CD.hasSceneItem):
                count += 1
                resource = next(self.scenes.objects(item, CD.selectsResource))
                role = next(self.scenes.objects(item, CD.communicativeRole))
                selector = next(self.scenes.objects(item, CD.selectionPath))
                with self.subTest(item=item, resource=resource, role=role):
                    kinds = set(self.union.objects(resource, RDF.type))
                    if role == CD.HeadingRole:
                        self.assertEqual({Literal("skos:prefLabel@en")}, {selector})
                        self.assertTrue(
                            resource == focus or CD.Interpretation in kinds,
                            f"{resource} is neither scene focus nor narrative Interpretation",
                        )
                    else:
                        self.assertIn(role, allowed)
                        primary, alternative, expected_selector = allowed[role]
                        self.assertEqual(Literal(expected_selector), selector)
                        self.assertTrue(
                            primary in kinds or (alternative is not None and alternative in kinds),
                            f"{resource} has types {kinds}, incompatible with {role}",
                        )
        self.assertEqual(55, count)

    def test_summary_reuses_four_scientific_interpretations_without_copying_corrections(self):
        selected = [
            next(self.scenes.objects(EX[f"l4-takeaways-i{i}"], CD.selectsResource))
            for i in range(2, 6)
        ]
        expected = [
            EX["l4-interpretation-quartile-method"],
            EX["l4-interpretation-outlier-diagnosis"],
            EX["l4-interpretation-moment-sample-correction"],
            EX["l4-interpretation-kurtosis-limits"],
        ]
        self.assertEqual(expected, selected)
        for resource in selected:
            self.assertIn((resource, RDF.type, CD.Interpretation), self.union)
            self.assertTrue(list(self.union.objects(resource, CD.hasSource)))
            self.assertNotIn((resource, RDF.type, CD.Correction), self.union)
            self.assertEqual([], list(self.teaching.triples((resource, None, None))))
        step = EX["l4-step-takeaways"]
        self.assertEqual({EX["l4-lesson-takeaways"], *expected},
                         set(self.paths.objects(step, CD.usesResource)))

    def test_existing_level4_scientific_formulas_are_selected_by_identity(self):
        expected = {
            "l4-formula-empirical-cdf", "l4-formula-sample-quantile-type-1",
            "l4-formula-sample-quantile-type-7", "l4-formula-interquartile-range",
            "l4-formula-median-absolute-deviation", "l4-formula-normal-scaled-mad",
            "l4-formula-empirical-second-central-moment",
            "l4-formula-sample-skewness", "l4-formula-sample-excess-kurtosis",
        }
        actual = {
            str(resource).removeprefix(str(EX))
            for item in self.scenes.subjects(RDF.type, CD.SceneItem)
            if (item, CD.communicativeRole, CD.FormulaRole) in self.scenes
            for resource in self.scenes.objects(item, CD.selectsResource)
        }
        self.assertEqual(expected, actual)
        for item in self.scenes.subjects(CD.communicativeRole, CD.FormulaRole):
            self.assertEqual({Literal("cd:latex")}, set(self.scenes.objects(item, CD.selectionPath)))

    def test_polls_are_authored_single_choice_with_correct_licensed_answers(self):
        for slug in POLL_SLUGS:
            poll = EX["l4-poll-" + slug]
            self.assertIn((poll, RDF.type, CD.AudiencePoll), self.teaching)
            options = set(self.teaching.objects(poll, CD.hasPollOption))
            self.assertEqual(3, len(options))
            correct, = self.teaching.objects(poll, CD.correctPollOption)
            self.assertIn(correct, options)
            expected, = self.teaching.objects(poll, CD.hasExpectedResult)
            self.assertIn((expected, RDF.type, CD.ExpectedResult), self.teaching)
            self.assertTrue(list(self.teaching.objects(expected, CD.body)))
            for item in self.scenes.subjects(CD.selectsResource, poll):
                self.assertEqual({CD.PollRole}, set(self.scenes.objects(item, CD.communicativeRole)))
                self.assertEqual({Literal("cd:hasAudiencePoll")}, set(self.scenes.objects(item, CD.selectionPath)))
        self.assertEqual({EX["l4-poll-type-7-option-b"]},
                         set(self.teaching.objects(EX["l4-poll-type-7"], CD.correctPollOption)))
        self.assertEqual({EX["l4-poll-outlier-option-b"]},
                         set(self.teaching.objects(EX["l4-poll-outlier"], CD.correctPollOption)))

    def test_executable_r_exercises_have_expected_results_and_semantic_targets(self):
        for slug in CODE_SLUGS:
            task = EX["l4-task-" + slug]
            code = EX["l4-code-" + slug]
            expected = EX["l4-result-" + slug]
            self.assertIn((task, CD.hasCodeExample, code), self.teaching)
            self.assertIn((task, CD.hasExpectedResult, expected), self.teaching)
            self.assertIn((code, RDF.type, CD.CodeExample), self.teaching)
            self.assertEqual({Literal("r")}, set(self.teaching.objects(code, CD.programmingLanguage)))
            self.assertEqual({Literal(True)}, set(self.teaching.objects(code, CD.editable)))
            self.assertEqual({Literal(True)}, set(self.teaching.objects(code, CD.executable)))
            self.assertTrue(list(self.teaching.objects(code, CD.showsResource)))
            source = str(next(self.teaching.objects(code, CD.code)))
            self.assertNotIn("install.packages(", source)
            self.assertNotIn("library(", source)
            items = list(self.scenes.subjects(CD.selectsResource, code))
            self.assertEqual(1, len(items))
            self.assertEqual({CD.CodeRole}, set(self.scenes.objects(items[0], CD.communicativeRole)))
            self.assertEqual({Literal("cd:hasCodeExample")}, set(self.scenes.objects(items[0], CD.selectionPath)))
        qc = str(next(self.teaching.objects(EX["l4-code-qc"], CD.code)))
        self.assertIn("type = 7", qc)
        self.assertIn("mad(x, constant = 1)", qc)
        self.assertIn("mean((x - mean(x))^2)", qc)
        shape = str(next(self.teaching.objects(EX["l4-code-shape"], CD.code)))
        self.assertIn("NA_real_", shape)
        self.assertIn("m2 == 0", shape)

    def test_compiler_produces_ordered_scenes_with_polls_and_r_code(self):
        document = RUNTIME.compile_scene_document(
            self.dataset, RUNTIME.CoursePathReference(str(PATH), str(PATH_GRAPH))
        )
        self.assertEqual(len(SLUGS), len(document["scenes"]))
        self.assertEqual(
            ["ex:l4-scene-" + slug + "--scene" for slug in SLUGS],
            [scene["id"] for scene in document["scenes"]],
        )
        blocks = [block for scene in document["scenes"] for block in scene["blocks"]]
        authored_poll_blocks = [
            block for block in blocks
            if block["kind"] == "prompt" and block.get("responseMode") == "single-choice"
        ]
        authored_code_blocks = [block for block in blocks if block["kind"] == "code"]
        self.assertEqual(2, len(authored_poll_blocks))
        self.assertEqual(3, len(authored_code_blocks))
        for poll in authored_poll_blocks:
            self.assertEqual(3, len(poll["options"]))
            self.assertIn(poll["correctOptionId"], poll["optionIds"])
            self.assertTrue(poll["expectedResult"])
        for code in authored_code_blocks:
            self.assertEqual("r", code["language"])
            self.assertTrue(code["editable"])
            self.assertTrue(code["executable"])
        scene = next(x for x in document["scenes"] if x["id"] == "ex:l4-scene-iqr--scene")
        self.assertIn("IQR", " ".join(b.get("expression", "") for b in scene["blocks"]))

    def test_path_order_and_named_provenance_do_not_depend_on_trig_source_order(self):
        forward = RDF_DATASET.assemble_dataset(include_legacy=False)
        reverse = RDF_DATASET.assemble_dataset(
            include_legacy=False, trig_paths=tuple(reversed(RDF_DATASET.CANONICAL_TRIG))
        )
        def fingerprinted_scenes(dataset):
            doc = RUNTIME.compile_scene_document(
                dataset, RUNTIME.CoursePathReference(str(PATH), str(PATH_GRAPH))
            )
            return [(scene["id"], [b["id"] for b in scene["blocks"]]) for scene in doc["scenes"]]
        self.assertEqual(fingerprinted_scenes(forward), fingerprinted_scenes(reverse))
        self.assertEqual(RDF_DATASET.dataset_fingerprint(forward),
                         RDF_DATASET.dataset_fingerprint(reverse))

    def test_canonical_shacl_is_conformant(self):
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
