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
- Updated canonical-only semantic and pitch regressions and recorded the deletion inventory.

## Files or resources changed

- `scripts/generate_canonical_runtime.py`
- `scripts/rdf_dataset.py`
- `scripts/validate_semantics.py`
- `packages/core/src/scene-document.ts`
- `apps/pitch/src/graph-scene-data.ts`
- `apps/pitch/src/preview.ts`
- root and pitch package scripts
- canonical semantic and browser tests
- `docs/architecture/canonical-trig-runtime.md`
- deleted compatibility inputs listed in the migration document

## Verification

- [ ] Automated tests — authoritative exact-head local validator pending
- [ ] Semantic validation — authoritative exact-head local validator pending
- [ ] Manual browser check — recommended after validator success
- [x] Accessibility check — reading order, accessible scene labels and provenance-bearing DOM structure preserved in code/tests
- [x] Documentation updated

## Decisions and assumptions

- Generated `canonical-runtime.json` is disposable, ignored by Git and regenerated before development/tests; it is not an authored semantic source.
- Historical handoffs and reviews remain unchanged even when they mention deleted paths, because they are historical evidence rather than active consumers.
- A temporary fail-closed `include_legacy=False` call-site compatibility parameter remains in the Dataset assembler solely to prevent stale tests from restoring legacy inputs; `include_legacy=True` is rejected.

## Risks or unresolved questions

- This connector-only worker could not execute Python, Node, SHACL or browser commands. The exact-head external validator is therefore required before acceptance.
- The checked no-JavaScript fallback is still the previously accepted nine-item fallback. Manager review should require validator evidence and a manual browser inspection to confirm parity with the newly generated Standardabweichung sequence; request a bounded correction if parity fails.
- Any active stale reference to removed JSON-LD paths discovered by validation must be corrected without restoring the deleted compatibility sources.

## Recommended manager action

`review after agent-validator/project-chemie-digital is success on the exact PR head; request changes for any stale-path or fallback-parity failure`
