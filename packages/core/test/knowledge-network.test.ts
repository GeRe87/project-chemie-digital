import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalSerializeKnowledgeNetworkDocument,
  projectKnowledgeNetwork,
  type KnowledgeNetworkProjectionOptions,
  type RdfDatasetSnapshot,
} from "../src/knowledge-network.ts";

const source = [{ resourceId: "content:standard-deviation", provenanceIds: ["prov:reviewed"] }] as const;

const fixture: RdfDatasetSnapshot = {
  version: "1.0",
  identity: "dataset:standard-deviation:v1",
  source,
  supportedPredicates: ["cd:hasDefinition", "cd:hasExample", "cd:hasPrerequisite"],
  entities: [
    { id: "ex:standard-deviation", label: "Standard deviation", semanticTypes: ["cd:Concept"], source },
    { id: "ex:definition", label: "Definition of standard deviation", semanticTypes: ["cd:Definition"], source },
    { id: "ex:example", label: "Standard deviation example", semanticTypes: ["cd:Example"], source },
    { id: "ex:variance", label: "Variance", semanticTypes: ["cd:Concept"], source },
  ],
  statements: [
    { sourceEntityId: "ex:standard-deviation", predicateId: "cd:hasDefinition", targetEntityId: "ex:definition", predicateLabel: "has definition", source },
    { sourceEntityId: "ex:standard-deviation", predicateId: "cd:hasExample", targetEntityId: "ex:example", predicateLabel: "has example", source },
    { sourceEntityId: "ex:standard-deviation", predicateId: "cd:hasPrerequisite", targetEntityId: "ex:variance", predicateLabel: "has prerequisite", source },
  ],
};

const options: KnowledgeNetworkProjectionOptions = {
  rootEntityIds: ["ex:standard-deviation"],
  includedPredicates: ["cd:hasPrerequisite", "cd:hasDefinition", "cd:hasExample"],
  maximumDepth: 1,
  groupingPolicy: "semantic-type",
};

test("projects the standard-deviation logical dataset deterministically", () => {
  const first = projectKnowledgeNetwork(fixture, options);
  const permuted = projectKnowledgeNetwork(
    { ...fixture, entities: [...fixture.entities].reverse(), statements: [...fixture.statements].reverse(), supportedPredicates: [...fixture.supportedPredicates].reverse() },
    { ...options, includedPredicates: [...options.includedPredicates].reverse() },
  );
  assert.deepEqual(first.diagnostics, []);
  assert.deepEqual(permuted.diagnostics, []);
  assert.ok(first.document);
  assert.ok(permuted.document);
  assert.equal(canonicalSerializeKnowledgeNetworkDocument(first.document), canonicalSerializeKnowledgeNetworkDocument(permuted.document));
  assert.deepEqual(first.document.nodes.map((node) => node.semanticEntityId), ["ex:definition", "ex:example", "ex:standard-deviation", "ex:variance"]);
  assert.equal(first.document.edges.length, 3);
  assert.equal(first.document.groups?.length, 3);
});

test("uses breadth-first traversal with a strict depth bound", () => {
  const deep: RdfDatasetSnapshot = {
    ...fixture,
    entities: [...fixture.entities, { id: "ex:deep", label: "Deep node", semanticTypes: ["cd:Concept"], source }],
    statements: [...fixture.statements, { sourceEntityId: "ex:variance", predicateId: "cd:hasPrerequisite", targetEntityId: "ex:deep", predicateLabel: "has prerequisite", source }],
  };
  const depthOne = projectKnowledgeNetwork(deep, options).document!;
  const depthTwo = projectKnowledgeNetwork(deep, { ...options, maximumDepth: 2 }).document!;
  assert.equal(depthOne.nodes.some((node) => node.semanticEntityId === "ex:deep"), false);
  assert.equal(depthTwo.nodes.some((node) => node.semanticEntityId === "ex:deep"), true);
});

test("provides deterministic accessibility reading order and static fallback", () => {
  const document = projectKnowledgeNetwork(fixture, options).document!;
  assert.deepEqual(document.accessibility.nodeReadingOrder, document.nodes.map((node) => node.id));
  assert.deepEqual(document.accessibility.edgeReadingOrder, document.edges.map((edge) => edge.id));
  for (const node of document.nodes) assert.match(document.accessibility.staticFallback, new RegExp(node.label));
  for (const edge of document.edges) assert.match(document.accessibility.staticFallback, new RegExp(edge.label));
});

test("fails atomically with stable diagnostics", () => {
  const cases: Array<[RdfDatasetSnapshot, KnowledgeNetworkProjectionOptions, string]> = [
    [{ ...fixture, version: "2.0" as "1.0" }, options, "UNSUPPORTED_DATASET_CONTRACT_VERSION"],
    [{ ...fixture, identity: "" }, options, "INVALID_DATASET"],
    [fixture, { ...options, maximumDepth: -1 }, "INVALID_PROJECTION_OPTIONS"],
    [fixture, { ...options, rootEntityIds: ["ex:missing"] }, "UNKNOWN_ROOT_ENTITY"],
    [fixture, { ...options, includedPredicates: ["cd:unknown"] }, "UNSUPPORTED_PREDICATE"],
    [{ ...fixture, entities: fixture.entities.map((entity) => entity.id === "ex:example" ? { ...entity, label: "" } : entity }, options, "MISSING_ACCESSIBLE_LABEL"],
    [{ ...fixture, statements: [...fixture.statements, { sourceEntityId: "ex:variance", predicateId: "cd:hasPrerequisite", targetEntityId: "ex:missing", predicateLabel: "has prerequisite", source, requiredReference: true }] }, options, "UNRESOLVED_REQUIRED_REFERENCE"],
  ];
  for (const [dataset, projection, code] of cases) {
    const result = projectKnowledgeNetwork(dataset, projection);
    assert.equal(result.document, undefined);
    assert.equal(result.diagnostics.length, 1);
    assert.equal(result.diagnostics[0].code, code);
  }
});

test("is offline and renderer-neutral by construction", async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests += 1; throw new Error("network forbidden"); };
  try {
    assert.ok(projectKnowledgeNetwork(fixture, options).document);
    assert.equal(requests, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }

  const packageJsonText = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../package.json", import.meta.url), "utf8"));
  const packageJson = JSON.parse(packageJsonText) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  const dependencyNames = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies }).map((name) => name.toLowerCase());
  for (const forbidden of ["d3", "react", "reveal.js"]) {
    assert.equal(dependencyNames.some((name) => name === forbidden || name.startsWith(`${forbidden}/`)), false);
  }
});
