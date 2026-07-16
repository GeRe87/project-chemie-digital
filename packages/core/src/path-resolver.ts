export interface JsonLdNode {
  id?: unknown;
  type?: unknown;
  [key: string]: unknown;
}

export interface JsonLdDocument extends JsonLdNode {
  "@graph"?: unknown;
}

export interface ResolvedPathStep {
  id: string;
  position: number;
  viewType: string;
  resourceIds: readonly string[];
}

export interface ResolvedLearningPath {
  id: string;
  topicId?: string;
  steps: readonly ResolvedPathStep[];
}

export class PathResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathResolutionError";
  }
}

function graphNodes(documents: readonly JsonLdDocument[]): JsonLdNode[] {
  return documents.flatMap((document, index) => {
    if (Array.isArray(document["@graph"])) {
      return document["@graph"] as JsonLdNode[];
    }
    if (typeof document.id === "string" && document.id.length > 0) {
      return [document];
    }
    throw new PathResolutionError(`Document ${index} must be a JSON-LD node or contain an @graph array`);
  });
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new PathResolutionError(`${label} must be a non-empty string`);
  }
  return value;
}

function stringIds(value: unknown, label: string): string[] {
  const values = Array.isArray(value) ? value : [value];
  if (values.length === 0 || values.some((item) => typeof item !== "string" || item.length === 0)) {
    throw new PathResolutionError(`${label} must contain one or more resource identifiers`);
  }
  return values as string[];
}

export function resolveLearningPath(
  documents: readonly JsonLdDocument[],
  selectedPathId: string,
): ResolvedLearningPath {
  const nodes = graphNodes(documents);
  const byId = new Map<string, JsonLdNode>();

  for (const node of nodes) {
    if (typeof node.id === "string") {
      byId.set(node.id, node);
    }
  }

  const path = byId.get(selectedPathId);
  if (!path) {
    throw new PathResolutionError(`Learning path not found: ${selectedPathId}`);
  }

  const stepIds = stringIds(path.hasStep, `Learning path ${selectedPathId} hasStep`);
  const positions = new Set<number>();
  const steps = stepIds.map((stepId): ResolvedPathStep => {
    const step = byId.get(stepId);
    if (!step) {
      throw new PathResolutionError(`Path step not found: ${stepId}`);
    }

    if (typeof step.position !== "number" || !Number.isInteger(step.position)) {
      throw new PathResolutionError(`Path step ${stepId} position must be an integer`);
    }
    if (step.position <= 0) {
      throw new PathResolutionError(`Path step ${stepId} position must be positive`);
    }
    if (positions.has(step.position)) {
      throw new PathResolutionError(`Duplicate path position: ${step.position}`);
    }
    positions.add(step.position);

    const resourceIds = stringIds(step.usesResource, `Path step ${stepId} usesResource`).sort();
    for (const resourceId of resourceIds) {
      if (!byId.has(resourceId)) {
        throw new PathResolutionError(`Resource not found: ${resourceId}`);
      }
    }

    return {
      id: stepId,
      position: step.position,
      viewType: requiredString(step.viewType, `Path step ${stepId} viewType`),
      resourceIds,
    };
  });

  steps.sort((left, right) => left.position - right.position || left.id.localeCompare(right.id));

  return {
    id: selectedPathId,
    topicId: typeof path.forTopic === "string" ? path.forTopic : undefined,
    steps,
  };
}
