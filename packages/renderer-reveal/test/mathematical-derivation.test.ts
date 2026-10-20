import assert from "node:assert/strict";
import test from "node:test";
import { validateSceneDocument, validateMathematicalDerivation, validateMathematicalDerivationDetail, type MathematicalDerivationSection, type SceneDocument } from "../../core/src/scene-document.ts";
import { derivationLayout, renderMathematicalDerivation, renderDerivationExplanation, renderDerivationDetail, renderDerivationDetailButtons, derivationText } from "../src/mathematical-derivation.ts";
import { createRevealRenderPlan } from "../src/index.ts";
import { createSelfStudyRenderPlan, renderSelfStudyHtml } from "../../renderer-self-study/src/index.ts";

const source = [{ resourceId: "fixture:source" }];
const f = (id: string, expression: string) => ({ id, expression, source });
function section(): MathematicalDerivationSection {
  return { id: "section", derivationId: "generic", label: "Additive identity", firstOrder: 1, lastOrder: 1, source,
    legend: [{ id: "legend", term: "x", description: "An arbitrary real number.", source }],
    steps: [{ id: "step", order: 1, from: f("from", "x=1"), to: f("to", "x+0=1"), operation: "Add zero", kind: "equivalence", kindLabel: "Equivalent transformation", source,
      rule: { id: "rule", label: "Additive identity", formula: f("rule-formula", "x+0=x"), description: "Adding zero preserves a value.", source },
      explanation: { id: "explanation", text: "Apply the identity.\nNo statistical assumption is needed.", application: f("application", "x+0=1"), source }, assumptions: [] }] };
}
function document(): SceneDocument {
  const value = section();
  return { version: "1.7", id: "doc", sourcePathId: "path", scenes: [{ id: "scene", source, blocks: [{ id: "block", kind: "math", expression: value.steps[0]!.from.expression, spokenText: value.label, derivation: value, source }], readingOrder: ["block"] }] };
}
test("ordinary formulas remain valid and derivations use a versioned extension", () => {
  validateSceneDocument(document());
  assert.throws(() => validateSceneDocument({ ...document(), version: "1.6" }), /1.7/);
  const plain: SceneDocument = { ...document(), version: "1.0", scenes: [{ id: "plain", source, blocks: [{ id: "f", kind: "math", expression: "x=1", spokenText: "x equals one", source }], readingOrder: ["f"] }] };
  assert.doesNotThrow(() => validateSceneDocument(plain));
});
test("layout uses expression extent and line count, never scientific identity", () => {
  assert.equal(derivationLayout(section()), "vertical");
  const value = section();
  const wide = { ...value, steps: value.steps.map(s => ({ ...s, to: f("long", "\\begin{gathered}x=1\\\\y=2\\end{gathered}") })) };
  assert.equal(derivationLayout(wide), "columns");
  assert.equal(derivationLayout({ ...wide, id: "unrelated", derivationId: "renamed", label: "Another title" }), "columns");
});
test("main markup includes explicit input, operation, mathematical rule and result stages", () => {
  const value = section();
  const markup = renderMathematicalDerivation(value, expression => `<math>${expression}</math>`);
  assert.match(markup, /x=1/); assert.match(markup, /x\+0=x/); assert.match(markup, /x\+0=1/);
  assert.match(markup, /data-presentation-disclosure-step="1"/);
  assert.match(markup, /data-presentation-disclosure-step="2"/);
  assert.match(markup, /aria-haspopup="dialog" disabled/);
  assert.match(markup, /data-derivation-step-id="step"/);
});
test("semantic formula labels and symbol notation are rendered without identity rules", () => {
  const value = section();
  const labeled = { ...value, legend: [{ ...value.legend[0]!, symbol: true, expression: "x_i" }],
    steps: value.steps.map(s => ({ ...s, from: { ...s.from, label: "A scientific <label>" } })) };
  const markup = renderMathematicalDerivation(labeled, expression => `<math>${expression}</math>`);
  assert.match(markup, /math-expression-label/);
  assert.match(markup, /A scientific &lt;label&gt;/);
  assert.match(markup, /symbol-math.*<math>x_i<\/math>/);
  assert.throws(() => validateMathematicalDerivation({ ...labeled, steps: labeled.steps.map(s => ({ ...s, from: { ...s.from, label: "" } })) }), /formula label/);
});
test("explanations escape prose and preserve general and applied mathematics", () => {
  const step = section().steps[0]!;
  const markup = renderDerivationExplanation({ ...step, rule: { ...step.rule, description: "<script>bad()</script>" } }, expression => `<math>${expression}</math>`);
  assert.match(markup, /General rule/); assert.match(markup, /Application to this step/);
  assert.match(markup, /&lt;script&gt;/); assert.doesNotMatch(markup, /<script>/);
  assert.match(markup, /x\+0=x/); assert.match(markup, /x\+0=1/);
});
test("main assumptions use semantic labels while the dialog retains the full prerequisites", () => {
  const value=section();
  const steps=value.steps.map(s=>({...s,assumptions:[{id:"finite",label:"Finite second moment",description:"The random quantity has a finite expectation of its square.",source}]}));
  const markup=renderMathematicalDerivation({...value,steps},e=>e);
  assert.match(markup,/Assumptions: <span title="The random quantity has a finite expectation of its square.">Finite second moment<\/span>/);
  assert.match(renderDerivationExplanation(steps[0]!,e=>e),/The random quantity has a finite expectation of its square/);
});
test("invalid order, missing assumptions and oversized sections do not trigger silent fitting", () => {
  const value = section();
  assert.throws(() => validateMathematicalDerivation({ ...value, firstOrder: 0 }), /first derivation/);
  assert.throws(() => validateMathematicalDerivation({ ...value, steps: value.steps.map(s => ({ ...s, kind: "statistical" })) }), /assumptions/);
  assert.throws(() => validateMathematicalDerivation({ ...value, steps: [value.steps[0]!, value.steps[0]!, value.steps[0]!] }), /explicit contiguous sections/);
});
test("Reveal and self-study retain the same semantic explanation rather than just the initial equation", () => {
  const input = document();
  const reveal = createRevealRenderPlan(input, { reducedMotion: true, interactionPolicy: "interactive-when-supported" });
  assert.deepEqual(reveal.diagnostics, []); assert.ok(reveal.plan);
  assert.match(JSON.stringify(reveal.plan), /No statistical assumption/);
  const study = createSelfStudyRenderPlan(input); assert.deepEqual(study.diagnostics, []); assert.ok(study.plan);
  const markup = renderSelfStudyHtml(study.plan, { interactive: false });
  assert.match(markup, /Additive identity/); assert.match(markup, /No statistical assumption/);
  assert.match(derivationText(section()), /x\+0=x/);
});

test("optional proof uses generic authored sections without fragments or presentation stages", () => {
  const detail = { id: "generic", label: "Optional <proof>", stepCount: 1, inputFormulaId: "from", resultFormulaId: "to", sections: [section()], source };
  validateMathematicalDerivationDetail(detail);
  const markup = renderDerivationDetail(detail,e=>`<math>${e}</math>`);
  assert.match(markup,/data-detail-step-id="step"/);
  assert.match(markup,/<details><summary>1. Add zero/);
  assert.match(markup,/No statistical assumption/);
  assert.doesNotMatch(markup,/fragment|data-presentation-disclosure|data-presentation-step/);
  assert.match(renderDerivationDetailButtons([detail]),/Optional &lt;proof&gt;/);
  assert.equal(renderDerivationDetailButtons(),"");
  assert.throws(()=>validateMathematicalDerivationDetail({...detail,stepCount:2}),/Incomplete/);
  assert.throws(()=>validateMathematicalDerivationDetail({...detail,sections:[section(),section()]}),/uniquely/);
  assert.throws(()=>validateMathematicalDerivationDetail({...detail,inputFormulaId:"different"}),/continuously/);
});

test("plain result formula keeps optional full proof in both render plans and static self-study", () => {
  const detail = { id: "generic", label: "Full reusable proof", stepCount: 1, inputFormulaId: "from", resultFormulaId: "to", sections: [section()], source };
  const input: SceneDocument = { ...document(), scenes: [{id:"result",source,blocks:[{id:"f",kind:"math",expression:"x+0=1",spokenText:"Result",derivationDetails:[detail],source}],readingOrder:["f"]}] };
  validateSceneDocument(input);
  assert.throws(()=>validateSceneDocument({...input,version:"1.6"}),/1.7/);
  const reveal=createRevealRenderPlan(input,{reducedMotion:true,interactionPolicy:"interactive-when-supported"});
  assert.deepEqual(reveal.diagnostics,[]);
  assert.match(JSON.stringify(reveal.plan),/Full reusable proof/);
  const study=createSelfStudyRenderPlan(input);
  assert.deepEqual(study.diagnostics,[]);assert.ok(study.plan);
  assert.match(renderSelfStudyHtml(study.plan,{interactive:false}),/No statistical assumption/);
});
