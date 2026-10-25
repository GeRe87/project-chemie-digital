import assert from "node:assert/strict";
import test from "node:test";
import { teachingInlineMarkup, teachingTextMarkup, symbolLegendMarkup } from "../src/teaching-text.ts";

test("formula symbols have stable distinct palette tokens without coloring prose words",()=>{
  const symbols=symbolLegendMarkup("n, i and xᵢ; mean is in the original unit");
  assert.match(symbols,/pcd-math-symbol-\d">n<\/span>/);
  assert.match(symbols,/pcd-math-symbol-\d">i<\/span>/);
  assert.match(symbols,/pcd-math-symbol-\d">xᵢ<\/span>/);
  assert.match(symbols,/; mean is in the original unit$/);
  assert.equal(symbolLegendMarkup("n"),symbolLegendMarkup("n"));
  assert.notEqual(symbolLegendMarkup("n").match(/symbol-(\d)/)?.[1],symbolLegendMarkup("i").match(/symbol-(\d)/)?.[1]);
  assert.equal(new Set(["K","m₂","m₄"].map(s=>symbolLegendMarkup(s).match(/symbol-(\d)/)?.[1])).size,3);
  assert.doesNotMatch(symbolLegendMarkup('<script>n</script>'),/<script>/);
});

test("inline card emphasis keeps ordinary explanation outside strong and highlight spans", () => {
  assert.equal(teachingInlineMarkup("Keep **conditions** fixed for a ==short interval==."),
    'Keep <strong>conditions</strong> fixed for a <span class="pcd-marker-highlight pcd-marker-highlight--cyan">short interval</span>.');
});

test("card highlights never permit authored HTML or scripts", () => {
  const result = teachingInlineMarkup('==<script>alert("x")</script>==');
  assert.doesNotMatch(result, /<script>/);
  assert.match(result, /&lt;script&gt;/);
});

test("existing short teaching lists retain semantic task and question markers", () => {
  const result = teachingTextMarkup("- [?] Compare **spread**.\n- [!] Report ==conditions==.");
  assert.match(result, /data-marker-purpose="question"/);
  assert.match(result, /data-marker-purpose="task"/);
  assert.match(result, /pcd-marker-highlight--cyan/);
});
