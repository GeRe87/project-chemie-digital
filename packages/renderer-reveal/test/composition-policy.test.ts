import assert from "node:assert/strict";
import test from "node:test";

import type { Scene, SceneBlock } from "../../core/src/scene-document.ts";
import {
  inferRevealCompositionPlan,
  revealComponentDescriptor,
} from "../src/composition-policy.ts";

function prose(id: string, intent: "introduce" | "explain" | "emphasize" = "explain"): SceneBlock {
  return {
    id,
    kind: "prose",
    text: id,
    intent: { kind: intent },
    source: [{ resourceId: `resource:${id}` }],
  };
}

function math(id: string): SceneBlock {
  return {
    id,
    kind: "math",
    expression: "y=f(x)",
    spokenText: "y equals f of x",
    source: [{ resourceId: `resource:${id}` }],
  };
}

function definitions(id: string): SceneBlock {
  return {
    id,
    kind: "definition-list",
    entries: [
      {
        id: `${id}:entry:1`,
        term: "A",
        description: "alpha",
        source: [{ resourceId: `resource:${id}:1` }],
      },
      {
        id: `${id}:entry:2`,
        term: "B",
        description: "beta",
        source: [{ resourceId: `resource:${id}:2` }],
      },
      {
        id: `${id}:entry:3`,
        term: "C",
        description: "gamma",
        source: [{ resourceId: `resource:${id}:3` }],
      },
    ],
    source: [{ resourceId: `resource:${id}` }],
  };
}


function dataTable(id: string): SceneBlock {
  return {
    id,
    kind: "table",
    caption: "Generic data",
    columns: [
      { id: `${id}:c1`, label: "A", source: [{ resourceId: `resource:${id}:c1` }] },
      { id: `${id}:c2`, label: "B", source: [{ resourceId: `resource:${id}:c2` }] },
    ],
    rows: [{
      id: `${id}:r1`,
      cells: [
        { id: `${id}:r1c1`, text: "1", source: [{ resourceId: `resource:${id}:r1c1` }] },
        { id: `${id}:r1c2`, text: "2", source: [{ resourceId: `resource:${id}:r1c2` }] },
      ],
      source: [{ resourceId: `resource:${id}:r1` }],
    }],
    source: [{ resourceId: `resource:${id}` }],
  };
}

function barChart(id: string): SceneBlock {
  return {
    id,
    kind: "chart",
    chartType: "bar",
    label: "Generic chart",
    description: "Generic evidence",
    xAxis: { label: "Category" },
    yAxis: { label: "Value" },
    data: [{
      id: `${id}:d1`,
      category: "A",
      value: 1,
      source: [{ resourceId: `resource:${id}:d1` }],
    }],
    source: [{ resourceId: `resource:${id}` }],
  };
}

function unorderedList(id: string, count = 3): SceneBlock {
  return {
    id,
    kind: "list",
    listStyle: "unordered",
    items: Array.from({ length: count }, (_, index) => ({
      id: `${id}:item:${index}`,
      text: `Point ${index + 1}`,
      source: [{ resourceId: `resource:${id}:item:${index}` }],
    })),
    source: [{ resourceId: `resource:${id}` }],
  };
}

test("component descriptors depend on semantic block kind and intent", () => {
  assert.equal(revealComponentDescriptor(prose("h", "introduce")).kind, "heading");
  assert.equal(revealComponentDescriptor(prose("i", "explain")).kind, "info-surface");
  assert.equal(revealComponentDescriptor(math("m")).kind, "formula");
  assert.deepEqual(revealComponentDescriptor(definitions("d")), {
    blockId: "d",
    kind: "card-collection",
    itemCount: 3,
  });
});

test("main-aside-note composition is inferred from generic ordered structure", () => {
  const scene: Scene = {
    id: "opaque:any-scene",
    source: [{ resourceId: "resource:any-scene" }],
    blocks: [
      prose("heading", "introduce"),
      prose("context", "explain"),
      math("formula"),
      definitions("examples"),
      prose("note", "explain"),
    ],
    readingOrder: ["heading", "context", "formula", "examples", "note"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "main-aside-note",
    mainCount: 2,
    mainProfile: "formula-cards",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "context", region: "aside", index: 0 },
      { blockId: "formula", region: "main", index: 0 },
      { blockId: "examples", region: "main", index: 1 },
      { blockId: "note", region: "footer", index: 0 },
    ],
  });
});

test("composition inference is independent of scene and resource identities", () => {
  const make = (prefix: string): Scene => ({
    id: `${prefix}:scene`,
    source: [{ resourceId: `${prefix}:scene-source` }],
    blocks: [
      prose(`${prefix}:heading`, "introduce"),
      prose(`${prefix}:context`, "explain"),
      math(`${prefix}:formula`),
      definitions(`${prefix}:examples`),
      prose(`${prefix}:note`, "explain"),
    ],
    readingOrder: [
      `${prefix}:heading`,
      `${prefix}:context`,
      `${prefix}:formula`,
      `${prefix}:examples`,
      `${prefix}:note`,
    ],
  });

  const a = inferRevealCompositionPlan(make("alpha"));
  const b = inferRevealCompositionPlan(make("totally-different"));
  assert.equal(a.kind, b.kind);
  assert.equal(a.mainCount, b.mainCount);
  assert.deepEqual(a.placements.map((item) => [item.region, item.index]), b.placements.map((item) => [item.region, item.index]));
});

test("ordinary content remains a generic stack when no richer composition applies", () => {
  const scene: Scene = {
    id: "stack",
    source: [{ resourceId: "resource:stack" }],
    blocks: [prose("heading", "introduce"), prose("body", "explain")],
    readingOrder: ["heading", "body"],
  };
  assert.equal(inferRevealCompositionPlan(scene).kind, "single");
});


test("main profile distinguishes formula plus visual from formula plus cards", () => {
  const visual: SceneBlock = {
    id: "visual",
    kind: "diagram",
    diagramType: "flow",
    label: "Generic flow",
    description: "Generic visual",
    nodes: [
      { id: "a", label: "A", source: [{ resourceId: "resource:a" }] },
      { id: "b", label: "B", source: [{ resourceId: "resource:b" }] },
    ],
    edges: [
      { id: "ab", sourceNodeId: "a", targetNodeId: "b", label: "to", source: [{ resourceId: "resource:ab" }] },
    ],
    source: [{ resourceId: "resource:visual" }],
  };
  const scene: Scene = {
    id: "opaque:visual-composition",
    source: [{ resourceId: "resource:scene" }],
    blocks: [
      prose("heading", "introduce"),
      prose("context", "explain"),
      math("formula"),
      visual,
      prose("note", "explain"),
    ],
    readingOrder: ["heading", "context", "formula", "visual", "note"],
  };
  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.mainProfile, "formula-visual");
  assert.deepEqual(
    plan.placements.map((placement) => [placement.blockId, placement.region]),
    [
      ["heading", "heading"],
      ["context", "aside"],
      ["formula", "lead"],
      ["visual", "main"],
      ["note", "footer"],
    ],
  );
});


test("card-deck composition groups explanatory prose around one definition collection", () => {
  const cards = definitions("cards");
  const scene: Scene = {
    id: "opaque:card-deck",
    source: [{ resourceId: "resource:card-deck" }],
    blocks: [
      prose("heading", "introduce"),
      prose("prelude-a", "explain"),
      prose("prelude-b", "explain"),
      cards,
      prose("footer", "explain"),
    ],
    readingOrder: ["heading", "prelude-a", "prelude-b", "cards", "footer"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "card-deck",
    mainCount: 1,
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "prelude-a", region: "prelude", index: 0 },
      { blockId: "prelude-b", region: "prelude", index: 1 },
      { blockId: "cards", region: "main", index: 0 },
      { blockId: "footer", region: "footer", index: 0 },
    ],
  });
});

test("card-deck inference rejects mixed primary content", () => {
  const scene: Scene = {
    id: "opaque:not-card-deck",
    source: [{ resourceId: "resource:not-card-deck" }],
    blocks: [
      prose("heading", "introduce"),
      prose("prelude", "explain"),
      math("formula"),
      definitions("cards"),
    ],
    readingOrder: ["heading", "prelude", "formula", "cards"],
  };
  assert.notEqual(inferRevealCompositionPlan(scene).kind, "card-deck");
});


test("evidence-split infers data plus visual with explanatory prelude and list support", () => {
  const scene: Scene = {
    id: "opaque:evidence",
    source: [{ resourceId: "resource:evidence" }],
    blocks: [
      prose("heading", "introduce"),
      prose("intro", "explain"),
      dataTable("table"),
      barChart("chart"),
      unorderedList("roles"),
    ],
    readingOrder: ["heading", "intro", "table", "chart", "roles"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "evidence-split",
    mainCount: 2,
    evidenceProfile: "data-visual",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "intro", region: "prelude", index: 0 },
      { blockId: "table", region: "primary", index: 0 },
      { blockId: "chart", region: "secondary", index: 0 },
      { blockId: "roles", region: "footer", index: 0 },
    ],
  });
});

test("evidence-split infers explanatory list plus structured data", () => {
  const scene: Scene = {
    id: "opaque:list-data",
    source: [{ resourceId: "resource:list-data" }],
    blocks: [
      prose("heading", "introduce"),
      unorderedList("principles", 4),
      dataTable("table"),
    ],
    readingOrder: ["heading", "principles", "table"],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.kind, "evidence-split");
  assert.equal(plan.evidenceProfile, "list-data");
  assert.deepEqual(
    plan.placements.map((placement) => [placement.blockId, placement.region]),
    [
      ["heading", "heading"],
      ["principles", "primary"],
      ["table", "secondary"],
    ],
  );
});

test("evidence-split does not absorb unrelated third primary evidence", () => {
  const scene: Scene = {
    id: "opaque:three-evidence",
    source: [{ resourceId: "resource:three-evidence" }],
    blocks: [
      prose("heading", "introduce"),
      dataTable("table"),
      barChart("chart"),
      math("formula"),
    ],
    readingOrder: ["heading", "table", "chart", "formula"],
  };
  assert.notEqual(inferRevealCompositionPlan(scene).kind, "evidence-split");
});


function flowDiagram(id: string): SceneBlock {
  return {
    id,
    kind: "diagram",
    diagramType: "flow",
    label: "Generic process",
    description: "Generic flow",
    nodes: [
      { id: `${id}:a`, label: "A", source: [{ resourceId: `resource:${id}:a` }] },
      { id: `${id}:b`, label: "B", source: [{ resourceId: `resource:${id}:b` }] },
    ],
    edges: [{
      id: `${id}:ab`,
      sourceNodeId: `${id}:a`,
      targetNodeId: `${id}:b`,
      label: "to",
      source: [{ resourceId: `resource:${id}:ab` }],
    }],
    source: [{ resourceId: `resource:${id}` }],
  };
}

function proseImageGroup(id: string): SceneBlock {
  const proseBlock: SceneBlock = {
    id: `${id}:prose`,
    kind: "prose",
    text: "Generic context",
    intent: { kind: "explain" },
    source: [{ resourceId: `resource:${id}:prose` }],
  };
  const mediaBlock: SceneBlock = {
    id: `${id}:media`,
    kind: "media-reference",
    uri: "/generic.svg",
    alternativeText: "Generic illustration",
    source: [{ resourceId: `resource:${id}:media` }],
  };
  return {
    id,
    kind: "group",
    children: [proseBlock, mediaBlock],
    readingOrder: [proseBlock.id, mediaBlock.id],
    source: [{ resourceId: `resource:${id}` }],
  };
}

test("evidence-story composes visual, data and process evidence generically", () => {
  const scene: Scene = {
    id: "opaque:evidence-story",
    source: [{ resourceId: "resource:evidence-story" }],
    blocks: [
      prose("heading", "introduce"),
      barChart("signal"),
      dataTable("results"),
      flowDiagram("process"),
    ],
    readingOrder: ["heading", "signal", "results", "process"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "evidence-story",
    mainCount: 3,
    evidenceProfile: "visual-data-flow",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "signal", region: "primary", index: 0 },
      { blockId: "results", region: "secondary", index: 0 },
      { blockId: "process", region: "footer", index: 0 },
    ],
  });
});

test("worked-evidence composes context, data, visual, support and optional note", () => {
  const scene: Scene = {
    id: "opaque:worked-evidence",
    source: [{ resourceId: "resource:worked-evidence" }],
    blocks: [
      prose("heading", "introduce"),
      proseImageGroup("context"),
      dataTable("data"),
      barChart("analysis"),
      unorderedList("discussion", 3),
      prose("takeaway", "explain"),
    ],
    readingOrder: ["heading", "context", "data", "analysis", "discussion", "takeaway"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "worked-evidence",
    mainCount: 4,
    evidenceProfile: "context-data-visual",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "context", region: "context", index: 0 },
      { blockId: "data", region: "primary", index: 0 },
      { blockId: "analysis", region: "secondary", index: 0 },
      { blockId: "discussion", region: "support", index: 0 },
      { blockId: "takeaway", region: "footer", index: 0 },
    ],
  });
});


test("process-story infers compact profile for a short strict linear flow", () => {
  const scene: Scene = {
    id: "opaque:process-story-compact",
    source: [{ resourceId: "resource:process-story-compact" }],
    blocks: [
      prose("heading", "introduce"),
      prose("intro", "explain"),
      flowDiagram("process"),
      prose("takeaway", "explain"),
    ],
    readingOrder: ["heading", "intro", "process", "takeaway"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "process-story",
    mainCount: 1,
    processProfile: "compact-linear",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "intro", region: "prelude", index: 0 },
      { blockId: "process", region: "main", index: 0 },
      { blockId: "takeaway", region: "footer", index: 0 },
    ],
  });
});

test("process-story uses the wide profile for a longer linear process", () => {
  const process: SceneBlock = {
    id: "long-process",
    kind: "diagram",
    diagramType: "flow",
    label: "Generic process",
    description: "Longer process",
    nodes: ["a", "b", "c", "d"].map((suffix) => ({
      id: `long-process:${suffix}`,
      label: suffix.toUpperCase(),
      source: [{ resourceId: `resource:long-process:${suffix}` }],
    })),
    edges: [
      ["a", "b"],
      ["b", "c"],
      ["c", "d"],
    ].map(([from, to]) => ({
      id: `long-process:${from}:${to}`,
      sourceNodeId: `long-process:${from}`,
      targetNodeId: `long-process:${to}`,
      label: "to",
      source: [{ resourceId: `resource:long-process:${from}:${to}` }],
    })),
    source: [{ resourceId: "resource:long-process" }],
  };
  const scene: Scene = {
    id: "opaque:process-story-wide",
    source: [{ resourceId: "resource:process-story-wide" }],
    blocks: [
      prose("heading", "introduce"),
      prose("intro", "explain"),
      process,
      prose("takeaway", "explain"),
    ],
    readingOrder: ["heading", "intro", "long-process", "takeaway"],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.kind, "process-story");
  assert.equal(plan.processProfile, "wide-process");
});


test("support-workbench infers visual dual-reference structure", () => {
  const scene: Scene = {
    id: "opaque:visual-dual-reference",
    source: [{ resourceId: "resource:visual-dual-reference" }],
    blocks: [
      prose("heading", "introduce"),
      flowDiagram("visual"),
      prose("primary-heading", "explain"),
      definitions("primary-definitions"),
      prose("primary-note", "explain"),
      prose("secondary-heading", "explain"),
      definitions("secondary-definitions"),
    ],
    readingOrder: [
      "heading",
      "visual",
      "primary-heading",
      "primary-definitions",
      "primary-note",
      "secondary-heading",
      "secondary-definitions",
    ],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.kind, "support-workbench");
  assert.equal(plan.workbenchProfile, "visual-dual-reference");
  assert.deepEqual(
    plan.placements.map((placement) => [placement.blockId, placement.region, placement.index]),
    [
      ["heading", "heading", 0],
      ["visual", "lead", 0],
      ["primary-heading", "primary", 0],
      ["primary-definitions", "primary", 1],
      ["primary-note", "primary", 2],
      ["secondary-heading", "secondary", 0],
      ["secondary-definitions", "secondary", 1],
    ],
  );
});

test("support-workbench infers list plus code reference structure", () => {
  const code: SceneBlock = {
    id: "code",
    kind: "code",
    language: "text",
    code: "opaque",
    fallback: "opaque",
    editable: false,
    executable: false,
    source: [{ resourceId: "resource:code" }],
  };
  const scene: Scene = {
    id: "opaque:list-code-reference",
    source: [{ resourceId: "resource:list-code-reference" }],
    blocks: [
      prose("heading", "introduce"),
      prose("banner", "explain"),
      unorderedList("terms", 6),
      prose("code-label", "explain"),
      code,
      prose("reading", "explain"),
    ],
    readingOrder: ["heading", "banner", "terms", "code-label", "code", "reading"],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.kind, "support-workbench");
  assert.equal(plan.workbenchProfile, "list-code-reference");
  assert.deepEqual(
    plan.placements.map((placement) => [placement.blockId, placement.region, placement.index]),
    [
      ["heading", "heading", 0],
      ["banner", "lead", 0],
      ["terms", "primary", 0],
      ["code-label", "secondary", 0],
      ["code", "secondary", 1],
      ["reading", "secondary", 2],
    ],
  );
});


test("progression-strip infers cards with an authored footer", () => {
  const scene: Scene = {
    id: "opaque:cards-with-footer",
    source: [{ resourceId: "resource:cards-with-footer" }],
    blocks: [
      prose("heading", "introduce"),
      unorderedList("cards", 3),
      prose("takeaway", "explain"),
    ],
    readingOrder: ["heading", "cards", "takeaway"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "progression-strip",
    mainCount: 1,
    progressionProfile: "cards-with-footer",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "cards", region: "main", index: 0 },
      { blockId: "takeaway", region: "footer", index: 0 },
    ],
  });
});

test("progression-strip infers an ordered card progression", () => {
  const scene: Scene = {
    id: "opaque:cards-progression",
    source: [{ resourceId: "resource:cards-progression" }],
    blocks: [
      prose("heading", "introduce"),
      prose("banner", "explain"),
      unorderedList("cards", 3),
      prose("takeaway", "explain"),
    ],
    readingOrder: ["heading", "banner", "cards", "takeaway"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "progression-strip",
    mainCount: 1,
    progressionProfile: "cards-only",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "banner", region: "prelude", index: 0 },
      { blockId: "cards", region: "main", index: 0 },
      { blockId: "takeaway", region: "footer", index: 0 },
    ],
  });
});

test("progression-strip infers textual cards leading into a visual", () => {
  const network: SceneBlock = {
    id: "network",
    kind: "diagram",
    diagramType: "network",
    label: "Generic network",
    description: "Generic relation view",
    nodes: [
      { id: "network:a", label: "A", source: [{ resourceId: "resource:network:a" }] },
      { id: "network:b", label: "B", source: [{ resourceId: "resource:network:b" }] },
    ],
    edges: [{
      id: "network:ab",
      sourceNodeId: "network:a",
      targetNodeId: "network:b",
      label: "relates",
      source: [{ resourceId: "resource:network:ab" }],
    }],
    source: [{ resourceId: "resource:network" }],
  };
  const scene: Scene = {
    id: "opaque:cards-to-visual",
    source: [{ resourceId: "resource:cards-to-visual" }],
    blocks: [
      prose("heading", "introduce"),
      prose("banner", "explain"),
      unorderedList("views", 2),
      network,
      prose("takeaway", "explain"),
    ],
    readingOrder: ["heading", "banner", "views", "network", "takeaway"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "progression-strip",
    mainCount: 2,
    progressionProfile: "cards-to-visual",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "banner", region: "prelude", index: 0 },
      { blockId: "views", region: "main", index: 0 },
      { blockId: "network", region: "secondary", index: 0 },
      { blockId: "takeaway", region: "footer", index: 0 },
    ],
  });
});


test("learning-stage infers prompt plus code", () => {
  const prompt: SceneBlock = {
    id: "prompt",
    kind: "prompt",
    prompt: "Choose",
    responseMode: "single-choice",
    options: ["A", "B"],
    source: [{ resourceId: "resource:prompt" }],
  };
  const code: SceneBlock = {
    id: "code",
    kind: "code",
    language: "text",
    code: "opaque",
    fallback: "opaque",
    editable: false,
    executable: false,
    source: [{ resourceId: "resource:code" }],
  };
  const scene: Scene = {
    id: "opaque:prompt-code",
    source: [{ resourceId: "resource:prompt-code" }],
    blocks: [prose("heading", "introduce"), prompt, code],
    readingOrder: ["heading", "prompt", "code"],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.kind, "learning-stage");
  assert.equal(plan.learningProfile, "prompt-code");
  assert.deepEqual(plan.placements.map((placement) => [placement.blockId, placement.region]), [
    ["heading", "heading"],
    ["prompt", "primary"],
    ["code", "secondary"],
  ]);
});

test("learning-stage infers info plus visual with an optional note", () => {
  const scene: Scene = {
    id: "opaque:info-visual",
    source: [{ resourceId: "resource:info-visual" }],
    blocks: [
      prose("heading", "introduce"),
      prose("definition", "explain"),
      barChart("visual"),
      prose("note", "explain"),
    ],
    readingOrder: ["heading", "definition", "visual", "note"],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.kind, "learning-stage");
  assert.equal(plan.learningProfile, "info-visual");
  assert.deepEqual(plan.placements.map((placement) => [placement.blockId, placement.region]), [
    ["heading", "heading"],
    ["definition", "primary"],
    ["visual", "secondary"],
    ["note", "footer"],
  ]);
});

test("learning-stage infers prompt grids from repeated prompt components", () => {
  const prompts: SceneBlock[] = ["a", "b", "c"].map((suffix) => ({
    id: `prompt:${suffix}`,
    kind: "prompt",
    prompt: `Prompt ${suffix}`,
    responseMode: "single-choice",
    options: ["A", "B"],
    source: [{ resourceId: `resource:prompt:${suffix}` }],
  }));
  const scene: Scene = {
    id: "opaque:prompt-grid",
    source: [{ resourceId: "resource:prompt-grid" }],
    blocks: [prose("heading", "introduce"), ...prompts],
    readingOrder: ["heading", ...prompts.map((prompt) => prompt.id)],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.kind, "learning-stage");
  assert.equal(plan.learningProfile, "prompt-grid");
  assert.equal(plan.mainCount, 3);
  assert.deepEqual(plan.placements.slice(1).map((placement) => placement.region), ["main", "main", "main"]);
});

test("legacy functional and observation structures resolve through main-aside-note", () => {
  const functional: Scene = {
    id: "opaque:functional",
    source: [{ resourceId: "resource:functional" }],
    blocks: [
      prose("heading", "introduce"),
      prose("intro", "explain"),
      math("formula"),
      definitions("examples"),
      prose("caveat", "explain"),
    ],
    readingOrder: ["heading", "intro", "formula", "examples", "caveat"],
  };
  assert.equal(inferRevealCompositionPlan(functional).kind, "main-aside-note");

  const observation: Scene = {
    id: "opaque:observation",
    source: [{ resourceId: "resource:observation" }],
    blocks: [
      prose("heading", "introduce"),
      prose("intro", "explain"),
      math("values"),
      flowDiagram("diagram"),
      prose("takeaway", "explain"),
    ],
    readingOrder: ["heading", "intro", "values", "diagram", "takeaway"],
  };
  const plan = inferRevealCompositionPlan(observation);
  assert.equal(plan.kind, "main-aside-note");
  assert.equal(plan.mainProfile, "formula-visual");
});


test("visual-stage infers a standard standalone diagram", () => {
  const scene: Scene = {
    id: "opaque:visual-stage",
    source: [{ resourceId: "resource:visual-stage" }],
    blocks: [
      prose("heading", "introduce"),
      flowDiagram("diagram"),
    ],
    readingOrder: ["heading", "diagram"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "visual-stage",
    mainCount: 1,
    visualStageProfile: "diagram",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "diagram", region: "main", index: 0 },
    ],
  });
});

test("visual-stage infers concentric profile from grouped focused network topology", () => {
  const network: SceneBlock = {
    id: "network",
    kind: "diagram",
    diagramType: "network",
    label: "Generic grouped network",
    description: "Generic grouped network",
    focusNodeId: "network:focus",
    nodes: [
      { id: "network:focus", label: "Focus", source: [{ resourceId: "resource:focus" }] },
      { id: "network:a", label: "A", groupIds: ["group:a"], source: [{ resourceId: "resource:a" }] },
      { id: "network:b", label: "B", groupIds: ["group:b"], source: [{ resourceId: "resource:b" }] },
    ],
    edges: [],
    groups: [
      { id: "group:a", label: "A", source: [{ resourceId: "resource:group-a" }] },
      { id: "group:b", label: "B", source: [{ resourceId: "resource:group-b" }] },
    ],
    source: [{ resourceId: "resource:network" }],
  };
  const scene: Scene = {
    id: "opaque:concentric",
    source: [{ resourceId: "resource:scene" }],
    blocks: [prose("heading", "introduce"), network],
    readingOrder: ["heading", "network"],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.kind, "visual-stage");
  assert.equal(plan.visualStageProfile, "concentric-network");
});


test("statement-card composes an explanatory statement with supporting emphasized text", () => {
  const scene: Scene = {
    id: "opaque:statement-card",
    source: [{ resourceId: "resource:statement-card" }],
    blocks: [
      prose("heading", "introduce"),
      prose("statement", "explain"),
      prose("source", "emphasize"),
    ],
    readingOrder: ["heading", "statement", "source"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "statement-card",
    mainCount: 1,
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "statement", region: "main", index: 0 },
      { blockId: "source", region: "footer", index: 0 },
    ],
  });
});
