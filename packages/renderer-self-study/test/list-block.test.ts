import assert from "node:assert/strict";
import test from "node:test";

import type { SceneDocument } from "../../core/src/scene-document.ts";
import { createSelfStudyRenderPlan, renderSelfStudyHtml } from "../src/index.ts";

const document: SceneDocument = {
  version: "1.0",
  id: "scene-document:keypoint-fixture",
  sourcePathId: "ex:path-keypoint-fixture",
  scenes: [{
    id: "scene:keypoint-fixture",
    source: [{ resourceId: "ex:keypoint-fixture-scene" }],
    blocks: [{
      kind: "list",
      id: "block:keypoints",
      source: [{ resourceId: "ex:owner", relationPath: "cd:hasKeyPoint" }],
      listStyle: "unordered",
      items: [
        { id: "item:one", text: "First authored point", source: [{ resourceId: "ex:keypoint-one", relationPath: "cd:body" }] },
        { id: "item:two", text: "Second authored point", source: [{ resourceId: "ex:keypoint-two", relationPath: "cd:body" }] },
      ],
    }],
    readingOrder: ["block:keypoints"],
  }],
};

test("self-study adapter preserves list order, text and item sources", () => {
  const result = createSelfStudyRenderPlan(document);
  assert.deepEqual(result.diagnostics, []);
  const node = result.plan?.sections[0]?.nodes[0];
  assert.equal(node?.kind, "list");
  if (!node || node.kind !== "list") throw new Error("list plan missing");
  assert.deepEqual(node.items.map((item) => item.text), ["First authored point", "Second authored point"]);
  assert.equal(node.source[0]?.resourceId, "ex:owner");
  assert.equal(node.items[1]?.source[0]?.resourceId, "ex:keypoint-two");
});

test("self-study HTML uses semantic list markup without rewriting text", () => {
  const plan = createSelfStudyRenderPlan(document).plan;
  if (!plan) throw new Error("self-study plan missing");
  const html = renderSelfStudyHtml(plan, { interactive: false });
  assert.match(html, /<ul class="self-study-list">/);
  assert.match(html, /data-list-item-id="item:one"/);
  assert.match(html, /data-resource-id="ex:keypoint-one"/);
  assert.match(html, />First authored point<\/li>/);
  assert.match(html, />Second authored point<\/li>/);
});
