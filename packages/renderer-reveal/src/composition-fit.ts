import type { Scene, SceneBlock } from "../../core/src/scene-document.ts";
import type { RevealCompositionKind, RevealCompositionPlan } from "./composition-policy.ts";

export type RevealCompositionVariant = "default" | "balanced" | "evidence-right" | "stacked";
export type RevealCompositionDensity = "comfortable" | "dense" | "compact";

export interface RevealBlockFootprint {
  readonly blockId: string;
  readonly score: number;
  readonly textUnits: number;
  readonly structuralUnits: number;
  readonly evidenceUnits: number;
}

export interface RevealCompositionFitDecision {
  readonly composition: RevealCompositionKind;
  readonly variant: RevealCompositionVariant;
  readonly density: RevealCompositionDensity;
  readonly totalScore: number;
  readonly evidenceScore: number;
  readonly blocks: readonly RevealBlockFootprint[];
}

function textUnits(text: string | undefined): number {
  const normalized = (text ?? "").replace(/\s+/gu, " ").trim();
  if (!normalized) return 0;
  return Math.max(0.5, normalized.length / 72);
}

function tableDimensions(block: Extract<SceneBlock, { kind: "table" }>): {
  rows: number;
  columns: number;
  cellTextUnits: number;
} {
  return {
    rows: block.rows.length,
    columns: block.columns.length,
    cellTextUnits: block.rows.reduce(
      (total, row) => total + row.cells.reduce((sum, cell) => sum + textUnits(cell.text), 0),
      0,
    ),
  };
}

function chartDatumCount(block: Extract<SceneBlock, { kind: "chart" }>): number {
  return block.chartType === "bar"
    ? block.data.length
    : block.series.reduce((total, series) => total + series.data.length, 0);
}

function blockFootprint(block: SceneBlock): RevealBlockFootprint {
  switch (block.kind) {
    case "prose": {
      const text = textUnits(block.text);
      return {
        blockId: block.id,
        score: 1 + text,
        textUnits: text,
        structuralUnits: 1,
        evidenceUnits: 0,
      };
    }
    case "math": {
      const text = textUnits(block.spokenText);
      return {
        blockId: block.id,
        score: 2 + text,
        textUnits: text,
        structuralUnits: 2,
        evidenceUnits: 1,
      };
    }
    case "code": {
      const text = textUnits(block.code) + textUnits(block.fallback);
      return {
        blockId: block.id,
        score: 2.5 + text,
        textUnits: text,
        structuralUnits: 2.5,
        evidenceUnits: 1.5,
      };
    }
    case "media-reference": {
      const text = textUnits(block.alternativeText);
      return {
        blockId: block.id,
        score: 3.5 + text * 0.35,
        textUnits: text,
        structuralUnits: 3.5,
        evidenceUnits: 1.5,
      };
    }
    case "list": {
      const text = block.items.reduce((total, item) => total + textUnits(item.text), 0);
      const structure = 1.5 + block.items.length * 1.1;
      return {
        blockId: block.id,
        score: structure + text * 0.65,
        textUnits: text,
        structuralUnits: structure,
        evidenceUnits: block.items.length * 0.25,
      };
    }
    case "definition-list": {
      const text = block.entries.reduce(
        (total, entry) => total + textUnits(entry.term) + textUnits(entry.description),
        0,
      );
      const structure = 2 + block.entries.length * 1.2;
      return {
        blockId: block.id,
        score: structure + text * 0.65,
        textUnits: text,
        structuralUnits: structure,
        evidenceUnits: block.entries.length * 0.3,
      };
    }
    case "table": {
      const dims = tableDimensions(block);
      const text = textUnits(block.caption) + textUnits(block.description) + dims.cellTextUnits
        + block.columns.reduce((total, column) => total + textUnits(column.label), 0);
      const structure = 2 + dims.rows * 0.9 + dims.columns * 0.65;
      const evidence = dims.rows * dims.columns * 0.28;
      return {
        blockId: block.id,
        score: structure + text * 0.45 + evidence,
        textUnits: text,
        structuralUnits: structure,
        evidenceUnits: evidence,
      };
    }
    case "group": {
      const children = block.children.map(blockFootprint);
      const text = children.reduce((total, child) => total + child.textUnits, 0);
      const structure = 1 + children.reduce((total, child) => total + child.structuralUnits, 0);
      const evidence = children.reduce((total, child) => total + child.evidenceUnits, 0);
      return {
        blockId: block.id,
        score: 1 + children.reduce((total, child) => total + child.score, 0),
        textUnits: text,
        structuralUnits: structure,
        evidenceUnits: evidence,
      };
    }
    case "prompt": {
      const text = textUnits(block.prompt)
        + (block.options ?? []).reduce((total, option) => total + textUnits(option), 0)
        + textUnits(block.fallback);
      const structure = 2 + (block.options?.length ?? 0) * 0.8;
      return {
        blockId: block.id,
        score: structure + text * 0.7,
        textUnits: text,
        structuralUnits: structure,
        evidenceUnits: 0.5,
      };
    }
    case "diagram": {
      const text = textUnits(block.label)
        + textUnits(block.description)
        + block.nodes.reduce((total, node) => total + textUnits(node.label), 0)
        + block.edges.reduce((total, edge) => total + textUnits(edge.label), 0);
      const structure = 3 + block.nodes.length * 0.8 + block.edges.length * 0.45;
      return {
        blockId: block.id,
        score: structure + text * 0.35,
        textUnits: text,
        structuralUnits: structure,
        evidenceUnits: block.nodes.length * 0.35,
      };
    }
    case "chart": {
      const dataCount = chartDatumCount(block);
      const text = textUnits(block.label)
        + textUnits(block.description)
        + textUnits(block.xAxis.label)
        + textUnits(block.yAxis.label);
      const structure = 3.5 + dataCount * 0.55;
      const evidence = 2 + dataCount * 0.5;
      return {
        blockId: block.id,
        score: structure + text * 0.4 + evidence,
        textUnits: text,
        structuralUnits: structure,
        evidenceUnits: evidence,
      };
    }
    default: {
      const unreachable: never = block;
      return unreachable;
    }
  }
}

function orderedBlocks(scene: Scene): readonly SceneBlock[] {
  const byId = new Map(scene.blocks.map((block) => [block.id, block]));
  return scene.readingOrder
    .map((id) => byId.get(id))
    .filter((block): block is SceneBlock => block !== undefined);
}

function densityForScore(totalScore: number): RevealCompositionDensity {
  if (totalScore >= 48) return "compact";
  if (totalScore >= 27) return "dense";
  return "comfortable";
}

function workedEvidenceVariant(
  scene: Scene,
  footprints: readonly RevealBlockFootprint[],
  density: RevealCompositionDensity,
): RevealCompositionVariant {
  const blocks = orderedBlocks(scene);
  const data = blocks[2];
  const analysis = blocks[3];

  if (density === "compact") return "stacked";

  if (data?.kind === "table") {
    const { rows, columns } = tableDimensions(data);
    if (rows >= 7 || columns >= 7 || rows * columns >= 36) return "stacked";
  }

  const evidenceIds = new Set([data?.id, analysis?.id].filter((id): id is string => id !== undefined));
  const evidenceScore = footprints
    .filter((footprint) => evidenceIds.has(footprint.blockId))
    .reduce((total, footprint) => total + footprint.score, 0);
  const totalScore = footprints.reduce((total, footprint) => total + footprint.score, 0);
  const evidenceRatio = totalScore > 0 ? evidenceScore / totalScore : 0;

  return evidenceRatio >= 0.42 ? "evidence-right" : "balanced";
}

export function inferRevealCompositionFit(
  scene: Scene,
  composition: RevealCompositionPlan,
): RevealCompositionFitDecision {

  const blocks = orderedBlocks(scene);
  const footprints = blocks.map(blockFootprint);
  const totalScore = footprints.reduce((total, footprint) => total + footprint.score, 0);
  const evidenceScore = footprints.reduce((total, footprint) => total + footprint.evidenceUnits, 0);
  const density = densityForScore(totalScore);

  if (
    composition.kind === "evidence-stage"
    && composition.profile === "context-data-visual"
  ) {
    return {
      composition: composition.kind,
      variant: workedEvidenceVariant(scene, footprints, density),
      density,
      totalScore,
      evidenceScore,
      blocks: footprints,
    };
  }

  return {
    composition: composition.kind,
    variant: "default",
    density: "comfortable",
    totalScore,
    evidenceScore,
    blocks: footprints,
  };
}

export function estimateRevealBlockFootprint(block: SceneBlock): RevealBlockFootprint {
  return blockFootprint(block);
}
