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

test("stage lock blocks wheel movement and restores captured scroll positions", () => {
  const deckListeners = new Map<string, Set<() => void>>();
  const currentSlide = {
    getAttribute(name: string) {
      return name === "data-stage-lock" ? "true" : null;
    },
  } as unknown as HTMLElement;

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
  let frameCallback: FrameRequestCallback | undefined;
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
      frameCallback = callback;
      return 1;
    },
    cancelAnimationFrame() { frameCallback = undefined; },
  };

  const destroy = mountPresentationStageLock(
    root,
    deck as Parameters<typeof mountPresentationStageLock>[1],
    browserWindow,
  );
  assert.equal(bodyClasses.has("pcd-stage-lock-active"), true);

  scrollX = 99;
  scrollY = 999;
  viewport.scrollTop = 888;
  let prevented = false;
  const wheel = {
    preventDefault() { prevented = true; },
  } as unknown as Event;
  for (const listener of windowListeners.get("wheel") ?? []) listener(wheel);

  assert.equal(prevented, true);
  assert.equal(scrollX, 12);
  assert.equal(scrollY, 220);
  assert.equal(viewport.scrollTop, 340);

  scrollY = 777;
  viewport.scrollTop = 666;
  for (const listener of deckListeners.get("fragmentshown") ?? []) listener();
  frameCallback?.(0);
  assert.equal(scrollY, 220);
  assert.equal(viewport.scrollTop, 340);

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
