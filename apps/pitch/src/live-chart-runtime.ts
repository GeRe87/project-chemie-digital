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


export function stableLiveYDomain(
  baseValues: readonly number[],
  jitterAmplitude: number,
): readonly [number, number] {
  if (baseValues.length === 0) throw new Error("Live chart focus domain requires at least one value");
  if (!Number.isFinite(jitterAmplitude) || jitterAmplitude < 0) {
    throw new Error("Live chart jitter amplitude must be a finite non-negative number");
  }
  if (baseValues.some((value) => !Number.isFinite(value))) {
    throw new Error("Live chart focus domain values must be finite");
  }

  const minimum = Math.min(...baseValues) - jitterAmplitude;
  const maximum = Math.max(...baseValues) + jitterAmplitude;
  const center = minimum + (maximum - minimum) / 2;
  const envelopeSpan = maximum - minimum;
  const minimumSpan = Math.max(jitterAmplitude * 4, Math.abs(center) * 0.02, Number.EPSILON);
  const paddedSpan = Math.max(envelopeSpan, minimumSpan) * 1.18;
  return [center - paddedSpan / 2, center + paddedSpan / 2];
}

export function interpolateLiveValues(
  from: readonly number[],
  to: readonly number[],
  progress: number,
): readonly number[] {
  if (from.length !== to.length) throw new Error("Live chart interpolation requires equally sized value arrays");
  const t = Math.max(0, Math.min(1, progress));
  const eased = t * t * (3 - 2 * t);
  return from.map((value, index) => value + ((to[index] ?? value) - value) * eased);
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
    const stableYDomain = block.chartType === "line"
      ? stableLiveYDomain(baseValues, block.liveUpdate.jitterAmplitude)
      : undefined;
    let component: LiveChartComponent | undefined;
    let displayedValues = [...baseValues];
    let animationFrame: number | undefined;
    let destroyed = false;

    const render = (values: readonly number[]): void => {
      if (destroyed) return;
      component?.destroy();
      const result = mountD3Chart(
        host,
        withChartValues(block, values),
        stableYDomain ? { ...options, yDomain: stableYDomain } : options,
      );
      if ("diagnostics" in result) {
        const message = result.diagnostics.map((item) => item.message).join("; ");
        throw new Error(`Unable to mount live chart ${blockId}: ${message}`);
      }
      component = result;
      displayedValues = [...values];
      updateCompanionTable(section, values, block.liveUpdate!.decimalPlaces);
    };

    const cancelAnimation = (): void => {
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
    };

    const animateTo = (targetValues: readonly number[]): void => {
      cancelAnimation();
      const startValues = [...displayedValues];
      const durationMs = Math.min(700, Math.max(250, block.liveUpdate!.intervalMs * 0.7));
      const start = performance.now();

      const frame = (now: number): void => {
        animationFrame = undefined;
        if (destroyed) return;
        const progress = Math.min(1, (now - start) / durationMs);
        render(interpolateLiveValues(startValues, targetValues, progress));
        if (progress < 1) animationFrame = window.requestAnimationFrame(frame);
      };

      animationFrame = window.requestAnimationFrame(frame);
    };

    render(baseValues);
    const timer = options.reducedMotion
      ? undefined
      : window.setInterval(() => {
          animateTo(jitteredValues(baseValues, block.liveUpdate!.jitterAmplitude, random));
        }, block.liveUpdate.intervalMs);

    cleanup.push(() => {
      destroyed = true;
      cancelAnimation();
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
