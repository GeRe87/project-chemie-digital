import assert from "node:assert/strict";
import test from "node:test";

import type { Scene } from "../../../packages/core/src/scene-document.ts";
import {
  parseSemanticRingModule,
  semanticRingProjection,
} from "../src/cogniflow-semantic-rings-runtime.ts";

const scene: Scene = {
  id: "ex:scene-cogniflow-semantic-core--scene",
  source: [{ resourceId: "ex:scene-cogniflow-semantic-core" }],
  blocks: [
    {
      id: "heading",
      kind: "prose",
      text: "CogniFlow Starts with Meaning",
      source: [{ resourceId: "ex:cogniflow-semantic-core" }],
      intent: { kind: "introduce" },
    },
    {
      id: "core",
      kind: "prose",
      text: "CORE ONTOLOGY\ncf_ontology\nMeta-TBox · ConceptDomain · Concept",
      source: [{ resourceId: "ex:cogniflow-ring-core" }],
    },
    {
      id: "concepts",
      kind: "list",
      listStyle: "unordered",
      items: [
        {
          id: "package",
          text: "PACKAGE\ncf_concept_package\nCfPackage · Manifest · Version",
          source: [{ resourceId: "ex:keypoint-package" }],
        },
        {
          id: "processing",
          text: "DATA PROCESSING\ncf_concept_processing\nProcessingUnit · ProcessingStep",
          source: [{ resourceId: "ex:keypoint-processing" }],
        },
      ],
      source: [{ resourceId: "ex:cogniflow-ring-concept-layer" }],
    },
    {
      id: "specifications",
      kind: "list",
      listStyle: "unordered",
      items: [
        {
          id: "runtime",
          text: "RUNTIME\ncf_runtime",
          source: [{ resourceId: "ex:keypoint-runtime" }],
        },
      ],
      source: [{ resourceId: "ex:cogniflow-ring-specification-layer" }],
    },
    {
      id: "note",
      kind: "prose",
      text: "SMALL CORE → DOMAIN MODULES → MANY CONCRETE SPECIFICATIONS",
      source: [{ resourceId: "ex:cogniflow-ring-note" }],
    },
  ],
  readingOrder: ["heading", "core", "concepts", "specifications", "note"],
};

test("semantic ring module parser preserves title, package id, and authored detail lines", () => {
  assert.deepEqual(
    parseSemanticRingModule("PACKAGE\ncf_concept_package\nCfPackage · Manifest · Version"),
    {
      title: "PACKAGE",
      packageId: "cf_concept_package",
      details: ["CfPackage · Manifest · Version"],
    },
  );
  assert.deepEqual(
    parseSemanticRingModule("RUNTIME\ncf_runtime"),
    { title: "RUNTIME", packageId: "cf_runtime" },
  );
});

test("semantic ring projection is driven by graph-backed source resources", () => {
  const projection = semanticRingProjection(scene);
  assert.equal(projection?.sceneId, scene.id);
  assert.equal(projection?.coreText.startsWith("CORE ONTOLOGY"), true);
  assert.deepEqual(projection?.conceptModules.map((module) => module.packageId), [
    "cf_concept_package",
    "cf_concept_processing",
  ]);
  assert.deepEqual(projection?.specificationModules.map((module) => module.packageId), [
    "cf_runtime",
  ]);
  assert.equal(
    projection?.noteText,
    "SMALL CORE → DOMAIN MODULES → MANY CONCRETE SPECIFICATIONS",
  );
});
