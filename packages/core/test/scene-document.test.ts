import assert from "node:assert/strict";
import test from "node:test";

import {
  SCENE_DOCUMENT_VERSION,
  SceneContractError,
  type SceneDocument,
  validateSceneDocument,
} from "../src/scene-document.ts";

function document(): SceneDocument {
  return {
    version: SCENE_DOCUMENT_VERSION,
    id: "scene:standard-deviation",
    sourcePathId: "ex:standard-deviation-default-path",
    scenes: [
      {
        id: "scene:introduction",
        source: [{ resourceId: "ex:standard-deviation" }],
        blocks: [
          {
            kind: "prose",
            id: "block:definition",
            source: [{ resourceId: "ex:standard-deviation-definition", provenanceIds: ["ex:source-1"] }],
            text: "Standard deviation describes dispersion.",
            intent: { kind: "introduce" },
          },
          {
            kind: "math",
            id: "block:formula",
            source: [{ resourceId: "ex:standard-deviation-expression" }],
            expression: "s = sqrt(sum((x_i-x_bar)^2)/(n-1))",
            spokenText: "s equals the square root of the sum of squared deviations divided by n minus one",
            disclosure: { order: 1, mode: "progressive" },
          },
        ],
        readingOrder: ["block:definition", "block:formula"],
      },
    ],
  };
}

function expectError(mutator: (value: SceneDocument) => void, message: RegExp): void {
  const value = structuredClone(document());
  mutator(value);
  assert.throws(
    () => validateSceneDocument(value),
    (error: unknown) => error instanceof SceneContractError && message.test(error.message),
  );
}

test("accepts the minimal standard-deviation scene contract", () => {
  assert.doesNotThrow(() => validateSceneDocument(document()));
});

test("requires deterministic complete reading order", () => {
  expectError((value) => {
    value.scenes[0].readingOrder = ["block:formula"];
  }, /readingOrder must list every child exactly once/);
});

test("requires stable source traceability for every block", () => {
  expectError((value) => {
    value.scenes[0].blocks[0].source = [];
  }, /must retain at least one source resource/);
});

test("requires non-visual alternatives for mathematical content", () => {
  expectError((value) => {
    const block = value.scenes[0].blocks[1];
    if (block.kind === "math") block.spokenText = "";
  }, /spokenText must be non-empty/);
});

test("requires deterministic disclosure order values", () => {
  expectError((value) => {
    value.scenes[0].blocks[1].disclosure = { order: 1.5, mode: "progressive" };
  }, /disclosure order must be a non-negative integer/);
});

test("rejects tied disclosure orders among scene blocks", () => {
  expectError((value) => {
    value.scenes[0].blocks[0].disclosure = { order: 1, mode: "initial" };
  }, /disclosure orders must be unique among siblings/);
});

test("rejects tied disclosure orders among nested group children", () => {
  expectError((value) => {
    value.scenes[0].blocks = [
      {
        kind: "group",
        id: "group:explanation",
        source: [{ resourceId: "ex:standard-deviation" }],
        children: [
          {
            kind: "prose",
            id: "block:group-definition",
            source: [{ resourceId: "ex:standard-deviation-definition" }],
            text: "Definition",
            disclosure: { order: 2, mode: "progressive" },
          },
          {
            kind: "math",
            id: "block:group-formula",
            source: [{ resourceId: "ex:standard-deviation-expression" }],
            expression: "s",
            spokenText: "s",
            disclosure: { order: 2, mode: "optional" },
          },
        ],
        readingOrder: ["block:group-definition", "block:group-formula"],
      },
    ];
    value.scenes[0].readingOrder = ["group:explanation"];
  }, /group group:explanation disclosure orders must be unique among siblings/);
});
