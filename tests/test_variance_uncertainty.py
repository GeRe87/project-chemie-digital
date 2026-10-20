"""Targeted numerical and semantic contracts for the analytical revision."""
import math
import statistics
import sys
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
from rdflib import Namespace, Literal

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import generate_canonical_runtime as compiler
from course_path_selection import CoursePathReference

CD = Namespace(compiler.CD)
EX = Namespace(compiler.EX)
DCT = Namespace('http://purl.org/dc/terms/')

class VarianceUncertaintyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = compiler.assemble_dataset()
        cls.document = compiler.compile_scene_document(cls.dataset, CoursePathReference(
            str(EX['path-chemometrics-variance-dispersion-lecture']),
            'https://w3id.org/project-chemie-digital/graph/paths/chemometrics-variance-dispersion-lecture'))

    def values(self, name):
        observations = compiler.objects(self.dataset, EX[name], CD.hasObservation)
        return [compiler.decimal_number(self.dataset, o, CD.numericValue) for o in sorted(observations, key=lambda o: compiler.integer(self.dataset, o, CD.position))]

    def test_lake_fifteen_observations_and_all_five_sample_sds(self):
        expected = [[5.02,4.96,5.05],[4.98,5.01,4.95],[5.04,5.00,4.97],[4.99,5.03,5.01],[4.96,5.02,4.98]]
        for site, values in enumerate(expected, 1):
            actual = self.values(f'v40-site{site}')
            self.assertEqual(actual, values)
            self.assertAlmostEqual(statistics.stdev(actual), compiler.decimal_number(self.dataset, EX[f'uq-site-sd{site}'], CD.numericValue), places=14)
            text = compiler.literal(self.dataset, EX[f'uq-site{site}2'], CD.body, 'en')
            self.assertEqual(text, f'{statistics.mean(actual):.4f}')

    def test_qc_unit_conversion_is_physical_not_a_new_sample(self):
        source = self.values('dataset-qc-method-b'); converted = self.values('uq-qc-b-gl')
        self.assertEqual(source, [8.7,10.8,9.5,11.2,9.8])
        for a,b in zip(source, converted): self.assertAlmostEqual(a*.001,b,places=15)
        self.assertEqual(compiler.decimal_number(self.dataset, EX['uq-qc-b-gl'], CD.unitScaleFactor), .001)
        self.assertEqual(compiler.objects(self.dataset, EX['uq-qc-b-gl'], CD.derivedFromResource), [EX['dataset-qc-method-b']])
        for name,value in [('mean', statistics.mean(converted)),('sd',statistics.stdev(converted)),('rsd',100*statistics.stdev(converted)/statistics.mean(converted))]:
            self.assertAlmostEqual(value, compiler.decimal_number(self.dataset, EX['uq-qcb-'+name], CD.numericValue), places=12)
        self.assertAlmostEqual(statistics.stdev(source)/statistics.mean(source), statistics.stdev(converted)/statistics.mean(converted), places=14)

    def test_paired_bessel_correction_uses_existing_simulation_means(self):
        for n in [2,3,5,10,25,50,100]:
            value = compiler.decimal_number(self.dataset, EX[f'vv-mc-o{n}'], CD.numericValue)
            corrected = compiler.decimal_number(self.dataset, EX[f'uq-correct{n}'], CD.numericValue)
            self.assertAlmostEqual(corrected, n/(n-1)*value, places=12)
            self.assertEqual(compiler.objects(self.dataset, EX[f'uq-correct{n}'], CD.derivedFromResource), [EX[f'vv-mc-o{n}']])
        chart,_ = compiler.dot_plot_payload(self.dataset, EX['uq-corrected-chart'], 'en')
        self.assertEqual(len(chart['groups']),7)
        self.assertTrue(chart['referenceLine'])
        self.assertTrue(chart['curves'])

    def test_independent_variance_addition_and_not_sd_addition(self):
        self.assertEqual(sum([4,1,.25]),5.25)
        self.assertNotEqual(math.sqrt(5.25),sum(math.sqrt(x) for x in [4,1,.25]))
        derivation=compiler.mathematical_derivation_payload(self.dataset, EX['uq-components-section'], 'en')
        self.assertEqual(len(derivation['steps']),2)
        self.assertTrue(derivation['steps'][0]['assumptions'])
        self.assertIn('covariance', derivation['steps'][0]['rule']['description'])

    def test_mathematical_symbols_and_optional_labels_come_from_rdf(self):
        entries=[e for s in self.document['scenes'] for b in s['blocks'] for e in (b.get('entries',[]) if b['kind']=='definition-list' else b.get('derivation',{}).get('legend',[])) if e.get('symbol')]
        for entry in entries: self.assertTrue(entry['expression'])
        by_id={e['id']:e for e in entries}
        self.assertEqual(by_id['ex:vr-sigma2-symbol--symbol-entry']['expression'],r'\sigma^2')
        formulas=[b for s in self.document['scenes'] for b in s['blocks'] if b['kind']=='math']
        labelled=[b for b in formulas if b.get('label')]
        self.assertTrue(labelled)
        for formula in labelled:
            resource=EX[formula['source'][0]['resourceId'].split(':',1)[1]]
            self.assertEqual(formula['label'],compiler.literal(self.dataset,resource,CD.formulaLabel,'en'))

    def test_precision_svg_coordinates_match_canonical_schematic_observations(self):
        path = Path(__file__).resolve().parents[1] / 'apps/pitch/public/chemometrics/precision-targets.svg'
        svg = ET.parse(path).getroot()
        nodes = {node.attrib['data-observation']:node for node in svg.iter() if 'data-observation' in node.attrib}
        self.assertEqual(len(nodes),8)
        for group, center in [('a',160),('b',480)]:
            for i in range(1,5):
                name=f'uq-t{group}{i}'; observation=EX[name]
                x=compiler.decimal_number(self.dataset,observation,CD.xValue)
                y=compiler.decimal_number(self.dataset,observation,CD.numericValue)
                if group=='b':
                    self.assertAlmostEqual(float(nodes[name].attrib['cx']),center+100*x)
                    self.assertAlmostEqual(float(nodes[name].attrib['cy']),180-100*y)
                else:
                    self.assertTrue(nodes[name].attrib['d'].startswith(f'M{center+100*x-4:g} {180-100*y-4:g}'))
        self.assertIn('not a validation of trueness', ''.join(svg.itertext()))

    def test_active_order_and_transition_before_mean_shift(self):
        scenes=self.document['scenes'];self.assertEqual(len(scenes),48)
        ids=[s['id'] for s in scenes]
        for earlier,later in [('scene-cv-compare','scene-cv-expect'),('scene-bf-e-rules','scene-cv-algebra'),('scene-cv-expect','scene-cv-helper'),('scene-cv-helper','scene-cv-bias'),('scene-se-return','scene-se-sem'),('scene-se-sem','scene-se-example')]:
            self.assertLess(ids.index('ex:'+earlier+'--scene'),ids.index('ex:'+later+'--scene'))
        worked=next(s for s in scenes if s['id']=='ex:scene-vr19--scene')
        table=next(b for b in worked['blocks'] if b['kind']=='table')
        self.assertEqual(len(table['rows']),6)
        self.assertFalse(any('SD' in c['text'] for r in table['rows'] for c in r['cells']))

if __name__=='__main__':unittest.main()
