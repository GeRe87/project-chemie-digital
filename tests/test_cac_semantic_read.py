"""Focused offline checks; no MCP service, network, or full Product assembly."""
from __future__ import annotations

import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

from rdflib import BNode, Dataset, Literal, RDF, URIRef, XSD

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("cac_semantic_read", ROOT / "scripts/cac_semantic_read.py")
M = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(M)
SELECTOR_SPEC = importlib.util.spec_from_file_location("pcd_test_selector", ROOT / "scripts/course_path_selection.py")
SELECTOR = importlib.util.module_from_spec(SELECTOR_SPEC)
sys.modules[SELECTOR_SPEC.name] = SELECTOR
SELECTOR_SPEC.loader.exec_module(SELECTOR)


def iri(local):
    return URIRef(M.EX + local)


def cd(local):
    return URIRef(M.CD + local)


G = URIRef(M.GRAPH + "test")


class FixtureBinding:
    sha = "a" * 40

    def __init__(self):
        self.ds = Dataset(default_union=False)
        self.cache = None
        self.checks = 0
        self.manifest = ("signature", ())
        graph = self.ds.graph(G)
        graph.add((iri("unit"), RDF.type, cd("LearningUnit")))
        graph.add((iri("unit"), URIRef(M.PREF_LABEL), Literal("Äpfel", lang="de")))
        graph.add((iri("unit"), cd("value"), Literal("1.2300", datatype=XSD.decimal, normalize=False)))
        graph.add((iri("unit"), cd("body"), Literal("ü" * 2500)))
        graph.add((iri("path"), RDF.type, cd("LearningPath")))
        graph.add((iri("path"), cd("forLearningUnit"), iri("unit")))
        for position in (2, 1):
            step = iri("step" + str(position))
            graph.add((iri("path"), cd("hasStep"), step))
            graph.add((step, RDF.type, cd("PathStep")))
            graph.add((step, cd("position"), Literal(position)))
            graph.add((step, cd("usesResource"), iri("unit")))
        graph.add((iri("step2"), cd("usesResource"), iri("missing")))
        shapes = self.ds.graph(URIRef(M.GRAPH + "shapes/test"))
        shapes.add((BNode(), RDF.type, cd("LearningUnit")))

    def check(self):
        self.checks += 1
        return self.manifest

    def dataset(self, manifest):
        return self.ds, SELECTOR, "fingerprint"


class SemanticTests(unittest.TestCase):
    def setUp(self):
        self.binding = FixtureBinding()

    def assert_ok(self, result):
        self.assertEqual(result["status"], "ok", result)
        self.assertEqual(result["response_bytes"], len(M.canonical_json(result).encode("utf-8")))
        self.assertLessEqual(result["response_bytes"], M.BUDGETS[result["detail"]] - 256)
        self.assertTrue(result["read_only"])
        self.assertFalse(result["content_edit_authorized"])

    def test_inventory_limits_counts_and_named_graph_metadata(self):
        result = M.semantic_inventory(self.binding, limit=1)
        self.assert_ok(result)
        self.assertEqual(result["total_count"], 4)
        self.assertEqual(result["returned_count"], 1)
        self.assertTrue(result["truncated"])
        self.assertEqual(result["overview"][M.CD + "PathStep"], 2)
        for item in result["items"]:
            self.assertTrue(all(row["graph_id"] == str(G) for row in item["metadata"]["items"]))

    def test_search_all_filters_and_unicode(self):
        result = M.semantic_search(self.binding, query="ÄPF", type_iri=M.CD + "LearningUnit",
                                   graph_id=str(G), resource_id=M.EX + "unit")
        self.assert_ok(result)
        self.assertEqual(result["total_count"], 1)
        metadata = result["items"][0]["metadata"]["items"]
        label = next(row for row in metadata if row["predicate"] == M.PREF_LABEL)
        self.assertEqual(label["object"]["language"], "de")
        self.assertIsNone(label["object"]["datatype"])
        result = M.semantic_search(self.binding, predicate_iri=M.CD + "forLearningUnit",
                                   related_resource_id=M.EX + "unit")
        self.assertEqual(result["items"][0]["resource_id"], M.EX + "path")
        self.assertEqual(result["items"][0]["matched_relations"]["items"][0]["graph_id"], str(G))
        self.assertEqual(M.semantic_search(self.binding, graph_id=M.GRAPH + "absent")["total_count"], 0)

    def test_inspect_decimal_lexical_truncation_incoming_and_errors(self):
        result = M.semantic_inspect(self.binding, resource_id=M.EX + "unit", detail="normal")
        self.assert_ok(result)
        value = next(row["object"] for row in result["items"] if row["predicate"] == M.CD + "value")
        self.assertEqual(value["value"], "1.2300")
        self.assertEqual(value["datatype"], str(XSD.decimal))
        body = next(row["object"] for row in result["items"] if row["predicate"] == M.CD + "body")
        self.assertEqual(body["full_length"], 2500)
        self.assertEqual(len(body["value"]), 600)
        self.assertTrue(body["truncated"])
        self.assertTrue(any(row["subject"] == M.EX + "path" for row in result["items"]))
        compact = M.semantic_inspect(self.binding, resource_id=M.EX + "unit")
        self.assertFalse(any(row["predicate"] == M.CD + "body" for row in compact["items"]))
        missing = M.semantic_inspect(self.binding, resource_id=M.EX + "absent")
        self.assertEqual(missing["error"]["code"], "RESOURCE_NOT_FOUND")

    def test_path_order_and_diagnostics_beyond_limit(self):
        result = M.learning_path_inspect(self.binding, path_id=M.EX + "path", path_graph_id=str(G),
                                         limit=1, detail="full")
        self.assert_ok(result)
        self.assertEqual(result["items"][0]["position"], 1)
        self.assertEqual(result["total_count"], 2)
        self.assertEqual(result["missing_scene_count"], 2)
        self.assertIn(M.EX + "missing", result["unresolved_ids"]["items"])
        self.assertEqual(result["validation"], "not_run")
        self.assertEqual(result["learning_unit"]["graph_id"], str(G))
        wrong = M.learning_path_inspect(self.binding, path_id=M.EX + "path", path_graph_id=M.GRAPH + "other")
        self.assertEqual(wrong["error"]["code"], "PATH_NOT_FOUND")
        self.binding.ds.graph(G).set((iri("step2"), cd("position"), Literal(1)))
        ambiguous = M.learning_path_inspect(self.binding, path_id=M.EX + "path", path_graph_id=str(G))
        self.assertEqual(ambiguous["error"]["code"], "AMBIGUOUS_POSITION")

    def test_known_invalid_values_and_no_extra_arguments(self):
        for limit in (True, 0, 51, 1.0, "1"):
            result = M.semantic_inventory(self.binding, limit=limit)
            self.assertEqual(result["error"]["code"], "INVALID_ARGUMENT")
        for args in ({"query": "x" * 513}, {"predicate_iri": M.CD + "x"},
                     {"resource_id": "https://example.invalid/foreign"}):
            self.assertEqual(M.semantic_search(self.binding, **args)["error"]["code"], "INVALID_ARGUMENT")
        for name, args in (("semantic_inventory", {"path": "secret"}),
                           ("semantic_inspect", {}), ("shell", {})):
            self.assertEqual(M.dispatch(self.binding, name, args)["error"]["code"], "INVALID_ARGUMENT")
        self.assertEqual(len(M.tool_schemas()), 4)
        self.assertTrue(all(s["additionalProperties"] is False for s in M.tool_schemas().values()))

    def test_budget_drops_whole_rows_with_stable_total(self):
        graph = self.binding.ds.graph(G)
        for i in range(50):
            resource = iri("large" + str(i))
            graph.add((resource, RDF.type, cd("LearningUnit")))
            graph.add((resource, URIRef(M.PREF_LABEL), Literal("ü" * 2400)))
        result = M.semantic_inventory(self.binding, limit=50, detail="full")
        self.assert_ok(result)
        self.assertLess(result["returned_count"], 50)
        self.assertEqual(result["total_count"], 54)
        self.assertTrue(result["truncated"])

    def test_failure_cleanup_and_postcheck_even_on_query_error(self):
        self.binding.cache = "cached"
        before = self.binding.checks
        result = M.semantic_inventory(self.binding, limit=False)
        self.assertEqual(self.binding.checks - before, 2)
        self.assertIsNone(self.binding.cache)
        self.assertEqual(result["error"]["code"], "INVALID_ARGUMENT")
        with patch.object(self.binding, "check", side_effect=[("a", ()), ("b", ())]):
            result = M.semantic_inventory(self.binding)
        self.assertEqual(result["error"]["code"], "SNAPSHOT_CHANGED")
        self.assertNotIn("items", result)


class BindingTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name).resolve()
        (self.root / "ontology/dataset").mkdir(parents=True)
        (self.root / "scripts").mkdir()
        for name in ("rdf_dataset.py", "course_path_selection.py", "cac_semantic_read.py"):
            (self.root / "scripts" / name).write_text("# fixture\n", encoding="utf-8")
        (self.root / "ontology/dataset/a.trig").write_text("# fixture\n", encoding="utf-8")
        self.state = {"project": "project-chemie-digital", "run_id": "test-run", "status": "running",
                      "worktree": str(self.root), "head_sha": "a" * 40, "run_dir": str(self.root)}
        self.identity = ["not-a-real-token", 1, "artifact", "outcome"]
        self.state.update(zip(M.IDENTITY_KEYS, self.identity))
        self.path = self.root / "state.json"
        self.save()
        # Inspect binding invariants independently of launching a server/git.
        self.binding = M.Binding.__new__(M.Binding)
        b = self.binding
        b.argv = tuple(sys.argv)
        b.environment = json.dumps(self.identity)
        b.identity = self.identity
        b.root = b.code_root = self.root
        b.state_path, b.run_id, b.sha = self.path, "test-run", "a" * 40
        b.locations = tuple((p.stat().st_dev, p.stat().st_ino)
                            for p in (b.root, b.code_root, b.state_path))
        b.resident, b.envelope, b.cache = b._code_bytes(), None, None
        self.env = patch.dict(os.environ, CF_AGENTCTL_ATTEMPT_IDENTITY=b.environment)
        self.env.start()
        self.addCleanup(self.env.stop)
        self.git = patch.object(b, "_git", side_effect=self.fake_git)
        self.git.start()
        self.addCleanup(self.git.stop)

    def save(self):
        self.path.write_text(json.dumps(self.state), encoding="utf-8")

    def fake_git(self, *args):
        if args == ("rev-parse", "--show-toplevel"):
            return str(self.root).replace("\\", "/") + "\n"
        if args == ("rev-parse", "--verify", "HEAD"):
            return "a" * 40 + "\n"
        if args[0] == "status":
            return ""
        if args[0] == "ls-files":
            return "\0".join(("ontology/dataset/a.trig", *M.MODULE_PATHS)) + "\0"
        if args[:2] == ("cat-file", "blob"):
            return "# fixture\n"
        self.fail("Unexpected git command")

    def assert_rejected(self, code):
        with self.assertRaises(M.DiscoveryError) as caught:
            self.binding.check()
        self.assertEqual(caught.exception.code, code)

    def test_identity_types_each_field_and_stale_state(self):
        self.binding.check()
        for key in M.IDENTITY_KEYS:
            with self.subTest(key=key):
                original = self.state[key]
                self.state[key] = True if type(original) is int else original + "foreign"
                self.save()
                self.assert_rejected("BINDING_REJECTED")
                self.state[key] = original
        self.state["status"] = "completed"
        self.save()
        self.assert_rejected("BINDING_REJECTED")

    def test_foreign_root_run_state_path_and_state_drift(self):
        for key, value in (("worktree", "foreign"), ("run_id", "foreign"),
                           ("run_dir", "foreign"), ("project", "foreign"), ("head_sha", "b" * 40)):
            original = self.state[key]
            self.state[key] = value
            self.save()
            self.assert_rejected("BINDING_REJECTED")
            self.state[key] = original
        self.save()
        self.binding.check()
        self.state["unrelated"] = "changed"
        self.save()
        self.assert_rejected("SNAPSHOT_CHANGED")

    def test_launch_env_head_dirty_manifest_and_resident_drift(self):
        with patch.dict(os.environ, CF_AGENTCTL_ATTEMPT_IDENTITY="[]"):
            self.assert_rejected("BINDING_REJECTED")
        with patch.object(sys, "argv", ["foreign"]):
            self.assert_rejected("BINDING_REJECTED")
        def changed_head(*args):
            return "b" * 40 if args == ("rev-parse", "--verify", "HEAD") else self.fake_git(*args)
        with patch.object(self.binding, "_git", side_effect=changed_head):
            self.assert_rejected("STALE_HEAD")
        def dirty(*args):
            return " M scripts/anything.py" if args[0] == "status" else self.fake_git(*args)
        with patch.object(self.binding, "_git", side_effect=dirty):
            self.assert_rejected("DIRTY_WORKTREE")
        extra = self.root / "ontology/dataset/ignored.trig"
        extra.write_text("# ignored", encoding="utf-8")
        self.assert_rejected("DATASET_INVALID")
        extra.unlink()
        (self.root / "scripts/cac_semantic_read.py").write_text("# drift", encoding="utf-8")
        self.assert_rejected("BINDING_REJECTED")

    def test_full_launch_identity_is_required_before_imports(self):
        for identity in (None, [], self.identity[:3], self.identity + ["extra"],
                         ["token", True, "artifact", "outcome"],
                         ["token", "1", "artifact", "outcome"],
                         ["", 1, "artifact", "outcome"]):
            with self.subTest(identity_type=type(identity).__name__):
                with patch.dict(os.environ, CF_AGENTCTL_ATTEMPT_IDENTITY=json.dumps(identity)):
                    with self.assertRaises(M.DiscoveryError) as caught:
                        M.Binding(str(self.path), "test-run", str(self.root), "a" * 40)
                    self.assertEqual(caught.exception.code, "BINDING_REJECTED")

    def test_status_hidden_changes_missing_sources_and_nested_additions(self):
        source = self.root / "ontology/dataset/a.trig"
        source.write_text("# hidden drift\n", encoding="utf-8")
        self.assert_rejected("DIRTY_WORKTREE")
        source.unlink()
        self.assert_rejected("DATASET_INVALID")
        source.write_text("# fixture\n", encoding="utf-8")
        nested = source.parent / "nested"
        nested.mkdir()
        (nested / "ignored.trig").write_text("# added", encoding="utf-8")
        self.assert_rejected("DATASET_INVALID")

    def test_links_rejected_when_platform_permits(self):
        link = self.root / "linked"
        try:
            link.symlink_to(self.path)
        except OSError:
            self.skipTest("Local symlink permission unavailable")
        with self.assertRaises(M.DiscoveryError):
            M._physical(link)

    def test_module_failure_removes_partial_module(self):
        (self.root / "scripts/broken.py").write_text("raise RuntimeError('private')", encoding="utf-8")
        with self.assertRaises(RuntimeError):
            self.binding._module("broken")
        self.assertNotIn("_pcd_semantic_broken", sys.modules)

    def test_cached_assembly_not_repeated_and_drift_clears(self):
        class Semantic:
            calls = 0

            def assemble_dataset(self, *, trig_paths):
                self.calls += 1
                return object()

            def dataset_fingerprint(self, ds):
                return "fingerprint"
        semantic = Semantic()
        self.binding.semantic, self.binding.selector = semantic, SELECTOR
        manifest = self.binding.check()
        first = self.binding.dataset(manifest)
        self.assertIs(self.binding.dataset(manifest)[0], first[0])
        self.assertEqual(semantic.calls, 1)
        with self.assertRaises(M.DiscoveryError):
            self.binding.dataset(("changed", ()))
        self.assertIsNone(self.binding.cache)


if __name__ == "__main__":
    unittest.main()
