"""Fast process-level report freshness checks; no project or browser gates run."""
from __future__ import annotations

from datetime import datetime
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
import unittest

ROOT = Path(__file__).resolve().parents[1]


@unittest.skipUnless(os.name == "posix", "Uses POSIX executables and isolated process groups")
class VerifyReleaseReportTests(unittest.TestCase):
    def setUp(self):
        (ROOT / ".local").mkdir(exist_ok=True)
        temporary = tempfile.TemporaryDirectory(prefix="release-report-test-", dir=ROOT / ".local")
        self.addCleanup(temporary.cleanup)
        self.directory = Path(temporary.name)
        self.bin = self.directory / "bin"
        self.bin.mkdir()
        # The wrapper prepends its interpreter directory to child PATH. Keep
        # that directory under fixture control even when Python and Node are
        # installed together (for example, both in /usr/local/bin).
        self.python = self.bin / "python"
        # A copied venv executable needs its original pyvenv.cfg to find the
        # standard library; link to its base interpreter instead.
        self.python.symlink_to(getattr(sys, "_base_executable", sys.executable))
        reported_python = subprocess.check_output(
            [str(self.python), "-c", "import sys; print(sys.executable)"], text=True, timeout=2,
        ).strip()
        self.assertEqual(Path(reported_python), self.python)
        self.reports = self.directory / "reports"
        self.reports.mkdir()
        self.report_path = self.reports / "report.json"
        self.report_path.write_text(json.dumps({"ok": True, "revision": "old-success", "stages": ["old"]}))
        self.environment = {**os.environ, "PATH": str(self.bin) + os.pathsep + os.environ.get("PATH", ""),
                            "PCD_REPORT_TEST_REPORT": str(self.report_path), "PCD_REPORT_TEST_MODE": "fail"}
        self.environment.pop("PLAYWRIGHT_EXECUTABLE_PATH", None)
        self.executable("node", '''
import json, os, signal, sys
from pathlib import Path
assert sys.argv[1:] == ["scripts/doctor.mjs", "--browser"], sys.argv
report = Path(os.environ["PCD_REPORT_TEST_REPORT"])
(report.parent / "doctor-observed.json").write_text(report.read_text())
print("Fake doctor reached", flush=True)
if os.environ["PCD_REPORT_TEST_MODE"] == "block":
    signal.pause()
sys.exit(7)
''')
        # Even a regression that proceeds past the fake doctor cannot launch the
        # expensive project suite from this focused test.
        self.executable("npm", '''
import sys
sys.exit("Unexpected project gate in report freshness test")
''')

    def executable(self, name, source):
        path = self.bin / name
        path.write_text(f"#!{sys.executable}\n" + source, encoding="utf-8")
        path.chmod(0o755)

    def start_wrapper(self):
        process = subprocess.Popen(
            [str(self.python), str(ROOT / "scripts/verify_release.py"), "--offline", "--browser", "chromium",
             "--report-dir", str(self.reports.relative_to(ROOT)), "--out-dir", "dist/report-freshness-test"],
            cwd=ROOT, env=self.environment, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, start_new_session=True,
        )

        def cleanup():
            # Terminate every fake gate along with the wrapper, even if an
            # assertion fails or a child unexpectedly outlives its parent.
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            process.communicate(timeout=2)

        self.addCleanup(cleanup)
        return process

    def read_report(self):
        return json.loads(self.report_path.read_text())

    def test_failed_doctor_replaces_prior_success_and_records_completion(self):
        process = self.start_wrapper()
        output, _ = process.communicate(timeout=5)
        self.assertEqual(process.returncode, 1, output)
        observed = json.loads((self.reports / "doctor-observed.json").read_text())
        self.assertIs(observed["ok"], False)
        self.assertEqual(observed["status"], "running")
        self.assertIsNone(observed["finishedAt"])
        report = self.read_report()
        self.assertIs(report["ok"], False)
        self.assertEqual(report["status"], "failed")
        self.assertIn("preflight-chromium failed", report["failure"])
        self.assertEqual([(stage["name"], stage["returnCode"]) for stage in report["stages"]],
                         [("preflight-chromium", 7)])
        self.assertEqual(report["revision"], report["revisionAtStart"])
        self.assertRegex(report["revisionAtStart"], r"^[0-9a-f]{40}$")
        self.assertRegex(report["revisionAtEnd"], r"^[0-9a-f]{40}$")
        self.assertLessEqual(datetime.fromisoformat(report["startedAt"]), datetime.fromisoformat(report["finishedAt"]))

    def test_sigterm_leaves_current_incomplete_report_instead_of_old_success(self):
        self.environment["PCD_REPORT_TEST_MODE"] = "block"
        process = self.start_wrapper()
        deadline = time.monotonic() + 5
        while not (self.reports / "doctor-observed.json").exists():
            if process.poll() is not None:
                self.fail(process.communicate(timeout=1)[0])
            if time.monotonic() >= deadline:
                self.fail("Fake doctor did not start within five seconds")
            time.sleep(0.02)
        os.killpg(process.pid, signal.SIGTERM)
        process.communicate(timeout=2)
        self.assertEqual(process.returncode, -signal.SIGTERM)
        report = self.read_report()
        self.assertIs(report["ok"], False)
        self.assertEqual(report["status"], "running")
        self.assertEqual(report["stages"], [])
        self.assertNotEqual(report["revision"], "old-success")
        self.assertIsNone(report["finishedAt"])

    def test_final_git_failure_cannot_hide_failed_run_or_replace_start_revision(self):
        self.executable("git", '''
import os, sys
from pathlib import Path
report = Path(os.environ["PCD_REPORT_TEST_REPORT"])
if sys.argv[1:] == ["rev-parse", "HEAD"]:
    observed = report.parent / "git-observed.json"
    if not observed.exists():
        observed.write_text(report.read_text())
        print("a" * 40)
    else:
        print("b" * 40)
elif sys.argv[1:] == ["status", "--short"]:
    seen = report.parent / "git-status-seen"
    if seen.exists():
        sys.exit("Deliberate final metadata failure")
    seen.touch()
else:
    sys.exit("Unexpected git command")
''')
        process = self.start_wrapper()
        output, _ = process.communicate(timeout=5)
        self.assertEqual(process.returncode, 1, output)
        initial = json.loads((self.reports / "git-observed.json").read_text())
        self.assertIs(initial["ok"], False)
        self.assertEqual(initial["status"], "running")
        self.assertIsNone(initial["revisionAtStart"])
        report = self.read_report()
        self.assertIs(report["ok"], False)
        self.assertEqual(report["status"], "failed")
        self.assertIn("preflight-chromium failed", report["failure"])
        self.assertIn("worktreeAfter", report["finalizationErrors"][0])
        self.assertEqual(report["revision"], "a" * 40)
        self.assertEqual(report["revisionAtStart"], "a" * 40)
        self.assertEqual(report["revisionAtEnd"], "b" * 40)
        self.assertIsNone(report["worktreeAfter"])
        self.assertIsNotNone(report["finishedAt"])


if __name__ == "__main__":
    unittest.main()
