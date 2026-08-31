# Agent handoff

## Role

`Software Architect`

## Issue

`#100 — Define renderer-neutral teaching-offering runtime document boundary`

## Completed

- Added ADR-0010 defining `TeachingOfferingRuntimeDocument 1.0` as a versioned renderer-neutral disposable read model derived from one validated canonical RDF Dataset revision.
- Located the new boundary downstream of validated `TeachingOffering` composition and upstream of application navigation/path-selection UI.
- Defined a normalized contract that keeps `UnitPlacement` occurrences separate from reusable `LearningUnit` records: placements own authored curriculum position and reference units by stable IRI; units own authored display metadata and available path references.
- Required stable absolute HTTP(S) offering/placement/unit/path identities and exact path `{id, graphId}` references without making labels, array indexes, positions or named graphs semantic identity substitutes.
- Bound each runtime document to the same deterministic `sha256:` Dataset fingerprint used by the current canonical runtime and learner-state compatibility checks, with fail-closed mixed-revision behavior.
- Defined authored multilingual display metadata as language-preserving arrays and explicitly prohibited IRI-local-name, renderer-name or filename fallbacks as authored course/path labels.
- Recorded that the current Standardabweichung `TeachingOffering` and `LearningUnit` have authored German `skos:prefLabel` values while `ex:path-standard-deviation` currently has no authored human-readable path label; the path therefore remains `labels: []` in the reference runtime document.
- Kept path discovery separate from ADR-0009 path selection: the runtime document exposes available paths but contains no selected/current/preferred/default path state. Multi-path omission remains ambiguous after revalidation.
- Kept `TeachingOfferingComposition`, `CourseUnitPathSelection`, `ResolvedLearningPath`, `SceneDocument 1.0` and `LearnerStateDocument 1.0` as distinct contracts with independent responsibilities.
- Explicitly rejected using generic `datasetSnapshot.statements` as an implicit course-navigation schema when the typed runtime document is available.
- Defined deterministic ordering: placements by authored `UnitPlacement.position`; units by stable IRI for serialization only; paths by exact `(id, graphId)` for serialization only. Serialization order never becomes path preference.
- Chose an additive later packaging strategy: `teachingOfferingDocuments[]` may be added to the existing `canonical-runtime` root while keeping `artifactVersion: "1.0"`, because existing root-field semantics remain unchanged. The new teaching-offering document has its own `version: "1.0"` lifecycle.
- Defined accessibility and privacy boundaries and included current Standardabweichung plus hypothetical multi-unit/multi-path flows.
- Added a bounded implementation handoff for a future projector/runtime task without implementing any code in this issue.

## Files or resources changed

- `docs/adr/0010-teaching-offering-runtime-document.md` — ADR-0010 and the complete runtime/read-model boundary.
- `.agents/handoffs/issue-100-teaching-offering-runtime-architecture.md` — this structured handoff.

## Verification

- [ ] Root `npm test` — not executed by this connector-oriented worker; authoritative exact-head `agent-validator/project-chemie-digital` evidence is required after the draft PR is opened.
- [x] Architecture boundary review — verified the document remains generated transport/read state rather than authored semantic authority or a renderer/navigation contract.
- [x] Existing runtime-container compatibility review — current consumers structurally read `artifactVersion`, Dataset fingerprint and SceneDocuments and do not require exact root-key equality, supporting the ADR's additive `teachingOfferingDocuments[]` migration decision.
- [x] Current semantic metadata review — verified authored German labels exist for the current offering and Standardabweichung unit and that the current Standardabweichung LearningPath has no authored human-readable label.
- [x] Contract-separation review — ADR-0009 selection, `ResolvedLearningPath`, `SceneDocument 1.0`, `TeachingOfferingComposition` and `LearnerStateDocument 1.0` remain unchanged and independent.
- [x] Scope review before handoff — branch differed from `main` only by ADR-0010; this handoff is the only second intended file.
- [x] Accessibility review — requires authored/semantically derived human-readable navigation names, preserved language tags and accessible downstream controls without encoding visual layout.
- [x] Privacy review — runtime document contains project-authored semantic/display data and Dataset revision evidence only; no learner identity, answers, progress, timestamps, analytics, accounts or tracking.
- [x] Documentation updated through ADR-0010 and this handoff.
- [ ] Browser check — not applicable because Issue #100 changes no renderer, browser application or authored rendered content.

## Decisions and assumptions

### `TeachingOfferingRuntimeDocument 1.0` is normalized rather than a UI tree

Placements and reusable units are separate arrays joined by `unitId`. This preserves ADR-0008 ownership: placement position belongs to the occurrence in an offering, while unit labels and available paths belong to the reusable unit. A repeated unit therefore does not create duplicated semantic copies.

### Dataset fingerprint is revision evidence, not semantic identity

The course runtime document carries the same `sha256:` Dataset fingerprint already used by the generated runtime and learner-state. Consumers must reject mixed revisions before constructing/delegating an ADR-0009 selection request; the selector still revalidates stable identities against the current Dataset.

### Missing authored path labels remain missing

The current path has no authored `skos:prefLabel`. ADR-0010 deliberately represents that as empty display-metadata arrays rather than deriving a label from `path-standard-deviation`, a renderer mode or a presumed teaching modality. If a future real multi-path UX requires human-readable path choices, adding path-owned semantic descriptors is a separate semantic task.

### Ordering and selection remain different responsibilities

Only `UnitPlacement.position` carries course-order semantics. Unit/path sorting is canonical serialization only. A multi-path unit without an explicit requested path remains ambiguous under ADR-0009 regardless of serialized path order.

### Existing `canonical-runtime` root can be extended additively

ADR-0010 recommends adding `teachingOfferingDocuments[]` while retaining root `artifactVersion: "1.0"`, because existing root fields keep their meaning and current consumers ignore additional keys. The new document is independently versioned. A future incompatible outer-container change would require its own migration/version decision.

### Scene packaging does not move into the course document

`TeachingOfferingRuntimeDocument 1.0` lists available paths but does not embed resolved paths or SceneDocuments. If future eager multi-path static packaging needs exact path-reference-to-SceneDocument lookup, that belongs to separate generated packaging metadata rather than the course read model.

## Risks or unresolved questions

- ADR-0010 remains literal `Status: Proposed`; the worker does not self-accept architecture decisions.
- Exact-head project validation is pending until the local validator publishes `agent-validator/project-chemie-digital` for the draft PR head.
- The later implementation must choose the exact projector/type-validation file locations; ADR-0010 recommends a small offline projector such as `scripts/teaching_offering_runtime.py` plus an optional neutral TypeScript transport validator, without duplicating semantic-client or path-selection policy.
- The current canonical path metadata is sufficient for singleton selection but not for an accessible multi-path chooser. A future real multi-path feature may require a separately reviewed semantic task for path-owned labels/modality/audience descriptors.
- The additive outer-artifact compatibility decision should be locked with consumer tests when implemented, especially if any future consumer introduces exact-key parsing.

## Recommended manager action

`review` after authoritative exact-head `agent-validator/project-chemie-digital` evidence is available. Verify the exact two-file ADR-only scope, normalized placement/unit responsibility, authored multilingual display rules, Dataset-fingerprint stale-context boundary, strict separation from current selection/SceneDocument/learner-state, additive runtime-container compatibility decision, and the Standardabweichung/multi-path examples before acceptance.
