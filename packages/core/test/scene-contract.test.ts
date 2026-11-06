import assert from "node:assert/strict";
import test from "node:test";
import { assertSceneDocumentStructure, SceneContractError } from "../src/scene-contract.ts";
import { validateSceneDocument, type SceneBlock, type SceneDocument } from "../src/scene-document.ts";
import { isSceneDocumentVersion, SCENE_DOCUMENT_VERSIONS, supportsSceneCapability } from "../src/scene-version.ts";

const source = [{ resourceId: "ex:resource", provenanceIds: ["ex:provenance"], relationPath: "ex:relation" }];
const identity = { id: "item", source };
const labelled = { ...identity, label: "Label" };
const described = { ...labelled, description: "Description" };
const base = {
  id: "block", source, disclosure: { order: 0, mode: "initial" as const }, emphasis: "normal" as const,
  intent: { kind: "explain" as const }, accessibility: { label: "Label", description: "Description", nonVisualAlternative: "Alternative" },
};
const formula = { ...labelled, expression: "x" };
const definition = { ...identity, term: "x", description: "A variable", explanation: "More detail", expression: "x", symbol: true, visualMotif: "statistics" as const, visualMotifRole: "supporting" as const };
const section = {
  ...labelled, derivationId: "proof", firstOrder: 1, lastOrder: 1, legend: [definition],
  steps: [{
    ...identity, order: 1, from: formula, to: formula, operation: "Rewrite", kind: "equivalence" as const,
    kindLabel: "Equivalent", rule: { ...described, formula },
    explanation: { ...identity, text: "Explanation", application: formula }, assumptions: [described],
  }],
};
const series = { ...labelled, data: [{ ...identity, x: 0, y: 1 }] };
const axis = { label: "Axis", unit: "mg/L" };
const chartBase = { ...base, kind: "chart" as const, label: "Chart", description: "Description", xAxis: axis, yAxis: axis };
const dotGroup = {
  ...labelled, data: [{ ...labelled, value: 1 }], x: 0, summary: { ...labelled, value: 1 },
  interval: { ...labelled, lower: 0, upper: 2 },
};
const liveUpdate = { intervalMs: 100, jitterAmplitude: 1, decimalPlaces: 1 };
const stage = { ...labelled, prompt: "Compare", mode: "observations" as const, topics: [{ text: "Topic", source }], allowOverlay: true };
const result = { ...labelled, value: 1, unit: "mg/L", propertyId: "ex:property" };

// These transport fixtures intentionally exercise all optional typed fields.
// Semantic compatibility between those options is covered by the domain tests.
const variants: readonly SceneBlock[] = [
  { ...base, kind: "prose", text: "Text", format: "markdown" },
  { ...base, kind: "math", label: "Formula", expression: "x", spokenText: "x", derivation: section,
    derivationDetails: [{ ...labelled, stepCount: 1, inputFormulaId: "item", resultFormulaId: "item", sections: [section] }] },
  { ...base, kind: "code", language: "javascript", code: "1", editable: true, executable: false, fallback: "1" },
  { ...base, kind: "media-reference", uri: "/image.svg", mediaType: "image/svg+xml", version: "1", integrity: "digest", alternativeText: "Illustration", caption: "Authored figure finding" },
  { ...base, kind: "list", listStyle: "ordered", items: [{ ...identity, text: "Item" }] },
  { ...base, kind: "definition-list", entries: [definition] },
  { ...base, kind: "table", caption: "Table", description: "Description", columns: [labelled], rows: [{ ...identity, cells: [{ ...identity, text: "Cell" }] }] },
  { ...base, kind: "group", children: [{ ...base, id: "child", kind: "prose", text: "Child" }], readingOrder: ["child"] },
  { ...base, kind: "prompt", prompt: "Question", responseMode: "single-choice", options: ["Yes", "No"], optionIds: ["yes", "no"], correctOptionId: "yes", expectedResult: "Yes", fallback: "Question" },
  { ...base, kind: "diagram", diagramType: "sequence", label: "Diagram", description: "Description",
    nodes: [{ ...described, notation: "x", emphasis: "normal", visualRole: "subject", visualMotif: "statistics", visualMotifRole: "highlight", groupIds: ["item"], parts: [described] }],
    groups: [labelled], edges: [{ ...labelled, sourceNodeId: "item", targetNodeId: "item", visualRole: "relation" }], focusNodeId: "item",
    states: [{ ...labelled, sharedEdgeAnnotations: [{ ...labelled, edgeIds: ["item"] }], activeNodeIds: ["item"], activeEdgeIds: ["item"], activeGroupIds: ["item"], focusNodeId: "item", focusGroupId: "item", contextGroupIds: ["item"], activeMessageIds: ["item"], participantBindings: [{ roleId: "item", participantId: "ex:participant", label: "Participant", source }] }],
    participantRoles: [labelled], messages: [{ ...labelled, sourceRoleId: "item", targetRoleId: "item" }],
    binaryExperiment: { ...identity, mode: "distribution", targetCount: 1, trialCount: 2, positiveProbability: 0.5, seed: 42, positiveLabel: "Positive", negativeLabel: "Negative", unitLabel: "Count", trialName: "Trial", stages: [{ ...identity, prompt: "Try", revealLevel: 1, trialCount: 2, positiveProbability: 0.5, arrangementIndex: 0, caseIndex: 0, seriesRun: 0 }] },
  },
  { ...chartBase, chartType: "bar", data: [{ ...identity, category: "Category", group: "Group", value: 1 }], annotations: [{ ...labelled, kind: "point", datumId: "item" }], liveUpdate, presentation: "complete" },
  { ...chartBase, chartType: "line", series: [series], liveUpdate, presentation: "complete", interpolation: "step-after", showPoints: true, yDomain: [0, 2], annotations: [{ ...labelled, kind: "point", seriesId: "item", datumId: "item" }, { ...labelled, kind: "x-range", seriesId: "item", startDatumId: "item", endDatumId: "item" }] },
  { ...chartBase, chartType: "dot", groups: [dotGroup], referenceLine: { ...labelled, value: 1 }, xScale: "linear", yMinimum: 0, markerRadius: 2, markerOpacity: 0.5, summaryRadius: 3, drawStems: true, observationLabel: "Observation", summaryLabel: "Summary", curves: [series] },
  { ...chartBase, chartType: "box", groups: [dotGroup], quantileMethod: "type7", fenceMultiplier: 1.5, yMinimum: 0, showObservations: true },
  { ...chartBase, chartType: "histogram", edges: [0, 1, 2], normalization: "density", data: [{ ...identity, value: 1 }], curves: [series], binCounts: [1, 1], states: [{ ...described, binCounts: [1, 1] }], binAdjustment: { minimumWidth: 0.5, maximumWidth: 2, widthStep: 0.5 } },
  { ...chartBase, chartType: "histogram2d", edges: [0, 1, 2], yEdges: [0, 1, 2], data: [{ ...identity, value: 1, y: 1 }] },
  { ...chartBase, chartType: "observations", view: "summary", momentMetric: "mean", compact: true, interactive: false,
    series: [{ ...labelled, datasetId: "ex:dataset", data: [{ ...labelled, value: 1 }], summaries: { mean: result, variance: result, sd: result } }],
    threshold: { minimum: 0, maximum: 2, initial: 1, step: 0.1, lowerInitial: 0 },
    formal: { definition: "Definition", expression: "x", spokenText: "x", source },
    comparison: { minimum: 0, maximum: 2, interval: [0, 2], stages: [{ ...stage, investigations: [{ ...stage, mode: "rank" }] }], details: [{ text: "Detail", expression: "x", source }] },
  },
  { ...chartBase, chartType: "experiment", experimentKind: "pearson", parameters: [{ ...labelled, key: "mode", value: 0, minimum: 0, maximum: 1, step: 1, adjustable: true }], data: [{ x: 0, y: 1, z: 2, label: "Pair", source }] },
];

function sceneDocument(block: SceneBlock): SceneDocument {
  return {
    version: "1.14", id: "document", sourcePathId: "ex:path",
    scenes: [{ id: "scene", source, blocks: [block], readingOrder: [block.id], narration: "Narration", accessibility: base.accessibility, topic: { label: "Topic", source } }],
  };
}
type Path = readonly (string | number)[];
function formatPath(path: Path): string {
  return "SceneDocument" + path.map(key => typeof key === "number" ? `[${key}]` : `.${key}`).join("");
}
function fields(value: unknown, path: Path = []): Array<{ path: Path; replacement: unknown }> {
  const paths: Array<{ path: Path; replacement: unknown }> = [];
  if (value === null || value === undefined) return paths;
  paths.push({ path, replacement: typeof value === "string" ? 123 : typeof value === "number" || typeof value === "boolean" ? "invalid" : null });
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) paths.push(...fields(child, [...path, Array.isArray(value) ? Number(key) : key]));
  }
  return paths;
}
function mutate(value: SceneDocument, path: Path, replacement: unknown): unknown {
  if (!path.length) return replacement;
  const copy = JSON.parse(JSON.stringify(value));
  let current = copy;
  for (const key of path.slice(0, -1)) current = current[key];
  current[path.at(-1)!] = replacement;
  return copy;
}

test("all block variants validate every nested typed field before semantic processing", () => {
  const names = variants.map(block => block.kind === "chart" ? `chart:${block.chartType}` : block.kind);
  assert.equal(new Set(names).size, 18);
  let checked = 0;
  for (const block of variants) {
    const valid = sceneDocument(block);
    assert.doesNotThrow(() => assertSceneDocumentStructure(valid));
    for (const { path, replacement } of fields(valid)) {
      const invalid = mutate(valid, path, replacement);
      assert.throws(() => assertSceneDocumentStructure(invalid), (error: unknown) =>
        error instanceof SceneContractError && (path.at(-1) === "version" || error.message.includes(formatPath(path))),
      `invalid ${formatPath(path)} in ${block.kind} must identify the field`);
      checked++;
    }
  }
  assert.ok(checked > 1500, `expected broad nested contract coverage, got ${checked}`);
});

test("rejects unknown discriminators, malformed containers, sparse arrays, tuple lengths and recursive cycles", () => {
  for (const input of [null, [], 42, "document", {}, { version: "9.0" }]) assert.throws(() => validateSceneDocument(input), SceneContractError);
  const doc = sceneDocument({ id: "block", kind: "prose", text: "Text", source });
  for (const kind of ["unknown", "constructor", "toString"]) {
    assert.throws(() => validateSceneDocument(mutate(doc, ["scenes", 0, "blocks", 0, "kind"], kind)), /\.kind is unsupported/);
  }
  assert.throws(() => validateSceneDocument(mutate(doc, ["scenes"], new Array(1))), /scenes\[0\] must be an object/);
  const line = sceneDocument(variants.find(block => block.kind === "chart" && block.chartType === "line")!);
  for (const pair of [[0], [0, 1, 2], [0, "1"]]) {
    assert.throws(() => assertSceneDocumentStructure(mutate(line, ["scenes", 0, "blocks", 0, "yDomain"], pair)), /yDomain/);
  }
  const group: any = { id: "block", kind: "group", source, readingOrder: ["block"] };
  group.children = [group];
  assert.throws(() => validateSceneDocument(sceneDocument(group)), /children\[0\] must not contain a cycle/);
});

test("validation retains valid historical versions, shared object references and additive metadata without mutation", () => {
  for (const version of SCENE_DOCUMENT_VERSIONS) {
    const doc: unknown = { version, id: "document", sourcePathId: "ex:path", additional: { opaque: true }, scenes: [
      { id: "scene", source, blocks: [{ id: "block", source, kind: "prose", text: "Text" }], readingOrder: ["block"] },
    ] };
    const before = JSON.stringify(doc);
    validateSceneDocument(doc);
    assert.equal(JSON.stringify(doc), before);
  }
  assert.equal(isSceneDocumentVersion("1.15"), false);
  assert.equal(isSceneDocumentVersion(1.14), false);
  assert.equal(supportsSceneCapability("1.9", "histograms"), false);
  assert.equal(supportsSceneCapability("1.10", "histograms"), true);
  assert.equal(supportsSceneCapability("1.12", "topics"), false);
  assert.equal(supportsSceneCapability("1.13", "topics"), true);
  assert.equal(supportsSceneCapability("1.13", "experiments"), false);
  for (const capability of ["diagrams", "charts", "derivations", "histograms", "moments", "topics", "experiments"] as const) {
    assert.equal(supportsSceneCapability("1.14", capability), true);
  }
});

test("nested blocks retain the declared capability version", () => {
  const table: SceneBlock = { id: "table", source, kind: "table", caption: "Table", columns: [labelled], rows: [{ ...identity, cells: [{ ...identity, text: "Cell" }] }] };
  const doc = { id: "document", sourcePathId: "ex:path", scenes: [{ id: "scene", source, blocks: [{ id: "group", source, kind: "group", children: [table], readingOrder: ["table"] }], readingOrder: ["group"] }] };
  assert.throws(() => validateSceneDocument({ ...doc, version: "1.4" }), /table requires SceneDocument 1.5/);
  for (const version of ["1.5", "1.9", "1.10", "1.13", "1.14"]) assert.doesNotThrow(() => validateSceneDocument({ ...doc, version }));
});
