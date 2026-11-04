import assert from "node:assert/strict";
import test from "node:test";
import type { SceneBlock } from "../src/scene-document.ts";
import { walkSceneBlocks } from "../src/scene-blocks.ts";

test("visits arbitrarily nested groups once without changing source objects or authored ordering", () => {
  const source = [{ resourceId: "resource:probe" }];
  const leaf: SceneBlock = { id: "leaf", kind: "prose", text: "A", source };
  const sibling: SceneBlock = { ...leaf, id: "sibling" };
  const inner: SceneBlock = { id: "inner", kind: "group", source, children: [leaf], readingOrder: [leaf.id] };
  const outer: SceneBlock = { id: "outer", kind: "group", source, children: [inner, sibling], readingOrder: [sibling.id, inner.id] };
  const result = [...walkSceneBlocks([outer])];
  assert.deepEqual(result.map(block => block.id), ["outer", "inner", "leaf", "sibling"]);
  assert.equal(result[2], leaf);
  assert.deepEqual(outer.readingOrder, ["sibling", "inner"]);
  assert.deepEqual([...walkSceneBlocks([])], []);
});
