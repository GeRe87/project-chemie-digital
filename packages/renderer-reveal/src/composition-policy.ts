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
  | "progression-strip"
  | "learning-stage"
  | "visual-stage"
  | "statement-card"
  | "media-stage"
  | "hero-stage"
  | "semantic-stage";

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
  | "cards-with-footer"
  | "cards-to-visual";

export type RevealLearningProfile =
  | "prompt-code"
  | "info-code"
  | "info-visual"
  | "formula-visual"
  | "single-prompt"
  | "prompt-grid";

export type RevealVisualStageProfile =
  | "diagram"
  | "concentric-network";

export type RevealSemanticStageProfile =
  | "source"
  | "multi-view";

export type RevealCompositionProfile =
  | RevealCompositionMainProfile
  | RevealEvidenceProfile
  | RevealProcessProfile
  | RevealWorkbenchProfile
  | RevealProgressionProfile
  | RevealLearningProfile
  | RevealVisualStageProfile
  | RevealSemanticStageProfile;

export interface RevealCompositionPlan {
  readonly kind: RevealCompositionKind;
  readonly placements: readonly RevealCompositionPlacement[];
  readonly mainCount: number;
  readonly profile?: RevealCompositionProfile;
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
function isTrigCode(block: SceneBlock | undefined): boolean {
  return block?.kind === "code" && block.language.toLowerCase() === "trig";
}

function isAttributionMediaGroup(block: SceneBlock): boolean {
  if (block.kind !== "group" || block.children.length !== 2) return false;
  const prose = block.children.filter(
    (child) => child.kind === "prose" && child.intent?.kind === "emphasize",
  );
  const media = block.children.filter((child) => child.kind === "media-reference");
  return prose.length === 1 && media.length === 1;
}

function isMediaStageGroup(block: SceneBlock): boolean {
  if (block.kind !== "group" || block.children.length !== 2) return false;
  const prose = block.children.filter((child) => child.kind === "prose");
  const media = block.children.filter((child) => child.kind === "media-reference");
  if (prose.length !== 1 || media.length !== 1) return false;
  const mediaType = media[0]?.kind === "media-reference" ? media[0].mediaType : undefined;
  return mediaType === undefined || mediaType.startsWith("image/") || mediaType.startsWith("video/");
}

function isConcentricNetwork(block: SceneBlock): boolean {
  if (
    block.kind !== "diagram"
    || block.diagramType !== "network"
    || !block.focusNodeId
    || block.edges.length !== 0
    || (block.groups?.length ?? 0) < 2
  ) return false;
  const groups = block.groups ?? [];
  const groupIds = new Set(groups.map((group) => group.id));
  const members = block.nodes.filter((node) => node.id !== block.focusNodeId);
  return members.length > 0
    && groups.every((group) => members.some((node) => node.groupIds?.includes(group.id)))
    && members.every((node) =>
      (node.groupIds ?? []).filter((groupId) => groupIds.has(groupId)).length === 1
    );
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


function placement(
  block: SceneBlock,
  region: RevealCompositionRegion,
  index = 0,
): RevealCompositionPlacement {
  return { blockId: block.id, region, index };
}

function placementsWithHeading(heading: SceneBlock | undefined): RevealCompositionPlacement[] {
  return heading ? [placement(heading, "heading")] : [];
}

function matchesComponentKinds(
  actual: readonly RevealComponentKind[],
  ...expected: RevealComponentKind[]
): boolean {
  return actual.length === expected.length
    && expected.every((kind, index) => actual[index] === kind);
}

function mainProfileFor(blocks: readonly SceneBlock[]): RevealCompositionMainProfile {
  const kinds = blocks.map((block) => revealComponentDescriptor(block).kind);
  if (matchesComponentKinds(kinds, "formula", "card-collection")) {
    return "formula-cards";
  }
  if (matchesComponentKinds(kinds, "formula", "visual")) {
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
      placements: placementsWithHeading(heading),
      mainCount: 0,
    };
  }

  const leading = body[0];
  const trailing = body.at(-1);
  const middle = body.slice(1, -1);
  const middlePrimary = middle.filter(isPrimaryContent);

  const bodyKinds = body.map((block) => revealComponentDescriptor(block).kind);

  // Matcher order is part of the renderer contract. Specific semantic/topology
  // signatures must win before broader component-kind signatures and generic
  // fallbacks. In particular, process-story precedes learning-stage info-visual:
  // explain + diagram + explain has the same component-kind shape as the broader
  // info + visual + optional note learning pattern.

  if (
    body.length === 2
    && isTrigCode(body[0])
    && body[1]?.kind === "chart"
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "main", 0));
    placements.push(placement(body[1], "secondary", 0));
    return {
      kind: "semantic-stage",
      placements,
      mainCount: 2,
      profile: "multi-view",
    };
  }

  if (
    body.length === 1
    && isTrigCode(body[0])
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "main", 0));
    return {
      kind: "semantic-stage",
      placements,
      mainCount: 1,
      profile: "source",
    };
  }

  if (
    body.length === 3
    && body.every((block) => isAttributionMediaGroup(block))
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "primary", 0));
    placements.push(placement(body[1]!, "secondary", 0));
    placements.push(placement(body[2]!, "support", 0));
    return {
      kind: "hero-stage",
      placements,
      mainCount: 3,
    };
  }

  if (
    body.length === 1
    && isMediaStageGroup(body[0]!)
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "main", 0));
    return {
      kind: "media-stage",
      placements,
      mainCount: 1,
    };
  }

  if (
    body.length === 2
    && body[0]?.kind === "prose"
    && body[0].intent?.kind === "explain"
    && body[1]?.kind === "prose"
    && body[1].intent?.kind === "emphasize"
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0], "main", 0));
    placements.push(placement(body[1], "footer", 0));
    return {
      kind: "statement-card",
      placements,
      mainCount: 1,
    };
  }

  if (
    body.length === 1
    && body[0]?.kind === "diagram"
  ) {
    const visual = body[0];
    const placements = placementsWithHeading(heading);
    placements.push(placement(visual, "main", 0));
    return {
      kind: "visual-stage",
      placements,
      mainCount: 1,
      profile: isConcentricNetwork(visual) ? "concentric-network" : "diagram",
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
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "prelude", 0));
    placements.push(placement(visual, "main", 0));
    placements.push(placement(body[2]!, "footer", 0));
    return {
      kind: "process-story",
      placements,
      mainCount: 1,
      profile: processProfile,
    };
  }

  if (
    matchesComponentKinds(bodyKinds, "prompt", "code")
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "primary", 0));
    placements.push(placement(body[1]!, "secondary", 0));
    return {
      kind: "learning-stage",
      placements,
      mainCount: 2,
      profile: "prompt-code",
    };
  }

  if (
    matchesComponentKinds(bodyKinds, "info-surface", "code")
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "prelude", 0));
    placements.push(placement(body[1]!, "main", 0));
    return {
      kind: "learning-stage",
      placements,
      mainCount: 1,
      profile: "info-code",
    };
  }

  if (
    matchesComponentKinds(bodyKinds, "info-surface", "visual")
    || matchesComponentKinds(bodyKinds, "info-surface", "visual", "info-surface")
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "primary", 0));
    placements.push(placement(body[1]!, "secondary", 0));
    if (body[2]) placements.push(placement(body[2], "footer", 0));
    return {
      kind: "learning-stage",
      placements,
      mainCount: 2,
      profile: "info-visual",
    };
  }

  if (
    matchesComponentKinds(bodyKinds, "formula", "visual")
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "prelude", 0));
    placements.push(placement(body[1]!, "main", 0));
    return {
      kind: "learning-stage",
      placements,
      mainCount: 1,
      profile: "formula-visual",
    };
  }

  if (matchesComponentKinds(bodyKinds, "prompt")) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "main", 0));
    return {
      kind: "learning-stage",
      placements,
      mainCount: 1,
      profile: "single-prompt",
    };
  }

  if (
    body.length >= 2
    && body.length <= 4
    && bodyKinds.every((kind) => kind === "prompt")
  ) {
    const placements = placementsWithHeading(heading);
    body.forEach((block, index) => placements.push(placement(block, "main", index)));
    return {
      kind: "learning-stage",
      placements,
      mainCount: body.length,
      profile: "prompt-grid",
    };
  }

  if (
    matchesComponentKinds(bodyKinds, "list-collection", "info-surface")
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "main", 0));
    placements.push(placement(body[1]!, "footer", 0));
    return {
      kind: "progression-strip",
      placements,
      mainCount: 1,
      profile: "cards-with-footer",
    };
  }

  if (
    matchesComponentKinds(bodyKinds, "info-surface", "list-collection", "info-surface")
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "prelude", 0));
    placements.push(placement(body[1]!, "main", 0));
    placements.push(placement(body[2]!, "footer", 0));
    return {
      kind: "progression-strip",
      placements,
      mainCount: 1,
      profile: "cards-only",
    };
  }

  if (
    matchesComponentKinds(bodyKinds, "info-surface", "list-collection", "visual", "info-surface")
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "prelude", 0));
    placements.push(placement(body[1]!, "main", 0));
    placements.push(placement(body[2]!, "secondary", 0));
    placements.push(placement(body[3]!, "footer", 0));
    return {
      kind: "progression-strip",
      placements,
      mainCount: 2,
      profile: "cards-to-visual",
    };
  }

  if (
    matchesComponentKinds(
      bodyKinds,
      "visual",
      "info-surface",
      "card-collection",
      "info-surface",
      "info-surface",
      "card-collection",
    )
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "lead", 0));
    placements.push(placement(body[1]!, "primary", 0));
    placements.push(placement(body[2]!, "primary", 1));
    placements.push(placement(body[3]!, "primary", 2));
    placements.push(placement(body[4]!, "secondary", 0));
    placements.push(placement(body[5]!, "secondary", 1));
    return {
      kind: "support-workbench",
      placements,
      mainCount: 3,
      profile: "visual-dual-reference",
    };
  }

  if (
    matchesComponentKinds(
      bodyKinds,
      "info-surface",
      "list-collection",
      "info-surface",
      "code",
      "info-surface",
    )
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "lead", 0));
    placements.push(placement(body[1]!, "primary", 0));
    placements.push(placement(body[2]!, "secondary", 0));
    placements.push(placement(body[3]!, "secondary", 1));
    placements.push(placement(body[4]!, "secondary", 2));
    return {
      kind: "support-workbench",
      placements,
      mainCount: 2,
      profile: "list-code-reference",
    };
  }

  if (
    matchesComponentKinds(bodyKinds, "visual", "data-surface", "visual")
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "primary", 0));
    placements.push(placement(body[1]!, "secondary", 0));
    placements.push(placement(body[2]!, "footer", 0));
    return {
      kind: "evidence-story",
      placements,
      mainCount: 3,
      profile: "visual-data-flow",
    };
  }

  if (
    matchesComponentKinds(bodyKinds, "group", "data-surface", "visual", "list-collection")
    || matchesComponentKinds(
      bodyKinds,
      "group",
      "data-surface",
      "visual",
      "list-collection",
      "info-surface",
    )
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "context", 0));
    placements.push(placement(body[1]!, "primary", 0));
    placements.push(placement(body[2]!, "secondary", 0));
    placements.push(placement(body[3]!, "support", 0));
    if (body[4]) placements.push(placement(body[4], "footer", 0));
    return {
      kind: "worked-evidence",
      placements,
      mainCount: 4,
      profile: "context-data-visual",
    };
  }
  const evidencePairIndex = bodyKinds.findIndex((kind, index) => {
    const next = bodyKinds[index + 1];
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
      const profile: RevealEvidenceProfile = firstKind === "data-surface" && secondKind === "visual"
        ? "data-visual"
        : "list-data";
      const placements = placementsWithHeading(heading);
      before.forEach((item, index) => placements.push(placement(item, "prelude", index)));
      placements.push(placement(first, "primary", 0));
      placements.push(placement(second, "secondary", 0));
      after.forEach((item, index) => placements.push(placement(item, "footer", index)));
      return {
        kind: "evidence-split",
        placements,
        mainCount: 2,
        profile,
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
    const placements = placementsWithHeading(heading);
    before.forEach((block, index) => placements.push(placement(block, "prelude", index)));
    placements.push(placement(cards, "main", 0));
    after.forEach((block, index) => placements.push(placement(block, "footer", index)));
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
    const placements = placementsWithHeading(heading);
    placements.push(placement(leading, "aside", 0));
    if (profile === "formula-visual") {
      placements.push(placement(middle[0]!, "lead", 0));
      placements.push(placement(middle[1]!, "main", 0));
    } else {
      middle.forEach((block, index) => placements.push(placement(block, "main", index)));
    }
    placements.push(placement(trailing, "footer", 0));
    return {
      kind: "main-aside-note",
      placements,
      mainCount: middle.length,
      profile,
    };
  }

  const placements = placementsWithHeading(heading);
  body.forEach((block, index) => placements.push(placement(block, "main", index)));
  return {
    kind: body.length === 1 ? "single" : "stack",
    placements,
    mainCount: body.length,
  };
}
