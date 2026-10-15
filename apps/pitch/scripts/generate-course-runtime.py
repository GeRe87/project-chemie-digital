from __future__ import annotations

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


def main() -> int:
    base_artifact = RUNTIME.build_offering_artifact(
        CHEMOMETRICS_OFFERING,
        snapshot_language="en",
    )
    dataset = RUNTIME.assemble_dataset()
    artifact = dict(base_artifact)
    artifact["sceneDocuments"] = enrich_scene_documents_with_media(
        base_artifact["sceneDocuments"],
        dataset,
    )
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(RUNTIME.canonical_json(artifact), encoding="utf-8", newline="\n")
    RUNTIME.PITCH_INDEX.write_text(
        MEDIA.rendered_index(base_artifact, artifact),
        encoding="utf-8",
        newline="\n",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
