"""TriG-authored analytical lecture, worked models and reproducible live case."""
import math
import statistics
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from rdflib import RDF
from rdflib.namespace import DCTERMS, SKOS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE

ROOT = Path(__file__).resolve().parents[1]


class AnalyticalLectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = rdf_dataset.assemble_dataset()
        cls.union = validate_semantics.dataset_union(cls.dataset)
        cls.document = runtime.compile_scene_document(cls.dataset, runtime.CoursePathReference(str(EX['path-level5-analytical-distributions']), BASE+'paths/level5-analytical-distributions'))
        cls.scenes = {s['id']: s for s in cls.document['scenes']}

    def scene(self, name):
        return self.scenes[f'ex:{name}--scene']

    def test_general_functions_precede_five_families_tests_map_and_live_case(self):
        ids = [s['id'] for s in self.document['scenes']]
        self.assertEqual(41, len(ids))
        names = ['al-functions','al-density','al-area-example','al-cumulative','al-quantile','al-normal-story','al-normal-process','al-normal-model','al-control-story','al-normal-probability','al-normal-inverse','al-standardization','al-log-story','al-chi-story','al-t-story','al-f-story','al-test-story','al-map','mc-story','mc-live','mc-result','mc-scope']
        indices = [ids.index(f'ex:{name}--scene') for name in names]
        self.assertEqual(sorted(indices), indices)
        self.assertTrue(all(s['topic']['label'] and s['narration'] for s in self.document['scenes']))
        for scene in self.document['scenes']:
            self.assertNotIn('—', scene['narration'])
            self.assertNotIn('?', scene['narration'])
        command = json.loads((ROOT/'package.json').read_text(encoding='utf-8'))['scripts']['preview:level5:generate']
        self.assertIn('path-level5-multiplicative-story', command)

    def test_story_model_worked_calculation_pattern_and_no_forced_counting_prelude(self):
        for family in ('normal','log','chi','t','f'):
            story = self.scene(f'al-{family}-story')
            self.assertFalse(any(b['kind']=='math' for b in story['blocks']))
            self.assertTrue(any(b['kind']=='math' for b in self.scene(f'al-{family}-model')['blocks']))
            name = 'al-normal-probability' if family=='normal' else f'al-{family}-example'
            self.assertTrue(any(b['kind']=='math' for b in self.scene(name)['blocks']))
        self.assertFalse(any('binaryExperiment' in b for s in self.document['scenes'] for b in s['blocks']))

    def test_all_displayed_formulas_keep_complete_same_scene_authored_legends(self):
        for scene in self.document['scenes']:
            for block in scene['blocks']:
                if block['kind']!='math': continue
                resource = EX[block['source'][0]['resourceId'].removeprefix('ex:')]
                symbols = set(self.union.objects(resource, CD.hasSymbol))
                legends = list(self.union.objects(resource, DCTERMS.hasPart))
                self.assertTrue(legends, resource)
                covered = {symbol for legend in legends for entry in self.union.objects(legend, CD.hasDefinitionListEntry) for symbol in self.union.objects(entry, DCTERMS.references)}
                self.assertTrue(symbols <= covered, resource)
                self.assertTrue(any(b['kind']=='definition-list' and b.get('entries') for b in scene['blocks']), scene['id'])

    def test_pdf_cdf_inverse_and_distribution_examples_have_independent_arithmetic(self):
        nd = statistics.NormalDist(10, .30)
        self.assertAlmostEqual(.06680720127, 1-nd.cdf(10.45), places=10)
        self.assertAlmostEqual(10.4934560881, nd.inv_cdf(.95), places=9)
        self.assertEqual(.50,(.75-.25)*1)
        self.assertAlmostEqual(2.650, math.exp(.69315+.75**2/2), places=2)
        self.assertAlmostEqual(.035896, .4/11.1432867819, places=6)
        self.assertAlmostEqual(.825732, .4/.4844185571, places=5)
        self.assertAlmostEqual(4, .4**2/.2**2)
        # Analytic chi-square CDF for df=4 independently checks inverse values.
        for x,p in ((.4844185571,.025),(11.1432867819,.975)):
            self.assertAlmostEqual(p,1-math.exp(-x/2)*(1+x/2),places=9)
        # F(5,5) CDF from a numerical beta integral (midpoints, no SciPy).
        threshold = 5.0503290576
        z = threshold/(1+threshold)
        n = 20000
        beta = math.gamma(2.5)**2/math.gamma(5)
        probability = math.fsum(((i+.5)*z/n)**1.5*(1-(i+.5)*z/n)**1.5 for i in range(n))*z/n/beta
        self.assertAlmostEqual(.95, probability, places=7)

    def test_saved_monte_carlo_output_replays_authored_r_protocol(self):
        code = str(next(self.union.objects(EX['mc-code'], CD.code)))
        for fragment in ('M <- 10000','state <- 20261101','16807 * state','2147483647','qnorm(u[, 1])','byrow = TRUE','type = 7'):
            self.assertIn(fragment, code)
        state = 20261101
        outputs = []
        nd = statistics.NormalDist()
        first = None
        for _ in range(10000):
            u = []
            for _ in range(3):
                state = state*16807 % 2147483647
                u.append(state/2147483647)
            a, vp, vf = .200+.003*nd.inv_cdf(u[0]), 9.98+.04*u[1], 99.92+.16*u[2]
            c = (a-.010)/.095*vf/vp
            if first is None: first = c
            outputs.append(c)
        self.assertAlmostEqual(20.07153641990245, first, places=11)
        self.assertAlmostEqual(19.9986223648564, statistics.mean(outputs), places=11)
        self.assertAlmostEqual(.31674478361247, statistics.stdev(outputs), places=11)
        ordered = sorted(outputs)
        def q(p):
            i = 9999*p
            k = int(i)
            return ordered[k]+(i-k)*(ordered[k+1]-ordered[k])
        self.assertAlmostEqual(19.37110491120053, q(.025), places=11)
        self.assertAlmostEqual(20.62749774955301, q(.975), places=11)
        def rdf_list(head):
            result=[]
            while head!=RDF.nil:
                result.append(next(self.union.objects(head,RDF.first)))
                head=next(self.union.objects(head,RDF.rest))
            return result
        edges=[float(v) for v in rdf_list(EX['mc-edge0'])]
        counts=[int(v) for v in rdf_list(EX['mc-count0'])]
        self.assertEqual(25,len(edges))
        self.assertEqual(10000,sum(counts))
        self.assertTrue(all(edges[0]<=v<edges[-1] for v in outputs))
        actual=[0]*24
        for v in outputs: actual[int((v-18.5)/.125)]+=1
        self.assertEqual(counts, actual)
        self.assertIn('not automatically', self.scene('mc-scope')['narration'])

    def test_svg_sketches_are_local_accessible_and_have_self_contained_dark_contrast(self):
        ns={'svg':'http://www.w3.org/2000/svg'}
        for name in ('al-functions','al-map','mc-story','al-normal-process'):
            media=next(b for b in self.scene(name)['blocks'] if b['kind']=='media-reference')
            self.assertTrue(media['alternativeText'])
            path=ROOT/'apps/pitch/public'/media['uri'].lstrip('/')
            root=ET.parse(path).getroot()
            self.assertIsNotNone(root.find('svg:title',ns))
            self.assertIsNotNone(root.find('svg:desc',ns))
            self.assertIn('prefers-color-scheme:dark',path.read_text(encoding='utf-8'))
            self.assertFalse(root.findall('.//svg:script',ns))

    def test_relationship_map_has_canonical_graph_edges_not_only_svg_labels(self):
        edges = list(self.union.objects(EX['al-distribution-relations'],CD.hasDiagramEdge))
        self.assertEqual(5,len(edges))
        self.assertIn(EX['al-distribution-relations'],self.union.objects(EX['al-map-media'],DCTERMS.references))
        labels = ' '.join(str(v) for edge in edges for v in self.union.objects(edge, SKOS.prefLabel))
        for phrase in ('independent','degrees of freedom','natural log','numerator and denominator order'):
            self.assertIn(phrase,labels)

    def test_uniform_foundations_use_one_model_and_explicit_axis_roles(self):
        foundation_names=('al-density','al-area-example','al-cumulative','al-quantile')
        charts=[next(b for b in self.scene(name)['blocks'] if b['kind']=='chart') for name in foundation_names]
        self.assertTrue(all('uniform' in b['source'][0]['resourceId'] for b in charts))
        for name in foundation_names:
            text=json.dumps(self.scene(name))
            self.assertNotIn('triang',text.lower())
            self.assertNotIn('mg/L',text)
        def axis(chart,predicate):return str(next(self.union.objects(EX[chart],predicate)))
        self.assertEqual('Value x',axis('al-uniform-pdf-chart',CD.xAxisLabel))
        self.assertIn('Density',axis('al-uniform-pdf-chart',CD.yAxisLabel))
        self.assertIn('probability',axis('al-uniform-cdf-chart',CD.yAxisLabel))
        self.assertEqual('Input probability u',axis('al-uniform-inverse-chart',CD.xAxisLabel))
        self.assertEqual('Output quantile value Q(u)',axis('al-uniform-inverse-chart',CD.yAxisLabel))
        def points(resource):
            observations=list(self.union.objects(EX[resource],CD.hasObservation))
            observations.sort(key=lambda r:int(next(self.union.objects(r,CD.position))))
            return [(float(next(self.union.objects(r,CD.xValue))),float(next(self.union.objects(r,CD.numericValue)))) for r in observations]
        pdf=points('al-uniform-pdf-data')
        self.assertAlmostEqual(1,math.fsum((x1-x0)*y0 for (x0,y0),(x1,y1) in zip(pdf,pdf[1:])))
        for x,y in points('al-uniform-cdf-data'):
            self.assertEqual(min(1,max(0,x)),y)
        self.assertIn((.75,.75),points('al-uniform-inverse-data'))

    def test_usecase_cards_are_illustrated_bullets_and_normal_tools_are_introduced_first(self):
        for name in ('al-opening','al-normal-story','al-control-story','al-log-story','al-chi-story','al-t-story','al-f-story','al-test-story','mc-assumptions'):
            cards=next(b for b in self.scene(name)['blocks'] if b['kind']=='definition-list')
            self.assertEqual(3,len(cards['entries']))
            for entry in cards['entries']:
                self.assertTrue(entry['visualMotif'])
                self.assertEqual('highlight',entry['visualMotifRole'])
                self.assertTrue(entry['description'].startswith('- '))
                self.assertIn('\n\n- ',entry['description'])
        self.assertNotIn('ex:al-normal-density-example--scene',self.scenes)
        model=next(b for b in self.scene('al-normal-model')['blocks'] if b['kind']=='math')
        self.assertIn(r'X\sim\mathcal N(\mu,\sigma^2)',model['expression'])
        ids=list(self.scenes)
        self.assertLess(ids.index('ex:al-normal-inverse--scene'),ids.index('ex:al-standardization--scene'))
        self.assertLess(ids.index('ex:al-standardization--scene'),ids.index('ex:al-log-story--scene'))
        for name in ('al-normal-probability','al-normal-inverse'):
            formula=next(b for b in self.scene(name)['blocks'] if b['kind']=='math')
            self.assertNotIn('Z',formula['expression'])
            self.assertNotIn(r'\Phi',formula['expression'])
        self.assertIn('upper flag',self.scene('al-normal-probability')['narration'])
        svg=ET.parse(ROOT/'apps/pitch/public/chemometrics/level5-pdf-cdf.svg').getroot()
        labels=[e.text for e in svg.findall('.//{http://www.w3.org/2000/svg}text')]
        for removed in ('Concentration','Height is not probability','Probability at or below','Not the reciprocal CDF'):
            self.assertNotIn(removed,labels)
        for expected in ('Density f(x)','Probability F(x)','Value Q(u)','Probability u'):
            self.assertIn(expected,labels)

    def test_static_alternative_keeps_equations_live_code_assumptions_and_saved_results(self):
        html=runtime.static_fallback({'sceneDocuments':[self.document]})
        for phrase in ('Inverse CDF','16807','19.371','20.627','Calibration'):
            self.assertIn(phrase,html)
        self.assertEqual(1,sum(b['kind']=='code' for s in self.document['scenes'] for b in s['blocks']))
        self.assertEqual(70,len(runtime.compile_scene_document(self.dataset,runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening'))['scenes']))
