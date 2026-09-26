from __future__ import annotations

import sys
import unittest
from pathlib import Path

from pyshacl import validate
from rdflib import Namespace, RDF, SKOS, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import rdf_dataset as RDF_DATASET  # noqa: E402
import validate_semantics as VALIDATION  # noqa: E402

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
SHAPES_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/shapes/core")

DIGITAL_CHEMISTRY = EX["teaching-offering-digital-chemistry"]
CHEMOMETRICS = EX["teaching-offering-chemometrics-applied-statistics"]

CHEMOMETRICS_ROWS = [
    (
        10,
        str(EX["unit-placement-chemometrics-random-variables"]),
        str(EX["learning-unit-random-variables"]),
    ),
    (
        20,
        str(EX["unit-placement-chemometrics-mean-values"]),
        str(EX["learning-unit-mean-values"]),
    ),
    (
        30,
        str(EX["unit-placement-chemometrics-variance-dispersion"]),
        str(EX["learning-unit-variance-dispersion"]),
    ),
]


class ChemometricsCourseSkeletonTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)

    @staticmethod
    def _ordered_rows(dataset, offering: URIRef) -> list[tuple[int, str, str]]:
        graph = VALIDATION.dataset_union(dataset)
        query = """
            PREFIX cd: <https://w3id.org/project-chemie-digital/ontology/>
            SELECT ?position ?placement ?unit WHERE {
              ?offering cd:hasUnitPlacement ?placement .
              ?placement cd:position ?position ;
                         cd:placesLearningUnit ?unit .
            }
            ORDER BY ?position STR(?placement)
        """
        return [
            (int(row.position), str(row.placement), str(row.unit))
            for row in graph.query(query, initBindings={"offering": offering})
        ]

    def test_two_teaching_offerings_coexist(self) -> None:
        offerings = set(self.graph.subjects(RDF.type, CD.TeachingOffering))
        self.assertIn(DIGITAL_CHEMISTRY, offerings)
        self.assertIn(CHEMOMETRICS, offerings)
        self.assertEqual(
            {"Chemometrics and Applied Statistics"},
            {str(value) for value in self.graph.objects(CHEMOMETRICS, SKOS.prefLabel)},
        )

    def test_chemometrics_first_slice_has_explicit_ordered_placements(self) -> None:
        self.assertEqual(CHEMOMETRICS_ROWS, self._ordered_rows(self.dataset, CHEMOMETRICS))

    def test_existing_digital_chemistry_fixture_is_unchanged(self) -> None:
        self.assertEqual(
            [
                (
                    10,
                    str(EX["unit-placement-standard-deviation"]),
                    str(EX["learning-unit-standard-deviation"]),
                )
            ],
            self._ordered_rows(self.dataset, DIGITAL_CHEMISTRY),
        )

    def test_learning_units_reuse_reviewed_scientific_concepts(self) -> None:
        expected = {
            EX["learning-unit-random-variables"]: {
                EX["random-variable"],
                EX["discrete-random-variable"],
                EX["continuous-random-variable"],
            },
            EX["learning-unit-mean-values"]: {
                EX["arithmetic-mean"],
                EX["expected-value"],
                EX["law-of-large-numbers"],
                EX["geometric-mean"],
                EX["harmonic-mean"],
                EX["median"],
            },
            EX["learning-unit-variance-dispersion"]: {
                EX["variance"],
                EX["standard-deviation"],
                EX["standard-error"],
                EX["relative-standard-deviation"],
            },
        }
        for unit, focus_concepts in expected.items():
            with self.subTest(unit=unit):
                self.assertEqual(focus_concepts, set(self.graph.objects(unit, CD.hasFocusConcept)))

        for concept in set().union(*expected.values()):
            with self.subTest(concept=concept):
                definitions = list(self.dataset.quads((concept, RDF.type, CD.Concept, None)))
                self.assertEqual(1, len(definitions), f"Expected one canonical Concept definition for {concept}")

    def test_first_three_chemometrics_units_have_exact_paths(self) -> None:
        self.assertEqual(
            {EX["path-chemometrics-random-variables-lecture"]},
            set(self.graph.subjects(CD.forLearningUnit, EX["learning-unit-random-variables"])),
        )
        self.assertEqual(
            {EX["path-chemometrics-mean-values-lecture"]},
            set(self.graph.subjects(CD.forLearningUnit, EX["learning-unit-mean-values"])),
        )
        self.assertEqual(
            {EX["path-chemometrics-variance-dispersion-lecture"]},
            set(self.graph.subjects(CD.forLearningUnit, EX["learning-unit-variance-dispersion"])),
        )

    def test_course_order_is_independent_of_trig_file_order(self) -> None:
        forward = RDF_DATASET.assemble_dataset(include_legacy=False)
        reverse = RDF_DATASET.assemble_dataset(
            include_legacy=False,
            trig_paths=tuple(reversed(RDF_DATASET.CANONICAL_TRIG)),
        )
        for offering in (DIGITAL_CHEMISTRY, CHEMOMETRICS):
            with self.subTest(offering=offering):
                self.assertEqual(
                    self._ordered_rows(forward, offering),
                    self._ordered_rows(reverse, offering),
                )

    def test_canonical_dataset_still_conforms_to_course_scale_shacl(self) -> None:
        conforms, report = VALIDATION.run_validation()
        self.assertTrue(conforms, report)


if __name__ == "__main__":
    unittest.main()
