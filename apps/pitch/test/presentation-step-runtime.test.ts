import assert from "node:assert/strict";
import test from "node:test";

import {
  clampPresentationStep,
  isStageLockedSlide,
  markStageLockedSlide,
  mountPresentationStageLock,
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


test("marks staged slides structurally without scene identity", () => {
  const attributes = new Map<string, string>();
  const slide = {
    setAttribute(name: string, value: string) { attributes.set(name, value); },
    getAttribute(name: string) { return attributes.get(name) ?? null; },
  } as unknown as Element;

  assert.equal(isStageLockedSlide(slide), false);
  markStageLockedSlide(slide);
  assert.equal(attributes.get("data-has-stages"), "true");
  assert.equal(attributes.get("data-stage-lock"), "true");
  assert.equal(isStageLockedSlide(slide), true);
});

test("stage lock waits for Reveal to settle, then stabilizes fragments and unlocks on slide exit", () => {
  const deckListeners = new Map<string, Set<() => void>>();
  const stagedSlide = {
    getAttribute(name: string) {
      return name === "data-stage-lock" ? "true" : null;
    },
  } as unknown as HTMLElement;
  const plainSlide = {
    getAttribute() { return null; },
  } as unknown as HTMLElement;
  let currentSlide = stagedSlide;

  const viewportListeners = new Map<string, Set<EventListener>>();
  const viewport = {
    scrollTop: 340,
    addEventListener(type: string, listener: EventListener) {
      const set = viewportListeners.get(type) ?? new Set<EventListener>();
      set.add(listener);
      viewportListeners.set(type, set);
    },
    removeEventListener(type: string, listener: EventListener) {
      viewportListeners.get(type)?.delete(listener);
    },
  } as unknown as HTMLElement;

  const bodyClasses = new Set<string>();
  const body = {
    classList: {
      toggle(name: string, enabled?: boolean) {
        if (enabled) bodyClasses.add(name);
        else bodyClasses.delete(name);
        return Boolean(enabled);
      },
      remove(name: string) { bodyClasses.delete(name); },
    },
  };
  const root = { ownerDocument: { body } } as unknown as HTMLElement;

  const deck = {
    on(event: string, listener: () => void) {
      const set = deckListeners.get(event) ?? new Set<() => void>();
      set.add(listener);
      deckListeners.set(event, set);
    },
    off(event: string, listener: () => void) {
      deckListeners.get(event)?.delete(listener);
    },
    getCurrentSlide() { return currentSlide; },
    getViewportElement() { return viewport; },
  };

  const windowListeners = new Map<string, Set<EventListener>>();
  let scrollX = 12;
  let scrollY = 220;
  let nextFrameId = 1;
  const frames = new Map<number, FrameRequestCallback>();
  const browserWindow = {
    get scrollX() { return scrollX; },
    get scrollY() { return scrollY; },
    scrollTo(x: number, y: number) { scrollX = x; scrollY = y; },
    addEventListener(type: string, listener: EventListener) {
      const set = windowListeners.get(type) ?? new Set<EventListener>();
      set.add(listener);
      windowListeners.set(type, set);
    },
    removeEventListener(type: string, listener: EventListener) {
      windowListeners.get(type)?.delete(listener);
    },
    requestAnimationFrame(callback: FrameRequestCallback) {
      const id = nextFrameId++;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(handle: number) {
      frames.delete(handle);
    },
  };

  const runNextFrame = (): void => {
    const next = [...frames.entries()].sort(([a], [b]) => a - b)[0];
    assert.ok(next, "expected a queued animation frame");
    const [id, callback] = next;
    frames.delete(id);
    callback(0);
  };

  const destroy = mountPresentationStageLock(
    root,
    deck as Parameters<typeof mountPresentationStageLock>[1],
    browserWindow,
  );

  // Entry remains completely unlocked while Reveal positions the new slide.
  assert.equal(bodyClasses.has("pcd-stage-lock-active"), false);
  let preventedBeforeSettle = false;
  const beforeSettleWheel = {
    preventDefault() { preventedBeforeSettle = true; },
  } as unknown as Event;
  for (const listener of windowListeners.get("wheel") ?? []) listener(beforeSettleWheel);
  assert.equal(preventedBeforeSettle, false);

  // Simulate Reveal settling the slide at its final position across two frames.
  scrollX = 24;
  scrollY = 480;
  viewport.scrollTop = 510;
  runNextFrame();
  assert.equal(bodyClasses.has("pcd-stage-lock-active"), false);
  runNextFrame();
  assert.equal(bodyClasses.has("pcd-stage-lock-active"), true);

  // Once settled, wheel/touch attempts restore the captured stable position.
  scrollX = 99;
  scrollY = 999;
  viewport.scrollTop = 888;
  let prevented = false;
  const wheel = {
    preventDefault() { prevented = true; },
  } as unknown as Event;
  for (const listener of windowListeners.get("wheel") ?? []) listener(wheel);
  assert.equal(prevented, true);
  assert.equal(scrollX, 24);
  assert.equal(scrollY, 480);
  assert.equal(viewport.scrollTop, 510);

  // Fragment changes remain fixed at the same final slide position.
  scrollY = 777;
  viewport.scrollTop = 666;
  for (const listener of deckListeners.get("fragmentshown") ?? []) listener();
  assert.equal(scrollY, 480);
  assert.equal(viewport.scrollTop, 510);
  runNextFrame();
  assert.equal(scrollY, 480);
  assert.equal(viewport.scrollTop, 510);

  // Leaving the staged slide unlocks immediately before the next slide settles.
  currentSlide = plainSlide;
  for (const listener of deckListeners.get("slidechanged") ?? []) listener();
  assert.equal(bodyClasses.has("pcd-stage-lock-active"), false);

  let preventedAfterExit = false;
  const afterExitWheel = {
    preventDefault() { preventedAfterExit = true; },
  } as unknown as Event;
  for (const listener of windowListeners.get("wheel") ?? []) listener(afterExitWheel);
  assert.equal(preventedAfterExit, false);

  destroy();
  assert.equal(bodyClasses.has("pcd-stage-lock-active"), false);
});

test("stage lock leaves wheel movement untouched on non-staged slides", () => {
  const listeners = new Map<string, Set<EventListener>>();
  const root = {
    ownerDocument: {
      body: {
        classList: {
          toggle() { return false; },
          remove() {},
        },
      },
    },
  } as unknown as HTMLElement;
  const deck = {
    on() {},
    off() {},
    getCurrentSlide() {
      return { getAttribute() { return null; } } as unknown as HTMLElement;
    },
    getViewportElement() { return undefined; },
  };
  const browserWindow = {
    scrollX: 0,
    scrollY: 0,
    scrollTo() {},
    addEventListener(type: string, listener: EventListener) {
      const set = listeners.get(type) ?? new Set<EventListener>();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.get(type)?.delete(listener);
    },
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
  };

  const destroy = mountPresentationStageLock(
    root,
    deck as Parameters<typeof mountPresentationStageLock>[1],
    browserWindow,
  );
  let prevented = false;
  const wheel = { preventDefault() { prevented = true; } } as unknown as Event;
  for (const listener of listeners.get("wheel") ?? []) listener(wheel);
  assert.equal(prevented, false);
  destroy();
});
