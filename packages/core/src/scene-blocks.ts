import type { SceneBlock } from "./scene-document.ts";

/** Visit every block in storage order, including nested semantic groups.
 * Reading-order projections remain the responsibility of the renderer.
 */
export function* walkSceneBlocks(blocks: readonly SceneBlock[]): IterableIterator<SceneBlock> {
  for (const block of blocks) {
    yield block;
    if (block.kind === "group") yield* walkSceneBlocks(block.children);
  }
}
