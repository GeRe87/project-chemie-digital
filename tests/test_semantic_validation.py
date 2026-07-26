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


def assembled_validation_graphs():
    dataset = MODULE.assemble_dataset(include_legacy=True)
    return MODULE.dataset_union(dataset), dataset.graph(MODULE.SHAPES_GRAPH)


class SemanticValidationTests(unittest.TestCase):
    def test_complete_semantic_content_conforms(self) -> None:
        conforms, report = MODULE.run_validation()
        self.assertTrue(conforms, report)

    def test_missing_definition_is_rejected(self) -> None:
        graph, shapes = assembled_validation_graphs()
        concept = URIRef(
            "https://w3id.org/project-chemie-digital/resource/standard-deviation"
        )
        has_definition = URIRef(
            "https://w3id.org/project-chemie-digital/ontology/hasDefinition"
        )
        graph.remove((concept, has_definition, None))

        conforms, _, report = validate(
            data_graph=graph,
            shacl_graph=shapes,
            inference="rdfs",
            meta_shacl=True,
        )

        self.assertFalse(conforms, str(report))

    def test_pitch_resource_without_repository_source_is_rejected(self) -> None:
        graph, shapes = assembled_validation_graphs()
        resource = URIRef(
            "https://w3id.org/project-chemie-digital/resource/pitch-knowledge-first-proposition"
        )
        has_source = URIRef(
            "https://w3id.org/project-chemie-digital/ontology/hasSource"
        )
        graph.remove((resource, has_source, None))

        conforms, _, report = validate(
            data_graph=graph,
            shacl_graph=shapes,
            inference="rdfs",
            meta_shacl=True,
        )

        self.assertFalse(conforms, str(report))


if __name__ == "__main__":
    unittest.main()
