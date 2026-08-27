from __future__ import annotations

import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

from rdflib import Dataset, RDF, URIRef

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("semantic_authoring", ROOT / "scripts" / "semantic_authoring.py")
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

RDF_SPEC = importlib.util.spec_from_file_location("rdf_dataset", ROOT / "scripts" / "rdf_dataset.py")
assert RDF_SPEC and RDF_SPEC.loader
RDF_MODULE = importlib.util.module_from_spec(RDF_SPEC)
RDF_SPEC.loader.exec_module(RDF_MODULE)

RUNTIME_SPEC = importlib.util.spec_from_file_location(
    "generate_canonical_runtime", ROOT / "scripts" / "generate_canonical_runtime.py"
)
assert RUNTIME_SPEC and RUNTIME_SPEC.loader
RUNTIME_MODULE = importlib.util.module_from_spec(RUNTIME_SPEC)
RUNTIME_SPEC.loader.exec_module(RUNTIME_MODULE)

CD = "https://w3id.org/project-chemie-digital/ontology/"
SELECTION_PATH = URIRef(CD + "selectionPath")
SCENE_ITEM = URIRef(CD + "SceneItem")


def file_digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical_source_digests() -> dict[str, str]:
    return {
        path.relative_to(ROOT).as_posix(): file_digest(path)
        for path in RDF_MODULE.CANONICAL_TRIG
    }


class SemanticAuthoringTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.draft_root = Path(self.temporary.name) / "draft"
        self.canonical_before = canonical_source_digests()
        MODULE.checkout_draft(self.draft_root)

    def assert_canonical_unchanged(self) -> None:
        self.assertEqual(self.canonical_before, canonical_source_digests())

    def test_valid_noop_draft_validates_previews_and_prepares_deterministically(self) -> None:
        canonical = RDF_MODULE.assemble_dataset()
        expected_scene_document = RUNTIME_MODULE.compile_scene_document(canonical)
        expected_fingerprint = "sha256:" + RDF_MODULE.dataset_fingerprint(canonical)

        validation_first = MODULE.validate_draft(self.draft_root)
        validation_bytes_first = (self.draft_root / MODULE.VALIDATION_JSON).read_bytes()
        validation_second = MODULE.validate_draft(self.draft_root)
        validation_bytes_second = (self.draft_root / MODULE.VALIDATION_JSON).read_bytes()
        self.assertTrue(validation_first["conforms"])
        self.assertEqual([], validation_first["diagnostics"])
        self.assertEqual(validation_first, validation_second)
        self.assertEqual(validation_bytes_first, validation_bytes_second)
        self.assertEqual(expected_fingerprint, validation_first["candidateDatasetFingerprint"])

        preview_first = MODULE.preview_draft(self.draft_root)
        preview_bytes_first = (self.draft_root / MODULE.PREVIEW_JSON).read_bytes()
        preview_second = MODULE.preview_draft(self.draft_root)
        preview_bytes_second = (self.draft_root / MODULE.PREVIEW_JSON).read_bytes()
        self.assertEqual(expected_scene_document, preview_first["sceneDocument"])
        self.assertEqual(preview_first, preview_second)
        self.assertEqual(preview_bytes_first, preview_bytes_second)

        manifest_first = MODULE.prepare_promotion(self.draft_root)
        manifest_bytes_first = (self.draft_root / MODULE.PROMOTION_JSON).read_bytes()
        manifest_second = MODULE.prepare_promotion(self.draft_root)
        manifest_bytes_second = (self.draft_root / MODULE.PROMOTION_JSON).read_bytes()
        self.assertEqual("ready-for-human-review", manifest_first["status"])
        self.assertFalse(manifest_first["canonicalWritePerformed"])
        self.assertEqual(manifest_first, manifest_second)
        self.assertEqual(manifest_bytes_first, manifest_bytes_second)
        self.assert_canonical_unchanged()

    def test_stale_base_fingerprint_is_rejected(self) -> None:
        metadata_path = self.draft_root / MODULE.DRAFT_METADATA
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        metadata["baseDatasetFingerprint"] = "sha256:" + "0" * 64
        metadata_path.write_text(MODULE._canonical_json(metadata), encoding="utf-8", newline="\n")
        with self.assertRaisesRegex(MODULE.AuthoringError, "stale"):
            MODULE.validate_draft(self.draft_root)
        self.assert_canonical_unchanged()

    def test_wrong_or_multiple_named_graphs_are_rejected(self) -> None:
        candidate_path = self.draft_root / MODULE.CANDIDATE_FILE
        original = candidate_path.read_text(encoding="utf-8")
        wrong_graph = "https://w3id.org/project-chemie-digital/graph/scenes/not-the-target"
        candidate_path.write_text(
            original.replace(str(MODULE.TARGET_GRAPH), wrong_graph, 1),
            encoding="utf-8",
            newline="\n",
        )
        with self.assertRaisesRegex(MODULE.AuthoringError, "exactly the supported scene named graph"):
            MODULE.validate_draft(self.draft_root)

        MODULE.checkout_draft(self.draft_root, force=True)
        candidate_path = self.draft_root / MODULE.CANDIDATE_FILE
        candidate_path.write_text(
            candidate_path.read_text(encoding="utf-8")
            + "\n<https://w3id.org/project-chemie-digital/graph/scenes/extra> {\n"
            + "  <https://w3id.org/project-chemie-digital/resource/extra> "
            + "<https://w3id.org/project-chemie-digital/ontology/body> \"extra\" .\n}\n",
            encoding="utf-8",
            newline="\n",
        )
        with self.assertRaisesRegex(MODULE.AuthoringError, "exactly the supported scene named graph"):
            MODULE.validate_draft(self.draft_root)
        self.assert_canonical_unchanged()

    def test_invalid_scene_draft_emits_structured_stable_shacl_feedback(self) -> None:
        candidate_path = self.draft_root / MODULE.CANDIDATE_FILE
        parsed = Dataset(default_union=False)
        parsed.parse(candidate_path, format="trig")
        graph = parsed.graph(MODULE.TARGET_GRAPH)
        scene_items = sorted(graph.subjects(RDF.type, SCENE_ITEM), key=str)
        self.assertTrue(scene_items)
        focus = scene_items[0]
        graph.remove((focus, SELECTION_PATH, None))
        candidate_path.write_text(parsed.serialize(format="trig"), encoding="utf-8", newline="\n")

        first = MODULE.validate_draft(self.draft_root)
        first_bytes = (self.draft_root / MODULE.VALIDATION_JSON).read_bytes()
        second = MODULE.validate_draft(self.draft_root)
        second_bytes = (self.draft_root / MODULE.VALIDATION_JSON).read_bytes()

        self.assertFalse(first["conforms"])
        self.assertEqual(first, second)
        self.assertEqual(first_bytes, second_bytes)
        matching = [
            diagnostic
            for diagnostic in first["diagnostics"]
            if diagnostic["focusNode"] == str(focus)
            and diagnostic["resultPath"] == str(SELECTION_PATH)
        ]
        self.assertTrue(matching, first["diagnostics"])
        self.assertTrue(all(diagnostic["severity"] == "violation" for diagnostic in matching))
        self.assertTrue(all(diagnostic["sourceShape"] for diagnostic in matching))
        self.assertTrue(all(diagnostic["sourceConstraintComponent"] for diagnostic in matching))
        with self.assertRaises(MODULE.NonConformingDraft):
            MODULE.preview_draft(self.draft_root)
        with self.assertRaises(MODULE.NonConformingDraft):
            MODULE.prepare_promotion(self.draft_root)
        self.assert_canonical_unchanged()

    def test_candidate_with_default_graph_data_is_rejected(self) -> None:
        candidate_path = self.draft_root / MODULE.CANDIDATE_FILE
        candidate_path.write_text(
            candidate_path.read_text(encoding="utf-8")
            + "\n<https://w3id.org/project-chemie-digital/resource/default-test> "
            + "<https://w3id.org/project-chemie-digital/ontology/body> \"not allowed\" .\n",
            encoding="utf-8",
            newline="\n",
        )
        with self.assertRaisesRegex(MODULE.AuthoringError, "default-graph"):
            MODULE.validate_draft(self.draft_root)
        self.assert_canonical_unchanged()


if __name__ == "__main__":
    unittest.main()
