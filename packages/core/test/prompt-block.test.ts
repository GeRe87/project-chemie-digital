import assert from "node:assert/strict";
import test from "node:test";

import { SCENE_DOCUMENT_VERSION, validateSceneDocument, type SceneDocument } from "../src/scene-document.ts";

function promptDocument(): SceneDocument {
  return {
    version: SCENE_DOCUMENT_VERSION,
    id: "prompt-doc",
    sourcePathId: "path",
    scenes: [{
      id: "scene",
      source: [{ resourceId: "scene-source" }],
      readingOrder: ["prompt"],
      blocks: [{
        id: "prompt",
        kind: "prompt",
        prompt: "Choose a role",
        responseMode: "single-choice",
        options: ["A", "B", "C"],
        optionIds: ["option:a", "option:b", "option:c"],
        correctOptionId: "option:b",
        expectedResult: "B is correct because it matches the authored role.",
        fallback: "Choose a role A / B / C",
        source: [{ resourceId: "prompt-source" }],
      }],
    }],
  };
}

test("PromptBlock accepts graph-backed single-choice feedback metadata", () => {
  assert.doesNotThrow(() => validateSceneDocument(promptDocument()));
});

test("PromptBlock correct option must belong to authored option ids", () => {
  const document = promptDocument();
  const prompt = document.scenes[0]!.blocks[0]!;
  assert.equal(prompt.kind, "prompt");
  (prompt as { correctOptionId?: string }).correctOptionId = "option:missing";
  assert.throws(() => validateSceneDocument(document), /correctOptionId/);
});

test("PromptBlock option ids must align with authored options", () => {
  const document = promptDocument();
  const prompt = document.scenes[0]!.blocks[0]!;
  assert.equal(prompt.kind, "prompt");
  (prompt as { optionIds?: string[] }).optionIds = ["option:a"];
  assert.throws(() => validateSceneDocument(document), /optionIds must match options/);
});
