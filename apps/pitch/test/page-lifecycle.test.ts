import assert from "node:assert/strict";
import test from "node:test";
import { mountPageLifecycle } from "../src/page-lifecycle.ts";

function pageTransition(type: "pagehide" | "pageshow", persisted: boolean): Event {
  const event = new Event(type);
  Object.defineProperty(event, "persisted", { value: persisted });
  return event;
}

test("cached history navigation pauses and resumes the mounted page across multiple visits", () => {
  const target = new EventTarget();
  const events: string[] = [];
  const dispose = mountPageLifecycle(target, {
    pause: () => events.push("pause"), resume: () => events.push("resume"), destroy: () => events.push("destroy"),
  });
  target.dispatchEvent(pageTransition("pageshow", false));
  target.dispatchEvent(pageTransition("pagehide", true));
  target.dispatchEvent(pageTransition("pagehide", true));
  target.dispatchEvent(pageTransition("pageshow", true));
  target.dispatchEvent(pageTransition("pageshow", true));
  target.dispatchEvent(pageTransition("pagehide", true));
  target.dispatchEvent(pageTransition("pageshow", true));
  assert.deepEqual(events, ["pause", "resume", "pause", "resume"]);
  target.dispatchEvent(pageTransition("pagehide", false));
  target.dispatchEvent(pageTransition("pageshow", true));
  dispose();
  assert.deepEqual(events, ["pause", "resume", "pause", "resume", "destroy"]);
});

test("explicit disposal while cached removes listeners and disposes exactly once", () => {
  const target = new EventTarget();
  let destroys = 0, resumes = 0;
  const dispose = mountPageLifecycle(target, { resume: () => resumes++, destroy: () => destroys++ });
  target.dispatchEvent(pageTransition("pagehide", true));
  dispose(); dispose();
  target.dispatchEvent(pageTransition("pageshow", true));
  target.dispatchEvent(pageTransition("pagehide", false));
  assert.equal(destroys, 1); assert.equal(resumes, 0);
});
