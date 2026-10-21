"""Level 4 scientific graph: reusable typed knowledge, explicit conventions and exact synthetic fixtures."""
from __future__ import annotations

from decimal import Decimal
import statistics
import sys
import unittest
from pathlib import Path

from rdflib import Namespace, RDF, SKOS
from rdflib.namespace import OWL

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import rdf_dataset
import validate_semantics

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
GRAPH_SPEC = "https://w3id.org/project-chemie-digital/graph/specifications/level4-distribution-shape"
GRAPH_SRC = "https://w3id.org/project-chemie-digital/graph/sources/level4-distribution-shape"
GRAPH_EXAMPLE = "https://w3id.org/project-chemie-digital/graph/examples/level4-synthetic-qc"

class Level4KnowledgeGraphTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset(include_legacy=False)
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.spec = cls.dataset.graph(GRAPH_SPEC)
        cls.sources = cls.dataset.graph(GRAPH_SRC)
        cls.examples = cls.dataset.graph(GRAPH_EXAMPLE)

    def test_scientific_resources_are_only_authored_in_named_science_graph(self):
        self.assertTrue(len(self.spec) > 0)
        self.assertTrue(len(self.sources) > 0)
        self.assertTrue(len(self.examples) > 0)
        self.assertEqual([], list(self.spec.subjects(RDF.type, CD.SceneDefinition)))
        self.assertEqual([], list(self.spec.subjects(RDF.type, CD.LearningPath)))
        self.assertEqual([], list(self.spec.subjects(RDF.type, CD.ChartDefinition)))

    def test_every_new_concept_has_exact_en_de_labels_a_definition_and_qualified_source(self):
        subjects = list(self.spec.subjects(RDF.type, CD.Concept))
        self.assertGreaterEqual(len(subjects), 30)
        for subject in subjects:
            labels = list(self.union.objects(subject, SKOS.prefLabel))
            self.assertEqual(1, sum(label.language == "en" for label in labels), subject)
            self.assertEqual(1, sum(label.language == "de" for label in labels), subject)
            definitions = list(self.union.objects(subject, CD.hasDefinition))
            self.assertEqual(1, len(definitions), subject)
            for definition in definitions:
                self.assertIn((definition, RDF.type, CD.Definition), self.spec)
                self.assertTrue(list(self.union.objects(definition, CD.body)), definition)
                source, = list(self.union.objects(definition, CD.hasSource))
                self.assertIn((source, CD.supportsResource, definition), self.sources)

    def test_new_source_urls_are_primary_and_no_placeholder_identities(self):
        sources = list(self.sources.subjects(RDF.type, CD.Source))
        self.assertEqual(5, len(sources))
        for item in sources:
            self.assertNotIn("example.org", str(item))
            self.assertGreater(len(list(self.union.objects(item, CD.supportsResource))), 0)
            self.assertEqual(1, len(list(self.union.objects(item, CD.authoredResource))))
            for target in self.union.objects(item, CD.supportsResource):
                self.assertIn((target, CD.hasSource, item), self.spec)

    def test_formulas_have_separate_population_and_sample_conventions(self):
        for concept in ("population-quantile", "sample-quantile-type-1", "sample-quantile-type-7",
                        "central-moment", "empirical-central-moment", "skewness", "kurtosis",
                        "excess-kurtosis", "sample-skewness", "sample-excess-kurtosis"):
            self.assertTrue(list(self.union.objects(EX[concept], CD.hasMathExpression)), concept)
        self.assertNotIn((EX["sample-quantile-type-1"], OWL.sameAs, EX["sample-quantile-type-7"]), self.union)
        self.assertIn((EX["empirical-central-moment"], SKOS.related, EX["sample-variance"]), self.spec)
        self.assertIn((EX["sample-skewness"], CD.prerequisite, EX["empirical-central-moment"]), self.spec)

    def test_method_ambiguities_have_explicit_corrections(self):
        for key in ("quantile-convention", "outlier-is-error", "mad-unscaled", "n-minus-one-all",
                    "zero-skew-symmetry", "kurtosis-peak"):
            concept = EX["l4-misconception-" + key]
            self.assertIn((concept, RDF.type, CD.Misconception), self.spec)
            correction = next(self.spec.objects(concept, CD.hasCorrection))
            self.assertIn((correction, RDF.type, CD.Correction), self.spec)
            self.assertTrue(list(self.union.objects(correction, CD.hasSource)))

    def observation_values(self, name):
        dataset = EX[name]
        observations = list(self.union.objects(dataset, CD.hasObservation))
        self.assertEqual(7, len(observations))
        ordered = sorted(observations, key=lambda v: int(next(self.union.objects(v, CD.position))))
        return [Decimal(str(next(self.union.objects(o, CD.numericValue)))) for o in ordered]

    @staticmethod
    def r_type7(xs, p):
        a = sorted(xs)
        h = Decimal(1) + (Decimal(len(a)) - 1) * Decimal(str(p))
        j = int(h)
        if j == len(a):
            return a[-1]
        delta = h - Decimal(j)
        return (Decimal(1) - delta) * a[j-1] + delta * a[j]

    def test_synthetic_qc_values_and_authored_results(self):
        for name, last, m2 in (("l4-qc-reference", Decimal(7), Decimal("2.204081632653061")),
                               ("l4-qc-extreme", Decimal(30), Decimal(82))):
            xs = self.observation_values(name)
            self.assertEqual(last, xs[-1])
            median = Decimal(statistics.median(xs))
            q1, q3 = self.r_type7(xs, ".25"), self.r_type7(xs, ".75")
            expected = {"q1": q1, "median": median, "q3": q3, "iqr": q3-q1,
                        "mad": Decimal(statistics.median(abs(v-median) for v in xs))}
            mean = sum(xs) / Decimal(len(xs))
            actual_m2 = sum((x-mean)**2 for x in xs) / Decimal(len(xs))
            self.assertLess(abs(actual_m2 - m2), Decimal("1e-12"))
            expected["m2"] = actual_m2
            for key, calc in expected.items():
                result = EX[name + "-" + key]
                self.assertIn((result, CD.usesDataset, EX[name]), self.examples)
                declared = Decimal(str(next(self.union.objects(result, CD.numericValue))))
                self.assertLess(abs(calc-declared), Decimal("1e-12"), result)
        # Type 1 (inverse ECDF) and type 7 interpolated quartiles need not coincide.
        xs = [Decimal(2), Decimal(4), Decimal(5), Decimal(8)]
        self.assertEqual(Decimal(2), sorted(xs)[0])
        self.assertEqual(Decimal("3.5"), self.r_type7(xs, ".25"))

if __name__ == "__main__":
    unittest.main()
