"""Timed local Talks checks. Full release checks remain separate from fast feedback."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def commands(full: bool, build: bool) -> list[tuple[str, list[str]]]:
    npm = shutil.which("npm") or "npm"
    if full:
        checks = [("full-suite", [npm, "test"])]
    else:
        checks = [("talks-python", [sys.executable, "-m", "unittest", "discover", "-s", "tests", "-p", pattern, "-v"])
                  for pattern in ("test_presentation_collection.py", "test_talks_ted_introduction.py", "test_talks_local_checks.py", "test_talks_publication.py")]
        files = ["apps/pitch/test/talks-world.test.ts", "apps/pitch/test/talks-static-code.test.ts",
                 "packages/core/test/presentation-metadata.test.ts", "packages/renderer-d3/test/line-chart.test.ts"]
        checks += [("talks-typescript", ["node", "--experimental-strip-types", "--test", *files])]
    if build:
        checks += [("build-talks", [npm, "run", "build:talks"]),
                   ("verify-talks-build", [npm, "run", "check:talks-build"])]
    return checks


def run_checks(full: bool, build: bool, output: Path) -> int:
    output.mkdir(parents=True, exist_ok=True)
    evidence = output / "checks.json"
    # A failed/restarted run must never retain an older successful receipt.
    evidence.unlink(missing_ok=True)
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    dirty = subprocess.check_output(["git", "status", "--porcelain", "--untracked-files=normal"], cwd=ROOT, text=True)
    report = {"sourceSha": head, "dirtyAtStart": bool(dirty.strip()), "fullSuite": full,
              "buildRequested": build, "success": False, "steps": []}
    for index, (name, command) in enumerate(commands(full, build)):
        log = output / f"{index + 1:02}-{name}.log"
        print(f"{name}: starting (log: {log})", flush=True)
        start = time.monotonic()
        with log.open("w", encoding="utf-8") as handle:
            try:
                result = subprocess.run(command, cwd=ROOT, stdout=handle, stderr=subprocess.STDOUT,
                                        env={**os.environ, "PYTHONUNBUFFERED": "1"})
                code = result.returncode
            except OSError as error:
                handle.write(f"Infrastructure error: {error}\n")
                code = 2
        elapsed = round(time.monotonic() - start, 3)
        report["steps"].append({"name": name, "command": command, "exitCode": code, "seconds": elapsed, "log": log.name})
        evidence.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(f"{name}: exit={code}, {elapsed}s", flush=True)
        if code:
            return code
    final_head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    source_changes = subprocess.check_output(["git", "status", "--porcelain", "--untracked-files=normal", "--", ".", ":(exclude)apps/pitch/index.html"], cwd=ROOT, text=True)
    report["sourceStable"] = final_head == head and not source_changes.strip()
    if build:
        marker = ROOT / "dist/talks/validated-build.json"
        report["buildManifestSha256"] = hashlib.sha256(marker.read_bytes()).hexdigest()
    report["success"] = not full or (report["sourceStable"] and not report["dirtyAtStart"])
    evidence.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    if not report["success"]:
        print("Release evidence rejected: source was dirty or changed during validation.", flush=True)
        return 1
    print("Talks checks passed. Fast checks alone are not release acceptance.", flush=True)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--full", action="store_true", help="Run the unchanged authoritative npm test instead of focused checks")
    parser.add_argument("--build", action="store_true", help="Build and verify Talks after successful tests; never builds Chemometrics")
    parser.add_argument("--output", type=Path, default=ROOT / "dist/talks-checks")
    args = parser.parse_args()
    return run_checks(args.full, args.build, args.output.resolve())


if __name__ == "__main__":
    raise SystemExit(main())
