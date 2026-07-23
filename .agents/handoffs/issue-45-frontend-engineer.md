# Agent handoff

## Role

`Frontend and Reveal Renderer Engineer`

## Issue

`#45 — Remove hardcoded pitch content and render compiled graph scenes`

## Completed

- Removed `pitchSlides` and the renderer-authored title/body/consequence fixture from the active browser rendering path.
- Added a browser-local graph dataset adapter that imports the accepted RDF JSON-LD resources and compiles the standard-deviation scene through `compileGraphBackedScene()`.
- Made the compiler browser-safe by moving Node-only filesystem imports into the repository loader function.
- Added a generic `SceneDocument` Reveal renderer with renderer-owned layout selection, ordered block rendering, accessible headings and visible deterministic failure behavior.
- Preserved RDF resource IDs and provenance IDs in DOM data attributes.
- Preserved no-network guarding, keyboard/Reveal configuration, reduced motion, static fallback and idempotent cleanup.
- Added tests for RDF-to-DOM rendering, provenance, RDF mutation propagation, renderer-string anti-duplication, static fallback, invalid input, cleanup and no-network behavior.

## Files changed

- `packages/core/src/graph-scene-compiler.ts`
- `apps/pitch/src/graph-scene-data.ts`
- `apps/pitch/src/preview.ts`
- `apps/pitch/src/main.ts`
- `apps/pitch/test/preview.test.ts`
- `.agents/handoffs/issue-45-frontend-engineer.md`

## Verification

- Authoritative command: `npm test`
- Exact-head execution is delegated to `agent-validator/project-chemie-digital`.
- No GitHub Actions evidence was used.

## Decisions and assumptions

- This bounded migration renders the accepted standard-deviation reference scene end to end. Remaining pitch scenes require separately authored graph scene definitions before they may enter the active renderer path.
- Layout identity remains frontend-owned and is selected by semantic scene ID; authored scientific and narrative prose is not stored in renderer source.
- The complete nine-item `<noscript>` fallback remains available while the graph-backed migration proceeds incrementally.

## Risks or follow-up

- The browser currently imports repository JSON-LD fixtures at build time; Fuseki integration remains explicitly excluded.
- Only prose blocks used by the accepted reference scene are supported. Additional block kinds require separately governed renderer mappings.

## Recommended manager action

`review after exact-head local validation`
