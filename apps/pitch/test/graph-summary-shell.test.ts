import assert from "node:assert/strict";
import test from "node:test";
import type { Scene } from "../../../packages/core/src/scene-document.ts";
import type { RdfDatasetSnapshot } from "../../../packages/core/src/knowledge-network.ts";
import { createGraphSummaryModel, createGraphSummaryShellController, projectSceneSummary, type GraphSummaryModel, type GraphSummaryShellPort } from "../src/graph-summary-shell.ts";

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
    { id: "heading", kind: "prose", text: "Standardabweichung", intent: { kind: "introduce" }, source: [{ resourceId: `${EX}standard-deviation` }] },
    { id: "definition", kind: "prose", text: "Definition", intent: { kind: "explain" }, source: [{ resourceId: `${EX}definition`, relationPath: `${CD}hasDefinition` }] },
  ],
};

test("preserves an absolute predicate IRI as one relation-path element", () => {
  const document = projectSceneSummary(snapshot, scene);
  const model = createGraphSummaryModel(document);
  assert.deepEqual(model.selected.map((node) => node.label), ["Definition", "Standardabweichung"]);
  assert.deepEqual(model.related.map((node) => node.label), ["Varianz"]);
  assert.deepEqual(model.relations.map((relation) => relation.text), [
    "Varianz — hat Definition → Standardabweichung",
    "Standardabweichung — hat Definition → Definition",
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
  summary: GraphSummaryModel | null = null;
  error = "";
  focused: "summary" | "invoker" | null = null;
  currentSceneId(): string | null { return this.sceneId; }
  showPresentation(): void { this.presentationVisible = true; }
  hidePresentation(): void { this.presentationVisible = false; }
  renderSummary(model: GraphSummaryModel): void { this.summary = model; }
  showError(message: string): void { this.error = message; }
  focusSummaryHeading(): void { this.focused = "summary"; }
  focusInvoker(): void { this.focused = "invoker"; }
}

test("switches without losing presentation state and restores focus", () => {
  const port = new Port();
  const controller = createGraphSummaryShellController({ documents: [{ scenes: [scene] }], snapshot, port });
  controller.open();
  assert.equal(port.presentationVisible, false);
  assert.equal(port.focused, "summary");
  assert.ok(port.summary);
  controller.close();
  assert.equal(port.presentationVisible, true);
  assert.equal(port.focused, "invoker");
});

test("keeps the last valid presentation visible on scene or projection failure", () => {
  const port = new Port();
  port.sceneId = `${EX}missing-scene`;
  const controller = createGraphSummaryShellController({ documents: [{ scenes: [scene] }], snapshot, port });
  controller.open();
  assert.equal(port.presentationVisible, true);
  assert.match(port.error, /nicht bestimmt/);
  assert.equal(port.summary, null);
});

test("controller cleanup is idempotent and blocks later mutations", () => {
  const port = new Port();
  const controller = createGraphSummaryShellController({ documents: [{ scenes: [scene] }], snapshot, port });
  controller.destroy();
  controller.destroy();
  controller.open();
  assert.equal(port.summary, null);
  assert.equal(port.presentationVisible, true);
});
