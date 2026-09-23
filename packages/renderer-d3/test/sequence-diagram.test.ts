import assert from "node:assert/strict";
import test from "node:test";
import { createD3SequenceLayout, createD3SequenceRenderModel, mountD3SequenceDiagram, resolveD3SequenceState, sequenceLayoutDataAttributes, type D3SequenceRuntimePort } from "../src/sequence-diagram.ts";
import type { DiagramBlock } from "../../core/src/scene-document.ts";

const source = [{ resourceId: "fixture" }];
const fixture: DiagramBlock = {
  id: "client-registry-runtime-consumer", kind: "diagram", diagramType: "sequence", label: "Client registry runtime consumer", description: "Generic interaction fixture.", source,
  nodes: [], edges: [],
  participantRoles: ["Client", "Registry", "Runtime", "Consumer"].map((label, index) => ({ id: label.toLowerCase(), label, source: [{ resourceId: `role-${index}` }] })),
  messages: [
    { id: "discover", sourceRoleId: "client", targetRoleId: "registry", label: "discover", source },
    { id: "resolve", sourceRoleId: "registry", targetRoleId: "runtime", label: "resolve", source },
    { id: "provide", sourceRoleId: "runtime", targetRoleId: "consumer", label: "provide", source },
  ],
  states: [{ id: "bound", label: "Bound actors", source, sharedEdgeAnnotations: [], activeMessageIds: ["discover", "resolve", "provide"], participantBindings: [
    { roleId: "client", participantId: "template", label: "Template", source }, { roleId: "consumer", participantId: "web-ui", label: "Web UI", source },
  ] }],
};

class FakeNode {
  readonly attributes = new Map<string, string>();
  readonly children: FakeNode[] = [];
  parent: FakeNode | null = null;
  textContent: string | null = null;
  readonly tagName: string;

  constructor(tagName: string) { this.tagName = tagName; }

  get className(): string { return this.attributes.get("class") ?? ""; }
  set className(value: string) { this.attributes.set("class", value); }

  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  setAttributeNS(_namespace: string | null, qualifiedName: string, value: string): void { this.attributes.set(qualifiedName, value); }
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  hasAttribute(name: string): boolean { return this.attributes.has(name); }

  append(...nodes: FakeNode[]): void {
    for (const node of nodes) { node.parent = this; this.children.push(node); }
  }
  appendChild(node: FakeNode): FakeNode { this.append(node); return node; }
  replaceChildren(...nodes: FakeNode[]): void { this.children.splice(0); this.append(...nodes); }
  remove(): void { if (this.parent) { const index = this.parent.children.indexOf(this); if (index >= 0) this.parent.children.splice(index, 1); this.parent = null; } }
  removeChild(node: FakeNode): FakeNode { const index = this.children.indexOf(node); if (index >= 0) this.children.splice(index, 1); node.parent = null; return node; }

  findByClass(className: string): FakeNode[] {
    return [
      ...(this.className.split(/\s+/u).filter(Boolean).includes(className) ? [this] : []),
      ...this.children.flatMap((child) => child.findByClass(className)),
    ];
  }
  findByTag(tagName: string): FakeNode[] {
    return [
      ...(this.tagName === tagName ? [this] : []),
      ...this.children.flatMap((child) => child.findByTag(tagName)),
    ];
  }
}

class FakeElement extends FakeNode {
  clientWidth = 1200;
}
class FakeHTMLElement extends FakeElement {}

const fakeDocument = {
  activeElement: null as FakeNode | null,
  createElement(tagName: string): FakeHTMLElement { return new FakeHTMLElement(tagName); },
  createElementNS(_namespace: string | null, qualifiedName: string): FakeElement { return new FakeElement(qualifiedName); },
};

function installFakeDom(): () => void {
  const globals = globalThis as unknown as { document?: Document; HTMLElement?: typeof HTMLElement };
  const originalDocument = globals.document;
  const originalHTMLElement = globals.HTMLElement;
  globals.document = fakeDocument as unknown as Document;
  globals.HTMLElement = FakeHTMLElement as unknown as typeof HTMLElement;
  return () => {
    if (originalDocument === undefined) delete globals.document;
    else globals.document = originalDocument;
    if (originalHTMLElement === undefined) delete globals.HTMLElement;
    else globals.HTMLElement = originalHTMLElement;
    fakeDocument.activeElement = null;
  };
}

test("generic Client Registry Runtime Consumer sequence preserves substitutions and deterministic wide/narrow geometry", () => {
  const result = createD3SequenceRenderModel(fixture, { reducedMotion: true, interactionPolicy: "static" });
  assert.ok(result.model);
  if (!result.model) return;
  const wide = createD3SequenceLayout(result.model, 960); const narrow = createD3SequenceLayout(result.model, 480);
  assert.equal(wide.compact, false); assert.equal(narrow.compact, true);
  assert.deepEqual(wide.lanes.map((lane) => lane.roleId), ["client", "registry", "runtime", "consumer"]);
  assert.deepEqual(result.model.states[0]?.participantBindings?.map((binding) => binding.label), ["Template", "Web UI"]);
  assert.deepEqual(createD3SequenceLayout(result.model, 960), wide);
  assert.ok(wide.lanes.every((lane, index) => index === 0 || lane.x > wide.lanes[index - 1]!.x));
  assert.ok(wide.messages.every((message, index) => index === 0 || message.y > wide.messages[index - 1]!.y));
  assert.ok(narrow.lanes.every((lane, index) => index === 0 || lane.y > narrow.lanes[index - 1]!.y));
  assert.ok(narrow.messages.every((message) => message.y >= 24 && message.y <= narrow.height));
  assert.match(result.model.staticFallback, /Template/);
  assert.match(sequenceLayoutDataAttributes(narrow).join(" "), /mode:compact/);
});

test("participant cards derive width from the longest authored or bound label", () => {
  const longFixture: DiagramBlock = {
    ...fixture,
    participantRoles: [
      { id: "short", label: "A", source },
      { id: "gateway", label: "Semantic Gateway", source },
    ],
    messages: [{ id: "call", sourceRoleId: "short", targetRoleId: "gateway", label: "call", source }],
    states: [{ id: "bound-long", label: "Bound", source, sharedEdgeAnnotations: [], activeMessageIds: ["call"], participantBindings: [
      { roleId: "short", participantId: "implementation", label: "Long Bound Implementation", source },
    ] }],
  };
  const result = createD3SequenceRenderModel(longFixture, { reducedMotion: true, interactionPolicy: "static" });
  assert.ok(result.model);
  if (!result.model) return;
  const wide = createD3SequenceLayout(result.model, 960);
  assert.ok(wide.lanes.find((lane) => lane.roleId === "short")!.cardWidth > 144);
  assert.ok(wide.lanes.find((lane) => lane.roleId === "gateway")!.cardWidth > 144);
  assert.deepEqual(wide.lanes.map((lane) => lane.toneIndex), [0, 1]);
});

test("compact sequence layout stacks participants vertically without overlap", () => {
  const result = createD3SequenceRenderModel(fixture, { reducedMotion: true, interactionPolicy: "static" });
  assert.ok(result.model);
  if (!result.model) return;
  const compact = createD3SequenceLayout(result.model, 480);
  assert.equal(compact.compact, true);
  const cardHeight = 36;
  for (let index = 0; index < compact.lanes.length; index += 1) {
    const lane = compact.lanes[index]!;
    assert.equal(lane.x, 240);
    assert.ok(lane.y > 0);
    if (index > 0) {
      const previous = compact.lanes[index - 1]!;
      assert.ok(lane.y - previous.y >= cardHeight + 16, "participants must not overlap vertically");
    }
  }
});

function cardBounds(lane: { x: number; y: number }, cardWidth: number, cardHeight: number): { minX: number; maxX: number; minY: number; maxY: number } {
  return {
    minX: lane.x - cardWidth / 2,
    maxX: lane.x + cardWidth / 2,
    minY: lane.y - cardHeight / 2,
    maxY: lane.y + cardHeight / 2,
  };
}

function segmentIntersectsCardInterior(
  x1: number, y1: number, x2: number, y2: number,
  rect: { minX: number; maxX: number; minY: number; maxY: number },
): boolean {
  if (y1 === y2) {
    return y1 > rect.minY && y1 < rect.maxY &&
      Math.min(x1, x2) < rect.maxX && Math.max(x1, x2) > rect.minX;
  }
  return x1 > rect.minX && x1 < rect.maxX &&
    Math.min(y1, y2) < rect.maxY && Math.max(y1, y2) > rect.minY;
}

test("compact sequence layout routes messages orthogonally outside participant cards", () => {
  const result = createD3SequenceRenderModel(directionFixture, { reducedMotion: true, interactionPolicy: "static" });
  assert.ok(result.model);
  if (!result.model) return;
  const compact = createD3SequenceLayout(result.model, 480);
  const laneById = new Map(compact.lanes.map((lane) => [lane.roleId, lane]));
  const cardWidth = 120;
  const cardHeight = 32;
  const cardColumnLeft = compact.width / 2 - cardWidth / 2;
  const cardColumnRight = compact.width / 2 + cardWidth / 2;
  const rightGutter = compact.width - 24;
  const leftGutter = 24;

  for (const message of compact.messages) {
    const source = laneById.get(message.sourceRoleId)!;
    const target = laneById.get(message.targetRoleId)!;
    assert.ok(message.path.length >= 2, `message ${message.id} must have a path`);
    const start = message.path[0]!;
    const end = message.path[message.path.length - 1]!;
    assert.equal(start.y, source.y);

    const sourceIndex = compact.lanes.indexOf(source);
    const targetIndex = compact.lanes.indexOf(target);
    if (sourceIndex < targetIndex) {
      assert.equal(start.x, source.x + source.cardWidth / 2, `forward ${message.id} must start at the source right edge`);
      assert.equal(end.x, target.x + target.cardWidth / 2, `forward ${message.id} must end at the target right edge`);
      assert.equal(end.y, target.y);
      assert.ok(message.path.slice(1, -1).every((point) => point.x === rightGutter), `forward ${message.id} must use the right gutter`);
    } else if (sourceIndex > targetIndex) {
      assert.equal(start.x, source.x - source.cardWidth / 2, `reverse ${message.id} must start at the source left edge`);
      assert.equal(end.x, target.x - target.cardWidth / 2, `reverse ${message.id} must end at the target left edge`);
      assert.equal(end.y, target.y);
      assert.ok(message.path.slice(1, -1).every((point) => point.x === leftGutter), `reverse ${message.id} must use the left gutter`);
    } else {
      assert.equal(start.x, source.x + source.cardWidth / 2, `self ${message.id} must attach at the participant right edge`);
      assert.equal(end.x, source.x + source.cardWidth / 2, `self ${message.id} terminal arrow must attach beside the participant`);
      assert.ok(end.y > source.y + cardHeight / 2, `self ${message.id} terminal arrow must remain below the participant card`);
    }

    for (let index = 1; index < message.path.length; index += 1) {
      const previous = message.path[index - 1]!;
      const current = message.path[index]!;
      assert.ok(
        previous.x === current.x || previous.y === current.y,
        `message ${message.id} segment ${index - 1} must be axis-aligned`,
      );
    }

    for (const lane of compact.lanes) {
      const rect = cardBounds(lane, lane.cardWidth, lane.cardHeight);
      for (let index = 1; index < message.path.length; index += 1) {
        const previous = message.path[index - 1]!;
        const current = message.path[index]!;
        assert.ok(
          !segmentIntersectsCardInterior(previous.x, previous.y, current.x, current.y, rect),
          `message ${message.id} segment ${index - 1} must not intersect ${lane.roleId} card interior`,
        );
      }
    }
  }
});

test("compact sequence self-message stays beside its participant", () => {
  const selfFixture: DiagramBlock = {
    ...fixture,
    messages: [{ id: "self", sourceRoleId: "client", targetRoleId: "client", label: "self-call", source }],
  };
  const result = createD3SequenceRenderModel(selfFixture, { reducedMotion: true, interactionPolicy: "static" });
  assert.ok(result.model);
  if (!result.model) return;
  const compact = createD3SequenceLayout(result.model, 480);
  assert.equal(compact.messages.length, 1);
  const message = compact.messages[0]!;
  const client = compact.lanes.find((lane) => lane.roleId === "client")!;
  assert.ok(message.y > client.y + 16, "self-message must sit below the participant card, not through it");
  assert.equal(message.path[0]!.x, message.path[message.path.length - 1]!.x);
  assert.equal(message.path[0]!.y, client.y);
});

test("sequence runtime mounts deterministic layout and applies only authored message states", () => {
  const updates: Array<{ width: number; stateId: string | undefined }> = [];
  const runtime: D3SequenceRuntimePort = {
    measureHost() { return 960; },
    mount(_host, _model, layout, stateId) { updates.push({ width: layout.width, stateId }); return { update(next, nextStateId) { updates.push({ width: next.width, stateId: nextStateId }); }, destroy() {} }; },
  };
  const component = mountD3SequenceDiagram({}, fixture, { reducedMotion: true, interactionPolicy: "static" }, runtime);
  assert.ok("model" in component && !("diagnostics" in component));
  if (!("model" in component) || "diagnostics" in component) return;
  component.setActiveState("bound");
  component.resize(480);
  assert.deepEqual(updates, [{ width: 960, stateId: undefined }, { width: 960, stateId: "bound" }, { width: 480, stateId: "bound" }]);
  assert.deepEqual([...resolveD3SequenceState(component.model, "bound").activeMessageIds], ["discover", "resolve", "provide"]);
});

const directionFixture: DiagramBlock = {
  ...fixture,
  messages: [
    { id: "forward", sourceRoleId: "client", targetRoleId: "registry", label: "forward", source },
    { id: "reverse", sourceRoleId: "registry", targetRoleId: "client", label: "reverse", source },
    { id: "self", sourceRoleId: "client", targetRoleId: "client", label: "self", source },
  ],
};

function mountSequenceWithFakeDom(hostWidth: number): { host: FakeHTMLElement; destroy: () => void } {
  const restoreDom = installFakeDom();
  const host = new FakeHTMLElement("div");
  host.clientWidth = hostWidth;
  const component = mountD3SequenceDiagram(host, directionFixture, { reducedMotion: true, interactionPolicy: "static" });
  assert.ok("model" in component && !("diagnostics" in component));
  return { host, destroy: () => { component.destroy(); restoreDom(); } };
}

test("sequence SVG runtime renders direction markers for wide and compact modes", () => {
  for (const hostWidth of [960, 480]) {
    const { host, destroy } = mountSequenceWithFakeDom(hostWidth);
    const marker = host.findByTag("marker")[0];
    assert.ok(marker, `mode ${hostWidth} should define an arrow marker`);
    const markerId = marker.getAttribute("id");
    assert.ok(markerId);
    const paths = host.findByClass("d3-sequence-message-line");
    assert.equal(paths.length, 3);
    for (const path of paths) {
      const markerEnd = path.getAttribute("marker-end");
      assert.equal(markerEnd, `url(#${markerId})`, "message path must reference the arrow marker");
    }
    destroy();
  }
});

test("sequence SVG marker ids are unique per mounted diagram", () => {
  const restoreDom = installFakeDom();
  try {
    const hostA = new FakeHTMLElement("div");
    const hostB = new FakeHTMLElement("div");
    const componentA = mountD3SequenceDiagram(hostA, directionFixture, { reducedMotion: true, interactionPolicy: "static" });
    const componentB = mountD3SequenceDiagram(hostB, directionFixture, { reducedMotion: true, interactionPolicy: "static" });
    assert.ok("model" in componentA && !("diagnostics" in componentA));
    assert.ok("model" in componentB && !("diagnostics" in componentB));
    const idA = hostA.findByTag("marker")[0]?.getAttribute("id");
    const idB = hostB.findByTag("marker")[0]?.getAttribute("id");
    assert.ok(idA);
    assert.ok(idB);
    assert.notEqual(idA, idB);
    componentA.destroy();
    componentB.destroy();
  } finally {
    restoreDom();
  }
});

test("sequence SVG forward and reverse message paths terminate at the authored target", () => {
  const { host, destroy } = mountSequenceWithFakeDom(960);
  const messages = host.findByClass("d3-sequence-message");
  const forward = messages.find((el) => el.getAttribute("data-message-id") === "forward");
  const reverse = messages.find((el) => el.getAttribute("data-message-id") === "reverse");
  assert.ok(forward);
  assert.ok(reverse);
  assert.equal(forward.getAttribute("data-target-role-id"), "registry");
  assert.equal(reverse.getAttribute("data-target-role-id"), "client");
  const forwardPath = forward.findByClass("d3-sequence-message-line")[0]?.getAttribute("d");
  const reversePath = reverse.findByClass("d3-sequence-message-line")[0]?.getAttribute("d");
  assert.match(forwardPath ?? "", /M\s+\d+\s+\d+\s+L\s+\d+\s+\d+/);
  assert.match(reversePath ?? "", /M\s+\d+\s+\d+\s+L\s+\d+\s+\d+/);
  destroy();
});

test("sequence SVG compact paths do not intersect participant cards", () => {
  const { host, destroy } = mountSequenceWithFakeDom(480);
  const cards = host.findByClass("d3-sequence-participant-card");
  const messages = host.findByClass("d3-sequence-message-line");
  assert.ok(cards.length > 0);
  assert.ok(messages.length > 0);
  for (const message of messages) {
    const d = message.getAttribute("d") ?? "";
    assert.match(d, /M/);
    assert.ok(!d.includes("NaN"));
  }
  destroy();
});
