from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import build_static_course as BUILD
import static_course_artifact as STATIC
import prepare_interactive_runtime as VENDOR
import generate_canonical_runtime as RUNTIME


class StaticCourseBuildTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_parent = ROOT / ".local/test-static-build"
        cls.temp_parent.mkdir(parents=True, exist_ok=True)

    def fixture(self, root):
        output, public = root / "site", root / "public"
        output.mkdir(); public.mkdir()
        (output / "assets").mkdir()
        artifact = {"datasetFingerprint": "sha256:fixture", "sceneDocumentBindings": [],
                    "sceneDocuments": [{"scenes": [{"id": "first", "blocks": []}]}]}
        (output / "course-runtime.json").write_text(json.dumps(artifact), encoding="utf-8")
        (output / "index.html").write_text('<title>Authored course</title><script type="module" src="/assets/app.js"></script>', encoding="utf-8")
        (output / "assets/app.js").write_text('"sha256:fixture"; "pitch-world-start"; "first"', encoding="utf-8")
        return output, public

    def test_root_and_relative_root_base_supported_but_subpath_fails_explicitly(self):
        self.assertEqual("/", STATIC.validate_base("/"))
        self.assertEqual("./", STATIC.validate_base("./"))
        for base in ("/course/", "https://host/", "../", ""):
            with self.assertRaisesRegex(ValueError, "root-anchored"):
                STATIC.validate_base(base)

    def test_output_is_bounded_to_dedicated_generated_directory(self):
        self.assertEqual(ROOT / "dist/example", BUILD.output_path("dist/example"))
        for path in ("dist", ".", "apps/pitch", "../other/dist", "dist/../ontology"):
            with self.assertRaises(ValueError):
                BUILD.output_path(path)

    def test_local_asset_resolution_rejects_missing_remote_dev_and_escape(self):
        with tempfile.TemporaryDirectory(dir=self.temp_parent) as temporary:
            root = Path(temporary); (root / "asset.svg").write_text("svg")
            self.assertEqual(root / "asset.svg", STATIC.asset_path(root, "/asset.svg", root / "index.html"))
            for uri in ("http://localhost:5173/a.js", "file:///C:/private.js", "//cdn.example/a.js", "../outside.svg", "/src/main.ts", "/missing.svg"):
                with self.assertRaises(ValueError):
                    STATIC.asset_path(root, uri, root / "index.html")

    def test_static_evidence_detects_changed_bundle_and_missing_public_asset(self):
        with tempfile.TemporaryDirectory(dir=self.temp_parent) as temporary:
            output, public = self.fixture(Path(temporary))
            with patch.object(STATIC, "validate_transport", return_value={"title": "Authored course"}), patch.object(VENDOR, "vendor_tree_digest", return_value=VENDOR.VENDOR_TREE_SHA256):
                evidence = STATIC.validate_files(output, "https://example/course", "/", public)
                (output / STATIC.MARKER).write_text(json.dumps(evidence))
                self.assertEqual(evidence, STATIC.verify_existing(output, public))
                (output / "assets/app.js").write_text('"sha256:fixture"; "pitch-world-start"; "first"; changed')
                with self.assertRaisesRegex(ValueError, "stale"):
                    STATIC.verify_existing(output, public)
                (public / "needed.svg").write_text("needed")
                with self.assertRaisesRegex(ValueError, "public asset"):
                    STATIC.validate_files(output, "https://example/course", "/", public)

    def test_legacy_pitch_shell_and_development_bundle_are_rejected(self):
        with tempfile.TemporaryDirectory(dir=self.temp_parent) as temporary:
            output, public = self.fixture(Path(temporary))
            with patch.object(STATIC, "validate_transport", return_value={"title": "Authored course"}), patch.object(VENDOR, "vendor_tree_digest", return_value=VENDOR.VENDOR_TREE_SHA256):
                (output / "index.html").write_text('<title>Studiendekanat-Pitch</title>')
                with self.assertRaisesRegex(ValueError, "authored offering"):
                    STATIC.validate_files(output, "https://example/course", "/", public)
                (output / "index.html").write_text('<title>Authored course</title><script src="/assets/app.js"></script>')
                with (output / "assets/app.js").open("a") as stream:
                    stream.write("import.meta.hot")
                with self.assertRaisesRegex(ValueError, "Development runtime"):
                    STATIC.validate_files(output, "https://example/course", "/", public)

    def test_lazy_chunks_and_exact_per_level_transports_are_validated(self):
        with tempfile.TemporaryDirectory(dir=self.temp_parent) as temporary:
            output, public = self.fixture(Path(temporary))
            artifact=json.loads((output/'course-runtime.json').read_text())
            artifact['teachingOfferingDocuments']=[{'units':[]}]
            artifact['sceneDocuments'][0].update({'id':'document','sourcePathId':'path'})
            (output/'course-runtime.json').write_text(json.dumps(artifact))
            (output/'assets/app.js').write_text('import "./world.js"; import("./fallback.js"); "course-runtime/manifest.json";')
            (output/'assets/world.js').write_text('"pitch-world-start";')
            (output/'assets/fallback.js').write_text('"sha256:fixture"; "first";')
            lazy=output/'course-runtime';lazy.mkdir()
            (lazy/'level.json').write_text(json.dumps(artifact))
            (lazy/'manifest.json').write_text(json.dumps({'offering':artifact['teachingOfferingDocuments'][0],'bindings':[], 'documents':[{'id':'document','pathId':'path','sceneIds':['first'],'runtime':'course-runtime/level.json'}]}))
            with patch.object(STATIC,'validate_transport',return_value={'title':'Authored course'}),patch.object(VENDOR,'vendor_tree_digest',return_value=VENDOR.VENDOR_TREE_SHA256):
                STATIC.validate_files(output,'https://example/course','/',public)
                (lazy/'level.json').write_text('{}')
                with self.assertRaisesRegex(ValueError,'Lazy level transport'):
                    STATIC.validate_files(output,'https://example/course','/',public)

    def test_failed_semantics_invalidates_prior_evidence_and_preserves_output(self):
        with tempfile.TemporaryDirectory(dir=self.temp_parent) as temporary:
            output = Path(temporary)
            (output / "index.html").write_text("old")
            marker = output / STATIC.MARKER
            marker.write_text(json.dumps({"files": STATIC.inventory(output)}))
            with patch.object(BUILD, "run", side_effect=subprocess.CalledProcessError(1, "SHACL")):
                with self.assertRaises(subprocess.CalledProcessError):
                    BUILD.build("https://example/course", output, "/", offline=True)
            self.assertFalse(marker.exists())
            self.assertEqual("old", (output / "index.html").read_text())

    def test_unowned_or_modified_output_is_not_discarded(self):
        with tempfile.TemporaryDirectory(dir=self.temp_parent) as temporary:
            output = Path(temporary)
            (output / "user.txt").write_text("user work")
            with self.assertRaisesRegex(ValueError, "not an owned"):
                BUILD.build("https://example/course", output, "/")
            self.assertEqual("user work", (output / "user.txt").read_text())

    def test_invalid_offering_fails_in_existing_semantic_pipeline(self):
        with self.assertRaises(ValueError):
            RUNTIME.build_offering_artifact("https://example/absent", snapshot_language="en")

    def test_real_transport_has_exact_canonical_available_bindings(self):
        offering = str(RUNTIME.EX) + "teaching-offering-chemometrics-applied-statistics"
        artifact = RUNTIME.build_offering_artifact(offering, snapshot_language="en")
        with tempfile.TemporaryDirectory(dir=self.temp_parent) as temporary:
            file = Path(temporary) / "runtime.json"
            file.write_text(RUNTIME.canonical_json(artifact), encoding="utf-8")
            model = STATIC.validate_transport(file, offering)
            self.assertEqual(offering, model["offeringId"])
            self.assertEqual({"ex:path-chemometrics-introduction--scene-document",
                              "ex:path-chemometrics-random-variables-lecture--scene-document",
                               "ex:path-chemometrics-mean-values-lecture--scene-document",
                               "ex:path-chemometrics-variance-dispersion-lecture--scene-document"},
                             {path["sceneDocumentId"] for unit in model["units"] for path in unit["paths"] if path["status"] == "available"})
            with self.assertRaises(subprocess.CalledProcessError):
                STATIC.validate_transport(file, "https://example/wrong")
            artifact["sceneDocumentBindings"] = []
            file.write_text(RUNTIME.canonical_json(artifact), encoding="utf-8")
            with self.assertRaises(subprocess.CalledProcessError):
                STATIC.validate_transport(file, offering)

    def test_vendor_digest_is_deterministic_and_sensitive_to_missing_changed_extra_files(self):
        with tempfile.TemporaryDirectory(dir=self.temp_parent) as temporary:
            root = Path(temporary)
            (root / "module.mjs").write_text("module")
            first = VENDOR.vendor_tree_digest(root)
            self.assertEqual(first, VENDOR.vendor_tree_digest(root))
            (root / "runtime-manifest.json").write_text("disposable metadata")
            self.assertEqual(first, VENDOR.vendor_tree_digest(root))
            (root / "module.mjs").write_text("tampered")
            self.assertNotEqual(first, VENDOR.vendor_tree_digest(root))
            (root / "module.mjs").unlink()
            self.assertNotEqual(first, VENDOR.vendor_tree_digest(root))

    def test_missing_vendor_cache_fails_without_online_fallback_in_offline_build(self):
        with tempfile.TemporaryDirectory(dir=self.temp_parent) as temporary:
            with patch.object(BUILD, "run"), patch.object(VENDOR, "check_vendor", return_value=["missing vendor cache"]):
                with self.assertRaisesRegex(ValueError, "missing vendor cache"):
                    BUILD.build("https://example/course", Path(temporary), "/", offline=True)

    def test_archive_integrity_fails_before_any_extraction(self):
        with patch.object(VENDOR, "_download", return_value=b"not the pinned archive"):
            with self.assertRaisesRegex(RuntimeError, "integrity mismatch"):
                VENDOR.install_webr_dist()

    def test_production_dependencies_reject_missing_or_different_versions(self):
        with patch.object(BUILD.importlib.metadata, "version", return_value="0.0.0"):
            with self.assertRaisesRegex(ValueError, "dependency mismatch"):
                BUILD.check_python_dependencies()
        with patch.object(BUILD.importlib.metadata, "version", side_effect=BUILD.importlib.metadata.PackageNotFoundError("missing")):
            with self.assertRaisesRegex(ValueError, "Missing production dependency"):
                BUILD.check_python_dependencies()

    def test_missing_vendor_in_static_output_fails_even_with_valid_transport(self):
        with tempfile.TemporaryDirectory(dir=self.temp_parent) as temporary:
            output, public = self.fixture(Path(temporary))
            with self.assertRaisesRegex(ValueError, "pinned vendor assets"):
                STATIC.validate_files(output, "https://example/course", "/", public)


if __name__ == "__main__":
    unittest.main()
