from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

from pyshacl import validate
from rdflib import Graph, URIRef
from rdflib.compare import isomorphic

ROOT = Path(__file__).resolve().parents[1]
FOCUSED_VALIDATION_TRIG = (
    ROOT / "ontology" / "dataset" / "core.trig",
    ROOT / "ontology" / "dataset" / "concepts.trig",
    ROOT / "ontology" / "dataset" / "shapes.trig",
    ROOT / "ontology" / "dataset" / "standard-deviation.trig",
    ROOT / "ontology" / "dataset" / "standard-deviation-shapes.trig",
)

if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

import validate_semantics as MODULE  # noqa: E402


def focused_validation_dataset():
    return MODULE.assemble_dataset(trig_paths=FOCUSED_VALIDATION_TRIG)


def assembled_validation_graphs():
    dataset = focused_validation_dataset()
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
        dataset = focused_validation_dataset()
        fingerprint_before = MODULE.dataset_fingerprint(dataset)
        graph_ids_before = populated_graph_ids(dataset)
        quad_count_before = quad_count(dataset)
        shapes_before = MODULE.detached_graph(dataset.graph(MODULE.SHAPES_GRAPH))

        conforms, _report_graph, report = MODULE.validate_dataset(dataset, meta_shacl=False)
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
        conforms, _, report = validate(data_graph=graph, shacl_graph=shapes, inference="rdfs", meta_shacl=False)
        self.assertFalse(conforms, str(report))

    def test_definition_without_repository_source_is_rejected(self) -> None:
        graph, shapes = assembled_validation_graphs()
        resource = URIRef("https://w3id.org/project-chemie-digital/resource/sd-definition-basic-de")
        has_source = URIRef("https://w3id.org/project-chemie-digital/ontology/hasSource")
        graph.remove((resource, has_source, None))
        conforms, _, report = validate(data_graph=graph, shacl_graph=shapes, inference="rdfs", meta_shacl=False)
        self.assertFalse(conforms, str(report))


if __name__ == "__main__":
    unittest.main()


class CanonicalValidationCacheTests(unittest.TestCase):
    def test_repeated_canonical_validation_reuses_exact_result(self) -> None:
        cache_before = MODULE._cached_canonical_validation.cache_info()
        first = MODULE.run_validation()
        cache_after_first = MODULE._cached_canonical_validation.cache_info()
        second = MODULE.run_validation()
        cache_after_second = MODULE._cached_canonical_validation.cache_info()

        self.assertEqual(first, second)
        self.assertLessEqual(cache_after_first.misses - cache_before.misses, 1)
        self.assertEqual(cache_after_first.misses, cache_after_second.misses)
        self.assertEqual(cache_after_first.hits + 1, cache_after_second.hits)
