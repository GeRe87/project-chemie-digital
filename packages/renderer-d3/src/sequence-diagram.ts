import type { DiagramBlock } from "../../core/src/scene-document.ts";
import type { D3KnowledgeNetworkOptions } from "./index.ts";

export interface D3SequenceLane { readonly roleId: string; readonly label: string; readonly x: number; readonly y: number; readonly cardWidth: number; readonly cardHeight: number; readonly toneIndex: number; }
export interface D3SequencePathPoint { readonly x: number; readonly y: number; }
export interface D3SequenceMessage { readonly id: string; readonly label: string; readonly sourceRoleId: string; readonly targetRoleId: string; readonly y: number; readonly sourceX: number; readonly targetX: number; readonly path: readonly D3SequencePathPoint[]; }
export interface D3SequenceLayout { readonly width: number; readonly height: number; readonly compact: boolean; readonly lanes: readonly D3SequenceLane[]; readonly messages: readonly D3SequenceMessage[]; }
export interface D3SequenceRenderModel { readonly version: "1.0"; readonly sourceBlockId: string; readonly label: string; readonly description: string; readonly participantRoles: NonNullable<DiagramBlock["participantRoles"]>; readonly messages: NonNullable<DiagramBlock["messages"]>; readonly states: NonNullable<DiagramBlock["states"]>; readonly staticFallback: string; readonly reducedMotion: boolean; }
export interface D3SequenceResolvedState { readonly activeMessageIds: ReadonlySet<string>; readonly bindings: ReadonlyMap<string, string>; }
export interface D3SequenceRuntimeMount { update(layout: D3SequenceLayout, stateId?: string): void; destroy(): void; }
export interface D3SequenceRuntimePort { measureHost(host: unknown): number; mount(host: unknown, model: D3SequenceRenderModel, layout: D3SequenceLayout, stateId?: string): D3SequenceRuntimeMount; observeResize?(host: unknown, callback: (width: number) => void): () => void; }
export interface D3SequenceComponent { readonly model: D3SequenceRenderModel; readonly layout: D3SequenceLayout; readonly staticFallback: string; readonly activeStateId?: string; setActiveState(stateId?: string): void; handleKey(key: string): boolean; resize(width?: number): D3SequenceLayout; destroy(): void; }

function sequenceLabelWidth(value: string): number {
  return Array.from(value).reduce((width, character) => width + (/[MW@#%]/u.test(character) ? 11 : /[ilI1 .,:;]/u.test(character) ? 5.5 : 8.5), 0);
}

function sequenceRoleCardWidth(model: D3SequenceRenderModel, roleId: string, label: string, compact: boolean): number {
  const labels = [
    label,
    ...model.states.flatMap((state) =>
      (state.participantBindings ?? [])
        .filter((binding) => binding.roleId === roleId)
        .map((binding) => binding.label)),
  ];
  const measured = Math.max(...labels.map(sequenceLabelWidth), 0) + (compact ? 30 : 38);
  return Math.max(compact ? 120 : 144, Math.min(compact ? 176 : 210, measured));
}

/** Geometry is derived only from ordered roles/messages and the host width. */
export function createD3SequenceLayout(model: D3SequenceRenderModel, hostWidth: number): D3SequenceLayout {
  const width = Math.max(320, hostWidth);
  const compact = width < 720;
  const margin = 42;
  const roleCount = model.participantRoles.length;

  if (compact) {
    const cardHeight = 36;
    const spacing = 84;
    const laneX = width / 2;
    const rightGutter = width - 24;
    const leftGutter = 24;
    const lanes = model.participantRoles.map((role, index) => ({
      roleId: role.id,
      label: role.label,
      x: laneX,
      y: 8 + index * spacing + cardHeight / 2,
      cardWidth: sequenceRoleCardWidth(model, role.id, role.label, true),
      cardHeight,
      toneIndex: index,
    }));
    const laneById = new Map(lanes.map((lane) => [lane.roleId, lane]));
    const roleOrder = new Map(model.participantRoles.map((role, index) => [role.id, index]));
    const messages = model.messages.map((message, index) => {
      const sourceLane = laneById.get(message.sourceRoleId)!;
      const targetLane = laneById.get(message.targetRoleId)!;
      const sourceIndex = roleOrder.get(message.sourceRoleId) ?? 0;
      const targetIndex = roleOrder.get(message.targetRoleId) ?? 0;
      const samePairEarlier = model.messages.slice(0, index).filter((m) => m.sourceRoleId === message.sourceRoleId && m.targetRoleId === message.targetRoleId).length;
      const sourceCardLeft = laneX - sourceLane.cardWidth / 2;
      const sourceCardRight = laneX + sourceLane.cardWidth / 2;
      const targetCardLeft = laneX - targetLane.cardWidth / 2;
      const targetCardRight = laneX + targetLane.cardWidth / 2;
      const forward = sourceIndex <= targetIndex;
      const gutterX = forward ? rightGutter : leftGutter;
      let path: D3SequencePathPoint[];
      let y: number;
      if (sourceLane.roleId === targetLane.roleId) {
        y = sourceLane.y + cardHeight / 2 + 14 + samePairEarlier * 14;
        const loopOut = 28 + samePairEarlier * 10;
        path = [
          { x: sourceCardRight, y: sourceLane.y },
          { x: sourceCardRight + loopOut, y: sourceLane.y },
          { x: sourceCardRight + loopOut, y },
          { x: sourceCardRight, y },
        ];
      } else {
        y = (sourceLane.y + targetLane.y) / 2 + samePairEarlier * 14;
        const sourceAnchorX = forward ? sourceCardRight : sourceCardLeft;
        const targetAnchorX = forward ? targetCardRight : targetCardLeft;
        path = [
          { x: sourceAnchorX, y: sourceLane.y },
          { x: gutterX, y: sourceLane.y },
          { x: gutterX, y: targetLane.y },
          { x: targetAnchorX, y: targetLane.y },
        ];
      }
      return {
        ...message,
        y,
        sourceX: sourceLane.x,
        targetX: targetLane.x,
        path,
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
    cardWidth: sequenceRoleCardWidth(model, role.id, role.label, false),
    cardHeight: 36,
    toneIndex: index,
  }));
  const messages = model.messages.map((message, index) => {
    const sourceX = lanes.find((lane) => lane.roleId === message.sourceRoleId)!.x;
    const targetX = lanes.find((lane) => lane.roleId === message.targetRoleId)!.x;
    const y = 82 + index * 58;
    return {
      ...message,
      y,
      sourceX,
      targetX,
      path: [{ x: sourceX, y }, { x: targetX, y }],
    };
  });
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

let sequenceMarkerMountSequence = 0;

function sequenceMarkerId(mountSequence: number): string {
  return `d3-sequence-arrow-${mountSequence}`;
}

function pathCommands(points: readonly D3SequencePathPoint[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

export function createSvgD3SequenceRuntime(): D3SequenceRuntimePort {
  return {
    measureHost(host) { const element = ensureHostElement(host); return hostWidth(element.clientWidth, typeof window === "undefined" ? undefined : window.innerWidth); },
    mount(host, model, initialLayout, initialStateId) {
      const hostElement = ensureHostElement(host); const namespace = "http://www.w3.org/2000/svg";
      const liveRegions = preserveAccessibilityLiveRegions(hostElement);
      const mountSequence = ++sequenceMarkerMountSequence;
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
        const defs = document.createElementNS(namespace, "defs");
        const marker = document.createElementNS(namespace, "marker");
        marker.setAttribute("id", sequenceMarkerId(mountSequence));
        marker.setAttribute("class", "d3-sequence-message-marker");
        marker.setAttribute("viewBox", "0 0 10 10");
        marker.setAttribute("refX", "9");
        marker.setAttribute("refY", "5");
        marker.setAttribute("markerWidth", "5");
        marker.setAttribute("markerHeight", "5");
        marker.setAttribute("orient", "auto-start-reverse");
        const arrow = document.createElementNS(namespace, "path");
        arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
        arrow.setAttribute("fill", "currentColor");
        marker.append(arrow);
        defs.append(marker);
        svg.append(defs);
        const laneById = new Map(layout.lanes.map((lane) => [lane.roleId, lane]));
        for (const lane of layout.lanes) {
          if (layout.compact) {
            const card = document.createElementNS(namespace, "rect");
            card.setAttribute("class", "d3-sequence-participant-card");
            card.setAttribute("data-role-id", lane.roleId);
            card.setAttribute("data-participant-index", String(lane.toneIndex));
            card.setAttribute("x", String(lane.x - lane.cardWidth / 2));
            card.setAttribute("y", String(lane.y - lane.cardHeight / 2));
            card.setAttribute("width", String(lane.cardWidth));
            card.setAttribute("height", String(lane.cardHeight));
            card.setAttribute("rx", "4");
            svg.append(card);
          } else {
            const card = document.createElementNS(namespace, "rect");
            card.setAttribute("class", "d3-sequence-participant-card");
            card.setAttribute("data-role-id", lane.roleId);
            card.setAttribute("data-participant-index", String(lane.toneIndex));
            card.setAttribute("x", String(lane.x - lane.cardWidth / 2));
            card.setAttribute("y", String(lane.y - lane.cardHeight / 2));
            card.setAttribute("width", String(lane.cardWidth));
            card.setAttribute("height", String(lane.cardHeight));
            card.setAttribute("rx", "4");
            svg.append(card);
          }
          const label = document.createElementNS(namespace, "text");
          label.setAttribute("class", "d3-sequence-participant");
          label.setAttribute("data-role-id", lane.roleId);
          label.setAttribute("data-participant-index", String(lane.toneIndex));
          label.setAttribute("x", String(lane.x));
          label.setAttribute("y", String(layout.compact ? lane.y : 30));
          label.setAttribute("text-anchor", "middle");
          label.textContent = state.bindings.get(lane.roleId) ?? lane.label;
          svg.append(label);
          if (!layout.compact) {
            const lifeline = document.createElementNS(namespace, "line");
            lifeline.setAttribute("class", "d3-sequence-lifeline");
            lifeline.setAttribute("data-role-id", lane.roleId);
            lifeline.setAttribute("data-participant-index", String(lane.toneIndex));
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
          const group = document.createElementNS(namespace, "g");
          group.setAttribute("class", "d3-sequence-message");
          group.setAttribute("data-message-id", message.id);
          group.setAttribute("data-source-role-id", message.sourceRoleId);
          group.setAttribute("data-target-role-id", message.targetRoleId);
          group.setAttribute("data-source-participant-index", String(source.toneIndex));
          const path = document.createElementNS(namespace, "path");
          path.setAttribute("class", "d3-sequence-message-line");
          path.setAttribute("d", pathCommands(message.path));
          path.setAttribute("marker-end", `url(#${sequenceMarkerId(mountSequence)})`);
          path.setAttribute("fill", "none");
          group.append(path);
          const text = document.createElementNS(namespace, "text");
          text.setAttribute("class", "d3-sequence-message-label");
          const labelX = layout.compact ? layout.width / 2 : (source.x + target.x) / 2;
          const labelY = layout.compact ? message.y - 9 : message.y - 9;
          text.setAttribute("x", String(labelX));
          text.setAttribute("y", String(labelY));
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
