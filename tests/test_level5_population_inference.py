"""Whole-lecture purpose, independent sampling units and honest inference scope."""
import math
import re
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, EX, BASE


def text_values(value):
    if isinstance(value,dict):
        for key,item in value.items():
            if key not in ('id','source','readingOrder'):yield from text_values(item)
    elif isinstance(value,list):
        for item in value:yield from text_values(item)
    elif isinstance(value,str):yield value


class PopulationInferenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        dataset=rdf_dataset.assemble_dataset()
        cls.documents=[runtime.compile_scene_document(dataset,runtime.CoursePathReference(str(EX['path-'+name]),BASE+'paths/'+name)) for name in ('level5-binomial-opening','level5-screening-reserve')]
        cls.scenes={s['id']:s for doc in cls.documents for s in doc['scenes']}

    def scene(self,name):return self.scenes[f'ex:l5-{name}-scene--scene']

    def test_all_76_scenes_keep_topics_and_use_precise_measurement_language(self):
        self.assertEqual([70,6],[len(doc['scenes']) for doc in self.documents])
        for scene in self.scenes.values():
            self.assertTrue(scene['topic']['label'])
            for text in text_values({'blocks':scene['blocks'],'narration':scene['narration']}):
                self.assertNotRegex(text,r'(?i)\breadings?\b')
                self.assertNotIn('—',text)
                self.assertNotIn('?',text)

    def test_target_sampling_and_analysis_are_visible_before_the_normal_model(self):
        cards=self.scene('n09-story2')['blocks'][1]['entries']
        self.assertIn('fixed survey time',cards[0]['description'])
        self.assertIn('selection design',cards[1]['description'])
        self.assertIn('representative',cards[2]['description'])
        self.assertNotIn('Describe the next',self.scene('n09-story2')['blocks'][0]['text'])
        self.assertIn('positive-finding frequency',self.scene('b01')['narration'])

    def test_environmental_estimate_uses_existing_independent_simulation_not_lab_repeats(self):
        script=self.scene('c13a')['narration']
        for phrase in ('volume-weighted mean','fixed survey time','equal-chance','equal-volume','not a validated field design','analytical contribution is negligible'):
            self.assertIn(phrase,script)
        chart=self.scene('c13b')['blocks'][1]
        values=[point['value'] for point in chart['groups'][0]['data']]
        self.assertEqual(4,len(values))
        self.assertAlmostEqual(5.181410018887113,math.fsum(values)/4,places=13)
        self.assertTrue(all('l5-c13-v' in point['id'] for point in chart['groups'][0]['data']))
        self.assertIn('not laboratory repeats',self.scene('c13b')['narration'])
        self.assertIn('does not require five thousand real surveys',self.scene('c13c')['narration'])

    def test_analytical_se_and_interval_explicitly_exclude_environmental_sampling(self):
        self.assertIn('not the environmental SE',self.scene('s15c')['narration'])
        scene=self.scene('t16g')
        self.assertIn('not a confidence interval for the water-body mean',scene['narration'])
        self.assertIn('excludes environmental sampling variation',scene['narration'])
        legend=next(b for b in scene['blocks'] if b['kind']=='definition-list')
        self.assertIn('not the water-body mean',' '.join(text_values(legend)))
        lab=self.scene('n09-story1')['blocks'][1]['groups'][0]['data']
        self.assertEqual([9.6,9.8,10.0,10.2,10.4],[p['value'] for p in lab])

    def test_final_report_reconnects_estimate_design_scope_and_honest_uncertainty(self):
        cards=self.scene('e18a')['blocks'][1]['entries']
        self.assertEqual(['Target and scope','Selection model','Simulated estimate: 5.18 mg/L','Model sampling SD: 4.5 mg/L'],[c['term'] for c in cards])
        self.assertEqual(4.5,9/math.sqrt(4))
        script=self.scene('e18a')['narration']
        self.assertIn('No exact t interval is justified',script)
        self.assertIn('not an estimated confidence interval',script)
        self.assertIn('not an interval for the water-body mean',self.scene('e18b')['narration'])

    def test_fit_checks_and_method_comparison_do_not_validate_representativeness(self):
        for name in ('f17-story','g19a'):
            self.assertIn('sampling design' if name=='f17-story' else 'representativeness',self.scene(name)['narration'])
        self.assertIn('representativeness',self.scene('g19d')['blocks'][0]['text'])
        self.assertIn('not water quality',self.scene('p20d')['blocks'][0]['text'])
        self.assertIn('not the water body',self.scene('v03a')['blocks'][0]['text'])
