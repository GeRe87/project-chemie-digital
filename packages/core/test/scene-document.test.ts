import assert from "node:assert/strict";
import test from "node:test";

import {
  SCENE_DOCUMENT_FLOW_VERSION,
  SCENE_DOCUMENT_TABLE_VERSION,
  VISUAL_MOTIF_KEYS,
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

function tableDocument(): SceneDocument {
  return {
    version: SCENE_DOCUMENT_TABLE_VERSION,
    id: "scene:table",
    sourcePathId: "ex:path-table",
    scenes: [{
      id: "scene:table-example",
      source: [{ resourceId: "ex:table-example" }],
      blocks: [{
        kind: "table",
        id: "block:table",
        source: [{ resourceId: "ex:table", relationPath: "cd:hasTableRow" }],
        caption: "Illustrative dataset",
        description: "A small source-linked table.",
        columns: [
          { id: "column:field", label: "Field", source: [{ resourceId: "ex:column-field", relationPath: "skos:prefLabel@en" }] },
          { id: "column:value", label: "Example", source: [{ resourceId: "ex:column-value", relationPath: "skos:prefLabel@en" }] },
        ],
        rows: [
          {
            id: "row:identifier",
            source: [{ resourceId: "ex:row-identifier", relationPath: "cd:hasTableCell" }],
            cells: [
              { id: "cell:identifier-field", text: "Identifier", source: [{ resourceId: "ex:cell-identifier-field", relationPath: "cd:body" }] },
              { id: "cell:identifier-value", text: "doi:10.xxxx/sample.017", source: [{ resourceId: "ex:cell-identifier-value", relationPath: "cd:body" }] },
            ],
          },
        ],
      }],
      readingOrder: ["block:table"],
    }],
  };
}

function expectTableError(mutator: (value: SceneDocument) => void, message: RegExp): void {
  const value = structuredClone(tableDocument());
  mutator(value);
  assert.throws(
    () => validateSceneDocument(value),
    (error: unknown) => error instanceof SceneContractError && message.test(error.message),
  );
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

test("flow diagram identity validation reports empty ids before duplicate ids", () => {
  expectFlowError((value) => {
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind === "diagram") {
      block.nodes = [
        { ...block.nodes[0]!, id: "" },
        { ...block.nodes[1]!, id: "" },
      ];
    }
  }, /diagram node id must be non-empty/);
  expectFlowError((value) => {
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind === "diagram") {
      block.edges = [
        { ...block.edges[0]!, id: "" },
        { ...block.edges[0]!, id: "" },
      ];
    }
  }, /diagram edge id must be non-empty/);
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

test("network diagrams may model grouped semantic structure without authored edges", () => {
  const value = structuredClone(flowDocument());
  const block = value.scenes[0]!.blocks[0]!;
  if (block.kind !== "diagram") throw new Error("expected diagram");
  block.diagramType = "network";
  block.edges = [];
  block.groups = [
    { id: "group:inner", label: "Inner", source: [{ resourceId: "ex:inner" }] },
    { id: "group:outer", label: "Outer", source: [{ resourceId: "ex:outer" }] },
  ];
  block.nodes[0]!.groupIds = ["group:outer"];
  block.nodes[1]!.groupIds = ["group:inner"];
  assert.doesNotThrow(() => validateSceneDocument(value));

  block.diagramType = "flow";
  assert.throws(() => validateSceneDocument(value), /flow diagram must contain at least one edge/);
});

test("diagram groups and visual roles remain semantic while membership is validated", () => {
  const value = structuredClone(flowDocument());
  const block = value.scenes[0]!.blocks[0]!;
  if (block.kind !== "diagram") throw new Error("expected diagram");
  block.groups = [{ id: "group:instruments", label: "Instruments", source: [{ resourceId: "ex:instruments" }] }];
  block.nodes[0]!.visualRole = "comparison";
  block.nodes[0]!.groupIds = ["group:instruments"];
  assert.doesNotThrow(() => validateSceneDocument(value));
  block.nodes[0]!.groupIds = ["group:missing"];
  assert.throws(() => validateSceneDocument(value), /references an unknown group/);
});

test("visual motifs are controlled and portable across definition cards and diagram nodes", () => {
  const value = structuredClone(flowDocument());
  const block = value.scenes[0]!.blocks[0]!;
  if (block.kind !== "diagram") throw new Error("expected diagram");
  block.nodes[0]!.visualMotif = "statistics";
  block.nodes[0]!.visualMotifRole = "highlight";
  assert.doesNotThrow(() => validateSceneDocument(value));
  (block.nodes[0] as { visualMotif?: string }).visualMotif = "unknown-motif";
  assert.throws(() => validateSceneDocument(value), /visualMotif is not supported/);
  block.nodes[0]!.visualMotif = "statistics";
  (block.nodes[0] as { visualMotifRole?: string }).visualMotifRole = "dominant";
  assert.throws(() => validateSceneDocument(value), /visualMotifRole must be supporting or highlight/);
});

test("diagram edge visual roles use the same portable token contract as node roles", () => {
  const value = structuredClone(flowDocument());
  const block = value.scenes[0]!.blocks[0]!;
  if (block.kind !== "diagram") throw new Error("expected diagram");
  block.edges[0]!.visualRole = "annotation";
  assert.doesNotThrow(() => validateSceneDocument(value));
  block.edges[0]!.visualRole = "Annotation";
  assert.throws(() => validateSceneDocument(value), /edge .* visualRole must be a lowercase token/);
});


test("accepts a renderer-neutral table only in SceneDocument 1.5", () => {
  assert.doesNotThrow(() => validateSceneDocument(tableDocument()));
  const legacy = structuredClone(tableDocument()) as SceneDocument & { version: string };
  legacy.version = "1.4";
  assert.throws(() => validateSceneDocument(legacy as SceneDocument), /table requires SceneDocument 1\.5/);
});

test("table shape fails closed on malformed rows and identities", () => {
  expectTableError((value) => {
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind === "table") block.rows[0]!.cells = [block.rows[0]!.cells[0]!];
  }, /exactly one cell per column/);

  expectTableError((value) => {
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind === "table") block.columns = [];
  }, /at least one column/);

  expectTableError((value) => {
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind === "table") block.rows = [];
  }, /at least one row/);

  expectTableError((value) => {
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind === "table") block.columns = [block.columns[0]!, { ...block.columns[1]!, id: block.columns[0]!.id }];
  }, /duplicate column ids/);

  expectTableError((value) => {
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind === "table") block.rows = [block.rows[0]!, { ...block.rows[0]!, id: "row:second", cells: block.rows[0]!.cells.map((cell) => ({ ...cell })) }];
  }, /duplicate cell ids/);
});

test("designed and observed variation motifs are registered without relaxing motif validation", () => {
  assert.ok(VISUAL_MOTIF_KEYS.includes("calibration-flasks"));
  assert.ok(VISUAL_MOTIF_KEYS.includes("sampling-lake"));

  for (const visualMotif of ["calibration-flasks", "sampling-lake"] as const) {
    const value = structuredClone(flowDocument());
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind !== "diagram") throw new Error("expected diagram");
    block.nodes[0]!.visualMotif = visualMotif;
    block.nodes[0]!.visualMotifRole = "highlight";
    assert.doesNotThrow(() => validateSceneDocument(value));
  }

  const invalid = structuredClone(flowDocument());
  const block = invalid.scenes[0]!.blocks[0]!;
  if (block.kind !== "diagram") throw new Error("expected diagram");
  (block.nodes[0] as { visualMotif?: string }).visualMotif = "unregistered-motif";
  assert.throws(() => validateSceneDocument(invalid), /visualMotif is not supported/);
});

test("diagram nodes may contain authored, source-linked columns but reject malformed parts", () => {
  const valid = structuredClone(flowDocument());
  const diagram = valid.scenes[0]!.blocks[0]!;
  if (diagram.kind !== "diagram") throw new Error("expected diagram");
  diagram.nodes[1]!.parts = [
    { id: "part:prep", label: "Preparation", source: [{ resourceId: "ex:prep" }] },
    { id: "part:measurement", label: "Measurement", description: "Instrument noise", source: [{ resourceId: "ex:measurement" }] },
  ];
  assert.doesNotThrow(() => validateSceneDocument(valid));
  const duplicate = structuredClone(valid);
  const bad = duplicate.scenes[0]!.blocks[0]!;
  if (bad.kind !== "diagram") throw new Error("expected diagram");
  bad.nodes[1]!.parts![1]!.id = bad.nodes[1]!.parts![0]!.id;
  assert.throws(() => validateSceneDocument(duplicate), /duplicate part ids/);
  const emptySources = structuredClone(valid);
  const missing = emptySources.scenes[0]!.blocks[0]!;
  if (missing.kind !== "diagram") throw new Error("expected diagram");
  missing.nodes[1]!.parts![0]!.source = [];
  assert.throws(() => validateSceneDocument(emptySources), /must retain at least one source resource/);
});

test("diagram notation is optional and validated independently from description", () => {
  const baseline = flowDocument();
  const valid: SceneDocument = {
    ...baseline,
    scenes: baseline.scenes.map((scene) => ({
      ...scene,
      blocks: scene.blocks.map((block) => block.kind === "diagram" ? {
        ...block,
        nodes: block.nodes.map((node) => node.id === "node:processing"
          ? { ...node, notation: "εᵢ" }
          : node),
      } : block),
    })),
  };
  assert.doesNotThrow(() => validateSceneDocument(valid));
  const invalid: SceneDocument = {
    ...valid,
    scenes: valid.scenes.map((scene) => ({
      ...scene,
      blocks: scene.blocks.map((block) => block.kind === "diagram" ? {
        ...block,
        nodes: block.nodes.map((node) => node.id === "node:processing"
          ? { ...node, notation: " " }
          : node),
      } : block),
    })),
  };
  assert.throws(() => validateSceneDocument(invalid), /notation must be non-empty/);
});

test("extended model-family motifs are accepted but arbitrary motif names remain invalid", () => {
  for (const visualMotif of ["nonlinear-curve", "multiple-inputs", "neural-network", "other-models"] as const) {
    const value = structuredClone(flowDocument());
    const block = value.scenes[0]!.blocks[0]!;
    if (block.kind !== "diagram") throw new Error("expected diagram");
    block.nodes[0]!.visualMotif = visualMotif;
    block.nodes[0]!.visualMotifRole = "highlight";
    assert.doesNotThrow(() => validateSceneDocument(value));
  }
});
