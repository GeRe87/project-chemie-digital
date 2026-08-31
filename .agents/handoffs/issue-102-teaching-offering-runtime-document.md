# Agent handoff

## Role

`Backend and Data Integration Engineer`

## Issue

`#102 — Implement TeachingOffering runtime document generation`

## Completed

- Added `scripts/teaching_offering_runtime.py` as the renderer-neutral offline `TeachingOfferingRuntimeDocument 1.0` projector over one supplied immutable `rdflib.Dataset` snapshot.
- Projected one explicit TeachingOffering only; the projector does not globally discover or rank offerings.
- Preserved absolute HTTP(S) TeachingOffering, UnitPlacement, LearningUnit and LearningPath identities plus the exact offering composition graph and exact path named-graph references.
- Kept placements normalized separately from reusable units: placements own authored positive integer course positions and reference units by stable IRI; a reused unit is serialized once.
- Reused the existing ADR-0009 `available_path_references()` discovery rule so a path is available only when `rdf:type cd:LearningPath` and `cd:forLearningUnit` occur in the same named graph; zero available paths remain valid read-model data.
- Preserved same-path-IRI/different-graph references as distinct path records and read path display metadata only from each exact represented path graph.
- Added the bounded ADR-0010 display-metadata whitelist: `skos:prefLabel` to `labels[]` and `dct:description` to `descriptions[]`, preserving RDF language tags and language-neutral literals, deduplicating semantic value/language pairs and sorting deterministically.
- Preserved missing authored metadata as empty arrays. The current Standardabweichung path therefore emits `labels: []` and `descriptions: []` rather than an IRI-, filename-, renderer- or route-derived fallback.
- Extended `scripts/generate_canonical_runtime.py::build_artifact()` additively with `teachingOfferingDocuments[]` while retaining root `artifactVersion: "1.0"`, `datasetFingerprint`, `datasetSnapshot` and `sceneDocuments[]` semantics.
- Constructed the TeachingOffering document with the exact same `sha256:` Dataset fingerprint identity used by the root artifact.
- Kept current path selection outside the course document: ADR-0009 still selects/revalidates the path before `SceneDocument` compilation, and the new document contains no selected/current/preferred/default path state.
- Added deterministic Python coverage for the current Standardabweichung shape, authored German metadata, empty path labels, insertion-order independence, unit reuse, zero-path units, same path IRI in multiple graphs, multilingual/language-neutral metadata, invalid/duplicate positions, inconsistent placement-unit evidence, root/document fingerprint equality and unchanged SceneDocument/static fallback behavior.
- Updated `README.md` to describe `teachingOfferingDocuments[]` as disposable generated course read state and to record the selection/navigation/learner-state boundaries.

## Files or resources changed

- `scripts/teaching_offering_runtime.py` — new deterministic renderer-neutral course runtime projector.
- `scripts/generate_canonical_runtime.py` — additive `teachingOfferingDocuments[]` packaging using the active request's offering and the root Dataset fingerprint.
- `tests/test_teaching_offering_runtime.py` — focused ADR-0010 projector/runtime compatibility tests.
- `README.md` — generated TeachingOffering runtime read-model documentation.
- `.agents/handoffs/issue-102-teaching-offering-runtime-document.md` — this handoff.

## Verification

- [ ] Root `npm test` — not executed by this connector-oriented worker; authoritative exact-head `agent-validator/project-chemie-digital` evidence is required after the draft PR is opened.
- [x] Branch-scope review — before handoff, the branch differed from `main` only by the new projector, the narrowly modified generator, focused tests and README; this handoff is the intended fifth file.
- [x] Generator-diff review — the generator change is limited to the projector import and additive `build_artifact()` packaging; SceneDocument composition and static fallback code are unchanged.
- [x] Contract review — the runtime document preserves ADR-0010 normalization, absolute identities, deterministic ordering, authored-only metadata, exact path graph identity and root fingerprint equality without adding selection state.
- [x] Compatibility review — current self-study consumers structurally read the existing root fields and are intentionally unchanged; focused Python coverage verifies the added field does not alter the generated SceneDocument or static fallback result.
- [x] Accessibility review — authored labels and RDF language tags are preserved for future accessible navigation controls; the transport itself adds no visual interaction and fabricates no missing path name.
- [x] Privacy review — the document contains only project-authored semantic/display data and Dataset revision evidence; no learner identity, answers, progress, score, timestamp, analytics, accounts or tracking are introduced.
- [x] Documentation updated.
- [ ] Browser check — not applicable because Issue #102 intentionally does not change renderer/application navigation or current browser consumption.

## Decisions and assumptions

### Reuse path discovery instead of duplicating ADR-0009 membership logic

The course read model needs all available path references, including zero or multiple references, but must use the same graph-local membership rule as path selection. The projector therefore calls `available_path_references()` rather than reproducing `rdf:type` / `forLearningUnit` discovery. It does not call `select_course_unit_path()` because selection ambiguity is not an error for read-model discovery.

### Offering/unit metadata stays in the composition graph; path metadata stays in each path graph

The TeachingOffering type establishes exactly one composition graph. Membership, placement position, unit relation and offering/unit display metadata are read only from that graph. A path's label/description is read only from its exact represented named graph, so the same path IRI can remain distinct across graphs without metadata leakage.

### The root fingerprint is passed into the projector

`build_artifact()` computes the canonical Dataset fingerprint once, prefixes it with `sha256:`, and passes that exact value to the TeachingOffering projector. The projector validates the identity shape but does not independently recompute a second revision identifier. Root/document equality is therefore by construction over the same Dataset snapshot.

### No TypeScript transport validator yet

Issue #102 explicitly limits implementation to the active offline Python generation path. Existing browser consumers do not need the course document yet and tolerate additive root fields. A TypeScript/core runtime contract and browser stale-fingerprint rejection remain separate later integration work rather than being introduced unused here.

## Risks or unresolved questions

- Authoritative project validation is pending until the external exact-head validator publishes `agent-validator/project-chemie-digital` for the final draft-PR head.
- The projector assumes the supplied Dataset has already passed the repository's normal semantic validation; it still fails closed on the runtime invariants named by Issue #102 (offering graph ownership, placement membership, one unit relation, positive unique position, valid stable identities and graph-local path discovery).
- The current authored Standardabweichung path has no human-readable path label. The runtime correctly preserves that absence. A future multi-path chooser may require a separately reviewed semantic task adding path-owned descriptors before an accessible chooser can present meaningful alternatives.
- Browser/application consumption of `teachingOfferingDocuments[]`, course navigation and mixed-fingerprint rejection remain intentionally out of scope for this increment.

## Recommended manager action

`review` after authoritative exact-head `agent-validator/project-chemie-digital` evidence is available. Verify the five-file bounded scope, current Standardabweichung document shape, authored-only metadata behavior, graph-local path provenance, deterministic synthetic coverage, root/document fingerprint equality, unchanged SceneDocument/static fallback behavior and absence of UI/ontology/learner-state scope expansion before acceptance.
