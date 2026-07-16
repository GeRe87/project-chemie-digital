import type { ResolvedLearningPath, ResolvedPathStep } from "./path-resolver.ts";
import {
  SCENE_DOCUMENT_VERSION,
  type Scene,
  type SceneBlock,
  type SceneDocument,
  type SourceReference,
  validateSceneDocument,
} from "./scene-document.ts";

export type ResolvedResourceKind =
  | "Definition"
  | "MathExpression"
  | "MathSymbol"
  | "WorkedExample"
  | "Exercise";

export interface ResolvedResource {
  readonly id: string;
  readonly kind: ResolvedResourceKind | string;
  readonly label?: string;
  readonly body?: string;
  readonly format?: "plain" | "markdown";
  readonly latex?: string;
  readonly symbol?: string;
  readonly spokenText?: string;
  readonly staticFallback?: string;
  readonly narration?: string;
  readonly narrationRequired?: boolean;
  readonly language?: string;
  readonly provenanceIds?: readonly string[];
}

export interface CompositionInput {
  readonly path: ResolvedLearningPath;
  readonly resources: ReadonlyMap<string, ResolvedResource>;
}

export type CompositionDiagnosticCode =
  | "UNSUPPORTED_VIEW_TYPE"
  | "MISSING_RESOURCE"
  | "UNSUPPORTED_RESOURCE_KIND"
  | "MISSING_REQUIRED_PAYLOAD"
  | "INCOMPATIBLE_RESOURCE_CARDINALITY"
  | "MISSING_ACCESSIBLE_ALTERNATIVE"
  | "MISSING_NARRATION_PAYLOAD"
  | "SCENE_CONTRACT_VIOLATION";

export interface CompositionDiagnostic {
  readonly code: CompositionDiagnosticCode;
  readonly pathId: string;
  readonly stepId: string;
  readonly resourceId?: string;
  readonly rule: string;
}

export interface CompositionResult {
  readonly document?: SceneDocument;
  readonly diagnostics: readonly CompositionDiagnostic[];
}

const SUPPORTED_KINDS = new Set<ResolvedResourceKind>([
  "Definition",
  "MathExpression",
  "MathSymbol",
  "WorkedExample",
  "Exercise",
]);

function diagnostic(
  code: CompositionDiagnosticCode,
  pathId: string,
  stepId: string,
  rule: string,
  resourceId?: string,
): CompositionDiagnostic {
  return { code, pathId, stepId, resourceId, rule };
}

function nonEmpty(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function source(resource: ResolvedResource): SourceReference {
  const provenanceIds = resource.provenanceIds
    ? [...new Set(resource.provenanceIds)].sort((left, right) => left.localeCompare(right))
    : undefined;
  return provenanceIds?.length
    ? { resourceId: resource.id, provenanceIds }
    : { resourceId: resource.id };
}

function expected(step: ResolvedPathStep): { kinds: readonly ResolvedResourceKind[]; min: number; max: number } | undefined {
  switch (step.viewType) {
    case "concept-introduction": return { kinds: ["Definition"], min: 1, max: 1 };
    case "formula-introduction": return { kinds: ["MathExpression"], min: 1, max: 1 };
    case "symbol-explanation": return { kinds: ["MathSymbol"], min: 1, max: Number.POSITIVE_INFINITY };
    case "worked-examples": return { kinds: ["WorkedExample"], min: 1, max: Number.POSITIVE_INFINITY };
    case "exercise": return { kinds: ["Exercise"], min: 1, max: 1 };
    default: return undefined;
  }
}

function validateStep(
  pathId: string,
  step: ResolvedPathStep,
  resources: readonly ResolvedResource[],
): CompositionDiagnostic[] {
  const diagnostics: CompositionDiagnostic[] = [];
  const rule = expected(step);
  if (!rule) {
    return [diagnostic("UNSUPPORTED_VIEW_TYPE", pathId, step.id, `Unsupported viewType: ${step.viewType}`)];
  }
  if (resources.length < rule.min || resources.length > rule.max) {
    diagnostics.push(diagnostic("INCOMPATIBLE_RESOURCE_CARDINALITY", pathId, step.id, `viewType ${step.viewType} requires ${rule.min === rule.max ? `exactly ${rule.min}` : `at least ${rule.min}`} resource(s)`));
  }
  for (const resource of resources) {
    if (!SUPPORTED_KINDS.has(resource.kind as ResolvedResourceKind) || !rule.kinds.includes(resource.kind as ResolvedResourceKind)) {
      diagnostics.push(diagnostic("UNSUPPORTED_RESOURCE_KIND", pathId, step.id, `Resource kind ${resource.kind} is not supported for ${step.viewType}`, resource.id));
      continue;
    }
    if (!nonEmpty(resource.label)) {
      diagnostics.push(diagnostic("MISSING_ACCESSIBLE_ALTERNATIVE", pathId, step.id, "Scene accessibility label is required", resource.id));
    }
    if (resource.narrationRequired && !nonEmpty(resource.narration)) {
      diagnostics.push(diagnostic("MISSING_NARRATION_PAYLOAD", pathId, step.id, "Explicitly required narration payload is missing", resource.id));
    }
    switch (resource.kind) {
      case "Definition":
      case "WorkedExample":
      case "Exercise":
        if (!nonEmpty(resource.body)) diagnostics.push(diagnostic("MISSING_REQUIRED_PAYLOAD", pathId, step.id, `${resource.kind} body is required`, resource.id));
        if (resource.kind === "Exercise" && !nonEmpty(resource.staticFallback)) {
          diagnostics.push(diagnostic("MISSING_REQUIRED_PAYLOAD", pathId, step.id, "Exercise static fallback is required", resource.id));
        }
        break;
      case "MathExpression":
        if (!nonEmpty(resource.latex)) diagnostics.push(diagnostic("MISSING_REQUIRED_PAYLOAD", pathId, step.id, "MathExpression LaTeX is required", resource.id));
        if (!nonEmpty(resource.spokenText)) diagnostics.push(diagnostic("MISSING_ACCESSIBLE_ALTERNATIVE", pathId, step.id, "MathExpression spoken text is required", resource.id));
        break;
      case "MathSymbol":
        if (!nonEmpty(resource.symbol)) diagnostics.push(diagnostic("MISSING_REQUIRED_PAYLOAD", pathId, step.id, "MathSymbol symbol is required", resource.id));
        if (!nonEmpty(resource.spokenText)) diagnostics.push(diagnostic("MISSING_ACCESSIBLE_ALTERNATIVE", pathId, step.id, "MathSymbol spoken text is required", resource.id));
        break;
    }
  }
  return diagnostics;
}

function sceneLabel(resources: readonly ResolvedResource[]): string {
  return resources.map((resource) => resource.label).filter(nonEmpty).join("; ");
}

function block(step: ResolvedPathStep, resource: ResolvedResource, index: number): SceneBlock {
  const base = {
    id: `${step.id}--block-${index + 1}`,
    source: [source(resource)],
    disclosure: { order: index, mode: "initial" as const },
  };
  switch (step.viewType) {
    case "concept-introduction":
      return { ...base, kind: "prose", text: resource.body!, format: resource.format ?? "plain", emphasis: "primary", intent: { kind: "introduce" } };
    case "formula-introduction":
      return { ...base, kind: "math", expression: resource.latex!, spokenText: resource.spokenText!, emphasis: "primary", intent: { kind: "explain" } };
    case "symbol-explanation":
      return { ...base, kind: "math", expression: resource.symbol!, spokenText: resource.spokenText!, intent: { kind: "explain" } };
    case "worked-examples":
      return { ...base, kind: "prose", text: resource.body!, format: resource.format ?? "plain", intent: { kind: "explain" } };
    case "exercise":
      return { ...base, kind: "prompt", prompt: resource.body!, responseMode: "free-text", fallback: resource.staticFallback!, emphasis: "primary", intent: { kind: "practice" } };
    default:
      throw new Error(`Unreachable unsupported viewType: ${step.viewType}`);
  }
}

function composeScene(step: ResolvedPathStep, resources: readonly ResolvedResource[]): Scene {
  const blocks = resources.map((resource, index) => block(step, resource, index));
  const narration = resources.map((resource) => resource.narration).find(nonEmpty);
  return {
    id: `${step.id}--scene`,
    source: resources.map(source),
    blocks,
    readingOrder: blocks.map((item) => item.id),
    ...(narration ? { narration } : {}),
    accessibility: { label: sceneLabel(resources) },
  };
}

export function composeSceneDocument(input: CompositionInput): CompositionResult {
  const diagnostics: CompositionDiagnostic[] = [];
  const normalizedSteps = input.path.steps.map((step) => ({
    step,
    resources: [...step.resourceIds]
      .sort((left, right) => left.localeCompare(right))
      .map((resourceId) => {
        const resource = input.resources.get(resourceId);
        if (!resource) diagnostics.push(diagnostic("MISSING_RESOURCE", input.path.id, step.id, "Resolved resource is missing from the immutable resource index", resourceId));
        return resource;
      })
      .filter((resource): resource is ResolvedResource => resource !== undefined),
  }));

  for (const { step, resources } of normalizedSteps) diagnostics.push(...validateStep(input.path.id, step, resources));
  if (diagnostics.length > 0) return { diagnostics };

  const document: SceneDocument = {
    version: SCENE_DOCUMENT_VERSION,
    id: `${input.path.id}--scene-document`,
    sourcePathId: input.path.id,
    scenes: normalizedSteps.map(({ step, resources }) => composeScene(step, resources)),
  };

  try {
    validateSceneDocument(document);
  } catch (error) {
    return {
      diagnostics: [diagnostic("SCENE_CONTRACT_VIOLATION", input.path.id, "<document>", error instanceof Error ? error.message : "Unknown SceneDocument validation failure")],
    };
  }
  return { document, diagnostics: [] };
}
