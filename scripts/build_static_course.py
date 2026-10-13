"""Build the existing offering-level Pitch application; no host or course menu."""
from __future__ import annotations

import argparse
import importlib.util
import importlib.metadata
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import prepare_interactive_runtime as VENDOR
from static_course_artifact import MARKER, ROOT, inventory, validate_base, validate_files


def output_path(value: str) -> Path:
    candidate = ROOT / value
    if candidate.is_symlink():
        raise ValueError("Symlinked output is not permitted")
    output = candidate.resolve()
    dist = (ROOT / "dist").resolve()
    if not dist.is_relative_to(ROOT) or output == dist or not output.is_relative_to(dist) or output.is_symlink():
        raise ValueError("Output must be a dedicated subdirectory of this worktree's dist/")
    return output


def run(command: list[str], cwd: Path = ROOT):
    subprocess.run(command, cwd=cwd, check=True)


def check_python_dependencies():
    for line in (ROOT / "scripts/requirements-static-build.txt").read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        if ";" in line and sys.version_info >= (3, 12):
            continue
        name, expected = line.split(";", 1)[0].strip().split("==")
        try:
            actual = importlib.metadata.version(name)
        except importlib.metadata.PackageNotFoundError as error:
            raise ValueError(f"Missing production dependency {name}; install scripts/requirements-static-build.txt") from error
        if actual != expected:
            raise ValueError(f"Production dependency mismatch: {name}=={expected} required; install scripts/requirements-static-build.txt in an isolated Python environment")


def build(offering: str, output: Path, base: str, offline: bool = False) -> dict:
    # Never let old successful evidence authorize a failed new attempt.
    if output.exists() and any(output.iterdir()):
        marker = output / MARKER
        if not marker.is_file():
            raise ValueError("Output is not an owned validated build; choose a new dedicated out-dir rather than discard files")
        prior = json.loads(marker.read_text(encoding="utf-8"))
        if prior.get("files") != inventory(output):
            marker.unlink()
            raise ValueError("Output has unfamiliar changes; evidence invalidated, files preserved")
    (output / MARKER).unlink(missing_ok=True)
    validate_base(base)
    if sys.version_info < (3, 11):
        raise ValueError("Python 3.11+ required")
    check_python_dependencies()
    version = tuple(int(part) for part in subprocess.check_output(["node", "-p", "process.versions.node"], text=True).strip().split("."))
    if version < (22, 12, 0):
        raise ValueError("Node.js 22.12+ required for the locked Vite build")
    run([sys.executable, "scripts/validate_semantics.py"])
    if offline:
        errors = VENDOR.check_vendor()
        if errors:
            raise ValueError("; ".join(errors))
    else:
        VENDOR.prepare_vendor()
    run([sys.executable, "scripts/prepare_interactive_runtime.py", "--check"])
    generator_path = ROOT / "apps/pitch/scripts/generate-course-runtime.py"
    spec = importlib.util.spec_from_file_location("offering_generator", generator_path)
    generator = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(generator)
    generator.generate_course(offering)
    output.parent.mkdir(parents=True, exist_ok=True)
    # Only this helper's temporary build is emptied by Vite. Existing Pitch dist
    # and output from other offerings remain untouched.
    with tempfile.TemporaryDirectory(prefix="course-build-", dir=output.parent) as temporary:
        stage = Path(temporary)
        vite = ROOT / "node_modules/vite/bin/vite.js"
        run(["node", str(vite), "build", "--base", base, "--outDir", str(stage), "--emptyOutDir"], ROOT / "apps/pitch")
        shutil.copyfile(generator.OUTPUT, stage / "course-runtime.json")
        evidence = validate_files(stage, offering, base, ROOT / "apps/pitch/public")
        (stage / MARKER).write_text(json.dumps(evidence, indent=2, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
        if output.exists():
            shutil.rmtree(output)
        shutil.copytree(stage, output)
    print(f"Validated static course: {output.relative_to(ROOT)} ({len(evidence['files'])} files); base={base}")
    return evidence


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offering-id", required=True)
    parser.add_argument("--out-dir", default="dist/chemometrics")
    parser.add_argument("--base", default="/")
    parser.add_argument("--offline", action="store_true", help="Require an already prepared, integrity-verified vendor tree; no downloads")
    args = parser.parse_args()
    try:
        build(args.offering_id, output_path(args.out_dir), args.base, args.offline)
        return 0
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError) as error:
        print(f"Static course build failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
