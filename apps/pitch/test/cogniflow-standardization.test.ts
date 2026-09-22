import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = (relative: string): string =>
  readFileSync(new URL(relative, import.meta.url), "utf8");

const migratedSceneIds = [
  "ex:scene-cogniflow-domain-specifications--scene",
  "ex:scene-cogniflow-ui-specifications--scene",
  "ex:scene-cogniflow-presentation-specifications--scene",
  "ex:scene-cogniflow-semantic-hierarchy--scene",
  "ex:scene-cogniflow-core-grammar--scene",
] as const;

test("generic migrated layouts contain no CogniFlow identity coupling", () => {
  const genericSources = [
    source("../../../packages/renderer-reveal/src/layout-policy.ts"),
    source("../src/concept-specification-layout.css"),
    source("../src/hierarchy-flow-layout.css"),
    source("../src/reference-code-layout.css"),
  ];

  for (const genericSource of genericSources) {
    assert.equal(genericSource.toLowerCase().includes("cogniflow"), false);
    for (const sceneId of migratedSceneIds) assert.equal(genericSource.includes(sceneId), false);
  }
});

test("migrated scenes are not selected by id in shared app styling or navigation", () => {
  const sharedRuntime = [
    source("../src/main.ts"),
    source("../src/cogniflow-dark-cards.css"),
    source("../src/cogniflow-mobile.css"),
  ].join("\n");

  for (const sceneId of migratedSceneIds) {
    assert.equal(sharedRuntime.includes(sceneId), false, `shared runtime still couples to ${sceneId}`);
  }
});

test("legacy per-scene layout styles are no longer imported", () => {
  const main = source("../src/main.ts");
  assert.equal(main.includes('import "./cogniflow-domain-specifications.css"'), false);
  assert.equal(main.includes('import "./cogniflow-ui-specifications.css"'), false);
  assert.equal(main.includes('import "./cogniflow-presentation-specifications.css"'), false);
  assert.equal(main.includes('import "./cogniflow-semantic-hierarchy.css"'), false);
  assert.equal(main.includes('import "./cogniflow-core-grammar.css"'), false);
  assert.equal(main.includes('import "./concept-specification-layout.css"'), true);
  assert.equal(main.includes('import "./hierarchy-flow-layout.css"'), true);
  assert.equal(main.includes('import "./reference-code-layout.css"'), true);
});
