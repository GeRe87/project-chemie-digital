from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from rdflib import BNode, Dataset, Literal, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("rdf_dataset", ROOT / "scripts" / "rdf_dataset.py")
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

VALIDATION_SPEC = importlib.util.spec_from_file_location("validate_semantics", ROOT / "scripts" / "validate_semantics.py")
assert VALIDATION_SPEC and VALIDATION_SPEC.loader
VALIDATION_MODULE = importlib.util.module_from_spec(VALIDATION_SPEC)
VALIDATION_SPEC.loader.exec_module(VALIDATION_MODULE)

EXPECTED_CANONICAL_GRAPHS = {
    "https://w3id.org/project-chemie-digital/graph/core",
    "https://w3id.org/project-chemie-digital/graph/concepts",
    "https://w3id.org/project-chemie-digital/graph/shapes/core",
    "https://w3id.org/project-chemie-digital/graph/specifications/standard-deviation",
    "https://w3id.org/project-chemie-digital/graph/examples/standard-deviation",
    "https://w3id.org/project-chemie-digital/graph/sources/standard-deviation",
    "https://w3id.org/project-chemie-digital/graph/scenes/standard-deviation",
    "https://w3id.org/project-chemie-digital/graph/paths/standard-deviation",
    "https://w3id.org/project-chemie-digital/graph/migration/standard-deviation",
}
STANDARD_DEVIATION = URIRef(f"{MODULE.RESOURCE_BASE}standard-deviation")
PREF_LABEL = URIRef("http://www.w3.org/2004/02/skos/core#prefLabel")
HAS_SOURCE = URIRef("https://w3id.org/project-chemie-digital/ontology/hasSource")


def populated_graph_names(dataset: Dataset) -> set[str]:
    return {str(identifier) for identifier in MODULE.populated_graph_ids(dataset)}


class RdfDatasetTests(unittest.TestCase):
    def test_every_canonical_trig_source_parses_independently(self) -> None:
        self.assertGreater(len(MODULE.CANONICAL_TRIG), 0)
        for path in MODULE.CANONICAL_TRIG:
            with self.subTest(path=path.relative_to(ROOT).as_posix()):
                parsed = Dataset(default_union=False)
                parsed.parse(path, format="trig")
                names = populated_graph_names(parsed)
                self.assertTrue(names)
                self.assertTrue(names <= EXPECTED_CANONICAL_GRAPHS)

    def test_canonical_dataset_uses_exact_stable_named_graphs(self) -> None:
        self.assertEqual(EXPECTED_CANONICAL_GRAPHS, populated_graph_names(MODULE.assemble_dataset()))

    def test_no_legacy_graphs_are_assembled(self) -> None:
        names = populated_graph_names(MODULE.assemble_dataset())
        self.assertFalse(any("/graph/legacy/" in name for name in names))

    def test_empty_default_graph_is_not_an_owned_graph(self) -> None:
        dataset = MODULE.assemble_dataset()
        self.assertEqual(0, len(dataset.default_graph))
        self.assertNotIn(str(dataset.default_graph.identifier), populated_graph_names(dataset))

    def test_populated_default_graph_is_rejected(self) -> None:
        dataset = Dataset(default_union=False)
        dataset.default_graph.add((URIRef("https://example.invalid/s"), RDF.type, URIRef("https://example.invalid/T")))
        with self.assertRaisesRegex(ValueError, "Unsupported graph identity"):
            MODULE.validate_dataset_contract(dataset)

    def test_assembled_dataset_validates_against_named_shapes_graph(self) -> None:
        conforms, report = VALIDATION_MODULE.run_validation()
        self.assertTrue(conforms, report)
        self.assertIn("Dataset fingerprint:", report)

    def test_assembled_standard_deviation_has_exact_bilingual_labels_and_no_direct_source(self) -> None:
        dataset = MODULE.assemble_dataset()
        labels = {obj for _s, _p, obj, _g in dataset.quads((STANDARD_DEVIATION, PREF_LABEL, None, None))}
        self.assertEqual({Literal("Standardabweichung", lang="de"), Literal("standard deviation", lang="en")}, labels)
        self.assertEqual([], list(dataset.quads((STANDARD_DEVIATION, HAS_SOURCE, None, None))))

    def test_fingerprint_is_independent_of_source_file_order(self) -> None:
        forward = MODULE.assemble_dataset(trig_paths=MODULE.CANONICAL_TRIG)
        reverse = MODULE.assemble_dataset(trig_paths=tuple(reversed(MODULE.CANONICAL_TRIG)))
        self.assertEqual(MODULE.dataset_fingerprint(forward), MODULE.dataset_fingerprint(reverse))

    def test_fingerprint_is_stable_across_independent_fresh_assemblies(self) -> None:
        fingerprints = {
            MODULE.dataset_fingerprint(MODULE.assemble_dataset())
            for _ in range(4)
        }
        self.assertEqual(1, len(fingerprints))

    def test_fingerprint_ignores_parser_local_blank_node_identifiers(self) -> None:
        graph = URIRef(f"{MODULE.GRAPH_BASE}shapes/fingerprint")
        predicate = URIRef("https://example.invalid/predicate")
        left = Dataset(default_union=False)
        right = Dataset(default_union=False)
        left.graph(graph).add((BNode("left-parser-id"), predicate, Literal("same structure")))
        right.graph(graph).add((BNode("right-parser-id"), predicate, Literal("same structure")))
        self.assertEqual(MODULE.dataset_fingerprint(left), MODULE.dataset_fingerprint(right))

    def test_fingerprint_preserves_named_graph_identity(self) -> None:
        subject = URIRef("https://example.invalid/subject")
        predicate = URIRef("https://example.invalid/predicate")
        obj = Literal("same triple")
        left = Dataset(default_union=False)
        right = Dataset(default_union=False)
        left.graph(URIRef(f"{MODULE.GRAPH_BASE}tests/fingerprint-a")).add((subject, predicate, obj))
        right.graph(URIRef(f"{MODULE.GRAPH_BASE}tests/fingerprint-b")).add((subject, predicate, obj))
        self.assertNotEqual(MODULE.dataset_fingerprint(left), MODULE.dataset_fingerprint(right))

    def test_canonical_nquads_preserves_literal_metadata_and_control_escapes(self) -> None:
        dataset = Dataset(default_union=False)
        graph = URIRef(f"{MODULE.GRAPH_BASE}tests/nquads")
        subject = URIRef(f"{MODULE.RESOURCE_BASE}nquads-test")
        language_predicate = URIRef("https://example.invalid/language")
        datatype_predicate = URIRef("https://example.invalid/datatype")
        language_literal = Literal('Zeile 1\n"Zeile 2"\\Ende', lang="de")
        datatype_literal = Literal("42", datatype=URIRef("http://www.w3.org/2001/XMLSchema#integer"))
        dataset.graph(graph).add((subject, language_predicate, language_literal))
        dataset.graph(graph).add((subject, datatype_predicate, datatype_literal))

        serialized = MODULE.canonical_nquads(dataset)
        self.assertIn('"Zeile 1\\n\\"Zeile 2\\"\\\\Ende"@de', serialized)
        self.assertIn('"42"^^<http://www.w3.org/2001/XMLSchema#integer>', serialized)

        parsed = Dataset(default_union=False)
        parsed.parse(data=serialized, format="nquads")
        self.assertIn(
            (subject, language_predicate, language_literal, graph),
            set(parsed.quads((subject, language_predicate, None, graph))),
        )
        self.assertIn(
            (subject, datatype_predicate, datatype_literal, graph),
            set(parsed.quads((subject, datatype_predicate, None, graph))),
        )

    def test_non_project_graph_is_rejected(self) -> None:
        dataset = Dataset()
        dataset.graph(URIRef("https://example.invalid/graph")).add((URIRef("https://example.invalid/s"), RDF.type, URIRef("https://example.invalid/T")))
        with self.assertRaisesRegex(ValueError, "Unsupported graph identity"):
            MODULE.validate_dataset_contract(dataset)

    def test_blank_node_identity_outside_shapes_is_rejected(self) -> None:
        dataset = Dataset()
        dataset.graph(URIRef(f"{MODULE.GRAPH_BASE}knowledge/test")).add((BNode(), RDF.type, URIRef("https://example.invalid/T")))
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
