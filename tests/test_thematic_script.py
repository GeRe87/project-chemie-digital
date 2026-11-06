"""Independent script order, complete formula units and explicit teaching pairs."""
import copy
import unittest
from rdflib import Literal, Namespace, RDF, Graph
from rdflib.namespace import DCTERMS
from level5_test_support import rdf_dataset, runtime, EX, CD, BASE
from thematic_script import compile_thematic_scripts

class ThematicScriptTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.binding={'pathId':str(EX['path-level5-review-complete']),
                     'pathGraphId':BASE+'paths/level5-review-complete',
                     'sceneDocumentId':'ex:path-level5-review-complete--scene-document'}
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(cls.binding['pathId'],cls.binding['pathGraphId']))
    def compile(self,document=None):
        return compile_thematic_scripts(self.dataset,[document or self.document],[self.binding])
    def test_script_is_thematic_and_preserves_all_authored_formula_units(self):
        scripts=self.compile();self.assertEqual(1,len(scripts))
        script=scripts[0];self.assertEqual(10,len(script['sections']))
        expected={b['source'][0]['resourceId'] for scene in self.document['scenes'] for b in scene['blocks'] if b['kind']=='math'}
        actual={b['source'][0]['resourceId'] for s in script['sections'] for m in s['materials'] for b in m['blocks'] if b['kind']=='math'}
        self.assertEqual(expected,actual)
        codes={b['code'] for scene in self.document['scenes'] for b in scene['blocks'] if b['kind']=='code'}
        self.assertEqual(codes,{b['code'] for s in script['sections'] for m in s['materials'] for b in m['blocks'] if b['kind']=='code'})
        self.assertEqual({s['id'] for s in self.document['scenes']},{i for s in script['sections'] for i in s['relatedSceneIds']})
        for section in script['sections']:
            self.assertGreaterEqual(len(section['body'].split('\n\n')),3)
            for material in section['materials']:
                if material['blocks'][0]['kind']=='math':
                    self.assertTrue(any(b['kind']=='definition-list' for b in material['blocks'][1:]))
    def test_scene_array_order_does_not_define_script_order_or_text(self):
        document=copy.deepcopy(self.document);document['scenes'].reverse()
        self.assertEqual(self.compile(),self.compile(document))
    def test_nested_material_and_legend_preserve_shared_script_output(self):
        document=copy.deepcopy(self.document)
        for scene in document['scenes']:
            scene['blocks']=[{'kind':'group','id':scene['id']+'-container','children':scene['blocks']}]
        self.assertEqual(self.compile(),self.compile(document))
    def test_media_identity_uses_uri_provenance_instead_of_container_source(self):
        document=copy.deepcopy(self.document)
        for scene in document['scenes']:
            for block in scene['blocks']:
                if block['kind']=='media-reference':
                    block['source'].insert(0,{'resourceId':'ex:exercise-container','relationPath':'cd:hasPart','provenanceIds':[]})
        actual=self.compile(document)
        for section in actual[0]['sections']:
            for material in section['materials']:
                block=material['blocks'][0]
                if block['kind']=='media-reference':block['source']=block['source'][1:]
        self.assertEqual(self.compile(),actual)
    def test_figure_descriptions_are_authored_captions_with_source_identity(self):
        media=[b for scene in self.document['scenes'] for b in scene['blocks'] if b['kind']=='media-reference']
        self.assertEqual(9,len(media))
        for block in media:
            self.assertTrue(block.get('caption'),block['id'])
            self.assertTrue(any(source.get('relationPath')=='dct:description' for source in block['source']))
            self.assertTrue(block['alternativeText'])
        experiments=[b for scene in self.document['scenes'] for b in scene['blocks'] if b.get('chartType')=='experiment']
        for block in experiments:
            self.assertFalse(block['description'].startswith('- '),block['id'])
            self.assertNotIn('Keep this probability question open',block['description'])
    def test_student_reference_caption_matches_the_exported_sample_sizes(self):
        material=next(m for s in self.compile()[0]['sections'] for m in s['materials'] if m['resourceId']==str(EX['dist-t-compare']))
        parameters={p['key']:p['value'] for p in material['blocks'][0]['parameters']}
        self.assertIn(f"samples of {int(parameters['n'])} and {int(parameters['comparisonN'])}",material['caption'])
        self.assertIn(f"{int(parameters['n'])-1} and {int(parameters['comparisonN'])-1} degrees of freedom",material['caption'])
    def test_script_covers_visual_dependencies_instead_of_just_supported_export_kinds(self):
        visuals={b['source'][0]['resourceId'] for scene in self.document['scenes'] for b in scene['blocks'] if b['kind'] in ('chart','diagram','media-reference')}
        selected={b['source'][0]['resourceId'] for section in self.compile()[0]['sections'] for m in section['materials'] for b in m['blocks'] if b['kind'] in ('chart','diagram','media-reference')}
        # These three live Normal views repeat the already illustrated linked
        # density/CDF, tail probability and authored standardization/quantile units.
        intentional={'ex:v3-normal-coordinate','ex:p1-normal-cdf','ex:p1-normal-inverse'}
        self.assertEqual(intentional,visuals-selected)
        self.assertEqual(32,len(selected))
        self.assertIn('ex:p1-series-chart',selected)
        self.assertIn('ex:rev-qq-media',selected)
        self.assertIn('ex:rev-ks-media',selected)
        media=[b for section in self.compile()[0]['sections'] for m in section['materials'] for b in m['blocks'] if b['kind']=='media-reference']
        self.assertEqual(9,len(media))
        for block in media:self.assertRegex(block['integrity'],r'^sha256-[a-f0-9]{64}$')
    def test_reader_copy_uses_positive_explanations_and_real_symbols(self):
        fields=[]
        def collect(value):
            if isinstance(value,dict):
                for key,item in value.items():
                    if key in ('text','label','description','alternativeText') and isinstance(item,str):fields.append(item)
                    elif key not in ('source','code','expression'):collect(item)
            elif isinstance(value,list):
                for item in value:collect(item)
        collect(self.document['scenes'])
        fields.extend(section['body'] for script in self.compile() for section in script['sections'])
        reader_text='\n'.join(fields)
        for retired in ['Area, not height','not a universal measurement law','not proof of normality','Lowercase phi describes','Uppercase Phi gives','No real validation data','initial browser and PDF state','same published counts as the extended lecture']:
            self.assertNotIn(retired.casefold(),reader_text.casefold())
        density=next(s for s in self.document['scenes'] if s['id']=='ex:pc-n11--scene')
        cdf=next(s for s in self.document['scenes'] if s['id']=='ex:rv-n14--scene')
        self.assertIn('$\\varphi$',density['blocks'][0]['text'])
        self.assertIn('$\\Phi$',cdf['blocks'][0]['text'])
    def test_missing_material_fails_instead_of_silently_shortening_script(self):
        document=copy.deepcopy(self.document)
        for scene in document['scenes']:scene['blocks']=[b for b in scene['blocks'] if b['kind']!='math']
        with self.assertRaisesRegex(ValueError,'not available'):self.compile(document)
    def test_pair_is_bound_to_exact_path_and_must_remain_adjacent(self):
        graph=self.dataset.graph(self.binding['pathGraphId'])
        statement=(EX.rc10,CD.answersGuidingQuestion,EX['l5-interval-question'])
        graph.remove(statement)
        try:
            with self.assertRaisesRegex(ValueError,'immediately following'):self.compile()
        finally:graph.add(statement)
    def test_duplicate_section_positions_fail(self):
        graph=self.dataset.graph(BASE+'scripts/level5-theoretical-distributions')
        subject=EX['l5-script-probability'];old=list(graph.objects(subject,CD.position))[0]
        graph.set((subject,CD.position,Literal(1)))
        try:
            with self.assertRaisesRegex(ValueError,'positions'):self.compile()
        finally:graph.set((subject,CD.position,old))
    def test_captioned_occurrences_have_explicit_resolvable_prose_references(self):
        script=self.compile()[0]
        self.assertEqual('1.1',script['version'])
        materials={m['id']:m for section in script['sections'] for m in section['materials']}
        referenced={r['targetMaterialId'] for section in script['sections'] for r in section['references']}
        self.assertEqual(set(materials),referenced)
        self.assertTrue(all(m['caption'] and m['source'] for m in materials.values()))
        table=materials[str(EX['l5-sm-deviation-table'])]
        self.assertEqual('table',table['blocks'][0]['kind'])
        self.assertEqual(str(EX['ic-deviation-table']),table['resourceId'])
    def test_missing_caption_and_unlinked_inline_marker_fail_closed(self):
        graph=self.dataset.graph(BASE+'scripts/level5-theoretical-distributions')
        for triple,pattern in [
            ((EX['l5-sm-growth'],DCTERMS.title,None),'Missing/ambiguous script text'),
            ((EX['l5-script-model'],DCTERMS.references,EX['l5-sm-growth']),'prose/reference relations disagree'),
        ]:
            saved=list(graph.triples(triple));graph.remove(triple)
            try:
                with self.assertRaisesRegex(ValueError,pattern):self.compile()
            finally:
                for statement in saved:graph.add(statement)
    def test_script_shapes_validate_captions_and_occurrence_ownership(self):
        from pyshacl import validate
        union=Graph()
        for s,p,o,g in self.dataset.quads((None,None,None,None)):union.add((s,p,o))
        shapes=self.dataset.graph(BASE+'shapes/thematic-script')
        conforms,_,report=validate(union,shacl_graph=shapes,inference='none')
        self.assertTrue(conforms,report)
        for caption in list(union.objects(EX['l5-sm-growth'],DCTERMS.title)):
            union.remove((EX['l5-sm-growth'],DCTERMS.title,caption))
        self.assertFalse(validate(union,shacl_graph=shapes,inference='none')[0])
    def test_linked_reference_to_an_unplaced_material_fails_closed(self):
        graph=self.dataset.graph(BASE+'scripts/level5-theoretical-distributions')
        section=EX['l5-script-model'];foreign=EX['unplaced-script-material'];growth=EX['l5-sm-growth']
        body=next(graph.objects(section,CD.body))
        updated=Literal(str(body).replace('[[ref:ex:l5-sm-growth]]','[[ref:ex:unplaced-script-material]]'),lang='en')
        graph.set((section,CD.body,updated));graph.remove((section,DCTERMS.references,growth))
        graph.add((section,DCTERMS.references,foreign));graph.add((foreign,RDF.type,CD.ScriptMaterial))
        try:
            with self.assertRaisesRegex(ValueError,'outside this exact script'):self.compile()
        finally:
            graph.set((section,CD.body,body));graph.add((section,DCTERMS.references,growth))
            graph.remove((section,DCTERMS.references,foreign));graph.remove((foreign,RDF.type,CD.ScriptMaterial))

class FoundationScriptTests(unittest.TestCase):
    def test_every_level_has_an_independent_complete_formula_and_code_script(self):
        from thematic_script import walk_script_blocks
        dataset=rdf_dataset.assemble_dataset()
        paths=['chemometrics-introduction','chemometrics-random-variables-lecture',
               'chemometrics-mean-values-lecture','chemometrics-variance-dispersion-lecture',
               'chemometrics-level4-distribution-shape-lecture']
        for level,name in enumerate(paths):
            with self.subTest(level=level):
                path=str(EX['path-'+name]);graph=BASE+'paths/'+name
                document=runtime.compile_scene_document(dataset,runtime.CoursePathReference(path,graph))
                binding={'pathId':path,'pathGraphId':graph,'sceneDocumentId':document['id']}
                script=compile_thematic_scripts(dataset,[document],[binding])[0]
                self.assertEqual(level+3,len(script['sections']))
                self.assertEqual({s['id'] for s in document['scenes']},
                                 {s for chapter in script['sections'] for s in chapter['relatedSceneIds']})
                for chapter in script['sections']:
                    self.assertGreaterEqual(len(chapter['body'].split('\n\n')),3)
                source={b['source'][0]['resourceId'] for scene in document['scenes']
                        for b in walk_script_blocks(scene['blocks']) if b['kind'] in {'math','code'}}
                reused={b['source'][0]['resourceId'] for chapter in script['sections']
                        for material in chapter['materials'] for b in material['blocks'] if b['kind'] in {'math','code'}}
                self.assertEqual(source,reused)
                self.assertEqual(script,compile_thematic_scripts(dataset,[{**document,'scenes':list(reversed(document['scenes']))}],[binding])[0])

if __name__=='__main__':unittest.main()
