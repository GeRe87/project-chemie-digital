import assert from "node:assert/strict";
import test from "node:test";
import type { KnowledgeNetworkDocument } from "../../core/src/index.ts";
import {
  canonicalSerializeD3RenderModel,
  createD3KnowledgeNetworkRenderModel,
  mountD3KnowledgeNetwork,
  type D3KnowledgeNetworkRenderModel,
  type D3RuntimePort,
} from "../src/index.ts";

const source = [{ resourceId: "content:standard-deviation", provenanceIds: ["prov:reviewed"] }] as const;

const document: KnowledgeNetworkDocument = {
  version: "1.0",
  id: "knowledge-network:standard-deviation",
  datasetIdentity: "dataset:standard-deviation:v1",
  projection: {
    version: "1.0",
    rootEntityIds: ["ex:standard-deviation"],
    includedPredicates: ["cd:hasDefinition"],
    maximumDepth: 1,
    groupingPolicy: "semantic-type",
  },
  nodes: [
    { id: "node:definition", semanticEntityId: "ex:definition", semanticTypes: ["cd:Definition"], label: "Definition", source, groupIds: ["group:definition"] },
    { id: "node:concept", semanticEntityId: "ex:standard-deviation", semanticTypes: ["cd:Concept"], label: "Standard deviation", source, groupIds: ["group:concept"] },
  ],
  edges: [
    { id: "edge:definition", sourceNodeId: "node:concept", targetNodeId: "node:definition", predicateId: "cd:hasDefinition", label: "has definition", directed: true, source },
  ],
  groups: [
    { id: "group:definition", label: "Definition", memberNodeIds: ["node:definition"] },
    { id: "group:concept", label: "Concept", memberNodeIds: ["node:concept"] },
  ],
  accessibility: {
    label: "Standard-deviation knowledge network",
    description: "Two nodes and one relation.",
    nodeReadingOrder: ["node:concept", "node:definition"],
    edgeReadingOrder: ["edge:definition"],
    staticFallback: "Nodes:\n- Standard deviation\n- Definition\nRelations:\n- Standard deviation — has definition → Definition",
  },
  source,
};

const options = { reducedMotion: true, interactionPolicy: "keyboard" as const };

test("maps deterministically without mutating the source document", () => {
  const before = JSON.stringify(document);
  const first = createD3KnowledgeNetworkRenderModel(document, options);
  const second = createD3KnowledgeNetworkRenderModel(structuredClone(document), options);
  assert.deepEqual(first.diagnostics, []);
  assert.ok(first.model);
  assert.ok(second.model);
  assert.equal(canonicalSerializeD3RenderModel(first.model), canonicalSerializeD3RenderModel(second.model));
  assert.equal(JSON.stringify(document), before);
  assert.deepEqual(first.model.nodeReadingOrder, document.accessibility.nodeReadingOrder);
  assert.equal(first.model.nodes[0].semanticEntityId, "ex:standard-deviation");
  assert.deepEqual(first.model.nodes[0].source, source);
  assert.deepEqual(first.model.groups.map((group) => group.id), ["group:concept", "group:definition"]);
});

test("supports empty and minimal networks", () => {
  const empty: KnowledgeNetworkDocument = {
    ...document,
    id: "knowledge-network:empty",
    nodes: [],
    edges: [],
    groups: undefined,
    accessibility: { ...document.accessibility, nodeReadingOrder: [], edgeReadingOrder: [], staticFallback: "Nodes:\n- None\nRelations:\n- None" },
  };
  const result = createD3KnowledgeNetworkRenderModel(empty, { reducedMotion: false, interactionPolicy: "static" });
  assert.ok(result.model);
  assert.deepEqual(result.model.nodes, []);
  assert.deepEqual(result.model.edges, []);
  assert.deepEqual(result.model.groups, []);
});

test("rejects invalid documents and adapter options atomically", () => {
  const invalidDocument = { ...document, edges: [{ ...document.edges[0], targetNodeId: "missing" }] };
  const invalidResult = createD3KnowledgeNetworkRenderModel(invalidDocument, options);
  assert.equal(invalidResult.model, undefined);
  assert.equal(invalidResult.diagnostics[0].code, "INVALID_KNOWLEDGE_NETWORK_DOCUMENT");

  const invalidOptions = createD3KnowledgeNetworkRenderModel(document, { reducedMotion: true, interactionPolicy: "zoom" as "keyboard" });
  assert.equal(invalidOptions.model, undefined);
  assert.equal(invalidOptions.diagnostics[0].code, "INVALID_ADAPTER_OPTIONS");
});

test("owns repeated render cleanup and keyboard focus lifecycle", () => {
  const mountedModels: D3KnowledgeNetworkRenderModel[] = [];
  const focused: string[] = [];
  let destroys = 0;
  const runtime: D3RuntimePort = {
    mount(_host, model) {
      mountedModels.push(model);
      return {
        focusNode(nodeId) { focused.push(nodeId); },
        destroy() { destroys += 1; },
      };
    },
  };
  const component = mountD3KnowledgeNetwork({}, document, options, runtime);
  assert.ok("handleKey" in component);
  assert.equal(component.handleKey("ArrowRight"), true);
  assert.deepEqual(focused, ["node:definition"]);
  assert.ok(component.render(structuredClone(document)).model);
  assert.equal(destroys, 1);
  component.destroy();
  component.destroy();
  assert.equal(destroys, 2);
  assert.equal(mountedModels.length, 2);
});

test("performs no network requests", () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests += 1; throw new Error("network forbidden"); };
  try {
    assert.ok(createD3KnowledgeNetworkRenderModel(document, options).model);
    assert.equal(requests, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
