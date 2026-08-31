from __future__ import annotations

import sys
import unittest
from pathlib import Path

from rdflib import DCTERMS, RDF, SKOS, XSD, Dataset, Literal, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

import generate_canonical_runtime as RUNTIME  # noqa: E402
from rdf_dataset import assemble_dataset, dataset_fingerprint  # noqa: E402
from teaching_offering_runtime import project_teaching_offering_runtime_document  # noqa: E402

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
GRAPH = "https://w3id.org/project-chemie-digital/graph/"

OFFERING = f"{EX}teaching-offering-digital-chemistry"
PLACEMENT = f"{EX}unit-placement-standard-deviation"
UNIT = f"{EX}learning-unit-standard-deviation"
PATH = f"{EX}path-standard-deviation"
COURSE_GRAPH = f"{GRAPH}specifications/course-scale"
PATH_GRAPH = f"{GRAPH}paths/standard-deviation"

TEACHING_OFFERING = URIRef(f"{CD}TeachingOffering")
LEARNING_PATH = URIRef(f"{CD}LearningPath")
HAS_UNIT_PLACEMENT = URIRef(f"{CD}hasUnitPlacement")
PLACES_LEARNING_UNIT = URIRef(f"{CD}placesLearningUnit")
POSITION = URIRef(f"{CD}position")
FOR_LEARNING_UNIT = URIRef(f"{CD}forLearningUnit")

TEST_FINGERPRINT = "sha256:" + "0" * 64


def project(dataset: Dataset, offering_id: str = OFFERING) -> dict[str, object]:
    return project_teaching_offering_runtime_document(dataset, offering_id, TEST_FINGERPRINT)


def add_offering(dataset: Dataset, *, offering_id: str = OFFERING) -> object:
    graph = dataset.graph(URIRef(COURSE_GRAPH))
    graph.add((URIRef(offering_id), RDF.type, TEACHING_OFFERING))
    return graph


def add_placement(
    dataset: Dataset,
    placement_id: str,
    unit_id: str,
    position: Literal,
    *,
    offering_id: str = OFFERING,
) -> None:
    graph = dataset.graph(URIRef(COURSE_GRAPH))
    graph.add((URIRef(offering_id), HAS_UNIT_PLACEMENT, URIRef(placement_id)))
    graph.add((URIRef(placement_id), POSITION, position))
    graph.add((URIRef(placement_id), PLACES_LEARNING_UNIT, URIRef(unit_id)))


def add_path(dataset: Dataset, path_id: str, path_graph_id: str, unit_id: str) -> object:
    graph = dataset.graph(URIRef(path_graph_id))
    graph.add((URIRef(path_id), RDF.type, LEARNING_PATH))
    graph.add((URIRef(path_id), FOR_LEARNING_UNIT, URIRef(unit_id)))
    return graph


class TeachingOfferingRuntimeTests(unittest.TestCase):
    def test_current_standard_deviation_document_preserves_authored_course_metadata(self) -> None:
        current = assemble_dataset()
        identity = f"sha256:{dataset_fingerprint(current)}"
        document = project_teaching_offering_runtime_document(current, OFFERING, identity)

        self.assertEqual("1.0", document["version"])
        self.assertEqual(identity, document["datasetFingerprint"])
        self.assertEqual(
            {
                "id": OFFERING,
                "graphId": COURSE_GRAPH,
                "labels": [
                    {
                        "value": "Digitalisierung in der Chemie: Datenmanagement, Prozesse, KI",
                        "language": "de",
                    }
                ],
                "descriptions": [],
            },
            document["offering"],
        )
        self.assertEqual(
            [{"id": PLACEMENT, "position": 10, "unitId": UNIT}],
            document["placements"],
        )
        self.assertEqual(1, len(document["units"]))
        unit = document["units"][0]
        self.assertEqual(UNIT, unit["id"])
        self.assertEqual([{"value": "Standardabweichung", "language": "de"}], unit["labels"])
        self.assertEqual([], unit["descriptions"])
        self.assertEqual(
            [
                {
                    "id": PATH,
                    "graphId": PATH_GRAPH,
                    "labels": [],
                    "descriptions": [],
                }
            ],
            unit["paths"],
        )

    def test_placement_order_is_independent_of_rdf_insertion_order(self) -> None:
        placement_a = f"{EX}placement-a"
        placement_b = f"{EX}placement-b"
        unit_a = f"{EX}unit-a"
        unit_b = f"{EX}unit-b"
        rows = [
            (URIRef(OFFERING), RDF.type, TEACHING_OFFERING),
            (URIRef(OFFERING), HAS_UNIT_PLACEMENT, URIRef(placement_a)),
            (URIRef(placement_a), POSITION, Literal(20, datatype=XSD.integer)),
            (URIRef(placement_a), PLACES_LEARNING_UNIT, URIRef(unit_a)),
            (URIRef(OFFERING), HAS_UNIT_PLACEMENT, URIRef(placement_b)),
            (URIRef(placement_b), POSITION, Literal(10, datatype=XSD.integer)),
            (URIRef(placement_b), PLACES_LEARNING_UNIT, URIRef(unit_b)),
        ]
        first = Dataset(default_union=False)
        second = Dataset(default_union=False)
        for row in rows:
            first.graph(URIRef(COURSE_GRAPH)).add(row)
        for row in reversed(rows):
            second.graph(URIRef(COURSE_GRAPH)).add(row)

        first_document = project(first)
        second_document = project(second)
        self.assertEqual(first_document, second_document)
        self.assertEqual(
            [placement_b, placement_a],
            [item["id"] for item in first_document["placements"]],
        )

    def test_reused_learning_unit_is_normalized_once(self) -> None:
        current = Dataset(default_union=False)
        add_offering(current)
        shared_unit = f"{EX}unit-shared"
        add_placement(
            current,
            f"{EX}placement-a",
            shared_unit,
            Literal(10, datatype=XSD.integer),
        )
        add_placement(
            current,
            f"{EX}placement-b",
            shared_unit,
            Literal(20, datatype=XSD.integer),
        )
        current.graph(URIRef(COURSE_GRAPH)).add(
            (URIRef(shared_unit), SKOS.prefLabel, Literal("Gemeinsame Einheit", lang="de"))
        )

        document = project(current)
        self.assertEqual(2, len(document["placements"]))
        self.assertEqual(1, len(document["units"]))
        self.assertEqual(shared_unit, document["units"][0]["id"])

    def test_zero_path_unit_serializes_empty_paths(self) -> None:
        current = Dataset(default_union=False)
        add_offering(current)
        unit_id = f"{EX}unit-without-path"
        add_placement(
            current,
            f"{EX}placement-without-path",
            unit_id,
            Literal(10, datatype=XSD.integer),
        )
        document = project(current)
        self.assertEqual([], document["units"][0]["paths"])

    def test_same_path_iri_in_two_graphs_remains_two_graph_specific_references(self) -> None:
        current = Dataset(default_union=False)
        add_offering(current)
        unit_id = f"{EX}unit-multi-path-graph"
        path_id = f"{EX}path-shared-iri"
        graph_a = f"{GRAPH}paths/a"
        graph_b = f"{GRAPH}paths/b"
        add_placement(
            current,
            f"{EX}placement-multi-path-graph",
            unit_id,
            Literal(10, datatype=XSD.integer),
        )
        path_graph_a = add_path(current, path_id, graph_a, unit_id)
        path_graph_b = add_path(current, path_id, graph_b, unit_id)
        path_graph_a.add((URIRef(path_id), SKOS.prefLabel, Literal("Pfad A", lang="de")))
        path_graph_b.add((URIRef(path_id), SKOS.prefLabel, Literal("Path B", lang="en")))

        paths = project(current)["units"][0]["paths"]
        self.assertEqual(
            [
                {
                    "id": path_id,
                    "graphId": graph_a,
                    "labels": [{"value": "Pfad A", "language": "de"}],
                    "descriptions": [],
                },
                {
                    "id": path_id,
                    "graphId": graph_b,
                    "labels": [{"value": "Path B", "language": "en"}],
                    "descriptions": [],
                },
            ],
            paths,
        )

    def test_multilingual_and_language_neutral_metadata_is_preserved_deterministically(self) -> None:
        current = Dataset(default_union=False)
        graph = add_offering(current)
        unit_id = f"{EX}unit-language-test"
        add_placement(
            current,
            f"{EX}placement-language-test",
            unit_id,
            Literal(10, datatype=XSD.integer),
        )
        graph.add((URIRef(OFFERING), SKOS.prefLabel, Literal("Neutral label")))
        graph.add((URIRef(OFFERING), SKOS.prefLabel, Literal("Deutsches Angebot", lang="de")))
        graph.add((URIRef(OFFERING), SKOS.prefLabel, Literal("English offering", lang="en")))
        graph.add((URIRef(OFFERING), DCTERMS.description, Literal("Beschreibung", lang="de")))
        graph.add((URIRef(OFFERING), DCTERMS.description, Literal("Description", lang="en")))
        graph.add((URIRef(unit_id), SKOS.prefLabel, Literal("Unit", lang="en")))
        graph.add((URIRef(unit_id), SKOS.prefLabel, Literal("Einheit", lang="de")))

        document = project(current)
        self.assertEqual(
            [
                {"value": "Neutral label"},
                {"value": "Deutsches Angebot", "language": "de"},
                {"value": "English offering", "language": "en"},
            ],
            document["offering"]["labels"],
        )
        self.assertEqual(
            [
                {"value": "Beschreibung", "language": "de"},
                {"value": "Description", "language": "en"},
            ],
            document["offering"]["descriptions"],
        )
        self.assertEqual(
            [
                {"value": "Einheit", "language": "de"},
                {"value": "Unit", "language": "en"},
            ],
            document["units"][0]["labels"],
        )

    def test_duplicate_placement_positions_fail_closed(self) -> None:
        current = Dataset(default_union=False)
        add_offering(current)
        add_placement(current, f"{EX}placement-a", f"{EX}unit-a", Literal(10, datatype=XSD.integer))
        add_placement(current, f"{EX}placement-b", f"{EX}unit-b", Literal(10, datatype=XSD.integer))
        with self.assertRaisesRegex(ValueError, "duplicate UnitPlacement position"):
            project(current)

    def test_non_positive_or_non_integer_placement_position_fails_closed(self) -> None:
        for value in (
            Literal(0, datatype=XSD.integer),
            Literal("1.5", datatype=XSD.decimal),
        ):
            with self.subTest(value=value):
                current = Dataset(default_union=False)
                add_offering(current)
                add_placement(current, f"{EX}placement-invalid", f"{EX}unit-invalid", value)
                with self.assertRaisesRegex(ValueError, "position must be a positive integer"):
                    project(current)

    def test_inconsistent_placement_unit_evidence_fails_closed(self) -> None:
        current = Dataset(default_union=False)
        add_offering(current)
        placement_id = f"{EX}placement-inconsistent"
        add_placement(
            current,
            placement_id,
            f"{EX}unit-a",
            Literal(10, datatype=XSD.integer),
        )
        current.graph(URIRef(COURSE_GRAPH)).add(
            (URIRef(placement_id), PLACES_LEARNING_UNIT, URIRef(f"{EX}unit-b"))
        )
        with self.assertRaisesRegex(ValueError, "exactly one LearningUnit"):
            project(current)

    def test_root_and_teaching_offering_document_share_exact_dataset_fingerprint(self) -> None:
        artifact = RUNTIME.build_artifact()
        self.assertEqual("1.0", artifact["artifactVersion"])
        self.assertEqual(1, len(artifact["teachingOfferingDocuments"]))
        self.assertEqual(
            artifact["datasetFingerprint"],
            artifact["teachingOfferingDocuments"][0]["datasetFingerprint"],
        )

    def test_additive_course_document_does_not_change_scene_document_or_static_fallback(self) -> None:
        artifact = RUNTIME.build_artifact()
        current = RUNTIME.assemble_dataset()
        selection = RUNTIME.select_course_unit_path(current, RUNTIME.default_selection_request())
        expected_scene_document = RUNTIME.compile_scene_document(current, selection.path)
        self.assertEqual(expected_scene_document, artifact["sceneDocuments"][0])

        legacy_shape = {
            key: value
            for key, value in artifact.items()
            if key != "teachingOfferingDocuments"
        }
        self.assertEqual(RUNTIME.static_fallback(legacy_shape), RUNTIME.static_fallback(artifact))


if __name__ == "__main__":
    unittest.main()
