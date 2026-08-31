from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from pyshacl import validate
from rdflib import Namespace, RDF, SKOS, URIRef

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("rdf_dataset", ROOT / "scripts" / "rdf_dataset.py")
assert SPEC and SPEC.loader
RDF_DATASET = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RDF_DATASET)

VALIDATION_SPEC = importlib.util.spec_from_file_location(
    "validate_semantics", ROOT / "scripts" / "validate_semantics.py"
)
assert VALIDATION_SPEC and VALIDATION_SPEC.loader
VALIDATION = importlib.util.module_from_spec(VALIDATION_SPEC)
VALIDATION_SPEC.loader.exec_module(VALIDATION)

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

    def test_learning_units_reuse_existing_scientific_concepts(self) -> None:
        expected = {
            EX["learning-unit-random-variables"]: {EX["random-variable"]},
            EX["learning-unit-mean-values"]: {EX["arithmetic-mean"]},
            EX["learning-unit-variance-dispersion"]: {
                EX["variance"],
                EX["standard-deviation"],
                EX["standard-error"],
            },
        }
        for unit, focus_concepts in expected.items():
            with self.subTest(unit=unit):
                self.assertEqual(focus_concepts, set(self.graph.objects(unit, CD.hasFocusConcept)))

        for concept in (
            EX["random-variable"],
            EX["arithmetic-mean"],
            EX["variance"],
            EX["standard-deviation"],
            EX["standard-error"],
        ):
            with self.subTest(concept=concept):
                definitions = list(self.dataset.quads((concept, RDF.type, CD.Concept, None)))
                self.assertEqual(1, len(definitions), f"Expected one canonical Concept definition for {concept}")

    def test_new_units_do_not_prematurely_define_learning_paths(self) -> None:
        for unit in (
            EX["learning-unit-random-variables"],
            EX["learning-unit-mean-values"],
            EX["learning-unit-variance-dispersion"],
        ):
            with self.subTest(unit=unit):
                paths = list(self.graph.subjects(CD.forLearningUnit, unit))
                self.assertEqual([], paths)

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
        conforms, _, report = validate(
            data_graph=self.graph,
            shacl_graph=VALIDATION.detached_graph(self.dataset.graph(SHAPES_GRAPH)),
            inference="rdfs",
            abort_on_first=False,
            allow_infos=False,
            allow_warnings=False,
            meta_shacl=True,
        )
        self.assertTrue(bool(conforms), str(report))


if __name__ == "__main__":
    unittest.main()
