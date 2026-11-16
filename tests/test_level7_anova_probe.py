"""Bounded canonical ANOVA integration and regression tests."""
import json
import sys
import unittest
from pathlib import Path
from rdflib import Namespace
from rdflib.namespace import RDF, SKOS, DCTERMS as DCT
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from rdf_dataset import assemble_dataset
from generate_canonical_runtime import CoursePathReference, compile_scene_document, compact
CD = Namespace('https://w3id.org/project-chemie-digital/ontology/')
EX = Namespace('https://w3id.org/project-chemie-digital/resource/')
GB = 'https://w3id.org/project-chemie-digital/graph/'
EXPECTED = {'R-A':[92.90,95.33,93.81,92.19,95.92,93.85], 'R-B':[96.79,98.67,98.06,100.03,96.05,98.40], 'R-C':[94.14,92.87,92.09,94.99,91.03,92.88], 'W-A':[90.25,90.74,91.61,92.25,93.28,93.87], 'W-B':[84.18,84.95,85.65,86.32,86.69,88.21], 'W-C':[91.94,92.93,94.11,94.20,94.87,95.95]}
class AnovaProbeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ds = assemble_dataset()
        # Explicit union graph avoids relying on Dataset.default_union settings.
        from rdflib import Graph
        cls.g = Graph()
        for s,p,o,_ in cls.ds.quads((None,None,None,None)):
            cls.g.add((s,p,o))
        cls.document = compile_scene_document(cls.ds, CoursePathReference(
            str(EX['path-chemometrics-level7-anova-lecture']),
            GB + 'paths/chemometrics-level7-anova-lecture'))

    def test_projection(self):
        doc = self.document
        self.assertEqual(doc['version'], '1.15')
        self.assertEqual(doc['sourcePathId'], compact(EX['path-chemometrics-level7-anova-lecture']))
        self.assertEqual([s['id'] for s in doc['scenes']],
                         [compact(EX['l7-scene' + n]) + '--scene' for n in ('07','13','19')])
        for index, scene in enumerate(doc['scenes']):
            charts = [b for b in scene['blocks'] if b['kind'] == 'chart']
            self.assertEqual(len(charts), 1)
            chart = charts[0]
            self.assertEqual(chart['chartType'], 'experiment')
            self.assertEqual(chart['experimentKind'], 'anova-one-way')
            self.assertEqual(chart['yAxis']['unit'], '%')
            self.assertEqual(chart['differenceUnit'], 'percentage points')
            self.assertEqual([g['label'] for g in chart['groups']], ['Method A','Method B','Method C'])
            self.assertEqual(len(chart['groups']), 3)
            for method, group in zip('ABC', chart['groups']):
                self.assertEqual(group['id'], compact(EX['l7-river-group-' + method]))
                self.assertEqual([d['value'] for d in group['data']], EXPECTED['R-' + method])
                self.assertEqual([d['id'] for d in group['data']],
                    [compact(EX[f'l7-obs-R-{method}-{i:02d}']) for i in range(1,7)])
                self.assertTrue(group['source'])
                self.assertTrue(all(d['source'] for d in group['data']))
            controls = {p['key']: p for p in chart['parameters']}
            self.assertEqual(set(controls), {'betweenScale','withinScale','view'})
            for key in ('betweenScale','withinScale','view'):
                p = controls[key]
                self.assertEqual(p['value'], index if key == 'view' else 1)
                self.assertEqual(p['minimum'], 0)
                self.assertEqual(p['maximum'], 2 if key == 'view' else 3)
                self.assertEqual(p['step'], 1 if key == 'view' else 0.1)
                self.assertTrue(p['source'])
            self.assertIn(GB + 'data/level7-anova', json.dumps(chart['groups']))

    def test_raw_identity_and_factors(self):
        g = self.g
        expected_ids = set()
        river_ids = set()
        for cell, values in EXPECTED.items():
            ids = {EX[f'l7-obs-{cell}-{i:02d}'] for i in range(1,7)}
            expected_ids.update(ids)
            if cell.startswith('R'):
                river_ids.update(ids)
            resource = EX['l7-spe-' + cell]
            self.assertEqual(set(g.objects(resource, CD.hasObservation)), ids)
            self.assertEqual(str(g.value(resource, CD.unit)), '%')
            self.assertIn('independent sample preparations', str(g.value(resource, CD.body)))
            matrix = 'river_water' if cell.startswith('R') else 'wastewater'
            self.assertEqual(set(g.objects(resource, DCT.subject)),
                             {EX['l7-' + matrix], EX['l7-method-' + cell[-1]]})
            for i, value in enumerate(values, 1):
                obs = EX[f'l7-obs-{cell}-{i:02d}']
                self.assertIn((obs, RDF.type, CD.Observation), g)
                self.assertEqual(float(g.value(obs, CD.numericValue)), value)
                self.assertEqual(int(g.value(obs, CD.position)), i)
                self.assertEqual(str(g.value(obs, SKOS.prefLabel)), f'{cell}-{i:02d}')
                self.assertIn(EX['l7-source-package'], g.objects(obs, CD.hasSource))
        self.assertEqual(len(expected_ids), 36)
        self.assertEqual(len(river_ids), 18)
        self.assertEqual(set(g.objects(EX['l7-spe-master36'], CD.hasObservation)), expected_ids)
        self.assertEqual(set(g.objects(EX['l7-spe-river18'], CD.hasObservation)), river_ids)
        for level, factor in [('river_water','matrix'),('wastewater','matrix'),
                              ('method-A','method'),('method-B','method'),('method-C','method')]:
            self.assertIn((EX['l7-' + level], SKOS.broader, EX['l7-' + factor]), g)

    def test_new_scene_focus_and_definition(self):
        g = self.g
        concept = EX['l7-one-way-anova']
        definition = EX['l7-one-way-anova-definition']
        self.assertIn((concept, RDF.type, CD.Concept), g)
        self.assertEqual(set(g.objects(concept, CD.hasDefinition)), {definition})
        self.assertIn((definition, RDF.type, CD.Definition), g)
        bodies = list(g.objects(definition, CD.body))
        self.assertEqual(len(bodies), 1)
        self.assertEqual(bodies[0].language, 'en')
        self.assertTrue(str(bodies[0]).strip())
        for number in ('07', '13', '19'):
            self.assertEqual(set(g.objects(EX['l7-scene' + number], CD.focusConcept)), {concept})
        for resource in (concept, definition):
            for source in (EX['l7-source-nist-anova'], EX['l7-source-scipy-anova']):
                self.assertIn((resource, CD.hasSource, source), g)
                self.assertIn((source, CD.supportsResource, resource), g)

    def test_narration_formula_and_sources(self):
        g = self.g
        for n in ('07','13','19'):
            narrations = list(g.objects(EX['l7-scene' + n], CD.narration))
            self.assertEqual(len(narrations), 1)
            text = narrations[0]
            self.assertEqual(text.language, 'en')
            self.assertGreaterEqual(len(str(text).split()), 80)
            self.assertLessEqual(len(str(text).split()), 160)
            self.assertIn('synthetic', str(text))
        formula = EX['l7-formula-f']
        legend = EX['l7-legend-f']
        self.assertIn((formula, DCT.hasPart, legend), g)
        self.assertEqual(set(g.objects(legend, CD.hasDefinitionListEntry)), {EX['l7-legend-f-symbols']})
        self.assertIn('frac', str(g.value(formula, CD.latex)))
        text = str(g.value(EX['l7-legend-f-symbols'], CD.body))
        for required in ('dimensionless','percentage points squared','positive','Normal','variance','equality','division'):
            self.assertIn(required, text)
        scene13 = self.document['scenes'][1]
        formula_blocks = [b for b in scene13['blocks'] if b['id'] == compact(EX['l7-item-13-3']) + '--block']
        self.assertEqual(len(formula_blocks), 1)
        formula_block_id = compact(EX['l7-item-13-3']) + '--block'
        legend_block_id = formula_block_id + '--' + compact(legend)
        self.assertEqual([b['id'] for b in scene13['blocks']], [
            compact(EX['l7-item-13-1']) + '--block',
            compact(EX['l7-item-13-2']) + '--block',
            formula_block_id,
            legend_block_id,
        ])
        self.assertEqual(formula_blocks[0]['kind'], 'math')
        legend_blocks = [b for b in scene13['blocks'] if b['kind'] == 'definition-list']
        self.assertEqual(len(legend_blocks), 1)
        legend_block = legend_blocks[0]
        self.assertEqual(legend_block['id'], legend_block_id)
        self.assertEqual(len(legend_block['entries']), 1)
        entry = legend_block['entries'][0]
        self.assertEqual(entry['term'], 'Every symbol, unit and model condition')
        self.assertEqual(entry['description'], text)
        for required in ('dimensionless', 'percentage points squared', 'positive',
                         'Normal', 'variance', 'equality', 'division'):
            self.assertIn(required, entry['description'])
        legend_source = json.dumps(legend_block['source'])
        for resource in (formula, DCT.hasPart, legend, CD.hasDefinitionListEntry):
            self.assertTrue(
                str(resource) in legend_source or compact(resource) in legend_source,
                f'Missing attached legend provenance: {resource}')
        self.assertEqual(scene13['readingOrder'], [b['id'] for b in scene13['blocks']])
        self.assertEqual(entry['source'][0]['resourceId'], compact(EX['l7-legend-f-symbols']))
        for s,p,o in g.triples((None, CD.hasSource, None)):
            if str(s).startswith(str(EX) + 'l7-'):
                self.assertIn((o, CD.supportsResource, s), g)
        for s,p,o in g.triples((None, CD.supportsResource, None)):
            if str(s).startswith(str(EX) + 'l7-'):
                self.assertIn((o, CD.hasSource, s), g)
        for ref in (EX['l6-df'], EX['l5-f-distribution']):
            self.assertIn((EX['l7-one-way-anova'], DCT.references, ref), g)

    def test_level6_document_is_exactly_unchanged(self):
        excluded = {'chemometrics-level7-anova-data.trig', 'chemometrics-level7-anova-probe.trig'}
        before = assemble_dataset(trig_paths=tuple(p for p in sorted((ROOT / 'ontology/dataset').glob('*.trig')) if p.name not in excluded))
        reference = CoursePathReference(str(EX['path-level6-statistical-tests']), GB + 'paths/level6-statistical-tests')
        self.assertEqual(compile_scene_document(before, reference), compile_scene_document(self.ds, reference))

if __name__ == '__main__':
    unittest.main()
