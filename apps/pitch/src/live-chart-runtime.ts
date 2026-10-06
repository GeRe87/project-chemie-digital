import type { ChartBlock, SceneDocument } from "../../../packages/core/src/scene-document.ts";
import { mountD3Chart, type D3ChartOptions } from "../../../packages/renderer-d3/src/chart.ts";

interface LiveChartComponent {
  destroy(): void;
}

function liveChartBlocks(documents: readonly SceneDocument[]): Map<string, ChartBlock> {
  const result = new Map<string, ChartBlock>();
  for (const document of documents) {
    for (const scene of document.scenes) {
      for (const block of scene.blocks) {
        if (block.kind === "chart" && block.liveUpdate) result.set(block.id, block);
      }
    }
  }
  return result;
}

export function jitteredValues(
  baseValues: readonly number[],
  amplitude: number,
  random: () => number = Math.random,
): readonly number[] {
  return baseValues.map((value) => value + (random() * 2 - 1) * amplitude);
}

function chartValues(block: ChartBlock): readonly number[] {
  return block.chartType === "bar"
    ? block.data.map((datum) => datum.value)
    : block.series[0]?.data.map((datum) => datum.y) ?? [];
}

function withChartValues(block: ChartBlock, values: readonly number[]): ChartBlock {
  if (block.chartType === "bar") {
    return {
      ...block,
      data: block.data.map((datum, index) => ({ ...datum, value: values[index] ?? datum.value })),
    };
  }
  return {
    ...block,
    series: block.series.map((series, seriesIndex) => seriesIndex === 0
      ? {
          ...series,
          data: series.data.map((datum, index) => ({ ...datum, y: values[index] ?? datum.y })),
        }
      : series),
  };
}

function updateCompanionTable(section: HTMLElement, values: readonly number[], decimalPlaces: number): void {
  const table = section.querySelector<HTMLTableElement>("table[data-table-block-id]");
  if (!table) return;
  const rows = [...table.querySelectorAll<HTMLTableRowElement>("tbody tr")];
  if (rows.length !== values.length) return;
  rows.forEach((row, index) => {
    const cell = row.lastElementChild;
    if (cell instanceof HTMLTableCellElement) cell.textContent = values[index]!.toFixed(decimalPlaces);
  });
}

export function mountLiveChartUpdates(
  root: ParentNode,
  documents: readonly SceneDocument[],
  options: D3ChartOptions,
  random: () => number = Math.random,
): () => void {
  const blocks = liveChartBlocks(documents);
  const cleanup: Array<() => void> = [];

  for (const host of root.querySelectorAll<HTMLElement>('[data-live-chart="true"][data-chart-block-id]')) {
    const blockId = host.dataset.chartBlockId;
    if (!blockId) continue;
    const block = blocks.get(blockId);
    if (!block?.liveUpdate) continue;
    const section = host.closest<HTMLElement>("section");
    if (!section) continue;

    const baseValues = chartValues(block);
    if (baseValues.length === 0) continue;
    let component: LiveChartComponent | undefined;
    let destroyed = false;

    const render = (values: readonly number[]): void => {
      if (destroyed) return;
      component?.destroy();
      const result = mountD3Chart(host, withChartValues(block, values), options);
      if ("diagnostics" in result) {
        const message = result.diagnostics.map((item) => item.message).join("; ");
        throw new Error(`Unable to mount live chart ${blockId}: ${message}`);
      }
      component = result;
      updateCompanionTable(section, values, block.liveUpdate!.decimalPlaces);
    };

    render(baseValues);
    const timer = options.reducedMotion
      ? undefined
      : window.setInterval(() => {
          render(jitteredValues(baseValues, block.liveUpdate!.jitterAmplitude, random));
        }, block.liveUpdate.intervalMs);

    cleanup.push(() => {
      destroyed = true;
      if (timer !== undefined) window.clearInterval(timer);
      component?.destroy();
      component = undefined;
    });
  }

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    for (const remove of cleanup.reverse()) remove();
  };
}
