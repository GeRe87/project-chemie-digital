"""Focused semantic/compiler contracts; no LaTeX-based algebra inference."""
import sys
import unittest
from fractions import Fraction
from pathlib import Path
from rdflib import Dataset, Literal, Namespace, RDF, XSD
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from generate_canonical_runtime import mathematical_derivation_payload, compile_scene_document, dot_plot_payload, objects, decimal_number
from course_path_selection import CoursePathReference

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://example.test/")
DCT = Namespace("http://purl.org/dc/terms/")
FIXTURE = '''
@prefix cd: <https://w3id.org/project-chemie-digital/ontology/> .
@prefix ex: <https://example.test/> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix dct: <http://purl.org/dc/terms/> .
ex:g {
 ex:d a cd:MathematicalDerivation ; skos:prefLabel "Generic algebra"@en ; cd:inputFormula ex:f0 ; cd:resultFormula ex:f2 ; cd:hasDerivationStep ex:s2, ex:s1 .
 ex:section a cd:MathematicalDerivationSection ; cd:partOfDerivation ex:d ; cd:firstDerivationStep ex:s1 ; cd:lastDerivationStep ex:s2 ; cd:usesLegend ex:legend .
 ex:f0 a cd:MathExpression ; cd:latex "x=1" ; cd:hasSymbol ex:x .
 ex:f1 a cd:MathExpression ; cd:latex "x+0=1" ; cd:hasSymbol ex:x .
 ex:f2 a cd:MathExpression ; cd:latex "x=1" ; cd:hasSymbol ex:x .
 ex:rf a cd:MathExpression ; cd:latex "x+0=x" ; cd:hasSymbol ex:x .
 ex:x a cd:MathSymbol ; cd:symbol "x" ; cd:body "Real number."@en .
 ex:s1 a cd:DerivationStep ; cd:position 1 ; skos:prefLabel "Add zero"@en ; cd:fromFormula ex:f0 ; cd:toFormula ex:f1 ; cd:appliesRule ex:r ; cd:hasExplanation ex:e1 ; cd:transformationKind cd:EquivalentTransformation .
 ex:s2 a cd:DerivationStep ; cd:position 2 ; skos:prefLabel "Remove zero"@en ; cd:fromFormula ex:f1 ; cd:toFormula ex:f2 ; cd:appliesRule ex:r ; cd:hasExplanation ex:e2 ; cd:transformationKind cd:EquivalentTransformation .
 ex:r a cd:MathematicalRule ; skos:prefLabel "Additive identity"@en ; cd:ruleFormula ex:rf ; cd:body "Adding zero leaves a real number unchanged."@en .
 ex:e1 a cd:Interpretation ; cd:body "Add zero to this expression."@en ; cd:applicationFormula ex:f1 .
 ex:e2 a cd:Interpretation ; cd:body "Use the same identity in reverse."@en ; cd:applicationFormula ex:f2 .
 cd:EquivalentTransformation skos:prefLabel "Equivalent transformation"@en .
 cd:StatisticalTransformation skos:prefLabel "Statistical transformation"@en .
 ex:legend a cd:DefinitionList ; cd:hasDefinitionListEntry ex:entry .
 ex:entry a cd:DefinitionListEntry ; cd:position 1 ; skos:prefLabel "x"@en ; cd:body "Real number."@en ; dct:references ex:x .
}
'''

class MathematicalDerivationProjectionTests(unittest.TestCase):
    def setUp(self):
        self.dataset = Dataset(default_union=True)
        self.dataset.parse(data=FIXTURE, format="trig")
        self.graph = self.dataset.graph(EX.g)

    def payload(self):
        return mathematical_derivation_payload(self.dataset, EX.section, "en")

    def test_order_is_authored_not_triple_order_or_formula_text(self):
        value = self.payload()
        self.assertEqual([s["order"] for s in value["steps"]], [1, 2])
        self.assertEqual(value["steps"][0]["to"]["id"], value["steps"][1]["from"]["id"])
        self.assertEqual(value["steps"][0]["rule"]["formula"]["expression"], "x+0=x")
        self.assertTrue(value["steps"][0]["explanation"]["source"])

    def test_disconnected_source_is_rejected(self):
        self.graph.set((EX.s2, CD.fromFormula, EX.f0))
        with self.assertRaisesRegex(ValueError, "Disconnected"):
            self.payload()

    def test_optional_formula_label_and_authored_notation_retain_provenance(self):
        self.graph.add((EX.f0, CD.formulaLabel, Literal("Input quantity", lang="en")))
        self.graph.add((EX.x, CD.mathNotation, Literal("x_i")))
        value = self.payload()
        self.assertEqual(value['steps'][0]['from']['label'], 'Input quantity')
        self.assertEqual(value['legend'][0]['expression'], 'x_i')
        self.assertTrue(any(s['relationPath']=='cd:formulaLabel' for s in value['steps'][0]['from']['source']))
        self.assertTrue(any(s['relationPath']=='cd:mathNotation' for s in value['legend'][0]['source']))

    def test_duplicate_orders_are_rejected(self):
        self.graph.set((EX.s2, CD.position, Literal(1)))
        with self.assertRaisesRegex(ValueError, "unique and contiguous"):
            self.payload()

    def test_missing_rule_is_not_inferred_from_equations(self):
        self.graph.remove((EX.r, RDF.type, CD.MathematicalRule))
        with self.assertRaisesRegex(ValueError, "MathematicalRule"):
            self.payload()

    def test_ambiguous_rule_formula_is_rejected(self):
        self.graph.add((EX.r,CD.ruleFormula,EX.f2))
        with self.assertRaises(ValueError):
            self.payload()

    def test_missing_symbol_definition_is_rejected(self):
        self.graph.remove((EX.entry, DCT.references, EX.x))
        with self.assertRaisesRegex(ValueError, "Incomplete derivation symbol legend"):
            self.payload()

    def test_statistical_results_require_explicit_assumptions(self):
        self.graph.set((EX.s1, CD.transformationKind, CD.StatisticalTransformation))
        with self.assertRaisesRegex(ValueError, "explicit assumptions"):
            self.payload()

    def test_reversed_semantic_section_is_rejected(self):
        self.graph.set((EX.section, CD.firstDerivationStep, EX.s2))
        self.graph.set((EX.section, CD.lastDerivationStep, EX.s1))
        with self.assertRaisesRegex(ValueError, "explicit contiguous"):
            self.payload()

class CanonicalDerivationReferenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = Dataset(default_union=True)
        for path in (Path(__file__).resolve().parents[1] / "ontology/dataset").glob("*.trig"):
            cls.dataset.parse(path, format="trig")

    def test_existing_mean_calculation_is_referenced_without_changing_published_path(self):
        document = compile_scene_document(self.dataset, CoursePathReference(
            "https://w3id.org/project-chemie-digital/resource/path-mathematical-derivation-reference",
            "https://w3id.org/project-chemie-digital/graph/paths/mathematical-derivation-reference"))
        self.assertEqual(document["version"], "1.7")
        block = next(b for b in document["scenes"][0]["blocks"] if b["kind"] == "math")
        self.assertEqual(block["derivation"]["steps"][0]["to"]["id"], "ex:mean-dice-average-formula")
        self.assertIn("14.8", block["derivation"]["steps"][0]["to"]["expression"])
        owner = Namespace("https://w3id.org/project-chemie-digital/resource/")
        self.assertNotIn(owner["path-step-mathematical-derivation-reference"], set(self.dataset.objects(owner["path-chemometrics-mean-values-lecture"], CD.hasStep)))

    def test_residual_and_shift_algebra_on_existing_observations_is_exact(self):
        owner = Namespace("https://w3id.org/project-chemie-digital/resource/")
        for resource in [owner["vr-data-a"], owner["vr-data-b"]]:
            values = [Fraction(str(next(self.dataset.objects(o, CD.numericValue)))) for o in self.dataset.objects(resource, CD.hasObservation)]
            n = len(values)
            mean = sum(values) / n
            residuals = [x - mean for x in values]
            center = Fraction(7, 3)  # arbitrary center, not a claimed simulation population
            delta = mean - center
            self.assertEqual(sum(residuals), 0)
            self.assertEqual(sum((x-center)**2 for x in values), sum(d*d for d in residuals)+n*delta**2)
            for x,d in zip(values,residuals):
                self.assertEqual((x-center)**2, d*d+2*delta*d+delta**2)

    def test_stem_chart_uses_unchanged_six_observations_and_exact_shared_mean(self):
        owner = Namespace("https://w3id.org/project-chemie-digital/resource/")
        chart, _ = dot_plot_payload(self.dataset, owner['vs-deviation-chart'], 'en')
        self.assertTrue(chart['drawStems'])
        self.assertEqual([d['value'] for g in chart['groups'] for d in g['data']], [9,10,13,5,10,17])
        self.assertEqual([d['label'] for g in chart['groups'] for d in g['data']], ['A₁','A₂','A₃','B₁','B₂','B₃'])
        self.assertAlmostEqual(chart['referenceLine']['value'], 32/3)

    def test_lake_results_match_the_canonical_observations(self):
        owner = Namespace("https://w3id.org/project-chemie-digital/resource/")
        values = [decimal_number(self.dataset, o, CD.numericValue) for o in objects(self.dataset, owner['lake-sample'], CD.hasObservation)]
        mean = sum(values)/len(values)
        self.assertAlmostEqual(mean, decimal_number(self.dataset, owner['lake-mean'], CD.numericValue), places=12)
        self.assertAlmostEqual(sum((v-mean)**2 for v in values)/len(values), decimal_number(self.dataset, owner['lake-msd'], CD.numericValue), places=12)

    def test_center_substitution_and_symbol_legend_are_explicit(self):
        owner = Namespace("https://w3id.org/project-chemie-digital/resource/")
        value = mathematical_derivation_payload(self.dataset, owner['md-centers-section'], 'en')
        self.assertEqual(value['steps'][0]['to']['id'], 'ex:md-centers')
        self.assertEqual(value['steps'][0]['rule']['id'], 'ex:rule-add-differences')
        self.assertTrue(all(e['symbol'] for e in value['legend']))
        self.assertTrue(all(';' not in e['description'] for e in value['legend']))
        self.assertFalse(any(e['term'] in ['a, aᵢ','b, bᵢ','c'] for e in value['legend']))

if __name__ == "__main__":
    unittest.main()
