"""Canonical ANOVA introduction tests. No per-test SHACL invocation."""
import json
import sys
import unittest
from pathlib import Path
from rdflib import Dataset, Graph, Namespace, URIRef
from rdflib.namespace import RDF, DCTERMS as DCT, XSD
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from rdf_dataset import assemble_dataset
from generate_canonical_runtime import CoursePathReference, compile_scene_document, compact
CD = Namespace('https://w3id.org/project-chemie-digital/ontology/')
EX = Namespace('https://w3id.org/project-chemie-digital/resource/')
GB = 'https://w3id.org/project-chemie-digital/graph/'


def review_scene(number):
    exceptions = {7: 'l7-intro-scene07', 19: 'l7-continuation-scene19'}
    if isinstance(number, str):
        return EX[f'l7-scene{number}']
    return EX[exceptions.get(number, f'l7-scene{number:02d}')]
SCENE_ORDER = (
    1, 2, '-spread-lab', 3, '-pair-limits', '-pair-perspectives', *range(4, 18), '17-calc', 18, 19, 20, 21, '22-question', 22, 23, 24, 25, 26,
    '26-adjusted', *range(27, 41), '40-example', 41, '41-example', 45, 46, 47,
)
INTRO = {URIRef(GB + s) for s in (
    'knowledge/level7-anova-intro', 'scenes/level7-anova-intro', 'paths/level7-anova-intro-review',
    'knowledge/level7-anova-continuation', 'scenes/level7-anova-continuation',
)}
EXPECTED = {'R-A':[93,95,94,92,96,94], 'R-B':[97,99,98,100,96,98], 'R-C':[94,93,92,95,91,93], 'W-A':[90,91,92,92,93,94], 'W-B':[84,85,86,86,87,88], 'W-C':[92,93,94,94,95,96]}

class AnovaIntroTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ds = assemble_dataset()
        cls.before = Dataset()
        cls.g = Graph()
        for s,p,o,c in cls.ds.quads((None,None,None,None)):
            cls.g.add((s,p,o))
            if c not in INTRO:
                cls.before.graph(c).add((s,p,o))
        cls.doc = compile_scene_document(cls.ds, CoursePathReference(str(EX['path-level7-anova-intro-review']), GB+'paths/level7-anova-intro-review'))

    def scene(self, number):
        return self.doc['scenes'][SCENE_ORDER.index(number)]

    def test_order_and_reuse(self):
        expected = [compact(review_scene(i))+'--scene' for i in SCENE_ORDER]
        self.assertEqual([s['id'] for s in self.doc['scenes']], expected)
        self.assertNotIn('manova', json.dumps(self.doc).lower())
        for i in (7,13,19):
            self.assertFalse(any(list(self.ds.graph(c).triples((EX[f'l7-scene{i:02d}'],None,None))) for c in INTRO))
        self.assertEqual(set(self.ds.graph(URIRef(GB+'paths/level7-anova-intro-review')).objects(EX['path-level7-anova-intro-review'], CD.forLearningUnit)), {EX['learning-unit-anova']})
        for scene in self.doc['scenes']:
            self.assertEqual(scene['readingOrder'], [b['id'] for b in scene['blocks']])

    def test_original_data_and_actual_chart_groups(self):
        all_ids = set()
        river_ids = set()
        for cell, values in EXPECTED.items():
            ids = {EX[f'l7-obs-{cell}-{i:02d}'] for i in range(1,7)}
            all_ids.update(ids)
            if cell.startswith('R'):
                river_ids.update(ids)
            self.assertEqual(set(self.g.objects(EX['l7-spe-'+cell], CD.hasObservation)), ids)
            for i, value in enumerate(values,1):
                obs = EX[f'l7-obs-{cell}-{i:02d}']
                self.assertEqual(float(self.g.value(obs, CD.numericValue)), value)
                self.assertEqual(int(self.g.value(obs, CD.position)), i)
                for c in INTRO:
                    self.assertFalse(list(self.ds.graph(c).triples((obs,None,None))))
        self.assertEqual(set(self.g.objects(EX['l7-spe-master36'],CD.hasObservation)),all_ids)
        self.assertEqual(set(self.g.objects(EX['l7-spe-river18'],CD.hasObservation)),river_ids)
        for number in (6,7,13):
            charts = [b for b in self.scene(number)['blocks'] if b['kind']=='chart']
            self.assertEqual(len(charts),1)
            chart = charts[0]
            self.assertEqual(chart['yAxis'], {'label':'Recovery','unit':'%'})
            group_prefix = 'l7-intro-mean-group-' if number == 7 else 'l7-river-group-'
            self.assertEqual([g['id'] for g in chart['groups']], [compact(EX[group_prefix+m]) for m in 'ABC'])
            for method, group in zip('ABC',chart['groups']):
                self.assertEqual([d['id'] for d in group['data']], [compact(EX[f'l7-obs-R-{method}-{i:02d}']) for i in range(1,7)])
                self.assertEqual([d['value'] for d in group['data']], EXPECTED['R-'+method])
                self.assertTrue(group['source'])
                self.assertTrue(all(d['source'] for d in group['data']))
                self.assertIn(GB+'data/level7-anova',json.dumps(group['source'])+json.dumps(group['data']))

    def test_formula_uses_observations_and_means_precede_deviations(self):
        formula = str(self.g.value(EX['l7-intro-formula-02'], CD.latex))
        legend = str(self.g.value(EX['l7-intro-symbols-02'], CD.body))
        self.assertIn('y_{ij}', formula)
        self.assertIn('**y_ij**', legend)
        self.assertNotIn('grand', legend.lower())
        chart, = [b for b in self.scene(7)['blocks'] if b['kind'] == 'chart']
        self.assertEqual(chart['chartType'], 'dot')
        for group in chart['groups']:
            values = [point['value'] for point in group['data']]
            self.assertEqual(group['summary']['value'], sum(values) / len(values))
        all_values = [point['value'] for group in chart['groups'] for point in group['data']]
        self.assertEqual(chart['referenceLine']['value'], sum(all_values) / len(all_values))
        self.assertNotIn('sum of squares', json.dumps(self.scene(7)).lower())

    def test_spread_demo_follows_static_panels(self):
        static, lab = self.scene(2), self.scene('-spread-lab')
        for scene in (static, lab):
            media, = [b for b in scene['blocks'] if b['kind'] == 'media-reference'
                      and b['mediaType'] == 'image/svg+xml']
            self.assertEqual(media['uri'], '/chemometrics/anova-spread-panels.svg')
            self.assertFalse(any(b['kind'] in ('chart', 'math') for b in scene['blocks']))

    def test_owned_resources_and_reciprocal_sources(self):
        subjects = {s for c in INTRO for s,p,o in self.ds.graph(c).triples((None,RDF.type,None))}
        for s in subjects:
            owners = {c for _,_,_,c in self.ds.quads((s,RDF.type,None,None))}
            self.assertEqual(len(owners),1)
            self.assertTrue(owners <= INTRO)
            sources = set(self.g.objects(s,CD.hasSource))
            self.assertTrue(sources)
            for source in sources:
                self.assertIn((source,CD.supportsResource,s),self.g)
        for c in INTRO:
            for source,_,s in self.ds.graph(c).triples((None,CD.supportsResource,None)):
                self.assertIn((s,CD.hasSource,source),self.g)
        for number in (n for n in SCENE_ORDER if n not in (7,13)):
            scene = review_scene(number)
            focus = list(self.g.objects(scene,CD.focusConcept))
            self.assertEqual(len(focus),1)
            self.assertIn((focus[0],RDF.type,CD.Concept),self.g)
            definitions = list(self.g.objects(focus[0],CD.hasDefinition))
            self.assertEqual(len(definitions),1)
            self.assertIn((definitions[0],RDF.type,CD.Definition),self.g)
            body = list(self.g.objects(definitions[0],CD.body))
            self.assertEqual(len(body),1)
            self.assertEqual(body[0].language,'en')

    def test_all_math_has_attached_compiled_legends(self):
        count = 0
        for number, scene in zip(SCENE_ORDER, self.doc['scenes'], strict=True):
            # Match canonical scenes explicitly rather than reconstructing compact prefixes.
            scene_id = review_scene(number)
            for item in self.g.objects(scene_id,CD.hasSceneItem):
                if (item,CD.communicativeRole,CD.FormulaRole) not in self.g:
                    continue
                count += 1
                f = self.g.value(item,CD.selectsResource)
                self.assertIn((f,RDF.type,CD.MathExpression),self.g)
                legends = list(self.g.objects(f,DCT.hasPart))
                self.assertTrue(legends)
                math_id = compact(item)+'--block'
                math = [b for b in scene['blocks'] if b['id']==math_id]
                self.assertEqual(len(math),1)
                self.assertEqual(math[0]['kind'],'math')
                for legend in legends:
                    expected_id = math_id+'--'+compact(legend)
                    blocks = [b for b in scene['blocks'] if b['id']==expected_id]
                    self.assertEqual(len(blocks),1)
                    self.assertEqual(blocks[0]['kind'],'definition-list')
                    entries = list(self.g.objects(legend,CD.hasDefinitionListEntry))
                    self.assertTrue(entries)
                    entries.sort(key=lambda e: int(self.g.value(e,CD.position)))
                    authored = [str(self.g.value(e,CD.body)) for e in entries]
                    self.assertEqual([e['description'] for e in blocks[0]['entries']],authored)
                    if isinstance(number, int) and number <= 13:
                        for text in authored:
                            self.assertTrue(text.startswith('- **'))
                            self.assertIn('\n\n',text)
                    else:
                        self.assertTrue(all(e.get('term') and e.get('description') for e in blocks[0]['entries']))
                    self.assertTrue(blocks[0]['source'])
        self.assertEqual(count,17)

    def test_narrations_and_visuals(self):
        for number, scene in zip(SCENE_ORDER, self.doc['scenes'], strict=True):
            narrations = list(self.g.objects(review_scene(number),CD.narration))
            self.assertEqual(len(narrations),1)
            self.assertEqual(narrations[0].language,'en')
            self.assertTrue(75 <= len(str(narrations[0]).split()) <= 180, (number, len(str(narrations[0]).split())))
            self.assertEqual(scene['narration'],str(narrations[0]))
            self.assertTrue(any(b['kind'] in ('chart','diagram','table','media-reference','definition-list') for b in scene['blocks']))
            if number not in (7,13):
                self.assertNotIn('\u2014',str(narrations[0]))
        for c in (URIRef(GB+'knowledge/level7-anova-intro'), URIRef(GB+'scenes/level7-anova-intro')):
            for _,_,o in self.ds.graph(c):
                self.assertNotIn('\u2014',str(o))

    def test_continuation_visual_evidence(self):
        import xml.etree.ElementTree as ET
        chart, = [b for b in self.scene(19)['blocks'] if b['kind'] == 'chart']
        self.assertEqual(chart['experimentKind'], 'anova-one-way')
        self.assertEqual([p['value'] for p in chart['parameters'] if p['key'] == 'view'], [2])
        originals = {n: f'l7-next-{n:02d}-visual' for n in (21,22,27,29,33,34,37)}
        new = {14:'design',17:'decomposition','17-calc':'test-chain','22-question':'explained-question',
               '26-adjusted':'tukey-range',40:'welch-groups','41-example':'kw-rank-sums'}
        new.update({n:f'visual-{n}' for n in (20,23,24,25,28,39)})
        new['40-example'] = 'welch-weights'
        for n,name in (originals | {n: f'level7-anova-{name}' for n,name in new.items()}).items():
            media = EX[name]
            path = ROOT / 'apps/pitch/public' / str(self.g.value(media,CD.uri)).lstrip('/')
            root = ET.parse(path).getroot()
            self.assertEqual(root.tag, '{http://www.w3.org/2000/svg}svg')
            self.assertEqual(root.find('{http://www.w3.org/2000/svg}desc').text,
                             str(self.g.value(media,CD.alternativeText)))
            self.assertTrue(any(b['kind'] == 'media-reference' for b in self.scene(n)['blocks']))
        tukey = EX['level7-anova-tukey-range']
        tukey_svg = ET.parse(ROOT / 'apps/pitch/public' / str(self.g.value(tukey, CD.uri)).lstrip('/')).getroot()
        labels = ' '.join(tukey_svg.itertext())
        self.assertIn('studentized range distribution', labels)
        self.assertIn('3 group means · 15 residual degrees of freedom', labels)
        self.assertIn('Right-tail area ≈ 0.000532', labels)
        for n, rows in ((18,3),(26,3),(36,5),(38,3)):
            table, = [b for b in self.scene(n)['blocks'] if b['kind'] == 'table']
            self.assertEqual(len(table['rows']),rows)
        diagram = EX['l7-next-45-diagram']
        states = sorted(self.g.objects(diagram, CD.hasDiagramState),key=lambda s: int(self.g.value(s,CD.position)))
        self.assertEqual([len(list(self.g.objects(s,CD.activeDiagramNode))) for s in states],[3,6])
        self.assertFalse(list(self.g.objects(states[0],CD.activeDiagramEdge)))
        self.assertEqual(len(list(self.g.objects(states[1],CD.activeDiagramEdge))),3)

    def test_worked_examples_use_the_intended_values(self):
        tables = [b for b in self.scene(15)['blocks'] if b['kind'] == 'table']
        self.assertEqual([t['caption'] for t in tables],
                         ['Method A · mean recovery 94%', 'Method B · mean recovery 98%', 'Method C · mean recovery 93%'])
        for label, group, t in zip('ABC', (94,98,93), tables, strict=True):
            values = EXPECTED['R-' + label]
            self.assertEqual(len(t['rows']), 7)
            self.assertEqual(sum((x-group)**2 for x in values), 10)
            resource = 'l7-next-15-table-row-7-cell-3' if label == 'A' else f'l7-teaching-15-table-{label.lower()}-r7-c3'
            self.assertEqual(str(self.g.value(EX[resource], CD.body)), 'Sum: 10 pp²')
        for n, phrase in (('17-calc','0.00004484'),('26-adjusted','0.000532'),('40-example','0.064'),
                          ('41-example','0.133')):
            self.assertIn(phrase, self.scene(n)['narration'])

    def test_slide_references_and_static_links(self):
        from static_course_fallback import static_fallback

        for scene in self.doc['scenes']:
            reference, = [b for b in scene['blocks'] if b.get('mediaType') == 'text/html']
            self.assertEqual(scene['readingOrder'][-1], reference['id'])
            self.assertTrue(reference['uri'].startswith('https://'))
            self.assertTrue(reference['alternativeText'])
        expected = {
            '26-adjusted': 'https://itl.nist.gov/div898/handbook/prc/section4/prc471.htm',
            '40-example': 'https://stat.ethz.ch/R-manual/R-devel/library/stats/html/oneway.test.html',
            22: 'https://doi.org/10.3389/fpsyg.2013.00863',
        }
        for number, uri in expected.items():
            with self.subTest(scene=number):
                markup = static_fallback({'sceneDocuments': [{**self.doc, 'scenes': [self.scene(number)]}]})
                self.assertIn(f'<footer class="scene-references"><a class="reference-link" href="{uri}"', markup)

    def test_existing_documents_exactly_unchanged(self):
        for path, graph in [('path-chemometrics-level7-anova-lecture','paths/chemometrics-level7-anova-lecture'),('path-level6-statistical-tests','paths/level6-statistical-tests')]:
            ref = CoursePathReference(str(EX[path]),GB+graph)
            self.assertEqual(compile_scene_document(self.before,ref),compile_scene_document(self.ds,ref))

if __name__ == '__main__':
    unittest.main()
