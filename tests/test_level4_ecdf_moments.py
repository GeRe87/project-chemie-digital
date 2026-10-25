"""Local, bounded numerical/semantic checks for the revised lecture."""
import math
import statistics
import sys
import unittest
from pathlib import Path
from rdflib import Namespace, RDF
from pyshacl import validate
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
import rdf_dataset
import validate_semantics
import generate_canonical_runtime as runtime
from histogram_statistics import bins
CD=Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX=Namespace("https://w3id.org/project-chemie-digital/resource/")
BASE="https://w3id.org/project-chemie-digital/graph/"

class RevisedLectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX["path-chemometrics-level4-distribution-shape-lecture"]),BASE+"paths/chemometrics-level4-distribution-shape-lecture"))

    def scene(self,slug):
        return next(s for s in self.document["scenes"] if s["id"]=="ex:l4-scene-"+slug+"--scene")

    def chart(self,slug):
        return next(b for b in self.scene(slug)["blocks"] if b["kind"]=="chart")

    def test_path_has_exact_selection_resources_and_no_retired_continuation(self):
        g=self.dataset.graph(BASE+"paths/chemometrics-level4-distribution-shape-lecture")
        steps=set(g.objects(EX["path-chemometrics-level4-distribution-shape-lecture"],CD.hasStep))
        self.assertEqual(list(range(1,66)),sorted(int(g.value(s,CD.position)) for s in steps))
        for step in steps:
            scene=g.value(step,CD.usesScene)
            self.assertEqual(set(g.objects(step,CD.usesResource)),{self.union.value(i,CD.selectsResource) for i in self.union.objects(scene,CD.hasSceneItem)})
        ids=[s["id"] for s in self.document["scenes"]]
        block_ids=[b["id"] for s in self.document["scenes"] for b in s["blocks"]]
        self.assertEqual(len(block_ids),len(set(block_ids)),"Scene selections must not reuse block identities")
        self.assertLess(ids.index(self.scene("histogram-lab")["id"]),ids.index(self.scene("ecdf-question")["id"]))
        self.assertEqual(self.scene("moment-lab")["id"],ids[-1])
        self.assertNotIn("ex:l4-scene-observation-ecdf--scene",ids)

    def test_spread_intervals_are_calculated_from_the_actual_repeated_data(self):
        for slug,counts in (("spread-normal",[68,50,50]),("spread-skewed",[85,50,50])):
            chart=self.chart(slug);groups=chart["groups"]
            self.assertEqual(groups[0]["data"],groups[1]["data"])
            self.assertEqual(groups[1]["data"],groups[2]["data"])
            x=[d["value"] for d in groups[0]["data"]];med=statistics.median(x);mad=statistics.median(abs(v-med) for v in x)
            q1,_,q3=statistics.quantiles(x,n=4,method="inclusive")
            bounds=[(statistics.mean(x)-statistics.stdev(x),statistics.mean(x)+statistics.stdev(x)),(q1,q3),(med-mad,med+mad)]
            for group,(lo,hi),count in zip(groups,bounds,counts):
                interval=group["interval"]
                self.assertAlmostEqual(lo,interval["lower"]);self.assertAlmostEqual(hi,interval["upper"])
                self.assertEqual(count,sum(interval["lower"]<=v<=interval["upper"] for v in x))

    def test_unequal_worked_boundaries_counts_heights_and_areas(self):
        c=self.chart("unequal-density");x=[d["value"] for d in c["data"]]
        self.assertEqual([1,2,3,4,5,6,10,20],x)
        self.assertEqual([2.75,4.5,7],statistics.quantiles(x,n=4,method="inclusive"))
        self.assertEqual([1,2.75,4.5,7,20],c["edges"])
        result=bins(x,c["edges"],c["normalization"])
        self.assertEqual([2]*4,[b["count"] for b in result])
        for b in result:self.assertAlmostEqual(.25,b["height"]*(b["upper"]-b["lower"]))

    def test_ecdf_examples_have_no_tables_and_keep_all_observations(self):
        for slug in ("ecdf-worked","ecdf-river","ecdf-shapes","ecdf-crossing","ecdf-inverse"):
            scene=self.scene(slug);self.assertFalse(any(b["kind"]=="table" for b in scene["blocks"]))
            c=self.chart(slug);self.assertTrue(c["compact"])
            self.assertIs(c["interactive"],False)
            self.assertTrue(all(d["source"] for s in c["series"] for d in s["data"]))
        c=self.chart("ecdf-river");x=sorted(d["value"] for d in c["series"][0]["data"])
        self.assertEqual(50,len(x));self.assertEqual(24,sum(v<=12.3 for v in x))
        self.assertEqual(6.5,x[math.ceil(.25*len(x))-1]);self.assertEqual(6.625,statistics.quantiles(x,n=4,method="inclusive")[0])
        self.assertEqual([100]*4,[len(s["data"]) for s in self.chart("ecdf-shapes")["series"]])
        small=sorted(d["value"] for d in self.chart("ecdf-worked")["series"][0]["data"])
        self.assertEqual([2,4,4,5,5,6,7],small)
        self.assertEqual([1,3,3],[sum(v<=t for v in small) for t in (3.9,4,4.1)])
        body=str(self.union.value(EX["l4-ecdf-worked"],CD.body))
        for token in ("2, 4, 4, 5, 5, 6, 7", "**1/7**", "**3/7**"):self.assertIn(token,body)

    def test_raw_central_and_standardized_worked_values(self):
        x=[98,99,100,101,102];mean=statistics.mean(x)
        self.assertEqual([100,10002,1000600,100120006.8],[sum(v**r for v in x)/5 for r in range(1,5)])
        m=[sum((v-mean)**r for v in x)/5 for r in range(1,5)]
        self.assertEqual([0,2,0,6.8],m);self.assertEqual(2.5,statistics.variance(x))
        self.assertEqual(1.7,m[3]/m[1]**2)
        a=[-3]*5+[-1]*25+[2]*20
        self.assertEqual(0,statistics.mean(a));self.assertEqual(0,sum(v**3 for v in a));self.assertNotEqual(sorted(a),sorted(-v for v in a))
        for metric in ("mean","variance","kurtosis","skewness"):
            self.scene("applied-"+metric);self.scene(metric+"-matrix")

    def test_every_displayed_formula_has_a_linked_visible_symbol_legend(self):
        dct=Namespace("http://purl.org/dc/terms/")
        for scene in self.document["scenes"]:
            for i,block in enumerate(scene["blocks"]):
                if block["kind"]!="math":continue
                self.assertLess(i+1,len(scene["blocks"]),scene["id"])
                legend=scene["blocks"][i+1]
                self.assertEqual("definition-list",legend["kind"],scene["id"])
                self.assertEqual("supporting",legend["emphasis"])
                self.assertTrue(legend["entries"])
                self.assertTrue(any(s.get("relationPath")=="dct:hasPart" for s in legend["source"]))
                for entry in legend["entries"]:
                    self.assertTrue(entry["term"]);self.assertTrue(entry.get("description"))
        # Explicit inventories cover all mathematical identifiers in the new formulas.
        symbols={"applied-mean":["E[ ]","X","μ","n","i","Σ","xᵢ","x̄"],
                 "applied-variance":["E[ ]","X","μ","σ²","m₂","s²","n","i","Σ","xᵢ","x̄"],
                 "applied-kurtosis":["κ","E[ ]","X","μ","σ","K","g₂","m₂","m₄"],
                 "applied-skewness":["γ₁","E[ ]","X","μ","σ","g₁","m₃","m₂"],
                 "ecdf-concept":["Fₙ(x)","x","xᵢ","n","i","Σ","1{xᵢ ≤ x}"]}
        for slug,required in symbols.items():
            legend=next(b for b in self.scene(slug)["blocks"] if b["kind"]=="definition-list")
            text=" ".join(e["term"]+" "+e["description"] for e in legend["entries"])
            for symbol in required:self.assertIn(symbol,text,slug)

    def test_script_has_independent_continuous_prose_and_expectations_keep_empirical_counterparts(self):
        for scene in self.document["scenes"]:
            self.assertTrue(scene.get("narration"),scene["id"])
            self.assertGreater(len(scene["narration"]),180)
            self.assertFalse(any(line.startswith(("- ","• ")) for line in scene["narration"].splitlines()))
            self.assertTrue(any(s.get("relationPath")=="cd:narration" for s in scene["source"]))
        ids=[s["id"] for s in self.document["scenes"]]
        self.assertLess(ids.index(self.scene("applied-skewness")["id"]),ids.index(self.scene("applied-kurtosis")["id"]))
        for metric,empirical in (("mean",r"\bar{x}"),("variance","m_2"),("skewness","g_1"),("kurtosis","K=")):
            formula=next(b for b in self.scene("applied-"+metric)["blocks"] if b["kind"]=="math")
            self.assertIn(r"\operatorname{E}",formula["expression"])
            self.assertIn(empirical,formula["expression"])

    def test_moment_panels_keep_identical_three_series_and_expected_descriptors(self):
        reference=self.chart("mean-matrix")["series"]
        self.assertEqual([100]*3,[len(s["data"]) for s in reference])
        for metric in ("mean","variance","kurtosis","skewness"):
            c=self.chart(metric+"-matrix")
            self.assertEqual("moments",c["view"]);self.assertEqual(metric,c["momentMetric"])
            self.assertEqual(reference,c["series"])
        for series,expected_k,expected_g in zip(reference,[1.7997599759975944,2.8341605434145976,6.662333943369761],[0,0,1.7593390093663062]):
            x=[d["value"] for d in series["data"]];mu=statistics.mean(x)
            m2=sum((v-mu)**2 for v in x)/100;m3=sum((v-mu)**3 for v in x)/100;m4=sum((v-mu)**4 for v in x)/100
            self.assertAlmostEqual(50,mu);self.assertAlmostEqual(99,m2)
            self.assertAlmostEqual(expected_k,m4/m2**2);self.assertAlmostEqual(expected_g,m3/m2**1.5)
        code=str(self.union.value(EX["l4-moment-code"],CD.code))
        for token in ("mfrow=c(3,3)","type=7","qexp(p)","qnorm(p)","metric <- 'variance'"):self.assertIn(token,code)

    def test_new_options_have_targeted_shapes_and_accessible_fallbacks(self):
        shapes=self.dataset.graph(BASE+"shapes/exploration-options")
        conforms,_,report=validate(self.union,shacl_graph=shapes,advanced=True)
        self.assertTrue(conforms,str(report)[:5000])
        fallback=runtime.static_fallback({"sceneDocuments":[self.document]})
        for text in ("85/100", "48", "Uniform", "Right-skewed", "closed interval"):
            self.assertIn(text,fallback)

if __name__=="__main__":unittest.main()
