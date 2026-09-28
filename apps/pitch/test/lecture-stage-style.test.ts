import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const lectureStyles = readFileSync(
  new URL("../src/lecture-readability.css", import.meta.url),
  "utf8",
);
const stageStyles = readFileSync(
  new URL("../src/presentation-step-runtime.css", import.meta.url),
  "utf8",
);
const mainSource = readFileSync(
  new URL("../src/main.ts", import.meta.url),
  "utf8",
);
const stageRuntime = readFileSync(
  new URL("../src/presentation-step-runtime.ts", import.meta.url),
  "utf8",
);

test("lecture mode exposes a reusable four-colour marker palette", () => {
  for (const token of [
    "--pcd-lecture-yellow",
    "--pcd-lecture-cyan",
    "--pcd-lecture-pink",
    "--pcd-lecture-green",
  ]) {
    assert.match(lectureStyles, new RegExp(token));
  }

  for (const className of [
    "pcd-marker-highlight--yellow",
    "pcd-marker-highlight--cyan",
    "pcd-marker-highlight--pink",
    "pcd-marker-highlight--green",
  ]) {
    assert.match(lectureStyles, new RegExp(className));
  }

  assert.match(lectureStyles, /color-mix\(in srgb, var\(--pcd-marker-color\) 62%/);
  assert.match(lectureStyles, /transform:\s*rotate\(-\.65deg\) skewX\(-3deg\)/);
});

test("lecture case-study analysis uses a larger projection-scale chart area", () => {
  assert.match(
    lectureStyles,
    /--pcd-case-chart-height:\s*clamp\(30rem,\s*60vh,\s*34rem\)/,
  );
  assert.match(
    lectureStyles,
    /section\[data-layout="case-study"\][\s\S]*?\[data-layout-slot="analysis"\]/,
  );
});

test("staged slides freeze scroll containers and background progress structurally", () => {
  assert.match(stageStyles, /body\.pcd-stage-lock-active[\s\S]*?overflow:\s*hidden\s*!important/);
  assert.match(stageStyles, /scrollbar-gutter:\s*stable/);
  assert.match(stageStyles, /section\[data-stage-lock="true"\][\s\S]*?overflow:\s*hidden\s*!important/);

  assert.match(stageRuntime, /data-has-stages/);
  assert.match(stageRuntime, /data-stage-lock/);
  assert.match(stageRuntime, /preventDefault\(\)/);
  assert.match(stageRuntime, /fragmentshown/);
  assert.match(stageRuntime, /fragmenthidden/);

  assert.match(
    mainSource,
    /freezeForLayout[\s\S]*?isStageLockedSlide\(currentSlide\)/,
  );
  assert.match(
    mainSource,
    /sameFullMediaSequence[\s\S]*?isStageLockedSlide\(current\)/,
  );
});

test("new lecture stage and accent renderer rules contain no course identity checks", () => {
  const implementation = [lectureStyles, stageStyles, stageRuntime].join("\n");
  assert.doesNotMatch(
    implementation,
    /chemometrics|nitrate|scene-chemometrics|course-overview/i,
  );
});
