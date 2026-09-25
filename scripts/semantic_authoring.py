#!/usr/bin/env python3
"""Deterministic local semantic-authoring draft workflow for graph-backed scenes.

The canonical TriG Dataset remains authoritative. This module creates and evaluates a
single complete candidate replacement for the Standardabweichung scene named graph in
ignored local state. It never writes canonical TriG and never mutates Fuseki.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path
from typing import Any

from rdflib import BNode, Dataset, Graph, Literal, RDF, URIRef
from rdflib.compare import to_canonical_graph
from rdflib.namespace import Namespace

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from course_path_selection import select_course_unit_path  # noqa: E402
from generate_canonical_runtime import (  # noqa: E402
    compile_scene_document,
    default_selection_request,
)
from rdf_dataset import (  # noqa: E402
    assemble_dataset,
    dataset_fingerprint,
    parse_trig_path,
    populated_graph_ids,
    validate_dataset_contract,
)
from validate_semantics import validate_dataset  # noqa: E402

SH = Namespace("http://www.w3.org/ns/shacl#")
DRAFT_CONTRACT_VERSION = "1.0"
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


class AuthoringError(RuntimeError):
    """Fail-closed authoring-boundary error."""


class NonConformingDraft(AuthoringError):
    """Raised when a preview/promotion is requested for an invalid draft."""


def _sha256_bytes(content: bytes) -> str:
    return "sha256:" + hashlib.sha256(content).hexdigest()


def _file_sha256(path: Path) -> str:
    return _sha256_bytes(path.read_bytes())


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
    if metadata.get("contractVersion") != DRAFT_CONTRACT_VERSION:
        raise AuthoringError("Unsupported authoring draft contract version")
    if metadata.get("draftId") != DRAFT_ID:
        raise AuthoringError("Draft identifier does not match the supported authoring target")
    if metadata.get("targetGraphIri") != str(TARGET_GRAPH):
        raise AuthoringError("Draft target graph does not match the supported scene graph")
    if metadata.get("candidatePath") != CANDIDATE_FILE:
        raise AuthoringError("Draft candidate path is not the repository-defined candidate file")
    return metadata


def checkout_draft(draft_root: Path = DEFAULT_DRAFT_ROOT, *, force: bool = False) -> dict[str, Any]:
    if draft_root.exists():
        if not force:
            raise AuthoringError(f"Draft workspace already exists: {draft_root}; pass --force to replace it")
        shutil.rmtree(draft_root)

    canonical = assemble_dataset()
    if TARGET_GRAPH not in populated_graph_ids(canonical):
        raise AuthoringError(f"Canonical target graph is missing: {TARGET_GRAPH}")
    base_fingerprint = "sha256:" + dataset_fingerprint(canonical)
    candidate_text = canonical_single_graph_trig(canonical, TARGET_GRAPH)

    draft_root.mkdir(parents=True, exist_ok=True)
    _write_text(_candidate_path(draft_root), candidate_text)
    metadata = {
        "contractVersion": DRAFT_CONTRACT_VERSION,
        "draftId": DRAFT_ID,
        "baseDatasetFingerprint": base_fingerprint,
        "targetGraphIri": str(TARGET_GRAPH),
        "candidatePath": CANDIDATE_FILE,
        "checkoutCandidateSha256": _file_sha256(_candidate_path(draft_root)),
        "validationPath": VALIDATION_JSON,
        "previewPath": PREVIEW_JSON,
        "promotionPath": PROMOTION_JSON,
    }
    _write_text(_metadata_path(draft_root), _canonical_json(metadata))
    return metadata


def _parse_candidate(draft_root: Path) -> Dataset:
    candidate_path = _candidate_path(draft_root)
    if not candidate_path.exists():
        raise AuthoringError(f"Draft candidate is missing: {candidate_path}")
    parsed = Dataset(default_union=False)
    try:
        parse_trig_path(parsed, candidate_path)
    except Exception as exc:
        raise AuthoringError(f"Draft candidate is not valid TriG: {exc}") from exc

    if len(parsed.default_graph):
        raise AuthoringError("Draft candidate must not contain default-graph data")
    graph_ids = populated_graph_ids(parsed)
    if graph_ids != (TARGET_GRAPH,):
        identities = ", ".join(str(graph) for graph in graph_ids) or "(none)"
        raise AuthoringError(
            "Draft candidate must contain exactly the supported scene named graph; "
            f"found: {identities}"
        )
    return parsed


def assemble_candidate_dataset(draft_root: Path = DEFAULT_DRAFT_ROOT) -> tuple[Dataset, dict[str, Any]]:
    metadata = _read_metadata(draft_root)
    canonical = assemble_dataset()
    current_base = "sha256:" + dataset_fingerprint(canonical)
    if metadata.get("baseDatasetFingerprint") != current_base:
        raise AuthoringError(
            "Draft base Dataset fingerprint is stale: expected "
            f"{metadata.get('baseDatasetFingerprint')}, current {current_base}"
        )

    parsed = _parse_candidate(draft_root)
    candidate = Dataset(default_union=False)
    for subject, predicate, obj, graph_id in canonical.quads((None, None, None, None)):
        if graph_id != TARGET_GRAPH:
            candidate.graph(graph_id).add((subject, predicate, obj))
    for triple in parsed.graph(TARGET_GRAPH):
        candidate.graph(TARGET_GRAPH).add(triple)

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
    # Draft authoring can replace only TARGET_GRAPH. The SHACL graph is copied
    # unchanged from the canonical Dataset, whose authoritative end-to-end gate
    # already runs meta-SHACL. Re-validating the same shapes graph here would add
    # substantial repeated cost without increasing draft-content coverage.
    conforms, report_graph, _report_text = validate_dataset(candidate, meta_shacl=False)
    result = {
        "contractVersion": VALIDATION_CONTRACT_VERSION,
        "draftId": DRAFT_ID,
        "targetGraphIri": str(TARGET_GRAPH),
        "baseDatasetFingerprint": metadata["baseDatasetFingerprint"],
        "candidateFileSha256": _file_sha256(_candidate_path(draft_root)),
        "candidateDatasetFingerprint": "sha256:" + dataset_fingerprint(candidate),
        "conforms": bool(conforms),
        "diagnostics": _diagnostics(report_graph),
    }
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
    selection = select_course_unit_path(candidate, default_selection_request())
    scene_document = compile_scene_document(candidate, selection.path)
    preview = {
        "contractVersion": PREVIEW_CONTRACT_VERSION,
        "draftId": DRAFT_ID,
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
        "draftId": DRAFT_ID,
        "targetGraphIri": str(TARGET_GRAPH),
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
            metadata = checkout_draft(args.draft_root, force=args.force)
            print(f"Authoring draft created: {args.draft_root}")
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
