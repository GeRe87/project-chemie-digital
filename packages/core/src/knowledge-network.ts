import type { SourceReference } from "./scene-document.ts";

export const KNOWLEDGE_NETWORK_DOCUMENT_VERSION = "1.0" as const;
export const RDF_DATASET_SNAPSHOT_VERSION = "1.0" as const;

export interface VersionedExternalReference {
  readonly uri: string;
  readonly version?: string;
  readonly integrity?: string;
  readonly mediaType?: string;
}

export interface RdfDatasetEntity {
  readonly id: string;
  readonly label: string;
  readonly semanticTypes: readonly string[];
  readonly description?: string;
  readonly source: readonly SourceReference[];
  readonly externalReferences?: readonly VersionedExternalReference[];
}

export interface RdfDatasetStatement {
  readonly sourceEntityId: string;
  readonly predicateId: string;
  readonly targetEntityId: string;
  readonly predicateLabel: string;
  readonly source: readonly SourceReference[];
  readonly requiredReference?: boolean;
}

export interface RdfDatasetSnapshot {
  readonly version: "1.0";
  readonly identity: string;
  readonly entities: readonly RdfDatasetEntity[];
  readonly statements: readonly RdfDatasetStatement[];
  readonly supportedPredicates: readonly string[];
  readonly source: readonly SourceReference[];
}

export interface KnowledgeNetworkProjectionOptions {
  readonly rootEntityIds: readonly string[];
  readonly includedPredicates: readonly string[];
  readonly maximumDepth: number;
  readonly groupingPolicy: "none" | "semantic-type";
}

export interface KnowledgeNetworkProjectionDescriptor extends KnowledgeNetworkProjectionOptions {
  readonly version: "1.0";
}

export interface KnowledgeNetworkNode {
  readonly id: string;
  readonly semanticEntityId: string;
  readonly semanticTypes: readonly string[];
  readonly label: string;
  readonly description?: string;
  readonly source: readonly SourceReference[];
  readonly externalReferences?: readonly VersionedExternalReference[];
  readonly groupIds?: readonly string[];
}

export interface KnowledgeNetworkEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly predicateId: string;
  readonly label: string;
  readonly directed: true;
  readonly source: readonly SourceReference[];
}

export interface KnowledgeNetworkGroup {
  readonly id: string;
  readonly label: string;
  readonly memberNodeIds: readonly string[];
}

export interface KnowledgeNetworkAccessibility {
  readonly label: string;
  readonly description: string;
  readonly nodeReadingOrder: readonly string[];
  readonly edgeReadingOrder: readonly string[];
  readonly staticFallback: string;
}

export interface KnowledgeNetworkDocument {
  readonly version: "1.0";
  readonly id: string;
  readonly datasetIdentity: string;
  readonly projection: KnowledgeNetworkProjectionDescriptor;
  readonly nodes: readonly KnowledgeNetworkNode[];
  readonly edges: readonly KnowledgeNetworkEdge[];
  readonly groups?: readonly KnowledgeNetworkGroup[];
  readonly accessibility: KnowledgeNetworkAccessibility;
  readonly source: readonly SourceReference[];
}

export type KnowledgeNetworkDiagnosticCode =
  | "UNSUPPORTED_DATASET_CONTRACT_VERSION"
  | "INVALID_DATASET"
  | "INVALID_PROJECTION_OPTIONS"
  | "UNKNOWN_ROOT_ENTITY"
  | "UNSUPPORTED_PREDICATE"
  | "MISSING_ACCESSIBLE_LABEL"
  | "UNRESOLVED_REQUIRED_REFERENCE"
  | "KNOWLEDGE_NETWORK_CONTRACT_VIOLATION";

export interface KnowledgeNetworkDiagnostic {
  readonly code: KnowledgeNetworkDiagnosticCode;
  readonly message: string;
  readonly entityId?: string;
  readonly predicateId?: string;
}

export interface KnowledgeNetworkProjectionResult {
  readonly document?: KnowledgeNetworkDocument;
  readonly diagnostics: readonly KnowledgeNetworkDiagnostic[];
}

class ProjectionError extends Error {
  readonly code: KnowledgeNetworkDiagnosticCode;
  readonly entityId?: string;
  readonly predicateId?: string;

  constructor(code: KnowledgeNetworkDiagnosticCode, message: string, entityId?: string, predicateId?: string) {
    super(message);
    this.code = code;
    this.entityId = entityId;
    this.predicateId = predicateId;
  }
}

function canonicalStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function canonicalSources(values: readonly SourceReference[]): readonly SourceReference[] {
  const byKey = new Map<string, SourceReference>();
  for (const value of values) {
    const provenanceIds = value.provenanceIds ? canonicalStrings(value.provenanceIds) : undefined;
    const normalized = { resourceId: value.resourceId, ...(provenanceIds ? { provenanceIds } : {}) };
    byKey.set(JSON.stringify(normalized), normalized);
  }
  return [...byKey.values()].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function canonicalExternalReferences(values: readonly VersionedExternalReference[]): readonly VersionedExternalReference[] {
  const normalized = values.map((value) => ({
    uri: value.uri,
    ...(value.version ? { version: value.version } : {}),
    ...(value.integrity ? { integrity: value.integrity } : {}),
    ...(value.mediaType ? { mediaType: value.mediaType } : {}),
  }));
  return [...new Map(normalized.map((value) => [JSON.stringify(value), value])).values()].sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b)),
  );
}

function requireNonEmpty(value: string, code: KnowledgeNetworkDiagnosticCode, message: string, entityId?: string): void {
  if (value.length === 0) throw new ProjectionError(code, message, entityId);
}

function stableId(prefix: string, parts: readonly string[]): string {
  return `${prefix}:${parts.map((part) => encodeURIComponent(part)).join("|")}`;
}

function validateDataset(snapshot: RdfDatasetSnapshot): void {
  if ((snapshot as { version?: unknown }).version !== RDF_DATASET_SNAPSHOT_VERSION) {
    throw new ProjectionError(
      "UNSUPPORTED_DATASET_CONTRACT_VERSION",
      `Unsupported RDF dataset snapshot version: ${String((snapshot as { version?: unknown }).version)}`,
    );
  }
  requireNonEmpty(snapshot.identity, "INVALID_DATASET", "Dataset identity must be non-empty");
  if (snapshot.source.length === 0) throw new ProjectionError("INVALID_DATASET", "Dataset source must not be empty");

  const entities = new Set<string>();
  for (const entity of snapshot.entities) {
    requireNonEmpty(entity.id, "INVALID_DATASET", "Entity id must be non-empty");
    if (entities.has(entity.id)) throw new ProjectionError("INVALID_DATASET", `Duplicate entity ${entity.id}`, entity.id);
    entities.add(entity.id);
    requireNonEmpty(entity.label, "MISSING_ACCESSIBLE_LABEL", `Entity ${entity.id} requires a label`, entity.id);
    if (entity.source.length === 0) throw new ProjectionError("INVALID_DATASET", `Entity ${entity.id} requires source metadata`, entity.id);
    for (const reference of entity.externalReferences ?? []) {
      requireNonEmpty(reference.uri, "UNRESOLVED_REQUIRED_REFERENCE", `Entity ${entity.id} has an unresolved external reference`, entity.id);
    }
  }

  const supported = new Set(snapshot.supportedPredicates);
  for (const predicate of snapshot.supportedPredicates) requireNonEmpty(predicate, "INVALID_DATASET", "Supported predicate must be non-empty");
  for (const statement of snapshot.statements) {
    requireNonEmpty(statement.sourceEntityId, "INVALID_DATASET", "Statement source must be non-empty");
    requireNonEmpty(statement.targetEntityId, "INVALID_DATASET", "Statement target must be non-empty");
    requireNonEmpty(statement.predicateId, "INVALID_DATASET", "Statement predicate must be non-empty");
    requireNonEmpty(statement.predicateLabel, "MISSING_ACCESSIBLE_LABEL", `Predicate ${statement.predicateId} requires a label`, undefined);
    if (!entities.has(statement.sourceEntityId)) {
      throw new ProjectionError("INVALID_DATASET", `Unknown statement source ${statement.sourceEntityId}`, statement.sourceEntityId);
    }
    if (!entities.has(statement.targetEntityId)) {
      throw new ProjectionError(
        statement.requiredReference ? "UNRESOLVED_REQUIRED_REFERENCE" : "INVALID_DATASET",
        `Unknown statement target ${statement.targetEntityId}`,
        statement.targetEntityId,
        statement.predicateId,
      );
    }
    if (!supported.has(statement.predicateId)) {
      throw new ProjectionError("INVALID_DATASET", `Statement uses undeclared predicate ${statement.predicateId}`, undefined, statement.predicateId);
    }
    if (statement.source.length === 0) throw new ProjectionError("INVALID_DATASET", "Statement source metadata must not be empty");
  }
}

function normalizeOptions(snapshot: RdfDatasetSnapshot, options: KnowledgeNetworkProjectionOptions): KnowledgeNetworkProjectionDescriptor {
  if (!Number.isInteger(options.maximumDepth) || options.maximumDepth < 0) {
    throw new ProjectionError("INVALID_PROJECTION_OPTIONS", "maximumDepth must be a non-negative integer");
  }
  if (options.groupingPolicy !== "none" && options.groupingPolicy !== "semantic-type") {
    throw new ProjectionError("INVALID_PROJECTION_OPTIONS", `Unsupported grouping policy ${String(options.groupingPolicy)}`);
  }
  const rootEntityIds = canonicalStrings(options.rootEntityIds);
  if (rootEntityIds.length === 0) throw new ProjectionError("INVALID_PROJECTION_OPTIONS", "At least one root entity is required");
  const includedPredicates = canonicalStrings(options.includedPredicates);
  if (includedPredicates.length === 0) throw new ProjectionError("INVALID_PROJECTION_OPTIONS", "At least one predicate is required");
  const supported = new Set(snapshot.supportedPredicates);
  for (const predicate of includedPredicates) {
    if (!supported.has(predicate)) throw new ProjectionError("UNSUPPORTED_PREDICATE", `Unsupported predicate ${predicate}`, undefined, predicate);
  }
  const entities = new Set(snapshot.entities.map((entity) => entity.id));
  for (const root of rootEntityIds) {
    if (!entities.has(root)) throw new ProjectionError("UNKNOWN_ROOT_ENTITY", `Unknown root entity ${root}`, root);
  }
  return { version: "1.0", rootEntityIds, includedPredicates, maximumDepth: options.maximumDepth, groupingPolicy: options.groupingPolicy };
}

function validateDocument(document: KnowledgeNetworkDocument): void {
  const nodeIds = document.nodes.map((node) => node.id);
  if (new Set(nodeIds).size !== nodeIds.length) throw new ProjectionError("KNOWLEDGE_NETWORK_CONTRACT_VIOLATION", "Duplicate node ids");
  const edgeIds = document.edges.map((edge) => edge.id);
  if (new Set(edgeIds).size !== edgeIds.length) throw new ProjectionError("KNOWLEDGE_NETWORK_CONTRACT_VIOLATION", "Duplicate edge ids");
  const nodeSet = new Set(nodeIds);
  for (const edge of document.edges) {
    if (!nodeSet.has(edge.sourceNodeId) || !nodeSet.has(edge.targetNodeId)) {
      throw new ProjectionError("KNOWLEDGE_NETWORK_CONTRACT_VIOLATION", `Edge ${edge.id} references an unknown node`);
    }
  }
  if (document.accessibility.nodeReadingOrder.join("\u0000") !== nodeIds.join("\u0000")) {
    throw new ProjectionError("KNOWLEDGE_NETWORK_CONTRACT_VIOLATION", "Node reading order is invalid");
  }
  if (document.accessibility.edgeReadingOrder.join("\u0000") !== edgeIds.join("\u0000")) {
    throw new ProjectionError("KNOWLEDGE_NETWORK_CONTRACT_VIOLATION", "Edge reading order is invalid");
  }
}

export function projectKnowledgeNetwork(
  snapshot: RdfDatasetSnapshot,
  options: KnowledgeNetworkProjectionOptions,
): KnowledgeNetworkProjectionResult {
  try {
    validateDataset(snapshot);
    const projection = normalizeOptions(snapshot, options);
    const entityById = new Map(snapshot.entities.map((entity) => [entity.id, entity]));
    const includedPredicates = new Set(projection.includedPredicates);
    const outgoing = new Map<string, RdfDatasetStatement[]>();
    for (const statement of snapshot.statements) {
      if (!includedPredicates.has(statement.predicateId)) continue;
      const values = outgoing.get(statement.sourceEntityId) ?? [];
      values.push(statement);
      outgoing.set(statement.sourceEntityId, values);
    }
    for (const values of outgoing.values()) {
      values.sort((a, b) =>
        a.predicateId.localeCompare(b.predicateId) || a.targetEntityId.localeCompare(b.targetEntityId) || a.sourceEntityId.localeCompare(b.sourceEntityId),
      );
    }

    const selected = new Set<string>(projection.rootEntityIds);
    const selectedEdges = new Map<string, RdfDatasetStatement>();
    let frontier = [...projection.rootEntityIds];
    for (let depth = 0; depth < projection.maximumDepth; depth += 1) {
      const next = new Set<string>();
      for (const sourceId of [...frontier].sort((a, b) => a.localeCompare(b))) {
        for (const statement of outgoing.get(sourceId) ?? []) {
          const key = `${statement.sourceEntityId}\u0000${statement.predicateId}\u0000${statement.targetEntityId}`;
          selectedEdges.set(key, statement);
          if (!selected.has(statement.targetEntityId)) next.add(statement.targetEntityId);
          selected.add(statement.targetEntityId);
        }
      }
      frontier = [...next];
      if (frontier.length === 0) break;
    }

    const groupMembership = new Map<string, string[]>();
    const groups: KnowledgeNetworkGroup[] = [];
    if (projection.groupingPolicy === "semantic-type") {
      const membersByType = new Map<string, string[]>();
      for (const entityId of [...selected].sort((a, b) => a.localeCompare(b))) {
        const entity = entityById.get(entityId)!;
        for (const semanticType of canonicalStrings(entity.semanticTypes)) {
          const members = membersByType.get(semanticType) ?? [];
          members.push(stableId("kn-node", [entityId]));
          membersByType.set(semanticType, members);
          const membership = groupMembership.get(entityId) ?? [];
          membership.push(stableId("kn-group", [semanticType]));
          groupMembership.set(entityId, membership);
        }
      }
      for (const [semanticType, memberNodeIds] of [...membersByType.entries()].sort(([a], [b]) => a.localeCompare(b))) {
        groups.push({ id: stableId("kn-group", [semanticType]), label: semanticType, memberNodeIds: canonicalStrings(memberNodeIds) });
      }
    }

    const nodes: KnowledgeNetworkNode[] = [...selected].sort((a, b) => a.localeCompare(b)).map((entityId) => {
      const entity = entityById.get(entityId)!;
      const externalReferences = entity.externalReferences ? canonicalExternalReferences(entity.externalReferences) : undefined;
      const groupIds = groupMembership.get(entityId) ? canonicalStrings(groupMembership.get(entityId)!) : undefined;
      return {
        id: stableId("kn-node", [entity.id]),
        semanticEntityId: entity.id,
        semanticTypes: canonicalStrings(entity.semanticTypes),
        label: entity.label,
        ...(entity.description ? { description: entity.description } : {}),
        source: canonicalSources(entity.source),
        ...(externalReferences && externalReferences.length > 0 ? { externalReferences } : {}),
        ...(groupIds && groupIds.length > 0 ? { groupIds } : {}),
      };
    });

    const edges: KnowledgeNetworkEdge[] = [...selectedEdges.values()]
      .sort((a, b) =>
        a.sourceEntityId.localeCompare(b.sourceEntityId) || a.predicateId.localeCompare(b.predicateId) || a.targetEntityId.localeCompare(b.targetEntityId),
      )
      .map((statement) => ({
        id: stableId("kn-edge", [statement.sourceEntityId, statement.predicateId, statement.targetEntityId]),
        sourceNodeId: stableId("kn-node", [statement.sourceEntityId]),
        targetNodeId: stableId("kn-node", [statement.targetEntityId]),
        predicateId: statement.predicateId,
        label: statement.predicateLabel,
        directed: true,
        source: canonicalSources(statement.source),
      }));

    const relationLines = edges.map((edge) => {
      const source = nodes.find((node) => node.id === edge.sourceNodeId)!;
      const target = nodes.find((node) => node.id === edge.targetNodeId)!;
      return `${source.label} — ${edge.label} → ${target.label}`;
    });
    const staticFallback = [
      "Nodes:",
      ...nodes.map((node) => `- ${node.label} (${node.semanticEntityId})`),
      "Relations:",
      ...(relationLines.length > 0 ? relationLines.map((line) => `- ${line}`) : ["- None"]),
    ].join("\n");

    const descriptorKey = canonicalSerialize(projection);
    const document: KnowledgeNetworkDocument = {
      version: KNOWLEDGE_NETWORK_DOCUMENT_VERSION,
      id: stableId("knowledge-network", [snapshot.identity, descriptorKey]),
      datasetIdentity: snapshot.identity,
      projection,
      nodes,
      edges,
      ...(groups.length > 0 ? { groups } : {}),
      accessibility: {
        label: `Knowledge network for ${projection.rootEntityIds.join(", ")}`,
        description: `Renderer-neutral network with ${nodes.length} nodes and ${edges.length} directed relations.`,
        nodeReadingOrder: nodes.map((node) => node.id),
        edgeReadingOrder: edges.map((edge) => edge.id),
        staticFallback,
      },
      source: canonicalSources(snapshot.source),
    };
    validateDocument(document);
    return { document, diagnostics: [] };
  } catch (error) {
    if (error instanceof ProjectionError) {
      return {
        diagnostics: [{ code: error.code, message: error.message, ...(error.entityId ? { entityId: error.entityId } : {}), ...(error.predicateId ? { predicateId: error.predicateId } : {}) }],
      };
    }
    return { diagnostics: [{ code: "KNOWLEDGE_NETWORK_CONTRACT_VIOLATION", message: "Unexpected projector contract violation" }] };
  }
}

export function canonicalSerializeKnowledgeNetworkDocument(document: KnowledgeNetworkDocument): string {
  validateDocument(document);
  return canonicalSerialize(document);
}

function canonicalSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalSerialize(item)).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalSerialize(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
