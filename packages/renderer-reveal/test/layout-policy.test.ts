import assert from "node:assert/strict";
import test from "node:test";

import type { Scene } from "../../core/src/scene-document.ts";
import { inferRevealLayoutDecision, inferRevealLayoutFamily } from "../src/layout-policy.ts";

function prose(id: string, intent: "introduce" | "explain" | "emphasize") {
  return {
    id,
    kind: "prose" as const,
    text: id,
    intent: { kind: intent } as const,
    source: [{ resourceId: `resource:${id}` }],
  };
}

function definitionCardScene(id: string): Scene {
  return {
    id,
    source: [{ resourceId: `${id}:source` }],
    blocks: [
      prose(`${id}:heading`, "introduce"),
      prose(`${id}:definition`, "explain"),
      prose(`${id}:citation`, "emphasize"),
    ],
    readingOrder: [`${id}:heading`, `${id}:definition`, `${id}:citation`],
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

function promptCardScene(id: string, entryCount = 3): Scene {
  return {
    id,
    source: [{ resourceId: `${id}:source` }],
    blocks: [
      prose(`${id}:heading`, "introduce"),
      {
        id: `${id}:cards`,
        kind: "definition-list",
        entries: Array.from({ length: entryCount }, (_, index) => ({
          id: `prompt:${index + 1}`,
          term: `Prompt ${index + 1}`,
          description: `Short anchor ${index + 1}`,
          source: [{ resourceId: `resource:prompt:${index + 1}` }],
        })),
        intent: { kind: "explain" },
        source: [{ resourceId: "resource:prompt-cards" }],
      },
    ],
    readingOrder: [`${id}:heading`, `${id}:cards`],
  };
}

function labeledCardScene(id: string, entryCount = 3): Scene {
  return {
    id,
    source: [{ resourceId: `${id}:source` }],
    blocks: [
      prose(`${id}:heading`, "introduce"),
      {
        id: `${id}:cards`,
        kind: "definition-list",
        entries: Array.from({ length: entryCount }, (_, index) => ({
          id: `entry:${index + 1}`,
          term: `Facet ${index + 1}`,
          description: `Description ${index + 1}`,
          source: [{ resourceId: `resource:entry:${index + 1}` }],
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

function caseStudyScene(id: string): Scene {
  const problemText = prose("block:problem-text", "explain");
  const problem = {
    id: "block:problem",
    kind: "group" as const,
    children: [
      problemText,
      {
        id: "block:problem-media",
        kind: "media-reference" as const,
        uri: "/assets/sample.svg",
        mediaType: "image/svg+xml",
        alternativeText: "Illustrative samples",
        source: [{ resourceId: "resource:sample-media" }],
      },
    ],
    readingOrder: ["block:problem-text", "block:problem-media"],
    source: [{ resourceId: "resource:problem" }],
  };
  const data = {
    id: "block:data",
    kind: "table" as const,
    caption: "Illustrative data",
    columns: [
      { id: "column:sample", label: "Sample", source: [{ resourceId: "resource:column:sample" }] },
      { id: "column:value", label: "Value", source: [{ resourceId: "resource:column:value" }] },
    ],
    rows: [{
      id: "row:1",
      source: [{ resourceId: "resource:row:1" }],
      cells: [
        { id: "cell:sample", text: "A", source: [{ resourceId: "resource:cell:sample" }] },
        { id: "cell:value", text: "1.0", source: [{ resourceId: "resource:cell:value" }] },
      ],
    }],
    source: [{ resourceId: "resource:data" }],
  };
  const analysis = {
    id: "block:analysis",
    kind: "chart" as const,
    chartType: "bar" as const,
    label: "Illustrative analysis",
    description: "Three means",
    xAxis: { label: "Sample" },
    yAxis: { label: "Mean" },
    data: [
      { id: "datum:a", category: "A", value: 1, source: [{ resourceId: "resource:datum:a" }] },
      { id: "datum:b", category: "B", value: 2, source: [{ resourceId: "resource:datum:b" }] },
      { id: "datum:c", category: "C", value: 3, source: [{ resourceId: "resource:datum:c" }] },
    ],
    source: [{ resourceId: "resource:analysis" }],
  };
  const discussion = {
    id: "block:discussion",
    kind: "list" as const,
    listStyle: "unordered" as const,
    items: Array.from({ length: 3 }, (_, index) => ({
      id: `discussion:${index + 1}`,
      text: `Observation ${index + 1}`,
      source: [{ resourceId: `resource:discussion:${index + 1}` }],
    })),
    source: [{ resourceId: "resource:discussion" }],
  };
  return {
    id,
    source: [{ resourceId: "resource:case-study" }],
    blocks: [
      prose("block:heading", "introduce"),
      problem,
      data,
      analysis,
      discussion,
      prose("block:takeaway", "explain"),
    ],
    readingOrder: [
      "block:heading",
      "block:problem",
      "block:data",
      "block:analysis",
      "block:discussion",
      "block:takeaway",
    ],
  };
}

function cardSequenceScene(id: string): Scene {
  return {
    id,
    source: [{ resourceId: "resource:card-sequence" }],
    blocks: [
      prose("block:heading", "introduce"),
      prose("block:banner", "explain"),
      {
        id: "block:cards",
        kind: "list",
        listStyle: "unordered",
        items: Array.from({ length: 3 }, (_, index) => ({
          id: `card:${index + 1}`,
          text: `Card ${index + 1}`,
          source: [{ resourceId: `resource:card:${index + 1}` }],
        })),
        source: [{ resourceId: "resource:cards" }],
      },
      prose("block:takeaway", "explain"),
    ],
    readingOrder: ["block:heading", "block:banner", "block:cards", "block:takeaway"],
  };
}

function textNetworkScene(id: string): Scene {
  return {
    id,
    source: [{ resourceId: "resource:text-network" }],
    blocks: [
      prose("block:heading", "introduce"),
      prose("block:banner", "explain"),
      {
        id: "block:views",
        kind: "list",
        listStyle: "unordered",
        items: [
          { id: "view:1", text: "First representation", source: [{ resourceId: "resource:view:1" }] },
          { id: "view:2", text: "Second representation", source: [{ resourceId: "resource:view:2" }] },
        ],
        source: [{ resourceId: "resource:views" }],
      },
      {
        id: "block:network",
        kind: "diagram",
        diagramType: "network",
        label: "Opaque network",
        description: "Opaque network description",
        nodes: [
          { id: "node:a", label: "A", source: [{ resourceId: "resource:a" }] },
          { id: "node:b", label: "B", source: [{ resourceId: "resource:b" }] },
          { id: "node:c", label: "C", source: [{ resourceId: "resource:c" }] },
        ],
        edges: [
          { id: "edge:ab", sourceNodeId: "node:a", targetNodeId: "node:b", label: "r1", source: [{ resourceId: "resource:ab" }] },
          { id: "edge:ac", sourceNodeId: "node:a", targetNodeId: "node:c", label: "r2", source: [{ resourceId: "resource:ac" }] },
          { id: "edge:cb", sourceNodeId: "node:c", targetNodeId: "node:b", label: "r3", source: [{ resourceId: "resource:cb" }] },
        ],
        source: [{ resourceId: "resource:network" }],
      },
      prose("block:takeaway", "explain"),
    ],
    readingOrder: ["block:heading", "block:banner", "block:views", "block:network", "block:takeaway"],
  };
}

function concentricNetworkScene(id: string): Scene {
  return {
    id,
    source: [{ resourceId: "resource:radial-scene" }],
    blocks: [
      prose("block:heading", "introduce"),
      {
        id: "block:network",
        kind: "diagram",
        diagramType: "network",
        label: "Opaque grouped network",
        description: "Opaque grouped network description",
        focusNodeId: "node:focus",
        groups: [
          { id: "group:a", label: "A", source: [{ resourceId: "resource:group:a" }] },
          { id: "group:b", label: "B", source: [{ resourceId: "resource:group:b" }] },
        ],
        nodes: [
          { id: "node:focus", label: "Focus", source: [{ resourceId: "resource:focus" }] },
          { id: "node:a", label: "A", groupIds: ["group:a"], source: [{ resourceId: "resource:a" }] },
          { id: "node:b", label: "B", groupIds: ["group:b"], source: [{ resourceId: "resource:b" }] },
        ],
        edges: [],
        source: [{ resourceId: "resource:network" }],
      },
    ],
    readingOrder: ["block:heading", "block:network"],
  };
}

test("infers concentric-network from focused grouped topology without scene identity", () => {
  assert.equal(inferRevealLayoutFamily(concentricNetworkScene("scene:alpha")), "concentric-network");
  assert.equal(inferRevealLayoutFamily(concentricNetworkScene("opaque:scene")), "concentric-network");
  assert.deepEqual(inferRevealLayoutDecision(concentricNetworkScene("scene:slots"))?.slots, ["heading", "network"]);
});

test("infers prompt-card-grid from heading plus three concise definition entries without identity", () => {
  assert.equal(inferRevealLayoutFamily(promptCardScene("scene:prompt")), "prompt-card-grid");
  assert.equal(inferRevealLayoutFamily(promptCardScene("opaque:prompt")), "prompt-card-grid");
  assert.deepEqual(inferRevealLayoutDecision(promptCardScene("scene:prompt-slots"))?.slots, ["heading", "cards"]);
  assert.equal(inferRevealLayoutFamily(promptCardScene("scene:prompt-four", 4)), undefined);
});

test("infers labeled-card-grid from three labeled facets without scene identity", () => {
  assert.equal(inferRevealLayoutFamily(labeledCardScene("scene:alpha")), "labeled-card-grid");
  assert.equal(inferRevealLayoutFamily(labeledCardScene("opaque:anything")), "labeled-card-grid");
  assert.deepEqual(inferRevealLayoutDecision(labeledCardScene("scene:slots"))?.slots, ["heading", "cards", "takeaway"]);
  assert.equal(inferRevealLayoutFamily(labeledCardScene("scene:four-facets", 4)), undefined);
});

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

function attributionGroup(id: string): Scene["blocks"][number] {
  return {
    id,
    kind: "group",
    children: [
      {
        id: `${id}:text`,
        kind: "prose",
        text: `${id}:text`,
        intent: { kind: "emphasize" },
        emphasis: "supporting",
        source: [{ resourceId: `resource:${id}:text` }],
      },
      {
        id: `${id}:media`,
        kind: "media-reference",
        uri: "/assets/logo.svg",
        mediaType: "image/svg+xml",
        alternativeText: "Organization logo",
        intent: { kind: "emphasize" },
        emphasis: "supporting",
        source: [{ resourceId: `resource:${id}:media` }],
      },
    ],
    readingOrder: [`${id}:text`, `${id}:media`],
    intent: { kind: "emphasize" },
    emphasis: "supporting",
    source: [{ resourceId: `resource:${id}` }],
  };
}

function titleAttributionsScene(id: string): Scene {
  return {
    id,
    source: [{ resourceId: "resource:title" }],
    blocks: [
      prose("title:heading", "introduce"),
      attributionGroup("title:primary"),
      attributionGroup("title:secondary"),
      attributionGroup("title:supporting"),
    ],
    readingOrder: ["title:heading", "title:primary", "title:secondary", "title:supporting"],
  };
}

function semanticSourceScene(id: string, includeChart = false): Scene {
  const blocks: Array<Scene["blocks"][number]> = [
    prose("semantic:heading", "introduce"),
    {
      id: "semantic:code",
      kind: "code",
      language: "trig",
      code: "ex:a ex:b ex:c .",
      fallback: "ex:a ex:b ex:c .",
      editable: false,
      executable: false,
      source: [{ resourceId: "resource:semantic-code" }],
    },
  ];
  if (includeChart) {
    blocks.push({
      id: "semantic:chart",
      kind: "chart",
      chartType: "bar",
      label: "Opaque chart",
      description: "Opaque chart description",
      xAxis: { label: "x" },
      yAxis: { label: "y" },
      data: [{ id: "datum:1", category: "A", value: 1, source: [{ resourceId: "resource:datum" }] }],
      source: [{ resourceId: "resource:chart" }],
    });
  }
  return {
    id,
    source: [{ resourceId: "resource:semantic-scene" }],
    blocks,
    readingOrder: blocks.map((block) => block.id),
  };
}

function diagramStageScene(id: string): Scene {
  return {
    id,
    source: [{ resourceId: "resource:diagram-stage" }],
    blocks: [
      prose("diagram:heading", "introduce"),
      {
        id: "diagram:body",
        kind: "diagram",
        diagramType: "flow",
        label: "Opaque diagram",
        description: "Opaque diagram",
        nodes: [
          { id: "node:a", label: "A", source: [{ resourceId: "resource:a" }] },
          { id: "node:b", label: "B", source: [{ resourceId: "resource:b" }] },
        ],
        edges: [
          { id: "edge:ab", sourceNodeId: "node:a", targetNodeId: "node:b", label: "next", source: [{ resourceId: "resource:ab" }] },
        ],
        source: [{ resourceId: "resource:diagram" }],
      },
    ],
    readingOrder: ["diagram:heading", "diagram:body"],
  };
}

function fullMediaScene(id: string, mediaType: string): Scene {
  return {
    id,
    source: [{ resourceId: "resource:full-media-scene" }],
    blocks: [
      prose("block:heading", "introduce"),
      {
        id: "block:media-group",
        kind: "group",
        source: [{ resourceId: "resource:media-group" }],
        children: [
          prose("block:description", "explain"),
          {
            id: "block:media",
            kind: "media-reference",
            uri: "/assets/demo",
            mediaType,
            alternativeText: "Demonstration media",
            source: [{ resourceId: "resource:media" }],
          },
        ],
        readingOrder: ["block:description", "block:media"],
      },
    ],
    readingOrder: ["block:heading", "block:media-group"],
  };
}

function foundationCardGridScene(id: string): Scene {
  return {
    id,
    source: [{ resourceId: "resource:foundation-card-grid-scene" }],
    blocks: [
      prose("block:heading", "introduce"),
      prose("block:banner", "explain"),
      prose("block:foundation", "explain"),
      {
        id: "block:cards",
        kind: "definition-list",
        entries: Array.from({ length: 5 }, (_, index) => ({
          id: `entry:${index + 1}`,
          term: `Module ${index + 1}`,
          description: `Capability ${index + 1}`,
          source: [{ resourceId: `resource:entry:${index + 1}` }],
        })),
        source: [{ resourceId: "resource:cards" }],
      },
      prose("block:takeaway", "explain"),
    ],
    readingOrder: ["block:heading", "block:banner", "block:foundation", "block:cards", "block:takeaway"],
  };
}

function pairedInfoCardsScene(id: string, includeTakeaway = true): Scene {
  return {
    id,
    source: [{ resourceId: "resource:paired-info-scene" }],
    blocks: [
      prose("block:heading", "introduce"),
      prose("block:intro", "explain"),
      {
        id: "block:cards",
        kind: "definition-list",
        entries: [0, 1].map((index) => ({
          id: `entry:${index + 1}`,
          term: `Option ${index + 1}`,
          description: `Metadata ${index + 1}\nMode ${index + 1}\nDetails ${index + 1}`,
          source: [{ resourceId: `resource:entry:${index + 1}` }],
        })),
        source: [{ resourceId: "resource:cards" }],
        intent: { kind: "explain" },
      },
      ...(includeTakeaway ? [prose("block:takeaway", "explain")] : []),
    ],
    readingOrder: [
      "block:heading",
      "block:intro",
      "block:cards",
      ...(includeTakeaway ? ["block:takeaway"] : []),
    ],
  };
}

function processDiagramScene(id: string, diagramType: "flow" | "sequence", nodeCount = 4): Scene {
  const diagram = diagramType === "flow"
    ? {
        id: "block:diagram",
        kind: "diagram" as const,
        diagramType: "flow" as const,
        label: "Opaque process",
        description: "Opaque process",
        nodes: Array.from({ length: nodeCount }, (_, index) => ({ id: `node:${index}`, label: `Step ${index + 1}`, source: [{ resourceId: `resource:node:${index}` }] })),
        edges: Array.from({ length: Math.max(0, nodeCount - 1) }, (_, index) => ({ id: `edge:${index}`, sourceNodeId: `node:${index}`, targetNodeId: `node:${index + 1}`, label: "next", source: [{ resourceId: `resource:edge:${index}` }] })),
        source: [{ resourceId: "resource:diagram" }],
      }
    : {
        id: "block:diagram",
        kind: "diagram" as const,
        diagramType: "sequence" as const,
        label: "Opaque service",
        description: "Opaque service",
        nodes: [],
        edges: [],
        participantRoles: [
          { id: "role:a", label: "A", source: [{ resourceId: "resource:role:a" }] },
          { id: "role:b", label: "B", source: [{ resourceId: "resource:role:b" }] },
        ],
        messages: [
          { id: "message:a", sourceRoleId: "role:a", targetRoleId: "role:b", label: "call", source: [{ resourceId: "resource:message:a" }] },
        ],
        states: [],
        source: [{ resourceId: "resource:diagram" }],
      };
  return {
    id,
    source: [{ resourceId: "resource:process-scene" }],
    blocks: [
      prose("block:heading", "introduce"),
      prose("block:intro", "explain"),
      diagram,
      prose("block:takeaway", "explain"),
    ],
    readingOrder: ["block:heading", "block:intro", "block:diagram", "block:takeaway"],
  };
}

test("infers hero-title-panel, semantic runtimes and diagram-stage without identity", () => {
  assert.equal(inferRevealLayoutFamily(titleAttributionsScene("opaque:title")), "hero-title-panel");
  assert.deepEqual(inferRevealLayoutDecision(titleAttributionsScene("opaque:title-slots"))?.slots, [
    "heading", "primary-attribution", "secondary-attribution", "supporting-attribution",
  ]);
  assert.equal(inferRevealLayoutFamily(semanticSourceScene("opaque:source")), "semantic-source");
  assert.equal(inferRevealLayoutFamily(semanticSourceScene("opaque:multi", true)), "semantic-multi-view");
  assert.equal(inferRevealLayoutFamily(diagramStageScene("opaque:diagram")), "diagram-stage");
});

test("infers centered definition-card from heading, definition prose and citation without identity", () => {
  assert.equal(inferRevealLayoutFamily(definitionCardScene("scene:definition")), "definition-card");
  assert.equal(inferRevealLayoutFamily(definitionCardScene("opaque:definition")), "definition-card");
  assert.deepEqual(inferRevealLayoutDecision(definitionCardScene("scene:definition-slots"))?.slots, [
    "heading", "definition", "citation",
  ]);
});

test("infers generic closing from a single authored heading", () => {
  const scene: Scene = {
    id: "opaque:closing",
    source: [{ resourceId: "resource:closing" }],
    blocks: [prose("block:heading", "introduce")],
    readingOrder: ["block:heading"],
  };
  assert.equal(inferRevealLayoutFamily(scene), "closing");
  assert.deepEqual(inferRevealLayoutDecision(scene)?.slots, ["heading"]);
});

test("infers full-media from heading plus one prose/media group without identity", () => {
  assert.equal(inferRevealLayoutFamily(fullMediaScene("scene:image", "image/png")), "full-media");
  assert.equal(inferRevealLayoutFamily(fullMediaScene("opaque:video", "video/mp4")), "full-media");
  assert.deepEqual(inferRevealLayoutDecision(fullMediaScene("scene:slots", "video/webm"))?.slots, ["heading", "media"]);
});

test("infers foundation-card-grid from structured definition entries without identity", () => {
  assert.equal(inferRevealLayoutFamily(foundationCardGridScene("scene:alpha")), "foundation-card-grid");
  assert.equal(inferRevealLayoutFamily(foundationCardGridScene("opaque:scene")), "foundation-card-grid");
  assert.deepEqual(inferRevealLayoutDecision(foundationCardGridScene("scene:slots"))?.slots, [
    "heading", "banner", "foundation", "cards", "takeaway",
  ]);
});

test("infers paired-info-cards from two labeled entries with optional takeaway", () => {
  assert.equal(inferRevealLayoutFamily(pairedInfoCardsScene("scene:alpha")), "paired-info-cards");
  assert.equal(inferRevealLayoutFamily(pairedInfoCardsScene("opaque:pair", false)), "paired-info-cards");
  assert.deepEqual(inferRevealLayoutDecision(pairedInfoCardsScene("scene:slots"))?.slots, [
    "heading", "intro", "cards", "takeaway",
  ]);
  assert.deepEqual(inferRevealLayoutDecision(pairedInfoCardsScene("scene:no-takeaway", false))?.slots, [
    "heading", "intro", "cards",
  ]);
});

test("infers generic process-diagram for longer flows and sequence diagrams", () => {
  assert.equal(inferRevealLayoutFamily(processDiagramScene("scene:flow", "flow", 4)), "process-diagram");
  assert.equal(inferRevealLayoutFamily(processDiagramScene("opaque:service", "sequence")), "process-diagram");
  assert.deepEqual(inferRevealLayoutDecision(processDiagramScene("scene:slots", "flow", 4))?.slots, ["heading", "intro", "diagram", "takeaway"]);
});

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


test("infers lecture-scale case-study without a separate takeaway micro-region", () => {
  const original = caseStudyScene("scene:lecture-case");
  const blocks = original.blocks.slice(0, 5);
  const scene = {
    ...original,
    blocks,
    readingOrder: blocks.map((block) => block.id),
  };
  const decision = inferRevealLayoutDecision(scene);
  assert.equal(decision?.family, "case-study");
  assert.deepEqual(decision?.slots, ["heading", "problem", "data", "analysis", "discussion"]);
});

test("infers generic case-study from image problem, table, chart and discussion without identity", () => {
  assert.equal(inferRevealLayoutFamily(caseStudyScene("scene:case-study")), "case-study");
  assert.equal(inferRevealLayoutFamily(caseStudyScene("opaque:anything")), "case-study");
  assert.deepEqual(inferRevealLayoutDecision(caseStudyScene("scene:slots"))?.slots, [
    "heading", "problem", "data", "analysis", "discussion", "takeaway",
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


test("process-context supports longer linear flows without introducing a new layout identity", () => {
  const scene = structuredClone(processContextScene("scene:four-node-flow")) as Scene & { blocks: any[] };
  const diagram = scene.blocks[1];
  if (diagram.kind !== "diagram") throw new Error("expected diagram");
  diagram.nodes.push({ id: "node:d", label: "D", source: [{ resourceId: "resource:d" }] });
  diagram.edges.push({
    id: "edge:cd",
    sourceNodeId: "node:c",
    targetNodeId: "node:d",
    label: "z",
    source: [{ resourceId: "resource:cd" }],
  });
  assert.equal(inferRevealLayoutFamily(scene), "process-context");
});


test("infers generic card-sequence without scene or label identity", () => {
  assert.equal(inferRevealLayoutFamily(cardSequenceScene("scene:alpha")), "card-sequence");
  assert.equal(inferRevealLayoutFamily(cardSequenceScene("opaque:scene")), "card-sequence");
  assert.deepEqual(inferRevealLayoutDecision(cardSequenceScene("scene:slots"))?.slots, [
    "heading", "banner", "cards", "takeaway",
  ]);
});

test("infers text-network-progression from structured network content", () => {
  assert.equal(inferRevealLayoutFamily(textNetworkScene("scene:alpha")), "text-network-progression");
  assert.equal(inferRevealLayoutFamily(textNetworkScene("opaque:scene")), "text-network-progression");
  assert.deepEqual(inferRevealLayoutDecision(textNetworkScene("scene:slots"))?.slots, [
    "heading", "banner", "views", "network", "takeaway",
  ]);
});
