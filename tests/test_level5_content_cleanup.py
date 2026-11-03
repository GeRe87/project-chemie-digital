"""No retired path/scene payloads or unreferenced Level 5 media are shipped."""
from pathlib import Path
from rdflib import RDF
from level5_test_support import unittest,rdf_dataset,runtime,EX,CD,BASE

class Level5CleanupTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.path=EX['path-level5-review-complete']
        cls.graph=cls.dataset.graph(BASE+'paths/level5-review-complete')

    def test_compiled_lecture_matches_the_owner_reviewed_pre_cleanup_content(self):
        import json,hashlib
        document=runtime.compile_scene_document(self.dataset,runtime.CoursePathReference(str(self.path),BASE+'paths/level5-review-complete'))
        digest=hashlib.sha256(json.dumps(document,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
        self.assertEqual('74cd03b6e78250fe9ec0f5c971d016ae62428f8a23c6e5378e045521769312fb',digest)

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
