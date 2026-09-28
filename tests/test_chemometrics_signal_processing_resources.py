from __future__ import annotations

import importlib.util
import sys
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

if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

import validate_semantics as VALIDATION  # noqa: E402

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
DCT = Namespace("http://purl.org/dc/terms/")

SPEC_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/specifications/chemometrics-signal-processing-foundations"
)
SOURCE_GRAPH = URIRef(
    "https://w3id.org/project-chemie-digital/graph/sources/chemometrics-signal-processing"
)

NEW_CONCEPTS = {
    EX["analytical-signal-processing"],
    EX["min-max-normalization"],
    EX["z-score-standardization"],
    EX["data-harmonization"],
    EX["unit-harmonization"],
    EX["label-harmonization"],
}


class ChemometricsSignalProcessingResourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.spec_graph = cls.dataset.graph(SPEC_GRAPH)
        cls.source_graph = cls.dataset.graph(SOURCE_GRAPH)

    def test_new_resources_have_single_canonical_concept_identity_and_definition(self) -> None:
        for concept in NEW_CONCEPTS:
            with self.subTest(concept=concept):
                typed = list(self.dataset.quads((concept, RDF.type, CD.Concept, None)))
                self.assertEqual(1, len(typed))
                self.assertTrue(any(self.graph.objects(concept, SKOS.prefLabel)))
                self.assertTrue(any(self.graph.objects(concept, CD.hasDefinition)))

    def test_existing_mean_and_standard_deviation_are_reused_not_duplicated(self) -> None:
        for concept in (EX["arithmetic-mean"], EX["standard-deviation"]):
            with self.subTest(concept=concept):
                typed = list(self.dataset.quads((concept, RDF.type, CD.Concept, None)))
                self.assertEqual(1, len(typed), f"Reused concept was duplicated: {concept}")

        self.assertEqual(
            {EX["arithmetic-mean"], EX["standard-deviation"]},
            set(self.graph.objects(EX["z-score-standardization"], CD.dependsOn)),
        )

    def test_min_max_normalization_records_range_extrema_and_constant_vector_boundary(self) -> None:
        formula = str(next(self.graph.objects(EX["min-max-normalization-formula"], CD.latex)))
        self.assertIn("x_{\\min}", formula)
        self.assertIn("x_{\\max}", formula)
        self.assertIn("\\ne", formula)

        range_scope = str(next(self.graph.objects(EX["min-max-range-interpretation"], CD.body)))
        self.assertIn("minimum maps to 0", range_scope)
        self.assertIn("maximum maps to 1", range_scope)
        self.assertIn("outside [0,1]", range_scope)

        extrema = str(next(self.graph.objects(EX["min-max-extrema-sensitivity-interpretation"], CD.body)))
        self.assertIn("extreme observations", extrema)
        constant = str(next(self.graph.objects(EX["min-max-constant-vector-interpretation"], CD.body)))
        self.assertIn("x_max = x_min", constant)
        self.assertIn("undefined", constant)
        self.assertIn("zero denominator", constant)

    def test_z_score_standardization_is_convention_scoped_and_not_claimed_robust(self) -> None:
        sample_formula = str(
            next(self.graph.objects(EX["z-score-standardization-sample-formula"], CD.latex))
        )
        population_formula = str(
            next(self.graph.objects(EX["z-score-standardization-population-formula"], CD.latex))
        )
        self.assertIn("\\bar{x}", sample_formula)
        self.assertIn("s > 0", sample_formula)
        self.assertIn("\\mu", population_formula)
        self.assertIn("\\sigma > 0", population_formula)

        convention = str(next(self.graph.objects(EX["z-score-convention-interpretation"], CD.body)))
        self.assertIn("sample mean 0", convention)
        self.assertIn("sample standard deviation 1", convention)
        self.assertIn("population mean 0", convention)
        self.assertIn("population standard deviation 1", convention)
        self.assertIn("must not be mixed silently", convention)

        correction = str(next(self.graph.objects(EX["z-score-outlier-sensitivity-interpretation"], CD.body)))
        self.assertIn("not robust to outliers", correction)
        self.assertIn("centering mean", correction)
        self.assertIn("scaling standard deviation", correction)

    def test_harmonization_is_semantic_and_dimensionally_scoped(self) -> None:
        unit_def = str(next(self.graph.objects(EX["def-unit-harmonization"], CD.body)))
        self.assertIn("dimensionally valid conversion", unit_def)
        self.assertIn("explicit conversion factor", unit_def)
        self.assertIn("already expressed in the target unit remain numerically unchanged", unit_def)

        label_def = str(next(self.graph.objects(EX["def-label-harmonization"], CD.body)))
        self.assertIn("intended meanings have been matched", label_def)
        self.assertIn("renaming alone is not evidence of semantic equivalence", label_def)

        scope = str(next(self.graph.objects(EX["data-harmonization-scope-interpretation"], CD.body)))
        self.assertIn("does not by itself establish", scope)

    def test_corrected_harmonization_example_keeps_already_matching_fe_values(self) -> None:
        body = str(next(self.graph.objects(EX["worked-example-harmonized-concentrations"], CD.body)))
        self.assertIn(
            "Table A Fe is already 0.1, 0.2 and 0.3 µg/L and therefore remains 0.1, 0.2 and 0.3 µg/L",
            body,
        )
        self.assertIn("0.2, 0.3 and 0.4 mg/L become 200, 300 and 400 µg/L", body)
        self.assertIn("0.0003, 0.0007 and 0.0011 mg/L become 0.3, 0.7 and 1.1 µg/L", body)
        self.assertIn("0.15, 0.25 and 0.335 mg/L become 150, 250 and 335 µg/L", body)
        self.assertNotIn("Fe values 0.1, 0.2 and 0.3 µg/L become 100", body)

    def test_pinned_source_provenance_is_exact_and_corrections_are_not_misattributed(self) -> None:
        source = EX["source-chemometrics-signal-processing-pinned"]
        self.assertIn(CD.Source, set(self.source_graph.objects(source, RDF.type)))
        self.assertEqual(
            {
                Literal(
                    "GeRe87/chemometrics_lecture@db2c5ef266641399c2b495646064e16cfdd473e4:"
                    "topics/09_SignalProcessing.html#blob=1ac2cee2ea96d42c077fff12901f9783ff6efc7c"
                )
            },
            set(self.source_graph.objects(source, DCT.identifier)),
        )
        self.assertEqual(
            {
                URIRef(
                    "https://github.com/GeRe87/chemometrics_lecture/blob/"
                    "db2c5ef266641399c2b495646064e16cfdd473e4/topics/09_SignalProcessing.html"
                )
            },
            set(self.source_graph.objects(source, DCT.source)),
        )

        supported = set(self.source_graph.objects(source, CD.supportsResource))
        for resource in (
            EX["def-analytical-signal-processing"],
            EX["analytical-signal-influences-interpretation"],
            EX["def-min-max-normalization"],
            EX["min-max-normalization-formula"],
            EX["def-z-score-standardization"],
            EX["z-score-standardization-population-formula"],
            EX["def-data-harmonization"],
            EX["def-unit-harmonization"],
            EX["def-label-harmonization"],
        ):
            with self.subTest(resource=resource):
                self.assertIn(resource, supported)
                self.assertEqual({source}, set(self.graph.objects(resource, CD.hasSource)))

        for corrected_resource in (
            EX["min-max-range-interpretation"],
            EX["min-max-constant-vector-interpretation"],
            EX["z-score-standardization-sample-formula"],
            EX["z-score-convention-interpretation"],
            EX["z-score-outlier-sensitivity-interpretation"],
            EX["data-harmonization-scope-interpretation"],
            EX["worked-example-harmonized-concentrations"],
        ):
            with self.subTest(corrected_resource=corrected_resource):
                self.assertEqual([], list(self.graph.objects(corrected_resource, CD.hasSource)))
                self.assertNotIn(corrected_resource, supported)

    def test_resource_only_scope_contains_no_course_path_scene_or_later_signal_processing_content(self) -> None:
        forbidden_types = (
            CD.LearningUnit,
            CD.UnitPlacement,
            CD.LearningPath,
            CD.PathStep,
            CD.SceneDefinition,
            CD.SceneItem,
        )
        for rdf_type in forbidden_types:
            with self.subTest(rdf_type=rdf_type):
                self.assertEqual([], list(self.spec_graph.triples((None, RDF.type, rdf_type))))

        text = "\n".join(str(term) for triple in self.spec_graph for term in triple)
        for token in ("Savitzky", "Fourier", "wavelet", "convolution"):
            with self.subTest(token=token):
                self.assertNotIn(token, text)

    def test_complete_canonical_dataset_remains_shacl_conformant(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
