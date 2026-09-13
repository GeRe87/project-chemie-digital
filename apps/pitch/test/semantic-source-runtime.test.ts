import assert from "node:assert/strict";
import test from "node:test";

import type { CodeBlock } from "../../../packages/core/src/scene-document.ts";
import type { RdfDatasetSnapshot } from "../../../packages/core/src/knowledge-network.ts";
import {
  semanticSourceLines,
  semanticSourceResourceOrder,
  semanticSourceVisibleResources,
} from "../src/semantic-source-runtime.ts";

const block: CodeBlock = {
  kind: "code",
  id: "ex:semantic-code--block",
  source: [{ resourceId: "ex:semantic-code", relationPath: "cd:showsResource" }],
  language: "trig",
  code: [
    "@prefix ex: <https://w3id.org/project-chemie-digital/resource/> .",
    "",
    "ex:chart a cd:ChartDefinition ;",
    "  cd:usesDataset ex:dataset .",
    "",
    "ex:dataset a cd:Dataset ;",
    "  cd:hasObservation ex:observation .",
    "",
    "ex:observation a cd:Observation ;",
    "  cd:numericValue 25.0 .",
  ].join("\n"),
  editable: false,
  executable: false,
  fallback: "semantic source",
};

const snapshot = {
  version: "1.0",
  identity: "sha256:test",
  entities: [],
  supportedPredicates: ["cd:showsResource"],
  source: [{ resourceId: "test" }],
  statements: [
    { sourceEntityId: "ex:semantic-code", predicateId: "cd:showsResource", targetEntityId: "ex:observation", predicateLabel: "showsResource", source: [{ resourceId: "ex:semantic-code" }] },
    { sourceEntityId: "ex:semantic-code", predicateId: "cd:showsResource", targetEntityId: "ex:chart", predicateLabel: "showsResource", source: [{ resourceId: "ex:semantic-code" }] },
    { sourceEntityId: "ex:semantic-code", predicateId: "cd:showsResource", targetEntityId: "ex:dataset", predicateLabel: "showsResource", source: [{ resourceId: "ex:semantic-code" }] },
  ],
} as RdfDatasetSnapshot;

test("semantic source order follows authored snippet order rather than RDF statement order", () => {
  assert.deepEqual(semanticSourceResourceOrder(block, snapshot), [
    "ex:chart",
    "ex:dataset",
    "ex:observation",
  ]);
});

test("semantic source line ownership expands each authored resource into its stanza", () => {
  const lines = semanticSourceLines(block.code, ["ex:chart", "ex:dataset", "ex:observation"]);
  assert.equal(lines[0]!.resourceId, undefined);
  assert.equal(lines[2]!.resourceId, "ex:chart");
  assert.equal(lines[3]!.resourceId, "ex:chart");
  assert.equal(lines[5]!.resourceId, "ex:dataset");
  assert.equal(lines[6]!.resourceId, "ex:dataset");
  assert.equal(lines[8]!.resourceId, "ex:observation");
  assert.equal(lines[9]!.resourceId, "ex:observation");
});

test("semantic source steps reveal absolute resource prefixes and clamp deterministically", () => {
  const resources = ["ex:chart", "ex:dataset", "ex:observation"] as const;
  assert.deepEqual(semanticSourceVisibleResources(resources, 0), []);
  assert.deepEqual(semanticSourceVisibleResources(resources, 1), ["ex:chart"]);
  assert.deepEqual(semanticSourceVisibleResources(resources, 2), ["ex:chart", "ex:dataset"]);
  assert.deepEqual(semanticSourceVisibleResources(resources, 99), resources);
  assert.deepEqual(semanticSourceVisibleResources(resources, -2), []);
});
