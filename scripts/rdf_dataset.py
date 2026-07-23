#!/usr/bin/env python3
"""Offline deterministic RDF Dataset assembly and canonical fingerprinting."""
from __future__ import annotations

import hashlib
from pathlib import Path
from rdflib import Dataset, URIRef
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
LEGACY_GRAPH_BASE = "https://w3id.org/project-chemie-digital/graph/legacy/"
ALLOWED_GRAPH_PREFIX = "https://w3id.org/project-chemie-digital/graph/"


def assemble_dataset(*, include_legacy: bool = True, trig_paths: tuple[Path, ...] | None = None) -> Dataset:
    dataset = Dataset(default_union=False)
    for path in sorted(trig_paths or CANONICAL_TRIG, key=lambda p: p.as_posix()):
        dataset.parse(path, format="trig")
    if include_legacy:
        for path in LEGACY_INPUTS:
            graph = dataset.graph(URIRef(f"{LEGACY_GRAPH_BASE}{path.stem}"))
            graph.parse(path)
    _validate_dataset_contract(dataset)
    return dataset


def _validate_dataset_contract(dataset: Dataset) -> None:
    seen: dict[tuple[object, object], tuple[object, object]] = {}
    for subject, predicate, obj, graph in dataset.quads((None, None, None, None)):
        if not isinstance(graph, URIRef) or not str(graph).startswith(ALLOWED_GRAPH_PREFIX):
            raise ValueError(f"Unsupported graph identity: {graph}")
        if subject.__class__.__name__ == "BNode":
            raise ValueError("Blank-node subjects are forbidden in canonical dataset identities")
        key = (subject, predicate)
        previous = seen.get(key)
        if previous and previous[0] != obj and not str(graph).startswith(LEGACY_GRAPH_BASE):
            raise ValueError(f"Conflicting canonical definition for {subject} {predicate}")
        seen.setdefault(key, (obj, graph))


def canonical_nquads(dataset: Dataset) -> str:
    rows: list[str] = []
    for graph in sorted(dataset.contexts(), key=lambda g: str(g.identifier)):
        canonical = to_canonical_graph(graph)
        gid = f"<{graph.identifier}>"
        for subject, predicate, obj in canonical:
            rows.append(f"{subject.n3()} {predicate.n3()} {obj.n3()} {gid} .")
    return "\n".join(sorted(rows)) + "\n"


def dataset_fingerprint(dataset: Dataset) -> str:
    return hashlib.sha256(canonical_nquads(dataset).encode("utf-8")).hexdigest()
