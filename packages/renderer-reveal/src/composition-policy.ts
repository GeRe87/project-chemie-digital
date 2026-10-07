import type { Scene, SceneBlock } from "../../core/src/scene-document.ts";

export type RevealComponentKind =
  | "heading"
  | "info-surface"
  | "formula"
  | "card-collection"
  | "list-collection"
  | "data-surface"
  | "visual"
  | "prompt"
  | "code"
  | "media"
  | "group"
  | "text";

export interface RevealComponentDescriptor {
  readonly blockId: string;
  readonly kind: RevealComponentKind;
  readonly itemCount?: number;
}

export type RevealCompositionKind =
  | "single"
  | "stack"
  | "main-aside-note";

export type RevealCompositionRegion =
  | "heading"
  | "aside"
  | "main"
  | "footer";

export interface RevealCompositionPlacement {
  readonly blockId: string;
  readonly region: RevealCompositionRegion;
  readonly index: number;
}

export interface RevealCompositionPlan {
  readonly kind: RevealCompositionKind;
  readonly placements: readonly RevealCompositionPlacement[];
  readonly mainCount: number;
}

function orderedBlocks(scene: Scene): readonly SceneBlock[] {
  const byId = new Map(scene.blocks.map((block) => [block.id, block]));
  return scene.readingOrder
    .map((id) => byId.get(id))
    .filter((block): block is SceneBlock => block !== undefined);
}

function isHeading(block: SceneBlock | undefined): boolean {
  return block?.kind === "prose" && block.intent?.kind === "introduce";
}

function isContextProse(block: SceneBlock | undefined): boolean {
  return block?.kind === "prose" && block.intent?.kind === "explain";
}

function isPrimaryContent(block: SceneBlock): boolean {
  return block.kind !== "prose";
}

export function revealComponentDescriptor(block: SceneBlock): RevealComponentDescriptor {
  switch (block.kind) {
    case "prose":
      return {
        blockId: block.id,
        kind: block.intent?.kind === "introduce"
          ? "heading"
          : block.intent?.kind === "explain"
            ? "info-surface"
            : "text",
      };
    case "math":
      return { blockId: block.id, kind: "formula" };
    case "definition-list":
      return { blockId: block.id, kind: "card-collection", itemCount: block.entries.length };
    case "list":
      return { blockId: block.id, kind: "list-collection", itemCount: block.items.length };
    case "table":
      return { blockId: block.id, kind: "data-surface" };
    case "chart":
    case "diagram":
      return { blockId: block.id, kind: "visual" };
    case "prompt":
      return { blockId: block.id, kind: "prompt", itemCount: block.options?.length };
    case "code":
      return { blockId: block.id, kind: "code" };
    case "media-reference":
      return { blockId: block.id, kind: "media" };
    case "group":
      return { blockId: block.id, kind: "group", itemCount: block.children.length };
    default: {
      const unreachable: never = block;
      return unreachable;
    }
  }
}

/**
 * Generic composition inference.
 *
 * The policy deliberately ignores scene ids, resource ids, authored labels and
 * course identity. It only considers validated block order, block kind and
 * didactic intent.
 */
export function inferRevealCompositionPlan(scene: Scene): RevealCompositionPlan {
  const blocks = orderedBlocks(scene);
  if (blocks.length === 0) return { kind: "stack", placements: [], mainCount: 0 };

  const heading = isHeading(blocks[0]) ? blocks[0] : undefined;
  const body = heading ? blocks.slice(1) : blocks;

  if (body.length === 0) {
    return {
      kind: "single",
      placements: heading ? [{ blockId: heading.id, region: "heading", index: 0 }] : [],
      mainCount: 0,
    };
  }

  const leading = body[0];
  const trailing = body.at(-1);
  const middle = body.slice(1, -1);
  const middlePrimary = middle.filter(isPrimaryContent);

  if (
    body.length >= 4
    && isContextProse(leading)
    && isContextProse(trailing)
    && middle.length >= 2
    && middlePrimary.length === middle.length
  ) {
    const placements: RevealCompositionPlacement[] = [];
    if (heading) placements.push({ blockId: heading.id, region: "heading", index: 0 });
    placements.push({ blockId: leading.id, region: "aside", index: 0 });
    middle.forEach((block, index) => placements.push({ blockId: block.id, region: "main", index }));
    placements.push({ blockId: trailing.id, region: "footer", index: 0 });
    return {
      kind: "main-aside-note",
      placements,
      mainCount: middle.length,
    };
  }

  const placements: RevealCompositionPlacement[] = [];
  if (heading) placements.push({ blockId: heading.id, region: "heading", index: 0 });
  body.forEach((block, index) => placements.push({ blockId: block.id, region: "main", index }));
  return {
    kind: body.length === 1 ? "single" : "stack",
    placements,
    mainCount: body.length,
  };
}
