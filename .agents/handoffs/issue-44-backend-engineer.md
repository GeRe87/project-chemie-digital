# Agent handoff

## Role

`Backend and Data Integration Engineer`

## Issue

`#44 — Compile graph-backed scene definitions into SceneDocument`

## Completed

- Added a deterministic local compiler for the accepted graph-backed standard-deviation `DefinitionWithCitation` scene.
- Resolved the German heading from `skos:prefLabel`, the definition through `cd:hasDefinition`, and the citation through `cd:hasDefinition/cd:hasSource` without embedding audience wording in compiler source.
- Materialized renderer-neutral `SceneDocument 1.0` prose blocks with RDF resource IDs and definition-source provenance.
- Added canonical JSON serialization with recursively sorted object keys and preserved semantic array order.
- Added atomic diagnostics for unresolved resources, ambiguous language, missing relation targets, invalid ordering, unsupported roles and unsupported selection paths.
- Added repository-local file loading with no HTTP or Fuseki dependency.
- Added reordered-graph, provenance, invalid-input, repeatability and no-network regression coverage.
- Documented that compiled snapshots are disposable output rather than an authored source of truth.

## Files or resources changed

- `packages/core/src/graph-scene-compiler.ts`
- `packages/core/test/graph-scene-compiler.test.ts`
- `docs/graph-scene-compiler.md`
- `.agents/handoffs/issue-44-backend-engineer.md`

## Verification

- [x] Automated tests added for the authoritative `npm test` path
- [x] Semantic validation remains part of the unchanged root `npm test` command
- [ ] Manual browser check — not applicable; renderer and DOM are excluded
- [x] Accessibility check — heading is used as the scene accessibility label; no renderer behavior changed
- [x] Documentation updated

Exact-head execution is delegated to the configured local validator. No GitHub Actions evidence was used.

## Decisions and assumptions

- The bounded compiler consumes the repository's existing compact JSON-LD shape directly; general JSON-LD expansion and Fuseki querying remain outside issue #44.
- The scene definition ID is retained as `sourcePathId` because this increment compiles a scene definition rather than a learning path.
- Object keys are canonicalized while arrays retain semantic ordering. Scene-item set order is normalized by validated `cd:position` values.
- Definition provenance is the exact `cd:hasSource` resource reached from the focus concept's selected definition.

## Risks or unresolved questions

- The compiler currently supports only the three accepted communicative roles and exact selection paths used by `DefinitionWithCitation`; broader patterns should be introduced through separately versioned mappings.
- The citation currently materializes `schema:name`; URL presentation remains a renderer or later contract decision.
- The local exact-head validator has not yet published evidence for the final PR head.

## Recommended manager action

`review`
