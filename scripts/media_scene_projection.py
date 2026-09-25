#!/usr/bin/env python3
"""Generic RDF -> SceneDocument enrichment for semantically linked media.

The canonical compiler projects ordinary scene prose first. This module preserves that
authored text while enriching the resulting block with renderer-neutral
``media-reference`` children whenever the selected resource carries ``cd:hasMedia``
or an Attribution resolves to an Organization logo.

No presentation-specific URI is invented by the renderer: relationships, media URI,
media type and accessible alternative are all read from the canonical RDF Dataset.
"""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Iterable

from rdflib import Dataset, Literal, URIRef

CD = "https://w3id.org/project-chemie-digital/ontology/"
EX = "https://w3id.org/project-chemie-digital/resource/"

AFFILIATED_WITH = URIRef(CD + "affiliatedWith")
FUNDING_SOURCE = URIRef(CD + "fundingSource")
HAS_LOGO = URIRef(CD + "hasLogo")
HAS_MEDIA = URIRef(CD + "hasMedia")
MEDIA_URI = URIRef(CD + "uri")
MEDIA_TYPE = URIRef(CD + "mediaType")
ALTERNATIVE_TEXT = URIRef(CD + "alternativeText")


def compact(value: URIRef | str) -> str:
    text = str(value)
    if text.startswith(EX):
        return "ex:" + text[len(EX) :]
    if text.startswith(CD):
        return "cd:" + text[len(CD) :]
    return text


def expand(value: str) -> URIRef | None:
    if value.startswith("ex:"):
        return URIRef(EX + value[3:])
    if value.startswith("cd:"):
        return URIRef(CD + value[3:])
    if value.startswith("http://") or value.startswith("https://"):
        return URIRef(value)
    return None


def objects(dataset: Dataset, subject: URIRef, predicate: URIRef) -> list[Any]:
    return sorted(
        {obj for _s, _p, obj, _g in dataset.quads((subject, predicate, None, None))},
        key=lambda value: value.n3(),
    )


def one_iri(dataset: Dataset, subject: URIRef, predicate: URIRef) -> URIRef | None:
    values = [value for value in objects(dataset, subject, predicate) if isinstance(value, URIRef)]
    if not values:
        return None
    if len(values) != 1:
        raise ValueError(
            f"Expected one {compact(predicate)} for {compact(subject)}, got {len(values)}"
        )
    return values[0]


def literal(dataset: Dataset, subject: URIRef, predicate: URIRef, language: str | None = None) -> str | None:
    values = [value for value in objects(dataset, subject, predicate) if isinstance(value, Literal)]
    if language is not None:
        preferred = [value for value in values if value.language == language]
        if preferred:
            values = preferred
    if not values:
        return None
    values.sort(key=lambda value: (value.language or "", str(value.datatype or ""), str(value)))
    return str(values[0])


def source_reference(dataset: Dataset, resource: URIRef, relation_path: str | None = None) -> dict[str, Any]:
    value: dict[str, Any] = {"resourceId": compact(resource)}
    provenance = sorted(
        {str(graph) for _s, _p, _o, graph in dataset.quads((resource, None, None, None))}
    )
    if provenance:
        value["provenanceIds"] = provenance
    if relation_path:
        value["relationPath"] = relation_path
    return value


def unique_sources(sources: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[tuple[Any, ...]] = set()
    result: list[dict[str, Any]] = []
    for source in sources:
        key = (
            source.get("resourceId"),
            tuple(source.get("provenanceIds", [])),
            source.get("relationPath"),
        )
        if key in seen:
            continue
        seen.add(key)
        result.append(source)
    return result


def media_payload(dataset: Dataset, media: URIRef) -> dict[str, Any]:
    uri = literal(dataset, media, MEDIA_URI)
    media_type = literal(dataset, media, MEDIA_TYPE)
    alternative = literal(dataset, media, ALTERNATIVE_TEXT, "en") or literal(
        dataset, media, ALTERNATIVE_TEXT
    )
    if not uri or not alternative:
        raise ValueError(f"Incomplete media asset {compact(media)}")
    return {
        "media": media,
        "uri": uri,
        "mediaType": media_type,
        "alternativeText": alternative,
    }


def direct_media(dataset: Dataset, resource: URIRef) -> list[dict[str, Any]]:
    bindings: list[dict[str, Any]] = []
    for media in objects(dataset, resource, HAS_MEDIA):
        if not isinstance(media, URIRef):
            continue
        bindings.append(
            {
                "purpose": "direct",
                "predicate": "cd:hasMedia",
                **media_payload(dataset, media),
            }
        )
    return bindings


def attribution_media(dataset: Dataset, attribution: URIRef) -> list[dict[str, Any]]:
    bindings: list[dict[str, Any]] = []
    for predicate, purpose in (
        (AFFILIATED_WITH, "affiliation"),
        (FUNDING_SOURCE, "funding"),
    ):
        organizations = [
            value for value in objects(dataset, attribution, predicate) if isinstance(value, URIRef)
        ]
        for organization in organizations:
            logo = one_iri(dataset, organization, HAS_LOGO)
            if logo is None:
                continue
            bindings.append(
                {
                    "purpose": purpose,
                    "predicate": compact(predicate),
                    "organization": organization,
                    **media_payload(dataset, logo),
                }
            )
    return bindings


def _resource_for_block(block: dict[str, Any]) -> URIRef | None:
    for source in block.get("source", []):
        resource_id = source.get("resourceId")
        if not isinstance(resource_id, str):
            continue
        resource = expand(resource_id)
        if resource is not None:
            return resource
    return None


def enrich_scene_documents_with_media(
    scene_documents: list[dict[str, Any]] | tuple[dict[str, Any], ...],
    dataset: Dataset,
) -> list[dict[str, Any]]:
    """Return a deep-copied SceneDocument list with semantic media groups."""
    documents = deepcopy(list(scene_documents))
    for document in documents:
        for scene in document.get("scenes", []):
            enriched_blocks: list[dict[str, Any]] = []
            for block in scene.get("blocks", []):
                if block.get("kind") != "prose":
                    enriched_blocks.append(block)
                    continue

                resource = _resource_for_block(block)
                if resource is None:
                    enriched_blocks.append(block)
                    continue

                bindings = direct_media(dataset, resource) + attribution_media(dataset, resource)
                if not bindings:
                    enriched_blocks.append(block)
                    continue

                text_child = deepcopy(block)
                text_child["id"] = f'{block["id"]}--text'
                text_child.pop("disclosure", None)

                children: list[dict[str, Any]] = [text_child]
                group_sources = list(block.get("source", []))
                for index, binding in enumerate(bindings, start=1):
                    if binding["purpose"] == "direct":
                        media_sources = [
                            source_reference(dataset, resource, "cd:hasMedia"),
                            source_reference(dataset, binding["media"], "cd:uri"),
                        ]
                    else:
                        media_sources = [
                            source_reference(dataset, resource, binding["predicate"]),
                            source_reference(dataset, binding["organization"], "cd:hasLogo"),
                            source_reference(dataset, binding["media"], "cd:uri"),
                        ]

                    media_block: dict[str, Any] = {
                        "id": f'{block["id"]}--media-{index}',
                        "kind": "media-reference",
                        "source": media_sources,
                        "uri": binding["uri"],
                        "alternativeText": binding["alternativeText"],
                        "emphasis": "supporting",
                        "intent": {"kind": "emphasize"},
                        "accessibility": {"label": binding["alternativeText"]},
                        "version": "semantic-media-v1",
                    }
                    if binding["mediaType"]:
                        media_block["mediaType"] = binding["mediaType"]
                    children.append(media_block)
                    group_sources.extend(media_sources)

                group: dict[str, Any] = {
                    "id": block["id"],
                    "kind": "group",
                    "source": unique_sources(group_sources),
                    "children": children,
                    "readingOrder": [child["id"] for child in children],
                }
                for key in ("disclosure", "emphasis", "intent", "accessibility"):
                    if key in block:
                        group[key] = deepcopy(block[key])
                enriched_blocks.append(group)

            scene["blocks"] = enriched_blocks
            scene["readingOrder"] = [block["id"] for block in enriched_blocks]
    return documents
