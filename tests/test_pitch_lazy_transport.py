"""Focused checks of disposable transports after course generation."""
import json
import unittest
import importlib.util
import tempfile
import shutil
from unittest.mock import patch
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class PitchLazyTransportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        (ROOT/'.local').mkdir(exist_ok=True)
        cls.temporary=tempfile.TemporaryDirectory(prefix='lazy-transports-',dir=ROOT/'.local')
        temporary=Path(cls.temporary.name)
        cls.shell=temporary/'apps/pitch/index.html';cls.shell.parent.mkdir(parents=True)
        shutil.copyfile(ROOT/'apps/pitch/index.html',cls.shell)
        spec=importlib.util.spec_from_file_location('lazy_course_fixture',ROOT/'apps/pitch/scripts/generate-course-runtime.py')
        generator=importlib.util.module_from_spec(spec);spec.loader.exec_module(generator)
        with patch.object(generator,'ROOT',temporary),patch.object(generator,'OUTPUT',temporary/'apps/pitch/src/generated/canonical-runtime.json'),patch.object(generator.RUNTIME,'PITCH_INDEX',cls.shell):
            cls.full=generator.generate_course(generator.CHEMOMETRICS_OFFERING)
        cls.public=temporary/'apps/pitch/public/course-runtime'
        cls.manifest=json.loads((cls.public/'manifest.json').read_text(encoding='utf-8'))

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def test_world_manifest_has_no_scene_bodies_or_dataset_snapshot(self):
        self.assertNotIn('datasetSnapshot',self.manifest)
        for entry in self.manifest['documents']:
            self.assertNotIn('scenes',entry)
            self.assertNotIn('blocks',entry)
            self.assertTrue(entry['runtime'].startswith('course-runtime/'))
            self.assertNotIn('..',entry['runtime'])

    def test_each_selected_transport_contains_exactly_its_canonical_document(self):
        for entry in self.manifest['documents']:
            payload=json.loads((self.public/Path(entry['runtime']).name).read_text(encoding='utf-8'))
            self.assertEqual(len(payload['sceneDocuments']),1)
            self.assertEqual(payload['sceneDocuments'][0],next(d for d in self.full['sceneDocuments'] if d['id']==entry['id']))
            self.assertEqual([b['sceneDocumentId'] for b in payload['sceneDocumentBindings']],[entry['id']])
            self.assertEqual(payload['datasetFingerprint'],self.full['datasetFingerprint'])

    def test_html_world_does_not_embed_full_static_lectures(self):
        shell=self.shell.read_text(encoding='utf-8')
        self.assertIn('name="pitch-course-world"',shell)
        self.assertEqual(shell.count('name="pitch-course-world"'), 1)
        self.assertNotIn('<article data-pitch-step=',shell)
        self.assertIn('static-course.html',shell)
        self.assertIn('<article data-pitch-step=',(self.public/'static-course.html').read_text(encoding='utf-8'))

if __name__=='__main__':unittest.main()
