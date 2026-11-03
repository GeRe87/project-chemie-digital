"""The reviewed lecture is the sole Level 5 entry in curriculum region 3."""
import json
import subprocess
import unittest
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
import generate_canonical_runtime as runtime

EX='https://w3id.org/project-chemie-digital/resource/'
GRAPH='https://w3id.org/project-chemie-digital/graph/paths/level5-review-complete'

class Level5OverworldTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.artifact=runtime.build_artifact(runtime.CourseUnitPathSelectionRequest(
            offering_id=EX+'teaching-offering-chemometrics-applied-statistics',
            placement_id=EX+'unit-placement-chemometrics-theoretical-distributions',
            unit_id=EX+'learning-unit-theoretical-distributions',
            requested_path_id=EX+'path-level5-review-complete',requested_path_graph_id=GRAPH))

    def test_exact_review_selection_and_binding_are_preserved(self):
        document=self.artifact['sceneDocuments'][0]
        self.assertEqual(41,len(document['scenes']))
        self.assertEqual(EX+'path-level5-review-complete',self.artifact['sceneDocumentBindings'][0]['pathId'])
        self.assertEqual(GRAPH,self.artifact['sceneDocumentBindings'][0]['pathGraphId'])
        unit=next(u for u in self.artifact['teachingOfferingDocuments'][0]['units'] if u['id']==EX+'learning-unit-theoretical-distributions')
        self.assertEqual(1,len(unit['paths']))

    def test_real_world_model_places_one_available_level_in_region_three(self):
        script=r'''
import assert from 'node:assert/strict';
import {createPitchCourseWorldModel,renderPitchCourseWorldHtml} from './apps/pitch/src/course-world.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
const a=JSON.parse(input),m=createPitchCourseWorldModel(a.teachingOfferingDocuments[0],a.sceneDocuments,a.sceneDocumentBindings,'en');
assert.equal(m.units.length,6);assert.equal(m.sections.length,7);
const region=m.sections[2],unit=region.units[0];
assert.equal(region.regionNumber,3);assert.match(region.label,/Theoretical Distributions/);
assert.equal(region.units.length,1);assert.equal(unit.levelNumber,5);
assert.equal(unit.label,'Theoretical Distribution Models');assert.equal(unit.status,'available');
assert.equal(unit.paths.length,1);assert.equal(unit.paths[0].graphId,'https://w3id.org/project-chemie-digital/graph/paths/level5-review-complete');
assert.equal(unit.thumbnail.uri,'/course-world/theoretical-distributions.svg');
const html=renderPitchCourseWorldHtml(m);assert.match(html,/data-level="5"/);
assert.match(html,/Start level: Theoretical Distribution Models/);
'''
        result=subprocess.run(['node','--experimental-strip-types','--input-type=module','-e',script],input=json.dumps(self.artifact),text=True,capture_output=True,cwd=ROOT)
        self.assertEqual(0,result.returncode,result.stdout+result.stderr)

    def test_thumbnail_is_local_and_self_contained(self):
        svg=(ROOT/'apps/pitch/public/course-world/theoretical-distributions.svg').read_text(encoding='utf8')
        self.assertIn('viewBox="0 0 360 200"',svg)
        self.assertNotRegex(svg,r'<(?:script|foreignObject|image)\b|(?:href|src)=["\'](?:https?:|data:)')

if __name__=='__main__':unittest.main()
