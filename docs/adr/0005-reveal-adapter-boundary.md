# ADR-0005: Encapsulate deterministic Reveal.js rendering behind an adapter-owned render plan

- Status: Proposed
- Date: 2026-07-17

## Context

ADR-0001 keeps Reveal.js outside the domain model. ADR-0002 defines the one-way learning-compiler layers, ADR-0003 defines `SceneDocument` 1.0, and ADR-0004 defines deterministic scene composition. The next implementation increment needs a precise adapter boundary before any Reveal.js, React, HTML, CSS, plugin, fragment, or lifecycle code is introduced.

The adapter must consume renderer-neutral scenes without changing their didactic meaning. Reveal.js-specific decisions may exist only inside `packages/renderer-reveal` and must remain replaceable by another renderer adapter.

## Decision

`packages/renderer-reveal` consumes a validated `SceneDocument` through a versioned adapter API and produces an adapter-owned immutable render plan. The render plan may name Reveal.js concepts, but it is private to the adapter package and is never imported by `packages/core`, the path resolver, the scene composer, semantic content, or ontology code.

The dependency direction remains:

`domain graph -> learning resources -> path templates -> resolved paths -> scene documents -> renderer adapters`

No upstream contract may select HTML elements, React components, CSS classes, Reveal.js plugins, slides, fragments, transitions, or lifecycle hooks.

## Minimal future TypeScript boundary

```ts
import type { SceneDocument } from "@project-chemie-digital/core";

export interface RevealAdapterOptions {
  readonly reducedMotion: boolean;
  readonly interactionPolicy: "interactive-when-supported" | "static";
}

export interface RevealAdapterDiagnostic {
  readonly code:
    | "UNSUPPORTED_SCENE_DOCUMENT_VERSION"
    | "INVALID_SCENE_DOCUMENT"
    | "UNSUPPORTED_PRIMITIVE"
    | "UNREPRESENTABLE_INTERACTION"
    | "MISSING_ACCESSIBLE_ALTERNATIVE"
    | "INVALID_DISCLOSURE_ORDER"
    | "RENDER_PLAN_CONTRACT_VIOLATION";
  readonly sceneId?: string;
  readonly blockId?: string;
  readonly message: string;
}

export interface RevealRenderPlan {
  readonly version: "1.0";
  readonly sourceDocumentId: string;
  readonly sections: readonly RevealSectionPlan[];
}

export interface RevealSectionPlan {
  readonly id: string;
  readonly sourceSceneId: string;
  readonly semanticLabel: string;
  readonly nodes: readonly RevealNodePlan[];
  readonly readingOrder: readonly string[];
}

export type RevealNodePlan =
  | RevealProsePlan
  | RevealMathPlan
  | RevealMediaPlan
  | RevealGroupPlan
  | RevealPromptPlan;

export interface RevealPlanResult {
  readonly plan?: RevealRenderPlan;
  readonly diagnostics: readonly RevealAdapterDiagnostic[];
}

export function createRevealRenderPlan(
  document: SceneDocument,
  options: RevealAdapterOptions,
): RevealPlanResult;
```

The concrete node-plan interfaces are adapter-owned. They may include normalized HTML semantics, Reveal fragment metadata, plugin requirements, and React renderer keys. Those details must not escape the package's public boundary unless a separate, versioned adapter API explicitly requires them.

## Deterministic mapping policy

1. Validate the complete `SceneDocument` before mapping. Return diagnostics without a partial plan on failure.
2. Preserve `document.scenes` array order exactly. Produce one top-level Reveal section plan per current scene; later grouping changes require a separate versioned decision.
3. Preserve each scene's direct `blocks` array order in the section's node list.
4. Preserve every scene and group's explicit `readingOrder` exactly as the semantic traversal order. DOM or React output must be generated so assistive technology follows that order even when visual layout differs.
5. Copy scene and block identifiers into adapter-owned source-reference fields. Adapter-generated ids are deterministic functions of source ids and stable ordinal positions; random ids are forbidden.
6. Map disclosure metadata only after sibling uniqueness has been validated. `initial` content is visible in the initial state. Progressive or optional states are ordered by the renderer-neutral integer `order`. Reveal fragment indices may be assigned inside the adapter, but their values are derived deterministically from the ordered disclosed siblings and are never written upstream.
7. Groups remain semantic groups. The adapter may render a group through nested markup or a React component, but child order, reading order, source traceability, disclosure semantics, and alternatives must be preserved.
8. Prose maps to a semantic text node. Markdown processing, when used, is adapter-owned and must be configured deterministically without remote extensions or executable embedded content.
9. Mathematics maps to an adapter-owned math node containing the original expression and mandatory `spokenText`. Visual typesetting must not replace the nonvisual alternative.
10. Media references map to inert, versioned media plans. The adapter never fetches remote media implicitly. A supplied local asset resolver may materialize content in a later bounded implementation; otherwise the plan retains a safe reference and alternative text.
11. Prompts map to an adapter-owned prompt plan. Interactive controls are optional renderer behavior. The complete static fallback is always present and becomes the rendered representation when interaction is unsupported or disabled.
12. Given identical `SceneDocument` bytes and identical adapter options, the serialized render plan must be byte-for-byte stable after canonical serialization.

## Normative primitive mappings

| Scene primitive | Adapter-owned architectural mapping | Required fallback |
|---|---|---|
| `prose` | semantic prose node; optional deterministic Markdown transform | readable static text |
| `math` | math node with visual expression and spoken alternative | expression plus spoken text |
| `media-reference` | inert media-reference node with local-resolution metadata | alternative text and reference metadata |
| `group` | semantic container whose children and reading order remain explicit | flattened readable group in semantic order |
| `prompt` | prompt node with optional local interaction | mandatory static task fallback |

Didactic intents may influence an adapter-owned presentation strategy, but they never select a named component upstream. Unknown intents are preserved as metadata or ignored without dropping content; an intent may cause failure only when semantic equivalence cannot be maintained.

## Progressive disclosure and reduced motion

Reveal.js fragments are an implementation choice, not an input contract. When fragments are used, fragment order is derived from disclosure order and stable sibling position. A reduced-motion option disables nonessential transitions while preserving the same sequence and content states. Keyboard navigation must expose every state without pointer-only interaction. Static mode renders all content in semantic order and visibly distinguishes optional or progressive material without hiding it.

## Accessibility obligations

The adapter must:

- preserve semantic heading hierarchy and scene labels;
- preserve explicit reading order independently of visual placement;
- expose `spokenText` or an equivalent accessible name for every mathematical expression;
- expose alternative text and safe reference information for media;
- render prompt fallbacks regardless of interaction support;
- support complete keyboard operation for adapter-created controls;
- respect reduced-motion preferences and avoid motion-only meaning;
- never remove content solely because a Reveal.js feature or plugin is unavailable.

A missing mandatory alternative is an adapter error, not permission to invent one.

## Privacy and offline behavior

Render-plan creation is a pure offline operation. It performs no implicit network requests, tracker loading, remote execution, analytics, learner-state capture, account lookup, cache refresh, or content acquisition. The production renderer must use local dependencies and explicitly supplied assets. Learner responses and presentation telemetry are separate bounded contexts and are not part of this adapter contract.

## Lifecycle and error ownership

Reveal.js initialization, teardown, event subscriptions, plugin registration, fragment events, resize handling, and React mounting belong entirely to `packages/renderer-reveal`. The core package exposes no lifecycle hooks.

Render-plan creation and runtime rendering are separate error boundaries:

1. plan creation validates semantic and mapping invariants and fails atomically with stable diagnostics;
2. runtime rendering reports adapter-local initialization or plugin failures without mutating the source scene document.

A runtime failure must retain enough static plan data to render or export a readable fallback.

## Compatibility and versioning

- The adapter initially accepts only `SceneDocument` version `1.0`.
- Unsupported versions fail with `UNSUPPORTED_SCENE_DOCUMENT_VERSION`; they are not silently coerced.
- Additive SceneDocument fields may be ignored only when their omission cannot change meaning, accessibility, ordering, provenance, or fallback behavior.
- New primitives or incompatible semantics require an explicit adapter-version update and compatibility tests.
- The adapter render-plan version is independent from the SceneDocument version.
- No change in this ADR modifies ontology, SHACL, `ResolvedLearningPath`, scene composition, or `SceneDocument` 1.0.

## Normative five-scene mapping example

For `docs/examples/standard-deviation-scene-document-1.0.json`, the architectural render plan is:

```json
{
  "version": "1.0",
  "sourceDocumentId": "ex:standard-deviation-default-path--scene-document",
  "sections": [
    {
      "sourceSceneId": "ex:sd-step-definition--scene",
      "semanticLabel": "Standardabweichung: Definition",
      "nodes": ["prose:ex:sd-step-definition--block-1"],
      "readingOrder": ["ex:sd-step-definition--block-1"]
    },
    {
      "sourceSceneId": "ex:sd-step-expression--scene",
      "semanticLabel": "Stichprobenstandardabweichung: Formel",
      "nodes": ["math:ex:sd-step-expression--block-1"],
      "readingOrder": ["ex:sd-step-expression--block-1"]
    },
    {
      "sourceSceneId": "ex:sd-step-symbols--scene",
      "semanticLabel": "Formelzeichen der Stichprobenstandardabweichung",
      "nodes": [
        "math:ex:sd-step-symbols--block-1",
        "math:ex:sd-step-symbols--block-2",
        "math:ex:sd-step-symbols--block-3",
        "math:ex:sd-step-symbols--block-4"
      ],
      "readingOrder": [
        "ex:sd-step-symbols--block-1",
        "ex:sd-step-symbols--block-2",
        "ex:sd-step-symbols--block-3",
        "ex:sd-step-symbols--block-4"
      ]
    },
    {
      "sourceSceneId": "ex:sd-step-examples--scene",
      "semanticLabel": "Anwendungsbeispiele zur Standardabweichung",
      "nodes": [
        "prose:ex:sd-step-examples--block-1",
        "prose:ex:sd-step-examples--block-2"
      ],
      "readingOrder": [
        "ex:sd-step-examples--block-1",
        "ex:sd-step-examples--block-2"
      ]
    },
    {
      "sourceSceneId": "ex:sd-step-exercise--scene",
      "semanticLabel": "Übung zur Stichprobenstandardabweichung",
      "nodes": ["prompt:ex:sd-step-exercise--block-1"],
      "readingOrder": ["ex:sd-step-exercise--block-1"]
    }
  ]
}
```

Each node retains its complete source references, disclosure metadata, intent metadata, accessible alternatives, and prompt fallback from the source document. The abbreviated strings above identify node kind and source block solely to keep the architectural example reviewable; they are not a production serialization.

## Required future architecture checks

The bounded implementation issue must add checks that:

1. `packages/core` and scene-composer modules do not import `packages/renderer-reveal` or Reveal.js;
2. adapter plan generation is deterministic across repeated runs;
3. every scene/block id, source reference, reading-order entry, disclosure state, and accessible alternative is preserved;
4. unsupported versions and primitives fail atomically with stable diagnostics;
5. static and reduced-motion modes preserve complete content and semantic order;
6. no plan-generation path performs network I/O or captures learner state.

No production adapter or architecture test is introduced by this ADR-only increment.

## Consequences

- Reveal.js remains encapsulated and replaceable.
- The first adapter implementation has a deterministic, testable target without changing upstream contracts.
- Accessibility and offline/privacy requirements are part of the boundary rather than deferred styling concerns.
- Framework-specific lifecycle and fallback behavior have a single owner.
- Future renderers can consume the same `SceneDocument` without adopting Reveal.js concepts.
