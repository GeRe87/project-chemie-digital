from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

RUNTIME_SPEC = importlib.util.spec_from_file_location(
    "generate_canonical_runtime_structured_fallback_tests",
    SCRIPTS / "generate_canonical_runtime.py",
)
assert RUNTIME_SPEC and RUNTIME_SPEC.loader
RUNTIME = importlib.util.module_from_spec(RUNTIME_SPEC)
RUNTIME_SPEC.loader.exec_module(RUNTIME)


def source(resource_id: str, relation_path: str) -> list[dict]:
    return [{"resourceId": resource_id, "relationPath": relation_path}]


def artifact_with(blocks: list[dict]) -> dict:
    return {
        "sceneDocuments": [{
            "sourcePathId": "ex:path-structured-fallback",
            "scenes": [{
                "id": "ex:scene-structured-fallback",
                "source": source("ex:scene-structured-fallback", "cd:hasSceneItem"),
                "blocks": blocks,
            }],
        }],
    }


class StructuredStaticFallbackTests(unittest.TestCase):
    def test_definition_list_fallback_preserves_terms_descriptions_and_sources(self) -> None:
        block = {
            "id": "ex:def-list--block",
            "kind": "definition-list",
            "source": source("ex:def-list", "cd:hasDefinitionListEntry"),
            "entries": [
                {
                    "id": "ex:def-entry-a--definition-entry",
                    "term": "Semantic layer",
                    "description": "Meaning before rendering.",
                    "source": source("ex:def-entry-a", "skos:prefLabel@en"),
                },
                {
                    "id": "ex:def-entry-b--definition-entry",
                    "term": "Renderer",
                    "source": source("ex:def-entry-b", "skos:prefLabel@en"),
                },
            ],
        }

        fallback = RUNTIME.static_fallback(artifact_with([block]))

        self.assertIn('<dl class="definition-list-fallback"', fallback)
        self.assertIn("<dt>Semantic layer</dt>", fallback)
        self.assertIn("<dd>Meaning before rendering.</dd>", fallback)
        self.assertIn("<dt>Renderer</dt>", fallback)
        self.assertIn('data-definition-entry-id="ex:def-entry-a--definition-entry"', fallback)
        self.assertIn('data-resource-id="ex:def-entry-a"', fallback)

    def test_table_fallback_preserves_caption_grid_and_sources(self) -> None:
        block = {
            "id": "ex:table--block",
            "kind": "table",
            "source": source("ex:table", "cd:hasTableRow"),
            "caption": "FAIR comparison",
            "description": "Structured table content.",
            "columns": [
                {"id": "ex:col-a", "label": "Aspect", "source": source("ex:col-a", "skos:prefLabel@en")},
                {"id": "ex:col-b", "label": "Value", "source": source("ex:col-b", "skos:prefLabel@en")},
            ],
            "rows": [{
                "id": "ex:row-a",
                "source": source("ex:row-a", "cd:hasTableCell"),
                "cells": [
                    {"id": "ex:cell-a", "text": "Findable", "source": source("ex:cell-a", "cd:body")},
                    {"id": "ex:cell-b", "text": "Yes", "source": source("ex:cell-b", "cd:body")},
                ],
            }],
        }

        fallback = RUNTIME.static_fallback(artifact_with([block]))

        self.assertIn('<figure class="table-fallback"', fallback)
        self.assertIn("<strong>FAIR comparison</strong>", fallback)
        self.assertIn("<span>Structured table content.</span>", fallback)
        self.assertIn('data-table-column-id="ex:col-a"', fallback)
        self.assertIn('data-table-row-id="ex:row-a"', fallback)
        self.assertIn('data-table-cell-id="ex:cell-b"', fallback)
        self.assertIn(">Findable</td>", fallback)
        self.assertIn(">Yes</td>", fallback)


if __name__ == "__main__":
    unittest.main()
