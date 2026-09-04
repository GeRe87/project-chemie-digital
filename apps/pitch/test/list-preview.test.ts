import assert from "node:assert/strict";
import test from "node:test";

import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";
import { mountSceneDocuments, type MinimalElement } from "../src/preview.ts";

class FakeElement implements MinimalElement {
  private html = "";
  className = "";
  textContent: string | null = null;
  children: FakeElement[] = [];
  attributes = new Map<string, string>();
  get innerHTML(): string { return this.html; }
  set innerHTML(value: string) { this.html = value; if (value === "") this.children = []; }
  appendChild(node: MinimalElement): void { this.children.push(node as FakeElement); }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
}

const document: SceneDocument = {
  version: "1.0",
  id: "scene-document:keypoint-preview",
  sourcePathId: "ex:path-keypoint-preview",
  scenes: [{
    id: "scene:keypoint-preview",
    source: [{ resourceId: "ex:keypoint-preview-scene" }],
    blocks: [
      {
        kind: "prose",
        id: "block:heading",
        source: [{ resourceId: "ex:keypoint-preview-focus" }],
        text: "KeyPoint preview",
        intent: { kind: "introduce" },
      },
      {
        kind: "list",
        id: "block:keypoints",
        source: [{ resourceId: "ex:keypoint-owner", relationPath: "cd:hasKeyPoint" }],
        listStyle: "unordered",
        items: [
          { id: "item:one", text: "First authored point", source: [{ resourceId: "ex:keypoint-one", relationPath: "cd:body" }] },
          { id: "item:two", text: "Second authored point", source: [{ resourceId: "ex:keypoint-two", relationPath: "cd:body" }] },
        ],
      },
    ],
    readingOrder: ["block:heading", "block:keypoints"],
  }],
};

test("pitch preview renders semantic list markup with item-level source identity", () => {
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, [document]);
  const section = root.children[0]!;
  const list = section.children[1]!;
  assert.equal(list.className, "keypoint-list");
  assert.equal(list.attributes.get("data-resource-id"), "ex:keypoint-owner");
  assert.equal(list.attributes.get("data-relation-path"), "cd:hasKeyPoint");
  assert.deepEqual(list.children.map((item) => item.textContent), ["First authored point", "Second authored point"]);
  assert.equal(list.children[0]?.attributes.get("data-list-item-id"), "item:one");
  assert.equal(list.children[0]?.attributes.get("data-resource-id"), "ex:keypoint-one");
  assert.equal(list.children[0]?.attributes.get("data-relation-path"), "cd:body");
  destroy();
});
