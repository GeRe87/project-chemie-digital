import type { DiagramBlock, Scene, SceneBlock } from "../../core/src/scene-document.ts";

export type RevealLayoutFamily =
  | "concept-specification"
  | "hierarchy-flow"
  | "reference-code"
  | "process-context"
  | "data-explanation"
  | "analysis-result";

export interface RevealLayoutDecision {
  readonly family: RevealLayoutFamily;
  readonly slots: readonly string[];
}

function orderedBlocks(scene: Scene): readonly SceneBlock[] | undefined {
  const byId = new Map(scene.blocks.map((block) => [block.id, block]));
  const ordered = scene.readingOrder.map((id) => byId.get(id));
  return ordered.every((block): block is SceneBlock => block !== undefined) ? ordered : undefined;
}

function isLinearThreeNodeFlow(block: SceneBlock): block is DiagramBlock {
  if (block.kind !== "diagram" || block.diagramType !== "flow") return false;
  if (block.nodes.length !== 3 || block.edges.length !== 2) return false;
  const [first, second, third] = block.nodes;
  if (!first || !second || !third) return false;
  return block.edges.some((edge) => edge.sourceNodeId === first.id && edge.targetNodeId === second.id)
    && block.edges.some((edge) => edge.sourceNodeId === second.id && edge.targetNodeId === third.id);
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

  if (blocks.length === 7) {
    const [heading, diagram, exampleHeading, exampleDefinitions, exampleNote, contextHeading, contextDefinitions] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && diagram?.kind === "diagram"
      && diagram.diagramType === "flow"
      && diagram.nodes.length === 3
      && diagram.edges.length === 2
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
