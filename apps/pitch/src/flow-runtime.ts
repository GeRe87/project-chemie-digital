import type { DiagramBlock, SceneDocument } from "../../../packages/core/src/scene-document.ts";
import {
  mountD3FlowDiagram,
  type D3FlowComponent,
  type D3FlowOptions,
  type D3FlowRenderModelResult,
} from "../../../packages/renderer-d3/src/flow-diagram.ts";

export interface PitchFlowHost {
  getAttribute(name: string): string | null;
  addEventListener?(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener?(type: string, listener: EventListenerOrEventListenerObject): void;
}

export type PitchFlowMount = (
  host: unknown,
  block: DiagramBlock,
  options: D3FlowOptions,
) => D3FlowComponent | D3FlowRenderModelResult;

function diagramBlocks(documents: readonly SceneDocument[]): Map<string, DiagramBlock> {
  const blocks = new Map<string, DiagramBlock>();
  for (const document of documents) {
    for (const scene of document.scenes) {
      for (const block of scene.blocks) {
        if (block.kind !== "diagram") continue;
        if (blocks.has(block.id)) throw new Error(`Duplicate pitch flow block id ${block.id}`);
        blocks.set(block.id, block);
      }
    }
  }
  return blocks;
}

function bindKeyboardTraversal(host: PitchFlowHost, component: D3FlowComponent, options: D3FlowOptions): () => void {
  if (options.interactionPolicy !== "keyboard" || !host.addEventListener || !host.removeEventListener) return () => {};
  const listener: EventListener = (event) => {
    const key = (event as Event & { key?: unknown }).key;
    if (typeof key !== "string") return;
    if (component.handleKey(key)) event.preventDefault();
  };
  host.addEventListener("keydown", listener);
  return () => host.removeEventListener?.("keydown", listener);
}

export function mountPitchFlowDiagrams(
  hosts: readonly PitchFlowHost[],
  documents: readonly SceneDocument[],
  options: D3FlowOptions,
  mount: PitchFlowMount = mountD3FlowDiagram,
): () => void {
  const blocks = diagramBlocks(documents);
  const components: D3FlowComponent[] = [];
  const removeKeyboardListeners: Array<() => void> = [];
  for (const host of hosts) {
    const blockId = host.getAttribute("data-flow-block-id");
    if (!blockId) continue;
    const block = blocks.get(blockId);
    if (!block) throw new Error(`Pitch flow host references unknown block ${blockId}`);
    const result = mount(host, block, options);
    if ("diagnostics" in result) {
      const message = result.diagnostics.map((diagnostic) => `[${diagnostic.code}] ${diagnostic.message}`).join("; ");
      throw new Error(`Unable to mount pitch flow ${blockId}: ${message || "unknown renderer failure"}`);
    }
    components.push(result);
    removeKeyboardListeners.push(bindKeyboardTraversal(host, result, options));
  }

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    for (const removeListener of removeKeyboardListeners) removeListener();
    for (const component of components) component.destroy();
  };
}
