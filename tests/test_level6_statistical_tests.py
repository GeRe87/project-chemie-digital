"""Owner-directed Level-6 revision: active content, science and authoring contracts."""
import copy
import itertools
import json
import math
import re
import statistics
import subprocess
import sys
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
from rdflib import Graph, Literal, Namespace, RDF, URIRef
from rdflib.namespace import DCTERMS

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
import rdf_dataset
import generate_canonical_runtime as runtime
from thematic_script import compile_thematic_scripts
CD=Namespace('https://w3id.org/project-chemie-digital/ontology/')
EX=Namespace('https://w3id.org/project-chemie-digital/resource/')
GRAPH='https://w3id.org/project-chemie-digital/graph/'

class StatisticalTestsLevel6(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.reference=runtime.CoursePathReference(str(EX['path-level6-statistical-tests']),GRAPH+'paths/level6-statistical-tests')
        cls.document=runtime.compile_scene_document(cls.dataset,cls.reference)
        cls.binding={'pathId':cls.reference.path_id,'pathGraphId':cls.reference.path_graph_id,'sceneDocumentId':cls.document['id']}
        cls.script=compile_thematic_scripts(cls.dataset,[cls.document],[cls.binding])[0]

    def objects(self,s,p):return {o for _,_,o,_ in self.dataset.quads((s,p,None,None))}
    def body(self,name):return str(next(iter(self.objects(EX[name],CD.body))))
    def scene(self,name):return next(s for s in self.document['scenes'] if s['id']==f'ex:{name}--scene')
    def values(self,name):
        obs=sorted(self.objects(EX[name],CD.hasObservation),key=lambda o:int(next(iter(self.objects(o,CD.position)))))
        return [float(next(iter(self.objects(o,CD.numericValue)))) for o in obs]
    def node(self,code):
        return json.loads(subprocess.check_output(['node','--experimental-strip-types','--input-type=module','-e',code],text=True))

    def test_level_six_placement_is_preserved(self):
        p=EX['unit-placement-chemometrics-statistical-tests']
        self.assertEqual({EX['learning-unit-statistical-tests']},self.objects(p,CD.placesLearningUnit))
        self.assertIn(p,self.objects(EX['offering-section-chemometrics-similarity-analysis'],CD.groupsUnitPlacement))

    def test_level_six_occurrences_have_exactly_one_owner(self):
        for kind,relation in [(CD.DefinitionListEntry,CD.hasDefinitionListEntry),(CD.ScriptMaterial,CD.hasScriptMaterial)]:
            resources={s for s,_,_,_ in self.dataset.quads((None,RDF.type,kind,None)) if str(s).startswith(str(EX)+'l6')}
            self.assertTrue(resources)
            for resource in resources:
                owners={s for s,_,_,_ in self.dataset.quads((None,relation,resource,None))}
                self.assertEqual(1,len(owners),str(resource))

    def test_active_path_removes_only_the_requested_lecture_scenes(self):
        self.assertEqual(52,len(self.document['scenes']))
        ids={s['id'] for s in self.document['scenes']}
        for number in ['05','19','22','23','29','30','43','44','51','52','53','54','55','56']:
            self.assertNotIn(f'ex:l6-scene{number}--scene',ids)
        text=json.dumps(self.document,ensure_ascii=False)
        self.assertNotIn('ANOVA',text)
        self.assertNotIn('Optional R lab',text)
        self.assertFalse(any(b['kind'] in ['code','prompt'] for s in self.document['scenes'] for b in s['blocks']))

    def test_order_and_selected_resource_bindings(self):
        steps=sorted(self.objects(EX['path-level6-statistical-tests'],CD.hasStep),key=lambda s:int(next(iter(self.objects(s,CD.position)))))
        self.assertEqual(list(range(1,53)),[int(next(iter(self.objects(s,CD.position)))) for s in steps])
        for step in steps:
            scene=next(iter(self.objects(step,CD.usesScene)))
            selected={next(iter(self.objects(item,CD.selectsResource))) for item in self.objects(scene,CD.hasSceneItem)}
            self.assertTrue(selected<=self.objects(step,CD.usesResource),step)
        ids=[s['id'] for s in self.document['scenes']]
        self.assertLess(ids.index('ex:l6-scene04--scene'),ids.index('ex:l6-scene04b--scene'))
        self.assertEqual('ex:l6s-lake-comic--scene',ids[5])
        self.assertEqual('ex:l6s-esd-scene--scene',ids[-1])
        self.assertEqual('ex:l6s-pair-scene--scene',ids[39])

    def test_hypotheses_are_about_parameters_not_observed_statistics(self):
        self.assertIn('population parameter',self.body('l6r-h0'))
        self.assertIn('mean amoxicillin concentration',self.body('l6r-h0'))
        self.assertIn('**test statistic**',self.body('l6r-h0'))
        self.assertNotIn('not our sample statistic',self.body('l6r-h0'))
        self.assertFalse(any(b['kind']=='math' for b in self.scene('l6-scene03')['blocks']))
        self.assertIn('population mean',self.body('l6r-h1'))
        self.assertIn('exact equality',self.body('l6s-ice-equal'))

    def test_lake_probabilities_use_one_declared_measurement_model(self):
        normal=statistics.NormalDist();critical=normal.inv_cdf(.95);se=.5/math.sqrt(4)
        cut_a=10+critical*se;cut_b=10-critical*se
        self.assertAlmostEqual(10.4112134067,cut_a)
        self.assertAlmostEqual(9.5887865933,cut_b)
        actual=[100*(1-normal.cdf((cut-mu)/se)) for mu in [9.7,10.3] for cut in [cut_a,cut_b]]
        self.assertEqual([.22,67.18,32.82,99.78],[round(p,2) for p in actual])
        self.assertIn('not physical collapse probabilities',self.body('l6r-lake-b'))

    def test_interactive_controls_and_authored_initial_state_are_preserved(self):
        for resource,expected in [('l6-alpha-experiment',{'alpha'}),('l6-t-experiment',{'mean','sd','n'})]:
            params=self.objects(EX[resource],CD.hasExperimentParameter)
            adjustable={str(next(iter(self.objects(p,CD.parameterKey)))) for p in params if bool(next(iter(self.objects(p,CD.adjustableParameter))))}
            self.assertEqual(expected,adjustable)
        self.assertEqual(48.5,float(next(iter(self.objects(EX['l6-q-mean'],CD.numericValue)))))
        self.assertEqual(50,float(next(iter(self.objects(EX['l6-q-reference'],CD.numericValue)))))

    def test_every_formula_has_complete_authored_definition_rows_on_its_slide(self):
        formulas=[(s,b) for s in self.document['scenes'] for b in s['blocks'] if b['kind']=='math']
        self.assertEqual(16,len(formulas))
        for scene,block in formulas:
            resource=URIRef(block['source'][0]['resourceId'].replace('ex:',str(EX)))
            legends=self.objects(resource,DCTERMS.hasPart)
            self.assertEqual(1,len(legends))
            legend=next(iter(legends))
            self.assertTrue(any(b['kind']=='definition-list' and any(ref['resourceId'].replace('ex:',str(EX))==str(legend) for ref in b['source']) for b in scene['blocks']))
            for entry in self.objects(legend,CD.hasDefinitionListEntry):
                rows=str(next(iter(self.objects(entry,CD.body)))).split('\n\n')[0].split('\n')
                self.assertTrue(all(re.match(r'^- \*\*.+\*\*: .+',row) for row in rows),entry)
            self.assertTrue(self.objects(resource,CD.hasSource))

    def test_result_scenes_have_real_tables_not_text_box_mimics(self):
        for number in ['12','16','18','25','28','33','35','37','40','42']:
            blocks=self.scene('l6-scene'+number)['blocks']
            tables=[b for b in blocks if b['kind']=='table']
            self.assertEqual(1,len(tables),number)
            self.assertTrue(any(b['kind'] in ['chart','media-reference'] for b in blocks),number)
            self.assertGreaterEqual(len(tables[0]['rows']),3)
            self.assertIn('p',json.dumps(tables[0],ensure_ascii=False).lower())

    def test_charts_preserve_all_revised_observations(self):
        expected={'l6r-recovery-data':[81,80,82,83,81,82],'l6r-paired-data':[2,3,0,4,3,5],
                  'l6r-nir-data':[8,9,10,11,12],'l6r-hplc-data':[10,12,14,16,18,20],
                  'l6r-variance-data':[9.8,9.9,9.9,10.1,10.1,10.2]}
        for name,values in expected.items():self.assertEqual(values,self.values(name))
        self.assertAlmostEqual(.024,statistics.variance(self.values('l6r-variance-data')))

    def test_revised_test_statistics(self):
        rec=self.values('l6r-recovery-data');pair=self.values('l6r-paired-data')
        self.assertAlmostEqual(3.503245248726853,(statistics.mean(rec)-80)/(statistics.stdev(rec)/math.sqrt(6)))
        self.assertAlmostEqual(4.029386436689807,statistics.mean(pair)/(statistics.stdev(pair)/math.sqrt(6)))
        a=self.values('l6r-nir-data');b=self.values('l6r-hplc-data')
        va=statistics.variance(a)/len(a);vb=statistics.variance(b)/len(b)
        self.assertAlmostEqual(-2.97044262893,(statistics.mean(a)-statistics.mean(b))/math.sqrt(va+vb))
        self.assertAlmostEqual(6.97225572979,(va+vb)**2/(va**2/4+vb**2/5))

    def test_reference_p_values_and_intervals(self):
        module=(ROOT/'packages/core/src/distribution-math.ts').as_uri()
        result=self.node('import {studentCdf,fCdf,gammaQ,quantile} from '+json.dumps(module)+";console.log(JSON.stringify({rec:1-studentCdf(3.503245248726853,5),f:1-fCdf(4,5,5),nested:1-fCdf(9.8,1,7),variance:gammaQ(2.5,6),recC:quantile(t=>studentCdf(t,5),.95,0,100),pairC:quantile(t=>studentCdf(t,5),.975,0,100),wC:quantile(t=>studentCdf(t,6.9722557297949335),.975,0,100)}));")
        for key,value in [('rec',.00861227484),('f',.07718862524),('nested',.01659821819),('variance',.0347877805)]:
            self.assertAlmostEqual(value,result[key],places=7)
        rec=self.values('l6r-recovery-data')
        self.assertAlmostEqual(80.6372078329,statistics.mean(rec)-result['recC']*statistics.stdev(rec)/math.sqrt(6))
        pairs=self.values('l6r-paired-data');margin=result['pairC']*statistics.stdev(pairs)/math.sqrt(6)
        self.assertEqual('1.026 to 4.641',f'{statistics.mean(pairs)-margin:.3f} to {statistics.mean(pairs)+margin:.3f}')
        self.assertEqual('-8.983 to -1.017',f'{-5-result["wC"]*math.sqrt(17/6):.3f} to {-5+result["wC"]*math.sqrt(17/6):.3f}')

    def test_tie_aware_mann_whitney_reference_is_exactly_declared(self):
        values=[1,2,2,2,3,4];us=[]
        for selected in itertools.combinations(range(6),3):
            a=[values[i] for i in selected];b=[values[i] for i in range(6) if i not in selected]
            us.append(sum((x>y)+.5*(x==y) for x in a for y in b))
        self.assertEqual(.3,sum(abs(u-4.5)>=3.5 for u in us)/len(us))
        self.assertIn('6 of 20',self.body('l6r-ur2b'))

    def test_signed_ranks_preserve_original_pairs(self):
        sums=[sum(rank*sign for rank,sign in zip(range(1,6),signs)) for signs in itertools.product([0,1],repeat=5)]
        self.assertEqual(.1875,sum(s<=2 or s>=13 for s in sums)/32)
        self.assertIn('Do not sort X and Y separately',self.body('l6-guide41a'))
        self.assertIn('original',self.body('l6-signed-symbols').lower())

    def test_multiple_claims_and_effect_magnitudes(self):
        self.assertAlmostEqual(.142625,1-.95**3)
        self.assertIn('independent',self.body('l6r-multi2').lower())
        self.assertIn('joint claim',self.body('l6r-multi2'))
        a=self.values('l6r-nir-data');b=self.values('l6r-hplc-data')
        pooled=math.sqrt(((len(a)-1)*statistics.variance(a)+(len(b)-1)*statistics.variance(b))/(len(a)+len(b)-2))
        self.assertAlmostEqual(-1.67705098312,(statistics.mean(a)-statistics.mean(b))/pooled)
        self.assertAlmostEqual(-.77777777778,-7/9)
        self.assertIn('0.474',self.body('l6r-cliff2'));self.assertIn('0.8',self.body('l6r-effect2'))

    def test_script_is_thematic_independent_and_materials_are_complete(self):
        self.assertEqual(10,len(self.script['sections']))
        represented={m['resourceId'] for s in self.script['sections'] for m in s['materials']}
        for scene in self.document['scenes']:
            for b in scene['blocks']:
                if b['kind'] in ['math','chart','table','media-reference']:
                    self.assertTrue(any(r['resourceId'].replace('ex:',str(EX)) in represented for r in b['source']),b['id'])
        reversed_document=copy.deepcopy(self.document);reversed_document['scenes'].reverse()
        self.assertEqual([self.script],compile_thematic_scripts(self.dataset,[reversed_document],[self.binding]))
        self.assertTrue(all(len(s['body'].split('\n\n'))>=3 for s in self.script['sections']))

    def test_active_illustrations_are_local_and_accessible(self):
        assets={b['uri']:b for s in self.document['scenes'] for b in s['blocks'] if b['kind']=='media-reference'}
        for uri,b in assets.items():
            self.assertTrue(b['alternativeText'])
            if b.get('mediaType')=='text/html':
                self.assertTrue(uri.startswith('https://www.itl.nist.gov/'))
                continue
            self.assertTrue(uri.startswith('/chemometrics/'))
            root=ET.parse(ROOT/'apps/pitch/public'/uri.lstrip('/')).getroot()
            for tag in ['title','desc']:self.assertTrue(root.find('{http://www.w3.org/2000/svg}'+tag).text)
        lake=(ROOT/'apps/pitch/public/chemometrics/level6-frozen-lake.svg').read_text(encoding='utf-8')
        self.assertNotIn('—',lake);self.assertNotIn('safety certificate',json.dumps(self.scene('l6-scene04b')))
        trees=ET.parse(ROOT/'apps/pitch/public/chemometrics/level6-decision-trees.svg').getroot()
        text=''.join(trees.itertext())
        for outcome in ['TRUE POSITIVE','FALSE POSITIVE','FALSE NEGATIVE','TRUE NEGATIVE']:
            self.assertIn(outcome,text)
        self.assertIn('POSITIVE: REJECT H₀',text)
        self.assertIn('NEGATIVE: DO NOT REJECT H₀',text)

    def test_current_content_has_no_ci_teaching_or_df_abbreviation(self):
        def visible(node):
            if isinstance(node,dict):
                return ' '.join(visible(v) for k,v in node.items() if k not in ['id','source','resourceId','uri'])
            if isinstance(node,list):return ' '.join(visible(v) for v in node)
            return node if isinstance(node,str) else ''
        text=visible(self.document)+' '+visible(self.script)
        self.assertNotRegex(text,r'\bdf\b|\bCI\b|confidence interval')
        for scene in self.document['scenes']:
            for block in scene['blocks']:
                if block['kind']=='media-reference' and block['uri'].endswith('.svg'):
                    svg=(ROOT/'apps/pitch/public'/block['uri'].lstrip('/')).read_text(encoding='utf-8')
                    self.assertNotRegex(' '.join(ET.fromstring(svg).itertext()),r'\bdf\b|\bCI\b|confidence interval')

    def test_new_interaction_overlay_and_reference_sources_are_authored(self):
        score=next(b for b in self.scene('l6s-pair-scene')['blocks'] if b['kind']=='chart')
        self.assertEqual('pairwise-score',score['experimentKind']);self.assertEqual(6,len(score['data']))
        setup=next(b for b in self.scene('l6-scene36')['blocks'] if b.get('disclosure',{}).get('mode')=='optional')
        self.assertEqual('Show experiment: rows and columns',setup['accessibility']['label'])
        self.assertTrue(any(s.get('relationPath')=='cd:optionalMaterial' for s in setup['source']))
        references=[b for s in self.document['scenes'] for b in s['blocks'] if b.get('mediaType')=='text/html']
        self.assertGreaterEqual(len({b['uri'] for b in references}),12)
        self.assertIn('https://www.itl.nist.gov/div898/handbook/eda/section3/eda3672.htm',{b['uri'] for b in references})
        self.assertIn('upper bound r',self.body('l6s-esd-a').replace('**',''))
        self.assertIn('n ≥ 15',self.body('l6s-esd-b'))

    def test_additive_shacl_shapes_accept_authoring_and_reject_bad_groups(self):
        from pyshacl import validate
        data=Graph()
        for s,p,o,_ in self.dataset.quads((None,None,None,None)):data.add((s,p,o))
        shapes=Graph()
        for name in ['scientific-experiments','optional-material']:
            for triple in self.dataset.graph(URIRef(GRAPH+'shapes/'+name)):shapes.add(triple)
        conforms,_,text=validate(data,shacl_graph=shapes,advanced=True)
        self.assertTrue(conforms,text)
        data.set((EX['l6s-x1'],CD.pairedValue,Literal(2.0)))
        self.assertFalse(validate(data,shacl_graph=shapes,advanced=True)[0])

    def test_optional_material_cannot_hide_a_formula_or_legend(self):
        data=copy.deepcopy(self.dataset)
        for s,p,o,g in list(data.quads((EX['l6s-optional-setup'],CD.selectsResource,None,None))):
            data.graph(g).remove((s,p,o))
            data.graph(g).add((s,p,EX['l6-formula-independence']))
        # Wrong role/type or illustration-only boundary must reject, never hide math.
        with self.assertRaises(ValueError):runtime.compile_scene_document(data,self.reference)

    def test_all_active_figure_captions_are_authored_as_bullets(self):
        for s in self.document['scenes']:
            for b in s['blocks']:
                caption=b.get('caption') if b['kind']=='media-reference' else b.get('description') if b['kind']=='chart' else None
                if caption:self.assertTrue(all(line.startswith('- ') for line in caption.split('\n')),b['id'])

    def test_speaker_notes_match_the_current_sequence(self):
        notes=(ROOT/'docs/chemometrics-level6-speaker-notes.md').read_text(encoding='utf-8')
        parts=re.findall(r'^## Folie (\d{2}) — ([^\n]+)\n\nSzene: `(ex:[^`]+)`\n(.*?)(?=^## |\Z)',notes,re.M|re.S)
        self.assertEqual(52,len(parts))
        for i,((number,title,identity,body),scene) in enumerate(zip(parts,self.document['scenes']),1):
            self.assertEqual(i,int(number));self.assertEqual(scene['id'].removesuffix('--scene'),identity)
            self.assertEqual(next(b['text'] for b in scene['blocks'] if b['kind']=='prose'),title)
            self.assertIn('**Transition:**' if i<52 else '**Closing:**',body)

if __name__=='__main__':unittest.main()
