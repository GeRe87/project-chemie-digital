import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalSerializeSceneKnowledgeNetworkDocument,
  projectSceneKnowledgeNetwork,
} from "../src/scene-graph-projector.ts";
import type { RdfDatasetSnapshot } from "../src/knowledge-network.ts";
import type { SceneGraphProjectionRequest } from "../src/scene-graph-view-contracts.ts";

const EX = "https://w3id.org/project-chemie-digital/resource/";
const CD = "https://w3id.org/project-chemie-digital/ontology/";
const source = [{ resourceId: `${EX}source`, provenanceIds: [`${EX}review`] }] as const;

const fixture: RdfDatasetSnapshot = {
  version: "1.0",
  identity: "dataset:scene:v1",
  source,
  supportedPredicates: [`${CD}hasDefinition`, `${CD}hasSource`, `${CD}hasPrerequisite`],
  entities: [
    { id: `${EX}standard-deviation`, label: "Standardabweichung", semanticTypes: [`${CD}Concept`], source },
    { id: `${EX}definition`, label: "Definition", semanticTypes: [`${CD}Definition`], source },
    { id: `${EX}source`, label: "Quelle", semanticTypes: [`${CD}Source`], source },
    { id: `${EX}variance`, label: "Varianz", semanticTypes: [`${CD}Concept`], source },
    { id: `${EX}deep`, label: "Tiefe Ressource", semanticTypes: [`${CD}Concept`], source },
  ],
  statements: [
    { sourceEntityId: `${EX}standard-deviation`, predicateId: `${CD}hasDefinition`, targetEntityId: `${EX}definition`, predicateLabel: "hat Definition", source },
    { sourceEntityId: `${EX}definition`, predicateId: `${CD}hasSource`, targetEntityId: `${EX}source`, predicateLabel: "hat Quelle", source },
    { sourceEntityId: `${EX}variance`, predicateId: `${CD}hasPrerequisite`, targetEntityId: `${EX}standard-deviation`, predicateLabel: "ist Voraussetzung für", source },
    { sourceEntityId: `${EX}variance`, predicateId: `${CD}hasPrerequisite`, targetEntityId: `${EX}deep`, predicateLabel: "ist Voraussetzung für", source },
  ],
};

const request: SceneGraphProjectionRequest = {
  version: "1.0",
  sceneId: `${EX}scene-definition`,
  sceneRevision: "dataset:scene:v1",
  language: "de",
  directRelationAllowlist: { version: "fixture-1", relationIds: [`${CD}hasDefinition`, `${CD}hasPrerequisite`] },
  bindings: [
    { version: "1.0", blockId: "definition", resourceIds: [`${EX}standard-deviation`, `${EX}definition`], provenanceResourceIds: [`${EX}source`], relationPath: [`${CD}hasDefinition`] },
    { version: "1.0", blockId: "heading", resourceIds: [`${EX}standard-deviation`], provenanceResourceIds: [], relationPath: [] },
  ],
};

test("projects selected resources plus incoming and outgoing allowlisted one-hop neighbors", () => {
  const result = projectSceneKnowledgeNetwork(fixture, request);
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.document);
  const byId = new Map(result.document.nodes.map((node) => [node.semanticEntityId, node]));
  assert.equal(byId.get(`${EX}standard-deviation`)?.classification, "selected");
  assert.equal(byId.get(`${EX}definition`)?.classification, "selected");
  assert.equal(byId.get(`${EX}source`)?.classification, "selected");
  assert.equal(byId.get(`${EX}variance`)?.classification, "related");
  assert.equal(byId.has(`${EX}deep`), false);
  assert.deepEqual(byId.get(`${EX}standard-deviation`)?.blockIds, ["definition", "heading"]);
  assert.equal(result.document.edges.some((edge) => edge.predicateId === `${CD}hasSource`), false);
  assert.equal(result.document.edges.some((edge) => edge.sourceNodeId.includes(encodeURIComponent(`${EX}variance`))), true);
});

test("is byte-stable across entity, statement, binding and allowlist order and deduplicates statements", () => {
  const duplicate = { ...fixture.statements[0], source: [{ resourceId: `${EX}second-source` }] };
  const first = projectSceneKnowledgeNetwork({ ...fixture, statements: [...fixture.statements, duplicate] }, request).document!;
  const second = projectSceneKnowledgeNetwork(
    { ...fixture, entities: [...fixture.entities].reverse(), statements: [duplicate, ...fixture.statements].reverse(), supportedPredicates: [...fixture.supportedPredicates].reverse() },
    { ...request, bindings: [...request.bindings].reverse(), directRelationAllowlist: { ...request.directRelationAllowlist, relationIds: [...request.directRelationAllowlist.relationIds].reverse() } },
  ).document!;
  assert.equal(canonicalSerializeSceneKnowledgeNetworkDocument(first), canonicalSerializeSceneKnowledgeNetworkDocument(second));
  assert.equal(first.edges.filter((edge) => edge.predicateId === `${CD}hasDefinition`).length, 1);
  assert.equal(first.edges.find((edge) => edge.predicateId === `${CD}hasDefinition`)?.source.length, 2);
});

test("fails atomically for invalid requests and incomplete or ambiguous dataset metadata", () => {
  const cases: Array<[RdfDatasetSnapshot, SceneGraphProjectionRequest, string]> = [
    [fixture, { ...request, bindings: [{ ...request.bindings[0], resourceIds: [`${EX}missing`] }] }, "UNKNOWN_SELECTED_RESOURCE"],
    [fixture, { ...request, directRelationAllowlist: { version: "x", relationIds: [`${CD}unknown`] } }, "UNSUPPORTED_PREDICATE"],
    [{ ...fixture, entities: [...fixture.entities, fixture.entities[0]] }, request, "AMBIGUOUS_DATASET_METADATA"],
    [{ ...fixture, entities: fixture.entities.map((entity) => entity.id === `${EX}definition` ? { ...entity, label: "" } : entity) }, request, "INVALID_DATASET"],
    [fixture, { ...request, sceneId: "not an iri" }, "INVALID_REQUEST"],
  ];
  for (const [dataset, projectionRequest, code] of cases) {
    const result = projectSceneKnowledgeNetwork(dataset, projectionRequest);
    assert.equal(result.document, undefined);
    assert.equal(result.diagnostics.length, 1);
    assert.equal(result.diagnostics[0].code, code);
  }
});

test("preserves scene revision, block bindings, relation paths and provenance in immutable renderer-neutral output", async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests += 1; throw new Error("network forbidden"); };
  try {
    const document = projectSceneKnowledgeNetwork(fixture, request).document!;
    assert.equal(document.sceneContext.sceneRevision, request.sceneRevision);
    assert.deepEqual(document.nodes.find((node) => node.semanticEntityId === `${EX}definition`)?.relationPaths, [[`${CD}hasDefinition`]]);
    assert.ok(document.source.length > 0);
    assert.equal(Object.isFrozen(document), true);
    assert.equal(Object.isFrozen(document.nodes), true);
    assert.equal(requests, 0);
    const serialized = canonicalSerializeSceneKnowledgeNetworkDocument(document);
    for (const forbidden of ["Reveal", "React", "D3", "DOM", "force-layout"]) assert.equal(serialized.includes(forbidden), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
