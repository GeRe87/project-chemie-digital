import assert from "node:assert/strict";
import test from "node:test";
import { timelineRunLabelPlacement } from "../src/timeline-chart.ts";
import { createD3FlowRenderModel } from "../src/flow-diagram.ts";
import { createD3FlowLayout } from "../src/flow-layout.ts";
import { createD3LineChartRenderModel, lineChartPresentationPlan } from "../src/line-chart.ts";
import { validateSceneDocument, type DiagramBlock, type LineChartBlock } from "../../core/src/scene-document.ts";
import { createRevealRenderPlan } from "../../renderer-reveal/src/index.ts";
import { createSelfStudyRenderPlan } from "../../renderer-self-study/src/index.ts";

const source = [{resourceId: "urn:unrelated:source"}];
const diagram: DiagramBlock = {id: "d", kind: "diagram", diagramType: "flow", label: "Generic interface", description: "Not a talk identity", source,
  nodes: [{id: "a", label: "A", parts: [{id: "ap", label: "Part A", source}, {id: "ap2", label: "Child A", parentPartId: "ap", source}], source}, {id: "b", label: "B", parts: [{id: "bp", label: "Part B", source}, {id: "bp2", label: "Child B", parentPartId: "bp", source}], source}],
  edges: [{id: "e", label: "refines", sourceNodeId: "a", sourcePartId: "ap", targetNodeId: "b", targetPartId: "bp", source}]};
const line: LineChartBlock = {id: "c", kind: "chart", chartType: "line", label: "Evidence", description: "Unrelated chart", source,
  xAxis: {label: "Time"}, yAxis: {label: "Response"}, series: [{id: "s", label: "S", source, data: [{id: "p", x: 0, y: 1, source}, {id: "q", x: 1, y: 2, source}]}],
  annotations: [{id: "annotation", kind: "point", seriesId: "s", datumId: "q", label: "Check evidence", source, media: {uri: "/evidence.svg", alternativeText: "Synthetic reference comparison"}}]};
const doc = (block: DiagramBlock | LineChartBlock) => ({id: "doc", version: "1.14" as const, sourcePathId: "path", scenes: [{id: "scene", source, blocks: [block], readingOrder: [block.id]}]});

test("run identifiers use authored phase selection and move above short bars", () => {
  assert.equal(timelineRunLabelPlacement("S1", 20, true), "above");
  assert.equal(timelineRunLabelPlacement("Standard1", 110, true), "inside");
  assert.equal(timelineRunLabelPlacement("S1", 400, false), undefined);
  assert.equal(timelineRunLabelPlacement("S1", 20), undefined);
  assert.equal(timelineRunLabelPlacement("S1", 100), "inside");
});

test("endpoint parts survive projection and reject cross-node or missing parts", () => {
  validateSceneDocument(doc(diagram));
  const result = createD3FlowRenderModel(diagram, {reducedMotion: true, interactionPolicy: "static"});
  assert.equal(result.model?.edges[0]?.sourcePartId, "ap");
  assert.equal(result.model?.edges[0]?.targetPartId, "bp");
  for (const plan of [createRevealRenderPlan(doc(diagram), {reducedMotion: true, interactionPolicy: "static"}).plan, createSelfStudyRenderPlan(doc(diagram)).plan]) {
    const node = plan?.sections[0]?.nodes[0];
    assert.equal(node?.kind, "diagram");
    if (node?.kind !== "diagram") throw new Error("Expected diagram projection");
    assert.equal(node.edges[0]?.sourcePartId, "ap");
    assert.equal(node.edges[0]?.targetPartId, "bp");
  }
  for (const id of ["bp", "missing"]) {
    const broken = {...diagram, edges: diagram.edges.map(edge => ({...edge, sourcePartId: id}))};
    assert.throws(() => validateSceneDocument(doc(broken)), /endpoint part/);
    assert.ok(createD3FlowRenderModel(broken, {reducedMotion: true, interactionPolicy: "static"}).diagnostics.length);
  }
});

test("annotation media preserves its own stage, alternative and immutable source", () => {
  const before = JSON.stringify(line);
  validateSceneDocument(doc(line));
  const result = createD3LineChartRenderModel(line);
  assert.equal(result.model?.annotations[0]?.kind, "point");
  assert.match(result.model!.staticFallback, /Synthetic reference comparison/);
  assert.equal(lineChartPresentationPlan(result.model!.annotations).stepCount, 2);
  assert.equal(JSON.stringify(line), before);
  const study = createSelfStudyRenderPlan(doc(line)).plan?.sections[0]?.nodes[0];
  assert.equal(study?.kind, "chart");
  assert.match(study!.staticFallback, /Synthetic reference comparison/);
  for (const uri of ["https://example.org/remote.svg", "/../secret.svg", "javascript:alert(1)"]) {
    const broken = structuredClone(line);
    Object.assign(broken.annotations![0], {media: {uri, alternativeText: "not safe"}});
    assert.throws(() => validateSceneDocument(doc(broken)), /local asset/);
  }
});

test("a generic semantic-tool hub reserves illustrated cards and non-crossing aligned connectors", () => {
  const roles = ["input", "control", "process", "output", "specification", "storage"];
  const nodes = roles.map((role, i) => ({id: `unrelated-${i}`, label: role, description: "Two lines\nOf description", visualRole: role, visualMotif: "semantic-model" as const, visualMotifRole: "highlight" as const}));
  const id = (role: string) => nodes.find(n => n.visualRole === role)!.id;
  const pairs = [["specification", "process"], ["input", "process"], ["control", "process"], ["process", "output"], ["output", "storage"]];
  const input = {diagramType: "network" as const, nodes, edges: pairs.map(([a,b], i) => ({id: `e${i}`, label: "connects", sourceNodeId: id(a!), targetNodeId: id(b!)}))};
  for (const width of [390, 1440]) {
    const layout = createD3FlowLayout(input, width);
    assert.equal(layout.strategy, "orchestration-system");
    assert.ok(layout.nodes.every(node => node.height >= 244));
    for (const edge of layout.edges) {
      assert.equal(edge.routePoints!.length, 2);
      const [a,b] = edge.routePoints!;
      assert.ok(a!.x === b!.x || a!.y === b!.y);
    }
    for (const a of layout.nodes) for (const b of layout.nodes) if (a !== b) {
      assert.ok(Math.abs(a.x-b.x) >= (a.width+b.width)/2 || Math.abs(a.y-b.y) >= (a.height+b.height)/2);
    }
  }
});
