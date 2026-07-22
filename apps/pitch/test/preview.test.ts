import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { installNoNetworkGuard, mountPitchSlides, pitchSlides, validatePitchSlides, type MinimalElement } from "../src/preview.ts";

class FakeElement implements MinimalElement {
  private html = "";
  className = "";
  textContent: string | null = null;
  children: FakeElement[] = [];
  attributes = new Map<string, string>();
  get innerHTML(): string { return this.html; }
  set innerHTML(value: string) {
    this.html = value;
    if (value === "") this.children = [];
  }
  appendChild(node: MinimalElement): void { this.children.push(node as FakeElement); }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
}

const canonicalIds = [
  "pitch-step-context", "pitch-step-knowledge-first", "pitch-step-semantic-resources",
  "pitch-step-paths", "pitch-step-scenes", "pitch-step-renderer-boundary",
  "pitch-step-output-channels", "pitch-step-proof", "pitch-step-next-step"
];

test("preserves the accepted nine-step order and four layouts", () => {
  validatePitchSlides(pitchSlides);
  assert.deepEqual(pitchSlides.map((slide) => slide.id), canonicalIds);
  assert.deepEqual(new Set(pitchSlides.map((slide) => slide.layout)), new Set(["opening", "statement", "process", "split-proof"]));
});

test("ships a complete no-JavaScript fallback in canonical order", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const ids = [...html.matchAll(/data-pitch-step="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(ids, canonicalIds);
  for (const slide of pitchSlides) {
    assert.match(html, new RegExp(slide.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(slide.body.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("mounts deterministic accessible sections and cleans up idempotently", () => {
  const root = new FakeElement();
  const destroy = mountPitchSlides({ root, createElement: () => new FakeElement() });
  assert.equal(root.children.length, 9);
  assert.equal(root.children[0]?.attributes.get("aria-labelledby"), "pitch-step-context-title");
  assert.equal(root.children[7]?.attributes.get("data-resource-id"), "ex:pitch-standard-deviation-proof");
  destroy();
  assert.equal(root.children.length, 0);
  destroy();
  assert.equal(root.children.length, 0);
  assert.equal(root.innerHTML, "");
});

test("rejects invalid preview input before partial mounting", () => {
  const root = new FakeElement();
  assert.throws(() => mountPitchSlides({ root, createElement: () => new FakeElement() }, pitchSlides.slice(0, 8)), /exactly nine/);
  assert.equal(root.children.length, 0);
});

test("prohibits runtime network calls and restores the host", () => {
  const original = () => Promise.resolve(new Response());
  const target: { fetch?: typeof fetch; XMLHttpRequest?: unknown; WebSocket?: unknown } = { fetch: original as typeof fetch };
  const restore = installNoNetworkGuard(target);
  assert.throws(() => target.fetch?.("https://example.invalid"), /prohibited/);
  restore();
  assert.equal(target.fetch, original);
});