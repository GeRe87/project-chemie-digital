import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";
import type { RdfDatasetSnapshot } from "../../../packages/core/src/knowledge-network.ts";
import {
  mountD3KnowledgeNetwork,
  type D3KnowledgeNetworkComponent,
  type D3KnowledgeNetworkOptions,
} from "../../../packages/renderer-d3/src/index.ts";
import { projectSceneSummary } from "./graph-summary-shell.ts";

export interface PitchKnowledgeNetworkHost {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E>;
  classList: DOMTokenList;
}

export interface KnowledgeNetworkStepState {
  readonly selectedVisible: boolean;
  readonly relatedVisible: boolean;
  readonly edgesVisible: boolean;
  readonly focusSelected: boolean;
}

export const KNOWLEDGE_NETWORK_STEP_COUNT = 4;

export function knowledgeNetworkStepState(step: number): KnowledgeNetworkStepState {
  const normalized = Math.max(0, Math.min(KNOWLEDGE_NETWORK_STEP_COUNT, Math.trunc(Number.isFinite(step) ? step : 0)));
  return Object.freeze({
    selectedVisible: normalized >= 1,
    relatedVisible: normalized >= 2,
    edgesVisible: normalized >= 3,
    focusSelected: normalized >= 4,
  });
}

function sceneById(documents: readonly SceneDocument[], sceneId: string) {
  return documents.flatMap((document) => document.scenes).find((scene) => scene.id === sceneId);
}

function setOpacity(elements: Iterable<Element>, opacity: string): void {
  for (const element of elements) {
    if (element instanceof SVGElement || element instanceof HTMLElement) {
      element.style.opacity = opacity;
      element.style.pointerEvents = opacity === "0" ? "none" : "";
    }
  }
}

function applyKnowledgeStep(host: PitchKnowledgeNetworkHost, step: number): void {
  const state = knowledgeNetworkStepState(step);
  const selected = host.querySelectorAll<SVGElement>(".d3-node-selected");
  const related = host.querySelectorAll<SVGElement>(".d3-node-related");
  const edges = host.querySelectorAll<SVGElement>(".d3-edge");
  const edgeLabels = host.querySelectorAll<SVGElement>(".d3-edge-label");

  setOpacity(selected, state.selectedVisible ? "1" : "0");
  setOpacity(related, state.relatedVisible ? (state.focusSelected ? "0.28" : "1") : "0");
  setOpacity(edges, state.edgesVisible ? (state.focusSelected ? "0.55" : "1") : "0");
  setOpacity(edgeLabels, state.edgesVisible ? (state.focusSelected ? "0.45" : "1") : "0");
  host.classList.toggle("pcd-knowledge-focus-selected", state.focusSelected);
  host.setAttribute("data-presentation-step", String(Math.max(0, Math.min(KNOWLEDGE_NETWORK_STEP_COUNT, Math.trunc(step)))));
}

export function mountPitchKnowledgeNetworks(
  hosts: readonly PitchKnowledgeNetworkHost[],
  documents: readonly SceneDocument[],
  snapshot: RdfDatasetSnapshot,
  options: D3KnowledgeNetworkOptions,
): () => void {
  const mounted: Array<{
    readonly host: PitchKnowledgeNetworkHost;
    readonly component: D3KnowledgeNetworkComponent;
    readonly listener: EventListener;
  }> = [];

  try {
    for (const host of hosts) {
      const sceneId = host.getAttribute("data-knowledge-scene-id");
      if (!sceneId) throw new Error("Knowledge-network host requires data-knowledge-scene-id");
      const scene = sceneById(documents, sceneId);
      if (!scene) throw new Error(`Knowledge-network host references unknown scene ${sceneId}`);

      const projection = projectSceneSummary(snapshot, scene);
      const result = mountD3KnowledgeNetwork(host, projection, options);
      if ("diagnostics" in result) {
        const message = result.diagnostics.map((diagnostic) => `[${diagnostic.code}] ${diagnostic.message}`).join("; ");
        throw new Error(`Unable to mount knowledge network for ${sceneId}: ${message || "unknown renderer failure"}`);
      }

      host.setAttribute("data-presentation-step-count", String(KNOWLEDGE_NETWORK_STEP_COUNT));
      host.setAttribute("data-presentation-step-host", "knowledge-network");
      applyKnowledgeStep(host, 0);

      const listener: EventListener = (event) => {
        const step = (event as CustomEvent<{ step?: unknown }>).detail?.step;
        if (typeof step === "number") applyKnowledgeStep(host, step);
      };
      host.addEventListener("pcd-presentation-step", listener);
      mounted.push({ host, component: result, listener });
    }
  } catch (error) {
    for (const item of mounted.splice(0)) {
      item.host.removeEventListener("pcd-presentation-step", item.listener);
      item.component.destroy();
    }
    throw error;
  }

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    for (const item of mounted.splice(0)) {
      item.host.removeEventListener("pcd-presentation-step", item.listener);
      item.component.destroy();
    }
  };
}
