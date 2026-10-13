from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import generate_canonical_runtime as RUNTIME  # noqa: E402
from media_scene_projection import enrich_scene_documents_with_media  # noqa: E402
import generate_canonical_runtime_media as MEDIA  # noqa: E402

OUTPUT = ROOT / "apps" / "pitch" / "src" / "generated" / "canonical-runtime.json"
CHEMOMETRICS_OFFERING = (
    "https://w3id.org/project-chemie-digital/resource/"
    "teaching-offering-chemometrics-applied-statistics"
)


def generate_course(offering_id: str, *, language: str = "en") -> dict:
    base_artifact = RUNTIME.build_offering_artifact(
        offering_id,
        snapshot_language=language,
    )
    dataset = RUNTIME.assemble_dataset()
    artifact = dict(base_artifact)
    artifact["sceneDocuments"] = enrich_scene_documents_with_media(
        base_artifact["sceneDocuments"],
        dataset,
    )
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(RUNTIME.canonical_json(artifact), encoding="utf-8", newline="\n")
    offering = artifact["teachingOfferingDocuments"][0]["offering"]
    labels = offering["labels"]
    label = next((item["value"] for item in labels if item.get("language") == language),
                 labels[0]["value"] if labels else offering["id"])
    title = html.escape(label)
    shell = MEDIA.rendered_index(base_artifact, artifact)
    shell = re.sub(r"<html lang=\"[^\"]*\">", f'<html lang="{html.escape(language, quote=True)}">', shell)
    shell = re.sub(r"<title>.*?</title>", lambda _: f"<title>{title}</title>", shell)
    shell = re.sub(r'<div class="reveal" aria-label="[^"]*">', lambda _: f'<div class="reveal" aria-label="{title}">', shell)
    shell = re.sub(r'<h1 id="pitch-static-title">.*?</h1>', lambda _: f'<h1 id="pitch-static-title">{title}</h1>', shell)
    shell = re.sub(r'(<h1 id="pitch-static-title">.*?</h1>\s*)<p>.*?</p>', r'\1<p>Static course content; interactive navigation requires JavaScript.</p>', shell)
    fallback = "\n".join(RUNTIME.static_fallback({"sceneDocuments": [document]}) for document in artifact["sceneDocuments"])
    shell = re.sub(r"(<!-- canonical-runtime-fallback:start -->).*?(<!-- canonical-runtime-fallback:end -->)",
                   lambda match: match[1] + "\n" + fallback + "\n" + match[2], shell, flags=re.DOTALL)
    RUNTIME.PITCH_INDEX.write_text(shell, encoding="utf-8", newline="\n")
    return artifact


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a semantically selected offering using the existing course pipeline.")
    parser.add_argument("--offering-id", default=CHEMOMETRICS_OFFERING)
    parser.add_argument("--language", default="en")
    args = parser.parse_args()
    generate_course(args.offering_id, language=args.language)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
