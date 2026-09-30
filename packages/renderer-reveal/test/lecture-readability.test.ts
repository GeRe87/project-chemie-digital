import assert from "node:assert/strict";
import test from "node:test";

import type { Scene, SceneBlock } from "../../core/src/scene-document.ts";
import {
  evaluateLectureContentBudget,
  lectureContentBudgetLimits,
} from "../src/lecture-readability.ts";

function prose(id: string, text: string, intent: "introduce" | "explain" = "explain"): SceneBlock {
  return {
    id,
    kind: "prose",
    text,
    intent: { kind: intent },
    source: [{ resourceId: `resource:${id}` }],
  };
}

function list(id: string, count: number): SceneBlock {
  return {
    id,
    kind: "list",
    listStyle: "unordered",
    items: Array.from({ length: count }, (_, index) => ({
      id: `${id}:item:${index + 1}`,
      text: `Readable lecture point ${index + 1} with one concise idea.`,
      source: [{ resourceId: `resource:${id}:item:${index + 1}` }],
    })),
    source: [{ resourceId: `resource:${id}` }],
  };
}

function table(id: string, rows: number, columns: number): SceneBlock {
  return {
    id,
    kind: "table",
    caption: "Compact lecture evidence",
    columns: Array.from({ length: columns }, (_, index) => ({
      id: `${id}:column:${index + 1}`,
      label: index === 0 ? "Sample" : `Rep ${index}`,
      source: [{ resourceId: `resource:${id}:column:${index + 1}` }],
    })),
    rows: Array.from({ length: rows }, (_, rowIndex) => ({
      id: `${id}:row:${rowIndex + 1}`,
      source: [{ resourceId: `resource:${id}:row:${rowIndex + 1}` }],
      cells: Array.from({ length: columns }, (_, columnIndex) => ({
        id: `${id}:cell:${rowIndex + 1}:${columnIndex + 1}`,
        text: columnIndex === 0 ? `Sample ${rowIndex + 1}` : String(rowIndex + columnIndex + 1),
        source: [{ resourceId: `resource:${id}:cell:${rowIndex + 1}:${columnIndex + 1}` }],
      })),
    })),
    source: [{ resourceId: `resource:${id}` }],
  };
}

function barChart(id: string, count: number): SceneBlock {
  return {
    id,
    kind: "chart",
    chartType: "bar",
    label: "Lecture-scale summary",
    description: "A compact visual summary.",
    xAxis: { label: "Sample" },
    yAxis: { label: "Mean", unit: "mg/L" },
    data: Array.from({ length: count }, (_, index) => ({
      id: `${id}:datum:${index + 1}`,
      category: `Sample ${index + 1}`,
      value: index + 1,
      source: [{ resourceId: `resource:${id}:datum:${index + 1}` }],
    })),
    source: [{ resourceId: `resource:${id}` }],
  };
}

function scene(id: string, blocks: readonly SceneBlock[]): Scene {
  return {
    id,
    source: [{ resourceId: `resource:${id}` }],
    blocks,
    readingOrder: blocks.map((block) => block.id),
  };
}

test("accepts a lecture slide with four primary regions and concise evidence", () => {
  const blocks = [
    prose("heading", "Worked analytical example", "introduce"),
    prose("problem", "Which sample is different, and what does repeated measurement tell us?"),
    table("data", 3, 5),
    barChart("analysis", 3),
    list("discussion", 2),
  ];
  const result = evaluateLectureContentBudget(scene("scene:within", blocks));
  assert.equal(result.primaryRegions, 4);
  assert.equal(result.status, "within-budget");
  assert.ok(result.score <= lectureContentBudgetLimits.maxScore);
  assert.deepEqual(result.reasons, []);
});

test("flags too many primary regions instead of implying smaller typography", () => {
  const blocks = [
    prose("heading", "Overloaded lecture slide", "introduce"),
    prose("context-a", "Context A with enough explanation to form a separate visual region."),
    prose("context-b", "Context B with enough explanation to form a separate visual region."),
    list("points-a", 3),
    list("points-b", 3),
    table("data", 3, 5),
    barChart("analysis", 3),
  ];
  const result = evaluateLectureContentBudget(scene("scene:over-regions", blocks));
  assert.equal(result.status, "over-budget");
  assert.ok(result.primaryRegions > lectureContentBudgetLimits.maxPrimaryRegions);
  assert.match(result.reasons.join("\n"), /primary regions/);
});

test("flags a high structural footprint even when region count stays bounded", () => {
  const blocks = [
    prose("heading", "Large evidence slide", "introduce"),
    table("large-table", 9, 7),
    barChart("large-chart", 9),
    list("discussion", 3),
  ];
  const result = evaluateLectureContentBudget(scene("scene:over-score", blocks));
  assert.equal(result.status, "over-budget");
  assert.ok(result.score > lectureContentBudgetLimits.maxScore);
  assert.match(result.reasons.join("\n"), /content footprint/);
});

test("scene and resource identities do not affect lecture-budget decisions", () => {
  const blocksA = [
    prose("heading-a", "Opaque example", "introduce"),
    table("table-a", 3, 5),
    barChart("chart-a", 3),
    list("discussion-a", 2),
  ];
  const blocksB = [
    prose("heading-b", "Opaque example", "introduce"),
    table("table-b", 3, 5),
    barChart("chart-b", 3),
    list("discussion-b", 2),
  ];
  const a = evaluateLectureContentBudget(scene("scene:any-a", blocksA));
  const b = evaluateLectureContentBudget(scene("scene:any-b", blocksB));
  assert.equal(a.status, b.status);
  assert.equal(a.score, b.score);
  assert.equal(a.primaryRegions, b.primaryRegions);
});
