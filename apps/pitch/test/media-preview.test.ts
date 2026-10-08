import assert from "node:assert/strict";
import test from "node:test";

import type { SceneBlock, SceneDocument } from "../../../packages/core/src/scene-document.ts";
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

function attributionGroup(id: string): SceneBlock {
  const textId = `block:${id}-text`;
  const mediaId = `block:${id}-media`;
  return {
    kind: "group",
    id: `block:${id}`,
    source: [{ resourceId: `ex:${id}` }],
    children: [
      {
        kind: "prose",
        id: textId,
        source: [{ resourceId: `ex:${id}`, relationPath: "cd:body" }],
        text: "Attribution",
        intent: { kind: "emphasize" },
      },
      {
        kind: "media-reference",
        id: mediaId,
        source: [{ resourceId: `ex:${id}-media`, relationPath: "cd:uri" }],
        uri: "https://example.invalid/mark.svg",
        mediaType: "image/svg+xml",
        alternativeText: "Generic mark",
      },
    ],
    readingOrder: [textId, mediaId],
  };
}

const document: SceneDocument = {
  version: "1.0",
  id: "scene-document:media-preview",
  sourcePathId: "ex:path-media-preview",
  scenes: [{
    id: "scene:media-preview",
    source: [{ resourceId: "ex:media-preview-scene" }],
    blocks: [
      {
        kind: "prose",
        id: "block:heading",
        source: [{ resourceId: "ex:media-preview-focus" }],
        text: "Semantic media",
        intent: { kind: "introduce" },
      },
      {
        kind: "group",
        id: "block:attribution-group",
        source: [{ resourceId: "ex:attribution" }],
        children: [
          {
            kind: "prose",
            id: "block:attribution-text",
            source: [{ resourceId: "ex:attribution", relationPath: "cd:body" }],
            text: "Funding",
            intent: { kind: "emphasize" },
          },
          {
            kind: "media-reference",
            id: "block:funding-logo",
            source: [
              { resourceId: "ex:attribution", relationPath: "cd:fundingSource" },
              { resourceId: "ex:organization", relationPath: "cd:hasLogo" },
              { resourceId: "ex:media-logo", relationPath: "cd:uri" },
            ],
            uri: "https://example.invalid/logo.svg",
            mediaType: "image/svg+xml",
            alternativeText: "Funding organization logo",
          },
        ],
        readingOrder: ["block:attribution-text", "block:funding-logo"],
      },
    ],
    readingOrder: ["block:heading", "block:attribution-group"],
  }],
};

test("pitch preview renders group and accessible image from media-reference block", () => {
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, [document]);
  const section = root.children[0]!;
  assert.equal(section.attributes.get("data-composition"), "media-stage");
  assert.equal(section.attributes.get("data-composition-profile"), "full-viewport");

  const mainRegion = section.children[1]!;
  assert.equal(mainRegion.className, "pcd-composition-region");
  assert.equal(mainRegion.attributes.get("data-composition-region-container"), "main");

  const group = mainRegion.children[0]!;
  assert.equal(group.className, "scene-group");
  assert.equal(group.attributes.get("data-component-kind"), "group");
  assert.equal(group.attributes.get("data-composition-region"), "main");
  assert.equal(group.attributes.get("data-group-block-id"), "block:attribution-group");
  assert.equal(group.children[0]?.textContent, "Funding");

  const figure = group.children[1]!;
  assert.equal(figure.className, "media-reference");
  assert.equal(figure.attributes.get("data-media-block-id"), "block:funding-logo");
  assert.equal(figure.attributes.get("data-media-type"), "image/svg+xml");
  assert.equal(figure.attributes.get("data-resource-id"), "ex:attribution ex:organization ex:media-logo");
  assert.equal(figure.attributes.get("data-relation-path"), "cd:fundingSource cd:hasLogo cd:uri");

  const image = figure.children[0]!;
  assert.equal(image.attributes.get("src"), "https://example.invalid/logo.svg");
  assert.equal(image.attributes.get("alt"), "Funding organization logo");
  assert.equal(image.attributes.get("decoding"), "async");
  assert.equal(image.attributes.get("loading"), "eager");
  destroy();
});


const heroDocument: SceneDocument = {
  version: "1.0",
  id: "scene-document:media-hero-preview",
  sourcePathId: "ex:path-media-hero-preview",
  scenes: [{
    id: "scene:media-hero-preview",
    source: [{ resourceId: "ex:media-hero-scene" }],
    blocks: [
      {
        kind: "prose",
        id: "block:hero-heading",
        source: [{ resourceId: "ex:media-hero-focus" }],
        text: "Hero",
        intent: { kind: "introduce" },
      },
      attributionGroup("primary"),
      attributionGroup("secondary"),
      attributionGroup("support"),
    ],
    readingOrder: ["block:hero-heading", "block:primary", "block:secondary", "block:support"],
  }],
};

test("media-stage hero-attributions keeps ordered groups as direct section children", () => {
  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, [heroDocument]);
  const section = root.children[0]!;
  assert.equal(section.attributes.get("data-composition"), "media-stage");
  assert.equal(section.attributes.get("data-composition-profile"), "hero-attributions");
  assert.deepEqual(
    section.children.map((child) =>
      child.attributes.get("data-composition-region-container")
        ?? child.attributes.get("data-composition-region")
    ),
    ["heading", "primary", "secondary", "support"],
  );
  assert.equal(section.children.some((child) => child.className === "pcd-composition-region"), false);
  for (const group of section.children.slice(1)) {
    assert.equal(group.attributes.get("data-component-kind"), "group");
  }
  destroy();
});
