"""Only verified Talks output can enter isolated local publication staging."""
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import prepare_talks_publication as publication


class TalksPublicationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.output = self.root / "dist/talks"
        self.output.mkdir(parents=True)
        self.marker = self.output / publication.MARKER
        self.marker.write_text("fixture", encoding="utf-8")
        (self.output / "course-runtime.json").write_text(json.dumps({"presentationCollection": {"id": publication.TALKS}, "teachingOfferingDocuments": []}), encoding="utf-8")
        self.receipt = {"success": True, "fullSuite": True, "sourceStable": True, "dirtyAtStart": False,
                        "buildRequested": True, "sourceSha": "abc", "buildManifestSha256": hashlib.sha256(self.marker.read_bytes()).hexdigest(),
                        "steps": [{"name": n, "exitCode": 0} for n in ("full-suite", "build-talks", "verify-talks-build")]}
        self.receipt_file = self.root / "dist/talks-checks/checks.json"
        self.receipt_file.parent.mkdir()
        self.write_receipt()
        self.artifact = {"offeringId": publication.TALKS, "base": "/", "datasetFingerprint": "fingerprint"}

    def write_receipt(self):
        self.receipt_file.write_text(json.dumps(self.receipt), encoding="utf-8")

    def validate(self, head="abc", dirty=""):
        with patch.object(publication, "ROOT", self.root), \
             patch.object(publication.subprocess, "check_output", side_effect=[head, dirty]), \
             patch.object(publication, "verify_existing", return_value=self.artifact):
            return publication.validate_release()

    def test_only_expected_talks_branch_is_reported_and_no_git_writes_occur(self):
        evidence = self.validate()
        self.assertEqual(evidence["destinationBranch"], "gh-pages-talks")
        self.assertFalse((self.root / "dist/talks-publication").exists())

    def test_fast_dirty_failed_or_incomplete_receipts_are_rejected(self):
        for field, value in [("fullSuite", False), ("dirtyAtStart", True), ("sourceStable", False), ("success", False), ("steps", [])]:
            with self.subTest(field=field):
                previous = self.receipt[field]
                self.receipt[field] = value
                self.write_receipt()
                with self.assertRaises(ValueError): self.validate()
                self.receipt[field] = previous

    def test_stale_source_and_changed_output_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "different source"): self.validate(head="def")
        with self.assertRaisesRegex(ValueError, "Source changed"): self.validate(dirty=" M source")
        self.marker.write_text("changed", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "manifest"): self.validate()

    def test_course_output_and_hosting_configuration_are_rejected(self):
        self.artifact["offeringId"] = "a-course"
        with self.assertRaisesRegex(ValueError, "Only.*Talks"): self.validate()
        self.artifact["offeringId"] = publication.TALKS
        (self.output / "CNAME").write_text("do-not-touch.example", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Hosting configuration"): self.validate()

    def test_dry_run_never_writes_and_staging_never_overwrites_existing_files(self):
        with patch.object(publication, "ROOT", self.root), patch.object(publication, "validate_release", return_value={"destinationBranch": "gh-pages-talks"}):
            self.assertIsNone(publication.prepare())
            target = publication.prepare(True)
            self.assertTrue((target / "course-runtime.json").is_file())
            with self.assertRaisesRegex(ValueError, "already exists"): publication.prepare(True)
