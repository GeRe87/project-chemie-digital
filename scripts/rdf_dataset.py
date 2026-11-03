#!/usr/bin/env python3
"""Offline deterministic assembly of the canonical TriG RDF Dataset."""
from __future__ import annotations

import hashlib
from pathlib import Path

from rdflib import BNode, Dataset, Graph, Literal, RDF, URIRef
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


def parse_trig_path(dataset: Dataset, path: Path) -> None:
    """Parse TriG with platform-independent LF semantics for multiline literals.

    Git may materialize repository text with CRLF on Windows. RDF long-string
    literals preserve those physical line endings, which would otherwise make the
    logical Dataset and its fingerprint depend on the checkout platform. Reading in
    text mode normalizes universal newlines before RDFLib sees the TriG source.
    """
    normalized = path.read_text(encoding="utf-8")
    dataset.parse(data=normalized, format="trig", publicID=path.resolve().as_uri())


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
        parse_trig_path(dataset, path)
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
    """Serialize a logical Dataset with one canonical blank-node namespace.

    Named graphs sharing a blank node must be canonicalized together. Within each
    such component, a reversible (graph IRI, predicate IRI) encoding lets RDFLib's
    graph canonicalizer retain quad context and cross-graph node identity. Graph
    components receive disjoint deterministic label prefixes. Unrelated named
    graphs therefore cannot accidentally reuse a canonical blank-node label.

    Grounded quads need no canonicalization. Keeping them outside the temporary
    graphs, and partitioning only along genuinely disjoint graph boundaries,
    avoids making canonicalization of a large Dataset unnecessarily expensive.
    """
    rows: list[str] = []
    blank_triples: dict[URIRef, list[tuple]] = {}
    first_graph: dict[BNode, URIRef] = {}
    parents: dict[URIRef, URIRef] = {}

    def root(graph_id: URIRef) -> URIRef:
        while parents[graph_id] != graph_id:
            parents[graph_id] = parents[parents[graph_id]]
            graph_id = parents[graph_id]
        return graph_id

    def row(subject: object, predicate: object, obj: object, graph_id: URIRef) -> str:
        return (
            f"{_nquads_term(subject)} {_nquads_term(predicate)} "
            f"{_nquads_term(obj)} {_nquads_term(graph_id)} ."
        )

    for subject, predicate, obj, graph_id in dataset.quads((None, None, None, None)):
        if not isinstance(graph_id, URIRef):
            raise ValueError(f"Unsupported graph identity: {graph_id}")
        nodes = [term for term in (subject, obj) if isinstance(term, BNode)]
        if not nodes:
            rows.append(row(subject, predicate, obj, graph_id))
            continue
        blank_triples.setdefault(graph_id, []).append((subject, predicate, obj))
        parents.setdefault(graph_id, graph_id)
        for node in nodes:
            previous_graph = first_graph.setdefault(node, graph_id)
            parents[root(graph_id)] = root(previous_graph)

    components: dict[URIRef, list[URIRef]] = {}
    for graph_id in blank_triples:
        components.setdefault(root(graph_id), []).append(graph_id)
    ordered_components = sorted(tuple(sorted(ids, key=str)) for ids in components.values())
    for component_index, graph_ids in enumerate(ordered_components):
        encoded = Graph()
        predicates: dict[URIRef, tuple[URIRef, URIRef]] = {}
        for graph_id in graph_ids:
            graph_key = str(graph_id).encode("utf-8").hex()
            for subject, predicate, obj in blank_triples[graph_id]:
                # Hexadecimal UTF-8 with a separator is injective, even for IRIs
                # containing separators or Unicode. No hash collision can merge
                # distinct predicate/graph pairs in this temporary representation.
                encoded_predicate = URIRef(
                    f"urn:project-chemie-digital:canonical-quad:{graph_key}:"
                    f"{str(predicate).encode('utf-8').hex()}"
                )
                predicates[encoded_predicate] = (predicate, graph_id)
                encoded.add((subject, encoded_predicate, obj))

        def scoped(term: object) -> object:
            return BNode(f"ds{component_index}_{term}") if isinstance(term, BNode) else term

        for subject, encoded_predicate, obj in to_canonical_graph(encoded):
            predicate, graph_id = predicates[encoded_predicate]
            rows.append(row(scoped(subject), predicate, scoped(obj), graph_id))
    return "\n".join(sorted(rows)) + "\n"


def dataset_fingerprint(dataset: Dataset) -> str:
    """Hash the canonical logical Dataset, including cross-graph node identity.

    Canonical labels do not depend on parser-local blank-node identifiers, parse
    order, or serialization order. Hashing the same dataset-wide representation
    used for export also detects split or merged blank nodes between named graphs,
    which a collection of independent per-graph digests cannot distinguish.
    """
    return hashlib.sha256(canonical_nquads(dataset).encode("utf-8")).hexdigest()
