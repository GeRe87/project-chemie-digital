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
INTRO = {URIRef(GB + s) for s in ('knowledge/level7-anova-intro','scenes/level7-anova-intro','paths/level7-anova-intro-review')}
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

    def test_order_and_reuse(self):
        expected = [compact(EX[f'l7-scene{i:02d}'])+'--scene' for i in range(1,14)]
        self.assertEqual([s['id'] for s in self.doc['scenes']], expected)
        for i in (7,13):
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
        for number in (2,6,7,13):
            charts = [b for b in self.doc['scenes'][number-1]['blocks'] if b['kind']=='chart']
            self.assertEqual(len(charts),1)
            chart = charts[0]
            self.assertEqual(chart['yAxis'], {'label':'Recovery','unit':'%'})
            self.assertEqual([g['id'] for g in chart['groups']], [compact(EX['l7-river-group-'+m]) for m in 'ABC'])
            for method, group in zip('ABC',chart['groups']):
                self.assertEqual([d['id'] for d in group['data']], [compact(EX[f'l7-obs-R-{method}-{i:02d}']) for i in range(1,7)])
                self.assertEqual([d['value'] for d in group['data']], EXPECTED['R-'+method])
                self.assertTrue(group['source'])
                self.assertTrue(all(d['source'] for d in group['data']))
                self.assertIn(GB+'data/level7-anova',json.dumps(group['source'])+json.dumps(group['data']))

    def test_scene02_scatter_experiment(self):
        charts = [b for b in self.doc['scenes'][1]['blocks'] if b['kind'] == 'chart']
        self.assertEqual(len(charts), 1)
        experiment = charts[0]
        self.assertEqual(experiment['chartType'], 'experiment')
        self.assertEqual(experiment['experimentKind'], 'anova-one-way')
        self.assertEqual(experiment['xAxis'], {'label': 'SPE method'})
        self.assertEqual(experiment['yAxis'], {'label': 'Recovery', 'unit': '%'})
        self.assertEqual(experiment['differenceUnit'], 'percentage points')
        parameters = experiment['parameters']
        self.assertEqual([p['key'] for p in parameters], ['betweenScale', 'withinScale', 'view'])
        self.assertEqual(len({p['id'] for p in parameters}), 3)
        expected = [
            ('betweenScale', 1, 0, 3, 0.1, False),
            ('withinScale', 1, 0, 3, 0.1, True),
            ('view', 0, 0, 2, 1, False),
        ]
        chart = EX['l7-intro-chart-02']
        self.assertIn((chart, RDF.type, CD.ChartDefinition), self.g)
        self.assertEqual(set(self.g.objects(chart, CD.chartType)), {CD.ScientificExperiment})
        self.assertEqual([str(v) for v in self.g.objects(chart, CD.experimentKind)], ['anova-one-way'])
        self.assertEqual(set(self.g.objects(chart, CD.hasChartGroup)), {
            EX['l7-river-group-A'], EX['l7-river-group-B'], EX['l7-river-group-C']
        })
        owned_parameters = set(self.g.objects(chart, CD.hasExperimentParameter))
        self.assertEqual(owned_parameters, {
            EX['l7-intro-parameter-02-betweenScale'],
            EX['l7-intro-parameter-02-withinScale'],
            EX['l7-intro-parameter-02-view'],
        })
        for position, (parameter, specification) in enumerate(zip(parameters, expected), 1):
            key, value, minimum, maximum, step, adjustable = specification
            rdf_parameter = EX['l7-intro-parameter-02-' + key]
            self.assertEqual(parameter['id'], compact(rdf_parameter))
            self.assertTrue(parameter['label'])
            self.assertEqual(parameter['key'], key)
            self.assertEqual(parameter['value'], value)
            self.assertEqual(parameter['minimum'], minimum)
            self.assertEqual(parameter['maximum'], maximum)
            self.assertEqual(parameter['step'], step)
            self.assertIs(parameter['adjustable'], adjustable)
            self.assertTrue(parameter['source'])
            self.assertIn((rdf_parameter, RDF.type, CD.ExperimentParameter), self.g)
            positions = list(self.g.objects(rdf_parameter, CD.position))
            self.assertEqual(len(positions), 1)
            self.assertEqual(positions[0].datatype, XSD.integer)
            self.assertEqual(int(positions[0]), position)
            self.assertEqual([str(v) for v in self.g.objects(rdf_parameter, CD.parameterKey)], [key])
            for predicate, expected_value in [
                (CD.numericValue, value),
                (CD.parameterMinimum, minimum),
                (CD.parameterMaximum, maximum),
                (CD.parameterStep, step),
            ]:
                literals = list(self.g.objects(rdf_parameter, predicate))
                self.assertEqual(len(literals), 1)
                self.assertEqual(literals[0].datatype, XSD.decimal)
                self.assertEqual(float(literals[0]), expected_value)
            flags = list(self.g.objects(rdf_parameter, CD.adjustableParameter))
            self.assertEqual(len(flags), 1)
            self.assertEqual(flags[0].datatype, XSD.boolean)
            self.assertIs(flags[0].toPython(), adjustable)
            self.assertEqual(set(self.g.objects(rdf_parameter, CD.hasSource)), {
                EX['l7-source-package'], EX['l7-source-nist-anova'], EX['l7-source-scipy-anova']
            })
        self.assertEqual([p['key'] for p in parameters if p['adjustable']], ['withinScale'])
        self.assertIn((EX['l7-intro-chart-06'], RDF.type, CD.ChartDefinition), self.g)
        self.assertEqual(set(self.g.objects(EX['l7-intro-chart-06'], CD.chartType)), {CD.DotPlot})

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
        for number in [1,2,3,4,5,6,8,9,10,11,12]:
            scene = EX[f'l7-scene{number:02d}']
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
        for scene in self.doc['scenes']:
            # Match canonical scenes explicitly rather than reconstructing compact prefixes.
            number = self.doc['scenes'].index(scene)+1
            scene_id = EX[f'l7-scene{number:02d}']
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
                    authored = [str(self.g.value(e,CD.body)) for e in entries]
                    self.assertEqual([e['description'] for e in blocks[0]['entries']],authored)
                    for text in authored:
                        self.assertTrue(text.startswith('- **'))
                        self.assertIn('\n\n',text)
                    self.assertTrue(blocks[0]['source'])
        self.assertEqual(count,10)

    def test_narrations_and_visuals(self):
        for number, scene in enumerate(self.doc['scenes'],1):
            narrations = list(self.g.objects(EX[f'l7-scene{number:02d}'],CD.narration))
            self.assertEqual(len(narrations),1)
            self.assertEqual(narrations[0].language,'en')
            self.assertTrue(80 <= len(str(narrations[0]).split()) <= 180)
            self.assertEqual(scene['narration'],str(narrations[0]))
            self.assertTrue(any(b['kind'] in ('chart','diagram') for b in scene['blocks']))
            if number not in (7,13):
                self.assertNotIn('\u2014',str(narrations[0]))
        for c in INTRO:
            for _,_,o in self.ds.graph(c):
                self.assertNotIn('\u2014',str(o))

    def test_existing_documents_exactly_unchanged(self):
        for path, graph in [('path-chemometrics-level7-anova-lecture','paths/chemometrics-level7-anova-lecture'),('path-level6-statistical-tests','paths/level6-statistical-tests')]:
            ref = CoursePathReference(str(EX[path]),GB+graph)
            self.assertEqual(compile_scene_document(self.before,ref),compile_scene_document(self.ds,ref))

if __name__ == '__main__':
    unittest.main()
