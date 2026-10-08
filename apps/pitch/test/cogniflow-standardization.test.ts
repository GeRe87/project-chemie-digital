import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const source = (relative: string): string =>
  readFileSync(new URL(relative, import.meta.url), "utf8").replace(/\r\n?/gu, "\n");

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");

function recursiveProductionFiles(relativeDirectory: string): string[] {
  const directory = join(repoRoot, relativeDirectory);
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);
    if (statSync(absolute).isDirectory()) {
      files.push(...recursiveProductionFiles(relative(join(repoRoot), absolute)));
      continue;
    }
    if (/\.(?:ts|css|py)$/u.test(entry)) files.push(absolute);
  }
  return files;
}

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

test("diagram-stage scales space-filling flow viewBoxes into the available stage", () => {
  const css = source("../src/visual-stage-primitives.css");
  assert.match(css, /d3-flow-svg\[data-layout-strategy="space-filling-flow"\]/);
  assert.match(css, /height:\s*100%/);
  assert.match(css, /max-height:\s*100%/);
  assert.equal(css.toLowerCase().includes("chemometrics"), false);
});

test("generic migrated layouts contain no CogniFlow identity coupling", () => {
  const genericSources = [
    source("../src/component-composition.css"),
    source("../src/learning-stage-primitives.css"),
    source("../src/card-primitives.css"),
    source("../src/evidence-primitives.css"),
    source("../src/process-primitives.css"),
    source("../src/support-workbench-primitives.css"),
    source("../src/progression-primitives.css"),
    source("../src/presentation-projection.ts"),
    source("../src/presentation-projection.css"),
    source("../src/presentation-clock.ts"),
    source("../src/presentation-clock.css"),
    source("../src/presentation-laser-pointer.ts"),
    source("../src/presentation-laser-pointer.css"),
    source("../src/media-stage-primitives.css"),
    source("../src/presentation-mobile.css"),
    source("../src/hero-stage-primitives.css"),
    source("../src/semantic-source-runtime.css"),
    source("../src/semantic-multi-view-runtime.css"),
  ];

  for (const genericSource of genericSources) {
    assert.equal(genericSource.toLowerCase().includes("cogniflow"), false);
    assert.equal(genericSource.toLowerCase().includes("chemometrics"), false);
    assert.equal(genericSource.includes('data-composition="single"'), false);
    assert.equal(genericSource.includes('data-composition="card-deck"'), false);
    assert.equal(genericSource.includes('data-composition="statement-card"'), false);
    assert.equal(genericSource.includes('data-composition="hero-stage"'), false);
    assert.equal(genericSource.includes('data-composition="support-workbench"'), false);
    assert.equal(genericSource.includes('data-composition="process-story"'), false);
    assert.equal(genericSource.includes('data-composition="progression-strip"'), false);
    for (const sceneId of migratedSceneIds) assert.equal(genericSource.includes(sceneId), false);
  }
});

test("retired composition kinds stay out of the renderer policy", () => {
  const compositionPolicy = source("../../../packages/renderer-reveal/src/composition-policy.ts");
  for (const retired of ["single", "card-deck", "statement-card", "hero-stage", "support-workbench", "process-story", "progression-strip"]) {
    assert.equal(compositionPolicy.includes(`"${retired}"`), false);
  }
});


test("migrated scenes are not selected by id in shared app styling or navigation", () => {
  const preview = source("../src/preview.ts");
  const styles = source("../src/styles.css");
  const sharedRuntime = [
    source("../src/main.ts"),
    source("../src/presentation-mobile.css"),
  ].join("\n");

  for (const sceneId of migratedSceneIds) {
    assert.equal(sharedRuntime.includes(sceneId), false, `shared runtime still couples to ${sceneId}`);
  }

  assert.equal(preview.includes("layoutByScene"), false);
  assert.equal(preview.includes("PitchLayout"), false);
  assert.equal(preview.includes('"ex:scene-sd-definition--scene"'), false);
  assert.equal(preview.includes('"ex:scene-sd-process--scene"'), false);
  assert.equal(preview.includes('"ex:scene-formula-symbols--scene"'), false);
  assert.equal(preview.includes('"ex:scene-chemistry-example--scene"'), false);
  assert.equal(preview.includes('?? "statement"'), false);
  assert.equal(styles.includes('data-layout="opening"'), false);
  assert.equal(styles.includes('data-layout="statement"'), false);
  assert.equal(styles.includes('data-layout="process"'), false);
  assert.equal(styles.includes('data-layout="split-proof"'), false);
});

test("legacy Reveal layout policy is retired from production rendering", () => {
  const preview = source("../src/preview.ts");
  const rendererIndex = source("../../../packages/renderer-reveal/src/index.ts");
  const courseNavigation = source("../src/course-world-navigation.ts");
  const courseCss = source("../src/course-world.css");

  assert.equal(preview.includes("layout-policy.ts"), false);
  assert.equal(preview.includes("inferRevealLayoutFamily"), false);
  assert.equal(preview.includes('setAttribute("data-layout"'), false);
  assert.equal(rendererIndex.includes('export * from "./layout-policy.ts"'), false);
  assert.equal(courseNavigation.includes("dataset.layout"), false);
  assert.equal(courseCss.includes('data-layout="course-level-buffer"'), false);
  assert.equal(courseCss.includes('data-course-level-buffer="true"'), true);
});


test("composition inference centralizes matching and placement construction", () => {
  const compositionPolicy = source("../../../packages/renderer-reveal/src/composition-policy.ts");

  assert.equal(compositionPolicy.includes("function placement("), true);
  assert.equal(compositionPolicy.includes("function placementsWithHeading("), true);
  assert.equal(compositionPolicy.includes("function matchesComponentKinds("), true);
  assert.equal(compositionPolicy.includes("Matcher order is part of the renderer contract."), true);
  assert.equal(compositionPolicy.includes("const placements: RevealCompositionPlacement[] = []"), false);
  assert.equal(compositionPolicy.includes("placements.push({ blockId:"), false);
});




test("Pitch preview delegates region-container topology to composition policy", () => {
  const preview = source("../src/preview.ts");
  const compositionPolicy = source("../../../packages/renderer-reveal/src/composition-policy.ts");

  assert.equal(compositionPolicy.includes("export function shouldWrapRevealCompositionPlacement("), true);
  assert.equal(preview.includes("shouldWrapRevealCompositionPlacement(composition, placement)"), true);
  assert.equal(preview.includes("].includes(composition.kind)"), false);
  assert.equal(preview.includes('composition.profile === "hero-attributions"'), false);
  assert.equal(preview.includes('composition.profile === "context-data-visual"'), false);
});


test("composition variants use one generic profile channel", () => {
  const preview = source("../src/preview.ts");
  const compositionPolicy = source("../../../packages/renderer-reveal/src/composition-policy.ts");
  const productionSources = [
    preview,
    source("../src/main.ts"),
    source("../src/component-composition.css"),
    source("../src/evidence-primitives.css"),
    source("../src/process-primitives.css"),
    source("../src/support-workbench-primitives.css"),
    source("../src/progression-primitives.css"),
    source("../src/learning-stage-primitives.css"),
    source("../src/visual-stage-primitives.css"),
    source("../src/semantic-source-runtime.css"),
    source("../src/semantic-multi-view-runtime.css"),
    source("../src/knowledge-network-runtime.css"),
    source("../src/presentation-projection.ts"),
    source("../src/presentation-projection.css"),
    source("../src/lecture-readability.css"),
  ].join("\n");

  assert.equal(compositionPolicy.includes("readonly profile?: RevealCompositionProfile"), true);
  assert.equal(preview.includes('setAttribute("data-composition-profile"'), true);
  for (const legacy of [
    "data-composition-main-profile",
    "data-composition-evidence-profile",
    "data-composition-process-profile",
    "data-composition-workbench-profile",
    "data-composition-progression-profile",
    "data-composition-learning-profile",
    "data-composition-visual-stage-profile",
    "data-composition-semantic-stage-profile",
  ]) {
    assert.equal(productionSources.includes(legacy), false, `legacy profile channel remains: ${legacy}`);
  }
});


test("production Pitch rendering no longer emits or consumes legacy layout slots", () => {
  const preview = source("../src/preview.ts");
  const productionCss = [
    source("../src/component-composition.css"),
    source("../src/card-primitives.css"),
    source("../src/evidence-primitives.css"),
    source("../src/process-primitives.css"),
    source("../src/support-workbench-primitives.css"),
    source("../src/progression-primitives.css"),
    source("../src/learning-stage-primitives.css"),
    source("../src/visual-stage-primitives.css"),
    source("../src/hero-stage-primitives.css"),
    source("../src/media-stage-primitives.css"),
    source("../src/semantic-source-runtime.css"),
    source("../src/semantic-multi-view-runtime.css"),
    source("../src/knowledge-network-runtime.css"),
    source("../src/presentation-projection.css"),
  ].join("\n");

  assert.equal(preview.includes("data-layout-slot"), false);
  assert.equal(preview.includes("layoutSlot"), false);
  assert.equal(preview.includes("inferredLayout?.slots"), false);
  assert.equal(preview.includes('setAttribute("data-layout"'), false);
  assert.equal(productionCss.includes("data-layout-slot"), false);
  assert.equal(productionCss.includes("data-layout="), false);
});


test("legacy per-scene layout styles are no longer imported", () => {
  const main = source("../src/main.ts");
  assert.equal(main.includes('import "./cogniflow-domain-specifications.css"'), false);
  assert.equal(main.includes('import "./cogniflow-ui-specifications.css"'), false);
  assert.equal(main.includes('import "./cogniflow-presentation-specifications.css"'), false);
  assert.equal(main.includes('import "./cogniflow-semantic-hierarchy.css"'), false);
  assert.equal(main.includes('import "./cogniflow-core-grammar.css"'), false);
  assert.equal(main.includes('import "./concept-specification-layout.css"'), false);
  assert.equal(main.includes('import "./labeled-card-grid-layout.css"'), false);
  assert.equal(main.includes('import "./card-primitives.css"'), true);
  assert.equal(main.includes('import "./definition-card-layout.css"'), false);
  assert.equal(main.includes('import "./learning-concept-layouts.css"'), false);
  assert.equal(main.includes('import "./learning-stage-primitives.css"'), true);
  assert.equal(main.includes('import "./hierarchy-flow-layout.css"'), false);
  assert.equal(main.includes('import "./process-primitives.css"'), true);
  assert.equal(main.includes('import "./reference-code-layout.css"'), false);
  assert.equal(main.includes('import "./support-workbench-primitives.css"'), true);
  assert.equal(main.includes('import "./process-context-layout.css"'), false);
  assert.equal(main.includes('import "./data-explanation-layout.css"'), false);
  assert.equal(main.includes('import "./evidence-primitives.css"'), true);
  assert.equal(main.includes('import "./analysis-result-layout.css"'), false);
  assert.equal(main.includes('import "./case-study-layout.css"'), false);
  assert.equal(main.includes('import "./card-sequence-layout.css"'), false);
  assert.equal(main.includes('import "./progression-primitives.css"'), true);
  assert.equal(main.includes('import "./text-network-progression-layout.css"'), false);
  assert.equal(main.includes('import "./cogniflow-semantics-first.css"'), false);
  assert.equal(main.includes('import "./cogniflow-semantic-triples.css"'), false);
  assert.equal(main.includes('import "./cogniflow-semantic-core.css"'), false);
  assert.equal(main.includes('import "./concentric-network-layout.css"'), false);
  assert.equal(main.includes('import "./visual-stage-primitives.css"'), true);
  assert.equal(main.includes('import "./process-diagram-layout.css"'), false);
  assert.equal(main.includes('import "./cogniflow-processing-pipeline.css"'), false);
  assert.equal(main.includes('import "./cogniflow-service-system.css"'), false);
  assert.equal(main.includes('import "./cogniflow-opening-sequence.css"'), false);
  assert.equal(main.includes('import "./cogniflow-title-media.css"'), false);
  assert.equal(main.includes('import "./cogniflow-core-sequence.css"'), false);
  assert.equal(main.includes('import "./title-attributions-layout.css"'), false);
  assert.equal(main.includes('import "./hero-title-panel.css"'), false);
  assert.equal(main.includes('import "./hero-stage-primitives.css"'), true);
  assert.equal(main.includes('import "./diagram-stage-layout.css"'), false);
  assert.equal(main.includes('import "./foundation-card-grid-layout.css"'), false);
  assert.equal(main.includes('import "./cogniflow-extension-system.css"'), false);
  assert.equal(main.includes('import "./full-media-layout.css"'), false);
  assert.equal(main.includes('import "./media-stage-primitives.css"'), true);
  assert.equal(main.includes('import "./cogniflow-showcase.css"'), false);
  assert.equal(main.includes('import "./cogniflow-take-home.css"'), false);
  assert.equal(main.includes('import "./cogniflow-closing.css"'), false);
  assert.equal(main.includes('import "./cogniflow-mobile.css"'), false);
  assert.equal(main.includes('import "./cogniflow-dark-cards.css"'), false);
  assert.equal(main.includes('import "./closing-layout.css"'), false);
  assert.equal(main.includes('import "./presentation-mobile.css"'), true);
  assert.equal(main.includes('import "./cogniflow-processing-pipeline.css"'), false);
  assert.equal(main.includes('import "./cogniflow-service-system.css"'), false);
  assert.equal(main.includes('import "./presentation-projection.css"'), true);
  assert.equal(main.includes('import "./cogniflow-presentation-projection.css"'), false);
  assert.equal(main.includes("mountPresentationProjections"), true);
  assert.equal(main.includes("mountCogniflowPresentationProjection"), false);
  assert.equal(main.includes('dataset.layout === "concept-specification"'), false);
  assert.equal(main.includes('compositionProfile === "cards-with-footer"'), true);
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
  const css = source("../src/visual-stage-primitives.css");

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


test("extension system uses structured module entries and generic card primitives", () => {
  const trig = source("../../../ontology/dataset/cogniflow-extension-system.trig");
  const main = source("../src/main.ts");
  const css = source("../src/card-primitives.css");
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


test("alternate publication projection is generic and profile-gated", () => {
  const runtime = source("../src/presentation-projection.ts");
  const css = source("../src/presentation-projection.css");
  const main = source("../src/main.ts");
  const profile = source("../src/presentation-profile.ts");

  assert.equal(runtime.toLowerCase().includes("cogniflow"), false);
  assert.equal(css.toLowerCase().includes("cogniflow"), false);
  assert.equal(main.includes("appearance.profile.projectionCapabilities?.publication"), true);
  assert.equal(main.includes("profile.id"), false);
  assert.equal(profile.includes("readonly projectionCapabilities?: PresentationProjectionCapabilities"), true);
  assert.equal(profile.includes("publication: true"), true);
  assert.equal(
    runtime.includes(
      'section[data-composition="progression-stage"][data-composition-profile="cards-with-footer"]',
    ),
    true,
  );
  assert.equal(runtime.includes('[data-component-kind="list-collection"][data-composition-region="main"]'), true);
  assert.equal(runtime.includes('[data-component-kind="info-surface"][data-composition-region="footer"]'), true);
  assert.equal(runtime.includes('data-layout="concept-specification"'), false);
  assert.equal(runtime.includes("data-layout-slot"), false);
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
  const compositionPolicy = source("../../../packages/renderer-reveal/src/composition-policy.ts");
  const css = source("../src/media-stage-primitives.css");

  assert.equal(compositionPolicy.includes('"media-stage"'), true);
  assert.equal(compositionPolicy.includes('"full-viewport"'), true);
  assert.equal(compositionPolicy.includes("isFullViewportMediaGroup"), true);
  assert.equal(css.toLowerCase().includes("cogniflow"), false);
  assert.equal(css.includes("section[id="), false);
  assert.equal(css.includes('data-layout="full-media"'), false);
  assert.equal(main.includes("showcaseSceneIds"), false);
  assert.equal(main.includes("hardCutSceneIds"), false);
  assert.equal(main.includes("frozenBackgroundSceneIds"), false);
  assert.equal(main.includes('dataset.layout === "full-media"'), false);
  assert.equal(main.includes('dataset.composition === "media-stage"'), true);
  assert.equal(main.includes('dataset.compositionProfile === "full-viewport"'), true);
  assert.equal(main.includes("pcd-full-media-active"), true);
});


test("take-home, closing and portrait viewport no longer depend on CogniFlow identity", () => {
  const main = source("../src/main.ts");
  const profile = source("../src/presentation-profile.ts");
  const composition = source("../src/component-composition.css");
  const mobile = source("../src/presentation-mobile.css");
  const takeHome = source("../../../ontology/dataset/cogniflow-take-home.trig");

  assert.equal(takeHome.includes("cd:hasKeyPoint ex:keypoint-cogniflow-take-home-semantics"), true);
  assert.equal(main.includes('appearance.profile.id === "cogniflow-standardized-data-processing"'), false);
  assert.equal(main.includes('appearance.profile.viewportPolicy === "native-portrait"'), true);
  assert.equal(profile.includes('readonly viewportPolicy?: PresentationViewportPolicy'), true);
  assert.equal(composition.toLowerCase().includes("cogniflow"), false);
  assert.equal(mobile.toLowerCase().includes("cogniflow"), false);
  assert.equal(
    composition.includes('section[data-composition="stack"][data-composition-main-count="0"]'),
    true,
  );
  assert.equal(composition.includes('data-layout="closing"'), false);
  assert.equal(main.includes("available anywhere via pip"), false);
});


test("final title opening and semantic-core layouts are structurally selected", () => {
  const main = source("../src/main.ts");
  const compositionPolicy = source("../../../packages/renderer-reveal/src/composition-policy.ts");
  const preview = source("../src/preview.ts");
  const titleCss = source("../src/hero-stage-primitives.css");
  const diagramCss = source("../src/visual-stage-primitives.css");
  const semanticSourceCss = source("../src/semantic-source-runtime.css");
  const semanticMultiCss = source("../src/semantic-multi-view-runtime.css");
  const knowledgeCss = source("../src/knowledge-network-runtime.css");

  assert.equal(compositionPolicy.includes('"hero-attributions"'), true);
  assert.equal(compositionPolicy.includes('"hero-stage"'), false);
  assert.equal(compositionPolicy.includes('"semantic-stage"'), true);
  assert.equal(compositionPolicy.includes('"visual-stage"'), true);
  assert.equal(compositionPolicy.includes("isAttributionMediaGroup"), true);
  assert.equal(compositionPolicy.includes("isTrigCode"), true);
  assert.equal(preview.includes('semanticMultiView ? "semantic-multi-view"'), false);
  assert.equal(preview.includes('semanticCode ? "semantic-source"'), false);
  assert.equal(preview.includes('data-composition-profile'), true);
  assert.equal(preview.includes('inferredLayout?.family === "semantic-source"'), false);
  assert.equal(titleCss.toLowerCase().includes("cogniflow"), false);
  assert.equal(diagramCss.toLowerCase().includes("cogniflow"), false);
  assert.equal(titleCss.includes("data-resource-id~="), false);
  assert.equal(titleCss.includes('data-layout="hero-title-panel"'), false);
  assert.equal(titleCss.includes('data-composition="media-stage"'), true);
  assert.equal(titleCss.includes('data-composition-profile="hero-attributions"'), true);
  assert.equal(titleCss.includes('data-composition="hero-stage"'), false);
  assert.equal(diagramCss.includes("section[id="), false);
  assert.equal(diagramCss.includes("data-layout="), false);
  assert.equal(semanticSourceCss.includes('data-layout="semantic-source"'), false);
  assert.equal(semanticMultiCss.includes('data-layout="semantic-multi-view"'), false);
  assert.equal(knowledgeCss.includes('data-layout="semantic-source"'), false);
  assert.equal(semanticSourceCss.includes('data-composition-profile="source"'), true);
  assert.equal(semanticMultiCss.includes('data-composition-profile="multi-view"'), true);
  assert.equal(main.includes("scene-cogniflow-title"), false);
  assert.equal(preview.includes("inferRevealLayoutFit"), false);
  assert.equal(preview.includes("inferRevealCompositionFit"), true);
  assert.equal(preview.includes("data-layout-density"), false);
  assert.equal(preview.includes("data-layout-variant"), false);
  assert.equal(preview.includes("data-composition-density"), true);
  assert.equal(preview.includes("data-composition-variant"), true);
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
  assert.equal(
    diagramCheck.includes('data-composition="visual-stage"][data-composition-profile="diagram"'),
    true,
  );
  assert.equal(diagramCheck.includes('data-layout="diagram-stage"'), false);
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


test("production behavior has a single explicit CogniFlow lexical allowlist", () => {
  const roots = [
    "apps/pitch/src",
    "packages/core/src",
    "packages/renderer-d3/src",
    "packages/renderer-reveal/src",
    "packages/renderer-self-study/src",
    "scripts",
  ];
  const allowed = new Set([
    "apps/pitch/src/presentation-profile.ts",
  ]);

  const violations: string[] = [];
  for (const root of roots) {
    for (const absolute of recursiveProductionFiles(root)) {
      const path = relative(repoRoot, absolute).replaceAll("\\", "/");
      if (allowed.has(path)) continue;
      const content = readFileSync(absolute, "utf8");
      if (/cogniflow/iu.test(content) || path.toLowerCase().includes("cogniflow")) {
        violations.push(path);
      }
    }
  }

  assert.deepEqual(violations, []);
});


test("closing focus concept satisfies the canonical Concept definition contract", () => {
  const trig = source("../../../ontology/dataset/cogniflow-closing.trig");

  assert.equal(trig.includes("cd:hasDefinition ex:def-cogniflow-closing"), true);
  assert.equal(trig.includes("ex:def-cogniflow-closing a cd:Definition"), true);
  assert.equal(trig.includes('cd:body "Closing acknowledgment for the standardized data-processing presentation."@en'), true);
  assert.equal(trig.includes("cd:selectsResource ex:def-cogniflow-closing"), false);
});
