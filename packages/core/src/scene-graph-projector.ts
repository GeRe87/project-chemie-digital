import type { SourceReference } from "./scene-document.ts";
import type {
  KnowledgeNetworkDocument,
  KnowledgeNetworkEdge,
  KnowledgeNetworkNode,
  RdfDatasetEntity,
  RdfDatasetSnapshot,
  RdfDatasetStatement,
} from "./knowledge-network.ts";
import {
  canonicalSerializeKnowledgeNetworkDocument,
  RDF_DATASET_SNAPSHOT_VERSION,
} from "./knowledge-network.ts";
import {
  canonicalizeSceneGraphProjectionRequest,
  SceneGraphViewContractError,
  type SceneGraphProjectionRequest,
  type SceneResourceBinding,
} from "./scene-graph-view-contracts.ts";

export const SCENE_KNOWLEDGE_NETWORK_VERSION = "1.0" as const;

export interface SceneKnowledgeNetworkNode extends KnowledgeNetworkNode {
  readonly classification: "selected" | "related";
  readonly blockIds: readonly string[];
  readonly relationPaths: readonly (readonly string[])[];
}

export interface SceneKnowledgeNetworkDocument extends Omit<KnowledgeNetworkDocument, "nodes"> {
  readonly sceneContext: {
    readonly version: "1.0";
    readonly sceneId: string;
    readonly sceneRevision: string;
    readonly relationAllowlistVersion: string;
  };
  readonly nodes: readonly SceneKnowledgeNetworkNode[];
}

export type SceneGraphProjectionDiagnosticCode =
  | "INVALID_REQUEST"
  | "INVALID_DATASET"
  | "UNKNOWN_SELECTED_RESOURCE"
  | "UNSUPPORTED_PREDICATE"
  | "AMBIGUOUS_DATASET_METADATA"
  | "SCENE_GRAPH_PROJECTION_VIOLATION";

export interface SceneGraphProjectionDiagnostic {
  readonly code: SceneGraphProjectionDiagnosticCode;
  readonly message: string;
  readonly resourceId?: string;
  readonly predicateId?: string;
}

export interface SceneGraphProjectionResult {
  readonly document?: SceneKnowledgeNetworkDocument;
  readonly diagnostics: readonly SceneGraphProjectionDiagnostic[];
}

class ProjectionError extends Error {
  readonly code: SceneGraphProjectionDiagnosticCode;
  readonly resourceId?: string;
  readonly predicateId?: string;

  constructor(
    code: SceneGraphProjectionDiagnosticCode,
    message: string,
    resourceId?: string,
    predicateId?: string,
  ) {
    super(message);
    this.code = code;
    this.resourceId = resourceId;
    this.predicateId = predicateId;
  }
}

const ABSOLUTE_IRI = /^[A-Za-z][A-Za-z0-9+.-]*:[^\s]+$/;
const compare = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;
const unique = (values: readonly string[]): readonly string[] => Object.freeze([...new Set(values)].sort(compare));
const stableId = (prefix: string, parts: readonly string[]): string => `${prefix}:${parts.map(encodeURIComponent).join("|")}`;
const statementKey = (value: RdfDatasetStatement): string => `${value.sourceEntityId}\u0000${value.predicateId}\u0000${value.targetEntityId}`;

function canonicalSources(values: readonly SourceReference[]): readonly SourceReference[] {
  const valuesByKey = new Map<string, SourceReference>();
  for (const value of values) {
    const normalized = Object.freeze({
      resourceId: value.resourceId,
      ...(value.provenanceIds ? { provenanceIds: unique(value.provenanceIds) } : {}),
      ...(value.relationPath ? { relationPath: value.relationPath } : {}),
    });
    valuesByKey.set(JSON.stringify(normalized), normalized);
  }
  return Object.freeze([...valuesByKey.values()].sort((a, b) => compare(JSON.stringify(a), JSON.stringify(b))));
}

function requireIri(value: string, label: string): void {
  if (value.startsWith("_:") || !ABSOLUTE_IRI.test(value)) throw new ProjectionError("INVALID_DATASET", `${label} must be an absolute RDF IRI`, value);
}

function validateSnapshot(snapshot: RdfDatasetSnapshot): Map<string, RdfDatasetEntity> {
  if (snapshot.version !== RDF_DATASET_SNAPSHOT_VERSION || snapshot.identity.length === 0 || snapshot.source.length === 0) {
    throw new ProjectionError("INVALID_DATASET", "Dataset snapshot contract is incomplete");
  }
  const entityById = new Map<string, RdfDatasetEntity>();
  for (const entity of snapshot.entities) {
    requireIri(entity.id, "entity.id");
    if (entityById.has(entity.id)) throw new ProjectionError("AMBIGUOUS_DATASET_METADATA", `Duplicate entity ${entity.id}`, entity.id);
    if (entity.label.trim().length === 0 || entity.source.length === 0) throw new ProjectionError("INVALID_DATASET", `Entity ${entity.id} requires label and provenance`, entity.id);
    entityById.set(entity.id, entity);
  }
  const supported = new Set(snapshot.supportedPredicates);
  const labels = new Map<string, string>();
  for (const predicate of supported) requireIri(predicate, "supported predicate");
  for (const statement of snapshot.statements) {
    requireIri(statement.sourceEntityId, "statement source");
    requireIri(statement.predicateId, "statement predicate");
    requireIri(statement.targetEntityId, "statement target");
    if (!entityById.has(statement.sourceEntityId) || !entityById.has(statement.targetEntityId) || statement.source.length === 0) {
      throw new ProjectionError("INVALID_DATASET", "Statement references incomplete dataset metadata");
    }
    if (!supported.has(statement.predicateId)) throw new ProjectionError("INVALID_DATASET", `Statement uses undeclared predicate ${statement.predicateId}`, undefined, statement.predicateId);
    const prior = labels.get(statement.predicateId);
    if (prior !== undefined && prior !== statement.predicateLabel) throw new ProjectionError("AMBIGUOUS_DATASET_METADATA", `Conflicting label for ${statement.predicateId}`, undefined, statement.predicateId);
    if (statement.predicateLabel.trim().length === 0) throw new ProjectionError("INVALID_DATASET", `Predicate ${statement.predicateId} requires a label`, undefined, statement.predicateId);
    labels.set(statement.predicateId, statement.predicateLabel);
  }
  return entityById;
}

function bindingMetadata(bindings: readonly SceneResourceBinding[]): Map<string, { blockIds: string[]; relationPaths: string[][] }> {
  const result = new Map<string, { blockIds: string[]; relationPaths: string[][] }>();
  for (const binding of bindings) {
    for (const resourceId of [...binding.resourceIds, ...binding.provenanceResourceIds]) {
      const current = result.get(resourceId) ?? { blockIds: [], relationPaths: [] };
      current.blockIds.push(binding.blockId);
      current.relationPaths.push([...binding.relationPath]);
      result.set(resourceId, current);
    }
  }
  return result;
}

export function projectSceneKnowledgeNetwork(snapshot: RdfDatasetSnapshot, request: SceneGraphProjectionRequest): SceneGraphProjectionResult {
  try {
    let canonicalRequest: SceneGraphProjectionRequest;
    try {
      canonicalRequest = canonicalizeSceneGraphProjectionRequest(request);
    } catch (error) {
      throw new ProjectionError("INVALID_REQUEST", error instanceof SceneGraphViewContractError ? error.message : "Invalid projection request");
    }
    const entityById = validateSnapshot(snapshot);
    const supported = new Set(snapshot.supportedPredicates);
    for (const predicate of canonicalRequest.directRelationAllowlist.relationIds) {
      if (!supported.has(predicate)) throw new ProjectionError("UNSUPPORTED_PREDICATE", `Unsupported predicate ${predicate}`, undefined, predicate);
    }
    const metadata = bindingMetadata(canonicalRequest.bindings);
    const selectedIds = new Set(metadata.keys());
    if (selectedIds.size === 0) throw new ProjectionError("INVALID_REQUEST", "At least one selected or provenance resource is required");
    for (const resourceId of selectedIds) {
      if (!entityById.has(resourceId)) throw new ProjectionError("UNKNOWN_SELECTED_RESOURCE", `Unknown selected resource ${resourceId}`, resourceId);
    }

    const allowlist = new Set(canonicalRequest.directRelationAllowlist.relationIds);
    const statements = new Map<string, RdfDatasetStatement>();
    const nodeIds = new Set(selectedIds);
    for (const statement of snapshot.statements) {
      if (!allowlist.has(statement.predicateId)) continue;
      if (!selectedIds.has(statement.sourceEntityId) && !selectedIds.has(statement.targetEntityId)) continue;
      nodeIds.add(statement.sourceEntityId);
      nodeIds.add(statement.targetEntityId);
      const key = statementKey(statement);
      const previous = statements.get(key);
      statements.set(key, previous ? Object.freeze({ ...previous, source: canonicalSources([...previous.source, ...statement.source]) }) : statement);
    }

    const nodes: SceneKnowledgeNetworkNode[] = [...nodeIds].sort(compare).map((id) => {
      const entity = entityById.get(id)!;
      const binding = metadata.get(id);
      return Object.freeze({
        id: stableId("kn-node", [id]),
        semanticEntityId: id,
        semanticTypes: unique(entity.semanticTypes),
        label: entity.label,
        ...(entity.description ? { description: entity.description } : {}),
        source: canonicalSources(entity.source),
        ...(entity.externalReferences ? { externalReferences: Object.freeze([...entity.externalReferences]) } : {}),
        classification: selectedIds.has(id) ? "selected" as const : "related" as const,
        blockIds: unique(binding?.blockIds ?? []),
        relationPaths: Object.freeze((binding?.relationPaths ?? []).map((path) => Object.freeze([...path])).sort((a, b) => compare(JSON.stringify(a), JSON.stringify(b)))),
      });
    });
    const edges: KnowledgeNetworkEdge[] = [...statements.values()].sort((a, b) => compare(statementKey(a), statementKey(b))).map((statement) => Object.freeze({
      id: stableId("kn-edge", [statement.sourceEntityId, statement.predicateId, statement.targetEntityId]),
      sourceNodeId: stableId("kn-node", [statement.sourceEntityId]),
      targetNodeId: stableId("kn-node", [statement.targetEntityId]),
      predicateId: statement.predicateId,
      label: statement.predicateLabel,
      directed: true as const,
      source: canonicalSources(statement.source),
    }));
    const projection = Object.freeze({ version: "1.0" as const, rootEntityIds: unique([...selectedIds]), includedPredicates: unique([...allowlist]), maximumDepth: 1, groupingPolicy: "none" as const });
    const document: SceneKnowledgeNetworkDocument = Object.freeze({
      version: "1.0",
      id: stableId("scene-knowledge-network", [snapshot.identity, canonicalRequest.sceneId, canonicalRequest.sceneRevision, JSON.stringify(projection)]),
      datasetIdentity: snapshot.identity,
      projection,
      nodes: Object.freeze(nodes),
      edges: Object.freeze(edges),
      accessibility: Object.freeze({
        label: `Knowledge network for scene ${canonicalRequest.sceneId}`,
        description: `Renderer-neutral one-hop scene network with ${nodes.length} nodes and ${edges.length} directed relations.`,
        nodeReadingOrder: Object.freeze(nodes.map((node) => node.id)),
        edgeReadingOrder: Object.freeze(edges.map((edge) => edge.id)),
        staticFallback: ["Nodes:", ...nodes.map((node) => `- ${node.label} [${node.classification}] (${node.semanticEntityId})`), "Relations:", ...(edges.length ? edges.map((edge) => `- ${edge.sourceNodeId} — ${edge.label} → ${edge.targetNodeId}`) : ["- None"])].join("\n"),
      }),
      source: canonicalSources(snapshot.source),
      sceneContext: Object.freeze({ version: SCENE_KNOWLEDGE_NETWORK_VERSION, sceneId: canonicalRequest.sceneId, sceneRevision: canonicalRequest.sceneRevision, relationAllowlistVersion: canonicalRequest.directRelationAllowlist.version }),
    });
    canonicalSerializeKnowledgeNetworkDocument(document);
    return Object.freeze({ document, diagnostics: Object.freeze([]) });
  } catch (error) {
    const diagnostic = error instanceof ProjectionError
      ? { code: error.code, message: error.message, ...(error.resourceId ? { resourceId: error.resourceId } : {}), ...(error.predicateId ? { predicateId: error.predicateId } : {}) }
      : { code: "SCENE_GRAPH_PROJECTION_VIOLATION" as const, message: "Unexpected scene graph projection contract violation" };
    return Object.freeze({ diagnostics: Object.freeze([Object.freeze(diagnostic)]) });
  }
}

export function canonicalSerializeSceneKnowledgeNetworkDocument(document: SceneKnowledgeNetworkDocument): string {
  return canonicalSerializeKnowledgeNetworkDocument(document);
}
