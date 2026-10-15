"""System #279: fail-closed allowlisted two-graph semantic authoring."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

from rdflib import Dataset, Literal, RDF, URIRef
from rdflib.compare import isomorphic

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "semantic_authoring_graph_targets", ROOT / "scripts" / "semantic_authoring.py"
)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

import rdf_dataset as RDF_MODULE  # noqa: E402

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
OTHER_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/scenes/unapproved-variance")


def digests() -> dict[str, str]:
    return {
        file.relative_to(ROOT).as_posix(): hashlib.sha256(file.read_bytes()).hexdigest()
        for file in RDF_MODULE.CANONICAL_TRIG
    }


class NamedGraphDraftTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / "variance"
        self.before = digests()
        self.metadata = MODULE.checkout_draft(
            self.root, target_id=MODULE.VARIANCE_DRAFT_ID,
        )

    def tearDown(self) -> None:
        self.assertEqual(digests(), self.before, "Canonical TriG changed during a local draft")

    def _candidate(self) -> Dataset:
        dataset = Dataset(default_union=False)
        RDF_MODULE.parse_trig_path(dataset, self.root / MODULE.CANDIDATE_FILE)
        return dataset

    def _write(self, dataset: Dataset) -> None:
        (self.root / MODULE.CANDIDATE_FILE).write_text(
            dataset.serialize(format="trig"), encoding="utf-8", newline="\n",
        )

    def _minimal_linked_candidate(self) -> Dataset:
        dataset = self._candidate()
        scene = URIRef(EX + "scene-variance-pilot")
        dataset.graph(MODULE.VARIANCE_PATH_GRAPH).add(
            (MODULE.VARIANCE_STEP, URIRef(CD + "usesScene"), scene)
        )
        dataset.graph(MODULE.VARIANCE_SCENE_GRAPH).add(
            (scene, RDF.type, URIRef(CD + "SceneDefinition"))
        )
        return dataset

    def test_explicit_checkout_is_a_non_authoritative_two_graph_draft(self) -> None:
        self.assertEqual(self.metadata["draftId"], MODULE.VARIANCE_DRAFT_ID)
        self.assertEqual(self.metadata["contractVersion"], MODULE.VARIANCE_DRAFT_CONTRACT_VERSION)
        self.assertEqual(self.metadata["targetGraphIris"], [
            str(MODULE.VARIANCE_PATH_GRAPH), str(MODULE.VARIANCE_SCENE_GRAPH)
        ])
        self.assertEqual(self.metadata["selection"]["stepId"], str(MODULE.VARIANCE_STEP))
        self.assertEqual(self.metadata["selection"]["pathId"], str(MODULE.VARIANCE_PATH))
        self.assertEqual(self.metadata["selection"]["pathGraphId"], str(MODULE.VARIANCE_PATH_GRAPH))
        self.assertTrue((self.root / MODULE.CANDIDATE_FILE).exists())
        self.assertFalse((ROOT / self.metadata["sourceAllocation"][str(MODULE.VARIANCE_SCENE_GRAPH)]).exists())

    def test_checkout_refuses_unknown_targets_and_destructive_force(self) -> None:
        with self.assertRaisesRegex(MODULE.AuthoringError, "unapproved"):
            MODULE.checkout_draft(Path(self.tmp.name) / "unknown", target_id="path-inferred-from-topic")
        with self.assertRaisesRegex(MODULE.AuthoringError, "destructive"):
            MODULE.checkout_draft(self.root, target_id=MODULE.VARIANCE_DRAFT_ID, force=True)

    def test_empty_scene_graph_is_not_misreported_as_a_valid_candidate(self) -> None:
        with self.assertRaisesRegex(MODULE.AuthoringError, "both approved populated"):
            MODULE.validate_draft(self.root)

    def test_two_graph_candidate_assembles_without_mutating_other_named_graphs(self) -> None:
        self._write(self._minimal_linked_candidate())
        candidate, metadata = MODULE.assemble_candidate_dataset(self.root)
        original = RDF_MODULE.assemble_dataset()
        self.assertEqual(metadata["draftId"], MODULE.VARIANCE_DRAFT_ID)
        self.assertEqual(
            len(candidate.graph(MODULE.VARIANCE_PATH_GRAPH)),
            len(original.graph(MODULE.VARIANCE_PATH_GRAPH)) + 1,
        )
        self.assertEqual(len(candidate.graph(MODULE.VARIANCE_SCENE_GRAPH)), 1)
        for gid in RDF_MODULE.populated_graph_ids(original):
            if gid == MODULE.VARIANCE_PATH_GRAPH:
                continue
            self.assertTrue(
                isomorphic(candidate.graph(gid), original.graph(gid)),
                f"Unexpected semantic change in named graph {gid}",
            )

    def test_modified_existing_path_content_is_rejected(self) -> None:
        candidate = self._minimal_linked_candidate()
        candidate.graph(MODULE.VARIANCE_PATH_GRAPH).remove(
            (MODULE.VARIANCE_STEP, URIRef(CD + "position"), Literal(1))
        )
        self._write(candidate)
        with self.assertRaisesRegex(MODULE.AuthoringError, "only add one"):
            MODULE.assemble_candidate_dataset(self.root)

    def test_extra_unapproved_path_triple_is_rejected(self) -> None:
        candidate = self._minimal_linked_candidate()
        candidate.graph(MODULE.VARIANCE_PATH_GRAPH).add(
            (MODULE.VARIANCE_STEP, URIRef(CD + "body"), Literal("Unapproved"))
        )
        self._write(candidate)
        with self.assertRaisesRegex(MODULE.AuthoringError, "only add one"):
            MODULE.assemble_candidate_dataset(self.root)

    def test_extra_third_named_graph_is_rejected(self) -> None:
        candidate = self._minimal_linked_candidate()
        candidate.graph(OTHER_GRAPH).add((
            URIRef(EX + "unexpected"), URIRef(CD + "body"), Literal("No"),
        ))
        self._write(candidate)
        with self.assertRaisesRegex(MODULE.AuthoringError, "both approved populated"):
            MODULE.assemble_candidate_dataset(self.root)

    def test_wrong_scene_ownership_is_rejected(self) -> None:
        candidate = self._minimal_linked_candidate()
        candidate.graph(MODULE.VARIANCE_SCENE_GRAPH).remove((
            URIRef(EX + "scene-variance-pilot"), RDF.type, URIRef(CD + "SceneDefinition"),
        ))
        candidate.graph(MODULE.VARIANCE_SCENE_GRAPH).add((
            URIRef(EX + "other-scene"), RDF.type, URIRef(CD + "SceneDefinition"),
        ))
        self._write(candidate)
        with self.assertRaisesRegex(MODULE.AuthoringError, "linked scene must be defined"):
            MODULE.assemble_candidate_dataset(self.root)

    def test_forged_graph_allocation_or_selection_is_rejected(self) -> None:
        metadata_file = self.root / MODULE.DRAFT_METADATA
        for key, altered in (
            ("targetGraphIris", [str(MODULE.VARIANCE_SCENE_GRAPH)]),
            ("sourceAllocation", {str(MODULE.VARIANCE_SCENE_GRAPH): "../../outside.trig"}),
            ("selection", {"unitId": EX + "other-unit"}),
        ):
            baseline = dict(self.metadata)
            baseline[key] = altered
            metadata_file.write_text(MODULE._canonical_json(baseline), encoding="utf-8")
            with self.subTest(key=key), self.assertRaisesRegex(MODULE.AuthoringError, "not approved"):
                MODULE.assemble_candidate_dataset(self.root)
        metadata_file.write_text(MODULE._canonical_json(self.metadata), encoding="utf-8")

    def test_stale_dataset_fingerprint_is_rejected(self) -> None:
        metadata = dict(self.metadata)
        metadata["baseDatasetFingerprint"] = "sha256:" + "0" * 64
        (self.root / MODULE.DRAFT_METADATA).write_text(
            MODULE._canonical_json(metadata), encoding="utf-8",
        )
        with self.assertRaisesRegex(MODULE.AuthoringError, "stale"):
            MODULE.validate_draft(self.root)

    def test_nonconforming_scene_cannot_be_previewed_or_promoted(self) -> None:
        self._write(self._minimal_linked_candidate())
        validation = MODULE.validate_draft(self.root)
        self.assertEqual(validation["draftId"], MODULE.VARIANCE_DRAFT_ID)
        self.assertFalse(validation["conforms"])
        self.assertLessEqual(len(validation["diagnostics"]), MODULE.MAX_DRAFT_DIAGNOSTICS)
        with self.assertRaises(MODULE.NonConformingDraft):
            MODULE.preview_draft(self.root)
        with self.assertRaises(MODULE.NonConformingDraft):
            MODULE.prepare_promotion(self.root)


if __name__ == "__main__":
    unittest.main()
