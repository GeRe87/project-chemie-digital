import assert from "node:assert/strict";
import test from "node:test";
import { teachingTextMarkup } from "../src/teaching-text.ts";
import { safeSvgAttribute } from "../src/teaching-svg-runtime.ts";
import { installNoNetworkGuard } from "../src/preview.ts";

test("authored Markdown keeps task, question and neutral marker semantics explicit per item", () => {
  const html = teachingTextMarkup("**An instruction.**\n\n- [!] First task\n- [?] Second question\n- Ordinary note");
  assert.ok(html.startsWith("<p><strong>An instruction.</strong></p>"));
  assert.equal((html.match(/<li /gu) ?? []).length, 3);
  assert.ok(html.includes('data-marker-purpose="question"'));
  assert.ok(html.includes('data-marker-purpose="task"'));
  assert.ok(html.includes('data-marker-purpose="neutral"'));
  assert.equal((html.match(/aria-hidden="true"/gu) ?? []).length, 3);
  assert.ok(teachingTextMarkup("- A question ending in ?").includes('data-marker-purpose="neutral"'));
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

test("shared code workbench bounds output and scrolls the authored glossary in its own row", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../src/teaching-primitives.css", import.meta.url), "utf8");
  assert.match(css, /\.code-function-workbench\s*\{[^}]*grid-template-rows:\s*minmax\(0,1\.25fr\)\s+minmax\(5rem,\.75fr\)/u);
  assert.match(css, /\.code-function-workbench \.code-output\s*\{[^}]*max-height:\s*6rem;[^}]*overflow:\s*auto/u);
  assert.match(css, /\.code-function-workbench > \.definition-list\s*\{[^}]*min-height:\s*0;[^}]*overflow:\s*auto/u);
  assert.match(css, /\.reveal \.slides section > h2,[\s\S]*?#pitch-slides > article > h2\s*\{\s*text-transform:\s*capitalize/u);
  assert.match(css, /data-composition-profile="evidence-practice-grid"[\s\S]*?grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)/u);
  assert.match(css, /slides section > h2,[\s\S]*?#pitch-slides > article > h2\s*\{\s*text-transform:\s*capitalize/u);
});

test("formula-deck diagrams override intrinsic minimum height throughout the SVG chain", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../src/teaching-primitives.css", import.meta.url), "utf8");
  assert.match(css, /formula-deck[\s\S]*?\.d3-flow-host :is\(\.d3-flow-runtime, \.d3-flow-figure\)[\s\S]*?height: 100%; min-height: 0/u);
  assert.match(css, /formula-deck[\s\S]*?\.d3-flow-host \.d3-flow-svg\s*\{[^}]*min-height: 0; max-height: 100%/u);
});

test("task marker uses one circle and a font-independent stem/dot, never a second font glyph", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../src/teaching-primitives.css", import.meta.url), "utf8");
  assert.match(css, /data-marker-purpose="task"\] \.teaching-point-marker::before \{ content: ""/u);
  assert.match(css, /data-marker-purpose="task"\] \.teaching-point-marker::after[\s\S]*?M11 5h2v9h-2z[\s\S]*?cx='12' cy='18'/u);
  assert.doesNotMatch(css, /content: "!"/u);
});

test("generic prompt grids cap wide columns at three and wrap further prompts in reading order", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../src/learning-stage-primitives.css", import.meta.url), "utf8");
  assert.match(css, /grid-template-columns: repeat\(min\(3, var\(--pcd-composition-main-count\)\), minmax\(0, 1fr\)\)/u);
  assert.match(css, /grid-auto-rows: minmax\(0, 1fr\)/u);
  assert.doesNotMatch(css, /grid-auto-flow:\s*(?:column|dense)/u);
  assert.match(css, /@media[^}]+[\s\S]*?grid-template-columns: 1fr/u);
  assert.doesNotMatch(css, /mean-values|discussion-additive|mean-case-/u);
});
