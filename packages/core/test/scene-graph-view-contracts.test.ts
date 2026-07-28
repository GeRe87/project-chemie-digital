import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  SCENE_GRAPH_PROJECTION_REQUEST_VERSION,
  SCENE_RESOURCE_BINDING_VERSION,
  VIEW_SWITCH_STATE_VERSION,
  SceneGraphViewContractError,
  canonicalSerializeSceneGraphProjectionRequest,
  canonicalSerializeViewSwitchState,
  canonicalizeSceneGraphProjectionRequest,
  canonicalizeSceneResourceBinding,
  canonicalizeViewSwitchState,
  reconcileViewSwitchState,
  type SceneGraphProjectionRequest,
  type ViewSwitchState,
} from "../src/scene-graph-view-contracts.ts";

const iri = (local: string): string => `https://w3id.org/project-chemie-digital/resource/${local}`;
const relation = (local: string): string => `https://w3id.org/project-chemie-digital/vocab/${local}`;

function projectionRequest(): SceneGraphProjectionRequest {
  return {
    version: SCENE_GRAPH_PROJECTION_REQUEST_VERSION,
    sceneId: iri("scene-standard-deviation-formula"),
    sceneRevision: "sha256:scene-revision-1",
    language: "DE",
    directRelationAllowlist: {
      version: "1.0",
      relationIds: [relation("hasSource"), relation("hasDefinition")],
    },
    bindings: [
      {
        version: SCENE_RESOURCE_BINDING_VERSION,
        blockId: "block:formula",
        resourceIds: [iri("sample-sd-formula"), iri("standard-deviation")],
        provenanceResourceIds: [iri("source-nist-dispersion")],
        relationPath: [relation("selectsResource"), relation("hasMathematicalExpression")],
      },
      {
        version: SCENE_RESOURCE_BINDING_VERSION,
        blockId: "block:definition",
        resourceIds: [iri("standard-deviation"), iri("sd-definition-basic-de")],
        provenanceResourceIds: [iri("source-nist-dispersion")],
        relationPath: [relation("selectsResource"), relation("hasDefinition")],
      },
    ],
  };
}

function viewState(): ViewSwitchState {
  return {
    version: VIEW_SWITCH_STATE_VERSION,
    mode: "graph",
    sceneId: iri("scene-standard-deviation-formula"),
    sceneRevision: "sha256:scene-revision-1",
    presentationCursor: { blockId: "block:formula", fragmentId: "fragment:1" },
    graphCursor: {
      focusedResourceId: iri("sample-sd-formula"),
      expandedResourceIds: [iri("standard-deviation"), iri("sample-sd-formula")],
      visitedResourceIds: [iri("source-nist-dispersion"), iri("sample-sd-formula")],
    },
    returnFocus: { controlId: "view-switch", blockId: "block:formula" },
  };
}

function expectContractError(action: () => unknown, message: RegExp): void {
  assert.throws(action, (error: unknown) => error instanceof SceneGraphViewContractError && message.test(error.message));
}

test("canonical projection output is byte-identical for equivalent input order", () => {
  const first = projectionRequest();
  const second = structuredClone(first);
  second.bindings.reverse();
  second.bindings[0].resourceIds.reverse();
  second.bindings[0].provenanceResourceIds.reverse();
  second.directRelationAllowlist.relationIds.reverse();
  assert.equal(canonicalSerializeSceneGraphProjectionRequest(first), canonicalSerializeSceneGraphProjectionRequest(second));
});

test("canonicalizes resource and provenance identities lexically while preserving relation paths", () => {
  const binding = projectionRequest().bindings[0];
  const result = canonicalizeSceneResourceBinding({
    ...binding,
    resourceIds: [iri("z"), iri("a")],
    provenanceResourceIds: [iri("source-z"), iri("source-a")],
  });
  assert.deepEqual(result.resourceIds, [iri("a"), iri("z")]);
  assert.deepEqual(result.provenanceResourceIds, [iri("source-a"), iri("source-z")]);
  assert.deepEqual(result.relationPath, binding.relationPath);
});

test("rejects missing, relative, malformed and blank-node RDF identities", () => {
  for (const invalid of ["", "relative/path", "not an iri", "_:blank"]) {
    const request = projectionRequest();
    request.bindings[0].resourceIds = [invalid];
    expectContractError(() => canonicalizeSceneGraphProjectionRequest(request), /absolute RDF IRI|non-empty/);
  }
});

test("rejects duplicate block, resource and provenance identities", () => {
  const duplicateBlock = projectionRequest();
  duplicateBlock.bindings[1] = { ...duplicateBlock.bindings[1], blockId: duplicateBlock.bindings[0].blockId };
  expectContractError(() => canonicalizeSceneGraphProjectionRequest(duplicateBlock), /duplicate blockId/);

  const duplicateResource = projectionRequest();
  duplicateResource.bindings[0].resourceIds = [iri("standard-deviation"), iri("standard-deviation")];
  expectContractError(() => canonicalizeSceneGraphProjectionRequest(duplicateResource), /duplicate identities/);

  const duplicateProvenance = projectionRequest();
  duplicateProvenance.bindings[0].provenanceResourceIds = [iri("source"), iri("source")];
  expectContractError(() => canonicalizeSceneGraphProjectionRequest(duplicateProvenance), /duplicate identities/);
});

test("canonical view state is byte-identical for equivalent identity order", () => {
  const first = viewState();
  const second = structuredClone(first);
  second.graphCursor.expandedResourceIds.reverse();
  second.graphCursor.visitedResourceIds.reverse();
  assert.equal(canonicalSerializeViewSwitchState(first), canonicalSerializeViewSwitchState(second));
});

test("accepts matching revision state only when every referenced identity exists", () => {
  const state = canonicalizeViewSwitchState(viewState());
  const result = reconcileViewSwitchState(state, {
    sceneId: state.sceneId,
    sceneRevision: state.sceneRevision,
    availableResourceIds: [iri("sample-sd-formula"), iri("standard-deviation"), iri("source-nist-dispersion")],
    availableBlockIds: ["block:definition", "block:formula"],
  });
  assert.equal(result.revised, false);
  assert.deepEqual(result.state, state);
  assert.deepEqual(result.discardedResourceIds, []);
});

test("rejects an inconsistent same-revision resource or block snapshot", () => {
  const state = viewState();
  expectContractError(
    () => reconcileViewSwitchState(state, {
      sceneId: state.sceneId,
      sceneRevision: state.sceneRevision,
      availableResourceIds: [iri("sample-sd-formula"), iri("standard-deviation")],
      availableBlockIds: ["block:formula"],
    }),
    /same-revision snapshot is missing referenced resource identity/i,
  );

  expectContractError(
    () => reconcileViewSwitchState(state, {
      sceneId: state.sceneId,
      sceneRevision: state.sceneRevision,
      availableResourceIds: [iri("sample-sd-formula"), iri("standard-deviation"), iri("source-nist-dispersion")],
      availableBlockIds: ["block:definition"],
    }),
    /same-revision snapshot is missing referenced block identity/i,
  );
});

test("reconciles a new revision by stable identity and discards missing resources", () => {
  const result = reconcileViewSwitchState(viewState(), {
    sceneId: iri("scene-standard-deviation-formula"),
    sceneRevision: "sha256:scene-revision-2",
    availableResourceIds: [iri("standard-deviation")],
    availableBlockIds: ["block:definition"],
  });
  assert.equal(result.revised, true);
  assert.equal(result.state.sceneRevision, "sha256:scene-revision-2");
  assert.equal(result.state.graphCursor.focusedResourceId, null);
  assert.deepEqual(result.state.graphCursor.expandedResourceIds, [iri("standard-deviation")]);
  assert.equal(result.state.presentationCursor.blockId, null);
  assert.equal(result.state.presentationCursor.fragmentId, null);
  assert.deepEqual(result.discardedResourceIds, [iri("sample-sd-formula"), iri("source-nist-dispersion")]);
});

test("preserves a fragment only when its presentation block survives revision reconciliation", () => {
  const result = reconcileViewSwitchState(viewState(), {
    sceneId: iri("scene-standard-deviation-formula"),
    sceneRevision: "sha256:scene-revision-2",
    availableResourceIds: [iri("sample-sd-formula"), iri("standard-deviation"), iri("source-nist-dispersion")],
    availableBlockIds: ["block:formula"],
  });
  assert.equal(result.state.presentationCursor.blockId, "block:formula");
  assert.equal(result.state.presentationCursor.fragmentId, "fragment:1");
});

test("rejects state reconciliation across different scenes", () => {
  expectContractError(
    () => reconcileViewSwitchState(viewState(), {
      sceneId: iri("another-scene"),
      sceneRevision: "sha256:scene-revision-2",
      availableResourceIds: [],
      availableBlockIds: [],
    }),
    /different scene identity/,
  );
});

test("public contracts remain framework, layout and storage neutral", async () => {
  const source = (await readFile(new URL("../src/scene-graph-view-contracts.ts", import.meta.url), "utf8")).toLowerCase();
  for (const forbidden of ["reveal.js", "react", "d3", "document.", "window.", "css", "coordinate", "localstorage", "sessionstorage", "indexeddb"]) {
    assert.equal(source.includes(forbidden), false, `unexpected public-contract concept: ${forbidden}`);
  }
});

test("contract helpers perform no network access and do not mutate inputs", () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() => { throw new Error("network access attempted"); }) as typeof fetch;
  try {
    const request = projectionRequest();
    const before = structuredClone(request);
    assert.doesNotThrow(() => canonicalizeSceneGraphProjectionRequest(request));
    assert.deepEqual(request, before);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("active architecture documentation identifies canonical TriG as the sole authored semantic source", async () => {
  const documents = await Promise.all([
    readFile(new URL("../../../AGENTS.md", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../../../docs/adr/0002-semantic-learning-compiler-layers.md", import.meta.url), "utf8"),
  ]);
  const combined = documents.join("\n");
  assert.match(combined, /sole authored semantic source|authored exclusively in canonical TriG/i);
  assert.doesNotMatch(combined, /JSON-LD and Turtle are accepted source serializations/);
  assert.doesNotMatch(combined, /Individual JSON-LD or Turtle files are review units/);
});
