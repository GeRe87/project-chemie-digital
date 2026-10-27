import katex from "katex";
import { trigMarkup } from "./trig-markup.ts";
import { renderScientificTitle } from "../../../packages/renderer-reveal/src/scientific-title.ts";
import { boxPlotStaticFallback } from "../../../packages/core/src/box-plot.ts";
import { histogramStaticFallback } from "../../../packages/core/src/histogram.ts";
import { regressionStaticFallback } from "../../../packages/core/src/regression-chart.ts";
import { observationExplorerFallback } from "../../../packages/core/src/observation-explorer.ts";
import { teachingTextMarkup, teachingInlineMarkup, teachingListItemMarkup, symbolLegendMarkup } from "./teaching-text.ts";
import { renderMathematicalDerivation, renderDerivationDetailButtons } from "../../../packages/renderer-reveal/src/mathematical-derivation.ts";
import { resolvePublicAssetUrl } from "./public-asset-url.ts";
import { timelineStaticFallback, dotPlotStaticFallback, validateSceneDocument, type SceneDocument, type SceneBlock, type SourceReference } from "../../../packages/core/src/scene-document.ts";
import { inferRevealCompositionFit } from "../../../packages/renderer-reveal/src/composition-fit.ts";
import {
  inferRevealCompositionPlan,
  resolveDefinitionFormulaPairs,
  resolveFormulaLegendUnits,
  resolveCodeFunctionLegendUnits,
  revealComponentDescriptor,
  shouldWrapRevealCompositionPlacement,
  type RevealCompositionPlacement,
} from "../../../packages/renderer-reveal/src/composition-policy.ts";
import { evaluateLectureContentBudget } from "../../../packages/renderer-reveal/src/lecture-readability.ts";

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

function blockPresentationAttributes(
  node: MinimalElement,
  block: SceneBlock,
  compositionDensity?: "comfortable" | "dense" | "compact",
  compositionPlacement?: RevealCompositionPlacement,
): void {
  if (compositionDensity) node.setAttribute("data-composition-density", compositionDensity);
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
  if (block.chartType === "regression") return regressionStaticFallback(block);
  if (block.chartType === "timeline") return timelineStaticFallback(block);
  if(block.chartType==="histogram"||block.chartType==="histogram2d")return histogramStaticFallback(block);
  if (block.chartType === "box") return boxPlotStaticFallback(block);
  if (block.chartType === "observations") return observationExplorerFallback(block);
  if (block.chartType === "dot") return dotPlotStaticFallback(block);
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
    ...block.nodes.flatMap((node) => [
      `- ${node.label}${node.notation ? ` (${node.notation})` : ""}`,
      ...(node.parts ?? []).map((part) => `  - ${part.label}${part.description ? `: ${part.description}` : ""}`),
    ]),
    "Relations:",
    ...block.edges.filter(edge => edge.codeDetail).map(edge => `${edge.codeDetail!.label}\n${edge.codeDetail!.description}\n${edge.codeDetail!.code}`),
    ...block.edges.map((edge) => `- ${labels.get(edge.sourceNodeId) ?? edge.sourceNodeId}: ${edge.label} → ${labels.get(edge.targetNodeId) ?? edge.targetNodeId}`),
  ].join("\n");
}

function appendBlock(
  parent: MinimalElement,
  dom: PitchDomPort,
  block: SceneBlock,
  headingId: string,
  compositionDensity?: "comfortable" | "dense" | "compact",
  compositionPlacement?: RevealCompositionPlacement,
  definitionCollection?: MinimalElement,
  entryFormula?: Extract<SceneBlock, { kind: "math" }>,
  entryIndexOffset = 0,
): MinimalElement | void {
  if (block.kind === "math") {
    const node = dom.createElement("div");
    if (block.derivation) {
      node.className = "mathematical-derivation";
      blockPresentationAttributes(node, block, compositionDensity, compositionPlacement);
      node.setAttribute("data-derivation-block-id", block.id);
      node.setAttribute("role", "group");
      node.setAttribute("aria-label", block.derivation.label);
      node.setAttribute("data-derivation-id", block.derivation.derivationId);
      node.setAttribute("data-presentation-step-count", String(block.derivation.steps.length * 2));
      node.setAttribute("data-presentation-step-resource-id", block.derivation.id);
      node.innerHTML = renderMathematicalDerivation(block.derivation, expression => katex.renderToString(expression, {
        displayMode: true, output: "htmlAndMathml", strict: "warn", throwOnError: false, trust: false,
      }));
      node.innerHTML += renderDerivationDetailButtons(block.derivationDetails);
      sourceAttributes(node, block.source);
      parent.appendChild(node);
      return node;
    }
    node.className = "math-display";
    blockPresentationAttributes(node, block, compositionDensity, compositionPlacement);
    node.setAttribute("role", block.derivationDetails?.length ? "group" : "math");
    node.setAttribute("aria-label", block.spokenText);
    node.innerHTML = katex.renderToString(block.expression, {
      displayMode: true,
      output: "htmlAndMathml",
      strict: "warn",
      throwOnError: false,
      trust: false,
    });
    if (block.label) node.innerHTML = `<div class="math-expression-label">${teachingTextMarkup(block.label)}</div>` + node.innerHTML;
    node.innerHTML += renderDerivationDetailButtons(block.derivationDetails);
    sourceAttributes(node, block.source);
    parent.appendChild(node);
    return;
  }
  if (block.kind === "code") {
    const shell = dom.createElement("div");
    shell.className = "code-block";
    blockPresentationAttributes(shell, block, compositionDensity, compositionPlacement);
    shell.setAttribute("data-code-block-id", block.id);
    shell.setAttribute("data-language", block.language);
    shell.setAttribute("data-editable", String(block.editable));
    shell.setAttribute("data-executable", String(block.executable));
    sourceAttributes(shell, block.source);
    const pre = dom.createElement("pre");
    pre.className = "code-static-fallback";
    if (!block.executable) pre.setAttribute("tabindex", "0");
    const code = dom.createElement("code");
    code.textContent = block.fallback;
    if (block.language === "trig") code.innerHTML = trigMarkup(block.fallback);
    pre.appendChild(code);
    shell.appendChild(pre);
    parent.appendChild(shell);
    return;
  }
  if (block.kind === "media-reference") {
    const figure = dom.createElement("figure");
    figure.className = "media-reference";
    blockPresentationAttributes(figure, block, compositionDensity, compositionPlacement);
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
      if (!block.crop) video.setAttribute("controls", "");
      video.setAttribute("preload", "metadata");
      video.setAttribute("playsinline", "");
      video.setAttribute("aria-label", block.alternativeText);
      video.setAttribute("data-presentation-video", "true");
      if (block.crop) {
        const crop = block.crop, viewport = dom.createElement("div"); viewport.className = "pcd-cropped-video";
        viewport.setAttribute("style", `aspect-ratio:${16 * crop.width}/${9 * crop.height}`);
        viewport.setAttribute("data-crop-width", String(crop.width)); viewport.setAttribute("data-crop-height", String(crop.height));
        video.setAttribute("style", `position:absolute;width:${100 / crop.width}%;height:${100 / crop.height}%;max-width:none;max-height:none;left:${-100 * crop.x / crop.width}%;top:${-100 * crop.y / crop.height}%;object-fit:fill`);
        viewport.appendChild(video);
        for (const region of block.redactions ?? []) {
          const mask = dom.createElement("div"); mask.className = "pcd-video-redaction";
          mask.setAttribute("data-redaction-start", String(region.start)); mask.setAttribute("data-redaction-end", String(region.end));
          mask.setAttribute("style", `left:${region.x * 100}%;top:${region.y * 100}%;width:${region.width * 100}%;height:${region.height * 100}%`);
          mask.textContent = region.label; viewport.appendChild(mask);
        }
        figure.appendChild(viewport);
        const control = dom.createElement("button"); control.className = "pcd-video-toggle"; control.setAttribute("type", "button");
        control.setAttribute("data-video-toggle", "true"); control.textContent = "Play / pause video"; figure.appendChild(control);
      } else figure.appendChild(video);
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
    const list = definitionCollection ?? dom.createElement("dl");
    if (block.entries.every(entry => entry.symbol)) list.setAttribute("data-symbol-legend", "true");
    if (!definitionCollection) {
      list.className = "definition-list";
      blockPresentationAttributes(list, block, compositionDensity, compositionPlacement);
      sourceAttributes(list, block.source);
    }
    block.entries.forEach((entry, localIndex) => {
      const index = localIndex + entryIndexOffset;
      const entryShell = dom.createElement("div");
      entryShell.className = "definition-list-entry";
      entryShell.setAttribute("data-definition-entry-id", entry.id);
      entryShell.setAttribute("data-definition-entry-index", String(index));
      entryShell.setAttribute("data-source-block-id", block.id);
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
      if (entry.symbol) term.innerHTML = katex.renderToString(entry.expression ?? entry.term, { displayMode: false, output: "htmlAndMathml", throwOnError: false, trust: false }) + ":";
      else if (/^[^\s]+(?:[, ]+(?:and )?[^\s]+)*$/u.test(entry.term)&&/[₀-₉ₐ-ₜᵢ-ᵥⱼΣ√\p{M}]|^[a-zA-Z]$/u.test(entry.term))term.innerHTML=symbolLegendMarkup(entry.term);
      else term.textContent = entry.term;
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

        if (/\n\s*\n/u.test(entry.description) && /^-\s+/mu.test(entry.description)) {
          // Explicit paragraph/list authoring uses the same safe rich-text
          // subset as prose cards. Legacy line-wise point spacing stays intact.
          description.innerHTML = teachingTextMarkup(entry.description);
        } else if (authoredPoints.length > 1) {
          description.setAttribute("data-adaptive-point-spacing", "true");
          const points = dom.createElement("div");
          points.className = "definition-list-points";
          for (const [pointIndex, pointText] of authoredPoints.entries()) {
            // A leading "|> " marks a subordinate example, not a peer point.
            // Render a decorative Font Awesome arrow in its place while
            // leaving the marker in the semantic source for portability.
            const isIndentedPoint = pointText.startsWith("|> ");
            if (pointIndex > 0) {
              const spacer = dom.createElement("span");
              spacer.className = "definition-list-point-spacer";
              spacer.setAttribute("aria-hidden", "true");
              if (isIndentedPoint) spacer.setAttribute("data-followed-by-indented-point", "true");
              points.appendChild(spacer);
            }
            const point = dom.createElement("span");
            point.className = "definition-list-point";
            point.setAttribute("data-definition-point-index", String(pointIndex));
            if (isIndentedPoint) point.setAttribute("data-definition-point-level", "1");
            point.innerHTML = teachingInlineMarkup(isIndentedPoint ? pointText.slice(3) : pointText);
            points.appendChild(point);
          }
          description.appendChild(points);
        } else {
          description.innerHTML = teachingInlineMarkup(entry.description,true);
        }

        entryShell.appendChild(description);
      }
      if (entryFormula) {
        const definition = dom.createElement("dd");
        appendBlock(definition, dom, entryFormula, headingId, compositionDensity);
        entryShell.appendChild(definition);
      }
      list.appendChild(entryShell);
    });
    if (!definitionCollection) parent.appendChild(list);
    return list;
  }
  if (block.kind === "table") {
    const table = dom.createElement("table");
    table.className = "data-table";
    blockPresentationAttributes(table, block, compositionDensity, compositionPlacement);
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
    blockPresentationAttributes(shell, block, compositionDensity, compositionPlacement);
    shell.setAttribute("data-group-block-id", block.id);
    sourceAttributes(shell, block.source);
    for (const childId of block.readingOrder) {
      const child = block.children.find((candidate) => candidate.id === childId);
      if (!child) throw new Error(`Group ${block.id} reading order references unknown block ${childId}`);
      appendBlock(shell, dom, child, headingId, compositionDensity, undefined);
    }
    parent.appendChild(shell);
    return;
  }
  if (block.kind === "list") {
    const list = dom.createElement(block.listStyle === "ordered" ? "ol" : "ul");
    list.className = "keypoint-list";
    if (block.listStyle === "unordered") list.setAttribute("data-marker-purpose", "neutral");
    blockPresentationAttributes(list, block, compositionDensity, compositionPlacement);
    sourceAttributes(list, block.source);
    for (const item of block.items) {
      const listItem = dom.createElement("li");
      const itemText = dom.createElement("div");
      itemText.className = "pcd-list-item-text";
      if (/\*\*|==|\n\s{2,}-/u.test(item.text)) itemText.innerHTML = teachingListItemMarkup(item.text);
      else itemText.textContent = item.text;
      listItem.appendChild(itemText);
      if (block.listStyle === "unordered") {
        const marker = dom.createElement("span");
        marker.className = "teaching-point-marker";
        marker.setAttribute("aria-hidden", "true");
        listItem.appendChild(marker);
      }
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
    blockPresentationAttributes(shell, block, compositionDensity, compositionPlacement);
    shell.setAttribute("data-poll-key", block.source[0]?.resourceId ?? block.id);
    const optionIds = block.optionIds ?? [];
    if (optionIds.length) shell.setAttribute("data-poll-option-ids", optionIds.join(" "));
    if (block.correctOptionId) shell.setAttribute("data-correct-option-id", block.correctOptionId);
    sourceAttributes(shell, block.source);

    const prompt = dom.createElement("div");
    prompt.className = "poll-prompt";
    if (/\*\*|\n|^-\s+/u.test(block.prompt)) prompt.innerHTML = teachingTextMarkup(block.prompt);
    else prompt.textContent = block.prompt;
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
    if (block.presentation === "dialog") shell.className = "pcd-diagram-dialog-launcher";
    blockPresentationAttributes(shell, block, compositionDensity, compositionPlacement);
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
    const staticDistribution=block.chartType === "observations" && (block.view === "moments" || block.view === "summary"
      && block.comparison?.stages.length === 1 && block.comparison.stages[0]?.mode === "distribution");
    const shell = dom.createElement("div");
    shell.className = block.chartType === "observations" && !staticDistribution ? "d3-chart-host observation-chart-host" : "d3-chart-host retro-neon-chart-window";
    blockPresentationAttributes(shell, block, compositionDensity, compositionPlacement);
    shell.setAttribute("data-chart-block-id", block.id);
    shell.setAttribute("data-chart-type", block.chartType);
    if (staticDistribution || block.chartType === "box" || block.chartType === "histogram" || block.chartType === "histogram2d") shell.setAttribute("data-chart-renderer", "dot");
    if (block.chartType === "observations" && !staticDistribution && block.interactive!==false) {
      shell.setAttribute("data-presentation-interactive", "true");
      shell.setAttribute("tabindex", "0");
    }
    if (block.liveUpdate) shell.setAttribute("data-live-chart", "true");
    const stageResourceIds = [
      ...block.source.map((source) => source.resourceId),
      ...("annotations" in block ? block.annotations ?? [] : []).flatMap((annotation) =>
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
  blockPresentationAttributes(node, block, compositionDensity, compositionPlacement);
  if (tag === "h2") node.setAttribute("id", headingId);
  if (tag !== "h2" && block.format === "markdown") node.innerHTML = teachingTextMarkup(block.text);
  else node.textContent = block.text;
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
    if (scene.presentationTitle) {
      const section = dom.createElement("section");
      section.setAttribute("id", scene.id);
      section.setAttribute("data-scene-document-id", document.id);
      section.setAttribute("data-source-path-id", document.sourcePathId);
      section.setAttribute("data-scientific-title", "true");
      section.setAttribute("aria-label", scene.presentationTitle.title);
      sourceAttributes(section, scene.source);
      section.innerHTML = renderScientificTitle(scene.presentationTitle, resolvePublicAssetUrl);
      dom.root.appendChild(section);
      continue;
    }
    const composition = inferRevealCompositionPlan(scene);
    const compositionFit = inferRevealCompositionFit(scene, composition);
    const compositionByBlockId = new Map(
      composition.placements.map((placement) => [placement.blockId, placement]),
    );
    const lectureBudget = evaluateLectureContentBudget(scene);
    const semanticGraphCompanion =
      composition.kind === "semantic-stage"
      && composition.profile === "source";
    const section = dom.createElement("section");
    const headingId = `${scene.id}-title`;
    section.setAttribute("id", scene.id);
    section.setAttribute("data-scene-document-id", document.id);
    section.setAttribute("data-source-path-id", document.sourcePathId);
    section.setAttribute("data-composition", composition.kind);
    section.setAttribute("data-composition-main-count", String(composition.mainCount));
    if (composition.profile) section.setAttribute("data-composition-profile", composition.profile);
    section.setAttribute("style", `--pcd-composition-main-count: ${composition.mainCount}`);
    section.setAttribute("data-lecture-budget", lectureBudget.status);
    section.setAttribute("data-lecture-budget-score", lectureBudget.score.toFixed(1));
    section.setAttribute("data-lecture-primary-regions", String(lectureBudget.primaryRegions));
    section.setAttribute("data-composition-variant", compositionFit.variant);
    section.setAttribute("data-composition-density", compositionFit.density);
    section.setAttribute("aria-labelledby", headingId);
    sourceAttributes(section, scene.source);

    const compositionRegions = new Map<string, MinimalElement>();
    const definitionPairs = resolveDefinitionFormulaPairs(scene);
    const formulaUnits = resolveFormulaLegendUnits(scene);
    const formulaUnitByStart = new Map(formulaUnits.map(unit => [unit[0]!.id, unit]));
    const formulaUnitChildren = new Set(formulaUnits.flatMap(unit => unit.slice(1).map(block => block.id)));
    const codeFunctionUnits = resolveCodeFunctionLegendUnits(scene);
    const codeFunctionByStart = new Map(codeFunctionUnits.map(unit => [unit.code.id, unit]));
    const codeFunctionLegendIds = new Set(codeFunctionUnits.map(unit => unit.legend.id));
    const formulaByCard = new Map(definitionPairs?.map(pair => [pair.card.id, pair.formula]));
    const embeddedFormulaIds = new Set(definitionPairs?.map(pair => pair.formula.id));
    let definitionCollection: MinimalElement | undefined;
    const compositionParent = (placement: RevealCompositionPlacement | undefined): MinimalElement => {
      if (!placement || !shouldWrapRevealCompositionPlacement(composition, placement)) {
        return section;
      }
      let region = compositionRegions.get(placement.region);
      if (!region) {
        region = dom.createElement("div");
        region.className = "pcd-composition-region";
        region.setAttribute("data-composition-region-container", placement.region);
        compositionRegions.set(placement.region, region);
        section.appendChild(region);
      }
      return region;
    };
    const placementParent = (placement: RevealCompositionPlacement | undefined, block: SceneBlock): MinimalElement => {
      const region = compositionParent(placement);
      if (composition.profile !== "evidence-practice-grid" || placement?.region !== "main") return region;
      const cell = dom.createElement("div");
      cell.className = "evidence-practice-grid-cell";
      cell.setAttribute("data-grid-cell-index", String(placement.index));
      sourceAttributes(cell, block.source);
      region.appendChild(cell);
      return cell;
    };

    for (const blockId of scene.readingOrder) {
      const block = scene.blocks.find((candidate) => candidate.id === blockId);
      if (!block) throw new Error(`Scene ${scene.id} reading order references unknown block ${blockId}`);
      if (embeddedFormulaIds.has(blockId)) continue;
      if (formulaUnitChildren.has(blockId)) continue;
      if (codeFunctionLegendIds.has(blockId)) continue;
      const compositionPlacement = compositionByBlockId.get(block.id);
      const formulaUnit = formulaUnitByStart.get(blockId);
      if (formulaUnit) {
        const unit = dom.createElement("div");
        unit.className = "formula-with-legend";
        placementParent(compositionPlacement, block).appendChild(unit);
        for (const child of formulaUnit) appendBlock(unit, dom, child, headingId, compositionFit.density,
          compositionByBlockId.get(child.id));
        continue;
      }
      const codeFunctionUnit = codeFunctionByStart.get(blockId);
      if (codeFunctionUnit) {
        const workbench = dom.createElement("div");
        workbench.className = "code-function-workbench";
        workbench.setAttribute("data-code-workbench", "true");
        workbench.setAttribute("role", "group");
        workbench.setAttribute("aria-label", "R editor, output and function glossary");
        if (compositionPlacement) {
          workbench.setAttribute("data-composition-region", compositionPlacement.region);
          workbench.setAttribute("data-composition-index", String(compositionPlacement.index));
        }
        sourceAttributes(workbench, [...codeFunctionUnit.code.source, ...codeFunctionUnit.legend.source]);
        placementParent(compositionPlacement, codeFunctionUnit.code).appendChild(workbench);
        appendBlock(workbench, dom, codeFunctionUnit.code, headingId, compositionFit.density);
        const functionGlossary = appendBlock(workbench, dom, codeFunctionUnit.legend, headingId, compositionFit.density);
        functionGlossary?.setAttribute("tabindex", "0");
        functionGlossary?.setAttribute("data-presentation-interactive", "true");
        functionGlossary?.setAttribute("aria-label", "Scrollable R function glossary");
        continue;
      }
      const formula = formulaByCard.get(blockId);
      const rendered = appendBlock(
        placementParent(compositionPlacement, block),
        dom,
        block,
        headingId,
        compositionFit.density,
        compositionPlacement,
        formula ? definitionCollection : undefined,
        formula,
        formula ? definitionPairs!.findIndex(pair => pair.card.id === blockId) : 0,
      );
      if (formula && rendered) {
        definitionCollection = rendered;
        sourceAttributes(rendered, definitionPairs!.flatMap(pair => pair.card.source));
        rendered.setAttribute("data-component-item-count", String(definitionPairs!.length));
        rendered.setAttribute("data-source-block-ids", definitionPairs!.map(pair => pair.card.id).join(" "));
      }
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
    const vendorPrefix = new URL("vendor/", base).pathname;
    return resolved.origin === base.origin && resolved.pathname.startsWith(vendorPrefix);
  } catch {
    return false;
  }
}

export function installNoNetworkGuard(
  target: { fetch?: typeof fetch; XMLHttpRequest?: unknown; WebSocket?: unknown },
  baseHref = typeof window !== "undefined" ? window.location.href : "",
  localSvgUris: readonly string[] = [],
): () => void {
  const originalFetch = target.fetch;
  const originalXhr = target.XMLHttpRequest;
  const originalSocket = target.WebSocket;
  const deny = () => { throw new Error("External runtime network requests are prohibited in the pitch preview"); };
  const svgUrls = new Set(localSvgUris.flatMap(uri => {
    try {
      const url = new URL(resolvePublicAssetUrl(uri), baseHref);
      return url.origin === new URL(baseHref).origin && url.pathname.endsWith(".svg") ? [url.href] : [];
    } catch { return []; }
  }));

  target.fetch = ((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    let rawUrl = "";
    try { rawUrl = typeof input === "string" ? new URL(input, baseHref).href : input instanceof URL ? input.href : ""; } catch { /* Denied below. */ }
    const isAuthoredSvgRead = svgUrls.has(rawUrl) && (!init?.method || init.method === "GET");
    if (originalFetch && baseHref && (isAllowedLocalRuntimeRequest(input, baseHref) || isAuthoredSvgRead)) {
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
