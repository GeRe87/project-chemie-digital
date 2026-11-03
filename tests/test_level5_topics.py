"""Authored primary subjects give stable slide context without modifying content blocks."""
from rdflib import RDF, SKOS, URIRef
from rdflib.namespace import DCTERMS
from test_level5_binomial_opening import unittest, rdf_dataset, runtime, validate_semantics, EX, CD, BASE, Literal


class Level5TopicTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset=rdf_dataset.assemble_dataset()
        cls.main_ref=runtime.CoursePathReference(str(EX['path-level5-binomial-opening']),BASE+'paths/level5-binomial-opening')
        cls.reserve_ref=runtime.CoursePathReference(str(EX['path-level5-screening-reserve']),BASE+'paths/level5-screening-reserve')
        cls.main=runtime.compile_scene_document(cls.dataset,cls.main_ref)
        cls.reserve=runtime.compile_scene_document(cls.dataset,cls.reserve_ref)

    def test_all_main_and_reserve_scenes_have_short_english_authored_topics(self):
        self.assertEqual((70,6),(len(self.main['scenes']),len(self.reserve['scenes'])))
        for document in (self.main,self.reserve):
            self.assertEqual('1.13',document['version'])
            for scene in document['scenes']:
                topic=scene['topic'];self.assertTrue(topic['label'].strip())
                self.assertLessEqual(len(topic['label']),40)
                self.assertEqual('dct:subject',topic['source'][0]['relationPath'])
                self.assertIn('skos:prefLabel',topic['source'][1]['relationPath'])
                self.assertTrue(all(s['provenanceIds'] for s in topic['source']))

    def test_topics_are_stable_within_blocks_and_change_at_distribution_boundaries(self):
        # Original content order is unchanged; story topics are checked separately.
        scenes=[s for s in self.main['scenes'] if '-story' not in s['id']]
        for first,last,label in ((0,7,'Discrete distributions · Binomial'),(7,11,'Discrete distributions · Poisson'),(11,16,'Distribution functions'),(16,22,'Continuous models · Normal'),(26,30,'Continuous models · Lognormal'),(33,38,'Sampling · Central limit theorem'),(45,48,'Sampling · Student-t'),(49,52,'Sampling · F distribution'),(52,57,'Fit · Kolmogorov–Smirnov'),(57,62,'Fit · Pearson chi-square')):
            self.assertEqual({label},{s['topic']['label'] for s in scenes[first:last]})
        self.assertEqual('Sampling · Chi-square',scenes[42]['topic']['label'])
        self.assertEqual('Sampling · Standard normal',scenes[44]['topic']['label'])
        self.assertEqual('Inference · Confidence intervals',scenes[48]['topic']['label'])

    def test_topic_metadata_does_not_change_blocks_reading_order_or_narration(self):
        dataset=rdf_dataset.assemble_dataset()
        for graph in dataset.graphs():
            for triple in list(graph.triples((None,DCTERMS.subject,None))):graph.remove(triple)
        plain=runtime.compile_scene_document(dataset,self.main_ref)
        for with_topic,without_topic in zip(self.main['scenes'],plain['scenes']):
            self.assertNotIn('topic',without_topic)
            for key in ('id','blocks','readingOrder','narration','accessibility'):
                self.assertEqual(with_topic.get(key),without_topic.get(key))
            self.assertEqual([s['resourceId'] for s in with_topic['source']],[s['resourceId'] for s in without_topic['source']])

    def test_duplicate_untyped_and_unsourced_topics_are_rejected(self):
        for bad in ('duplicate','untyped','unsourced','empty','missing','long'):
            dataset=rdf_dataset.assemble_dataset();graph=dataset.graph(URIRef(BASE+'specifications/level5-topics'))
            topic=EX['l5-topic-binomial']
            if bad=='duplicate':graph.add((EX['l5-b01-scene'],DCTERMS.subject,EX['l5-topic-poisson']))
            if bad=='untyped':graph.remove((topic,RDF.type,SKOS.Concept))
            if bad=='unsourced':graph.remove((topic,CD.authoredResource,None))
            if bad=='empty':
                graph.remove((topic,SKOS.prefLabel,None));graph.add((topic,SKOS.prefLabel,Literal(' ',lang='en')))
            if bad=='missing':graph.remove((topic,SKOS.prefLabel,None))
            if bad=='long':
                graph.remove((topic,SKOS.prefLabel,None));graph.add((topic,SKOS.prefLabel,Literal('x'*81,lang='en')))
            with self.assertRaises(ValueError):runtime.compile_scene_document(dataset,self.main_ref)

    def test_static_alternatives_retain_topic_text_and_provenance(self):
        html=runtime.static_fallback({'sceneDocuments':[self.main]})
        self.assertEqual(70,html.count('class="scene-topic"'))
        self.assertIn('Topic: Fit · Kolmogorov–Smirnov',html)
        self.assertIn('dct:subject',html)
        self.assertIn('graph/specifications/level5-topics',html)

    def test_accepted_paths_do_not_receive_implicit_topic_labels(self):
        reference=runtime.CoursePathReference(str(EX['path-standard-deviation']),BASE+'paths/standard-deviation')
        # Use the exact graph of the existing definition rather than infer a scene-id pattern.
        graphs=[str(g.identifier) for g in self.dataset.graphs() if (EX['path-standard-deviation'],RDF.type,CD.LearningPath) in g]
        self.assertEqual(1,len(graphs))
        document=runtime.compile_scene_document(self.dataset,runtime.CoursePathReference(reference.path_id,graphs[0]))
        self.assertTrue(all('topic' not in s for s in document['scenes']))
