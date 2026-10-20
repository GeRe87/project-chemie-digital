"""Focused projection tests for additive statistical chart options."""
import unittest
import sys
from pathlib import Path
from rdflib import Dataset, Literal, Namespace
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from generate_canonical_runtime import dot_plot_payload

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://example.test/")

FIXTURE = '''
@prefix cd: <https://w3id.org/project-chemie-digital/ontology/> .
@prefix ex: <https://example.test/> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix dct: <http://purl.org/dc/terms/> .
ex:graph {
 ex:chart a cd:ChartDefinition ; skos:prefLabel "Generic scatter"@en ; cd:body "Observed values."@en ;
  cd:xAxisLabel "Input"@en ; cd:yAxisLabel "Response"@en ; cd:yAxisUnit "a.u." ;
  cd:numericXAxis true ; cd:yAxisMinimum 0.0 ; cd:markerRadius 3.0 ; cd:markerOpacity 0.6 ;
  cd:hasChartGroup ex:group ; dct:hasPart ex:curve .
 ex:group a cd:ChartGroup ; skos:prefLabel "One"@en ; cd:position 1 ; cd:groupXValue 7.0 ;
  cd:usesDataset ex:observed ; cd:summaryResult ex:mean .
 ex:observed a cd:Dataset ; cd:unit "a.u." ; cd:hasObservation ex:p1, ex:p2 .
 ex:p1 a cd:Observation ; cd:position 1 ; cd:numericValue 1.0 .
 ex:p2 a cd:Observation ; cd:position 2 ; cd:numericValue 3.0 .
 ex:mean a cd:StatisticalResult ; cd:numericValue 2.0 ; cd:unit "a.u." ; cd:usesDataset ex:observed .
 ex:curve a cd:Dataset ; skos:prefLabel "Authored curve"@en ; cd:unit "a.u." ; cd:hasObservation ex:c1, ex:c2 .
 ex:c1 a cd:Observation ; cd:position 1 ; cd:xValue 1.0 ; cd:numericValue 2.0 .
 ex:c2 a cd:Observation ; cd:position 2 ; cd:xValue 9.0 ; cd:numericValue 4.0 .
}
'''

class StatisticalChartOptionsTests(unittest.TestCase):
    def setUp(self):
        self.dataset = Dataset(default_union=True)
        self.dataset.parse(data=FIXTURE, format="trig")
        self.graph = self.dataset.graph(EX.graph)

    def test_authored_values_and_provenance_survive_projection(self):
        payload, _ = dot_plot_payload(self.dataset, EX.chart, "en")
        self.assertEqual(payload["xScale"], "linear")
        self.assertEqual(payload["yMinimum"], 0)
        self.assertEqual(payload["groups"][0]["x"], 7)
        self.assertEqual([d["value"] for d in payload["groups"][0]["data"]], [1, 3])
        self.assertEqual(payload["groups"][0]["summary"]["value"], 2)
        self.assertTrue(payload["groups"][0]["summary"]["source"])
        self.assertEqual([(d["x"], d["y"]) for d in payload["curves"][0]["data"]], [(1, 2), (9, 4)])

    def test_coordinate_is_required_in_numeric_mode(self):
        self.graph.remove((EX.group, CD.groupXValue, None))
        with self.assertRaisesRegex(ValueError, "groupXValue"):
            dot_plot_payload(self.dataset, EX.chart, "en")

    def test_domain_cannot_hide_observations(self):
        self.graph.set((EX.chart, CD.yAxisMinimum, Literal("2.0", datatype=Namespace("http://www.w3.org/2001/XMLSchema#").decimal)))
        with self.assertRaisesRegex(ValueError, "must not clip"):
            dot_plot_payload(self.dataset, EX.chart, "en")

    def test_summary_must_belong_to_the_same_dataset(self):
        self.graph.set((EX.mean, CD.usesDataset, EX.curve))
        with self.assertRaisesRegex(ValueError, "exactly its observed dataset"):
            dot_plot_payload(self.dataset, EX.chart, "en")

    def test_curve_unit_must_match_the_axis(self):
        self.graph.set((EX.curve, CD.unit, Literal("other")))
        with self.assertRaisesRegex(ValueError, "Curve dataset unit"):
            dot_plot_payload(self.dataset, EX.chart, "en")

if __name__ == "__main__":
    unittest.main()
