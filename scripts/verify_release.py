"""Verify a local release candidate; never deploy, publish or invoke Actions."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import functools
import http.server
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import threading
import time

ROOT = Path(__file__).resolve().parents[1]
OFFERING = "https://w3id.org/project-chemie-digital/resource/teaching-offering-chemometrics-applied-statistics"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        pass


def write_report(path: Path, report: dict) -> None:
    """Replace one complete report without exposing a partially written JSON file."""
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                         prefix=".release-report-", suffix=".tmp", delete=False) as stream:
            temporary = Path(stream.name)
            json.dump(report, stream, indent=2)
            stream.write("\n")
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="Use only an already prepared and integrity-verified R/editor vendor tree")
    parser.add_argument("--browser", action="append", choices=("chromium", "firefox", "webkit"), help="Repeat for multiple installed browser engines; defaults to Chromium")
    parser.add_argument("--out-dir", default="dist/chemometrics", help="Dedicated build output under dist/")
    parser.add_argument("--report-dir", default=".local/release-verification")
    args = parser.parse_args()
    # Reuse the production builder's ownership and path safeguards.
    from build_static_course import output_path
    artifact = output_path(args.out_dir)
    reports = (ROOT / args.report_dir).resolve()
    if not reports.is_relative_to(ROOT / ".local"):
        parser.error("--report-dir must be a dedicated directory under .local/")
    reports.mkdir(parents=True, exist_ok=True)
    browsers = list(dict.fromkeys(args.browser or [os.environ.get("PLAYWRIGHT_BROWSER", "chromium")]))
    report = {
        "revision": None, "revisionAtStart": None, "revisionAtEnd": None,
        "worktreeBefore": None, "worktreeAfter": None,
        "startedAt": utc_timestamp(), "finishedAt": None, "status": "running",
        "offlineVendor": args.offline, "browsers": browsers, "stages": [], "ok": False,
        "externalAcceptance": "Requires agent-validator/project-chemie-digital success on the exact PR head; this local report does not replace it.",
    }
    report_path = reports / "report.json"
    # An interrupted rerun must never leave an earlier successful report beside
    # newly overwritten stage logs. Invalidate it before any external checks.
    write_report(report_path, report)
    environment = os.environ.copy()
    # npm's Python steps must use this same activated, pinned environment.
    environment["PATH"] = str(Path(sys.executable).parent) + os.pathsep + environment.get("PATH", "")

    def run(name: str, command: list[str], extra_env: dict[str, str] | None = None):
        started = time.monotonic()
        log_path = reports / f"{name}.log"
        print(f"\n[{name}] {' '.join(command)}", flush=True)
        with log_path.open("w", encoding="utf-8") as log:
            child = subprocess.Popen(command, cwd=ROOT, env={**environment, **(extra_env or {})},
                                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
            try:
                assert child.stdout is not None
                for line in child.stdout:
                    print(line, end="", flush=True)
                    log.write(line)
                code = child.wait()
            except BaseException:
                child.terminate()
                try:
                    child.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    child.kill()
                    child.wait()
                raise
        report["stages"].append({"name": name, "returnCode": code,
                                  "durationSeconds": round(time.monotonic() - started, 3), "log": log_path.relative_to(ROOT).as_posix()})
        if code:
            raise RuntimeError(f"{name} failed; see {log_path.relative_to(ROOT)}")

    server = None
    try:
        npm = shutil.which("npm")
        if not npm:
            raise RuntimeError("npm is unavailable; install the documented toolchain")
        if len(browsers) > 1 and os.environ.get("PLAYWRIGHT_EXECUTABLE_PATH"):
            raise RuntimeError("An explicit browser executable can verify only one engine per run")
        revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
        report["revision"] = report["revisionAtStart"] = revision
        report["worktreeBefore"] = subprocess.check_output(["git", "status", "--short"], cwd=ROOT, text=True).splitlines()
        write_report(report_path, report)
        for browser in browsers:
            run(f"preflight-{browser}", ["node", "scripts/doctor.mjs", "--browser"], {"PLAYWRIGHT_BROWSER": browser})
        run("project-tests", [npm, "test"])
        command = [sys.executable, "scripts/build_static_course.py", "--offering-id", OFFERING,
                   "--out-dir", str(artifact.relative_to(ROOT))]
        if args.offline:
            command.append("--offline")
        run("static-build", command)
        run("artifact-integrity", [sys.executable, "scripts/static_course_artifact.py", str(artifact)])
        handler = functools.partial(QuietHandler, directory=str(artifact))
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        url = f"http://127.0.0.1:{server.server_port}/"
        for browser in browsers:
            run(f"browser-{browser}", ["node", "scripts/check_release_browser.cjs", url,
                                      str(artifact), str(reports / "browser"), browser])
        report["ok"] = True
    except (OSError, RuntimeError, subprocess.SubprocessError, KeyboardInterrupt) as error:
        report["failure"] = str(error) or "Verification interrupted"
        print(report["failure"], file=sys.stderr)
    finally:
        finalization_errors = []
        if server:
            for action in (server.shutdown, server.server_close):
                try:
                    action()
                except (Exception, KeyboardInterrupt) as error:
                    finalization_errors.append(f"{action.__name__}: {error}")
        for field, command in (("revisionAtEnd", ["git", "rev-parse", "HEAD"]),
                               ("worktreeAfter", ["git", "status", "--short"])):
            try:
                result = subprocess.check_output(command, cwd=ROOT, text=True)
                report[field] = result.splitlines() if field == "worktreeAfter" else result.strip()
            except (Exception, KeyboardInterrupt) as error:
                finalization_errors.append(f"{field}: {error}")
        if finalization_errors:
            report["ok"] = False
            report["finalizationErrors"] = finalization_errors
            report.setdefault("failure", "Verification finalization failed")
        report["finishedAt"] = utc_timestamp()
        report["status"] = "passed" if report["ok"] else "failed"
        write_report(report_path, report)
        print(f"Verification evidence: {reports.relative_to(ROOT)}/report.json", flush=True)
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
