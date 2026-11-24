from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

from rdflib import BNode, Dataset, Literal, RDF, URIRef
from rdflib.compare import isomorphic

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("rdf_dataset", ROOT / "scripts" / "rdf_dataset.py")
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

import validate_semantics as VALIDATION_MODULE  # noqa: E402

def canonical_source_graph_names() -> set[str]:
    names: set[str] = set()
    for path in MODULE.CANONICAL_TRIG:
        parsed = Dataset(default_union=False)
        parsed.parse(path, format="trig")
        names.update(populated_graph_names(parsed))
    return names

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
                self.assertTrue(all(name.startswith(MODULE.GRAPH_BASE) for name in names))
                self.assertFalse(any("/graph/legacy/" in name for name in names))

    def test_assemble_dataset_normalizes_crlf_inside_multiline_literals(self) -> None:
        graph = f"{MODULE.GRAPH_BASE}tests/crlf"
        subject = f"{MODULE.RESOURCE_BASE}crlf-test"
        predicate = "https://example.invalid/body"
        source = (
            f"<{graph}> {{\r\n"
            f"  <{subject}> <{predicate}> \"\"\"line one\r\nline two\"\"\" .\r\n"
            "}\r\n"
        )
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "crlf.trig"
            path.write_bytes(source.encode("utf-8"))
            dataset = MODULE.assemble_dataset(trig_paths=(path,))

        value = next(dataset.graph(URIRef(graph)).objects(URIRef(subject), URIRef(predicate)))
        self.assertEqual("line one\nline two", str(value))

    def test_canonical_dataset_uses_exact_authored_named_graphs(self) -> None:
        self.assertEqual(canonical_source_graph_names(), populated_graph_names(MODULE.assemble_dataset()))

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

    def test_canonical_nquads_keeps_coincident_blank_structures_distinct(self) -> None:
        dataset = Dataset(default_union=False)
        graphs = tuple(URIRef(f"{MODULE.SHAPES_GRAPH_BASE}coincident-{i}") for i in range(2))
        predicate = URIRef("https://example.invalid/predicate")
        value = Literal('same\n"structure"', lang="de")
        for index, graph in enumerate(graphs):
            dataset.graph(graph).add((BNode(f"independent-{index}"), predicate, value))

        parsed = Dataset(default_union=False)
        parsed.parse(data=MODULE.canonical_nquads(dataset), format="nquads")
        # Inspect parsed RDF terms, not labels or another canonical serialization.
        nodes = []
        for graph in graphs:
            triples = set(parsed.graph(graph))
            self.assertEqual(1, len(triples))
            node, actual_predicate, actual_value = triples.pop()
            self.assertIsInstance(node, BNode)
            self.assertEqual(predicate, actual_predicate)
            self.assertEqual(value, actual_value)
            nodes.append(node)
        self.assertNotEqual(nodes[0], nodes[1])
        self.assertEqual(set(graphs), {g for *_triple, g in parsed.quads((None, None, None, None))})
        self.assertEqual(2, sum(1 for _ in parsed.quads((None, None, None, None))))

    def test_canonical_nquads_retains_shared_nodes_and_separate_components(self) -> None:
        dataset = Dataset(default_union=False)
        graphs = tuple(URIRef(f"{MODULE.SHAPES_GRAPH_BASE}shared-{i}") for i in range(4))
        predicate = URIRef("https://example.invalid/predicate")
        link = URIRef("https://example.invalid/link")
        anchor = URIRef("https://example.invalid/anchor")
        shared, local, independent = (BNode(name) for name in ("shared", "local", "independent"))
        value = Literal("same structure")
        dataset.graph(graphs[0]).add((shared, predicate, value))
        dataset.graph(graphs[1]).add((shared, link, local))
        dataset.graph(graphs[1]).add((local, predicate, Literal("local")))
        dataset.graph(graphs[2]).add((anchor, link, shared))
        dataset.graph(graphs[3]).add((independent, predicate, value))

        serialized = MODULE.canonical_nquads(dataset)
        parsed = Dataset(default_union=False)
        parsed.parse(data=serialized, format="nquads")
        shared_after = next(parsed.graph(graphs[2]).objects(anchor, link))
        local_after = next(parsed.graph(graphs[1]).objects(shared_after, link))
        independent_after = next(parsed.graph(graphs[3]).subjects(predicate, value))
        self.assertTrue(all(isinstance(node, BNode) for node in (shared_after, local_after, independent_after)))
        self.assertEqual(3, len({shared_after, local_after, independent_after}))
        self.assertEqual(
            {
                (shared_after, predicate, value, graphs[0]),
                (shared_after, link, local_after, graphs[1]),
                (local_after, predicate, Literal("local"), graphs[1]),
                (anchor, link, shared_after, graphs[2]),
                (independent_after, predicate, value, graphs[3]),
            },
            set(parsed.quads((None, None, None, None))),
        )

        # Relabel globally and reverse insertion order without losing shared identity.
        relabeled = Dataset(default_union=False)
        mapping = {shared: BNode("z"), local: BNode("y"), independent: BNode("x")}
        for subject, pred, obj, graph in reversed(list(dataset.quads((None, None, None, None)))):
            relabeled.graph(graph).add((mapping.get(subject, subject), pred, mapping.get(obj, obj)))
        self.assertEqual(serialized, MODULE.canonical_nquads(relabeled))
        self.assertEqual(MODULE.dataset_fingerprint(dataset), MODULE.dataset_fingerprint(relabeled))

    def test_full_authored_dataset_nquads_roundtrip_preserves_identity(self) -> None:
        dataset = MODULE.assemble_dataset()
        parsed = Dataset(default_union=False)
        serialized = MODULE.canonical_nquads(dataset)
        parsed.parse(data=serialized, format="nquads")

        # Compare inventories derived independently from RDF terms on both sides:
        # per-graph isomorphism alone cannot detect merged blank nodes.
        inventories = []
        for candidate in (dataset, parsed):
            owners: dict[BNode, set[URIRef]] = {}
            graph_ids: set[URIRef] = set()
            quad_count = 0
            for subject, _predicate, obj, graph in candidate.quads((None, None, None, None)):
                quad_count += 1
                graph_ids.add(graph)
                for term in (subject, obj):
                    if isinstance(term, BNode):
                        owners.setdefault(term, set()).add(graph)
            ownership_degrees: dict[int, int] = {}
            for graphs in owners.values():
                degree = len(graphs)
                ownership_degrees[degree] = ownership_degrees.get(degree, 0) + 1
            inventories.append((graph_ids, quad_count, len(owners), ownership_degrees))
            self.assertEqual(0, len(candidate.default_graph))
        self.assertEqual(inventories[0], inventories[1])
        self.assertEqual(serialized, MODULE.canonical_nquads(parsed))

        original_graphs = {g for *_triple, g in dataset.quads((None, None, None, None))}
        parsed_graphs = {g for *_triple, g in parsed.quads((None, None, None, None))}
        self.assertEqual(original_graphs, parsed_graphs)
        for graph in original_graphs:
            with self.subTest(graph=str(graph)):
                self.assertTrue(isomorphic(dataset.graph(graph), parsed.graph(graph)))
                self.assertEqual(
                    {(predicate, obj) for _subject, predicate, obj in dataset.graph(graph) if isinstance(obj, Literal)},
                    {(predicate, obj) for _subject, predicate, obj in parsed.graph(graph) if isinstance(obj, Literal)},
                )
        self.assertEqual(MODULE.dataset_fingerprint(dataset), MODULE.dataset_fingerprint(parsed))

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
