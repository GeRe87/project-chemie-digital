import assert from "node:assert/strict";
import test from "node:test";

import type { SceneDocument } from "../../../packages/core/src/scene-document.ts";
import { mountPitchCharts } from "../src/chart-runtime.ts";

const block = {
  id: "chart:dense",
  kind: "chart",
  chartType: "bar",
  label: "Opaque chart",
  description: "Opaque description",
  xAxis: { label: "Sample" },
  yAxis: { label: "Value", unit: "a.u." },
  data: [
    { id: "datum:a", category: "A", value: 1, source: [{ resourceId: "resource:a" }] },
  ],
  source: [{ resourceId: "resource:chart" }],
} as const;

const document = {
  version: "1.5",
  id: "document:dense",
  sourcePathId: "path:dense",
  scenes: [{
    id: "scene:dense",
    source: [{ resourceId: "resource:scene" }],
    blocks: [block],
    readingOrder: [block.id],
  }],
} as unknown as SceneDocument;

test("forwards composition density from chart host to generic D3 options", () => {
  let receivedDensity: string | undefined;
  let destroyed = false;
  const host = {
    getAttribute(name: string): string | null {
      if (name === "data-chart-block-id") return block.id;
      if (name === "data-composition-density") return "dense";
      return null;
    },
  };

  const cleanup = mountPitchCharts(
    [host],
    [document],
    { reducedMotion: true },
    (_host, _block, options) => {
      receivedDensity = options.density;
      return { destroy() { destroyed = true; } };
    },
  );

  assert.equal(receivedDensity, "dense");
  cleanup();
  assert.equal(destroyed, true);
});

test("does not invent density when the host has no fit marker", () => {
  let receivedDensity: string | undefined = "sentinel";
  const host = {
    getAttribute(name: string): string | null {
      return name === "data-chart-block-id" ? block.id : null;
    },
  };

  mountPitchCharts(
    [host],
    [document],
    { reducedMotion: true },
    (_host, _block, options) => {
      receivedDensity = options.density;
      return { destroy() {} };
    },
  )();

  assert.equal(receivedDensity, undefined);
});
