import { walkSceneBlocks } from "../../../packages/core/src/scene-blocks.ts";
import type { ChartBlock, SceneDocument } from "../../../packages/core/src/scene-document.ts";
import type { D3ChartOptions } from "../../../packages/renderer-d3/src/chart.ts";
import { mountD3BarChart } from "../../../packages/renderer-d3/src/bar-chart.ts";
import { mountD3LineChart } from "../../../packages/renderer-d3/src/line-chart.ts";
import { zeroInclusiveDomain } from "../../../packages/renderer-d3/src/numeric-domain.ts";

interface LiveChartComponent {
  updateValues(values: readonly number[]): void;
  destroy(): void;
}

type LiveSupportedChart = Extract<ChartBlock, { readonly chartType: "bar" | "line" }>;

function liveChartBlocks(documents: readonly SceneDocument[]): Map<string, LiveSupportedChart> {
  const result = new Map<string, LiveSupportedChart>();
  for (const document of documents) {
    for (const scene of document.scenes) {
      for (const block of walkSceneBlocks(scene.blocks)) {
        if (block.kind !== "chart" || (block.chartType !== "bar" && block.chartType !== "line") || !block.liveUpdate) continue;
        if (result.has(block.id)) throw new Error(`Duplicate live chart block id ${block.id}`);
        result.set(block.id, block);
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

function chartValues(block: LiveSupportedChart): readonly number[] {
  return block.chartType === "bar"
    ? block.data.map((datum) => datum.value)
    : block.series[0]?.data.map((datum) => datum.y) ?? [];
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

export interface LiveChartClock {
  now(): number;
  setInterval(callback: () => void, intervalMs: number): number;
  clearInterval(timer: number): void;
  requestAnimationFrame(callback: (now: number) => void): number;
  cancelAnimationFrame(frame: number): void;
}

export interface LiveChartPlayback {
  refresh(): void;
  destroy(): void;
}

/** Only the active, visible slide owns a timer or animation frame. */
export function createLiveChartPlayback(config: {
  readonly baseValues: readonly number[];
  readonly amplitude: number;
  readonly intervalMs: number;
  readonly reducedMotion: boolean;
  readonly isActive: () => boolean;
  readonly render: (values: readonly number[]) => void;
  readonly random?: () => number;
  readonly clock: LiveChartClock;
}): LiveChartPlayback {
  const { clock } = config;
  let displayedValues = [...config.baseValues];
  let timer: number | undefined;
  let frameId: number | undefined;
  let destroyed = false;
  const active = () => !destroyed && !config.reducedMotion && config.isActive();
  const cancel = () => {
    if (frameId !== undefined) clock.cancelAnimationFrame(frameId);
    if (timer !== undefined) clock.clearInterval(timer);
    frameId = undefined; timer = undefined;
  };
  const refresh = () => {
    if (!active()) { cancel(); return; }
    if (timer !== undefined) return;
    timer = clock.setInterval(() => {
      if (!active()) { cancel(); return; }
      if (frameId !== undefined) clock.cancelAnimationFrame(frameId);
      const from = [...displayedValues];
      const target = jitteredValues(config.baseValues, config.amplitude, config.random);
      const start = clock.now();
      const duration = Math.min(700, Math.max(250, config.intervalMs * 0.7));
      const frame = (now: number) => {
        frameId = undefined;
        if (!active()) { cancel(); return; }
        const progress = Math.min(1, (now - start) / duration);
        displayedValues = [...interpolateLiveValues(from, target, progress)];
        config.render(displayedValues);
        if (progress < 1) frameId = clock.requestAnimationFrame(frame);
      };
      frameId = clock.requestAnimationFrame(frame);
    }, config.intervalMs);
  };
  refresh();
  return { refresh, destroy() { if (destroyed) return; destroyed = true; cancel(); } };
}

export interface LiveChartRuntimeController extends LiveChartPlayback {
  pause(): void;
  resume(): void;
}

export function mountLiveChartUpdates(
  root: ParentNode & EventTarget,
  documents: readonly SceneDocument[],
  options: D3ChartOptions,
  random: () => number = Math.random,
): LiveChartRuntimeController {
  const blocks = liveChartBlocks(documents);
  const cleanup: Array<() => void> = [];
  const players: LiveChartPlayback[] = [];
  let paused = false;
  let destroyed = false;
  const clock: LiveChartClock = {
    now: () => performance.now(),
    setInterval: (callback, interval) => window.setInterval(callback, interval),
    clearInterval: timer => window.clearInterval(timer),
    requestAnimationFrame: callback => window.requestAnimationFrame(callback),
    cancelAnimationFrame: frame => window.cancelAnimationFrame(frame),
  };
  const refresh = () => { if (!destroyed) for (const player of players) player.refresh(); };
  try {
    for (const host of root.querySelectorAll<HTMLElement>('[data-live-chart="true"][data-chart-block-id]')) {
      const blockId = host.dataset.chartBlockId;
      if (!blockId) continue;
      const block = blocks.get(blockId);
      if (!block?.liveUpdate) continue;
      const section = host.closest<HTMLElement>("section");
      if (!section) continue;
      const { intervalMs, jitterAmplitude, decimalPlaces } = block.liveUpdate;
      const baseValues = chartValues(block);
      if (!baseValues.length) continue;
      const yDomain = block.chartType === "line"
        ? stableLiveYDomain(block.series.flatMap(series => series.data.map(datum => datum.y)), jitterAmplitude)
        : zeroInclusiveDomain(baseValues.flatMap(value => [value - jitterAmplitude, value + jitterAmplitude]));
      const result = block.chartType === "bar"
        ? mountD3BarChart(host, block, { ...options, yDomain })
        : mountD3LineChart(host, block, { ...options, yDomain });
      if ("diagnostics" in result) {
        throw new Error(`Unable to mount live chart ${blockId}: ${result.diagnostics.map(item => item.message).join("; ")}`);
      }
      const component: LiveChartComponent = result;
      cleanup.push(() => component.destroy());
      updateCompanionTable(section, baseValues, decimalPlaces);
      const player = createLiveChartPlayback({
        baseValues, amplitude: jitterAmplitude, intervalMs, random, clock,
        reducedMotion: options.reducedMotion,
        isActive: () => !paused && document.visibilityState !== "hidden"
          && document.body.dataset.presentationMode !== "script" && section.classList.contains("present"),
        render(values) {
          component.updateValues(values);
          updateCompanionTable(section, values, decimalPlaces);
        },
      });
      players.push(player);
      cleanup.push(() => player.destroy());
    }
  } catch (error) {
    for (const remove of cleanup.reverse()) remove();
    throw error;
  }
  document.addEventListener("visibilitychange", refresh);
  root.addEventListener("pcd-presentation-mode-change", refresh);
  return {
    refresh,
    pause() { paused = true; refresh(); },
    resume() { paused = false; refresh(); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      document.removeEventListener("visibilitychange", refresh);
      root.removeEventListener("pcd-presentation-mode-change", refresh);
      for (const remove of cleanup.reverse()) remove();
    },
  };
}
