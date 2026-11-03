"""Complete review selection and authored scientific input contracts."""
import json
import math
import re
import subprocess
from pathlib import Path
from rdflib.namespace import DCTERMS
from level5_test_support import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, validate


class ReviewCompleteTests(unittest.TestCase):
    def scene(self, original_review_number):
        """Resolve stable authored steps, independently of current page numbers."""
        step=EX[f'rc{original_review_number:02d}']
        self.assertIn(step,set(self.union.objects(EX['path-level5-review-complete'],CD.hasStep)))
        resource=next(self.union.objects(step,CD.usesScene))
        identifier='ex:'+str(resource).removeprefix(str(EX))+'--scene'
        return next(s for s in self.document['scenes'] if s['id']==identifier)

    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(
            str(EX['path-level5-review-complete']), BASE+'paths/level5-review-complete'))

    def test_complete_selection_and_unique_projected_occurrences(self):
        self.assertEqual(41, len(self.document['scenes']))
        removed=['rv-n04','rv-n05','rv-n06','rv-n19','rv-n20','rv-n23','rv-n26','lg-functions-scene','rv-n30','v3-n37','ix-bessel-scene',
                 'rv-n42','rv-n43','v3-n45','p1-n47','p1-n48','rv-n52','rv-n53','rv-n55','rv-n56','v3-n57','rv-n58','tf-square-scene','dist-square-scene','rv-n64','rv-n65','rv-n66']
        self.assertTrue({'ex:'+s+'--scene' for s in removed}.isdisjoint(s['id'] for s in self.document['scenes']))
        for name in removed:
            self.assertFalse(list(self.union.objects(EX[name],CD.hasSceneItem)))
        self.assertEqual('1.14', self.document['version'])
        ids = [b['id'] for s in self.document['scenes'] for b in s['blocks']]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual('ex:rv-n63--scene', self.document['scenes'][-1]['id'])
        self.assertTrue(all(b['disclosure']['mode']=='optional' for s in self.document['scenes']
                            for b in s['blocks'] if b['kind']=='code'))
        self.assertEqual('Compare Methods on a Standardized Scale',self.scene(13)['blocks'][0]['text'])

    def test_all_scientific_mechanisms_have_authored_inputs_and_fallback(self):
        blocks = [b for s in self.document['scenes'] for b in s['blocks']
                  if b['kind']=='chart' and b['chartType']=='experiment']
        self.assertEqual({'distribution','normal','ecdf','lognormal','squares','variance',
                          'student','f-ratio','pearson'},
                         {b['experimentKind'] for b in blocks})
        for b in blocks:
            self.assertTrue(b['source'])
            self.assertTrue(all(p['source'] and p['minimum']<=p['value']<=p['maximum']
                                and p['step']>0 for p in b['parameters']))
        html = runtime.static_fallback({'sceneDocuments':[self.document]})
        self.assertIn('Replay seed (Park-Miller)', html)

    def test_every_optional_r_example_has_an_execution_surface(self):
        blocks=[b for scene in self.document['scenes'] for b in scene['blocks'] if b['kind']=='code' and b['language']=='r']
        self.assertEqual(10,len(blocks))
        self.assertTrue(all(b['executable'] and b['disclosure']['mode']=='optional' for b in blocks))

    def test_slide_wording_uses_measurements_and_omits_print_state_editorial_labels(self):
        def visible_strings(value):
            if isinstance(value,str):
                yield value
            elif isinstance(value,list):
                for child in value:yield from visible_strings(child)
            elif isinstance(value,dict):
                for key,child in value.items():
                    if key not in ('id','source','readingOrder','narration'):
                        yield from visible_strings(child)
        for scene in self.document['scenes']:
            for text in visible_strings(scene['blocks']):
                self.assertIsNone(re.search(r'\bprinted\b|\breadings\b|\bone reading\b|Reading \(mg/L\)',text,re.I),(scene['id'],text))

    def test_script_prose_is_concise_and_reader_facing(self):
        narrations=[scene['narration'] for scene in self.document['scenes']]
        self.assertLessEqual(sum(len(text.split()) for text in narrations),1900)
        for scene,text in zip(self.document['scenes'],narrations):
            self.assertLessEqual(len(text.split()),80,scene['id'])
            self.assertIsNone(re.search(r'^N\d+\.|extended path|optional extended|next slide|\bannounce\b|the class already|the title is N',text,re.I),(scene['id'],text))

    def test_copy_edit_keeps_assumptions_at_the_relevant_explanation(self):
        self.assertIn('assumes Normal individual results',self.scene(8)['narration'])
        self.assertIn('known reference SD',self.scene(31)['narration'])
        self.assertIn('independent Normal',self.scene(44)['narration'])
        self.assertIn('population means may differ',self.scene(50)['narration'])
        self.assertIn('fitting parameters changes the reference',self.scene(61)['narration'])

    def test_formula_legends_use_authored_definition_rows_and_separate_conventions(self):
        entries=[entry for scene in self.document['scenes'] for block in scene['blocks'] if block['kind']=='definition-list' for entry in block['entries'] if entry.get('symbol')]
        self.assertEqual(43,len(entries))
        for entry in entries:
            text=entry.get('explanation',entry['description'])
            rows=text.split('\n\n')[0].splitlines()
            self.assertTrue(all(re.fullmatch(r'- \*\*(.+?)\*\*: .+',row) for row in rows),entry['id'])
            self.assertTrue(entry['expression'],entry['id'])

    def test_family_overview_uses_five_authored_mechanisms_with_complete_formula_legends(self):
        scene=self.scene(59)
        formulas=[b for b in scene['blocks'] if b['kind']=='math']
        self.assertEqual(5,len(formulas))
        for formula,fragment in zip(formulas,['X_1+X_2+X_3','X_1\\cdot X_2','(n-1)S^2','\\bar X-\\mu','S_B^2/\\sigma_B^2']):
            self.assertIn(fragment,formula['expression'])
        legends=[b for b in scene['blocks'] if b['kind']=='definition-list' and all(e.get('symbol') for e in b['entries'])]
        self.assertEqual(5,len(legends))
        self.assertTrue(all(e['description'] for b in legends for e in b['entries']))
        self.assertTrue(all(formula['source'] for formula in formulas))

    def test_lognormal_caveats_use_structured_points_and_targeted_emphasis(self):
        cards=next(b for b in self.scene(29)['blocks'] if b['kind']=='definition-list')
        self.assertEqual(3,len(cards['entries']))
        for entry in cards['entries']:
            text=entry['description']
            self.assertEqual(3,len(text.splitlines()))
            self.assertTrue(all(line.startswith('- ') for line in text.splitlines()))
            self.assertIn('**',text)
            self.assertIn('==',text)

    def test_descriptive_spread_keeps_the_known_reference_sd_visible_and_defined(self):
        formula=next(b for b in self.scene(32)['blocks'] if b['kind']=='math')
        self.assertIn('\\sigma_0=0.10',formula['expression'])
        self.assertIn('0.155',formula['expression'])
        legend=next(b for b in self.scene(32)['blocks'] if b['kind']=='definition-list')
        self.assertTrue(any('known independently' in e['description'] for e in legend['entries']))

    def test_chi_square_construction_includes_general_density_and_gamma_definition(self):
        scene=self.scene(36)
        formula=next(b for b in scene['blocks'] if b['kind']=='math')
        for term in ('X=\\sum','f_k(x)',r'\Gamma(k/2)',r'\Gamma(a)=\int_0^\infty','x>0','k>0','a>0'):
            self.assertIn(term,formula['expression'])
        legend=next(b for b in scene['blocks'] if b['kind']=='definition-list')
        text=' '.join(e['description'] for e in legend['entries'])
        for term in ('**x**','positive real','integration variable','no point mass','dimensionless'):
            self.assertIn(term,text)

    def test_distribution_introductions_show_the_repeated_experiment_before_the_live_views(self):
        ids=[s['id'] for s in self.document['scenes']]
        for kind,next_scene,fragment in [('t',self.scene(44),'\\bar X-\\mu'),('f',self.scene(49),'S_B^2/\\sigma_B^2')]:
            identifier=f'ex:dist-{kind}-intro-scene--scene'
            intro=next(s for s in self.document['scenes'] if s['id']==identifier)
            self.assertEqual(ids.index(identifier)+1,ids.index(next_scene['id']))
            diagram=next(b for b in intro['blocks'] if b['kind']=='diagram')
            self.assertEqual(4,len(diagram['nodes']))
            self.assertEqual(3,len(diagram['edges']))
            formula=next(b for b in intro['blocks'] if b['kind']=='math')
            self.assertIn(fragment,formula['expression'])
            legend=next(b for b in intro['blocks'] if b['kind']=='definition-list')
            self.assertTrue(all(entry.get('symbol') and entry['description'] for entry in legend['entries']))
        self.assertFalse(any(b['kind']=='prose' and b.get('intent',{}).get('kind')!='introduce' for b in self.scene(22)['blocks']))

    def test_targeted_experiment_shapes(self):
        conforms,_,report=validate(self.union,shacl_graph=self.dataset.graph(BASE+'shapes/scientific-experiments'),inference='none')
        self.assertTrue(conforms,report)

    def test_normal_cdf_error_function_identity_and_same_slide_symbol_legend(self):
        formula=next(b for b in self.scene(14)['blocks'] if b['kind']=='math')
        for fragment in ['\\operatorname{erf}','\\frac{z}{\\sqrt2}','\\frac{2}{\\sqrt\\pi}','e^{-t^2}']:
            self.assertIn(fragment,formula['expression'])
        legend=next(b for b in self.scene(14)['blocks'] if b['kind']=='definition-list')
        self.assertEqual(2,len(legend['entries']))
        self.assertTrue(any('no elementary antiderivative' in e['description'].lower() for e in legend['entries']))
        script="""
import fs from 'node:fs';import assert from 'node:assert/strict';
import {normalCdf} from './packages/core/src/distribution-math.ts';
for(const [z,expected] of JSON.parse(fs.readFileSync(0,'utf8')))assert(Math.abs(normalCdf(z)-expected)<1e-14);
"""
        values=[(z,.5*(1+math.erf(z/math.sqrt(2)))) for z in [-4,-2,-1,0,1,2,4]]
        result=subprocess.run(['node','--experimental-strip-types','--input-type=module','-e',script],
            input=json.dumps(values),text=True,capture_output=True,
            cwd=Path(__file__).resolve().parents[1],timeout=120)
        self.assertEqual(0,result.returncode,result.stdout+result.stderr)

    def test_review_states_are_authored_and_are_not_repeated_default_snapshots(self):
        def chart(number):
            return next(b for b in self.scene(number)['blocks'] if b['kind']=='chart')
        def values(number):
            return {p['key']:p['value'] for p in chart(number)['parameters']}
        for number,expected in {
            9:{'view':0,'family':0},10:{'view':1,'probability':.95},12:{'view':5},
            13:{'view':4,'comparisonSigma':.2},14:{'view':1},15:{'view':2},
            16:{'M':20},17:{'inverse':1},18:{'view':3,'band':2},
            25:{'view':1},28:{'view':3},36:{'df':2},
            41:{'n':6,'comparisonN':30},44:{'n':2,'view':4},46:{'n':4,'comparisonN':30,'view':4},
            50:{'view':3},
            63:{'view':1},
        }.items():
            for key,value in expected.items():
                self.assertEqual(value,values(number)[key],(number,key))
        self.assertEqual(3,len(chart(33)['groups']))
        self.assertEqual(['<5 µm','5–<10 µm','10–<20 µm','20–<40 µm','≥40 µm'],
                         [row['label'] for row in chart(62)['data']])

    def test_review_visuals_reproduce_the_decisions_and_comparison_values(self):
        script="""
import fs from 'node:fs';import assert from 'node:assert/strict';
import {runExperiment} from './packages/core/src/distribution-experiment.ts';
const d=JSON.parse(fs.readFileSync(0,'utf8'));
const block=n=>d.scenes.find(s=>s.id.endsWith('-n'+String(n).padStart(2,'0')+'--scene')).blocks.find(b=>b.kind==='chart');
const run=n=>runExperiment(block(n));const value=(r,label)=>r.readouts.find(v=>v.label===label).value;
const close=(a,b,t=1e-10)=>assert(Math.abs(a-b)<t,`${a} != ${b}`);
const coordinate=run(12);assert.deepEqual(coordinate.readouts.map(v=>v.label),['Threshold','Standardized distance']);
assert.equal(coordinate.panels.length,1);assert(!coordinate.panels[0].traces.some(t=>t.style==='area'));
close(value(run(9),'Model interval probability'),.6826894921370859);
assert.equal(run(10).panels.length,2);
close(value(run(10),'Accumulated probability F(x)'),.8413447460685429);
const inverse=runExperiment(block(10),{view:2,probability:.95});close(value(inverse,'Accumulated probability F(x)'),.95);
const flat=runExperiment(block(10),{family:1,view:2,probability:.25});close(value(flat,'Accumulated probability F(x)'),.25);
close(value(flat,'Shared threshold (mg/L)'),10-Math.sqrt(3)*.1/2);
for(const family of [0,1]){const at=x=>runExperiment(block(10),{family,threshold:x});const h=1e-5;
 const slope=(value(at(10+h),'Accumulated probability F(x)')-value(at(10-h),'Accumulated probability F(x)'))/(2*h);
 close(slope,value(at(10),'Density f(x), not probability'),1e-6);
 for(const probability of [.01,.25,.5,.95,.99])close(value(runExperiment(block(10),{family,view:2,probability}),'Accumulated probability F(x)'),probability,1e-10);
}
close(value(run(13),'Device B standardized distance'),1);
close(value(run(17),'Threshold'),10.232634787404084);
close(value(run(18),'Central coverage'),.9544997361036416);
assert.match(run(25).panels[0].xLabel,/log ratio/);
assert(value(run(28),'Inverse threshold for selected rate')>15);
const variances=run(41).panels[0].traces;assert.equal(variances.length,2);
assert.deepEqual(variances[0].points.map(p=>p.x),variances[1].points.map(p=>p.x));
for(const n of [44,46,50]){const r=run(n);assert(!r.readouts.some(v=>/ p$|critical|bound|Observed|percentile/i.test(v.label)));assert(!r.panels.some(p=>p.markers?.length));assert(!/reject|CRM|alpha/i.test(r.note));}
assert.equal(value(run(44),'Degrees of freedom'),1);
assert.equal(value(run(46),'Degrees of freedom'),3);assert.equal(value(run(46),'Comparison degrees of freedom'),29);
const asymmetric=runExperiment(block(50),{nB:10});assert.equal(value(asymmetric,'Numerator df'),9);assert.equal(value(asymmetric,'Denominator df'),5);
const reverse=runExperiment(block(50),{nB:10,reverse:1});assert.equal(value(reverse,'Numerator df'),5);assert.equal(value(reverse,'Denominator df'),9);
close(value(run(63),'Pearson statistic'),11.6);close(value(run(63),'Prespecified upper 5% cutoff'),9.487729036781154);
const counts=run(62).panels[0].traces;assert.equal(counts[0].label,'Observed');assert.equal(counts[0].style,'bars');assert.equal(counts[1].label,'Expected');assert.equal(counts[1].style,'points');assert.equal(counts[1].emphasis,'reference');assert.deepEqual(counts[1].points.map(p=>p.y),[10,20,40,20,10]);
assert.match(value(run(63),'Interpretation'),/^Counts differ significantly/);
const compatible=runExperiment(block(63),{mode:1});close(value(compatible,'Pearson statistic'),.225);assert.match(value(compatible,'Interpretation'),/^No significant departure/);
console.log('Authored P1 snapshots, inference markers and source comparisons passed');
"""
        result=subprocess.run(['node','--experimental-strip-types','--input-type=module','-e',script],
            input=json.dumps(self.document),text=True,capture_output=True,
            cwd=Path(__file__).resolve().parents[1],timeout=120)
        self.assertEqual(0,result.returncode,result.stdout+result.stderr)

    def test_v3_authored_calculations(self):
        for number,fragments in {
            63:['\\sum','O_j-E_j','(4-10)^2','11.6'],
        }.items():
            block=next(b for b in self.scene(number)['blocks'] if b['kind']=='math')
            for fragment in fragments:self.assertIn(fragment,block['expression'])
            self.assertTrue(block['source'])
        scene31=self.scene(31)['blocks']
        self.assertEqual(1,sum(b['kind']=='media-reference' for b in scene31))
        self.assertFalse(any(b['kind']=='definition-list' for b in scene31))
        roles=set()
        for scene in self.document['scenes']:
            subject=EX[scene['id'].split(':',1)[1].removesuffix('--scene')]
            roles.update(self.union.objects(subject,DCTERMS.type))
            self.assertEqual(1,len(list(self.union.objects(subject,DCTERMS.extent))))
            self.assertEqual(1,len(list(self.union.objects(subject,DCTERMS.isPartOf))))
        self.assertEqual({EX['v3-role-'+r] for r in ['experiment','discovery','derivation','decision','transfer']},roles)

    def test_pdf_cdf_foundation_precedes_named_normal_specialization(self):
        scenes=self.document['scenes']
        self.assertEqual(['ex:pc-n03--scene','ex:pc-n09--scene','ex:pc-n10--scene','ex:pc-n11--scene'],
                         [self.scene(i)['id'] for i in [3,9,10,11]])
        self.assertFalse(any(b.get('experimentKind')=='signed' for s in scenes for b in s['blocks']))
        area=next(b for b in self.scene(9)['blocks'] if b['kind']=='math')
        self.assertIn('\\int_a^b',area['expression'])
        relationship=next(b for b in self.scene(10)['blocks'] if b['kind']=='math')
        for text in ['F(x)=P','F\'(x)','F^{-1}(p)']:
            self.assertIn(text,relationship['expression'])
        entries=next(b for b in self.scene(10)['blocks'] if b['kind']=='definition-list')['entries']
        self.assertEqual(2,len(entries))
        self.assertTrue(all(e['description'].startswith('- ') and e['explanation'] for e in entries))
        # Displaced draft scenes are no longer shipped as canonical lecture content.
        self.assertFalse(list(self.union.objects(EX['rv-n10'],CD.hasSceneItem)))

    def test_z_notation_is_consistent_in_authored_formulas_legends_and_code(self):
        predicates=[CD.latex,CD.mathNotation,CD.body,CD.narration,CD.xAxisLabel,CD.yAxisLabel,CD.code,CD.alternativeText]
        for predicate in predicates:
            for subject,value in self.union.subject_objects(predicate):
                if any(str(subject).startswith(str(EX)+prefix) for prefix in ['nn-','lg-','pc-','v3-','rv-','p1-']):
                    self.assertIsNone(re.search(r'\\eta|η|\b[Ee]ta\b',str(value)),(subject,predicate))
        standardized=next(b for b in self.scene(12)['blocks'] if b['kind']=='math')['expression']
        for symbol in ['X\\sim','Z=','z=']:
            self.assertIn(symbol,standardized)

    def test_core_executes_every_authored_mechanism_at_both_control_bounds(self):
        script = """
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {validateSceneDocument} from './packages/core/src/scene-document.ts';
import {runExperiment} from './packages/core/src/distribution-experiment.ts';
const document=JSON.parse(fs.readFileSync(0,'utf8'));validateSceneDocument(document);
const seen=new Set(),mechanisms=new Set();
for(const scene of document.scenes)for(const block of scene.blocks){
 if(block.chartType!=='experiment'||seen.has(block.id))continue;
 seen.add(block.id);mechanisms.add(block.experimentKind);
 const check=(overrides={})=>{const result=runExperiment(block,overrides);
  assert(result.panels.length);for(const panel of result.panels)for(const trace of panel.traces)
   assert(trace.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  assert(result.readouts.every(r=>typeof r.value==='string'||Number.isFinite(r.value)));
 };
 check();for(const p of block.parameters.filter(p=>p.adjustable)){
  check({[p.key]:p.minimum});check({[p.key]:p.maximum});
 }
}
assert.equal(mechanisms.size,9);assert(seen.size>=19);
assert.throws(()=>validateSceneDocument({...document,version:'1.13'}));
console.log('Thirteen selected scientific mechanisms and all control bounds passed');
"""
        result=subprocess.run(['node','--experimental-strip-types','--input-type=module','-e',script],
            input=json.dumps(self.document),text=True,capture_output=True,
            cwd=Path(__file__).resolve().parents[1],timeout=120)
        self.assertEqual(0,result.returncode,result.stdout+result.stderr)


if __name__=='__main__':
    unittest.main()
