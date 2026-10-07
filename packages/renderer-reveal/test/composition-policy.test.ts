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
  assert.equal(inferRevealCompositionPlan(scene).mainProfile, "formula-visual");
});
