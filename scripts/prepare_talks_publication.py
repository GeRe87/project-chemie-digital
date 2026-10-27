"""Fail-closed local staging for gh-pages-talks. Never pushes or configures hosting."""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

from static_course_artifact import MARKER, ROOT, verify_existing

TALKS = "https://w3id.org/project-chemie-digital/resource/talks"
DESTINATION_BRANCH = "gh-pages-talks"


def validate_release() -> dict:
    output = ROOT / "dist/talks"
    receipt = json.loads((ROOT / "dist/talks-checks/checks.json").read_text(encoding="utf-8"))
    if not (receipt.get("success") is True and receipt.get("fullSuite") is True
            and receipt.get("sourceStable") is True and receipt.get("dirtyAtStart") is False
            and receipt.get("buildRequested") is True):
        raise ValueError("A clean exact-head full local release check is required; fast checks do not authorize publication")
    if [step.get("name") for step in receipt.get("steps", [])] != ["full-suite", "build-talks", "verify-talks-build"] or any(step.get("exitCode") != 0 for step in receipt["steps"]):
        raise ValueError("Release receipt is incomplete or contains a failed step")
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    if receipt.get("sourceSha") != head:
        raise ValueError("Release check is for a different source commit")
    dirty = subprocess.check_output(["git", "status", "--porcelain", "--untracked-files=normal", "--", ".", ":(exclude)apps/pitch/index.html"], cwd=ROOT, text=True)
    if dirty.strip():
        raise ValueError("Source changed after the release check")
    marker_hash = hashlib.sha256((output / MARKER).read_bytes()).hexdigest()
    if receipt.get("buildManifestSha256") != marker_hash:
        raise ValueError("Build manifest does not match the checked release")
    artifact = verify_existing(output, ROOT / "apps/pitch/public")
    if artifact.get("offeringId") != TALKS or artifact.get("base") != "/":
        raise ValueError("Only the root-hosted Talks artifact may be staged")
    runtime = json.loads((output / "course-runtime.json").read_text(encoding="utf-8"))
    if runtime.get("presentationCollection", {}).get("id") != TALKS or runtime.get("teachingOfferingDocuments") != []:
        raise ValueError("Publication must contain Talks only, with no course offerings")
    if any((output / name).exists() for name in ("CNAME", ".git", ".github")):
        raise ValueError("Hosting configuration or repository metadata must not enter the publication")
    return {"sourceSha": head, "datasetFingerprint": artifact["datasetFingerprint"],
            "buildManifestSha256": marker_hash, "destinationBranch": DESTINATION_BRANCH}


def prepare(stage: bool = False) -> Path | None:
    evidence = validate_release()
    if not stage:
        print(json.dumps(evidence, indent=2))
        print("Dry run only. Independent/browser acceptance and source integration are still required before remote publication.")
        return None
    destination = ROOT / "dist/talks-publication"
    if destination.exists():
        raise ValueError("Publication staging directory already exists; preserve it and review before removing it manually")
    shutil.copytree(ROOT / "dist/talks", destination)
    (destination / "talks-release.json").write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    print(f"Staged Talks locally at {destination}. No Git refs, remote branches, Pages or DNS settings were changed.")
    return destination


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stage", action="store_true", help="Copy a verified release into a new local dist/talks-publication directory")
    args = parser.parse_args()
    try:
        prepare(args.stage)
        return 0
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError) as error:
        print(f"Talks publication blocked: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
