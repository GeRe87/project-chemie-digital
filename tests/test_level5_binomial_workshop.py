"""The next review batch: authored model, stage and complete legend contracts."""
from pathlib import Path
import xml.etree.ElementTree as ET
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal, XSD, validate
from rdflib.namespace import DCTERMS

class BinomialWorkshopTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(str(EX['path-level5-binomial-opening']), BASE + 'paths/level5-binomial-opening'))

    def test_binomial_opening_stays_in_approved_order(self):
        self.assertEqual([f'ex:l5-{name}-scene--scene' for name in ['b01','b02','b03a','b03b','b04','b05','b06']], [s['id'] for s in self.document['scenes'][:7]])
        self.assertEqual(['sequence','arrangements','distribution','zero'], [s['blocks'][1]['binaryExperiment']['mode'] for s in self.document['scenes'][2:6]])
        self.assertEqual(['prose','media-reference'], [b['kind'] for b in self.document['scenes'][6]['blocks']])

    def test_formula_and_complete_authored_legend_are_initially_visible(self):
        union = validate_semantics.dataset_union(self.dataset)
        for scene in self.document['scenes'][2:6]:
            diagram, formula, legend = scene['blocks'][1:]
            self.assertEqual(('math','definition-list'), (formula['kind'],legend['kind']))
            self.assertEqual('initial',formula['disclosure']['mode'])
            self.assertNotEqual('progressive',legend.get('disclosure',{}).get('mode'))
            resource = EX[formula['source'][0]['resourceId'].removeprefix('ex:')]
            self.assertTrue(list(union.objects(resource,DCTERMS.hasPart)))
            symbols = set(union.objects(resource, CD.hasSymbol))
            self.assertGreaterEqual(len(symbols),3)
            self.assertEqual(len(symbols),len(legend['entries']))
            self.assertTrue(all(e.get('description') for e in legend['entries']))

    def test_english_narration_and_authored_cases(self):
        for name in ['knowledge/binomial-model','specifications/level5-binomial-workshop','scenes/level5-binomial-workshop']:
            for _,_,value in self.dataset.graph(BASE+name):
                if isinstance(value,Literal) and value.language:self.assertEqual('en',value.language)
                self.assertNotIn('\u2014',str(value))
        scene=self.document['scenes'][6]
        self.assertEqual('Ten samples are not ten repeats',scene['blocks'][0]['text'])
        self.assertNotIn('binaryExperiment',scene['blocks'][1])
        for phrase in ('conditional on this sample','Poisson-binomial','not a simple binomial','does not prove representativeness or independence','environmental sample size is still one'):
            self.assertIn(phrase,scene['narration'])

    def test_shacl_rejects_target_outside_trial_count_and_missing_stage(self):
        shape=self.dataset.graph(BASE+'shapes/binary-experiment')
        for subject,predicate,value in [('l5-b03a-model',CD.binaryTargetCount,11),('l5-b03a-math',CD.revealAtStage,0)]:
            union=validate_semantics.dataset_union(self.dataset)
            union.set((EX[subject],predicate,Literal(value,datatype=XSD.integer)))
            self.assertFalse(validate(union,shacl_graph=shape,advanced=True)[0])

    def test_visual_sampling_comparison_has_accessible_static_content_and_ten_units(self):
        scene=self.document['scenes'][6]
        media=scene['blocks'][1]
        self.assertEqual('/chemometrics/level5-samples-vs-repeats.svg',media['uri'])
        self.assertIn('does not establish representativeness or independence',media['alternativeText'])
        self.assertTrue(media['source'])
        image=Path(__file__).resolve().parents[1]/'apps/pitch/public'/media['uri'].lstrip('/')
        root=ET.parse(image).getroot()
        ns={'svg':'http://www.w3.org/2000/svg'}
        self.assertEqual(10,len(root.findall('.//svg:circle',ns)))
        # One parent sample plus ten laboratory measurements, not ten field units.
        self.assertEqual(11,len(root.findall('.//svg:use',ns)))
        self.assertIsNotNone(root.find('svg:desc',ns))
        html=runtime.static_fallback({'sceneDocuments':[{**self.document,'scenes':[scene]}]})
        for phrase in ('Ten samples are not ten repeats','ten laboratory measurements','justified design'):
            self.assertIn(phrase,html)

    def test_compiler_rejects_cross_scene_reveal_trigger(self):
        dataset=rdf_dataset.assemble_dataset()
        dataset.graph(BASE+'scenes/level5-binomial-workshop').set((EX['l5-b03a-math'],CD.revealOn,EX['l5-b04-flow']))
        dataset.graph(BASE+'scenes/level5-binomial-workshop').set((EX['l5-b03a-math'],CD.revealAtStage,Literal(1,datatype=XSD.integer)))
        with self.assertRaisesRegex(ValueError,'same scene'):
            runtime.compile_scene_document(dataset,runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening'))

    def test_shacl_requires_authored_target_for_count_modes(self):
        union=validate_semantics.dataset_union(self.dataset)
        union.remove((EX['l5-b03a-model'],CD.binaryTargetCount,None))
        self.assertFalse(validate(union,shacl_graph=self.dataset.graph(BASE+'shapes/binary-experiment'),advanced=True)[0])
