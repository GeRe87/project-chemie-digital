#!/usr/bin/env python3
"""Renderer-neutral course/unit/path selection over one immutable RDF Dataset snapshot."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from urllib.parse import urlsplit

from rdflib import RDF, Dataset, URIRef

CD = "https://w3id.org/project-chemie-digital/ontology/"


def iri(local: str) -> URIRef:
    return URIRef(CD + local)


class CoursePathSelectionErrorCode(str, Enum):
    """Stable semantic failure categories for course/unit/path selection."""

    INVALID_IDENTITY_CONTEXT = "invalid_identity_context"
    OFFERING_CONTEXT_NOT_FOUND = "offering_context_not_found"
    AMBIGUOUS_OFFERING_CONTEXT = "ambiguous_offering_context"
    PLACEMENT_CONTEXT_NOT_FOUND = "placement_context_not_found"
    INCONSISTENT_UNIT_CONTEXT = "inconsistent_unit_context"
    NO_AVAILABLE_PATH = "no_available_path"
    SELECTED_PATH_NOT_AVAILABLE = "selected_path_not_available"
    AMBIGUOUS_SELECTION = "ambiguous_selection"


class CoursePathSelectionError(ValueError):
    """Selector failure carrying a machine-testable stable error code."""

    def __init__(self, code: CoursePathSelectionErrorCode, message: str) -> None:
        super().__init__(message)
        self.code = code


@dataclass(frozen=True, order=True)
class CoursePathReference:
    path_id: str
    path_graph_id: str


@dataclass(frozen=True)
class CourseUnitPathSelectionRequest:
    offering_id: str
    placement_id: str
    unit_id: str
    requested_path_id: str | None = None
    requested_path_graph_id: str | None = None


@dataclass(frozen=True)
class CourseUnitPathSelection:
    offering_id: str
    placement_id: str
    unit_id: str
    path: CoursePathReference


def _valid_http_iri(value: str) -> bool:
    if not isinstance(value, str) or not value or any(character.isspace() for character in value):
        return False
    try:
        parsed = urlsplit(value)
    except ValueError:
        return False
    return (
        parsed.scheme in {"http", "https"}
        and bool(parsed.netloc)
        and parsed.hostname is not None
        and parsed.username is None
        and parsed.password is None
    )


def _require_http_iri(name: str, value: str) -> URIRef:
    if not _valid_http_iri(value):
        raise CoursePathSelectionError(
            CoursePathSelectionErrorCode.INVALID_IDENTITY_CONTEXT,
            f"{name} must be an absolute HTTP(S) IRI",
        )
    return URIRef(value)


def _graph_ids_for(
    dataset: Dataset,
    subject: URIRef,
    predicate: URIRef,
    obj: URIRef,
) -> tuple[URIRef, ...]:
    graph_ids = {
        graph_id
        for _subject, _predicate, _obj, graph_id in dataset.quads((subject, predicate, obj, None))
        if isinstance(graph_id, URIRef)
    }
    return tuple(sorted(graph_ids, key=str))


def _course_graph(dataset: Dataset, offering: URIRef) -> URIRef:
    graphs = _graph_ids_for(dataset, offering, RDF.type, iri("TeachingOffering"))
    if not graphs:
        raise CoursePathSelectionError(
            CoursePathSelectionErrorCode.OFFERING_CONTEXT_NOT_FOUND,
            f"TeachingOffering not found: {offering}",
        )
    if len(graphs) != 1:
        raise CoursePathSelectionError(
            CoursePathSelectionErrorCode.AMBIGUOUS_OFFERING_CONTEXT,
            f"TeachingOffering is defined in multiple named graphs: {offering}",
        )
    return graphs[0]


def available_path_references(dataset: Dataset, unit_id: str) -> tuple[CoursePathReference, ...]:
    """Return exact path IRI + named-graph references for one learning unit.

    Both ``rdf:type cd:LearningPath`` and ``cd:forLearningUnit`` must be present
    in the same named graph. File boundaries and Dataset iteration order are irrelevant.
    """
    unit = _require_http_iri("unitId", unit_id)
    references: set[CoursePathReference] = set()
    for path, _predicate, _obj, graph_id in dataset.quads((None, RDF.type, iri("LearningPath"), None)):
        if not isinstance(path, URIRef) or not isinstance(graph_id, URIRef):
            continue
        graph = dataset.graph(graph_id)
        if (path, iri("forLearningUnit"), unit) in graph:
            references.add(CoursePathReference(str(path), str(graph_id)))
    return tuple(sorted(references))


def select_course_unit_path(
    dataset: Dataset,
    request: CourseUnitPathSelectionRequest,
) -> CourseUnitPathSelection:
    """Validate one course context and normalize it to exactly one path reference."""
    offering = _require_http_iri("offeringId", request.offering_id)
    placement = _require_http_iri("placementId", request.placement_id)
    unit = _require_http_iri("unitId", request.unit_id)

    has_requested_id = request.requested_path_id is not None
    has_requested_graph = request.requested_path_graph_id is not None
    if has_requested_id != has_requested_graph:
        raise CoursePathSelectionError(
            CoursePathSelectionErrorCode.INVALID_IDENTITY_CONTEXT,
            "requested pathId and pathGraphId must be supplied together",
        )

    requested: CoursePathReference | None = None
    if has_requested_id and has_requested_graph:
        assert request.requested_path_id is not None
        assert request.requested_path_graph_id is not None
        _require_http_iri("pathId", request.requested_path_id)
        _require_http_iri("pathGraphId", request.requested_path_graph_id)
        requested = CoursePathReference(request.requested_path_id, request.requested_path_graph_id)

    graph_id = _course_graph(dataset, offering)
    graph = dataset.graph(graph_id)
    if (offering, iri("hasUnitPlacement"), placement) not in graph:
        raise CoursePathSelectionError(
            CoursePathSelectionErrorCode.PLACEMENT_CONTEXT_NOT_FOUND,
            f"UnitPlacement does not belong to TeachingOffering: {placement}",
        )

    placement_units = sorted(
        {
            obj
            for obj in graph.objects(placement, iri("placesLearningUnit"))
            if isinstance(obj, URIRef)
        },
        key=str,
    )
    if len(placement_units) != 1 or placement_units[0] != unit:
        raise CoursePathSelectionError(
            CoursePathSelectionErrorCode.INCONSISTENT_UNIT_CONTEXT,
            f"UnitPlacement does not reference exactly the requested LearningUnit: {placement}",
        )

    available = available_path_references(dataset, request.unit_id)
    if requested is not None:
        if requested not in available:
            raise CoursePathSelectionError(
                CoursePathSelectionErrorCode.SELECTED_PATH_NOT_AVAILABLE,
                "requested path reference is not available for the selected LearningUnit",
            )
        selected = requested
    elif not available:
        raise CoursePathSelectionError(
            CoursePathSelectionErrorCode.NO_AVAILABLE_PATH,
            f"no LearningPath is available for LearningUnit: {unit}",
        )
    elif len(available) > 1:
        raise CoursePathSelectionError(
            CoursePathSelectionErrorCode.AMBIGUOUS_SELECTION,
            f"multiple LearningPath references are available for LearningUnit: {unit}",
        )
    else:
        selected = available[0]

    return CourseUnitPathSelection(
        offering_id=request.offering_id,
        placement_id=request.placement_id,
        unit_id=request.unit_id,
        path=selected,
    )
