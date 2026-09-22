import assert from "node:assert/strict";
import test from "node:test";

import type { Scene } from "../../core/src/scene-document.ts";
import { inferRevealLayoutDecision, inferRevealLayoutFamily } from "../src/layout-policy.ts";

function prose(id: string, intent: "introduce" | "explain") {
  return {
    id,
    kind: "prose" as const,
    text: id,
    intent: { kind: intent } as const,
    source: [{ resourceId: `resource:${id}` }],
  };
}

function threeCardScene(id: string, itemCount = 3): Scene {
  return {
    id,
    source: [{ resourceId: `${id}:source` }],
    blocks: [
      prose(`${id}:heading`, "introduce"),
      {
        id: `${id}:cards`,
        kind: "list",
        listStyle: "unordered",
        items: Array.from({ length: itemCount }, (_, index) => ({
          id: `item:${index + 1}`,
          text: `Card ${index + 1}`,
          source: [{ resourceId: `resource:item:${index + 1}` }],
        })),
        intent: { kind: "explain" },
        source: [{ resourceId: "resource:cards" }],
      },
      prose(`${id}:takeaway`, "explain"),
    ],
    readingOrder: [`${id}:heading`, `${id}:cards`, `${id}:takeaway`],
  };
}

function hierarchyScene(id: string): Scene {
  return {
    id,
    source: [{ resourceId: "resource:hierarchy-scene" }],
    blocks: [
      prose("block:heading", "introduce"),
      prose("block:intro", "explain"),
      {
        id: "block:diagram",
        kind: "diagram",
        diagramType: "flow",
        label: "Opaque hierarchy",
        description: "Opaque hierarchy description",
        nodes: [
          { id: "node:a", label: "A", source: [{ resourceId: "resource:a" }] },
          { id: "node:b", label: "B", source: [{ resourceId: "resource:b" }] },
          { id: "node:c", label: "C", source: [{ resourceId: "resource:c" }] },
        ],
        edges: [
          { id: "edge:ab", sourceNodeId: "node:a", targetNodeId: "node:b", label: "x", source: [{ resourceId: "resource:ab" }] },
          { id: "edge:bc", sourceNodeId: "node:b", targetNodeId: "node:c", label: "y", source: [{ resourceId: "resource:bc" }] },
        ],
        source: [{ resourceId: "resource:diagram" }],
      },
      prose("block:takeaway", "explain"),
    ],
    readingOrder: ["block:heading", "block:intro", "block:diagram", "block:takeaway"],
  };
}

function referenceCodeScene(id: string): Scene {
  return {
    id,
    source: [{ resourceId: "resource:reference-scene" }],
    blocks: [
      prose("block:heading", "introduce"),
      prose("block:banner", "explain"),
      {
        id: "block:terms",
        kind: "list",
        listStyle: "unordered",
        items: Array.from({ length: 6 }, (_, index) => ({
          id: `item:${index + 1}`,
          text: `Term ${index + 1}`,
          source: [{ resourceId: `resource:term:${index + 1}` }],
        })),
        source: [{ resourceId: "resource:terms" }],
      },
      prose("block:code-label", "explain"),
      {
        id: "block:code",
        kind: "code",
        language: "text",
        code: "opaque",
        fallback: "opaque",
        editable: false,
        executable: false,
        source: [{ resourceId: "resource:code" }],
      },
      prose("block:reading", "explain"),
    ],
    readingOrder: ["block:heading", "block:banner", "block:terms", "block:code-label", "block:code", "block:reading"],
  };
}

function dataExplanationScene(id: string): Scene {
  return {
    id,
    source: [{ resourceId: "resource:data-explanation" }],
    blocks: [
      prose("block:heading", "introduce"),
      {
        id: "block:principles",
        kind: "list",
        listStyle: "unordered",
        items: Array.from({ length: 4 }, (_, index) => ({
          id: `principle:${index + 1}`,
          text: `Principle ${index + 1}`,
          source: [{ resourceId: `resource:principle:${index + 1}` }],
        })),
        source: [{ resourceId: "resource:principles" }],
      },
      {
        id: "block:table",
        kind: "table",
        caption: "Opaque table",
        description: "Opaque description",
        columns: [
          { id: "column:a", label: "A", source: [{ resourceId: "resource:column:a" }] },
          { id: "column:b", label: "B", source: [{ resourceId: "resource:column:b" }] },
        ],
        rows: [{
          id: "row:1",
          source: [{ resourceId: "resource:row:1" }],
          cells: [
            { id: "cell:1:a", text: "a1", source: [{ resourceId: "resource:cell:1:a" }] },
            { id: "cell:1:b", text: "b1", source: [{ resourceId: "resource:cell:1:b" }] },
          ],
        }],
        source: [{ resourceId: "resource:table" }],
      },
    ],
    readingOrder: ["block:heading", "block:principles", "block:table"],
  };
}

function analysisResultScene(id: string): Scene {
  return {
    id,
    source: [{ resourceId: "resource:analysis-result" }],
    blocks: [
      prose("block:heading", "introduce"),
      {
        id: "block:signal",
        kind: "chart",
        chartType: "line",
        label: "Opaque signal",
        description: "Opaque chart",
        xAxis: { label: "x" },
        yAxis: { label: "y" },
        series: [{
          id: "series:1",
          label: "Series",
          data: [
            { id: "datum:1", x: 0, y: 1, source: [{ resourceId: "resource:datum:1" }] },
            { id: "datum:2", x: 1, y: 2, source: [{ resourceId: "resource:datum:2" }] },
          ],
          source: [{ resourceId: "resource:series" }],
        }],
        source: [{ resourceId: "resource:chart" }],
      },
      {
        id: "block:results",
        kind: "table",
        caption: "Opaque results",
        columns: [
          { id: "column:a", label: "A", source: [{ resourceId: "resource:column:a" }] },
          { id: "column:b", label: "B", source: [{ resourceId: "resource:column:b" }] },
        ],
        rows: [{
          id: "row:1",
          source: [{ resourceId: "resource:row:1" }],
          cells: [
            { id: "cell:a", text: "alpha", source: [{ resourceId: "resource:cell:a" }] },
            { id: "cell:b", text: "beta", source: [{ resourceId: "resource:cell:b" }] },
          ],
        }],
        source: [{ resourceId: "resource:table" }],
      },
      {
        id: "block:process",
        kind: "diagram",
        diagramType: "flow",
        label: "Opaque process",
        description: "Opaque flow",
        nodes: [
          { id: "node:a", label: "A", source: [{ resourceId: "resource:node:a" }] },
          { id: "node:b", label: "B", source: [{ resourceId: "resource:node:b" }] },
        ],
        edges: [{
          id: "edge:ab",
          sourceNodeId: "node:a",
          targetNodeId: "node:b",
          label: "to",
          source: [{ resourceId: "resource:edge:ab" }],
        }],
        source: [{ resourceId: "resource:diagram" }],
      },
    ],
    readingOrder: ["block:heading", "block:signal", "block:results", "block:process"],
  };
}

test("infers concept-specification from structure without scene identity", () => {
  assert.equal(inferRevealLayoutFamily(threeCardScene("scene:alpha")), "concept-specification");
  assert.equal(inferRevealLayoutFamily(threeCardScene("completely:different:id")), "concept-specification");
  assert.deepEqual(inferRevealLayoutDecision(threeCardScene("scene:slots"))?.slots, ["heading", "cards", "takeaway"]);
});

test("does not infer concept-specification from an arbitrary keypoint list", () => {
  assert.equal(inferRevealLayoutFamily(threeCardScene("scene:two-cards", 2)), undefined);
});

function processContextScene(id: string): Scene {
  const definitionList = (blockId: string) => ({
    id: blockId,
    kind: "definition-list" as const,
    entries: Array.from({ length: 6 }, (_, index) => ({
      id: `${blockId}:entry:${index + 1}`,
      term: `Term ${index + 1}`,
      description: `Description ${index + 1}`,
      source: [{ resourceId: `resource:${blockId}:${index + 1}` }],
    })),
    source: [{ resourceId: `resource:${blockId}` }],
  });
  return {
    id,
    source: [{ resourceId: "resource:process-context-scene" }],
    blocks: [
      prose("block:heading", "introduce"),
      {
        id: "block:diagram",
        kind: "diagram",
        diagramType: "flow",
        label: "Opaque process",
        description: "Opaque process description",
        nodes: [
          { id: "node:a", label: "A", source: [{ resourceId: "resource:a" }] },
          { id: "node:b", label: "B", source: [{ resourceId: "resource:b" }] },
          { id: "node:c", label: "C", source: [{ resourceId: "resource:c" }] },
        ],
        edges: [
          { id: "edge:ab", sourceNodeId: "node:a", targetNodeId: "node:b", label: "x", source: [{ resourceId: "resource:ab" }] },
          { id: "edge:bc", sourceNodeId: "node:b", targetNodeId: "node:c", label: "y", source: [{ resourceId: "resource:bc" }] },
        ],
        source: [{ resourceId: "resource:diagram" }],
      },
      prose("block:example-heading", "explain"),
      definitionList("block:example-definitions"),
      prose("block:example-note", "explain"),
      prose("block:context-heading", "explain"),
      definitionList("block:context-definitions"),
    ],
    readingOrder: [
      "block:heading",
      "block:diagram",
      "block:example-heading",
      "block:example-definitions",
      "block:example-note",
      "block:context-heading",
      "block:context-definitions",
    ],
  };
}

test("infers a linear three-level hierarchy from diagram topology rather than identity", () => {
  assert.equal(inferRevealLayoutFamily(hierarchyScene("scene:alpha")), "hierarchy-flow");
  assert.equal(inferRevealLayoutFamily(hierarchyScene("totally:opaque")), "hierarchy-flow");
  assert.deepEqual(inferRevealLayoutDecision(hierarchyScene("scene:slots"))?.slots, ["heading", "intro", "diagram", "takeaway"]);
});

test("infers reusable reference-code composition without inspecting labels or language", () => {
  assert.equal(inferRevealLayoutFamily(referenceCodeScene("scene:alpha")), "reference-code");
  assert.equal(inferRevealLayoutFamily(referenceCodeScene("totally:opaque")), "reference-code");
  assert.deepEqual(inferRevealLayoutDecision(referenceCodeScene("scene:slots"))?.slots, ["heading", "banner", "terms", "code-label", "code", "reading"]);
});


test("infers process-context from diagram and definition-list structure without identity", () => {
  assert.equal(inferRevealLayoutFamily(processContextScene("scene:alpha")), "process-context");
  assert.equal(inferRevealLayoutFamily(processContextScene("opaque:scene")), "process-context");
  assert.deepEqual(inferRevealLayoutDecision(processContextScene("scene:slots"))?.slots, [
    "heading",
    "diagram",
    "example-heading",
    "example-definitions",
    "example-note",
    "context-heading",
    "context-definitions",
  ]);
});


test("infers data-explanation from list and table structure without identity", () => {
  assert.equal(inferRevealLayoutFamily(dataExplanationScene("scene:alpha")), "data-explanation");
  assert.equal(inferRevealLayoutFamily(dataExplanationScene("opaque:scene")), "data-explanation");
  assert.deepEqual(inferRevealLayoutDecision(dataExplanationScene("scene:slots"))?.slots, [
    "heading",
    "principles",
    "table",
  ]);
});


test("infers analysis-result from chart table and flow without identity", () => {
  assert.equal(inferRevealLayoutFamily(analysisResultScene("scene:alpha")), "analysis-result");
  assert.equal(inferRevealLayoutFamily(analysisResultScene("opaque:scene")), "analysis-result");
  assert.deepEqual(inferRevealLayoutDecision(analysisResultScene("scene:slots"))?.slots, [
    "heading",
    "signal",
    "results",
    "process",
  ]);
});
