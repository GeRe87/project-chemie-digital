import assert from "node:assert/strict";
import test from "node:test";
import { teachingTextMarkup } from "../src/teaching-text.ts";
import { safeSvgAttribute } from "../src/teaching-svg-runtime.ts";
import { installNoNetworkGuard } from "../src/preview.ts";

test("authored Markdown retains strong instruction, paragraphs and two semantic question bullets", () => {
  const html = teachingTextMarkup("**An instruction.**\n\n- First question\n- Second question", "question");
  assert.ok(html.startsWith("<p><strong>An instruction.</strong></p>"));
  assert.equal((html.match(/<li>/gu) ?? []).length, 2);
  assert.ok(html.includes('data-marker-purpose="question"'));
  assert.equal((html.match(/aria-hidden="true"/gu) ?? []).length, 2);
  assert.ok(teachingTextMarkup("- Has punctuation?", "neutral").includes('data-marker-purpose="neutral"'));
  assert.ok(teachingTextMarkup("- Explicit point", "statement").includes('data-marker-purpose="statement"'));
});

test("teaching text escapes HTML instead of enabling arbitrary authored markup", () => {
  const html = teachingTextMarkup('<img src=x onerror="bad()">\n\n- **Safe** & sound');
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes("&lt;img"));
  assert.ok(html.includes("<strong>Safe</strong> &amp; sound"));
});

test("inert SVG drawing attributes allow theme color but reject external paints and handlers", () => {
  assert.equal(safeSvgAttribute("stroke", "currentColor"), true);
  assert.equal(safeSvgAttribute("fill", "none"), true);
  assert.equal(safeSvgAttribute("fill", "var(--pcd-accent)"), true);
  for (const [key, value] of [["href", "/evil"], ["onload", "bad()"], ["style", "fill:red"],
    ["fill", "url(https://example.invalid/a)"], ["fill", "u\\72l(/a)"], ["stroke", "javascript:bad()"]]) {
    assert.equal(safeSvgAttribute(key!, value!), false);
  }
});

test("only explicitly authored same-origin SVG reads supplement pinned runtime requests", async () => {
  const calls: unknown[] = [];
  const target = { fetch: (async (input: unknown) => { calls.push(input); return new Response(""); }) as typeof fetch };
  const cleanup = installNoNetworkGuard(target, "http://localhost:5173/", ["/local-drawing.svg", "https://example.invalid/a.svg"]);
  await target.fetch("http://localhost:5173/local-drawing.svg", { method: "GET" });
  assert.equal(calls.length, 1);
  for (const url of ["http://localhost:5173/other.svg", "https://example.invalid/a.svg", "http://localhost:5173/api"]) {
    assert.throws(() => target.fetch(url), /prohibited/);
  }
  assert.throws(() => target.fetch("http://localhost:5173/local-drawing.svg", { method: "POST" }), /prohibited/);
  cleanup();
});
