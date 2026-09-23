import type { DiagramBlock, Scene, SceneBlock } from "../../core/src/scene-document.ts";

export type RevealLayoutFamily =
  | "concept-specification"
  | "hierarchy-flow"
  | "reference-code"
  | "process-context"
  | "data-explanation"
  | "analysis-result"
  | "card-sequence"
  | "text-network-progression"
  | "concentric-network"
  | "process-diagram"
  | "foundation-card-grid"
  | "full-media"
  | "closing";

export interface RevealLayoutDecision {
  readonly family: RevealLayoutFamily;
  readonly slots: readonly string[];
}

function orderedBlocks(scene: Scene): readonly SceneBlock[] | undefined {
  const byId = new Map(scene.blocks.map((block) => [block.id, block]));
  const ordered = scene.readingOrder.map((id) => byId.get(id));
  return ordered.every((block): block is SceneBlock => block !== undefined) ? ordered : undefined;
}

function isLinearFlow(block: SceneBlock, minimumNodes = 2): block is DiagramBlock {
  if (block.kind !== "diagram" || block.diagramType !== "flow") return false;
  if (block.nodes.length < minimumNodes || block.edges.length !== block.nodes.length - 1) return false;
  return block.nodes.slice(0, -1).every((node, index) => {
    const next = block.nodes[index + 1];
    return next !== undefined
      && block.edges.some((edge) => edge.sourceNodeId === node.id && edge.targetNodeId === next.id);
  });
}

function isLinearThreeNodeFlow(block: SceneBlock): block is DiagramBlock {
  return isLinearFlow(block, 3) && block.nodes.length === 3;
}

function isFullMediaGroup(block: SceneBlock): boolean {
  if (block.kind !== "group" || block.children.length !== 2) return false;
  const media = block.children.filter((child) => child.kind === "media-reference");
  const prose = block.children.filter((child) => child.kind === "prose");
  if (media.length !== 1 || prose.length !== 1) return false;
  const mediaType = media[0]?.kind === "media-reference" ? media[0].mediaType : undefined;
  return mediaType === undefined || mediaType.startsWith("image/") || mediaType.startsWith("video/");
}

function isConcentricNetwork(block: SceneBlock): block is DiagramBlock {
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
    && members.every((node) => (node.groupIds ?? []).filter((groupId) => groupIds.has(groupId)).length === 1);
}

/**
 * Renderer-owned structural inference.
 *
 * The decision deliberately ignores scene ids, path ids, resource ids and authored
 * labels. Only validated renderer-neutral block structure participates.
 */
export function inferRevealLayoutDecision(scene: Scene): RevealLayoutDecision | undefined {
  const blocks = orderedBlocks(scene);
  if (!blocks) return undefined;

  if (blocks.length === 1) {
    const [heading] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
    ) {
      return {
        family: "closing",
        slots: ["heading"],
      };
    }
  }

  if (blocks.length === 2) {
    const [heading, mediaGroup] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && mediaGroup !== undefined
      && isFullMediaGroup(mediaGroup)
    ) {
      return {
        family: "full-media",
        slots: ["heading", "media"],
      };
    }
  }

  if (blocks.length === 2) {
    const [heading, network] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && network !== undefined
      && isConcentricNetwork(network)
    ) {
      return {
        family: "concentric-network",
        slots: ["heading", "network"],
      };
    }
  }

  if (blocks.length === 3) {
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
      return {
        family: "concept-specification",
        slots: ["heading", "cards", "takeaway"],
      };
    }

    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && body?.kind === "list"
      && body.listStyle === "unordered"
      && body.items.length === 4
      && takeaway?.kind === "table"
    ) {
      return {
        family: "data-explanation",
        slots: ["heading", "principles", "table"],
      };
    }
  }

  if (blocks.length === 4) {
    const [heading, banner, cards, takeaway] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && banner?.kind === "prose"
      && banner.intent?.kind === "explain"
      && cards?.kind === "list"
      && cards.listStyle === "unordered"
      && cards.items.length === 3
      && takeaway?.kind === "prose"
      && takeaway.intent?.kind === "explain"
    ) {
      return {
        family: "card-sequence",
        slots: ["heading", "banner", "cards", "takeaway"],
      };
    }
  }

  if (blocks.length === 5) {
    const [heading, banner, foundation, cards, takeaway] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && banner?.kind === "prose"
      && banner.intent?.kind === "explain"
      && foundation?.kind === "prose"
      && foundation.intent?.kind === "explain"
      && cards?.kind === "definition-list"
      && cards.entries.length >= 4
      && cards.entries.length <= 6
      && takeaway?.kind === "prose"
      && takeaway.intent?.kind === "explain"
    ) {
      return {
        family: "foundation-card-grid",
        slots: ["heading", "banner", "foundation", "cards", "takeaway"],
      };
    }
  }

  if (blocks.length === 5) {
    const [heading, banner, views, network, takeaway] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && banner?.kind === "prose"
      && banner.intent?.kind === "explain"
      && views?.kind === "list"
      && views.listStyle === "unordered"
      && views.items.length === 2
      && network?.kind === "diagram"
      && network.diagramType === "network"
      && network.nodes.length >= 2
      && takeaway?.kind === "prose"
      && takeaway.intent?.kind === "explain"
    ) {
      return {
        family: "text-network-progression",
        slots: ["heading", "banner", "views", "network", "takeaway"],
      };
    }
  }

  if (blocks.length === 4) {
    const [heading, signal, results, process] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && signal?.kind === "chart"
      && results?.kind === "table"
      && process?.kind === "diagram"
      && process.diagramType === "flow"
    ) {
      return {
        family: "analysis-result",
        slots: ["heading", "signal", "results", "process"],
      };
    }
  }

  if (blocks.length === 4) {
    const [heading, intro, diagram, takeaway] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && intro?.kind === "prose"
      && intro.intent?.kind === "explain"
      && diagram !== undefined
      && isLinearThreeNodeFlow(diagram)
      && takeaway?.kind === "prose"
      && takeaway.intent?.kind === "explain"
    ) {
      return {
        family: "hierarchy-flow",
        slots: ["heading", "intro", "diagram", "takeaway"],
      };
    }
  }

  if (blocks.length === 4) {
    const [heading, intro, diagram, takeaway] = blocks;
    const processDiagram = diagram?.kind === "diagram"
      && (
        diagram.diagramType === "sequence"
        || (diagram.diagramType === "flow" && isLinearFlow(diagram, 4))
      );
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && intro?.kind === "prose"
      && intro.intent?.kind === "explain"
      && processDiagram
      && takeaway?.kind === "prose"
      && takeaway.intent?.kind === "explain"
    ) {
      return {
        family: "process-diagram",
        slots: ["heading", "intro", "diagram", "takeaway"],
      };
    }
  }

  if (blocks.length === 7) {
    const [heading, diagram, exampleHeading, exampleDefinitions, exampleNote, contextHeading, contextDefinitions] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && diagram !== undefined
      && isLinearFlow(diagram, 3)
      && exampleHeading?.kind === "prose"
      && exampleHeading.intent?.kind === "explain"
      && exampleDefinitions?.kind === "definition-list"
      && exampleDefinitions.entries.length >= 4
      && exampleNote?.kind === "prose"
      && exampleNote.intent?.kind === "explain"
      && contextHeading?.kind === "prose"
      && contextHeading.intent?.kind === "explain"
      && contextDefinitions?.kind === "definition-list"
      && contextDefinitions.entries.length >= 4
    ) {
      return {
        family: "process-context",
        slots: ["heading", "diagram", "example-heading", "example-definitions", "example-note", "context-heading", "context-definitions"],
      };
    }
  }

  if (blocks.length === 6) {
    const [heading, banner, terms, codeLabel, code, reading] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && banner?.kind === "prose"
      && banner.intent?.kind === "explain"
      && terms?.kind === "list"
      && terms.listStyle === "unordered"
      && terms.items.length >= 4
      && codeLabel?.kind === "prose"
      && codeLabel.intent?.kind === "explain"
      && code?.kind === "code"
      && reading?.kind === "prose"
      && reading.intent?.kind === "explain"
    ) {
      return {
        family: "reference-code",
        slots: ["heading", "banner", "terms", "code-label", "code", "reading"],
      };
    }
  }

  return undefined;
}

export function inferRevealLayoutFamily(scene: Scene): RevealLayoutFamily | undefined {
  return inferRevealLayoutDecision(scene)?.family;
}
