"""Local Talks feedback never substitutes for the full release gate."""
import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("check_talks", ROOT / "scripts/check_talks.py")
checks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checks)


class TalksLocalChecksTests(unittest.TestCase):
    def test_fast_lane_has_only_existing_explicit_test_files(self):
        for name, command in checks.commands(False, False):
            for path in command:
                if path.endswith((".py", ".ts")):
                    self.assertTrue((ROOT / ("tests/" + path if path.startswith("test_") else path)).is_file(), path)
            self.assertNotIn("chemometrics", " ".join(command))
        self.assertNotIn("full-suite", [name for name, _ in checks.commands(False, False)])

    def test_release_runs_unchanged_authoritative_tests_then_only_talks_build(self):
        commands = checks.commands(True, True)
        self.assertEqual([name for name, _ in commands], ["full-suite", "build-talks", "verify-talks-build"])
        self.assertEqual(commands[0][1][1:], ["test"])
        self.assertEqual(commands[1][1][1:], ["run", "build:talks"])
        self.assertEqual(commands[2][1][1:], ["run", "check:talks-build"])

    def test_failure_invalidates_old_success_and_does_not_build(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            (output / "checks.json").write_text('{"success":true}', encoding="utf-8")
            with patch.object(checks.subprocess, "check_output", side_effect=["abc\n", ""]), \
                 patch.object(checks.subprocess, "run", return_value=subprocess.CompletedProcess([], 1)) as run:
                self.assertEqual(checks.run_checks(True, True, output), 1)
                self.assertEqual(run.call_count, 1)
            receipt = json.loads((output / "checks.json").read_text(encoding="utf-8"))
            self.assertFalse(receipt["success"])
            self.assertEqual(receipt["steps"][0]["exitCode"], 1)
            self.assertEqual(receipt["sourceSha"], "abc")

    def test_success_records_timings_and_dirty_source_without_claiming_release(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            with patch.object(checks.subprocess, "check_output", side_effect=["abc\n", " M file\n", "abc\n", " M file\n"]), \
                 patch.object(checks, "commands", return_value=[("fixture", ["node", "fixture"])]), \
                 patch.object(checks.subprocess, "run", return_value=subprocess.CompletedProcess([], 0)):
                self.assertEqual(checks.run_checks(False, False, output), 0)
            receipt = json.loads((output / "checks.json").read_text(encoding="utf-8"))
            self.assertTrue(receipt["success"])
            self.assertTrue(receipt["dirtyAtStart"])
            self.assertFalse(receipt["fullSuite"])
            self.assertGreaterEqual(receipt["steps"][0]["seconds"], 0)
