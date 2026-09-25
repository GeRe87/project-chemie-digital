import type { ChartBlock, SceneDocument } from "../../../packages/core/src/scene-document.ts";
import { mountD3Chart, type D3ChartOptions } from "../../../packages/renderer-d3/src/chart.ts";

export interface PitchChartHost {
  getAttribute(name: string): string | null;
}

interface PitchChartComponent {
  destroy(): void;
}

interface PitchChartFailure {
  readonly diagnostics: readonly {
    readonly code: string;
    readonly message: string;
  }[];
}

export type PitchChartMount = (
  host: unknown,
  block: ChartBlock,
  options: D3ChartOptions,
) => PitchChartComponent | PitchChartFailure;

function chartBlocks(documents: readonly SceneDocument[]): Map<string, ChartBlock> {
  const blocks = new Map<string, ChartBlock>();
  for (const document of documents) {
    for (const scene of document.scenes) {
      for (const block of scene.blocks) {
        if (block.kind !== "chart") continue;
        if (blocks.has(block.id)) {
          throw new Error(`Duplicate pitch chart block id ${block.id}`);
        }
        blocks.set(block.id, block);
      }
    }
  }
  return blocks;
}

export function mountPitchCharts(
  hosts: readonly PitchChartHost[],
  documents: readonly SceneDocument[],
  options: D3ChartOptions,
  mount: PitchChartMount = mountD3Chart,
): () => void {
  const blocks = chartBlocks(documents);
  const components: PitchChartComponent[] = [];

  const cleanup = (): void => {
    for (const component of components.splice(0)) {
      component.destroy();
    }
  };

  try {
    for (const host of hosts) {
      const blockId = host.getAttribute("data-chart-block-id");
      if (!blockId) continue;

      const block = blocks.get(blockId);
      if (!block) {
        throw new Error(`Pitch chart host references unknown block ${blockId}`);
      }

      const result = mount(host, block, options);
      if ("diagnostics" in result) {
        const message = result.diagnostics
          .map((diagnostic) => `[${diagnostic.code}] ${diagnostic.message}`)
          .join("; ");
        throw new Error(
          `Unable to mount pitch chart ${blockId}: ${message || "unknown renderer failure"}`,
        );
      }

      components.push(result);
    }
  } catch (error) {
    cleanup();
    throw error;
  }

  let destroyed = false;
  return () => {
    if (destroyed) return;
    destroyed = true;
    cleanup();
  };
}
