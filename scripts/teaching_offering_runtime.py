#!/usr/bin/env python3
"""Deterministic renderer-neutral TeachingOffering runtime projection.

The returned document is disposable generated transport over one immutable canonical
RDF Dataset snapshot. Canonical TriG remains the authored semantic authority.
"""
from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlsplit

from rdflib import DCTERMS, RDF, SKOS, Dataset, Graph, Literal, URIRef

from course_path_selection import available_path_references

CD = "https://w3id.org/project-chemie-digital/ontology/"
_FINGERPRINT = re.compile(r"^sha256:[0-9a-f]{64}$")


def iri(local: str) -> URIRef:
    return URIRef(CD + local)


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
        raise ValueError(f"{name} must be an absolute HTTP(S) IRI")
    return URIRef(value)


def _require_fingerprint(value: str) -> str:
    if not isinstance(value, str) or _FINGERPRINT.fullmatch(value) is None:
        raise ValueError("datasetFingerprint must be a sha256: identity")
    return value


def _offering_graph(dataset: Dataset, offering: URIRef) -> URIRef:
    graph_ids = {
        graph_id
        for _subject, _predicate, _obj, graph_id in dataset.quads(
            (offering, RDF.type, iri("TeachingOffering"), None)
        )
        if isinstance(graph_id, URIRef)
    }
    if not graph_ids:
        raise ValueError(f"TeachingOffering not found: {offering}")
    if len(graph_ids) != 1:
        raise ValueError(f"TeachingOffering is defined in multiple named graphs: {offering}")
    return next(iter(graph_ids))


def _localized_text(graph: Graph, subject: URIRef, predicate: URIRef) -> list[dict[str, str]]:
    values: set[tuple[str, str | None]] = set()
    for value in graph.objects(subject, predicate):
        if not isinstance(value, Literal):
            raise ValueError(f"Authored display metadata must be literal: {subject} {predicate}")
        values.add((str(value), value.language))

    result: list[dict[str, str]] = []
    for text, language in sorted(values, key=lambda item: (item[1] or "", item[0])):
        item = {"value": text}
        if language is not None:
            item["language"] = language
        result.append(item)
    return result


def _positive_position(graph: Graph, placement: URIRef) -> int:
    values = sorted(set(graph.objects(placement, iri("position"))), key=lambda value: value.n3())
    if len(values) != 1 or not isinstance(values[0], Literal):
        raise ValueError(f"UnitPlacement must have exactly one integer position: {placement}")
    value = values[0].toPython()
    if not isinstance(value, int) or isinstance(value, bool) or value < 1:
        raise ValueError(f"UnitPlacement position must be a positive integer: {placement}")
    return value


def _placement_unit(graph: Graph, placement: URIRef) -> URIRef:
    units = sorted(set(graph.objects(placement, iri("placesLearningUnit"))), key=lambda value: value.n3())
    if len(units) != 1 or not isinstance(units[0], URIRef):
        raise ValueError(f"UnitPlacement must reference exactly one LearningUnit: {placement}")
    return _require_http_iri("unitId", str(units[0]))


def _display_record(graph: Graph, subject: URIRef) -> dict[str, Any]:
    return {
        "labels": _localized_text(graph, subject, SKOS.prefLabel),
        "descriptions": _localized_text(graph, subject, DCTERMS.description),
    }


def project_teaching_offering_runtime_document(
    dataset: Dataset,
    offering_id: str,
    dataset_fingerprint_identity: str,
) -> dict[str, Any]:
    """Project one TeachingOffering from one immutable logical Dataset snapshot."""
    offering = _require_http_iri("offeringId", offering_id)
    fingerprint = _require_fingerprint(dataset_fingerprint_identity)
    graph_id = _offering_graph(dataset, offering)
    graph = dataset.graph(graph_id)

    placement_terms = sorted(set(graph.objects(offering, iri("hasUnitPlacement"))), key=lambda value: value.n3())
    if not placement_terms:
        raise ValueError(f"TeachingOffering has no UnitPlacement: {offering}")

    placements: list[dict[str, Any]] = []
    units: set[URIRef] = set()
    positions: set[int] = set()
    for term in placement_terms:
        if not isinstance(term, URIRef):
            raise ValueError(f"TeachingOffering contains a non-IRI UnitPlacement: {offering}")
        placement = _require_http_iri("placementId", str(term))
        position = _positive_position(graph, placement)
        if position in positions:
            raise ValueError(f"TeachingOffering contains duplicate UnitPlacement position: {position}")
        positions.add(position)
        unit = _placement_unit(graph, placement)
        units.add(unit)
        placements.append(
            {
                "id": str(placement),
                "position": position,
                "unitId": str(unit),
            }
        )
    placements.sort(key=lambda item: (item["position"], item["id"]))

    unit_records: list[dict[str, Any]] = []
    for unit in sorted(units, key=str):
        path_records: list[dict[str, Any]] = []
        for reference in available_path_references(dataset, str(unit)):
            path = _require_http_iri("pathId", reference.path_id)
            path_graph_id = _require_http_iri("pathGraphId", reference.path_graph_id)
            path_graph = dataset.graph(path_graph_id)
            path_records.append(
                {
                    "id": str(path),
                    "graphId": str(path_graph_id),
                    **_display_record(path_graph, path),
                }
            )
        path_records.sort(key=lambda item: (item["id"], item["graphId"]))
        unit_records.append(
            {
                "id": str(unit),
                **_display_record(graph, unit),
                "paths": path_records,
            }
        )

    return {
        "version": "1.0",
        "datasetFingerprint": fingerprint,
        "offering": {
            "id": str(offering),
            "graphId": str(graph_id),
            **_display_record(graph, offering),
        },
        "placements": placements,
        "units": unit_records,
    }
