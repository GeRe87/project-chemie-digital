import assert from "node:assert/strict";
import test from "node:test";
import type { Scene } from "../../../packages/core/src/scene-document.ts";
import type { RdfDatasetSnapshot } from "../../../packages/core/src/knowledge-network.ts";
import type { D3KnowledgeNetworkOptions } from "../../../packages/renderer-d3/src/index.ts";
import {
  createGraphSummaryModel,
  createGraphSummaryShellController,
  projectSceneSummary,
  sceneProjectionLanguage,
  type GraphSummaryModel,
  type GraphSummaryShellPort,
} from "../src/graph-summary-shell.ts";

const EX = "https://w3id.org/project-chemie-digital/resource/";
const CD = "https://w3id.org/project-chemie-digital/ontology/";
const source = [{ resourceId: `${EX}source` }] as const;
const snapshot: RdfDatasetSnapshot = {
  version: "1.0",
  identity: "dataset:test:1",
  source,
  supportedPredicates: [`${CD}hasDefinition`],
  entities: [
    { id: `${EX}standard-deviation`, label: "Standardabweichung", semanticTypes: [`${CD}Concept`], source },
    { id: `${EX}definition`, label: "Definition", semanticTypes: [`${CD}Definition`], source },
    { id: `${EX}variance`, label: "Varianz", semanticTypes: [`${CD}Concept`], source },
  ],
  statements: [
    { sourceEntityId: `${EX}standard-deviation`, predicateId: `${CD}hasDefinition`, targetEntityId: `${EX}definition`, predicateLabel: "hat Definition", source },
    { sourceEntityId: `${EX}variance`, predicateId: `${CD}hasDefinition`, targetEntityId: `${EX}standard-deviation`, predicateLabel: "hat Definition", source },
  ],
};
const scene: Scene = {
  id: `${EX}scene`,
  source,
  readingOrder: ["heading", "definition"],
  blocks: [
    { id: "heading", kind: "prose", text: "Standardabweichung", intent: { kind: "introduce" }, source: [{ resourceId: `${EX}standard-deviation`, relationPath: "skos:prefLabel@de" }] },
    { id: "definition", kind: "prose", text: "Definition", intent: { kind: "explain" }, source: [{ resourceId: `${EX}definition`, relationPath: `${CD}hasDefinition` }] },
  ],
};

test("derives graph-summary language from the authored scene selector", () => {
  assert.equal(sceneProjectionLanguage(scene), "de");
  const englishScene: Scene = {
    ...scene,
    blocks: scene.blocks.map((block) => block.id === "heading"
      ? { ...block, source: [{ resourceId: `${EX}standard-deviation`, relationPath: "skos:prefLabel@en" }] }
      : block),
  };
  assert.equal(sceneProjectionLanguage(englishScene), "en");
});

test("fails closed when a scene exposes conflicting authored languages", () => {
  const conflicting: Scene = {
    ...scene,
    blocks: scene.blocks.map((block) => block.id === "definition"
      ? { ...block, source: [{ resourceId: `${EX}definition`, relationPath: `${CD}hasDefinition@en` }] }
      : block),
  };
  assert.throws(() => sceneProjectionLanguage(conflicting), /conflicting authored languages: de, en/);
});

test("preserves an absolute predicate IRI as one relation-path element", () => {
  const document = projectSceneSummary(snapshot, scene);
  const model = createGraphSummaryModel(document);
  assert.deepEqual(model.selected.map((node) => node.label), ["Definition", "Standardabweichung"]);
  assert.deepEqual(model.related.map((node) => node.label), ["Varianz"]);
  assert.deepEqual(model.relations.map((relation) => relation.text), [
    "Standardabweichung — hat Definition → Definition",
    "Varianz — hat Definition → Standardabweichung",
  ]);
  assert.ok(model.selected.every((node) => Object.isFrozen(node)));
});

test("parses the compact multi-step canonical-runtime relation path deterministically", () => {
  const relatedPredicate = `${CD}relatedTo`;
  const compactSnapshot: RdfDatasetSnapshot = {
    ...snapshot,
    identity: "dataset:test:compact-path",
    supportedPredicates: [`${CD}hasDefinition`, relatedPredicate],
    statements: [
      ...snapshot.statements,
      { sourceEntityId: `${EX}definition`, predicateId: relatedPredicate, targetEntityId: `${EX}variance`, predicateLabel: "ist verwandt mit", source },
    ],
  };
  const compactScene: Scene = {
    ...scene,
    blocks: scene.blocks.map((block) => block.id === "definition"
      ? { ...block, source: [{ resourceId: "ex:definition", relationPath: "cd:hasDefinition/cd:relatedTo@de" }] }
      : block),
  };
  const document = projectSceneSummary(compactSnapshot, compactScene);
  assert.deepEqual([...new Set(document.edges.map((edge) => edge.predicateId))].sort(), [
    `${CD}hasDefinition`,
    relatedPredicate,
  ]);
});

class Port implements GraphSummaryShellPort {
  sceneId: string | null = scene.id;
  presentationVisible = true;
  mode: "graph" | "summary" | null = null;
  summary: GraphSummaryModel | null = null;
  graphDocumentId: string | null = null;
  graphOptions: D3KnowledgeNetworkOptions | null = null;
  graphKeyHandled = false;
  error = "";
  focused: "summary" | "graph" | "invoker" | null = null;
  focusedNodeId: string | null = null;
  graphShouldFail = false;
  currentSceneId(): string | null { return this.sceneId; }
  showPresentation(): void { this.presentationVisible = true; }
  hidePresentation(): void { this.presentationVisible = false; }
  renderSummary(model: GraphSummaryModel): void { this.summary = model; }
  renderGraph(document: { id: string }, options: D3KnowledgeNetworkOptions): void {
    if (this.graphShouldFail) throw new Error("graph render failed");
    this.graphDocumentId = document.id;
    this.graphOptions = options;
  }
  updateGraphMode(mode: "graph" | "summary"): void { this.mode = mode; }
  handleGraphKey(key: string): boolean { this.graphKeyHandled = key === "ArrowRight"; return this.graphKeyHandled; }
  showError(message: string): void { this.error = message; }
  focusSummaryHeading(): void { this.focused = "summary"; }
  focusGraphHeading(): void { this.focused = "graph"; }
  focusGraphNode(nodeId: string): void { this.focusedNodeId = nodeId; }
  focusInvoker(): void { this.focused = "invoker"; }
}

test("opens summary mode without losing presentation restoration", () => {
  const port = new Port();
  const controller = createGraphSummaryShellController({ documents: [{ scenes: [scene] }], snapshot, reducedMotion: false, port });
  controller.open();
  assert.equal(port.presentationVisible, false);
  assert.equal(port.mode, "summary");
  assert.equal(port.focused, "summary");
  assert.ok(port.summary);
  controller.close();
  assert.equal(port.presentationVisible, true);
  assert.equal(port.focused, "invoker");
});

test("opens visual graph mode with deterministic node focus", () => {
  const port = new Port();
  const controller = createGraphSummaryShellController({ documents: [{ scenes: [scene] }], snapshot, reducedMotion: false, port });
  controller.openGraph();
  assert.equal(port.presentationVisible, false);
  assert.equal(port.mode, "graph");
  assert.equal(port.focused, "graph");
  assert.ok(port.graphDocumentId);
  assert.equal(port.graphOptions?.interactionPolicy, "keyboard");
  assert.ok(port.focusedNodeId);
  assert.match(port.focusedNodeId ?? "", /^kn-node:/);
});

test("supports reduced-motion driven static graph mode", () => {
  const port = new Port();
  const controller = createGraphSummaryShellController({ documents: [{ scenes: [scene] }], snapshot, reducedMotion: true, port });
  controller.openGraph();
  assert.equal(port.graphOptions?.interactionPolicy, "static");
  assert.equal(port.graphOptions?.reducedMotion, true);
});

test("switches between summary and graph and forwards graph keyboard events", () => {
  const port = new Port();
  const controller = createGraphSummaryShellController({ documents: [{ scenes: [scene] }], snapshot, reducedMotion: false, port });
  controller.open();
  controller.switchToGraph();
  assert.equal(port.mode, "graph");
  assert.equal(controller.handleGraphKey("ArrowRight"), true);
  assert.equal(port.graphKeyHandled, true);
  controller.switchToSummary();
  assert.equal(port.mode, "summary");
  assert.equal(controller.handleGraphKey("ArrowRight"), false);
});

test("keeps the presentation visible on scene/projection failure", () => {
  const port = new Port();
  port.sceneId = `${EX}missing-scene`;
  const controller = createGraphSummaryShellController({ documents: [{ scenes: [scene] }], snapshot, reducedMotion: false, port });
  controller.open();
  assert.equal(port.presentationVisible, true);
  assert.match(port.error, /nicht bestimmt/);
  assert.equal(port.summary, null);
});

test("falls back to summary if graph rendering fails", () => {
  const port = new Port();
  port.graphShouldFail = true;
  const controller = createGraphSummaryShellController({ documents: [{ scenes: [scene] }], snapshot, reducedMotion: false, port });
  controller.open();
  controller.switchToGraph();
  assert.equal(port.mode, "summary");
  assert.equal(port.focused, "summary");
  assert.match(port.error, /graph render failed/i);
  assert.ok(port.summary);
});

test("updates graph interaction mode when static mode is toggled", () => {
  const port = new Port();
  const controller = createGraphSummaryShellController({ documents: [{ scenes: [scene] }], snapshot, reducedMotion: false, port });
  controller.openGraph();
  assert.equal(port.graphOptions?.interactionPolicy, "keyboard");
  controller.setStaticMode(true);
  assert.equal(port.graphOptions?.interactionPolicy, "static");
  controller.setStaticMode(false);
  assert.equal(port.graphOptions?.interactionPolicy, "keyboard");
});

test("controller cleanup is idempotent and blocks later mutations", () => {
  const port = new Port();
  const controller = createGraphSummaryShellController({ documents: [{ scenes: [scene] }], snapshot, reducedMotion: false, port });
  controller.destroy();
  controller.destroy();
  controller.open();
  controller.openGraph();
  controller.switchToGraph();
  controller.switchToSummary();
  controller.setStaticMode(true);
  assert.equal(port.summary, null);
  assert.equal(port.presentationVisible, true);
});
