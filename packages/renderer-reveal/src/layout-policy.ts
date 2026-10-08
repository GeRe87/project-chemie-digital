import type { DiagramBlock, Scene, SceneBlock } from "../../core/src/scene-document.ts";

export type RevealLayoutFamily =
  | "concept-specification"
  | "labeled-card-grid"
  | "prompt-card-grid"
  | "paired-info-cards"
  | "definition-card"
  | "code-lab"
  | "concept-chart"
  | "math-diagram"
  | "large-poll"
  | "measurement-example"
  | "functional-dependence"
  | "observation-bridge"
  | "minimal-code-demo"
  | "experiment-example"
  | "quiz-grid"
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
  | "closing"
  | "hero-title-panel"
  | "semantic-source"
  | "semantic-multi-view"
  | "diagram-stage"
  | "case-study";

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

function isAttributionMediaGroup(block: SceneBlock): boolean {
  if (block.kind !== "group" || block.children.length !== 2) return false;
  const prose = block.children.filter(
    (child) => child.kind === "prose" && child.intent?.kind === "emphasize",
  );
  const media = block.children.filter((child) => child.kind === "media-reference");
  return prose.length === 1 && media.length === 1;
}

function isProseImageGroup(block: SceneBlock): boolean {
  if (block.kind !== "group" || block.children.length !== 2) return false;
  const prose = block.children.filter((child) => child.kind === "prose");
  const media = block.children.filter(
    (child) => child.kind === "media-reference"
      && (child.mediaType === undefined || child.mediaType.startsWith("image/")),
  );
  return prose.length === 1 && media.length === 1;
}

function isTrigCode(block: SceneBlock | undefined): boolean {
  return block?.kind === "code" && block.language.toLowerCase() === "trig";
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
export function inferRevealLayoutFamily(scene: Scene): RevealLayoutFamily | undefined {
  const blocks = orderedBlocks(scene);
  if (!blocks) return undefined;

  if (blocks.length === 1) {
    const [heading] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
    ) {
      return "closing";
    }
  }

  if (blocks.length === 3) {
    const [heading, definition, citation] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && definition?.kind === "prose"
      && definition.intent?.kind === "explain"
      && citation?.kind === "prose"
      && citation.intent?.kind === "emphasize"
    ) {
      return "definition-card";
    }
  }

  if (blocks.length === 4) {
    const [heading, primaryAttribution, secondaryAttribution, supportingAttribution] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && primaryAttribution !== undefined
      && secondaryAttribution !== undefined
      && supportingAttribution !== undefined
      && isAttributionMediaGroup(primaryAttribution)
      && isAttributionMediaGroup(secondaryAttribution)
      && isAttributionMediaGroup(supportingAttribution)
    ) {
      return "hero-title-panel";
    }
  }

  if (blocks.length === 3) {
    const [heading, source, chart] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && isTrigCode(source)
      && chart?.kind === "chart"
    ) {
      return "semantic-multi-view";
    }
  }

  if (blocks.length === 2) {
    const [heading, source] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && isTrigCode(source)
    ) {
      return "semantic-source";
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
      return "full-media";
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
      return "concentric-network";
    }
  }

  if (blocks.length === 2) {
    const [heading, cards] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && cards?.kind === "definition-list"
      && cards.entries.length === 3
    ) {
      return "prompt-card-grid";
    }
  }

  if (blocks.length === 4) {
    const [heading, intro, table, chart] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && intro?.kind === "prose"
      && intro.intent?.kind === "explain"
      && table?.kind === "table"
      && chart?.kind === "chart"
    ) {
      return "measurement-example";
    }
  }

  if (blocks.length === 5) {
    const [heading, intro, formula, examples, caveat] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && intro?.kind === "prose"
      && intro.intent?.kind === "explain"
      && formula?.kind === "math"
      && examples?.kind === "definition-list"
      && examples.entries.length === 3
      && caveat?.kind === "prose"
      && caveat.intent?.kind === "explain"
    ) {
      return "functional-dependence";
    }
  }

  if (blocks.length === 5) {
    const [heading, intro, values, diagram, takeaway] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && intro?.kind === "prose"
      && intro.intent?.kind === "explain"
      && values?.kind === "math"
      && diagram?.kind === "diagram"
      && takeaway?.kind === "prose"
      && takeaway.intent?.kind === "explain"
    ) {
      return "observation-bridge";
    }
  }

  if (blocks.length === 3) {
    const [heading, intro, code] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && intro?.kind === "prose"
      && intro.intent?.kind === "explain"
      && code?.kind === "code"
    ) {
      return "minimal-code-demo";
    }
  }

  if (blocks.length === 5) {
    const [heading, intro, table, chart, roles] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && intro?.kind === "prose"
      && intro.intent?.kind === "explain"
      && table?.kind === "table"
      && chart?.kind === "chart"
      && roles?.kind === "list"
      && roles.items.length === 3
    ) {
      return "experiment-example";
    }
  }

  if (blocks.length === 4) {
    const [heading, ...questions] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && questions.length === 3
      && questions.every((block) => block?.kind === "prompt" && block.responseMode === "single-choice")
    ) {
      return "quiz-grid";
    }
  }

  if (blocks.length === 3) {
    const [heading, prompt, code] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && prompt?.kind === "prompt"
      && code?.kind === "code"
    ) {
      return "code-lab";
    }
  }

  if (blocks.length === 3 || blocks.length === 4) {
    const [heading, definition, chart, example] = blocks;
    const validExample = example === undefined
      || (example.kind === "prose" && example.intent?.kind === "explain");
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && definition?.kind === "prose"
      && definition.intent?.kind === "explain"
      && chart?.kind === "chart"
      && validExample
    ) {
      return "concept-chart";
    }
  }

  if (blocks.length === 3) {
    const [heading, formula, diagram] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && formula?.kind === "math"
      && diagram?.kind === "diagram"
    ) {
      return "math-diagram";
    }
  }

  if (blocks.length === 2) {
    const [heading, prompt] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && prompt?.kind === "prompt"
      && prompt.responseMode === "single-choice"
    ) {
      return "large-poll";
    }
  }

  if (blocks.length === 2) {
    const [heading, diagram] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && diagram?.kind === "diagram"
    ) {
      return "diagram-stage";
    }
  }

  if (blocks.length === 3) {
    const [heading, body, takeaway] = blocks;
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && body?.kind === "definition-list"
      && body.entries.length === 3
      && takeaway?.kind === "prose"
      && takeaway.intent?.kind === "explain"
    ) {
      return "labeled-card-grid";
    }

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

    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && body?.kind === "list"
      && body.listStyle === "unordered"
      && body.items.length === 4
      && takeaway?.kind === "table"
    ) {
      return "data-explanation";
    }
  }

  if (blocks.length === 3 || blocks.length === 4) {
    const [heading, intro, cards, takeaway] = blocks;
    const hasValidTakeaway = takeaway === undefined
      || (takeaway.kind === "prose" && takeaway.intent?.kind === "explain");
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && intro?.kind === "prose"
      && intro.intent?.kind === "explain"
      && cards?.kind === "definition-list"
      && cards.entries.length === 2
      && hasValidTakeaway
    ) {
      return "paired-info-cards";
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
      return "card-sequence";
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
      return "foundation-card-grid";
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
      return "text-network-progression";
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
      return "analysis-result";
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
      return "hierarchy-flow";
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
      return "process-diagram";
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
      return "process-context";
    }
  }

  if (blocks.length === 5 || blocks.length === 6) {
    const [heading, problem, data, analysis, discussion, takeaway] = blocks;
    const hasValidTakeaway = takeaway === undefined
      || (takeaway.kind === "prose" && takeaway.intent?.kind === "explain");
    if (
      heading?.kind === "prose"
      && heading.intent?.kind === "introduce"
      && problem !== undefined
      && isProseImageGroup(problem)
      && data?.kind === "table"
      && analysis?.kind === "chart"
      && discussion?.kind === "list"
      && discussion.listStyle === "unordered"
      && discussion.items.length >= 2
      && discussion.items.length <= 3
      && hasValidTakeaway
    ) {
      return "case-study";
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
      return "reference-code";
    }
  }

  return undefined;
}

