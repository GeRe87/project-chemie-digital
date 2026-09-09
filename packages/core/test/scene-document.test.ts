import assert from "node:assert/strict";
import test from "node:test";

import {
  SCENE_DOCUMENT_FLOW_VERSION,
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

function flowDocument(): SceneDocument {
  return {
    version: SCENE_DOCUMENT_FLOW_VERSION,
    id: "scene:flow",
    sourcePathId: "ex:path-flow",
    scenes: [
      {
        id: "scene:flow-process",
        source: [{ resourceId: "ex:flow" }],
        blocks: [
          {
            kind: "diagram",
            id: "block:flow",
            source: [{ resourceId: "ex:flow", provenanceIds: ["graph:flow"], relationPath: "cd:body" }],
            diagramType: "flow",
            label: "Analytical process",
            description: "A deterministic process flow.",
            focusNodeId: "node:processing",
            nodes: [
              { id: "node:measurement", label: "Measurement", source: [{ resourceId: "ex:measurement", relationPath: "skos:prefLabel@en" }] },
              { id: "node:processing", label: "Data processing", source: [{ resourceId: "ex:processing", relationPath: "skos:prefLabel@en" }], emphasis: "primary" },
            ],
            edges: [
              { id: "edge:data", sourceNodeId: "node:measurement", targetNodeId: "node:processing", label: "produces data for", source: [{ resourceId: "ex:edge-data", relationPath: "skos:prefLabel@en" }] },
            ],
          },
        ],
        readingOrder: ["block:flow"],
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

function expectFlowError(mutator: (value: SceneDocument) => void, message: RegExp): void {
  const value = structuredClone(flowDocument());
  mutator(value);
  assert.throws(
    () => validateSceneDocument(value),
    (error: unknown) => error instanceof SceneContractError && message.test(error.message),
  );
}

test("accepts the minimal standard-deviation SceneDocument 1.0 contract", () => {
  assert.doesNotThrow(() => validateSceneDocument(document()));
});

test("accepts a renderer-neutral executable R code block", () => {
  const value = structuredClone(document()) as SceneDocument & { scenes: Array<{ blocks: Array<Record<string, unknown>>; readingOrder: string[] }> };
  value.scenes[0]!.blocks.push({
    kind: "code",
    id: "block:r-example",
    source: [{ resourceId: "ex:sd-r-code-example" }],
    language: "r",
    code: "x <- c(6, 8, 10)\nsd(x)",
    editable: true,
    executable: true,
    fallback: "x <- c(6, 8, 10)\nsd(x)",
    intent: { kind: "practice" },
  });
  value.scenes[0]!.readingOrder.push("block:r-example");
  assert.doesNotThrow(() => validateSceneDocument(value));
  value.scenes[0]!.blocks[2]!.fallback = "";
  assert.throws(() => validateSceneDocument(value), /code block:r-example fallback must be non-empty/);
});

test("accepts a source-linked flow diagram only in SceneDocument 1.1", () => {
  assert.doesNotThrow(() => validateSceneDocument(flowDocument()));
  const legacy = structuredClone(flowDocument()) as SceneDocument & { version: string };
  legacy.version = SCENE_DOCUMENT_VERSION;
  assert.throws(() => validateSceneDocument(legacy as SceneDocument), /diagram requires SceneDocument 1\.1/);
});

test("flow diagram references fail closed", () => {
  expectFlowError((value) => {
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind === "diagram") block.edges[0]!.targetNodeId = "node:missing";
  }, /references an unknown node/);
  expectFlowError((value) => {
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind === "diagram") block.focusNodeId = "node:missing";
  }, /focusNodeId references an unknown node/);
});

test("flow diagram edge endpoints must be non-empty", () => {
  expectFlowError((value) => {
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind === "diagram") block.edges[0]!.sourceNodeId = "";
  }, /sourceNodeId must be non-empty/);
  expectFlowError((value) => {
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind === "diagram") block.edges[0]!.targetNodeId = "";
  }, /targetNodeId must be non-empty/);
});

test("flow diagram node and edge identities must be unique", () => {
  expectFlowError((value) => {
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind === "diagram") block.nodes = [block.nodes[0]!, { ...block.nodes[1]!, id: block.nodes[0]!.id }];
  }, /duplicate node ids/);
  expectFlowError((value) => {
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind === "diagram") block.edges = [block.edges[0]!, { ...block.edges[0]! }];
  }, /duplicate edge ids/);
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
