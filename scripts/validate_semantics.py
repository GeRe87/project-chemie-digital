#!/usr/bin/env python3
"""Validate the complete repository semantic RDF Dataset with SHACL."""
from __future__ import annotations

import sys
from pathlib import Path

from pyshacl import validate
from rdflib import Dataset, Graph

from rdf_dataset import assemble_dataset, dataset_fingerprint

ROOT = Path(__file__).resolve().parents[1]
SHAPES_FILE = ROOT / "ontology" / "shapes.ttl"

# Backward-compatible names retained for existing tests during migration.
DATA_FILES = (
    ROOT / "ontology" / "learning.ttl",
    ROOT / "content" / "concepts" / "standard-deviation.jsonld",
    ROOT / "content" / "concepts" / "chemie-digital-platform.jsonld",
    ROOT / "content" / "resources" / "standard-deviation-resources.jsonld",
    ROOT / "content" / "resources" / "pitch-content.jsonld",
    ROOT / "content" / "paths" / "standard-deviation-default.jsonld",
    ROOT / "content" / "scenes" / "standard-deviation-definition-with-citation.jsonld",
)


def load_graph(paths: tuple[Path, ...]) -> Graph:
    graph = Graph()
    for path in paths:
        graph.parse(path)
    return graph


def dataset_union(dataset: Dataset) -> Graph:
    graph = Graph()
    for subject, predicate, obj, _ in dataset.quads((None, None, None, None)):
        graph.add((subject, predicate, obj))
    return graph


def run_validation() -> tuple[bool, str]:
    dataset = assemble_dataset(include_legacy=True)
    data_graph = dataset_union(dataset)
    # Existing SHACL remains a temporary compatibility input until its
    # complete TriG migration; new authored semantic content is TriG-only.
    shapes_graph = load_graph((SHAPES_FILE,))
    conforms, _, report_text = validate(
        data_graph=data_graph,
        shacl_graph=shapes_graph,
        inference="rdfs",
        abort_on_first=False,
        allow_infos=False,
        allow_warnings=False,
        meta_shacl=True,
    )
    report = f"Dataset fingerprint: {dataset_fingerprint(dataset)}\n{report_text}"
    return bool(conforms), report


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
