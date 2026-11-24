#!/usr/bin/env python3
"""Opt-in Windows CAC stdio adapter for one operator-pinned literal replacement."""
from __future__ import annotations

import sys
sys.dont_write_bytecode = True

import argparse
import asyncio
from contextlib import contextmanager
import difflib
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import socket
import subprocess
import time
import tempfile
import urllib.error
import urllib.request

SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import rdflib
import rdf_dataset as rdf
from fuseki_local import FUSEKI_MAIN_CLASS
from rdflib import BNode, Dataset, Literal, RDF, URIRef

TOOLS = ("draft_open", "draft_resume", "draft_validate", "draft_export")
ATTEMPT_FIELDS = ("active_worker_outcome_token", "active_agent_attempt",
                  "active_agent_artifact_dir", "active_worker_outcome_path")
MANIFEST_FIELDS = set("schema trusted_roots state_path run_id native_root native_head native_tree phase product_root baseline_path java java_sha256 jar jar_sha256 output_dir checkpoint_path receipt_path prior_receipt_sha256 opening_run_id opening_attempt_sha256 material".split())
MATERIAL_FIELDS = set("product_head product_tree baseline_nquads_sha256 source_file source_file_sha256 graph subject predicate owner_type language datatype old_sha256 raw_old raw_new lexical_old lexical_new".split())
JAR_SHA256 = "2c92c598e65ab69d99820052e05f4277ed1d77980a8845f87545ad35b71a76ee"
JVM_ENV = {"JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS", "JDK_JAVA_OPTIONS", "CLASSPATH"}
MAX_RESPONSE = 128 * 1024 * 1024


@contextmanager
def lexical_source_terms():
    """Scope RDFLib parser normalization to this synchronous opt-in operation."""
    previous = rdflib.NORMALIZE_LITERALS
    rdflib.NORMALIZE_LITERALS = False
    try:
        yield
    finally:
        rdflib.NORMALIZE_LITERALS = previous


class Refused(RuntimeError):
    """Fail closed; details are never sent over MCP."""


def require(condition, message):
    if not condition:
        raise Refused(message)


def packed(value):
    return (json.dumps(value, sort_keys=True, indent=2) + "\n").encode("utf-8")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def hexpin(value, size=64):
    require(type(value) is str and re.fullmatch(r"[0-9a-f]{%d}" % size, value), "Invalid digest")
    return value


def decoded(raw):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, "Duplicate JSON field")
            result[key] = value
        return result
    return json.loads(raw, object_pairs_hook=unique)


def normalized(value):
    require(type(value) is str and Path(value).is_absolute(), "Absolute path required")
    path = Path(value)
    require(str(path.resolve()) == value, "Non-normalized path")
    for item in (path, *path.parents):
        require(not item.is_symlink(), "Symlink refused")
        if item.exists():
            # Includes Windows junctions and other reparse-point aliases (Python 3.11).
            require(not (getattr(item.lstat(), "st_file_attributes", 0) & 0x400), "Reparse point refused")
    return path


def git(root, *args):
    result = subprocess.run(["git", "--no-optional-locks", "-C", str(root), *args],
                            capture_output=True, timeout=60, check=False)
    require(result.returncode == 0, "Git inspection failed")
    return result.stdout


def identity(root, head, tree):
    require(Path(git(root, "rev-parse", "--show-toplevel").decode().strip()).resolve() == root,
            "Wrong Git root")
    require(git(root, "rev-parse", "HEAD").decode().strip() == head, "Head drift")
    require(git(root, "rev-parse", "HEAD^{tree}").decode().strip() == tree, "Tree drift")
    require(not git(root, "status", "--porcelain=v1", "--untracked-files=all"), "Dirty checkout")
    require(not git(root, "ls-files", "-v").decode().splitlines() or
            all(line.startswith("H ") for line in git(root, "ls-files", "-v").decode().splitlines()),
            "Hidden index entries refused")


def attempt(raw):
    value = decoded(raw)
    require(type(value) is list and len(value) == 4, "Invalid native attempt")
    require(type(value[0]) is str and bool(value[0]) and type(value[1]) is int and value[1] > 0,
            "Invalid attempt types")
    normalized(value[2])
    normalized(value[3])
    return value


def arguments(name, args):
    require(name in TOOLS and type(args) is dict and not args, "Empty object arguments required")


class Binding:
    def __init__(self, manifest):
        self.m = manifest
        self.identity = attempt(os.environ.get("CF_AGENTCTL_ATTEMPT_IDENTITY", "null"))
        self.sha = digest(packed(self.identity))
        self.path = normalized(manifest["state_path"])
        require(self.path.name == "state.json", "Wrong native state filename")
        stat = self.path.stat()
        self.physical = (stat.st_dev, stat.st_ino)
        self.check()

    def check(self):
        require(attempt(os.environ.get("CF_AGENTCTL_ATTEMPT_IDENTITY", "null")) == self.identity,
                "Native attempt changed")
        stat = self.path.stat()
        require((stat.st_dev, stat.st_ino) == self.physical, "Native state replaced")
        state = decoded(self.path.read_bytes())
        require(type(state) is dict and state.get("project") == "project-chemie-digital"
                and state.get("status") == "running" and state.get("run_id") == self.m["run_id"]
                and state.get("run_dir") == str(self.path.parent)
                and state.get("worktree") == self.m["native_root"], "Wrong native context")
        for field, expected in zip(ATTEMPT_FIELDS, self.identity):
            require(type(state.get(field)) is type(expected) and state[field] == expected,
                    "Native attempt binding mismatch")
        selected = state.get("head_sha")
        require((state.get("base_sha") if selected is None else selected) == self.m["native_head"],
                "Stale native head")
        identity(normalized(self.m["native_root"]), self.m["native_head"], self.m["native_tree"])


def canonical(dataset):
    rdf.validate_dataset_contract(dataset)
    text = rdf.canonical_nquads(dataset)
    require(type(text) is str and text.endswith("\n"), "Invalid canonical dataset")
    return text.encode("utf-8")


def copy_dataset(dataset):
    result = Dataset(default_union=False)
    for s, p, o, g in dataset.quads((None, None, None, None)):
        result.graph(g).add((s, p, o))
    return result


def owner(dataset, material, lexical):
    g, s, p, kind = (URIRef(material[k]) for k in ("graph", "subject", "predicate", "owner_type"))
    types = list(dataset.quads((s, RDF.type, None, None)))
    require(types and {q[3] for q in types} == {g} and (s, RDF.type, kind, g) in types,
            "Wrong or nonunique typed owner")
    expected = Literal(lexical, lang=material["language"], normalize=False)
    values = [o for o in dataset.graph(g).objects(s, p)
              if isinstance(o, Literal) and o.language == material["language"]]
    # RDFLib represents a language-tagged literal's implicit rdf:langString
    # datatype as None in some supported versions; SPARQL may return it explicitly.
    require(values == [expected] and str(values[0]) == lexical
            and values[0].datatype in (None, RDF.langString)
            and material["datatype"] == str(RDF.langString), "Wrong literal metadata/value")
    return expected


def authorize_receipt(raw, nq, manifest, operation, current_attempt_sha):
    require(digest(raw) == manifest["prior_receipt_sha256"], "Unauthorized receipt")
    expected = {"schema": 1, "opening_run_id": manifest["opening_run_id"],
                "opening_native_head": manifest["native_head"],
                "opening_native_tree": manifest["native_tree"],
                "opening_attempt_sha256": manifest["opening_attempt_sha256"],
                "operation": operation, "operation_sha256": digest(packed(operation)),
                "dataset_sha256": digest(nq)}
    require(raw == packed(expected), "Noncanonical or incorrectly bound receipt")
    require(manifest["opening_run_id"] != manifest["run_id"]
            and manifest["opening_attempt_sha256"] != current_attempt_sha, "Independent run/attempt required")
    return expected


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise urllib.error.HTTPError(req.full_url, code, "Redirect blocked", headers, fp)

    def http_error_302(self, req, fp, code, msg, headers):
        raise urllib.error.HTTPError(req.full_url, code, "Redirect blocked", headers, fp)

    http_error_301 = http_error_303 = http_error_307 = http_error_308 = http_error_302


class Server:
    """One owned, short-lived, in-memory JVM. Never signals discovered PIDs."""
    def __init__(self, java, jar, nq, output, label):
        self.java, self.jar, self.nq = java, jar, nq
        self.output, self.label = output, label
        self.process = self.log = None
        self.updates = 0
        self.update_status = None
        self.cleanup = False
        self.http = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())

    def owned_listener(self, waiting=False):
        require(sys.platform == "win32", "Windows required")
        require(self.process is not None and self.process.poll() is None, "Owned JVM not alive")
        pwsh = shutil.which("pwsh")
        require(pwsh is not None, "PowerShell 7 required")
        script = (
            "$ErrorActionPreference = 'Stop'; "
            "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); "
            "$rows = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | "
            f"Where-Object {{ $_.LocalPort -eq {self.port} }} | "
            "ForEach-Object { [pscustomobject]@{ address = $_.LocalAddress; "
            "port = [int]$_.LocalPort; pid = [int]$_.OwningProcess } }); "
            "ConvertTo-Json -InputObject $rows -Compress")
        result = subprocess.run([pwsh, "-NoProfile", "-NonInteractive", "-Command", script],
                                capture_output=True, timeout=10, check=False)
        require(self.process.poll() is None and result.returncode == 0, "Listener inspection failed")
        rows = decoded(result.stdout.decode("utf-8-sig"))
        require(type(rows) is list, "Malformed listener inspection")
        for row in rows:
            require(type(row) is dict and set(row) == {"address", "port", "pid"}
                    and type(row["port"]) is int and row["port"] == self.port
                    and type(row["pid"]) is int and row["pid"] == self.process.pid
                    and row["address"] in {"127.0.0.1", "::1"}, "Foreign/non-loopback listener")
        if not rows and waiting:
            return False
        require(any(row["address"] == "127.0.0.1" for row in rows), "No owned IPv4 listener")
        require(self.process.poll() is None, "Owned JVM exited")
        return True

    def post(self, sparql, update=False):
        if update:
            require(self.label == "draft_open", "Resume is read-only")
            require(self.updates == 0, "Only one update allowed")
            self.updates += 1  # An ambiguous send is never retried.
        kind = "application/sparql-update" if update else "application/sparql-query"
        req = urllib.request.Request(self.url, data=sparql.encode("utf-8"), method="POST",
                                     headers={"Content-Type": kind + "; charset=utf-8",
                                              "Accept": "application/sparql-results+json"})
        self.owned_listener()
        try:
            with self.http.open(req, timeout=60) as response:
                if update:
                    self.update_status = response.status
                require(200 <= response.status < 300, "HTTP failure")
                body = response.read(MAX_RESPONSE + 1)
        except urllib.error.HTTPError as error:
            if update:
                self.update_status = error.code
            error.close()
            raise
        require(len(body) <= MAX_RESPONSE, "Response too large")
        return None if update else decoded(body)

    def start(self):
        require(not any(k.upper() in JVM_ENV for k in os.environ), "JVM environment override")
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(("127.0.0.1", 0))
            self.port = sock.getsockname()[1]
        self.dataset_path = "/chem-dev-" + secrets.token_hex(16)
        self.url = f"http://127.0.0.1:{self.port}{self.dataset_path}"
        command = [str(self.java), "-Xmx1G", "-cp", str(self.jar), FUSEKI_MAIN_CLASS,
                   "--localhost", f"--port={self.port}", f"--file={self.nq}"]
        if self.label == "draft_open":
            command.append("--update")
        command.append(self.dataset_path)
        self.log = (self.output / (self.label + ".log")).open("xb")
        self.process = subprocess.Popen(command, cwd=self.output, stdout=self.log, stderr=subprocess.STDOUT)
        deadline = time.monotonic() + 120
        while time.monotonic() < deadline:
            require(self.process.poll() is None, "Fuseki exited")
            if self.owned_listener(waiting=True):
                try:
                    require(self.post("ASK { ?s ?p ?o }").get("boolean") is False,
                            "Default graph must be empty")
                    return
                except (urllib.error.URLError, TimeoutError, ConnectionError):
                    pass
            time.sleep(0.2)
        raise Refused("Readiness timeout")

    def stop(self):
        try:
            if self.process is not None:
                if self.process.poll() is None:
                    self.process.terminate()
                    try:
                        self.process.wait(timeout=20)
                    except subprocess.TimeoutExpired:
                        self.process.kill()
                        self.process.wait(timeout=10)
                deadline = time.monotonic() + 10
                listening = True
                while time.monotonic() < deadline:
                    with socket.socket() as sock:
                        sock.settimeout(0.5)
                        listening = sock.connect_ex(("127.0.0.1", self.port)) == 0
                    if not listening:
                        break
                    time.sleep(0.1)
                self.cleanup = self.process.poll() is not None and not listening
                require(self.cleanup, "Owned JVM cleanup not proven")
            else:
                self.cleanup = True
        finally:
            if self.log is not None:
                self.log.close()


def term(binding, role, bnodes):
    require(type(binding) is dict and set(binding) <= {"type", "value", "xml:lang", "datatype"},
            "Invalid RDF binding")
    kind, value = binding.get("type"), binding.get("value")
    require(type(value) is str, "Missing RDF lexical value")
    if kind == "uri":
        require("xml:lang" not in binding and "datatype" not in binding, "URI metadata")
        return URIRef(value)
    if kind == "bnode" and role in ("s", "o"):
        require("xml:lang" not in binding and "datatype" not in binding, "Bnode metadata")
        return bnodes.setdefault(value, BNode(value))
    if kind in ("literal", "typed-literal") and role == "o":
        lang, dtype = binding.get("xml:lang"), binding.get("datatype")
        require(not lang or dtype in (None, str(RDF.langString)), "Conflicting metadata")
        require(kind != "typed-literal" or dtype, "Missing datatype")
        return Literal(value, lang=lang, datatype=None if lang else dtype, normalize=False)
    raise Refused("Unexpected RDF term role")


def live(server):
    require(server.post("ASK { ?s ?p ?o }").get("boolean") is False, "Nonempty default graph")
    result = server.post("SELECT ?s ?p ?o ?g WHERE { GRAPH ?g { ?s ?p ?o } }")
    require(result.get("head", {}).get("vars") == ["s", "p", "o", "g"], "Wrong SELECT columns")
    rows = result["results"]["bindings"]
    require(type(rows) is list, "Invalid rows")
    dataset, bnodes = Dataset(default_union=False), {}
    for row in rows:
        require(type(row) is dict and set(row) == {"s", "p", "o", "g"}, "Invalid quad row")
        s, p, o, g = (term(row[k], k, bnodes) for k in ("s", "p", "o", "g"))
        dataset.graph(g).add((s, p, o))
    require(len(list(dataset.quads((None, None, None, None)))) == len(rows), "Duplicate quads")
    return dataset


def update_text(material, old, new):
    g, s, p = (URIRef(material[k]).n3() for k in ("graph", "subject", "predicate"))
    # JSON escaping is valid SPARQL short-string escaping. Keep Unicode codepoints
    # intact (JSON surrogate-pair escapes are not SPARQL Unicode scalar escapes).
    # STRLANG constructs the exact language-tagged RDF term, including multiline text.
    old_expr = "STRLANG(" + json.dumps(old, ensure_ascii=False) + ', "en")'
    new_expr = "STRLANG(" + json.dumps(new, ensure_ascii=False) + ', "en")'
    return (f"DELETE {{ GRAPH {g} {{ {s} {p} ?old }} }} "
            f"INSERT {{ GRAPH {g} {{ {s} {p} ?new }} }} WHERE {{ "
            f"BIND({old_expr} AS ?old) BIND({new_expr} AS ?new) GRAPH {g} {{ {s} {p} ?old }} }}")


class Workflow:
    @lexical_source_terms()
    def __init__(self, manifest_path, manifest_sha):
        require(sys.platform == "win32", "Windows only")
        self.path = normalized(manifest_path)
        self.sha = hexpin(manifest_sha)
        raw = self.path.read_bytes()
        require(digest(raw) == self.sha, "Manifest digest mismatch")
        self.m = m = decoded(raw)
        require(type(m) is dict and set(m) == MANIFEST_FIELDS and type(m["schema"]) is int
                and m["schema"] == 1, "Unknown manifest schema/fields")
        self.c = c = m["material"]
        require(type(c) is dict and set(c) == MATERIAL_FIELDS
                and all(type(v) is str and v for v in c.values()), "Invalid material")
        require(m["phase"] in ("open", "resume") and type(m["run_id"]) is str and m["run_id"], "Invalid phase/run")
        for obj, keys, size in ((m, ("native_head", "native_tree"), 40),
                                (c, ("product_head", "product_tree"), 40),
                                (m, ("java_sha256", "jar_sha256"), 64),
                                (c, ("baseline_nquads_sha256", "source_file_sha256", "old_sha256"), 64)):
            for key in keys:
                hexpin(obj[key], size)
        require(c["language"] == "en" and c["datatype"] == str(RDF.langString), "English langString only")
        require(c["raw_old"] != c["raw_new"] and c["lexical_old"] != c["lexical_new"], "Empty edit")
        for key in ("graph", "subject", "predicate", "owner_type"):
            require(c[key].startswith("https://w3id.org/project-chemie-digital/")
                    and not re.search(r'[<>\s"{}\\]', c[key]), "Unsafe/non-Product IRI")
        relative = Path(c["source_file"])
        require(not relative.is_absolute() and not relative.drive and ".." not in relative.parts
                and relative.as_posix() == c["source_file"] and len(relative.parts) == 3
                and relative.parts[:2] == ("ontology", "dataset") and relative.suffix == ".trig", "Unsafe source file")
        require(type(m["trusted_roots"]) is list and m["trusted_roots"], "Trusted roots required")
        roots = [normalized(p) for p in m["trusted_roots"]]
        self.paths = {k: normalized(m[k]) for k in ("state_path", "native_root", "product_root", "baseline_path",
                                                   "java", "jar", "output_dir", "checkpoint_path", "receipt_path")}
        require(all(any(p.is_relative_to(r) for r in roots) for p in (self.path, *self.paths.values())), "Untrusted path")
        self.source, self.output = self.paths["product_root"], self.paths["output_dir"]
        require(SCRIPTS.parent == self.paths["native_root"], "Tools must run from pinned native Product")
        protected = (self.source, self.paths["native_root"])
        require(not any(self.path.is_relative_to(r) for r in protected), "Manifest inside checkout")
        for key in ("output_dir", "checkpoint_path", "receipt_path"):
            require(not any(self.paths[key].is_relative_to(r) or r.is_relative_to(self.paths[key]) for r in protected),
                    "Artifact overlaps checkout")
        require(not any(p.is_relative_to(self.output) or self.output.is_relative_to(p)
                        for p in (self.path, self.paths["state_path"], self.paths["baseline_path"],
                                  self.paths["java"], self.paths["jar"])), "Output overlaps trusted input")
        require(self.paths["checkpoint_path"] != self.paths["receipt_path"], "Artifact collision")
        if m["phase"] == "open":
            require(m["prior_receipt_sha256"] is None and m["opening_run_id"] is None
                    and m["opening_attempt_sha256"] is None, "Open carries resume approval")
            require(self.paths["checkpoint_path"] == self.output / "checkpoint" / "dataset.nq"
                    and self.paths["receipt_path"] == self.output / "checkpoint" / "receipt.json", "Wrong checkpoint locations")
        else:
            hexpin(m["prior_receipt_sha256"])
            hexpin(m["opening_attempt_sha256"])
            require(type(m["opening_run_id"]) is str and m["opening_run_id"]
                    and m["opening_run_id"] != m["run_id"], "Wrong opening run")
            require(not any(self.paths[k].is_relative_to(self.output) or self.output.is_relative_to(self.paths[k])
                            for k in ("checkpoint_path", "receipt_path")), "Resume overlaps checkpoint")
        require(not self.output.exists(), "Fresh output required")
        self.binding = Binding(m)
        self.state, self.verified, self.receipt, self.validated_sha = "initial", None, None, None
        self.modules = {p: digest(p.read_bytes()) for p in
                        (SCRIPTS / "fuseki_dev.py", SCRIPTS / "rdf_dataset.py",
                         SCRIPTS / "validate_semantics.py", SCRIPTS / "fuseki_local.py")}
        require(Path(rdf.__file__).resolve() == SCRIPTS / "rdf_dataset.py", "Untrusted RDF module")
        self.recheck()
        tracked = git(self.source, "ls-tree", "-rz", "--name-only", c["product_head"], "--", "ontology/dataset/")
        names = [n.decode("utf-8") for n in tracked.split(b"\0") if n and n.endswith(b".trig")]
        require(names and c["source_file"] in names, "Target is not tracked assembly input")
        self.trig_paths = tuple(self.source / name for name in sorted(names))
        for name, path in zip(sorted(names), self.trig_paths):
            normalized(str(path))
            blob = git(self.source, "show", c["product_head"] + ":" + name)
            require(path.read_text(encoding="utf-8") == blob.decode("utf-8").replace("\r\n", "\n"),
                    "Assembly input differs from Git")
        self.input_pins = {path: digest(path.read_bytes()) for path in self.trig_paths}
        self.base = rdf.assemble_dataset(trig_paths=self.trig_paths)
        self.base_bytes = canonical(self.base)
        require(digest(self.base_bytes) == c["baseline_nquads_sha256"]
                and self.paths["baseline_path"].read_bytes() == self.base_bytes, "Wrong canonical baseline")
        values = [o for o in self.base.graph(URIRef(c["graph"])).objects(URIRef(c["subject"]), URIRef(c["predicate"]))
                  if isinstance(o, Literal) and o.language == c["language"]]
        require(len(values) == 1, "Nonunique old literal")
        self.old = str(values[0])
        require(digest(self.old.encode()) == c["old_sha256"] and self.old.count(c["lexical_old"]) == 1,
                "Old lexical pin mismatch")
        self.new = self.old.replace(c["lexical_old"], c["lexical_new"], 1)
        old = owner(self.base, c, self.old)
        owned = Dataset(default_union=False)
        rdf.parse_trig_path(owned, self.source / c["source_file"])
        owner(owned, c, self.old)
        for other in self._other_files():
            require(not list(other.quads((URIRef(c["subject"]), RDF.type, None, None)))
                    and not list(other.quads((URIRef(c["subject"]), URIRef(c["predicate"]), old, None))),
                    "Owner/old term appears in another file")
        self.expected = copy_dataset(self.base)
        graph = self.expected.graph(URIRef(c["graph"]))
        graph.remove((URIRef(c["subject"]), URIRef(c["predicate"]), old))
        graph.add((URIRef(c["subject"]), URIRef(c["predicate"]), Literal(self.new, lang="en", normalize=False)))
        self.expected_bytes = canonical(self.expected)
        self.operation = {"material": c, "old_sha256": digest(self.old.encode()),
                          "new_sha256": digest(self.new.encode()), "dataset_sha256": digest(self.expected_bytes)}
        self.verify(self.base, edited=False)
        # Bind the concrete byte patch to the RDF operation before side effects.
        # Export still independently reassembles the actual candidate via the API.
        preflight = Dataset(default_union=False)
        target_path = self.source / c["source_file"]
        patched = target_path.read_bytes().replace(c["raw_old"].encode(), c["raw_new"].encode(), 1)
        for path in self.trig_paths:
            if path == target_path:
                text = patched.decode("utf-8").replace("\r\n", "\n").replace("\r", "\n")
                preflight.parse(data=text, format="trig", publicID=path.as_uri())
            else:
                rdf.parse_trig_path(preflight, path)
        self.verify(preflight)
        # Refuse malformed/stale resume authorization before any private output or JVM.
        if m["phase"] == "resume":
            self.checkpoint()
        self.recheck()

    def _other_files(self):
        for path in self.trig_paths:
            if path != self.source / self.c["source_file"]:
                dataset = Dataset(default_union=False)
                rdf.parse_trig_path(dataset, path)
                yield dataset

    def recheck(self):
        normalized(str(self.path))
        for path in self.paths.values():
            normalized(str(path))
        require(digest(self.path.read_bytes()) == self.sha, "Manifest drift")
        self.binding.check()
        identity(self.source, self.c["product_head"], self.c["product_tree"])
        for path, sha in self.modules.items():
            normalized(str(path))
            require(digest(path.read_bytes()) == sha, "Trusted tool drift")
        for path in getattr(self, "trig_paths", ()):
            normalized(str(path))
        for path, sha in getattr(self, "input_pins", {}).items():
            require(digest(path.read_bytes()) == sha, "Assembly input bytes drifted")
        require(not any(k.upper() in JVM_ENV for k in os.environ), "JVM environment override")
        for key in ("java", "jar"):
            require(digest(self.paths[key].read_bytes()) == self.m[key + "_sha256"], "Executable pin mismatch")
        require(self.m["jar_sha256"] == JAR_SHA256, "Require supported Fuseki 6.2.0 JAR")
        original = (self.source / self.c["source_file"]).read_bytes()
        require(digest(original) == self.c["source_file_sha256"]
                and original.count(self.c["raw_old"].encode()) == 1, "Source/anchor drift")
        if hasattr(self, "base_bytes"):
            require(self.paths["baseline_path"].read_bytes() == self.base_bytes, "Baseline drift")

    def verify(self, dataset, edited=True):
        owner(dataset, self.c, self.new if edited else self.old)
        require(canonical(dataset) == (self.expected_bytes if edited else self.base_bytes), "Dataset-wide RDF parity failure")

    def checkpoint(self):
        nq, raw = self.paths["checkpoint_path"].read_bytes(), self.paths["receipt_path"].read_bytes()
        receipt = authorize_receipt(raw, nq, self.m, self.operation, self.binding.sha)
        require(nq == self.expected_bytes, "Checkpoint differs from authorized delta")
        return nq, receipt

    def write(self, path, data):
        normalized(str(path))
        require(path.is_relative_to(self.output), "Write outside private output")
        path.parent.mkdir(parents=True, exist_ok=True)
        normalized(str(path))
        with path.open("xb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())

    @contextmanager
    def server(self, nq, label):
        child = Server(self.paths["java"], self.paths["jar"], nq, self.output, label)
        try:
            self.recheck()
            child.start()
            yield child
        finally:
            try:
                child.stop()
            finally:
                self.write(self.output / (label + "-server.json"), packed({
                    "pid": child.process.pid if child.process is not None else None,
                    "port": getattr(child, "port", None), "updates": child.updates,
                    "update_status": child.update_status, "cleanup": child.cleanup,
                    "returncode": child.process.returncode if child.process is not None else None,
                }))

    def execute(self, name, args):
        arguments(name, args)
        self.recheck()
        allowed = {"draft_open": ("open", "initial"), "draft_resume": ("resume", "initial"),
                   "draft_validate": ("resume", "resumed"), "draft_export": ("resume", "validated")}
        require((self.m["phase"], self.state) == allowed[name], "Wrong phase/order")
        receipt = None
        if self.m["phase"] == "resume":
            _, receipt = self.checkpoint()
            require(self.receipt is None or receipt == self.receipt, "Checkpoint drift")
        if self.state == "initial":
            require(not self.output.exists(), "Output is not fresh")
            self.output.mkdir(parents=True, exist_ok=False)
        self.state = "failed"
        result = {"tool": name, "run_id": self.m["run_id"], "attempt_sha256": self.binding.sha,
                  "head": self.m["native_head"], "tree": self.m["native_tree"],
                  "operation_sha256": digest(packed(self.operation))}
        try:
            if name in ("draft_open", "draft_resume"):
                nq = self.paths["baseline_path" if name == "draft_open" else "checkpoint_path"]
                with self.server(nq, name) as child:
                    actual = live(child)
                    self.verify(actual, edited=name == "draft_resume")
                    if name == "draft_open":
                        self.recheck()
                        # Immediately preceding full live fingerprint/owner verification is mandatory.
                        self.verify(live(child), edited=False)
                        self.recheck()  # Native binding and byte pins after the full live read.
                        child.post(update_text(self.c, self.old, self.new), update=True)
                        actual = live(child)
                        self.verify(actual)
                    self.verified = actual
                    result.update(pid=child.process.pid, port=child.port, updates=child.updates,
                                  update_status=child.update_status, dataset_sha256=digest(canonical(actual)))
                self.recheck()
                if name == "draft_open":
                    self.receipt = {"schema": 1, "opening_run_id": self.m["run_id"],
                                    "opening_native_head": self.m["native_head"], "opening_native_tree": self.m["native_tree"],
                                    "opening_attempt_sha256": self.binding.sha, "operation": self.operation,
                                    "operation_sha256": digest(packed(self.operation)), "dataset_sha256": digest(canonical(actual))}
                    self.write(self.paths["checkpoint_path"], canonical(actual))
                    self.write(self.paths["receipt_path"], packed(self.receipt))
                    self.state = "opened"
                else:
                    self.receipt, self.state = receipt, "resumed"
                result.update(receipt_sha256=digest(packed(self.receipt)), cleanup=child.cleanup)
            elif name == "draft_validate":
                self.verify(self.verified)
                # Existing validator: full RDFS inference and meta-SHACL defaults, never cached.
                import validate_semantics
                require(Path(validate_semantics.__file__).resolve() == SCRIPTS / "validate_semantics.py", "Untrusted validator")
                conforms, _, report = validate_semantics.validate_dataset(self.verified)
                self.write(self.output / "validation.txt", report.encode("utf-8"))
                require(conforms, "Semantic validation failed")
                self.verify(self.verified)
                self.recheck()
                self.validated_sha = digest(canonical(self.verified))
                self.state = "validated"
                result.update(dataset_sha256=self.validated_sha, contract="passed", shacl="passed")
            else:
                result.update(self.export())
                self.state = "exported"
            self.recheck()
            result["status"] = "passed"
            self.write(self.output / (name + ".json"), packed(result))
            return result
        except BaseException:
            self.state = "failed"
            raise

    @lexical_source_terms()
    def export(self):
        self.recheck()
        self.verify(self.verified)
        require(self.validated_sha is not None and digest(canonical(self.verified)) == self.validated_sha,
                "Export requires exact validated fingerprint")
        original = (self.source / self.c["source_file"]).read_bytes()
        patched = original.replace(self.c["raw_old"].encode(), self.c["raw_new"].encode(), 1)
        candidate = self.output / "export" / self.c["source_file"]
        require(not (self.output / "export").exists() and not (self.output / "authored.diff").exists(),
                "Export already exists")
        # Staging is never an eligible export and is removed even on refusal.
        with tempfile.TemporaryDirectory(prefix=".draft-stage-", dir=self.output) as directory:
            staged = Path(directory) / "candidate.trig"
            self.write(staged, patched)
            require(staged.read_bytes() == patched, "Staged bytes differ")
            paths = tuple(staged if p == self.source / self.c["source_file"] else p for p in self.trig_paths)
            rebuilt = rdf.assemble_dataset(trig_paths=paths)
            self.verify(rebuilt)
            require(digest(canonical(rebuilt)) == self.validated_sha, "Candidate differs from validated live RDF")
            self.recheck()
            normalized(str(candidate))
            candidate.parent.mkdir(parents=True, exist_ok=False)
            staged.rename(candidate)  # Same filesystem; publish only the verified exact bytes.
        diff = "".join(difflib.unified_diff(original.decode("utf-8").splitlines(True), patched.decode("utf-8").splitlines(True),
                                         fromfile="a/" + self.c["source_file"], tofile="b/" + self.c["source_file"]))
        self.write(self.output / "authored.diff", diff.encode("utf-8"))
        return {"export_path": str(candidate), "source_sha256": digest(patched),
                "diff_path": str(self.output / "authored.diff"), "dataset_sha256": self.validated_sha}


async def serve(workflow):
    # The operator supplies the SDK in its isolated CAC environment, not Product tests.
    from mcp.server.lowlevel import Server as MCPServer
    from mcp.server.stdio import stdio_server
    from mcp import types

    async def list_tools(_ctx, _params):
        try:
            workflow.recheck()
        except Exception:
            return types.ListToolsResult(tools=[])
        return types.ListToolsResult(tools=[
            types.Tool(name=name, description="Fixed operator-authorized " + name,
                       inputSchema={"type": "object", "properties": {}, "additionalProperties": False})
            for name in TOOLS])

    async def call_tool(_ctx, params):
        try:
            args = {} if params.arguments is None else params.arguments
            arguments(params.name, args)
            result = workflow.execute(params.name, args)
        except Exception:
            return types.CallToolResult(isError=True, content=[types.TextContent(type="text", text='{"status":"refused"}')])
        return types.CallToolResult(isError=False, content=[types.TextContent(type="text", text=json.dumps(result, sort_keys=True))])

    app = MCPServer("fuseki-private-draft", on_list_tools=list_tools, on_call_tool=call_tool)
    async with stdio_server() as (reader, writer):
        await app.run(reader, writer, app.create_initialization_options())


def main():
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--manifest-sha256", required=True)
    args = parser.parse_args()
    try:
        asyncio.run(serve(Workflow(args.manifest, args.manifest_sha256)))
    except Exception:
        print("Workflow startup/transport refused; operator must inspect trusted inputs.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
