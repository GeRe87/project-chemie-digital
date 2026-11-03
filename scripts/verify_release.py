"""Verify a local release candidate; never deploy, publish or invoke Actions."""
from __future__ import annotations

import argparse
import functools
import http.server
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import threading
import time

ROOT = Path(__file__).resolve().parents[1]
OFFERING = "https://w3id.org/project-chemie-digital/resource/teaching-offering-chemometrics-applied-statistics"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        pass


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
    npm = shutil.which("npm")
    if not npm:
        parser.error("npm is unavailable; install the documented toolchain")
    browsers = list(dict.fromkeys(args.browser or [os.environ.get("PLAYWRIGHT_BROWSER", "chromium")]))
    if len(browsers) > 1 and os.environ.get("PLAYWRIGHT_EXECUTABLE_PATH"):
        parser.error("An explicit browser executable can verify only one engine per run")
    report = {
        "revision": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "worktreeBefore": subprocess.check_output(["git", "status", "--short"], cwd=ROOT, text=True).splitlines(),
        "offlineVendor": args.offline, "browsers": browsers, "stages": [], "ok": False,
        "externalAcceptance": "Requires agent-validator/project-chemie-digital success on the exact PR head; this local report does not replace it.",
    }
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
        return 0
    except (OSError, RuntimeError, KeyboardInterrupt) as error:
        report["failure"] = str(error) or "Verification interrupted"
        print(report["failure"], file=sys.stderr)
        return 1
    finally:
        if server:
            server.shutdown()
            server.server_close()
        report["worktreeAfter"] = subprocess.check_output(["git", "status", "--short"], cwd=ROOT, text=True).splitlines()
        (reports / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(f"Verification evidence: {reports.relative_to(ROOT)}/report.json", flush=True)


if __name__ == "__main__":
    raise SystemExit(main())
