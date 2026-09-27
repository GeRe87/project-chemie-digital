from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import generate_canonical_runtime as RUNTIME  # noqa: E402

OUTPUT = ROOT / "apps" / "self-study" / "src" / "generated" / "canonical-runtime.json"
CHEMOMETRICS_OFFERING = (
    "https://w3id.org/project-chemie-digital/resource/"
    "teaching-offering-chemometrics-applied-statistics"
)


def main() -> int:
    artifact = RUNTIME.build_offering_artifact(
        CHEMOMETRICS_OFFERING,
        snapshot_language="en",
    )
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(RUNTIME.canonical_json(artifact), encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
