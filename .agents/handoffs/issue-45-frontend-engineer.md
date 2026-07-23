# Agent handoff

## Role

`Frontend and Reveal Renderer Engineer`

## Issue

`#45 — Remove hardcoded pitch content and render compiled graph scenes`

## Completed

- Removed `pitchSlides` and the renderer-authored title/body/consequence fixture from the active browser rendering path.
- Replaced direct `.jsonld` module imports with a deterministic repository-local TypeScript data boundary that is importable by both Vite and the authoritative Node test runtime.
- Kept the JSON-LD files under `content/` as the source of truth; an authoritative pitch regression compares the complete generated browser boundary against all three authored JSON-LD documents and fails on drift.
- Corrected the runtime scene identifier to the authored `ex:scene-standard-deviation-definition-with-citation` resource.
- Corrected mutation-propagation and RDF identity/provenance assertions to use the actual authored definition and source resources.
- Retained the browser-safe compiler boundary, generic `SceneDocument` Reveal renderer, visible deterministic failure behavior, no-network guard, keyboard behavior, reduced motion, static fallback and idempotent cleanup.
- Ensured mutation-propagation, anti-duplication, fallback, invalid-input, cleanup and no-network tests are reachable under `npm test` without Node attempting to load `.jsonld` as an ES module.

## Files changed

- `packages/core/src/graph-scene-compiler.ts`
- `apps/pitch/src/generated/standard-deviation-scene-data.ts`
- `apps/pitch/src/graph-scene-data.ts`
- `apps/pitch/src/preview.ts`
- `apps/pitch/src/main.ts`
- `apps/pitch/test/preview.test.ts`
- `.agents/handoffs/issue-45-frontend-engineer.md`

## Verification

- Authoritative command: `npm test`
- Exact-head execution is delegated to `agent-validator/project-chemie-digital`.
- No GitHub Actions evidence was used.
- The portable-data parity test is the deterministic guard that preserves JSON-LD source-of-truth while allowing browser bundling and Node test execution.

## Decisions and assumptions

- This bounded migration renders the accepted standard-deviation reference scene end to end. Remaining pitch scenes require separately authored graph scene definitions before they may enter the active renderer path.
- Layout identity remains frontend-owned and is selected by semantic scene ID; authored scientific and narrative prose is not stored in renderer runtime files.
- The generated TypeScript module is a disposable transport artifact, not an editorial source. Any authored JSON-LD change requires regeneration; drift is rejected by `npm test`.
- The complete nine-item `<noscript>` fallback remains available while the graph-backed migration proceeds incrementally.

## Risks or follow-up

- Fuseki integration remains explicitly excluded.
- Only prose blocks used by the accepted reference scene are supported. Additional block kinds require separately governed renderer mappings.
- A later build-tooling increment may automate regeneration of the browser transport module; this correction establishes the portable contract and deterministic drift detection without broadening issue #45.

## Recommended manager action

`review after new exact-head local validation`
