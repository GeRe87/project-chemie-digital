import assert from "node:assert/strict";
import test from "node:test";

import type { Scene, SceneBlock } from "../../core/src/scene-document.ts";
import { inferRevealLayoutFit, estimateRevealBlockFootprint } from "../src/layout-fit.ts";
import { inferRevealLayoutDecision } from "../src/layout-policy.ts";

function prose(id: string, text: string, intent: "introduce" | "explain" = "explain"): SceneBlock {
  return {
    id,
    kind: "prose",
    text,
    intent: { kind: intent },
    source: [{ resourceId: `resource:${id}` }],
  };
}

function problemGroup(id: string, text: string): SceneBlock {
  const proseBlock = prose(`${id}:prose`, text);
  const media = {
    id: `${id}:media`,
    kind: "media-reference" as const,
    uri: "/assets/illustration.svg",
    mediaType: "image/svg+xml",
    alternativeText: "Generic transparent scientific illustration with three labelled samples.",
    source: [{ resourceId: `resource:${id}:media` }],
  };
  return {
    id,
    kind: "group",
    children: [proseBlock, media],
    readingOrder: [proseBlock.id, media.id],
    source: [{ resourceId: `resource:${id}` }],
  };
}

function tableBlock(id: string, rows: number, columns: number): SceneBlock {
  const columnDefs = Array.from({ length: columns }, (_, index) => ({
    id: `${id}:column:${index + 1}`,
    label: index === 0 ? "Sample" : `Replicate ${index}`,
    source: [{ resourceId: `resource:${id}:column:${index + 1}` }],
  }));
  return {
    id,
    kind: "table",
    caption: "Illustrative repeated measurements",
    description: "Compact quantitative evidence from repeated analytical measurements.",
    columns: columnDefs,
    rows: Array.from({ length: rows }, (_, rowIndex) => ({
      id: `${id}:row:${rowIndex + 1}`,
      source: [{ resourceId: `resource:${id}:row:${rowIndex + 1}` }],
      cells: Array.from({ length: columns }, (_, columnIndex) => ({
        id: `${id}:cell:${rowIndex + 1}:${columnIndex + 1}`,
        text: columnIndex === 0 ? `Sample ${rowIndex + 1}` : String((rowIndex + 1) * (columnIndex + 1)),
        source: [{ resourceId: `resource:${id}:cell:${rowIndex + 1}:${columnIndex + 1}` }],
      })),
    })),
    source: [{ resourceId: `resource:${id}` }],
  };
}

function barChart(id: string, count: number, description = "Compact summary of the observed means."): SceneBlock {
  return {
    id,
    kind: "chart",
    chartType: "bar",
    label: "Illustrative summary",
    description,
    xAxis: { label: "Sample" },
    yAxis: { label: "Mean concentration", unit: "mg/L" },
    data: Array.from({ length: count }, (_, index) => ({
      id: `${id}:datum:${index + 1}`,
      category: `Sample ${index + 1}`,
      value: index + 1,
      source: [{ resourceId: `resource:${id}:datum:${index + 1}` }],
    })),
    source: [{ resourceId: `resource:${id}` }],
  };
}

function discussion(id: string, itemText = "Interpret the evidence rather than reporting one number."): SceneBlock {
  return {
    id,
    kind: "list",
    listStyle: "unordered",
    items: Array.from({ length: 3 }, (_, index) => ({
      id: `${id}:item:${index + 1}`,
      text: `${itemText} Observation ${index + 1}.`,
      source: [{ resourceId: `resource:${id}:item:${index + 1}` }],
    })),
    source: [{ resourceId: `resource:${id}` }],
  };
}

function caseStudyScene(options: {
  id: string;
  problemText: string;
  rows: number;
  columns: number;
  chartCount: number;
  chartDescription?: string;
  discussionText?: string;
}): Scene {
  const blocks: SceneBlock[] = [
    prose("heading", "Generic worked example", "introduce"),
    problemGroup("problem", options.problemText),
    tableBlock("data", options.rows, options.columns),
    barChart("analysis", options.chartCount, options.chartDescription),
    discussion("discussion", options.discussionText),
    prose("takeaway", "MEASUREMENTS → SUMMARY → INTERPRETATION"),
  ];
  return {
    id: options.id,
    source: [{ resourceId: "resource:generic-case-study" }],
    blocks,
    readingOrder: blocks.map((block) => block.id),
  };
}

test("estimates evidence blocks as structurally heavier than short prose", () => {
  const text = prose("short", "Short statement.");
  const table = tableBlock("table", 3, 5);
  const chart = barChart("chart", 3);
  assert.ok(estimateRevealBlockFootprint(table).score > estimateRevealBlockFootprint(text).score);
  assert.ok(estimateRevealBlockFootprint(chart).evidenceUnits > estimateRevealBlockFootprint(text).evidenceUnits);
});

test("selects evidence-right dense for a moderate mixed-evidence case study", () => {
  const scene = caseStudyScene({
    id: "scene:opaque-a",
    problemText: "Three samples are measured repeatedly. Which sample differs most, and how should the observed variation affect the interpretation?",
    rows: 3,
    columns: 5,
    chartCount: 3,
    chartDescription: "Mean plus a concise statement of repeated-measurement spread for three analytical samples, kept visible beside the raw measurements.",
    discussionText: "Use repeated measurements and the summary together before making a decision.",
  });
  const layout = inferRevealLayoutDecision(scene);
  const fit = inferRevealLayoutFit(scene, layout);
  assert.equal(layout?.family, "case-study");
  assert.equal(fit?.variant, "evidence-right");
  assert.equal(fit?.density, "dense");
  assert.ok((fit?.totalScore ?? 0) >= 27);
  assert.ok((fit?.totalScore ?? 0) < 48);
});

test("selects balanced when narrative footprint dominates the same generic family", () => {
  const scene = caseStudyScene({
    id: "scene:opaque-b",
    problemText: "A".repeat(720),
    rows: 1,
    columns: 2,
    chartCount: 1,
    discussionText: "Short interpretation.",
  });
  const fit = inferRevealLayoutFit(scene, inferRevealLayoutDecision(scene));
  assert.equal(fit?.variant, "balanced");
  assert.notEqual(fit?.density, "compact");
});

test("selects stacked compact for a high-footprint evidence case", () => {
  const scene = caseStudyScene({
    id: "scene:opaque-c",
    problemText: "A larger worked example combines many repeated measurements with a substantial quantitative summary.",
    rows: 8,
    columns: 6,
    chartCount: 8,
    chartDescription: "A larger analysis with several categories and enough evidence to exceed the safe three-column landscape budget.",
    discussionText: "The interpretation remains concise while the evidence footprint becomes large.",
  });
  const fit = inferRevealLayoutFit(scene, inferRevealLayoutDecision(scene));
  assert.equal(fit?.variant, "stacked");
  assert.equal(fit?.density, "compact");
});

test("fit decisions are independent of scene and resource identities", () => {
  const baseOptions = {
    problemText: "Three samples are measured repeatedly and summarized with a compact chart.",
    rows: 3,
    columns: 5,
    chartCount: 3,
    chartDescription: "A compact quantitative summary of repeated measurements.",
  };
  const a = caseStudyScene({ id: "scene:first", ...baseOptions });
  const b = caseStudyScene({ id: "totally-different-id", ...baseOptions });
  const fitA = inferRevealLayoutFit(a, inferRevealLayoutDecision(a));
  const fitB = inferRevealLayoutFit(b, inferRevealLayoutDecision(b));
  assert.equal(fitA?.variant, fitB?.variant);
  assert.equal(fitA?.density, fitB?.density);
  assert.equal(fitA?.totalScore, fitB?.totalScore);
});
