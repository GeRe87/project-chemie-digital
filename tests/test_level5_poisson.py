"""Direct Poisson explanations reuse charts and authored same-slide legends."""
import math
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal
from rdflib.namespace import DCTERMS

class PoissonLectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening'))
        cls.union=validate_semantics.dataset_union(cls.dataset)

    def test_appends_four_direct_explanations_without_new_interaction_model(self):
        self.assertGreaterEqual(len(self.document['scenes']),11)
        self.assertEqual([f'ex:l5-p07{s}-scene--scene' for s in 'abcd'],[s['id'] for s in self.document['scenes'][7:11]])
        for scene in self.document['scenes'][7:11]:
            self.assertTrue(scene['narration'])
            for block in scene['blocks']:
                self.assertNotEqual('prompt',block['kind'])
                self.assertNotIn('binaryExperiment',block)
                self.assertNotEqual('progressive',block.get('disclosure',{}).get('mode'))

    def test_whole_current_lecture_has_no_question_prompts(self):
        for scene in self.document['scenes']:
            self.assertNotIn('?',scene['narration'])
            for block in scene['blocks']:
                for field in ('text','label','description','spokenText'):
                    self.assertNotIn('?',block.get(field,''))
                    self.assertNotIn('Mathematische',block.get(field,''))
                for stage in block.get('binaryExperiment',{}).get('stages',[]):
                    self.assertNotIn('?',stage['prompt'])
        self.assertEqual(4,sum(len(s['blocks'][1]['binaryExperiment']['stages'])-1 for s in self.document['scenes'][:6]))
        self.assertEqual('media-reference',self.document['scenes'][6]['blocks'][1]['kind'])

    def test_probability_tables_are_model_calculations_with_complete_tails(self):
        for lam in [4,8]:
            values=[float(self.union.value(EX[f'l5-p{lam}-{k}'],CD.numericValue))/100 for k in range(17)]
            tail=float(self.union.value(EX[f'l5-p{lam}-tail'],CD.numericValue))/100
            for k,value in enumerate(values):self.assertAlmostEqual(math.exp(-lam)*lam**k/math.factorial(k),value,places=13)
            self.assertAlmostEqual(1,math.fsum(values)+tail,places=12)
            self.assertAlmostEqual(1-math.fsum(math.exp(-lam)*lam**k/math.factorial(k) for k in range(17)),tail,places=13)
        self.assertAlmostEqual(.01831563888873418,float(self.union.value(EX['l5-p4-0'],CD.numericValue))/100,places=13)
        self.assertAlmostEqual(.9816843611112658,1-float(self.union.value(EX['l5-p4-0'],CD.numericValue))/100,places=13)

    def test_grouped_charts_compare_volumes_on_the_same_integer_count_axis(self):
        chart=self.document['scenes'][9]['blocks'][1]
        self.assertEqual('chart',chart['kind'])
        self.assertEqual(36,len(chart['data']))
        self.assertEqual({'100 mL (mean 4)','200 mL (mean 8)'},{row['category'] for row in chart['data']})
        self.assertEqual([str(k) for k in range(17)]+['17+'],list(dict.fromkeys(row['group'] for row in chart['data'])))

    def test_all_formulas_have_initial_complete_legends_and_english_spoken_text(self):
        for scene in self.document['scenes'][7:]:
            for i,block in enumerate(scene['blocks']):
                if block['kind']!='math':continue
                resource=EX[block['source'][0]['resourceId'].removeprefix('ex:')]
                self.assertTrue(list(self.union.objects(resource,DCTERMS.hasPart)))
                legend=scene['blocks'][i+1]
                self.assertEqual('definition-list',legend['kind'])
                symbols=set(self.union.objects(resource,CD.hasSymbol))
                self.assertEqual(len(symbols),len(legend['entries']))
                self.assertTrue(all(entry['description'] for entry in legend['entries']))
                self.assertNotIn('Mathematische',block['spokenText'])

    def test_poisson_moments_and_binomial_limit_reference_values(self):
        for lam in [4,8]:
            mass=[math.exp(-lam)*lam**k/math.factorial(k) for k in range(100)]
            self.assertAlmostEqual(1,math.fsum(mass),places=12)
            self.assertAlmostEqual(lam,math.fsum(k*p for k,p in enumerate(mass)),places=12)
            self.assertAlmostEqual(lam,math.fsum((k-lam)**2*p for k,p in enumerate(mass)),places=12)
        errors=[abs((1-4/n)**n-math.exp(-4)) for n in [20,100,1000]]
        self.assertGreater(errors[0],errors[1]);self.assertGreater(errors[1],errors[2])

    def test_scientific_caveats_and_illustration_are_authored(self):
        narration=self.document['scenes'][7]['narration']
        for text in ['not measurements','clustering','detection','negative-binomial']:self.assertIn(text,narration)
        for graph in ['knowledge/poisson-model','specifications/level5-poisson','scenes/level5-poisson']:
            for _,_,value in self.dataset.graph(BASE+graph):
                if isinstance(value,Literal) and value.language:self.assertEqual('en',value.language)
                self.assertNotIn('\u2014',str(value))
