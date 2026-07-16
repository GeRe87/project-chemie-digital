# Agent handoff

## Role

`software-architect`

## Issue

`#7 — Define the minimal renderer-neutral scene-document contract and primitives`

## Completed

- Added the versioned `SceneDocument` 1.0 TypeScript contract in the renderer-neutral core package.
- Defined five minimal primitives: prose, math, media reference, group and prompt.
- Added explicit semantic reading order, progressive disclosure, didactic intent, emphasis, narration, accessibility alternatives and source/provenance traceability.
- Added a runtime invariant validator and focused contract tests.
- Corrected the manager-review finding by requiring disclosure-order values to be unique within every direct sibling collection, including nested group children.
- Added focused tests for tied disclosure orders at scene and nested-group levels.
- Recorded the normative disclosure-order rule and adapter fallback requirements in ADR-0003.
- Preserved the existing resolved-path contract and `cd:position` semantics unchanged.

## Files or resources changed

- `packages/core/src/scene-document.ts`
- `packages/core/test/scene-document.test.ts`
- `docs/adr/0003-renderer-neutral-scene-document-contract.md`
- `.agents/handoffs/issue-7-software-architect.md`

## Verification

- [x] Automated tests added, including scene-level and nested-group disclosure-order tie cases
- [ ] Complete repository validation — Validate run #49 is queued for the corrected PR head
- [ ] Manual browser check — not applicable; no renderer or browser implementation
- [x] Accessibility check — reading order and non-visual alternatives are contract invariants
- [x] Documentation updated

## Decisions and assumptions

- Array order is the deterministic scene/block presentation-state order; explicit `readingOrder` provides semantic non-visual traversal.
- Disclosure-order values are unique among all disclosed blocks in each direct sibling collection. Disclosure modes do not form separate order namespaces; gaps are allowed.
- Every scene and block must retain source identity; provenance identifiers are additive metadata.
- Unsupported interactions degrade to readable static content; prompts require a fallback string.
- No new runtime dependency, ontology change, composer implementation or renderer integration was introduced.

## Risks or unresolved questions

- The future composer must define deterministic rules for mapping existing `viewType` values and resource kinds to these primitives.
- The corrected remote validation result must be reviewed on the current draft PR head.

## Recommended manager action

`review after Validate run #49 completes`
