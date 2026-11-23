#!/usr/bin/env python3
"""Private, run-bound stdio semantic reads. No writing or network operations."""
from __future__ import annotations

import argparse
from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
from typing import Any, Callable
from urllib.parse import urlsplit

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
GRAPH = "https://w3id.org/project-chemie-digital/graph/"
RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
PREF_LABEL = "http://www.w3.org/2004/02/skos/core#prefLabel"
BUDGETS = {"compact": 16 * 1024, "normal": 32 * 1024, "full": 64 * 1024}
_LITERAL_LIMITS = {"compact": 120, "normal": 600, "full": 2400}
_PEDAGOGICAL_RELATIONS = {CD + n for n in ("hasDefinition", "hasExample", "hasExercise", "hasFormula")}
_SHA = re.compile(r"[0-9a-f]{40}\Z")
IDENTITY_KEYS = ("active_worker_outcome_token", "active_agent_attempt",
                 "active_agent_artifact_dir", "active_worker_outcome_path")
MODULE_PATHS = ("scripts/rdf_dataset.py", "scripts/course_path_selection.py")


class DiscoveryError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def _fail(code: str, message: str) -> None:
    raise DiscoveryError(code, message)


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _measure(result: dict) -> dict:
    result["response_bytes"] = 0
    while True:
        size = len(canonical_json(result).encode("utf-8"))
        if result["response_bytes"] == size:
            return result
        result["response_bytes"] = size


def _error(code: str, message: str, detail: str = "compact") -> dict:
    return _measure({"schema": "chemie-digital.semantic-discovery.v1", "status": "error",
                     "error": {"code": code, "message": message}, "read_only": True,
                     "detail": detail, "content_edit_authorized": False})


def _options(limit: int, detail: str) -> None:
    if type(limit) is not int or not 1 <= limit <= 50:
        _fail("INVALID_ARGUMENT", "limit must be an integer in 1..50")
    if not isinstance(detail, str) or detail not in BUDGETS:
        _fail("INVALID_ARGUMENT", "detail must be compact, normal or full")


def _iri(value: str, prefix: str | None = None) -> str:
    if not isinstance(value, str) or not value or len(value) > 512:
        _fail("INVALID_ARGUMENT", "Expected a bounded absolute HTTP(S) IRI")
    try:
        url = urlsplit(value)
        valid = (url.scheme in {"http", "https"} and url.hostname and not url.username
                 and not url.password and not any(c.isspace() or c in '<>"{}\\' for c in value))
    except ValueError:
        valid = False
    if not valid or (prefix is not None and not value.startswith(prefix)):
        _fail("INVALID_ARGUMENT", "IRI is outside the supported identity boundary")
    return value


def _physical(path: Path, *, directory: bool = False) -> Path:
    """Reject links/reparse points in every existing component, including ancestors."""
    if not path.is_absolute() or path != Path(os.path.abspath(path)):
        _fail("UNAUTHORIZED_ROOT", "Physical absolute paths are required")
    try:
        for part in (*reversed(path.parents), path):
            info = part.lstat()
            if stat.S_ISLNK(info.st_mode) or getattr(info, "st_file_attributes", 0) & 0x400:
                _fail("UNAUTHORIZED_ROOT", "Linked or redirected paths are not allowed")
        info = path.stat()
        if not (stat.S_ISDIR(info.st_mode) if directory else stat.S_ISREG(info.st_mode)):
            _fail("UNAUTHORIZED_ROOT", "Path kind rejected")
        if path.resolve(strict=True) != path:
            _fail("UNAUTHORIZED_ROOT", "Noncanonical path rejected")
        return path
    except OSError:
        _fail("UNAUTHORIZED_ROOT", "Physical path unavailable")


def _same_typed(left: Any, right: Any) -> bool:
    return type(left) is type(right) and left == right


class Binding:
    """Launch authority is native state + attempt, never a tool argument.

    Code is loaded only from this script's reviewed checkout. The separate data
    checkout supplies bytes, not import paths. Resident code is checked each time.
    """

    def __init__(self, state_path: str, run_id: str, worktree: str, expected_head: str):
        self.argv = tuple(sys.argv)
        self.environment = os.environ.get("CF_AGENTCTL_ATTEMPT_IDENTITY", "")
        self.state_path = _physical(Path(state_path))
        self.root = _physical(Path(worktree), directory=True)
        self.code_root = _physical(Path(__file__).absolute().parents[1], directory=True)
        if not _SHA.fullmatch(expected_head) or not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,127}", run_id):
            _fail("BINDING_REJECTED", "Invalid launch identity")
        self.run_id, self.sha = run_id, expected_head
        try:
            self.identity = json.loads(self.environment)
        except (ValueError, TypeError):
            _fail("BINDING_REJECTED", "Native attempt identity required")
        if (type(self.identity) is not list or len(self.identity) != 4
                or type(self.identity[0]) is not str or not self.identity[0]
                or type(self.identity[1]) is not int or self.identity[1] < 1
                or any(type(v) is not str or not v for v in self.identity[2:])):
            _fail("BINDING_REJECTED", "Full type-exact native attempt identity required")
        git = shutil.which("git")
        if not git:
            _fail("BINDING_REJECTED", "Git unavailable")
        self.git = _physical(Path(git).absolute())
        self.locations = tuple((p.stat().st_dev, p.stat().st_ino)
                               for p in (self.root, self.code_root, self.state_path))
        self.resident = self._code_bytes()
        self.envelope = None
        self.cache = None
        self.check()
        self.semantic = self._module("rdf_dataset")
        self.selector = self._module("course_path_selection")
        self.check()

    def _git(self, *args: str) -> str:
        # No inherited Git routing/configuration, pagers, hooks, or optional writes.
        env = {k: v for k, v in os.environ.items() if not k.upper().startswith("GIT_")}
        env.update(GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull,
                   GIT_TERMINAL_PROMPT="0", GIT_OPTIONAL_LOCKS="0")
        try:
            result = subprocess.run(
                [str(self.git), "--no-pager", "-c", "core.fsmonitor=false", "-c",
                 "core.untrackedCache=false", "-C", str(self.root), *args],
                env=env, capture_output=True, timeout=15, check=True)
            if len(result.stdout) > 8 * 1024 * 1024:
                _fail("BINDING_REJECTED", "Git result exceeded bound")
            return result.stdout.decode("utf-8", errors="strict")
        except (OSError, ValueError, subprocess.SubprocessError):
            _fail("BINDING_REJECTED", "Pinned checkout inspection failed")

    def _code_bytes(self) -> tuple:
        paths = ("scripts/cac_semantic_read.py", *MODULE_PATHS)
        return tuple(sha256(_physical(self.code_root / p).read_bytes()).hexdigest() for p in paths)

    def _module(self, name: str):
        # These two reviewed modules have no Product sibling imports. Never reuse
        # a preloaded module of the same name or import from the data checkout.
        module_name = "_pcd_semantic_" + name
        spec = importlib.util.spec_from_file_location(module_name, self.code_root / "scripts" / (name + ".py"))
        if spec is None or spec.loader is None:
            _fail("BINDING_REJECTED", "Trusted Product module unavailable")
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        try:
            spec.loader.exec_module(module)
        except BaseException:
            sys.modules.pop(module_name, None)
            raise
        return module

    def check(self) -> tuple:
        if tuple(sys.argv) != self.argv or os.environ.get("CF_AGENTCTL_ATTEMPT_IDENTITY", "") != self.environment:
            _fail("BINDING_REJECTED", "Launch binding changed")
        _physical(self.root, directory=True)
        _physical(self.code_root, directory=True)
        _physical(self.state_path)
        if tuple((p.stat().st_dev, p.stat().st_ino)
                 for p in (self.root, self.code_root, self.state_path)) != self.locations:
            _fail("SNAPSHOT_CHANGED", "Bound physical checkout or state file changed")
        try:
            if self.state_path.stat().st_size > 1024 * 1024:
                _fail("BINDING_REJECTED", "Native state exceeded bound")
            raw = self.state_path.read_bytes()
            state = json.loads(raw)
            # Native first attempts have only base_sha until a head is recorded.
            # An explicit head (even malformed) must never fall back to the base.
            selected_sha = None
            if type(state) is dict:
                selected_sha = state.get("head_sha")
                if selected_sha is None:
                    selected_sha = state.get("base_sha")
            valid = (type(selected_sha) is str and _SHA.fullmatch(selected_sha)
                     and selected_sha == self.sha
                     and type(state) is dict and state.get("status") == "running"
                     and state.get("project") == "project-chemie-digital"
                     and state.get("run_id") == self.run_id
                     and state.get("worktree") == str(self.root)
                     and state.get("run_dir") == str(self.state_path.parent)
                     and self.state_path.name == "state.json"
                     and all(_same_typed(state.get(k), v) for k, v in zip(IDENTITY_KEYS, self.identity)))
            if not valid:
                _fail("BINDING_REJECTED", "Native run or attempt binding rejected")
        except (OSError, ValueError, TypeError):
            _fail("BINDING_REJECTED", "Native state unavailable")
        if self.envelope is None:
            self.envelope = raw
        elif raw != self.envelope:
            _fail("SNAPSHOT_CHANGED", "Native run state changed")
        if self._git("rev-parse", "--show-toplevel").strip() != str(self.root).replace("\\", "/"):
            _fail("UNAUTHORIZED_ROOT", "Data checkout root rejected")
        if self._git("rev-parse", "--verify", "HEAD").strip() != self.sha:
            _fail("STALE_HEAD", "Bound Product HEAD changed")
        if self._git("status", "--porcelain=v1", "--untracked-files=all", "--ignore-submodules=none"):
            _fail("DIRTY_WORKTREE", "Bound Product worktree is not clean")
        if self._code_bytes() != self.resident:
            _fail("BINDING_REJECTED", "Resident implementation changed")
        for index, relative in enumerate(MODULE_PATHS, 1):
            if sha256(_physical(self.root / relative).read_bytes()).hexdigest() != self.resident[index]:
                _fail("BINDING_REJECTED", "Trusted Product module parity rejected")
        # Candidate code and reviewed code must be byte-identical when present.
        candidate = self.root / "scripts/cac_semantic_read.py"
        if candidate.exists() and sha256(_physical(candidate).read_bytes()).hexdigest() != self.resident[0]:
            _fail("BINDING_REJECTED", "Resident server parity rejected")
        return self._manifest()

    def _manifest(self) -> tuple:
        source_dir = _physical(self.root / "ontology" / "dataset", directory=True)
        paths = tuple(sorted(source_dir.glob("*.trig")))
        # Ignored additions and redirected subdirectories must not evade status.
        for directory, directories, files in os.walk(source_dir, followlinks=False):
            for name in directories:
                _physical(Path(directory) / name, directory=True)
            for name in files:
                path = Path(directory) / name
                if path.suffix.casefold() == ".trig" and path not in paths:
                    _fail("DATASET_INVALID", "Unexpected TriG source outside the canonical source set")
        tracked = set(self._git("ls-files", "-z", "--", "ontology/dataset", *MODULE_PATHS).split("\0"))
        if not paths:
            _fail("DATASET_INVALID", "Canonical TriG source set is missing or empty")
        expected = {p for p in tracked if p.startswith("ontology/dataset/")
                    and Path(p).suffix.casefold() == ".trig"}
        if expected != {p.relative_to(self.root).as_posix() for p in paths}:
            _fail("DATASET_INVALID", "Canonical TriG source set differs from the pinned manifest")
        digest = sha256()
        for path in (*paths, *(self.root / p for p in MODULE_PATHS)):
            relative = path.relative_to(self.root).as_posix()
            if relative not in tracked:
                _fail("DATASET_INVALID", "Semantic sources must belong to the pinned Git source set")
            _physical(path)
            content = path.read_bytes()
            # Status alone can miss assume-unchanged/skip-worktree files. Compare
            # explicit allowed blobs too, tolerating only Git's CRLF checkout form.
            pinned = self._git("cat-file", "blob", self.sha + ":" + relative).encode("utf-8")
            if content.replace(b"\r\n", b"\n") != pinned.replace(b"\r\n", b"\n"):
                _fail("DIRTY_WORKTREE", "Semantic source differs from the pinned Git blob")
            digest.update(relative.encode("utf-8") + b"\0")
            digest.update(content)
            digest.update(b"\0")
        return digest.hexdigest(), paths

    def dataset(self, manifest: tuple) -> tuple:
        if self.cache is None:
            try:
                ds = self.semantic.assemble_dataset(trig_paths=manifest[1])
                self.cache = (manifest, ds, self.semantic.dataset_fingerprint(ds))
            except Exception:
                _fail("DATASET_INVALID", "Product RDF assembly or contract validation failed")
        if self.cache[0] != manifest:
            self.cache = None
            _fail("SNAPSHOT_CHANGED", "Semantic source set changed")
        return self.cache[1], self.selector, self.cache[2]


def _page(items: list, limit: int) -> dict:
    return {"items": items[:limit], "returned_count": min(limit, len(items)),
            "total_count": len(items), "truncated": len(items) > limit}


def _term(term: Any, detail: str) -> dict:
    from rdflib import URIRef, Literal
    if isinstance(term, URIRef):
        return {"kind": "iri", "value": str(term)}
    if isinstance(term, Literal):
        value = str(term)
        maximum = _LITERAL_LIMITS[detail]
        return {"kind": "literal", "value": value[:maximum], "language": term.language,
                "datatype": str(term.datatype) if term.datatype else None,
                "full_length": len(value), "truncated": len(value) > maximum}
    _fail("DATASET_INVALID", "Blank-node resource statements are not supported by discovery")


def _quad_key(quad: tuple) -> tuple:
    from rdflib import URIRef, Literal
    s, p, o, g = quad
    if (not all(isinstance(term, URIRef) for term in (s, p, g))
            or not isinstance(o, (URIRef, Literal))):
        _fail("DATASET_INVALID", "Blank-node resource statements are not supported by discovery")
    kind = "iri" if isinstance(o, URIRef) else "literal"
    return (str(g), str(s), str(p), str(o), kind, getattr(o, "language", "") or "",
            str(getattr(o, "datatype", "") or ""))


def _statement(quad: tuple, detail: str) -> dict:
    s, p, o, g = quad
    return {"subject": str(s), "predicate": str(p), "object": _term(o, detail), "graph_id": str(g)}


def _quads(ds: Any, subject: Any = None, graph_id: str | None = None) -> list:
    from rdflib import URIRef
    return sorted((q for q in ds.quads((subject, None, None, None))
                   if not str(q[3]).startswith(GRAPH + "shapes/")
                   and (graph_id is None or q[3] == URIRef(graph_id))), key=_quad_key)


def _record(ds: Any, subject: Any, detail: str, limit: int, graph_id: str | None = None) -> dict:
    rows = [_statement(q, detail) for q in _quads(ds, subject, graph_id)
            if str(q[1]) in {RDF_TYPE, PREF_LABEL}]
    return {"resource_id": str(subject), "metadata": _page(rows, limit)}


def _resources(ds: Any, type_iri: str | None, graph_id: str | None) -> list:
    from rdflib import RDF, URIRef
    return sorted({s for s, p, o, g in ds.quads((None, RDF.type, None, None))
                   if isinstance(s, URIRef) and str(s).startswith(EX) and isinstance(o, URIRef)
                   and not str(g).startswith(GRAPH + "shapes/")
                   and (type_iri is None or o == URIRef(type_iri))
                   and (graph_id is None or str(g) == graph_id)}, key=str)


def _run(binding: Binding, tool: str, detail: str, limit: int, build: Callable) -> dict:
    safe_detail = detail if isinstance(detail, str) and detail in BUDGETS else "compact"
    try:
        before = binding.check()
        try:
            _options(limit, detail)
            ds, selector, fingerprint = binding.dataset(before)
            data = build(ds, selector)
            result = {"schema": "chemie-digital.semantic-discovery.v1", "tool": tool,
                      "status": "ok", "product_sha": binding.sha, "dataset_fingerprint": fingerprint,
                      "source_signature": before[0], "detail": detail, "limit": limit,
                      "read_only": True, "content_edit_authorized": False, **data}
            _measure(result)
            while result["response_bytes"] > BUDGETS[detail] - 256 and result.get("items"):
                result["items"].pop()
                result["returned_count"] = len(result["items"])
                result["truncated"] = True
                _measure(result)
            if result["response_bytes"] > BUDGETS[detail] - 256:
                _fail("RESPONSE_TOO_LARGE", "Required metadata exceeds the response budget")
        finally:
            if binding.check() != before:
                _fail("SNAPSHOT_CHANGED", "Product state or semantic sources changed during query")
        return result
    except DiscoveryError as exc:
        binding.cache = None
        return _error(exc.code, str(exc), safe_detail)
    except (OSError, ValueError, TypeError):
        binding.cache = None
        return _error("DATASET_INVALID", "Semantic source or query contract rejected", safe_detail)
    except Exception:
        binding.cache = None
        return _error("INTERNAL_ERROR", "Discovery failed without returning partial data", safe_detail)


def semantic_inventory(binding: Binding, *, type_iri: str | None = None,
                       graph_id: str | None = None, limit: int = 20, detail: str = "compact") -> dict:
    def build(ds, selector):
        if type_iri is not None:
            _iri(type_iri)
        if graph_id is not None:
            _iri(graph_id, GRAPH)
        subjects = _resources(ds, type_iri, graph_id)
        from rdflib import RDF, URIRef
        counts: dict[str, set] = {}
        for subject in subjects:
            for s, p, o, g in _quads(ds, subject, graph_id):
                if p == RDF.type and isinstance(o, URIRef):
                    counts.setdefault(str(o), set()).add(s)
        return {**_page([_record(ds, s, detail, limit, graph_id) for s in subjects[:limit]], limit),
                "total_count": len(subjects), "truncated": len(subjects) > limit,
                "overview": {CD + n: len(counts.get(CD + n, set())) for n in
                             ("LearningUnit", "LearningPath", "PathStep", "SceneDefinition")},
                "type_counts": _page([{"type_iri": t, "count": len(counts[t])}
                                      for t in sorted(counts)], limit)}
    return _run(binding, "inventory", detail, limit, build)


def semantic_search(binding: Binding, *, query: str = "", resource_id: str | None = None,
                    type_iri: str | None = None, graph_id: str | None = None,
                    predicate_iri: str | None = None, related_resource_id: str | None = None,
                    limit: int = 20, detail: str = "compact") -> dict:
    def build(ds, selector):
        from rdflib import URIRef
        if not isinstance(query, str) or len(query) > 512:
            _fail("INVALID_ARGUMENT", "query must be text of at most 512 characters")
        for value, prefix in ((resource_id, EX), (type_iri, None), (graph_id, GRAPH),
                              (predicate_iri, None), (related_resource_id, EX)):
            if value is not None:
                _iri(value, prefix)
        if (predicate_iri is None) != (related_resource_id is None):
            _fail("INVALID_ARGUMENT", "Relationship filter requires predicate and related resource")
        predicate = URIRef(predicate_iri) if predicate_iri is not None else None
        related = URIRef(related_resource_id) if related_resource_id is not None else None
        found = []
        for subject in _resources(ds, type_iri, graph_id):
            if resource_id is not None and str(subject) != resource_id:
                continue
            quads = _quads(ds, subject, graph_id)
            matches = [q for q in quads if str(q[1]) == PREF_LABEL
                       and query.casefold() in str(q[2]).casefold()]
            if query and query.casefold() not in str(subject).casefold() and not matches:
                continue
            edges = [q for q in quads if isinstance(q[2], URIRef)
                     and q[1] == predicate and q[2] == related]
            if predicate_iri is not None and not edges:
                continue
            found.append((subject, edges))
        rows = []
        for subject, edges in found[:limit]:
            row = _record(ds, subject, detail, limit, graph_id)
            if predicate_iri is not None:
                row["matched_relations"] = _page([_statement(q, detail) for q in edges], limit)
            rows.append(row)
        return {**_page(rows, limit), "total_count": len(found), "truncated": len(found) > limit}
    return _run(binding, "search", detail, limit, build)


def semantic_inspect(binding: Binding, *, resource_id: str, graph_id: str | None = None,
                     limit: int = 20, detail: str = "compact") -> dict:
    def build(ds, selector):
        from rdflib import URIRef
        subject = URIRef(_iri(resource_id, EX))
        if graph_id is not None:
            _iri(graph_id, GRAPH)
        outgoing = _quads(ds, subject, graph_id)
        if not outgoing:
            _fail("RESOURCE_NOT_FOUND", "Resource has no canonical statements in the requested scope")
        rows = outgoing
        if detail != "compact":
            rows = sorted(set(rows + [q for q in _quads(ds, graph_id=graph_id)
                                      if q[2] == subject]), key=_quad_key)
        else:
            rows = [q for q in rows if str(q[1]) in {RDF_TYPE, PREF_LABEL}
                    or isinstance(q[2], URIRef)]
        return {"resource_id": resource_id,
                **_page([_statement(q, detail) for q in rows[:limit]], limit),
                "total_count": len(rows), "truncated": len(rows) > limit}
    return _run(binding, "inspect", detail, limit, build)


def learning_path_inspect(binding: Binding, *, path_id: str, path_graph_id: str,
                         limit: int = 20, detail: str = "compact") -> dict:
    def build(ds, selector):
        from rdflib import RDF, URIRef, Literal
        path = URIRef(_iri(path_id, EX))
        gid = URIRef(_iri(path_graph_id, GRAPH))
        graph = ds.graph(gid)
        if (path, RDF.type, URIRef(CD + "LearningPath")) not in graph:
            _fail("PATH_NOT_FOUND", "Exact LearningPath and named-graph pair not found")
        units = sorted(set(graph.objects(path, URIRef(CD + "forLearningUnit"))), key=str)
        if len(units) != 1 or not isinstance(units[0], URIRef):
            _fail("DATASET_INVALID", "Path must reference exactly one LearningUnit")
        if not any(r.path_id == path_id and r.path_graph_id == path_graph_id
                   for r in selector.available_path_references(ds, str(units[0]))):
            _fail("PATH_NOT_FOUND", "Product selector did not resolve the exact path pair")
        steps = []
        for step in set(graph.objects(path, URIRef(CD + "hasStep"))):
            if (not isinstance(step, URIRef)
                    or (step, RDF.type, URIRef(CD + "PathStep")) not in graph):
                _fail("DATASET_INVALID", "Path must reference typed IRI PathSteps in its named graph")
            pos = list(graph.objects(step, URIRef(CD + "position")))
            if (len(pos) != 1 or not isinstance(pos[0], Literal)
                    or type(pos[0].toPython()) is not int or pos[0].toPython() < 1):
                _fail("AMBIGUOUS_POSITION", "PathStep requires one positive integer position")
            steps.append((int(pos[0]), step))
        steps.sort(key=lambda pair: (pair[0], str(pair[1])))
        if not steps or [p for p, s in steps] != list(range(1, len(steps) + 1)):
            _fail("AMBIGUOUS_POSITION", "PathStep positions must be nonempty, unique and contiguous")
        missing_scenes = 0
        unit_resolved = any(ds.quads((units[0], RDF.type, URIRef(CD + "LearningUnit"), None)))
        unresolved = set() if unit_resolved else {str(units[0])}
        rows = []
        for position, step in steps:
            resources = sorted(set(graph.objects(step, URIRef(CD + "usesResource"))), key=str)
            scenes = sorted(set(graph.objects(step, URIRef(CD + "usesScene"))), key=str)
            if any(not isinstance(value, URIRef) for value in resources + scenes):
                _fail("DATASET_INVALID", "Resource and scene links must use exact IRIs")
            missing_scenes += not scenes
            edges = [q for r in resources for q in _quads(ds, r)
                     if str(q[1]) in _PEDAGOGICAL_RELATIONS]
            if any(not isinstance(q[2], URIRef) for q in edges):
                _fail("DATASET_INVALID", "Pedagogical relationships must reference exact resource IRIs")
            references = set(resources) | {q[2] for q in edges}
            broken = [str(r) for r in references
                      if not any(str(q[1]) == RDF_TYPE for q in _quads(ds, r))]
            broken += [str(s) for s in scenes if not any(ds.quads((s, RDF.type, URIRef(CD + "SceneDefinition"), None)))]
            unresolved.update(broken)
            if len(scenes) > 1:
                _fail("DATASET_INVALID", "PathStep has multiple scene bindings")
            if len(rows) >= limit:
                continue
            links = [(step, URIRef(CD + "usesResource"), r, gid) for r in resources]
            links += [(step, URIRef(CD + "usesScene"), s, gid) for s in scenes]
            row = {"step_id": str(step), "position": position, "graph_id": str(gid),
                   "bindings": _page([_statement(q, detail) for q in sorted(links, key=_quad_key)], limit),
                   "resource_count": len(resources), "scene_ids": [str(s) for s in scenes],
                   "unresolved_ids": _page(sorted(broken), limit)}
            if detail != "compact":
                row["resources"] = _page([_record(ds, r, detail, limit) for r in resources[:limit]], limit)
                row["resources"].update(total_count=len(resources), truncated=len(resources) > limit)
                row["resource_relations"] = _page([_statement(q, detail) for q in sorted(edges, key=_quad_key)], limit)
            rows.append(row)
        obstacles = []
        if missing_scenes:
            obstacles.append("MISSING_SCENE_BINDINGS")
        if unresolved:
            obstacles.append("UNRESOLVED_REFERENCES")
        return {"path_id": path_id, "path_graph_id": path_graph_id,
                "learning_unit": _statement((path, URIRef(CD + "forLearningUnit"), units[0], gid), detail),
                "learning_unit_resolved": unit_resolved,
                **_page(rows, limit), "total_count": len(steps), "truncated": len(steps) > limit,
                "missing_scene_count": missing_scenes, "unresolved_ids": _page(sorted(unresolved), limit),
                "obstacles": obstacles, "validation": "not_run", "compilation": "not_run"}
    return _run(binding, "learning_path_inspect", detail, limit, build)


FUNCTIONS = {f.__name__: f for f in
             (semantic_inventory, semantic_search, semantic_inspect, learning_path_inspect)}


def tool_schemas() -> dict:
    text = {"type": "string", "minLength": 1, "maxLength": 512}
    common = {"limit": {"type": "integer", "minimum": 1, "maximum": 50, "default": 20},
              "detail": {"type": "string", "enum": list(BUDGETS), "default": "compact"}}
    fields = {
        "semantic_inventory": ("type_iri", "graph_id"),
        "semantic_search": ("resource_id", "type_iri", "graph_id", "predicate_iri", "related_resource_id"),
        "semantic_inspect": ("resource_id", "graph_id"),
        "learning_path_inspect": ("path_id", "path_graph_id"),
    }
    required = {"semantic_inspect": ["resource_id"],
                "learning_path_inspect": ["path_id", "path_graph_id"]}
    schemas = {}
    for name, names in fields.items():
        properties = {**common, **{key: dict(text) for key in names}}
        if name == "semantic_search":
            properties["query"] = {"type": "string", "maxLength": 512, "default": ""}
        schemas[name] = {"type": "object", "properties": properties,
                         "required": required.get(name, []), "additionalProperties": False}
    return schemas


def dispatch(binding: Binding, name: str, arguments: Any) -> dict:
    """Validate even clients bypassing the advertised strict schemas."""
    try:
        before = binding.check()
        try:
            schemas = tool_schemas()
            if name not in FUNCTIONS or type(arguments) is not dict:
                _fail("INVALID_ARGUMENT", "Unknown tool or invalid arguments")
            schema = schemas[name]
            if set(arguments) - set(schema["properties"]) or set(schema["required"]) - set(arguments):
                _fail("INVALID_ARGUMENT", "Unknown or missing arguments")
            if any(value is None for value in arguments.values()):
                _fail("INVALID_ARGUMENT", "Supplied arguments must not be null")
            # Keep legacy known-error messages for value validation in each function.
            return FUNCTIONS[name](binding, **arguments)
        finally:
            if binding.check() != before:
                _fail("SNAPSHOT_CHANGED", "Product state or semantic sources changed during query")
    except DiscoveryError as exc:
        binding.cache = None
        return _error(exc.code, str(exc))
    except Exception:
        binding.cache = None
        return _error("INTERNAL_ERROR", "Discovery failed without returning partial data")


async def serve(binding: Binding) -> None:
    # mcp 2 low-level API; intentionally no FastMCP or implicit callable schemas.
    from mcp.server.lowlevel import Server
    from mcp.server.stdio import stdio_server
    from mcp import types

    async def list_tools(_ctx, _params):
        try:
            binding.check()
            tools = [types.Tool(name=name, description="Bounded read-only Product " + name,
                                inputSchema=schema) for name, schema in tool_schemas().items()]
            binding.check()
            return types.ListToolsResult(tools=tools)
        except Exception:
            binding.cache = None
            raise ValueError("PCD catalog binding rejected") from None

    async def call_tool(_ctx, params):
        return types.CallToolResult(content=[types.TextContent(
            type="text", text=canonical_json(dispatch(binding, params.name, params.arguments or {})))])

    server = Server("pcd", on_list_tools=list_tools, on_call_tool=call_tool)
    async with stdio_server() as (reader, writer):
        await server.run(reader, writer, server.create_initialization_options())


class _QuietParser(argparse.ArgumentParser):
    def error(self, message):
        raise DiscoveryError("BINDING_REJECTED", "Invalid controlled launch arguments")


def main() -> int:
    try:
        parser = _QuietParser(add_help=False, allow_abbrev=False)
        for option in ("state-path", "run-id", "worktree", "expected-head"):
            parser.add_argument("--" + option, required=True)
        args = parser.parse_args()
        if len(sys.argv) != 9 or not sys.flags.isolated or not sys.dont_write_bytecode:
            _fail("BINDING_REJECTED", "Isolated non-writing launch required")
        binding = Binding(args.state_path, args.run_id, args.worktree, args.expected_head)
        import asyncio
        asyncio.run(serve(binding))
        return 0
    except (Exception, KeyboardInterrupt):
        # Never print argv, tokens, state, host paths, or dependency tracebacks.
        sys.stderr.write("PCD semantic server refused or stopped.\n")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
