"""Nitrate continuity follows the investigation target, not next-result prediction."""
import re
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, EX, BASE


class StoryContinuityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        dataset=rdf_dataset.assemble_dataset()
        ref=runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening')
        cls.document=runtime.compile_scene_document(dataset,ref)
        cls.scenes={scene['id']:scene for scene in cls.document['scenes']}

    def scene(self,name):
        return self.scenes[f'ex:l5-{name}-scene--scene']

    def test_reviewed_text_uses_measured_values_and_measurement_results(self):
        def text_values(value):
            if isinstance(value,dict):
                for key,item in value.items():
                    if key not in ('source','id','readingOrder'):yield from text_values(item)
            elif isinstance(value,list):
                for item in value:yield from text_values(item)
            elif isinstance(value,str):yield value
        reviewed=[s for s in self.document['scenes'] if re.search(r'l5-(n09|n10|n11|l12)',s['id'])]
        self.assertEqual(17,len(reviewed))
        for scene in reviewed:
            for text in text_values({'blocks':scene['blocks'],'narration':scene['narration']}):
                self.assertNotRegex(text,r'(?i)\breadings?\b')

    def test_visible_headings_explain_progression_not_just_distribution_names(self):
        for name,link in (
            ('n09-story2','water body'),('n09a','analytical part'),
            ('n09b','centre and spread'),('n09c','analytical variation'),
            ('n10a','Tool:'),('n10b','not a mean estimate'),
            ('n10c','water-body mean'),('n11a','Between-sample variation'),
            ('n11b','First compare'),('n11c','Then compare'),
            ('n11d','Different variation'),('l12-story','Across sites'),
            ('l12a','water samples'),('l12b','investigation target'),
            ('l12c','mean concentration'),('l12d','support the estimate')):
            self.assertIn(link,self.scene(name)['blocks'][0]['text'])

    def test_visible_text_identifies_model_and_dataset_switches(self):
        cards=self.scene('n09-story2')['blocks'][1]['entries']
        self.assertEqual(['Target: the water body','Sampling: select water units','Analysis: measure each sample'],[card['term'] for card in cards])
        self.assertIn('do not make one sample representative',cards[-1]['description'])
        self.assertIn('Not fitted to the five values',self.scene('n09a')['blocks'][1]['description'])
        self.assertIn('not extra observations',self.scene('n11b')['blocks'][1]['text'])
        self.assertIn('Second setting',self.scene('n11c')['blocks'][1]['text'])
        self.assertIn('20 new constructed values',self.scene('l12a')['blocks'][1]['text'])

    def test_narration_closes_one_task_before_opening_the_next(self):
        self.assertIn('not estimates of the unknown water-body mean',self.scene('n09c')['narration'])
        self.assertIn('read backwards',self.scene('n10a')['narration'])
        self.assertIn('not an estimate or interval for that environmental mean',self.scene('n10c')['narration'])
        self.assertIn('cannot supply the missing environmental sampling variation',self.scene('n10c')['narration'])
        self.assertIn('Keep these same twenty values for the next step',self.scene('l12a')['narration'])

    def test_no_extra_slides_or_disclosure_steps_are_added(self):
        self.assertEqual(70,len(self.document['scenes']))
        for name in ('n09-story1','n09-story2','n09a','n09b','n09c','n10a','n10b','n10c','n11a','n11b','n11c','n11d','l12-story','l12a','l12b','l12c','l12d'):
            for block in self.scene(name)['blocks']:
                self.assertNotEqual('progressive',block.get('disclosure',{}).get('mode'))
