import katex from "katex";
import { resolvePublicAssetUrl } from "./public-asset-url.ts";
import { validateSceneDocument, type SceneDocument, type SceneBlock, type SourceReference } from "../../../packages/core/src/scene-document.ts";
import { inferRevealLayoutDecision } from "../../../packages/renderer-reveal/src/layout-policy.ts";
import { inferRevealLayoutFit } from "../../../packages/renderer-reveal/src/layout-fit.ts";
import {
  inferRevealCompositionPlan,
  revealComponentDescriptor,
  type RevealCompositionPlacement,
} from "../../../packages/renderer-reveal/src/composition-policy.ts";
import { evaluateLectureContentBudget } from "../../../packages/renderer-reveal/src/lecture-readability.ts";

export type PitchLayout = "opening" | "statement" | "process" | "split-proof" | "semantic-source" | "semantic-multi-view" | "concept-specification" | "hierarchy-flow" | "reference-code" | "process-context" | "data-explanation" | "analysis-result" | "card-sequence" | "text-network-progression" | "concentric-network" | "process-diagram" | "foundation-card-grid" | "full-media" | "closing" | "hero-title-panel" | "diagram-stage";
const layoutByScene: Readonly<Record<string, PitchLayout>> = Object.freeze({
  "ex:scene-sd-definition--scene": "opening",
  "ex:scene-sd-process--scene": "process",
  "ex:scene-formula-symbols--scene": "split-proof",
  "ex:scene-chemistry-example--scene": "split-proof",
});

export interface MinimalElement {
  innerHTML: string;
  appendChild(node: MinimalElement): void;
  setAttribute(name: string, value: string): void;
  className: string;
  textContent: string | null;
}
export interface PitchDomPort { createElement(tag: string): MinimalElement; root: MinimalElement; }

function sourceAttributes(node: MinimalElement, sources: readonly SourceReference[]): void {
  node.setAttribute("data-resource-id", sources.map((source) => source.resourceId).join(" "));
  const provenance = sources.flatMap((source) => source.provenanceIds ?? []);
  const relationPaths = sources.flatMap((source) => source.relationPath ? [source.relationPath] : []);
  if (provenance.length) node.setAttribute("data-provenance-ids", [...new Set(provenance)].sort().join(" "));
  if (relationPaths.length) node.setAttribute("data-relation-path", [...new Set(relationPaths)].sort().join(" "));
}

function layoutSlotAttribute(
  node: MinimalElement,
  layoutSlot?: string,
  layoutDensity?: "comfortable" | "dense" | "compact",
): void {
  if (layoutSlot) node.setAttribute("data-layout-slot", layoutSlot);
  if (layoutDensity) node.setAttribute("data-layout-density", layoutDensity);
}

function blockPresentationAttributes(
  node: MinimalElement,
  block: SceneBlock,
  layoutSlot?: string,
  layoutDensity?: "comfortable" | "dense" | "compact",
  compositionPlacement?: RevealCompositionPlacement,
): void {
  layoutSlotAttribute(node, layoutSlot, layoutDensity);
  const component = revealComponentDescriptor(block);
  node.setAttribute("data-component-kind", component.kind);
  if (component.itemCount !== undefined) {
    node.setAttribute("data-component-item-count", String(component.itemCount));
  }
  if (compositionPlacement) {
    node.setAttribute("data-composition-region", compositionPlacement.region);
    node.setAttribute("data-composition-index", String(compositionPlacement.index));
    node.setAttribute("style", `--pcd-composition-index: ${compositionPlacement.index}`);
  }
  const disclosure = block.disclosure;
  if (disclosure?.mode !== "progressive" || disclosure.step === undefined) return;

  node.setAttribute("data-presentation-disclosure-mode", "progressive");
  node.setAttribute("data-presentation-disclosure-step", String(disclosure.step));
  node.setAttribute(
    "data-presentation-disclosure-trigger-resource-id",
    disclosure.triggerResourceId ?? "",
  );
  node.setAttribute("data-presentation-disclosure-visible", "false");
  node.setAttribute("aria-hidden", "true");
}

function chartStaticFallback(block: Extract<SceneBlock, { kind: "chart" }>): string {
  if (block.chartType === "bar") {
    const unit = block.yAxis.unit ? ` ${block.yAxis.unit}` : "";
    return [
      block.label,
      block.description,
      ...block.data.map((datum) => `${datum.category}: ${datum.value}${unit}`),
      ...(block.annotations ?? []).map((annotation) => `Annotation: ${annotation.label}`),
    ].join("\n");
  }

  const xUnit = block.xAxis.unit ? ` ${block.xAxis.unit}` : "";
  const yUnit = block.yAxis.unit ? ` ${block.yAxis.unit}` : "";
  return [
    block.label,
    block.description,
    ...block.series.flatMap((series) => [
      `Series: ${series.label}`,
      ...series.data.map(
        (datum) => `x=${datum.x}${xUnit}, y=${datum.y}${yUnit}`,
      ),
    ]),
    ...(block.annotations ?? []).map(
      (annotation) => `Annotation: ${annotation.label}`,
    ),
  ].join("\n");
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

function appendBlock(
  parent: MinimalElement,
  dom: PitchDomPort,
  block: SceneBlock,
  headingId: string,
  layoutSlot?: string,
  layoutDensity?: "comfortable" | "dense" | "compact",
  compositionPlacement?: RevealCompositionPlacement,
): void {
  if (block.kind === "math") {
    const node = dom.createElement("div");
    node.className = "math-display";
    blockPresentationAttributes(node, block, layoutSlot, layoutDensity, compositionPlacement);
    node.setAttribute("role", "math");
    node.setAttribute("aria-label", block.spokenText);
    node.innerHTML = katex.renderToString(block.expression, {
      displayMode: true,
      output: "htmlAndMathml",
      strict: "warn",
      throwOnError: false,
      trust: false,
    });
    sourceAttributes(node, block.source);
    parent.appendChild(node);
    return;
  }
  if (block.kind === "code") {
    const shell = dom.createElement("div");
    shell.className = "code-block";
    blockPresentationAttributes(shell, block, layoutSlot, layoutDensity, compositionPlacement);
    shell.setAttribute("data-code-block-id", block.id);
    shell.setAttribute("data-language", block.language);
    shell.setAttribute("data-editable", String(block.editable));
    shell.setAttribute("data-executable", String(block.executable));
    sourceAttributes(shell, block.source);
    const pre = dom.createElement("pre");
    pre.className = "code-static-fallback";
    const code = dom.createElement("code");
    code.textContent = block.fallback;
    pre.appendChild(code);
    shell.appendChild(pre);
    parent.appendChild(shell);
    return;
  }
  if (block.kind === "media-reference") {
    const figure = dom.createElement("figure");
    figure.className = "media-reference";
    blockPresentationAttributes(figure, block, layoutSlot, layoutDensity, compositionPlacement);
    figure.setAttribute("data-media-block-id", block.id);
    figure.setAttribute("data-media-uri", block.uri);
    if (block.mediaType) figure.setAttribute("data-media-type", block.mediaType);
    sourceAttributes(figure, block.source);

    if (!block.mediaType || block.mediaType.startsWith("image/")) {
      const image = dom.createElement("img");
      image.setAttribute("src", resolvePublicAssetUrl(block.uri));
      image.setAttribute("alt", block.alternativeText);
      image.setAttribute("decoding", "async");
      image.setAttribute("loading", "eager");
      figure.appendChild(image);
    } else if (block.mediaType.startsWith("video/")) {
      const video = dom.createElement("video");
      video.setAttribute("src", resolvePublicAssetUrl(block.uri));
      video.setAttribute("controls", "");
      video.setAttribute("preload", "metadata");
      video.setAttribute("playsinline", "");
      video.setAttribute("aria-label", block.alternativeText);
      video.setAttribute("data-presentation-video", "true");
      figure.appendChild(video);
    } else {
      const fallback = dom.createElement("span");
      fallback.className = "media-reference-fallback";
      fallback.textContent = block.alternativeText;
      figure.appendChild(fallback);
    }
    parent.appendChild(figure);
    return;
  }
  if (block.kind === "definition-list") {
    const list = dom.createElement("dl");
    list.className = "definition-list";
    blockPresentationAttributes(list, block, layoutSlot, layoutDensity, compositionPlacement);
    sourceAttributes(list, block.source);
    block.entries.forEach((entry, index) => {
      const entryShell = dom.createElement("div");
      entryShell.className = "definition-list-entry";
      entryShell.setAttribute("data-definition-entry-id", entry.id);
      entryShell.setAttribute("data-definition-entry-index", String(index));
      const intrinsicTextWidth = Math.max(
        entry.term.trim().length,
        ...(entry.description ?? "")
          .split(/\r?\n/u)
          .map((line) => line.trim().length),
      );
      const intrinsicCh = Math.max(8, Math.min(34, intrinsicTextWidth));
      entryShell.setAttribute(
        "style",
        `--definition-entry-hue: ${(205 + index * 58) % 360}deg; --pcd-card-content-width: ${intrinsicCh}ch`,
      );
      if (entry.visualMotifRole) entryShell.setAttribute("data-visual-motif-role", entry.visualMotifRole);
      if (entry.visualMotif) entryShell.setAttribute("data-visual-motif", entry.visualMotif);
      sourceAttributes(entryShell, entry.source);

      const term = dom.createElement("dt");
      term.className = "definition-list-term";
      term.textContent = entry.term;
      term.setAttribute("data-definition-entry-id", entry.id);
      sourceAttributes(term, entry.source);
      entryShell.appendChild(term);
      if (entry.visualMotif) {
        const motif = dom.createElement("span");
        motif.className = "definition-list-visual-motif";
        motif.setAttribute("data-visual-motif", entry.visualMotif);
        motif.setAttribute("data-visual-motif-role", entry.visualMotifRole ?? "supporting");
        motif.setAttribute("aria-hidden", "true");
        entryShell.appendChild(motif);
      }
      if (entry.description) {
        const description = dom.createElement("dd");
        description.className = "definition-list-description";
        description.setAttribute("data-definition-entry-id", entry.id);
        sourceAttributes(description, entry.source);

        const authoredPoints = entry.description
          .split(/\r?\n/u)
          .map((point) => point.trim())
          .filter((point) => point.length > 0);

        if (authoredPoints.length > 1) {
          description.setAttribute("data-adaptive-point-spacing", "true");
          const points = dom.createElement("div");
          points.className = "definition-list-points";
          for (const [pointIndex, pointText] of authoredPoints.entries()) {
            if (pointIndex > 0) {
              const spacer = dom.createElement("span");
              spacer.className = "definition-list-point-spacer";
              spacer.setAttribute("aria-hidden", "true");
              points.appendChild(spacer);
            }
            const point = dom.createElement("span");
            point.className = "definition-list-point";
            point.setAttribute("data-definition-point-index", String(pointIndex));
            point.textContent = pointText;
            points.appendChild(point);
          }
          description.appendChild(points);
        } else {
          description.textContent = entry.description;
        }

        entryShell.appendChild(description);
      }
      list.appendChild(entryShell);
    });
    parent.appendChild(list);
    return;
  }
  if (block.kind === "table") {
    const table = dom.createElement("table");
    table.className = "data-table";
    blockPresentationAttributes(table, block, layoutSlot, layoutDensity, compositionPlacement);
    table.setAttribute("data-table-block-id", block.id);
    if (block.description) table.setAttribute("aria-description", block.description);
    sourceAttributes(table, block.source);

    const caption = dom.createElement("caption");
    caption.textContent = block.caption;
    table.appendChild(caption);

    const head = dom.createElement("thead");
    const headRow = dom.createElement("tr");
    for (const column of block.columns) {
      const cell = dom.createElement("th");
      cell.setAttribute("scope", "col");
      cell.setAttribute("data-table-column-id", column.id);
      cell.textContent = column.label;
      sourceAttributes(cell, column.source);
      headRow.appendChild(cell);
    }
    head.appendChild(headRow);
    table.appendChild(head);

    const body = dom.createElement("tbody");
    for (const row of block.rows) {
      const rowElement = dom.createElement("tr");
      rowElement.setAttribute("data-table-row-id", row.id);
      sourceAttributes(rowElement, row.source);
      for (const cellValue of row.cells) {
        const cell = dom.createElement("td");
        cell.setAttribute("data-table-cell-id", cellValue.id);
        cell.textContent = cellValue.text;
        sourceAttributes(cell, cellValue.source);
        rowElement.appendChild(cell);
      }
      body.appendChild(rowElement);
    }
    table.appendChild(body);
    parent.appendChild(table);
    return;
  }
  if (block.kind === "group") {
    const shell = dom.createElement("div");
    shell.className = "scene-group";
    blockPresentationAttributes(shell, block, layoutSlot, layoutDensity, compositionPlacement);
    shell.setAttribute("data-group-block-id", block.id);
    sourceAttributes(shell, block.source);
    for (const childId of block.readingOrder) {
      const child = block.children.find((candidate) => candidate.id === childId);
      if (!child) throw new Error(`Group ${block.id} reading order references unknown block ${childId}`);
      appendBlock(shell, dom, child, headingId, undefined, layoutDensity, undefined);
    }
    parent.appendChild(shell);
    return;
  }
  if (block.kind === "list") {
    const list = dom.createElement(block.listStyle === "ordered" ? "ol" : "ul");
    list.className = "keypoint-list";
    blockPresentationAttributes(list, block, layoutSlot, layoutDensity, compositionPlacement);
    sourceAttributes(list, block.source);
    for (const item of block.items) {
      const listItem = dom.createElement("li");
      const itemText = dom.createElement("span");
      itemText.className = "pcd-list-item-text";
      itemText.textContent = item.text;
      listItem.appendChild(itemText);
      listItem.setAttribute("data-list-item-id", item.id);
      sourceAttributes(listItem, item.source);
      list.appendChild(listItem);
    }
    parent.appendChild(list);
    return;
  }
  if (block.kind === "prompt") {
    const shell = dom.createElement("div");
    shell.className = "live-poll";
    blockPresentationAttributes(shell, block, layoutSlot, layoutDensity, compositionPlacement);
    shell.setAttribute("data-poll-key", block.source[0]?.resourceId ?? block.id);
    const optionIds = block.optionIds ?? [];
    if (optionIds.length) shell.setAttribute("data-poll-option-ids", optionIds.join(" "));
    if (block.correctOptionId) shell.setAttribute("data-correct-option-id", block.correctOptionId);
    sourceAttributes(shell, block.source);

    const prompt = dom.createElement("p");
    prompt.className = "poll-prompt";
    prompt.textContent = block.prompt;
    shell.appendChild(prompt);

    if (block.options?.length) {
      const list = dom.createElement("ul");
      list.className = "poll-options";
      for (const [index, option] of block.options.entries()) {
        const item = dom.createElement("li");
        const optionId = optionIds[index];
        if (optionId) item.setAttribute("data-poll-option-id", optionId);
        if (block.correctOptionId && optionId) {
          const button = dom.createElement("button");
          button.className = "poll-option-button";
          button.setAttribute("type", "button");
          button.setAttribute("data-poll-option-id", optionId);
          button.setAttribute("aria-pressed", "false");
          button.textContent = option;
          item.appendChild(button);
        } else {
          item.textContent = option;
        }
        list.appendChild(item);
      }
      shell.appendChild(list);
    }

    if (block.expectedResult && block.correctOptionId) {
      const feedback = dom.createElement("div");
      feedback.className = "poll-local-feedback";
      feedback.setAttribute("data-poll-local-feedback", "true");
      feedback.setAttribute("aria-live", "polite");
      feedback.setAttribute("hidden", "");
      const status = dom.createElement("strong");
      status.className = "poll-local-feedback-status";
      const explanation = dom.createElement("span");
      explanation.className = "poll-local-feedback-explanation";
      explanation.textContent = block.expectedResult;
      feedback.appendChild(status);
      feedback.appendChild(explanation);
      shell.appendChild(feedback);
    }

    parent.appendChild(shell);
    return;
  }
  if (block.kind === "diagram") {
    const shell = dom.createElement("div");
    shell.className = `d3-diagram-host d3-flow-host${block.diagramType === "sequence" ? " d3-sequence-host" : ""}`;
    blockPresentationAttributes(shell, block, layoutSlot, layoutDensity, compositionPlacement);
    shell.setAttribute("data-diagram-block-id", block.id);
    shell.setAttribute("data-flow-block-id", block.id);
    shell.setAttribute("data-diagram-type", block.diagramType);
    shell.setAttribute("role", "group");
    shell.setAttribute("aria-label", block.label);
    sourceAttributes(shell, block.source);
    const fallback = dom.createElement("pre");
    fallback.className = "d3-flow-static-fallback";
    fallback.textContent = diagramStaticFallback(block);
    shell.appendChild(fallback);
    const live = dom.createElement("span");
    live.className = "pcd-diagram-live-region";
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    live.textContent = block.label;
    shell.appendChild(live);
    parent.appendChild(shell);
    return;
  }
  if (block.kind === "chart") {
    const shell = dom.createElement("div");
    shell.className = "d3-chart-host retro-neon-chart-window";
    blockPresentationAttributes(shell, block, layoutSlot, layoutDensity, compositionPlacement);
    shell.setAttribute("data-chart-block-id", block.id);
    shell.setAttribute("data-chart-type", block.chartType);
    if (block.liveUpdate) shell.setAttribute("data-live-chart", "true");
    const stageResourceIds = [
      ...block.source.map((source) => source.resourceId),
      ...(block.annotations ?? []).flatMap((annotation) =>
        annotation.source.map((source) => source.resourceId)
      ),
    ];
    shell.setAttribute(
      "data-presentation-step-resource-id",
      [...new Set(stageResourceIds)].join(" "),
    );
    shell.setAttribute("role", "group");
    shell.setAttribute("aria-label", block.label);
    sourceAttributes(shell, block.source);
    const header = dom.createElement("div"); header.className = "retro-neon-chart-header"; header.textContent = block.label; shell.appendChild(header);
    const subtitle = dom.createElement("p"); subtitle.className = "retro-neon-chart-subtitle"; subtitle.textContent = block.description; shell.appendChild(subtitle);
    const fallback = dom.createElement("pre"); fallback.className = "d3-chart-static-fallback"; fallback.textContent = chartStaticFallback(block); shell.appendChild(fallback);
    parent.appendChild(shell);
    return;
  }
  if (block.kind !== "prose") throw new Error(`Unsupported pitch scene block kind: ${block.kind}`);
  const tag = block.intent?.kind === "introduce" ? "h2" : block.intent?.kind === "explain" ? "blockquote" : "cite";
  const node = dom.createElement(tag);
  blockPresentationAttributes(node, block, layoutSlot, layoutDensity, compositionPlacement);
  if (tag === "h2") node.setAttribute("id", headingId);
  node.textContent = block.text;
  node.className = tag === "blockquote" ? "lead" : tag === "cite" ? "citation" : "";
  sourceAttributes(node, block.source);
  parent.appendChild(node);
}

export function mountSceneDocuments(dom: PitchDomPort, documents: readonly SceneDocument[]): () => void {
  if (!documents.length) throw new Error("Pitch requires at least one compiled SceneDocument");
  for (const document of documents) validateSceneDocument(document);
  dom.root.innerHTML = "";
  for (const document of documents) for (const scene of document.scenes) {
    const heading = scene.blocks.find((block) => block.kind === "prose" && block.intent?.kind === "introduce");
    if (!heading) throw new Error(`Scene ${scene.id} has no graph-backed heading`);
    const inferredLayout = inferRevealLayoutDecision(scene);
    const inferredFit = inferRevealLayoutFit(scene, inferredLayout);
    const composition = inferRevealCompositionPlan(scene);
    const compositionByBlockId = new Map(
      composition.placements.map((placement) => [placement.blockId, placement]),
    );
    const lectureBudget = evaluateLectureContentBudget(scene);
    const semanticGraphCompanion = inferredLayout?.family === "semantic-source";
    const section = dom.createElement("section");
    const headingId = `${scene.id}-title`;
    section.setAttribute("id", scene.id);
    section.setAttribute("data-scene-document-id", document.id);
    section.setAttribute("data-source-path-id", document.sourcePathId);
    section.setAttribute(
      "data-layout",
      inferredLayout?.family ?? (layoutByScene[scene.id] ?? "statement"),
    );
    section.setAttribute("data-composition", composition.kind);
    section.setAttribute("data-composition-main-count", String(composition.mainCount));
    if (composition.mainProfile) section.setAttribute("data-composition-main-profile", composition.mainProfile);
    if (composition.evidenceProfile) section.setAttribute("data-composition-evidence-profile", composition.evidenceProfile);
    section.setAttribute("style", `--pcd-composition-main-count: ${composition.mainCount}`);
    section.setAttribute("data-lecture-budget", lectureBudget.status);
    section.setAttribute("data-lecture-budget-score", lectureBudget.score.toFixed(1));
    section.setAttribute("data-lecture-primary-regions", String(lectureBudget.primaryRegions));
    if (inferredFit) {
      section.setAttribute("data-layout-variant", inferredFit.variant);
      section.setAttribute("data-layout-density", inferredFit.density);
    }
    section.setAttribute("aria-labelledby", headingId);
    sourceAttributes(section, scene.source);

    const compositionRegions = new Map<string, MinimalElement>();
    const compositionParent = (placement: RevealCompositionPlacement | undefined): MinimalElement => {
      if (
        !placement
        || placement.region === "heading"
        || (composition.kind === "worked-evidence" && placement.region === "support")
        || ![
          "main-aside-note",
          "card-deck",
          "evidence-split",
          "evidence-story",
          "worked-evidence",
        ].includes(composition.kind)
      ) {
        return section;
      }
      const existing = compositionRegions.get(placement.region);
      if (existing) return existing;
      const region = dom.createElement("div");
      region.className = "pcd-composition-region";
      region.setAttribute("data-composition-region-container", placement.region);
      compositionRegions.set(placement.region, region);
      section.appendChild(region);
      return region;
    };

    for (const [blockIndex, blockId] of scene.readingOrder.entries()) {
      const block = scene.blocks.find((candidate) => candidate.id === blockId);
      if (!block) throw new Error(`Scene ${scene.id} reading order references unknown block ${blockId}`);
      const compositionPlacement = compositionByBlockId.get(block.id);
      appendBlock(
        compositionParent(compositionPlacement),
        dom,
        block,
        headingId,
        inferredLayout?.slots[blockIndex],
        inferredFit?.density,
        compositionPlacement,
      );
    }
    if (semanticGraphCompanion) {
      const graphHost = dom.createElement("div");
      graphHost.className = "d3-scene-knowledge-host";
      graphHost.setAttribute("data-knowledge-scene-id", scene.id);
      graphHost.setAttribute("role", "group");
      graphHost.setAttribute("aria-label", "Semantic knowledge graph for this scene");
      sourceAttributes(graphHost, scene.source);
      section.appendChild(graphHost);
    }
    dom.root.appendChild(section);
  }
  let destroyed = false;
  return () => { if (!destroyed) { destroyed = true; dom.root.innerHTML = ""; } };
}

export function isAllowedLocalRuntimeRequest(input: unknown, baseHref: string): boolean {
  try {
    const raw = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : typeof Request !== "undefined" && input instanceof Request
          ? input.url
          : "";
    if (!raw) return false;
    const base = new URL(baseHref);
    const resolved = new URL(raw, base);
    return resolved.origin === base.origin && resolved.pathname.startsWith("/vendor/");
  } catch {
    return false;
  }
}

export function installNoNetworkGuard(
  target: { fetch?: typeof fetch; XMLHttpRequest?: unknown; WebSocket?: unknown },
  baseHref = typeof window !== "undefined" ? window.location.href : "",
): () => void {
  const originalFetch = target.fetch;
  const originalXhr = target.XMLHttpRequest;
  const originalSocket = target.WebSocket;
  const deny = () => { throw new Error("External runtime network requests are prohibited in the pitch preview"); };

  target.fetch = ((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    if (originalFetch && baseHref && isAllowedLocalRuntimeRequest(input, baseHref)) {
      return originalFetch(input, init);
    }
    return deny();
  }) as typeof fetch;
  // XMLHttpRequest and WebSocket remain fully blocked. The pinned CodeMirror/webR
  // runtime uses same-origin module/worker/fetch assets under /vendor/.
  target.XMLHttpRequest = deny;
  target.WebSocket = deny;
  return () => {
    target.fetch = originalFetch;
    target.XMLHttpRequest = originalXhr;
    target.WebSocket = originalSocket;
  };
}
