#!/usr/bin/env python3
"""Offline deterministic RDF Dataset assembly and canonical fingerprinting."""
from __future__ import annotations

import hashlib
from pathlib import Path

from rdflib import BNode, Dataset, RDF, URIRef
from rdflib.compare import to_canonical_graph

ROOT = Path(__file__).resolve().parents[1]
CANONICAL_TRIG = tuple(sorted((ROOT / "ontology" / "dataset").glob("*.trig")))
LEGACY_INPUTS = (
    ROOT / "content" / "concepts" / "standard-deviation.jsonld",
    ROOT / "content" / "concepts" / "chemie-digital-platform.jsonld",
    ROOT / "content" / "resources" / "standard-deviation-resources.jsonld",
    ROOT / "content" / "resources" / "pitch-content.jsonld",
    ROOT / "content" / "paths" / "standard-deviation-default.jsonld",
    ROOT / "content" / "scenes" / "standard-deviation-definition-with-citation.jsonld",
)
GRAPH_BASE = "https://w3id.org/project-chemie-digital/graph/"
LEGACY_GRAPH_BASE = f"{GRAPH_BASE}legacy/"
SHAPES_GRAPH_BASE = f"{GRAPH_BASE}shapes/"


def assemble_dataset(*, include_legacy: bool = True, trig_paths: tuple[Path, ...] | None = None) -> Dataset:
    dataset = Dataset(default_union=False)
    for path in sorted(trig_paths or CANONICAL_TRIG, key=lambda p: p.as_posix()):
        dataset.parse(path, format="trig")
    if include_legacy:
        for path in LEGACY_INPUTS:
            dataset.graph(URIRef(f"{LEGACY_GRAPH_BASE}{path.stem}")).parse(path)
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
        if predicate == RDF.type and not graph_name.startswith((LEGACY_GRAPH_BASE, SHAPES_GRAPH_BASE)):
            previous = typed_owner.setdefault(subject, graph)
            if previous != graph:
                raise ValueError(f"Canonical subject is defined in multiple owned graphs: {subject}")


def canonical_nquads(dataset: Dataset) -> str:
    rows: list[str] = []
    for graph in sorted(dataset.contexts(), key=lambda item: str(item.identifier)):
        canonical = to_canonical_graph(graph)
        gid = f"<{graph.identifier}>"
        rows.extend(
            f"{subject.n3()} {predicate.n3()} {obj.n3()} {gid} ."
            for subject, predicate, obj in canonical
        )
    return "\n".join(sorted(rows)) + "\n"


def dataset_fingerprint(dataset: Dataset) -> str:
    return hashlib.sha256(canonical_nquads(dataset).encode("utf-8")).hexdigest()
