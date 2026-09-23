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
  "ex:scene-cogniflow-showcase-still--scene",
  "ex:scene-cogniflow-showcase-video-one--scene",
  "ex:scene-cogniflow-showcase-video-two--scene",
  "ex:scene-cogniflow-take-home--scene",
  "ex:scene-cogniflow-closing--scene",
  "ex:scene-cogniflow-title--scene",
  "ex:scene-cogniflow-coupling-problem--scene",
  "ex:scene-cogniflow-laboratory-diversity--scene",
  "ex:scene-cogniflow-service-architecture--scene",
  "ex:scene-cogniflow-semantics-as-source--scene",
  "ex:scene-cogniflow-same-semantics-different-views--scene",
  "ex:scene-cogniflow-provenance-pipeline--scene",
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
    source("../src/presentation-projection.ts"),
    source("../src/presentation-projection.css"),
    source("../src/presentation-clock.ts"),
    source("../src/presentation-clock.css"),
    source("../src/presentation-laser-pointer.ts"),
    source("../src/presentation-laser-pointer.css"),
    source("../src/full-media-layout.css"),
    source("../src/closing-layout.css"),
    source("../src/presentation-mobile.css"),
    source("../src/hero-title-panel.css"),
    source("../src/diagram-stage-layout.css"),
    source("../src/semantic-source-runtime.css"),
    source("../src/semantic-multi-view-runtime.css"),
  ];

  for (const genericSource of genericSources) {
    assert.equal(genericSource.toLowerCase().includes("cogniflow"), false);
    for (const sceneId of migratedSceneIds) assert.equal(genericSource.includes(sceneId), false);
  }
});

test("migrated scenes are not selected by id in shared app styling or navigation", () => {
  const sharedRuntime = [
    source("../src/main.ts"),
    source("../src/presentation-mobile.css"),
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
  assert.equal(main.includes('import "./cogniflow-opening-sequence.css"'), false);
  assert.equal(main.includes('import "./cogniflow-title-media.css"'), false);
  assert.equal(main.includes('import "./cogniflow-core-sequence.css"'), false);
  assert.equal(main.includes('import "./title-attributions-layout.css"'), false);
  assert.equal(main.includes('import "./hero-title-panel.css"'), true);
  assert.equal(main.includes('import "./diagram-stage-layout.css"'), true);
  assert.equal(main.includes('import "./foundation-card-grid-layout.css"'), true);
  assert.equal(main.includes('import "./cogniflow-extension-system.css"'), false);
  assert.equal(main.includes('import "./full-media-layout.css"'), true);
  assert.equal(main.includes('import "./cogniflow-showcase.css"'), false);
  assert.equal(main.includes('import "./cogniflow-take-home.css"'), false);
  assert.equal(main.includes('import "./cogniflow-closing.css"'), false);
  assert.equal(main.includes('import "./cogniflow-mobile.css"'), false);
  assert.equal(main.includes('import "./cogniflow-dark-cards.css"'), false);
  assert.equal(main.includes('import "./closing-layout.css"'), true);
  assert.equal(main.includes('import "./presentation-mobile.css"'), true);
  assert.equal(main.includes('import "./cogniflow-processing-pipeline.css"'), false);
  assert.equal(main.includes('import "./cogniflow-service-system.css"'), false);
  assert.equal(main.includes('import "./presentation-projection.css"'), true);
  assert.equal(main.includes('import "./cogniflow-presentation-projection.css"'), false);
  assert.equal(main.includes("mountPresentationProjections"), true);
  assert.equal(main.includes("mountCogniflowPresentationProjection"), false);
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


test("alternate publication projection is generic and reuses compiled scene content", () => {
  const runtime = source("../src/presentation-projection.ts");
  const css = source("../src/presentation-projection.css");

  assert.equal(runtime.toLowerCase().includes("cogniflow"), false);
  assert.equal(css.toLowerCase().includes("cogniflow"), false);
  assert.equal(runtime.includes('section[data-layout="concept-specification"]'), true);
  assert.equal(runtime.includes('[data-layout-slot="cards"]'), true);
  assert.equal(runtime.includes('[data-layout-slot="takeaway"]'), true);
  assert.equal(runtime.includes("Presentation elements can be described independently"), false);
  assert.equal(runtime.includes("Processing Unit Info Box"), false);
  assert.equal(runtime.includes("Separating Meaning from Presentation"), false);
  assert.equal(css.includes("section[id="), false);
});


test("presenter clock and laser pointer are generic profile capabilities", () => {
  const main = source("../src/main.ts");
  const profile = source("../src/presentation-profile.ts");
  const clock = source("../src/presentation-clock.ts");
  const laser = source("../src/presentation-laser-pointer.ts");

  assert.equal(clock.toLowerCase().includes("cogniflow"), false);
  assert.equal(laser.toLowerCase().includes("cogniflow"), false);
  assert.equal(main.includes("mountPresentationClock"), true);
  assert.equal(main.includes("mountPresentationLaserPointer"), true);
  assert.equal(main.includes("mountCogniflowClockPanel"), false);
  assert.equal(main.includes("mountCogniflowLaserPointer"), false);
  assert.equal(main.includes('appearance.profile.id === "cogniflow-standardized-data-processing"\n  ? mountPresentationClock'), false);
  assert.equal(main.includes("appearance.profile.presenterCapabilities?.clock"), true);
  assert.equal(main.includes("appearance.profile.presenterCapabilities?.laserPointer"), true);
  assert.equal(profile.includes("readonly presenterCapabilities?: PresenterCapabilities"), true);
});


test("full-media showcase behavior is structural rather than scene-id driven", () => {
  const main = source("../src/main.ts");
  const policy = source("../../../packages/renderer-reveal/src/layout-policy.ts");
  const css = source("../src/full-media-layout.css");

  assert.equal(policy.includes('"full-media"'), true);
  assert.equal(policy.includes("isFullMediaGroup"), true);
  assert.equal(css.toLowerCase().includes("cogniflow"), false);
  assert.equal(css.includes("section[id="), false);
  assert.equal(main.includes("showcaseSceneIds"), false);
  assert.equal(main.includes("hardCutSceneIds"), false);
  assert.equal(main.includes("frozenBackgroundSceneIds"), false);
  assert.equal(main.includes('dataset.layout === "full-media"'), true);
  assert.equal(main.includes("pcd-full-media-active"), true);
});


test("take-home, closing and portrait viewport no longer depend on CogniFlow identity", () => {
  const main = source("../src/main.ts");
  const profile = source("../src/presentation-profile.ts");
  const closing = source("../src/closing-layout.css");
  const mobile = source("../src/presentation-mobile.css");
  const takeHome = source("../../../ontology/dataset/cogniflow-take-home.trig");

  assert.equal(takeHome.includes("cd:hasKeyPoint ex:keypoint-cogniflow-take-home-semantics"), true);
  assert.equal(main.includes('appearance.profile.id === "cogniflow-standardized-data-processing"'), false);
  assert.equal(main.includes('appearance.profile.viewportPolicy === "native-portrait"'), true);
  assert.equal(profile.includes('readonly viewportPolicy?: PresentationViewportPolicy'), true);
  assert.equal(closing.toLowerCase().includes("cogniflow"), false);
  assert.equal(mobile.toLowerCase().includes("cogniflow"), false);
  assert.equal(closing.includes('data-layout="closing"'), true);
  assert.equal(main.includes("available anywhere via pip"), false);
});


test("final title opening and semantic-core layouts are structurally selected", () => {
  const main = source("../src/main.ts");
  const policy = source("../../../packages/renderer-reveal/src/layout-policy.ts");
  const preview = source("../src/preview.ts");
  const titleCss = source("../src/hero-title-panel.css");
  const diagramCss = source("../src/diagram-stage-layout.css");

  assert.equal(policy.includes('"hero-title-panel"'), true);
  assert.equal(policy.includes('"title-attributions"'), false);
  assert.equal(policy.includes('"semantic-source"'), true);
  assert.equal(policy.includes('"semantic-multi-view"'), true);
  assert.equal(policy.includes('"diagram-stage"'), true);
  assert.equal(preview.includes('semanticMultiView ? "semantic-multi-view"'), false);
  assert.equal(preview.includes('semanticCode ? "semantic-source"'), false);
  assert.equal(titleCss.toLowerCase().includes("cogniflow"), false);
  assert.equal(diagramCss.toLowerCase().includes("cogniflow"), false);
  assert.equal(titleCss.includes("data-resource-id~="), false);
  assert.equal(diagramCss.includes("section[id="), false);
  assert.equal(main.includes("scene-cogniflow-title"), false);
});


test("production generator and browser regression contain no CogniFlow identity exceptions", () => {
  const mediaGenerator = source("../../../scripts/generate_canonical_runtime_media.py");
  const diagramCheck = source("../../../scripts/check_presentation_diagram.py");

  assert.equal(mediaGenerator.toLowerCase().includes("cogniflow"), false);
  assert.equal(mediaGenerator.includes("validate_cogniflow_opening_chart"), false);
  assert.equal(mediaGenerator.includes("scene-cogniflow-processing-black-box"), false);
  assert.equal(diagramCheck.toLowerCase().includes("cogniflow"), false);
  assert.equal(diagramCheck.includes("--scene-id"), true);
  assert.equal(diagramCheck.includes("--expected-nodes"), true);
  assert.equal(diagramCheck.includes('data-layout="diagram-stage"'), true);
});


test("analytical proof annotation decoration follows canonical order, not resource identity", () => {
  const proofCss = source("../src/analytical-proof-runtime.css");
  const lineRenderer = source("../../../packages/renderer-d3/src/line-chart.ts");

  assert.equal(proofCss.toLowerCase().includes("cogniflow"), false);
  assert.equal(proofCss.includes("data-annotation-id="), false);
  assert.equal(proofCss.includes('data-annotation-index="0"'), true);
  assert.equal(proofCss.includes('data-annotation-index="1"'), true);
  assert.equal(proofCss.includes('data-annotation-index="2"'), true);
  assert.equal(proofCss.includes("--pcd-proof-baseline"), false);
  assert.equal(proofCss.includes("--pcd-proof-model"), false);
  assert.equal(proofCss.includes("--pcd-proof-quant"), false);
  assert.equal(lineRenderer.includes("group.dataset.annotationIndex = String(annotationIndex)"), true);
});
