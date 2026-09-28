import type { Scene, SceneBlock } from "../../core/src/scene-document.ts";
import { estimateRevealBlockFootprint } from "./layout-fit.ts";

export type LectureContentBudgetStatus = "within-budget" | "over-budget";

export interface LectureContentBudgetDecision {
  readonly status: LectureContentBudgetStatus;
  readonly score: number;
  readonly primaryRegions: number;
  readonly reasons: readonly string[];
}

const LECTURE_MAX_SCORE = 40;
const LECTURE_MAX_PRIMARY_REGIONS = 4;

function orderedBlocks(scene: Scene): readonly SceneBlock[] {
  const byId = new Map(scene.blocks.map((block) => [block.id, block]));
  return scene.readingOrder
    .map((id) => byId.get(id))
    .filter((block): block is SceneBlock => block !== undefined);
}

function isHeading(block: SceneBlock): boolean {
  return block.kind === "prose" && block.intent?.kind === "introduce";
}

function isPrimaryRegion(block: SceneBlock): boolean {
  return !isHeading(block);
}

export function evaluateLectureContentBudget(scene: Scene): LectureContentBudgetDecision {
  const contentBlocks = orderedBlocks(scene).filter((block) => !isHeading(block));
  const score = contentBlocks.reduce(
    (total, block) => total + estimateRevealBlockFootprint(block).score,
    0,
  );
  const primaryRegions = contentBlocks.filter(isPrimaryRegion).length;
  const reasons: string[] = [];

  if (score > LECTURE_MAX_SCORE) {
    reasons.push(
      `content footprint ${score.toFixed(1)} exceeds lecture budget ${LECTURE_MAX_SCORE}`,
    );
  }
  if (primaryRegions > LECTURE_MAX_PRIMARY_REGIONS) {
    reasons.push(
      `${primaryRegions} primary regions exceed lecture budget ${LECTURE_MAX_PRIMARY_REGIONS}`,
    );
  }

  return {
    status: reasons.length ? "over-budget" : "within-budget",
    score,
    primaryRegions,
    reasons,
  };
}

export const lectureContentBudgetLimits = Object.freeze({
  maxScore: LECTURE_MAX_SCORE,
  maxPrimaryRegions: LECTURE_MAX_PRIMARY_REGIONS,
});
