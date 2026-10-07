import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { TeachingOfferingRuntimeDocument } from "../../../packages/core/src/canonical-runtime.ts";
import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";
import {
  createPitchCourseWorldModel,
  pitchCourseLevelBoundaries,
  renderPitchCourseWorldHtml,
} from "../src/course-world.ts";
import {
  isAuthoredCourseSlide,
  isPendingCourseDestination,
  resolveCourseSlideTarget,
  shouldReturnToCourseWorld,
} from "../src/course-world-navigation.ts";

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
  assert.match(html, /data-course-navigation-status/);
});

test("Pitch course slide identity excludes synthetic buffer and return sentinel", () => {
  const authored = { dataset: { sceneDocumentId: "document:intro" } } as unknown as HTMLElement;
  const buffer = {
    dataset: { sceneDocumentId: "document:intro", courseLevelBuffer: "true" },
  } as unknown as HTMLElement;
  const sentinel = {
    dataset: { sceneDocumentId: "document:intro", courseReturnSentinel: "true" },
  } as unknown as HTMLElement;
  assert.equal(isAuthoredCourseSlide(authored, "document:intro"), true);
  assert.equal(isAuthoredCourseSlide(buffer, "document:intro"), false);
  assert.equal(isAuthoredCourseSlide(sentinel, "document:intro"), false);
  assert.equal(isAuthoredCourseSlide(authored, "document:other"), false);
});

test("pending course open completes only on the exact requested authored slide", () => {
  const intro = {
    dataset: { sceneDocumentId: "document:intro" },
  } as unknown as HTMLElement;
  const levelOne = {
    dataset: { sceneDocumentId: "document:level-one" },
  } as unknown as HTMLElement;
  const levelOneBuffer = {
    dataset: { sceneDocumentId: "document:level-one", courseLevelBuffer: "true" },
  } as unknown as HTMLElement;

  assert.equal(
    isPendingCourseDestination(levelOne, "document:level-one", levelOne),
    true,
  );
  assert.equal(
    isPendingCourseDestination(intro, "document:level-one", levelOne),
    false,
  );
  assert.equal(
    isPendingCourseDestination(levelOneBuffer, "document:level-one", levelOneBuffer),
    false,
  );
  assert.equal(
    isPendingCourseDestination(levelOne, undefined, levelOne),
    false,
  );
});

test("course-world return sentinel is scoped to the active document", () => {
  const introSentinel = {
    dataset: { sceneDocumentId: "document:intro", courseReturnSentinel: "true" },
  } as unknown as HTMLElement;
  const levelOneSentinel = {
    dataset: { sceneDocumentId: "document:level-one", courseReturnSentinel: "true" },
  } as unknown as HTMLElement;
  const authoredLevelOne = {
    dataset: { sceneDocumentId: "document:level-one" },
  } as unknown as HTMLElement;

  assert.equal(shouldReturnToCourseWorld(introSentinel, "document:level-one"), false);
  assert.equal(shouldReturnToCourseWorld(levelOneSentinel, "document:level-one"), true);
  assert.equal(shouldReturnToCourseWorld(authoredLevelOne, "document:level-one"), false);
  assert.equal(shouldReturnToCourseWorld(levelOneSentinel, undefined), false);
});

test("Pitch course navigation resolves Reveal-owned slide indices instead of DOM positions", () => {
  const slide = {} as HTMLElement;
  const calls: HTMLElement[] = [];
  const target = resolveCourseSlideTarget({
    getIndices(candidate?: HTMLElement) {
      if (candidate) calls.push(candidate);
      return { h: 7, v: 2, f: 1 };
    },
  }, slide);
  assert.deepEqual(target, { h: 7, v: 2, f: 1 });
  assert.deepEqual(calls, [slide]);
});

test("Pitch course navigation rejects an unresolved Reveal target", () => {
  assert.throws(
    () => resolveCourseSlideTarget(
      { getIndices: () => ({ h: -1 }) },
      {} as HTMLElement,
    ),
    /valid horizontal index/,
  );
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


test("course-world navigation has a bounded generic settle path for Reveal scroll mode", () => {
  const source = readFileSync(new URL("../src/course-world-navigation.ts", import.meta.url), "utf8");
  assert.match(source, /let remainingFrames = 30/);
  assert.match(source, /requestAnimationFrame\(check\)/);
  assert.match(source, /finalizePendingOpen\(deck\.getCurrentSlide\(\) \?\? undefined\)/);
  assert.match(source, /cancelPendingSettle\(\)/);
  const lower = source.toLowerCase();
  assert.equal(lower.includes("document:intro"), false);
  assert.equal(lower.includes("variables and constants"), false);
});
