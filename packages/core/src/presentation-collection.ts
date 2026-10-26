import type { CanonicalRuntimeSceneDocumentBinding } from "./canonical-runtime.ts";

/** Disposable, renderer-neutral projection of one canonical scientific collection. */
export interface PresentationCollection {
  readonly version: "1.0";
  readonly id: string;
  readonly graphId: string;
  readonly title: string;
  readonly talks: readonly { readonly id: string; readonly title: string; readonly event?: { readonly name: string };
    readonly pathId: string; readonly pathGraphId: string }[];
}

export function resolvePresentationCollection<T extends { readonly id: string }>(collection: PresentationCollection,
  documents: readonly T[], bindings: readonly CanonicalRuntimeSceneDocumentBinding[]) {
  const iri = (v: unknown) => typeof v === "string" && /^https?:\/\/[^\s]+$/.test(v);
  if (!collection || collection.version !== "1.0" || !collection.title?.trim() || !iri(collection.id)
    || !iri(collection.graphId) || !Array.isArray(collection.talks) || !collection.talks.length) throw new Error("Invalid presentation collection");
  const seen = new Set<string>(), bound = new Set<string>();
  const result = collection.talks.map(talk => {
    if (!iri(talk.id) || !iri(talk.pathId) || !iri(talk.pathGraphId) || !talk.title?.trim()
      || (talk.event && !talk.event.name?.trim())) throw new Error("Invalid scientific talk record");
    if (seen.has(talk.id)) throw new Error("Duplicate talk identity");
    seen.add(talk.id);
    const matches = bindings.filter(b => b.pathId === talk.pathId && b.pathGraphId === talk.pathGraphId);
    if (matches.length !== 1) throw new Error("Talk requires an exact path/graph binding");
    const entries = documents.filter(d => d.id === matches[0]!.sceneDocumentId);
    if (entries.length !== 1 || bound.has(entries[0]!.id)) throw new Error("Missing or duplicate talk document");
    bound.add(entries[0]!.id);
    return { ...talk, document: entries[0]! };
  });
  if (bound.size !== documents.length || bindings.length !== result.length) throw new Error("Collection contains unbound documents");
  return result;
}
