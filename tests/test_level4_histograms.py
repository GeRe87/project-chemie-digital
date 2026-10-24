"""Bounded histograms/content validation, not a full repository validation run."""
import math
import re
import statistics
import sys
import unittest
from pathlib import Path
from rdflib import Namespace, RDF, Literal
from pyshacl import validate

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
import rdf_dataset
import validate_semantics
import generate_canonical_runtime as runtime
from histogram_statistics import bins, cells

ROOT=Path(__file__).resolve().parents[1]
BASE="https://w3id.org/project-chemie-digital/graph/"
CD=Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX=Namespace("https://w3id.org/project-chemie-digital/resource/")

class HistogramTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX["path-chemometrics-level4-distribution-shape-lecture"]),BASE+"paths/chemometrics-level4-distribution-shape-lecture"))
        cls.charts={b["id"]:b for s in cls.document["scenes"] for b in s["blocks"] if b.get("chartType") in ("histogram","histogram2d")}
        cls.teaching=cls.dataset.graph(BASE+"specifications/level4-histogram-teaching")

    def chart(self,scene):
        return next(b for s in self.document["scenes"] if s["id"]=="ex:l4-scene-"+scene+"--scene" for b in s["blocks"] if b["kind"]=="chart")

    def test_static_trig_is_the_only_semantic_input_and_grids_are_reproducible(self):
        for name,start,step in (("river",.5,.5),("effluent",10,2),("blank",0,.01),("extract-a",95.1,.2),("extract-b",80.4,.8),("matrix",70.8,.8),("control",98.04,.08),("biased",108.04,.08)):
            observations=sorted(self.union.objects(EX["l4-large-"+name],CD.hasObservation),key=lambda o:int(next(self.union.objects(o,CD.position))))
            self.assertEqual(50,len(observations))
            for i,o in enumerate(observations):self.assertAlmostEqual(start+step*i,float(next(self.union.objects(o,CD.numericValue))))
        source=(ROOT/"scripts/generate_canonical_runtime.py").read_text(encoding="utf-8")
        self.assertNotIn("prepare_level4_histogram",source)

    def test_native_histograms_cover_each_original_observation_once(self):
        self.assertEqual("1.12",self.document["version"])
        self.assertEqual(14,len(self.charts))
        for chart in self.charts.values():
            result=cells(chart["data"],chart["edges"],chart["yEdges"]) if chart["chartType"]=="histogram2d" else bins([d["value"] for d in chart["data"]],chart["edges"],chart["normalization"])
            self.assertEqual(len(chart["data"]),sum(b["count"] for b in result))
            self.assertIn(len(chart["data"]),(8,60,100))
            self.assertEqual(len(chart["data"]),len({d["id"] for d in chart["data"]}))
            self.assertTrue(all(d["source"] for d in chart["data"]))

    def test_bad_good_and_shifted_binnings_use_identical_observations(self):
        coarse,fine,good,shifted=[self.chart("histogram-"+s) for s in ("too-coarse","too-fine","sensible-width","origin")]
        self.assertEqual(coarse["data"],fine["data"]);self.assertEqual(coarse["data"],good["data"]);self.assertEqual(good["data"],shifted["data"])
        self.assertEqual([1,400,10,10],[len(c["edges"])-1 for c in (coarse,fine,good,shifted)])
        self.assertEqual([100],[b["count"] for b in bins([d["value"] for d in coarse["data"]],coarse["edges"])])
        self.assertGreater(sum(b["count"]==0 for b in bins([d["value"] for d in fine["data"]],fine["edges"])),300)

    def test_adaptive_widths_have_equal_counts_but_unequal_heights_and_unit_area(self):
        c=self.chart("histogram-variable-construction")
        result=bins([d["value"] for d in c["data"]],c["edges"],c["normalization"])
        self.assertEqual([25]*4,[b["count"] for b in result])
        self.assertEqual("density",c["normalization"]);self.assertEqual("1/a.u.",c["yAxis"]["unit"])
        self.assertGreater(len({b["height"] for b in result}),1)
        self.assertAlmostEqual(1,sum(b["height"]*(b["upper"]-b["lower"]) for b in result))
        self.assertTrue(all(abs(b["height"]*(b["upper"]-b["lower"])-.25)<1e-12 for b in result))

    def test_2d_uses_actual_paired_observation_properties(self):
        c=self.chart("histogram-2d-reading")
        self.assertEqual(60,len(c["data"]));self.assertEqual("mg/L",c["xAxis"]["unit"]);self.assertEqual("a.u.",c["yAxis"]["unit"])
        for d in c["data"]:
            resource=EX[d["id"].removeprefix("ex:")]
            self.assertEqual(d["value"],float(next(self.union.objects(resource,CD.numericValue))))
            self.assertEqual(d["y"],float(next(self.union.objects(resource,CD.pairedValue))))

    def test_bin_rules_match_the_example_and_fail_closed_on_degenerate_data(self):
        c=self.chart("histogram-rule-example");v=[d["value"] for d in c["data"]]
        q1,_,q3=statistics.quantiles(v,n=4,method="inclusive")
        fd=2*(q3-q1)/len(v)**(1/3);scott=3.5*statistics.stdev(v)/len(v)**(1/3)
        self.assertAlmostEqual(5.75331637816,fd,places=9);self.assertAlmostEqual(7.54052141511,scott,places=9)
        self.assertEqual(9,math.ceil((max(v)-min(v))/fd));self.assertEqual(7,math.ceil((max(v)-min(v))/scott));self.assertEqual(8,math.ceil(1+math.log2(len(v))))
        for values,edges,norm in [([], [0,1],"count"),([0],[0,0],"count"),([2],[0,1],"count"),([0],[0,1,3],"count")]:
            with self.assertRaises(ValueError):bins(values,edges,norm)
        self.assertEqual([1,2],[b["count"] for b in bins([0,1,2],[0,1,2])])

    def test_new_boxplot_readings_show_all_observations_and_keep_flags(self):
        for name in ("extremes","symmetric","skewed","bimodal","uniform"):
            chart=self.chart("box-"+name)
            self.assertTrue(chart["showObservations"])
            self.assertEqual(50 if name=="extremes" else 100,len(chart["groups"][0]["data"]))
        chart=next(b for s in self.document["scenes"] if s["id"]=="ex:l4-scene-box-extremes--scene" for b in s["blocks"] if b["kind"]=="chart")
        v=[d["value"] for d in chart["groups"][0]["data"]];q1,_,q3=statistics.quantiles(v,n=4,method="inclusive");fence=q3+1.5*(q3-q1)
        self.assertAlmostEqual(37.25,fence);self.assertEqual([90],[x for x in v if x>fence]);self.assertEqual(24.5,max(x for x in v if x<=fence))

    def test_histogram_r_lab_contains_exact_same_data_and_explicit_edges(self):
        code=str(next(self.teaching.objects(EX["l4-hist-lab-code"],CD.code)))
        raw=code.split("x <- c(",1)[1].split(")",1)[0]
        values=[float(v) for v in raw.split(",")]
        self.assertEqual(values,[d["value"] for d in self.chart("histogram-bimodal")["data"]])
        for token in ('bin_width <- 4','seq(30, 70, by = bin_width)','closed = "left"','sum(b$count)','print(p)'):self.assertIn(token,code)

    def test_targeted_histogram_shacl_and_compiler_rejections(self):
        shapes=self.dataset.graph(BASE+"shapes/core")+self.dataset.graph(BASE+"shapes/histogram")
        focus=list(self.teaching.subjects(CD.chartType,None))
        for shape in (CD.ChartDefinitionShape,CD.HistogramShape):
            conforms,_,report=validate(self.union,shacl_graph=shapes,focus_nodes=[str(s) for s in focus],use_shapes=[str(shape)],advanced=True)
            self.assertTrue(conforms,str(report)[:5000])
        graph=self.dataset.graph(BASE+"specifications/level4-histogram-teaching")
        graph.set((EX["l4-hist-adaptive-chart"],CD.histogramNormalization,Literal("count")))
        with self.assertRaisesRegex(ValueError,"density"):
            runtime.chart_payload(self.dataset,EX["l4-hist-adaptive-chart"],"en")

if __name__=="__main__":unittest.main()
