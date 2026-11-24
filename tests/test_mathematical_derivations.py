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

if __name__ == "__main__":
    unittest.main()
