import {
  SCENE_DOCUMENT_FLOW_VERSION,
  SCENE_DOCUMENT_VERSION,
  SceneContractError,
  validateSceneDocument,
  type AccessibilityMetadata,
  type DidacticIntent,
  type Disclosure,
  type SceneBlock,
  type SceneDocument,
  type SourceReference,
} from "../../core/src/scene-document.ts";

export interface RevealAdapterOptions {
  readonly reducedMotion: boolean;
  readonly interactionPolicy: "interactive-when-supported" | "static";
}

export type RevealAdapterDiagnosticCode =
  | "UNSUPPORTED_SCENE_DOCUMENT_VERSION"
  | "INVALID_SCENE_DOCUMENT"
  | "UNSUPPORTED_PRIMITIVE"
  | "UNREPRESENTABLE_INTERACTION"
  | "MISSING_ACCESSIBLE_ALTERNATIVE"
  | "INVALID_DISCLOSURE_ORDER"
  | "RENDER_PLAN_CONTRACT_VIOLATION";

export interface RevealAdapterDiagnostic {
  readonly code: RevealAdapterDiagnosticCode;
  readonly sceneId?: string;
  readonly blockId?: string;
  readonly message: string;
}

export interface RevealFragmentPlan {
  readonly index: number;
  readonly mode: "progressive" | "optional";
}

interface RevealNodeBase {
  readonly id: string;
  readonly sourceBlockId: string;
  readonly source: readonly SourceReference[];
  readonly disclosure?: Disclosure;
  readonly fragment?: RevealFragmentPlan;
  readonly emphasis?: "normal" | "supporting" | "primary";
  readonly intent?: DidacticIntent;
  readonly accessibility?: AccessibilityMetadata;
  readonly staticFallback: string;
}

export interface RevealProsePlan extends RevealNodeBase {
  readonly kind: "prose";
  readonly text: string;
  readonly format: "plain" | "markdown";
}

export interface RevealMathPlan extends RevealNodeBase {
  readonly kind: "math";
  readonly expression: string;
  readonly spokenText: string;
}

export interface RevealCodePlan extends RevealNodeBase {
  readonly kind: "code";
  readonly language: string;
  readonly code: string;
  readonly editable: boolean;
  readonly executable: boolean;
  readonly interactive: boolean;
  readonly fallback: string;
}

export interface RevealMediaPlan extends RevealNodeBase {
  readonly kind: "media-reference";
  readonly uri: string;
  readonly mediaType?: string;
  readonly version?: string;
  readonly integrity?: string;
  readonly alternativeText: string;
}

export interface RevealListItemPlan {
  readonly id: string;
  readonly text: string;
  readonly source: readonly SourceReference[];
}

export interface RevealListPlan extends RevealNodeBase {
  readonly kind: "list";
  readonly listStyle: "unordered" | "ordered";
  readonly items: readonly RevealListItemPlan[];
}

export interface RevealGroupPlan extends RevealNodeBase {
  readonly kind: "group";
  readonly children: readonly RevealNodePlan[];
  readonly readingOrder: readonly string[];
}

export interface RevealPromptPlan extends RevealNodeBase {
  readonly kind: "prompt";
  readonly prompt: string;
  readonly responseMode: "reflection" | "single-choice" | "multiple-choice" | "free-text";
  readonly options?: readonly string[];
  readonly fallback: string;
  readonly interactive: boolean;
}

export interface RevealDiagramNodePlan {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly emphasis?: "normal" | "supporting" | "primary";
  readonly visualRole?: string;
  readonly groupIds?: readonly string[];
}

export interface RevealDiagramGroupPlan {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
}

export interface RevealDiagramEdgePlan {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly visualRole?: string;
}

export interface RevealDiagramPlan extends RevealNodeBase {
  readonly kind: "diagram";
  readonly diagramType: "flow" | "network";
  readonly label: string;
  readonly description: string;
  readonly nodes: readonly RevealDiagramNodePlan[];
  readonly groups?: readonly RevealDiagramGroupPlan[];
  readonly edges: readonly RevealDiagramEdgePlan[];
  readonly focusNodeId?: string;
}

export type RevealNodePlan =
  | RevealProsePlan
  | RevealMathPlan
  | RevealCodePlan
  | RevealMediaPlan
  | RevealListPlan
  | RevealGroupPlan
  | RevealPromptPlan
  | RevealDiagramPlan;

export interface RevealSectionPlan {
  readonly id: string;
  readonly sourceSceneId: string;
  readonly source: readonly SourceReference[];
  readonly semanticLabel: string;
  readonly narration?: string;
  readonly accessibility?: AccessibilityMetadata;
  readonly nodes: readonly RevealNodePlan[];
  readonly readingOrder: readonly string[];
}

export interface RevealRenderPlan {
  readonly version: "1.1";
  readonly sourceDocumentId: string;
  readonly sourcePathId: string;
  readonly reducedMotion: boolean;
  readonly interactionPolicy: RevealAdapterOptions["interactionPolicy"];
  readonly sections: readonly RevealSectionPlan[];
}

export interface RevealPlanResult {
  readonly plan?: RevealRenderPlan;
  readonly diagnostics: readonly RevealAdapterDiagnostic[];
}

function diagnostic(
  code: RevealAdapterDiagnosticCode,
  message: string,
  sceneId?: string,
  blockId?: string,
): RevealPlanResult {
  return { diagnostics: [{ code, message, ...(sceneId ? { sceneId } : {}), ...(blockId ? { blockId } : {}) }] };
}

function sourceCopy(source: readonly SourceReference[]): readonly SourceReference[] {
  return source.map((entry) => ({
    resourceId: entry.resourceId,
    ...(entry.provenanceIds ? { provenanceIds: [...entry.provenanceIds] } : {}),
    ...(entry.relationPath ? { relationPath: entry.relationPath } : {}),
  }));
}

function fragmentFor(block: SceneBlock, options: RevealAdapterOptions): RevealFragmentPlan | undefined {
  if (options.interactionPolicy === "static" || options.reducedMotion || !block.disclosure) return undefined;
  if (block.disclosure.mode === "initial") return undefined;
  return { index: block.disclosure.order, mode: block.disclosure.mode };
}

function baseFor(block: SceneBlock, position: number, options: RevealAdapterOptions, fallback: string): RevealNodeBase {
  return {
    id: `reveal-node-${position}-${block.id}`,
    sourceBlockId: block.id,
    source: sourceCopy(block.source),
    ...(block.disclosure ? { disclosure: { ...block.disclosure } } : {}),
    ...(fragmentFor(block, options) ? { fragment: fragmentFor(block, options) } : {}),
    ...(block.emphasis ? { emphasis: block.emphasis } : {}),
    ...(block.intent ? { intent: { ...block.intent } } : {}),
    ...(block.accessibility ? { accessibility: { ...block.accessibility } } : {}),
    staticFallback: fallback,
  };
}

function diagramStaticFallback(block: Extract<SceneBlock, { kind: "diagram" }>): string {
  const labels = new Map(block.nodes.map((node) => [node.id, node.label]));
  return [
    block.label,
    block.description,
    "Nodes:",
    ...block.nodes.map((node) => `- ${node.label}`),
    "Relations:",
    ...block.edges.map((edge) => `- ${labels.get(edge.sourceNodeId) ?? edge.sourceNodeId} — ${edge.label} → ${labels.get(edge.targetNodeId) ?? edge.targetNodeId}`),
  ].join("\n");
}

function mapBlock(block: SceneBlock, position: number, options: RevealAdapterOptions): RevealNodePlan {
  switch (block.kind) {
    case "prose":
      return {
        ...baseFor(block, position, options, block.text),
        kind: "prose",
        text: block.text,
        format: block.format ?? "plain",
      };
    case "math":
      if (block.spokenText.length === 0) throw new AdapterError("MISSING_ACCESSIBLE_ALTERNATIVE", "Mathematics requires spokenText", block.id);
      return {
        ...baseFor(block, position, options, `${block.expression} — ${block.spokenText}`),
        kind: "math",
        expression: block.expression,
        spokenText: block.spokenText,
      };
    case "code":
      if (block.fallback.length === 0) throw new AdapterError("MISSING_ACCESSIBLE_ALTERNATIVE", "Code requires a static fallback", block.id);
      return {
        ...baseFor(block, position, options, block.fallback),
        kind: "code",
        language: block.language,
        code: block.code,
        editable: block.editable,
        executable: block.executable,
        interactive: block.executable && options.interactionPolicy === "interactive-when-supported",
        fallback: block.fallback,
      };
    case "media-reference":
      if (block.alternativeText.length === 0) throw new AdapterError("MISSING_ACCESSIBLE_ALTERNATIVE", "Media requires alternativeText", block.id);
      return {
        ...baseFor(block, position, options, `${block.alternativeText} (${block.uri})`),
        kind: "media-reference",
        uri: block.uri,
        ...(block.mediaType ? { mediaType: block.mediaType } : {}),
        ...(block.version ? { version: block.version } : {}),
        ...(block.integrity ? { integrity: block.integrity } : {}),
        alternativeText: block.alternativeText,
      };
    case "list":
      return {
        ...baseFor(block, position, options, block.items.map((item) => item.text).join("\n")),
        kind: "list",
        listStyle: block.listStyle,
        items: block.items.map((item) => ({ id: item.id, text: item.text, source: sourceCopy(item.source) })),
      };
    case "group": {
      const children = block.children.map((child, index) => mapBlock(child, index, options));
      return {
        ...baseFor(block, position, options, children.map((child) => child.staticFallback).join("\n")),
        kind: "group",
        children,
        readingOrder: [...block.readingOrder],
      };
    }
    case "prompt":
      if (block.fallback.length === 0) throw new AdapterError("MISSING_ACCESSIBLE_ALTERNATIVE", "Prompt requires a static fallback", block.id);
      return {
        ...baseFor(block, position, options, block.fallback),
        kind: "prompt",
        prompt: block.prompt,
        responseMode: block.responseMode,
        ...(block.options ? { options: [...block.options] } : {}),
        fallback: block.fallback,
        interactive: options.interactionPolicy === "interactive-when-supported",
      };
    case "diagram":
      return {
        ...baseFor(block, position, options, diagramStaticFallback(block)),
        kind: "diagram",
        diagramType: block.diagramType,
        label: block.label,
        description: block.description,
        nodes: block.nodes.map((node) => ({
          id: node.id,
          label: node.label,
          source: sourceCopy(node.source),
          ...(node.emphasis ? { emphasis: node.emphasis } : {}),
          ...(node.visualRole ? { visualRole: node.visualRole } : {}),
          ...(node.groupIds ? { groupIds: [...node.groupIds] } : {}),
        })),
        edges: block.edges.map((edge) => ({
          id: edge.id,
          sourceNodeId: edge.sourceNodeId,
          targetNodeId: edge.targetNodeId,
          label: edge.label,
          source: sourceCopy(edge.source),
          ...(edge.visualRole ? { visualRole: edge.visualRole } : {}),
        })),
        ...(block.groups ? { groups: block.groups.map((group) => ({ ...group, source: sourceCopy(group.source) })) } : {}),
        ...(block.focusNodeId ? { focusNodeId: block.focusNodeId } : {}),
      };
    default:
      throw new AdapterError("UNSUPPORTED_PRIMITIVE", `Unsupported primitive ${(block as { kind?: unknown }).kind ?? "unknown"}`, (block as { id?: string }).id);
  }
}

class AdapterError extends Error {
  readonly code: RevealAdapterDiagnosticCode;
  readonly blockId?: string;

  constructor(code: RevealAdapterDiagnosticCode, message: string, blockId?: string) {
    super(message);
    this.code = code;
    this.blockId = blockId;
  }
}

function validatePlan(plan: RevealRenderPlan): void {
  const sectionIds = plan.sections.map((section) => section.id);
  if (new Set(sectionIds).size !== sectionIds.length) throw new AdapterError("RENDER_PLAN_CONTRACT_VIOLATION", "Render-plan section ids must be unique");
  for (const section of plan.sections) {
    const sourceIds = section.nodes.map((node) => node.sourceBlockId);
    if (sourceIds.length !== section.readingOrder.length || section.readingOrder.some((id) => !sourceIds.includes(id))) {
      throw new AdapterError("RENDER_PLAN_CONTRACT_VIOLATION", `Section ${section.sourceSceneId} has invalid reading order`);
    }
  }
}

export function createRevealRenderPlan(document: SceneDocument, options: RevealAdapterOptions): RevealPlanResult {
  const version = (document as { version?: unknown }).version;
  if (version !== SCENE_DOCUMENT_VERSION && version !== SCENE_DOCUMENT_FLOW_VERSION) {
    return diagnostic("UNSUPPORTED_SCENE_DOCUMENT_VERSION", `Unsupported scene document version: ${String(version)}`);
  }

  try {
    validateSceneDocument(document);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid SceneDocument";
    const code = message.includes("disclosure order") ? "INVALID_DISCLOSURE_ORDER" : "INVALID_SCENE_DOCUMENT";
    return diagnostic(code, message);
  }

  try {
    const plan: RevealRenderPlan = {
      version: "1.1",
      sourceDocumentId: document.id,
      sourcePathId: document.sourcePathId,
      reducedMotion: options.reducedMotion,
      interactionPolicy: options.interactionPolicy,
      sections: document.scenes.map((scene, sceneIndex) => ({
        id: `reveal-section-${sceneIndex}-${scene.id}`,
        sourceSceneId: scene.id,
        source: sourceCopy(scene.source),
        semanticLabel: scene.accessibility?.label ?? scene.id,
        ...(scene.narration ? { narration: scene.narration } : {}),
        ...(scene.accessibility ? { accessibility: { ...scene.accessibility } } : {}),
        nodes: scene.blocks.map((block, blockIndex) => mapBlock(block, blockIndex, options)),
        readingOrder: [...scene.readingOrder],
      })),
    };
    validatePlan(plan);
    return { plan, diagnostics: [] };
  } catch (error) {
    if (error instanceof AdapterError) return diagnostic(error.code, error.message, undefined, error.blockId);
    if (error instanceof SceneContractError) return diagnostic("INVALID_SCENE_DOCUMENT", error.message);
    return diagnostic("RENDER_PLAN_CONTRACT_VIOLATION", error instanceof Error ? error.message : "Unknown render-plan failure");
  }
}

export function canonicalSerializeRevealRenderPlan(plan: RevealRenderPlan): string {
  return JSON.stringify(plan);
}

export * from "./pitch-theme.ts";
export * from "./presenter-mode.ts";
