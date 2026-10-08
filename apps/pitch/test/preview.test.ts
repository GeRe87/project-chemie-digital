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
  assert.equal(first.children[0]?.textContent, "Standardabweichung");
  assert.equal(first.children[1]?.attributes.get("data-resource-id"), "ex:sd-definition-basic-de");
  assert.match(first.children[1]?.attributes.get("data-provenance-ids") ?? "", /graph\/specifications\/standard-deviation/);
  assert.equal(first.children[1]?.attributes.get("data-relation-path"), "cd:hasDefinition");
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
  assert.match(cardStyles, /top:\s*\.18rem/);
  assert.match(cardStyles, /bottom:\s*\.18rem/);
  assert.match(cardStyles, /\.definition-list-point-spacer::after/);
  assert.match(cardStyles, /border-left:\s*\.46rem solid transparent/);
  assert.match(cardStyles, /border-right:\s*\.46rem solid transparent/);
  assert.match(cardStyles, /border-top:\s*\.74rem solid color-mix/);
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
  const layoutCss = readFileSync(new URL("../src/learning-concept-layouts.css", import.meta.url), "utf8");
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
    layoutCss,
    /section\[data-layout="observation-bridge"\][\s\S]*?minmax\(15rem, 1fr\)/u,
  );
  assert.match(
    layoutCss,
    /section\[data-layout="quiz-grid"\][\s\S]*?\.poll-local-feedback\s*\{[\s\S]*?margin-top:\s*\.65rem/u,
  );
  assert.match(
    layoutCss,
    /data-layout-slot="chart"[\s\S]*?\.d3-chart-svg[\s\S]*?height:\s*100%[\s\S]*?max-height:\s*none/u,
  );

  const genericRuntimeAndStyles = `${flowRenderer}\n${flowCss}\n${layoutCss}`.toLowerCase();
  assert.equal(genericRuntimeAndStyles.includes("scene:chemometrics"), false);
  assert.equal(genericRuntimeAndStyles.includes("uv/vis calibration"), false);
});


test("table-chart teaching layouts use generic data-card table styling", () => {
  const css = readFileSync(new URL("../src/learning-concept-layouts.css", import.meta.url), "utf8");
  assert.match(
    css,
    /section:is\(\[data-layout="measurement-example"\], \[data-layout="experiment-example"\]\)[\s\S]*?> \[data-layout-slot="table"\]\.data-table/u,
  );
  assert.match(css, /font-variant-numeric:\s*tabular-nums/u);
  assert.match(css, /tbody tr:nth-child\(even\) td/u);
  assert.match(css, /caption-side:\s*top/u);
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
