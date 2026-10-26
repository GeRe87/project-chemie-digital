import type { DiagramBlock, SceneDocument } from "../../../packages/core/src/scene-document.ts";
import { mountD3Diagram, type D3DiagramComponent, type D3DiagramMountResult } from "../../../packages/renderer-d3/src/diagram.ts";
import type { D3FlowOptions } from "../../../packages/renderer-d3/src/flow-diagram.ts";
import { createExplanationDialog } from "./explanation-dialog.ts";
import { trigMarkup } from "./trig-markup.ts";

export interface PitchFlowHost {
  getAttribute(name: string): string | null;
  setAttribute?(name: string, value: string): void;
  removeAttribute?(name: string): void;
  querySelector?<E extends Element = Element>(selectors: string): E | null;
  querySelectorAll?<E extends Element = Element>(selectors: string): NodeListOf<E>;
  addEventListener?(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener?(type: string, listener: EventListenerOrEventListenerObject): void;
}

export type PitchDiagramMount = (
  host: unknown,
  block: DiagramBlock,
  options: D3FlowOptions,
) => D3DiagramMountResult;

export type PitchFlowMount = PitchDiagramMount;

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

function bindKeyboardTraversal(host: PitchFlowHost, component: D3DiagramComponent, options: D3FlowOptions): () => void {
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

function describeDiagramState(component: D3DiagramComponent, stateId?: string): string {
  const state = stateId ? component.model.states.find((candidate) => candidate.id === stateId) : undefined;
  return state ? `${component.model.label}: ${state.label}` : component.model.label;
}

function updateDiagramAccessibility(host: PitchFlowHost, component: D3DiagramComponent, stateId?: string): void {
  if (!host.setAttribute) return;
  const text = describeDiagramState(component, stateId);
  host.setAttribute("aria-label", text);
  const live = host.querySelector?.<HTMLElement>(".pcd-diagram-live-region");
  if (live) live.textContent = text;
}

function bindDiagramAccessibility(host: PitchFlowHost, component: D3DiagramComponent): () => void {
  if (!host.setAttribute) return () => {};
  const previousLabel = host.getAttribute("aria-label");
  updateDiagramAccessibility(host, component, component.activeStateId);

  return () => {
    if (previousLabel === null) host.removeAttribute?.("aria-label");
    else host.setAttribute?.("aria-label", previousLabel);
    const live = host.querySelector?.<HTMLElement>(".pcd-diagram-live-region");
    if (live) live.textContent = previousLabel ?? "";
  };
}

function bindPresentationState(host: PitchFlowHost, component: D3DiagramComponent, onStateChange?: (stateId?: string) => void): () => void {
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
    onStateChange?.(component.activeStateId);
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

export function mountPitchDiagrams(
  hosts: readonly PitchFlowHost[],
  documents: readonly SceneDocument[],
  options: D3FlowOptions,
  mount: PitchDiagramMount = mountD3Diagram,
): () => void {
  const blocks = diagramBlocks(documents);
  const components: D3DiagramComponent[] = [];
  let dialogCount = 0;
  const removeKeyboardListeners: Array<() => void> = [];
  const removePresentationStateListeners: Array<() => void> = [];
  const removeAccessibilityListeners: Array<() => void> = [];
  const cleanupMounted = (): void => {
    for (const removeListener of removePresentationStateListeners.splice(0)) removeListener();
    for (const removeListener of removeKeyboardListeners.splice(0)) removeListener();
    for (const removeListener of removeAccessibilityListeners.splice(0)) removeListener();
    for (const component of components.splice(0)) component.destroy();
  };

  try {
    for (const host of hosts) {
      const blockId = host.getAttribute("data-diagram-block-id") ?? host.getAttribute("data-flow-block-id");
      if (!blockId) continue;
      const block = blocks.get(blockId);
      if (!block) throw new Error(`Pitch flow host references unknown block ${blockId}`);
      const attach = (target: PitchFlowHost) => {
        const result = mount(target, block, options);
        if ("diagnostics" in result) {
          const message = result.diagnostics.map((diagnostic) => `[${diagnostic.code}] ${diagnostic.message}`).join("; ");
          throw new Error(`Unable to mount pitch flow ${blockId}: ${message || "unknown renderer failure"}`);
        }
        components.push(result);
        if (block.edges.some(edge => edge.codeDetail) && typeof HTMLElement !== "undefined" && target instanceof HTMLElement) {
          const modal = createExplanationDialog("pcd-port-dialog", `pcd-port-title-${++dialogCount}`);
          const activate: EventListener = event => {
            if (event.type === "keydown" && !["Enter", " "].includes((event as KeyboardEvent).key)) return;
            const invoker = (event.target as Element | null)?.closest<SVGElement>("[data-diagram-detail-id]");
            const detail = block.edges.find(edge => edge.id === invoker?.getAttribute("data-diagram-detail-id"))?.codeDetail;
            if (!detail || !invoker) return;
            event.preventDefault(); event.stopImmediatePropagation();
            const content = document.createElement("div"), prose = document.createElement("p"), pre = document.createElement("pre"), code = document.createElement("code");
            prose.textContent = detail.description; code.textContent = detail.code;
            code.innerHTML = trigMarkup(detail.code);
            pre.className = "pcd-port-trig"; pre.append(code); content.append(prose, pre);
            modal.open(detail.label, content, invoker);
          };
          const dismiss = () => { if (modal.dialog.open) modal.dialog.close(); };
          target.addEventListener("click", activate); target.addEventListener("keydown", activate);
          window.addEventListener("hashchange", dismiss);
          removeAccessibilityListeners.push(() => {
            target.removeEventListener("click", activate); target.removeEventListener("keydown", activate);
            window.removeEventListener("hashchange", dismiss); modal.destroy();
          });
        }
        removeKeyboardListeners.push(bindKeyboardTraversal(target, result, options));
        removeAccessibilityListeners.push(bindDiagramAccessibility(target, result));
        removePresentationStateListeners.push(bindPresentationState(target, result, (stateId) => updateDiagramAccessibility(target, result, stateId)));
      };
      if (block.presentation === "dialog" && typeof HTMLElement !== "undefined" && host instanceof HTMLElement) {
        const modal = createExplanationDialog("pcd-diagram-dialog", `pcd-diagram-title-${++dialogCount}`);
        const button = document.createElement("button"); button.type = "button";
        button.className = "pcd-diagram-open"; button.textContent = `Open ${block.label}`;
        button.setAttribute("aria-haspopup", "dialog");
        // Reuse the same diagram theme as inline views, inside an unscaled shell.
        const stage = document.createElement("div"); stage.className = "reveal pcd-diagram-dialog-stage";
        const content = document.createElement("div"); content.className = "d3-diagram-host d3-flow-host"; stage.append(content);
        let mounted = false;
        const open = () => {
          modal.open(block.label, stage, button);
          if (!mounted) { attach(content); mounted = true; }
        };
        const dismiss = () => { if (modal.dialog.open) modal.dialog.close(); };
        button.addEventListener("click", open); host.replaceChildren(button);
        window.addEventListener("hashchange", dismiss);
        removeAccessibilityListeners.push(() => {
          button.removeEventListener("click", open); window.removeEventListener("hashchange", dismiss);
          modal.destroy(); host.replaceChildren();
        });
      } else attach(host);
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

export const mountPitchFlowDiagrams = mountPitchDiagrams;
