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

function sectionedOffering(): TeachingOfferingRuntimeDocument {
  const base = offering();
  return {
    ...base,
    version: "1.1",
    sections: [
      {
        id: `${BASE}section-alpha`,
        position: 10,
        labels: [{ value: "Region Alpha", language: "en" }],
        descriptions: [{ value: "First authored region.", language: "en" }],
        placementIds: [`${BASE}placement-b`, `${BASE}placement-a`],
      },
      {
        id: `${BASE}section-beta`,
        position: 20,
        labels: [{ value: "Region Beta", language: "en" }],
        descriptions: [{ value: "Second authored region.", language: "en" }],
        placementIds: [],
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


test("section-aware course world derives generic regions and unit order from authored positions", () => {
  const model = createCourseWorldModel(sectionedOffering(), documents(), bindings());
  assert.deepEqual(
    model.sections.map((section) => [section.regionNumber, section.position, section.label, section.description]),
    [
      [1, 10, "Region Alpha", "First authored region."],
      [2, 20, "Region Beta", "Second authored region."],
    ],
  );
  assert.deepEqual(
    model.sections[0]!.units.map((unit) => unit.placementId),
    [`${BASE}placement-a`, `${BASE}placement-b`],
  );
  assert.deepEqual(model.sections[1]!.units, []);
  assert.equal(model.sections[0]!.status, "available");
  assert.equal(model.sections[1]!.status, "in-preparation");
});

test("section rendering keeps static and interactive region surfaces in parity", () => {
  const model = createCourseWorldModel(sectionedOffering(), documents(), bindings());
  const staticHtml = renderCourseWorldHtml(model, { interactive: false });
  const interactiveHtml = renderCourseWorldHtml(model, { interactive: true });

  for (const html of [staticHtml, interactiveHtml]) {
    assert.match(html, /data-course-world-mode="sectioned"/);
    assert.match(html, />Region Alpha</);
    assert.match(html, />First authored region\.</);
    assert.match(html, />Region Beta</);
    assert.match(html, />Second authored region\.</);
    assert.match(html, /class="course-world-section-empty">In preparation</);
    assert.match(html, />First Unit</);
    assert.match(html, />Second Unit</);
  }
  assert.doesNotMatch(staticHtml, /course-world-section-focus/);
  assert.match(interactiveHtml, /class="course-world-section-focus"/);
  assert.match(interactiveHtml, /data-focus-course-section-id=/);
  assert.match(interactiveHtml, /aria-pressed="false"/);
});

test("section-aware projection fails closed for unknown, duplicate, uncovered, or misordered membership", () => {
  const base = sectionedOffering();
  assert.equal(base.version, "1.1");
  if (base.version !== "1.1") throw new Error("expected section-aware fixture");

  assert.throws(
    () => createCourseWorldModel(
      { ...base, sections: [{ ...base.sections[0]!, placementIds: [`${BASE}placement-missing`] }, base.sections[1]!] },
      documents(),
      bindings(),
    ),
    /unknown placement/,
  );

  assert.throws(
    () => createCourseWorldModel(
      {
        ...base,
        sections: [
          { ...base.sections[0]!, placementIds: [`${BASE}placement-a`] },
          { ...base.sections[1]!, placementIds: [`${BASE}placement-a`, `${BASE}placement-b`] },
        ],
      },
      documents(),
      bindings(),
    ),
    /grouped more than once/,
  );

  assert.throws(
    () => createCourseWorldModel(
      {
        ...base,
        sections: [
          { ...base.sections[0]!, placementIds: [`${BASE}placement-a`] },
          base.sections[1]!,
        ],
      },
      documents(),
      bindings(),
    ),
    /leaves placements ungrouped/,
  );

  assert.throws(
    () => createCourseWorldModel(
      { ...base, sections: [base.sections[1]!, base.sections[0]!] },
      documents(),
      bindings(),
    ),
    /strictly increasing authored position/,
  );
});

test("section-capable offerings without authored sections retain the flat-world fallback", () => {
  const flatV11: TeachingOfferingRuntimeDocument = {
    ...offering(),
    version: "1.1",
    sections: [],
  };
  const model = createCourseWorldModel(flatV11, documents(), bindings());
  assert.deepEqual(model.sections, []);
  const html = renderCourseWorldHtml(model, { interactive: false });
  assert.match(html, /data-course-world-mode="flat"/);
  assert.match(html, /class="course-world-route"/);
  assert.doesNotMatch(html, /course-world-sections/);
});
