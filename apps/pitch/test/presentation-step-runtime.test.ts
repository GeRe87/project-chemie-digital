import assert from "node:assert/strict";
import test from "node:test";

import {
  applySemanticDisclosure,
  clampPresentationStep,
  consumePresentationStageNavigation,
  isStageLockedSlide,
  markStageLockedSlide,
  mountPresentationStageLock,
  mountPresentationStageNavigation,
  stepFromVisibleCount,
  stageDirectionForKey,
  mountPresentationWheelNavigation,
} from "../src/presentation-step-runtime.ts";

test("focused operation cards retain Enter/Space activation but do not swallow arrow navigation", () => {
  const button = { tagName: "BUTTON", closest: (selector: string) => selector.includes("dialog") ? null : {} };
  assert.equal(stageDirectionForKey({ key: "ArrowRight", target: button } as unknown as KeyboardEvent), "next");
  assert.equal(stageDirectionForKey({ key: "ArrowLeft", target: button } as unknown as KeyboardEvent), "prev");
  assert.equal(stageDirectionForKey({ key: " ", target: button } as unknown as KeyboardEvent), undefined);
  assert.equal(stageDirectionForKey({ key: "Enter", target: button } as unknown as KeyboardEvent), undefined);
});

test("explicit interactive regions retain native keys without advancing the presentation", () => {
  const target={tagName:"DIV",closest:(selector:string)=>selector.includes("data-presentation-interactive")?{}:null};
  for(const key of ["ArrowRight","ArrowDown","PageDown"," ","ArrowLeft","ArrowUp"])
    assert.equal(stageDirectionForKey({key,target} as unknown as KeyboardEvent),undefined);
});

test("wheel scrolling inside an explicit interactive region stays native",()=>{
  let listener:((event:WheelEvent)=>void)|undefined;
  const target={addEventListener(_type:string,callback:typeof listener){listener=callback;},removeEventListener(){listener=undefined;}} as unknown as HTMLElement;
  let advanced=false,prevented=false;
  const deck={getCurrentSlide:()=>({getAttribute:()=>"true"}),availableFragments:()=>({next:true,prev:false}),nextFragment:()=>{advanced=true;return true;}} as unknown as Parameters<typeof mountPresentationWheelNavigation>[0];
  const destroy=mountPresentationWheelNavigation(deck,target,{view:"scroll"});
  listener!({deltaY:120,target:{closest:(selector:string)=>selector.includes("data-presentation-interactive")?{}:null},preventDefault(){prevented=true;},stopImmediatePropagation(){}} as unknown as WheelEvent);
  assert.equal(advanced,false);assert.equal(prevented,false);destroy();
});

test("wheel repeat is bounded without starving sustained input and listeners are disposed", () => {
  let listener: ((event: WheelEvent) => void) | undefined;
  const target = { addEventListener(_type: string, callback: typeof listener) { listener = callback; }, removeEventListener() { listener = undefined; } } as unknown as HTMLElement;
  let next = 0;
  const deck = { getCurrentSlide: () => ({ getAttribute: () => "true" }), availableFragments: () => ({ next: true, prev: false }), nextFragment: () => { next++; return true; } } as unknown as Parameters<typeof mountPresentationWheelNavigation>[0];
  const destroy = mountPresentationWheelNavigation(deck, target, { view: "scroll" });
  const event = (timeStamp: number) => ({ timeStamp, deltaY: 120, target: { closest: () => null }, preventDefault() {}, stopImmediatePropagation() {} }) as unknown as WheelEvent;
  listener!(event(1000)); listener!(event(1050)); listener!(event(1100));
  assert.equal(next, 1);
  listener!(event(1400)); assert.equal(next, 2);
  for (const stamp of [1450,1500,1550,1600,1650,1700,1750,1800]) listener!(event(stamp));
  assert.equal(next, 4);
  destroy(); assert.equal(listener, undefined);
});

test("presentation steps clamp deterministically in both directions", () => {
  assert.equal(clampPresentationStep(-4, 3), 0);
  assert.equal(clampPresentationStep(0, 3), 0);
  assert.equal(clampPresentationStep(2, 3), 2);
  assert.equal(clampPresentationStep(99, 3), 3);
});

test("plain scroll pages use the same wheel command and instant boundary positioning", () => {
  let listener: ((event: WheelEvent) => void) | undefined;
  const target = { addEventListener(_type: string, fn: typeof listener) { listener = fn; }, removeEventListener() {} } as unknown as HTMLElement;
  const a = { getAttribute: () => null };
  const b = { closest: () => ({ offsetTop: 900 }) };
  let position: ScrollToOptions | undefined;
  const deck = { getCurrentSlide: () => a, availableFragments: () => ({ prev: false, next: false }), getSlides: () => [a,b], getViewportElement: () => ({ scrollTo: (options: ScrollToOptions) => { position = options; } }) } as unknown as Parameters<typeof mountPresentationWheelNavigation>[0];
  mountPresentationWheelNavigation(deck,target,{view:"scroll"});
  let prevented = false;
  listener!({ deltaY:120, deltaX:0, deltaMode:0, timeStamp:1000, target:{closest:()=>null}, preventDefault(){ prevented=true; },stopImmediatePropagation(){} } as unknown as WheelEvent);
  assert.equal(prevented,true);
  assert.deepEqual(position,{top:900,behavior:"instant"});
});

test("small trackpad deltas accumulate, direction reversal is responsive, Ctrl-wheel stays native", () => {
  let listener: ((event: WheelEvent) => void) | undefined;
  const target = { addEventListener(_type: string, fn: typeof listener) { listener=fn; }, removeEventListener(){} } as unknown as HTMLElement;
  let next=0,prev=0;
  const deck={getCurrentSlide:()=>({getAttribute:()=>"true"}),availableFragments:()=>({next:true,prev:true}),nextFragment:()=>{next++;return true;},prevFragment:()=>{prev++;return true;}} as unknown as Parameters<typeof mountPresentationWheelNavigation>[0];
  mountPresentationWheelNavigation(deck,target,{view:"scroll"});
  const send=(deltaY:number,timeStamp:number,ctrlKey=false)=>listener!({deltaY,timeStamp,ctrlKey,target:{closest:()=>null},preventDefault(){},stopImmediatePropagation(){}} as unknown as WheelEvent);
  for(let i=0;i<7;i++)send(10,1000+i*20);
  assert.equal(next,1);
  send(-120,1140);assert.equal(prev,1);
  send(120,1400,true);assert.equal(next,1);
});

test("visible Reveal fragments reconstruct the absolute D3 step", () => {
  assert.equal(stepFromVisibleCount(0, 4), 0);
  assert.equal(stepFromVisibleCount(1, 4), 1);
  assert.equal(stepFromVisibleCount(3, 4), 3);
  assert.equal(stepFromVisibleCount(7, 4), 4);
});


test("semantic disclosure responds only to matching staged resource triggers", () => {
  const makeDisclosure = (trigger: string, requiredStep: number) => {
    const attributes = new Map<string, string>([
      ["data-presentation-disclosure-mode", "progressive"],
      ["data-presentation-disclosure-step", String(requiredStep)],
      ["data-presentation-disclosure-trigger-resource-id", trigger],
      ["data-presentation-disclosure-visible", "false"],
      ["aria-hidden", "true"],
    ]);
    return {
      dataset: {} as Record<string, string>,
      getAttribute(name: string) { return attributes.get(name) ?? null; },
      setAttribute(name: string, value: string) { attributes.set(name, value); },
      attributes,
    };
  };

  const table = makeDisclosure("resource:chart", 1);
  const conclusion = makeDisclosure("resource:annotation", 3);
  const unrelated = makeDisclosure("resource:other", 1);
  const slide = {
    querySelectorAll() { return [table, conclusion, unrelated]; },
  };
  const host = {
    getAttribute(name: string) {
      return name === "data-presentation-step-resource-id"
        ? "resource:chart resource:annotation"
        : null;
    },
    closest(selector: string) {
      return selector === "section" ? slide : null;
    },
  } as unknown as HTMLElement;

  applySemanticDisclosure(host, 0);
  assert.equal(table.attributes.get("data-presentation-disclosure-visible"), "false");
  assert.equal(conclusion.attributes.get("data-presentation-disclosure-visible"), "false");

  applySemanticDisclosure(host, 1);
  assert.equal(table.attributes.get("data-presentation-disclosure-visible"), "true");
  assert.equal(table.attributes.get("aria-hidden"), "false");
  assert.equal(conclusion.attributes.get("data-presentation-disclosure-visible"), "false");
  assert.equal(unrelated.attributes.get("data-presentation-disclosure-visible"), "false");

  applySemanticDisclosure(host, 3);
  assert.equal(conclusion.attributes.get("data-presentation-disclosure-visible"), "true");
  assert.equal(conclusion.attributes.get("aria-hidden"), "false");

  applySemanticDisclosure(host, 0);
  assert.equal(table.attributes.get("data-presentation-disclosure-visible"), "false");
  assert.equal(conclusion.attributes.get("data-presentation-disclosure-visible"), "false");
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
  const rootListeners = new Map<string, Set<EventListener>>();
  const root = {
    ownerDocument: { body },
    addEventListener(type: string, listener: EventListener) {
      const set = rootListeners.get(type) ?? new Set<EventListener>();
      set.add(listener);
      rootListeners.set(type, set);
    },
    removeEventListener(type: string, listener: EventListener) {
      rootListeners.get(type)?.delete(listener);
    },
    dispatchEvent(event: Event) {
      for (const listener of rootListeners.get(event.type) ?? []) listener(event);
      return true;
    },
  } as unknown as HTMLElement;

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

  // Reveal's pre-slide lifecycle unlocks synchronously before scroll-view
  // positioning starts, so the outgoing stage lock cannot restore the old position.
  for (const listener of deckListeners.get("beforeslidechange") ?? []) listener();
  assert.equal(bodyClasses.has("pcd-stage-lock-active"), false);

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
  assert.equal(deckListeners.get("beforeslidechange")?.size ?? 0, 0);
});

test("stage lock leaves wheel movement untouched on non-staged slides", () => {
  const listeners = new Map<string, Set<EventListener>>();
  const rootListeners = new Map<string, Set<EventListener>>();
  const root = {
    ownerDocument: {
      body: {
        classList: {
          toggle() { return false; },
          remove() {},
        },
      },
    },
    addEventListener(type: string, listener: EventListener) {
      const set = rootListeners.get(type) ?? new Set<EventListener>();
      set.add(listener);
      rootListeners.set(type, set);
    },
    removeEventListener(type: string, listener: EventListener) {
      rootListeners.get(type)?.delete(listener);
    },
    dispatchEvent(event: Event) {
      for (const listener of rootListeners.get(event.type) ?? []) listener(event);
      return true;
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


test("scroll-view terminal navigation releases the lock and jumps to the adjacent scroll page boundary", () => {
  const currentSlide = {
    getAttribute(name: string) {
      return name === "data-stage-lock" ? "true" : null;
    },
    closest() { return null; },
  } as unknown as HTMLElement;

  const targetPage = {
    offsetTop: 2400,
    querySelectorAll() { return []; },
  } as unknown as HTMLElement;
  const nextSlide = {
    getAttribute() { return null; },
    closest(selector: string) {
      return selector === ".scroll-page" ? targetPage : null;
    },
    querySelectorAll() { return []; },
  } as unknown as HTMLElement;

  const viewport = { scrollTop: 320 } as HTMLElement;
  const slideCalls: Array<[number, number | undefined, number | undefined]> = [];
  const deck = {
    on() {},
    off() {},
    getCurrentSlide() { return currentSlide; },
    getViewportElement() { return viewport; },
    availableFragments() { return { prev: false, next: false }; },
    nextFragment() { return false; },
    prevFragment() { return false; },
    getSlides() { return [currentSlide, nextSlide]; },
    getIndices() { return { h: 1, v: 0 }; },
    slide(h: number, v?: number, f?: number) { slideCalls.push([h, v, f]); },
  };

  let exitSignals = 0;
  const root = {
    dispatchEvent(event: Event) {
      if (event.type === "pcd-presentation-stage-exit") exitSignals += 1;
      return true;
    },
  } as unknown as HTMLElement;

  assert.equal(
    consumePresentationStageNavigation(deck, "next", { view: "scroll", root }),
    true,
  );
  assert.equal(exitSignals, 1);
  assert.equal(viewport.scrollTop, 2400);
  assert.deepEqual(slideCalls, []);
});

test("staged navigation consumes internal fragments then jumps directly to the next slide", () => {
  const makeSlide = (staged: boolean, fragmentCount = 0) => ({
    getAttribute(name: string) {
      return name === "data-stage-lock" && staged ? "true" : null;
    },
    querySelectorAll(selector: string) {
      return selector === ".fragment"
        ? Array.from({ length: fragmentCount }, () => ({}))
        : [];
    },
  }) as unknown as HTMLElement;

  const stagedSlide = makeSlide(true, 3);
  const nextSlide = makeSlide(false);
  const slides = [stagedSlide, nextSlide];
  let step = 0;
  const slideCalls: Array<[number, number | undefined, number | undefined]> = [];

  const deck = {
    on() {},
    off() {},
    getCurrentSlide() { return stagedSlide; },
    availableFragments() {
      return { prev: step > 0, next: step < 3 };
    },
    nextFragment() {
      if (step >= 3) return false;
      step += 1;
      return true;
    },
    prevFragment() {
      if (step <= 0) return false;
      step -= 1;
      return true;
    },
    getSlides() { return slides; },
    getIndices(slide?: HTMLElement) {
      return slide === nextSlide ? { h: 1, v: 0 } : { h: 0, v: 0 };
    },
    slide(h: number, v?: number, f?: number) {
      slideCalls.push([h, v, f]);
    },
  };

  assert.equal(consumePresentationStageNavigation(deck, "next"), true);
  assert.equal(step, 1);
  assert.equal(consumePresentationStageNavigation(deck, "next"), true);
  assert.equal(step, 2);
  assert.equal(consumePresentationStageNavigation(deck, "next"), true);
  assert.equal(step, 3);
  assert.deepEqual(slideCalls, []);

  assert.equal(consumePresentationStageNavigation(deck, "next"), true);
  assert.equal(step, 3);
  assert.deepEqual(slideCalls, [[1, 0, -1]]);
});

test("terminal backward navigation jumps directly to the previous slide final fragment", () => {
  const makeSlide = (staged: boolean, fragmentCount = 0) => ({
    getAttribute(name: string) {
      return name === "data-stage-lock" && staged ? "true" : null;
    },
    querySelectorAll(selector: string) {
      return selector === ".fragment"
        ? Array.from({ length: fragmentCount }, () => ({}))
        : [];
    },
  }) as unknown as HTMLElement;

  const previousSlide = makeSlide(false, 2);
  const stagedSlide = makeSlide(true, 3);
  const slides = [previousSlide, stagedSlide];
  const slideCalls: Array<[number, number | undefined, number | undefined]> = [];

  const deck = {
    on() {},
    off() {},
    getCurrentSlide() { return stagedSlide; },
    availableFragments() { return { prev: false, next: true }; },
    nextFragment() { return true; },
    prevFragment() { return false; },
    getSlides() { return slides; },
    getIndices(slide?: HTMLElement) {
      return slide === previousSlide ? { h: 0, v: 0 } : { h: 1, v: 0 };
    },
    slide(h: number, v?: number, f?: number) {
      slideCalls.push([h, v, f]);
    },
  };

  assert.equal(consumePresentationStageNavigation(deck, "prev"), true);
  assert.deepEqual(slideCalls, [[0, 0, 1]]);
});

test("stage navigation captures forward keys through the terminal direct slide jump", () => {
  const makeSlide = (staged: boolean) => ({
    getAttribute(name: string) {
      return name === "data-stage-lock" && staged ? "true" : null;
    },
    querySelectorAll() { return []; },
  }) as unknown as HTMLElement;

  const stagedSlide = makeSlide(true);
  const nextSlide = makeSlide(false);
  let step = 0;
  const slideCalls: Array<[number, number | undefined, number | undefined]> = [];

  const deck = {
    on() {},
    off() {},
    getCurrentSlide() { return stagedSlide; },
    availableFragments() {
      return { prev: step > 0, next: step < 1 };
    },
    nextFragment() {
      if (step >= 1) return false;
      step += 1;
      return true;
    },
    prevFragment() {
      if (step <= 0) return false;
      step -= 1;
      return true;
    },
    getSlides() { return [stagedSlide, nextSlide]; },
    getIndices(slide?: HTMLElement) {
      return slide === nextSlide ? { h: 1, v: 0 } : { h: 0, v: 0 };
    },
    slide(h: number, v?: number, f?: number) {
      slideCalls.push([h, v, f]);
    },
  };

  const listeners = new Map<string, Set<EventListener>>();
  const keyboardTarget = {
    addEventListener(type: string, listener: EventListener) {
      const set = listeners.get(type) ?? new Set<EventListener>();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.get(type)?.delete(listener);
    },
  };

  const destroy = mountPresentationStageNavigation(
    deck,
    keyboardTarget as Parameters<typeof mountPresentationStageNavigation>[1],
  );

  const pressNext = () => {
    let prevented = false;
    let stopped = false;
    const event = {
      key: "ArrowRight",
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      target: null,
      preventDefault() { prevented = true; },
      stopImmediatePropagation() { stopped = true; },
    } as unknown as Event;
    for (const listener of listeners.get("keydown") ?? []) listener(event);
    return { prevented, stopped };
  };

  const first = pressNext();
  assert.equal(step, 1);
  assert.deepEqual(slideCalls, []);
  assert.equal(first.prevented, true);
  assert.equal(first.stopped, true);

  const terminal = pressNext();
  assert.deepEqual(slideCalls, [[1, 0, -1]]);
  assert.equal(terminal.prevented, true);
  assert.equal(terminal.stopped, true);

  destroy();
  assert.equal(listeners.get("keydown")?.size ?? 0, 0);
});

test("stage navigation control click uses the same terminal direct jump", () => {
  const makeSlide = (staged: boolean) => ({
    getAttribute(name: string) {
      return name === "data-stage-lock" && staged ? "true" : null;
    },
    querySelectorAll() { return []; },
  }) as unknown as HTMLElement;

  const stagedSlide = makeSlide(true);
  const nextSlide = makeSlide(false);
  let step = 0;
  const slideCalls: Array<[number, number | undefined, number | undefined]> = [];

  const deck = {
    on() {},
    off() {},
    getCurrentSlide() { return stagedSlide; },
    availableFragments() {
      return { prev: step > 0, next: step < 1 };
    },
    nextFragment() { step += 1; return true; },
    prevFragment() { step -= 1; return true; },
    getSlides() { return [stagedSlide, nextSlide]; },
    getIndices(slide?: HTMLElement) {
      return slide === nextSlide ? { h: 1, v: 0 } : { h: 0, v: 0 };
    },
    slide(h: number, v?: number, f?: number) {
      slideCalls.push([h, v, f]);
    },
  };

  const keyboardListeners = new Map<string, Set<EventListener>>();
  const controlListeners = new Map<string, Set<EventListener>>();
  const makeTarget = (store: Map<string, Set<EventListener>>) => ({
    addEventListener(type: string, listener: EventListener) {
      const set = store.get(type) ?? new Set<EventListener>();
      set.add(listener);
      store.set(type, set);
    },
    removeEventListener(type: string, listener: EventListener) {
      store.get(type)?.delete(listener);
    },
  });

  const destroy = mountPresentationStageNavigation(
    deck,
    makeTarget(keyboardListeners) as Parameters<typeof mountPresentationStageNavigation>[1],
    makeTarget(controlListeners) as Parameters<typeof mountPresentationStageNavigation>[2],
  );

  const clickNext = () => {
    let prevented = false;
    let stopped = false;
    const event = {
      target: {
        closest(selector: string) {
          return selector.includes(".navigate-right") ? {} : null;
        },
      },
      preventDefault() { prevented = true; },
      stopImmediatePropagation() { stopped = true; },
    } as unknown as Event;
    for (const listener of controlListeners.get("click") ?? []) listener(event);
    return { prevented, stopped };
  };

  const first = clickNext();
  assert.equal(step, 1);
  assert.deepEqual(slideCalls, []);
  assert.equal(first.prevented, true);
  assert.equal(first.stopped, true);

  const terminal = clickNext();
  assert.deepEqual(slideCalls, [[1, 0, -1]]);
  assert.equal(terminal.prevented, true);
  assert.equal(terminal.stopped, true);

  destroy();
});
