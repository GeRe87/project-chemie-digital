from __future__ import annotations

import sys
import unittest
from pathlib import Path

from pyshacl import validate
from rdflib import Graph, Literal, Namespace, RDF, RDFS, URIRef

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import rdf_dataset as RDF_DATASET  # noqa: E402
import validate_semantics as VALIDATION  # noqa: E402

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
SH = Namespace("http://www.w3.org/ns/shacl#")
SHAPES_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/shapes/core")

STANDARD_DEVIATION_PATH = EX["path-standard-deviation"]
RANDOM_VARIABLES_PATH = EX["path-chemometrics-random-variables-lecture"]
STANDARD_DEVIATION_TOPIC = EX["standard-deviation"]
RANDOM_VARIABLE_TOPIC = EX["random-variable"]
SYNTHETIC_PATH = EX["path-test-multi-topic"]
SYNTHETIC_STEP = EX["path-step-test-multi-topic"]


class LearningPathTopicSemanticTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)

    def _copy_graph(self) -> Graph:
        graph = Graph()
        for triple in self.graph:
            graph.add(triple)
        return graph

    def _fresh_shapes(self) -> Graph:
        return VALIDATION.detached_graph(self.dataset.graph(SHAPES_GRAPH))

    def _validate(self, graph: Graph) -> tuple[bool, str]:
        conforms, _, report = validate(
            data_graph=graph,
            shacl_graph=self._fresh_shapes(),
            inference="rdfs",
            abort_on_first=False,
            allow_infos=False,
            allow_warnings=False,
            meta_shacl=False,
        )
        return bool(conforms), str(report)

    def _assert_conformant(self, graph: Graph) -> None:
        conforms, report = self._validate(graph)
        self.assertTrue(conforms, report)

    def _assert_nonconformant(self, graph: Graph) -> None:
        conforms, report = self._validate(graph)
        self.assertFalse(conforms, report)

    def _multi_topic_graph(self, topics: tuple[URIRef, ...]) -> Graph:
        graph = self._copy_graph()
        graph.add((SYNTHETIC_PATH, RDF.type, CD.LearningPath))
        graph.add((SYNTHETIC_PATH, CD.hasStep, SYNTHETIC_STEP))
        graph.add((SYNTHETIC_STEP, RDF.type, CD.PathStep))
        graph.add((SYNTHETIC_STEP, CD.position, Literal(1)))
        graph.add((SYNTHETIC_STEP, CD.usesResource, EX["sd-definition-basic-de"]))
        for topic in topics:
            graph.add((SYNTHETIC_PATH, CD.forTopic, topic))
        return graph

    def test_zero_topic_learning_path_is_rejected(self) -> None:
        graph = self._copy_graph()
        graph.remove((STANDARD_DEVIATION_PATH, CD.forTopic, None))
        self._assert_nonconformant(graph)

    def test_existing_single_topic_paths_remain_conformant(self) -> None:
        self.assertEqual(
            {STANDARD_DEVIATION_TOPIC},
            set(self.graph.objects(STANDARD_DEVIATION_PATH, CD.forTopic)),
        )
        self.assertEqual(
            {RANDOM_VARIABLE_TOPIC},
            set(self.graph.objects(RANDOM_VARIABLES_PATH, CD.forTopic)),
        )
        self._assert_conformant(self._copy_graph())

    def test_multi_topic_learning_path_is_conformant_as_unordered_membership(self) -> None:
        topics = (STANDARD_DEVIATION_TOPIC, RANDOM_VARIABLE_TOPIC)
        for insertion_order in (topics, tuple(reversed(topics))):
            with self.subTest(insertion_order=insertion_order):
                graph = self._multi_topic_graph(insertion_order)
                self._assert_conformant(graph)
                self.assertEqual(
                    set(topics),
                    set(graph.objects(SYNTHETIC_PATH, CD.forTopic)),
                )

    def test_learning_path_shape_keeps_minimum_and_removes_maximum_topic_cardinality(self) -> None:
        shapes = self._fresh_shapes()
        property_shapes = [
            node
            for node in shapes.objects(CD.LearningPathShape, SH.property)
            if (node, SH.path, CD.forTopic) in shapes
        ]
        self.assertEqual(1, len(property_shapes))
        topic_shape = property_shapes[0]
        self.assertEqual([Literal(1)], list(shapes.objects(topic_shape, SH.minCount)))
        self.assertEqual([], list(shapes.objects(topic_shape, SH.maxCount)))

    def test_for_topic_vocabulary_relation_remains_learning_path_to_concept(self) -> None:
        self.assertIn((CD.forTopic, RDF.type, RDF.Property), self.graph)
        self.assertIn((CD.forTopic, RDFS.domain, CD.LearningPath), self.graph)
        self.assertIn((CD.forTopic, RDFS.range, CD.Concept), self.graph)

    def test_canonical_dataset_remains_shacl_conformant(self) -> None:
        self._assert_conformant(self._copy_graph())


if __name__ == "__main__":
    unittest.main()
