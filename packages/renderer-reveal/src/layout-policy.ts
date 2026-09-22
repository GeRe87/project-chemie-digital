import type { Scene, SceneBlock } from "../../core/src/scene-document.ts";

export type RevealLayoutFamily = "concept-specification";

function orderedBlocks(scene: Scene): readonly SceneBlock[] | undefined {
  const byId = new Map(scene.blocks.map((block) => [block.id, block]));
  const ordered = scene.readingOrder.map((id) => byId.get(id));
  return ordered.every((block): block is SceneBlock => block !== undefined) ? ordered : undefined;
}

/**
 * Renderer-owned structural inference.
 *
 * The decision deliberately ignores scene ids, path ids, resource ids and authored
 * labels. Only validated renderer-neutral block structure participates.
 */
export function inferRevealLayoutFamily(scene: Scene): RevealLayoutFamily | undefined {
  const blocks = orderedBlocks(scene);
  if (!blocks || blocks.length !== 3) return undefined;

  const [heading, body, takeaway] = blocks;
  if (
    heading?.kind === "prose"
    && heading.intent?.kind === "introduce"
    && body?.kind === "list"
    && body.listStyle === "unordered"
    && body.items.length === 3
    && takeaway?.kind === "prose"
    && takeaway.intent?.kind === "explain"
  ) {
    return "concept-specification";
  }

  return undefined;
}
