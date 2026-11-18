"""Prepare rendered review packets and keep RDF review evidence revision-bound."""
from __future__ import annotations

import argparse
import hashlib
import json
from types import SimpleNamespace
from pathlib import Path
from datetime import datetime, timezone

from rdflib import Dataset, Literal, Namespace, RDF, URIRef
from rdf_dataset import ROOT, assemble_dataset, dataset_fingerprint
from generate_canonical_runtime import CoursePathReference, compile_scene_document

CD = Namespace("https://w3id.org/project-chemie-digital/ontology/")
EX = Namespace("https://w3id.org/project-chemie-digital/resource/")
REVIEW_GRAPH = URIRef("https://w3id.org/project-chemie-digital/graph/review/evidence")
DIMENSIONS = ("accuracy", "reasoning", "prerequisites", "answer-fit", "visual")


def one(dataset, subject, predicate):
    values = {o for _, _, o, _ in dataset.quads((subject, predicate, None, None))}
    if len(values) != 1:
        raise ValueError(f"Expected one {predicate} on {subject}")
    return next(iter(values))


def sequence_context(dataset, sequence):
    path = one(dataset, sequence, CD.reviewPath)
    path_graph = one(dataset, sequence, CD.reviewPathGraph)
    document = compile_scene_document(dataset, CoursePathReference(str(path), str(path_graph)))
    ids = [scene["id"] for scene in document["scenes"]]
    start = "ex:" + str(one(dataset, sequence, CD.reviewStartScene)).split("/")[-1] + "--scene"
    end = "ex:" + str(one(dataset, sequence, CD.reviewEndScene)).split("/")[-1] + "--scene"
    first, last = ids.index(start), ids.index(end)
    if first > last:
        raise ValueError("Review end must follow review start in the selected path")
    return document["scenes"][first:last + 1]


def source_stamp(dataset, root=ROOT):
    # Conservative scope: any canonical content or shared presentation change
    # invalidates the packet, including changes in a shared illustration.
    paths = set()
    for folder in ("apps/pitch/src", "apps/pitch/public/chemometrics", "packages", "scripts"):
        paths.update(p for p in (root / folder).rglob("*")
                     if p.is_file() and p.suffix in {".ts", ".css", ".svg", ".py", ".cjs", ".mts"}
                     and "node_modules" not in p.parts and "__pycache__" not in p.parts)
    paths.update(p for p in (root / "package-lock.json", root / "package.json") if p.exists())
    digest = hashlib.sha256(dataset_fingerprint(dataset).encode())
    for path in sorted(paths):
        digest.update(path.relative_to(root).as_posix().encode())
        digest.update(path.read_bytes())
    return digest.hexdigest()


def evidence_stamp(packet_dir):
    manifest_path = packet_dir / "blind" / "capture.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    digest = hashlib.sha256(manifest_path.read_bytes())
    if not manifest["screens"]:
        raise ValueError("Review requires captured screens")
    for screen in manifest["screens"]:
        path = (packet_dir / "blind" / screen["image"]).resolve()
        if path.parent != (packet_dir / "blind").resolve():
            raise ValueError("Captured image must be inside the blind review packet")
        digest.update(path.read_bytes())
    return digest.hexdigest()


def prepare(args):
    dataset = assemble_dataset()
    stamp = source_stamp(dataset)
    fingerprint = "sha256:" + dataset_fingerprint(dataset)
    for sequence in sorted({s for s, _, _, _ in dataset.quads((None, RDF.type, CD.ReviewSequence, None))}):
        scenes = sequence_context(dataset, sequence)
        folder = args.out / str(sequence).split("/")[-1] / stamp[:16]
        folder.mkdir(parents=True, exist_ok=True)
        blind = folder / "blind"
        blind.mkdir(exist_ok=True)
        audience = str(one(dataset, sequence, CD.reviewAudience))
        prerequisites = str(one(dataset, sequence, CD.reviewPrerequisites))
        (blind / "review-instructions.txt").write_text(
            f"Audience: {audience}\nPrior knowledge: {prerequisites}\n"
            "Inspect the numbered images in order before reading the intent file. "
            "For each transition, reconstruct the open question, visible evidence and justified conclusion. "
            "Record gaps with the scene and stage. Then compare against intent.trig. "
            "Assess accuracy, reasoning, prerequisites, answer-fit and visual clarity independently. "
            "A model review records a reasoned assessment. Learner performance requires actual learner responses.\n",
            encoding="utf-8",
        )
        packet = {
            "sequence": str(sequence), "sourceStamp": stamp,
            "datasetFingerprint": fingerprint,
            "scenes": [scene["id"] for scene in scenes],
            "preview": "authoring-anova-intro",
        }
        (folder / "packet.json").write_text(json.dumps(packet, indent=2), encoding="utf-8")
        intent = Dataset()
        graph = intent.graph(URIRef("https://w3id.org/project-chemie-digital/graph/review/intent"))
        for _, predicate, obj, _ in dataset.quads((sequence, None, None, None)):
            graph.add((sequence, predicate, obj))
        intent.serialize(folder / "intent.trig", format="trig")
        print(folder)


def record(args, verified_source=None, verified_evidence=None):
    packet_dir = args.packet.resolve()
    packet = json.loads((packet_dir / "packet.json").read_text(encoding="utf-8"))
    if (verified_source or source_stamp(assemble_dataset())) != packet["sourceStamp"]:
        raise ValueError("Packet is stale. Prepare and capture the current version before recording a review.")
    if args.dimension not in DIMENSIONS or args.assessment not in ("reviewed", "needs-revision"):
        raise ValueError("Unsupported review dimension or assessment")
    if not args.reviewer.strip() or not args.reconstruction.strip():
        raise ValueError("Reviewer and reconstruction are required")
    if args.scene and args.scene not in packet["scenes"]:
        raise ValueError("Finding scene is outside the reviewed sequence")
    captures = json.loads((packet_dir / "blind" / "capture.json").read_text(encoding="utf-8"))
    if args.stage is not None and not any(
        screen["scene"] == args.scene and screen["stage"] == args.stage for screen in captures["screens"]
    ):
        raise ValueError("Finding stage was not captured")
    if args.assessment == "needs-revision" and not all(
        (args.finding, args.recommendation, args.scene, args.stage is not None)
    ):
        raise ValueError("A revision finding requires scene, stage, finding and recommendation")
    path = packet_dir / "reviews.trig"
    dataset = Dataset()
    if path.exists():
        dataset.parse(path, format="trig")
    graph = dataset.graph(REVIEW_GRAPH)
    now = datetime.now(timezone.utc).isoformat()
    subject = URIRef(str(packet["sequence"]) + "/review/" + hashlib.sha256(now.encode()).hexdigest()[:16])
    fields = {
        RDF.type: CD.DidacticReview, CD.reviewSequence: URIRef(packet["sequence"]),
        CD.reviewSourceStamp: Literal(packet["sourceStamp"]),
        CD.reviewEvidenceStamp: Literal(verified_evidence or evidence_stamp(packet_dir)),
        CD.reviewDimension: Literal(args.dimension), CD.reviewAssessment: Literal(args.assessment),
        CD.reviewReviewer: Literal(args.reviewer), CD.reviewedAt: Literal(now),
        CD.reviewReconstruction: Literal(args.reconstruction),
    }
    for predicate, value in fields.items():
        graph.add((subject, predicate, value))
    for predicate, value in ((CD.reviewFinding, args.finding), (CD.reviewRecommendation, args.recommendation),
                             (CD.reviewScene, args.scene), (CD.reviewStage, args.stage)):
        if value is not None:
            graph.add((subject, predicate, Literal(value)))
    dataset.serialize(path, format="trig")
    print(path)


def record_batch(args):
    submitted = Dataset()
    submitted.parse(args.report, format="trig")
    subjects = {subject for subject, _, _, _ in submitted.quads((None, RDF.type, CD.DidacticReview, None))}
    if not subjects:
        raise ValueError("Report must contain review assessments")
    source = source_stamp(assemble_dataset())
    evidence = evidence_stamp(args.packet.resolve())
    for subject in sorted(subjects, key=str):
        fields = dict(packet=args.packet, dimension=str(one(submitted, subject, CD.reviewDimension)),
                      assessment=str(one(submitted, subject, CD.reviewAssessment)),
                      reviewer=str(one(submitted, subject, CD.reviewReviewer)),
                      reconstruction=str(one(submitted, subject, CD.reviewReconstruction)))
        for name, predicate in (("scene", CD.reviewScene), ("stage", CD.reviewStage),
                                ("finding", CD.reviewFinding), ("recommendation", CD.reviewRecommendation)):
            values = {obj for _, _, obj, _ in submitted.quads((subject, predicate, None, None))}
            if len(values) > 1:
                raise ValueError("Review finding fields must be unambiguous")
            value = next(iter(values), None)
            fields[name] = None
            if value is not None:
                fields[name] = int(value) if name == "stage" else str(value)
        record(SimpleNamespace(**fields), verified_source=source, verified_evidence=evidence)


def check(args):
    packet_dir = args.packet.resolve()
    packet = json.loads((packet_dir / "packet.json").read_text(encoding="utf-8"))
    if source_stamp(assemble_dataset()) != packet["sourceStamp"]:
        print("STALE — canonical content or presentation sources changed")
        return 1
    evidence = evidence_stamp(packet_dir)
    dataset = Dataset()
    path = packet_dir / "reviews.trig"
    if path.exists():
        dataset.parse(path, format="trig")
    graph = dataset.graph(REVIEW_GRAPH)
    latest = {}
    for subject in graph.subjects(RDF.type, CD.DidacticReview):
        if str(graph.value(subject, CD.reviewSequence)) != packet["sequence"]:
            continue
        if str(graph.value(subject, CD.reviewSourceStamp)) != packet["sourceStamp"]:
            continue
        if str(graph.value(subject, CD.reviewEvidenceStamp)) != evidence:
            continue
        dimension = str(graph.value(subject, CD.reviewDimension))
        date = str(graph.value(subject, CD.reviewedAt))
        if dimension not in latest or date > latest[dimension][0]:
            latest[dimension] = (date, str(graph.value(subject, CD.reviewAssessment)))
    status = {dimension: latest.get(dimension, ("", "pending"))[1] for dimension in DIMENSIONS}
    for dimension, assessment in status.items():
        print(f"{dimension}: {assessment}")
    return 0 if all(value == "reviewed" for value in status.values()) else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    command = commands.add_parser("prepare")
    command.add_argument("--out", type=Path, default=ROOT / ".local" / "didactic-review")
    command = commands.add_parser("record-batch")
    command.add_argument("--packet", type=Path, required=True)
    command.add_argument("--report", type=Path, required=True)
    for name in ("record", "check"):
        command = commands.add_parser(name)
        command.add_argument("--packet", type=Path, required=True)
        if name == "record":
            command.add_argument("--dimension", choices=DIMENSIONS, required=True)
            command.add_argument("--assessment", choices=("reviewed", "needs-revision"), required=True)
            command.add_argument("--reviewer", required=True)
            command.add_argument("--reconstruction", required=True)
            command.add_argument("--scene")
            command.add_argument("--stage", type=int)
            command.add_argument("--finding")
            command.add_argument("--recommendation")
    args = parser.parse_args()
    if args.command == "prepare":
        prepare(args)
    elif args.command == "record":
        record(args)
    elif args.command == "record-batch":
        record_batch(args)
    else:
        raise SystemExit(check(args))


if __name__ == "__main__":
    main()
