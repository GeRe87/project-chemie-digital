import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../src/evidence-primitives.css", import.meta.url), "utf8");

test("data-visual evidence keeps prose and table in the left rail and chart on the right", () => {
  assert.match(
    css,
    /data-composition-profile="data-visual"[\s\S]*?data-composition-region-container="prelude"[\s\S]*?grid-column:\s*1;[\s\S]*?grid-row:\s*2;/u,
  );
  assert.match(
    css,
    /data-composition-profile="data-visual"[\s\S]*?data-composition-region-container="primary"[\s\S]*?grid-column:\s*1;[\s\S]*?grid-row:\s*3;/u,
  );
  assert.match(
    css,
    /data-composition-profile="data-visual"[\s\S]*?data-composition-region-container="secondary"[\s\S]*?grid-column:\s*2;[\s\S]*?grid-row:\s*2\s*\/\s*5;/u,
  );
});

test("two-column evidence tables use generic column colour coding", () => {
  assert.match(css, /:has\(thead th:nth-child\(2\):last-child\)/u);
  assert.match(css, /var\(--pcd-chart-series-1\)/u);
  assert.match(css, /var\(--pcd-chart-series-4\)/u);
  assert.doesNotMatch(css.toLowerCase(), /uv\/vis|chemometrics|concentration|absorbance/u);
});
