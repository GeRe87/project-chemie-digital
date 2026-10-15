#!/usr/bin/env python3
"""Deterministic local semantic-authoring draft workflow for graph-backed scenes.

The canonical TriG Dataset remains authoritative. This module creates and evaluates a
single complete candidate replacement for the Standardabweichung scene named graph in
ignored local state. It never writes canonical TriG and never mutates Fuseki.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import shutil
import sys
from functools import lru_cache
from pathlib import Path
from typing import Any

from rdflib import BNode, Dataset, Graph, Literal, RDF, URIRef
from rdflib.compare import to_canonical_graph
from rdflib.namespace import Namespace

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from course_path_selection import (  # noqa: E402
    CourseUnitPathSelectionRequest,
    select_course_unit_path,
)
from generate_canonical_runtime import (  # noqa: E402
    compile_scene_document,
    default_selection_request,
)
from rdf_dataset import (  # noqa: E402
    CANONICAL_TRIG,
    assemble_dataset,
    dataset_fingerprint,
    parse_trig_path,
    populated_graph_ids,
    validate_dataset_contract,
)
from validate_semantics import validate_dataset  # noqa: E402

SH = Namespace("http://www.w3.org/ns/shacl#")
DRAFT_CONTRACT_VERSION = "1.0"
VARIANCE_DRAFT_CONTRACT_VERSION = "1.1"
VALIDATION_CONTRACT_VERSION = "1.0"
PREVIEW_CONTRACT_VERSION = "1.0"
PROMOTION_CONTRACT_VERSION = "1.0"
DRAFT_ID = "standard-deviation-scenes"
TARGET_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/scenes/standard-deviation")
DEFAULT_DRAFT_ROOT = ROOT / ".local" / "authoring" / DRAFT_ID
DRAFT_METADATA = "draft.json"
CANDIDATE_FILE = "candidate.trig"
VALIDATION_JSON = "validation.json"
VALIDATION_TEXT = "validation.txt"
PREVIEW_JSON = "preview.scene-document.json"
PROMOTION_JSON = "promotion-manifest.json"

# Closed Product-owned target registry. These are authoring/configuration IDs, not
# new RDF authority, and do not add graph instances to canonical TriG.
_EX = "https://w3id.org/project-chemie-digital/resource/"
_GRAPH = "https://w3id.org/project-chemie-digital/graph/"
VARIANCE_DRAFT_ID = "variance-dispersion-scenes"
VARIANCE_SCENE_GRAPH = URIRef(_GRAPH + "scenes/chemometrics-variance-dispersion")
VARIANCE_PATH_GRAPH = URIRef(_GRAPH + "paths/chemometrics-variance-dispersion-lecture")
VARIANCE_STEP = URIRef(_EX + "path-step-chemometrics-variance-dispersion-variance")
VARIANCE_PATH = URIRef(_EX + "path-chemometrics-variance-dispersion-lecture")
VARIANCE_UNIT = URIRef(_EX + "learning-unit-variance-dispersion")
_VARIANCE_SELECTION = {
    "offeringId": _EX + "teaching-offering-chemometrics-applied-statistics",
    "placementId": _EX + "unit-placement-chemometrics-variance-dispersion",
    "unitId": str(VARIANCE_UNIT),
    "pathId": str(VARIANCE_PATH),
    "pathGraphId": str(VARIANCE_PATH_GRAPH),
    "stepId": str(VARIANCE_STEP),
}
_VARIANCE_GRAPH_SOURCES = {
    str(VARIANCE_PATH_GRAPH): "ontology/dataset/chemometrics-variance-dispersion-path.trig",
    str(VARIANCE_SCENE_GRAPH): "ontology/dataset/chemometrics-variance-dispersion-scenes.trig",
}
MAX_DRAFT_DIAGNOSTICS = 50


class AuthoringError(RuntimeError):
    """Fail-closed authoring-boundary error."""


class NonConformingDraft(AuthoringError):
    """Raised when a preview/promotion is requested for an invalid draft."""


def _sha256_bytes(content: bytes) -> str:
    return "sha256:" + hashlib.sha256(content).hexdigest()


def _file_sha256(path: Path) -> str:
    return _sha256_bytes(path.read_bytes())


def _canonical_source_signature() -> str:
    """Hash the exact canonical TriG source bytes for cache invalidation."""
    digest = hashlib.sha256()
    for path in CANONICAL_TRIG:
        digest.update(path.relative_to(ROOT).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


@lru_cache(maxsize=2)
def _cached_canonical_context(source_signature: str) -> tuple[Dataset, str]:
    """Return a process-local read-only canonical Dataset and fingerprint.

    The cache key is derived from the actual source bytes, so edits invalidate the
    snapshot automatically. Callers must treat the returned Dataset as immutable.
    """
    canonical = assemble_dataset()
    return canonical, "sha256:" + dataset_fingerprint(canonical)


def _canonical_context() -> tuple[Dataset, str]:
    return _cached_canonical_context(_canonical_source_signature())


_VALIDATION_RESULT_CACHE: dict[tuple[str, str, str], dict[str, Any]] = {}


def _canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def _write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(content, encoding="utf-8", newline="\n")
    temporary.replace(path)


def _term_n3(term: Any) -> str:
    if isinstance(term, (URIRef, BNode, Literal)):
        return term.n3()
    raise AuthoringError(f"Unsupported RDF term in draft serialization: {term!r}")


def canonical_single_graph_trig(dataset: Dataset, graph_id: URIRef) -> str:
    """Serialize one graph deterministically as a complete, editable TriG candidate."""
    canonical = to_canonical_graph(dataset.graph(graph_id))
    rows = sorted(
        f"  {_term_n3(subject)} {_term_n3(predicate)} {_term_n3(obj)} ."
        for subject, predicate, obj in canonical
    )
    return f"<{graph_id}> {{\n" + "\n".join(rows) + "\n}\n"


def _target_for_metadata(metadata: dict[str, Any]) -> tuple[URIRef, ...]:
    """Reject forged draft targets: compare metadata to a closed allowlist."""
    name = metadata.get("draftId")
    if name == DRAFT_ID:
        if metadata.get("targetGraphIri") != str(TARGET_GRAPH):
            raise AuthoringError("Draft target graph does not match the supported scene graph")
        if "targetGraphIris" in metadata or "selection" in metadata:
            raise AuthoringError("Legacy draft must not inject multiple graphs or path selection")
        return (TARGET_GRAPH,)
    if name != VARIANCE_DRAFT_ID:
        raise AuthoringError("Draft identifier does not match an approved authoring target")
    required = (VARIANCE_PATH_GRAPH, VARIANCE_SCENE_GRAPH)
    if (metadata.get("targetGraphIri") != str(VARIANCE_SCENE_GRAPH)
            or metadata.get("targetGraphIris") != [str(graph) for graph in required]
            or metadata.get("sourceAllocation") != _VARIANCE_GRAPH_SOURCES
            or metadata.get("selection") != _VARIANCE_SELECTION):
        raise AuthoringError("Variance draft graph identities/source allocation/path selection are not approved")
    return required


def _assert_variance_source_ownership(canonical: Dataset) -> None:
    """Fail closed if canonical graph-source allocation has drifted."""
    scene_file = ROOT / _VARIANCE_GRAPH_SOURCES[str(VARIANCE_SCENE_GRAPH)]
    sources: dict[str, list[str]] = {key: [] for key in _VARIANCE_GRAPH_SOURCES}
    for file in CANONICAL_TRIG:
        local = Dataset(default_union=False)
        parse_trig_path(local, file)
        graphs = populated_graph_ids(local)
        for iri in sources:
            if URIRef(iri) in graphs:
                sources[iri].append(file.relative_to(ROOT).as_posix())
    if sources[str(VARIANCE_PATH_GRAPH)] != [_VARIANCE_GRAPH_SOURCES[str(VARIANCE_PATH_GRAPH)]]:
        raise AuthoringError("Variance path named graph has ambiguous canonical source-file ownership")
    scene_sources = sources[str(VARIANCE_SCENE_GRAPH)]
    if scene_sources:
        if scene_sources != [_VARIANCE_GRAPH_SOURCES[str(VARIANCE_SCENE_GRAPH)]]:
            raise AuthoringError("Existing Variance scene graph has ambiguous/unapproved source ownership")
    elif scene_file.exists():
        raise AuthoringError("Scene source exists but contains no owned scene graph; reconcile its source allocation")
    if VARIANCE_PATH_GRAPH not in populated_graph_ids(canonical):
        raise AuthoringError("Variance path graph is missing from the canonical Dataset")
    graph = canonical.graph(VARIANCE_PATH_GRAPH)
    if ((VARIANCE_PATH, RDF.type, URIRef(_GRAPH.replace("/graph/", "/ontology/") + "LearningPath")) not in graph
            or (VARIANCE_STEP, URIRef(_GRAPH.replace("/graph/", "/ontology/") + "position"), Literal(1)) not in graph):
        raise AuthoringError("Variance path and first PathStep do not match approved canonical identities")
    request = CourseUnitPathSelectionRequest(
        offering_id=_VARIANCE_SELECTION["offeringId"],
        placement_id=_VARIANCE_SELECTION["placementId"],
        unit_id=_VARIANCE_SELECTION["unitId"],
        requested_path_id=_VARIANCE_SELECTION["pathId"],
        requested_path_graph_id=_VARIANCE_SELECTION["pathGraphId"],
    )
    try:
        selection = select_course_unit_path(canonical, request)
    except ValueError as exc:
        raise AuthoringError("Approved Variance course/path selection does not resolve") from exc
    if selection.path.path_graph_id != str(VARIANCE_PATH_GRAPH):
        raise AuthoringError("Variance selection resolved to a different named graph")


def _assert_variance_path_additive(canonical: Dataset, candidate: Dataset) -> None:
    """Only the exact new PathStep → SceneDefinition link may change in path graph."""
    before = set(canonical.graph(VARIANCE_PATH_GRAPH))
    after = set(candidate.graph(VARIANCE_PATH_GRAPH))
    removed = before - after
    additions = after - before
    predicate = URIRef(_GRAPH.replace("/graph/", "/ontology/") + "usesScene")
    previous_links = sorted(
        (o for s, p, o in before if s == VARIANCE_STEP and p == predicate), key=str
    )
    if len(previous_links) > 1:
        raise AuthoringError("Existing Variance step has ambiguous scene bindings")
    if previous_links:
        if removed or additions:
            raise AuthoringError("Existing Variance path/scene binding may not be changed")
        selected_scene = previous_links[0]
    else:
        allowed = {(VARIANCE_STEP, predicate, scene) for _s, _p, scene in additions
                   if _s == VARIANCE_STEP and _p == predicate
                   and isinstance(scene, URIRef)
                   and str(scene).startswith(_EX)}
        if removed or len(additions) != 1 or additions != allowed:
            raise AuthoringError("Variance path candidate may only add one approved usesScene link")
        selected_scene = next(iter(additions))[2]
    if (selected_scene, RDF.type,
            URIRef(_GRAPH.replace("/graph/", "/ontology/") + "SceneDefinition")) not in candidate.graph(VARIANCE_SCENE_GRAPH):
        raise AuthoringError("Variance linked scene must be defined in the candidate scene named graph")


def canonical_multiple_graph_trig(dataset: Dataset, graphs: tuple[URIRef, ...]) -> str:
    """Deterministic complete candidate including approved initially empty graphs."""
    return "\n".join(canonical_single_graph_trig(dataset, graph) for graph in graphs)


def _metadata_path(draft_root: Path) -> Path:
    return draft_root / DRAFT_METADATA


def _candidate_path(draft_root: Path) -> Path:
    return draft_root / CANDIDATE_FILE


def _read_metadata(draft_root: Path) -> dict[str, Any]:
    path = _metadata_path(draft_root)
    if not path.exists():
        raise AuthoringError(f"Draft metadata is missing: {path}; run authoring checkout first")
    try:
        metadata = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise AuthoringError(f"Draft metadata is unreadable: {path}: {exc}") from exc
    if draft_root.is_symlink() or path.is_symlink():
        raise AuthoringError("Symlink draft metadata/root is not permitted")
    expected_version = (DRAFT_CONTRACT_VERSION if metadata.get("draftId") == DRAFT_ID
                        else VARIANCE_DRAFT_CONTRACT_VERSION)
    if metadata.get("contractVersion") != expected_version:
        raise AuthoringError("Unsupported authoring draft contract version")
    _target_for_metadata(metadata)
    if metadata.get("candidatePath") != CANDIDATE_FILE:
        raise AuthoringError("Draft candidate path is not the repository-defined candidate file")
    return metadata


def checkout_draft(draft_root: Path = DEFAULT_DRAFT_ROOT, *, force: bool = False,
                   target_id: str = DRAFT_ID) -> dict[str, Any]:
    if target_id == VARIANCE_DRAFT_ID and draft_root == DEFAULT_DRAFT_ROOT:
        draft_root = ROOT / ".local" / "authoring" / VARIANCE_DRAFT_ID
    if target_id not in (DRAFT_ID, VARIANCE_DRAFT_ID):
        raise AuthoringError("Unknown or unapproved authoring target")
    if draft_root.is_symlink():
        raise AuthoringError("Symlink draft roots are not permitted")
    if draft_root.exists():
        if not force:
            raise AuthoringError(f"Draft workspace already exists: {draft_root}; pass --force to replace it")
        if target_id == VARIANCE_DRAFT_ID:
            raise AuthoringError("For a new target, destructive draft force/reset is not authorized")
        shutil.rmtree(draft_root)

    canonical, base_fingerprint = _canonical_context()
    if target_id == DRAFT_ID:
        if TARGET_GRAPH not in populated_graph_ids(canonical):
            raise AuthoringError(f"Canonical target graph is missing: {TARGET_GRAPH}")
        candidate_text = canonical_single_graph_trig(canonical, TARGET_GRAPH)
    else:
        _assert_variance_source_ownership(canonical)
        candidate_text = canonical_multiple_graph_trig(
            canonical, (VARIANCE_PATH_GRAPH, VARIANCE_SCENE_GRAPH),
        )
    draft_root.mkdir(parents=True, exist_ok=True)
    _write_text(_candidate_path(draft_root), candidate_text)
    metadata = {
        "contractVersion": (DRAFT_CONTRACT_VERSION if target_id == DRAFT_ID
                            else VARIANCE_DRAFT_CONTRACT_VERSION),
        "draftId": target_id,
        "baseDatasetFingerprint": base_fingerprint,
        "targetGraphIri": str(TARGET_GRAPH if target_id == DRAFT_ID else VARIANCE_SCENE_GRAPH),
        "candidatePath": CANDIDATE_FILE,
        "checkoutCandidateSha256": _file_sha256(_candidate_path(draft_root)),
        "validationPath": VALIDATION_JSON,
        "previewPath": PREVIEW_JSON,
        "promotionPath": PROMOTION_JSON,
    }
    if target_id == VARIANCE_DRAFT_ID:
        metadata["targetGraphIris"] = [str(VARIANCE_PATH_GRAPH), str(VARIANCE_SCENE_GRAPH)]
        metadata["sourceAllocation"] = dict(_VARIANCE_GRAPH_SOURCES)
        metadata["selection"] = dict(_VARIANCE_SELECTION)
    _write_text(_metadata_path(draft_root), _canonical_json(metadata))
    return metadata


def _parse_candidate(draft_root: Path) -> Dataset:
    metadata = _read_metadata(draft_root)
    expected = _target_for_metadata(metadata)
    candidate_path = _candidate_path(draft_root)
    if not candidate_path.exists() or candidate_path.is_symlink():
        raise AuthoringError(f"Draft candidate is missing or a symlink: {candidate_path}")
    parsed = Dataset(default_union=False)
    try:
        parse_trig_path(parsed, candidate_path)
    except Exception as exc:
        raise AuthoringError(f"Draft candidate is not valid TriG: {exc}") from exc

    if len(parsed.default_graph):
        raise AuthoringError("Draft candidate must not contain default-graph data")
    graph_ids = populated_graph_ids(parsed)
    if graph_ids != tuple(sorted(expected, key=str)):
        identities = ", ".join(str(graph) for graph in graph_ids) or "(none)"
        if metadata["draftId"] == DRAFT_ID:
            raise AuthoringError(
                "Draft candidate must contain exactly the supported scene named graph; "
                f"found: {identities}"
            )
        raise AuthoringError(
            "Draft candidate must contain exactly both approved populated Variance named graphs; "
            f"found: {identities}"
        )
    return parsed


def assemble_candidate_dataset(draft_root: Path = DEFAULT_DRAFT_ROOT) -> tuple[Dataset, dict[str, Any]]:
    metadata = _read_metadata(draft_root)
    canonical, current_base = _canonical_context()
    if metadata.get("baseDatasetFingerprint") != current_base:
        raise AuthoringError(
            "Draft base Dataset fingerprint is stale: expected "
            f"{metadata.get('baseDatasetFingerprint')}, current {current_base}"
        )

    owned = _target_for_metadata(metadata)
    if metadata["draftId"] == VARIANCE_DRAFT_ID:
        _assert_variance_source_ownership(canonical)
    parsed = _parse_candidate(draft_root)
    candidate = Dataset(default_union=False)
    for subject, predicate, obj, graph_id in canonical.quads((None, None, None, None)):
        if graph_id not in owned:
            candidate.graph(graph_id).add((subject, predicate, obj))
    for graph in owned:
        for triple in parsed.graph(graph):
            candidate.graph(graph).add(triple)
    if metadata["draftId"] == VARIANCE_DRAFT_ID:
        _assert_variance_path_additive(canonical, candidate)
    validate_dataset_contract(candidate)
    return candidate, metadata


def _term_identity(term: Any | None) -> str | None:
    if term is None:
        return None
    if isinstance(term, URIRef):
        return str(term)
    if isinstance(term, BNode):
        return f"_:{term}"
    if isinstance(term, Literal):
        return term.n3()
    return str(term)


def _diagnostics(report_graph: Graph) -> list[dict[str, Any]]:
    canonical_report = to_canonical_graph(report_graph)
    severity_names = {
        SH.Violation: "violation",
        SH.Warning: "warning",
        SH.Info: "info",
    }
    diagnostics: list[dict[str, Any]] = []
    results = sorted(
        set(canonical_report.subjects(RDF.type, SH.ValidationResult)),
        key=lambda term: _term_identity(term) or "",
    )
    for result in results:
        severity_term = canonical_report.value(result, SH.resultSeverity)
        messages = sorted(str(value) for value in canonical_report.objects(result, SH.resultMessage))
        diagnostic = {
            "severity": severity_names.get(severity_term, _term_identity(severity_term) or "violation"),
            "focusNode": _term_identity(canonical_report.value(result, SH.focusNode)),
            "resultPath": _term_identity(canonical_report.value(result, SH.resultPath)),
            "sourceShape": _term_identity(canonical_report.value(result, SH.sourceShape)),
            "sourceConstraintComponent": _term_identity(
                canonical_report.value(result, SH.sourceConstraintComponent)
            ),
            "value": _term_identity(canonical_report.value(result, SH.value)),
            "message": messages,
        }
        diagnostics.append(diagnostic)

    diagnostics.sort(
        key=lambda item: (
            item["severity"],
            item["focusNode"] or "",
            item["resultPath"] or "",
            item["sourceShape"] or "",
            item["sourceConstraintComponent"] or "",
            item["value"] or "",
            tuple(item["message"]),
        )
    )
    return diagnostics


def _render_validation_text(result: dict[str, Any]) -> str:
    lines = [
        f"Draft: {result['draftId']}",
        f"Target graph: {result['targetGraphIri']}",
        f"Base Dataset: {result['baseDatasetFingerprint']}",
        f"Candidate Dataset: {result['candidateDatasetFingerprint']}",
        f"Conforms: {'yes' if result['conforms'] else 'no'}",
    ]
    if not result["diagnostics"]:
        lines.append("Diagnostics: none")
    else:
        lines.append(f"Diagnostics: {len(result['diagnostics'])}")
        for index, diagnostic in enumerate(result["diagnostics"], start=1):
            lines.append(
                f"{index}. [{diagnostic['severity']}] focus={diagnostic['focusNode'] or '-'} "
                f"path={diagnostic['resultPath'] or '-'} source={diagnostic['sourceShape'] or '-'}"
            )
            for message in diagnostic["message"]:
                lines.append(f"   {message}")
    return "\n".join(lines) + "\n"


def _validate_candidate(
    draft_root: Path,
    candidate: Dataset,
    metadata: dict[str, Any],
    *,
    write_reports: bool,
) -> dict[str, Any]:
    candidate_file_sha = _file_sha256(_candidate_path(draft_root))
    cache_key = (metadata["baseDatasetFingerprint"], candidate_file_sha, metadata["draftId"])
    cached = _VALIDATION_RESULT_CACHE.get(cache_key)
    if cached is not None:
        result = copy.deepcopy(cached)
    else:
        # Only approved graphs are replaced; the SHACL shapes remain canonical.
        # Full candidate content is validated using the Product-owned SHACL policy.
        conforms, report_graph, _report_text = validate_dataset(candidate, meta_shacl=False)
        diagnostics = _diagnostics(report_graph)
        result = {
            "contractVersion": VALIDATION_CONTRACT_VERSION,
            "draftId": metadata["draftId"],
            "targetGraphIri": metadata["targetGraphIri"],
            "baseDatasetFingerprint": metadata["baseDatasetFingerprint"],
            "candidateFileSha256": candidate_file_sha,
            "candidateDatasetFingerprint": "sha256:" + dataset_fingerprint(candidate),
            "conforms": bool(conforms),
            "diagnostics": diagnostics[:MAX_DRAFT_DIAGNOSTICS],
            "diagnosticsTruncated": len(diagnostics) > MAX_DRAFT_DIAGNOSTICS,
        }
        _VALIDATION_RESULT_CACHE[cache_key] = copy.deepcopy(result)
    if write_reports:
        _write_text(draft_root / VALIDATION_JSON, _canonical_json(result))
        _write_text(draft_root / VALIDATION_TEXT, _render_validation_text(result))
    return result


def validate_draft(
    draft_root: Path = DEFAULT_DRAFT_ROOT,
    *,
    write_reports: bool = True,
) -> dict[str, Any]:
    candidate, metadata = assemble_candidate_dataset(draft_root)
    return _validate_candidate(
        draft_root,
        candidate,
        metadata,
        write_reports=write_reports,
    )


def _preview_validated_candidate(
    draft_root: Path,
    candidate: Dataset,
    validation: dict[str, Any],
) -> dict[str, Any]:
    metadata = _read_metadata(draft_root)
    if metadata["draftId"] == DRAFT_ID:
        request = default_selection_request()
    else:
        selection_ids = metadata["selection"]
        request = CourseUnitPathSelectionRequest(
            offering_id=selection_ids["offeringId"],
            placement_id=selection_ids["placementId"],
            unit_id=selection_ids["unitId"],
            requested_path_id=selection_ids["pathId"],
            requested_path_graph_id=selection_ids["pathGraphId"],
        )
    try:
        selection = select_course_unit_path(candidate, request)
        scene_document = compile_scene_document(candidate, selection.path)
    except ValueError as exc:
        raise AuthoringError("Selected Product path/scene cannot be compiled by current renderer-neutral compiler") from exc
    preview = {
        "contractVersion": PREVIEW_CONTRACT_VERSION,
        "draftId": metadata["draftId"],
        "baseDatasetFingerprint": validation["baseDatasetFingerprint"],
        "candidateDatasetFingerprint": validation["candidateDatasetFingerprint"],
        "sceneDocument": scene_document,
    }
    _write_text(draft_root / PREVIEW_JSON, _canonical_json(preview))
    return preview


def preview_draft(draft_root: Path = DEFAULT_DRAFT_ROOT) -> dict[str, Any]:
    candidate, metadata = assemble_candidate_dataset(draft_root)
    validation = _validate_candidate(
        draft_root,
        candidate,
        metadata,
        write_reports=True,
    )
    if not validation["conforms"]:
        raise NonConformingDraft("Draft does not conform; preview was not produced")
    return _preview_validated_candidate(draft_root, candidate, validation)


def prepare_promotion(draft_root: Path = DEFAULT_DRAFT_ROOT) -> dict[str, Any]:
    candidate, metadata = assemble_candidate_dataset(draft_root)
    validation = _validate_candidate(
        draft_root,
        candidate,
        metadata,
        write_reports=True,
    )
    if not validation["conforms"]:
        raise NonConformingDraft("Draft does not conform; promotion preparation was refused")
    preview = _preview_validated_candidate(draft_root, candidate, validation)
    validation_path = draft_root / VALIDATION_JSON
    preview_path = draft_root / PREVIEW_JSON
    manifest = {
        "contractVersion": PROMOTION_CONTRACT_VERSION,
        "status": "ready-for-human-review",
        "draftId": metadata["draftId"],
        "targetGraphIri": metadata["targetGraphIri"],
        "baseDatasetFingerprint": validation["baseDatasetFingerprint"],
        "candidateFile": CANDIDATE_FILE,
        "candidateFileSha256": validation["candidateFileSha256"],
        "candidateDatasetFingerprint": validation["candidateDatasetFingerprint"],
        "validation": {
            "path": VALIDATION_JSON,
            "sha256": _file_sha256(validation_path),
            "conforms": True,
        },
        "preview": {
            "path": PREVIEW_JSON,
            "sha256": _file_sha256(preview_path),
            "sceneDocumentId": preview["sceneDocument"]["id"],
        },
        "canonicalWritePerformed": False,
    }
    if metadata["draftId"] == VARIANCE_DRAFT_ID:
        manifest["targetGraphIris"] = metadata["targetGraphIris"]
        manifest["sourceAllocation"] = metadata["sourceAllocation"]
        manifest["sourceWritePerformed"] = False
    _write_text(draft_root / PROMOTION_JSON, _canonical_json(manifest))
    return manifest


def _draft_root_argument(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--draft-root",
        type=Path,
        default=DEFAULT_DRAFT_ROOT,
        help=f"Draft workspace (default: {DEFAULT_DRAFT_ROOT})",
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Local validated semantic-authoring draft workflow")
    subparsers = parser.add_subparsers(dest="command", required=True)

    checkout_parser = subparsers.add_parser("checkout", help="Create a non-authoritative scene-graph draft")
    _draft_root_argument(checkout_parser)
    checkout_parser.add_argument("--force", action="store_true", help="Replace an existing local draft")
    checkout_parser.add_argument(
        "--target-id", choices=(DRAFT_ID, VARIANCE_DRAFT_ID), default=DRAFT_ID,
        help="Explicit allowlisted draft target; default preserves Standardabweichung v0.1",
    )

    for command, help_text in (
        ("validate", "Validate the draft and write structured/human-readable SHACL feedback"),
        ("preview", "Compile a deterministic renderer-neutral preview for a conforming draft"),
        ("prepare-promotion", "Create a deterministic review-only promotion manifest"),
    ):
        command_parser = subparsers.add_parser(command, help=help_text)
        _draft_root_argument(command_parser)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        if args.command == "checkout":
            root = args.draft_root
            if args.target_id != DRAFT_ID and root == DEFAULT_DRAFT_ROOT:
                root = ROOT / ".local" / "authoring" / args.target_id
            metadata = checkout_draft(root, force=args.force, target_id=args.target_id)
            print(f"Authoring draft created: {root}")
            print(f"Base Dataset: {metadata['baseDatasetFingerprint']}")
            print(f"Target graph: {metadata['targetGraphIri']}")
            return 0
        if args.command == "validate":
            result = validate_draft(args.draft_root)
            print(_render_validation_text(result), end="")
            return 0 if result["conforms"] else 1
        if args.command == "preview":
            preview = preview_draft(args.draft_root)
            print(f"Preview written: {args.draft_root / PREVIEW_JSON}")
            print(f"SceneDocument: {preview['sceneDocument']['id']}")
            return 0
        if args.command == "prepare-promotion":
            manifest = prepare_promotion(args.draft_root)
            print(f"Review bundle prepared: {args.draft_root / PROMOTION_JSON}")
            print(f"Status: {manifest['status']}")
            print("Canonical write performed: no")
            return 0
        raise AssertionError(args.command)
    except NonConformingDraft as exc:
        print(f"Semantic authoring refused: {exc}", file=sys.stderr)
        return 1
    except (AuthoringError, OSError, ValueError) as exc:
        print(f"Semantic authoring failed: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
