import assert from "node:assert/strict";
import test from "node:test";

import type { Scene, SceneBlock } from "../../core/src/scene-document.ts";
import {
  inferRevealCompositionPlan,
  resolveDefinitionFormulaPairs,
  resolveCodeFunctionLegendUnits,
  resolveFormulaLegendUnits,
  revealComponentDescriptor,
  shouldWrapRevealCompositionPlacement,
  type RevealCompositionPlacement,
  type RevealCompositionPlan,
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

function mediaReference(id: string): SceneBlock {
  return {
    id,
    kind: "media-reference",
    uri: "/generic.svg",
    mediaType: "image/svg+xml",
    alternativeText: "Generic contextual illustration",
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

test("prose and read-only code keep an on-demand diagram in the footer", () => {
  const source = [{resourceId: "opaque:source"}];
  const code: SceneBlock = {id: "serialization", kind: "code", language: "trig", code: "", fallback: "", editable: false, executable: false, source};
  const diagram: SceneBlock = {id: "relations", kind: "diagram", diagramType: "network", label: "Graph", description: "Relations", presentation: "dialog", nodes: [], edges: [], source};
  const blocks = [prose("heading", "introduce"), prose("story"), code, diagram];
  const plan = inferRevealCompositionPlan({id: "arbitrary", blocks, source, readingOrder: blocks.map(block => block.id)});
  assert.equal(plan.profile, "info-visual");
  assert.deepEqual(plan.placements.map(p => [p.blockId, p.region]), [
    ["heading", "heading"], ["story", "primary"], ["serialization", "secondary"], ["relations", "footer"],
  ]);
});

test("scenario and evidence layouts depend only on ordered block kinds", () => {
  const railBlocks=[prose("heading","introduce"),definitions("scenario"),dataTable("observations"),unorderedList("conclusion"),barChart("stems")];
  const rail=inferRevealCompositionPlan({id:"opaque-rail",blocks:railBlocks,source:[],readingOrder:railBlocks.map(b=>b.id)});
  assert.equal(rail.profile,"scenario-data-visual");
  assert.deepEqual(rail.placements.filter(p=>["scenario","observations","conclusion"].includes(p.blockId)).map(p=>p.region),["primary","primary","primary"]);
  assert.equal(rail.placements.find(p=>p.blockId==="stems")?.region,"secondary");
  for (const visual of [barChart("anything"), mediaReference("unrelated")]) {
    const blocks = [prose("heading", "introduce"), unorderedList("context"), dataTable("data"), visual, unorderedList("conclusion")];
    const plan = inferRevealCompositionPlan({ id: "opaque", blocks, source: [], readingOrder: blocks.map(b => b.id) });
    assert.equal(plan.profile, "scenario-data-visual");
    assert.equal(plan.placements.find(p => p.blockId === "context")?.region, visual.kind === "chart" ? "prelude" : "primary");
    assert.equal(plan.placements.find(p => p.blockId === visual.id)?.region, "secondary");
  }
  const blocks = [prose("heading", "introduce"), flowDiagram("process"), dataTable("matrix"), unorderedList("qualification")];
  const plan = inferRevealCompositionPlan({ id: "another", blocks, source: [], readingOrder: blocks.map(b => b.id) });
  assert.equal(plan.profile, "process-matrix");
  assert.equal(plan.placements.find(p => p.blockId === "process")?.region, "prelude");
});

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

test("repeated explanation/math pairs form identity-independent cards in reading order", () => {
  for (const count of [2, 3, 4]) for (const context of [false, true]) {
    const blocks = [prose("heading", "introduce"), ...(context ? [prose("context")] : []),
      ...Array.from({ length: count }, (_, i): SceneBlock[] => [{ id: `unrelated-${i}`, kind: "definition-list", entries: [{ id: `entry-${i}`, term: "Example", source: [{ resourceId: `ex:entry-${i}` }] }], source: [{ resourceId: `ex:card-${i}` }] }, math(`expression-${i}`)]).flat()];
    const scene: Scene = { id: "unrelated-lecture", source: [{ resourceId: "ex:other" }], blocks, readingOrder: blocks.map(block => block.id) };
    const plan = inferRevealCompositionPlan(scene);
    assert.equal(plan.profile, "definition-deck");
    assert.equal(plan.mainCount, 1);
    assert.deepEqual(plan.placements.filter(item => item.region === "main").map(item => item.index),
      Array.from({ length: count * 2 }, (_, i) => i));
    assert.equal(plan.placements.some(item => item.region === "footer"), false);
    const broken = { ...scene, blocks: blocks.map(block => block.id === "expression-0" ? prose(block.id) : block) };
    assert.equal(resolveDefinitionFormulaPairs(broken), undefined);
  }
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

test("evidence-stage reuses its left context/data/conclusion rail for authored cards", () => {
  const blocks=[prose("heading","introduce"),definitions("context"),dataTable("table"),barChart("chart"),unorderedList("conclusion")];
  const scene: Scene={id:"unrelated",source:[],blocks,readingOrder:blocks.map(b=>b.id)};
  const plan=inferRevealCompositionPlan(scene);
  assert.equal(plan.kind,"evidence-stage");assert.equal(plan.profile,"data-visual");
  assert.deepEqual(plan.placements.map(p=>[p.blockId,p.region]),[["heading","heading"],["context","prelude"],["table","primary"],["chart","secondary"],["conclusion","footer"]]);
});

test("evidence-stage accepts contextual media above prose before data plus visual", () => {
  const scene: Scene = {
    id: "opaque:media-evidence",
    source: [{ resourceId: "resource:media-evidence" }],
    blocks: [
      prose("heading", "introduce"),
      mediaReference("context-media"),
      prose("intro", "explain"),
      dataTable("table"),
      barChart("chart"),
    ],
    readingOrder: ["heading", "context-media", "intro", "table", "chart"],
  };

  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "evidence-stage",
    mainCount: 2,
    profile: "data-visual",
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "context-media", region: "prelude", index: 0 },
      { blockId: "intro", region: "prelude", index: 1 },
      { blockId: "table", region: "primary", index: 0 },
      { blockId: "chart", region: "secondary", index: 0 },
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

test("context-data-visual accepts multiple explanatory footer blocks", () => {
  const scene: Scene = {
    id: "opaque:evidence-stage-context-data-visual-flex",
    source: [{ resourceId: "resource:evidence-stage-context-data-visual-flex" }],
    blocks: [
      prose("heading", "introduce"),
      proseImageGroup("context-flex"),
      dataTable("data-flex"),
      barChart("analysis-flex"),
      unorderedList("discussion-flex", 3),
      prose("takeaway-a", "explain"),
      prose("takeaway-b", "explain"),
    ],
    readingOrder: [
      "heading",
      "context-flex",
      "data-flex",
      "analysis-flex",
      "discussion-flex",
      "takeaway-a",
      "takeaway-b",
    ],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.profile, "context-data-visual");
  assert.deepEqual(
    plan.placements.map((placement) => [placement.blockId, placement.region]),
    [
      ["heading", "heading"],
      ["context-flex", "context"],
      ["data-flex", "primary"],
      ["analysis-flex", "secondary"],
      ["discussion-flex", "support"],
      ["takeaway-a", "footer"],
      ["takeaway-b", "footer"],
    ],
  );
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


test("visual dual-reference tolerates an omitted primary support note", () => {
  const scene: Scene = {
    id: "opaque:visual-dual-reference-compact",
    source: [{ resourceId: "resource:visual-dual-reference-compact" }],
    blocks: [
      prose("heading", "introduce"),
      flowDiagram("visual"),
      prose("primary-heading", "explain"),
      definitions("primary-definitions"),
      prose("secondary-heading", "explain"),
      definitions("secondary-definitions"),
    ],
    readingOrder: [
      "heading",
      "visual",
      "primary-heading",
      "primary-definitions",
      "secondary-heading",
      "secondary-definitions",
    ],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.profile, "visual-dual-reference");
  assert.deepEqual(
    plan.placements.map((placement) => [placement.blockId, placement.region]),
    [
      ["heading", "heading"],
      ["visual", "lead"],
      ["primary-heading", "primary"],
      ["primary-definitions", "primary"],
      ["secondary-heading", "secondary"],
      ["secondary-definitions", "secondary"],
    ],
  );
});

test("list-code reference tolerates multiple explanatory lead blocks", () => {
  const code: SceneBlock = {
    id: "code-flexible",
    kind: "code",
    language: "text",
    code: "opaque",
    fallback: "opaque",
    editable: false,
    executable: false,
    source: [{ resourceId: "resource:code-flexible" }],
  };
  const scene: Scene = {
    id: "opaque:list-code-reference-flexible",
    source: [{ resourceId: "resource:list-code-reference-flexible" }],
    blocks: [
      prose("heading", "introduce"),
      prose("banner-a", "explain"),
      prose("banner-b", "explain"),
      unorderedList("terms-flexible", 4),
      prose("code-label-flexible", "explain"),
      code,
      prose("reading-flexible", "explain"),
    ],
    readingOrder: [
      "heading",
      "banner-a",
      "banner-b",
      "terms-flexible",
      "code-label-flexible",
      "code-flexible",
      "reading-flexible",
    ],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.profile, "list-code-reference");
  assert.deepEqual(
    plan.placements.map((placement) => [placement.blockId, placement.region]),
    [
      ["heading", "heading"],
      ["banner-a", "lead"],
      ["banner-b", "lead"],
      ["terms-flexible", "primary"],
      ["code-label-flexible", "secondary"],
      ["code-flexible", "secondary"],
      ["reading-flexible", "secondary"],
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

test("cards-to-visual accepts multiple semantic prelude and footer blocks", () => {
  const network: SceneBlock = {
    id: "network-flex",
    kind: "diagram",
    diagramType: "network",
    label: "Generic network",
    description: "Generic relation view",
    nodes: [
      { id: "network-flex:a", label: "A", source: [{ resourceId: "resource:network-flex:a" }] },
      { id: "network-flex:b", label: "B", source: [{ resourceId: "resource:network-flex:b" }] },
    ],
    edges: [{
      id: "network-flex:ab",
      sourceNodeId: "network-flex:a",
      targetNodeId: "network-flex:b",
      label: "relates",
      source: [{ resourceId: "resource:network-flex:ab" }],
    }],
    source: [{ resourceId: "resource:network-flex" }],
  };
  const scene: Scene = {
    id: "opaque:cards-to-visual-flex",
    source: [{ resourceId: "resource:cards-to-visual-flex" }],
    blocks: [
      prose("heading", "introduce"),
      prose("prelude-a", "explain"),
      prose("prelude-b", "explain"),
      unorderedList("views-flex", 2),
      network,
      prose("footer-a", "explain"),
      prose("footer-b", "explain"),
    ],
    readingOrder: [
      "heading",
      "prelude-a",
      "prelude-b",
      "views-flex",
      "network-flex",
      "footer-a",
      "footer-b",
    ],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.profile, "cards-to-visual");
  assert.deepEqual(
    plan.placements.map((placement) => [placement.blockId, placement.region]),
    [
      ["heading", "heading"],
      ["prelude-a", "prelude"],
      ["prelude-b", "prelude"],
      ["views-flex", "main"],
      ["network-flex", "secondary"],
      ["footer-a", "footer"],
      ["footer-b", "footer"],
    ],
  );
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


test("learning-stage prompt-code is anchored by prompt plus code with semantic context", () => {
  const prompt: SceneBlock = {
    id: "prompt-context",
    kind: "prompt",
    prompt: "Choose",
    responseMode: "single-choice",
    options: ["A", "B"],
    source: [{ resourceId: "resource:prompt-context" }],
  };
  const code: SceneBlock = {
    id: "code-context",
    kind: "code",
    language: "text",
    code: "opaque",
    fallback: "opaque",
    editable: false,
    executable: false,
    source: [{ resourceId: "resource:code-context" }],
  };
  const scene: Scene = {
    id: "opaque:prompt-code-context",
    source: [{ resourceId: "resource:prompt-code-context" }],
    blocks: [
      prose("heading", "introduce"),
      prose("context", "explain"),
      prompt,
      code,
      prose("takeaway", "explain"),
    ],
    readingOrder: ["heading", "context", "prompt-context", "code-context", "takeaway"],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.profile, "prompt-code");
  assert.deepEqual(plan.placements.map((placement) => [placement.blockId, placement.region]), [
    ["heading", "heading"],
    ["context", "prelude"],
    ["prompt-context", "primary"],
    ["code-context", "secondary"],
    ["takeaway", "footer"],
  ]);
});

test("learning-stage info-code accepts multiple explanatory blocks around one code anchor", () => {
  const code: SceneBlock = {
    id: "code-info-flex",
    kind: "code",
    language: "text",
    code: "opaque",
    fallback: "opaque",
    editable: false,
    executable: false,
    source: [{ resourceId: "resource:code-info-flex" }],
  };
  const scene: Scene = {
    id: "opaque:info-code-flex",
    source: [{ resourceId: "resource:info-code-flex" }],
    blocks: [
      prose("heading", "introduce"),
      prose("intro-a", "explain"),
      prose("intro-b", "explain"),
      code,
      prose("note", "explain"),
    ],
    readingOrder: ["heading", "intro-a", "intro-b", "code-info-flex", "note"],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.profile, "info-code");
  assert.deepEqual(plan.placements.map((placement) => [placement.blockId, placement.region]), [
    ["heading", "heading"],
    ["intro-a", "prelude"],
    ["intro-b", "prelude"],
    ["code-info-flex", "main"],
    ["note", "footer"],
  ]);
});

test("learning-stage info-visual accepts multiple explanatory blocks around one visual anchor", () => {
  const scene: Scene = {
    id: "opaque:info-visual-flex",
    source: [{ resourceId: "resource:info-visual-flex" }],
    blocks: [
      prose("heading", "introduce"),
      prose("definition-a", "explain"),
      prose("definition-b", "explain"),
      barChart("visual-flex"),
      prose("note-a", "explain"),
      prose("note-b", "explain"),
    ],
    readingOrder: ["heading", "definition-a", "definition-b", "visual-flex", "note-a", "note-b"],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.profile, "info-visual");
  assert.deepEqual(plan.placements.map((placement) => [placement.blockId, placement.region]), [
    ["heading", "heading"],
    ["definition-a", "primary"],
    ["definition-b", "primary"],
    ["visual-flex", "secondary"],
    ["note-a", "footer"],
    ["note-b", "footer"],
  ]);
});

test("learning-stage formula-visual accepts explanatory footer blocks without taking contextual main-aside scenes", () => {
  const scene: Scene = {
    id: "opaque:formula-visual-flex",
    source: [{ resourceId: "resource:formula-visual-flex" }],
    blocks: [
      prose("heading", "introduce"),
      math("formula-flex"),
      barChart("formula-visual-chart"),
      prose("note-a", "explain"),
      prose("note-b", "explain"),
    ],
    readingOrder: ["heading", "formula-flex", "formula-visual-chart", "note-a", "note-b"],
  };

  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.kind, "learning-stage");
  assert.equal(plan.profile, "formula-visual");
  assert.deepEqual(plan.placements.map((placement) => [placement.blockId, placement.region]), [
    ["heading", "heading"],
    ["formula-flex", "prelude"],
    ["formula-visual-chart", "main"],
    ["note-a", "footer"],
    ["note-b", "footer"],
  ]);
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

test("source-linked explanatory key points use a compact surface, independent of resource identity", () => {
  for (const resourceId of ["resource:a", "resource:unrelated"]) {
    const points: SceneBlock = { ...unorderedList("points"), intent: { kind: "explain" },
      source: [{ resourceId, relationPath: "cd:hasKeyPoint" }] };
    const blocks = [prose("heading", "introduce"), points, prose("qualification")];
    const scene: Scene = { id: "opaque", source: [], blocks, readingOrder: blocks.map(b => b.id) };
    assert.equal(inferRevealCompositionPlan(scene).profile, "compact-list");
  }
});

test("teaching visual and media are adjacent surfaces without hero treatment", () => {
  const scene: Scene = {
    id: "opaque:illustrated-visual",
    source: [{ resourceId: "resource:illustrated-visual" }],
    blocks: [prose("heading", "introduce"), barChart("visual"), mediaReference("illustration")],
    readingOrder: ["heading", "visual", "illustration"],
  };
  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.kind, "learning-stage");
  assert.equal(plan.profile, "visual-media");
  assert.deepEqual(plan.placements.map(p => [p.blockId, p.region]), [
    ["heading", "heading"], ["visual", "primary"], ["illustration", "secondary"],
  ]);
});

test("supporting definition parts stay immediately below their formula with no identity selector", () => {
  const legend: SceneBlock = { ...definitions("symbols"), emphasis: "supporting",
    source: [{ resourceId: "resource:formula", relationPath: "dct:hasPart" }] };
  const scene: Scene = { id: "opaque:formula-parts", source: [],
    blocks: [prose("heading", "introduce"), math("formula"), legend],
    readingOrder: ["heading", "formula", "symbols"] };
  assert.equal(inferRevealCompositionPlan(scene).profile, "formula-deck");
  assert.deepEqual(resolveFormulaLegendUnits(scene).map(unit => unit.map(b => b.id)), [["formula", "symbols"]]);
  assert.deepEqual(inferRevealCompositionPlan({ ...scene, id: "unrelated" }), inferRevealCompositionPlan(scene));
});

test("adjacent singleton formula legends remain separate comparison units", () => {
  const singleton = (id: string, emphasis: "primary" | "supporting"): SceneBlock => {
    const block = definitions(id);
    assert.ok(block.kind === "definition-list");
    return { ...block, entries: block.entries.slice(0, 1), emphasis,
      ...(emphasis === "supporting" ? { source: [{ resourceId: `resource:${id.replace(/-legend$/u, "")}`, relationPath: "dct:hasPart" }] } : {}) };
  };
  const blocks = [prose("heading", "introduce"), singleton("context", "primary"),
    math("left"), singleton("left-legend", "supporting"),
    math("right"), singleton("right-legend", "supporting")];
  const scene: Scene = { id: "opaque:comparison", source: [], blocks, readingOrder: blocks.map(b => b.id) };
  const units = resolveFormulaLegendUnits(scene);
  assert.deepEqual(units.map(unit => unit.map(b => b.id)), [
    ["context", "left", "left-legend"], ["right", "right-legend"],
  ]);
  assert.equal(new Set(units.flat().map(b => b.id)).size, units.flat().length);
  assert.equal(inferRevealCompositionPlan(scene).mainCount, 2);
});

test("prompt illustration stays with the prompt before executable code", () => {
  const blocks: SceneBlock[] = [prose("heading", "introduce"), {
    id: "prompt", kind: "prompt", prompt: "Compute", responseMode: "free-text",
    source: [{ resourceId: "resource:prompt" }],
  }, mediaReference("illustration"), {
    id: "code", kind: "code", language: "r", code: "1+1", fallback: "1+1",
    editable: true, executable: true, source: [{ resourceId: "resource:code" }],
  }];
  const plan = inferRevealCompositionPlan({id: "opaque:illustrated-lab", source: [], blocks, readingOrder: blocks.map(b => b.id)});
  assert.equal(plan.profile, "prompt-code");
  assert.deepEqual(plan.placements.map(p => [p.blockId, p.region]), [
    ["heading", "heading"], ["prompt", "primary"], ["illustration", "primary"], ["code", "secondary"],
  ]);
});

test("prompt-code groups an authored CodeExample function legend in the code column", () => {
  const prompt: SceneBlock = { id: "prompt", kind: "prompt", prompt: "Practice", responseMode: "free-text",
    fallback: "Practice", source: [{ resourceId: "resource:prompt" }] };
  const code: SceneBlock = { id: "code", kind: "code", language: "r", code: "mean(x)", fallback: "mean(x)",
    editable: true, executable: true, source: [{ resourceId: "resource:code", relationPath: "cd:hasCodeExample" }] };
  const legend: SceneBlock = { ...definitions("functions"), emphasis: "supporting",
    source: [{ resourceId: "resource:code", relationPath: "dct:hasPart" }] };
  const blocks: SceneBlock[] = [prose("heading", "introduce"), prompt, code, legend];
  const scene: Scene = { id: "opaque:prompt-code-legend", source: [], blocks, readingOrder: blocks.map(b => b.id) };
  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.profile, "prompt-code");
  assert.deepEqual(plan.placements.filter(p => p.region === "secondary").map(p => p.blockId), ["code", "functions"]);
  assert.deepEqual(resolveCodeFunctionLegendUnits(scene).map(u => [u.code.id, u.legend.id]), [["code", "functions"]]);
});

test("table, result list, prompt, code and its authored functions infer a generic four-cell practice grid", () => {
  const code: SceneBlock = { id: "code", kind: "code", language: "r", code: "mean(x)", fallback: "mean(x)",
    editable: true, executable: true, source: [{ resourceId: "resource:code" }] };
  const legend: SceneBlock = { ...definitions("functions"), emphasis: "supporting",
    source: [{ resourceId: "resource:code", relationPath: "dct:hasPart" }] };
  const prompt: SceneBlock = { id: "prompt", kind: "prompt", prompt: "Calculate", responseMode: "free-text",
    fallback: "Calculate", source: [{ resourceId: "resource:prompt" }] };
  const blocks: SceneBlock[] = [prose("heading", "introduce"), {
    id: "results", kind: "list", listStyle: "unordered", items: [
      { id: "result-a", text: "A: 1", source: [{ resourceId: "resource:result-a" }] },
      { id: "result-b", text: "B: 2", source: [{ resourceId: "resource:result-b" }] },
    ], source: [{ resourceId: "resource:results" }],
  }, dataTable("table"), prompt, code, legend];
  const scene: Scene = { id: "opaque:practice-grid", source: [], blocks, readingOrder: blocks.map(b => b.id) };
  const plan = inferRevealCompositionPlan(scene);
  assert.equal(plan.profile, "evidence-practice-grid");
  assert.deepEqual(plan.placements.filter(p => p.region === "main").map(p => p.blockId),
    ["results", "table", "prompt", "code", "functions"]);
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

test("six free-text prompts reuse the identity-independent grid in semantic reading order", () => {
  for (const prefix of ["opaque:first", "unrelated:second"]) {
    const prompts: SceneBlock[] = Array.from({ length: 6 }, (_, index) => ({
      id: `${prefix}:${index}`, kind: "prompt", prompt: `Question ${index}`,
      responseMode: "free-text", expectedResult: `Answer ${index}`,
      source: [{ resourceId: `${prefix}:resource:${index}` }],
    }));
    const blocks = [prose("heading", "introduce"), ...prompts];
    const scene: Scene = { id: prefix, source: [], blocks: [...blocks].reverse(), readingOrder: blocks.map(b => b.id) };
    const plan = inferRevealCompositionPlan(scene);
    assert.equal(plan.kind, "learning-stage");
    assert.equal(plan.profile, "prompt-grid");
    assert.equal(plan.mainCount, 6);
    assert.deepEqual(plan.placements.slice(1).map(p => p.blockId), prompts.map(p => p.id));
    assert.deepEqual(plan.placements.slice(1).map(p => p.index), [0, 1, 2, 3, 4, 5]);
  }
});

test("illustrated prompts remain one grid card and one task-column unit independent of identity", () => {
  for (const prefix of ["opaque:x", "unrelated:y"]) {
    const groups: SceneBlock[] = Array.from({ length: 6 }, (_, index) => {
      const prompt: SceneBlock = { id: `${prefix}:prompt:${index}`, kind: "prompt", prompt: "A task",
        responseMode: "free-text", expectedResult: "An authored answer", source: [] };
      const media = mediaReference(`${prefix}:media:${index}`);
      return { id: `${prefix}:group:${index}`, kind: "group", children: [media, prompt],
        readingOrder: [prompt.id, media.id], source: [] };
    });
    const heading = prose("heading", "introduce");
    const blocks = [heading, ...groups];
    const grid = inferRevealCompositionPlan({ id: prefix, source: [], blocks, readingOrder: blocks.map(b => b.id) });
    assert.equal(grid.profile, "prompt-grid");
    assert.equal(grid.mainCount, 6);
    assert.deepEqual(grid.placements.slice(1).map(p => p.blockId), groups.map(b => b.id));
    const executable: SceneBlock = { id: "code", kind: "code", language: "r", code: "sum(1:3)",
      editable: true, executable: true, fallback: "sum(1:3)", source: [] };
    const lab = [heading, groups[0]!, executable];
    const workbench = inferRevealCompositionPlan({ id: prefix, source: [], blocks: lab, readingOrder: lab.map(b => b.id) });
    assert.equal(workbench.profile, "prompt-code");
    assert.equal(workbench.placements.find(p => p.blockId === groups[0]!.id)?.region, "primary");
  }
});

test("evidence pairs keep an authored supporting calculation in the data rail", () => {
  const formula = math("reference-calculation");
  const legend: SceneBlock = { ...definitions("reference-symbols"), emphasis: "supporting",
    source: [{ resourceId: formula.source[0]!.resourceId, relationPath: "dct:hasPart" }] };
  const blocks = [prose("heading", "introduce"), prose("context", "explain"), formula, legend, dataTable("table"), barChart("chart")];
  const plan = inferRevealCompositionPlan({ id: "opaque:measurement-reference", source: [], blocks, readingOrder: blocks.map(b => b.id) });
  assert.equal(plan.kind, "evidence-stage");
  assert.equal(plan.profile, "data-visual");
  assert.equal(plan.placements.find(p => p.blockId === formula.id)?.region, "prelude");
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


test("composition policy owns region-container projection topology", () => {
  const placement = (
    blockId: string,
    region: RevealCompositionPlacement["region"],
  ): RevealCompositionPlacement => ({ blockId, region, index: 0 });
  const plan = (
    kind: RevealCompositionPlan["kind"],
    profile?: RevealCompositionPlan["profile"],
  ): RevealCompositionPlan => profile
    ? { kind, profile, mainCount: 1, placements: [] }
    : { kind, mainCount: 1, placements: [] };

  assert.equal(
    shouldWrapRevealCompositionPlacement(plan("learning-stage", "statement-support"), placement("heading", "heading")),
    false,
  );
  assert.equal(
    shouldWrapRevealCompositionPlacement(plan("stack"), placement("body", "main")),
    false,
  );
  assert.equal(
    shouldWrapRevealCompositionPlacement(plan("semantic-stage", "source"), placement("source", "main")),
    false,
  );
  assert.equal(
    shouldWrapRevealCompositionPlacement(plan("media-stage", "hero-attributions"), placement("primary", "primary")),
    false,
  );
  assert.equal(
    shouldWrapRevealCompositionPlacement(plan("evidence-stage", "context-data-visual"), placement("support", "support")),
    false,
  );
  assert.equal(
    shouldWrapRevealCompositionPlacement(plan("evidence-stage", "context-data-visual"), placement("data", "main")),
    true,
  );
  assert.equal(
    shouldWrapRevealCompositionPlacement(plan("progression-stage", "compact-linear"), placement("process", "main")),
    true,
  );
  assert.equal(
    shouldWrapRevealCompositionPlacement(plan("visual-stage", "diagram"), placement("diagram", "main")),
    true,
  );
});

test("math followed by an authored definition legend selects the generic formula-legend profile", () => {
  const scene: Scene = {
    id: "opaque:math-and-symbols",
    source: [{ resourceId: "resource:math-and-symbols" }],
    blocks: [prose("heading", "introduce"), math("formula"), definitions("symbols")],
    readingOrder: ["heading", "formula", "symbols"],
  };
  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "learning-stage",
    profile: "formula-legend",
    mainCount: 1,
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "formula", region: "prelude", index: 0 },
      { blockId: "symbols", region: "main", index: 0 },
    ],
  });
});

test("diagram with explanatory takeaway keeps reusable visual-stage diagram/footer composition", () => {
  const scene: Scene = {
    id: "opaque:hierarchy", source: [{ resourceId: "resource:hierarchy" }],
    blocks: [prose("heading", "introduce"), flowDiagram("hierarchy"), prose("takeaway", "explain")],
    readingOrder: ["heading", "hierarchy", "takeaway"],
  };
  assert.deepEqual(inferRevealCompositionPlan(scene), {
    kind: "visual-stage", profile: "diagram", mainCount: 1,
    placements: [
      { blockId: "heading", region: "heading", index: 0 },
      { blockId: "hierarchy", region: "main", index: 0 },
      { blockId: "takeaway", region: "footer", index: 0 },
    ],
  });
});
