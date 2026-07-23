from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from rdflib import BNode, Dataset, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("rdf_dataset", ROOT / "scripts" / "rdf_dataset.py")
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

EXPECTED_CANONICAL_GRAPHS = {
    "https://w3id.org/project-chemie-digital/graph/core",
    "https://w3id.org/project-chemie-digital/graph/concepts",
    "https://w3id.org/project-chemie-digital/graph/shapes/core",
}


class RdfDatasetTests(unittest.TestCase):
    def test_every_canonical_trig_source_parses_independently(self) -> None:
        self.assertGreater(len(MODULE.CANONICAL_TRIG), 0)
        for path in MODULE.CANONICAL_TRIG:
            with self.subTest(path=path.relative_to(ROOT).as_posix()):
                parsed = Dataset(default_union=False)
                parsed.parse(path, format="trig")
                names = {str(graph.identifier) for graph in parsed.contexts()}
                self.assertTrue(names)
                self.assertTrue(names <= EXPECTED_CANONICAL_GRAPHS)

    def test_canonical_dataset_uses_exact_stable_named_graphs(self) -> None:
        dataset = MODULE.assemble_dataset(include_legacy=False)
        names = {str(graph.identifier) for graph in dataset.contexts()}
        self.assertEqual(EXPECTED_CANONICAL_GRAPHS, names)

    def test_legacy_jsonld_is_isolated_in_explicit_compatibility_graphs(self) -> None:
        dataset = MODULE.assemble_dataset(include_legacy=True)
        names = {str(graph.identifier) for graph in dataset.contexts()}
        self.assertTrue(any(name.startswith(MODULE.LEGACY_GRAPH_BASE) for name in names))

    def test_fingerprint_is_independent_of_source_file_order(self) -> None:
        forward = MODULE.assemble_dataset(include_legacy=False, trig_paths=MODULE.CANONICAL_TRIG)
        reverse = MODULE.assemble_dataset(
            include_legacy=False, trig_paths=tuple(reversed(MODULE.CANONICAL_TRIG))
        )
        self.assertEqual(MODULE.dataset_fingerprint(forward), MODULE.dataset_fingerprint(reverse))

    def test_non_project_graph_is_rejected(self) -> None:
        dataset = Dataset()
        dataset.graph(URIRef("https://example.invalid/graph")).add(
            (URIRef("https://example.invalid/s"), RDF.type, URIRef("https://example.invalid/T"))
        )
        with self.assertRaisesRegex(ValueError, "Unsupported graph identity"):
            MODULE.validate_dataset_contract(dataset)

    def test_blank_node_identity_outside_shapes_is_rejected(self) -> None:
        dataset = Dataset()
        dataset.graph(URIRef(f"{MODULE.GRAPH_BASE}knowledge/test")).add(
            (BNode(), RDF.type, URIRef("https://example.invalid/T"))
        )
        with self.assertRaisesRegex(ValueError, "Blank-node subjects"):
            MODULE.validate_dataset_contract(dataset)

    def test_same_typed_subject_owned_by_two_canonical_graphs_is_rejected(self) -> None:
        dataset = Dataset()
        subject = URIRef("https://w3id.org/project-chemie-digital/resource/conflict")
        object_type = URIRef("https://w3id.org/project-chemie-digital/ontology/Concept")
        dataset.graph(URIRef(f"{MODULE.GRAPH_BASE}knowledge/a")).add((subject, RDF.type, object_type))
        dataset.graph(URIRef(f"{MODULE.GRAPH_BASE}scenes/a")).add((subject, RDF.type, object_type))
        with self.assertRaisesRegex(ValueError, "multiple owned graphs"):
            MODULE.validate_dataset_contract(dataset)


if __name__ == "__main__":
    unittest.main()
