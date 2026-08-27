from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from pyshacl import validate
from rdflib import Graph, URIRef
from rdflib.compare import isomorphic

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("validate_semantics", ROOT / "scripts" / "validate_semantics.py")
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def assembled_validation_graphs():
    dataset = MODULE.assemble_dataset()
    return MODULE.dataset_union(dataset), MODULE.detached_graph(dataset.graph(MODULE.SHAPES_GRAPH))


def populated_graph_ids(dataset) -> tuple[str, ...]:
    return tuple(
        sorted({str(graph) for _subject, _predicate, _obj, graph in dataset.quads((None, None, None, None))})
    )


def quad_count(dataset) -> int:
    return sum(1 for _quad in dataset.quads((None, None, None, None)))


class SemanticValidationTests(unittest.TestCase):
    def test_complete_semantic_content_conforms(self) -> None:
        conforms, report = MODULE.run_validation()
        self.assertTrue(conforms, report)

    def test_canonical_validation_is_observationally_pure(self) -> None:
        dataset = MODULE.assemble_dataset()
        fingerprint_before = MODULE.dataset_fingerprint(dataset)
        graph_ids_before = populated_graph_ids(dataset)
        quad_count_before = quad_count(dataset)
        shapes_before = MODULE.detached_graph(dataset.graph(MODULE.SHAPES_GRAPH))

        conforms, _report_graph, report = MODULE.validate_dataset(dataset)
        self.assertTrue(conforms, report)

        self.assertEqual(fingerprint_before, MODULE.dataset_fingerprint(dataset))
        self.assertEqual(graph_ids_before, populated_graph_ids(dataset))
        self.assertEqual(quad_count_before, quad_count(dataset))
        self.assertTrue(
            isomorphic(shapes_before, dataset.graph(MODULE.SHAPES_GRAPH)),
            "Canonical SHACL validation must not mutate the Dataset-backed shapes graph",
        )

    def test_missing_definition_is_rejected(self) -> None:
        graph, shapes = assembled_validation_graphs()
        concept = URIRef("https://w3id.org/project-chemie-digital/resource/standard-deviation")
        has_definition = URIRef("https://w3id.org/project-chemie-digital/ontology/hasDefinition")
        graph.remove((concept, has_definition, None))
        conforms, _, report = validate(data_graph=graph, shacl_graph=shapes, inference="rdfs", meta_shacl=True)
        self.assertFalse(conforms, str(report))

    def test_definition_without_repository_source_is_rejected(self) -> None:
        graph, shapes = assembled_validation_graphs()
        resource = URIRef("https://w3id.org/project-chemie-digital/resource/sd-definition-basic-de")
        has_source = URIRef("https://w3id.org/project-chemie-digital/ontology/hasSource")
        graph.remove((resource, has_source, None))
        conforms, _, report = validate(data_graph=graph, shacl_graph=shapes, inference="rdfs", meta_shacl=True)
        self.assertFalse(conforms, str(report))


if __name__ == "__main__":
    unittest.main()
