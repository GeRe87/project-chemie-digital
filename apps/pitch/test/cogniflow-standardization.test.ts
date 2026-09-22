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
  "ex:scene-cogniflow-explicit-processing-context--scene",
  "ex:scene-cogniflow-fair-data-intro--scene",
  "ex:scene-cogniflow-processing-black-box--scene",
] as const;

test("generic migrated layouts contain no CogniFlow identity coupling", () => {
  const genericSources = [
    source("../../../packages/renderer-reveal/src/layout-policy.ts"),
    source("../src/concept-specification-layout.css"),
    source("../src/hierarchy-flow-layout.css"),
    source("../src/reference-code-layout.css"),
    source("../src/process-context-layout.css"),
    source("../src/data-explanation-layout.css"),
    source("../src/analysis-result-layout.css"),
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
  assert.equal(main.includes('import "./process-context-layout.css"'), true);
  assert.equal(main.includes('import "./data-explanation-layout.css"'), true);
  assert.equal(main.includes('import "./analysis-result-layout.css"'), true);
  assert.equal(main.includes('import "./cogniflow-fair-intro.css"'), false);
  assert.equal(main.includes('import "./cogniflow-explicit-context.css"'), false);
  assert.equal(main.includes('cogniflow-explicit-context.ts'), false);
});


test("FAIR data object is authored as a semantic table rather than TSV code", () => {
  const trig = source("../../../ontology/dataset/cogniflow-motivation.trig");
  assert.equal(trig.includes("ex:code-cogniflow-fair-data-object"), false);
  assert.equal(trig.includes("ex:table-cogniflow-fair-data-object a cd:TableDefinition"), true);
  assert.equal(trig.includes("cd:communicativeRole cd:TableRole"), true);
  assert.equal(trig.includes('cd:selectionPath "cd:hasTableRow"'), true);
});


test("CogniFlow tables no longer use TSV code heuristics", () => {
  const trig = source("../../../ontology/dataset/cogniflow-motivation.trig");
  const preview = source("../src/preview.ts");
  const flowTheme = source("../src/flow-theme.css");

  assert.equal(/programmingLanguage\s+"tsv"/i.test(trig), false);
  assert.equal(preview.includes('block.language === "tsv"'), false);
  assert.equal(flowTheme.includes(":has(> .d3-chart-host):has(> .code-block):has(> .d3-flow-host)"), false);
  assert.equal(trig.includes("ex:table-cogniflow-feature-results a cd:TableDefinition"), true);
  assert.equal(trig.includes("ex:table-cogniflow-fair-data-object a cd:TableDefinition"), true);
});
