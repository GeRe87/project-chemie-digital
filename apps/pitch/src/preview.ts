import katex from "katex";
import { validateSceneDocument, type SceneDocument, type SceneBlock, type SourceReference } from "../../../packages/core/src/scene-document.ts";

export type PitchLayout = "opening" | "statement" | "process" | "split-proof";
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

function chartStaticFallback(block: Extract<SceneBlock, { kind: "chart" }>): string {
  if (block.chartType === "bar") {
    const unit = block.yAxis.unit ? ` ${block.yAxis.unit}` : "";
    return [
      block.label,
      block.description,
      ...block.data.map((datum) => `${datum.category}: ${datum.value}${unit}`),
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

function appendBlock(parent: MinimalElement, dom: PitchDomPort, block: SceneBlock, headingId: string): void {
  if (block.kind === "math") {
    const node = dom.createElement("div");
    node.className = "math-display";
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
  if (block.kind === "list") {
    const list = dom.createElement(block.listStyle === "ordered" ? "ol" : "ul");
    list.className = "keypoint-list";
    sourceAttributes(list, block.source);
    for (const item of block.items) {
      const listItem = dom.createElement("li");
      listItem.textContent = item.text;
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
    shell.setAttribute("data-poll-key", block.source[0]?.resourceId ?? block.id);
    const optionIds = block.source.slice(1).map((source) => source.resourceId);
    if (optionIds.length) shell.setAttribute("data-poll-option-ids", optionIds.join(" "));
    sourceAttributes(shell, block.source);
    const prompt = dom.createElement("p");
    prompt.className = "poll-prompt";
    prompt.textContent = block.prompt;
    shell.appendChild(prompt);
    if (block.options?.length) {
      const list = dom.createElement("ul");
      list.className = "poll-options";
      for (const option of block.options) {
        const item = dom.createElement("li");
        item.textContent = option;
        list.appendChild(item);
      }
      shell.appendChild(list);
    }
    parent.appendChild(shell);
    return;
  }
  if (block.kind === "diagram") {
    const shell = dom.createElement("div");
    shell.className = "d3-flow-host";
    shell.setAttribute("data-flow-block-id", block.id);
    shell.setAttribute("data-diagram-type", block.diagramType);
    shell.setAttribute("role", "group");
    shell.setAttribute("aria-label", block.label);
    sourceAttributes(shell, block.source);
    const fallback = dom.createElement("pre");
    fallback.className = "d3-flow-static-fallback";
    fallback.textContent = diagramStaticFallback(block);
    shell.appendChild(fallback);
    parent.appendChild(shell);
    return;
  }
  if (block.kind === "chart") {
    const shell = dom.createElement("div");
    shell.className = "d3-chart-host retro-neon-chart-window";
    shell.setAttribute("data-chart-block-id", block.id);
    shell.setAttribute("data-chart-type", block.chartType);
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
    const section = dom.createElement("section");
    const headingId = `${scene.id}-title`;
    section.setAttribute("id", scene.id);
    section.setAttribute("data-scene-document-id", document.id);
    section.setAttribute("data-source-path-id", document.sourcePathId);
    section.setAttribute("data-layout", layoutByScene[scene.id] ?? "statement");
    section.setAttribute("aria-labelledby", headingId);
    sourceAttributes(section, scene.source);
    for (const blockId of scene.readingOrder) {
      const block = scene.blocks.find((candidate) => candidate.id === blockId);
      if (!block) throw new Error(`Scene ${scene.id} reading order references unknown block ${blockId}`);
      appendBlock(section, dom, block, headingId);
    }
    dom.root.appendChild(section);
  }
  let destroyed = false;
  return () => { if (!destroyed) { destroyed = true; dom.root.innerHTML = ""; } };
}
export function installNoNetworkGuard(target: { fetch?: typeof fetch; XMLHttpRequest?: unknown; WebSocket?: unknown }): () => void {
  const originalFetch = target.fetch; const originalXhr = target.XMLHttpRequest; const originalSocket = target.WebSocket;
  const deny = () => { throw new Error("Runtime network requests are prohibited in the pitch preview"); };
  target.fetch = deny as typeof fetch; target.XMLHttpRequest = deny; target.WebSocket = deny;
  return () => { target.fetch = originalFetch; target.XMLHttpRequest = originalXhr; target.WebSocket = originalSocket; };
}
