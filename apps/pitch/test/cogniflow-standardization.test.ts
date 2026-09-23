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
  "ex:scene-cogniflow-fair-processing-gap--scene",
  "ex:scene-cogniflow-semantics-first--scene",
  "ex:scene-cogniflow-semantic-triples--scene",
  "ex:scene-cogniflow-semantic-core--scene",
  "ex:scene-cogniflow-processing-pipeline--scene",
  "ex:scene-cogniflow-service-process--scene",
  "ex:scene-cogniflow-extension-system--scene",
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
    source("../src/card-sequence-layout.css"),
    source("../src/text-network-progression-layout.css"),
    source("../src/concentric-network-layout.css"),
    source("../src/process-diagram-layout.css"),
    source("../src/foundation-card-grid-layout.css"),
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
  assert.equal(main.includes('import "./card-sequence-layout.css"'), true);
  assert.equal(main.includes('import "./text-network-progression-layout.css"'), true);
  assert.equal(main.includes('import "./cogniflow-semantics-first.css"'), false);
  assert.equal(main.includes('import "./cogniflow-semantic-triples.css"'), false);
  assert.equal(main.includes('import "./cogniflow-semantic-core.css"'), false);
  assert.equal(main.includes('import "./concentric-network-layout.css"'), true);
  assert.equal(main.includes('import "./process-diagram-layout.css"'), true);
  assert.equal(main.includes('import "./cogniflow-processing-pipeline.css"'), false);
  assert.equal(main.includes('import "./cogniflow-service-system.css"'), false);
  assert.equal(main.includes('import "./foundation-card-grid-layout.css"'), true);
  assert.equal(main.includes('import "./cogniflow-extension-system.css"'), false);
  assert.equal(main.includes("cogniflow-semantic-rings-runtime"), false);
  assert.equal(main.includes('import "./cogniflow-fair-intro.css"'), false);
  assert.equal(main.includes('import "./cogniflow-fair-gap.css"'), false);
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


test("FAIR processing gap reuses the generic process-context layout semantics", () => {
  const trig = source("../../../ontology/dataset/cogniflow-motivation.trig");
  assert.equal(trig.includes("ex:cogniflow-snr-example a cd:DefinitionList"), true);
  assert.equal(trig.includes("ex:cogniflow-missing-processing-context a cd:DefinitionList"), true);
  assert.equal(trig.includes("ex:scene-item-cogniflow-fair-processing-gap-example-list a cd:SceneItem"), true);
  assert.equal(trig.includes("ex:scene-item-cogniflow-fair-processing-gap-missing-list a cd:SceneItem"), true);
});


test("Semantic Triples knowledge graph is authored as a NetworkDiagram", () => {
  const trig = source("../../../ontology/dataset/cogniflow-semantic-triples.trig");
  const main = source("../src/main.ts");
  assert.equal(trig.includes("ex:diagram-cogniflow-semantic-triples-network a cd:NetworkDiagram"), true);
  assert.equal(trig.includes('skos:prefLabel "livesIn"@en'), true);
  assert.equal(trig.includes('skos:prefLabel "worksAt"@en'), true);
  assert.equal(trig.includes('skos:prefLabel "locatedIn"@en'), true);
  assert.equal(trig.includes("ex:keypoint-cogniflow-semantic-graph a cd:KeyPoint"), false);
  assert.equal(main.includes("anna-knowledge-graph.svg"), false);
});


test("generic concentric renderer uses true SVG circles instead of themed card rectangles", () => {
  const renderer = source("../../../packages/renderer-d3/src/flow-diagram.ts");
  const css = source("../src/concentric-network-layout.css");

  assert.equal(renderer.includes('layout.strategy === "concentric-network"\n            ? document.createElementNS(namespace, "circle")'), true);
  assert.equal(css.includes('circle.d3-flow-node-shape'), true);
  assert.equal(css.includes('clip-path: none'), true);
});

test("semantic core is canonical grouped network data rather than a bespoke ring payload", () => {
  const trig = source("../../../ontology/dataset/cogniflow-semantic-core.trig");
  const main = source("../src/main.ts");
  assert.equal(trig.includes("ex:diagram-cogniflow-semantic-core a cd:NetworkDiagram"), true);
  assert.equal(trig.includes("cd:focusNode ex:node-cogniflow-semantic-core"), true);
  assert.equal(trig.includes("cd:hasDiagramGroup ex:group-cogniflow-semantic-concepts"), true);
  assert.equal(trig.includes("cd:memberOfDiagramGroup ex:group-cogniflow-semantic-specifications"), true);
  assert.equal(trig.includes("ex:cogniflow-ring-core a cd:Interpretation"), false);
  assert.equal(main.includes("mountCogniflowSemanticRings"), false);
});


test("processing and service scenes use canonical diagrams and generic shells", () => {
  const processing = source("../../../ontology/dataset/cogniflow-processing-pipeline.trig");
  const service = source("../../../ontology/dataset/cogniflow-service-process.trig");
  const theme = source("../src/flow-theme.css");

  assert.equal(processing.includes("ex:diagram-cogniflow-processing-pipeline a cd:FlowDiagram"), true);
  assert.equal(processing.includes("cd:communicativeRole cd:DiagramRole"), true);
  assert.equal(processing.includes("ex:keypoint-cogniflow-step-baseline a cd:KeyPoint"), false);
  assert.equal(service.includes("ex:diagram-cogniflow-service-process a cd:SequenceDiagram"), true);
  assert.equal(theme.includes("ex:role-service-consumer"), false);
  assert.equal(theme.includes("data-participant-index"), true);
});


test("processing pipeline nodes author title and body separately", () => {
  const trig = source("../../../ontology/dataset/cogniflow-processing-pipeline.trig");
  const renderer = source("../../../packages/renderer-d3/src/flow-diagram.ts");
  const layout = source("../../../packages/renderer-d3/src/flow-layout.ts");

  assert.equal(trig.includes('skos:prefLabel "BASELINE CORRECTION"@en'), true);
  assert.equal(trig.includes('cd:body """ProcessingStep'), true);
  assert.equal(trig.includes('skos:prefLabel """BASELINE CORRECTION'), false);
  assert.equal(renderer.includes("d3-flow-node-title"), true);
  assert.equal(renderer.includes("d3-flow-node-body"), true);
  assert.equal(renderer.includes("d3-flow-node-title-divider"), true);
  assert.equal(layout.includes("readonly bodyLines"), true);
});


test("extension system uses structured module entries and generic foundation-card-grid", () => {
  const trig = source("../../../ontology/dataset/cogniflow-extension-system.trig");
  const main = source("../src/main.ts");
  const css = source("../src/foundation-card-grid-layout.css");
  const preview = source("../src/preview.ts");

  assert.equal(trig.includes("ex:cogniflow-extension-modules a cd:DefinitionList"), true);
  assert.equal(trig.includes("a cd:DefinitionListEntry"), true);
  assert.equal(trig.includes("cd:communicativeRole cd:DefinitionListRole"), true);
  assert.equal(trig.includes("ex:keypoint-cogniflow-extension-"), false);
  assert.equal(main.includes('import "./cogniflow-extension-system.css"'), false);
  assert.equal(css.toLowerCase().includes("cogniflow"), false);
  assert.equal(css.includes(":nth-child("), false);
  assert.equal(preview.includes("definition-list-entry"), true);
  assert.equal(preview.includes("--definition-entry-hue"), true);
});
