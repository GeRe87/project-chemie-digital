"""Host-neutral verification of generated transport and deployable static files."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import tempfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

import prepare_interactive_runtime as VENDOR
from course_runtime_transport import TRANSPORT_VERSION, build_course_transport

ROOT = Path(__file__).resolve().parents[1]
MARKER = "validated-build.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inventory(directory: Path) -> dict[str, str]:
    return {path.relative_to(directory).as_posix(): digest(path)
            for path in sorted(directory.rglob("*")) if path.is_file() and path.name != MARKER}


def is_generated_public_path(relative: Path) -> bool:
    return (relative.parts[0] in {"course-runtime", "script-pdf"} or relative.as_posix() == "course-runtime.json"
            or bool(re.fullmatch(r"authoring(?:-[\w-]+)?-(?:runtime\.json|static\.html)", relative.as_posix())))


def public_assets(public: Path):
    """Only versioned application assets plus the separately pinned vendor tree.

    Preview generators may leave arbitrary untracked files in the development
    public directory. Git supplies the production source inventory, while fixture
    or already staged public directories can be inspected directly.
    """
    if public.resolve() == (ROOT / "apps/pitch/public").resolve():
        listed = subprocess.check_output(["git", "ls-files", "--cached", "--full-name", "-z", "--", "apps/pitch/public"], cwd=ROOT)
        paths = [ROOT / name.decode("utf-8") for name in listed.split(b"\0") if name]
        paths.extend(path for path in (public / "vendor").rglob("*") if path.is_file())
    else:
        paths = [path for path in public.rglob("*") if path.is_file()]
    for path in sorted(set(paths)):
        if not is_generated_public_path(path.relative_to(public)):
            if path.is_symlink() or not path.is_file():
                raise ValueError(f"Missing or symlinked public source asset: {path.relative_to(public)}")
            yield path


def verified_transport_file(directory: Path, path: str, expected_digest: str) -> Path:
    if not isinstance(path, str) or not re.fullmatch(r"course-runtime/[A-Za-z0-9_-]+\.json", path):
        raise ValueError("Course transport must reference a local generated JSON file")
    file = asset_path(directory, path, directory / "index.html")
    if expected_digest != "sha256:" + digest(file):
        raise ValueError("Course transport integrity mismatch")
    return file


def read_split_artifact(directory: Path) -> dict:
    """Reassemble a v2 artifact for the existing domain validator, off the site."""
    manifest = json.loads((directory / "course-runtime/manifest.json").read_text(encoding="utf-8"))
    if manifest.get("transportVersion") != TRANSPORT_VERSION:
        raise ValueError("Missing canonical transport or unsupported split course transport")
    shared = manifest["sharedGraph"]
    shared_file = verified_transport_file(directory, shared["path"], shared.get("sha256"))
    graph = json.loads(shared_file.read_text(encoding="utf-8"))
    if (graph.get("transportVersion") != TRANSPORT_VERSION
            or graph.get("datasetFingerprint") != manifest.get("datasetFingerprint")):
        raise ValueError("Shared graph transport revision mismatch")
    levels = []
    for record in manifest["documents"]:
        file = verified_transport_file(directory, record["runtime"], record.get("sha256"))
        payload = json.loads(file.read_text(encoding="utf-8"))
        if len(payload.get("sceneDocuments", [])) != 1:
            raise ValueError("Lazy level transport requires exactly one document")
        levels.append(payload)
    if not levels:
        raise ValueError("Split course transport has no level documents")
    artifact = {key: value for key, value in levels[0].items() if key != "transport"}
    artifact.update({"datasetSnapshot": graph["datasetSnapshot"],
                     "sceneDocuments": [level["sceneDocuments"][0] for level in levels],
                     "sceneDocumentBindings": manifest["bindings"]})
    if any("thematicScripts" in level for level in levels):
        artifact["thematicScripts"] = sorted([script for level in levels for script in level.get("thematicScripts", [])],key=lambda script:script["id"])
    return artifact


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
    if manifest.get("transportVersion") == TRANSPORT_VERSION:
        expected_manifest, expected_files = build_course_transport(artifact)
        if manifest != expected_manifest:
            raise ValueError("Lazy course manifest does not match the validated canonical transport")
        for name, encoded in expected_files.items():
            if (directory / "course-runtime" / name).read_bytes() != encoded:
                raise ValueError("Lazy level transport does not match its canonical document and scoped snapshot")
        expected_names = set(expected_files) | {"static-course.html"}
        actual_names = {file.relative_to(manifest_file.parent).as_posix()
                        for file in manifest_file.parent.rglob("*") if file.is_file()}
        if actual_names != expected_names:
            raise ValueError("Unexpected or stale generated course transport files")
        if (directory / "course-runtime.json").exists():
            raise ValueError("Redundant full course transport remains in split output")
        return
    if manifest.get("transportVersion") is not None:
        raise ValueError("Unsupported course transport version")
    if (manifest.get("offering") != artifact["teachingOfferingDocuments"][0]
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
        if payload != expected:
            raise ValueError("Lazy level transport does not match its canonical document and snapshot")


def validate_files(directory: Path, offering: str, base: str, public: Path, *, expected_artifact: dict | None = None) -> dict:
    validate_base(base)
    if VENDOR.vendor_tree_digest(directory / "vendor") != VENDOR.VENDOR_TREE_SHA256:
        raise ValueError("Missing or changed pinned vendor assets in static output")
    runtime = directory / "course-runtime.json"
    split_transport = not runtime.exists()
    if split_transport:
        artifact = read_split_artifact(directory)
        # Domain validation still receives the complete original snapshot. This
        # temporary verification input is never included in the deployable tree.
        with tempfile.TemporaryDirectory(prefix="validate-course-") as temporary:
            verification_input = Path(temporary) / "canonical-runtime.json"
            verification_input.write_text(json.dumps(artifact), encoding="utf-8")
            model = validate_transport(verification_input, offering)
    else:
        model = validate_transport(runtime, offering)
        artifact = json.loads(runtime.read_text(encoding="utf-8"))
    if expected_artifact is not None and artifact != expected_artifact:
        raise ValueError("Split transports do not reconstruct the generated canonical artifact")
    if artifact.get("thematicScripts"):
        with tempfile.TemporaryDirectory(prefix="verify-script-pdf-") as temporary:
            script_runtime = Path(temporary) / "runtime.json"
            script_runtime.write_text(json.dumps(artifact, ensure_ascii=False), encoding="utf-8")
            subprocess.run(["node", "--experimental-strip-types", str(ROOT / "scripts/build_script_pdf.mts"),
                            "--runtime", str(script_runtime), "--out-dir", str(directory / "script-pdf"), "--public-root", str(directory), "--check"],
                           cwd=ROOT, check=True)
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
    if "pitch-world-start" not in script or (not split_transport and artifact["datasetFingerprint"] not in script):
        raise ValueError("Application bundle does not contain this course revision/world")
    if any(token in script or token in markup for token in ("/@vite/client", "/src/main.ts", "import.meta.hot")):
        raise ValueError("Development runtime remains in output")
    if "course-runtime/manifest.json" in script or (directory / "course-runtime/manifest.json").exists():
        validate_lazy_transport(directory, artifact, index)
    for unit in artifact.get("teachingOfferingDocuments", [{}])[0].get("units", []):
        if unit.get("thumbnail"):
            asset_path(directory, unit["thumbnail"]["uri"], index)
    # Verify versioned source assets and pinned vendor bytes independently of
    # disposable development previews and transports for other offerings.
    for source in public_assets(public):
        target = directory / source.relative_to(public)
        if not target.is_file() or digest(source) != digest(target):
            raise ValueError(f"Missing or changed public asset: {source.relative_to(public)}")
    for document in artifact["sceneDocuments"]:
        for scene in document["scenes"]:
            if not split_transport and scene["id"] not in script:
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
