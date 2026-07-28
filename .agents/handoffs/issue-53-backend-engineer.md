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
- Corrected `scripts/check-json.mjs` so validation scans current JSON-bearing project roots without assuming the removed `content/` directory exists or requiring an absent root `package-lock.json`.
- Added deterministic JSON-candidate discovery with `package.json` required and `package-lock.json` optional.
- Added focused Node regressions proving candidate discovery both without and with a root lockfile, and included them in the authoritative `npm test` chain.
- Replaced current active documentation that still described JSON-LD files or the retired JSON-LD-specific compiler as runtime inputs.
- Retired the executable JSON-LD path resolver after confirming its only remaining runtime consumer was its own obsolete fixture test; retained only renderer-neutral `ResolvedLearningPath` and `ResolvedPathStep` contracts required by the scene composer.
- Removed `packages/core/test/path-resolver.test.ts`, which executed deleted `content/**/*.jsonld` fixtures.
- Added nine canonical Dataset path-resolution regressions covering authored nine-scene order, semantic resource selections and relation paths, missing path, step, scene and selected resource failures, and duplicate, non-integer and non-positive positions.
- Added `cd:latex` to the canonical audience-visible literal resolution boundary so the formula scene resolves `ex:sample-sd-formula` directly from authored TriG rather than from compiler or renderer content.
- Added focused canonical runtime regressions proving the exact formula text, RDF resource identity, authored relation path and named-graph provenance, plus fail-closed behavior when the selected MathExpression has no audience-visible literal.
- Preserved historical reviews and handoffs unchanged because they are evidence rather than executable consumers.

## Files or resources changed

- `scripts/generate_canonical_runtime.py`
- `scripts/rdf_dataset.py`
- `scripts/validate_semantics.py`
- `scripts/check-json.mjs`
- `scripts/json-candidates.mjs`
- `scripts/json-candidates.test.mjs`
- `package.json`
- `packages/core/src/path-resolver.ts`
- `packages/core/src/scene-document.ts`
- `packages/core/README.md`
- `packages/core/test/path-resolver.test.ts` — deleted
- `tests/test_canonical_runtime_path_resolution.py` — added and extended for canonical `cd:latex`
- `apps/pitch/src/graph-scene-data.ts`
- `apps/pitch/src/preview.ts`
- `apps/pitch/README.md`
- root and pitch package scripts
- canonical semantic and browser tests
- `docs/architecture/canonical-trig-runtime.md`
- `docs/graph-scene-compiler.md`
- deleted compatibility inputs listed in the migration document

## Verification

- [ ] Automated tests — fresh authoritative exact-head local validator required after the canonical `cd:latex` correction
- [ ] Semantic validation — fresh authoritative exact-head local validator required after the correction commits
- [ ] Manual browser check — required for manager acceptance
- [ ] Static fallback parity — required for manager acceptance
- [x] Focused path coverage — canonical Dataset tests preserve successful ordering and semantic selection plus missing and invalid dependency failure modes without JSON-LD fixtures
- [x] Focused formula coverage — canonical `cd:latex` is selected from TriG with exact RDF identity, relation path and specification-graph provenance; removing that literal fails closed
- [x] Focused JSON discovery coverage — absent and present root `package-lock.json` discovery cases are deterministic Node tests
- [x] Accessibility boundary — reading order, accessible scene labels and provenance-bearing DOM structure preserved in code/tests
- [x] Active documentation updated to the canonical TriG runtime boundary

## Decisions and assumptions

- Generated `canonical-runtime.json` is disposable, ignored by Git and regenerated before development/tests; it is not an authored semantic source.
- Canonical path resolution and validation now belong to `scripts/generate_canonical_runtime.py` over the assembled RDF Dataset; TypeScript retains only the resolved-path contracts needed by renderer-neutral scene composition.
- `cd:latex` is an authored mathematical literal in the canonical Dataset and is resolved before older compatibility-style `cd:expression` or `cd:notation` predicates; no formula text is duplicated in Python, TypeScript or renderer code.
- `check:json` validates JSON under `.agents`, `apps` and `packages` plus the required root `package.json`; a root `package-lock.json` is validated only when it exists.
- No lockfile was generated or introduced because the repository does not currently define a maintained lockfile policy.
- Candidate traversal and output order are deterministic.
- Historical handoffs and reviews remain unchanged even when they mention deleted paths, because they are historical evidence rather than active consumers.
- A temporary fail-closed `include_legacy=False` call-site compatibility parameter remains in the Dataset assembler solely to prevent stale tests from restoring legacy inputs; `include_legacy=True` is rejected.
- No JSON-LD file or parity-maintained TypeScript semantic copy was restored.

## Risks or unresolved questions

- This connector-only worker could not execute Python, Node, SHACL or browser commands. The exact-head external validator is therefore required before acceptance.
- The no-JavaScript fallback must be manually inspected against the generated nine-scene Standardabweichung sequence. Any parity failure requires a bounded correction without reintroducing legacy authored sources.
- Historical evidence contains references to retired files by design; future hygiene checks should distinguish historical records from active code, tests and current documentation.

## Recommended manager action

`review only after agent-validator/project-chemie-digital is success on the exact current PR head, then require manual browser and static-fallback parity evidence before acceptance`