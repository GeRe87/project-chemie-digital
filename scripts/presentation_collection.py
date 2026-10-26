"""Compile a scientific collection using the existing exact path/scene compiler."""
from rdflib import Dataset, RDF, SKOS, URIRef
import generate_canonical_runtime as R
from presentation_metadata import project_title

SCHEMA = "https://schema.org/"


def build_collection_artifact(collection_id: str, *, snapshot_language="en"):
    dataset = R.assemble_dataset()
    collection = URIRef(collection_id)
    owners = [g for _s, _p, _o, g in dataset.quads((collection, RDF.type, URIRef(SCHEMA + "Collection"), None))]
    if len(owners) != 1:
        raise ValueError("Collection must have exactly one canonical named-graph identity")
    graph = dataset.graph(owners[0])
    talks = sorted(set(graph.objects(collection, URIRef(SCHEMA + "hasPart"))), key=str)
    if not talks:
        raise ValueError("Presentation collection is empty")
    documents, bindings, records = [], [], []
    scoped = Dataset()
    # Public metadata exports only selected resources and their outgoing closure,
    # retaining quad provenance. Do not export unrelated repository resources.
    pending, visited = [collection], set()
    while pending:
        subject = pending.pop()
        if subject in visited:
            continue
        visited.add(subject)
        for s, p, o, g in dataset.quads((subject, None, None, None)):
            scoped.add((s, p, o, g))
            if isinstance(o, URIRef) and str(o).startswith(R.EX):
                pending.append(o)
    for talk in talks:
        if not R.is_resource_type(dataset, talk, "ScientificTalk"):
            raise ValueError("Collection member is not a ScientificTalk")
        path = R.one(dataset, talk, R.iri(R.CD, "presentationPath"))
        graphs = [g for _s, _p, _o, g in dataset.quads((path, RDF.type, R.iri(R.CD, "LearningPath"), None))]
        if len(graphs) != 1:
            raise ValueError("Presentation path requires one exact named graph; ambiguous paths fail closed")
        reference = R.CoursePathReference(str(path), str(graphs[0]))
        document = R.compile_scene_document(dataset, reference)
        if any(b["pathId"] == str(path) for b in bindings):
            raise ValueError("Two talks cannot silently share one presentation path")
        documents.append(document)
        bindings.append(R.scene_document_binding(reference, document))
        metadata = project_title(dataset, talk)
        records.append({"id": str(talk), "title": metadata["title"],
                        **({"event": metadata["event"]} if "event" in metadata else {}),
                        "pathId": str(path), "pathGraphId": str(graphs[0])})
    fingerprint = R.dataset_fingerprint(dataset)
    bindings.sort(key=lambda item: (item["pathId"], item["pathGraphId"]))
    snapshot = R.dataset_snapshot(scoped, fingerprint, snapshot_language)
    snapshot["source"] = [{"resourceId": str(collection), "provenanceIds": sorted({str(g) for *_spo, g in scoped.quads((None, None, None, None))})}]
    collection_document = {"version": "1.0", "id": str(collection), "graphId": str(owners[0]),
        "title": R.deterministic_authored_literal(dataset, collection, SKOS.prefLabel, snapshot_language), "talks": records}
    return {"artifactVersion": "1.0", "datasetFingerprint": f"sha256:{fingerprint}",
            "datasetSnapshot": snapshot, "teachingOfferingDocuments": [],
            "presentationCollection": collection_document, "sceneDocuments": documents, "sceneDocumentBindings": bindings}
