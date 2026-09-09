import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalSerializePresenterModeDocument,
  createPresenterModeDocument,
  mountPresenterMode,
  reducePresenterState,
  type PresenterModeConfiguration,
  type PresenterRuntimePort,
} from "../src/presenter-mode.ts";
import { createPitchComponentDocument } from "../src/pitch-theme.ts";
import type { RevealRenderPlan } from "../src/index.ts";

const source = [{ resourceId: "ex:pitch" }];
const renderPlan: RevealRenderPlan = {
  version: "1.1",
  sourceDocumentId: "pitch-document",
  sourcePathId: "pitch-path",
  reducedMotion: false,
  interactionPolicy: "interactive-when-supported",
  sections: [
    {
      id: "section-main",
      sourceSceneId: "scene-main",
      source,
      semanticLabel: "Main narrative",
      nodes: [
        { id: "node-entry", sourceBlockId: "entry", source, kind: "prompt", prompt: "Open detail", responseMode: "reflection", fallback: "Optional detail available", interactive: true, staticFallback: "Optional detail available" },
        { id: "node-detail-a", sourceBlockId: "detail-a", source, kind: "prose", text: "Detail A", format: "plain", staticFallback: "Detail A" },
        { id: "node-detail-b", sourceBlockId: "detail-b", source, kind: "prose", text: "Detail B", format: "plain", staticFallback: "Detail B" },
        { id: "node-return", sourceBlockId: "return", source, kind: "prompt", prompt: "Continue", responseMode: "reflection", fallback: "Return to narrative", interactive: true, staticFallback: "Return to narrative" },
      ],
      readingOrder: ["entry", "detail-a", "detail-b", "return"],
    },
    {
      id: "section-next",
      sourceSceneId: "scene-next",
      source,
      semanticLabel: "Next canonical section",
      nodes: [{ id: "node-next", sourceBlockId: "next", source, kind: "prose", text: "Next", format: "plain", staticFallback: "Next" }],
      readingOrder: ["next"],
    },
  ],
};

const componentDocument = createPitchComponentDocument(renderPlan);
const [entry, detailA, detailB, returnComponent] = componentDocument.sections[0]!.components;
const nextComponent = componentDocument.sections[1]!.components[0]!;
const configuration: PresenterModeConfiguration = {
  version: "1.0",
  notesBySectionId: { "pitch-section-0-section-main": "Presenter-only note" },
  detailPaths: [{
    id: "detail-method",
    label: "Method detail",
    entryComponentId: entry!.id,
    componentIds: [detailA!.id, detailB!.id],
    returnComponentId: returnComponent!.id,
  }],
};

test("creates deterministic presenter state without leaking notes to audience output", () => {
  const first = createPresenterModeDocument(componentDocument, configuration);
  const second = createPresenterModeDocument(componentDocument, configuration);
  assert.deepEqual(first.diagnostics, []);
  assert.equal(canonicalSerializePresenterModeDocument(first.document!), canonicalSerializePresenterModeDocument(second.document!));
  assert.equal(first.document!.presenter.currentNote, "Presenter-only note");
  assert.equal("currentNote" in first.document!.audience, false);
  assert.equal(JSON.stringify(first.document!.audience).includes("Presenter-only note"), false);
});

test("enters, traverses and exits a detail path without changing canonical section order", () => {
  const initial = createPresenterModeDocument(componentDocument, configuration).document!;
  const entered = reducePresenterState(componentDocument, configuration, initial.presenter.state, { type: "ENTER_DETAIL", pathId: "detail-method" }).document!;
  assert.equal(entered.audience.componentId, detailA!.id);
  assert.equal(entered.presenter.state.canonicalSectionIndex, 0);
  const next = reducePresenterState(componentDocument, configuration, entered.presenter.state, { type: "NEXT_DETAIL" }).document!;
  assert.equal(next.audience.componentId, detailB!.id);
  const exited = reducePresenterState(componentDocument, configuration, next.presenter.state, { type: "EXIT_DETAIL" }).document!;
  assert.equal(exited.audience.componentId, returnComponent!.id);
  assert.equal(exited.presenter.state.canonicalSectionIndex, 0);
  const canonicalNext = reducePresenterState(componentDocument, configuration, exited.presenter.state, { type: "NEXT_SECTION" }).document!;
  assert.equal(canonicalNext.audience.sectionId, "pitch-section-1-section-next");
});

test("rejects unknown, duplicate and cyclic detail definitions atomically", () => {
  const unknown = createPresenterModeDocument(componentDocument, { ...configuration, detailPaths: [{ ...configuration.detailPaths[0]!, componentIds: ["missing"] }] });
  assert.equal(unknown.document, undefined);
  assert.equal(unknown.diagnostics[0]?.code, "UNKNOWN_COMPONENT");
  const duplicate = createPresenterModeDocument(componentDocument, { ...configuration, detailPaths: [configuration.detailPaths[0]!, configuration.detailPaths[0]!] });
  assert.equal(duplicate.diagnostics[0]?.code, "DUPLICATE_DETAIL_PATH");
  const cyclic = createPresenterModeDocument(componentDocument, { ...configuration, detailPaths: [{ ...configuration.detailPaths[0]!, componentIds: [returnComponent!.id] }] });
  assert.equal(cyclic.diagnostics[0]?.code, "CYCLIC_DETAIL_PATH");
});

test("rejects cross-section detail definitions before producing any presenter document", () => {
  for (const invalidPath of [
    { ...configuration.detailPaths[0]!, componentIds: [detailA!.id, nextComponent.id] },
    { ...configuration.detailPaths[0]!, returnComponentId: nextComponent.id },
    { ...configuration.detailPaths[0]!, entryComponentId: nextComponent.id },
  ]) {
    const result = createPresenterModeDocument(componentDocument, { ...configuration, detailPaths: [invalidPath] });
    assert.equal(result.document, undefined);
    assert.equal(result.diagnostics[0]?.code, "INVALID_DETAIL_PATH");
    assert.equal(result.diagnostics[0]?.pathId, "detail-method");
  }
});

test("cannot enter a valid detail path from a different canonical section", () => {
  const initial = createPresenterModeDocument(componentDocument, configuration).document!;
  const nextSection = reducePresenterState(componentDocument, configuration, initial.presenter.state, { type: "NEXT_SECTION" }).document!;
  const result = reducePresenterState(componentDocument, configuration, nextSection.presenter.state, { type: "ENTER_DETAIL", pathId: "detail-method" });
  assert.equal(result.document, undefined);
  assert.equal(result.diagnostics[0]?.code, "INVALID_DETAIL_PATH");
});

test("mount owns keyboard, timer, focus and cleanup without network access", () => {
  let keyListener: ((key: string) => void) | undefined;
  let timer: (() => void) | undefined;
  const focused: string[] = [];
  const cleanup: string[] = [];
  const runtime: PresenterRuntimePort = {
    addKeydownListener(listener) { keyListener = listener; return () => cleanup.push("key"); },
    startTimer(listener) { timer = listener; return () => cleanup.push("timer"); },
    focus(id) { focused.push(id); },
    startTransition() { return () => cleanup.push("transition"); },
  };
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => { fetchCalls += 1; throw new Error("network forbidden"); }) as typeof fetch;
  try {
    const handle = mountPresenterMode(componentDocument, configuration, runtime);
    const entered = handle.dispatch({ type: "ENTER_DETAIL", pathId: "detail-method" });
    assert.equal(entered.document!.audience.componentId, detailA!.id);
    keyListener?.("ArrowRight");
    assert.equal(handle.getDocument().audience.componentId, detailB!.id);
    keyListener?.("Escape");
    assert.equal(handle.getDocument().audience.componentId, returnComponent!.id);
    assert.equal(focused.at(-1), returnComponent!.id);
    timer?.();
    assert.equal(handle.getDocument().presenter.state.elapsedSeconds, 1);
    handle.destroy();
    handle.destroy();
    assert.deepEqual(cleanup.sort(), ["key", "timer", "transition"]);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("reduced motion suppresses transition startup", () => {
  const reducedDocument = createPitchComponentDocument({ ...renderPlan, reducedMotion: true });
  let transitions = 0;
  const runtime: PresenterRuntimePort = {
    addKeydownListener() { return () => undefined; },
    startTimer() { return () => undefined; },
    focus() {},
    startTransition() { transitions += 1; return () => undefined; },
  };
  mountPresenterMode(reducedDocument, configuration, runtime).destroy();
  assert.equal(transitions, 0);
});
