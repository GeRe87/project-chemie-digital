#!/usr/bin/env python3
"""Validate the complete repository semantic content graph with SHACL."""
from __future__ import annotations

import sys
from pathlib import Path

from pyshacl import validate
from rdflib import Graph

ROOT = Path(__file__).resolve().parents[1]
DATA_FILES = (
    ROOT / "ontology" / "learning.ttl",
    ROOT / "content" / "concepts" / "standard-deviation.jsonld",
    ROOT / "content" / "concepts" / "chemie-digital-platform.jsonld",
    ROOT / "content" / "resources" / "standard-deviation-resources.jsonld",
    ROOT / "content" / "resources" / "pitch-content.jsonld",
    ROOT / "content" / "paths" / "standard-deviation-default.jsonld",
)
SHAPES_FILE = ROOT / "ontology" / "shapes.ttl"


def load_graph(paths: tuple[Path, ...]) -> Graph:
    graph = Graph()
    for path in paths:
        graph.parse(path)
    return graph


def run_validation() -> tuple[bool, str]:
    data_graph = load_graph(DATA_FILES)
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
    return bool(conforms), str(report_text)


def main() -> int:
    try:
        conforms, report = run_validation()
    except Exception as exc:  # pragma: no cover - CLI safety net
        print(f"Semantic validation could not run: {exc}", file=sys.stderr)
        return 2

    print(report)
    return 0 if conforms else 1


if __name__ == "__main__":
    raise SystemExit(main())
