import { renderStudyInline, renderStudyMath } from "./teaching-text.ts";
import { boxPlotStaticFallback } from "../../core/src/box-plot.ts";
import { histogramStaticFallback } from "../../core/src/histogram.ts";
import { regressionStaticFallback } from "../../core/src/regression-chart.ts";
import { observationExplorerFallback } from "../../core/src/observation-explorer.ts";
import {empiricalMoments} from "../../core/src/moments.ts";
import { renderDerivationDetail } from "../../renderer-reveal/src/mathematical-derivation.ts";
import {
  SCENE_DOCUMENT_OBSERVATION_VERSION,
  SCENE_DOCUMENT_BOX_PLOT_VERSION,
  SCENE_DOCUMENT_HISTOGRAM_VERSION,
  SCENE_DOCUMENT_EXPLORATION_VERSION,
  SCENE_DOCUMENT_MOMENT_VERSION,
  SCENE_DOCUMENT_TIMELINE_VERSION,
  SCENE_DOCUMENT_REGRESSION_VERSION,
  timelineStaticFallback,
  dotPlotStaticFallback,
  type DotPlotBlock,
  type ChartBlock,
  SCENE_DOCUMENT_FLOW_VERSION,
  SCENE_DOCUMENT_CHART_VERSION,
  SCENE_DOCUMENT_SEQUENCE_VERSION,
  SCENE_DOCUMENT_DEFINITION_LIST_VERSION,
  SCENE_DOCUMENT_TABLE_VERSION,
  SCENE_DOCUMENT_DOT_PLOT_VERSION,
  SCENE_DOCUMENT_DERIVATION_VERSION,
  mathematicalDerivationText,
  type MathematicalDerivationSection,
  type MathematicalDerivationDetail,
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

export const SELF_STUDY_RENDER_PLAN_VERSION = "1.1" as const;

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
  readonly derivation?: MathematicalDerivationSection;
  readonly derivationDetails?: readonly MathematicalDerivationDetail[];
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

export interface SelfStudyDefinitionListEntryPlan {
  readonly id: string;
  readonly term: string;
  readonly expression?: string;
  readonly symbol?: boolean;
  readonly description?: string;
  readonly visualMotif?: import("../../core/src/scene-document.ts").VisualMotifKey;
  readonly visualMotifRole?: "supporting" | "highlight";
  readonly source: readonly SourceReference[];
}

export interface SelfStudyDefinitionListPlan extends SelfStudyNodeBase {
  readonly kind: "definition-list";
  readonly entries: readonly SelfStudyDefinitionListEntryPlan[];
}

export interface SelfStudyTableColumnPlan {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
}

export interface SelfStudyTableCellPlan {
  readonly id: string;
  readonly text: string;
  readonly source: readonly SourceReference[];
}

export interface SelfStudyTableRowPlan {
  readonly id: string;
  readonly cells: readonly SelfStudyTableCellPlan[];
  readonly source: readonly SourceReference[];
}

export interface SelfStudyTablePlan extends SelfStudyNodeBase {
  readonly kind: "table";
  readonly caption: string;
  readonly description?: string;
  readonly columns: readonly SelfStudyTableColumnPlan[];
  readonly rows: readonly SelfStudyTableRowPlan[];
}

export interface SelfStudyChartAxisPlan {
  readonly label: string;
  readonly unit?: string;
}

export interface SelfStudyBarChartDatumPlan {
  readonly id: string;
  readonly category: string;
  readonly group?: string;
  readonly value: number;
  readonly source: readonly SourceReference[];
}

export interface SelfStudyLineChartDatumPlan {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly source: readonly SourceReference[];
}

export interface SelfStudyLineChartSeriesPlan {
  readonly id: string;
  readonly label: string;
  readonly data: readonly SelfStudyLineChartDatumPlan[];
  readonly source: readonly SourceReference[];
}

export interface SelfStudyBarChartAnnotationPlan {
  readonly id: string;
  readonly kind: "point";
  readonly datumId: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
}

export type SelfStudyLineChartAnnotationPlan =
  | {
      readonly id: string;
      readonly kind: "point";
      readonly seriesId: string;
      readonly datumId: string;
      readonly media?: {readonly uri: string; readonly darkUri?: string; readonly alternativeText: string};
      readonly label: string;
      readonly source: readonly SourceReference[];
    }
  | {
      readonly id: string;
      readonly kind: "x-range";
      readonly seriesId: string;
      readonly startDatumId: string;
      readonly endDatumId: string;
      readonly label: string;
      readonly source: readonly SourceReference[];
    };

export interface SelfStudyBarChartPlan extends SelfStudyNodeBase {
  readonly kind: "chart";
  readonly chartType: "bar";
  readonly label: string;
  readonly description: string;
  readonly xAxis: SelfStudyChartAxisPlan;
  readonly yAxis: SelfStudyChartAxisPlan;
  readonly data: readonly SelfStudyBarChartDatumPlan[];
  readonly annotations?: readonly SelfStudyBarChartAnnotationPlan[];
}

export interface SelfStudyLineChartPlan extends SelfStudyNodeBase {
  readonly kind: "chart";
  readonly chartType: "line";
  readonly label: string;
  readonly description: string;
  readonly xAxis: SelfStudyChartAxisPlan;
  readonly yAxis: SelfStudyChartAxisPlan;
  readonly series: readonly SelfStudyLineChartSeriesPlan[];
  readonly annotations?: readonly SelfStudyLineChartAnnotationPlan[];
}

export interface SelfStudyDotChartPlan extends SelfStudyNodeBase {
  readonly kind: "chart";
  readonly chartType: "dot";
  readonly payload: DotPlotBlock;
}
export interface SelfStudyScientificChartPlan extends SelfStudyNodeBase {
  readonly kind:"chart";
  readonly chartType:"box"|"histogram"|"histogram2d"|"observations";
  readonly payload:Exclude<ChartBlock,{chartType:"bar"|"line"|"dot"}>;
}
export type SelfStudyChartPlan = SelfStudyBarChartPlan | SelfStudyLineChartPlan | SelfStudyDotChartPlan | SelfStudyScientificChartPlan;

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
  readonly expectedResult?: string;
  readonly fallback: string;
}

export interface SelfStudyDiagramNodePlan {
  readonly description?: string;
  readonly parts?: readonly import("../../core/src/scene-document.ts").DiagramNodePart[];
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly emphasis?: "normal" | "supporting" | "primary";
  readonly visualRole?: string;
  readonly visualMotif?: import("../../core/src/scene-document.ts").VisualMotifKey;
  readonly visualMotifRole?: "supporting" | "highlight";
  readonly groupIds?: readonly string[];
}

export interface SelfStudyDiagramGroupPlan {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
}

export interface SelfStudyDiagramEdgePlan {
  readonly sourcePartId?: string;
  readonly targetPartId?: string;
  readonly codeDetail?: import("../../core/src/scene-document.ts").DiagramEdge["codeDetail"];
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly visualRole?: string;
}

export interface SelfStudyDiagramStatePlan {
  readonly id: string;
  readonly label: string;
  readonly source: readonly SourceReference[];
  readonly sharedEdgeAnnotations: readonly { readonly id: string; readonly label: string; readonly edgeIds: readonly string[]; readonly source: readonly SourceReference[] }[];
  readonly activeNodeIds?: readonly string[];
  readonly activeEdgeIds?: readonly string[];
  readonly activeGroupIds?: readonly string[];
  readonly focusNodeId?: string;
  readonly focusGroupId?: string;
  readonly contextGroupIds?: readonly string[];
  readonly activeMessageIds?: readonly string[];
  readonly participantBindings?: readonly { readonly roleId: string; readonly participantId: string; readonly label: string; readonly source: readonly SourceReference[] }[];
}

export interface SelfStudyDiagramPlan extends SelfStudyNodeBase {
  readonly kind: "diagram";
  readonly diagramType: "flow" | "network" | "sequence";
  readonly label: string;
  readonly description: string;
  readonly nodes: readonly SelfStudyDiagramNodePlan[];
  readonly groups?: readonly SelfStudyDiagramGroupPlan[];
  readonly edges: readonly SelfStudyDiagramEdgePlan[];
  readonly focusNodeId?: string;
  readonly states?: readonly SelfStudyDiagramStatePlan[];
  readonly participantRoles?: readonly { readonly id: string; readonly label: string; readonly source: readonly SourceReference[] }[];
  readonly messages?: readonly { readonly id: string; readonly sourceRoleId: string; readonly targetRoleId: string; readonly label: string; readonly source: readonly SourceReference[] }[];
}

export type SelfStudyNodePlan =
  | SelfStudyProsePlan
  | SelfStudyMathPlan
  | SelfStudyCodePlan
  | SelfStudyMediaPlan
  | SelfStudyListPlan
  | SelfStudyDefinitionListPlan
  | SelfStudyTablePlan
  | SelfStudyGroupPlan
  | SelfStudyPromptPlan
  | SelfStudyDiagramPlan
  | SelfStudyChartPlan;

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

function diagramStaticFallback(block: Extract<SceneBlock, { kind: "diagram" }>): string {
  if (block.diagramType === "sequence") {
    const roleLabels = new Map((block.participantRoles ?? []).map((role) => [role.id, role.label]));
    const messageLabels = new Map((block.messages ?? []).map((message) => [message.id, message.label]));
    return [
      block.label,
      block.description,
      "Participants:",
      ...(block.participantRoles ?? []).map((role) => `- ${role.label}`),
      "Messages:",
      ...(block.messages ?? []).map((message) => `- ${roleLabels.get(message.sourceRoleId) ?? message.sourceRoleId}: ${message.label} → ${roleLabels.get(message.targetRoleId) ?? message.targetRoleId}`),
      ...(block.states ?? []).flatMap((state) => [
        `State: ${state.label}`,
        ...(state.activeMessageIds ? [`- Active messages: ${state.activeMessageIds.map((id) => messageLabels.get(id) ?? id).join(", ")}`] : []),
        ...(state.participantBindings ?? []).map((binding) => `- ${roleLabels.get(binding.roleId) ?? binding.roleId}: ${binding.label}`),
      ]),
    ].join("\n");
  }
  const labels = new Map(block.nodes.map((node) => [node.id, node.label]));
  return [
    block.label,
    block.description,
    "Nodes:",
    ...block.nodes.flatMap((node) => [`- ${node.label}`, ...(node.parts ?? []).map(part => `  - ${part.label}${part.description ? `: ${part.description}` : ""}${part.parentPartId ? ` (under ${part.parentPartId})` : ""}${part.referencePartId ? ` (references ${part.referencePartId})` : ""}`)]),
    "Relations:",
    ...block.edges.filter(edge => edge.codeDetail).map(edge => `${edge.codeDetail!.label}\n${edge.codeDetail!.description}\n${edge.codeDetail!.code}`),
    ...block.edges.map((edge) => `- ${labels.get(edge.sourceNodeId) ?? edge.sourceNodeId}: ${edge.label} → ${labels.get(edge.targetNodeId) ?? edge.targetNodeId}`),
    ...(block.states ?? []).flatMap((state) => [
      `State: ${state.label}`,
      ...(state.nodePresentations ?? []).map(p => `- ${p.label ?? labels.get(p.nodeId) ?? p.nodeId}: ${p.description ?? ""}${p.thumbnail ? ` (${p.thumbnail.alternativeText})` : ""}`),
      ...(state.activeNodeIds ? [`- Active nodes: ${state.activeNodeIds.join(", ")}`] : []),
      ...(state.activeEdgeIds ? [`- Active relations: ${state.activeEdgeIds.join(", ")}`] : []),
      ...(state.activeGroupIds ? [`- Active groups: ${state.activeGroupIds.join(", ")}`] : []),
      ...(state.focusNodeId ? [`- Focus node: ${state.focusNodeId}`] : []),
      ...(state.focusGroupId ? [`- Focus group: ${state.focusGroupId}`] : []),
      ...(state.contextGroupIds ? [`- Context groups: ${state.contextGroupIds.join(", ")}`] : []),
      ...state.sharedEdgeAnnotations.map((annotation) => `- ${annotation.label}`),
    ]),
  ].join("\n");
}

function chartAxisLabel(axis: { readonly label: string; readonly unit?: string }): string {
  return axis.unit ? `${axis.label} [${axis.unit}]` : axis.label;
}

function chartStaticFallback(block: Extract<SceneBlock, { kind: "chart" }>): string {
  if (block.chartType === "regression") return regressionStaticFallback(block);
  if (block.chartType === "timeline") return timelineStaticFallback(block);
  if(block.chartType==="histogram"||block.chartType==="histogram2d")return histogramStaticFallback(block);
  if(block.chartType==="box")return boxPlotStaticFallback(block);
  if(block.chartType==="dot")return dotPlotStaticFallback(block);
  if(block.chartType==="observations")return observationExplorerFallback(block);
  const header = [
    block.label,
    block.description,
    `X: ${chartAxisLabel(block.xAxis)}`,
    `Y: ${chartAxisLabel(block.yAxis)}`,
  ];
  if (block.chartType === "bar") {
    return [
      ...header,
      ...block.data.map((datum) => `${datum.group ? `${datum.group} / ` : ""}${datum.category}: ${datum.value}`),
      ...(block.annotations ?? []).map((annotation) => `Annotation: ${annotation.label}`),
    ].join("\n");
  }
  return [
    ...header,
    ...block.series.flatMap((series) => [
      `Series: ${series.label}`,
      ...series.data.map((datum) => `- ${datum.x}, ${datum.y}`),
    ]),
    ...(block.annotations ?? []).map((annotation) => `Annotation: ${annotation.label}${annotation.kind === "point" && annotation.media ? `; ${annotation.media.alternativeText}` : ""}`),
  ].join("\n");
}

function mapBlock(block: SceneBlock, position: number): SelfStudyNodePlan {
  switch (block.kind) {
    case "prose":
      return { ...baseFor(block, position, block.text), kind: "prose", text: block.text, format: block.format ?? "plain" };
    case "math":
      return {
        ...baseFor(block, position, [block.derivation ? mathematicalDerivationText(block.derivation) : `${block.expression}: ${block.spokenText}`, ...(block.derivationDetails ?? []).flatMap(d => [d.label,...d.sections.map(mathematicalDerivationText)])].join("\n")),
        kind: "math",
        expression: block.expression,
        spokenText: block.spokenText,
        ...(block.derivation ? { derivation: block.derivation } : {}),
        ...(block.derivationDetails ? { derivationDetails: block.derivationDetails } : {}),
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
      if (block.redactions?.length) {
        const text = `${block.alternativeText}. Masked video playback is available in the presentation only.`;
        return {...baseFor(block, position, text), kind: "prose", text, format: "plain"};
      }
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
    case "definition-list":
      return {
        ...baseFor(
          block,
          position,
          block.entries.map((entry) => entry.description ? `${entry.term}: ${entry.description}` : entry.term).join("\n"),
        ),
        kind: "definition-list",
        entries: block.entries.map((entry) => ({
          id: entry.id,
          term: entry.term,
          ...(entry.expression ? { expression: entry.expression } : {}),
          ...(entry.symbol !== undefined ? { symbol: entry.symbol } : {}),
          ...(entry.description ? { description: entry.description } : {}),
          ...(entry.visualMotif ? { visualMotif: entry.visualMotif } : {}),
          ...(entry.visualMotifRole ? { visualMotifRole: entry.visualMotifRole } : {}),
          source: sourceCopy(entry.source),
        })),
      };
    case "table":
      return {
        ...baseFor(
          block,
          position,
          [
            block.caption,
            ...(block.description ? [block.description] : []),
            block.columns.map((column) => column.label).join(" | "),
            ...block.rows.map((row) => row.cells.map((cell) => cell.text).join(" | ")),
          ].join("\n"),
        ),
        kind: "table",
        caption: block.caption,
        ...(block.description ? { description: block.description } : {}),
        columns: block.columns.map((column) => ({
          id: column.id,
          label: column.label,
          source: sourceCopy(column.source),
        })),
        rows: block.rows.map((row) => ({
          id: row.id,
          source: sourceCopy(row.source),
          cells: row.cells.map((cell) => ({
            id: cell.id,
            text: cell.text,
            source: sourceCopy(cell.source),
          })),
        })),
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
        ...(block.expectedResult ? { expectedResult: block.expectedResult } : {}),
        fallback: block.fallback,
      };
    case "chart":
      if (block.chartType === "regression") return {...baseFor(block, position, regressionStaticFallback(block)), kind: "prose", text: regressionStaticFallback(block), format: "plain"};
      if (block.chartType === "timeline") return {...baseFor(block, position, timelineStaticFallback(block)), kind: "prose", text: timelineStaticFallback(block), format: "plain"};
      if(["histogram","histogram2d","box","observations"].includes(block.chartType))return {...baseFor(block,position,chartStaticFallback(block)),kind:"chart",chartType:block.chartType,payload:block} as SelfStudyScientificChartPlan;
      if (block.chartType === "dot") return { ...baseFor(block,position,dotPlotStaticFallback(block)),kind:"chart",chartType:"dot",payload:block };
      if (block.chartType === "bar") {
        return {
          ...baseFor(block, position, chartStaticFallback(block)),
          kind: "chart",
          chartType: "bar",
          label: block.label,
          description: block.description,
          xAxis: { ...block.xAxis },
          yAxis: { ...block.yAxis },
          data: block.data.map((datum) => ({
            id: datum.id,
            category: datum.category,
            ...(datum.group ? { group: datum.group } : {}),
            value: datum.value,
            source: sourceCopy(datum.source),
          })),
          ...(block.annotations ? {
            annotations: block.annotations.map((annotation) => ({
              id: annotation.id,
              kind: annotation.kind,
              datumId: annotation.datumId,
              label: annotation.label,
              source: sourceCopy(annotation.source),
            })),
          } : {}),
        };
      }
      return {
        ...baseFor(block, position, chartStaticFallback(block)),
        kind: "chart",
        chartType: "line",
        label: block.label,
        description: block.description,
        xAxis: { ...block.xAxis },
        yAxis: { ...block.yAxis },
        series: block.series.map((series) => ({
          id: series.id,
          label: series.label,
          source: sourceCopy(series.source),
          data: series.data.map((datum) => ({
            id: datum.id,
            x: datum.x,
            y: datum.y,
            source: sourceCopy(datum.source),
          })),
        })),
        ...(block.annotations ? {
          annotations: block.annotations.map((annotation) => annotation.kind === "point"
            ? {
                id: annotation.id,
                kind: "point" as const,
                seriesId: annotation.seriesId,
                datumId: annotation.datumId,
                ...(annotation.media ? {media: {...annotation.media}} : {}),
                label: annotation.label,
                source: sourceCopy(annotation.source),
              }
            : {
                id: annotation.id,
                kind: "x-range" as const,
                seriesId: annotation.seriesId,
                startDatumId: annotation.startDatumId,
                endDatumId: annotation.endDatumId,
                label: annotation.label,
                source: sourceCopy(annotation.source),
              }),
        } : {}),
      };
    case "diagram":
      return {
        ...baseFor(block, position, diagramStaticFallback(block)),
        kind: "diagram",
        diagramType: block.diagramType,
        label: block.label,
        description: block.description,
        nodes: block.nodes.map((node) => ({
          id: node.id,
          label: node.label,
          ...(node.description ? {description: node.description} : {}),
          ...(node.parts ? {parts: node.parts.map(part => ({...part, source: sourceCopy(part.source)}))} : {}),
          source: sourceCopy(node.source),
          ...(node.emphasis ? { emphasis: node.emphasis } : {}),
          ...(node.visualRole ? { visualRole: node.visualRole } : {}),
          ...(node.visualMotif ? { visualMotif: node.visualMotif } : {}),
          ...(node.visualMotifRole ? { visualMotifRole: node.visualMotifRole } : {}),
          ...(node.groupIds ? { groupIds: [...node.groupIds] } : {}),
          ...(node.parts ? {parts: node.parts.map(part => ({...part, source: sourceCopy(part.source)}))} : {}),
        })),
        edges: block.edges.map((edge) => ({
          id: edge.id,
          sourceNodeId: edge.sourceNodeId,
          targetNodeId: edge.targetNodeId,
          ...(edge.sourcePartId ? {sourcePartId: edge.sourcePartId} : {}),
          ...(edge.targetPartId ? {targetPartId: edge.targetPartId} : {}),
          label: edge.label,
          source: sourceCopy(edge.source),
          ...(edge.codeDetail ? {codeDetail: {...edge.codeDetail, source: sourceCopy(edge.codeDetail.source)}} : {}),
          ...(edge.visualRole ? { visualRole: edge.visualRole } : {}),
        })),
        ...(block.groups ? { groups: block.groups.map((group) => ({ ...group, source: sourceCopy(group.source) })) } : {}),
        ...(block.focusNodeId ? { focusNodeId: block.focusNodeId } : {}),
        ...(block.states ? { states: block.states.map((state) => ({ id: state.id, label: state.label, source: sourceCopy(state.source), sharedEdgeAnnotations: state.sharedEdgeAnnotations.map((annotation) => ({ id: annotation.id, label: annotation.label, edgeIds: [...annotation.edgeIds], source: sourceCopy(annotation.source) })), ...(state.activeNodeIds ? { activeNodeIds: [...state.activeNodeIds] } : {}), ...(state.activeEdgeIds ? { activeEdgeIds: [...state.activeEdgeIds] } : {}), ...(state.activeGroupIds ? { activeGroupIds: [...state.activeGroupIds] } : {}), ...(state.focusNodeId ? { focusNodeId: state.focusNodeId } : {}), ...(state.focusGroupId ? { focusGroupId: state.focusGroupId } : {}), ...(state.contextGroupIds ? { contextGroupIds: [...state.contextGroupIds] } : {}), ...(state.activeMessageIds ? { activeMessageIds: [...state.activeMessageIds] } : {}), ...(state.participantBindings ? { participantBindings: state.participantBindings.map((binding) => ({ roleId: binding.roleId, participantId: binding.participantId, label: binding.label, source: sourceCopy(binding.source) })) } : {}) })) } : {}),
        ...(block.participantRoles ? { participantRoles: block.participantRoles.map((role) => ({ ...role, source: sourceCopy(role.source) })) } : {}),
        ...(block.messages ? { messages: block.messages.map((message) => ({ ...message, source: sourceCopy(message.source) })) } : {}),
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
  const version = (document as { version?: unknown }).version;
  if (version !== SCENE_DOCUMENT_REGRESSION_VERSION && version !== SCENE_DOCUMENT_TIMELINE_VERSION && version !== SCENE_DOCUMENT_VERSION && version !== SCENE_DOCUMENT_FLOW_VERSION && version !== SCENE_DOCUMENT_CHART_VERSION && version !== SCENE_DOCUMENT_SEQUENCE_VERSION && version !== SCENE_DOCUMENT_DEFINITION_LIST_VERSION && version !== SCENE_DOCUMENT_TABLE_VERSION && version !== SCENE_DOCUMENT_DOT_PLOT_VERSION && version !== SCENE_DOCUMENT_DERIVATION_VERSION && version !==SCENE_DOCUMENT_OBSERVATION_VERSION && version !== SCENE_DOCUMENT_BOX_PLOT_VERSION && version !== SCENE_DOCUMENT_HISTOGRAM_VERSION && version!==SCENE_DOCUMENT_EXPLORATION_VERSION && version!==SCENE_DOCUMENT_MOMENT_VERSION) {
    return diagnostic("UNSUPPORTED_SCENE_DOCUMENT_VERSION", `Unsupported scene document version: ${String(version)}`);
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
  const answer = node.expectedResult
    ? interactive
      ? `<details class="self-study-answer"><summary>Musterlösung anzeigen</summary><p>${escapeHtml(node.expectedResult)}</p></details>`
      : `<p class="self-study-answer">${escapeHtml(node.expectedResult)}</p>`
    : "";
  if (!interactive) {
    const options = node.options?.length ? `<ul>${node.options.map((option) => `<li>${escapeHtml(option)}</li>`).join("")}</ul>` : "";
    return `<section class="self-study-prompt"><p>${escapeHtml(node.prompt)}</p>${options}<p class="self-study-fallback">${escapeHtml(node.fallback)}</p>${answer}</section>`;
  }
  if (node.responseMode === "free-text" || node.responseMode === "reflection") {
    return `<fieldset class="self-study-prompt"><legend>${escapeHtml(node.prompt)}</legend><textarea aria-label="${escapeHtml(node.prompt)}"></textarea><p class="self-study-fallback">${escapeHtml(node.fallback)}</p>${answer}</fieldset>`;
  }
  const inputType = node.responseMode === "multiple-choice" ? "checkbox" : "radio";
  const options = (node.options ?? []).map((option, index) => `<label><input type="${inputType}" name="${escapeHtml(node.id)}" value="${index}"> ${escapeHtml(option)}</label>`).join("");
  return `<fieldset class="self-study-prompt"><legend>${escapeHtml(node.prompt)}</legend>${options}<p class="self-study-fallback">${escapeHtml(node.fallback)}</p>${answer}</fieldset>`;
}

function renderDiagram(node: SelfStudyDiagramPlan): string {
  const labels = new Map(node.nodes.map((item) => [item.id, item.label]));
  const roleLabels = new Map((node.participantRoles ?? []).map((role) => [role.id, role.label]));
  const messageLabels = new Map((node.messages ?? []).map((message) => [message.id, message.label]));
  const partLabels = new Map(node.nodes.flatMap(item => (item.parts ?? []).map(part => [part.id, part.label] as const)));
  const nodes = node.nodes.map((item) => `<li data-diagram-node-id="${escapeHtml(item.id)}"${sourceAttributes(item.source)}>${escapeHtml(item.label)}${item.description ? `: ${escapeHtml(item.description)}` : ""}${item.parts ? `<ul>${item.parts.map(part => `<li${sourceAttributes(part.source)}>${escapeHtml(part.label)}${part.description ? `: ${escapeHtml(part.description)}` : ""}${part.parentPartId ? ` (under ${escapeHtml(partLabels.get(part.parentPartId) ?? part.parentPartId)})` : ""}${part.referencePartId ? ` (references ${escapeHtml(partLabels.get(part.referencePartId) ?? part.referencePartId)})` : ""}</li>`).join("")}</ul>` : ""}</li>`).join("");
  const edges = node.edges.map((edge) => `<li data-diagram-edge-id="${escapeHtml(edge.id)}"${sourceAttributes(edge.source)}>${escapeHtml(labels.get(edge.sourceNodeId) ?? edge.sourceNodeId)}: ${escapeHtml(edge.label)} → ${escapeHtml(labels.get(edge.targetNodeId) ?? edge.targetNodeId)}${edge.codeDetail ? `<details${sourceAttributes(edge.codeDetail.source)}><summary>${escapeHtml(edge.codeDetail.label)}</summary><p>${escapeHtml(edge.codeDetail.description)}</p><pre><code>${escapeHtml(edge.codeDetail.code)}</code></pre></details>` : ""}</li>`).join("");
  const states = (node.states ?? []).map((state) => `<section class="self-study-diagram-state" data-diagram-state-id="${escapeHtml(state.id)}"${state.activeNodeIds ? ` data-active-node-ids="${escapeHtml(state.activeNodeIds.join(" "))}"` : ""}${state.activeEdgeIds ? ` data-active-edge-ids="${escapeHtml(state.activeEdgeIds.join(" "))}"` : ""}${state.activeGroupIds ? ` data-active-group-ids="${escapeHtml(state.activeGroupIds.join(" "))}"` : ""}${state.focusNodeId ? ` data-focus-node-id="${escapeHtml(state.focusNodeId)}"` : ""}${state.focusGroupId ? ` data-focus-group-id="${escapeHtml(state.focusGroupId)}"` : ""}${state.contextGroupIds ? ` data-context-group-ids="${escapeHtml(state.contextGroupIds.join(" "))}"` : ""}${state.activeMessageIds ? ` data-active-message-ids="${escapeHtml(state.activeMessageIds.join(" "))}"` : ""}${sourceAttributes(state.source)}><strong>${escapeHtml(state.label)}</strong>${state.activeMessageIds ? `<p class="self-study-sequence-active-messages">Active messages: ${escapeHtml(state.activeMessageIds.map((id) => messageLabels.get(id) ?? id).join(", "))}</p>` : ""}${state.participantBindings?.length ? `<ul class="self-study-sequence-participant-bindings">${state.participantBindings.map((binding) => `<li data-participant-binding-role-id="${escapeHtml(binding.roleId)}" data-participant-id="${escapeHtml(binding.participantId)}"${sourceAttributes(binding.source)}>${escapeHtml(roleLabels.get(binding.roleId) ?? binding.roleId)}: ${escapeHtml(binding.label)}</li>`).join("")}</ul>` : ""}${state.sharedEdgeAnnotations.map((annotation) => `<p data-shared-edge-annotation-id="${escapeHtml(annotation.id)}" data-edge-ids="${escapeHtml(annotation.edgeIds.join(" "))}"${sourceAttributes(annotation.source)}>${escapeHtml(annotation.label)}</p>`).join("")}</section>`).join("");
  const participants = (node.participantRoles ?? []).map((role) => `<li data-participant-role-id="${escapeHtml(role.id)}"${sourceAttributes(role.source)}>${escapeHtml(role.label)}</li>`).join("");
  const messages = (node.messages ?? []).map((message) => `<li data-interaction-message-id="${escapeHtml(message.id)}" data-source-role-id="${escapeHtml(message.sourceRoleId)}" data-target-role-id="${escapeHtml(message.targetRoleId)}"${sourceAttributes(message.source)}>${escapeHtml(roleLabels.get(message.sourceRoleId) ?? message.sourceRoleId)}: ${escapeHtml(message.label)} → ${escapeHtml(roleLabels.get(message.targetRoleId) ?? message.targetRoleId)}</li>`).join("");
  return `<figure class="self-study-diagram" data-diagram-type="${escapeHtml(node.diagramType)}"><figcaption><strong>${escapeHtml(node.label)}</strong> <span>${escapeHtml(node.description)}</span></figcaption><ol class="self-study-diagram-nodes">${nodes}</ol><ol class="self-study-diagram-edges">${edges}</ol>${participants ? `<ol class="self-study-sequence-participants">${participants}</ol>` : ""}${messages ? `<ol class="self-study-sequence-messages">${messages}</ol>` : ""}${states}</figure>`;
}

function renderChart(node: SelfStudyChartPlan): string {
  if(node.chartType==="box"||node.chartType==="histogram"||node.chartType==="histogram2d"||node.chartType==="observations"){
    const p=node.payload;
    let table="";
    if(p.chartType==="observations"&&p.view==="moments"){
      const rows=p.series.map(s=>{const m=empiricalMoments(s.data.map(d=>d.value));const number=(v:number|null)=>v===null?"undefined":Number(v.toFixed(4)).toString();return `<tr><th scope="row">${escapeHtml(s.label)}</th>${[m.n,m.mean,m.m2,m.sampleVariance,m.skewness,m.kurtosis].map(v=>`<td>${number(v)}</td>`).join("")}</tr>`;}).join("");
      table=`<table class="self-study-moment-table"><caption>Empirical descriptors; variances use squared measurement units</caption><thead><tr><th>Series</th><th>n</th><th>Mean</th><th>m₂ (n)</th><th>s² (n−1)</th><th>g₁</th><th>K</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    return `<figure class="self-study-scientific-chart" data-chart-type="${escapeHtml(p.chartType)}"><figcaption>${escapeHtml(p.label)}</figcaption><p>${escapeHtml(p.description)}</p>${table}<div class="self-study-chart-host" data-chart-block-id="${escapeHtml(node.sourceBlockId)}"></div><details class="self-study-chart-data"><summary>Data and numerical description</summary><pre>${escapeHtml(chartStaticFallback(p))}</pre></details></figure>`;
  }
  if(node.chartType==="dot"){
    const p=node.payload;
    const references=[...(p.referenceLine?[p.referenceLine]:[]),...p.groups.flatMap(g=>g.summary?[g.summary]:[])];
    const summary=references.map(r=>`<p${sourceAttributes(r.source)}>${escapeHtml(r.label)}: ${r.value} ${escapeHtml(p.yAxis.unit??"")}</p>`).join("");
    const rows=p.groups.flatMap(g=>g.data.map((d,i)=>`<tr data-chart-datum-id="${escapeHtml(d.id)}"${sourceAttributes(d.source)}><th scope="row">${escapeHtml(g.label)}</th><td>${escapeHtml(d.label??String(i+1))}</td><td>${d.value}</td></tr>`)).join("");
    const curves=(p.curves??[]).map(c=>`<details><summary>${escapeHtml(c.label)}</summary><table><thead><tr><th>${escapeHtml(chartAxisLabel(p.xAxis))}</th><th>${escapeHtml(chartAxisLabel(p.yAxis))}</th></tr></thead><tbody>${c.data.map(d=>`<tr${sourceAttributes(d.source)}><td>${d.x}</td><td>${d.y}</td></tr>`).join("")}</tbody></table></details>`).join("");
    return `<figure class="self-study-dot-plot"><figcaption>${escapeHtml(p.label)}</figcaption><p>${escapeHtml(p.description)}</p><div class="self-study-chart-host" data-chart-block-id="${escapeHtml(node.sourceBlockId)}"></div><details class="self-study-chart-data"><summary>Show values for this figure</summary>${summary}<table><thead><tr><th>${escapeHtml(p.xAxis.label)}</th><th>Observation</th><th>${escapeHtml(chartAxisLabel(p.yAxis))}</th></tr></thead><tbody>${rows}</tbody></table>${curves}</details></figure>`;
  }
  const xAxis = chartAxisLabel(node.xAxis);
  const yAxis = chartAxisLabel(node.yAxis);
  const axes = `<p class="self-study-chart-axes">X: ${escapeHtml(xAxis)} · Y: ${escapeHtml(yAxis)}</p>`;
  const annotations = (node.annotations ?? []).length > 0
    ? `<ul class="self-study-chart-annotations">${(node.annotations ?? []).map((annotation) =>
        `<li data-chart-annotation-id="${escapeHtml(annotation.id)}"${sourceAttributes(annotation.source)}>${escapeHtml(annotation.label)}${"media" in annotation && annotation.media ? `: ${escapeHtml(annotation.media.alternativeText)}` : ""}</li>`
      ).join("")}</ul>`
    : "";

  if (node.chartType === "bar") {
    const grouped = node.data.length > 0 && node.data.every((datum) => datum.group !== undefined);
    const rows = node.data.map((datum) =>
      grouped
        ? `<tr data-chart-datum-id="${escapeHtml(datum.id)}"${sourceAttributes(datum.source)}><th scope="row">${escapeHtml(datum.group ?? "")}</th><td>${escapeHtml(datum.category)}</td><td>${escapeHtml(String(datum.value))}</td></tr>`
        : `<tr data-chart-datum-id="${escapeHtml(datum.id)}"${sourceAttributes(datum.source)}><th scope="row">${escapeHtml(datum.category)}</th><td>${escapeHtml(String(datum.value))}</td></tr>`
    ).join("");
    const head = grouped
      ? `<tr><th scope="col">${escapeHtml(node.xAxis.label)}</th><th scope="col">Replicate</th><th scope="col">${escapeHtml(node.yAxis.label)}</th></tr>`
      : `<tr><th scope="col">${escapeHtml(node.xAxis.label)}</th><th scope="col">${escapeHtml(node.yAxis.label)}</th></tr>`;
    return `<figure class="self-study-chart" data-chart-type="bar"><figcaption><strong>${escapeHtml(node.label)}</strong> <span>${escapeHtml(node.description)}</span></figcaption>${axes}<table><thead>${head}</thead><tbody>${rows}</tbody></table>${annotations}</figure>`;
  }

  const series = node.series.map((seriesItem) => {
    const rows = seriesItem.data.map((datum) =>
      `<tr data-chart-datum-id="${escapeHtml(datum.id)}"${sourceAttributes(datum.source)}><td>${escapeHtml(String(datum.x))}</td><td>${escapeHtml(String(datum.y))}</td></tr>`
    ).join("");
    return `<section class="self-study-chart-series" data-chart-series-id="${escapeHtml(seriesItem.id)}"${sourceAttributes(seriesItem.source)}><h3>${escapeHtml(seriesItem.label)}</h3><table><thead><tr><th scope="col">${escapeHtml(node.xAxis.label)}</th><th scope="col">${escapeHtml(node.yAxis.label)}</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  }).join("");

  return `<figure class="self-study-chart" data-chart-type="line"><figcaption><strong>${escapeHtml(node.label)}</strong> <span>${escapeHtml(node.description)}</span></figcaption>${axes}${series}${annotations}</figure>`;
}

function renderMathDetails(details: readonly MathematicalDerivationDetail[] = []): string {
  return details.map(d => `<details class="self-study-proof"><summary>${escapeHtml(d.label)}</summary>${renderDerivationDetail(d,e=>renderStudyMath(e,true))}</details>`).join("");
}

function renderNodeBody(node: SelfStudyNodePlan, interactive: boolean, entryFormula?: SelfStudyNodePlan): string {
  switch (node.kind) {
    case "prose":
      return `<div class="self-study-prose">${renderStudyInline(node.text)}</div>`;
    case "math":
      if (node.derivation) {
        const math = (expression: string) => `<div class="self-study-math">${renderStudyMath(expression,true)}</div>`;
        return `<section class="self-study-derivation" aria-label="${escapeHtml(node.spokenText)}">${math(node.derivation.steps[0]!.from.expression)}${node.derivation.steps.map(step =>
          `<section><h3>${escapeHtml(step.operation)}</h3>${math(step.rule.formula.expression)}${math(step.to.expression)}<details><summary>${escapeHtml(step.rule.label)}</summary><p>${escapeHtml(step.rule.description)}</p>${math(step.explanation.application.expression)}<p>${escapeHtml(step.explanation.text)}</p>${step.assumptions.map(a => `<p>${escapeHtml(a.description)}</p>`).join("")}</details></section>`
         ).join("")}<dl>${node.derivation.legend.map(e => `<dt>${e.expression ? renderStudyMath(e.expression) : renderStudyInline(e.term)}</dt><dd>${renderStudyInline(e.description ?? "")}</dd>`).join("")}</dl></section>` + renderMathDetails(node.derivationDetails);
      }
      return `<div class="self-study-math" role="math" aria-label="${escapeHtml(node.spokenText)}">${renderStudyMath(node.expression,true)}<span class="visually-hidden"><code>${escapeHtml(node.expression)}</code>${escapeHtml(node.spokenText)}</span></div>` + renderMathDetails(node.derivationDetails);
    case "code":
      return `<div class="self-study-code"><pre><code data-language="${escapeHtml(node.language)}">${escapeHtml(node.code)}</code></pre><p class="self-study-fallback">${escapeHtml(node.fallback)}</p></div>`;
    case "media-reference":
      return `<p class="self-study-media"><a href="${escapeHtml(node.uri)}" rel="noreferrer noopener">${escapeHtml(node.alternativeText)}</a></p>`;
    case "list": {
      const tag = node.listStyle === "ordered" ? "ol" : "ul";
      const items = node.items.map((item) => `<li data-list-item-id="${escapeHtml(item.id)}"${sourceAttributes(item.source)}>${escapeHtml(item.text)}</li>`).join("");
      return `<${tag} class="self-study-list">${items}</${tag}>`;
    }
    case "definition-list": {
      const entries = node.entries.map((entry) => `<div class="self-study-definition-entry" data-definition-entry-id="${escapeHtml(entry.id)}"${sourceAttributes(entry.source)}><dt>${entry.expression ? renderStudyMath(entry.expression) : renderStudyInline(entry.term)}</dt>${entry.description ? `<dd>${renderStudyInline(entry.description)}</dd>` : ""}${entryFormula ? `<dd>${renderNode(entryFormula, interactive)}</dd>` : ""}</div>`).join("");
      return `<dl class="self-study-definition-list">${entries}</dl>`;
    }
    case "table": {
      const caption = `<caption>${escapeHtml(node.caption)}</caption>`;
      const head = `<thead><tr>${node.columns.map((column) => `<th scope="col" data-table-column-id="${escapeHtml(column.id)}"${sourceAttributes(column.source)}>${escapeHtml(column.label)}</th>`).join("")}</tr></thead>`;
      const body = `<tbody>${node.rows.map((row) => `<tr data-table-row-id="${escapeHtml(row.id)}"${sourceAttributes(row.source)}>${row.cells.map((cell) => `<td data-table-cell-id="${escapeHtml(cell.id)}"${sourceAttributes(cell.source)}>${renderStudyInline(cell.text)}</td>`).join("")}</tr>`).join("")}</tbody>`;
      const description = node.description ? ` aria-description="${escapeHtml(node.description)}"` : "";
      return `<table class="self-study-table"${description}>${caption}${head}${body}</table>`;
    }
    case "group":
      return `<div class="self-study-group">${node.children.map((child) => renderNode(child, interactive)).join("")}</div>`;
    case "prompt":
      return renderPrompt(node, interactive);
    case "chart":
      return renderChart(node);
    case "diagram":
      return renderDiagram(node);
  }
}

function renderNode(node: SelfStudyNodePlan, interactive: boolean, entryFormula?: SelfStudyNodePlan): string {
  const body = renderNodeBody(node, interactive, entryFormula);
  const attributes = `${sourceAttributes(node.source)} data-source-block-id="${escapeHtml(node.sourceBlockId)}" data-disclosure-mode="${node.disclosureMode}"`;
  if (!interactive || node.disclosureMode === "always") {
    return `<section class="self-study-block"${attributes}>${body}</section>`;
  }
  const order = node.disclosure?.order ?? 0;
  const summary = node.disclosureMode === "optional" ? "Zusatzinhalt anzeigen" : "Nächsten Inhalt anzeigen";
  return `<details class="self-study-block self-study-disclosure"${attributes} data-disclosure-order="${order}"><summary>${summary}</summary>${body}</details>`;
}

function renderSectionNodes(nodes: readonly SelfStudyNodePlan[], interactive: boolean): string {
  const heading = nodes[0]?.kind === "prose" && nodes[0].intent?.kind === "introduce" ? nodes[0] : undefined;
  const body = heading ? nodes.slice(1) : nodes;
  const context = body.length % 2 === 1 && body[0]?.kind === "prose" && body[0].intent?.kind === "explain" ? body[0] : undefined;
  const pairs = context ? body.slice(1) : body;
  if (pairs.length >= 4 && pairs.length <= 8 && pairs.every((node, index) =>
    index % 2 === 0 ? node.kind === "definition-list" && node.entries.length === 1 : node.kind === "math")) {
    const cards = pairs.filter((_, index) => index % 2 === 0).map((node, index) =>
      renderNode(node, interactive, pairs[index * 2 + 1]!)).join("");
    return `${heading ? renderNode(heading, interactive) : ""}${context ? renderNode(context, interactive) : ""}<div class="self-study-definition-list">${cards}</div>`;
  }
  const output:string[]=[];
  for(let i=0;i<nodes.length;i++){
    const node=nodes[i]!,next=nodes[i+1];
    const linked=node.kind==="math"&&next?.kind==="definition-list"&&next.source.some(s=>s.relationPath==="dct:hasPart"&&node.source.some(m=>m.resourceId===s.resourceId));
    if(linked){output.push(`<div class="self-study-formula-unit">${renderNode(node,interactive)}${renderNode(next!,interactive)}</div>`);i++;}
    else output.push(renderNode(node,interactive));
  }
  return output.join("");
}

export function renderSelfStudyHtml(plan: SelfStudyRenderPlan, options: { readonly interactive: boolean; readonly narrative?: boolean }): string {
  const navigation = `<nav class="self-study-navigation" aria-label="Lernabschnitte"><ol>${plan.sections.map((section) => `<li><a href="#${escapeHtml(section.id)}">${escapeHtml(section.semanticLabel)}</a></li>`).join("")}</ol></nav>`;
  const sections = plan.sections.map((section, index) => {
    const narrative=options.narrative&&section.narration;
    const prose=narrative?`<div class="self-study-narration">${section.narration!.split(/\n\s*\n/u).map(p=>`<p>${renderStudyInline(p)}</p>`).join("")}</div>`:"";
    const nodes=narrative?section.nodes.filter(n=>!["list","prompt","prose"].includes(n.kind)&&(n.kind!=="definition-list"||n.emphasis==="supporting")):section.nodes;
    return `<section id="${escapeHtml(section.id)}" data-source-scene-id="${escapeHtml(section.sourceSceneId)}" class="self-study-section" aria-labelledby="${escapeHtml(section.id)}-title"${sourceAttributes(section.source)}><h2 id="${escapeHtml(section.id)}-title"><span class="self-study-section-index">${index + 1}.</span> ${escapeHtml(section.semanticLabel)}</h2>${section.accessibility?.description ? `<p>${escapeHtml(section.accessibility.description)}</p>` : ""}${prose}${renderSectionNodes(nodes, options.interactive)}</section>`;
  }).join("");
  return `${navigation}${sections}`;
}
