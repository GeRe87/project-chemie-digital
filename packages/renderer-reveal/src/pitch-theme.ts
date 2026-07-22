import type { RevealNodePlan, RevealRenderPlan, RevealSectionPlan } from "./index.ts";

export interface PitchThemeTokens {
  readonly version: "1.0";
  readonly typography: {
    readonly headingFamily: string;
    readonly bodyFamily: string;
    readonly monoFamily: string;
    readonly baseSizeRem: number;
    readonly lineHeight: number;
  };
  readonly spacing: readonly number[];
  readonly colors: {
    readonly background: string;
    readonly surface: string;
    readonly foreground: string;
    readonly muted: string;
    readonly accent: string;
    readonly accentForeground: string;
    readonly focus: string;
  };
  readonly radiusPx: number;
  readonly chemistryTreatment: "structural-grid";
}

export const udeChemistryPitchTheme: PitchThemeTokens = Object.freeze({
  version: "1.0",
  typography: Object.freeze({
    headingFamily: "Arial, Helvetica, sans-serif",
    bodyFamily: "Arial, Helvetica, sans-serif",
    monoFamily: "Consolas, monospace",
    baseSizeRem: 1,
    lineHeight: 1.5,
  }),
  spacing: Object.freeze([0, 4, 8, 12, 16, 24, 32, 48, 64]),
  colors: Object.freeze({
    background: "#ffffff",
    surface: "#f3f6f8",
    foreground: "#172026",
    muted: "#4d5a63",
    accent: "#005a78",
    accentForeground: "#ffffff",
    focus: "#9b4d00",
  }),
  radiusPx: 8,
  chemistryTreatment: "structural-grid",
});

export type PitchComponentKind = "heading" | "prose" | "math" | "media" | "group" | "prompt";

export interface PitchComponentPlan {
  readonly id: string;
  readonly kind: PitchComponentKind;
  readonly sourceNodeId: string;
  readonly headingLevel?: 1 | 2;
  readonly label: string;
  readonly readingOrder: number;
  readonly focusable: boolean;
  readonly reducedMotion: boolean;
  readonly staticFallback: string;
  readonly sourceResourceIds: readonly string[];
}

export interface PitchSectionComponentPlan {
  readonly id: string;
  readonly landmark: "region";
  readonly label: string;
  readonly heading: PitchComponentPlan;
  readonly components: readonly PitchComponentPlan[];
}

export interface PitchComponentDocument {
  readonly version: "1.0";
  readonly theme: PitchThemeTokens;
  readonly sourceRenderPlanId: string;
  readonly sections: readonly PitchSectionComponentPlan[];
}

export interface PitchRuntimePort {
  addKeydownListener(listener: (key: string) => void): () => void;
  startAnimation?(name: string): () => void;
}

export interface PitchMountHandle {
  focusNext(): string | undefined;
  focusPrevious(): string | undefined;
  destroy(): void;
}

function componentKind(node: RevealNodePlan): PitchComponentKind {
  if (node.kind === "media-reference") return "media";
  return node.kind;
}

function sourceIds(node: RevealNodePlan): readonly string[] {
  return node.source.map((entry) => entry.resourceId).sort();
}

function orderedSectionNodes(section: RevealSectionPlan): readonly RevealNodePlan[] {
  const nodesBySourceBlockId = new Map<string, RevealNodePlan>();
  for (const node of section.nodes) {
    if (nodesBySourceBlockId.has(node.sourceBlockId)) {
      throw new Error(`Section ${section.sourceSceneId} has duplicate sourceBlockId ${node.sourceBlockId}`);
    }
    nodesBySourceBlockId.set(node.sourceBlockId, node);
  }

  const uniqueReadingOrder = new Set(section.readingOrder);
  if (
    section.readingOrder.length !== section.nodes.length
    || uniqueReadingOrder.size !== section.readingOrder.length
    || section.readingOrder.some((sourceBlockId) => !nodesBySourceBlockId.has(sourceBlockId))
  ) {
    throw new Error(`Section ${section.sourceSceneId} has invalid reading order`);
  }

  return section.readingOrder.map((sourceBlockId) => nodesBySourceBlockId.get(sourceBlockId)!);
}

function mapNode(node: RevealNodePlan, index: number, reducedMotion: boolean): PitchComponentPlan {
  return {
    id: `pitch-component-${index}-${node.id}`,
    kind: componentKind(node),
    sourceNodeId: node.id,
    label: node.accessibility?.label ?? node.staticFallback,
    readingOrder: index + 1,
    focusable: node.kind === "prompt",
    reducedMotion,
    staticFallback: node.staticFallback,
    sourceResourceIds: sourceIds(node),
  };
}

function mapSection(section: RevealSectionPlan, index: number, reducedMotion: boolean): PitchSectionComponentPlan {
  const heading: PitchComponentPlan = {
    id: `pitch-heading-${index}-${section.id}`,
    kind: "heading",
    sourceNodeId: section.id,
    headingLevel: index === 0 ? 1 : 2,
    label: section.semanticLabel,
    readingOrder: 0,
    focusable: false,
    reducedMotion,
    staticFallback: section.semanticLabel,
    sourceResourceIds: section.source.map((entry) => entry.resourceId).sort(),
  };
  return {
    id: `pitch-section-${index}-${section.id}`,
    landmark: "region",
    label: section.semanticLabel,
    heading,
    components: orderedSectionNodes(section).map((node, nodeIndex) => mapNode(node, nodeIndex, reducedMotion)),
  };
}

export function createPitchComponentDocument(plan: RevealRenderPlan): PitchComponentDocument {
  if (plan.version !== "1.0") throw new Error("Unsupported RevealRenderPlan version");
  return {
    version: "1.0",
    theme: udeChemistryPitchTheme,
    sourceRenderPlanId: plan.sourceDocumentId,
    sections: plan.sections.map((section, index) => mapSection(section, index, plan.reducedMotion)),
  };
}

export function canonicalSerializePitchComponentDocument(document: PitchComponentDocument): string {
  return JSON.stringify(document);
}

export function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string): number => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Invalid colour token: ${hex}`);
    const values = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
    const linear = values.map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function mountPitchComponents(document: PitchComponentDocument, runtime: PitchRuntimePort): PitchMountHandle {
  const focusable = document.sections.flatMap((section) => section.components).filter((component) => component.focusable);
  let focusIndex = -1;
  let destroyed = false;
  const cleanups: Array<() => void> = [];
  cleanups.push(runtime.addKeydownListener((key) => {
    if (destroyed) return;
    if (key === "ArrowRight" || key === "ArrowDown") focusIndex = Math.min(focusIndex + 1, focusable.length - 1);
    if (key === "ArrowLeft" || key === "ArrowUp") focusIndex = Math.max(focusIndex - 1, 0);
  }));
  if (!document.sections.every((section) => section.components.every((component) => component.reducedMotion))) {
    const stop = runtime.startAnimation?.("pitch-emphasis");
    if (stop) cleanups.push(stop);
  }
  return {
    focusNext: () => {
      if (destroyed || focusable.length === 0) return undefined;
      focusIndex = (focusIndex + 1) % focusable.length;
      return focusable[focusIndex]?.id;
    },
    focusPrevious: () => {
      if (destroyed || focusable.length === 0) return undefined;
      focusIndex = (focusIndex - 1 + focusable.length) % focusable.length;
      return focusable[focusIndex]?.id;
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      for (const cleanup of cleanups.splice(0).reverse()) cleanup();
    },
  };
}
