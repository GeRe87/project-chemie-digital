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

test("lecture mode exposes strong layered marker strokes behind list text", () => {
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

  const markerBlock = lectureStyles.slice(
    lectureStyles.indexOf(".pcd-marker-highlight {"),
    lectureStyles.indexOf(".pcd-marker-highlight--yellow"),
  );
  assert.equal((markerBlock.match(/linear-gradient\(/g) ?? []).length, 3);
  assert.match(markerBlock, /60%, transparent/);
  assert.match(markerBlock, /58%, transparent/);
  assert.match(markerBlock, /\.74em no-repeat/);
  assert.doesNotMatch(markerBlock, /border-radius/);

  const automaticMarker = lectureStyles.slice(
    lectureStyles.indexOf(".keypoint-list > li > .pcd-list-item-text"),
    lectureStyles.indexOf("/* Definition cards inherit"),
  );
  assert.equal((automaticMarker.match(/linear-gradient\(/g) ?? []).length, 3);
  assert.match(automaticMarker, /64%, transparent/);
  assert.match(automaticMarker, /61%, transparent/);
  assert.match(automaticMarker, /\.78em no-repeat/);
  assert.match(automaticMarker, /box-decoration-break:\s*clone/);
  assert.doesNotMatch(automaticMarker, /::before|::after|border-radius|clip-path/);
});

test("lecture worked-evidence readability preserves generic composition ownership", () => {
  assert.match(
    lectureStyles,
    /section\[data-composition="worked-evidence"\][\s\S]*?\[data-component-kind="visual"\]/,
  );
  assert.match(
    lectureStyles,
    /data-composition-region="support"\]\[data-component-kind="list-collection"\]/,
  );
  assert.doesNotMatch(lectureStyles, /--pcd-case-chart-height/);
  assert.doesNotMatch(lectureStyles, /data-layout="case-study"/);
});

test("staged slides freeze scroll containers and background progress structurally", () => {
  assert.match(stageStyles, /scrollbar-gutter:\s*stable/);
  assert.doesNotMatch(
    stageStyles,
    /body\.pcd-stage-lock-active[^{]*\{[^}]*overflow:\s*hidden\s*!important/s,
  );
  assert.match(stageStyles, /section\[data-stage-lock="true"\][\s\S]*?overflow:\s*hidden\s*!important/);

  assert.match(stageRuntime, /data-has-stages/);
  assert.match(stageRuntime, /data-stage-lock/);
  assert.match(stageRuntime, /preventDefault\(\)/);
  assert.match(stageRuntime, /fragmentshown/);
  assert.match(stageRuntime, /fragmenthidden/);
  assert.match(stageRuntime, /settleFrameOne/);
  assert.match(stageRuntime, /settleFrameTwo/);
  assert.match(stageRuntime, /activateAfterRevealSettles/);

  assert.match(
    mainSource,
    /freezeForActiveStage\s*=\s*document\.body\.classList\.contains\("pcd-stage-lock-active"\)/,
  );
  assert.doesNotMatch(mainSource, /isStageLockedSlide\(/);
});

test("staged scroll-view terminal navigation targets the adjacent scroll page boundary", () => {
  assert.match(stageRuntime, /target\.closest\("\.scroll-page"\)/);
  assert.match(stageRuntime, /viewport\.scrollTop\s*=\s*top/);
  assert.match(stageRuntime, /pcd-presentation-stage-exit/);
  assert.match(
    mainSource,
    /mountPresentationStageNavigation\([\s\S]*?view:\s*appearance\.view[\s\S]*?root/,
  );
});

test("inactive-slide hiding is deck-only so Reveal scroll view retains the full deck", () => {
  assert.match(
    stageStyles,
    /body\[data-presentation-view="deck"\]\s+#pitch-slides\s*>\s*section:not\(\.present\)/,
  );
  assert.doesNotMatch(
    stageStyles,
    /(?:^|\n)#pitch-slides\s*>\s*section:not\(\.present\)\s*\{/,
  );
  assert.match(
    mainSource,
    /document\.body\.dataset\.presentationView\s*=\s*appearance\.view/,
  );
});

test("semantic progressive disclosure preserves layout geometry", () => {
  const hiddenDisclosure = stageStyles.slice(
    stageStyles.indexOf('[data-presentation-disclosure-mode="progressive"]'),
  );
  assert.match(hiddenDisclosure, /visibility:\s*hidden/);
  assert.match(hiddenDisclosure, /opacity:\s*0/);
  assert.match(hiddenDisclosure, /pointer-events:\s*none/);
  assert.doesNotMatch(
    hiddenDisclosure.slice(0, hiddenDisclosure.indexOf('@media') >= 0 ? hiddenDisclosure.indexOf('@media') : undefined),
    /display:\s*none/,
  );
});

test("new lecture stage and accent renderer rules contain no course identity checks", () => {
  const implementation = [lectureStyles, stageStyles, stageRuntime].join("\n");
  assert.doesNotMatch(
    implementation,
    /chemometrics|nitrate|scene-chemometrics|course-overview/i,
  );
});
