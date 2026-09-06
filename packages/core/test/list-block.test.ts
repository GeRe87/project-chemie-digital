import assert from "node:assert/strict";
import test from "node:test";

import { SCENE_DOCUMENT_VERSION, type SceneDocument, validateSceneDocument } from "../src/scene-document.ts";

function document(): SceneDocument {
  return {
    version: SCENE_DOCUMENT_VERSION,
    id: "scene-document:keypoint-fixture",
    sourcePathId: "ex:path-keypoint-fixture",
    scenes: [{
      id: "scene:keypoint-fixture",
      source: [{ resourceId: "ex:keypoint-fixture-scene" }],
      blocks: [
        {
          kind: "prose",
          id: "block:heading",
          source: [{ resourceId: "ex:keypoint-fixture-focus" }],
          text: "Fixture",
          intent: { kind: "introduce" },
        },
        {
          kind: "list",
          id: "block:keypoints",
          source: [{ resourceId: "ex:fixture-owner", relationPath: "cd:hasKeyPoint" }],
          listStyle: "unordered",
          items: [
            { id: "item:one", text: "First point", source: [{ resourceId: "ex:keypoint-one", relationPath: "cd:body" }] },
            { id: "item:two", text: "Second point", source: [{ resourceId: "ex:keypoint-two", relationPath: "cd:body" }] },
          ],
          intent: { kind: "explain" },
        },
      ],
      readingOrder: ["block:heading", "block:keypoints"],
    }],
  };
}

test("accepts deterministic list blocks with item-level source traceability", () => {
  assert.doesNotThrow(() => validateSceneDocument(document()));
});

test("rejects empty list blocks", () => {
  const value = structuredClone(document());
  const list = value.scenes[0]!.blocks[1];
  if (list?.kind !== "list") throw new Error("fixture list missing");
  list.items = [];
  assert.throws(() => validateSceneDocument(value), /must contain at least one item/);
});

test("rejects duplicate list item identities", () => {
  const value = structuredClone(document());
  const list = value.scenes[0]!.blocks[1];
  if (list?.kind !== "list") throw new Error("fixture list missing");
  list.items[1]!.id = list.items[0]!.id;
  assert.throws(() => validateSceneDocument(value), /contains duplicate item ids/);
});

test("requires item-level source traceability", () => {
  const value = structuredClone(document());
  const list = value.scenes[0]!.blocks[1];
  if (list?.kind !== "list") throw new Error("fixture list missing");
  list.items[0]!.source = [];
  assert.throws(() => validateSceneDocument(value), /must retain at least one source resource/);
});
