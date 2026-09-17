import type { DiagramBlock } from "../../core/src/scene-document.ts";
import type { D3KnowledgeNetworkOptions } from "./index.ts";

export interface D3SequenceLane { readonly roleId: string; readonly label: string; readonly x: number; readonly y: number; }
export interface D3SequenceMessage { readonly id: string; readonly label: string; readonly sourceRoleId: string; readonly targetRoleId: string; readonly y: number; readonly sourceX: number; readonly targetX: number; }
export interface D3SequenceLayout { readonly width: number; readonly height: number; readonly compact: boolean; readonly lanes: readonly D3SequenceLane[]; readonly messages: readonly D3SequenceMessage[]; }
export interface D3SequenceRenderModel { readonly version: "1.0"; readonly sourceBlockId: string; readonly label: string; readonly description: string; readonly participantRoles: NonNullable<DiagramBlock["participantRoles"]>; readonly messages: NonNullable<DiagramBlock["messages"]>; readonly states: NonNullable<DiagramBlock["states"]>; readonly staticFallback: string; readonly reducedMotion: boolean; }
export interface D3SequenceResolvedState { readonly activeMessageIds: ReadonlySet<string>; readonly bindings: ReadonlyMap<string, string>; }
export interface D3SequenceRuntimeMount { update(layout: D3SequenceLayout, stateId?: string): void; destroy(): void; }
export interface D3SequenceRuntimePort { measureHost(host: unknown): number; mount(host: unknown, model: D3SequenceRenderModel, layout: D3SequenceLayout, stateId?: string): D3SequenceRuntimeMount; observeResize?(host: unknown, callback: (width: number) => void): () => void; }
export interface D3SequenceComponent { readonly model: D3SequenceRenderModel; readonly layout: D3SequenceLayout; readonly staticFallback: string; readonly activeStateId?: string; setActiveState(stateId?: string): void; handleKey(key: string): boolean; resize(width?: number): D3SequenceLayout; destroy(): void; }

/** Geometry is derived only from ordered roles/messages and the host width. */
export function createD3SequenceLayout(model: D3SequenceRenderModel, hostWidth: number): D3SequenceLayout {
  const width = Math.max(320, hostWidth);
  const compact = width < 720;
  const margin = 42;
  const roleCount = model.participantRoles.length;

  if (compact) {
    const cardHeight = 32;
    const spacing = 80;
    const laneX = width / 2;
    const lanes = model.participantRoles.map((role, index) => ({
      roleId: role.id,
      label: role.label,
      x: laneX,
      y: 8 + index * spacing + cardHeight / 2,
    }));
    const laneById = new Map(lanes.map((lane) => [lane.roleId, lane]));
    const messages = model.messages.map((message, index) => {
      const sourceLane = laneById.get(message.sourceRoleId)!;
      const targetLane = laneById.get(message.targetRoleId)!;
      const baseY = (sourceLane.y + targetLane.y) / 2;
      const samePairEarlier = model.messages.slice(0, index).filter((m) => m.sourceRoleId === message.sourceRoleId && m.targetRoleId === message.targetRoleId).length;
      const y = baseY + samePairEarlier * 14;
      return {
        ...message,
        y,
        sourceX: sourceLane.x,
        targetX: targetLane.x,
      };
    });
    const height = 8 + roleCount * spacing + 40;
    return { width, height, compact, lanes, messages };
  }

  const laneSpan = roleCount > 1 ? (width - margin * 2) / (roleCount - 1) : 0;
  const lanes = model.participantRoles.map((role, index) => ({
    roleId: role.id,
    label: role.label,
    x: margin + index * laneSpan,
    y: 30,
  }));
  const messages = model.messages.map((message, index) => ({
    ...message,
    y: 82 + index * 58,
    sourceX: lanes.find((lane) => lane.roleId === message.sourceRoleId)!.x,
    targetX: lanes.find((lane) => lane.roleId === message.targetRoleId)!.x,
  }));
  return { width, height: 82 + model.messages.length * 58, compact, lanes, messages };
}

export function createD3SequenceRenderModel(block: DiagramBlock, options: D3KnowledgeNetworkOptions): { readonly model?: D3SequenceRenderModel; readonly diagnostics: readonly { readonly code: string; readonly message: string }[] } {
  if (block.diagramType !== "sequence") return { diagnostics: [{ code: "UNSUPPORTED_SEQUENCE_DIAGRAM_TYPE", message: "Sequence renderer requires a sequence diagram" }] };
  if (!block.participantRoles || !block.messages) return { diagnostics: [{ code: "INVALID_SEQUENCE_DIAGRAM", message: "Sequence requires roles and messages" }] };
  const staticFallback = [block.label, block.description, "Participants:", ...block.participantRoles.map((role) => `- ${role.label}`), "Messages:", ...block.messages.map((message) => `- ${message.sourceRoleId} - ${message.label} -> ${message.targetRoleId}`), ...(block.states ?? []).flatMap((state) => [`State: ${state.label}`, ...(state.participantBindings ?? []).map((binding) => `- ${binding.roleId}: ${binding.label}`)])].join("\n");
  return { model: { version: "1.0", sourceBlockId: block.id, label: block.label, description: block.description, participantRoles: block.participantRoles, messages: block.messages, states: block.states ?? [], staticFallback, reducedMotion: options.reducedMotion }, diagnostics: [] };
}

export function resolveD3SequenceState(model: D3SequenceRenderModel, stateId?: string): D3SequenceResolvedState {
  const state = model.states.find((candidate) => candidate.id === stateId);
  return {
    activeMessageIds: new Set(state?.activeMessageIds ?? model.messages.map((message) => message.id)),
    bindings: new Map((state?.participantBindings ?? []).map((binding) => [binding.roleId, binding.label])),
  };
}

/** SVG-free deterministic layout model is the renderer boundary; hosts may theme it without semantic selectors. */
export function sequenceLayoutDataAttributes(layout: D3SequenceLayout): readonly string[] {
  return [
    ...layout.lanes.map((lane) => `role:${lane.roleId}@${lane.x},${lane.y}`),
    ...layout.messages.map((message) => `message:${message.id}@${message.y}`),
    `mode:${layout.compact ? "compact" : "lanes"}`,
  ];
}

function ensureHostElement(host: unknown): HTMLElement {
  if (!(host instanceof HTMLElement)) throw new Error("D3 sequence host must be an HTMLElement");
  return host;
}

function preserveAccessibilityLiveRegions(host: HTMLElement): HTMLElement[] {
  return Array.from(host.children).filter((child): child is HTMLElement => child.getAttribute("aria-live") === "polite");
}

function hostWidth(hostWidth: number, viewportWidth?: number): number {
  return Math.max(320, Math.min(hostWidth > 0 ? hostWidth : viewportWidth ?? 960, viewportWidth ?? hostWidth ?? 960));
}

export function createSvgD3SequenceRuntime(): D3SequenceRuntimePort {
  return {
    measureHost(host) { const element = ensureHostElement(host); return hostWidth(element.clientWidth, typeof window === "undefined" ? undefined : window.innerWidth); },
    mount(host, model, initialLayout, initialStateId) {
      const hostElement = ensureHostElement(host); const namespace = "http://www.w3.org/2000/svg";
      const liveRegions = preserveAccessibilityLiveRegions(hostElement);
      hostElement.innerHTML = "";
      const wrapper = document.createElement("div"); wrapper.className = "d3-sequence-runtime";
      const figure = document.createElement("figure"); figure.className = "d3-sequence-figure";
      const svg = document.createElementNS(namespace, "svg"); svg.setAttribute("class", "d3-sequence-svg"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", model.label); svg.setAttribute("width", "100%"); svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      const caption = document.createElement("figcaption"); caption.className = "d3-sequence-caption"; caption.textContent = model.description;
      figure.append(svg, caption); wrapper.append(figure); hostElement.append(wrapper);
      for (const live of liveRegions) hostElement.append(live);
      let destroyed = false;
      const render = (layout: D3SequenceLayout, stateId?: string): void => {
        if (destroyed) return;
        const state = resolveD3SequenceState(model, stateId); svg.replaceChildren(); svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`); svg.setAttribute("height", String(layout.height)); svg.setAttribute("data-layout-mode", layout.compact ? "compact" : "lanes"); svg.setAttribute("data-reduced-motion", String(model.reducedMotion));
        const description = document.createElementNS(namespace, "desc"); description.textContent = model.staticFallback; svg.append(description);
        const laneById = new Map(layout.lanes.map((lane) => [lane.roleId, lane]));
        const roleOrder = new Map(layout.lanes.map((lane, index) => [lane.roleId, index]));
        for (const lane of layout.lanes) {
          if (layout.compact) {
            const card = document.createElementNS(namespace, "rect");
            card.setAttribute("class", "d3-sequence-participant-card");
            card.setAttribute("data-role-id", lane.roleId);
            card.setAttribute("x", String(lane.x - 60));
            card.setAttribute("y", String(lane.y - 16));
            card.setAttribute("width", "120");
            card.setAttribute("height", "32");
            card.setAttribute("rx", "4");
            svg.append(card);
          } else {
            const card = document.createElementNS(namespace, "rect");
            card.setAttribute("class", "d3-sequence-participant-card");
            card.setAttribute("data-role-id", lane.roleId);
            card.setAttribute("x", String(lane.x - 72));
            card.setAttribute("y", "8");
            card.setAttribute("width", "144");
            card.setAttribute("height", "32");
            card.setAttribute("rx", "4");
            svg.append(card);
          }
          const label = document.createElementNS(namespace, "text");
          label.setAttribute("class", "d3-sequence-participant");
          label.setAttribute("data-role-id", lane.roleId);
          label.setAttribute("x", String(lane.x));
          label.setAttribute("y", String(layout.compact ? lane.y : 30));
          label.setAttribute("text-anchor", "middle");
          label.textContent = state.bindings.get(lane.roleId) ?? lane.label;
          svg.append(label);
          if (!layout.compact) {
            const lifeline = document.createElementNS(namespace, "line");
            lifeline.setAttribute("class", "d3-sequence-lifeline");
            lifeline.setAttribute("data-role-id", lane.roleId);
            lifeline.setAttribute("x1", String(lane.x));
            lifeline.setAttribute("x2", String(lane.x));
            lifeline.setAttribute("y1", "42");
            lifeline.setAttribute("y2", String(layout.height - 12));
            svg.append(lifeline);
          }
        }
        for (const message of layout.messages) {
          if (!state.activeMessageIds.has(message.id)) continue;
          const source = laneById.get(message.sourceRoleId)!;
          const target = laneById.get(message.targetRoleId)!;
          const sourceIndex = roleOrder.get(message.sourceRoleId) ?? 0;
          const targetIndex = roleOrder.get(message.targetRoleId) ?? 0;
          const forward = sourceIndex <= targetIndex;
          const group = document.createElementNS(namespace, "g");
          group.setAttribute("class", "d3-sequence-message");
          group.setAttribute("data-message-id", message.id);
          const line = document.createElementNS(namespace, "line");
          line.setAttribute("class", "d3-sequence-message-line");
          if (layout.compact) {
            const x1 = 48;
            const x2 = layout.width - 48;
            line.setAttribute("x1", String(forward ? x1 : x2));
            line.setAttribute("x2", String(forward ? x2 : x1));
          } else {
            line.setAttribute("x1", String(source.x));
            line.setAttribute("x2", String(target.x));
          }
          line.setAttribute("y1", String(message.y));
          line.setAttribute("y2", String(message.y));
          group.append(line);
          const text = document.createElementNS(namespace, "text");
          text.setAttribute("class", "d3-sequence-message-label");
          text.setAttribute("x", String(layout.compact ? layout.width / 2 : (source.x + target.x) / 2));
          text.setAttribute("y", String(message.y - 9));
          text.setAttribute("text-anchor", "middle");
          text.textContent = message.label;
          group.append(text);
          svg.append(group);
        }
      };
      render(initialLayout, initialStateId);
      return { update: render, destroy() { if (!destroyed) { destroyed = true; wrapper.remove(); } } };
    },
    observeResize(host, callback) { const element = ensureHostElement(host); if (typeof ResizeObserver === "undefined") return () => {}; const observer = new ResizeObserver((entries) => callback(hostWidth(entries[0]?.contentRect.width ?? element.clientWidth, window.innerWidth))); observer.observe(element); return () => observer.disconnect(); },
  };
}

export function mountD3SequenceDiagram(host: unknown, block: DiagramBlock, options: D3KnowledgeNetworkOptions, runtime: D3SequenceRuntimePort = createSvgD3SequenceRuntime()): D3SequenceComponent | ReturnType<typeof createD3SequenceRenderModel> {
  const result = createD3SequenceRenderModel(block, options); if (!result.model) return result;
  const model = result.model; let layout = createD3SequenceLayout(model, runtime.measureHost(host)); let activeStateId: string | undefined; let destroyed = false;
  const mounted = runtime.mount(host, model, layout, activeStateId); const stopObserving = runtime.observeResize?.(host, (width) => { layout = createD3SequenceLayout(model, width); mounted.update(layout, activeStateId); }) ?? (() => {});
  return { model, get layout() { return layout; }, get staticFallback() { return model.staticFallback; }, get activeStateId() { return activeStateId; }, setActiveState(stateId) { if (!destroyed && (stateId === undefined || model.states.some((state) => state.id === stateId))) { activeStateId = stateId; mounted.update(layout, stateId); } }, handleKey() { return false; }, resize(width) { if (!destroyed) { layout = createD3SequenceLayout(model, width ?? runtime.measureHost(host)); mounted.update(layout, activeStateId); } return layout; }, destroy() { if (!destroyed) { destroyed = true; stopObserving(); mounted.destroy(); } } };
}
