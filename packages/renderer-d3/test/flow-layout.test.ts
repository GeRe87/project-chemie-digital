import assert from "node:assert/strict";
import test from "node:test";
import { flowPixelPath, wrapFlowText } from "../src/flow-layout.ts";

// Deliberately proportional metrics: character counts are not text widths.
const measure = (text: string) => [...text].reduce((width, char) => width + (char === "W" ? 18 : char === "i" ? 4 : 9), 0);

test("wraps process and relation labels using measured widths without losing words", () => {
  for (const label of ["Sample preparation", "Data processing", "produces material for", "produces data for", "WWW iii WWW", "A much longer analytical sample preparation process"]) {
    const lines = wrapFlowText(label, 120, measure);
    assert.equal(lines.join(" "), label);
    assert.ok(lines.every((line) => measure(line) <= 120));
  }
});

test("retains explicit newlines and exact-fit text", () => {
  assert.deepEqual(wrapFlowText("Sampling\nMeasurement", 200, measure), ["Sampling", "Measurement"]);
  assert.deepEqual(wrapFlowText("supports", measure("supports"), measure), ["supports"]);
  assert.deepEqual(wrapFlowText("", 100, measure), [""]);
});

test("breaks long unspaced labels without ellipsis or lost graphemes", () => {
  const label = "W".repeat(64);
  const lines = wrapFlowText(label, 120, measure);
  assert.equal(lines.join(""), label);
  assert.ok(lines.every((line) => measure(line) <= 120));
  const accented = "e\u0301".repeat(6);
  assert.deepEqual(wrapFlowText(accented, 18, measure), Array(6).fill("e\u0301"));
});

test("pixel frames contain only square steps and stay inside their requested bounds", () => {
  const path = flowPixelPath(12, 16, 320, 132);
  assert.ok(path.endsWith("Z"));
  assert.doesNotMatch(path, /[ACLQST]/);
  let axis = "x";
  for (const match of path.matchAll(/([MHV]) ([\d.]+)(?: ([\d.]+))?/g)) {
    const [, command, first, second] = match;
    if (command === "M") {
      assert.equal(Number(first), 24);
      assert.equal(Number(second), 16);
    } else {
      axis = command === "H" ? "x" : "y";
      assert.ok(Number(first) >= (axis === "x" ? 12 : 16));
      assert.ok(Number(first) <= (axis === "x" ? 332 : 148));
    }
  }
});
