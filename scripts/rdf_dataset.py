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
RESOURCE_BASE = "https://w3id.org/project-chemie-digital/resource/"

# These stable resources have been promoted into canonical TriG ownership. Their
# former JSON-LD descriptions remain repository history and compatibility input,
# but may no longer contribute competing authored assertions to the assembled
# logical dataset. References to them as objects remain intact.
SUPERSEDED_LEGACY_SUBJECTS = frozenset(
    {URIRef(f"{RESOURCE_BASE}standard-deviation")}
)


def populated_graph_ids(dataset: Dataset) -> tuple[URIRef, ...]:
    """Return deterministic graph IDs that actually own at least one quad.

    rdflib materializes an empty default context for every Dataset. It is not an
    authored graph and therefore must not participate in ownership assertions or
    canonical serialization. A populated default graph remains visible here and
    is rejected by ``validate_dataset_contract`` because its identifier is not a
    project-owned graph IRI.
    """
    identifiers = {graph for *_triple, graph in dataset.quads((None, None, None, None))}
    return tuple(sorted(identifiers, key=str))


def _remove_superseded_legacy_assertions(graph) -> None:
    """Remove authored legacy descriptions superseded by canonical ownership."""
    for subject in SUPERSEDED_LEGACY_SUBJECTS:
        graph.remove((subject, None, None))


def assemble_dataset(*, include_legacy: bool = True, trig_paths: tuple[Path, ...] | None = None) -> Dataset:
    dataset = Dataset(default_union=False)
    for path in sorted(trig_paths or CANONICAL_TRIG, key=lambda p: p.as_posix()):
        dataset.parse(path, format="trig")
    if include_legacy:
        for path in LEGACY_INPUTS:
            legacy_graph = dataset.graph(URIRef(f"{LEGACY_GRAPH_BASE}{path.stem}"))
            legacy_graph.parse(path)
            _remove_superseded_legacy_assertions(legacy_graph)
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
