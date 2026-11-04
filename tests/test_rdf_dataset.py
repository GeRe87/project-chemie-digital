from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

from rdflib import BNode, Dataset, Literal, RDF, URIRef

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

    def test_canonical_nquads_does_not_merge_disjoint_shape_nodes(self) -> None:
        dataset = Dataset(default_union=False)
        predicate = URIRef("https://example.invalid/property")
        a = URIRef(f"{MODULE.SHAPES_GRAPH_BASE}disjoint-a")
        b = URIRef(f"{MODULE.SHAPES_GRAPH_BASE}disjoint-b")
        dataset.graph(a).add((BNode("a"), predicate, Literal("same structure")))
        dataset.graph(b).add((BNode("b"), predicate, Literal("same structure")))
        MODULE.validate_dataset_contract(dataset)

        parsed = Dataset(default_union=False)
        serialized = MODULE.canonical_nquads(dataset)
        parsed.parse(data=serialized, format="nquads")
        self.assertNotEqual(next(parsed.graph(a).subjects()), next(parsed.graph(b).subjects()))
        self.assertNotIn("urn:project-chemie-digital:canonical-quad:", serialized)
        self.assertEqual(2, len(list(parsed.quads((None, None, None, None)))))

    def test_canonical_nquads_preserves_shared_nodes_across_graphs_and_positions(self) -> None:
        dataset = Dataset(default_union=False)
        a = URIRef(f"{MODULE.SHAPES_GRAPH_BASE}shared-a")
        b = URIRef(f"{MODULE.SHAPES_GRAPH_BASE}shared-b")
        c = URIRef(f"{MODULE.SHAPES_GRAPH_BASE}shared-c")
        p = URIRef("https://example.invalid/property")
        anchor = URIRef("https://example.invalid/anchor")
        shared, peer = BNode("shared"), BNode("peer")
        dataset.graph(a).add((anchor, p, shared))
        dataset.graph(b).add((shared, p, peer))
        dataset.graph(c).add((peer, p, shared))
        dataset.graph(c).add((shared, p, Literal("shared across all three")))
        MODULE.validate_dataset_contract(dataset)

        parsed = Dataset(default_union=False)
        parsed.parse(data=MODULE.canonical_nquads(dataset), format="nquads")
        restored_shared = next(parsed.graph(a).objects(anchor, p))
        restored_peer = next(parsed.graph(b).objects(restored_shared, p))
        self.assertIn((restored_peer, p, restored_shared), parsed.graph(c))
        self.assertIn((restored_shared, p, Literal("shared across all three")), parsed.graph(c))
        self.assertNotEqual(restored_peer, restored_shared)
        self.assertEqual(MODULE.dataset_fingerprint(dataset), MODULE.dataset_fingerprint(parsed))

    def test_fingerprint_distinguishes_shared_and_disjoint_blank_node_topology(self) -> None:
        shared = Dataset(default_union=False)
        disjoint = Dataset(default_union=False)
        predicate = URIRef("https://example.invalid/property")
        for name in ("a", "b"):
            graph = URIRef(f"{MODULE.SHAPES_GRAPH_BASE}topology-{name}")
            shared.graph(graph).add((BNode("shared"), predicate, Literal(name)))
            disjoint.graph(graph).add((BNode(name), predicate, Literal(name)))
        # Each individual named graph is isomorphic; only dataset-wide identity differs.
        self.assertNotEqual(MODULE.dataset_fingerprint(shared), MODULE.dataset_fingerprint(disjoint))

    def test_shared_node_canonicalization_ignores_labels_insertion_order_and_graph_order(self) -> None:
        predicate = URIRef("https://example.invalid/property")
        graphs = [URIRef(f"{MODULE.SHAPES_GRAPH_BASE}order-{name}") for name in ("a", "b", "c")]
        results = set()
        for index in range(4):
            dataset = Dataset(default_union=False)
            a, b, c = [BNode(f"parse-{index}-{name}") for name in ("a", "b", "c")]
            quads = [(a, predicate, b, graphs[0]), (b, predicate, a, graphs[1]),
                     (a, predicate, Literal("context", lang="de"), graphs[1]),
                     (c, predicate, Literal("unrelated"), graphs[2]),
                     (a, predicate, b, graphs[1])]
            for quad in quads if index % 2 else reversed(quads):
                dataset.add(quad)
            results.add(MODULE.canonical_nquads(dataset))
        self.assertEqual(1, len(results))
        parsed = Dataset(default_union=False)
        parsed.parse(data=next(iter(results)), format="nquads")
        self.assertEqual(5, len(list(parsed.quads((None, None, None, None)))))

    def test_canonical_corpus_roundtrip_preserves_blank_node_graph_memberships(self) -> None:
        from collections import Counter

        def memberships(dataset: Dataset) -> Counter:
            graphs_by_node: dict[BNode, set[str]] = {}
            for subject, _predicate, obj, graph in dataset.quads((None, None, None, None)):
                for node in (subject, obj):
                    if isinstance(node, BNode):
                        graphs_by_node.setdefault(node, set()).add(str(graph))
            return Counter(tuple(sorted(graphs)) for graphs in graphs_by_node.values())

        source = MODULE.assemble_dataset()
        parsed = Dataset(default_union=False)
        parsed.parse(data=MODULE.canonical_nquads(source), format="nquads")
        self.assertEqual(memberships(source), memberships(parsed))
        self.assertEqual(len(list(source.quads((None, None, None, None)))),
                         len(list(parsed.quads((None, None, None, None)))))
        self.assertEqual(MODULE.dataset_fingerprint(source), MODULE.dataset_fingerprint(parsed))

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
