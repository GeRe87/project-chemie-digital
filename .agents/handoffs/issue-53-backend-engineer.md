# Agent handoff

## Role

`Backend and Data Integration Engineer`

## Issue

`#53 — Migrate compilers and browser transport to the canonical TriG Dataset`

## Completed

- Replaced the active JSON-LD/generated-TypeScript browser boundary with deterministic generation from the canonical TriG Dataset.
- Added a canonical runtime generator that assembles the Dataset, preserves named-graph provenance and relation paths, resolves the ordered Standardabweichung path and emits renderer-neutral scene and graph-projection inputs.
- Changed the Reveal pitch integration to consume the disposable generated artifact and expose all nine graph-backed scenes.
- Added generation and stale-artifact commands to local development and validation.
- Removed the active JSON-LD concept, resource, path and scene files, the manually parity-maintained TypeScript copy, and the retired JSON-LD graph-scene compiler/tests.
- Corrected `scripts/check-json.mjs` so validation scans current JSON-bearing project roots and root package manifests without assuming the removed `content/` directory exists.
- Replaced current active documentation that still described JSON-LD files or the retired JSON-LD-specific compiler as runtime inputs.
- Preserved historical reviews and handoffs unchanged because they are evidence rather than executable consumers.

## Files or resources changed

- `scripts/generate_canonical_runtime.py`
- `scripts/rdf_dataset.py`
- `scripts/validate_semantics.py`
- `scripts/check-json.mjs`
- `packages/core/src/scene-document.ts`
- `packages/core/README.md`
- `apps/pitch/src/graph-scene-data.ts`
- `apps/pitch/src/preview.ts`
- `apps/pitch/README.md`
- root and pitch package scripts
- canonical semantic and browser tests
- `docs/architecture/canonical-trig-runtime.md`
- `docs/graph-scene-compiler.md`
- deleted compatibility inputs listed in the migration document

## Verification

- [ ] Automated tests — fresh authoritative exact-head local validator required after the correction commits
- [ ] Semantic validation — fresh authoritative exact-head local validator required after the correction commits
- [ ] Manual browser check — required for manager acceptance
- [ ] Static fallback parity — required for manager acceptance
- [x] Accessibility boundary — reading order, accessible scene labels and provenance-bearing DOM structure preserved in code/tests
- [x] Active documentation updated to the canonical TriG runtime boundary

## Decisions and assumptions

- Generated `canonical-runtime.json` is disposable, ignored by Git and regenerated before development/tests; it is not an authored semantic source.
- `check:json` validates JSON under `.agents`, `apps` and `packages` plus the root package manifests; it no longer treats the deleted semantic `content/` tree as an expected root.
- Historical handoffs and reviews remain unchanged even when they mention deleted paths, because they are historical evidence rather than active consumers.
- A temporary fail-closed `include_legacy=False` call-site compatibility parameter remains in the Dataset assembler solely to prevent stale tests from restoring legacy inputs; `include_legacy=True` is rejected.
- No JSON-LD file or parity-maintained TypeScript semantic copy was restored.

## Risks or unresolved questions

- This connector-only worker could not execute Python, Node, SHACL or browser commands. The exact-head external validator is therefore required before acceptance.
- The no-JavaScript fallback must be manually inspected against the generated nine-scene Standardabweichung sequence. Any parity failure requires a bounded correction without reintroducing legacy authored sources.
- Historical evidence contains references to retired files by design; future hygiene checks should distinguish historical records from active code, tests and current documentation.

## Recommended manager action

`review only after agent-validator/project-chemie-digital is success on the exact current PR head, then require manual browser and static-fallback parity evidence before acceptance`
