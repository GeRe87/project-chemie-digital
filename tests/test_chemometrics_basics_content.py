from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from rdflib import Literal, Namespace, RDF, SKOS, URIRef

ROOT = Path(__file__).resolve().parents[1]
DATASET_SPEC = importlib.util.spec_from_file_location(
    "rdf_dataset", ROOT / "scripts" / "rdf_dataset.py"
)
assert DATASET_SPEC and DATASET_SPEC.loader
RDF_DATASET = importlib.util.module_from_spec(DATASET_SPEC)
DATASET_SPEC.loader.exec_module(RDF_DATASET)

VALIDATION_SPEC = importlib.util.spec_from_file_location(
    "validate_semantics", ROOT / "scripts" / "validate_semantics.py"
)
assert VALIDATION_SPEC and VALIDATION_SPEC.loader
VALIDATION = importlib.util.module_from_spec(VALIDATION_SPEC)
VALIDATION_SPEC.loader.exec_module(VALIDATION)

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
CHEMOMETRICS_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-basics"
)

NEW_CONCEPTS = {
    EX["discrete-random-variable"],
    EX["continuous-random-variable"],
    EX["expected-value"],
    EX["law-of-large-numbers"],
    EX["geometric-mean"],
    EX["harmonic-mean"],
    EX["median"],
}

REUSED_CONCEPTS = {
    EX["arithmetic-mean"],
    EX["variance"],
    EX["sample-variance"],
    EX["population-variance"],
    EX["standard-deviation"],
    EX["standard-error"],
    EX["relative-standard-deviation"],
    EX["sample"],
    EX["population"],
    EX["degrees-of-freedom"],
    EX["n-minus-one"],
}


class ChemometricsBasicsContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.chemometrics_graph = cls.dataset.graph(CHEMOMETRICS_GRAPH)

    def test_new_scientific_concepts_have_single_canonical_identity_and_definition(self) -> None:
        for concept in NEW_CONCEPTS | {EX["random-variable"]}:
            with self.subTest(concept=concept):
                definitions = list(self.dataset.quads((concept, RDF.type, CD.Concept, None)))
                self.assertEqual(1, len(definitions))
                self.assertTrue(any(self.graph.objects(concept, SKOS.prefLabel)))
                self.assertTrue(any(self.graph.objects(concept, CD.hasDefinition)))

        for concept in REUSED_CONCEPTS:
            with self.subTest(concept=concept):
                definitions = list(self.dataset.quads((concept, RDF.type, CD.Concept, None)))
                self.assertEqual(1, len(definitions), f"Reused concept was duplicated: {concept}")

    def test_discrete_and_continuous_random_variables_are_narrower_than_random_variable(self) -> None:
        self.assertIn(EX["random-variable"], set(self.graph.objects(EX["discrete-random-variable"], SKOS.broader)))
        self.assertIn(EX["random-variable"], set(self.graph.objects(EX["continuous-random-variable"], SKOS.broader)))

    def test_expected_value_is_distinct_from_observed_sample_mean(self) -> None:
        self.assertNotEqual(EX["expected-value"], EX["arithmetic-mean"])
        self.assertIn(EX["arithmetic-mean"], set(self.graph.objects(EX["expected-value"], CD.contrastsWith)))
        expected_formula = str(next(self.graph.objects(EX["discrete-expected-value-formula"], CD.latex)))
        self.assertIn("P(X=x)", expected_formula)
        interpretation = str(next(self.graph.objects(EX["sample-mean-estimator-interpretation"], CD.body)))
        self.assertIn("not semantically identical", interpretation)

    def test_law_of_large_numbers_has_reviewed_scope(self) -> None:
        prerequisites = set(self.graph.objects(EX["law-of-large-numbers"], CD.prerequisite))
        self.assertEqual(
            {EX["random-variable"], EX["arithmetic-mean"], EX["expected-value"]},
            prerequisites,
        )
        definition = str(next(self.graph.objects(EX["def-law-of-large-numbers"], CD.body)))
        self.assertIn("independent identically distributed", definition)
        self.assertIn("converges", definition)
        correction = str(next(self.graph.objects(EX["lln-not-standard-error-interpretation"], CD.body)))
        self.assertIn("separate sampling-distribution results", correction)

    def test_geometric_mean_is_positive_and_multiplicative_not_a_generic_rate_rule(self) -> None:
        formula = str(next(self.graph.objects(EX["geometric-mean-product-formula"], CD.latex)))
        self.assertIn("x_i > 0", formula)
        interpretation = str(next(self.graph.objects(EX["geometric-mean-applicability-interpretation"], CD.body)))
        self.assertIn("multiplicative factors or ratios", interpretation)
        self.assertIn("not a universal replacement", interpretation)

    def test_harmonic_mean_rate_rule_uses_equal_denominator_quantities_not_equal_times(self) -> None:
        interpretation = str(next(self.graph.objects(EX["harmonic-mean-rate-interpretation"], CD.body)))
        self.assertIn("equal distances", interpretation)
        self.assertIn("equal quantities in the rate denominator", interpretation)
        self.assertIn("Equal time intervals instead lead to an arithmetic mean", interpretation)
        example = str(next(self.graph.objects(EX["worked-example-equal-distance-speed"], CD.body)))
        self.assertIn("3.33 m/s", example)

    def test_median_is_authored_as_robust_but_not_outlier_immune(self) -> None:
        definition = str(next(self.graph.objects(EX["def-median"], CD.body)))
        self.assertIn("at least half", definition)
        interpretation = str(next(self.graph.objects(EX["median-robustness-interpretation"], CD.body)))
        self.assertIn("less sensitive to extreme values", interpretation)
        self.assertIn("not guaranteed", interpretation)

    def test_variance_and_standard_error_extend_existing_identities_without_duplicates(self) -> None:
        self.assertIn(
            EX["sample-variance-formula"],
            set(self.graph.objects(EX["sample-variance"], CD.hasMathExpression)),
        )
        self.assertIn(
            EX["population-variance-formula"],
            set(self.graph.objects(EX["population-variance"], CD.hasMathExpression)),
        )
        self.assertEqual(
            "s^2 = \\frac{1}{n-1}\\sum_{i=1}^{n}(x_i-\\bar{x})^2",
            str(next(self.graph.objects(EX["sample-variance-formula"], CD.latex))),
        )
        self.assertEqual(
            "\\sigma^2 = \\frac{1}{N}\\sum_{i=1}^{N}(x_i-\\mu)^2",
            str(next(self.graph.objects(EX["population-variance-formula"], CD.latex))),
        )

    def test_standard_error_formula_is_estimator_specific_and_assumption_scoped(self) -> None:
        population_formula = str(next(self.graph.objects(EX["sem-population-formula"], CD.latex)))
        estimated_formula = str(next(self.graph.objects(EX["sem-estimated-formula"], CD.latex)))
        self.assertIn("\\sigma", population_formula)
        self.assertIn("s", estimated_formula)
        scope = str(next(self.graph.objects(EX["sem-scope-interpretation"], CD.body)))
        self.assertIn("independent identically distributed", scope)
        self.assertIn("not a universal formula for every standard error", scope)
        self.assertIn("not a synonym for measurement uncertainty", scope)

    def test_coefficient_of_variation_reuses_relative_standard_deviation_identity(self) -> None:
        self.assertNotIn(CD.Concept, set(self.graph.objects(EX["coefficient-of-variation"], RDF.type)))
        labels = set(self.graph.objects(EX["relative-standard-deviation"], SKOS.altLabel))
        self.assertIn(Literal("coefficient of variation", lang="en"), labels)
        scope = str(next(self.graph.objects(EX["relative-standard-deviation-scope-interpretation"], CD.body)))
        self.assertIn("ratio-scale", scope)
        self.assertIn("close to zero", scope)

    def test_selected_r_code_is_renderer_neutral_and_attached_to_exercises(self) -> None:
        expected = {
            EX["exercise-dice-realizations"]: EX["code-dice-roll-r"],
            EX["exercise-geometric-growth-factors"]: EX["code-geometric-mean-r"],
            EX["exercise-mean-median-outlier"]: EX["code-mean-median-r"],
            EX["exercise-summary-statistics-r"]: EX["code-summary-statistics-r"],
        }
        for exercise, code in expected.items():
            with self.subTest(code=code):
                self.assertIn(code, set(self.graph.objects(exercise, CD.hasCodeExample)))
                self.assertIn(CD.CodeExample, set(self.graph.objects(code, RDF.type)))
                self.assertEqual({Literal("r")}, set(self.graph.objects(code, CD.programmingLanguage)))
                self.assertEqual({Literal(True)}, set(self.graph.objects(code, CD.editable)))
                self.assertEqual({Literal(True)}, set(self.graph.objects(code, CD.executable)))

        renderer_tokens = ("CodeMirror", "EditorView", "DOMContentLoaded", "webr.r-wasm", "resources/js/")
        text = "\n".join(str(obj) for _s, _p, obj in self.chemometrics_graph)
        for token in renderer_tokens:
            with self.subTest(token=token):
                self.assertNotIn(token, text)

    def test_known_legacy_misstatements_are_not_canonicalized(self) -> None:
        text = "\n".join(str(obj) for _s, _p, obj in self.chemometrics_graph)
        forbidden = (
            "Use for: Normal data without extreme outliers",
            "Averaging rates over equal times",
            "Median is more representative!",
            "B has higher absolute variability but similar relative variability",
            "each measurement contains noise and uncertainty",
        )
        for statement in forbidden:
            with self.subTest(statement=statement):
                self.assertNotIn(statement, text)

    def test_new_definition_and_formula_sources_resolve_to_authored_sources(self) -> None:
        for resource in (
            EX["def-random-variable"],
            EX["def-expected-value"],
            EX["def-geometric-mean"],
            EX["def-harmonic-mean"],
            EX["def-median"],
            EX["sem-estimated-formula"],
            EX["relative-standard-deviation-formula"],
        ):
            with self.subTest(resource=resource):
                sources = set(self.graph.objects(resource, CD.hasSource))
                self.assertTrue(sources)
                for source in sources:
                    self.assertIn(CD.Source, set(self.graph.objects(source, RDF.type)))
                    self.assertIn(Literal(True), set(self.graph.objects(source, CD.authoredResource)))

    def test_no_chemometrics_learning_path_is_authored_in_content_migration(self) -> None:
        for unit in (
            EX["learning-unit-random-variables"],
            EX["learning-unit-mean-values"],
            EX["learning-unit-variance-dispersion"],
        ):
            self.assertEqual([], list(self.graph.subjects(CD.forLearningUnit, unit)))

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
