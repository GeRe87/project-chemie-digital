import type { DiagramBlock, SceneDocument } from "../../../packages/core/src/scene-document.ts";
import {
  mountD3FlowDiagram,
  type D3FlowComponent,
  type D3FlowOptions,
  type D3FlowRenderModelResult,
} from "../../../packages/renderer-d3/src/flow-diagram.ts";

export interface PitchFlowHost {
  getAttribute(name: string): string | null;
  setAttribute?(name: string, value: string): void;
  removeAttribute?(name: string): void;
  querySelectorAll?<E extends Element = Element>(selectors: string): NodeListOf<E>;
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
    if (!component.handleKey(key)) return;
    event.preventDefault();
    event.stopPropagation();
  };
  host.addEventListener("keydown", listener);
  return () => host.removeEventListener?.("keydown", listener);
}

function bindPresentationState(host: PitchFlowHost, component: D3FlowComponent): () => void {
  const states = component.model.states ?? [];
  const stateCount = states.length;
  if (!stateCount || !host.setAttribute || !host.addEventListener || !host.removeEventListener) return () => {};

  const previousCount = host.getAttribute("data-presentation-step-count");
  const previousHost = host.getAttribute("data-presentation-step-host");
  host.setAttribute("data-presentation-step-count", String(stateCount));
  host.setAttribute("data-presentation-step-host", "diagram-state");

  const listener: EventListener = (event) => {
    const step = (event as CustomEvent<{ step?: unknown }>).detail?.step;
    if (typeof step !== "number" || !Number.isFinite(step)) return;
    component.setActiveState(states[Math.trunc(step) - 1]?.id);
  };
  host.addEventListener("pcd-presentation-step", listener);

  return () => {
    host.removeEventListener?.("pcd-presentation-step", listener);
    if (previousCount === null) host.removeAttribute?.("data-presentation-step-count");
    else host.setAttribute?.("data-presentation-step-count", previousCount);
    if (previousHost === null) host.removeAttribute?.("data-presentation-step-host");
    else host.setAttribute?.("data-presentation-step-host", previousHost);
  };
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
  const removePresentationStateListeners: Array<() => void> = [];
  const cleanupMounted = (): void => {
    for (const removeListener of removePresentationStateListeners.splice(0)) removeListener();
    for (const removeListener of removeKeyboardListeners.splice(0)) removeListener();
    for (const component of components.splice(0)) component.destroy();
  };

  try {
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
      removePresentationStateListeners.push(bindPresentationState(host, result));
    }
  } catch (error) {
    cleanupMounted();
    throw error;
  }

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    cleanupMounted();
  };
}
