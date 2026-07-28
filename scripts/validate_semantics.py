#!/usr/bin/env python3
"""Validate the complete repository semantic RDF Dataset with SHACL."""
from __future__ import annotations

import sys
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
    graph = Graph()
    for subject, predicate, obj, context in dataset.quads((None, None, None, None)):
        if exclude_shapes and str(context).startswith("https://w3id.org/project-chemie-digital/graph/shapes/"):
            continue
        graph.add((subject, predicate, obj))
    return graph


def run_validation() -> tuple[bool, str]:
    dataset = assemble_dataset()
    conforms, _, report_text = validate(
        data_graph=dataset_union(dataset),
        shacl_graph=dataset.graph(SHAPES_GRAPH),
        inference="rdfs",
        abort_on_first=False,
        allow_infos=False,
        allow_warnings=False,
        meta_shacl=True,
    )
    return bool(conforms), f"Dataset fingerprint: {dataset_fingerprint(dataset)}\n{report_text}"


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
