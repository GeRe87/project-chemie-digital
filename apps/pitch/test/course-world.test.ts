import test from "node:test";
import assert from "node:assert/strict";
import type { TeachingOfferingRuntimeDocument } from "../../../packages/core/src/canonical-runtime.ts";
import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";
import {
  createPitchCourseWorldModel,
  pitchCourseLevelBoundaries,
  renderPitchCourseWorldHtml,
} from "../src/course-world.ts";

const fingerprint = "sha256:" + "a".repeat(64);
const offering: TeachingOfferingRuntimeDocument = {
  version: "1.1",
  datasetFingerprint: fingerprint,
  offering: {
    id: "https://example.test/offering",
    graphId: "https://example.test/graph/course",
    labels: [{ value: "Example Course", language: "en" }],
    descriptions: [],
  },
  placements: [
    { id: "https://example.test/place/intro", position: 10, unitId: "https://example.test/unit/intro" },
    { id: "https://example.test/place/next", position: 20, unitId: "https://example.test/unit/next" },
  ],
  units: [
    {
      id: "https://example.test/unit/next",
      labels: [{ value: "Next Topic", language: "en" }],
      descriptions: [],
      paths: [{
        id: "https://example.test/path/next",
        graphId: "https://example.test/graph/path/next",
        labels: [{ value: "Next path", language: "en" }],
        descriptions: [],
      }],
    },
    {
      id: "https://example.test/unit/intro",
      labels: [{ value: "Introduction", language: "en" }],
      descriptions: [],
      paths: [{
        id: "https://example.test/path/intro",
        graphId: "https://example.test/graph/path/intro",
        labels: [{ value: "Introduction path", language: "en" }],
        descriptions: [],
      }],
    },
  ],
  sections: [
    {
      id: "https://example.test/section/start",
      position: 10,
      labels: [{ value: "Getting Started", language: "en" }],
      descriptions: [{ value: "Orientation", language: "en" }],
      placementIds: ["https://example.test/place/intro"],
    },
    {
      id: "https://example.test/section/data",
      position: 20,
      labels: [{ value: "Data", language: "en" }],
      descriptions: [],
      placementIds: ["https://example.test/place/next"],
    },
  ],
};

const introDocument = { id: "document:intro" } as SceneDocument;
const model = createPitchCourseWorldModel(
  offering,
  [introDocument],
  [{
    pathId: "https://example.test/path/intro",
    pathGraphId: "https://example.test/graph/path/intro",
    sceneDocumentId: "document:intro",
  }],
);

test("Pitch course world numbers authored placements from Level 0", () => {
  assert.equal(model.title, "Example Course");
  assert.deepEqual(model.units.map((unit) => [unit.levelNumber, unit.label, unit.status]), [
    [0, "Introduction", "available"],
    [1, "Next Topic", "in-preparation"],
  ]);
  assert.deepEqual(model.sections.map((section) => section.label), ["Getting Started", "Data"]);
  assert.deepEqual(pitchCourseLevelBoundaries(model), [
    { sceneDocumentId: "document:intro", levelNumber: 0, label: "Introduction" },
  ]);
});

test("Pitch course world HTML exposes Level 0 and exact bound Start action", () => {
  const html = renderPitchCourseWorldHtml(model);
  assert.match(html, /COURSE OVERWORLD/);
  assert.match(html, /Level 0/);
  assert.match(html, />Introduction</);
  assert.match(html, /data-scene-document-id="document:intro"/);
  assert.match(html, /Next Topic/);
  assert.match(html, /In preparation/);
});

test("Pitch course world rejects bindings outside the selected offering", () => {
  assert.throws(
    () => createPitchCourseWorldModel(
      offering,
      [introDocument],
      [{
        pathId: "https://example.test/path/outside",
        pathGraphId: "https://example.test/graph/path/outside",
        sceneDocumentId: "document:intro",
      }],
    ),
    /outside the selected offering/,
  );
});
