import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("missing motif families have vector masks, with reserved supporting-title space", () => {
  const css = readFileSync(new URL("../src/card-primitives.css", import.meta.url), "utf8");
  for (const motif of ["multiple-inputs", "nonlinear-curve", "neural-network", "other-models"]) {
    assert.ok(css.includes(`[data-visual-motif="${motif}"] {\n  --pcd-motif-mask: url("data:image/svg+xml,`));
  }
  assert.match(css, /padding-inline-end: 5\.6rem/);
  assert.match(css, /min-block-size: 2\.35rem/);
  assert.ok(css.includes("Unknown decoration must not fall back to a coloured rectangle."));
});
