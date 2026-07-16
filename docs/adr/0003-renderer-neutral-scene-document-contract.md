# ADR-0003: Define the minimal renderer-neutral scene-document contract

- Status: Proposed
- Date: 2026-07-16

## Context

ADR-0002 establishes renderer-neutral scene documents as the boundary between resolved paths and renderer adapters. The first standard-deviation vertical slice now needs a small stable contract before scene composition or Reveal.js integration can begin.

## Decision

The normative TypeScript contract lives in `packages/core/src/scene-document.ts` and starts at version `1.0`.

A `SceneDocument` contains an ordered array of scenes. Each scene contains an ordered array of blocks and an explicit semantic `readingOrder`. Array order is the deterministic presentation-state order; `readingOrder` is the deterministic non-visual traversal order and must list every direct child exactly once.

The minimal block vocabulary is:

1. `prose` — plain or Markdown-authored explanatory text;
2. `math` — a mathematical expression with mandatory spoken text;
3. `media-reference` — a versionable reference with mandatory alternative text;
4. `group` — nested semantic grouping with its own complete reading order;
5. `prompt` — an exercise or reflection intent with an explicit non-interactive fallback.

Every scene and block retains at least one source-resource identifier. Optional provenance identifiers preserve traceability without changing the issue #3 `ResolvedLearningPath` contract.

Didactic purpose is represented by a small `DidacticIntent` vocabulary. It states why material is presented, not which renderer component implements it. Progressive disclosure is represented by renderer-neutral `mode` and integer `order` metadata. Within every direct sibling collection — a scene's `blocks` and each group's `children` — all blocks that define disclosure metadata must use distinct `order` values. Disclosure modes do not create separate ordering namespaces, and gaps are allowed. This makes the sequence unambiguous without an adapter-specific tie-break. Adapters may map the ordered states to animation, sequential print states, expandable content, or an immediately visible accessible fallback.

Unsupported interactions or disclosure modes must degrade to readable static content using the block's semantic reading order and, for prompts, its mandatory `fallback`. Adapters must not drop source content merely because a concrete interaction is unavailable.

## Invariants

- document, scene and block identifiers are non-empty;
- scene identifiers and sibling block identifiers are unique;
- source-resource traceability is mandatory for every scene and block;
- reading-order lists are complete, unique and reference only direct children;
- disclosure order is a non-negative integer;
- disclosure order is unique among all disclosed blocks in each direct sibling collection, including nested group children;
- mathematical and media content provide non-visual alternatives;
- prompts provide a static fallback;
- version `1.0` is validated explicitly;
- the contract imports no renderer or browser framework.

These invariants are enforced by `validateSceneDocument` and focused Node tests.

## Boundaries

The scene document does not contain learner state, analytics, network retrieval, cache refresh, rights review, pixel coordinates, responsive breakpoints, CSS classes, HTML tags, renderer lifecycle events, React components, Reveal.js slides or fragments.

The scene composer is a later layer. It will consume the existing issue #3 resolved-path public boundary without changing `ResolvedLearningPath`, `ResolvedPathStep`, or `cd:position` semantics.

## Consequences

- renderer adapters receive a small deterministic and testable input;
- accessibility semantics exist before renderer selection;
- the same scene document can degrade safely across presentation, self-study and print outputs;
- future primitive additions require additive versioned evolution or an explicit migration decision;
- no ontology or semantic-content changes are required.
