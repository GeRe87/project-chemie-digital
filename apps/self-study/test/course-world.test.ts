import assert from "node:assert/strict";
import test from "node:test";

import type {
  CanonicalRuntimeSceneDocumentBinding,
  TeachingOfferingRuntimeDocument,
} from "../../../packages/core/src/canonical-runtime.ts";
import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";
import {
  availableCourseWorldDocumentIds,
  createCourseWorldModel,
  renderCourseWorldHtml,
} from "../src/course-world.ts";

const BASE = "https://w3id.org/project-chemie-digital/resource/";
const GRAPH = "https://w3id.org/project-chemie-digital/graph/";

function offering(): TeachingOfferingRuntimeDocument {
  return {
    version: "1.0",
    datasetFingerprint: `sha256:${"a".repeat(64)}`,
    offering: {
      id: `${BASE}offering`,
      graphId: `${GRAPH}course`,
      labels: [{ value: "Course", language: "en" }],
      descriptions: [],
    },
    placements: [
      { id: `${BASE}placement-b`, position: 20, unitId: `${BASE}unit-b` },
      { id: `${BASE}placement-a`, position: 10, unitId: `${BASE}unit-a` },
    ],
    units: [
      {
        id: `${BASE}unit-b`,
        labels: [{ value: "Second Unit", language: "en" }],
        descriptions: [],
        paths: [{
          id: `${BASE}path-b`,
          graphId: `${GRAPH}paths/b`,
          labels: [{ value: "Path B", language: "en" }],
          descriptions: [],
        }],
      },
      {
        id: `${BASE}unit-a`,
        labels: [{ value: "First Unit", language: "en" }],
        descriptions: [],
        paths: [{
          id: `${BASE}path-a`,
          graphId: `${GRAPH}paths/a`,
          labels: [{ value: "Path A", language: "en" }],
          descriptions: [],
        }],
      },
    ],
  };
}

function documents(): SceneDocument[] {
  return [{
    version: "1.0",
    id: "opaque-scene-document",
    sourcePathId: "transport-id-that-does-not-match-the-absolute-path",
    scenes: [],
  }];
}

function bindings(): CanonicalRuntimeSceneDocumentBinding[] {
  return [{
    pathId: `${BASE}path-a`,
    pathGraphId: `${GRAPH}paths/a`,
    sceneDocumentId: "opaque-scene-document",
  }];
}

test("course world follows authored placement order, not units array order", () => {
  const model = createCourseWorldModel(offering(), documents(), bindings());
  assert.deepEqual(
    model.units.map((unit) => [unit.levelNumber, unit.position, unit.label]),
    [
      [1, 10, "First Unit"],
      [2, 20, "Second Unit"],
    ],
  );
});

test("course world uses explicit binding identities and never reverse-parses SceneDocument sourcePathId", () => {
  const model = createCourseWorldModel(offering(), documents(), bindings());
  assert.equal(model.units[0]!.paths[0]!.status, "available");
  assert.equal(model.units[0]!.paths[0]!.sceneDocumentId, "opaque-scene-document");
  assert.equal(model.units[1]!.paths[0]!.status, "in-preparation");
  assert.deepEqual(availableCourseWorldDocumentIds(model), ["opaque-scene-document"]);
});

test("course world static and interactive surfaces keep unavailable paths non-clickable", () => {
  const model = createCourseWorldModel(offering(), documents(), bindings());
  const staticHtml = renderCourseWorldHtml(model, { interactive: false });
  const interactiveHtml = renderCourseWorldHtml(model, { interactive: true });

  assert.match(staticHtml, /class="course-world"/);
  assert.match(staticHtml, />Level 1</);
  assert.match(staticHtml, />First Unit</);
  assert.match(staticHtml, /href="#course-document-/);
  assert.match(staticHtml, />Second Unit</);
  assert.match(staticHtml, />In preparation</);
  assert.doesNotMatch(
    staticHtml.match(/Second Unit[\s\S]*$/)?.[0] ?? "",
    /href=/,
  );

  assert.match(interactiveHtml, /button type="button" class="course-world-start"/);
  assert.match(interactiveHtml, /data-scene-document-id="opaque-scene-document"/);
});

test("course world fails closed for bindings outside the selected course or missing documents", () => {
  assert.throws(
    () => createCourseWorldModel(
      offering(),
      documents(),
      [{
        pathId: `${BASE}path-outside`,
        pathGraphId: `${GRAPH}paths/outside`,
        sceneDocumentId: "opaque-scene-document",
      }],
    ),
    /outside the selected TeachingOffering/,
  );

  assert.throws(
    () => createCourseWorldModel(
      offering(),
      documents(),
      [{
        pathId: `${BASE}path-a`,
        pathGraphId: `${GRAPH}paths/a`,
        sceneDocumentId: "missing-document",
      }],
    ),
    /absent document/,
  );
});

test("reused learning-unit placements keep separate stations but mount one bound document", () => {
  const reused: TeachingOfferingRuntimeDocument = {
    ...offering(),
    placements: [
      { id: `${BASE}placement-a-first`, position: 10, unitId: `${BASE}unit-a` },
      { id: `${BASE}placement-a-repeat`, position: 20, unitId: `${BASE}unit-a` },
      { id: `${BASE}placement-b`, position: 30, unitId: `${BASE}unit-b` },
    ],
  };

  const model = createCourseWorldModel(reused, documents(), bindings());
  assert.deepEqual(
    model.units.map((unit) => unit.placementId),
    [
      `${BASE}placement-a-first`,
      `${BASE}placement-a-repeat`,
      `${BASE}placement-b`,
    ],
  );
  assert.equal(model.units[0]!.paths[0]!.sceneDocumentId, "opaque-scene-document");
  assert.equal(model.units[1]!.paths[0]!.sceneDocumentId, "opaque-scene-document");
  assert.deepEqual(availableCourseWorldDocumentIds(model), ["opaque-scene-document"]);
});

test("course world fails closed when a compiled SceneDocument is not explicitly bound", () => {
  assert.throws(
    () => createCourseWorldModel(offering(), documents(), []),
    /has no exact path binding/,
  );
});
