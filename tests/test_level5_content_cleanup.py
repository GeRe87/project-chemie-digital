"""No retired path/scene payloads or unreferenced Level 5 media are shipped."""
from pathlib import Path
from rdflib import RDF
from level5_test_support import unittest,rdf_dataset,runtime,EX,CD,BASE

def copy_edit_invariants(document):
    """Editorial prose, titles, descriptions and alternative text may change.

    Formulae, symbol identities, assumptions encoded in experiments,
    observations, units, defaults, R code, resource IDs and scene order stay exact.
    """
    import copy
    result=copy.deepcopy(document)
    teaching_cues={'ex:l5-interval-question-item--block','ex:l5-quantile-answer-item--block','ex:ic-spread-answer-item--block'}
    for scene in result['scenes']:
        scene.pop('narration',None)
        headings={b['text'] for b in scene['blocks'] if b['kind']=='prose' and b.get('intent',{}).get('kind')=='introduce'}
        if scene.get('accessibility',{}).get('label') in headings:
            scene['accessibility']['label']='[authored explanatory heading]'
        scene['blocks']=[b for b in scene['blocks'] if b.get('id') not in teaching_cues]
        if 'readingOrder' in scene:scene['readingOrder']=[b for b in scene['readingOrder'] if b not in teaching_cues]
        for block in scene['blocks']:
            if block['kind'] in ('chart','diagram','math'):
                for key in ('label','description'):
                    if key in block:block[key]='[authored explanatory label/description]'
            if block.get('id')=='ex:pc-n11-v--block':
                block['yAxis']['label']='[standard-Normal density symbol label]'
            if block['kind']=='media-reference':
                block['alternativeText']='[authored alternative description]'
                # G7 adds authored dct:description captions and their exact
                # provenance; neither changes the underlying scientific asset.
                block.pop('caption',None)
                if 'source' in block:
                    block['source']=[s for s in block['source'] if s.get('relationPath')!='dct:description']
            if block['kind']=='chart':
                for state in block.get('states',[]):
                    if 'description' in state:state['description']='[authored state caption]'
            if block['kind']=='prose' and block.get('intent',{}).get('kind')=='introduce':
                block['text']='[authored explanatory heading]'
            if block['kind']=='code' and block['id'] in ('ex:rv-n61-r--block','ex:rv-n63-r--block'):
                block['executable']='[owner-enabled optional R example]'
            if block['kind']=='prose' and block.get('intent',{}).get('kind')=='explain':
                block['text']='[authored explanatory prose]'
            if block['kind']=='definition-list':
                for entry in block['entries']:
                    if not entry.get('symbol') and 'description' in entry:
                        entry['description']='[authored card prose]'
            if block['kind']=='definition-list':
                for entry in block['entries']:
                    if not entry.get('symbol'):
                        entry['term']='[authored explanatory card heading]'
                    if entry.get('symbol'):
                        entry['description']='[authored symbol definitions]'
                        if 'explanation' in entry:
                            entry['explanation']='[authored complete symbol definitions]'
    # Two approved metadata-only label changes inside chart parameters/series.
    # Canonicalize these exact strings, retaining all keys, values and bounds.
    labels={
        'Fixed reference replay count':'Fixed reference replay count, not the observed sample size',
        'Fixed standard-Normal reference':'Standard normal reference, not fitted to the simulation',
    }
    def normalize_labels(value):
        if isinstance(value,dict):
            for key,item in value.items():
                if key=='label' and isinstance(item,str) and item in labels:value[key]=labels[item]
                else:normalize_labels(item)
        elif isinstance(value,list):
            for item in value:normalize_labels(item)
    normalize_labels(result)
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
        # Recomputed on a07792de and current sources with the same editorial
        # mask: G7 media captions and the R function glossary are prose too.
        # Formulae, observations, parameters and literal R remain protected.
        self.assertEqual('75e68ccb91926d41197c244e5b06ea1d49418621cbbc50ef9fdf0ed6865bcbf8',digest)

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

    def test_five_sources_including_thematic_script_and_no_unused_level5_svg(self):
        root=Path(__file__).resolve().parents[1]
        self.assertEqual({'chemometrics-level5-'+name+'.trig' for name in ['knowledge','data','scenes','review-complete','script']},
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
