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


const conceptSpecificationDocument: SceneDocument = {
  version: "1.0",
  id: "scene-document:generic-concept-specification",
  sourcePathId: "path:opaque",
  scenes: [{
    id: "scene:opaque",
    source: [{ resourceId: "resource:scene" }],
    blocks: [
      {
        kind: "prose",
        id: "block:heading",
        text: "Generic semantic model",
        intent: { kind: "introduce" },
        source: [{ resourceId: "resource:heading" }],
      },
      {
        kind: "list",
        id: "block:cards",
        listStyle: "unordered",
        intent: { kind: "explain" },
        source: [{ resourceId: "resource:cards" }],
        items: [
          { id: "item:a", text: "First", source: [{ resourceId: "resource:a" }] },
          { id: "item:b", text: "Second", source: [{ resourceId: "resource:b" }] },
          { id: "item:c", text: "Third", source: [{ resourceId: "resource:c" }] },
        ],
      },
      {
        kind: "prose",
        id: "block:takeaway",
        text: "Generic takeaway",
        intent: { kind: "explain" },
        source: [{ resourceId: "resource:takeaway" }],
      },
    ],
    readingOrder: ["block:heading", "block:cards", "block:takeaway"],
  }],
};

test("pitch preview selects concept-specification from generic scene structure", () => {
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, [conceptSpecificationDocument]);
  assert.equal(root.children[0]?.attributes.get("data-layout"), "concept-specification");
  destroy();
});


const hierarchyFlowDocument: SceneDocument = {
  version: "1.1",
  id: "scene-document:generic-hierarchy",
  sourcePathId: "path:generic-hierarchy",
  scenes: [{
    id: "scene:generic-hierarchy",
    source: [{ resourceId: "resource:hierarchy-scene" }],
    blocks: [
      { kind: "prose", id: "hier:heading", text: "Hierarchy", intent: { kind: "introduce" }, source: [{ resourceId: "resource:hier-heading" }] },
      { kind: "prose", id: "hier:intro", text: "Intro", intent: { kind: "explain" }, source: [{ resourceId: "resource:hier-intro" }] },
      {
        kind: "diagram",
        id: "hier:diagram",
        diagramType: "flow",
        label: "Three levels",
        description: "Three levels",
        source: [{ resourceId: "resource:hier-diagram" }],
        nodes: [
          { id: "hier:a", label: "A", source: [{ resourceId: "resource:a" }] },
          { id: "hier:b", label: "B", source: [{ resourceId: "resource:b" }] },
          { id: "hier:c", label: "C", source: [{ resourceId: "resource:c" }] },
        ],
        edges: [
          { id: "hier:ab", sourceNodeId: "hier:a", targetNodeId: "hier:b", label: "ab", source: [{ resourceId: "resource:ab" }] },
          { id: "hier:bc", sourceNodeId: "hier:b", targetNodeId: "hier:c", label: "bc", source: [{ resourceId: "resource:bc" }] },
        ],
      },
      { kind: "prose", id: "hier:takeaway", text: "Takeaway", intent: { kind: "explain" }, source: [{ resourceId: "resource:hier-takeaway" }] },
    ],
    readingOrder: ["hier:heading", "hier:intro", "hier:diagram", "hier:takeaway"],
  }],
};

test("pitch preview exposes generic hierarchy-flow slots", () => {
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, [hierarchyFlowDocument]);
  const section = root.children[0]!;
  assert.equal(section.attributes.get("data-layout"), "hierarchy-flow");
  assert.deepEqual(section.children.map((child) => child.attributes.get("data-layout-slot")), ["heading", "intro", "diagram", "takeaway"]);
  destroy();
});

const referenceCodeDocument: SceneDocument = {
  version: "1.0",
  id: "scene-document:generic-reference-code",
  sourcePathId: "path:generic-reference-code",
  scenes: [{
    id: "scene:generic-reference-code",
    source: [{ resourceId: "resource:reference-scene" }],
    blocks: [
      { kind: "prose", id: "ref:heading", text: "Reference", intent: { kind: "introduce" }, source: [{ resourceId: "resource:ref-heading" }] },
      { kind: "prose", id: "ref:banner", text: "Banner", intent: { kind: "explain" }, source: [{ resourceId: "resource:ref-banner" }] },
      {
        kind: "list",
        id: "ref:terms",
        listStyle: "unordered",
        source: [{ resourceId: "resource:ref-terms" }],
        items: Array.from({ length: 6 }, (_, index) => ({
          id: `ref:item:${index + 1}`,
          text: `Term ${index + 1}`,
          source: [{ resourceId: `resource:ref-item:${index + 1}` }],
        })),
      },
      { kind: "prose", id: "ref:code-label", text: "Code label", intent: { kind: "explain" }, source: [{ resourceId: "resource:ref-code-label" }] },
      { kind: "code", id: "ref:code", language: "text", code: "opaque", fallback: "opaque", editable: false, executable: false, source: [{ resourceId: "resource:ref-code" }] },
      { kind: "prose", id: "ref:reading", text: "Reading", intent: { kind: "explain" }, source: [{ resourceId: "resource:ref-reading" }] },
    ],
    readingOrder: ["ref:heading", "ref:banner", "ref:terms", "ref:code-label", "ref:code", "ref:reading"],
  }],
};

test("pitch preview exposes generic reference-code slots", () => {
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, [referenceCodeDocument]);
  const section = root.children[0]!;
  assert.equal(section.attributes.get("data-layout"), "reference-code");
  assert.deepEqual(section.children.map((child) => child.attributes.get("data-layout-slot")), ["heading", "banner", "terms", "code-label", "code", "reading"]);
  destroy();
});
