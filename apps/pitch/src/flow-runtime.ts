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
  querySelectorAll?<E extends Element = Element>(selectors: string): NodeListOf<E>;
  addEventListener?(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener?(type: string, listener: EventListenerOrEventListenerObject): void;
}

export interface FlowPresentationStepState {
  readonly focusVisible: boolean;
  readonly allNodesVisible: boolean;
  readonly edgesVisible: boolean;
  readonly focusEmphasized: boolean;
}

export const FLOW_PRESENTATION_STEP_COUNT = 4;

export function flowPresentationStepState(step: number): FlowPresentationStepState {
  const normalized = Math.max(0, Math.min(FLOW_PRESENTATION_STEP_COUNT, Math.trunc(Number.isFinite(step) ? step : 0)));
  return Object.freeze({
    focusVisible: normalized >= 1,
    allNodesVisible: normalized >= 2,
    edgesVisible: normalized >= 3,
    focusEmphasized: normalized >= 4,
  });
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

function setOpacity(elements: readonly Element[], opacity: string): void {
  for (const element of elements) {
    if (element instanceof SVGElement || element instanceof HTMLElement) {
      element.style.opacity = opacity;
      element.style.pointerEvents = opacity === "0" ? "none" : "";
    }
  }
}

function bindProgressivePresentation(host: PitchFlowHost, block: DiagramBlock): () => void {
  if (!host.setAttribute || !host.querySelectorAll || !host.addEventListener || !host.removeEventListener) return () => {};

  const focusNodeId = block.focusNodeId ?? block.nodes[0]?.id;
  host.setAttribute("data-presentation-step-count", String(FLOW_PRESENTATION_STEP_COUNT));
  host.setAttribute("data-presentation-step-host", "flow-diagram");

  const apply = (step: number): void => {
    const state = flowPresentationStepState(step);
    const nodes = Array.from(host.querySelectorAll!<SVGElement>(".d3-flow-node"));
    const focusNodes = nodes.filter((node) => node.getAttribute("data-node-id") === focusNodeId);
    const otherNodes = nodes.filter((node) => node.getAttribute("data-node-id") !== focusNodeId);
    const edges = Array.from(host.querySelectorAll!<SVGElement>(".d3-flow-edge"));
    const edgeLabels = Array.from(host.querySelectorAll!<SVGElement>(".d3-flow-edge-label"));

    setOpacity(focusNodes, state.focusVisible ? "1" : "0");
    setOpacity(otherNodes, state.allNodesVisible ? (state.focusEmphasized ? "0.3" : "1") : "0");
    setOpacity(edges, state.edgesVisible ? (state.focusEmphasized ? "0.55" : "1") : "0");
    setOpacity(edgeLabels, state.edgesVisible ? (state.focusEmphasized ? "0.5" : "1") : "0");

    for (const node of focusNodes) node.classList.toggle("pcd-flow-focus", state.focusEmphasized);
    host.setAttribute?.("data-presentation-step", String(Math.max(0, Math.min(FLOW_PRESENTATION_STEP_COUNT, Math.trunc(step)))));
  };

  const listener: EventListener = (event) => {
    const step = (event as CustomEvent<{ step?: unknown }>).detail?.step;
    if (typeof step === "number") apply(step);
  };

  host.addEventListener("pcd-presentation-step", listener);
  apply(0);
  return () => host.removeEventListener?.("pcd-presentation-step", listener);
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
  const removePresentationListeners: Array<() => void> = [];
  const cleanupMounted = (): void => {
    for (const removeListener of removePresentationListeners.splice(0)) removeListener();
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
      removePresentationListeners.push(bindProgressivePresentation(host, block));
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
