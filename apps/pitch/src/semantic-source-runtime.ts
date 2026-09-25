import type { CodeBlock, SceneDocument } from "../../../packages/core/src/scene-document.ts";
import type { RdfDatasetSnapshot } from "../../../packages/core/src/knowledge-network.ts";

const SHOWS_RESOURCE = "cd:showsResource";

export interface SemanticSourceLine {
  readonly text: string;
  readonly resourceId?: string;
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function resourceToken(resourceId: string): string {
  if (resourceId.startsWith("https://w3id.org/project-chemie-digital/resource/")) {
    return `ex:${resourceId.slice("https://w3id.org/project-chemie-digital/resource/".length)}`;
  }
  return resourceId;
}

function absoluteResourceId(resourceId: string): string {
  if (resourceId.startsWith("ex:")) {
    return `https://w3id.org/project-chemie-digital/resource/${resourceId.slice(3)}`;
  }
  return resourceId;
}

function resourceStanzaStart(lines: readonly string[], resourceId: string): number {
  const token = resourceToken(resourceId);
  return lines.findIndex((line) => {
    const trimmed = line.trimStart();
    return trimmed === token || trimmed.startsWith(`${token} `) || trimmed.startsWith(`${token}\t`);
  });
}

export function semanticSourceResourceOrder(
  block: CodeBlock,
  snapshot: RdfDatasetSnapshot,
): readonly string[] {
  const sourceIds = new Set(block.source.map((source) => source.resourceId));
  const targets = unique(snapshot.statements
    .filter((statement) => sourceIds.has(statement.sourceEntityId) && statement.predicateId === SHOWS_RESOURCE)
    .map((statement) => statement.targetEntityId));
  const lines = block.code.split("\n");

  return [...targets].sort((left, right) => {
    const leftIndex = resourceStanzaStart(lines, left);
    const rightIndex = resourceStanzaStart(lines, right);
    const normalizedLeft = leftIndex < 0 ? Number.POSITIVE_INFINITY : leftIndex;
    const normalizedRight = rightIndex < 0 ? Number.POSITIVE_INFINITY : rightIndex;
    return normalizedLeft - normalizedRight || left.localeCompare(right);
  });
}

export function semanticSourceLines(code: string, resourceIds: readonly string[]): readonly SemanticSourceLine[] {
  const lines = code.split("\n");
  const starts = resourceIds
    .map((resourceId) => ({ resourceId, line: resourceStanzaStart(lines, resourceId) }))
    .filter((entry) => entry.line >= 0)
    .sort((left, right) => left.line - right.line || left.resourceId.localeCompare(right.resourceId));

  return lines.map((text, lineIndex) => {
    let owner: string | undefined;
    for (const start of starts) {
      if (start.line > lineIndex) break;
      owner = start.resourceId;
    }
    return Object.freeze({ text, ...(owner ? { resourceId: owner } : {}) });
  });
}

export function semanticSourceVisibleResources(
  resourceIds: readonly string[],
  step: number,
): readonly string[] {
  const normalized = Math.max(0, Math.min(resourceIds.length, Math.trunc(Number.isFinite(step) ? step : 0)));
  return resourceIds.slice(0, normalized);
}

function semanticCodeBlocks(documents: readonly SceneDocument[]): Map<string, CodeBlock> {
  const blocks = new Map<string, CodeBlock>();
  for (const document of documents) {
    for (const scene of document.scenes) {
      for (const block of scene.blocks) {
        if (block.kind !== "code" || block.language.toLowerCase() !== "trig") continue;
        blocks.set(block.id, block);
      }
    }
  }
  return blocks;
}

function decorateCode(code: HTMLElement, lines: readonly SemanticSourceLine[]): void {
  code.replaceChildren();
  for (const line of lines) {
    const span = document.createElement("span");
    span.className = "pcd-semantic-code-line";
    span.textContent = line.text.length ? line.text : " ";
    if (line.resourceId) span.dataset.semanticResourceId = line.resourceId;
    else span.dataset.semanticPrefix = "true";
    code.append(span);
  }
}

function setElementOpacity(element: Element, opacity: string): void {
  if (!(element instanceof HTMLElement || element instanceof SVGElement)) return;
  element.style.opacity = opacity;
  element.style.pointerEvents = opacity === "0" ? "none" : "";
}

function applyCodeStep(host: HTMLElement, resourceIds: readonly string[], step: number): void {
  const visible = new Set(semanticSourceVisibleResources(resourceIds, step));
  const current = visible.size ? resourceIds[Math.min(visible.size, resourceIds.length) - 1] : undefined;
  for (const line of host.querySelectorAll<HTMLElement>(".pcd-semantic-code-line")) {
    const resourceId = line.dataset.semanticResourceId;
    line.classList.toggle("pcd-semantic-code-current", Boolean(resourceId && resourceId === current));
    line.classList.toggle("pcd-semantic-code-revealed", Boolean(resourceId && visible.has(resourceId)));
    line.classList.toggle("pcd-semantic-code-pending", Boolean(resourceId && !visible.has(resourceId)));
  }
  host.dataset.presentationStep = String(visible.size);
}

function applyGraphStep(host: HTMLElement, resourceIds: readonly string[], step: number): void {
  const visibleCompact = new Set(semanticSourceVisibleResources(resourceIds, step));
  const visible = new Set([...visibleCompact].map(absoluteResourceId));
  const currentCompact = visibleCompact.size ? resourceIds[Math.min(visibleCompact.size, resourceIds.length) - 1] : undefined;
  const current = currentCompact ? absoluteResourceId(currentCompact) : undefined;
  const anchorIds = new Set(
    [...host.querySelectorAll<SVGGElement>(".d3-node-selected")]
      .map((node) => node.getAttribute("data-node-id") ?? "")
      .filter(Boolean),
  );

  for (const node of host.querySelectorAll<SVGGElement>(".d3-node")) {
    const nodeId = node.getAttribute("data-node-id") ?? "";
    const isAnchor = anchorIds.has(nodeId);
    const isVisible = isAnchor || visible.has(nodeId);
    setElementOpacity(node, isVisible ? (nodeId === current ? "1" : isAnchor ? "0.62" : "0.48") : "0");
    node.classList.toggle("pcd-semantic-node-current", nodeId === current);
  }

  const visibleEdgeIds = new Set<string>();
  for (const edge of host.querySelectorAll<SVGLineElement>(".d3-edge")) {
    const sourceId = edge.getAttribute("data-source-node-id") ?? "";
    const targetId = edge.getAttribute("data-target-node-id") ?? "";
    const edgeId = edge.getAttribute("data-edge-id") ?? "";
    const sourceVisible = visible.has(sourceId) || anchorIds.has(sourceId);
    const targetVisible = visible.has(targetId) || anchorIds.has(targetId);
    const edgeVisible = sourceVisible && targetVisible && (visible.has(sourceId) || visible.has(targetId));
    setElementOpacity(edge, edgeVisible ? "0.82" : "0");
    if (edgeVisible && edgeId) visibleEdgeIds.add(edgeId);
  }

  for (const label of host.querySelectorAll<SVGTextElement>(".d3-edge-label")) {
    const edgeId = label.getAttribute("data-edge-label-id") ?? "";
    setElementOpacity(label, visibleEdgeIds.has(edgeId) ? "0.72" : "0");
  }
  host.dataset.presentationStep = String(visibleCompact.size);
}

export function mountSemanticSourceSteps(
  root: HTMLElement,
  documents: readonly SceneDocument[],
  snapshot: RdfDatasetSnapshot,
): () => void {
  const blocks = semanticCodeBlocks(documents);
  const cleanups: Array<() => void> = [];

  for (const codeHost of root.querySelectorAll<HTMLElement>('.code-block[data-language="trig"]')) {
    const blockId = codeHost.getAttribute("data-code-block-id");
    if (!blockId) continue;
    const block = blocks.get(blockId);
    if (!block) continue;
    const resourceIds = semanticSourceResourceOrder(block, snapshot);
    if (!resourceIds.length) continue;

    const section = codeHost.closest<HTMLElement>("section");
    const graphHost = section?.querySelector<HTMLElement>("[data-knowledge-scene-id]") ?? null;
    const code = codeHost.querySelector<HTMLElement>(".code-static-fallback code");
    if (!section || !graphHost || !code) continue;

    const groupId = `semantic-source:${section.id || block.id}`;
    for (const host of [codeHost, graphHost]) {
      host.setAttribute("data-presentation-step-group", groupId);
      host.setAttribute("data-presentation-step-count", String(resourceIds.length));
    }
    codeHost.setAttribute("data-semantic-source", "true");
    graphHost.setAttribute("data-semantic-source", "true");
    graphHost.setAttribute("data-semantic-resource-order", resourceIds.join(" "));

    decorateCode(code, semanticSourceLines(block.code, resourceIds));
    applyCodeStep(codeHost, resourceIds, 0);
    applyGraphStep(graphHost, resourceIds, 0);

    const codeListener: EventListener = (event) => {
      const step = (event as CustomEvent<{ step?: unknown }>).detail?.step;
      if (typeof step === "number") applyCodeStep(codeHost, resourceIds, step);
    };
    const graphListener: EventListener = (event) => {
      const step = (event as CustomEvent<{ step?: unknown }>).detail?.step;
      if (typeof step === "number") applyGraphStep(graphHost, resourceIds, step);
    };
    codeHost.addEventListener("pcd-presentation-step", codeListener);
    graphHost.addEventListener("pcd-presentation-step", graphListener);
    cleanups.push(() => codeHost.removeEventListener("pcd-presentation-step", codeListener));
    cleanups.push(() => graphHost.removeEventListener("pcd-presentation-step", graphListener));
  }

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    for (const cleanup of cleanups.splice(0)) cleanup();
  };
}
