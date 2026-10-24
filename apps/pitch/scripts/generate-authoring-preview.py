"""Generate a bounded local preview using the real semantic compiler, not mock data.

Does not regenerate index.html or the ordinary course/runtime transports.
"""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "scripts"))
import generate_canonical_runtime as runtime


def main():
    parser = argparse.ArgumentParser()
    for name in ("offering-id", "placement-id", "unit-id", "path-id", "path-graph-id"):
        parser.add_argument("--" + name, required=True)
    parser.add_argument("--scene-limit", type=int)
    args = parser.parse_args()
    if args.scene_limit is not None and args.scene_limit < 1:
        parser.error("scene-limit must be positive")
    artifact = runtime.build_artifact(runtime.CourseUnitPathSelectionRequest(
        offering_id=args.offering_id, placement_id=args.placement_id, unit_id=args.unit_id,
        requested_path_id=args.path_id, requested_path_graph_id=args.path_graph_id))
    if args.scene_limit:
        artifact["sceneDocuments"] = [{**d, "scenes": d["scenes"][:args.scene_limit]} for d in artifact["sceneDocuments"]]
    public = ROOT / "apps/pitch/public"
    public.mkdir(parents=True, exist_ok=True)
    (public / "authoring-runtime.json").write_text(runtime.canonical_json(artifact), encoding="utf-8")
    (public / "authoring-static.html").write_text(
        '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Static lecture preview</title><main>'
        + runtime.static_fallback(artifact) + '</main></html>', encoding="utf-8")
    print(f"Generated {sum(len(d['scenes']) for d in artifact['sceneDocuments'])} scenes in apps/pitch/public/authoring-runtime.json")


if __name__ == "__main__":
    main()
