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
  | "main-aside-note"
  | "card-deck"
  | "evidence-split"
  | "evidence-story"
  | "worked-evidence"
  | "process-story"
  | "support-workbench"
  | "progression-strip";

export type RevealCompositionRegion =
  | "heading"
  | "lead"
  | "prelude"
  | "aside"
  | "context"
  | "primary"
  | "secondary"
  | "support"
  | "main"
  | "footer";

export interface RevealCompositionPlacement {
  readonly blockId: string;
  readonly region: RevealCompositionRegion;
  readonly index: number;
}

export type RevealCompositionMainProfile =
  | "formula-cards"
  | "formula-visual"
  | "mixed";

export type RevealEvidenceProfile =
  | "data-visual"
  | "list-data"
  | "visual-data-flow"
  | "context-data-visual";

export type RevealProcessProfile =
  | "compact-linear"
  | "wide-process";

export type RevealWorkbenchProfile =
  | "visual-dual-reference"
  | "list-code-reference";

export type RevealProgressionProfile =
  | "cards-only"
  | "cards-to-visual";

export interface RevealCompositionPlan {
  readonly kind: RevealCompositionKind;
  readonly placements: readonly RevealCompositionPlacement[];
  readonly mainCount: number;
  readonly mainProfile?: RevealCompositionMainProfile;
  readonly evidenceProfile?: RevealEvidenceProfile;
  readonly processProfile?: RevealProcessProfile;
  readonly workbenchProfile?: RevealWorkbenchProfile;
  readonly progressionProfile?: RevealProgressionProfile;
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
function isStrictLinearFlow(block: SceneBlock): boolean {
  if (block.kind !== "diagram" || block.diagramType !== "flow") return false;
  if (block.nodes.length < 2 || block.edges.length !== block.nodes.length - 1) return false;
  const ids = new Set(block.nodes.map((node) => node.id));
  const inDegree = new Map(block.nodes.map((node) => [node.id, 0]));
  const outDegree = new Map(block.nodes.map((node) => [node.id, 0]));
  for (const edge of block.edges) {
    if (!ids.has(edge.sourceNodeId) || !ids.has(edge.targetNodeId)) return false;
    outDegree.set(edge.sourceNodeId, (outDegree.get(edge.sourceNodeId) ?? 0) + 1);
    inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) ?? 0) + 1);
  }
  const starts = block.nodes.filter((node) => (inDegree.get(node.id) ?? 0) === 0);
  const ends = block.nodes.filter((node) => (outDegree.get(node.id) ?? 0) === 0);
  return starts.length === 1
    && ends.length === 1
    && block.nodes.every((node) =>
      (inDegree.get(node.id) ?? 0) <= 1 && (outDegree.get(node.id) ?? 0) <= 1
    );
}


function mainProfileFor(blocks: readonly SceneBlock[]): RevealCompositionMainProfile {
  const kinds = blocks.map((block) => revealComponentDescriptor(block).kind);
  if (kinds.length === 2 && kinds[0] === "formula" && kinds[1] === "card-collection") {
    return "formula-cards";
  }
  if (kinds.length === 2 && kinds[0] === "formula" && kinds[1] === "visual") {
    return "formula-visual";
  }
  return "mixed";
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






  const bodyKinds = body.map((block) => revealComponentDescriptor(block).kind);


  if (
    body.length === 3
    && bodyKinds[0] === "info-surface"
    && bodyKinds[1] === "list-collection"
    && bodyKinds[2] === "info-surface"
  ) {
    const placements: RevealCompositionPlacement[] = [];
    if (heading) placements.push({ blockId: heading.id, region: "heading", index: 0 });
    placements.push({ blockId: body[0]!.id, region: "prelude", index: 0 });
    placements.push({ blockId: body[1]!.id, region: "main", index: 0 });
    placements.push({ blockId: body[2]!.id, region: "footer", index: 0 });
    return {
      kind: "progression-strip",
      placements,
      mainCount: 1,
      progressionProfile: "cards-only",
    };
  }

  if (
    body.length === 4
    && bodyKinds[0] === "info-surface"
    && bodyKinds[1] === "list-collection"
    && bodyKinds[2] === "visual"
    && bodyKinds[3] === "info-surface"
  ) {
    const placements: RevealCompositionPlacement[] = [];
    if (heading) placements.push({ blockId: heading.id, region: "heading", index: 0 });
    placements.push({ blockId: body[0]!.id, region: "prelude", index: 0 });
    placements.push({ blockId: body[1]!.id, region: "main", index: 0 });
    placements.push({ blockId: body[2]!.id, region: "secondary", index: 0 });
    placements.push({ blockId: body[3]!.id, region: "footer", index: 0 });
    return {
      kind: "progression-strip",
      placements,
      mainCount: 2,
      progressionProfile: "cards-to-visual",
    };
  }

  if (
    body.length === 6
    && bodyKinds[0] === "visual"
    && bodyKinds[1] === "info-surface"
    && bodyKinds[2] === "card-collection"
    && bodyKinds[3] === "info-surface"
    && bodyKinds[4] === "info-surface"
    && bodyKinds[5] === "card-collection"
  ) {
    const placements: RevealCompositionPlacement[] = [];
    if (heading) placements.push({ blockId: heading.id, region: "heading", index: 0 });
    placements.push({ blockId: body[0]!.id, region: "lead", index: 0 });
    placements.push({ blockId: body[1]!.id, region: "primary", index: 0 });
    placements.push({ blockId: body[2]!.id, region: "primary", index: 1 });
    placements.push({ blockId: body[3]!.id, region: "primary", index: 2 });
    placements.push({ blockId: body[4]!.id, region: "secondary", index: 0 });
    placements.push({ blockId: body[5]!.id, region: "secondary", index: 1 });
    return {
      kind: "support-workbench",
      placements,
      mainCount: 3,
      workbenchProfile: "visual-dual-reference",
    };
  }

  if (
    body.length === 5
    && bodyKinds[0] === "info-surface"
    && bodyKinds[1] === "list-collection"
    && bodyKinds[2] === "info-surface"
    && bodyKinds[3] === "code"
    && bodyKinds[4] === "info-surface"
  ) {
    const placements: RevealCompositionPlacement[] = [];
    if (heading) placements.push({ blockId: heading.id, region: "heading", index: 0 });
    placements.push({ blockId: body[0]!.id, region: "lead", index: 0 });
    placements.push({ blockId: body[1]!.id, region: "primary", index: 0 });
    placements.push({ blockId: body[2]!.id, region: "secondary", index: 0 });
    placements.push({ blockId: body[3]!.id, region: "secondary", index: 1 });
    placements.push({ blockId: body[4]!.id, region: "secondary", index: 2 });
    return {
      kind: "support-workbench",
      placements,
      mainCount: 2,
      workbenchProfile: "list-code-reference",
    };
  }

  if (
    body.length === 3
    && isContextProse(body[0])
    && body[1]?.kind === "diagram"
    && (body[1].diagramType === "flow" || body[1].diagramType === "sequence")
    && isContextProse(body[2])
  ) {
    const visual = body[1];
    const processProfile: RevealProcessProfile =
      isStrictLinearFlow(visual) && visual.nodes.length <= 3
        ? "compact-linear"
        : "wide-process";
    const placements: RevealCompositionPlacement[] = [];
    if (heading) placements.push({ blockId: heading.id, region: "heading", index: 0 });
    placements.push({ blockId: body[0]!.id, region: "prelude", index: 0 });
    placements.push({ blockId: visual.id, region: "main", index: 0 });
    placements.push({ blockId: body[2]!.id, region: "footer", index: 0 });
    return {
      kind: "process-story",
      placements,
      mainCount: 1,
      processProfile,
    };
  }

  const bodyComponentKinds = body.map((block) => revealComponentDescriptor(block).kind);

  if (
    body.length === 3
    && bodyComponentKinds[0] === "visual"
    && bodyComponentKinds[1] === "data-surface"
    && bodyComponentKinds[2] === "visual"
  ) {
    const placements: RevealCompositionPlacement[] = [];
    if (heading) placements.push({ blockId: heading.id, region: "heading", index: 0 });
    placements.push({ blockId: body[0]!.id, region: "primary", index: 0 });
    placements.push({ blockId: body[1]!.id, region: "secondary", index: 0 });
    placements.push({ blockId: body[2]!.id, region: "footer", index: 0 });
    return {
      kind: "evidence-story",
      placements,
      mainCount: 3,
      evidenceProfile: "visual-data-flow",
    };
  }

  if (
    (body.length === 4 || body.length === 5)
    && bodyComponentKinds[0] === "group"
    && bodyComponentKinds[1] === "data-surface"
    && bodyComponentKinds[2] === "visual"
    && bodyComponentKinds[3] === "list-collection"
    && (body.length === 4 || bodyComponentKinds[4] === "info-surface")
  ) {
    const placements: RevealCompositionPlacement[] = [];
    if (heading) placements.push({ blockId: heading.id, region: "heading", index: 0 });
    placements.push({ blockId: body[0]!.id, region: "context", index: 0 });
    placements.push({ blockId: body[1]!.id, region: "primary", index: 0 });
    placements.push({ blockId: body[2]!.id, region: "secondary", index: 0 });
    placements.push({ blockId: body[3]!.id, region: "support", index: 0 });
    if (body[4]) placements.push({ blockId: body[4].id, region: "footer", index: 0 });
    return {
      kind: "worked-evidence",
      placements,
      mainCount: 4,
      evidenceProfile: "context-data-visual",
    };
  }

  const componentKinds = body.map((block) => revealComponentDescriptor(block).kind);
  const evidencePairIndex = componentKinds.findIndex((kind, index) => {
    const next = componentKinds[index + 1];
    return (kind === "data-surface" && next === "visual")
      || (kind === "list-collection" && next === "data-surface");
  });
  if (evidencePairIndex >= 0) {
    const first = body[evidencePairIndex]!;
    const second = body[evidencePairIndex + 1]!;
    const before = body.slice(0, evidencePairIndex);
    const after = body.slice(evidencePairIndex + 2);
    const supportKinds = [...before, ...after].map((item) => revealComponentDescriptor(item).kind);
    const validSupport = supportKinds.every((kind) => kind === "info-surface" || kind === "list-collection");
    if (validSupport) {
      const firstKind = revealComponentDescriptor(first).kind;
      const secondKind = revealComponentDescriptor(second).kind;
      const evidenceProfile: RevealEvidenceProfile = firstKind === "data-surface" && secondKind === "visual"
        ? "data-visual"
        : "list-data";
      const placements: RevealCompositionPlacement[] = [];
      if (heading) placements.push({ blockId: heading.id, region: "heading", index: 0 });
      before.forEach((item, index) => placements.push({ blockId: item.id, region: "prelude", index }));
      placements.push({ blockId: first.id, region: "primary", index: 0 });
      placements.push({ blockId: second.id, region: "secondary", index: 0 });
      after.forEach((item, index) => placements.push({ blockId: item.id, region: "footer", index }));
      return {
        kind: "evidence-split",
        placements,
        mainCount: 2,
        evidenceProfile,
      };
    }
  }

  const definitionLists = body.filter((block) => block.kind === "definition-list");
  if (
    definitionLists.length === 1
    && definitionLists[0]!.entries.length >= 2
    && body.every((block) => block.kind === "definition-list" || isContextProse(block))
  ) {
    const cards = definitionLists[0]!;
    const cardsIndex = body.indexOf(cards);
    const before = body.slice(0, cardsIndex);
    const after = body.slice(cardsIndex + 1);
    const placements: RevealCompositionPlacement[] = [];
    if (heading) placements.push({ blockId: heading.id, region: "heading", index: 0 });
    before.forEach((block, index) => placements.push({ blockId: block.id, region: "prelude", index }));
    placements.push({ blockId: cards.id, region: "main", index: 0 });
    after.forEach((block, index) => placements.push({ blockId: block.id, region: "footer", index }));
    return {
      kind: "card-deck",
      placements,
      mainCount: 1,
    };
  }

  if (
    body.length >= 4
    && isContextProse(leading)
    && isContextProse(trailing)
    && middle.length >= 2
    && middlePrimary.length === middle.length
  ) {
    const profile = mainProfileFor(middle);
    const placements: RevealCompositionPlacement[] = [];
    if (heading) placements.push({ blockId: heading.id, region: "heading", index: 0 });
    placements.push({ blockId: leading.id, region: "aside", index: 0 });
    if (profile === "formula-visual") {
      placements.push({ blockId: middle[0]!.id, region: "lead", index: 0 });
      placements.push({ blockId: middle[1]!.id, region: "main", index: 0 });
    } else {
      middle.forEach((block, index) => placements.push({ blockId: block.id, region: "main", index }));
    }
    placements.push({ blockId: trailing.id, region: "footer", index: 0 });
    return {
      kind: "main-aside-note",
      placements,
      mainCount: middle.length,
      mainProfile: profile,
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
