import assert from "node:assert/strict";
import test from "node:test";
import { resolveD3FlowHostWidth } from "../src/flow-diagram.ts";

test("uses the narrower viewport when Reveal keeps a wide transformed layout host", () => {
  assert.equal(resolveD3FlowHostWidth(1440, 640), 640);
  assert.equal(resolveD3FlowHostWidth(720, 1440), 720);
  assert.equal(resolveD3FlowHostWidth(1200, 1400), 1200);
});

test("keeps a deterministic usable lower bound and fallback", () => {
  assert.equal(resolveD3FlowHostWidth(0, 280), 320);
  assert.equal(resolveD3FlowHostWidth(0, undefined), 960);
});
