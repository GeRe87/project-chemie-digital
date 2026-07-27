#!/usr/bin/env python3
"""Generate deterministic browser/runtime artifacts from the canonical TriG Dataset.

The generated JSON is disposable transport. Audience-visible content remains authored
only in ``ontology/dataset/*.trig``.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Iterable

from rdflib import DCTERMS, RDF, SKOS, Dataset, Literal, URIRef

from rdf_dataset import assemble_dataset, dataset_fingerprint

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "apps" / "pitch" / "src" / "generated" / "canonical-runtime.json"
CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"
GRAPH = "https://w3id.org/project-chemie-digital/graph/"
SCHEMA = "https://schema.org/"


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


def resource_text(dataset: Dataset, resource: URIRef, language: str | None) -> str:
    candidates = (
        iri(CD, "body"),
        iri(CD, "expression"),
        iri(CD, "notation"),
        DCTERMS.description,
        SKOS.prefLabel,
        DCTERMS.title,
        iri(SCHEMA, "name"),
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


def compile_scene_document(dataset: Dataset) -> dict[str, Any]:
    learning_paths = sorted(
        {
            subject
            for subject, _predicate, _obj, _graph in dataset.quads((None, RDF.type, iri(CD, "LearningPath"), None))
            if isinstance(subject, URIRef)
        },
        key=str,
    )
    if len(learning_paths) != 1:
        raise ValueError(f"Expected exactly one canonical LearningPath, got {len(learning_paths)}")
    path = learning_paths[0]
    steps = sorted(objects(dataset, path, iri(CD, "hasStep")), key=lambda step: (integer(dataset, step, iri(CD, "position")), str(step)))
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
            if role == "HeadingRole":
                if selected != focus or relation_path != "skos:prefLabel@de":
                    raise ValueError(f"Invalid heading selection in {compact(item)}")
                text = resource_text(dataset, selected, language or "de")
                intent, emphasis = "introduce", "primary"
            elif role == "QuotationRole":
                text = resource_text(dataset, selected, language or "de")
                intent, emphasis = "explain", "primary"
            elif role == "CitationRole":
                text = resource_text(dataset, selected, None)
                intent, emphasis = "emphasize", "supporting"
            else:
                raise ValueError(f"Unsupported communicative role {role}")
            block_id = f"{compact(item)}--block"
            blocks.append(
                {
                    "id": block_id,
                    "kind": "prose",
                    "source": [source_reference(dataset, selected, relation_path)],
                    "text": text,
                    "format": "plain",
                    "disclosure": {"order": position - 1, "mode": "initial"},
                    "emphasis": emphasis,
                    "intent": {"kind": intent},
                }
            )
        scene_compact = compact(scene_id)
        scenes.append(
            {
                "id": f"{scene_compact}--scene",
                "source": [source_reference(dataset, scene_id), source_reference(dataset, focus)],
                "blocks": blocks,
                "readingOrder": [block["id"] for block in blocks],
                "accessibility": {"label": blocks[0]["text"]},
            }
        )
    return {
        "version": "1.0",
        "id": f"{compact(path)}--scene-document",
        "sourcePathId": compact(path),
        "scenes": scenes,
    }


def dataset_snapshot(dataset: Dataset, fingerprint: str) -> dict[str, Any]:
    typed_subjects = sorted(
        {
            subject
            for subject, _predicate, _obj, _graph in dataset.quads((None, RDF.type, None, None))
            if isinstance(subject, URIRef) and str(subject).startswith(EX)
        },
        key=str,
    )
    entity_ids = set(typed_subjects)
    entities: list[dict[str, Any]] = []
    for subject in typed_subjects:
        labels = (
            literal(dataset, subject, SKOS.prefLabel, "de")
            or literal(dataset, subject, DCTERMS.title)
            or literal(dataset, subject, iri(SCHEMA, "name"))
            or local_name(subject)
        )
        description = literal(dataset, subject, iri(CD, "body"), "de") or literal(dataset, subject, DCTERMS.description, "de")
        entity: dict[str, Any] = {
            "id": compact(subject),
            "label": labels,
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
        statements.append(
            {
                "sourceEntityId": compact(subject),
                "predicateId": compact(predicate),
                "targetEntityId": compact(target),
                "predicateLabel": local_name(predicate),
                "source": [{"resourceId": compact(subject), "provenanceIds": [str(graph)]}],
            }
        )
    statements.sort(key=lambda item: (item["sourceEntityId"], item["predicateId"], item["targetEntityId"]))
    supported = sorted({item["predicateId"] for item in statements})
    return {
        "version": "1.0",
        "identity": f"sha256:{fingerprint}",
        "entities": entities,
        "statements": statements,
        "supportedPredicates": supported,
        "source": [{"resourceId": "canonical-trig-dataset", "provenanceIds": sorted(str(path.relative_to(ROOT)) for path in (ROOT / "ontology" / "dataset").glob("*.trig"))}],
    }


def build_artifact() -> dict[str, Any]:
    dataset = assemble_dataset(include_legacy=False)
    fingerprint = dataset_fingerprint(dataset)
    return {
        "artifactVersion": "1.0",
        "datasetFingerprint": f"sha256:{fingerprint}",
        "datasetSnapshot": dataset_snapshot(dataset, fingerprint),
        "sceneDocuments": [compile_scene_document(dataset)],
    }


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--check", action="store_true", help="fail when an existing artifact differs")
    args = parser.parse_args()
    rendered = canonical_json(build_artifact())
    output = args.output if args.output.is_absolute() else ROOT / args.output
    if args.check:
        if not output.exists() or output.read_text(encoding="utf-8") != rendered:
            raise SystemExit(f"Stale or missing generated artifact: {output.relative_to(ROOT)}")
        return 0
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(rendered, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
