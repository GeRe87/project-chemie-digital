import assert from "node:assert/strict";
import test from "node:test";

import type { SceneDocument } from "../../core/src/scene-document.ts";
import { createRevealRenderPlan } from "../src/index.ts";

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

test("reveal adapter preserves list order, text and item sources", () => {
  const result = createRevealRenderPlan(document, { reducedMotion: false, interactionPolicy: "static" });
  assert.deepEqual(result.diagnostics, []);
  const node = result.plan?.sections[0]?.nodes[0];
  assert.equal(node?.kind, "list");
  if (!node || node.kind !== "list") throw new Error("list plan missing");
  assert.equal(node.listStyle, "unordered");
  assert.deepEqual(node.items.map((item) => item.text), ["First authored point", "Second authored point"]);
  assert.equal(node.source[0]?.resourceId, "ex:owner");
  assert.equal(node.items[0]?.source[0]?.resourceId, "ex:keypoint-one");
  assert.equal(node.staticFallback, "First authored point\nSecond authored point");
});
