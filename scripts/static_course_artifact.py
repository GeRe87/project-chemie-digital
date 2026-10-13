"""Host-neutral verification of generated transport and deployable static files."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

import prepare_interactive_runtime as VENDOR

ROOT = Path(__file__).resolve().parents[1]
MARKER = "validated-build.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inventory(directory: Path) -> dict[str, str]:
    return {path.relative_to(directory).as_posix(): digest(path)
            for path in sorted(directory.rglob("*")) if path.is_file() and path.name != MARKER}


def validate_base(base: str) -> str:
    if base not in {"/", "./"}:
        raise ValueError("Subpath deployment is blocked by existing root-anchored code-runtime/network-guard URLs; use / or ./ at a domain root pending generic runtime reconciliation")
    return base


def asset_path(directory: Path, uri: str, owner: Path) -> Path | None:
    parsed = urlsplit(uri)
    if uri.startswith("data:") or uri.startswith("#"):
        return None
    if parsed.scheme or parsed.netloc:
        raise ValueError(f"Non-local runtime asset: {uri}")
    if "\\" in uri or parsed.path.startswith("/src/"):
        raise ValueError(f"Development/local filesystem asset: {uri}")
    path = (directory / unquote(parsed.path).lstrip("/")) if uri.startswith("/") else owner.parent / unquote(parsed.path)
    resolved = path.resolve()
    if not resolved.is_relative_to(directory.resolve()) or not resolved.is_file():
        raise ValueError(f"Missing or escaping runtime asset: {uri}")
    return resolved


class AssetReferences(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references: list[str] = []
        self.title = ""
        self.in_title = False
        self.scripts: list[str] = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.in_title = tag == "title" or self.in_title
        if "src" in attrs:
            self.references.append(attrs["src"])
        if tag == "link" and attrs.get("rel") in {"stylesheet", "modulepreload", "icon", "preload"}:
            self.references.append(attrs["href"])
        if tag == "script" and "src" in attrs:
            self.scripts.append(attrs["src"])

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def validate_transport(file: Path, offering: str) -> dict:
    completed = subprocess.run(["node", "--experimental-strip-types", str(ROOT / "scripts/validate_course_transport.mts"),
                                str(file), offering], cwd=ROOT, text=True, capture_output=True, check=True)
    return json.loads(completed.stdout)


def media_uris(blocks):
    for block in blocks:
        if block["kind"] == "group":
            yield from media_uris(block["children"])
        elif block["kind"] == "media-reference":
            yield block["uri"]


def validate_files(directory: Path, offering: str, base: str, public: Path) -> dict:
    validate_base(base)
    if VENDOR.vendor_tree_digest(directory / "vendor") != VENDOR.VENDOR_TREE_SHA256:
        raise ValueError("Missing or changed pinned vendor assets in static output")
    runtime = directory / "course-runtime.json"
    model = validate_transport(runtime, offering)
    artifact = json.loads(runtime.read_text(encoding="utf-8"))
    index = directory / "index.html"
    parser = AssetReferences()
    markup = index.read_text(encoding="utf-8")
    parser.feed(markup)
    if parser.title != model["title"] or "Studiendekanat-Pitch" in markup:
        raise ValueError("Entry shell does not use the authored offering title")
    if len(parser.scripts) != 1:
        raise ValueError("Static entry requires one compiled application module")
    for uri in parser.references:
        asset_path(directory, uri, index)
    bundle = asset_path(directory, parser.scripts[0], index)
    script = bundle.read_text(encoding="utf-8")
    if artifact["datasetFingerprint"] not in script or "pitch-world-start" not in script:
        raise ValueError("Application bundle does not contain this course revision/world")
    if any(token in script or token in markup for token in ("/@vite/client", "/src/main.ts", "import.meta.hot")):
        raise ValueError("Development runtime remains in output")
    # Every public asset must be copied without mutation: backgrounds, icons,
    # semantic media and the complete pinned vendor/worker/VFS tree.
    for source in sorted(public.rglob("*")):
        if source.is_file():
            target = directory / source.relative_to(public)
            if not target.is_file() or digest(source) != digest(target):
                raise ValueError(f"Missing or changed public asset: {source.relative_to(public)}")
    for document in artifact["sceneDocuments"]:
        for scene in document["scenes"]:
            if scene["id"] not in script:
                raise ValueError("Selected scene identity missing from application bundle")
            for uri in media_uris(scene["blocks"]):
                asset_path(directory, uri, index)
    for css in directory.glob("assets/*.css"):
        for uri in re.findall(r"url\(\s*[\"']?([^\"')]+)[\"']?\s*\)", css.read_text(encoding="utf-8")):
            asset_path(directory, uri, css)
    for module in (directory / "vendor/codemirror").rglob("*.mjs"):
        text = module.read_text(encoding="utf-8")
        for uri in re.findall(r'(?:from\s*|import\s*)[\"\']([^\"\']+)[\"\']', text):
            asset_path(directory, uri, module)
    files = inventory(directory)
    return {"schemaVersion": 1, "offeringId": offering, "base": base,
            "datasetFingerprint": artifact["datasetFingerprint"], "entry": "overworld",
            "bindings": artifact["sceneDocumentBindings"], "files": files}


def verify_existing(directory: Path, public: Path) -> dict:
    marker = directory / MARKER
    evidence = json.loads(marker.read_text(encoding="utf-8"))
    actual = validate_files(directory, evidence["offeringId"], evidence["base"], public)
    if actual != evidence:
        raise ValueError("Validated output changed or evidence is stale")
    return actual


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    try:
        evidence = verify_existing(args.output.resolve(), ROOT / "apps/pitch/public")
        print(f"Verified {len(evidence['files'])} files; entry=overworld; {evidence['datasetFingerprint']}")
        return 0
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError) as error:
        print(f"Static artifact validation failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
