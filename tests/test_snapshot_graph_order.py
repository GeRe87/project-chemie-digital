"""Named graphs remain distinct; their iteration order is not transport order."""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from rdflib import Dataset, Namespace, RDF, URIRef

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import generate_canonical_runtime as compiler


class SnapshotGraphOrderTests(unittest.TestCase):
    def fixture(self, reverse=False):
        ex = Namespace(compiler.EX)
        graph_a = URIRef("https://example.org/graph/a")
        graph_z = URIRef("https://example.org/graph/z")
        quads = [
            (ex.alpha, RDF.type, ex.NeutralEntity, graph_a),
            (ex.beta, RDF.type, ex.NeutralEntity, graph_a),
            (ex.alpha, ex.relatedTo, ex.beta, graph_z),
            (ex.alpha, ex.relatedTo, ex.beta, graph_a),
        ]
        dataset = Dataset()
        for quad in reversed(quads) if reverse else quads:
            dataset.add(quad)
        return dataset

    def test_graph_ties_have_an_explicit_canonical_order_without_merging_provenance(self):
        dataset = self.fixture()
        snapshot = compiler.dataset_snapshot(dataset, "fixture", "en")
        statements = snapshot["statements"]
        self.assertEqual(len(statements), 2)
        self.assertEqual(
            [record["source"][0]["provenanceIds"] for record in statements],
            [["https://example.org/graph/a"], ["https://example.org/graph/z"]],
        )
        self.assertEqual(statements[0]["sourceEntityId"], statements[1]["sourceEntityId"])
        self.assertEqual(statements[0]["predicateId"], statements[1]["predicateId"])
        self.assertEqual(statements[0]["targetEntityId"], statements[1]["targetEntityId"])

    def test_reversed_quad_insertion_preserves_the_exact_snapshot(self):
        left = compiler.dataset_snapshot(self.fixture(), "fixture", "en")
        right = compiler.dataset_snapshot(self.fixture(reverse=True), "fixture", "en")
        self.assertEqual(compiler.canonical_json(left), compiler.canonical_json(right))

    def test_reversed_quad_enumeration_cannot_break_named_graph_sort_ties(self):
        dataset = self.fixture()
        native_quads = dataset.quads
        results = []
        for reverse in [False, True]:
            def quads(pattern=None):
                return iter(sorted(native_quads(pattern), key=lambda q: tuple(str(term) for term in q), reverse=reverse))
            with patch.object(dataset, "quads", side_effect=quads):
                results.append(compiler.canonical_json(compiler.dataset_snapshot(dataset, "fixture", "en")))
        self.assertEqual(results[0], results[1])


if __name__ == "__main__":
    unittest.main()
