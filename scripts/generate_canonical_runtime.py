#!/usr/bin/env python3
"""Generate deterministic browser/runtime artifacts from the canonical TriG Dataset.

The generated JSON is disposable transport. Audience-visible content remains authored
only in ``ontology/dataset/*.trig``.
"""
from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path
from typing import Any, Iterable

from rdflib import DCTERMS, RDF, SKOS, Dataset, Literal, URIRef

from course_path_selection import (
    CoursePathReference,
    CourseUnitPathSelectionRequest,
    select_course_unit_path,
)
from rdf_dataset import assemble_dataset, dataset_fingerprint
from teaching_offering_runtime import project_teaching_offering_runtime_document

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "apps" / "pitch" / "src" / "generated" / "canonical-runtime.json"
PITCH_INDEX = ROOT / "apps" / "pitch" / "index.html"
CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
SCHEMA = "https://schema.org/"

DEFAULT_OFFERING_ID = f"{EX}teaching-offering-digital-chemistry"
DEFAULT_PLACEMENT_ID = f"{EX}unit-placement-standard-deviation"
DEFAULT_UNIT_ID = f"{EX}learning-unit-standard-deviation"


def iri(namespace: str, local: str) -> URIRef:
    return URIRef(namespace + local)


def compact(value: URIRef | str) -> str:
    text = str(value)
    for namespace, prefix in ((EX, "ex:"), (CD, "cd:"), (str(SKOS), "skos:"), (str(DCTERMS), "dct:"), (SCHEMA, "schema:")):
        if text.startswith(namespace):
            return prefix + text[len(namespace) :]
    return text


def local_name(value: URIRef | str) -> str:
    text = str(value)
    return text.rsplit("/", 1)[-1].rsplit("#", 1)[-1].replace("-", " ")


def quads(dataset: Dataset, subject: URIRef | None = None, predicate: URIRef | None = None) -> Iterable[tuple[Any, Any, Any, Any]]:
    return dataset.quads((subject, predicate, None, None))


def objects(dataset: Dataset, subject: URIRef, predicate: URIRef) -> list[Any]:
    return sorted({obj for _s, _p, obj, _g in quads(dataset, subject, predicate)}, key=lambda value: value.n3())


def one(dataset: Dataset, subject: URIRef, predicate: URIRef, *, required: bool = True) -> Any | None:
    values = objects(dataset, subject, predicate)
    if not values:
        if required:
            raise ValueError(f"Missing {compact(predicate)} for {compact(subject)}")
        return None
    if len(values) != 1:
        raise ValueError(f"Expected one {compact(predicate)} for {compact(subject)}, got {len(values)}")
    return values[0]


def graph_ids(dataset: Dataset, subject: URIRef) -> list[str]:
    return sorted({str(graph) for _s, _p, _o, graph in quads(dataset, subject, None)})


def literal(dataset: Dataset, subject: URIRef, predicate: URIRef, language: str | None = None) -> str | None:
    values = [value for value in objects(dataset, subject, predicate) if isinstance(value, Literal)]
    if language is not None:
        values = [value for value in values if value.language == language]
    if not values:
        return None
    if len(values) > 1:
        raise ValueError(f"Ambiguous literal {compact(predicate)} for {compact(subject)}")
    return str(values[0])


def boolean_literal(dataset: Dataset, subject: URIRef, predicate: URIRef) -> bool:
    value = literal(dataset, subject, predicate)
    if value == "true":
        return True
    if value == "false":
        return False
    raise ValueError(f"Invalid boolean {compact(predicate)} for {compact(subject)}")


def resource_text(dataset: Dataset, resource: URIRef, language: str | None) -> str:
    candidates = (
        iri(CD, "body"), iri(CD, "latex"), iri(CD, "expression"), iri(CD, "notation"),
        DCTERMS.description, SKOS.prefLabel, DCTERMS.title, iri(SCHEMA, "name"),
    )
    for predicate in candidates:
        selected_language = language if predicate in {iri(CD, "body"), DCTERMS.description, SKOS.prefLabel} else None
        value = literal(dataset, resource, predicate, selected_language)
        if value is not None:
            return value
    raise ValueError(f"No audience-visible value for {compact(resource)}")


def source_reference(dataset: Dataset, resource: URIRef, relation_path: str | None = None) -> dict[str, Any]:
    value: dict[str, Any] = {"resourceId": compact(resource)}
    provenance = graph_ids(dataset, resource)
    if provenance:
        value["provenanceIds"] = provenance
    if relation_path:
        value["relationPath"] = relation_path
    return value


def integer(dataset: Dataset, subject: URIRef, predicate: URIRef) -> int:
    value = one(dataset, subject, predicate)
    try:
        result = int(str(value))
    except (TypeError, ValueError) as error:
        raise ValueError(f"Invalid integer {compact(predicate)} for {compact(subject)}") from error
    if result < 1:
        raise ValueError(f"Position must be positive for {compact(subject)}")
    return result


def is_resource_type(dataset: Dataset, resource: URIRef, type_name: str) -> bool:
    return any(obj == iri(CD, type_name) for obj in objects(dataset, resource, RDF.type))


def compile_scene_document(dataset: Dataset, selected_path: CoursePathReference) -> dict[str, Any]:
    path = URIRef(selected_path.path_id)
    path_graph = dataset.graph(URIRef(selected_path.path_graph_id))
    if (path, RDF.type, iri(CD, "LearningPath")) not in path_graph:
        raise ValueError(
            f"Selected LearningPath {compact(path)} is not defined in expected graph {selected_path.path_graph_id}"
        )
    steps = sorted(
        set(path_graph.objects(path, iri(CD, "hasStep"))),
        key=lambda step: (integer(dataset, step, iri(CD, "position")), str(step)),
    )
    positions = [integer(dataset, step, iri(CD, "position")) for step in steps]
    if positions != list(range(1, len(steps) + 1)):
        raise ValueError("Path positions must be unique and contiguous")

    scenes: list[dict[str, Any]] = []
    for step in steps:
        scene_id = one(dataset, step, iri(CD, "usesScene"))
        focus = one(dataset, scene_id, iri(CD, "focusConcept"))
        items = sorted(objects(dataset, scene_id, iri(CD, "hasSceneItem")), key=lambda item: (integer(dataset, item, iri(CD, "position")), str(item)))
        blocks: list[dict[str, Any]] = []
        for item in items:
            position = integer(dataset, item, iri(CD, "position"))
            selected = one(dataset, item, iri(CD, "selectsResource"))
            role = local_name(one(dataset, item, iri(CD, "communicativeRole")))
            relation_path = literal(dataset, item, iri(CD, "selectionPath"))
            language = literal(dataset, item, iri(CD, "language"))
            block_id = f"{compact(item)}--block"
            if role == "HeadingRole":
                if selected != focus or relation_path != "skos:prefLabel@de":
                    raise ValueError(f"Invalid heading selection in {compact(item)}")
                text = resource_text(dataset, selected, language or "de")
                block: dict[str, Any] = {
                    "id": block_id, "kind": "prose",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "text": text, "format": "plain",
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary", "intent": {"kind": "introduce"},
                }
            elif is_resource_type(dataset, selected, "MathExpression"):
                expression = literal(dataset, selected, iri(CD, "latex"))
                if expression is None:
                    raise ValueError(f"Missing cd:latex for {compact(selected)}")
                focus_label = resource_text(dataset, focus, language or "de")
                block = {
                    "id": block_id, "kind": "math",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "expression": expression,
                    "spokenText": f"Mathematische Formel für {focus_label}",
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary", "intent": {"kind": "explain"},
                }
            elif is_resource_type(dataset, selected, "CodeExample"):
                if role != "CodeRole":
                    raise ValueError(f"Code example {compact(selected)} requires CodeRole")
                code = literal(dataset, selected, iri(CD, "code"))
                programming_language = literal(dataset, selected, iri(CD, "programmingLanguage"))
                if code is None or programming_language is None:
                    raise ValueError(f"Incomplete executable code resource {compact(selected)}")
                block = {
                    "id": block_id, "kind": "code",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "language": programming_language,
                    "code": code,
                    "editable": boolean_literal(dataset, selected, iri(CD, "editable")),
                    "executable": boolean_literal(dataset, selected, iri(CD, "executable")),
                    "fallback": code,
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary", "intent": {"kind": "practice"},
                }
            elif is_resource_type(dataset, selected, "AudiencePoll"):
                if role != "PollRole":
                    raise ValueError(f"Audience poll {compact(selected)} requires PollRole")
                prompt = resource_text(dataset, selected, language or "de")
                option_resources = [value for value in objects(dataset, selected, iri(CD, "hasPollOption")) if isinstance(value, URIRef)]
                if len(option_resources) < 2:
                    raise ValueError(f"Audience poll {compact(selected)} requires at least two options")
                options = [resource_text(dataset, option, language or "de") for option in option_resources]
                sources = [source_reference(dataset, selected, relation_path)] + [
                    source_reference(dataset, option, "cd:hasPollOption") for option in option_resources
                ]
                block = {
                    "id": block_id, "kind": "prompt",
                    "source": sources,
                    "prompt": prompt,
                    "responseMode": "single-choice",
                    "options": options,
                    "fallback": f'{prompt} {" / ".join(options)}',
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary", "intent": {"kind": "practice"},
                }
            elif role == "QuotationRole":
                text = resource_text(dataset, selected, language or "de")
                block = {
                    "id": block_id, "kind": "prose",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "text": text, "format": "plain",
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "primary", "intent": {"kind": "explain"},
                }
            elif role == "CitationRole":
                text = resource_text(dataset, selected, None)
                block = {
                    "id": block_id, "kind": "prose",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "text": text, "format": "plain",
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": "supporting", "intent": {"kind": "emphasize"},
                }
            else:
                raise ValueError(f"Unsupported communicative role {role}")
            blocks.append(block)
        scene_compact = compact(scene_id)
        scenes.append({
            "id": f"{scene_compact}--scene",
            "source": [source_reference(dataset, scene_id), source_reference(dataset, focus)],
            "blocks": blocks,
            "readingOrder": [block["id"] for block in blocks],
            "accessibility": {"label": blocks[0]["text"]},
        })
    return {"version": "1.0", "id": f"{compact(path)}--scene-document", "sourcePathId": compact(path), "scenes": scenes}


def dataset_snapshot(dataset: Dataset, fingerprint: str) -> dict[str, Any]:
    typed_subjects = sorted({subject for subject, _p, _o, _g in dataset.quads((None, RDF.type, None, None)) if isinstance(subject, URIRef) and str(subject).startswith(EX)}, key=str)
    entity_ids = set(typed_subjects)
    entities: list[dict[str, Any]] = []
    for subject in typed_subjects:
        labels = literal(dataset, subject, SKOS.prefLabel, "de") or literal(dataset, subject, DCTERMS.title) or literal(dataset, subject, iri(SCHEMA, "name")) or local_name(subject)
        description = literal(dataset, subject, iri(CD, "body"), "de") or literal(dataset, subject, DCTERMS.description, "de")
        entity: dict[str, Any] = {
            "id": compact(subject), "label": labels,
            "semanticTypes": sorted(compact(value) for value in objects(dataset, subject, RDF.type) if isinstance(value, URIRef)),
            "source": [source_reference(dataset, subject)],
        }
        if description:
            entity["description"] = description
        external = [str(value) for value in objects(dataset, subject, DCTERMS.source) if isinstance(value, URIRef)]
        if external:
            entity["externalReferences"] = [{"uri": value} for value in sorted(external)]
        entities.append(entity)

    statements: list[dict[str, Any]] = []
    for subject, predicate, target, graph in dataset.quads((None, None, None, None)):
        if subject not in entity_ids or target not in entity_ids or predicate == RDF.type:
            continue
        statements.append({
            "sourceEntityId": compact(subject), "predicateId": compact(predicate),
            "targetEntityId": compact(target), "predicateLabel": local_name(predicate),
            "source": [{"resourceId": compact(subject), "provenanceIds": [str(graph)]}],
        })
    statements.sort(key=lambda item: (item["sourceEntityId"], item["predicateId"], item["targetEntityId"]))
    return {
        "version": "1.0", "identity": f"sha256:{fingerprint}",
        "entities": entities, "statements": statements,
        "supportedPredicates": sorted({item["predicateId"] for item in statements}),
        "source": [{"resourceId": "canonical-trig-dataset", "provenanceIds": sorted(str(path.relative_to(ROOT)) for path in (ROOT / "ontology" / "dataset").glob("*.trig"))}],
    }


def default_selection_request() -> CourseUnitPathSelectionRequest:
    return CourseUnitPathSelectionRequest(
        offering_id=DEFAULT_OFFERING_ID,
        placement_id=DEFAULT_PLACEMENT_ID,
        unit_id=DEFAULT_UNIT_ID,
    )


def build_artifact(
    selection_request: CourseUnitPathSelectionRequest | None = None,
) -> dict[str, Any]:
    request = selection_request or default_selection_request()
    dataset = assemble_dataset()
    selection = select_course_unit_path(dataset, request)
    fingerprint = dataset_fingerprint(dataset)
    fingerprint_identity = f"sha256:{fingerprint}"
    return {
        "artifactVersion": "1.0", "datasetFingerprint": fingerprint_identity,
        "datasetSnapshot": dataset_snapshot(dataset, fingerprint),
        "teachingOfferingDocuments": [
            project_teaching_offering_runtime_document(
                dataset,
                request.offering_id,
                fingerprint_identity,
            )
        ],
        "sceneDocuments": [compile_scene_document(dataset, selection.path)],
    }


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def fallback_attributes(sources: list[dict[str, Any]]) -> str:
    attributes = []
    resource_ids = sorted({source["resourceId"] for source in sources})
    provenance_ids = sorted({value for source in sources for value in source.get("provenanceIds", [])})
    relation_paths = sorted({source["relationPath"] for source in sources if source.get("relationPath")})
    if resource_ids:
        attributes.append(f'data-resource-id="{html.escape(" ".join(resource_ids), quote=True)}"')
    if provenance_ids:
        attributes.append(f'data-provenance-ids="{html.escape(" ".join(provenance_ids), quote=True)}"')
    if relation_paths:
        attributes.append(f'data-relation-path="{html.escape(" ".join(relation_paths), quote=True)}"')
    return " " + " ".join(attributes) if attributes else ""


def static_fallback(artifact: dict[str, Any]) -> str:
    document = artifact["sceneDocuments"][0]
    articles = []
    for scene in document["scenes"]:
        blocks = []
        for block in scene["blocks"]:
            if block["kind"] == "math":
                blocks.append(
                    f'<div class="math-fallback" role="math" aria-label="{html.escape(block["spokenText"], quote=True)}"{fallback_attributes(block["source"])}>'
                    f'<code>{html.escape(block["expression"])}</code>'
                    f'</div>'
                )
                continue
            if block["kind"] == "code":
                blocks.append(
                    f'<div class="code-fallback" data-code-block-id="{html.escape(block["id"], quote=True)}" '
                    f'data-language="{html.escape(block["language"], quote=True)}"{fallback_attributes(block["source"])}>'
                    f'<pre><code>{html.escape(block["fallback"])}</code></pre>'
                    f'</div>'
                )
                continue
            if block["kind"] == "prompt":
                poll_key = block["source"][0]["resourceId"]
                option_ids = " ".join(source["resourceId"] for source in block["source"][1:])
                options = "".join(f'<li>{html.escape(option)}</li>' for option in block["options"])
                blocks.append(
                    f'<div class="poll-fallback" data-poll-key="{html.escape(poll_key, quote=True)}" '
                    f'data-poll-option-ids="{html.escape(option_ids, quote=True)}"{fallback_attributes(block["source"])}>'
                    f'<p>{html.escape(block["prompt"])}</p><ul>{options}</ul>'
                    f'</div>'
                )
                continue
            tag = "h2" if block["intent"]["kind"] == "introduce" else "blockquote" if block["intent"]["kind"] == "explain" else "cite"
            class_name = ' class="lead"' if tag == "blockquote" else ' class="citation"' if tag == "cite" else ""
            blocks.append(
                f'<{tag}{class_name}{fallback_attributes(block["source"])}>'
                f'{html.escape(block["text"])}'
                f'</{tag}>'
            )
        articles.append(
            f'<article data-pitch-step="{html.escape(scene["id"], quote=True)}" '
            f'data-source-path-id="{html.escape(document["sourcePathId"], quote=True)}"{fallback_attributes(scene["source"])}>'
            + "".join(blocks)
            + "</article>"
        )
    return "\n".join(articles)


def rendered_index(artifact: dict[str, Any]) -> str:
    source = PITCH_INDEX.read_text(encoding="utf-8")
    generated = static_fallback(artifact)
    pattern = r"(?s)(<!-- canonical-runtime-fallback:start -->).*?(<!-- canonical-runtime-fallback:end -->)"
    replacement = lambda match: f"{match.group(1)}\n{generated}\n        {match.group(2)}"
    updated, count = re.subn(pattern, replacement, source, count=1)
    if count != 1:
        raise ValueError("Missing canonical runtime fallback markers in apps/pitch/index.html")
    return updated


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--check", action="store_true", help="fail when an existing artifact differs")
    parser.add_argument("--offering-id", default=DEFAULT_OFFERING_ID)
    parser.add_argument("--placement-id", default=DEFAULT_PLACEMENT_ID)
    parser.add_argument("--unit-id", default=DEFAULT_UNIT_ID)
    parser.add_argument("--path-id")
    parser.add_argument("--path-graph-id")
    args = parser.parse_args()
    artifact = build_artifact(
        CourseUnitPathSelectionRequest(
            offering_id=args.offering_id,
            placement_id=args.placement_id,
            unit_id=args.unit_id,
            requested_path_id=args.path_id,
            requested_path_graph_id=args.path_graph_id,
        )
    )
    rendered = canonical_json(artifact)
    rendered_html = rendered_index(artifact)
    output = args.output if args.output.is_absolute() else ROOT / args.output
    if args.check:
        if not output.exists() or output.read_text(encoding="utf-8") != rendered:
            raise SystemExit(f"Stale or missing generated artifact: {output.relative_to(ROOT)}")
        if PITCH_INDEX.read_text(encoding="utf-8") != rendered_html:
            raise SystemExit("Stale canonical runtime static fallback: apps/pitch/index.html")
        return 0
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(rendered, encoding="utf-8")
    PITCH_INDEX.write_text(rendered_html, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
