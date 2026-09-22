import assert from "node:assert/strict";
import test from "node:test";

import type { Scene } from "../../core/src/scene-document.ts";
import { inferRevealLayoutFamily } from "../src/layout-policy.ts";

function threeCardScene(id: string, itemCount = 3): Scene {
  return {
    id,
    source: [{ resourceId: `${id}:source` }],
    blocks: [
      {
        id: `${id}:heading`,
        kind: "prose",
        text: "Opaque heading",
        intent: { kind: "introduce" },
        source: [{ resourceId: "resource:heading" }],
      },
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
      {
        id: `${id}:takeaway`,
        kind: "prose",
        text: "Opaque takeaway",
        intent: { kind: "explain" },
        source: [{ resourceId: "resource:takeaway" }],
      },
    ],
    readingOrder: [`${id}:heading`, `${id}:cards`, `${id}:takeaway`],
  };
}

test("infers concept-specification from structure without scene identity", () => {
  assert.equal(inferRevealLayoutFamily(threeCardScene("scene:alpha")), "concept-specification");
  assert.equal(inferRevealLayoutFamily(threeCardScene("completely:different:id")), "concept-specification");
});

test("does not infer concept-specification from an arbitrary keypoint list", () => {
  assert.equal(inferRevealLayoutFamily(threeCardScene("scene:two-cards", 2)), undefined);
});
