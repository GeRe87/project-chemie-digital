import type { ChartBlock } from "../../core/src/scene-document.ts";
import { mountD3BarChart, type D3BarChartOptions } from "./bar-chart.ts";
import { mountD3LineChart, type D3LineChartOptions } from "./line-chart.ts";
import { mountD3DotPlot } from "./dot-plot.ts";
import { mountObservationExplorer } from "./observation-explorer.ts";
import { mountD3BoxPlot } from "./box-plot.ts";
import { mountD3Histogram } from "./histogram.ts";
import { mountD3TimelineChart } from "./timeline-chart.ts";

export type D3ChartOptions = D3BarChartOptions & D3LineChartOptions;

export function mountD3Chart(host: unknown, block: ChartBlock, options: D3ChartOptions) {
  if (block.chartType === "timeline") {
    if (!(host instanceof HTMLElement)) throw new Error("Timeline chart requires an HTML host");
    return mountD3TimelineChart(host, block, options);
  }
  if(block.chartType==="histogram"||block.chartType==="histogram2d")return mountD3Histogram(host,block);
  if (block.chartType === "box") return mountD3BoxPlot(host,block);
  if (block.chartType === "observations") return mountObservationExplorer(host, block);
  if (block.chartType === "dot") return mountD3DotPlot(host, block, options);
  return block.chartType === "bar"
    ? mountD3BarChart(host, block, options)
    : mountD3LineChart(host, block, options);
}
