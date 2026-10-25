"""Bounded checks for the four-shape opening; retain the earlier canonical pair."""
import math
import sys
import unittest
from decimal import Decimal
from pathlib import Path
from rdflib import Graph, Literal, Namespace, RDF
from pyshacl import validate

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import rdf_dataset
import validate_semantics
import generate_canonical_runtime as runtime

CD=Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX=Namespace("https://w3id.org/project-chemie-digital/resource/")
BASE="https://w3id.org/project-chemie-digital/graph/"
REFERENCE=runtime.CoursePathReference(str(EX["path-chemometrics-level4-distribution-shape-lecture"]),BASE+"paths/chemometrics-level4-distribution-shape-lecture")

class OpeningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,REFERENCE)
        cls.charts=[b for s in cls.document["scenes"] for b in s["blocks"] if b.get("view")=="summary"]

    def values(self,name):
        observations=sorted(self.union.objects(EX[name],CD.hasObservation),key=lambda o:int(next(self.union.objects(o,CD.position))))
        return [Decimal(str(next(self.union.objects(o,CD.numericValue)))) for o in observations]

    def test_exact_authored_samples_and_known_results(self):
        self.assertEqual([1,3,5,7,9],self.values("l4-opening-data-a"))
        self.assertEqual([2,3,4,6,10],self.values("l4-opening-data-b"))
        for dataset in ("l4-opening-data-a","l4-opening-data-b"):
            values=self.values(dataset)
            mean=sum(values)/len(values)
            variance=sum((v-mean)**2 for v in values)/(len(values)-1)
            self.assertEqual(Decimal(5),mean)
            self.assertEqual(Decimal(10),variance)
            self.assertEqual(mean,Decimal(str(next(self.union.objects(EX["l4-opening-mean"],CD.numericValue)))))
            self.assertEqual(variance,Decimal(str(next(self.union.objects(EX["l4-opening-variance"],CD.numericValue)))))
            self.assertAlmostEqual(math.sqrt(variance),float(next(self.union.objects(EX["l4-opening-sd"],CD.numericValue))),places=14)
            for result in ("l4-opening-mean","l4-opening-variance","l4-opening-sd"):
                self.assertIn((EX[result],CD.usesDataset,EX[dataset]),self.union)
        self.assertIn(r"\sqrt{10}",str(next(self.union.objects(EX["l4-opening-sd-exact"],CD.latex))))

    def test_medians_and_method_bound_quartiles_are_verifiable(self):
        for suffix in ("a","b"):
            values=self.values("l4-opening-data-"+suffix)
            self.assertEqual(values[1],Decimal(str(next(self.union.objects(EX["l4-opening-q1"],CD.numericValue)))))
            # At n=5, type-7 quartile knots coincide with ranks 2 and 4.
            for key,index in (("median",2),("q3",3)):
                self.assertEqual(values[index],Decimal(str(next(self.union.objects(EX[f"l4-opening-{key}-{suffix}"],CD.numericValue)))))
            self.assertEqual(values[3]-values[1],Decimal(str(next(self.union.objects(EX[f"l4-opening-iqr-{suffix}"],CD.numericValue)))))
            for resource in ("l4-opening-q1",f"l4-opening-q3-{suffix}",f"l4-opening-iqr-{suffix}"):
                self.assertIn((EX[resource],CD.dependsOn,EX["sample-quantile-type-7"]),self.union)

    def test_exactly_one_opening_scene_uses_the_preserved_data(self):
        self.assertEqual("ex:l4-scene-summary-gap--scene",self.document["scenes"][0]["id"])
        self.assertEqual(["summary"],[b["view"] for b in self.charts])
        for chart in self.charts:
            self.assertEqual(["ex:l4-shapes-"+k for k in ("uniform","normal","skewed","bimodal")],[s["datasetId"] for s in chart["series"]])
            self.assertEqual((20,100),(chart["comparison"]["minimum"],chart["comparison"]["maximum"]))
            self.assertTrue(all(s["summaries"]["mean"]["id"]=="ex:l4-shapes-mean" for s in chart["series"]))
            self.assertNotIn("formal",chart)

    def test_disclosure_and_bridge_are_authored(self):
        modes=[[stage["mode"] for stage in chart["comparison"]["stages"]] for chart in self.charts]
        self.assertEqual([["distribution"]],modes)
        stages=self.charts[0]["comparison"]["stages"]
        self.assertNotIn("investigations",stages[0])
        self.assertNotIn("allowOverlay",stages[0])
        stage=stages[-1]
        self.assertNotIn("topics",stage)
        scene=self.document["scenes"][0]
        self.assertEqual(["prose","definition-list","table","list","chart"],[b["kind"] for b in scene["blocks"]])
        self.assertIn("ECDF",scene["blocks"][3]["items"][-1]["text"])
        table=scene["blocks"][2]
        self.assertEqual(4,len(table["rows"]))
        for row,series in zip(table["rows"],self.charts[0]["series"]):
            self.assertEqual(series["label"],row["cells"][0]["text"])
            self.assertEqual(series["summaries"]["mean"]["value"],float(row["cells"][1]["text"]))
            self.assertEqual(series["summaries"]["sd"]["value"],float(row["cells"][2]["text"]))

    def test_four_shapes_have_matching_empirical_summaries_and_distinct_shapes(self):
        import statistics
        import prepare_distribution_comparison as construction
        self.assertEqual(construction.snapshot(),construction.TARGET.read_text(encoding="utf-8"))
        moments={}
        for series in self.charts[0]["series"]:
            values=[d["value"] for d in series["data"]]
            self.assertEqual(100,len(values))
            self.assertEqual(100,len({d["id"] for d in series["data"]}))
            self.assertAlmostEqual(50,statistics.mean(values),places=10)
            self.assertAlmostEqual(10,statistics.stdev(values),places=10)
            self.assertAlmostEqual(100,statistics.variance(values),places=10)
            m2=sum((v-50)**2 for v in values)/100
            skew=sum((v-50)**3 for v in values)/100/m2**1.5
            moments[series["label"]]=skew
        self.assertGreater(moments["Right-skewed"],1.5)
        for label in ("Uniform","Normal-like","Bimodal"):
            self.assertAlmostEqual(0,moments[label],places=10)
        values=construction.samples()
        self.assertGreater(values["bimodal"][50]-values["bimodal"][49],10)
        self.assertLess(values["normal"][50]-values["normal"][49],1)

    def test_removed_presentation_resources_have_no_dangling_references(self):
        removed=["l4-recap-heading","l4-needs-heading","l4-recap-chart","l4-needs-chart",
                 "l4-recap-look","l4-recap-mean","l4-recap-spread","l4-gap-align",
                 "l4-scene-recap","l4-scene-information-needs","l4-recap-h","l4-recap-c",
                 "l4-needs-h","l4-needs-c","l4-step-recap","l4-step-information-needs"]
        for name in removed:
            self.assertEqual([],list(self.union.triples((EX[name],None,None))),name)
            self.assertEqual([],list(self.union.triples((None,None,EX[name]))),name)

    def test_details_reuse_existing_formulas_and_english_definition(self):
        sources={s["resourceId"] for d in self.charts[0]["comparison"]["details"] for s in d["source"]}
        self.assertTrue({"ex:arithmetic-mean-formula","ex:sample-variance-formula","ex:sample-sd-formula","ex:sd-definition-university-en"}<=sources)
        teaching=self.dataset.graph(BASE+"specifications/level4-opening")
        for kind in (CD.Dataset,CD.Observation,CD.Definition,CD.MathExpression):
            self.assertEqual([],list(teaching.subjects(RDF.type,kind)))

    def test_qc_and_ecdf_are_retained_but_not_the_opening(self):
        scenes=[s["id"] for s in self.document["scenes"]]
        self.assertGreater(scenes.index("ex:l4-scene-ecdf-worked--scene"),2)
        self.assertGreater(scenes.index("ex:l4-scene-ecdf-worked--scene"),scenes.index("ex:l4-scene-mad-concept--scene"))
        self.assertNotIn("ex:l4-scene-observation-ecdf--scene",scenes)
        for slug in ("opening","ecdf"):
            self.assertIn((EX["l4-scene-observation-"+slug],RDF.type,CD.SceneDefinition),self.union)
        self.assertEqual(Decimal(30),self.values("l4-qc-extreme")[-1])

    def test_targeted_shapes_conform(self):
        shapes=Graph()
        for name in ("observation-explorer","summary-comparison"):
            shapes+=self.dataset.graph(BASE+"shapes/"+name)
        conforms,_,report=validate(self.union,shacl_graph=shapes,advanced=True)
        self.assertTrue(conforms,report)

    def test_invalid_summary_provenance_is_rejected(self):
        dataset=rdf_dataset.assemble_dataset()
        graph=dataset.graph(BASE+"specifications/level4-opening")
        graph=dataset.graph(BASE+"specifications/level4-distribution-comparison")
        graph.set((EX["l4-shapes-uniform-series"],CD.comparisonCenter,EX["l4-qc-reference-median"]))
        with self.assertRaisesRegex(ValueError,"Comparison result"):
            runtime.compile_scene_document(dataset,REFERENCE)

    def test_investigations_cannot_be_nested_or_use_unknown_modes(self):
        dataset=rdf_dataset.assemble_dataset()
        graph=dataset.graph(BASE+"specifications/level4-opening")
        graph.add((EX["l4-shapes-overview"],CD.hasInvestigation,EX["l4-needs-position"]))
        graph.add((EX["l4-needs-position"],CD.hasInvestigation,EX["l4-needs-shape"]))
        with self.assertRaisesRegex(ValueError,"optional investigation"):
            runtime.compile_scene_document(dataset,REFERENCE)

if __name__=="__main__":
    unittest.main()
