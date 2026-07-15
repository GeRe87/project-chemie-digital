from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from pyshacl import validate
from rdflib import URIRef

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "validate_semantics", ROOT / "scripts" / "validate_semantics.py"
)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class SemanticValidationTests(unittest.TestCase):
    def test_standard_deviation_slice_conforms(self) -> None:
        conforms, report = MODULE.run_validation()
        self.assertTrue(conforms, report)

    def test_missing_definition_is_rejected(self) -> None:
        graph = MODULE.load_graph(MODULE.DATA_FILES)
        concept = URIRef(
            "https://w3id.org/project-chemie-digital/resource/standard-deviation"
        )
        has_definition = URIRef(
            "https://w3id.org/project-chemie-digital/ontology/hasDefinition"
        )
        graph.remove((concept, has_definition, None))
        shapes = MODULE.load_graph((MODULE.SHAPES_FILE,))

        conforms, _, report = validate(
            data_graph=graph,
            shacl_graph=shapes,
            inference="rdfs",
            meta_shacl=True,
        )

        self.assertFalse(conforms, str(report))


if __name__ == "__main__":
    unittest.main()
