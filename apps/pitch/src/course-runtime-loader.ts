import {
  validateCanonicalRuntimeArtifact,
  type CanonicalRuntimeSceneDocumentBinding,
  type TeachingOfferingRuntimeDocument,
} from "../../../packages/core/src/canonical-runtime.ts";
import type { RdfDatasetSnapshot } from "../../../packages/core/src/knowledge-network.ts";
import type { CanonicalRuntimeArtifact } from "./graph-scene-data.ts";
import { resolvePublicAssetUrl } from "./public-asset-url.ts";

export interface SharedGraphReference {
  readonly path: string;
  readonly sha256: string;
}

export interface CourseManifestDocument {
  readonly id: string;
  readonly pathId: string;
  readonly sceneIds: readonly string[];
  readonly runtime: string;
  readonly sha256?: string;
}

export interface CourseRuntimeManifest {
  readonly transportVersion?: "2.0";
  readonly datasetFingerprint: string;
  readonly offering: TeachingOfferingRuntimeDocument;
  readonly bindings: readonly CanonicalRuntimeSceneDocumentBinding[];
  readonly documents: readonly CourseManifestDocument[];
  readonly sharedGraph?: SharedGraphReference;
}

const SHA256 = /^sha256:[0-9a-f]{64}$/;
const TRANSPORT_PATH = /^course-runtime\/[A-Za-z0-9_-]+\.json$/;

// Canonical SceneDocuments preserve the generator's compact path spelling;
// exact offering bindings carry the corresponding absolute IRI. Compare their
// identity without changing either authored representation in the transport.
function pathIdentity(value: string): string {
  const prefixes: Readonly<Record<string, string>> = {
    ex: "https://w3id.org/project-chemie-digital/resource/",
    cd: "https://w3id.org/project-chemie-digital/ontology/",
    skos: "http://www.w3.org/2004/02/skos/core#",
    dct: "http://purl.org/dc/terms/",
    schema: "https://schema.org/",
  };
  const separator = value.indexOf(":");
  const namespace = prefixes[value.slice(0, separator)];
  return namespace ? namespace + value.slice(separator + 1) : value;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function array(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function strings(value: unknown, label: string): readonly string[] {
  return array(value, label).map((item, index) => requiredString(item, `${label}[${index}]`));
}

function transportPath(value: unknown): string {
  const path = requiredString(value, "Transport path");
  if (!TRANSPORT_PATH.test(path)) throw new Error("Course transport must reference a local generated JSON file");
  return path;
}

function hash(value: unknown): string {
  const result = requiredString(value, "Transport digest");
  if (!SHA256.test(result)) throw new Error("Course transport digest must use sha256");
  return result;
}

function sharedReference(value: unknown): SharedGraphReference {
  const reference = object(value, "Shared graph reference");
  return { path: transportPath(reference.path), sha256: hash(reference.sha256) };
}

export function parseCourseManifest(value: unknown): CourseRuntimeManifest {
  const manifest = object(value, "Course manifest");
  if (manifest.transportVersion !== undefined && manifest.transportVersion !== "2.0") throw new Error("Unsupported course transport version");
  const offering = object(manifest.offering, "Course offering");
  const fingerprint = hash(manifest.datasetFingerprint ?? offering.datasetFingerprint);
  // Reuse the canonical offering contract without inventing scene bodies for a
  // metadata-only manifest. Exact document bindings are checked below and by
  // the course-world projection before it creates any UI.
  const validated = validateCanonicalRuntimeArtifact({ artifactVersion: "1.0", datasetFingerprint: fingerprint,
    datasetSnapshot: {}, teachingOfferingDocuments: [offering], sceneDocuments: [] });
  if (!Array.isArray(manifest.documents) || manifest.documents.length === 0 || !Array.isArray(manifest.bindings)) {
    throw new Error("Course manifest is missing document metadata or bindings");
  }
  const documents = manifest.documents.map((value): CourseManifestDocument => {
    const entry = object(value, "Course document");
    const sceneIds = strings(entry.sceneIds, "Scene identities");
    if (new Set(sceneIds).size !== sceneIds.length) throw new Error("Duplicate course scene identity");
    return { id: requiredString(entry.id, "Document identity"), pathId: requiredString(entry.pathId, "Path identity"),
      sceneIds, runtime: transportPath(entry.runtime),
      ...(manifest.transportVersion === "2.0" ? { sha256: hash(entry.sha256) } : {}) };
  });
  if (new Set(documents.map(document => document.id)).size !== documents.length) throw new Error("Duplicate course document identity");
  const bindings = manifest.bindings.map((value): CanonicalRuntimeSceneDocumentBinding => {
    const entry = object(value, "Course binding");
    return { pathId: requiredString(entry.pathId, "Binding path"), pathGraphId: requiredString(entry.pathGraphId, "Binding graph"),
      sceneDocumentId: requiredString(entry.sceneDocumentId, "Binding document") };
  });
  for (const document of documents) {
    const matched = bindings.filter(binding => binding.sceneDocumentId === document.id);
    if (matched.length !== 1 || pathIdentity(matched[0]!.pathId) !== pathIdentity(document.pathId)) throw new Error("Course document binding mismatch");
  }
  if (bindings.length !== documents.length) throw new Error("Course bindings do not cover exactly the selected documents");
  return { datasetFingerprint: fingerprint, offering: validated.teachingOfferingDocuments[0]!, documents, bindings,
    ...(manifest.transportVersion === "2.0" ? { transportVersion: "2.0" as const, sharedGraph: sharedReference(manifest.sharedGraph) } : {}) };
}

async function fetchJson(path: string, expectedHash: string | undefined, fetcher: typeof fetch): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetcher(resolvePublicAssetUrl(path), {
      signal: controller.signal, cache: expectedHash ? "force-cache" : "no-cache",
    });
    if (!response.ok) throw new Error(`Could not load ${path} (HTTP ${response.status})`);
    const bytes = await response.arrayBuffer();
    if (expectedHash) {
      if (!globalThis.crypto?.subtle) throw new Error("Verified course loading requires HTTPS or localhost");
      const hashed = await crypto.subtle.digest("SHA-256", bytes);
      const actual = `sha256:${Array.from(new Uint8Array(hashed), byte => byte.toString(16).padStart(2, "0")).join("")}`;
      if (actual !== expectedHash) throw new Error("Course file integrity mismatch; reload to obtain a consistent course revision");
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Course loading timed out. Check your connection and retry.", { cause: error });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function snapshotSources(value: unknown, path: string): void {
  const sources = array(value, path);
  if (sources.length === 0) throw new Error(`${path} must retain at least one source resource`);
  for (const [index, raw] of sources.entries()) {
    const label = `${path}[${index}]`;
    const source = object(raw, label);
    requiredString(source.resourceId, `${label}.resourceId`);
    if (source.provenanceIds !== undefined) strings(source.provenanceIds, `${label}.provenanceIds`);
    if (source.relationPath !== undefined) requiredString(source.relationPath, `${label}.relationPath`);
  }
}

function optionalSnapshotString(value: unknown, path: string): void {
  if (value !== undefined && typeof value !== "string") throw new Error(`${path} must be a string`);
}

/** Hashes bind bytes to a revision, but do not prove their JSON shape. The core
 * graph projectors accept typed snapshots, so validate every raw nested field
 * before exposing either a scoped level or the shared graph to consumers. */
function datasetSnapshot(value: unknown, fingerprint: string): RdfDatasetSnapshot {
  const snapshot = object(value, "datasetSnapshot");
  if (snapshot.version !== "1.0") throw new Error("datasetSnapshot.version must be 1.0");
  if (snapshot.identity !== fingerprint) throw new Error("datasetSnapshot.identity does not match this course revision");
  snapshotSources(snapshot.source, "datasetSnapshot.source");
  strings(snapshot.supportedPredicates, "datasetSnapshot.supportedPredicates");
  for (const [index, raw] of array(snapshot.entities, "datasetSnapshot.entities").entries()) {
    const label = `datasetSnapshot.entities[${index}]`;
    const entity = object(raw, label);
    requiredString(entity.id, `${label}.id`);
    requiredString(entity.label, `${label}.label`);
    strings(entity.semanticTypes, `${label}.semanticTypes`);
    optionalSnapshotString(entity.description, `${label}.description`);
    snapshotSources(entity.source, `${label}.source`);
    if (entity.externalReferences !== undefined) {
      for (const [referenceIndex, rawReference] of array(entity.externalReferences, `${label}.externalReferences`).entries()) {
        const referencePath = `${label}.externalReferences[${referenceIndex}]`;
        const reference = object(rawReference, referencePath);
        requiredString(reference.uri, `${referencePath}.uri`);
        for (const field of ["version", "integrity", "mediaType"] as const) {
          optionalSnapshotString(reference[field], `${referencePath}.${field}`);
        }
      }
    }
  }
  for (const [index, raw] of array(snapshot.statements, "datasetSnapshot.statements").entries()) {
    const label = `datasetSnapshot.statements[${index}]`;
    const statement = object(raw, label);
    for (const field of ["sourceEntityId", "predicateId", "targetEntityId", "predicateLabel"] as const) {
      requiredString(statement[field], `${label}.${field}`);
    }
    snapshotSources(statement.source, `${label}.source`);
    if (statement.requiredReference !== undefined && typeof statement.requiredReference !== "boolean") {
      throw new Error(`${label}.requiredReference must be a boolean`);
    }
  }
  return snapshot as unknown as RdfDatasetSnapshot;
}

export async function loadCourseManifest(fetcher: typeof fetch = fetch): Promise<CourseRuntimeManifest> {
  return parseCourseManifest(await fetchJson("course-runtime/manifest.json", undefined, fetcher));
}

export async function loadCourseLevel(
  manifest: CourseRuntimeManifest,
  selected: CourseManifestDocument,
  fetcher: typeof fetch = fetch,
): Promise<CanonicalRuntimeArtifact> {
  const payload = await fetchJson(selected.runtime, selected.sha256, fetcher);
  const artifact = validateCanonicalRuntimeArtifact(payload);
  const document = artifact.sceneDocuments[0];
  if (artifact.datasetFingerprint !== manifest.datasetFingerprint || artifact.sceneDocuments.length !== 1
      || document?.id !== selected.id || pathIdentity(document.sourcePathId) !== pathIdentity(selected.pathId)
      || JSON.stringify(document.scenes.map(scene => scene.id)) !== JSON.stringify(selected.sceneIds)) {
    throw new Error("Selected runtime identity or revision mismatch");
  }
  if (JSON.stringify(artifact.teachingOfferingDocuments) !== JSON.stringify([manifest.offering])) throw new Error("Selected runtime offering mismatch");
  const binding = artifact.sceneDocumentBindings?.[0];
  const expected = manifest.bindings.find(item => item.sceneDocumentId === selected.id)!;
  if (artifact.sceneDocumentBindings?.length !== 1 || binding?.sceneDocumentId !== selected.id
      || binding.pathId !== expected.pathId || binding.pathGraphId !== expected.pathGraphId) {
    throw new Error("Selected runtime binding mismatch");
  }
  if (manifest.transportVersion === "2.0") {
    const transport = object(object(payload, "Course payload").transport, "Level transport metadata");
    const shared = sharedReference(transport.sharedGraph);
    if (transport.version !== "2.0" || transport.snapshotScope !== "scene-neighborhood"
        || shared.path !== manifest.sharedGraph?.path || shared.sha256 !== manifest.sharedGraph.sha256) {
      throw new Error("Selected runtime shared graph mismatch");
    }
  }
  return { ...artifact, datasetSnapshot: datasetSnapshot(artifact.datasetSnapshot, manifest.datasetFingerprint) };
}

/** Explicit opt-in for a future whole-dataset view; ordinary scene views use the
 * complete per-level neighborhood and never download the global graph. */
export async function loadSharedDatasetSnapshot(
  manifest: CourseRuntimeManifest,
  fetcher: typeof fetch = fetch,
): Promise<RdfDatasetSnapshot> {
  if (!manifest.sharedGraph) throw new Error("Legacy manifests do not expose a separate shared graph");
  const payload = object(await fetchJson(manifest.sharedGraph.path, manifest.sharedGraph.sha256, fetcher), "Shared graph");
  if (payload.transportVersion !== "2.0" || payload.datasetFingerprint !== manifest.datasetFingerprint) throw new Error("Shared graph revision mismatch");
  return datasetSnapshot(payload.datasetSnapshot, manifest.datasetFingerprint);
}
