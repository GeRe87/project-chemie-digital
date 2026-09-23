#!/usr/bin/env python3
"""Validate repository semantic RDF Datasets with the canonical SHACL policy."""
from __future__ import annotations

import sys
from functools import lru_cache
from pathlib import Path

from pyshacl import validate
from rdflib import Dataset, Graph, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from rdf_dataset import assemble_dataset, dataset_fingerprint  # noqa: E402

SHAPES_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/shapes/core")


def dataset_union(dataset: Dataset, *, exclude_shapes: bool = True) -> Graph:
    """Return a detached union graph for SHACL data validation."""
    graph = Graph()
    for subject, predicate, obj, context in dataset.quads((None, None, None, None)):
        if exclude_shapes and str(context).startswith("https://w3id.org/project-chemie-digital/graph/shapes/"):
            continue
        graph.add((subject, predicate, obj))
    return graph


def detached_graph(source: Graph) -> Graph:
    """Copy an RDF graph into an independent store before handing it to validators.

    pySHACL may enrich or otherwise mutate the graph objects it receives while applying
    inference and meta-SHACL. Repository validation must be observationally pure with
    respect to the supplied canonical Dataset, so live Dataset graph views are never
    passed across the validation boundary.
    """
    graph = Graph()
    for triple in source:
        graph.add(triple)
    return graph


def validate_dataset(dataset: Dataset) -> tuple[bool, Graph, str]:
    """Apply the repository's one canonical SHACL policy without mutating ``dataset``."""
    data_graph = dataset_union(dataset)
    shapes_graph = detached_graph(dataset.graph(SHAPES_GRAPH))
    conforms, report_graph, report_text = validate(
        data_graph=data_graph,
        shacl_graph=shapes_graph,
        inference="rdfs",
        abort_on_first=False,
        allow_infos=False,
        allow_warnings=False,
        meta_shacl=True,
    )
    return bool(conforms), report_graph, str(report_text)


@lru_cache(maxsize=1)
def _cached_canonical_validation() -> tuple[bool, str]:
    """Validate the immutable canonical repository dataset once per Python process.

    The semantic unittest suite calls run_validation() from several independent
    contract tests. Re-running pySHACL with RDFS inference and meta-SHACL over the
    same canonical dataset is expensive and adds no coverage. Dataset-specific
    mutation tests continue to call validate_dataset(dataset) directly and are
    intentionally not cached.
    """
    dataset = assemble_dataset()
    fingerprint = dataset_fingerprint(dataset)
    conforms, _report_graph, report_text = validate_dataset(dataset)
    return bool(conforms), f"Dataset fingerprint: {fingerprint}\n{report_text}"


def run_validation() -> tuple[bool, str]:
    return _cached_canonical_validation()


def main() -> int:
    try:
        conforms, report = run_validation()
    except Exception as exc:  # pragma: no cover
        print(f"Semantic validation could not run: {exc}", file=sys.stderr)
        return 2
    print(report)
    return 0 if conforms else 1


if __name__ == "__main__":
    raise SystemExit(main())
