from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from pyshacl import validate
from rdflib import BNode, Graph, Literal, Namespace, RDF, URIRef

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


class CourseScaleSemanticTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.offering = EX["teaching-offering-digital-chemistry"]
        cls.unit = EX["learning-unit-standard-deviation"]
        cls.placement = EX["unit-placement-standard-deviation"]
        cls.path = EX["path-standard-deviation"]

    def _copy_graph(self) -> Graph:
        graph = Graph()
        for triple in self.graph:
            graph.add(triple)
        return graph

    def _assert_nonconformant(self, graph: Graph) -> None:
        conforms, _, report = validate(
            data_graph=graph,
            shacl_graph=VALIDATION.detached_graph(self.dataset.graph(SHAPES_GRAPH)),
            inference="rdfs",
            abort_on_first=False,
            allow_infos=False,
            allow_warnings=False,
            meta_shacl=True,
        )
        self.assertFalse(bool(conforms), str(report))

    @staticmethod
    def _ordered_course_rows(dataset) -> list[tuple[int, str, str]]:
        graph = VALIDATION.dataset_union(dataset)
        query = """
            PREFIX cd: <https://w3id.org/project-chemie-digital/ontology/>
            PREFIX ex: <https://w3id.org/project-chemie-digital/resource/>
            SELECT ?position ?placement ?unit WHERE {
              ex:teaching-offering-digital-chemistry cd:hasUnitPlacement ?placement .
              ?placement cd:position ?position ;
                         cd:placesLearningUnit ?unit .
            }
            ORDER BY ?position
        """
        return [
            (int(row.position), str(row.placement), str(row.unit))
            for row in graph.query(query)
        ]

    def test_reference_offering_exposes_ordered_standard_deviation_unit(self) -> None:
        rows = self._ordered_course_rows(self.dataset)
        self.assertEqual(
            [(10, str(self.placement), str(self.unit))],
            rows,
        )
        self.assertEqual({EX["standard-deviation"]}, set(self.graph.objects(self.unit, CD.hasFocusConcept)))
        self.assertEqual([], list(self.graph.objects(self.unit, CD.position)))

    def test_existing_path_can_be_queried_for_learning_unit(self) -> None:
        query = """
            PREFIX cd: <https://w3id.org/project-chemie-digital/ontology/>
            PREFIX ex: <https://w3id.org/project-chemie-digital/resource/>
            SELECT ?path WHERE {
              ?path a cd:LearningPath ;
                    cd:forLearningUnit ex:learning-unit-standard-deviation .
            }
            ORDER BY STR(?path)
        """
        self.assertEqual([self.path], [row.path for row in self.graph.query(query)])

    def test_course_order_is_stable_when_trig_source_order_is_reversed(self) -> None:
        forward = RDF_DATASET.assemble_dataset(include_legacy=False)
        reverse = RDF_DATASET.assemble_dataset(
            include_legacy=False,
            trig_paths=tuple(reversed(RDF_DATASET.CANONICAL_TRIG)),
        )
        self.assertEqual(self._ordered_course_rows(forward), self._ordered_course_rows(reverse))

    def test_shacl_rejects_blank_node_course_scale_identities(self) -> None:
        cases = (
            (CD.TeachingOffering, ((CD.hasUnitPlacement, self.placement),)),
            (CD.LearningUnit, ((CD.hasFocusConcept, EX["standard-deviation"]),)),
            (
                CD.UnitPlacement,
                (
                    (CD.placesLearningUnit, self.unit),
                    (CD.position, Literal(20)),
                ),
            ),
        )
        for rdf_type, properties in cases:
            with self.subTest(rdf_type=rdf_type):
                graph = self._copy_graph()
                node = BNode()
                graph.add((node, RDF.type, rdf_type))
                for predicate, obj in properties:
                    graph.add((node, predicate, obj))
                self._assert_nonconformant(graph)

    def test_shacl_rejects_missing_or_multiple_units_per_placement(self) -> None:
        missing = self._copy_graph()
        placement = EX["invalid-placement-missing-unit"]
        missing.add((placement, RDF.type, CD.UnitPlacement))
        missing.add((placement, CD.position, Literal(20)))
        self._assert_nonconformant(missing)

        multiple = self._copy_graph()
        placement = EX["invalid-placement-multiple-units"]
        other_unit = EX["valid-test-learning-unit"]
        multiple.add((other_unit, RDF.type, CD.LearningUnit))
        multiple.add((other_unit, CD.hasFocusConcept, EX["standard-deviation"]))
        multiple.add((placement, RDF.type, CD.UnitPlacement))
        multiple.add((placement, CD.position, Literal(20)))
        multiple.add((placement, CD.placesLearningUnit, self.unit))
        multiple.add((placement, CD.placesLearningUnit, other_unit))
        self._assert_nonconformant(multiple)

    def test_shacl_rejects_invalid_placement_positions(self) -> None:
        cases = (
            ("missing", None),
            ("non-integer", Literal("20")),
            ("zero", Literal(0)),
            ("negative", Literal(-1)),
        )
        for label, position in cases:
            with self.subTest(case=label):
                graph = self._copy_graph()
                placement = EX[f"invalid-placement-position-{label}"]
                graph.add((placement, RDF.type, CD.UnitPlacement))
                graph.add((placement, CD.placesLearningUnit, self.unit))
                if position is not None:
                    graph.add((placement, CD.position, position))
                self._assert_nonconformant(graph)

    def test_shacl_rejects_duplicate_positions_within_offering(self) -> None:
        graph = self._copy_graph()
        placement = EX["duplicate-position-placement"]
        graph.add((placement, RDF.type, CD.UnitPlacement))
        graph.add((placement, CD.position, Literal(10)))
        graph.add((placement, CD.placesLearningUnit, self.unit))
        graph.add((self.offering, CD.hasUnitPlacement, placement))
        self._assert_nonconformant(graph)

    def test_shacl_rejects_placement_reused_by_multiple_offerings(self) -> None:
        graph = self._copy_graph()
        other_offering = EX["other-test-offering"]
        graph.add((other_offering, RDF.type, CD.TeachingOffering))
        graph.add((other_offering, CD.hasUnitPlacement, self.placement))
        self._assert_nonconformant(graph)

    def test_shacl_rejects_path_target_that_is_not_learning_unit(self) -> None:
        graph = self._copy_graph()
        invalid_path = EX["invalid-learning-unit-path"]
        graph.add((invalid_path, RDF.type, CD.LearningPath))
        graph.add((invalid_path, CD.forTopic, EX["standard-deviation"]))
        graph.add((invalid_path, CD.hasStep, EX["path-step-1"]))
        graph.add((invalid_path, CD.forLearningUnit, EX["standard-deviation"]))
        self._assert_nonconformant(graph)


if __name__ == "__main__":
    unittest.main()
