from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import shutil
import tarfile
import tempfile
import urllib.request
from pathlib import Path, PurePosixPath

REPO_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = REPO_ROOT / "apps" / "pitch" / "public"
VENDOR_ROOT = PUBLIC_ROOT / "vendor"
MANIFEST_PATH = VENDOR_ROOT / "runtime-manifest.json"

CODEMIRROR_VERSION = "6.43.6"
CODEMIRROR_REMOTE_ENTRY = f"/npm/@codemirror/view@{CODEMIRROR_VERSION}/+esm"
CODEMIRROR_ORIGIN = "https://cdn.jsdelivr.net"
CODEMIRROR_LOCAL_ENTRY = f"/vendor/codemirror/view-{CODEMIRROR_VERSION}.mjs"

WEBR_VERSION = "0.6.0"
WEBR_NPM_TARBALL = f"https://registry.npmjs.org/webr/-/webr-{WEBR_VERSION}.tgz"
WEBR_LOCAL_ROOT = VENDOR_ROOT / "webr" / f"v{WEBR_VERSION}"
WEBR_LOCAL_URL = f"/vendor/webr/v{WEBR_VERSION}/"
WEBR_BROWSER_ENTRY = "webr.js"
WEBR_BROWSER_EXPORT = "./dist/webr.js"

_IMPORT_SPECIFIER_RE = re.compile(
    r"(?P<quote>['\"])(?P<specifier>(?:https://cdn\.jsdelivr\.net)?/npm/[^'\"]+/\+esm(?:\?[^'\"]*)?)(?P=quote)"
)


def _download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "project-chemie-digital-runtime-vendor/1"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def normalize_jsdelivr_specifier(specifier: str) -> str:
    if specifier.startswith(CODEMIRROR_ORIGIN):
        specifier = specifier[len(CODEMIRROR_ORIGIN) :]
    if not specifier.startswith("/npm/") or "/../" in specifier or specifier.endswith("/.."):
        raise ValueError(f"Unsupported jsDelivr module specifier: {specifier}")
    return specifier


def extract_jsdelivr_imports(source: str) -> list[str]:
    return sorted({normalize_jsdelivr_specifier(match.group("specifier")) for match in _IMPORT_SPECIFIER_RE.finditer(source)})


def local_jsdelivr_url(remote_path: str) -> str:
    remote_path = normalize_jsdelivr_specifier(remote_path)
    if remote_path == CODEMIRROR_REMOTE_ENTRY:
        return CODEMIRROR_LOCAL_ENTRY
    digest = hashlib.sha256(remote_path.encode("utf-8")).hexdigest()[:24]
    return f"/vendor/codemirror/modules/{digest}.mjs"


def _public_file_from_url(local_url: str) -> Path:
    path = PurePosixPath(local_url)
    if not local_url.startswith("/vendor/") or ".." in path.parts:
        raise ValueError(f"Unsafe local vendor URL: {local_url}")
    return PUBLIC_ROOT.joinpath(*path.parts[1:])


def mirror_codemirror_graph() -> dict[str, str]:
    mirrored: dict[str, str] = {}

    def mirror(remote_path: str) -> str:
        remote_path = normalize_jsdelivr_specifier(remote_path)
        if remote_path in mirrored:
            return mirrored[remote_path]

        local_url = local_jsdelivr_url(remote_path)
        mirrored[remote_path] = local_url
        source = _download(f"{CODEMIRROR_ORIGIN}{remote_path}").decode("utf-8")

        for dependency in extract_jsdelivr_imports(source):
            dependency_local = mirror(dependency)
            source = source.replace(f"{CODEMIRROR_ORIGIN}{dependency}", dependency_local)
            source = source.replace(dependency, dependency_local)

        if CODEMIRROR_ORIGIN in source:
            raise RuntimeError(f"Unrewritten public CodeMirror runtime URL remains in {remote_path}")

        target = _public_file_from_url(local_url)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(source, encoding="utf-8")
        return local_url

    mirror(CODEMIRROR_REMOTE_ENTRY)
    return dict(sorted(mirrored.items()))


def _safe_dist_member(member_name: str) -> PurePosixPath | None:
    path = PurePosixPath(member_name)
    prefix = PurePosixPath("package/dist")
    try:
        relative = path.relative_to(prefix)
    except ValueError:
        return None
    if not relative.parts or ".." in relative.parts:
        return None
    return relative


def _declared_browser_export(metadata: dict[str, object]) -> str | None:
    exports = metadata.get("exports")
    if not isinstance(exports, dict):
        return None
    root = exports.get(".")
    if not isinstance(root, dict):
        return None
    browser = root.get("browser")
    return browser if isinstance(browser, str) else None


def install_webr_dist() -> str:
    archive = _download(WEBR_NPM_TARBALL)
    archive_sha256 = hashlib.sha256(archive).hexdigest()

    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as tar:
        package_json_member = tar.getmember("package/package.json")
        package_json_file = tar.extractfile(package_json_member)
        if package_json_file is None:
            raise RuntimeError("webR npm archive is missing package/package.json")
        metadata = json.loads(package_json_file.read().decode("utf-8"))
        if metadata.get("name") != "webr" or metadata.get("version") != WEBR_VERSION:
            raise RuntimeError(f"Unexpected webR npm package identity: {metadata.get('name')} {metadata.get('version')}")
        browser_export = _declared_browser_export(metadata)
        if browser_export != WEBR_BROWSER_EXPORT:
            raise RuntimeError(f"Unexpected webR browser export: {browser_export!r}")

        with tempfile.TemporaryDirectory(prefix="pcd-webr-") as temp_dir:
            staged = Path(temp_dir) / "webr"
            staged.mkdir(parents=True)
            for member in tar.getmembers():
                if not member.isfile():
                    continue
                relative = _safe_dist_member(member.name)
                if relative is None:
                    continue
                source = tar.extractfile(member)
                if source is None:
                    continue
                target = staged.joinpath(*relative.parts)
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open("wb") as destination:
                    shutil.copyfileobj(source, destination)

            required = [WEBR_BROWSER_ENTRY, "R.js", "R.wasm", "webr-worker.js"]
            missing = [name for name in required if not (staged / name).is_file()]
            if missing:
                raise RuntimeError(f"webR npm archive is missing runtime assets: {', '.join(missing)}")
            if not (staged / "vfs").is_dir():
                raise RuntimeError("webR npm archive is missing the vfs runtime tree")

            WEBR_LOCAL_ROOT.parent.mkdir(parents=True, exist_ok=True)
            if WEBR_LOCAL_ROOT.exists():
                shutil.rmtree(WEBR_LOCAL_ROOT)
            shutil.copytree(staged, WEBR_LOCAL_ROOT)

    return archive_sha256


def expected_manifest() -> dict[str, object]:
    return {
        "schemaVersion": 1,
        "codeMirror": {
            "version": CODEMIRROR_VERSION,
            "entry": CODEMIRROR_LOCAL_ENTRY,
        },
        "webR": {
            "version": WEBR_VERSION,
            "baseUrl": WEBR_LOCAL_URL,
            "module": f"{WEBR_LOCAL_URL}{WEBR_BROWSER_ENTRY}",
            "browserExport": WEBR_BROWSER_EXPORT,
        },
    }


def check_vendor() -> list[str]:
    errors: list[str] = []
    if not MANIFEST_PATH.is_file():
        return [f"missing {MANIFEST_PATH.relative_to(REPO_ROOT)}; run npm run prepare:interactive-runtime while online"]

    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"invalid runtime manifest: {exc}"]

    expected = expected_manifest()
    for section in ("codeMirror", "webR"):
        expected_section = expected[section]
        if not isinstance(expected_section, dict):
            errors.append(f"invalid expected runtime manifest section: {section}")
            continue
        actual_section = manifest.get(section, {})
        if not isinstance(actual_section, dict):
            errors.append(f"runtime manifest section is not an object: {section}")
            continue
        for key, value in expected_section.items():
            if actual_section.get(key) != value:
                errors.append(f"runtime manifest mismatch for {section}.{key}")

    if not _public_file_from_url(CODEMIRROR_LOCAL_ENTRY).is_file():
        errors.append("missing local CodeMirror entry module")
    for name in (WEBR_BROWSER_ENTRY, "R.js", "R.wasm", "webr-worker.js"):
        if not (WEBR_LOCAL_ROOT / name).is_file():
            errors.append(f"missing local webR asset: {name}")
    if not (WEBR_LOCAL_ROOT / "vfs").is_dir():
        errors.append("missing local webR vfs directory")
    return errors


def prepare_vendor(force: bool = False) -> None:
    if not force and not check_vendor():
        print("Interactive runtime vendor cache already prepared; no network access required.")
        return

    VENDOR_ROOT.mkdir(parents=True, exist_ok=True)
    mirrored = mirror_codemirror_graph()
    webr_sha256 = install_webr_dist()
    manifest = expected_manifest()
    code_mirror_manifest = manifest["codeMirror"]
    webr_manifest = manifest["webR"]
    if not isinstance(code_mirror_manifest, dict) or not isinstance(webr_manifest, dict):
        raise RuntimeError("Internal runtime manifest shape is invalid")
    code_mirror_manifest["modules"] = mirrored
    webr_manifest["npmTarball"] = WEBR_NPM_TARBALL
    webr_manifest["archiveSha256"] = webr_sha256
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    errors = check_vendor()
    if errors:
        raise RuntimeError("Prepared runtime vendor cache is incomplete: " + "; ".join(errors))
    print(f"Prepared local interactive runtime vendor cache at {VENDOR_ROOT.relative_to(REPO_ROOT)}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare local CodeMirror and webR assets for the connected pitch runtime.")
    parser.add_argument("--check", action="store_true", help="Verify an existing vendor cache without network access.")
    parser.add_argument("--force", action="store_true", help="Refresh the vendor cache from the pinned public artifacts.")
    args = parser.parse_args()

    if args.check:
        errors = check_vendor()
        if errors:
            for error in errors:
                print(f"ERROR: {error}")
            return 1
        print("Interactive runtime vendor cache is complete.")
        return 0

    prepare_vendor(force=args.force)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
