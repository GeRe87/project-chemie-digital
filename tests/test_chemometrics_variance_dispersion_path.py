from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, URIRef

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

from course_path_selection import (  # noqa: E402
    CoursePathReference,
    CourseUnitPathSelectionRequest,
    select_course_unit_path,
)

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
PATH = EX["path-chemometrics-variance-dispersion-lecture"]
PATH_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/paths/chemometrics-variance-dispersion-lecture"
)
COURSE_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/specifications/course-scale"
)

EXPECTED_TOPICS = {
    EX["variance"],
    EX["standard-deviation"],
    EX["standard-error"],
    EX["relative-standard-deviation"],
}

class ChemometricsVarianceDispersionPathTests(unittest.TestCase):
    expected_scenes = """scene-chemometrics-variance-dispersion-title scene-vr02 scene-vr03 scene-vr04 scene-vr05
    scene-cv-zero scene-vr07 scene-vr08 scene-cv-compare scene-bf-e-rules scene-cv-rules scene-lake
    scene-cv-question scene-vb-mc scene-vs-mc scene-cv-algebra scene-cv-expect scene-cv-helper
    scene-cv-bias scene-cv-correction scene-cv-practical scene-vm-recap scene-vr19 scene-vr21
    scene-vr22 scene-vr23 scene-vr24 scene-vr25 scene-vr26 scene-vr27 scene-vb-quality scene-vr29
    scene-vr30 scene-vr31 scene-uq-components scene-uq-component-sd scene-uq-matrix scene-vr32
    scene-vr33 scene-vr34 scene-vr35 scene-vr36 scene-vr37 scene-se-return scene-se-sem
    scene-se-rate scene-se-example scene-vr39""".split()

    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.path_graph = cls.dataset.graph(PATH_GRAPH)
        cls.course_graph = cls.dataset.graph(COURSE_GRAPH)
        cls.steps = sorted(cls.path_graph.objects(PATH, CD.hasStep),key=lambda step:int(next(cls.path_graph.objects(step,CD.position))))

    def test_exact_path_identity_and_same_graph_course_context(self) -> None:
        self.assertEqual({PATH}, set(self.path_graph.subjects(RDF.type, CD.LearningPath)))
        self.assertEqual(
            {EX["learning-unit-variance-dispersion"]},
            set(self.path_graph.objects(PATH, CD.forLearningUnit)),
        )
        self.assertEqual(
            {Literal("Chemometrics Variance and Dispersion lecture path", lang="en")},
            set(self.path_graph.objects(PATH, Namespace("http://www.w3.org/2004/02/skos/core#").prefLabel)),
        )
        self.assertEqual(
            {Literal(True)},
            set(self.path_graph.objects(PATH, CD.authoredResource)),
        )

    def test_topics_are_exactly_the_unordered_learning_unit_focus_set(self) -> None:
        path_topics = set(self.path_graph.objects(PATH, CD.forTopic))
        unit_topics = set(
            self.course_graph.objects(
                EX["learning-unit-variance-dispersion"],
                CD.hasFocusConcept,
            )
        )
        self.assertEqual(EXPECTED_TOPICS, path_topics)
        self.assertEqual(EXPECTED_TOPICS, unit_topics)
        self.assertEqual(unit_topics, path_topics)

    def test_path_has_48_reviewed_steps_with_contiguous_positions(self) -> None:
        steps = set(self.path_graph.objects(PATH, CD.hasStep))
        self.assertEqual(48, len(steps))

        positions = []
        for expected_position, step in enumerate(self.steps,1):
            with self.subTest(step=step):
                self.assertEqual({CD.PathStep}, set(self.path_graph.objects(step, RDF.type)))
                position_values = set(self.path_graph.objects(step, CD.position))
                self.assertEqual({Literal(expected_position)}, position_values)
                positions.extend(int(value) for value in position_values)

        self.assertEqual(list(range(1, 49)), sorted(positions))
        self.assertEqual(48, len(set(positions)))

    def test_path_resources_and_scene_selections_are_canonical_authored_resources(self) -> None:
        for step in self.steps:
            with self.subTest(step=step):
                scene=next(self.path_graph.objects(step,CD.usesScene))
                expected_resources={resource for item in self.graph.objects(scene,CD.hasSceneItem) for resource in self.graph.objects(item,CD.selectsResource)}
                self.assertTrue(expected_resources)
                path_resources=set(self.path_graph.objects(step,CD.usesResource))
                self.assertTrue(path_resources)
                # Path resource sets describe the topic; scene items may select
                # supporting calculations and updated explanations independently.
                for resource in expected_resources | path_resources:
                    self.assertTrue(
                        any(self.graph.triples((resource, None, None))),
                        f"Reviewed canonical resource is absent: {resource}",
                    )
                    self.assertIn(
                        Literal(True),
                        set(self.graph.objects(resource, CD.authoredResource)),
                    )

    def test_path_graph_authors_only_path_and_path_step_identities(self) -> None:
        typed = {
            (subject, object_type)
            for subject, _predicate, object_type in self.path_graph.triples((None, RDF.type, None))
        }
        expected_typed = {(PATH, CD.LearningPath)} | {
            (step, CD.PathStep) for step in self.steps
        }
        self.assertTrue(expected_typed <= typed)
        self.assertTrue(all(kind in {CD.LearningPath,CD.PathStep} for _,kind in typed))
        self.assertEqual([], list(self.path_graph.triples((None, CD.body, None))))

    def test_path_resolves_exactly_the_reviewed_scene_order_without_inline_scenes(self) -> None:
        self.assertEqual([EX[name] for name in self.expected_scenes],[next(self.path_graph.objects(step,CD.usesScene)) for step in self.steps])
        for step in self.steps:
            self.assertEqual(1,len(set(self.path_graph.objects(step,CD.usesScene))))
        self.assertEqual([], list(self.path_graph.triples((None, RDF.type, CD.SceneDefinition))))
        self.assertEqual([], list(self.path_graph.triples((None, RDF.type, CD.SceneItem))))

    def test_course_discovery_exposes_exact_variance_dispersion_path_reference(self) -> None:
        selection = select_course_unit_path(
            self.dataset,
            CourseUnitPathSelectionRequest(
                offering_id=str(EX["teaching-offering-chemometrics-applied-statistics"]),
                placement_id=str(EX["unit-placement-chemometrics-variance-dispersion"]),
                unit_id=str(EX["learning-unit-variance-dispersion"]),
            ),
        )
        self.assertEqual(
            CoursePathReference(str(PATH), str(PATH_GRAPH)),
            selection.path,
        )

    def test_random_variables_and_mean_values_paths_and_scenes_remain_present(self) -> None:
        for unit, path, expected_step_count in (
            (
                EX["learning-unit-random-variables"],
                EX["path-chemometrics-random-variables-lecture"],
                12,
            ),
            (
                EX["learning-unit-mean-values"],
                EX["path-chemometrics-mean-values-lecture"],
                35,
            ),
        ):
            with self.subTest(unit=unit):
                self.assertEqual(
                    {path},
                    set(self.graph.subjects(CD.forLearningUnit, unit)),
                )
                steps = set(self.graph.objects(path, CD.hasStep))
                self.assertEqual(expected_step_count, len(steps))
                for step in steps:
                    self.assertEqual(1, len(set(self.graph.objects(step, CD.usesScene))))

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
