import katex from "katex";
import { validateSceneDocument, type DiagramBlock, type Scene, type SceneDocument, type SceneBlock, type SourceReference } from "../../../packages/core/src/scene-document.ts";
import { createD3FlowRenderModel, mountD3FlowDiagram } from "../../../packages/renderer-d3/src/index.ts";

export type PitchLayout = "opening" | "statement" | "process" | "split-proof";
const legacyLayoutByScene: Readonly<Record<string, PitchLayout>> = Object.freeze({
  "ex:scene-sd-definition--scene": "opening",
  "ex:scene-sd-process--scene": "process",
  "ex:scene-formula-symbols--scene": "split-proof",
  "ex:scene-chemistry-example--scene": "split-proof",
});

function sceneBlocksInReadingOrder(scene: Scene): readonly SceneBlock[] {
  const blocksById = new Map(scene.blocks.map((block) => [block.id, block]));
  return scene.readingOrder.map((blockId) => blocksById.get(blockId)).filter((block): block is SceneBlock => block !== undefined);
}

function isOpeningScene(blocks: readonly SceneBlock[]): boolean {
  const [heading, ...supportingBlocks] = blocks;
  return heading?.kind === "prose"
    && heading.intent?.kind === "introduce"
    && supportingBlocks.length > 0
    && supportingBlocks.every((block) => block.kind === "prose" && block.emphasis === "supporting" && block.intent?.kind === "emphasize");
}

export function inferPitchLayout(scene: Scene): PitchLayout {
  const blocks = sceneBlocksInReadingOrder(scene);
  if (isOpeningScene(blocks)) return "opening";
  if (blocks.some((block) => block.kind === "diagram")) return "process";
  if (blocks.some((block) => block.kind === "math")) return "split-proof";
  return legacyLayoutByScene[scene.id] ?? "statement";
}

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

function diagramFallback(block: DiagramBlock): string {
  return [
    block.description,
    "Nodes:",
    ...block.nodes.map((node) => `- ${node.label}`),
    "Relations:",
    ...block.edges.map((edge) => `- ${edge.sourceNodeId} — ${edge.label} → ${edge.targetNodeId}`),
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
    shell.className = "d3-flow-block";
    shell.setAttribute("data-flow-block-id", block.id);
    shell.setAttribute("role", "group");
    shell.setAttribute("aria-label", block.label);
    sourceAttributes(shell, block.source);
    const fallback = dom.createElement("pre");
    fallback.className = "d3-flow-static-fallback";
    fallback.textContent = diagramFallback(block);
    shell.appendChild(fallback);
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

export function mountFlowDiagrams(root: HTMLElement, documents: readonly SceneDocument[], reducedMotion: boolean): () => void {
  const blocks = new Map<string, DiagramBlock>();
  for (const document of documents) for (const scene of document.scenes) for (const block of scene.blocks) {
    if (block.kind === "diagram") blocks.set(block.id, block);
  }
  const mounted: Array<{ destroy(): void }> = [];
  for (const host of root.querySelectorAll<HTMLElement>("[data-flow-block-id]")) {
    const block = blocks.get(host.dataset.flowBlockId ?? "");
    if (!block) continue;
    const result = createD3FlowRenderModel(block, { reducedMotion, interactionPolicy: "keyboard" });
    if (!result.model) {
      host.setAttribute("role", "alert");
      continue;
    }
    mounted.push(mountD3FlowDiagram(host, result.model));
  }
  return () => { for (const component of mounted.splice(0).reverse()) component.destroy(); };
}

export function mountSceneDocuments(dom: PitchDomPort, documents: readonly SceneDocument[]): () => void {
  if (!documents.length) throw new Error("Pitch requires at least one compiled SceneDocument");
  for (const document of documents) validateSceneDocument(document);
  dom.root.innerHTML = "";
  for (const document of documents) for (const scene of document.scenes) {
    const heading = scene.blocks.find((block) => block.kind === "prose" && block.intent?.kind === "introduce");
    const diagram = scene.blocks.find((block): block is Extract<SceneBlock, { kind: "diagram" }> => block.kind === "diagram");
    if (!heading && !diagram) throw new Error(`Scene ${scene.id} has no graph-backed heading or diagram label`);
    const section = dom.createElement("section");
    const headingId = `${scene.id}-title`;
    section.setAttribute("id", scene.id);
    section.setAttribute("data-scene-document-id", document.id);
    section.setAttribute("data-source-path-id", document.sourcePathId);
    section.setAttribute("data-layout", inferPitchLayout(scene));
    if (heading) section.setAttribute("aria-labelledby", headingId);
    else {
      section.setAttribute("aria-label", diagram.label);
      section.setAttribute("data-diagram-only", "true");
    }
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
