"""Normal-review pilot: independently replay all published prefix histograms."""
import bisect
import statistics
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, validate


class ReviewNormalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.union=validate_semantics.dataset_union(cls.dataset)
        cls.document=runtime.compile_scene_document(cls.dataset,runtime.CoursePathReference(
            str(EX['path-level5-review-normal']),BASE+'paths/level5-review-normal'))

    def test_nine_slides_including_title_with_original_opening_reused(self):
        self.assertEqual([f'ex:rv-n{i:02}--scene' for i in range(2,10)],[s['id'] for s in self.document['scenes']])
        self.assertIn('separate', self.document['scenes'][5]['narration'])

    def test_every_published_count_replays_the_same_seeded_normal_prefix(self):
        chart=next(b for b in self.document['scenes'][6]['blocks'] if b['kind']=='chart')
        self.assertEqual([],chart['data'])
        self.assertNotIn('curves',chart)
        self.assertNotIn('binAdjustment',chart)
        self.assertEqual(4,len(chart['states']))
        state=20261102; values=[]; nd=statistics.NormalDist()
        for _ in range(1000):
            state=16807*state%2147483647
            values.append(10+.1*nd.inv_cdf(state/2147483647))
        for n,snapshot in zip((20,50,100,1000),chart['states']):
            expected=[0]*16
            for value in values[:n]:
                self.assertGreaterEqual(value,chart['edges'][0]);self.assertLess(value,chart['edges'][-1])
                expected[bisect.bisect_right(chart['edges'],value)-1]+=1
            self.assertEqual(expected,snapshot['binCounts'])
            self.assertEqual(n,sum(snapshot['binCounts']))
        self.assertEqual(chart['binCounts'],chart['states'][0]['binCounts'])
        fallback=runtime.static_fallback({'sceneDocuments':[self.document]})
        self.assertIn('First fifty draws',fallback)
        self.assertIn('First thousand draws',fallback)

    def test_assumption_and_provenance_are_visible_not_in_narration_only(self):
        scene=self.document['scenes'][6]
        prose=' '.join(b.get('text','') for b in scene['blocks'])
        self.assertIn('not additional laboratory observations',prose)
        self.assertIn('does not prove',prose)
        self.assertIn('0.10 mg/L',prose)
        self.assertTrue(all(s['source'] for s in next(b for b in scene['blocks'] if b['kind']=='chart')['states']))
        code=next(b for b in scene['blocks'] if b['kind']=='code')
        self.assertEqual('optional',code['disclosure']['mode'])
        self.assertIn('20261102',code['code'])
        self.assertIn('hist(x,breaks=edges,right=FALSE',code['code'])

    def test_targeted_histogram_state_shapes_pass(self):
        conforms,_,report=validate(self.union,shacl_graph=self.dataset.graph(BASE+'shapes/histogram-states'),inference='none')
        self.assertTrue(conforms,report)


if __name__=='__main__':unittest.main()
