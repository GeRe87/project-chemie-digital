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
  | "stack"
  | "main-aside-note"
  | "evidence-stage"
  | "progression-stage"
  | "learning-stage"
  | "visual-stage"
  | "media-stage"
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

export type RevealProgressionProfile =
  | "compact-linear"
  | "wide-process"
  | "cards-only"
  | "cards-with-footer"
  | "cards-to-visual";

export type RevealLearningProfile =
  | "prompt-code"
  | "info-code"
  | "info-visual"
  | "formula-visual"
  | "single-prompt"
  | "prompt-grid"
  | "visual-dual-reference"
  | "list-code-reference"
  | "definition-deck"
  | "formula-legend"
  | "statement-support"
  | "visual-media"
  | "evidence-practice-grid"
  | "scenario-data-visual"
  | "process-matrix"
  | "compact-list"
  | "formula-deck";

export type RevealVisualStageProfile =
  | "diagram"
  | "concentric-network";

export type RevealMediaProfile =
  | "full-viewport"
  | "hero-attributions";

export type RevealSemanticStageProfile =
  | "source"
  | "multi-view";

export type RevealCompositionProfile =
  | RevealCompositionMainProfile
  | RevealEvidenceProfile
  | RevealProgressionProfile
  | RevealLearningProfile
  | RevealVisualStageProfile
  | RevealMediaProfile
  | RevealSemanticStageProfile;

export interface RevealCompositionPlan {
  readonly kind: RevealCompositionKind;
  readonly placements: readonly RevealCompositionPlacement[];
  readonly mainCount: number;
  readonly profile?: RevealCompositionProfile;
}


/**
 * Projection topology owned by the composition policy.
 *
 * Pitch should not need its own composition-kind allowlist to decide whether
 * placements share a region wrapper. This decision is part of the generic
 * composition contract and remains independent of scene/resource identity.
 */
export function shouldWrapRevealCompositionPlacement(
  composition: RevealCompositionPlan,
  placement: RevealCompositionPlacement,
): boolean {
  if (placement.region === "heading") return false;
  if (composition.kind === "stack" || composition.kind === "semantic-stage") return false;
  if (composition.kind === "media-stage" && composition.profile === "hero-attributions") return false;
  if (
    composition.kind === "evidence-stage"
    && composition.profile === "context-data-visual"
    && placement.region === "support"
  ) return false;
  return true;
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

/** An explicitly grouped task and its illustrations remain one prompt surface. */
function isIllustratedPrompt(block: SceneBlock): boolean {
  if (block.kind !== "group" || block.children.length < 2) return false;
  const byId = new Map(block.children.map(child => [child.id, child]));
  const ordered = block.readingOrder.map(id => byId.get(id));
  return ordered[0]?.kind === "prompt"
    && ordered.slice(1).every(child => child?.kind === "media-reference");
}

function isFullViewportMediaGroup(block: SceneBlock): boolean {
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


function allComponentKinds(
  blocks: readonly SceneBlock[],
  allowed: readonly RevealComponentKind[],
): boolean {
  const allowedKinds = new Set(allowed);
  return blocks.every((block) => allowedKinds.has(revealComponentDescriptor(block).kind));
}

function inferVisualDualReference(
  body: readonly SceneBlock[],
  heading: SceneBlock | undefined,
): RevealCompositionPlan | undefined {
  if (revealComponentDescriptor(body[0]!).kind !== "visual") return undefined;

  const cardIndexes = body
    .map((block, index) => revealComponentDescriptor(block).kind === "card-collection" ? index : -1)
    .filter((index) => index >= 0);
  if (cardIndexes.length !== 2) return undefined;

  const [firstCardIndex, secondCardIndex] = cardIndexes;
  if (
    firstCardIndex === undefined
    || secondCardIndex === undefined
    || firstCardIndex <= 1
    || secondCardIndex <= firstCardIndex + 1
    || secondCardIndex !== body.length - 1
  ) return undefined;

  const primaryPrelude = body.slice(1, firstCardIndex);
  const bridge = body.slice(firstCardIndex + 1, secondCardIndex);
  if (
    !allComponentKinds(primaryPrelude, ["info-surface"])
    || !allComponentKinds(bridge, ["info-surface"])
  ) return undefined;

  const placements = placementsWithHeading(heading);
  placements.push(placement(body[0]!, "lead", 0));
  primaryPrelude.forEach((block, index) => placements.push(placement(block, "primary", index)));
  placements.push(placement(body[firstCardIndex]!, "primary", primaryPrelude.length));

  const secondaryHeading = bridge.at(-1)!;
  bridge.slice(0, -1).forEach((block, index) =>
    placements.push(placement(block, "primary", primaryPrelude.length + 1 + index))
  );
  placements.push(placement(secondaryHeading, "secondary", 0));
  placements.push(placement(body[secondCardIndex]!, "secondary", 1));

  return {
    kind: "learning-stage",
    placements,
    mainCount: 3,
    profile: "visual-dual-reference",
  };
}

function inferListCodeReference(
  body: readonly SceneBlock[],
  heading: SceneBlock | undefined,
): RevealCompositionPlan | undefined {
  const kinds = body.map((block) => revealComponentDescriptor(block).kind);
  const listIndexes = kinds
    .map((kind, index) => kind === "list-collection" ? index : -1)
    .filter((index) => index >= 0);
  const codeIndexes = kinds
    .map((kind, index) => kind === "code" ? index : -1)
    .filter((index) => index >= 0);
  if (listIndexes.length !== 1 || codeIndexes.length !== 1) return undefined;

  const listIndex = listIndexes[0]!;
  const codeIndex = codeIndexes[0]!;
  if (listIndex < 1 || codeIndex <= listIndex) return undefined;

  const remaining = body.filter((_block, index) => index !== listIndex && index !== codeIndex);
  if (!allComponentKinds(remaining, ["info-surface"])) return undefined;

  const placements = placementsWithHeading(heading);
  body.slice(0, listIndex).forEach((block, index) => placements.push(placement(block, "lead", index)));
  placements.push(placement(body[listIndex]!, "primary", 0));

  let secondaryIndex = 0;
  for (let index = listIndex + 1; index < body.length; index += 1) {
    placements.push(placement(body[index]!, "secondary", secondaryIndex));
    secondaryIndex += 1;
  }

  return {
    kind: "learning-stage",
    placements,
    mainCount: 2,
    profile: "list-code-reference",
  };
}


function inferCardsToVisual(
  body: readonly SceneBlock[],
  heading: SceneBlock | undefined,
): RevealCompositionPlan | undefined {
  const kinds = body.map((block) => revealComponentDescriptor(block).kind);
  const listIndexes = kinds
    .map((kind, index) => kind === "list-collection" ? index : -1)
    .filter((index) => index >= 0);
  const visualIndexes = kinds
    .map((kind, index) => kind === "visual" ? index : -1)
    .filter((index) => index >= 0);
  if (listIndexes.length !== 1 || visualIndexes.length !== 1) return undefined;

  const listIndex = listIndexes[0]!;
  const visualIndex = visualIndexes[0]!;
  if (visualIndex !== listIndex + 1) return undefined;

  const before = body.slice(0, listIndex);
  const after = body.slice(visualIndex + 1);
  if (
    !allComponentKinds(before, ["info-surface"])
    || !allComponentKinds(after, ["info-surface"])
  ) return undefined;

  const placements = placementsWithHeading(heading);
  before.forEach((block, index) => placements.push(placement(block, "prelude", index)));
  placements.push(placement(body[listIndex]!, "main", 0));
  placements.push(placement(body[visualIndex]!, "secondary", 0));
  after.forEach((block, index) => placements.push(placement(block, "footer", index)));

  return {
    kind: "progression-stage",
    placements,
    mainCount: 2,
    profile: "cards-to-visual",
  };
}

function inferContextDataVisual(
  body: readonly SceneBlock[],
  heading: SceneBlock | undefined,
): RevealCompositionPlan | undefined {
  if (body.length < 4) return undefined;
  const kinds = body.map((block) => revealComponentDescriptor(block).kind);
  if (
    kinds[0] !== "group"
    || kinds[1] !== "data-surface"
    || kinds[2] !== "visual"
    || kinds[3] !== "list-collection"
  ) return undefined;

  const footer = body.slice(4);
  if (!allComponentKinds(footer, ["info-surface"])) return undefined;

  const placements = placementsWithHeading(heading);
  placements.push(placement(body[0]!, "context", 0));
  placements.push(placement(body[1]!, "primary", 0));
  placements.push(placement(body[2]!, "secondary", 0));
  placements.push(placement(body[3]!, "support", 0));
  footer.forEach((block, index) => placements.push(placement(block, "footer", index)));

  return {
    kind: "evidence-stage",
    placements,
    mainCount: 4,
    profile: "context-data-visual",
  };
}


function indexesOfKind(
  body: readonly SceneBlock[],
  kind: RevealComponentKind,
): readonly number[] {
  return body
    .map((block, index) => revealComponentDescriptor(block).kind === kind ? index : -1)
    .filter((index) => index >= 0);
}

function inferPromptCode(
  body: readonly SceneBlock[],
  heading: SceneBlock | undefined,
): RevealCompositionPlan | undefined {
  const promptIndexes = indexesOfKind(body, "prompt");
  const codeIndexes = indexesOfKind(body, "code");
  if (promptIndexes.length !== 1 || codeIndexes.length !== 1) return undefined;

  const promptIndex = promptIndexes[0]!;
  const codeIndex = codeIndexes[0]!;
  const codeLegend = isAuthoredCodeFunctionLegend(body[codeIndex], body[codeIndex + 1]) ? body[codeIndex + 1] : undefined;
  const illustration = codeIndex === promptIndex + 2 && body[promptIndex + 1]?.kind === "media-reference"
    ? body[promptIndex + 1]
    : undefined;
  if (codeIndex !== promptIndex + 1 && !illustration) return undefined;

  const before = body.slice(0, promptIndex);
  const after = body.slice(codeIndex + 1 + (codeLegend ? 1 : 0));
  if (
    !allComponentKinds(before, ["info-surface"])
    || !allComponentKinds(after, ["info-surface"])
  ) return undefined;

  const placements = placementsWithHeading(heading);
  before.forEach((block, index) => placements.push(placement(block, "prelude", index)));
  placements.push(placement(body[promptIndex]!, "primary", 0));
  if (illustration) placements.push(placement(illustration, "primary", 1));
  placements.push(placement(body[codeIndex]!, "secondary", 0));
  if (codeLegend) placements.push(placement(codeLegend, "secondary", 1));
  after.forEach((block, index) => placements.push(placement(block, "footer", index)));

  return {
    kind: "learning-stage",
    placements,
    mainCount: 2,
    profile: "prompt-code",
  };
}

function inferInfoCode(
  body: readonly SceneBlock[],
  heading: SceneBlock | undefined,
): RevealCompositionPlan | undefined {
  const codeIndexes = indexesOfKind(body, "code");
  if (codeIndexes.length !== 1) return undefined;

  const codeIndex = codeIndexes[0]!;
  const before = body.slice(0, codeIndex);
  const after = body.slice(codeIndex + 1);
  if (
    before.length === 0
    || !allComponentKinds(before, ["info-surface"])
    || !allComponentKinds(after, ["info-surface"])
  ) return undefined;

  const placements = placementsWithHeading(heading);
  before.forEach((block, index) => placements.push(placement(block, "prelude", index)));
  placements.push(placement(body[codeIndex]!, "main", 0));
  after.forEach((block, index) => placements.push(placement(block, "footer", index)));

  return {
    kind: "learning-stage",
    placements,
    mainCount: 1,
    profile: "info-code",
  };
}

function inferInfoVisual(
  body: readonly SceneBlock[],
  heading: SceneBlock | undefined,
): RevealCompositionPlan | undefined {
  const visualIndexes = indexesOfKind(body, "visual");
  if (visualIndexes.length !== 1) return undefined;

  const visualIndex = visualIndexes[0]!;
  const before = body.slice(0, visualIndex);
  const after = body.slice(visualIndex + 1);
  if (
    before.length === 0
    || !allComponentKinds(before, ["info-surface"])
    || !allComponentKinds(after, ["info-surface"])
  ) return undefined;

  const placements = placementsWithHeading(heading);
  before.forEach((block, index) => placements.push(placement(block, "primary", index)));
  placements.push(placement(body[visualIndex]!, "secondary", 0));
  after.forEach((block, index) => placements.push(placement(block, "footer", index)));

  return {
    kind: "learning-stage",
    placements,
    mainCount: 2,
    profile: "info-visual",
  };
}

function inferFormulaVisual(
  body: readonly SceneBlock[],
  heading: SceneBlock | undefined,
): RevealCompositionPlan | undefined {
  if (
    body.length < 2
    || revealComponentDescriptor(body[0]!).kind !== "formula"
    || revealComponentDescriptor(body[1]!).kind !== "visual"
  ) return undefined;

  const after = body.slice(2);
  if (!allComponentKinds(after, ["info-surface"])) return undefined;

  const placements = placementsWithHeading(heading);
  placements.push(placement(body[0]!, "prelude", 0));
  placements.push(placement(body[1]!, "main", 0));
  after.forEach((block, index) => placements.push(placement(block, "footer", index)));

  return {
    kind: "learning-stage",
    placements,
    mainCount: 1,
    profile: "formula-visual",
  };
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
      if (isIllustratedPrompt(block)) return { blockId: block.id, kind: "prompt" };
      return { blockId: block.id, kind: "group", itemCount: block.children.length };
    default: {
      const unreachable: never = block;
      return unreachable;
    }
  }
}

/** Adjacent singleton card collections and formulas share the existing infocard primitive. */
export function resolveDefinitionFormulaPairs(scene: Scene): readonly {
  readonly card: Extract<SceneBlock, { kind: "definition-list" }>;
  readonly formula: Extract<SceneBlock, { kind: "math" }>;
}[] | undefined {
  const blocks = orderedBlocks(scene);
  if (blocks.length === 0) return undefined;
  const body = isHeading(blocks[0]) ? blocks.slice(1) : blocks;
  const paired = body.length % 2 === 1 && isContextProse(body[0]) ? body.slice(1) : body;
  if (paired.length < 4 || paired.length > 8) return undefined;
  const pairs = [];
  for (let index = 0; index < paired.length; index += 2) {
    const card = paired[index];
    const formula = paired[index + 1];
    if (card?.kind !== "definition-list" || card.entries.length !== 1 || formula?.kind !== "math") return undefined;
    pairs.push({ card, formula });
  }
  return pairs;
}

/** Supporting definition parts immediately follow their owning formula. */
export function resolveFormulaLegendUnits(scene: Scene): readonly (readonly SceneBlock[])[] {
  const blocks = orderedBlocks(scene);
  const units: SceneBlock[][] = [];
  for (let i = 0; i < blocks.length - 1; i++) {
    const formula = blocks[i]!;
    const legend = blocks[i + 1]!;
    if (formula.kind !== "math" || legend.kind !== "definition-list" || legend.emphasis !== "supporting") continue;
    const context = blocks[i - 1];
    // A preceding formula's supporting legend is not a new context card.
    // Otherwise adjacent formula/legend pairs overlap and one formula vanishes.
    units.push(context?.kind === "definition-list" && context.entries.length === 1 && context.emphasis !== "supporting"
      ? [context, formula, legend] : [formula, legend]);
    i++;
  }
  return units;
}

function isAuthoredCodeFunctionLegend(code: SceneBlock | undefined, legend: SceneBlock | undefined):
  legend is Extract<SceneBlock, { kind: "definition-list" }> {
  return code?.kind === "code"
    && legend?.kind === "definition-list"
    && legend.emphasis === "supporting"
    && legend.source.some(source => source.relationPath === "dct:hasPart"
      && source.resourceId === code.source[0]?.resourceId);
}

export function resolveCodeFunctionLegendUnits(scene: Scene): readonly {
  readonly code: Extract<SceneBlock, { kind: "code" }>;
  readonly legend: Extract<SceneBlock, { kind: "definition-list" }>;
}[] {
  const blocks = orderedBlocks(scene);
  const units: Array<{ code: Extract<SceneBlock, { kind: "code" }>; legend: Extract<SceneBlock, { kind: "definition-list" }> }> = [];
  for (let index = 0; index < blocks.length - 1; index++) {
    const code = blocks[index];
    const legend = blocks[index + 1];
    if (isAuthoredCodeFunctionLegend(code, legend)) {
      units.push({ code: code as Extract<SceneBlock, { kind: "code" }>, legend });
      index++;
    }
  }
  return units;
}

function inferEvidencePracticeGrid(body: readonly SceneBlock[], heading: SceneBlock | undefined): RevealCompositionPlan | undefined {
  if (body.length !== 5 || body[0]?.kind !== "list" || body[1]?.kind !== "table"
      || body[2]?.kind !== "prompt" || body[3]?.kind !== "code"
      || !isAuthoredCodeFunctionLegend(body[3], body[4])) return undefined;
  const placements = placementsWithHeading(heading);
  body.forEach((block, index) => placements.push(placement(block, "main", index)));
  return { kind: "learning-stage", placements, mainCount: 4, profile: "evidence-practice-grid" };
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
  if (body.length === 4 && body[0]?.kind === "definition-list" && body[1]?.kind === "table" && body[2]?.kind === "list" && body[3]?.kind === "chart") {
    return { kind: "learning-stage", profile: "scenario-data-visual", mainCount: 2,
      placements: [...placementsWithHeading(heading), ...body.slice(0,3).map((b,i)=>placement(b,"primary",i)), placement(body[3],"secondary",0)] };
  }
  if (body.length === 3 && body[0]?.kind === "definition-list" && body[1]?.kind === "table" && body[2]?.kind === "list") {
    return { kind: "learning-stage", profile: "scenario-data-visual", mainCount: 2,
      placements: [...placementsWithHeading(heading), placement(body[0],"primary",0), placement(body[1],"secondary",0), placement(body[2],"footer",0)] };
  }
  if (body.length === 4 && body[0]?.kind === "list" && body[1]?.kind === "table"
      && (body[2]?.kind === "chart" || body[2]?.kind === "media-reference") && body[3]?.kind === "list") {
    const contextAbove = body[2].kind === "chart";
    return { kind: "learning-stage", profile: "scenario-data-visual", mainCount: 2,
      placements: [...placementsWithHeading(heading), placement(body[0], contextAbove ? "prelude" : "primary", 0),
        placement(body[1], "primary", 1), placement(body[2], "secondary", 0), placement(body[3], "footer", 0)] };
  }
  if (body.length === 3 && body[0]?.kind === "diagram" && body[1]?.kind === "table" && body[2]?.kind === "list") {
    return { kind: "learning-stage", profile: "process-matrix", mainCount: 1,
      placements: [...placementsWithHeading(heading), placement(body[0], "prelude", 0), placement(body[1], "main", 0), placement(body[2], "footer", 0)] };
  }
  if (body.length === 3 && body[0]?.kind === "list" && body[1]?.kind === "chart" && body[2]?.kind === "list") {
    return { kind: "visual-stage", profile: "diagram", mainCount: 1,
      placements: [...placementsWithHeading(heading), placement(body[0], "prelude", 0), placement(body[1], "main", 0), placement(body[2], "footer", 0)] };
  }
  if (body.some(block => block.kind === "math" && block.derivation)) {
    const placements = placementsWithHeading(heading);
    body.forEach((block, index) => placements.push(placement(block,
      block.kind === "math" && block.derivation ? "main" : "footer", index)));
    return { kind: "learning-stage", profile: "formula-deck", mainCount: 1, placements };
  }

  // One statistical visual owns the stage; concise conclusions do not compete
  // with its plot area. This signature is independent of chart/subject identity.
  if (body.length === 2 && body.some(block => block.kind === "chart") && body.some(block => block.kind === "list")) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body.find(block => block.kind === "chart")!, "main", 0));
    placements.push(placement(body.find(block => block.kind === "list")!, "footer", 0));
    return { kind: "visual-stage", profile: "diagram", mainCount: 1, placements };
  }
  if (body.length === 2 && body[0]?.kind === "definition-list" && body[1]?.kind === "list") {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0], "main", 0), placement(body[1], "footer", 0));
    return { kind: "learning-stage", profile: "definition-deck", mainCount: 1, placements };
  }
  if (body.length === 2 && body[0]?.kind === "list" && body[1]?.kind === "media-reference") {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0], "primary", 0), placement(body[1], "secondary", 0));
    return { kind: "learning-stage", profile: "info-visual", mainCount: 2, placements };
  }

  const formulaUnits = resolveFormulaLegendUnits(scene);
  if (formulaUnits.length && !(body.some(block => block.kind === "table") && body.some(block => block.kind === "chart"))) {
    const unitIds = new Set(formulaUnits.flatMap(unit => unit.map(block => block.id)));
    const firstFormula = body.findIndex(block => unitIds.has(block.id));
    const placements = placementsWithHeading(heading);
    body.forEach((block, index) => placements.push(placement(block,
      unitIds.has(block.id) ? "main" : index < firstFormula ? "prelude" : "footer", index)));
    return { kind: "learning-stage", profile: "formula-deck", mainCount: formulaUnits.length, placements };
  }

  const definitionFormulaPairs = resolveDefinitionFormulaPairs(scene);
  if (definitionFormulaPairs) {
    const placements = placementsWithHeading(heading);
    if (isContextProse(body[0])) placements.push(placement(body[0]!, "prelude", 0));
    definitionFormulaPairs.forEach(({ card, formula }, index) => {
      placements.push(placement(card, "main", index * 2));
      placements.push(placement(formula, "main", index * 2 + 1));
    });
    return { kind: "learning-stage", profile: "definition-deck", mainCount: 1, placements };
  }

  if (body.length === 0) {
    return {
      kind: "stack",
      placements: placementsWithHeading(heading),
      mainCount: 0,
    };
  }

  const leading = body[0];
  const trailing = body.at(-1);
  const middle = body.slice(1, -1);
  const middlePrimary = middle.filter(isPrimaryContent);

  const bodyKinds = body.map((block) => revealComponentDescriptor(block).kind);

  if (matchesComponentKinds(bodyKinds, "visual", "media")) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "primary", 0));
    placements.push(placement(body[1]!, "secondary", 0));
    return { kind: "learning-stage", profile: "visual-media", mainCount: 2, placements };
  }

  // Matcher order is part of the renderer contract. Specific semantic/topology
  // signatures must win before broader component-kind signatures and generic
  // fallbacks. In particular, the process progression signature precedes learning-stage info-visual:
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

  // A compact list, with optional context/qualification or a follow-up prompt,
  // is one teaching surface rather than a horizontal progression of cards.
  const explanatoryList = (block: SceneBlock | undefined): boolean => block?.kind === "list"
    && block.intent?.kind === "explain"
    && block.source.some(source => source.relationPath === "cd:hasKeyPoint");
  if ((body.length === 1 && explanatoryList(body[0]))
      || (body.length === 2 && explanatoryList(body[0]) && (body[1]?.kind === "prose" || body[1]?.kind === "prompt"))
      || (body.length === 3 && body[0]?.kind === "prose" && explanatoryList(body[1]) && body[2]?.kind === "prompt")) {
    const placements = placementsWithHeading(heading);
    body.forEach((block, index) => placements.push(placement(block, "main", index)));
    return { kind: "learning-stage", profile: "compact-list", placements, mainCount: 1 };
  }

  const evidencePracticeGrid = inferEvidencePracticeGrid(body, heading);
  if (evidencePracticeGrid) return evidencePracticeGrid;

  if (
    body.length === 3
    && body.every((block) => isAttributionMediaGroup(block))
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "primary", 0));
    placements.push(placement(body[1]!, "secondary", 0));
    placements.push(placement(body[2]!, "support", 0));
    return {
      kind: "media-stage",
      placements,
      mainCount: 3,
      profile: "hero-attributions",
    };
  }

  if (
    body.length === 1
    && isFullViewportMediaGroup(body[0]!)
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "main", 0));
    return {
      kind: "media-stage",
      placements,
      mainCount: 1,
      profile: "full-viewport",
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
      kind: "learning-stage",
      placements,
      mainCount: 1,
      profile: "statement-support",
    };
  }

  // An authored diagram followed by one emphasized takeaway remains a
  // reusable visual stage; diagrams own the structure, not slide CSS.
  if (
    body.length === 2
    && body[0]?.kind === "diagram"
    && body[1]?.kind === "prose"
    && (body[1].intent?.kind === "emphasize" || body[1].intent?.kind === "explain")
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0], "main", 0));
    placements.push(placement(body[1], "footer", 0));
    return { kind: "visual-stage", placements, mainCount: 1, profile: "diagram" };
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
    const processProfile: RevealProgressionProfile =
      isStrictLinearFlow(visual) && visual.nodes.length <= 3
        ? "compact-linear"
        : "wide-process";
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "prelude", 0));
    placements.push(placement(visual, "main", 0));
    placements.push(placement(body[2]!, "footer", 0));
    return {
      kind: "progression-stage",
      placements,
      mainCount: 1,
      profile: processProfile,
    };
  }

  const promptCode = inferPromptCode(body, heading);
  if (promptCode) return promptCode;

  const infoCode = inferInfoCode(body, heading);
  if (infoCode) return infoCode;

  const infoVisual = inferInfoVisual(body, heading);
  if (infoVisual) return infoVisual;

  const formulaVisual = inferFormulaVisual(body, heading);
  if (formulaVisual) return formulaVisual;

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
    && body.length <= 6
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
      kind: "progression-stage",
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
      kind: "progression-stage",
      placements,
      mainCount: 1,
      profile: "cards-only",
    };
  }

  const cardsToVisual = inferCardsToVisual(body, heading);
  if (cardsToVisual) return cardsToVisual;

  const visualDualReference = inferVisualDualReference(body, heading);
  if (visualDualReference) return visualDualReference;

  const listCodeReference = inferListCodeReference(body, heading);
  if (listCodeReference) return listCodeReference;

  if (
    matchesComponentKinds(bodyKinds, "visual", "data-surface", "visual")
  ) {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0]!, "primary", 0));
    placements.push(placement(body[1]!, "secondary", 0));
    placements.push(placement(body[2]!, "footer", 0));
    return {
      kind: "evidence-stage",
      placements,
      mainCount: 3,
      profile: "visual-data-flow",
    };
  }

  const contextDataVisual = inferContextDataVisual(body, heading);
  if (contextDataVisual) return contextDataVisual;
  const dataVisualIndex = bodyKinds.findIndex((kind, index) => kind === "data-surface" && bodyKinds[index + 1] === "visual");
  const evidencePairIndex = dataVisualIndex >= 0 ? dataVisualIndex : bodyKinds.findIndex((kind, index) => {
    const next = bodyKinds[index + 1];
    return (kind === "data-surface" && next === "visual")
      || (kind === "list-collection" && next === "data-surface");
  });
  if (evidencePairIndex >= 0) {
    const first = body[evidencePairIndex]!;
    const second = body[evidencePairIndex + 1]!;
    const before = body.slice(0, evidencePairIndex);
    const after = body.slice(evidencePairIndex + 2);
    const validSupportSequence = (items: readonly SceneBlock[]): boolean => items.every((item, index) => {
      const kind = revealComponentDescriptor(item).kind;
      if (kind === "info-surface" || kind === "list-collection" || kind === "card-collection" || kind === "media") return true;
      const formula = item.kind === "math" ? item : items[index - 1];
      const legend = item.kind === "math" ? items[index + 1] : item;
      return formula?.kind === "math" && legend?.kind === "definition-list"
        && legend.emphasis === "supporting"
        && legend.source.some(source => source.relationPath === "dct:hasPart"
          && formula.source.some(owner => owner.resourceId === source.resourceId));
    });
    const validSupport = validSupportSequence(before) && validSupportSequence(after);
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
        kind: "evidence-stage",
        placements,
        mainCount: 2,
        profile,
      };
    }
  }

  // Generic formula with independently authored symbol legend, applicable to
  // any subject. Layout is inferred from ordered block kinds, not resource ids.
  if (body.length === 2 && body[0]?.kind === "math" && body[1]?.kind === "definition-list") {
    const placements = placementsWithHeading(heading);
    placements.push(placement(body[0], "prelude", 0));
    placements.push(placement(body[1], "main", 0));
    return {
      kind: "learning-stage",
      placements,
      mainCount: 1,
      profile: "formula-legend",
    };
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
      kind: "learning-stage",
      placements,
      mainCount: 1,
      profile: "definition-deck",
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
    kind: "stack",
    placements,
    mainCount: body.length,
  };
}
