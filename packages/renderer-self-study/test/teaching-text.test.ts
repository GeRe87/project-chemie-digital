import assert from "node:assert/strict";
import test from "node:test";
import { renderStudyInline } from "../src/teaching-text.ts";
import { createSelfStudyRenderPlan, renderSelfStudyHtml } from "../src/index.ts";
import type { SceneDocument } from "../../core/src/scene-document.ts";

test("explicit inline math receives the same KaTeX HTML and MathML as display math", () => {
  const html=renderStudyInline(String.raw`The mean $\bar Y$ has SE \(\sigma/\sqrt n\).`);
  assert.equal((html.match(/class="katex"/gu)??[]).length,2);
  assert.equal((html.match(/class="katex-html"/gu)??[]).length,2);
  assert.match(html,/<math/);assert.doesNotMatch(html,/\$/);
});

test("math does not turn escaped HTML, code or trusted links into active markup",()=>{
  const html=renderStudyInline('<img src=x onerror=alert(1)> `x_i $no math$` **Important** $\\href{javascript:alert(1)}{x}$');
  assert.match(html,/&lt;img/);assert.match(html,/<code>x_i \$no math\$<\/code>/);
  assert.match(html,/<strong>Important<\/strong>/);assert.doesNotMatch(html,/<img|<a\s|href="javascript:/);
  assert.equal(renderStudyInline('Unmatched $ and <b>'), 'Unmatched $ and &lt;b&gt;');
});

test("definition symbols preserve authored math notation and source identity in self-study",()=>{
  const source=[{resourceId:'any-resource'}];
  const d:SceneDocument={version:'1.7',id:'doc',sourcePathId:'path',scenes:[{id:'s',source,readingOrder:['legend'],blocks:[{
    kind:'definition-list',id:'legend',source,entries:[{id:'symbol',term:'Ybar',expression:String.raw`\bar Y`,symbol:true,description:'Sample mean.',source}],
  }]}]};
  const result=createSelfStudyRenderPlan(d);assert.ok(result.plan);
  const html=renderSelfStudyHtml(result.plan,{interactive:false});
  assert.match(html,/<dt><span class="katex"/);assert.match(html,/\\bar Y/);
  assert.match(html,/data-resource-id="any-resource"/);assert.match(html,/Sample mean/);
});
