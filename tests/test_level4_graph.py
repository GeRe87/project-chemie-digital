"""Level 4 scientific graph: reusable typed knowledge, explicit conventions and exact synthetic fixtures."""
from __future__ import annotations

from decimal import Decimal, ROUND_CEILING
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
        self.assertEqual(6, len(sources))
        for item in sources:
            self.assertNotIn("example.org", str(item))
            self.assertGreater(len(list(self.union.objects(item, CD.supportsResource))), 0)
            self.assertEqual(1, len(list(self.union.objects(item, CD.authoredResource))))
            for target in self.union.objects(item, CD.supportsResource):
                # A shared source can now also support the new order-statistics
                # science graph; named graphs assemble into one logical dataset.
                self.assertIn((target, CD.hasSource, item), self.union)
                owners={str(g) for _,_,_,g in self.dataset.quads((target,CD.hasSource,item,None))}
                self.assertTrue(owners <= {GRAPH_SPEC,"https://w3id.org/project-chemie-digital/graph/specifications/level4-order-statistics"},owners)

    def test_formulas_have_separate_population_and_sample_conventions(self):
        for concept in ("population-quantile", "sample-quantile-type-1", "sample-quantile-type-7",
                        "central-moment", "empirical-central-moment", "skewness", "kurtosis",
                        "excess-kurtosis", "sample-skewness", "sample-excess-kurtosis"):
            self.assertTrue(list(self.union.objects(EX[concept], CD.hasMathExpression)), concept)
        self.assertNotIn((EX["sample-quantile-type-1"], OWL.sameAs, EX["sample-quantile-type-7"]), self.union)
        self.assertIn((EX["empirical-central-moment"], SKOS.related, EX["sample-variance"]), self.spec)
        self.assertIn((EX["sample-skewness"], CD.prerequisite, EX["empirical-central-moment"]), self.spec)
        self.assertIn((EX["empirical-second-central-moment"], SKOS.broader, EX["empirical-central-moment"]), self.spec)
        for method_id in ("first-quartile", "third-quartile"):
            self.assertIn((EX[method_id], SKOS.broader, EX["quartile"]), self.spec)

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
    def r_type1(xs, p):
        values = sorted(xs)
        probability = Decimal(str(p))
        if not values or not Decimal(0) <= probability <= Decimal(1):
            raise ValueError("Quantile input must be non-empty and 0 <= p <= 1")
        if probability == 0:
            return values[0]
        rank = int((Decimal(len(values)) * probability).to_integral_value(rounding=ROUND_CEILING))
        return values[rank - 1]

    @staticmethod
    def r_type7(xs, p):
        values = sorted(xs)
        probability = Decimal(str(p))
        if not values or not Decimal(0) <= probability <= Decimal(1):
            raise ValueError("Quantile input must be non-empty and 0 <= p <= 1")
        if len(values) == 1:
            return values[0]
        if probability == 1:
            return values[-1]
        h = Decimal(1) + (Decimal(len(values)) - 1) * probability
        j = int(h)
        delta = h - Decimal(j)
        return (Decimal(1) - delta) * values[j-1] + delta * values[j]

    @staticmethod
    def tukey_hinges_even(xs):
        values = sorted(xs)
        if len(values) < 2 or len(values) % 2:
            raise ValueError("Even sample size >=2 is required")
        halfway = len(values) // 2
        return (statistics.median(values[:halfway]), statistics.median(values[halfway:]))

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
                expected_property = {
                    "q1": "first-quartile", "q3": "third-quartile", "median": "median",
                    "iqr": "interquartile-range", "mad": "median-absolute-deviation",
                    "m2": "empirical-second-central-moment",
                }[key]
                self.assertIn((result, CD.quantifiesProperty, EX[expected_property]), self.examples)
                if key in {"q1", "q3", "median", "iqr"}:
                    self.assertIn((result, CD.dependsOn, EX["sample-quantile-type-7"]), self.examples)
                self.assertIn((result, CD.usesDataset, EX[name]), self.examples)
                declared = Decimal(str(next(self.union.objects(result, CD.numericValue))))
                self.assertLess(abs(calc-declared), Decimal("1e-12"), result)
        # Type 1 (inverse ECDF) and type 7 interpolated quartiles need not coincide.
        xs = [Decimal(2), Decimal(4), Decimal(5), Decimal(8)]
        self.assertEqual(Decimal(2), self.r_type1(xs, ".25"))
        self.assertEqual(Decimal("3.5"), self.r_type7(xs, ".25"))

    def test_quantile_domains_endpoints_and_singletons(self):
        values = [Decimal(2), Decimal(4), Decimal(5), Decimal(8)]
        for method in (self.r_type1, self.r_type7):
            self.assertEqual(Decimal(2), method(values, 0))
            self.assertEqual(Decimal(8), method(values, 1))
            for p in (0, Decimal("0.25"), Decimal("0.5"), 1):
                self.assertEqual(Decimal(11), method([Decimal(11)], p))
            for bad in (-0.01, 1.01):
                with self.assertRaises(ValueError):
                    method(values, bad)
            with self.assertRaises(ValueError):
                method([], Decimal(".5"))
        formula = str(next(self.spec.objects(EX["l4-formula-sample-quantile-type-7"], CD.latex)))
        for required in (r"\begin{cases}", "n=1", "p=1", r"0\le p<1", "x_{(j+1)}"):
            self.assertIn(required, formula)

    def test_empirical_iqr_formula_is_method_bound_and_not_a_population_quantile(self):
        formula_resource = EX["l4-formula-interquartile-range"]
        expression = str(next(self.spec.objects(formula_resource, CD.latex)))
        self.assertIn(r"\widehat Q(0.75)", expression)
        self.assertIn(r"\widehat Q(0.25)", expression)
        self.assertNotIn("=Q(0.75)", expression)
        self.assertIn((formula_resource, CD.dependsOn, EX["sample-quantile-type-7"]), self.spec)

    def test_type7_quartiles_differ_from_boxplot_hinges_for_even_n(self):
        xs = [Decimal(2), Decimal(4), Decimal(5), Decimal(8)]
        lower, upper = self.tukey_hinges_even(xs)
        self.assertEqual((Decimal(3), Decimal("6.5")), (lower, upper))
        self.assertEqual((Decimal("3.5"), Decimal("5.75")),
                         (self.r_type7(xs, ".25"), self.r_type7(xs, ".75")))
        self.assertNotEqual(lower, self.r_type7(xs, ".25"))
        self.assertNotEqual(upper, self.r_type7(xs, ".75"))

    def test_zero_empirical_dispersion_forbids_standardized_shape(self):
        xs = [Decimal(11)] * 5
        mean = sum(xs) / Decimal(len(xs))
        m2 = sum((value - mean)**2 for value in xs) / Decimal(len(xs))
        self.assertEqual(Decimal(0), m2)
        self.assertEqual(Decimal(0), sum((value - mean)**3 for value in xs))
        for id_ in ("sample-skewness", "sample-excess-kurtosis", "standardized-central-moment"):
            self.assertIn((EX[id_], CD.hasInterpretation,
                           EX["l4-interpretation-zero-dispersion"]), self.spec)
        for id_ in ("l4-def-sample-skewness", "l4-def-sample-excess-kurtosis"):
            self.assertIn("m2>0", str(next(self.spec.objects(EX[id_], CD.body))))
        with self.assertRaises(ZeroDivisionError):
            float(0) / float(m2)

    def test_provenance_supports_bessel_and_missing_value_claims(self):
        correct = EX["l4-source-nist-variance"]
        irrelevant = EX["l4-source-nist-skew-kurt"]
        for resource_id in ("l4-def-empirical-second-central-moment",
                            "l4-interpretation-variance-denominator"):
            obj = EX[resource_id]
            self.assertEqual({correct}, set(self.spec.objects(obj, CD.hasSource)))
            self.assertIn((correct, CD.supportsResource, obj), self.sources)
            self.assertNotIn((irrelevant, CD.supportsResource, obj), self.sources)
        missing = str(next(self.spec.objects(EX["l4-interpretation-missing-values"], CD.body)))
        self.assertIn("na.rm=TRUE", missing)
        self.assertNotIn("censored", missing)

if __name__ == "__main__":
    unittest.main()
