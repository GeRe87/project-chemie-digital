"""Focused sequence/library validation and exact finite-population checks."""
from fractions import Fraction
from itertools import product
from pathlib import Path
import sys
import unittest
from rdflib import Namespace, Literal, RDF

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import generate_canonical_runtime as c
from course_path_selection import CoursePathReference

CD=Namespace(c.CD); EX=Namespace(c.EX)
PATH=str(EX['path-chemometrics-variance-dispersion-lecture'])
GRAPH='https://w3id.org/project-chemie-digital/graph/paths/chemometrics-variance-dispersion-lecture'
LIB='https://w3id.org/project-chemie-digital/graph/mathematics/rules'

class BesselSequenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=c.assemble_dataset()
        cls.dataset.default_union=True
        cls.document=c.compile_scene_document(cls.dataset,CoursePathReference(PATH,GRAPH))

    def test_active_order_is_contiguous_and_introduces_rules_before_using_them(self):
        steps=c.objects(self.dataset,EX['path-chemometrics-variance-dispersion-lecture'],CD.hasStep)
        self.assertEqual(sorted(c.integer(self.dataset,s,CD.position) for s in steps),list(range(1,49)))
        scenes=self.document['scenes'];self.assertEqual(len(scenes),48)
        ids=[s['id'] for s in scenes]
        self.assertEqual(len(ids),len(set(ids)))
        compact=['compare','rules','question','algebra','expect','helper','bias','correction','practical']
        positions=[ids.index('ex:scene-cv-'+name+'--scene') for name in compact]
        self.assertEqual(positions,sorted(positions))
        self.assertLess(ids.index('ex:scene-bf-e-rules--scene'),ids.index('ex:scene-cv-expect--scene'))
        self.assertNotIn('ex:scene-vr17--scene',ids)
        self.assertIn(EX['scene-vr17'],set(self.dataset.subjects(RDF.type,CD.SceneDefinition)))
        for name in ['mean1','mean2','var1','var2','var3','shift1','shift2']:
            self.assertNotIn('ex:scene-bf-'+name+'--scene',ids)

    def test_review_selection_defers_df_and_adds_uncertainty_before_recap(self):
        import json,re
        def content(value):
            if isinstance(value,dict):return {k:content(v) for k,v in value.items() if k not in ['source','id','readingOrder','sourcePathId']}
            if isinstance(value,list):return [content(v) for v in value]
            return value
        visible=json.dumps(content(self.document))
        self.assertIsNone(re.search(r'degrees of freedom|Freiheitsgrad|minutes',visible,re.I))
        ids=[s['id'] for s in self.document['scenes']]
        self.assertNotIn('ex:scene-cv-df--scene',ids);self.assertNotIn('ex:scene-vr38--scene',ids)
        self.assertEqual(ids[-5:],['ex:scene-se-return--scene','ex:scene-se-sem--scene','ex:scene-se-rate--scene','ex:scene-se-example--scene','ex:scene-vr39--scene'])
        for scene in self.document['scenes']:
            for block in scene['blocks']:
                if block['kind']=='code':
                    prompt=next(b for b in scene['blocks'] if b['kind']=='prompt')['prompt']
                    self.assertTrue(all(line.startswith('- ') for line in prompt.splitlines()))
                    self.assertIn('**',prompt);self.assertIn('==',prompt)

    def test_standard_error_example_uses_original_qc_observations(self):
        import math
        values=[Fraction(str(c.literal(self.dataset,o,CD.numericValue))) for o in c.objects(self.dataset,EX['dataset-qc-method-a'],CD.hasObservation)]
        n=len(values);mean=sum(values)/n;variance=sum((v-mean)**2 for v in values)/(n-1)
        self.assertEqual(n,5);self.assertEqual(mean,10);self.assertEqual(variance,Fraction(1,40))
        se=math.sqrt(variance/n)
        self.assertAlmostEqual(se,0.07071067811865475)
        self.assertEqual(f'{se:.2f}','0.07')
        self.assertAlmostEqual(math.sqrt(variance/(4*n)),se/2)
        expression=c.literal(self.dataset,EX['se-example-formula'],CD.latex)
        self.assertIn('10.00',expression);self.assertIn('0.07',expression)
        self.assertIn('95%',c.literal(self.dataset,EX['se-example-k2'],CD.body,'en'))

    def test_linearity_and_covariance_are_correct_for_dependent_variables(self):
        u=[Fraction(-1),Fraction(1)];v=u
        mean=lambda xs:sum(xs)/len(xs)
        variance=lambda xs:mean([(x-mean(xs))**2 for x in xs])
        covariance=mean([(x-mean(u))*(y-mean(v)) for x,y in zip(u,v)])
        summed=[x+y for x,y in zip(u,v)]
        self.assertEqual(mean(summed),mean(u)+mean(v))
        self.assertEqual(variance(summed),variance(u)+variance(v)+2*covariance)
        self.assertEqual(covariance,1);self.assertEqual(variance([3,3]),0)
        assumptions=c.objects(self.dataset,EX['rule-expectation-finite-sum'],CD.requiresAssumption)
        self.assertNotIn(EX['assumption-independent-finite'],assumptions)

    def test_script_narration_function_legends_and_local_y_notation_are_canonical(self):
        for scene in self.document['scenes']:
            self.assertTrue(scene['narration'].strip())
            self.assertTrue(any(s.get('relationPath')=='cd:narration' for s in scene['source']))
        for resource in ['vr24-code','vr25-code','vr37-code']:
            legends=[l for l in c.objects(self.dataset,EX[resource],c.DCTERMS.hasPart) if c.is_resource_type(self.dataset,l,'DefinitionList')]
            self.assertEqual(len(legends),1)
            self.assertGreaterEqual(len(c.definition_list_sequence(self.dataset,legends[0],'en')),3)
        for resource in ['ui-sem-population','ui-sem-estimated','ui-example-formula']:
            expression=c.literal(self.dataset,EX[resource],CD.latex)
            self.assertIn(r'\bar Y',expression);self.assertNotIn(r'\bar X',expression)
        self.assertEqual(len(self.document['scenes']),48)

    def test_optional_proofs_are_complete_and_not_extra_main_stages(self):
        details=[d for s in self.document['scenes'] for b in s['blocks'] for d in b.get('derivationDetails',[])]
        self.assertEqual({d['id'] for d in details},{'ex:cv-algebra-proof','ex:cv-mean-proof','ex:derivation-residual-zero'})
        for detail in details:
            steps=[s for section in detail['sections'] for s in section['steps']]
            self.assertEqual([s['order'] for s in steps],list(range(1,detail['stepCount']+1)))
            self.assertEqual(steps[0]['from']['id'],detail['inputFormulaId'])
            self.assertEqual(steps[-1]['to']['id'],detail['resultFormulaId'])
            self.assertTrue(all(s['rule']['source'] and s['explanation']['text'] for s in steps))
            self.assertTrue(all(s['assumptions'] for s in steps if s['kind']=='statistical'))
        mean=next(d for d in details if d['id']=='ex:cv-mean-proof')
        rules=[s['rule']['id'] for section in mean['sections'] for s in section['steps']]
        self.assertIn('ex:rule-variance-uncorrelated-sum',rules)
        self.assertNotIn('ex:rule-variance-independent-sum',rules)

    def test_detail_compiler_rejects_missing_or_overlapping_sections(self):
        from rdflib import Dataset
        for overlap in [False,True]:
            ds=Dataset();ds.default_union=True
            for quad in self.dataset.quads():ds.add(quad)
            if overlap:
                graph=ds.graph(Namespace('https://example.test/')['details'])
                duplicate=EX['test-duplicate-section']
                for p,o in self.dataset.predicate_objects(EX['cv-ms1']):graph.add((duplicate,p,o))
            else:
                ds.remove((EX['cv-ms1'],CD.partOfDerivation,EX['cv-mean-proof'],None))
            with self.assertRaises(ValueError):c.mathematical_derivation_details(ds,EX['cv-mean-result'],'en')

    def test_all_new_sections_compile_with_complete_legends_and_explicit_rules(self):
        sections=[r for r in self.dataset.subjects(RDF.type,CD.MathematicalDerivationSection) if str(r).startswith(str(EX)+'bf-')]
        self.assertEqual(len(set(sections)),14)
        for resource in set(sections):
            value=c.mathematical_derivation_payload(self.dataset,resource,'en')
            self.assertEqual(len(value['steps']),1)
            self.assertTrue(value['steps'][0]['rule']['source'])
            self.assertTrue(all(e.get('expression') and e['description'] for e in value['legend']))

    def test_shared_rules_have_one_formula_and_are_not_owned_by_a_lecture_graph(self):
        names=['rule-expectation-constant','rule-expectation-location-scale','rule-expectation-addition','rule-expectation-affine','rule-variance-scaling','rule-variance-translation','rule-variance-location-scale','rule-variance-independent-sum','rule-variance-covariance','rule-variance-definition','rule-expectation-finite-average','rule-second-moment','rule-independent-product','rule-variance-uncorrelated-sum']
        for name in names:
            r=EX[name]
            owners={str(g) for _,_,_,g in self.dataset.quads((r,RDF.type,CD.MathematicalRule,None))}
            self.assertEqual(owners,{LIB},name)
            self.assertEqual(len(c.objects(self.dataset,r,CD.ruleFormula)),1)
            self.assertTrue(c.objects(self.dataset,r,CD.requiresAssumption))

    def test_same_rule_resolves_from_different_learning_paths(self):
        # Alternate consumer, not attached to any published offering. Shared
        # rule identities and provenance must not depend on the active lecture.
        graph='https://example.test/paths/independent-consumer'
        g=self.dataset.graph(Namespace(graph)[''])
        path=Namespace('https://example.test/')['path']
        step=Namespace('https://example.test/')['step']
        g.add((path,RDF.type,CD.LearningPath));g.add((path,Namespace('http://www.w3.org/2004/02/skos/core#').prefLabel,Literal('Another rule consumer',lang='en')))
        g.add((path,CD.hasStep,step));g.add((step,RDF.type,CD.PathStep));g.add((step,CD.position,Literal(1)))
        g.add((step,CD.usesScene,EX['scene-cv-helper']));g.add((step,CD.usesResource,EX['cv-mean-result']))
        other=c.compile_scene_document(self.dataset,CoursePathReference(str(path),graph))
        def resolved_rule(document):
            return next(step['rule'] for s in document['scenes'] for b in s['blocks'] for d in b.get('derivationDetails',[]) for section in d['sections'] for step in section['steps'] if step['id']=='ex:cv-m8')
        a=resolved_rule(self.document);b=resolved_rule(other)
        self.assertEqual(a,b)
        self.assertEqual(a['id'],'ex:rule-variance-uncorrelated-sum')

    def test_normalized_identity_is_exact_on_unchanged_a_and_b(self):
        for values in [[9,10,13],[5,10,17]]:
            xs=list(map(Fraction,values));n=len(xs);mean=sum(xs)/n;mu=Fraction(7,3)
            msd=sum((x-mean)**2 for x in xs)/n
            self.assertEqual(msd,sum((x-mu)**2 for x in xs)/n-(mean-mu)**2)

    def test_iid_moments_bias_and_correction_exact_without_normality(self):
        population=list(map(Fraction,[8,10,12]));mu=sum(population)/3
        variance=sum((x-mu)**2 for x in population)/3
        for n in [2,3]:
            samples=list(product(population,repeat=n));m=len(samples)
            means=[sum(xs)/n for xs in samples]
            msds=[sum((x-mean)**2 for x in xs)/n for xs,mean in zip(samples,means)]
            self.assertEqual(sum(means)/m,mu)
            self.assertEqual(sum((mean-mu)**2 for mean in means)/m,variance/n)
            self.assertEqual(sum(msds)/m,Fraction(n-1,n)*variance)
            self.assertEqual(sum(Fraction(n,n-1)*v for v in msds)/m,variance)

    def test_numeric_scaling_and_empirical_formula(self):
        self.assertEqual(2*10,20);self.assertEqual(2**2*4,16)
        expression=c.literal(self.dataset,EX['bf-practical'],CD.latex)
        self.assertNotIn('mu',expression);self.assertNotIn('sigma',expression)
        self.assertIn(r'x_i-\bar x',expression)
        self.assertIn('not calculated',c.literal(self.dataset,EX['bf-shift-key'],CD.body,'en'))

if __name__=='__main__':unittest.main()
