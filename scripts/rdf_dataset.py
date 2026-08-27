#!/usr/bin/env python3
"""Offline deterministic assembly of the canonical TriG RDF Dataset."""
from __future__ import annotations

import hashlib
from pathlib import Path

from rdflib import BNode, Dataset, Literal, RDF, URIRef
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


def _escape_nquads_literal(value: str) -> str:
    """Escape an RDF literal lexical form for N-Triples/N-Quads short-string syntax.

    RDFLib ``Literal.n3()`` may choose Turtle/TriG triple-quoted long strings for
    multiline values. N-Quads does not permit that syntax, so the canonical snapshot
    writer deliberately uses quoted short strings and ECHAR/UCHAR escapes instead.
    """
    escapes = {
        "\\": "\\\\",
        '"': '\\"',
        "\t": "\\t",
        "\b": "\\b",
        "\n": "\\n",
        "\r": "\\r",
        "\f": "\\f",
    }
    encoded: list[str] = []
    for character in value:
        escaped = escapes.get(character)
        if escaped is not None:
            encoded.append(escaped)
            continue
        codepoint = ord(character)
        if codepoint < 0x20 or codepoint == 0x7F:
            encoded.append(f"\\u{codepoint:04X}")
            continue
        encoded.append(character)
    return "".join(encoded)


def _nquads_term(term: object) -> str:
    """Serialize one RDF term using syntax accepted by an N-Quads parser."""
    if isinstance(term, Literal):
        lexical = f'"{_escape_nquads_literal(str(term))}"'
        if term.language:
            return f"{lexical}@{term.language}"
        if term.datatype:
            return f"{lexical}^^{term.datatype.n3()}"
        return lexical
    if isinstance(term, (URIRef, BNode)):
        return term.n3()
    raise TypeError(f"Unsupported RDF term for N-Quads serialization: {term!r}")


def canonical_nquads(dataset: Dataset) -> str:
    rows: list[str] = []
    for graph_id in populated_graph_ids(dataset):
        graph = dataset.graph(graph_id)
        canonical = to_canonical_graph(graph)
        gid = _nquads_term(graph_id)
        rows.extend(
            f"{_nquads_term(subject)} {_nquads_term(predicate)} {_nquads_term(obj)} {gid} ."
            for subject, predicate, obj in canonical
        )
    return "\n".join(sorted(rows)) + "\n"


def dataset_fingerprint(dataset: Dataset) -> str:
    return hashlib.sha256(canonical_nquads(dataset).encode("utf-8")).hexdigest()
