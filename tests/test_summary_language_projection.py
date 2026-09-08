from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from rdflib import DCTERMS, SKOS, Dataset, Literal, Namespace, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

RUNTIME_SPEC = importlib.util.spec_from_file_location(
    "generate_canonical_runtime", SCRIPTS / "generate_canonical_runtime.py"
)
assert RUNTIME_SPEC and RUNTIME_SPEC.loader
RUNTIME = importlib.util.module_from_spec(RUNTIME_SPEC)
RUNTIME_SPEC.loader.exec_module(RUNTIME)

DATASET_SPEC = importlib.util.spec_from_file_location("rdf_dataset", SCRIPTS / "rdf_dataset.py")
assert DATASET_SPEC and DATASET_SPEC.loader
RDF_DATASET = importlib.util.module_from_spec(DATASET_SPEC)
DATASET_SPEC.loader.exec_module(RDF_DATASET)

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
SCHEMA = Namespace("https://schema.org/")
MEAN_PATH = EX["path-chemometrics-mean-values-lecture"]
MEAN_PATH_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/paths/chemometrics-mean-values-lecture"
)

MEAN_OWNER_IDS = (
    "arithmetic-mean-applicability-interpretation",
    "def-expected-value",
    "sample-mean-estimator-interpretation",
    "def-law-of-large-numbers",
    "lln-not-standard-error-interpretation",
    "def-geometric-mean",
    "geometric-mean-applicability-interpretation",
    "def-harmonic-mean",
    "harmonic-mean-rate-interpretation",
    "def-median",
    "median-robustness-interpretation",
)


def mean_values_request():
    return RUNTIME.CourseUnitPathSelectionRequest(
        offering_id=str(EX["teaching-offering-chemometrics-applied-statistics"]),
        placement_id=str(EX["unit-placement-chemometrics-mean-values"]),
        unit_id=str(EX["learning-unit-mean-values"]),
        requested_path_id=str(MEAN_PATH),
        requested_path_graph_id=str(MEAN_PATH_GRAPH),
    )


def entity_map(artifact):
    return {entity["id"]: entity for entity in artifact["datasetSnapshot"]["entities"]}


class SummaryLanguageProjectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)

    def test_mean_values_path_language_is_english(self) -> None:
        selected = RUNTIME.select_course_unit_path(self.dataset, mean_values_request())
        self.assertEqual("en", RUNTIME.effective_path_language(self.dataset, selected.path))

    def test_all_keypoint_owner_detail_bodies_survive_english_snapshot_exactly(self) -> None:
        artifact = RUNTIME.build_artifact(mean_values_request())
        entities = entity_map(artifact)
        for owner_id in MEAN_OWNER_IDS:
            with self.subTest(owner=owner_id):
                expected = RUNTIME.literal(self.dataset, EX[owner_id], CD.body, "en")
                self.assertIsNotNone(expected)
                self.assertEqual(expected, entities[f"ex:{owner_id}"]["description"])

    def test_default_standard_deviation_projection_remains_german(self) -> None:
        selected = RUNTIME.select_course_unit_path(self.dataset, RUNTIME.default_selection_request())
        self.assertEqual("de", RUNTIME.effective_path_language(self.dataset, selected.path))
        artifact = RUNTIME.build_artifact()
        entities = entity_map(artifact)
        expected = RUNTIME.literal(self.dataset, EX["def-variance"], CD.body, "de")
        self.assertEqual(expected, entities["ex:def-variance"]["description"])
        self.assertEqual(9, len(artifact["sceneDocuments"][0]["scenes"]))

    def test_missing_requested_language_uses_deterministic_authored_fallback(self) -> None:
        dataset = Dataset()
        graph = dataset.graph(URIRef("urn:test:content"))
        resource = EX["fallback-definition"]
        graph.add((resource, RDF.type, CD.Definition))
        graph.add((resource, CD.body, Literal("Texte de repli", lang="fr")))
        first = RUNTIME.dataset_snapshot(dataset, "test", "en")
        second = RUNTIME.dataset_snapshot(dataset, "test", "en")
        self.assertEqual(first, second)
        entity = next(item for item in first["entities"] if item["id"] == "ex:fallback-definition")
        self.assertEqual("Texte de repli", entity["description"])

    def test_label_fallback_preserves_title_name_local_order_before_foreign_pref_label(self) -> None:
        dataset = Dataset()
        graph = dataset.graph(URIRef("urn:test:labels"))
        titled = EX["fallback-title"]
        named = EX["fallback-name"]
        local = EX["fallback-local"]
        for resource in (titled, named, local):
            graph.add((resource, RDF.type, CD.Definition))
            graph.add((resource, SKOS.prefLabel, Literal("Libellé étranger", lang="fr")))
        graph.add((titled, DCTERMS.title, Literal("Authored title")))
        graph.add((titled, SCHEMA.name, Literal("Schema name must not win")))
        graph.add((named, SCHEMA.name, Literal("Authored schema name")))

        snapshot = RUNTIME.dataset_snapshot(dataset, "test-label-order", "en")
        entities = {entity["id"]: entity for entity in snapshot["entities"]}
        self.assertEqual("Authored title", entities["ex:fallback-title"]["label"])
        self.assertEqual("Authored schema name", entities["ex:fallback-name"]["label"])
        self.assertEqual("fallback local", entities["ex:fallback-local"]["label"])

    def test_conflicting_explicit_path_languages_fail_closed(self) -> None:
        dataset = Dataset()
        graph_id = URIRef("urn:test:path-graph")
        graph = dataset.graph(graph_id)
        path = EX["path-language-conflict"]
        scene = EX["scene-language-conflict"]
        step = EX["step-language-conflict"]
        first_item = EX["item-language-en"]
        second_item = EX["item-language-de"]
        graph.add((path, RDF.type, CD.LearningPath))
        graph.add((path, CD.hasStep, step))
        graph.add((step, CD.position, Literal(1)))
        graph.add((step, CD.usesScene, scene))
        graph.add((scene, CD.hasSceneItem, first_item))
        graph.add((scene, CD.hasSceneItem, second_item))
        graph.add((first_item, CD.position, Literal(1)))
        graph.add((second_item, CD.position, Literal(2)))
        graph.add((first_item, CD.language, Literal("en")))
        graph.add((second_item, CD.language, Literal("de")))
        reference = RUNTIME.CoursePathReference(str(path), str(graph_id))
        with self.assertRaisesRegex(
            ValueError,
            r"Conflicting explicit cd:language values .*: de, en",
        ):
            RUNTIME.effective_path_language(dataset, reference)

    def test_identical_mean_values_input_serializes_deterministically(self) -> None:
        first = RUNTIME.canonical_json(RUNTIME.build_artifact(mean_values_request()))
        second = RUNTIME.canonical_json(RUNTIME.build_artifact(mean_values_request()))
        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
