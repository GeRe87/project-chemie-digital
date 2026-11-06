"""Transport scope, integrity and clean production-input regression checks."""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import course_runtime_transport as TRANSPORT
import static_course_artifact as STATIC
import build_static_course as BUILD


class CourseRuntimeTransportTests(unittest.TestCase):
    def artifact(self):
        entities = [{"id": f"ex:{name}", "label": name, "semanticTypes": ["cd:Concept"],
                     "source": [{"resourceId": f"ex:{name}", "provenanceIds": ["graph:authored"]}]}
                    for name in ("a", "b", "c", "d", "unrelated", "provenance", "context")]
        def statement(source, target, graph="graph:authored"):
            return {"sourceEntityId": f"ex:{source}", "targetEntityId": f"ex:{target}",
                    "predicateId": "cd:showsResource", "predicateLabel": "showsResource",
                    "source": [{"resourceId": f"ex:{source}", "provenanceIds": [graph]}]}
        snapshot = {"version": "1.0", "identity": "sha256:" + "a" * 64, "entities": entities,
                    "statements": [statement("a", "b"), statement("a", "b", "graph:second"),
                                   statement("c", "a"), statement("b", "d"), statement("provenance", "context"),
                                   statement("unrelated", "d")],
                    "source": [{"resourceId": "dataset", "provenanceIds": ["ontology/dataset/course.trig"]}],
                    "supportedPredicates": ["cd:showsResource"]}
        document = {"id": "document:first", "sourcePathId": "path:first", "scenes": [{"id": "scene:first", "blocks": [
            {"kind": "group", "source": [], "children": [{"kind": "code", "source": [
                {"resourceId": TRANSPORT.PREFIXES["ex:"] + "a", "provenanceIds": ["ex:provenance"]}]}]},
        ]}]}
        return {"artifactVersion": "1.0", "datasetFingerprint": snapshot["identity"], "datasetSnapshot": snapshot,
                "sceneDocuments": [document], "sceneDocumentBindings": [
                    {"sceneDocumentId": document["id"], "pathId": document["sourcePathId"], "pathGraphId": "graph:path"}],
                "teachingOfferingDocuments": [{"units": []}]}

    def test_complete_one_hop_scope_retains_incoming_outgoing_and_named_graph_provenance(self):
        artifact = self.artifact()
        snapshot = artifact["datasetSnapshot"]
        scoped = TRANSPORT.level_snapshot(snapshot, artifact["sceneDocuments"][0])
        self.assertEqual([entity["id"] for entity in scoped["entities"]],
                         ["ex:a", "ex:b", "ex:c", "ex:provenance", "ex:context"])
        self.assertEqual(scoped["statements"], [snapshot["statements"][index] for index in (0, 1, 2, 4)])
        self.assertEqual(scoped["identity"], snapshot["identity"])
        self.assertEqual(scoped["source"], snapshot["source"])
        self.assertEqual(scoped["supportedPredicates"], snapshot["supportedPredicates"])
        self.assertEqual(len(snapshot["entities"]), 7)

    def test_content_addressed_payloads_and_explicit_shared_snapshot(self):
        artifact = self.artifact()
        manifest, files = TRANSPORT.build_course_transport(artifact)
        self.assertEqual((manifest, files), TRANSPORT.build_course_transport(artifact))
        self.assertNotIn("datasetSnapshot", manifest)
        shared = manifest["sharedGraph"]
        self.assertEqual(shared["sha256"], TRANSPORT.digest(files[Path(shared["path"]).name]))
        self.assertEqual(json.loads(files[Path(shared["path"]).name])["datasetSnapshot"], artifact["datasetSnapshot"])
        entry = manifest["documents"][0]
        self.assertEqual(entry["sha256"], TRANSPORT.digest(files[Path(entry["runtime"]).name]))
        payload = json.loads(files[Path(entry["runtime"]).name])
        self.assertEqual(payload["sceneDocuments"], artifact["sceneDocuments"])
        self.assertEqual(payload["transport"]["sharedGraph"], shared)
        self.assertLess(len(payload["datasetSnapshot"]["entities"]), len(artifact["datasetSnapshot"]["entities"]))

    def test_thematic_scripts_stay_with_their_exact_level_and_reassemble(self):
        artifact=self.artifact()
        second={**artifact['sceneDocuments'][0], 'id':'document:second','sourcePathId':'path:second'}
        artifact['sceneDocuments'].append(second)
        artifact['sceneDocumentBindings'].append({'sceneDocumentId':'document:second','pathId':'path:second','pathGraphId':'graph:second'})
        script={'id':'script:second','pathId':'path:second','pathGraphId':'graph:second','sections':[]}
        artifact['thematicScripts']=[script]
        manifest,files=TRANSPORT.build_course_transport(artifact)
        payloads=[json.loads(files[Path(r['runtime']).name]) for r in manifest['documents']]
        self.assertEqual([],payloads[0]['thematicScripts'])
        self.assertEqual([script],payloads[1]['thematicScripts'])
        with tempfile.TemporaryDirectory() as temporary:
            output=Path(temporary);TRANSPORT.replace_transport_directory(output/'course-runtime',files)
            self.assertEqual(artifact,STATIC.read_split_artifact(output))

    def test_generated_directory_replacement_removes_retired_files_only(self):
        with tempfile.TemporaryDirectory() as temporary:
            public = Path(temporary)
            course = public / "course-runtime"
            (public / "authoring-static.html").write_text("keep developer preview")
            TRANSPORT.replace_transport_directory(course, {"retired.json": b"old"})
            _, files = TRANSPORT.build_course_transport(self.artifact())
            TRANSPORT.replace_transport_directory(course, files)
            self.assertEqual({path.name for path in course.iterdir()}, set(files))
            self.assertTrue((public / "authoring-static.html").exists())
            with self.assertRaisesRegex(ValueError, "basenames"):
                TRANSPORT.replace_transport_directory(course, {"../unsafe": b"unsafe"})
            self.assertEqual({path.name for path in course.iterdir()}, set(files))

    def test_production_staging_uses_versioned_assets_and_pinned_vendor_only(self):
        self.assertTrue(STATIC.is_generated_public_path(Path('script-pdf/manifest.json')))
        self.assertTrue(STATIC.is_generated_public_path(Path('script-pdf/stale.pdf')))
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            public = root / "apps/pitch/public"
            public.mkdir(parents=True)
            (public / "authored.svg").write_text("authored")
            (public / "my-custom-preview.json").write_text("untracked preview")
            (public / "authoring-runtime.json").write_text("generated preview")
            (public / "course-runtime").mkdir()
            (public / "course-runtime/stale.json").write_text("stale")
            (public / "vendor").mkdir()
            (public / "vendor/pinned.wasm").write_bytes(b"pinned")
            tracked = b"apps/pitch/public/authored.svg\0"
            with patch.object(STATIC, "ROOT", root), patch.object(STATIC.subprocess, "check_output", return_value=tracked):
                BUILD.stage_public_assets(public, root / "production-public")
            self.assertEqual({path.relative_to(root / "production-public").as_posix()
                              for path in (root / "production-public").rglob("*") if path.is_file()},
                             {"authored.svg", "vendor/pinned.wasm"})

    def test_split_artifact_reconstructs_complete_canonical_data_and_rejects_stale_or_tampered_files(self):
        artifact = self.artifact()
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary)
            manifest, files = TRANSPORT.build_course_transport(artifact)
            files["static-course.html"] = b"static fallback"
            TRANSPORT.replace_transport_directory(output / "course-runtime", files)
            self.assertEqual(STATIC.read_split_artifact(output), artifact)
            STATIC.validate_lazy_transport(output, artifact, output / "index.html")
            (output / "course-runtime/stale.json").write_text("stale")
            with self.assertRaisesRegex(ValueError, "stale"):
                STATIC.validate_lazy_transport(output, artifact, output / "index.html")
            (output / "course-runtime/stale.json").unlink()
            shared = output / manifest["sharedGraph"]["path"]
            shared.write_bytes(shared.read_bytes() + b" ")
            with self.assertRaisesRegex(ValueError, "integrity mismatch"):
                STATIC.read_split_artifact(output)


if __name__ == "__main__":
    unittest.main()
