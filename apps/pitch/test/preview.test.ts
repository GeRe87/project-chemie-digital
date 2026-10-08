import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  canonicalDatasetFingerprint,
  canonicalDatasetSnapshot,
  compilePitchSceneDocuments,
  compilePitchSceneDocumentsFromArtifact,
  STANDARD_DEVIATION_PATH_ID,
} from "../src/graph-scene-data.ts";
import { installNoNetworkGuard, isAllowedLocalRuntimeRequest, mountSceneDocuments, type MinimalElement } from "../src/preview.ts";
import { inferRevealLayoutDecision } from "../../../packages/renderer-reveal/src/layout-policy.ts";

class FakeElement implements MinimalElement {
  private html = ""; className = ""; textContent: string | null = null; children: FakeElement[] = []; attributes = new Map<string,string>();
  get innerHTML(): string { return this.html; }
  set innerHTML(value: string) { this.html = value; if (value === "") this.children = []; }
  appendChild(node: MinimalElement): void { this.children.push(node as FakeElement); }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
}

test("canonical runtime exposes one fingerprinted Dataset snapshot", () => {
  assert.match(canonicalDatasetFingerprint, /^sha256:[0-9a-f]{64}$/);
  assert.equal(canonicalDatasetSnapshot.identity, canonicalDatasetFingerprint);
  assert.ok(canonicalDatasetSnapshot.entities.some((entity) => entity.id === "ex:standard-deviation"));
  assert.ok(canonicalDatasetSnapshot.entities.some((entity) => entity.id === "ex:sd-precision-poll"));
  assert.ok(canonicalDatasetSnapshot.statements.length > 0);
});

test("accepts a valid single SceneDocument without Standard Deviation path coupling", () => {
  const [standardDeviationDocument] = compilePitchSceneDocuments();
  assert.ok(standardDeviationDocument);
  const genericPathId = "ex:path-chemometrics-mean-values-lecture";
  const documents = compilePitchSceneDocumentsFromArtifact({
    artifactVersion: "1.0",
    datasetFingerprint: canonicalDatasetFingerprint,
    datasetSnapshot: canonicalDatasetSnapshot,
    sceneDocuments: [{ ...standardDeviationDocument, sourcePathId: genericPathId }],
  });
  assert.equal(documents.length, 1);
  assert.equal(documents[0]?.sourcePathId, genericPathId);
});

test("retains exactly-one SceneDocument cardinality for generic preview loading", () => {
  assert.throws(
    () => compilePitchSceneDocumentsFromArtifact({
      artifactVersion: "1.0",
      datasetFingerprint: canonicalDatasetFingerprint,
      datasetSnapshot: canonicalDatasetSnapshot,
      sceneDocuments: [],
    }),
    /exactly one SceneDocument/,
  );
});

test("rejects unsupported canonical runtime artifact versions at runtime", () => {
  const [document] = compilePitchSceneDocuments();
  assert.ok(document);
  assert.throws(
    () => compilePitchSceneDocumentsFromArtifact({
      artifactVersion: "2.0",
      datasetFingerprint: canonicalDatasetFingerprint,
      datasetSnapshot: canonicalDatasetSnapshot,
      sceneDocuments: [document],
    }),
    /Unsupported canonical runtime artifact: 2\.0/,
  );
});

test("renders the complete nine-scene Standardabweichung path with RDF provenance", () => {
  const documents = compilePitchSceneDocuments();
  assert.equal(documents.length, 1);
  assert.equal(documents[0]?.sourcePathId, STANDARD_DEVIATION_PATH_ID);
  assert.equal(documents[0]?.scenes.length, 9);
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, documents);
  assert.equal(root.children.length, 9);
  const first = root.children[0]!;
  assert.equal(first.attributes.get("data-source-path-id"), STANDARD_DEVIATION_PATH_ID);
  assert.equal(first.attributes.get("data-composition"), "statement-card");
  assert.equal(first.children[0]?.textContent, "Standardabweichung");
  const mainRegion = first.children[1]!;
  assert.equal(mainRegion.attributes.get("data-composition-region-container"), "main");
  const definition = mainRegion.children[0]!;
  assert.equal(definition.attributes.get("data-component-kind"), "info-surface");
  assert.equal(definition.attributes.get("data-composition-region"), "main");
  assert.equal(definition.attributes.get("data-resource-id"), "ex:sd-definition-basic-de");
  assert.match(definition.attributes.get("data-provenance-ids") ?? "", /graph\/specifications\/standard-deviation/);
  assert.equal(definition.attributes.get("data-relation-path"), "cd:hasDefinition");
  destroy(); assert.equal(root.children.length, 0); destroy();
});

test("mounts generic layout variant and density markers for an inferred scene", () => {
  const [document] = compilePitchSceneDocuments();
  assert.ok(document);
  const sourceScene = document.scenes[0]!;
  const heading = sourceScene.blocks.find(
    (block) => block.kind === "prose" && block.intent?.kind === "introduce",
  );
  assert.ok(heading, "expected a graph-backed heading in the canonical fixture");

  const inferredScene = {
    ...sourceScene,
    id: "scene:generic-layout-marker",
    blocks: [heading],
    readingOrder: [heading.id],
  };
  const decision = inferRevealLayoutDecision(inferredScene);
  assert.equal(decision?.family, "closing");

  const inferredDocument = {
    ...document,
    id: "document:generic-layout-marker",
    scenes: [inferredScene],
  };
  const root = new FakeElement();
  const destroy = mountSceneDocuments(
    { root, createElement: () => new FakeElement() },
    [inferredDocument],
  );
  const section = root.children[0]!;
  assert.equal(section.attributes.get("data-layout"), "closing");
  assert.equal(section.attributes.get("data-layout-variant"), "default");
  assert.equal(section.attributes.get("data-layout-density"), "comfortable");
  assert.ok(["within-budget", "over-budget"].includes(section.attributes.get("data-lecture-budget") ?? ""));
  assert.match(section.attributes.get("data-lecture-budget-score") ?? "", /^\d+\.\d$/);
  assert.match(section.attributes.get("data-lecture-primary-regions") ?? "", /^\d+$/);
  destroy();
});

test("wraps rendered list text in a neutral marker span without changing semantic text", () => {
  const [document] = compilePitchSceneDocuments();
  assert.ok(document);
  const sourceScene = document.scenes[0]!;
  const heading = sourceScene.blocks.find(
    (block) => block.kind === "prose" && block.intent?.kind === "introduce",
  );
  assert.ok(heading, "expected a graph-backed heading in the canonical fixture");

  const listBlock = {
    kind: "list" as const,
    id: "block:generic-marker-list",
    listStyle: "unordered" as const,
    source: [{ resourceId: "resource:generic-marker-list" }],
    items: [
      {
        id: "item:generic-marker-one",
        text: "Generic highlighted statement",
        source: [{ resourceId: "resource:generic-marker-one" }],
      },
    ],
    disclosure: {
      order: 1,
      mode: "progressive" as const,
      step: 2,
      triggerResourceId: "resource:generic-trigger",
    },
  };
  const listScene = {
    ...sourceScene,
    id: "scene:generic-marker-list",
    blocks: [heading, listBlock],
    readingOrder: [heading.id, listBlock.id],
  };
  const listDocument = {
    ...document,
    id: "document:generic-marker-list",
    scenes: [listScene],
  };

  const root = new FakeElement();
  const destroy = mountSceneDocuments(
    { root, createElement: () => new FakeElement() },
    [listDocument],
  );
  const list = root.children[0]!.children[1]!;
  assert.equal(list.className, "keypoint-list");
  assert.equal(list.attributes.get("data-presentation-disclosure-mode"), "progressive");
  assert.equal(list.attributes.get("data-presentation-disclosure-step"), "2");
  assert.equal(
    list.attributes.get("data-presentation-disclosure-trigger-resource-id"),
    "resource:generic-trigger",
  );
  assert.equal(list.attributes.get("data-presentation-disclosure-visible"), "false");
  assert.equal(list.attributes.get("aria-hidden"), "true");
  const item = list.children[0]!;
  assert.equal(item.attributes.get("data-list-item-id"), "item:generic-marker-one");
  const textSpan = item.children[0]!;
  assert.equal(textSpan.className, "pcd-list-item-text");
  assert.equal(textSpan.textContent, "Generic highlighted statement");
  destroy();
});

test("generic card primitive restores definition entries as visual cards", () => {
  const sharedCss = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  const cardCss = readFileSync(new URL("../src/card-primitives.css", import.meta.url), "utf8");

  // The neutral baseline stays compatible with table-like definition lists.
  // The reusable card component restores the wrapper only when projected as a card collection.
  assert.match(
    sharedCss,
    /\.reveal \.definition-list > \.definition-list-entry\s*\{\s*display:\s*contents;/u,
  );
  assert.match(
    cardCss,
    /data-component-kind="card-collection"[\s\S]*?> \.definition-list-entry\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*column;/u,
  );
  assert.doesNotMatch(cardCss, /data-layout=/u);
});

test("definition-list renderer separates authored points and caps adaptive spacing", () => {
  const [document] = compilePitchSceneDocuments();
  assert.ok(document);
  const sourceScene = document.scenes[0]!;
  const heading = sourceScene.blocks.find(
    (block) => block.kind === "prose" && block.intent?.kind === "introduce",
  );
  assert.ok(heading);

  const cards = {
    id: "block:generic-labeled-cards",
    kind: "definition-list" as const,
    entries: [
      {
        id: "entry:multi",
        term: "MULTI",
        description: `First logical point\nSecond point wraps naturally in the browser\nThird logical point`,
        visualMotif: "discussion" as const,
        visualMotifRole: "highlight" as const,
        source: [{ resourceId: "resource:entry:multi" }],
      },
      {
        id: "entry:single",
        term: "SINGLE",
        description: "One continuous description",
        source: [{ resourceId: "resource:entry:single" }],
      },
      {
        id: "entry:blank-lines",
        term: "BLANKS",
        description: `Alpha\n\n   \nBeta`,
        source: [{ resourceId: "resource:entry:blank-lines" }],
      },
    ],
    intent: { kind: "explain" as const },
    source: [{ resourceId: "resource:generic-labeled-cards" }],
  };
  const takeaway = {
    id: "block:generic-labeled-takeaway",
    kind: "prose" as const,
    text: "Generic takeaway",
    intent: { kind: "explain" as const },
    source: [{ resourceId: "resource:generic-labeled-takeaway" }],
  };
  const scene = {
    ...sourceScene,
    id: "scene:generic-labeled-cards",
    blocks: [heading, cards, takeaway],
    readingOrder: [heading.id, cards.id, takeaway.id],
  };
  const renderedDocument = {
    ...document,
    version: "1.4" as const,
    id: "document:generic-labeled-cards",
    scenes: [scene],
  };

  const root = new FakeElement();
  const destroy = mountSceneDocuments(
    { root, createElement: () => new FakeElement() },
    [renderedDocument],
  );
  const section = root.children[0]!;
  assert.equal(section.attributes.get("data-layout"), "labeled-card-grid");

  assert.equal(section.attributes.get("data-composition"), "card-deck");
  const cardRegion = section.children[1]!;
  assert.equal(cardRegion.attributes.get("data-composition-region-container"), "main");
  const definitionList = cardRegion.children[0]!;
  const multiEntry = definitionList.children[0]!;
  assert.equal(multiEntry.attributes.get("data-visual-motif"), "discussion");
  assert.equal(multiEntry.attributes.get("data-visual-motif-role"), "highlight");
  const motif = multiEntry.children[1]!;
  assert.equal(motif.className, "definition-list-visual-motif");
  assert.equal(motif.attributes.get("data-visual-motif"), "discussion");
  assert.equal(motif.attributes.get("data-visual-motif-role"), "highlight");
  const multiDescription = multiEntry.children[2]!;
  assert.equal(multiDescription.attributes.get("data-adaptive-point-spacing"), "true");
  const multiPoints = multiDescription.children[0]!;
  assert.equal(multiPoints.className, "definition-list-points");
  assert.deepEqual(
    multiPoints.children.map((child) => [child.className, child.textContent]),
    [
      ["definition-list-point", "First logical point"],
      ["definition-list-point-spacer", null],
      ["definition-list-point", "Second point wraps naturally in the browser"],
      ["definition-list-point-spacer", null],
      ["definition-list-point", "Third logical point"],
    ],
  );
  assert.deepEqual(
    multiPoints.children
      .filter((child) => child.className === "definition-list-point")
      .map((child) => child.attributes.get("data-definition-point-index")),
    ["0", "1", "2"],
  );
  assert.ok(
    multiPoints.children
      .filter((child) => child.className === "definition-list-point-spacer")
      .every((child) => child.attributes.get("aria-hidden") === "true"),
  );

  const singleDescription = definitionList.children[1]!.children[1]!;
  assert.equal(singleDescription.attributes.get("data-adaptive-point-spacing"), undefined);
  assert.equal(singleDescription.textContent, "One continuous description");
  assert.equal(singleDescription.children.length, 0);

  const blankDescription = definitionList.children[2]!.children[1]!;
  const blankPoints = blankDescription.children[0]!;
  assert.deepEqual(
    blankPoints.children
      .filter((child) => child.className === "definition-list-point")
      .map((child) => child.textContent),
    ["Alpha", "Beta"],
  );

  const sharedStyles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  const cardStyles = readFileSync(new URL("../src/card-primitives.css", import.meta.url), "utf8");
  assert.match(sharedStyles, /\.definition-list-point-spacer/);
  assert.match(sharedStyles, /--pcd-point-gap-min:\s*\.6lh/);
  assert.match(sharedStyles, /--pcd-point-gap-max:\s*2\.5lh/);
  assert.match(sharedStyles, /max-height:\s*var\(--pcd-point-gap-max\)/);
  assert.match(cardStyles, /definition-list-description\[data-adaptive-point-spacing="true"\]/);
  assert.match(cardStyles, /flex:\s*1 1 auto/);
  assert.match(cardStyles, /\.definition-list-point-spacer::before/);
  assert.match(cardStyles, /repeating-linear-gradient\(/);
  assert.match(cardStyles, /width:\s*2px/);
  assert.match(cardStyles, /top:\s*\.12rem/);
  assert.match(cardStyles, /bottom:\s*\.12rem/);
  assert.match(cardStyles, /\.definition-list-point-spacer::after/);
  assert.match(cardStyles, /border-left:\s*\.35rem solid transparent/);
  assert.match(cardStyles, /border-right:\s*\.35rem solid transparent/);
  assert.match(cardStyles, /border-top:\s*\.55rem solid color-mix/);
  assert.doesNotMatch(cardStyles, /content:\s*"↓"/);
  assert.doesNotMatch(cardStyles.toLowerCase(), /chemometrics|lecturer|research/);

  destroy();
});

test("chart stage host publishes chart and annotation resources for semantic disclosure", () => {
  const [document] = compilePitchSceneDocuments();
  assert.ok(document);
  const sourceScene = document.scenes[0]!;
  const heading = sourceScene.blocks.find(
    (block) => block.kind === "prose" && block.intent?.kind === "introduce",
  );
  assert.ok(heading);

  const chart = {
    id: "block:semantic-chart",
    kind: "chart" as const,
    chartType: "bar" as const,
    label: "Generic chart",
    description: "Generic evidence",
    xAxis: { label: "Category" },
    yAxis: { label: "Value" },
    data: [{
      id: "datum:a",
      category: "A",
      value: 1,
      source: [{ resourceId: "resource:datum-a" }],
    }],
    annotations: [{
      id: "annotation:a",
      kind: "point" as const,
      datumId: "datum:a",
      label: "Generic focus",
      source: [{ resourceId: "resource:annotation-a" }],
    }],
    source: [{ resourceId: "resource:chart-a" }],
  };
  const scene = {
    ...sourceScene,
    id: "scene:semantic-chart-host",
    blocks: [heading, chart],
    readingOrder: [heading.id, chart.id],
  };
  const renderedDocument = {
    ...document,
    version: "1.2" as const,
    id: "document:semantic-chart-host",
    scenes: [scene],
  };

  const root = new FakeElement();
  const destroy = mountSceneDocuments(
    { root, createElement: () => new FakeElement() },
    [renderedDocument],
  );
  const chartHost = root.children[0]!.children[1]!;
  assert.equal(
    chartHost.attributes.get("data-presentation-step-resource-id"),
    "resource:chart-a resource:annotation-a",
  );
  destroy();
});

test("renders the canonical formula locally as KaTeX math", () => {
  const documents = compilePitchSceneDocuments();
  const formulaBlock = documents[0]!.scenes[3]!.blocks[1]!;
  assert.equal(formulaBlock.kind, "math");
  if (formulaBlock.kind !== "math") throw new Error("expected math block");
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, documents);
  const formulaNode = root.children[3]!.children[1]!;
  assert.equal(formulaNode.className, "math-display");
  assert.equal(formulaNode.attributes.get("role"), "math");
  assert.equal(formulaNode.attributes.get("aria-label"), formulaBlock.spokenText);
  assert.equal(formulaNode.attributes.get("data-resource-id"), "ex:sample-sd-formula");
  assert.match(formulaNode.innerHTML, /class="katex-display"/);
  assert.match(formulaNode.innerHTML, /<math/);
  destroy();
});

test("renders canonical graph-backed audience poll before the executable R code", () => {
  const documents = compilePitchSceneDocuments();
  const pollBlock = documents[0]!.scenes[8]!.blocks[3]!;
  assert.equal(pollBlock.kind, "prompt");
  if (pollBlock.kind !== "prompt") throw new Error("expected prompt block");
  assert.equal(pollBlock.responseMode, "single-choice");
  assert.deepEqual(pollBlock.options, ["Messreihe A", "Messreihe B"]);
  assert.deepEqual(pollBlock.source.map((source) => source.resourceId), [
    "ex:sd-precision-poll",
    "ex:sd-precision-option-a",
    "ex:sd-precision-option-b",
  ]);
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, documents);
  const exercise = root.children[8]!;
  assert.equal(exercise.children.length, 5);
  const shell = exercise.children[3]!;
  assert.equal(shell.className, "live-poll");
  assert.equal(shell.attributes.get("data-poll-key"), "ex:sd-precision-poll");
  assert.equal(shell.attributes.get("data-poll-option-ids"), "ex:sd-precision-option-a ex:sd-precision-option-b");
  assert.equal(shell.attributes.get("data-relation-path"), "cd:hasAudiencePoll cd:hasPollOption");
  assert.match(shell.attributes.get("data-provenance-ids") ?? "", /graph\/specifications\/standard-deviation/);
  assert.match(shell.children[0]?.textContent ?? "", /Welche Messreihe ist präziser/);
  assert.deepEqual(shell.children[1]?.children.map((item) => item.textContent), ["Messreihe A", "Messreihe B"]);
  destroy();
});

test("renders canonical R code as an executable static shell", () => {
  const documents = compilePitchSceneDocuments();
  const codeBlock = documents[0]!.scenes[8]!.blocks[4]!;
  assert.equal(codeBlock.kind, "code");
  if (codeBlock.kind !== "code") throw new Error("expected code block");
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, documents);
  const exercise = root.children[8]!;
  assert.equal(exercise.children.length, 5);
  const shell = exercise.children[4]!;
  assert.equal(shell.className, "code-block");
  assert.equal(shell.attributes.get("data-code-block-id"), codeBlock.id);
  assert.equal(shell.attributes.get("data-language"), "r");
  assert.equal(shell.attributes.get("data-editable"), "true");
  assert.equal(shell.attributes.get("data-executable"), "true");
  assert.equal(shell.attributes.get("data-resource-id"), "ex:sd-r-code-example");
  assert.equal(shell.attributes.get("data-relation-path"), "cd:hasCodeExample");
  assert.equal(shell.children[0]?.className, "code-static-fallback");
  assert.equal(shell.children[0]?.children[0]?.textContent, "x <- c(6, 8, 10)\nsd(x)");
  destroy();
});

test("renderer runtime contains no audience-authored Standardabweichung prose", () => {
  const runtime = [
    "../src/preview.ts",
    "../src/main.ts",
    "../src/graph-scene-data.ts",
    "../src/code-runtime.ts",
    "../src/poll-runtime.ts",
  ].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
  assert.equal(runtime.includes("Die Standardabweichung beschreibt, wie stark Werte"), false);
  assert.equal(runtime.includes("Koffeinbestimmung"), false);
  assert.equal(runtime.includes("x <- c(6, 8, 10)"), false);
  assert.equal(runtime.includes("Messreihe A: 9, 10, 11"), false);
});

test("keeps a complete nine-item static fallback boundary", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const documents = compilePitchSceneDocuments();
  const sceneIds = [...html.matchAll(/data-pitch-step="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(sceneIds, documents[0]!.scenes.map((scene) => scene.id));
  for (const scene of documents[0]!.scenes) {
    for (const block of scene.blocks) {
      if (block.kind === "prose") assert.ok(html.includes(block.text), `static fallback is missing ${block.id}`);
      if (block.kind === "math") {
        assert.ok(html.includes(block.expression), `static fallback is missing math expression ${block.id}`);
        assert.ok(html.includes(block.spokenText), `static fallback is missing spoken math alternative ${block.id}`);
      }
      if (block.kind === "prompt") {
        assert.ok(html.includes(block.prompt), `static fallback is missing poll prompt ${block.id}`);
        for (const option of block.options ?? []) assert.ok(html.includes(option), `static fallback is missing poll option ${option}`);
      }
      if (block.kind === "code") {
        assert.ok(html.includes("x &lt;- c(6, 8, 10)"), `static fallback is missing code ${block.id}`);
        assert.ok(html.includes('data-language="r"'), `static fallback is missing code language ${block.id}`);
      }
    }
  }
  assert.match(html, /math-fallback/);
  assert.match(html, /poll-fallback/);
  assert.match(html, /code-fallback/);
  assert.match(html, /Introductory Statistics|NIST\/SEMATECH/);
});

test("rejects missing compiled input before partial mounting", () => {
  const root = new FakeElement();
  assert.throws(() => mountSceneDocuments({ root, createElement: () => new FakeElement() }, []), /at least one/);
  assert.equal(root.children.length, 0);
});

test("prohibits external runtime network calls while allowing pinned same-origin vendor assets", async () => {
  const requested: string[] = [];
  const original: typeof fetch = async (input) => {
    requested.push(String(input));
    return new Response("ok");
  };
  const target: { fetch?: typeof fetch; XMLHttpRequest?: unknown; WebSocket?: unknown } = { fetch: original };
  const base = "http://127.0.0.1:5173/pitch";
  assert.equal(isAllowedLocalRuntimeRequest("/vendor/webr/v0.6.0/R.wasm", base), true);
  assert.equal(isAllowedLocalRuntimeRequest("https://example.invalid/runtime.js", base), false);
  const restore = installNoNetworkGuard(target, base);
  assert.throws(() => target.fetch?.("https://example.invalid/runtime.js"), /prohibited/);
  await target.fetch?.("/vendor/webr/v0.6.0/R.wasm");
  assert.deepEqual(requested, ["/vendor/webr/v0.6.0/R.wasm"]);
  restore();
  assert.equal(target.fetch, original);
});


test("generic flow-card styling and structured space balancing remain identity-free", () => {
  const flowCss = readFileSync(new URL("../src/flow-theme.css", import.meta.url), "utf8");
  const learningCss = readFileSync(new URL("../src/learning-stage-primitives.css", import.meta.url), "utf8");
  const compositionCss = readFileSync(new URL("../src/component-composition.css", import.meta.url), "utf8");
  const flowRenderer = readFileSync(
    new URL("../../../packages/renderer-d3/src/flow-diagram.ts", import.meta.url),
    "utf8",
  );

  assert.match(flowRenderer, /data-diagram-type/);
  assert.match(flowRenderer, /data-node-presentation/);
  assert.match(flowRenderer, /information-card/);
  assert.match(
    flowCss,
    /data-diagram-type="flow"[\s\S]*?data-node-presentation="information-card"/u,
  );
  assert.match(
    flowCss,
    /d3-flow-node-inner-frame[\s\S]*?d3-flow-node-rail[\s\S]*?display:\s*none/u,
  );

  assert.match(
    compositionCss,
    /data-composition-main-profile="formula-visual"[\s\S]*?data-component-kind="visual"/u,
  );
  assert.match(
    learningCss,
    /data-composition-learning-profile="prompt-grid"[\s\S]*?\.poll-local-feedback\s*\{[\s\S]*?margin-top:\s*\.65rem/u,
  );
  const evidenceCss = readFileSync(new URL("../src/evidence-primitives.css", import.meta.url), "utf8");
  assert.match(
    evidenceCss,
    /data-component-kind="visual"[\s\S]*?\.d3-chart-svg[\s\S]*?height:\s*100%[\s\S]*?max-height:\s*none/u,
  );

  const genericRuntimeAndStyles = `${flowRenderer}\n${flowCss}\n${learningCss}\n${compositionCss}\n${evidenceCss}`.toLowerCase();
  assert.equal(genericRuntimeAndStyles.includes("scene:chemometrics"), false);
  assert.equal(genericRuntimeAndStyles.includes("uv/vis calibration"), false);
});


test("evidence split uses shared data-surface and visual primitives", () => {
  const css = readFileSync(new URL("../src/evidence-primitives.css", import.meta.url), "utf8");
  assert.match(css, /data-composition="evidence-split"/u);
  assert.match(css, /data-component-kind="data-surface"/u);
  assert.match(css, /data-component-kind="visual"/u);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/u);
  assert.match(css, /tbody tr:nth-child\(even\) td/u);
  assert.match(css, /caption-side:\s*top/u);
  assert.doesNotMatch(css, /data-layout=/u);
  const lower = css.toLowerCase();
  assert.equal(lower.includes("absorbance"), false);
  assert.equal(lower.includes("uv/vis"), false);
  assert.equal(lower.includes("scene-chemometrics"), false);
});


test("renders generic main-aside-note composition regions from block semantics", () => {
  const [document] = compilePitchSceneDocuments();
  assert.ok(document);
  const sourceScene = document.scenes[0]!;
  const heading = sourceScene.blocks.find(
    (block) => block.kind === "prose" && block.intent?.kind === "introduce",
  );
  assert.ok(heading);

  const context = {
    id: "block:generic-context",
    kind: "prose" as const,
    text: "Generic explanatory context",
    intent: { kind: "explain" as const },
    source: [{ resourceId: "resource:generic-context" }],
  };
  const formula = {
    id: "block:generic-formula",
    kind: "math" as const,
    expression: "y=f(x)",
    spokenText: "y equals f of x",
    source: [{ resourceId: "resource:generic-formula" }],
  };
  const cards = {
    id: "block:generic-card-collection",
    kind: "definition-list" as const,
    entries: Array.from({ length: 3 }, (_, index) => ({
      id: `entry:generic:${index}`,
      term: `Term ${index}`,
      description: `Expression ${index}`,
      source: [{ resourceId: `resource:generic-entry:${index}` }],
    })),
    source: [{ resourceId: "resource:generic-card-collection" }],
  };
  const note = {
    id: "block:generic-note",
    kind: "prose" as const,
    text: "Generic supporting note",
    intent: { kind: "explain" as const },
    source: [{ resourceId: "resource:generic-note" }],
  };
  const scene = {
    ...sourceScene,
    id: "scene:generic-composition",
    blocks: [heading, context, formula, cards, note],
    readingOrder: [heading.id, context.id, formula.id, cards.id, note.id],
  };
  const renderedDocument = {
    ...document,
    version: "1.4" as const,
    id: "document:generic-composition",
    scenes: [scene],
  };

  const root = new FakeElement();
  const destroy = mountSceneDocuments(
    { root, createElement: () => new FakeElement() },
    [renderedDocument],
  );
  const section = root.children[0]!;
  assert.equal(section.attributes.get("data-composition"), "main-aside-note");
  assert.equal(section.attributes.get("data-composition-main-count"), "2");
  assert.equal(section.attributes.get("data-composition-main-profile"), "formula-cards");

  const headingNode = section.children[0]!;
  assert.equal(headingNode.attributes.get("data-component-kind"), "heading");
  assert.equal(headingNode.attributes.get("data-composition-region"), "heading");

  const asideRegion = section.children[1]!;
  const mainRegion = section.children[2]!;
  const footerRegion = section.children[3]!;
  assert.equal(asideRegion.attributes.get("data-composition-region-container"), "aside");
  assert.equal(mainRegion.attributes.get("data-composition-region-container"), "main");
  assert.equal(footerRegion.attributes.get("data-composition-region-container"), "footer");
  assert.equal(asideRegion.children[0]!.attributes.get("data-component-kind"), "info-surface");
  assert.equal(mainRegion.children[0]!.attributes.get("data-component-kind"), "formula");
  assert.equal(mainRegion.children[1]!.attributes.get("data-component-kind"), "card-collection");
  assert.equal(mainRegion.children[1]!.attributes.get("data-component-item-count"), "3");
  assert.match(
    mainRegion.children[1]!.children[0]!.attributes.get("style") ?? "",
    /--pcd-card-content-width:\s*\d+/u,
  );
  assert.equal(footerRegion.children[0]!.attributes.get("data-component-kind"), "info-surface");

  const css = readFileSync(new URL("../src/component-composition.css", import.meta.url), "utf8");
  const cardCss = readFileSync(new URL("../src/card-primitives.css", import.meta.url), "utf8");
  assert.match(css, /data-composition="main-aside-note"/u);
  assert.match(css, /data-composition-main-profile="formula-cards"/u);
  assert.match(css, /data-composition-main-profile="formula-visual"/u);
  assert.match(cardCss, /flex-wrap:\s*wrap/u);
  assert.match(cardCss, /--pcd-card-content-width/u);
  assert.match(cardCss, /flex:\s*1 1 clamp\(14rem/u);
  const lower = `${css}\n${cardCss}`.toLowerCase();
  assert.equal(lower.includes("functional-dependence"), false);
  assert.equal(lower.includes("chemometrics"), false);
  assert.equal(lower.includes("scene:"), false);

  destroy();
});


test("renders generic evidence-split regions from table and chart semantics", () => {
  const [document] = compilePitchSceneDocuments();
  assert.ok(document);
  const sourceScene = document.scenes[0]!;
  const heading = sourceScene.blocks.find(
    (block) => block.kind === "prose" && block.intent?.kind === "introduce",
  );
  assert.ok(heading);

  const intro = {
    id: "block:evidence-intro",
    kind: "prose" as const,
    text: "Generic evidence context",
    intent: { kind: "explain" as const },
    source: [{ resourceId: "resource:evidence-intro" }],
  };
  const table = {
    id: "block:evidence-table",
    kind: "table" as const,
    caption: "Generic data",
    columns: [
      { id: "column:a", label: "A", source: [{ resourceId: "resource:column-a" }] },
      { id: "column:b", label: "B", source: [{ resourceId: "resource:column-b" }] },
    ],
    rows: [{
      id: "row:one",
      cells: [
        { id: "cell:a", text: "1", source: [{ resourceId: "resource:cell-a" }] },
        { id: "cell:b", text: "2", source: [{ resourceId: "resource:cell-b" }] },
      ],
      source: [{ resourceId: "resource:row-one" }],
    }],
    source: [{ resourceId: "resource:evidence-table" }],
  };
  const chart = {
    id: "block:evidence-chart",
    kind: "chart" as const,
    chartType: "bar" as const,
    label: "Generic chart",
    description: "Generic evidence",
    xAxis: { label: "Category" },
    yAxis: { label: "Value" },
    data: [{
      id: "datum:a",
      category: "A",
      value: 1,
      source: [{ resourceId: "resource:datum-a" }],
    }],
    source: [{ resourceId: "resource:evidence-chart" }],
  };
  const roles = {
    id: "block:evidence-support",
    kind: "list" as const,
    listStyle: "unordered" as const,
    items: [
      { id: "role:one", text: "Support one", source: [{ resourceId: "resource:role-one" }] },
      { id: "role:two", text: "Support two", source: [{ resourceId: "resource:role-two" }] },
    ],
    source: [{ resourceId: "resource:evidence-support" }],
  };
  const scene = {
    ...sourceScene,
    id: "scene:generic-evidence",
    blocks: [heading, intro, table, chart, roles],
    readingOrder: [heading.id, intro.id, table.id, chart.id, roles.id],
  };
  const renderedDocument = {
    ...document,
    version: "1.5" as const,
    id: "document:generic-evidence",
    scenes: [scene],
  };

  const root = new FakeElement();
  const destroy = mountSceneDocuments(
    { root, createElement: () => new FakeElement() },
    [renderedDocument],
  );
  const section = root.children[0]!;
  assert.equal(section.attributes.get("data-composition"), "evidence-split");
  assert.equal(section.attributes.get("data-composition-evidence-profile"), "data-visual");

  const headingNode = section.children[0]!;
  const prelude = section.children[1]!;
  const primary = section.children[2]!;
  const secondary = section.children[3]!;
  const footer = section.children[4]!;
  assert.equal(headingNode.attributes.get("data-composition-region"), "heading");
  assert.equal(prelude.attributes.get("data-composition-region-container"), "prelude");
  assert.equal(primary.attributes.get("data-composition-region-container"), "primary");
  assert.equal(secondary.attributes.get("data-composition-region-container"), "secondary");
  assert.equal(footer.attributes.get("data-composition-region-container"), "footer");
  assert.equal(primary.children[0]!.attributes.get("data-component-kind"), "data-surface");
  assert.equal(secondary.children[0]!.attributes.get("data-component-kind"), "visual");
  assert.equal(footer.children[0]!.attributes.get("data-component-kind"), "list-collection");

  destroy();
});


test("legacy learning and teaching evidence families no longer own CSS presentation", () => {
  const learningCss = readFileSync(new URL("../src/learning-stage-primitives.css", import.meta.url), "utf8");
  const evidenceCss = readFileSync(new URL("../src/evidence-primitives.css", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

  assert.equal(main.includes('import "./learning-concept-layouts.css"'), false);
  assert.equal(main.includes('import "./learning-stage-primitives.css"'), true);
  assert.equal(main.includes('import "./data-explanation-layout.css"'), false);
  assert.equal(main.includes('import "./evidence-primitives.css"'), true);
  assert.doesNotMatch(learningCss, /data-layout=/u);
  assert.doesNotMatch(evidenceCss, /data-layout=/u);
  assert.equal(learningCss.includes("functional-dependence"), false);
  assert.equal(learningCss.includes("observation-bridge"), false);
});


test("generic visual evidence compositions own analysis and worked-case presentation", () => {
  const css = readFileSync(new URL("../src/evidence-primitives.css", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

  assert.match(css, /data-composition="evidence-story"/u);
  assert.match(css, /data-composition="worked-evidence"/u);
  assert.match(css, /data-composition-evidence-profile/u);
  assert.doesNotMatch(css, /data-layout="analysis-result"/u);
  assert.doesNotMatch(css, /data-layout="case-study"/u);
  assert.equal(main.includes('import "./analysis-result-layout.css"'), false);
  assert.equal(main.includes('import "./case-study-layout.css"'), false);
});

test("renders worked-evidence regions from generic block structure", () => {
  const [document] = compilePitchSceneDocuments();
  assert.ok(document);
  const sourceScene = document.scenes[0]!;
  const heading = sourceScene.blocks.find(
    (block) => block.kind === "prose" && block.intent?.kind === "introduce",
  );
  assert.ok(heading);

  const group = {
    id: "block:worked-context",
    kind: "group" as const,
    children: [
      {
        id: "block:worked-context-prose",
        kind: "prose" as const,
        text: "Generic context",
        intent: { kind: "explain" as const },
        source: [{ resourceId: "resource:worked-context-prose" }],
      },
      {
        id: "block:worked-context-media",
        kind: "media-reference" as const,
        uri: "/generic.svg",
        alternativeText: "Generic illustration",
        source: [{ resourceId: "resource:worked-context-media" }],
      },
    ],
    readingOrder: ["block:worked-context-prose", "block:worked-context-media"],
    source: [{ resourceId: "resource:worked-context" }],
  };
  const table = {
    id: "block:worked-table",
    kind: "table" as const,
    caption: "Generic data",
    columns: [
      { id: "column:a", label: "A", source: [{ resourceId: "resource:worked-column-a" }] },
      { id: "column:b", label: "B", source: [{ resourceId: "resource:worked-column-b" }] },
    ],
    rows: [{
      id: "row:one",
      cells: [
        { id: "cell:a", text: "1", source: [{ resourceId: "resource:worked-cell-a" }] },
        { id: "cell:b", text: "2", source: [{ resourceId: "resource:worked-cell-b" }] },
      ],
      source: [{ resourceId: "resource:worked-row-one" }],
    }],
    source: [{ resourceId: "resource:worked-table" }],
  };
  const chart = {
    id: "block:worked-chart",
    kind: "chart" as const,
    chartType: "bar" as const,
    label: "Generic chart",
    description: "Generic evidence",
    xAxis: { label: "Category" },
    yAxis: { label: "Value" },
    data: [{
      id: "datum:a",
      category: "A",
      value: 1,
      source: [{ resourceId: "resource:worked-datum-a" }],
    }],
    source: [{ resourceId: "resource:worked-chart" }],
  };
  const discussion = {
    id: "block:worked-discussion",
    kind: "list" as const,
    listStyle: "unordered" as const,
    items: [
      { id: "point:one", text: "Point one", source: [{ resourceId: "resource:worked-point-one" }] },
      { id: "point:two", text: "Point two", source: [{ resourceId: "resource:worked-point-two" }] },
    ],
    source: [{ resourceId: "resource:worked-discussion" }],
  };
  const takeaway = {
    id: "block:worked-takeaway",
    kind: "prose" as const,
    text: "Generic takeaway",
    intent: { kind: "explain" as const },
    source: [{ resourceId: "resource:worked-takeaway" }],
  };
  const scene = {
    ...sourceScene,
    id: "scene:worked-evidence-generic",
    blocks: [heading, group, table, chart, discussion, takeaway],
    readingOrder: [heading.id, group.id, table.id, chart.id, discussion.id, takeaway.id],
  };
  const renderedDocument = {
    ...document,
    version: "1.5" as const,
    id: "document:worked-evidence-generic",
    scenes: [scene],
  };

  const root = new FakeElement();
  const destroy = mountSceneDocuments(
    { root, createElement: () => new FakeElement() },
    [renderedDocument],
  );
  const section = root.children[0]!;
  assert.equal(section.attributes.get("data-composition"), "worked-evidence");
  assert.equal(section.attributes.get("data-composition-evidence-profile"), "context-data-visual");

  const regions = section.children.slice(1).map((node) =>
    node.attributes.get("data-composition-region-container")
      ?? node.attributes.get("data-composition-region")
  );
  assert.deepEqual(regions, ["context", "primary", "secondary", "support", "footer"]);
  assert.equal(section.children[1]!.children[0]!.attributes.get("data-component-kind"), "group");
  assert.equal(section.children[2]!.children[0]!.attributes.get("data-component-kind"), "data-surface");
  assert.equal(section.children[3]!.children[0]!.attributes.get("data-component-kind"), "visual");
  assert.equal(section.children[4]!.attributes.get("data-component-kind"), "list-collection");
  assert.equal(section.children[4]!.attributes.get("data-composition-region"), "support");
  assert.equal(section.children[5]!.children[0]!.attributes.get("data-component-kind"), "info-surface");

  destroy();
});


test("process story styling is generic and specialized diagram layout files stay removed", () => {
  const css = readFileSync(new URL("../src/process-primitives.css", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

  assert.match(css, /data-composition="process-story"/u);
  assert.match(css, /data-composition-process-profile="compact-linear"/u);
  assert.match(css, /data-component-kind="visual"/u);
  assert.doesNotMatch(css, /data-layout=/u);
  assert.equal(main.includes('import "./process-primitives.css"'), true);
  assert.equal(main.includes('import "./hierarchy-flow-layout.css"'), false);
  assert.equal(main.includes('import "./process-diagram-layout.css"'), false);
});


test("support workbench styling replaces process-context and reference-code family CSS", () => {
  const css = readFileSync(new URL("../src/support-workbench-primitives.css", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

  assert.match(css, /data-composition="support-workbench"/u);
  assert.match(css, /data-composition-workbench-profile="visual-dual-reference"/u);
  assert.match(css, /data-composition-workbench-profile="list-code-reference"/u);
  assert.match(css, /data-component-kind="code"/u);
  assert.match(css, /data-component-kind="card-collection"/u);
  assert.doesNotMatch(css, /data-layout=/u);
  assert.equal(main.includes('import "./support-workbench-primitives.css"'), true);
  assert.equal(main.includes('import "./process-context-layout.css"'), false);
  assert.equal(main.includes('import "./reference-code-layout.css"'), false);
});


test("progression strip styling replaces card-sequence and text-network family CSS", () => {
  const css = readFileSync(new URL("../src/progression-primitives.css", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

  assert.match(css, /data-composition="progression-strip"/u);
  assert.match(css, /data-composition-progression-profile="cards-only"/u);
  assert.match(css, /data-composition-progression-profile="cards-with-footer"/u);
  assert.match(css, /data-composition-progression-profile="cards-to-visual"/u);
  assert.match(css, /data-component-kind="list-collection"/u);
  assert.match(css, /data-component-kind="visual"/u);
  assert.doesNotMatch(css, /data-layout=/u);
  assert.equal(main.includes('import "./progression-primitives.css"'), true);
  assert.equal(main.includes('import "./card-sequence-layout.css"'), false);
  assert.equal(main.includes('import "./text-network-progression-layout.css"'), false);
});


test("learning-stage primitives replace legacy learning concept family CSS", () => {
  const css = readFileSync(new URL("../src/learning-stage-primitives.css", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

  for (const profile of [
    "prompt-code",
    "info-code",
    "info-visual",
    "formula-visual",
    "single-prompt",
    "prompt-grid",
  ]) {
    assert.match(css, new RegExp(`data-composition-learning-profile="${profile}"`));
  }
  assert.match(css, /data-component-kind="prompt"/u);
  assert.match(css, /data-component-kind="code"/u);
  assert.match(css, /data-component-kind="visual"/u);
  assert.doesNotMatch(css, /data-layout=/u);
  assert.equal(main.includes('import "./learning-stage-primitives.css"'), true);
  assert.equal(main.includes('import "./learning-concept-layouts.css"'), false);
});


test("visual-stage primitives replace standalone and concentric diagram family CSS", () => {
  const css = readFileSync(new URL("../src/visual-stage-primitives.css", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

  assert.match(css, /data-composition="visual-stage"/u);
  assert.match(css, /data-composition-visual-stage-profile="concentric-network"/u);
  assert.match(css, /data-layout-strategy="concentric-network"/u);
  assert.match(css, /data-layout-strategy="space-filling-flow"/u);
  assert.doesNotMatch(css, /data-layout="/u);
  assert.equal(main.includes('import "./visual-stage-primitives.css"'), true);
  assert.equal(main.includes('import "./diagram-stage-layout.css"'), false);
  assert.equal(main.includes('import "./concentric-network-layout.css"'), false);
});


test("concept specification presentation is owned by progression composition", () => {
  const progression = readFileSync(new URL("../src/progression-primitives.css", import.meta.url), "utf8");
  const projection = readFileSync(new URL("../src/presentation-projection.css", import.meta.url), "utf8");
  const runtime = readFileSync(new URL("../src/presentation-projection.ts", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

  assert.match(progression, /data-composition-progression-profile="cards-with-footer"/u);
  assert.match(projection, /data-composition-progression-profile="cards-with-footer"/u);
  assert.match(runtime, /data-composition-progression-profile="cards-with-footer"/u);
  assert.doesNotMatch(projection, /data-layout="concept-specification"/u);
  assert.doesNotMatch(runtime, /data-layout="concept-specification"/u);
  assert.equal(main.includes('import "./concept-specification-layout.css"'), false);
});


test("statement-card styling lives in the shared component composition layer", () => {
  const css = readFileSync(new URL("../src/component-composition.css", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

  assert.match(css, /data-composition="statement-card"/u);
  assert.match(css, /data-component-kind="info-surface"/u);
  assert.match(css, /data-component-kind="text"/u);
  assert.doesNotMatch(css, /data-layout="definition-card"/u);
  assert.equal(main.includes('import "./definition-card-layout.css"'), false);
});


test("single-heading closing stage is owned by generic composition styling", () => {
  const css = readFileSync(new URL("../src/component-composition.css", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

  assert.match(css, /data-composition="single"\]\[data-composition-main-count="0"/u);
  assert.match(css, /data-composition-region="heading"/u);
  assert.doesNotMatch(css, /data-layout="closing"/u);
  assert.equal(main.includes('import "./closing-layout.css"'), false);
});


test("full-viewport media presentation is owned by generic media-stage composition", () => {
  const css = readFileSync(new URL("../src/media-stage-primitives.css", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

  assert.match(css, /data-composition="media-stage"/u);
  assert.match(css, /data-component-kind="group"/u);
  assert.match(css, /\.media-reference/u);
  assert.doesNotMatch(css, /data-layout="full-media"/u);
  assert.equal(main.includes('import "./media-stage-primitives.css"'), true);
  assert.equal(main.includes('import "./full-media-layout.css"'), false);
  assert.equal(main.includes('dataset.layout === "full-media"'), false);
  assert.equal(main.includes('dataset.composition === "media-stage"'), true);
});
