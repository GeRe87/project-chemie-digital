#!/usr/bin/env python3
"""Generate canonical runtime artifacts with generic semantic media enrichment.

This is a thin additive launcher around ``generate_canonical_runtime.py``. The base
compiler remains responsible for course/path/scene resolution; this launcher adds the
renderer-neutral media-reference groups defined in ``media_scene_projection`` before
serializing the disposable runtime artifact.
"""
from __future__ import annotations

import argparse
import html
import re
from pathlib import Path
from typing import Any

import generate_canonical_runtime as base
from media_scene_projection import enrich_scene_documents_with_media


def build_artifact(
    selection_request: base.CourseUnitPathSelectionRequest | None = None,
) -> dict[str, Any]:
    artifact = base.build_artifact(selection_request)
    dataset = base.assemble_dataset()
    artifact["sceneDocuments"] = enrich_scene_documents_with_media(
        artifact["sceneDocuments"],
        dataset,
    )
    return artifact


def _media_fallback_markup(block: dict[str, Any]) -> str:
    media_type = block.get("mediaType")
    media_type_attribute = (
        f' data-media-type="{html.escape(str(media_type), quote=True)}"'
        if media_type
        else ""
    )
    return (
        f'<figure class="media-reference-fallback" data-media-block-id="{html.escape(block["id"], quote=True)}"'
        f'{media_type_attribute}{base.fallback_attributes(block["source"])}>'
        f'<img src="{html.escape(block["uri"], quote=True)}" '
        f'alt="{html.escape(block["alternativeText"], quote=True)}" />'
        f'</figure>'
    )


def inject_media_fallback(rendered_html: str, artifact: dict[str, Any]) -> str:
    """Add semantic logo media to the generated no-script HTML fallback.

    The base compiler already renders the attribution text. We append the media children
    generated from that same attribution immediately after its fallback element, keeping
    the static HTML and SceneDocument projection semantically aligned.
    """
    updated = rendered_html
    document = artifact["sceneDocuments"][0]
    for scene in document["scenes"]:
        for block in scene["blocks"]:
            if block.get("kind") != "group":
                continue
            children = block.get("children", [])
            prose = next((child for child in children if child.get("kind") == "prose"), None)
            media = [child for child in children if child.get("kind") == "media-reference"]
            if prose is None or not media:
                continue
            source_ids = [
                source.get("resourceId")
                for source in prose.get("source", [])
                if isinstance(source.get("resourceId"), str)
            ]
            if not source_ids:
                continue
            resource_id = source_ids[0]
            media_markup = "".join(_media_fallback_markup(child) for child in media)
            pattern = re.compile(
                rf'(<cite\b[^>]*data-resource-id="[^"]*{re.escape(resource_id)}[^"]*"[^>]*>.*?</cite>)',
                re.DOTALL,
            )
            updated, count = pattern.subn(lambda match: match.group(1) + media_markup, updated, count=1)
            if count != 1:
                raise ValueError(f"Could not align static media fallback for {resource_id}")
    return updated


def rendered_index(base_artifact: dict[str, Any], artifact: dict[str, Any]) -> str:
    return inject_media_fallback(base.rendered_index(base_artifact), artifact)


def validate_cogniflow_opening_chart(artifact: dict[str, Any]) -> None:
    """Fail closed if the opening black-box scene regresses to the legacy 4.0–5.6 min trace."""
    documents = artifact.get("sceneDocuments", [])
    if len(documents) != 1:
        raise ValueError("CogniFlow runtime requires exactly one SceneDocument")
    scenes = documents[0].get("scenes", [])
    scene = next(
        (candidate for candidate in scenes if candidate.get("id") == "ex:scene-cogniflow-processing-black-box--scene"),
        None,
    )
    if scene is None:
        raise ValueError("CogniFlow opening black-box scene is missing")
    chart = next((block for block in scene.get("blocks", []) if block.get("kind") == "chart"), None)
    if chart is None:
        raise ValueError("CogniFlow opening black-box chart is missing")
    series = chart.get("series", [])
    data = series[0].get("data", []) if series else []
    if len(data) != 61:
        raise ValueError(f"CogniFlow opening chart expected 61 points, got {len(data)}")
    if data[0].get("x") != 0.0 or data[-1].get("x") != 12.0:
        raise ValueError(
            f"CogniFlow opening chart expected x-range 0.0–12.0 min, "
            f"got {data[0].get('x')}–{data[-1].get('x')}"
        )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=base.DEFAULT_OUTPUT)
    parser.add_argument("--check", action="store_true", help="fail when an existing artifact differs")
    parser.add_argument("--offering-id", default=base.DEFAULT_OFFERING_ID)
    parser.add_argument("--placement-id", default=base.DEFAULT_PLACEMENT_ID)
    parser.add_argument("--unit-id", default=base.DEFAULT_UNIT_ID)
    parser.add_argument("--path-id")
    parser.add_argument("--path-graph-id")
    args = parser.parse_args()

    request = base.CourseUnitPathSelectionRequest(
        offering_id=args.offering_id,
        placement_id=args.placement_id,
        unit_id=args.unit_id,
        requested_path_id=args.path_id,
        requested_path_graph_id=args.path_graph_id,
    )
    base_artifact = base.build_artifact(request)
    dataset = base.assemble_dataset()
    artifact = dict(base_artifact)
    artifact["sceneDocuments"] = enrich_scene_documents_with_media(
        base_artifact["sceneDocuments"],
        dataset,
    )
    validate_cogniflow_opening_chart(artifact)

    rendered = base.canonical_json(artifact)
    rendered_html = rendered_index(base_artifact, artifact)
    output = args.output if args.output.is_absolute() else base.ROOT / args.output

    if args.check:
        if not output.exists() or output.read_text(encoding="utf-8") != rendered:
            raise SystemExit(f"Stale or missing generated artifact: {output.relative_to(base.ROOT)}")
        if base.PITCH_INDEX.read_text(encoding="utf-8") != rendered_html:
            raise SystemExit("Stale canonical runtime static fallback: apps/pitch/index.html")
        return 0

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(rendered, encoding="utf-8", newline="\n")
    base.PITCH_INDEX.write_text(rendered_html, encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
