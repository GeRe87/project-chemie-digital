"""Offline refusal/receipt/export contracts; no MCP SDK, Java, HTTP or CAC required."""
from __future__ import annotations

from contextlib import ExitStack, contextmanager
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch, Mock, MagicMock

import rdflib
from rdflib import Dataset, Literal, RDF, URIRef

IMPORT_NORMALIZATION = rdflib.NORMALIZE_LITERALS

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("fuseki_dev", ROOT / "scripts" / "fuseki_dev.py")
assert SPEC and SPEC.loader
DEV = importlib.util.module_from_spec(SPEC)
# Fail even if the SDK happens to be installed in the operator's environment.
real_import = __import__


def without_mcp(name, *args, **kwargs):
    if name == "mcp" or name.startswith("mcp."):
        raise AssertionError("MCP imported outside stdio entry point")
    return real_import(name, *args, **kwargs)


with patch("builtins.__import__", side_effect=without_mcp):
    SPEC.loader.exec_module(DEV)
assert rdflib.NORMALIZE_LITERALS == IMPORT_NORMALIZATION, "Import changed RDFLib normalization"

BASE = "https://w3id.org/project-chemie-digital/"
G, S, P, KIND = (BASE + value for value in ("graph/test", "resource/section", "ontology/body", "ontology/ScriptSection"))
HEAD, TREE = "a" * 40, "b" * 40


class AdapterContracts(unittest.TestCase):
    def setUp(self):
        self.stack = ExitStack()
        self.addCleanup(self.stack.close)
        self.temp = Path(self.stack.enter_context(tempfile.TemporaryDirectory())).resolve()
        self.source = self.temp / "source"
        self.owner_path = self.source / "ontology/dataset/owner.trig"
        self.owner_path.parent.mkdir(parents=True)
        self.old = 'old \\(x\\)\nline with "quotes" and Unicode α'
        self.new = self.old.replace("line", "better\nline", 1)
        self.original = ("# Keep this comment and all spelling.\n"
                         f"<{G}> {{ <{S}> a <{KIND}> ; <{P}> "
                         + json.dumps(self.old, ensure_ascii=False) + "@en . }\n").encode("utf-8")
        self.owner_path.write_bytes(self.original)
        shapes = self.owner_path.with_name("shapes.trig")
        shapes.write_text(f"<{BASE}graph/shapes/test> {{ [] <{BASE}ontology/p> [ <{BASE}ontology/q> 'keep' ] . }}\n",
                          encoding="utf-8")
        self.trig_paths = (self.owner_path, shapes)
        self.baseline = DEV.rdf.assemble_dataset(trig_paths=self.trig_paths)
        self.baseline_path = self.temp / "baseline.nq"
        self.baseline_path.write_bytes(DEV.canonical(self.baseline))
        self.java, self.jar = self.temp / "java.exe", self.temp / "fuseki.jar"
        self.java.write_bytes(b"test executable, never launched")
        self.jar.write_bytes(b"test jar, never launched")
        self.output = self.temp / "open-output"
        self.manifest_path = self.temp / "manifest.json"
        self.m = {
            "schema": 1, "trusted_roots": [str(self.temp), str(ROOT)],
            "state_path": str(self.temp / "native/state.json"), "run_id": "open-test",
            "native_root": str(ROOT), "native_head": HEAD, "native_tree": TREE,
            "phase": "open", "product_root": str(self.source),
            "baseline_path": str(self.baseline_path), "java": str(self.java),
            "java_sha256": DEV.digest(self.java.read_bytes()), "jar": str(self.jar),
            "jar_sha256": DEV.digest(self.jar.read_bytes()), "output_dir": str(self.output),
            "checkpoint_path": str(self.output / "checkpoint/dataset.nq"),
            "receipt_path": str(self.output / "checkpoint/receipt.json"),
            "prior_receipt_sha256": None, "opening_run_id": None, "opening_attempt_sha256": None,
            "material": {"product_head": HEAD, "product_tree": TREE,
                         "baseline_nquads_sha256": DEV.digest(self.baseline_path.read_bytes()),
                         "source_file": "ontology/dataset/owner.trig",
                         "source_file_sha256": DEV.digest(self.original),
                         "graph": G, "subject": S, "predicate": P, "owner_type": KIND,
                         "language": "en", "datatype": str(RDF.langString),
                         "old_sha256": DEV.digest(self.old.encode()), "raw_old": "line",
                         "raw_new": "better\\nline", "lexical_old": "line", "lexical_new": "better\nline"}}
        self.binding = Mock(sha="c" * 64)
        self.stack.enter_context(patch.object(DEV, "Binding", return_value=self.binding))
        self.stack.enter_context(patch.object(DEV, "identity"))
        self.stack.enter_context(patch.object(DEV, "git", side_effect=self.git))
        self.stack.enter_context(patch.object(DEV, "JAR_SHA256", self.m["jar_sha256"]))
        self.stack.enter_context(patch.object(DEV.sys, "platform", "win32"))
        self.stack.enter_context(patch.dict(os.environ, {}, clear=True))

    def git(self, root, *args):
        if args[0] == "ls-tree":
            return b"ontology/dataset/owner.trig\0ontology/dataset/shapes.trig\0"
        if args[0] == "show":
            return (self.source / args[1].split(":", 1)[1]).read_bytes()
        raise AssertionError(args)

    def workflow(self):
        raw = DEV.packed(self.m)
        self.manifest_path.write_bytes(raw)
        return DEV.Workflow(str(self.manifest_path), DEV.digest(raw))

    def edited(self, workflow):
        # Simulate an independent live SELECT whose blank-node labels differ.
        data = DEV.Dataset(default_union=False)
        data.parse(data=workflow.expected_bytes.decode(), format="nquads")
        return data

    def resume(self, workflow):
        self.output.mkdir()
        workflow.write(Path(self.m["checkpoint_path"]), workflow.expected_bytes)
        receipt = {"schema": 1, "opening_run_id": "open-test", "opening_native_head": HEAD,
                   "opening_native_tree": TREE, "opening_attempt_sha256": "c" * 64,
                   "operation": workflow.operation, "operation_sha256": DEV.digest(DEV.packed(workflow.operation)),
                   "dataset_sha256": DEV.digest(workflow.expected_bytes)}
        raw = DEV.packed(receipt)
        workflow.write(Path(self.m["receipt_path"]), raw)
        self.m.update(phase="resume", run_id="resume-test", opening_run_id="open-test",
                      opening_attempt_sha256="c" * 64, prior_receipt_sha256=DEV.digest(raw),
                      output_dir=str(self.temp / "resume-output"))
        self.binding.sha = "d" * 64
        return self.workflow()

    def test_import_without_sdk_and_exact_arguments(self):
        for name in DEV.TOOLS:
            DEV.arguments(name, {})
        for name, args in (("query", {}), ("draft_open", {"path": "x"}), ("draft_open", None),
                           ("draft_open", []), ("draft_export", {"sparql": "DELETE WHERE {}"})):
            with self.subTest(name=name, args=args), self.assertRaises(DEV.Refused):
                DEV.arguments(name, args)

    def test_constructor_pins_and_preflight_have_no_effects(self):
        workflow = self.workflow()
        workflow.verify(self.edited(workflow))
        self.assertFalse(self.output.exists())
        self.assertEqual(self.original, self.owner_path.read_bytes())
        with patch.object(DEV.subprocess, "Popen") as popen:
            with self.assertRaises(DEV.Refused):
                DEV.Workflow(str(self.manifest_path), "0" * 64)
            popen.assert_not_called()

    def test_unknown_fields_wrong_owner_and_raw_patch_refused_before_output(self):
        cases = (("extra", "bad"), ("owner_type", BASE + "ontology/Other"),
                 ("raw_new", "unapproved spelling"), ("language", "de"),
                 ("source_file", "ontology/dataset/../other.trig"), ("old_sha256", "f" * 64))
        for key, value in cases:
            with self.subTest(key=key):
                material = dict(self.m["material"])
                self.m["material"][key] = value
                with patch.object(DEV.subprocess, "Popen") as popen, self.assertRaises(DEV.Refused):
                    self.workflow()
                popen.assert_not_called()
                self.assertFalse(self.output.exists())
                self.m["material"] = material

    def test_owner_requires_unique_type_across_graphs_and_exact_language(self):
        workflow = self.workflow()
        dataset = DEV.copy_dataset(workflow.base)
        dataset.graph(URIRef(BASE + "graph/foreign")).add((URIRef(S), RDF.type, URIRef(KIND)))
        with self.assertRaises(DEV.Refused):
            DEV.owner(dataset, self.m["material"], self.old)
        dataset = DEV.copy_dataset(workflow.base)
        dataset.graph(URIRef(G)).add((URIRef(S), URIRef(P), Literal("another", lang="en")))
        with self.assertRaises(DEV.Refused):
            DEV.owner(dataset, self.m["material"], self.old)

    def test_full_dataset_equality_catches_unrelated_changes(self):
        workflow = self.workflow()
        changed = self.edited(workflow)
        changed.graph(URIRef(G)).add((URIRef(S), URIRef(BASE + "ontology/extra"), Literal("no")))
        with self.assertRaises(DEV.Refused):
            workflow.verify(changed)

    def test_wrong_order_and_environment_fail_before_output_or_jvm(self):
        workflow = self.workflow()
        for name in ("draft_resume", "draft_validate", "draft_export"):
            with self.assertRaises(DEV.Refused):
                workflow.execute(name, {})
        with patch.dict(os.environ, {"JAVA_TOOL_OPTIONS": "-agentlib:bad"}), self.assertRaises(DEV.Refused):
            workflow.execute("draft_open", {})
        self.assertFalse(self.output.exists())

    def test_receipt_independent_authorization_and_stale_pins(self):
        opened = self.workflow()
        resumed = self.resume(opened)
        resumed.checkpoint()
        self.assertFalse(resumed.output.exists())
        for key, value in (("prior_receipt_sha256", "e" * 64), ("opening_run_id", "other-open"),
                           ("opening_attempt_sha256", "d" * 64), ("native_head", "e" * 40)):
            saved = self.m[key]
            self.m[key] = value
            with self.subTest(key=key), self.assertRaises(DEV.Refused):
                self.workflow()
            self.m[key] = saved
        checkpoint = Path(self.m["checkpoint_path"])
        checkpoint.write_bytes(opened.base_bytes)
        with self.assertRaises(DEV.Refused):
            self.workflow()
        self.assertFalse(resumed.output.exists())

    def test_export_requires_validation_then_reassembles_exact_bytes(self):
        workflow = self.resume(self.workflow())
        workflow.verified = self.edited(workflow)
        with self.assertRaises(DEV.Refused):
            workflow.export()
        workflow.output.mkdir()
        workflow.validated_sha = DEV.digest(workflow.expected_bytes)
        result = workflow.export()
        patched = Path(result["export_path"]).read_bytes()
        self.assertEqual(self.original.replace(b"line", b"better\\nline", 1), patched)
        self.assertEqual(self.original, self.owner_path.read_bytes())
        self.assertEqual(workflow.validated_sha, result["dataset_sha256"])
        self.assertIn("--- a/ontology/dataset/owner.trig\n", Path(result["diff_path"]).read_text())
        self.assertEqual([Path(result["export_path"])], list((workflow.output / "export").rglob("*.trig")))

    def test_export_refuses_unrelated_candidate_even_after_validation(self):
        workflow = self.resume(self.workflow())
        workflow.verified = self.edited(workflow)
        workflow.validated_sha = DEV.digest(workflow.expected_bytes)
        workflow.output.mkdir()
        real_write = workflow.write

        def corrupt(path, data):
            if path.suffix == ".trig":
                data += f"<{G}> {{ <{S}> <{BASE}ontology/extra> 'no' . }}".encode()
            real_write(path, data)

        with patch.object(workflow, "write", side_effect=corrupt), self.assertRaises(DEV.Refused):
            workflow.export()
        self.assertFalse((workflow.output / "authored.diff").exists())
        self.assertFalse((workflow.output / "export").exists())
        self.assertFalse(list(workflow.output.glob(".draft-stage-*")))
        self.assertEqual(self.original, self.owner_path.read_bytes())

    def test_failed_reassembly_never_publishes_candidate_or_diff(self):
        workflow = self.resume(self.workflow())
        workflow.verified = self.edited(workflow)
        workflow.validated_sha = DEV.digest(workflow.expected_bytes)
        workflow.output.mkdir()
        previous = DEV.rdflib.NORMALIZE_LITERALS
        with patch.object(DEV.rdf, "assemble_dataset", return_value=workflow.base) as assemble:
            with self.assertRaises(DEV.Refused):
                workflow.export()
        assemble.assert_called_once()
        self.assertFalse((workflow.output / "export").exists())
        self.assertFalse((workflow.output / "authored.diff").exists())
        self.assertFalse(list(workflow.output.glob(".draft-stage-*")))
        self.assertEqual(previous, DEV.rdflib.NORMALIZE_LITERALS)
        self.assertEqual(self.original, self.owner_path.read_bytes())

    def test_resume_validate_export_order_and_real_validator_api_defaults(self):
        workflow = self.resume(self.workflow())
        child = Mock(process=Mock(pid=123), port=1234, updates=0, update_status=None, cleanup=True)

        @contextmanager
        def server(*args):
            yield child

        with patch.object(workflow, "server", side_effect=server), patch.object(DEV, "live", return_value=self.edited(workflow)):
            self.assertTrue(workflow.execute("draft_resume", {})["cleanup"])
        with self.assertRaises(DEV.Refused):
            workflow.execute("draft_export", {})
        validator = types.ModuleType("validate_semantics")
        validator.__file__ = str(ROOT / "scripts/validate_semantics.py")
        validator.validate_dataset = Mock(return_value=(True, None, "conforms"))
        with patch.dict(sys.modules, {"validate_semantics": validator}):
            self.assertEqual("passed", workflow.execute("draft_validate", {})["shacl"])
        validator.validate_dataset.assert_called_once_with(workflow.verified)
        self.assertEqual("passed", workflow.execute("draft_export", {})["status"])
        with self.assertRaises(DEV.Refused):
            workflow.execute("draft_export", {})

    def test_open_writes_receipt_only_after_owned_cleanup(self):
        workflow = self.workflow()
        child = Mock(process=Mock(pid=123), port=1234, updates=0, update_status=204, cleanup=False)

        def update(*args, **kwargs):
            self.assertEqual({"update": True}, kwargs)
            child.updates += 1

        child.post.side_effect = update

        @contextmanager
        def server(*args):
            try:
                yield child
                self.assertFalse(Path(self.m["receipt_path"]).exists())
            finally:
                child.cleanup = True

        with patch.object(workflow, "server", side_effect=server), patch.object(
                DEV, "live", side_effect=[DEV.copy_dataset(workflow.base), DEV.copy_dataset(workflow.base), self.edited(workflow)]):
            result = workflow.execute("draft_open", {})
        self.assertTrue(result["cleanup"])
        self.assertEqual(1, result["updates"])
        self.assertEqual(1234, result["port"])
        self.assertEqual(204, result["update_status"])
        self.assertEqual(result, DEV.decoded((workflow.output / "draft_open.json").read_bytes()))
        raw = Path(self.m["receipt_path"]).read_bytes()
        self.assertEqual(DEV.digest(raw), result["receipt_sha256"])
        self.assertEqual(workflow.expected_bytes, Path(self.m["checkpoint_path"]).read_bytes())
        self.assertEqual(self.binding.sha, DEV.decoded(raw)["opening_attempt_sha256"])
        self.assertEqual(self.original, self.owner_path.read_bytes())
        with self.assertRaises(DEV.Refused):
            workflow.execute("draft_open", {})

    def test_owned_server_evidence_records_actual_status_and_cleanup_on_failure(self):
        workflow = self.workflow()
        workflow.output.mkdir()
        child = Mock(process=Mock(pid=321, returncode=0), port=4321, updates=1,
                     update_status=204, cleanup=False)

        def stop():
            child.cleanup = True

        child.stop.side_effect = stop
        with patch.object(DEV, "Server", return_value=child), self.assertRaises(DEV.Refused):
            with workflow.server(self.baseline_path, "draft_open"):
                raise DEV.Refused("readback failed")
        evidence = DEV.decoded((workflow.output / "draft_open-server.json").read_bytes())
        self.assertEqual({"pid": 321, "port": 4321, "updates": 1, "update_status": 204,
                          "cleanup": True, "returncode": 0}, evidence)
        child.stop.assert_called_once_with()
        self.assertFalse(Path(self.m["receipt_path"]).exists())

    def test_source_and_executable_drift_refused_before_start(self):
        workflow = self.workflow()
        self.owner_path.write_bytes(self.original + b"# drift\n")
        with patch.object(DEV.subprocess, "Popen") as popen, self.assertRaises(DEV.Refused):
            workflow.execute("draft_open", {})
        popen.assert_not_called()
        self.owner_path.write_bytes(self.original)
        self.java.write_bytes(b"changed executable")
        with self.assertRaises(DEV.Refused):
            workflow.execute("draft_open", {})
        self.assertFalse(self.output.exists())

    def test_validation_failure_is_terminal(self):
        workflow = self.resume(self.workflow())
        workflow.output.mkdir()
        workflow.verified, workflow.state = self.edited(workflow), "resumed"
        validator = types.ModuleType("validate_semantics")
        validator.__file__ = str(ROOT / "scripts/validate_semantics.py")
        validator.validate_dataset = Mock(return_value=(False, None, "violations"))
        with patch.dict(sys.modules, {"validate_semantics": validator}), self.assertRaises(DEV.Refused):
            workflow.execute("draft_validate", {})
        self.assertEqual("failed", workflow.state)
        self.assertIsNone(workflow.validated_sha)
        with self.assertRaises(DEV.Refused):
            workflow.execute("draft_export", {})

    def test_fixed_update_is_one_exact_language_literal_change(self):
        workflow = self.workflow()
        # RDFLib's SPARQL engine exercises real escaping, STRLANG and literal equality.
        actual = DEV.copy_dataset(workflow.base)
        update = DEV.update_text(self.m["material"], self.old, self.new)
        actual.update(update)
        workflow.verify(actual)
        self.assertEqual(1, update.count("DELETE"))
        self.assertEqual(1, update.count("INSERT"))

    def test_source_and_export_preserve_noncanonical_decimal_without_global_leak(self):
        previous = DEV.rdflib.NORMALIZE_LITERALS
        extra = (f"<{G}> {{ <{BASE}resource/number> <{P}> "
                 '\"09.80\"^^<http://www.w3.org/2001/XMLSchema#decimal> . }\n').encode()
        shapes = self.trig_paths[1]
        shapes.write_bytes(shapes.read_bytes() + extra)
        with DEV.lexical_source_terms():
            baseline = DEV.rdf.assemble_dataset(trig_paths=self.trig_paths)
        self.baseline_path.write_bytes(DEV.canonical(baseline))
        self.m["material"]["baseline_nquads_sha256"] = DEV.digest(self.baseline_path.read_bytes())
        workflow = self.resume(self.workflow())
        self.assertEqual(previous, DEV.rdflib.NORMALIZE_LITERALS)
        workflow.verified = DEV.copy_dataset(workflow.expected)
        workflow.validated_sha = DEV.digest(workflow.expected_bytes)
        workflow.output.mkdir()
        workflow.export()
        values = workflow.base.graph(URIRef(G)).objects(URIRef(BASE + "resource/number"), URIRef(P))
        self.assertEqual(["09.80"], [str(value) for value in values])
        self.assertEqual(previous, DEV.rdflib.NORMALIZE_LITERALS)
        self.assertFalse(list(workflow.output.glob(".draft-stage-*")))
        with self.assertRaises(RuntimeError):
            with DEV.lexical_source_terms():
                self.assertFalse(DEV.rdflib.NORMALIZE_LITERALS)
                raise RuntimeError("parser failure")
        self.assertEqual(previous, DEV.rdflib.NORMALIZE_LITERALS)

    def test_binding_drift_during_final_live_read_prevents_update(self):
        workflow = self.workflow()
        child = Mock(process=Mock(pid=123), port=1234, updates=0, cleanup=True)

        @contextmanager
        def server(*args):
            yield child

        calls = 0

        def read(_child):
            nonlocal calls
            calls += 1
            if calls == 2:
                self.binding.check.side_effect = DEV.Refused("stale attempt")
            return DEV.copy_dataset(workflow.base)

        with patch.object(workflow, "server", side_effect=server), patch.object(DEV, "live", side_effect=read):
            with self.assertRaises(DEV.Refused):
                workflow.execute("draft_open", {})
        child.post.assert_not_called()
        self.assertEqual("failed", workflow.state)
        self.assertFalse(Path(self.m["receipt_path"]).exists())

    def test_drift_and_duplicate_json_refused(self):
        workflow = self.workflow()
        self.manifest_path.write_bytes(self.manifest_path.read_bytes() + b" ")
        with self.assertRaises(DEV.Refused):
            workflow.execute("draft_open", {})
        with self.assertRaises(DEV.Refused):
            DEV.decoded('{"schema":1,"schema":1}')


class NativeAndTransportContracts(unittest.TestCase):
    def test_binding_uses_real_environment_and_current_state(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp).resolve()
            state_path = root / "state.json"
            attempt = ["test-only-token", 1, str(root / "artifact"), str(root / "outcome.json")]
            manifest = {"state_path": str(state_path), "run_id": "run-a", "native_root": str(root),
                        "native_head": HEAD, "native_tree": TREE}
            state = {"project": "project-chemie-digital", "status": "running", "run_id": "run-a",
                     "run_dir": str(root), "worktree": str(root), "head_sha": HEAD,
                     **dict(zip(DEV.ATTEMPT_FIELDS, attempt))}
            state_path.write_bytes(DEV.packed(state))
            with patch.dict(os.environ, {"CF_AGENTCTL_ATTEMPT_IDENTITY": json.dumps(attempt)}, clear=True), patch.object(DEV, "identity"):
                binding = DEV.Binding(manifest)
                self.assertEqual(DEV.digest(DEV.packed(attempt)), binding.sha)
                state["active_agent_attempt"] = 2
                state_path.write_bytes(DEV.packed(state))
                with self.assertRaises(DEV.Refused):
                    binding.check()
                with patch.dict(os.environ, {"CF_AGENTCTL_ATTEMPT_IDENTITY": "null"}), self.assertRaises(DEV.Refused):
                    binding.check()

    def test_listener_ownership_precedes_http_and_one_update_only(self):
        child = DEV.Server(Path("java"), Path("jar"), Path("nq"), Path("out"), "draft_open")
        child.url = "http://127.0.0.1:1234/random"
        child.http = Mock()
        with patch.object(child, "owned_listener", side_effect=DEV.Refused("foreign")):
            with self.assertRaises(DEV.Refused):
                child.post("ASK {}")
            child.http.open.assert_not_called()
            with self.assertRaises(DEV.Refused):
                child.post("fixed", update=True)
            with self.assertRaises(DEV.Refused):
                child.post("fixed", update=True)
        self.assertEqual(1, child.updates)

    def test_phase_specific_launch_and_update_status(self):
        with tempfile.TemporaryDirectory() as temp, patch.dict(os.environ, {}, clear=True):
            for phase in ("draft_open", "draft_resume"):
                child = DEV.Server(Path("java"), Path("jar"), Path("nq"), Path(temp), phase)
                with patch.object(DEV.socket, "socket") as sock, patch.object(DEV.subprocess, "Popen") as popen, patch.object(
                        child, "owned_listener", return_value=True), patch.object(child, "post", return_value={"boolean": False}):
                    sock.return_value.__enter__.return_value.getsockname.return_value = ("127.0.0.1", 1234)
                    popen.return_value.poll.return_value = None
                    child.start()
                    command = popen.call_args.args[0]
                    self.assertIn("--file=nq", command)
                    self.assertEqual(phase == "draft_open", "--update" in command)
                    child.log.close()
                child.http = MagicMock()
                if phase == "draft_resume":
                    with self.assertRaises(DEV.Refused):
                        child.post("fixed", update=True)
                    child.http.open.assert_not_called()
                    self.assertEqual(0, child.updates)
                else:
                    response = child.http.open.return_value.__enter__.return_value = Mock(status=204)
                    response.read.return_value = b""
                    with patch.object(child, "owned_listener", return_value=True):
                        child.post("fixed", update=True)
                        self.assertEqual(204, child.update_status)
                        with self.assertRaises(DEV.Refused):
                            child.post("fixed", update=True)
                    self.assertEqual(1, child.updates)
                    child.http.open.assert_called_once()

    def test_failed_update_records_http_status_without_retry(self):
        child = DEV.Server(Path("java"), Path("jar"), Path("nq"), Path("out"), "draft_open")
        child.url = "http://127.0.0.1:1234/random"
        child.http = Mock()
        child.http.open.side_effect = DEV.urllib.error.HTTPError(child.url, 503, "failed", {}, None)
        with patch.object(child, "owned_listener", return_value=True):
            with self.assertRaises(DEV.urllib.error.HTTPError):
                child.post("fixed", update=True)
            with self.assertRaises(DEV.Refused):
                child.post("fixed", update=True)
        self.assertEqual(503, child.update_status)
        self.assertEqual(1, child.updates)
        child.http.open.assert_called_once()

    def test_os_listener_checks_fail_closed_for_foreign_wildcard_and_malformed(self):
        child = DEV.Server(Path("java"), Path("jar"), Path("nq"), Path("out"), "test")
        child.port, child.process = 1234, Mock(pid=12)
        child.process.poll.return_value = None
        with patch.object(DEV.sys, "platform", "win32"), patch.object(DEV.shutil, "which", return_value="pwsh"), patch.object(DEV.subprocess, "run") as run:
            for rows in ([{"address": "127.0.0.1", "port": 1234, "pid": 99}],
                         [{"address": "0.0.0.0", "port": 1234, "pid": 12}], {}, []):
                run.return_value = Mock(returncode=0, stdout=json.dumps(rows).encode())
                with self.subTest(rows=rows), self.assertRaises(DEV.Refused):
                    child.owned_listener()
            run.return_value = Mock(returncode=0, stdout=b"[]")
            self.assertFalse(child.owned_listener(waiting=True))
            run.return_value = Mock(returncode=0, stdout=b'[{"address":"127.0.0.1","port":1234,"pid":12}]')
            self.assertTrue(child.owned_listener())

    def test_redirect_and_term_metadata_refusal_and_decimal_lexical_preservation(self):
        with self.assertRaises(DEV.urllib.error.HTTPError):
            DEV.NoRedirect().redirect_request(Mock(full_url="http://127.0.0.1"), None, 307, "", {}, "http://elsewhere")
        literal = DEV.term({"type": "literal", "value": "01.2300", "datatype": "http://www.w3.org/2001/XMLSchema#decimal"}, "o", {})
        self.assertEqual("01.2300", str(literal))
        for binding, role in (({"type": "literal", "value": "x"}, "g"),
                              ({"type": "uri", "value": G, "xml:lang": "en"}, "g"),
                              ({"type": "literal", "value": "x", "xml:lang": "en", "datatype": "other"}, "o")):
            with self.assertRaises(DEV.Refused):
                DEV.term(binding, role, {})

    def test_cleanup_terminates_only_owned_popen(self):
        child = DEV.Server(Path("java"), Path("jar"), Path("nq"), Path("out"), "test")
        child.port, child.process = 1234, Mock()
        child.process.poll.side_effect = [None, 0]
        child.log = Mock()
        with patch.object(DEV.socket, "socket") as sock:
            sock.return_value.__enter__.return_value.connect_ex.return_value = 1
            child.stop()
        child.process.terminate.assert_called_once_with()
        child.process.wait.assert_called_once_with(timeout=20)
        child.process.kill.assert_not_called()
        child.log.close.assert_called_once_with()
        self.assertTrue(child.cleanup)


if __name__ == "__main__":
    unittest.main()
