"""Connected CRM/precision lecture: preserved data and correct reference laws."""
import math
import statistics
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE


class ConnectedTFStoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(
            str(EX['path-level5-multiplicative-story-tf']), BASE+'paths/level5-multiplicative-story-tf'))

    def test_path_preserves_prerequisites_and_live_dilution_closing(self):
        ids = [s['id'] for s in self.document['scenes']]
        self.assertEqual(111, len(ids))
        self.assertEqual('ex:ix-outlook--scene', ids[66])
        self.assertEqual('ex:tf-crm-scene--scene', ids[67])
        self.assertEqual('ex:tf-summary-scene--scene', ids[92])
        self.assertNotIn('ex:ic-t-transition--scene', ids)
        self.assertIn('ex:mc-live--scene', ids)
        self.assertEqual('ex:mc-scope--scene', ids[-1])

    def values(self, prefix):
        return [float(next(self.union.objects(EX[f'{prefix}{i}'], CD.body))) for i in range(1, 7)]

    def test_same_A_is_retained_for_F_and_both_sample_summaries_are_exact(self):
        a = self.values('tf-a'); b = self.values('tf-b')
        self.assertEqual([9.95, 10.05, 10.10, 10.10, 10.15, 10.25], a)
        self.assertEqual(a, self.values('tf-pa'))
        self.assertEqual([9.55, 9.85, 10, 10, 10.15, 10.45], b)
        self.assertAlmostEqual(10.1, statistics.mean(a))
        self.assertAlmostEqual(.1, statistics.stdev(a))
        self.assertAlmostEqual(10, statistics.mean(b))
        self.assertAlmostEqual(.3, statistics.stdev(b))
        t = (statistics.mean(a)-10)/(statistics.stdev(a)/math.sqrt(6))
        self.assertAlmostEqual(math.sqrt(6), t)
        self.assertAlmostEqual(9, statistics.variance(b)/statistics.variance(a))

    def test_independent_density_integration_confirms_two_sided_t_probability(self):
        # Numerical quadrature, independent of R's pt/qt implementation.
        nu = 5; upper = math.sqrt(6); steps = 4000; h = upper/steps
        constant = math.gamma(3)/(math.sqrt(nu*math.pi)*math.gamma(2.5))
        density = lambda x: constant*(1+x*x/nu)**(-3)
        area = h/3*(density(0)+density(upper)+sum(
            (4 if i % 2 else 2)*density(i*h) for i in range(1, steps)))
        self.assertAlmostEqual(.05797277355754, 1-2*area, places=10)
        q = 2.570581835636312
        self.assertAlmostEqual(9.995056436010401, 10.1-q*.1/math.sqrt(6))
        self.assertAlmostEqual(10.204943563989598, 10.1+q*.1/math.sqrt(6))

    def test_all_new_displayed_formulas_have_authored_visible_legends(self):
        formulas = [b for s in self.document['scenes'][67:93] for b in s['blocks'] if b['kind'] == 'math']
        self.assertEqual(8, len(formulas))
        for name in ['known','estimated','construction','ci','ratio','f-law','square','cal-law']:
            resource = EX['tf-'+name]
            self.assertEqual([EX['tf-'+name+'-legend']], list(self.union.objects(resource, DCTERMS.hasPart)))
            self.assertTrue(list(self.union.objects(resource, CD.hasSymbol)))
        for scene in self.document['scenes'][67:93]:
            if any(b['kind'] == 'math' for b in scene['blocks']):
                self.assertTrue(any(b['kind'] == 'definition-list' and b.get('emphasis') == 'supporting'
                                    for b in scene['blocks']), scene['id'])

    def test_independence_orientation_and_design_cautions_are_explicit(self):
        body = lambda name: str(next(self.union.objects(EX[name], CD.body)))
        self.assertIn('never automatically', body('tf-ratio-symbol'))
        self.assertIn('Equal group means are not required', body('tf-f-law'))
        self.assertIn('RSS values are dependent', body('tf-cal-law'))
        self.assertIn('Do not double', body('tf-square'))
        self.assertIn('Welch', body('tf-de1'))
        self.assertIn('Brown-Forsythe', body('tf-de2'))
        self.assertIn('95% of intervals', body('tf-ci'))

    def test_review_roadmap_announces_the_complete_package_and_separate_sessions(self):
        entries = list(self.union.objects(EX['ix-map-cards'], CD.hasDefinitionListEntry))
        self.assertEqual(6, len(entries))
        self.assertIn(EX['ix-map-lognormal'], entries)
        self.assertIn(EX['ix-map-checks'], entries)
        checks = str(next(self.union.objects(EX['ix-map-checks'], CD.body)))
        for text in ('Q-Q', 'KS', 'Pearson', 'Monte Carlo', 'not a single 90-minute session'):
            self.assertIn(text, checks)

    def test_saved_monte_carlo_summary_uses_explicit_markdown_format(self):
        scene = next(s for s in self.document['scenes'] if s['id'] == 'ex:mc-result--scene')
        summary = next(b for b in scene['blocks'] if b.get('text', '').startswith('**Default simulation'))
        self.assertEqual('markdown', summary['format'])
        self.assertIn('not automatically a confidence interval', summary['text'])


if __name__ == '__main__':
    unittest.main()
