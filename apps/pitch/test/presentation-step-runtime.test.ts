import assert from "node:assert/strict";
import test from "node:test";

import {
  clampPresentationStep,
  stepFromVisibleCount,
} from "../src/presentation-step-runtime.ts";

test("presentation steps clamp deterministically in both directions", () => {
  assert.equal(clampPresentationStep(-4, 3), 0);
  assert.equal(clampPresentationStep(0, 3), 0);
  assert.equal(clampPresentationStep(2, 3), 2);
  assert.equal(clampPresentationStep(99, 3), 3);
});

test("visible Reveal fragments reconstruct the absolute D3 step", () => {
  assert.equal(stepFromVisibleCount(0, 4), 0);
  assert.equal(stepFromVisibleCount(1, 4), 1);
  assert.equal(stepFromVisibleCount(3, 4), 3);
  assert.equal(stepFromVisibleCount(7, 4), 4);
});
