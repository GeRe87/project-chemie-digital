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
    profile: "formula-cards",
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
  assert.equal(inferRevealCompositionPlan(scene).kind, "stack");
});


test("heading-only scenes use the generic zero-body stack fallback", () => {
  const scene: Scene = {
    id: "heading-only",
    source: [{ resourceId: "resource:heading-only" }],
    blocks: [prose("heading", "introduce")],
    readingOrder: ["heading"],
  };
  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "stack",
    mainCount: 0,
    placements: [{ blockId: "heading", region: "heading", index: 0 }],
  });
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
  assert.equal(plan.profile, "formula-visual");
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


test("learning-stage definition-deck profile groups explanatory prose around one definition collection", () => {
  const cards = definitions("cards");
  const scene: Scene = {
    id: "opaque:definition-deck",
    source: [{ resourceId: "resource:definition-deck" }],
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
    kind: "learning-stage",
    mainCount: 1,
    profile: "definition-deck",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "prelude-a", region: "prelude", index: 0 },
      { blockId: "prelude-b", region: "prelude", index: 1 },
      { blockId: "cards", region: "main", index: 0 },
      { blockId: "footer", region: "footer", index: 0 },
    ],
  });
});

test("definition-deck inference rejects mixed primary content", () => {
  const scene: Scene = {
    id: "opaque:not-definition-deck",
    source: [{ resourceId: "resource:not-definition-deck" }],
    blocks: [
      prose("heading", "introduce"),
      prose("prelude", "explain"),
      math("formula"),
      definitions("cards"),
    ],
    readingOrder: ["heading", "prelude", "formula", "cards"],
  };
  assert.notEqual(inferRevealCompositionPlan(scene).profile, "definition-deck");
});


test("evidence-stage infers data plus visual with explanatory prelude and list support", () => {
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
    kind: "evidence-stage",
    mainCount: 2,
    profile: "data-visual",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "intro", region: "prelude", index: 0 },
      { blockId: "table", region: "primary", index: 0 },
      { blockId: "chart", region: "secondary", index: 0 },
      { blockId: "roles", region: "footer", index: 0 },
    ],
  });
});

test("evidence-stage infers explanatory list plus structured data", () => {
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
  assert.equal(plan.kind, "evidence-stage");
  assert.equal(plan.profile, "list-data");
  assert.deepEqual(
    plan.placements.map((placement) => [placement.blockId, placement.region]),
    [
      ["heading", "heading"],
      ["principles", "primary"],
      ["table", "secondary"],
    ],
  );
});

test("evidence-stage does not absorb unrelated third primary evidence", () => {
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
  assert.notEqual(inferRevealCompositionPlan(scene).kind, "evidence-stage");
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

test("evidence-stage-visual-flow composes visual, data and process evidence generically", () => {
  const scene: Scene = {
    id: "opaque:evidence-stage-visual-flow",
    source: [{ resourceId: "resource:evidence-stage-visual-flow" }],
    blocks: [
      prose("heading", "introduce"),
      barChart("signal"),
      dataTable("results"),
      flowDiagram("process"),
    ],
    readingOrder: ["heading", "signal", "results", "process"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "evidence-stage",
    mainCount: 3,
    profile: "visual-data-flow",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "signal", region: "primary", index: 0 },
      { blockId: "results", region: "secondary", index: 0 },
      { blockId: "process", region: "footer", index: 0 },
    ],
  });
});

test("evidence-stage-context-data-visual composes context, data, visual, support and optional note", () => {
  const scene: Scene = {
    id: "opaque:evidence-stage-context-data-visual",
    source: [{ resourceId: "resource:evidence-stage-context-data-visual" }],
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
    kind: "evidence-stage",
    mainCount: 4,
    profile: "context-data-visual",
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


test("process progression wins over broader info-visual learning signature and infers compact profile", () => {
  const scene: Scene = {
    id: "opaque:process progression-compact",
    source: [{ resourceId: "resource:process progression-compact" }],
    blocks: [
      prose("heading", "introduce"),
      prose("intro", "explain"),
      flowDiagram("process"),
      prose("takeaway", "explain"),
    ],
    readingOrder: ["heading", "intro", "process", "takeaway"],
  };

  assert.deepEqual(
    scene.blocks.slice(1).map((block) => revealComponentDescriptor(block).kind),
    ["info-surface", "visual", "info-surface"],
  );

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "progression-stage",
    mainCount: 1,
    profile: "compact-linear",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "intro", region: "prelude", index: 0 },
      { blockId: "process", region: "main", index: 0 },
      { blockId: "takeaway", region: "footer", index: 0 },
    ],
  });
});

test("process progression uses the wide profile for a longer linear process", () => {
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
    id: "opaque:process progression-wide",
    source: [{ resourceId: "resource:process progression-wide" }],
    blocks: [
      prose("heading", "introduce"),
      prose("intro", "explain"),
      process,
      prose("takeaway", "explain"),
    ],
    readingOrder: ["heading", "intro", "long-process", "takeaway"],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.kind, "progression-stage");
  assert.equal(plan.profile, "wide-process");
});


test("learning-stage infers visual dual-reference structure", () => {
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
  assert.equal(plan.kind, "learning-stage");
  assert.equal(plan.profile, "visual-dual-reference");
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

test("learning-stage infers list plus code reference structure", () => {
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
  assert.equal(plan.kind, "learning-stage");
  assert.equal(plan.profile, "list-code-reference");
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


test("progression stage infers cards with an authored footer", () => {
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
    kind: "progression-stage",
    mainCount: 1,
    profile: "cards-with-footer",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "cards", region: "main", index: 0 },
      { blockId: "takeaway", region: "footer", index: 0 },
    ],
  });
});

test("progression stage infers an ordered card progression", () => {
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
    kind: "progression-stage",
    mainCount: 1,
    profile: "cards-only",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "banner", region: "prelude", index: 0 },
      { blockId: "cards", region: "main", index: 0 },
      { blockId: "takeaway", region: "footer", index: 0 },
    ],
  });
});

test("progression stage infers textual cards leading into a visual", () => {
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
    kind: "progression-stage",
    mainCount: 2,
    profile: "cards-to-visual",
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
  assert.equal(plan.profile, "prompt-code");
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
  assert.equal(plan.profile, "info-visual");
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
  assert.equal(plan.profile, "prompt-grid");
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
  assert.equal(plan.profile, "formula-visual");
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
    profile: "diagram",
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
  assert.equal(plan.profile, "concentric-network");
});


test("learning-stage statement-support profile composes explanatory and emphasized text", () => {
  const scene: Scene = {
    id: "opaque:statement-support",
    source: [{ resourceId: "resource:statement-support" }],
    blocks: [
      prose("heading", "introduce"),
      prose("statement", "explain"),
      prose("source", "emphasize"),
    ],
    readingOrder: ["heading", "statement", "source"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "learning-stage",
    mainCount: 1,
    profile: "statement-support",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "statement", region: "main", index: 0 },
      { blockId: "source", region: "footer", index: 0 },
    ],
  });
});


test("media-stage infers a full-viewport prose/media group structurally", () => {
  const scene: Scene = {
    id: "opaque:media-stage",
    source: [{ resourceId: "resource:media-stage" }],
    blocks: [
      prose("heading", "introduce"),
      proseImageGroup("media"),
    ],
    readingOrder: ["heading", "media"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "media-stage",
    mainCount: 1,
    profile: "full-viewport",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "media", region: "main", index: 0 },
    ],
  });
});


test("media-stage hero-attributions profile infers ordered attribution and media groups structurally", () => {
  const attributionGroup = (id: string): SceneBlock => {
    const proseBlock: SceneBlock = {
      id: `${id}:text`,
      kind: "prose",
      text: "Generic attribution",
      intent: { kind: "emphasize" },
      source: [{ resourceId: `resource:${id}:text` }],
    };
    const mediaBlock: SceneBlock = {
      id: `${id}:media`,
      kind: "media-reference",
      uri: "/generic.svg",
      alternativeText: "Generic mark",
      source: [{ resourceId: `resource:${id}:media` }],
    };
    return {
      id,
      kind: "group",
      children: [proseBlock, mediaBlock],
      readingOrder: [proseBlock.id, mediaBlock.id],
      source: [{ resourceId: `resource:${id}` }],
    };
  };

  const scene: Scene = {
    id: "opaque:media-stage-hero",
    source: [{ resourceId: "resource:media-stage-hero" }],
    blocks: [
      prose("heading", "introduce"),
      attributionGroup("primary"),
      attributionGroup("secondary"),
      attributionGroup("support"),
    ],
    readingOrder: ["heading", "primary", "secondary", "support"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "media-stage",
    mainCount: 3,
    profile: "hero-attributions",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "primary", region: "primary", index: 0 },
      { blockId: "secondary", region: "secondary", index: 0 },
      { blockId: "support", region: "support", index: 0 },
    ],
  });
});


test("semantic-stage infers source and multi-view profiles from TriG structure", () => {
  const trigCode = (id: string): SceneBlock => ({
    id,
    kind: "code",
    language: "trig",
    code: "ex:a a ex:Thing .",
    fallback: "ex:a a ex:Thing .",
    editable: false,
    executable: false,
    source: [{ resourceId: `resource:${id}` }],
  });

  const sourceScene: Scene = {
    id: "opaque:semantic-source",
    source: [{ resourceId: "resource:semantic-source" }],
    blocks: [prose("heading", "introduce"), trigCode("source")],
    readingOrder: ["heading", "source"],
  };
  assert.deepEqual(inferRevealCompositionPlan(sourceScene), {
    kind: "semantic-stage",
    mainCount: 1,
    profile: "source",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "source", region: "main", index: 0 },
    ],
  });

  const multiViewScene: Scene = {
    id: "opaque:semantic-multi-view",
    source: [{ resourceId: "resource:semantic-multi-view" }],
    blocks: [prose("heading", "introduce"), trigCode("source"), barChart("chart")],
    readingOrder: ["heading", "source", "chart"],
  };
  assert.deepEqual(inferRevealCompositionPlan(multiViewScene), {
    kind: "semantic-stage",
    mainCount: 2,
    profile: "multi-view",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "source", region: "main", index: 0 },
      { blockId: "chart", region: "secondary", index: 0 },
    ],
  });
});
