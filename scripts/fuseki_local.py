#!/usr/bin/env python3
"""Explicit local Apache Jena Fuseki preparation and read-only startup."""
from __future__ import annotations

import argparse
import hashlib
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from rdf_dataset import assemble_dataset, canonical_nquads, dataset_fingerprint  # noqa: E402

FUSEKI_VERSION = "6.2.0"
FUSEKI_ARCHIVE_URL = (
    f"https://archive.apache.org/dist/jena/binaries/apache-jena-fuseki-{FUSEKI_VERSION}.zip"
)
FUSEKI_ARCHIVE_SHA512 = (
    "46e5d798faf80fe5f4b32318750071b9172315f9d86bb3aa3ba4d5e94abe2e21"
    "cd194eab349d491a203c934c6e59b370a671b338f2a413110e859dc628ffe934"
)
CACHE_ROOT = ROOT / ".local" / "fuseki"
ARCHIVE_PATH = CACHE_ROOT / f"apache-jena-fuseki-{FUSEKI_VERSION}.zip"
INSTALL_DIR = CACHE_ROOT / f"apache-jena-fuseki-{FUSEKI_VERSION}"
SERVER_JAR = INSTALL_DIR / "fuseki-server.jar"
SNAPSHOT_PATH = CACHE_ROOT / "canonical-dataset.nq"
SNAPSHOT_FINGERPRINT_PATH = CACHE_ROOT / "canonical-dataset.sha256"
DATASET_NAME = "chemie-digital"
PORT = 3030
QUERY_ENDPOINT = f"http://127.0.0.1:{PORT}/{DATASET_NAME}/query"
FUSEKI_MAIN_CLASS = "org.apache.jena.fuseki.main.cmds.FusekiMainCmd"


def sha512_file(path: Path) -> str:
    digest = hashlib.sha512()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_archive(path: Path) -> None:
    actual = sha512_file(path)
    if actual != FUSEKI_ARCHIVE_SHA512:
        raise RuntimeError(
            f"Fuseki archive SHA-512 mismatch for {path}: expected "
            f"{FUSEKI_ARCHIVE_SHA512}, got {actual}"
        )


def _safe_extract(archive: zipfile.ZipFile, destination: Path) -> None:
    root = destination.resolve()
    for member in archive.infolist():
        target = (destination / member.filename).resolve()
        if target != root and root not in target.parents:
            raise RuntimeError(f"Unsafe path in Fuseki archive: {member.filename}")
    archive.extractall(destination)


def prepare(*, force: bool = False) -> None:
    CACHE_ROOT.mkdir(parents=True, exist_ok=True)

    if force:
        if INSTALL_DIR.exists():
            shutil.rmtree(INSTALL_DIR)
        if ARCHIVE_PATH.exists():
            ARCHIVE_PATH.unlink()

    if SERVER_JAR.exists() and not force:
        print(f"Fuseki {FUSEKI_VERSION} is already prepared at {INSTALL_DIR}")
        return

    if not ARCHIVE_PATH.exists():
        print(f"Downloading pinned Apache Jena Fuseki {FUSEKI_VERSION}...")
        request = urllib.request.Request(
            FUSEKI_ARCHIVE_URL,
            headers={"User-Agent": "project-chemie-digital-fuseki-preparer/1"},
        )
        with urllib.request.urlopen(request, timeout=120) as response, tempfile.NamedTemporaryFile(
            dir=CACHE_ROOT,
            prefix="fuseki-",
            suffix=".zip.tmp",
            delete=False,
        ) as temporary:
            temporary_path = Path(temporary.name)
            shutil.copyfileobj(response, temporary)
        try:
            temporary_path.replace(ARCHIVE_PATH)
        except Exception:
            temporary_path.unlink(missing_ok=True)
            raise

    verify_archive(ARCHIVE_PATH)
    if INSTALL_DIR.exists():
        shutil.rmtree(INSTALL_DIR)
    with zipfile.ZipFile(ARCHIVE_PATH) as archive:
        _safe_extract(archive, CACHE_ROOT)

    if not SERVER_JAR.exists():
        raise RuntimeError(
            f"Prepared Fuseki archive did not contain expected server jar: {SERVER_JAR}"
        )
    print(f"Prepared Apache Jena Fuseki {FUSEKI_VERSION} at {INSTALL_DIR}")


def write_snapshot(output_path: Path = SNAPSHOT_PATH) -> str:
    dataset = assemble_dataset()
    content = canonical_nquads(dataset)
    fingerprint = dataset_fingerprint(dataset)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = output_path.with_suffix(output_path.suffix + ".tmp")
    temp_path.write_text(content, encoding="utf-8", newline="\n")
    temp_path.replace(output_path)

    fingerprint_path = (
        SNAPSHOT_FINGERPRINT_PATH
        if output_path == SNAPSHOT_PATH
        else output_path.with_suffix(output_path.suffix + ".sha256")
    )
    fingerprint_path.write_text(f"{fingerprint}\n", encoding="utf-8", newline="\n")

    print(f"Wrote canonical Fuseki snapshot: {output_path}")
    print(f"Dataset fingerprint: {fingerprint}")
    return fingerprint


def java_major_version() -> int:
    try:
        process = subprocess.run(
            ["java", "-version"],
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError as exc:
        raise RuntimeError("Java was not found on PATH; Fuseki 6 requires Java 21+") from exc

    output = f"{process.stdout}\n{process.stderr}"
    match = re.search(r'version\s+"(?P<major>\d+)', output)
    if not match:
        raise RuntimeError(f"Could not determine Java version from: {output.strip()}")
    return int(match.group("major"))


def require_java_21() -> int:
    major = java_major_version()
    if major < 21:
        raise RuntimeError(f"Fuseki {FUSEKI_VERSION} requires Java 21+; found Java {major}")
    return major


def build_server_command(
    *,
    server_jar: Path = SERVER_JAR,
    snapshot_path: Path = SNAPSHOT_PATH,
) -> list[str]:
    return [
        "java",
        "-Xmx1G",
        "-cp",
        str(server_jar),
        FUSEKI_MAIN_CLASS,
        "--localhost",
        f"--port={PORT}",
        f"--file={snapshot_path}",
        f"/{DATASET_NAME}",
    ]


def doctor() -> None:
    if not SERVER_JAR.exists():
        raise RuntimeError("Fuseki is not prepared; run `npm run fuseki:prepare` while online")
    verify_archive(ARCHIVE_PATH)
    if not SNAPSHOT_PATH.exists():
        raise RuntimeError("Canonical Fuseki snapshot is missing; run `npm run fuseki:load`")
    major = require_java_21()
    print(f"Fuseki {FUSEKI_VERSION}: prepared")
    print(f"Java: {major}")
    print(f"Snapshot: {SNAPSHOT_PATH}")
    print(f"Read-only SPARQL endpoint: {QUERY_ENDPOINT}")


def start() -> int:
    doctor()
    command = build_server_command()
    print("Starting local read-only Fuseki. Stop with Ctrl+C.")
    print(f"SPARQL endpoint: {QUERY_ENDPOINT}")
    try:
        return subprocess.run(command, cwd=INSTALL_DIR, check=False).returncode
    except KeyboardInterrupt:
        return 130


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Prepare and run the explicit local read-only Fuseki boundary."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    prepare_parser = subparsers.add_parser(
        "prepare", help="Explicitly download and verify the pinned Fuseki distribution."
    )
    prepare_parser.add_argument(
        "--force",
        action="store_true",
        help="Re-download and re-extract the pinned distribution.",
    )
    subparsers.add_parser(
        "load",
        help="Assemble canonical TriG and write a deterministic named-graph N-Quads snapshot.",
    )
    subparsers.add_parser(
        "doctor",
        help="Network-free check of Java, prepared Fuseki and canonical snapshot.",
    )
    subparsers.add_parser(
        "start",
        help="Start localhost-only read-only Fuseki from the canonical snapshot.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        if args.command == "prepare":
            prepare(force=args.force)
            return 0
        if args.command == "load":
            write_snapshot()
            return 0
        if args.command == "doctor":
            doctor()
            return 0
        if args.command == "start":
            return start()
        raise AssertionError(args.command)
    except (OSError, RuntimeError, zipfile.BadZipFile) as exc:
        print(f"Fuseki local setup failed: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
