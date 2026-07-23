import { validateSceneDocument, type SceneDocument, type SceneBlock, type SourceReference } from "../../../packages/core/src/scene-document.ts";

export type PitchLayout = "opening" | "statement" | "process" | "split-proof";
const layoutBySourcePath: Readonly<Record<string, PitchLayout>> = Object.freeze({
  "ex:standard-deviation-definition-with-citation-scene": "split-proof"
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
  if (provenance.length) node.setAttribute("data-provenance-ids", [...new Set(provenance)].sort().join(" "));
}
function appendBlock(parent: MinimalElement, dom: PitchDomPort, block: SceneBlock, headingId: string): void {
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
    section.setAttribute("data-layout", layoutBySourcePath[document.sourcePathId] ?? "statement");
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
