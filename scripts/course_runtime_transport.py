"""Disposable, content-addressed course transport derived from a canonical artifact.

Scene graph views project a single hop around authored block sources/provenance.
Keep that complete neighborhood (in both directions), plus every original source
record, in each level. The full snapshot remains available once as a shared file.
No RDF identity, authored content or named-graph provenance is rewritten here.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import tempfile
from pathlib import Path
from typing import Any

TRANSPORT_VERSION = "2.0"
PREFIXES = {
    "ex:": "https://w3id.org/project-chemie-digital/resource/",
    "cd:": "https://w3id.org/project-chemie-digital/ontology/",
    "skos:": "http://www.w3.org/2004/02/skos/core#",
    "rdf:": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs:": "http://www.w3.org/2000/01/rdf-schema#",
}


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def digest(value: bytes) -> str:
    return "sha256:" + hashlib.sha256(value).hexdigest()


def absolute_iri(value: str) -> str:
    for prefix, namespace in PREFIXES.items():
        if value.startswith(prefix):
            return namespace + value[len(prefix):]
    return value


def source_ids(value: Any) -> set[str]:
    """Include nested blocks too; their provenance is a conservative superset."""
    result: set[str] = set()
    if isinstance(value, dict):
        for source in value.get("source", []):
            if isinstance(source, dict):
                if isinstance(source.get("resourceId"), str):
                    result.add(absolute_iri(source["resourceId"]))
                result.update(absolute_iri(item) for item in source.get("provenanceIds", []) if isinstance(item, str))
        for child in value.values():
            result.update(source_ids(child))
    elif isinstance(value, list):
        for child in value:
            result.update(source_ids(child))
    return result


def level_snapshot(snapshot: dict[str, Any], document: dict[str, Any]) -> dict[str, Any]:
    """Exact one-hop neighborhood required by current scene graph consumers.

    Do not recursively expand newly related entities: the scene projector itself
    never traverses beyond a directly selected source. Retain every predicate,
    attributed duplicate statement and both edge endpoints, so graph summaries,
    showsResource steps and semantic multi-view bindings behave identically.
    """
    seeds = source_ids(document)
    statements = [statement for statement in snapshot["statements"] if
                  absolute_iri(statement["sourceEntityId"]) in seeds or
                  absolute_iri(statement["targetEntityId"]) in seeds]
    entity_ids = seeds | {absolute_iri(statement[key]) for statement in statements
                         for key in ("sourceEntityId", "targetEntityId")}
    return {
        **snapshot,
        "entities": [entity for entity in snapshot["entities"] if absolute_iri(entity["id"]) in entity_ids],
        "statements": statements,
    }


def build_course_transport(artifact: dict[str, Any]) -> tuple[dict[str, Any], dict[str, bytes]]:
    """Return a manifest and its complete generated file set, excluding HTML."""
    shared = canonical_bytes({
        "transportVersion": TRANSPORT_VERSION,
        "datasetFingerprint": artifact["datasetFingerprint"],
        "datasetSnapshot": artifact["datasetSnapshot"],
    })
    shared_digest = digest(shared)
    shared_name = f"graph-{shared_digest[7:31]}.json"
    shared_reference = {"path": f"course-runtime/{shared_name}", "sha256": shared_digest}
    files = {shared_name: shared}
    documents = []
    for document in artifact["sceneDocuments"]:
        payload = {
            **artifact,
            "datasetSnapshot": level_snapshot(artifact["datasetSnapshot"], document),
            "sceneDocuments": [document],
            "sceneDocumentBindings": [binding for binding in artifact["sceneDocumentBindings"]
                                      if binding["sceneDocumentId"] == document["id"]],
            "transport": {"version": TRANSPORT_VERSION, "snapshotScope": "scene-neighborhood",
                          "sharedGraph": shared_reference},
        }
        encoded = canonical_bytes(payload)
        payload_digest = digest(encoded)
        name = f"level-{payload_digest[7:31]}.json"
        files[name] = encoded
        documents.append({
            "id": document["id"], "pathId": document["sourcePathId"],
            "sceneIds": [scene["id"] for scene in document["scenes"]],
            "runtime": f"course-runtime/{name}", "sha256": payload_digest,
        })
    manifest = {
        "transportVersion": TRANSPORT_VERSION,
        "datasetFingerprint": artifact["datasetFingerprint"],
        "sharedGraph": shared_reference,
        "offering": artifact["teachingOfferingDocuments"][0],
        "documents": documents,
        "bindings": artifact["sceneDocumentBindings"],
    }
    files["manifest.json"] = canonical_bytes(manifest)
    return manifest, files


def replace_transport_directory(directory: Path, files: dict[str, bytes]) -> None:
    """Replace only this generated directory; remove obsolete generated outputs."""
    directory.parent.mkdir(parents=True, exist_ok=True)
    if directory.is_symlink():
        raise ValueError("Generated course-runtime directory must not be a symlink")
    with tempfile.TemporaryDirectory(prefix=".course-runtime-", dir=directory.parent) as temporary:
        stage = Path(temporary) / "ready"
        stage.mkdir()
        for name, contents in files.items():
            if Path(name).name != name:
                raise ValueError("Generated transport filenames must be basenames")
            (stage / name).write_bytes(contents)
        previous = Path(temporary) / "previous"
        if directory.exists():
            directory.rename(previous)
        try:
            stage.rename(directory)
        except OSError:
            if previous.exists():
                previous.rename(directory)
            raise
        if previous.exists():
            shutil.rmtree(previous)
