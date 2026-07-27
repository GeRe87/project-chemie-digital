#!/usr/bin/env python3
"""Offline deterministic assembly of the canonical TriG RDF Dataset."""
from __future__ import annotations

import hashlib
from pathlib import Path

from rdflib import BNode, Dataset, RDF, URIRef
from rdflib.compare import to_canonical_graph

ROOT = Path(__file__).resolve().parents[1]
CANONICAL_TRIG = tuple(sorted((ROOT / "ontology" / "dataset").glob("*.trig")))
GRAPH_BASE = "https://w3id.org/project-chemie-digital/graph/"
SHAPES_GRAPH_BASE = f"{GRAPH_BASE}shapes/"
RESOURCE_BASE = "https://w3id.org/project-chemie-digital/resource/"


def populated_graph_ids(dataset: Dataset) -> tuple[URIRef, ...]:
    """Return deterministic graph IDs that actually own at least one quad."""
    identifiers = {graph for *_triple, graph in dataset.quads((None, None, None, None))}
    return tuple(sorted(identifiers, key=str))


def assemble_dataset(
    *,
    trig_paths: tuple[Path, ...] | None = None,
    include_legacy: bool | None = None,
) -> Dataset:
    """Assemble the one canonical logical Dataset from repository-local TriG files.

    ``include_legacy=False`` is accepted temporarily as a fail-safe call-site migration
    aid. Requests to load retired legacy inputs fail closed instead of silently
    restoring a parallel semantic source.
    """
    if include_legacy is True:
        raise ValueError("Legacy JSON-LD dataset inputs have been retired; canonical TriG is the sole source")
    dataset = Dataset(default_union=False)
    for path in sorted(trig_paths or CANONICAL_TRIG, key=lambda item: item.as_posix()):
        dataset.parse(path, format="trig")
    validate_dataset_contract(dataset)
    return dataset


def validate_dataset_contract(dataset: Dataset) -> None:
    typed_owner: dict[object, URIRef] = {}
    for subject, predicate, _obj, graph in dataset.quads((None, None, None, None)):
        if not isinstance(graph, URIRef) or not str(graph).startswith(GRAPH_BASE):
            raise ValueError(f"Unsupported graph identity: {graph}")
        graph_name = str(graph)
        if isinstance(subject, BNode) and not graph_name.startswith(SHAPES_GRAPH_BASE):
            raise ValueError("Blank-node subjects are permitted only inside SHACL graphs")
        if predicate == RDF.type and not graph_name.startswith(SHAPES_GRAPH_BASE):
            previous = typed_owner.setdefault(subject, graph)
            if previous != graph:
                raise ValueError(f"Canonical subject is defined in multiple owned graphs: {subject}")


def canonical_nquads(dataset: Dataset) -> str:
    rows: list[str] = []
    for graph_id in populated_graph_ids(dataset):
        graph = dataset.graph(graph_id)
        canonical = to_canonical_graph(graph)
        gid = f"<{graph_id}>"
        rows.extend(
            f"{subject.n3()} {predicate.n3()} {obj.n3()} {gid} ."
            for subject, predicate, obj in canonical
        )
    return "\n".join(sorted(rows)) + "\n"


def dataset_fingerprint(dataset: Dataset) -> str:
    return hashlib.sha256(canonical_nquads(dataset).encode("utf-8")).hexdigest()
