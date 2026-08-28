from __future__ import annotations

import sys
import unittest
from pathlib import Path

from rdflib import RDF, Dataset, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

from course_path_selection import (  # noqa: E402
    CoursePathReference,
    CoursePathSelectionError,
    CoursePathSelectionErrorCode,
    CourseUnitPathSelectionRequest,
    select_course_unit_path,
)
from rdf_dataset import assemble_dataset  # noqa: E402

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
GRAPH = "https://w3id.org/project-chemie-digital/graph/"

OFFERING = f"{EX}teaching-offering-digital-chemistry"
PLACEMENT = f"{EX}unit-placement-standard-deviation"
UNIT = f"{EX}learning-unit-standard-deviation"
PATH = f"{EX}path-standard-deviation"
PATH_GRAPH = f"{GRAPH}paths/standard-deviation"
COURSE_GRAPH = f"{GRAPH}specifications/course-scale"
OTHER_UNIT = f"{EX}learning-unit-other"
OTHER_PATH = f"{EX}path-other"
OTHER_PATH_GRAPH = f"{GRAPH}paths/other"
SECOND_PATH = f"{EX}path-standard-deviation-review"
SECOND_PATH_GRAPH = f"{GRAPH}paths/standard-deviation-review"

TEACHING_OFFERING = URIRef(f"{CD}TeachingOffering")
LEARNING_PATH = URIRef(f"{CD}LearningPath")
HAS_UNIT_PLACEMENT = URIRef(f"{CD}hasUnitPlacement")
PLACES_LEARNING_UNIT = URIRef(f"{CD}placesLearningUnit")
FOR_LEARNING_UNIT = URIRef(f"{CD}forLearningUnit")


def canonical_dataset() -> Dataset:
    return assemble_dataset()


def default_request(
    *,
    offering_id: str = OFFERING,
    placement_id: str = PLACEMENT,
    unit_id: str = UNIT,
    requested_path_id: str | None = None,
    requested_path_graph_id: str | None = None,
) -> CourseUnitPathSelectionRequest:
    return CourseUnitPathSelectionRequest(
        offering_id=offering_id,
        placement_id=placement_id,
        unit_id=unit_id,
        requested_path_id=requested_path_id,
        requested_path_graph_id=requested_path_graph_id,
    )


def add_available_path(dataset: Dataset, path_id: str, graph_id: str, unit_id: str) -> None:
    graph = dataset.graph(URIRef(graph_id))
    path = URIRef(path_id)
    graph.add((path, RDF.type, LEARNING_PATH))
    graph.add((path, FOR_LEARNING_UNIT, URIRef(unit_id)))


class CoursePathSelectionTests(unittest.TestCase):
    def assert_selection_error(
        self,
        code: CoursePathSelectionErrorCode,
        request: CourseUnitPathSelectionRequest,
        dataset: Dataset | None = None,
    ) -> None:
        with self.assertRaises(CoursePathSelectionError) as raised:
            select_course_unit_path(dataset or canonical_dataset(), request)
        self.assertEqual(code, raised.exception.code)

    def test_current_standard_deviation_context_singleton_selects_path_and_graph(self) -> None:
        selection = select_course_unit_path(canonical_dataset(), default_request())
        self.assertEqual(
            CoursePathReference(PATH, PATH_GRAPH),
            selection.path,
        )
        self.assertEqual(OFFERING, selection.offering_id)
        self.assertEqual(PLACEMENT, selection.placement_id)
        self.assertEqual(UNIT, selection.unit_id)

    def test_explicit_exact_current_path_reference_succeeds(self) -> None:
        selection = select_course_unit_path(
            canonical_dataset(),
            default_request(requested_path_id=PATH, requested_path_graph_id=PATH_GRAPH),
        )
        self.assertEqual(CoursePathReference(PATH, PATH_GRAPH), selection.path)

    def test_unrelated_second_path_does_not_change_selected_unit_singleton(self) -> None:
        current = canonical_dataset()
        add_available_path(current, OTHER_PATH, OTHER_PATH_GRAPH, OTHER_UNIT)
        selection = select_course_unit_path(current, default_request())
        self.assertEqual(CoursePathReference(PATH, PATH_GRAPH), selection.path)

    def test_second_path_for_same_unit_is_ambiguous_without_explicit_selection(self) -> None:
        current = canonical_dataset()
        add_available_path(current, SECOND_PATH, SECOND_PATH_GRAPH, UNIT)
        self.assert_selection_error(
            CoursePathSelectionErrorCode.AMBIGUOUS_SELECTION,
            default_request(),
            current,
        )

    def test_second_path_for_same_unit_allows_exact_explicit_current_selection(self) -> None:
        current = canonical_dataset()
        add_available_path(current, SECOND_PATH, SECOND_PATH_GRAPH, UNIT)
        selection = select_course_unit_path(
            current,
            default_request(requested_path_id=PATH, requested_path_graph_id=PATH_GRAPH),
        )
        self.assertEqual(CoursePathReference(PATH, PATH_GRAPH), selection.path)

    def test_wrong_path_iri_fails_membership(self) -> None:
        self.assert_selection_error(
            CoursePathSelectionErrorCode.SELECTED_PATH_NOT_AVAILABLE,
            default_request(requested_path_id=SECOND_PATH, requested_path_graph_id=PATH_GRAPH),
        )

    def test_wrong_path_graph_fails_membership(self) -> None:
        self.assert_selection_error(
            CoursePathSelectionErrorCode.SELECTED_PATH_NOT_AVAILABLE,
            default_request(requested_path_id=PATH, requested_path_graph_id=SECOND_PATH_GRAPH),
        )

    def test_wrong_offering_fails_distinctly(self) -> None:
        self.assert_selection_error(
            CoursePathSelectionErrorCode.OFFERING_CONTEXT_NOT_FOUND,
            default_request(offering_id=f"{EX}missing-offering"),
        )

    def test_wrong_placement_fails_distinctly(self) -> None:
        self.assert_selection_error(
            CoursePathSelectionErrorCode.PLACEMENT_CONTEXT_NOT_FOUND,
            default_request(placement_id=f"{EX}missing-placement"),
        )

    def test_wrong_unit_fails_distinctly(self) -> None:
        self.assert_selection_error(
            CoursePathSelectionErrorCode.INCONSISTENT_UNIT_CONTEXT,
            default_request(unit_id=OTHER_UNIT),
        )

    def test_zero_available_paths_fails_explicitly(self) -> None:
        current = canonical_dataset()
        current.remove((URIRef(PATH), RDF.type, LEARNING_PATH, URIRef(PATH_GRAPH)))
        self.assert_selection_error(
            CoursePathSelectionErrorCode.NO_AVAILABLE_PATH,
            default_request(),
            current,
        )

    def test_incomplete_requested_path_pair_fails(self) -> None:
        self.assert_selection_error(
            CoursePathSelectionErrorCode.INVALID_IDENTITY_CONTEXT,
            default_request(requested_path_id=PATH),
        )
        self.assert_selection_error(
            CoursePathSelectionErrorCode.INVALID_IDENTITY_CONTEXT,
            default_request(requested_path_graph_id=PATH_GRAPH),
        )

    def test_non_http_identity_fails(self) -> None:
        self.assert_selection_error(
            CoursePathSelectionErrorCode.INVALID_IDENTITY_CONTEXT,
            default_request(offering_id="file:///tmp/course"),
        )

    def test_same_path_iri_in_two_named_graphs_is_not_a_singleton(self) -> None:
        current = canonical_dataset()
        add_available_path(current, PATH, SECOND_PATH_GRAPH, UNIT)
        self.assert_selection_error(
            CoursePathSelectionErrorCode.AMBIGUOUS_SELECTION,
            default_request(),
            current,
        )

    def test_selection_is_independent_of_rdf_insertion_order(self) -> None:
        rows = [
            (COURSE_GRAPH, URIRef(OFFERING), RDF.type, TEACHING_OFFERING),
            (COURSE_GRAPH, URIRef(OFFERING), HAS_UNIT_PLACEMENT, URIRef(PLACEMENT)),
            (COURSE_GRAPH, URIRef(PLACEMENT), PLACES_LEARNING_UNIT, URIRef(UNIT)),
            (PATH_GRAPH, URIRef(PATH), RDF.type, LEARNING_PATH),
            (PATH_GRAPH, URIRef(PATH), FOR_LEARNING_UNIT, URIRef(UNIT)),
        ]
        first = Dataset(default_union=False)
        second = Dataset(default_union=False)
        for graph_id, subject, predicate, obj in rows:
            first.graph(URIRef(graph_id)).add((subject, predicate, obj))
        for graph_id, subject, predicate, obj in reversed(rows):
            second.graph(URIRef(graph_id)).add((subject, predicate, obj))
        self.assertEqual(
            select_course_unit_path(first, default_request()),
            select_course_unit_path(second, default_request()),
        )

    def test_offering_defined_in_two_graphs_fails_without_graph_preference(self) -> None:
        current = canonical_dataset()
        second_course_graph = current.graph(URIRef(f"{GRAPH}specifications/course-scale-shadow"))
        second_course_graph.add((URIRef(OFFERING), RDF.type, TEACHING_OFFERING))
        self.assert_selection_error(
            CoursePathSelectionErrorCode.AMBIGUOUS_OFFERING_CONTEXT,
            default_request(),
            current,
        )


if __name__ == "__main__":
    unittest.main()
