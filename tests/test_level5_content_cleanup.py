"""No retired path/scene payloads or unreferenced Level 5 media are shipped."""
from pathlib import Path
from rdflib import RDF
from level5_test_support import unittest,rdf_dataset,runtime,EX,CD,BASE

def copy_edit_invariants(document):
    """Only narration, explanatory prose and ordinary card bodies may change.

    Formulae, symbol identities, assumptions encoded in experiments,
    observations, units, defaults, R code, resource IDs and scene order stay exact.
    """
    import copy
    result=copy.deepcopy(document)
    for scene in result['scenes']:
        scene.pop('narration',None)
        for block in scene['blocks']:
            if block['kind']=='code' and block['id'] in ('ex:rv-n61-r--block','ex:rv-n63-r--block'):
                block['executable']='[owner-enabled optional R example]'
            if block['kind']=='prose' and block.get('intent',{}).get('kind')=='explain':
                block['text']='[authored explanatory prose]'
            if block['kind']=='definition-list' and block.get('emphasis')=='primary':
                for entry in block['entries']:
                    if not entry.get('symbol') and 'description' in entry:
                        entry['description']='[authored card prose]'
            if block['kind']=='definition-list':
                for entry in block['entries']:
                    if entry.get('symbol'):
                        entry['description']='[authored symbol definitions]'
                        if 'explanation' in entry:
                            entry['explanation']='[authored complete symbol definitions]'
    return result

class Level5CleanupTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.path=EX['path-level5-review-complete']
        cls.graph=cls.dataset.graph(BASE+'paths/level5-review-complete')

    def test_compiled_lecture_preserves_the_scientific_content_during_copy_edit(self):
        import json,hashlib
        document=runtime.compile_scene_document(self.dataset,runtime.CoursePathReference(str(self.path),BASE+'paths/level5-review-complete'))
        digest=hashlib.sha256(json.dumps(copy_edit_invariants(document),sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
        self.assertEqual('750c192cea55047603ac4d67c66dd475542d5fcc39fc77d3b02ecadadff2b2fd',digest)

    def test_copy_edit_mask_keeps_formula_and_symbol_content_protected(self):
        document={'scenes':[{'narration':'Editable explanation','blocks':[
            {'kind':'math','expression':'X=1'},
            {'kind':'definition-list','emphasis':'primary','entries':[{'symbol':True,'expression':'X','description':'Complete authored symbol legend'}]}
        ]}]}
        baseline=copy_edit_invariants(document)
        document['scenes'][0]['blocks'][0]['expression']='X=2'
        self.assertNotEqual(baseline,copy_edit_invariants(document))
        document['scenes'][0]['blocks'][0]['expression']='X=1'
        document['scenes'][0]['blocks'][1]['entries'][0]['expression']='Y'
        self.assertNotEqual(baseline,copy_edit_invariants(document))

    def test_only_the_selected_path_and_scenes_remain_in_level5_graphs(self):
        selected={scene for step in self.graph.objects(self.path,CD.hasStep) for scene in self.graph.objects(step,CD.usesScene)}
        paths=set();scenes=set()
        for s,p,o,g in self.dataset.quads((None,RDF.type,None,None)):
            if 'level5' not in str(g):continue
            if o==CD.LearningPath:paths.add(s)
            if o==CD.SceneDefinition:scenes.add(s)
        self.assertEqual({self.path},paths)
        self.assertEqual(41,len(selected))
        self.assertEqual(selected,scenes)

    def test_four_sources_and_no_unused_level5_svg(self):
        root=Path(__file__).resolve().parents[1]
        self.assertEqual({'chemometrics-level5-'+name+'.trig' for name in ['knowledge','data','scenes','review-complete']},
                         {p.name for p in (root/'ontology/dataset').glob('chemometrics-level5-*.trig')})
        values={str(o) for s,p,o,g in self.dataset.quads((None,None,None,None))}
        for p in (root/'apps/pitch/public/chemometrics').glob('level5-*.svg'):
            self.assertIn('/chemometrics/'+p.name,values,p.name)

    def test_default_preview_selects_the_single_integrated_lecture(self):
        root=Path(__file__).resolve().parents[1]
        import json
        scripts=json.loads((root/'package.json').read_text(encoding='utf8'))['scripts']
        self.assertEqual('npm run preview:level5:review-complete:generate',scripts['preview:level5:generate'])
        self.assertNotIn('preview:level5:support:generate',scripts)

if __name__=='__main__':unittest.main()
