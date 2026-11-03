"""Experiment-first IC path: prerequisites, construction, constraints and uncertainty."""
import json
import math
import statistics
from rdflib import RDF
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE


class ICExperimentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(
            str(EX['path-level5-ic-experiments']), BASE+'paths/level5-ic-experiments'))
        cls.scenes = {s['id']: s for s in cls.document['scenes']}

    def scene(self, name):
        return self.scenes[f'ex:{name}--scene']

    def test_prerequisites_precede_normal_applications(self):
        ids = list(self.scenes)
        self.assertEqual(74, len(ids))
        for before, after in [('cf-quantile-scene', 'ix-standardization'),
                              ('ix-standardization', 'al-normal-process'),
                              ('al-normal-model', 'al-standardization'),
                              ('al-standardization', 'ix-phi-scene'),
                              ('ix-phi-scene', 'al-normal-probability')]:
            self.assertLess(ids.index(f'ex:{before}--scene'), ids.index(f'ex:{after}--scene'))
        self.assertIn('does not imply normality', json.dumps(self.scene('ix-standardization')))
        phi = str(next(self.union.objects(EX['ix-phi'], CD.latex)))
        for fragment in (r'\varphi(z)', r'\Phi(z)', r'\int_{-\infty}', r'\Phi^{-1}'):
            self.assertIn(fragment, phi)
        self.assertNotIn(r'\\frac', phi)  # No accidentally double-escaped TeX commands.

    def test_six_acts_form_one_ordered_experiment(self):
        names = ['ic-process', 'ic-data', 'ic-deviations', 'ic-spread-scene', 'ic-question',
                 'ix-new-series', 'ix-repeat-live', 'ic-repeated-series',
                 'ix-square-scene', 'ix-sum-scene', 'ix-residual-scene', 'ix-bessel-scene',
                 'ic-reference', 'ic-scale-question', 'ic-squares', 'ic-test',
                 'ix-size-scene', 'ix-size-live', 'ix-outlook']
        self.assertEqual([f'ex:{name}--scene' for name in names], list(self.scenes)[27:46])
        # Keep the construction order; the requested density belongs to the sum scene.
        self.assertNotIn('ex:rev-df-start--scene', self.scenes)
        self.assertNotIn('ex:rev-chi-report--scene', self.scenes)
        for scene in self.document['scenes']:
            for block in scene['blocks']:
                if block['kind'] == 'math':
                    if scene['id']=='ex:ix-sum-scene--scene':
                        self.assertIn(r'\Gamma(k/2)',block['expression'])
                        self.assertIn(r'\Gamma(a)=\int_0^\infty',block['expression'])
                    else:
                        self.assertNotIn(r'\Gamma', json.dumps(block))
        self.assertEqual('ex:mc-scope--scene', list(self.scenes)[-1])

    def test_every_new_displayed_formula_has_covered_visible_legend(self):
        for name in ('ix-standardization', 'ix-phi-scene', 'ix-square-scene',
                     'ix-sum-scene', 'ix-residual-scene', 'ix-bessel-scene', 'ix-size-scene'):
            scene = self.scene(name)
            self.assertTrue(any(b['kind'] == 'definition-list' and b.get('emphasis') == 'supporting'
                                for b in scene['blocks']), name)
            for block in scene['blocks']:
                if block['kind'] != 'math':
                    continue
                resource = EX[block['source'][0]['resourceId'].removeprefix('ex:')]
                symbols = set(self.union.objects(resource, CD.hasSymbol))
                covered = {symbol for legend in self.union.objects(resource, DCTERMS.hasPart)
                           for entry in self.union.objects(legend, CD.hasDefinitionListEntry)
                           for symbol in self.union.objects(entry, DCTERMS.references)}
                self.assertTrue(symbols)
                self.assertLessEqual(symbols, covered)

    def test_constructed_series_and_residual_experiment_are_numerically_consistent(self):
        series = ([9.97,10.04,10.08,9.93,10.02,9.96],
                  [9.86,10.05,10.01,10.12,9.98,9.98],
                  [9.84,10.19,9.93,10.11,9.99,9.94])
        for xs, variance, name in zip(series, [.00316,.00748,.01648], ['a','b','c']):
            self.assertAlmostEqual(10, statistics.mean(xs))
            self.assertAlmostEqual(variance, statistics.variance(xs))
            body = str(next(self.union.objects(EX['ix-series-'+name], CD.body)))
            self.assertIn(f'{variance:.5f}', body)
            for x in xs:
                self.assertIn(f'{x:.2f}', body)
        residuals = [-.10,.10,-.20,.20,-.10]
        self.assertAlmostEqual(.10, -sum(residuals))
        text = json.dumps(self.scene('ix-residual-scene'))
        self.assertIn('10.05', text)
        self.assertIn('bias is possible', text)
        self.assertIn('Normality is not required', json.dumps(self.scene('ix-bessel-scene')))

    def test_optional_r_changes_M_separately_from_n_and_has_static_fallbacks(self):
        code = str(next(self.union.objects(EX['ix-simulation'], CD.code)))
        for text in ('M <- 100; n <- 6', '100, 1000, 10000', 'state <- 20261101',
                     '16807 * state', 'qnorm', 'mean(x)', '(n - 1)', 'hist(S2',
                     'plot(seq_len(M)', 'sqrt(2/(n-1))'):
            self.assertIn(text, code)
        for prop in (CD.editable, CD.executable):
            self.assertTrue(next(self.union.objects(EX['ix-simulation'], prop)).toPython())
        for name in ('ix-repeat-live', 'ix-size-live'):
            scene = self.scene(name)
            self.assertTrue(any(b['kind'] == 'code' for b in scene['blocks']))
            self.assertIn('Optional instructor demonstration', json.dumps(scene))
        self.assertTrue(any(b['kind'] == 'chart' for b in self.scene('ic-repeated-series')['blocks']))
        for n, expected in [(6,.6324555320336759), (30,.2626128657194451)]:
            self.assertAlmostEqual(expected, math.sqrt(2/(n-1)))
        self.assertIn('63.2%', json.dumps(self.scene('ix-size-scene')))
        self.assertIn('26.3%', json.dumps(self.scene('ix-size-scene')))


if __name__ == '__main__':
    unittest.main()
