import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = (relative: string): string =>
  readFileSync(new URL(relative, import.meta.url), "utf8");

const migratedSceneIds = [
  "ex:scene-cogniflow-domain-specifications--scene",
  "ex:scene-cogniflow-ui-specifications--scene",
  "ex:scene-cogniflow-presentation-specifications--scene",
] as const;

test("generic concept-specification layout contains no CogniFlow identity coupling", () => {
  const policy = source("../../../packages/renderer-reveal/src/layout-policy.ts");
  const css = source("../src/concept-specification-layout.css");

  assert.equal(policy.includes("cogniflow"), false);
  assert.equal(css.includes("cogniflow"), false);
  for (const sceneId of migratedSceneIds) {
    assert.equal(policy.includes(sceneId), false);
    assert.equal(css.includes(sceneId), false);
  }
});

test("migrated concept-specification scenes are not selected by id in shared app styling or navigation", () => {
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
  assert.equal(main.includes('import "./concept-specification-layout.css"'), true);
});
