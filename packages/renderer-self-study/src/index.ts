import {
  SceneContractError,
  validateSceneDocument,
  type AccessibilityMetadata,
  type DidacticIntent,
  type Disclosure,
  type SceneBlock,
  type SceneDocument,
  type SourceReference,
} from "../../core/src/scene-document.ts";

export const SELF_STUDY_RENDER_PLAN_VERSION = "1.0" as const;

export type SelfStudyDiagnosticCode =
  | "UNSUPPORTED_SCENE_DOCUMENT_VERSION"
  | "INVALID_SCENE_DOCUMENT"
  | "UNSUPPORTED_PRIMITIVE"
  | "RENDER_PLAN_CONTRACT_VIOLATION";

export interface SelfStudyDiagnostic {
  readonly code: SelfStudyDiagnosticCode;
  readonly sceneId?: string;
  readonly blockId?: string;
  readonly message: string;
}

export type SelfStudyDisclosureMode = "always" | "optional" | "progressive";

interface SelfStudyNodeBase {
  readonly id: string;
  readonly sourceBlockId: string;
  readonly source: readonly SourceReference[];
  readonly disclosure?: Disclosure;
  readonly disclosureMode: SelfStudyDisclosureMode;
  readonly emphasis?: "normal" | "supporting" | "primary";
  readonly intent?: DidacticIntent;
  readonly accessibility?: AccessibilityMetadata;
  readonly staticFallback: string;
}

export interface SelfStudyProsePlan extends SelfStudyNodeBase {
  readonly kind: "prose";
  readonly text: string;
  readonly format: "plain" | "markdown";
}

export interface SelfStudyMathPlan extends SelfStudyNodeBase {
  readonly kind: "math";
  readonly expression: string;
  readonly spokenText: string;
}

export interface SelfStudyCodePlan extends SelfStudyNodeBase {
  readonly kind: "code";
  readonly language: string;
  readonly code: string;
  readonly editable: boolean;
  readonly executable: boolean;
  readonly fallback: string;
}

export interface SelfStudyMediaPlan extends SelfStudyNodeBase {
  readonly kind: "media-reference";
  readonly uri: string;
  readonly mediaType?: string;
  readonly version?: string;
  readonly integrity?: string;
  readonly alternativeText: string;
}

export interface SelfStudyListItemPlan {
  readonly id: string;
  readonly text: string;
  readonly source: readonly SourceReference[];
}

export interface SelfStudyListPlan extends SelfStudyNodeBase {
  readonly kind: "list";
  readonly listStyle: "unordered" | "ordered";
  readonly items: readonly SelfStudyListItemPlan[];
}

export interface SelfStudyGroupPlan extends SelfStudyNodeBase {
  readonly kind: "group";
  readonly children: readonly SelfStudyNodePlan[];
  readonly readingOrder: readonly string[];
}

export interface SelfStudyPromptPlan extends SelfStudyNodeBase {
  readonly kind: "prompt";
  readonly prompt: string;
  readonly responseMode: "reflection" | "single-choice" | "multiple-choice" | "free-text";
  readonly options?: readonly string[];
  readonly fallback: string;
}

export type SelfStudyNodePlan =
  | SelfStudyProsePlan
  | SelfStudyMathPlan
  | SelfStudyCodePlan
  | SelfStudyMediaPlan
  | SelfStudyListPlan
  | SelfStudyGroupPlan
  | SelfStudyPromptPlan;

export interface SelfStudySectionPlan {
  readonly id: string;
  readonly sourceSceneId: string;
  readonly source: readonly SourceReference[];
  readonly semanticLabel: string;
  readonly narration?: string;
  readonly accessibility?: AccessibilityMetadata;
  readonly nodes: readonly SelfStudyNodePlan[];
  readonly readingOrder: readonly string[];
}

export interface SelfStudyRenderPlan {
  readonly version: typeof SELF_STUDY_RENDER_PLAN_VERSION;
  readonly sourceDocumentId: string;
  readonly sourcePathId: string;
  readonly sections: readonly SelfStudySectionPlan[];
}

export interface SelfStudyPlanResult {
  readonly plan?: SelfStudyRenderPlan;
  readonly diagnostics: readonly SelfStudyDiagnostic[];
}

class SelfStudyAdapterError extends Error {
  readonly code: SelfStudyDiagnosticCode;
  readonly blockId?: string;

  constructor(code: SelfStudyDiagnosticCode, message: string, blockId?: string) {
    super(message);
    this.name = "SelfStudyAdapterError";
    this.code = code;
    this.blockId = blockId;
  }
}

function diagnostic(code: SelfStudyDiagnosticCode, message: string, sceneId?: string, blockId?: string): SelfStudyPlanResult {
  return { diagnostics: [{ code, message, ...(sceneId ? { sceneId } : {}), ...(blockId ? { blockId } : {}) }] };
}

function sourceCopy(source: readonly SourceReference[]): readonly SourceReference[] {
  return source.map((entry) => ({
    resourceId: entry.resourceId,
    ...(entry.provenanceIds ? { provenanceIds: [...entry.provenanceIds] } : {}),
    ...(entry.relationPath ? { relationPath: entry.relationPath } : {}),
  }));
}

function disclosureMode(block: SceneBlock): SelfStudyDisclosureMode {
  if (!block.disclosure || block.disclosure.mode === "initial") return "always";
  return block.disclosure.mode;
}

function baseFor(block: SceneBlock, position: number, fallback: string): SelfStudyNodeBase {
  return {
    id: `self-study-node-${position}-${block.id}`,
    sourceBlockId: block.id,
    source: sourceCopy(block.source),
    ...(block.disclosure ? { disclosure: { ...block.disclosure } } : {}),
    disclosureMode: disclosureMode(block),
    ...(block.emphasis ? { emphasis: block.emphasis } : {}),
    ...(block.intent ? { intent: { ...block.intent } } : {}),
    ...(block.accessibility ? { accessibility: { ...block.accessibility } } : {}),
    staticFallback: fallback,
  };
}

function orderedBlocks(blocks: readonly SceneBlock[], readingOrder: readonly string[]): readonly SceneBlock[] {
  const byId = new Map(blocks.map((block) => [block.id, block]));
  return readingOrder.map((id) => {
    const block = byId.get(id);
    if (!block) throw new SelfStudyAdapterError("RENDER_PLAN_CONTRACT_VIOLATION", `Reading order references unknown block ${id}`);
    return block;
  });
}

function mapBlock(block: SceneBlock, position: number): SelfStudyNodePlan {
  switch (block.kind) {
    case "prose":
      return { ...baseFor(block, position, block.text), kind: "prose", text: block.text, format: block.format ?? "plain" };
    case "math":
      return {
        ...baseFor(block, position, `${block.expression} — ${block.spokenText}`),
        kind: "math",
        expression: block.expression,
        spokenText: block.spokenText,
      };
    case "code":
      return {
        ...baseFor(block, position, block.fallback),
        kind: "code",
        language: block.language,
        code: block.code,
        editable: block.editable,
        executable: block.executable,
        fallback: block.fallback,
      };
    case "media-reference":
      return {
        ...baseFor(block, position, `${block.alternativeText} (${block.uri})`),
        kind: "media-reference",
        uri: block.uri,
        ...(block.mediaType ? { mediaType: block.mediaType } : {}),
        ...(block.version ? { version: block.version } : {}),
        ...(block.integrity ? { integrity: block.integrity } : {}),
        alternativeText: block.alternativeText,
      };
    case "list":
      return {
        ...baseFor(block, position, block.items.map((item) => item.text).join("\n")),
        kind: "list",
        listStyle: block.listStyle,
        items: block.items.map((item) => ({ id: item.id, text: item.text, source: sourceCopy(item.source) })),
      };
    case "group": {
      const children = orderedBlocks(block.children, block.readingOrder).map((child, index) => mapBlock(child, index));
      return {
        ...baseFor(block, position, children.map((child) => child.staticFallback).join("\n")),
        kind: "group",
        children,
        readingOrder: [...block.readingOrder],
      };
    }
    case "prompt":
      return {
        ...baseFor(block, position, block.fallback),
        kind: "prompt",
        prompt: block.prompt,
        responseMode: block.responseMode,
        ...(block.options ? { options: [...block.options] } : {}),
        fallback: block.fallback,
      };
    default:
      throw new SelfStudyAdapterError(
        "UNSUPPORTED_PRIMITIVE",
        `Unsupported primitive ${String((block as { kind?: unknown }).kind ?? "unknown")}`,
        (block as { id?: string }).id,
      );
  }
}

function validatePlan(plan: SelfStudyRenderPlan): void {
  const sectionIds = plan.sections.map((section) => section.id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new SelfStudyAdapterError("RENDER_PLAN_CONTRACT_VIOLATION", "Self-study section ids must be unique");
  }
  for (const section of plan.sections) {
    const sourceIds = section.nodes.map((node) => node.sourceBlockId);
    if (sourceIds.length !== section.readingOrder.length || section.readingOrder.some((id) => !sourceIds.includes(id))) {
      throw new SelfStudyAdapterError("RENDER_PLAN_CONTRACT_VIOLATION", `Section ${section.sourceSceneId} has invalid reading order`);
    }
  }
}

export function createSelfStudyRenderPlan(document: SceneDocument): SelfStudyPlanResult {
  if ((document as { version?: unknown }).version !== "1.0") {
    return diagnostic("UNSUPPORTED_SCENE_DOCUMENT_VERSION", `Unsupported scene document version: ${String((document as { version?: unknown }).version)}`);
  }

  try {
    validateSceneDocument(document);
  } catch (error) {
    return diagnostic("INVALID_SCENE_DOCUMENT", error instanceof Error ? error.message : "Invalid SceneDocument");
  }

  try {
    const plan: SelfStudyRenderPlan = {
      version: SELF_STUDY_RENDER_PLAN_VERSION,
      sourceDocumentId: document.id,
      sourcePathId: document.sourcePathId,
      sections: document.scenes.map((scene, sceneIndex) => ({
        id: `self-study-section-${sceneIndex}-${scene.id}`,
        sourceSceneId: scene.id,
        source: sourceCopy(scene.source),
        semanticLabel: scene.accessibility?.label ?? scene.id,
        ...(scene.narration ? { narration: scene.narration } : {}),
        ...(scene.accessibility ? { accessibility: { ...scene.accessibility } } : {}),
        nodes: orderedBlocks(scene.blocks, scene.readingOrder).map((block, index) => mapBlock(block, index)),
        readingOrder: [...scene.readingOrder],
      })),
    };
    validatePlan(plan);
    return { plan, diagnostics: [] };
  } catch (error) {
    if (error instanceof SelfStudyAdapterError) return diagnostic(error.code, error.message, undefined, error.blockId);
    if (error instanceof SceneContractError) return diagnostic("INVALID_SCENE_DOCUMENT", error.message);
    return diagnostic("RENDER_PLAN_CONTRACT_VIOLATION", error instanceof Error ? error.message : "Unknown self-study render-plan failure");
  }
}

export function canonicalSerializeSelfStudyRenderPlan(plan: SelfStudyRenderPlan): string {
  return JSON.stringify(plan);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sourceAttributes(source: readonly SourceReference[]): string {
  const resources = source.map((entry) => entry.resourceId).join(" ");
  const provenance = source.flatMap((entry) => entry.provenanceIds ?? []).join(" ");
  const paths = source.flatMap((entry) => entry.relationPath ? [entry.relationPath] : []).join(" ");
  return [
    resources ? ` data-resource-id="${escapeHtml(resources)}"` : "",
    provenance ? ` data-provenance-ids="${escapeHtml(provenance)}"` : "",
    paths ? ` data-relation-path="${escapeHtml(paths)}"` : "",
  ].join("");
}

function renderPrompt(node: SelfStudyPromptPlan, interactive: boolean): string {
  if (!interactive) {
    const options = node.options?.length ? `<ul>${node.options.map((option) => `<li>${escapeHtml(option)}</li>`).join("")}</ul>` : "";
    return `<section class="self-study-prompt"><p>${escapeHtml(node.prompt)}</p>${options}<p class="self-study-fallback">${escapeHtml(node.fallback)}</p></section>`;
  }
  if (node.responseMode === "free-text" || node.responseMode === "reflection") {
    return `<fieldset class="self-study-prompt"><legend>${escapeHtml(node.prompt)}</legend><textarea aria-label="${escapeHtml(node.prompt)}"></textarea><p class="self-study-fallback">${escapeHtml(node.fallback)}</p></fieldset>`;
  }
  const inputType = node.responseMode === "multiple-choice" ? "checkbox" : "radio";
  const options = (node.options ?? []).map((option, index) => `<label><input type="${inputType}" name="${escapeHtml(node.id)}" value="${index}"> ${escapeHtml(option)}</label>`).join("");
  return `<fieldset class="self-study-prompt"><legend>${escapeHtml(node.prompt)}</legend>${options}<p class="self-study-fallback">${escapeHtml(node.fallback)}</p></fieldset>`;
}

function renderNodeBody(node: SelfStudyNodePlan, interactive: boolean): string {
  switch (node.kind) {
    case "prose":
      return `<div class="self-study-prose">${escapeHtml(node.text)}</div>`;
    case "math":
      return `<div class="self-study-math" role="math" aria-label="${escapeHtml(node.spokenText)}"><code>${escapeHtml(node.expression)}</code><span class="visually-hidden">${escapeHtml(node.spokenText)}</span></div>`;
    case "code":
      return `<div class="self-study-code"><pre><code data-language="${escapeHtml(node.language)}">${escapeHtml(node.code)}</code></pre><p class="self-study-fallback">${escapeHtml(node.fallback)}</p></div>`;
    case "media-reference":
      return `<p class="self-study-media"><a href="${escapeHtml(node.uri)}" rel="noreferrer noopener">${escapeHtml(node.alternativeText)}</a></p>`;
    case "list": {
      const tag = node.listStyle === "ordered" ? "ol" : "ul";
      const items = node.items.map((item) => `<li data-list-item-id="${escapeHtml(item.id)}"${sourceAttributes(item.source)}>${escapeHtml(item.text)}</li>`).join("");
      return `<${tag} class="self-study-list">${items}</${tag}>`;
    }
    case "group":
      return `<div class="self-study-group">${node.children.map((child) => renderNode(child, interactive)).join("")}</div>`;
    case "prompt":
      return renderPrompt(node, interactive);
  }
}

function renderNode(node: SelfStudyNodePlan, interactive: boolean): string {
  const body = renderNodeBody(node, interactive);
  const attributes = `${sourceAttributes(node.source)} data-source-block-id="${escapeHtml(node.sourceBlockId)}" data-disclosure-mode="${node.disclosureMode}"`;
  if (!interactive || node.disclosureMode === "always") {
    return `<section class="self-study-block"${attributes}>${body}</section>`;
  }
  const order = node.disclosure?.order ?? 0;
  const summary = node.disclosureMode === "optional" ? "Zusatzinhalt anzeigen" : "Nächsten Inhalt anzeigen";
  return `<details class="self-study-block self-study-disclosure"${attributes} data-disclosure-order="${order}"><summary>${summary}</summary>${body}</details>`;
}

export function renderSelfStudyHtml(plan: SelfStudyRenderPlan, options: { readonly interactive: boolean }): string {
  const navigation = `<nav class="self-study-navigation" aria-label="Lernabschnitte"><ol>${plan.sections.map((section) => `<li><a href="#${escapeHtml(section.id)}">${escapeHtml(section.semanticLabel)}</a></li>`).join("")}</ol></nav>`;
  const sections = plan.sections.map((section, index) => `<section id="${escapeHtml(section.id)}" class="self-study-section" aria-labelledby="${escapeHtml(section.id)}-title"${sourceAttributes(section.source)}><h2 id="${escapeHtml(section.id)}-title"><span class="self-study-section-index">${index + 1}.</span> ${escapeHtml(section.semanticLabel)}</h2>${section.accessibility?.description ? `<p>${escapeHtml(section.accessibility.description)}</p>` : ""}${section.nodes.map((node) => renderNode(node, options.interactive)).join("")}</section>`).join("");
  return `${navigation}${sections}`;
}