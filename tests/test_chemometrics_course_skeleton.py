from __future__ import annotations

import sys
import unittest
from pathlib import Path

from pyshacl import validate
from rdflib import DCTERMS, Namespace, RDF, SKOS, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import rdf_dataset as RDF_DATASET  # noqa: E402
import validate_semantics as VALIDATION  # noqa: E402
from teaching_offering_runtime import project_teaching_offering_runtime_document  # noqa: E402

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
SHAPES_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/shapes/core")
COURSE_SCALE_SOURCE = ROOT / "ontology" / "dataset" / "course-scale.trig"
SECTION_SOURCE_COMMIT = "db2c5ef266641399c2b495646064e16cfdd473e4"

DIGITAL_CHEMISTRY = EX["teaching-offering-digital-chemistry"]
CHEMOMETRICS = EX["teaching-offering-chemometrics-applied-statistics"]

CHEMOMETRICS_ROWS = [
    (
        10,
        str(EX["unit-placement-chemometrics-introduction"]),
        str(EX["learning-unit-chemometrics-introduction"]),
    ),
    (
        20,
        str(EX["unit-placement-chemometrics-random-variables"]),
        str(EX["learning-unit-random-variables"]),
    ),
    (
        30,
        str(EX["unit-placement-chemometrics-mean-values"]),
        str(EX["learning-unit-mean-values"]),
    ),
    (
        40,
        str(EX["unit-placement-chemometrics-variance-dispersion"]),
        str(EX["learning-unit-variance-dispersion"]),
    ),
]

SECTION_SPECS = [
    (
        10,
        EX["offering-section-chemometrics-getting-started"],
        "Getting Started",
        "Course orientation, lecturer context, learning workflow, materials and introduction activities.",
        (EX["unit-placement-chemometrics-introduction"],),
    ),
    (
        20,
        EX["offering-section-chemometrics-data-characterization"],
        "Data Characterization",
        "Basic statistical measures, location and dispersion, distributions and statistical moments.",
        (
            EX["unit-placement-chemometrics-random-variables"],
            EX["unit-placement-chemometrics-mean-values"],
            EX["unit-placement-chemometrics-variance-dispersion"],
        ),
    ),
    (
        30,
        EX["offering-section-chemometrics-similarity-analysis"],
        "Similarity Analysis",
        "Hypothesis testing, t- and F-tests, distribution tests, ANOVA, multivariate similarity, clustering and component analysis.",
        (),
    ),
    (
        40,
        EX["offering-section-chemometrics-data-modeling"],
        "Data Modeling",
        "Linear and non-linear regression, model diagnostics and machine-learning methods for prediction and classification.",
        (),
    ),
    (
        50,
        EX["offering-section-chemometrics-signal-processing"],
        "Signal Processing",
        "Normalization, smoothing and denoising with convolution, Savitzky-Golay methods, Fourier filtering and wavelet analysis.",
        (),
    ),
    (
        60,
        EX["offering-section-chemometrics-uncertainties"],
        "Uncertainties",
        "Measurement uncertainty, uncertainty propagation, errors and bias, outliers, bootstrap methods and classification-error concepts.",
        (),
    ),
    (
        70,
        EX["offering-section-chemometrics-experimental-design"],
        "Experimental Design",
        "Downhill-simplex optimization and design of experiments including factorial, fractional and response-surface designs.",
        (),
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

    def test_chemometrics_offering_sections_have_exact_order_metadata_and_membership(self) -> None:
        sections = set(self.graph.objects(CHEMOMETRICS, CD.hasOfferingSection))
        self.assertEqual({spec[1] for spec in SECTION_SPECS}, sections)

        actual = []
        for section in sections:
            positions = list(self.graph.objects(section, CD.position))
            labels = list(self.graph.objects(section, SKOS.prefLabel))
            descriptions = list(self.graph.objects(section, DCTERMS.description))
            self.assertEqual(1, len(positions))
            self.assertEqual(1, len(labels))
            self.assertEqual(1, len(descriptions))
            actual.append(
                (
                    int(positions[0]),
                    section,
                    str(labels[0]),
                    str(descriptions[0]),
                    tuple(
                        sorted(
                            self.graph.objects(section, CD.groupsUnitPlacement),
                            key=lambda placement: next(
                                int(value) for value in self.graph.objects(placement, CD.position)
                            ),
                        )
                    ),
                )
            )

        actual.sort(key=lambda row: (row[0], str(row[1])))
        self.assertEqual(SECTION_SPECS, actual)

    def test_section_membership_covers_exact_current_placements_once(self) -> None:
        direct_placements = {
            URIRef(placement_id)
            for _position, placement_id, _unit_id in CHEMOMETRICS_ROWS
        }
        grouped = []
        for _position, section, _label, _description, _placements in SECTION_SPECS:
            grouped.extend(self.graph.objects(section, CD.groupsUnitPlacement))

        self.assertEqual(direct_placements, set(grouped))
        self.assertEqual(len(direct_placements), len(grouped))
        self.assertEqual(
            [spec[1] for spec in SECTION_SPECS[2:]],
            [
                section
                for _position, section, _label, _description, placements in SECTION_SPECS
                if not placements
            ],
        )

    def test_section_enabled_runtime_preserves_exact_membership_and_empty_sections(self) -> None:
        fingerprint = f"sha256:{RDF_DATASET.dataset_fingerprint(self.dataset)}"
        document = project_teaching_offering_runtime_document(
            self.dataset,
            str(CHEMOMETRICS),
            fingerprint,
        )

        self.assertEqual("1.1", document["version"])
        self.assertEqual(
            [str(spec[1]) for spec in SECTION_SPECS],
            [section["id"] for section in document["sections"]],
        )
        self.assertEqual(
            [
                [str(placement) for placement in spec[4]]
                for spec in SECTION_SPECS
            ],
            [section["placementIds"] for section in document["sections"]],
        )
        self.assertEqual(
            [[], [], [], [], []],
            [section["placementIds"] for section in document["sections"][2:]],
        )

    def test_section_roadmap_does_not_create_future_learning_units_or_placements(self) -> None:
        self.assertEqual(CHEMOMETRICS_ROWS, self._ordered_rows(self.dataset, CHEMOMETRICS))
        current_units = {
            URIRef(unit_id)
            for _position, _placement_id, unit_id in CHEMOMETRICS_ROWS
        }
        placed_units = {
            unit
            for placement in self.graph.objects(CHEMOMETRICS, CD.hasUnitPlacement)
            for unit in self.graph.objects(placement, CD.placesLearningUnit)
        }
        self.assertEqual(current_units, placed_units)

    def test_section_source_anchor_is_pinned_to_current_lecture_snapshot(self) -> None:
        source = COURSE_SCALE_SOURCE.read_text(encoding="utf-8")
        self.assertIn("GeRe87/chemometrics_lecture", source)
        self.assertIn(SECTION_SOURCE_COMMIT, source)

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

    def test_learning_units_use_expected_focus_concepts(self) -> None:
        expected = {
            EX["learning-unit-chemometrics-introduction"]: {
                EX["chemometrics-course-overview"],
                EX["chemometrics-lecturer-context"],
                EX["chemometrics-course-format"],
                EX["chemometrics-course-roadmap"],
                EX["chemometrics-introduction-round"],
            },
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

    def test_all_four_chemometrics_units_have_exact_paths(self) -> None:
        self.assertEqual(
            {EX["path-chemometrics-introduction"]},
            set(self.graph.subjects(CD.forLearningUnit, EX["learning-unit-chemometrics-introduction"])),
        )
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
