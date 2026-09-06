import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalSerializePitchComponentDocument,
  contrastRatio,
  createPitchComponentDocument,
  mountPitchComponents,
  udeChemistryPitchTheme,
  type RevealRenderPlan,
} from "../src/index.ts";

const plan: RevealRenderPlan = {
  version: "1.0",
  sourceDocumentId: "pitch-scene-document",
  sourcePathId: "ex:studiendekanat-pitch-path-v1",
  reducedMotion: true,
  interactionPolicy: "interactive-when-supported",
  sections: [{
    id: "section-1",
    sourceSceneId: "scene-1",
    source: [{ resourceId: "ex:pitch-purpose" }],
    semanticLabel: "Why a knowledge-first platform?",
    readingOrder: ["prose-1", "prompt-1"],
    nodes: [
      {
        id: "node-prose",
        sourceBlockId: "prose-1",
        source: [{ resourceId: "ex:knowledge-first" }],
        kind: "prose",
        text: "Reusable semantic resources support multiple outputs.",
        format: "plain",
        staticFallback: "Reusable semantic resources support multiple outputs.",
      },
      {
        id: "node-prompt",
        sourceBlockId: "prompt-1",
        source: [{ resourceId: "ex:next-step" }],
        kind: "prompt",
        prompt: "Which next step should be prioritised?",
        responseMode: "reflection",
        fallback: "Discuss the next step.",
        interactive: true,
        staticFallback: "Discuss the next step.",
      },
    ],
  }],
};

test("maps a deterministic accessible component document", () => {
  const first = createPitchComponentDocument(plan);
  const second = createPitchComponentDocument(structuredClone(plan));
  assert.equal(canonicalSerializePitchComponentDocument(first), canonicalSerializePitchComponentDocument(second));
  assert.equal(first.sections[0]?.heading.headingLevel, 1);
  assert.equal(first.sections[0]?.landmark, "region");
  assert.equal(first.sections[0]?.components[1]?.focusable, true);
  assert.equal(first.sections[0]?.components[0]?.reducedMotion, true);
  assert.deepEqual(first.sections[0]?.components[0]?.sourceResourceIds, ["ex:knowledge-first"]);
});

test("preserves code node kind in the pitch component contract", () => {
  const withCode = structuredClone(plan);
  withCode.sections[0]!.nodes[0] = {
    id: "node-code",
    sourceBlockId: "prose-1",
    source: [{ resourceId: "ex:code-example" }],
    kind: "code",
    language: "python",
    code: "print(1)",
    editable: false,
    executable: false,
    interactive: false,
    fallback: "print(1)",
    staticFallback: "print(1)",
  };

  const document = createPitchComponentDocument(withCode);
  assert.equal(document.sections[0]?.components[0]?.kind, "code");
  assert.equal(document.sections[0]?.components[0]?.sourceNodeId, "node-code");
});

test("follows explicit section reading order independent of node-array order", () => {
  const permuted = structuredClone(plan);
  permuted.sections[0]!.nodes.reverse();

  const canonical = createPitchComponentDocument(plan);
  const reordered = createPitchComponentDocument(permuted);

  assert.equal(canonicalSerializePitchComponentDocument(reordered), canonicalSerializePitchComponentDocument(canonical));
  assert.deepEqual(
    reordered.sections[0]?.components.map((component) => component.sourceNodeId),
    ["node-prose", "node-prompt"],
  );
  assert.deepEqual(
    reordered.sections[0]?.components.map((component) => component.readingOrder),
    [1, 2],
  );
});

test("rejects invalid section reading-order contracts deterministically", () => {
  const unknownBlock = structuredClone(plan);
  unknownBlock.sections[0]!.readingOrder = ["prose-1", "missing-block"];
  assert.throws(
    () => createPitchComponentDocument(unknownBlock),
    /Section scene-1 has invalid reading order/,
  );

  const duplicateOrder = structuredClone(plan);
  duplicateOrder.sections[0]!.readingOrder = ["prose-1", "prose-1"];
  assert.throws(
    () => createPitchComponentDocument(duplicateOrder),
    /Section scene-1 has invalid reading order/,
  );

  const duplicateNodeIdentity = structuredClone(plan);
  duplicateNodeIdentity.sections[0]!.nodes[1]!.sourceBlockId = "prose-1";
  assert.throws(
    () => createPitchComponentDocument(duplicateNodeIdentity),
    /Section scene-1 has duplicate sourceBlockId prose-1/,
  );
});

test("rejects unsupported render-plan versions", () => {
  const unsupported = { ...structuredClone(plan), version: "2.0" } as unknown as RevealRenderPlan;
  assert.throws(() => createPitchComponentDocument(unsupported), /Unsupported RevealRenderPlan version/);
});

test("theme tokens meet documented readability invariants", () => {
  assert.ok(contrastRatio(udeChemistryPitchTheme.colors.foreground, udeChemistryPitchTheme.colors.background) >= 7);
  assert.ok(contrastRatio(udeChemistryPitchTheme.colors.accentForeground, udeChemistryPitchTheme.colors.accent) >= 4.5);
  assert.ok(udeChemistryPitchTheme.spacing.every((value, index, values) => index === 0 || value > values[index - 1]!));
  assert.ok(udeChemistryPitchTheme.typography.lineHeight >= 1.4);
});

test("keyboard focus and cleanup are renderer-owned and idempotent", () => {
  const listeners = new Set<(key: string) => void>();
  let cleanupCount = 0;
  let animationCount = 0;
  const document = createPitchComponentDocument(plan);
  const handle = mountPitchComponents(document, {
    addKeydownListener(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); cleanupCount += 1; };
    },
    startAnimation() {
      animationCount += 1;
      return () => { animationCount -= 1; cleanupCount += 1; };
    },
  });
  assert.match(handle.focusNext() ?? "", /node-prompt/);
  assert.equal(handle.focusPrevious(), handle.focusNext());
  assert.equal(animationCount, 0, "reduced-motion plans do not start animation");
  handle.destroy();
  handle.destroy();
  assert.equal(listeners.size, 0);
  assert.equal(cleanupCount, 1);
});

test("does not require network access or external assets", () => {
  const source = `${createPitchComponentDocument}\n${mountPitchComponents}`;
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|https?:\/\//);
  assert.equal(udeChemistryPitchTheme.typography.headingFamily.includes("url("), false);
});
