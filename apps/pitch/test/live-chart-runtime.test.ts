import assert from "node:assert/strict";
import test from "node:test";

import { interpolateLiveValues, jitteredValues, stableLiveYDomain } from "../src/live-chart-runtime.ts";

test("live measurement jitter stays within authored amplitude", () => {
  const base = [0.5, 1.0];
  const low = jitteredValues(base, 0.1, () => 0);
  const high = jitteredValues(base, 0.1, () => 1);
  assert.deepEqual(low, [0.4, 0.9]);
  assert.deepEqual(high, [0.6, 1.1]);
});


test("live focus domain contains the full jitter envelope with stable padding", () => {
  const base = [0.500, 0.515, 0.483, 0.496, 0.504, 0.504];
  const [minimum, maximum] = stableLiveYDomain(base, 0.012);
  assert.ok(minimum < 0.471);
  assert.ok(maximum > 0.527);
  assert.ok(maximum - minimum < 0.08);
  assert.deepEqual(stableLiveYDomain(base, 0.012), [minimum, maximum]);
});

test("live interpolation eases continuously and lands exactly on the target", () => {
  const from = [0.48, 0.52];
  const to = [0.52, 0.48];
  assert.deepEqual(interpolateLiveValues(from, to, 0), from);
  assert.deepEqual(interpolateLiveValues(from, to, 1), to);
  assert.deepEqual(interpolateLiveValues(from, to, 0.5), [0.5, 0.5]);
  const early = interpolateLiveValues(from, to, 0.25);
  assert.ok(early[0]! > from[0]! && early[0]! < 0.5);
  assert.ok(early[1]! < from[1]! && early[1]! > 0.5);
});

test("live interpolation rejects arrays with different shapes", () => {
  assert.throws(() => interpolateLiveValues([1], [1, 2], 0.5), /equally sized/);
});
