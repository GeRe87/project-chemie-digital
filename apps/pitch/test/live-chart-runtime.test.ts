import assert from "node:assert/strict";
import test from "node:test";

import { jitteredValues } from "../src/live-chart-runtime.ts";

test("live measurement jitter stays within authored amplitude", () => {
  const base = [0.5, 1.0];
  const low = jitteredValues(base, 0.1, () => 0);
  const high = jitteredValues(base, 0.1, () => 1);
  assert.deepEqual(low, [0.4, 0.9]);
  assert.deepEqual(high, [0.6, 1.1]);
});
