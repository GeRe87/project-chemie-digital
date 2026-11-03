import test from "node:test";
import assert from "node:assert/strict";
import { createSelfStudyRenderPlan, renderSelfStudyHtml } from "../src/index.ts";
import { createRevealRenderPlan } from "../../renderer-reveal/src/index.ts";
import type { SceneDocument } from "../../core/src/scene-document.ts";

test("adapters preserve authored topic context and static HTML escapes its text", () => {
  const source = [{ resourceId: "urn:subject", relationPath: "dct:subject" }];
  const topic = { label: "Models <counts> & evidence", source };
  const document: SceneDocument = { version: "1.13", id: "doc", sourcePathId: "urn:path", scenes: [{ id: "scene", source, topic, blocks: [{ id: "title", kind: "prose", text: "Specific step", intent: { kind: "introduce" }, source }], readingOrder: ["title"] }] };
  const study = createSelfStudyRenderPlan(document);
  const reveal = createRevealRenderPlan(document, { reducedMotion: true, interactionPolicy: "static" });
  assert.deepEqual(study.diagnostics, []);
  assert.deepEqual(reveal.diagnostics, []);
  assert.deepEqual(study.plan!.sections[0]!.topic, topic);
  assert.deepEqual(reveal.plan!.sections[0]!.topic, topic);
  const html = renderSelfStudyHtml(study.plan!, { interactive: false });
  assert.match(html, /Topic: Models &lt;counts&gt; &amp; evidence/);
  assert.doesNotMatch(html, /Models <counts>/);
  assert.match(html, /dct:subject/);
  assert.deepEqual(study.plan!.sections[0]!.readingOrder, ["title"]);
});
