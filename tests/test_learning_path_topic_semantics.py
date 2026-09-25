from __future__ import annotations

import sys
import unittest
from pathlib import Path

from pyshacl import validate
from rdflib import BNode, Graph, Literal, Namespace, RDF, RDFS, URIRef

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


def shape_closure(source: Graph, root: URIRef) -> Graph:
    """Copy one SHACL shape and recursively owned blank-node structures."""
    focused = Graph()
    pending = [root]
    seen = set()
    while pending:
        subject = pending.pop()
        if subject in seen:
            continue
        seen.add(subject)
        for triple in source.triples((subject, None, None)):
            focused.add(triple)
            obj = triple[2]
            if isinstance(obj, BNode):
                pending.append(obj)
    return focused


def learning_path_fixture(topics: tuple[URIRef, ...] = (STANDARD_DEVIATION_TOPIC,)) -> Graph:
    graph = Graph()
    path = STANDARD_DEVIATION_PATH
    step = EX["path-step-topic-fixture"]
    resource = EX["topic-fixture-resource"]
    graph.add((path, RDF.type, CD.LearningPath))
    graph.add((path, CD.hasStep, step))
    for topic in topics:
        graph.add((path, CD.forTopic, topic))
    graph.add((step, RDF.type, CD.PathStep))
    graph.add((step, CD.position, Literal(1)))
    graph.add((step, CD.usesResource, resource))
    return graph


class LearningPathTopicSemanticTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.dataset = RDF_DATASET.assemble_dataset(include_legacy=False)
        cls.graph = VALIDATION.dataset_union(cls.dataset)
        cls.learning_path_shapes = shape_closure(
            VALIDATION.detached_graph(cls.dataset.graph(SHAPES_GRAPH)),
            CD.LearningPathShape,
        )

    def _copy_graph(self) -> Graph:
        return learning_path_fixture()

    def _fresh_shapes(self) -> Graph:
        return VALIDATION.detached_graph(self.learning_path_shapes)

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
        graph = learning_path_fixture(())
        graph.remove((STANDARD_DEVIATION_PATH, None, None))
        step = EX["path-step-topic-fixture"]
        resource = EX["topic-fixture-resource"]
        graph.add((SYNTHETIC_PATH, RDF.type, CD.LearningPath))
        graph.add((SYNTHETIC_PATH, CD.hasStep, step))
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
        self._assert_conformant(learning_path_fixture())

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
