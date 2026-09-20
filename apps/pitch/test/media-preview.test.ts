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
  const group = section.children[1]!;
  assert.equal(group.className, "scene-group");
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


test("CogniFlow laboratory comparison uses a hard cut only between scenes 3 and 4", () => {
  const makeScene = (id: string, heading: string): SceneDocument["scenes"][number] => ({
    id,
    source: [{ resourceId: id }],
    blocks: [{
      kind: "prose",
      id: id + "--heading",
      source: [{ resourceId: id + "--focus" }],
      text: heading,
      intent: { kind: "introduce" },
    }],
    readingOrder: [id + "--heading"],
  });

  const comparisonDocument: SceneDocument = {
    version: "1.0",
    id: "scene-document:cogniflow-comparison-transition",
    sourcePathId: "ex:path-cogniflow-standardized-data-processing",
    scenes: [
      makeScene("ex:scene-cogniflow-processing-black-box--scene", "Before"),
      makeScene("ex:scene-cogniflow-fair-processing-gap--scene", "Lab chaos"),
      makeScene("ex:scene-cogniflow-explicit-processing-context--scene", "CogniFlow platform"),
      makeScene("ex:scene-cogniflow-service-process--scene", "After"),
    ],
  };

  const root = new FakeElement();
  const destroy = mountSceneDocuments({ root, createElement: () => new FakeElement() }, [comparisonDocument]);

  assert.equal(root.children[0]?.attributes.get("data-transition"), undefined);
  assert.equal(root.children[1]?.attributes.get("data-transition"), "slide-in none-out");
  assert.equal(root.children[2]?.attributes.get("data-transition"), "none-in slide-out");
  assert.equal(root.children[3]?.attributes.get("data-transition"), undefined);
  destroy();
});
