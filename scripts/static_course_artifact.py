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
    artifact = json.loads(file.read_text(encoding="utf-8"))
    script = "validate_presentation_transport.mts" if "presentationCollection" in artifact else "validate_course_transport.mts"
    completed = subprocess.run(["node", "--experimental-strip-types", str(ROOT / "scripts" / script),
                                str(file), offering], cwd=ROOT, text=True, capture_output=True, check=True)
    return json.loads(completed.stdout)


def media_uris(blocks):
    for block in blocks:
        if block["kind"] == "group":
            yield from media_uris(block["children"])
        elif block["kind"] == "media-reference":
            yield block["uri"]
        elif block["kind"] == "diagram":
            for state in block.get("states", []):
                for presentation in state.get("nodePresentations", []):
                    if presentation.get("thumbnail"):
                        yield presentation["thumbnail"]["uri"]


def compiled_module_text(directory: Path, entry: Path) -> str:
    """Follow local compiled imports, including lazy chunks, from the real entry."""
    pending = [entry]
    visited: set[Path] = set()
    sources = []
    while pending:
        module = pending.pop()
        if module in visited:
            continue
        visited.add(module)
        text = module.read_text(encoding="utf-8")
        sources.append(text)
        for uri in re.findall(r'(?:from\s*|import\s*\(?\s*)["\']([^"\']+\.js)["\']', text):
            dependency = asset_path(directory, uri, module)
            if dependency is not None:
                pending.append(dependency)
    return "\n".join(sources)


def validate_lazy_transport(directory: Path, artifact: dict, index: Path) -> None:
    manifest_file = directory / "course-runtime/manifest.json"
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    documents = artifact["sceneDocuments"]
    identity_matches = (manifest.get("collection") == artifact["presentationCollection"] if "presentationCollection" in artifact
                        else manifest.get("offering") == artifact["teachingOfferingDocuments"][0])
    if (not identity_matches
            or manifest.get("bindings") != artifact["sceneDocumentBindings"]
            or [record.get("id") for record in manifest.get("documents", [])] != [doc["id"] for doc in documents]):
        raise ValueError("Lazy course manifest does not match the validated canonical transport")
    for record, document in zip(manifest["documents"], documents):
        if (record.get("pathId") != document["sourcePathId"]
                or record.get("sceneIds") != [scene["id"] for scene in document["scenes"]]):
            raise ValueError("Lazy course manifest has inconsistent scene/path identities")
        file = asset_path(directory, record["runtime"], index)
        payload = json.loads(file.read_text(encoding="utf-8"))
        expected = {**artifact, "sceneDocuments": [document],
                    "sceneDocumentBindings": [b for b in artifact["sceneDocumentBindings"] if b["sceneDocumentId"] == document["id"]]}
        expected.pop("presentationCollection", None)
        if payload != expected:
            raise ValueError("Lazy level transport does not match its canonical document and snapshot")


def public_files(public: Path, artifact: dict):
    if "presentationCollection" not in artifact:
        return sorted(path for path in public.rglob("*") if path.is_file())
    manifest = json.loads((public / "course-runtime/manifest.json").read_text(encoding="utf-8"))
    paths = [public / "course-runtime/manifest.json", public / "course-runtime/static-course.html"]
    paths += [public / record["runtime"] for record in manifest["documents"]]
    for folder in ["vendor", "talks-assets"]:
        paths += [path for path in (public / folder).rglob("*") if path.is_file()]
    for document in artifact["sceneDocuments"]:
        for scene in document["scenes"]:
            for uri in media_uris(scene["blocks"]):
                paths.append(public / uri.lstrip("/"))
            for logo in scene.get("presentationTitle", {}).get("logos", []):
                for key in ("uri", "darkUri"):
                    if logo.get(key):
                        paths.append(public / logo[key].lstrip("/"))
    for path in paths:
        if not path.resolve().is_relative_to(public.resolve()) or not path.is_file():
            raise ValueError("Missing or escaping selected public asset")
    return sorted(set(paths))


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
    script = compiled_module_text(directory, bundle)
    if artifact["datasetFingerprint"] not in script or "pitch-world-start" not in script:
        raise ValueError("Application bundle does not contain this course revision/world")
    if any(token in script or token in markup for token in ("/@vite/client", "/src/main.ts", "import.meta.hot")):
        raise ValueError("Development runtime remains in output")
    if "course-runtime/manifest.json" in script or (directory / "course-runtime/manifest.json").exists():
        validate_lazy_transport(directory, artifact, index)
    for unit in next(iter(artifact.get("teachingOfferingDocuments", [])), {}).get("units", []):
        if unit.get("thumbnail"):
            asset_path(directory, unit["thumbnail"]["uri"], index)
    # Every public asset must be copied without mutation: backgrounds, icons,
    # semantic media and the complete pinned vendor/worker/VFS tree.
    for source in public_files(public, artifact):
        if source.is_file():
            target = directory / source.relative_to(public)
            if not target.is_file() or digest(source) != digest(target):
                raise ValueError(f"Missing or changed public asset: {source.relative_to(public)}")
    for document in artifact["sceneDocuments"]:
        for scene in document["scenes"]:
            for logo in scene.get("presentationTitle", {}).get("logos", []):
                for key in ("uri", "darkUri"):
                    if logo.get(key):
                        asset_path(directory, logo[key], index)
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
