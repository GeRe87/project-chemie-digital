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

import { createLiveChartPlayback, type LiveChartClock } from "../src/live-chart-runtime.ts";

class Clock implements LiveChartClock {
  time = 0; nextId = 0;
  readonly intervals = new Map<number, () => void>();
  readonly frames = new Map<number, (now: number) => void>();
  now = () => this.time;
  setInterval = (callback: () => void) => { const id = ++this.nextId; this.intervals.set(id, callback); return id; };
  clearInterval = (id: number) => { this.intervals.delete(id); };
  requestAnimationFrame = (callback: (now: number) => void) => { const id = ++this.nextId; this.frames.set(id, callback); return id; };
  cancelAnimationFrame = (id: number) => { this.frames.delete(id); };
  tick() { for (const callback of [...this.intervals.values()]) callback(); }
  frame(now: number) { this.time = now; const frames = [...this.frames.values()]; this.frames.clear(); for (const callback of frames) callback(now); }
}

test("live charts schedule work only while visible and cancel an in-flight frame on suspension", () => {
  const clock = new Clock();
  let active = false;
  const renders: number[][] = [];
  const player = createLiveChartPlayback({ baseValues: [1, 2], amplitude: .2, intervalMs: 1000,
    reducedMotion: false, isActive: () => active, render: values => renders.push([...values]), random: () => 1, clock });
  assert.equal(clock.intervals.size, 0);
  active = true; player.refresh(); player.refresh();
  assert.equal(clock.intervals.size, 1);
  clock.tick(); assert.equal(clock.frames.size, 1);
  clock.frame(350); assert.equal(renders.length, 1);
  active = false; player.refresh();
  assert.equal(clock.intervals.size, 0); assert.equal(clock.frames.size, 0);
  clock.frame(10000); assert.equal(renders.length, 1);
  active = true; player.refresh();
  assert.equal(clock.intervals.size, 1); assert.equal(clock.frames.size, 0);
  clock.tick(); clock.frame(10700);
  assert.deepEqual(renders.at(-1), [1.2, 2.2]);
  player.destroy(); player.destroy(); player.refresh();
  assert.equal(clock.intervals.size, 0); assert.equal(clock.frames.size, 0);
});

test("live charts honor reduced motion and recheck activity before drawing", () => {
  const clock = new Clock();
  let active = true, renders = 0;
  const config = { baseValues: [1], amplitude: .2, intervalMs: 1000, isActive: () => active, render: () => renders++, clock };
  const reduced = createLiveChartPlayback({ ...config, reducedMotion: true });
  reduced.refresh(); assert.equal(clock.intervals.size, 0); reduced.destroy();
  const player = createLiveChartPlayback({ ...config, reducedMotion: false });
  clock.tick(); active = false; clock.frame(700);
  assert.equal(renders, 0); assert.equal(clock.intervals.size, 0); assert.equal(clock.frames.size, 0);
  player.destroy();
});
