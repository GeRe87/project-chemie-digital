import assert from "node:assert/strict";
import test from "node:test";
import { dotPlotGeometry, createD3DotPlotRenderModel } from "../src/dot-plot.ts";
import { dotPlotStaticFallback, validateSceneDocument, type DotPlotBlock } from "../../core/src/scene-document.ts";
import { inferRevealCompositionPlan } from "../../renderer-reveal/src/composition-policy.ts";
import { dotSummaryDiamond } from "../src/dot-plot-primitives.ts";

const source = [{ resourceId: "fixture:source" }];
test("ordinary and distribution dot plots share identical summary marker geometry",()=>{
  assert.equal(dotSummaryDiamond(10,20,3),"M10,17L13,20L10,23L7,20Z");
});
test("categorical intervals include closed endpoints and expand the numeric domain",()=>{
  const chart:DotPlotBlock={id:"interval",kind:"chart",chartType:"dot",label:"Coverage",description:"Same data",source,xAxis:{label:"Choice"},yAxis:{label:"Signal",unit:"a.u."},groups:[{id:"g",label:"Interval",source,data:[1,2,3].map((value,i)=>({id:`o${i}`,value,source})),interval:{id:"i",label:"Bounds",lower:1,upper:2,source}}]};
  const doc={version:"1.11" as const,id:"doc",sourcePathId:"path",scenes:[{id:"s",source,blocks:[chart],readingOrder:[chart.id]}]};
  validateSceneDocument(doc);assert.throws(()=>validateSceneDocument({...doc,version:"1.10"}),/1.11/);
  assert.match(dotPlotStaticFallback(chart),/2\/3 observations/);
  const extended={...chart,groups:[{...chart.groups[0],interval:{...chart.groups[0].interval!,lower:-10,upper:20}}]};
  const geometry=dotPlotGeometry(extended,900,500);assert(geometry.y.domain()[0]<=-10);assert(geometry.y.domain()[1]>=20);
  assert.throws(()=>validateSceneDocument({...doc,scenes:[{...doc.scenes[0],blocks:[{...chart,groups:[{...chart.groups[0],interval:{...chart.groups[0].interval!,upper:0}}]}]}]}),/bounds|ordered/);
});
test("prose and a single formula reuse the generic two-column composition",()=>{
  const prose={id:"p",kind:"prose" as const,text:"Meaning and calculation",format:"markdown" as const,source};
  const formula={id:"f",kind:"math" as const,expression:"a_1",source};
  const scene={id:"generic",source,blocks:[prose,formula],readingOrder:[prose.id,formula.id]};
  const plan=inferRevealCompositionPlan(scene);assert.equal(plan.profile,"info-visual");assert.deepEqual(plan.placements.map(p=>p.region),["primary","secondary"]);
});
function block(): DotPlotBlock {
  return {
    id: "unrelated-measurement", kind: "chart", chartType: "dot", source,
    label: "Independent coordinates", description: "Generic contract fixture",
    xAxis: { label: "Input" }, yAxis: { label: "Response", unit: "a.u." },
    xScale: "linear", yMinimum: 0, markerRadius: 3, markerOpacity: .6,
    groups: [
      { id: "first", label: "4", x: 4, source, data: [{ id: "a", value: 1, source }], summary: { id: "s", label: "Mean", value: 1, source } },
      { id: "second", label: "40", x: 40, source, data: [{ id: "b", value: 7, source }] },
    ],
    referenceLine: { id: "target", label: "Reference", value: 9, source },
    curves: [{ id: "curve", label: "Theory", source, data: [{ id: "c", x: 4, y: 2, source }, { id: "d", x: 40, y: 10, source }] }],
  };
}
function validate(chart: DotPlotBlock): void {
  validateSceneDocument({ version: "1.6", id: "fixture", sourcePathId: "fixture:path", scenes: [{ id: "scene", source, blocks: [chart], readingOrder: [chart.id] }] });
}
test("numeric scatter keeps numeric distances and all authored layers", () => {
  const chart = block(); validate(chart);
  const geometry = dotPlotGeometry(chart, 1000, 500);
  assert.ok(geometry.numericX);
  assert.equal(geometry.numericX(22), (geometry.numericX(4) + geometry.numericX(40)) / 2);
  assert.equal(geometry.y.domain()[0], 0);
  assert.ok(geometry.y.domain()[1]! >= 10);
  const model = createD3DotPlotRenderModel(chart).model!;
  assert.deepEqual(model.groups, chart.groups);
  assert.deepEqual(model.curves, chart.curves);
  assert.match(dotPlotStaticFallback(chart), /Mean: 1/);
  assert.match(dotPlotStaticFallback(chart), /Theory: x=40, y=10/);
});
test("authored non-rounded minimum is not changed by nice()", () => {
  const chart = { ...block(), yMinimum: .7 };
  assert.equal(dotPlotGeometry(chart, 1000, 500).y.domain()[0], .7);
});
test("categorical dot plots remain categorical without new options", () => {
  const chart = { ...block(), xScale: undefined, curves: undefined, yMinimum: undefined };
  validate(chart);
  assert.equal(dotPlotGeometry(chart, 1000, 500).numericX, undefined);
});
test("stem variant assigns individual categories and keeps a nonzero shared reference", () => {
  const chart: DotPlotBlock = { ...block(), drawStems: true, xScale: undefined, curves: undefined,
    groups: block().groups.map(g => ({ ...g, summary: undefined, data: g.data.map(d => ({ ...d, label: `Category ${d.id}` })) })) };
  validate(chart);
  const geometry = dotPlotGeometry(chart, 1000, 500);
  assert.deepEqual(geometry.x.domain(), ["a", "b"]);
  assert.ok(geometry.x("a")! < geometry.x("b")!);
  assert.notEqual(geometry.y(chart.referenceLine!.value), geometry.y(0));
  assert.match(dotPlotStaticFallback(chart), /deviation -8/);
  assert.throws(() => validate({ ...chart, referenceLine: undefined }), /reference/);
  assert.throws(() => validate({ ...chart, groups: block().groups }), /category label/);
});
test("invalid domains and marker options are rejected rather than clipping data", () => {
  assert.throws(() => validate({ ...block(), yMinimum: 2 }), /below y minimum/);
  assert.throws(() => validate({ ...block(), markerOpacity: 1.1 }), /opacity/);
  assert.throws(() => validate({ ...block(), markerRadius: -1 }), /radius/);
  assert.throws(() => validate({ ...block(), groups: block().groups.map(g => ({ ...g, x: undefined })) }), /requires x/);
  assert.throws(() => validate({ ...block(), xScale: undefined }), /curve requires numeric/);
});
test("curves have strictly increasing finite coordinates", () => {
  const chart = block();
  assert.throws(() => validate({ ...chart, curves: chart.curves!.map(c => ({ ...c, data: [...c.data].reverse() })) }), /must increase/);
});
test("chart with concise conclusions uses existing visual stage independently of IDs", () => {
  const chart = block();
  const conclusion = { id: "conclusion", kind: "list" as const, listStyle: "unordered" as const, items: [{ id: "item", text: "Compare the two estimates.", source }], source };
  const scene = { id: "arbitrary", source, blocks: [chart, conclusion], readingOrder: [chart.id, conclusion.id] };
  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.kind, "visual-stage");
  assert.deepEqual(plan.placements.map(p => p.region), ["main", "footer"]);
  assert.deepEqual(inferRevealCompositionPlan({ ...scene, id: "renamed" }), plan);
});
