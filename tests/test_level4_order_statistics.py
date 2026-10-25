"""Focused checks for notation, analytical applications and counterexamples."""
import math
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

CD=Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX=Namespace("https://w3id.org/project-chemie-digital/resource/")
BASE="https://w3id.org/project-chemie-digital/graph/"
BOX_EXTRA=["box-extremes","box-symmetric","box-skewed","box-bimodal","box-uniform"]
HISTOGRAMS=["histogram-"+s for s in ("intro","reading","skewed","bimodal","2d-intro","2d-reading","too-coarse","too-fine","sensible-width","origin","rules","rule-example","variable-width","variable-construction","variable-use","lab")]
SLUGS=["data-concept","order-notation-concept"]+[f"{topic}-{kind}" for topic in ("range","quartiles","quantiles","iqr","mad") for kind in ("concept","applications","limits")]+["spread-normal","spread-skewed","box-construction","box-applications","box-limits",*BOX_EXTRA,"box-lab",*HISTOGRAMS[:13],"unequal-sort","unequal-interpolate","unequal-density",*HISTOGRAMS[13:]]

class OrderStatisticsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.teaching=cls.dataset.graph(BASE+"specifications/level4-order-teaching")
        cls.analytical=cls.dataset.graph(BASE+"specifications/level4-analytical-teaching")
        cls.scenes=cls.dataset.graph(BASE+"scenes/chemometrics-level4-distribution-shape-lecture")
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX["path-chemometrics-level4-distribution-shape-lecture"]),BASE+"paths/chemometrics-level4-distribution-shape-lecture"))

    def test_notation_precedes_concepts_followed_by_applications_and_limits(self):
        self.assertEqual(["ex:l4-scene-"+s+"--scene" for s in SLUGS],[s["id"] for s in self.document["scenes"][1:48]])
        self.assertEqual(65,len(self.document["scenes"]))
        self.assertEqual("1.12",self.document["version"])
        active={s["id"] for s in self.document["scenes"]}
        for old in ("type-7","type-7-poll","quantile-r","iqr","mad",*[t+"-examples" for t in ("range","quartiles","quantiles","iqr","mad","box")]):
            self.assertNotIn("ex:l4-scene-"+old+"--scene",active)
            self.assertIn((EX["l4-scene-"+old],RDF.type,CD.SceneDefinition),self.scenes)
        self.assertNotIn("ex:l4-scene-observation-ecdf--scene",active)
        self.assertIn("ex:l4-scene-ecdf-worked--scene",active)

    def test_scene_graph_has_only_selection_and_no_renderer_metadata(self):
        for p in (CD.body,CD.latex,CD.numericValue,CD.code):
            self.assertFalse(list(self.scenes.triples((None,p,None))))
        for scene in self.document["scenes"][1:43]:
            kinds=[b["kind"] for b in scene["blocks"]]
            if any(b["kind"]=="math" for b in scene["blocks"]):
                self.assertEqual(["prose","prose","math","definition-list","list"],kinds)
            elif "lab" in scene["id"]:
                self.assertEqual(["prose","prompt","code","definition-list"],kinds)
            elif any(b["kind"]=="table" for b in scene["blocks"]):self.assertEqual(["prose","definition-list","table","list","chart"],kinds)
            elif any(b["kind"]=="chart" for b in scene["blocks"]):self.assertEqual(["prose","prose","prose","prose","chart"],kinds)
            else:self.assertEqual(["prose","prose"],kinds)

    def datasets(self):
        return [[float(next(self.union.objects(o,CD.numericValue))) for o in sorted(self.union.objects(EX["l4-qc-"+name],CD.hasObservation),key=lambda o:int(next(self.union.objects(o,CD.position))))] for name in ("reference","extreme")]

    def table_rows(self,slug):
        scene=next(s for s in self.document["scenes"] if s["id"]=="ex:l4-scene-"+slug+"--scene")
        return [[c["text"] for c in row["cells"]] for row in next(b for b in scene["blocks"] if b["kind"]=="table")["rows"]]

    def values(self,slug,large=True):
        return [float(next(self.union.objects(o,CD.numericValue))) for o in sorted(self.union.objects(EX[("l4-large-" if large else "l4-ac-")+slug],CD.hasObservation),key=lambda o:int(next(self.union.objects(o,CD.position))))]

    def test_notation_preserves_values_ties_units_and_observation_identity(self):
        original=self.values("repeat",large=False)
        self.assertEqual([10.2,9.8,10,10,10.1],original)
        self.assertEqual([9.8,10,10,10.1,10.2],sorted(original))
        self.assertNotEqual(original[0],sorted(original)[0])
        self.assertEqual(2,original.count(10))
        formula=str(next(self.analytical.objects(EX["l4-order-notation-formula"],CD.latex)))
        self.assertIn("x_{(1)}",formula)
        self.assertIn("(9.8,10.0,10.0,10.1,10.2)",formula)
        self.assertIn("(10.2,9.8,10.0,10.0,10.1)",formula)

    def test_cases_have_context_units_and_traceable_original_observations(self):
        data_graph=self.dataset.graph(BASE+"examples/level4-analytical-cases")
        dct=Namespace("http://purl.org/dc/terms/")
        for data in data_graph.subjects(RDF.type,CD.Dataset):
            self.assertIn("Synthetic",str(next(data_graph.objects(data,dct.description))))
            self.assertTrue(list(data_graph.objects(data,CD.unit)))
            self.assertEqual(5,len(list(data_graph.objects(data,CD.hasObservation))))
        contexts=set()
        for scene in self.document["scenes"][1:43]:
            if not any(k in scene["id"] for k in ("applications","limits")):continue
            chart=next(b for b in scene["blocks"] if b["kind"]=="chart")
            if "applications" in scene["id"]:
                self.assertGreaterEqual(len(chart["groups"]),2)
                self.assertTrue(all(len(g["data"])>=50 for g in chart["groups"]))
            for group in chart["groups"]:
                self.assertIn(len(group["data"]),(5,50,100))
                self.assertTrue(all(d["source"] for d in group["data"]))
                contexts.add(group["source"][0]["resourceId"])
        self.assertGreater(len(contexts),12)

    def test_range_quartile_and_quantile_examples_are_exactly_reproducible(self):
        for i,name in enumerate(("repeat","river")):
            values=self.values(name)
            self.assertAlmostEqual(max(values)-min(values),float(self.table_rows("range-applications")[i][-1].split(" = ")[-1]))
        for i,name in enumerate(("river","effluent")):
            self.assertEqual(statistics.quantiles(self.values(name),n=4,method="inclusive"),[float(v) for v in self.table_rows("quartiles-applications")[i][-1].split(" / ")])
        for slug,p,names in (("quantiles-applications",.9,("river","blank")),("quantiles-limits",.95,("blank","blank-high"))):
            for i,name in enumerate(names):
                values=sorted(self.values(name,large=slug!="quantiles-limits"));h=(len(values)-1)*p;j=math.floor(h)
                expected=values[j]+(h-j)*(values[min(j+1,len(values)-1)]-values[j])
                self.assertAlmostEqual(expected,float(self.table_rows(slug)[i][-1].split(" = ")[-1]))

    def test_iqr_and_raw_mad_are_not_conflated_with_range_or_scaled_mad(self):
        for i,name in enumerate(("extract-a","extract-b","control")):
            q1,_,q3=statistics.quantiles(self.values(name),n=4,method="inclusive")
            self.assertAlmostEqual(q3-q1,float(self.table_rows("iqr-applications")[i][-1].split(" = ")[-1]))
        for i,name in enumerate(("repeat","spike")):
            values=self.values(name);distances=sorted(abs(v-statistics.median(values)) for v in values)
            result=self.table_rows("mad-applications")[i][-1].split(" = ")[-1]
            self.assertAlmostEqual(statistics.median(distances),float(result))
        text=" ".join(str(x) for x in self.teaching.objects(None,CD.body))
        self.assertIn("constant=1",text);self.assertIn("1.4826",text)
        self.assertIn("not all equal",text)

    def test_boxplots_use_original_data_explicit_method_and_observed_whiskers(self):
        charts=[b for s in self.document["scenes"][1:43] for b in s["blocks"] if b.get("chartType")=="box"]
        self.assertEqual(8,len(charts))
        for chart in charts:
            self.assertEqual("type7",chart["quantileMethod"]);self.assertEqual(1.5,chart["fenceMultiplier"])
        for i,name in enumerate(("extract-a","extract-b","matrix")):
            self.assertEqual(self.values(name),[d["value"] for d in charts[1]["groups"][i]["data"]])
            for a,b in zip(statistics.quantiles(self.values(name),n=4,method="inclusive"),map(float,self.table_rows("box-applications")[i][-1].split(" / "))):self.assertAlmostEqual(a,b)
        static=runtime.static_fallback({"sceneDocuments":[self.document]})
        self.assertIn("whiskers=[2",static)

    def test_counterexamples_expose_the_named_limitation(self):
        self.assertEqual(10,max(self.values("centre",False))-min(self.values("centre",False)))
        self.assertEqual(10,max(self.values("ends",False))-min(self.values("ends",False)))
        self.assertNotEqual(sorted(self.values("centre",False)),sorted(self.values("ends",False)))
        self.assertEqual(statistics.quantiles(self.values("river"),n=4,method="inclusive"),statistics.quantiles(self.values("tail"),n=4,method="inclusive"))
        self.assertNotEqual(max(self.values("river")),max(self.values("tail")))
        for name,median in (("control",100),("biased",110)):
            q1,q2,q3=statistics.quantiles(self.values(name),n=4,method="inclusive")
            self.assertAlmostEqual(1.96,q3-q1);self.assertAlmostEqual(median,q2)
        rounded=self.values("rounded",False)
        self.assertEqual(0,statistics.median(abs(v-statistics.median(rounded)) for v in rounded))
        self.assertEqual(1,max(rounded)-min(rounded))
        self.assertEqual(sorted(self.values("control",False)),sorted(self.values("shuffled",False)))
        self.assertNotEqual(self.values("control",False),self.values("shuffled",False))
        self.assertEqual(self.table_rows("box-limits")[0][-1],self.table_rows("box-limits")[1][-1])

    def test_lab_has_ggplot_code_task_expected_values_and_function_glossary(self):
        code=str(next(self.teaching.objects(EX["l4-box-code"],CD.code)))
        for term in ("library(ggplot2)","geom_boxplot(coef = 1.5)","print(p)","ggplot_build(p)","webr::install"):
            self.assertIn(term,code)
        for name,start,step in (("extract-a",95.1,.2),("extract-b",80.4,.8),("matrix",70.8,.8)):
            for i,value in enumerate(self.values(name)):self.assertAlmostEqual(value,start+step*i)
        self.assertIn("each = 50",code);self.assertEqual(3,code.count("length.out=50"))
        self.assertIn("110 to 140",str(next(self.teaching.objects(EX["l4-box-task"],CD.body))))
        self.assertIn((EX["l4-box-task"],CD.hasExpectedResult,EX["l4-box-result"]),self.teaching)
        self.assertEqual(3,len(list(self.teaching.objects(EX["l4-box-functions"],CD.hasDefinitionListEntry))))

    def test_compiler_rejects_undeclared_boxplot_conventions(self):
        dataset=rdf_dataset.assemble_dataset()
        graph=dataset.graph(BASE+"specifications/level4-analytical-teaching")
        graph.set((EX["l4-ba-chart"],CD.dependsOn,EX["sample-quantile-type-1"]))
        with self.assertRaisesRegex(ValueError,"type-7"):
            runtime.compile_scene_document(dataset,runtime.CoursePathReference(str(EX["path-chemometrics-level4-distribution-shape-lecture"]),BASE+"paths/chemometrics-level4-distribution-shape-lecture"))

    def test_new_science_is_sourced_and_existing_definitions_are_reused(self):
        for name in ("l4-def-sample-range","l4-formula-range","l4-formula-quartile-positions","l4-formula-quantile-interpolation","l4-interpretation-ggplot-boxplot","l4-interpretation-boxplot-limits"):
            self.assertTrue(list(self.union.objects(EX[name],CD.hasSource)),name)
        selected=set(self.scenes.objects(None,CD.selectsResource))
        for name in ("l4-def-quartile","l4-def-sample-quantile","l4-formula-interquartile-range","l4-formula-median-absolute-deviation"):
            self.assertIn(EX[name],selected)

    def test_targeted_shacl_for_authored_structure_and_box_contract(self):
        shapes=self.dataset.graph(BASE+"shapes/core")+self.dataset.graph(BASE+"shapes/box-plot")
        focus=set(self.teaching.subjects())|set(self.analytical.subjects())|set(self.dataset.graph(BASE+"specifications/level4-order-statistics").subjects())
        for s in self.document["scenes"][1:43]:
            iri=EX[s["id"].removeprefix("ex:").removesuffix("--scene")]
            focus.add(iri);focus.update(self.scenes.objects(iri,CD.hasSceneItem))
        names=("ConceptShape","DefinitionListShape","DefinitionListEntryShape","TableDefinitionShape","TableColumnShape","TableRowShape","TableCellShape","ChartDefinitionShape","SceneDefinitionShape","SceneItemShape","BoxPlotShape")
        sh=Namespace("http://www.w3.org/ns/shacl#")
        for name in names:
            shape=CD[name];types=set(shapes.objects(shape,sh.targetClass))
            typed=[s for s in focus if any((s,RDF.type,t) in self.union for t in types)]
            self.assertTrue(typed,name)
            # Explicit shape+focus selection bypasses SHACL's target discovery:
            # pass only correctly typed subjects to each selected shape.
            conforms,_,report=validate(self.union,shacl_graph=shapes,focus_nodes=[str(s) for s in typed],use_shapes=[str(shape)],advanced=True)
            self.assertTrue(conforms,str(report)[:8000])

if __name__=="__main__":unittest.main()
