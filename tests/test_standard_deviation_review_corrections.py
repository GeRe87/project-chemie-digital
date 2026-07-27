from __future__ import annotations

import importlib.util
import unittest
from decimal import Decimal
from pathlib import Path

from rdflib import Graph, Literal, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "rdf_dataset", ROOT / "scripts" / "rdf_dataset.py"
)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
SHAPES = "https://w3id.org/project-chemie-digital/graph/shapes/"


def uri(namespace: str, local_name: str) -> URIRef:
    return URIRef(namespace + local_name)


def assembled_data_graph() -> Graph:
    dataset = MODULE.assemble_dataset(include_legacy=True)
    graph = Graph()
    for subject, predicate, obj, context in dataset.quads((None, None, None, None)):
        if not str(context).startswith(SHAPES):
            graph.add((subject, predicate, obj))
    return graph


def language_body(graph: Graph, resource: str, language: str) -> str:
    bodies = [
        str(value)
        for value in graph.objects(uri(EX, resource), uri(CD, "body"))
        if isinstance(value, Literal) and value.language == language
    ]
    if len(bodies) != 1:
        raise AssertionError(
            f"Expected one {language!r} body for {resource}, found {len(bodies)}"
        )
    return bodies[0]


def ordered_values(graph: Graph, dataset_name: str) -> list[Decimal]:
    observations = graph.objects(uri(EX, dataset_name), uri(CD, "hasObservation"))
    positioned: list[tuple[int, Decimal]] = []
    for observation in observations:
        position = graph.value(observation, uri(CD, "position"))
        value = graph.value(observation, uri(CD, "numericValue"))
        if position is None or value is None:
            raise AssertionError(f"Incomplete observation {observation}")
        positioned.append((int(position), Decimal(str(value))))
    positioned.sort(key=lambda item: item[0])
    positions = [position for position, _value in positioned]
    if positions != list(range(1, len(positioned) + 1)):
        raise AssertionError(f"Non-contiguous observation order: {positions}")
    return [value for _position, value in positioned]


def mean(values: list[Decimal]) -> Decimal:
    return sum(values, Decimal(0)) / Decimal(len(values))


def sample_standard_deviation(values: list[Decimal]) -> Decimal:
    average = mean(values)
    squared_sum = sum(((value - average) ** 2 for value in values), Decimal(0))
    return (squared_sum / Decimal(len(values) - 1)).sqrt()


class StandardDeviationReviewCorrectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.graph = assembled_data_graph()

    def test_estimator_purpose_is_qualified_in_german_and_english(self) -> None:
        german = language_body(self.graph, "sd-definition-university-de", "de")
        english = language_body(self.graph, "sd-definition-university-en", "en")
        sample_definition = language_body(
            self.graph, "def-sample-standard-deviation", "de"
        )
        bessel_definition = language_body(self.graph, "def-bessel", "de")

        self.assertIn("Schätzung der Populationsvarianz", german)
        self.assertIn("nicht, dass jede rein deskriptive", german)
        self.assertIn("nicht automatisch einen unverzerrten Schätzer", german)
        self.assertIn("estimation of population variance", english)
        self.assertIn("not mean that every purely descriptive", english)
        self.assertIn("does not automatically yield an unbiased estimator", english)
        self.assertIn("inferenzstatistischen Sinn", sample_definition)
        self.assertIn("kann anders definiert sein", sample_definition)
        self.assertIn("unverzerrten Schätzung der Populationsvarianz", bessel_definition)
        self.assertIn("nicht automatisch einen unverzerrten Schätzer", bessel_definition)

    def test_comparison_exercise_has_two_ordered_executable_datasets(self) -> None:
        exercise = uri(EX, "exercise-compare-series")
        datasets = set(self.graph.objects(exercise, uri(CD, "usesDataset")))
        expected_datasets = {
            uri(EX, "dataset-compare-series-a"),
            uri(EX, "dataset-compare-series-b"),
        }
        self.assertEqual(datasets, expected_datasets)

        values_a = ordered_values(self.graph, "dataset-compare-series-a")
        values_b = ordered_values(self.graph, "dataset-compare-series-b")
        self.assertEqual(values_a, [Decimal("9"), Decimal("10"), Decimal("11")])
        self.assertEqual(values_b, [Decimal("5"), Decimal("10"), Decimal("15")])
        self.assertEqual(mean(values_a), Decimal("10"))
        self.assertEqual(mean(values_b), Decimal("10"))
        self.assertEqual(sample_standard_deviation(values_a), Decimal("1"))
        self.assertEqual(sample_standard_deviation(values_b), Decimal("5"))

        expected_result = language_body(self.graph, "expected-compare-series", "de")
        criterion = language_body(self.graph, "criterion-compare-series", "de")
        self.assertIn("s = 1 mg/L", expected_result)
        self.assertIn("s = 5 mg/L", expected_result)
        self.assertIn("kommensurable Messreihen", criterion)
        self.assertIn("Wiederhol- oder Reproduzierbarkeitsbedingungen", criterion)
        self.assertIn("relative Standardabweichung", criterion)
        self.assertIn("keine Aussage zur Richtigkeit", criterion)

    def test_precision_correction_is_bounded_and_does_not_imply_trueness(self) -> None:
        correction = language_body(self.graph, "correction-sd-accuracy", "de")
        self.assertIn("nur bei kommensurablen Messreihen", correction)
        self.assertIn("derselben Messgröße, Skala und Methode", correction)
        self.assertIn("Wiederhol- oder Reproduzierbarkeitsbedingungen", correction)
        self.assertIn("relative Standardabweichung", correction)
        self.assertIn("systematische Abweichungen können trotzdem bestehen", correction)

    def test_caffeine_resource_is_a_complete_worked_example(self) -> None:
        example = uri(EX, "worked-example-caffeine")
        dataset = uri(EX, "dataset-caffeine")
        self.assertIn((example, RDF.type, uri(CD, "WorkedExample")), self.graph)
        self.assertIn((example, uri(CD, "usesDataset"), dataset), self.graph)
        self.assertEqual(self.graph.value(dataset, uri(CD, "unit")), Literal("mg/L"))

        values = ordered_values(self.graph, "dataset-caffeine")
        self.assertEqual(
            values,
            [
                Decimal("99.8"),
                Decimal("100.1"),
                Decimal("100.0"),
                Decimal("100.2"),
                Decimal("99.9"),
            ],
        )
        self.assertEqual(mean(values), Decimal("100.0"))
        self.assertAlmostEqual(
            float(sample_standard_deviation(values)), 0.158113883, places=8
        )

        steps = list(self.graph.objects(example, uri(CD, "hasCalculationStep")))
        positions = sorted(
            int(self.graph.value(step, uri(CD, "position"))) for step in steps
        )
        self.assertEqual(positions, [1, 2, 3, 4])
        interpretation = language_body(self.graph, "caffeine-step-4", "de")
        self.assertIn("≈ 0,158 mg/L", interpretation)
        self.assertIn("nicht Richtigkeit", interpretation)
        self.assertIn("kein Referenzwert oder Wiederfindungsergebnis", interpretation)

    def test_dataset_fingerprint_is_deterministic_after_corrections(self) -> None:
        first = MODULE.dataset_fingerprint(MODULE.assemble_dataset(include_legacy=True))
        second = MODULE.dataset_fingerprint(MODULE.assemble_dataset(include_legacy=True))
        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
