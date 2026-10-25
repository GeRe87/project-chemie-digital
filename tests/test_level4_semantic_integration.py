"""RDFS-domain boundaries and inclusion of extension SHACL graphs."""
import sys
import unittest
from pathlib import Path

from rdflib import Dataset, Graph, Literal, Namespace, RDF, RDFS, URIRef
from pyshacl import validate

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import rdf_dataset
import validate_semantics as validation

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
SH = Namespace("http://www.w3.org/ns/shacl#")
BASE = "https://w3id.org/project-chemie-digital/graph/"


class SemanticIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.union = validation.dataset_union(cls.dataset)

    def test_placements_use_their_own_relation_not_annotation_targeting(self):
        placements = set(self.union.subjects(RDF.type, CD.ObservationPlacement))
        self.assertEqual(474, len(placements))
        for placement in placements:
            self.assertEqual(1, len(list(self.union.objects(placement, CD.placedObservation))))
            self.assertFalse(list(self.union.objects(placement, CD.targetObservation)))
        self.assertIn((CD.targetObservation, RDFS.domain, CD.ChartPointAnnotation), self.union)
        self.assertIn((CD.placedObservation, RDFS.domain, CD.ObservationPlacement), self.union)

    def test_code_specific_relation_is_not_used_for_noncode_level4_resources(self):
        for subject in self.union.subjects(CD.showsResource, None):
            if str(subject).startswith(str(EX) + "l4-"):
                self.assertIn((subject, RDF.type, CD.CodeExample), self.union, subject)
        for point in (EX["l4-opening-sd-guide"], EX["l4-opening-data-sd-guide"]):
            self.assertEqual(1, len(list(self.union.subjects(CD.hasKeyPoint, point))))

    def test_every_named_shapes_graph_is_included_and_detached(self):
        shapes = validation.dataset_shapes(self.dataset)
        for graph in self.dataset.graphs():
            if str(graph.identifier).startswith(BASE + "shapes/"):
                self.assertTrue(set(graph) <= set(shapes), graph.identifier)
        self.assertIn((CD.BoxPlotShape, RDF.type, SH.NodeShape), shapes)
        self.assertIn((CD.ObservationPlacementShape, RDF.type, SH.NodeShape), shapes)
        shapes.remove((CD.BoxPlotShape, None, None))
        self.assertIn((CD.BoxPlotShape, RDF.type, SH.NodeShape), self.dataset.graph(BASE + "shapes/box-plot"))

    def test_public_validator_enforces_noncore_shape_and_is_pure(self):
        dataset = Dataset()
        dataset.graph(BASE + "examples/fixture").add((EX.fixture, CD.requiredValue, Literal("present")))
        extension = dataset.graph(BASE + "shapes/fixture-extension")
        extension.parse(data='''@prefix cd: <https://w3id.org/project-chemie-digital/ontology/> .
          @prefix sh: <http://www.w3.org/ns/shacl#> .
          cd:FixtureShape a sh:NodeShape ; sh:targetSubjectsOf cd:requiredValue ;
            sh:property [ sh:path cd:missingValue ; sh:minCount 1 ] .''', format="turtle")
        before = set(dataset.quads())
        conforms, report, _ = validation.validate_dataset(dataset, meta_shacl=False)
        self.assertFalse(conforms)
        self.assertIn(EX.fixture, set(report.objects(None, SH.focusNode)))
        self.assertEqual(before, set(dataset.quads()))

    def test_new_boxplots_retain_group_checks_and_require_box_convention(self):
        data = Graph()
        data.parse(data='''@prefix cd: <https://w3id.org/project-chemie-digital/ontology/> .
          @prefix ex: <https://w3id.org/project-chemie-digital/resource/> .
          @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
          ex:box a cd:ChartDefinition ; cd:chartType cd:BoxPlot ;
            cd:hasChartGroup ex:group ; cd:yAxisUnit "mg/L" ;
            cd:dependsOn ex:sample-quantile-type-7 ; cd:fenceMultiplier 1.5 .
          ex:group a cd:ChartGroup ; cd:position 1 .''', format="turtle")
        shapes = self.dataset.graph(BASE + "shapes/core") + self.dataset.graph(BASE + "shapes/box-plot")
        selected = [str(CD.DotPlotShape), str(CD.BoxPlotShape)]
        def check():
            return validate(data, shacl_graph=shapes, use_shapes=selected)[0]
        self.assertTrue(check())
        data.remove((EX.box, CD.dependsOn, None))
        self.assertFalse(check(), "Boxplots must declare the interpolation convention")
        data.add((EX.box, CD.dependsOn, EX["sample-quantile-type-7"]))
        data.set((EX.group, CD.position, Literal(3)))
        self.assertFalse(check(), "Grouped plots must retain contiguous positions")


if __name__ == "__main__":
    unittest.main()
