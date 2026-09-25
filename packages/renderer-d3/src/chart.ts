import type { ChartBlock } from "../../core/src/scene-document.ts";
import { mountD3BarChart, type D3BarChartOptions } from "./bar-chart.ts";
import { mountD3LineChart, type D3LineChartOptions } from "./line-chart.ts";

export type D3ChartOptions = D3BarChartOptions & D3LineChartOptions;

export function mountD3Chart(host: unknown, block: ChartBlock, options: D3ChartOptions) {
  return block.chartType === "bar"
    ? mountD3BarChart(host, block, options)
    : mountD3LineChart(host, block, options);
}
