import assert from "node:assert/strict";
import test from "node:test";
import { teachingInlineMarkup, teachingTextMarkup } from "../src/teaching-text.ts";

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
