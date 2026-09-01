# Agent handoff

## Role

`Software Architect`

## Issue

`#112 — Define application TeachingOffering discovery and selection boundary`

## Completed

- Added ADR-0011 defining a renderer/framework-neutral TeachingOffering discovery and selection boundary over already validated `CanonicalRuntimeArtifact 1.0` / `teachingOfferingDocuments[]` values.
- Defined the ephemeral `TeachingOfferingSelectionRequest` responsibility with optional explicit `offeringId` and a normalized selection containing an explicit `offeringId` plus the exact selected validated runtime document.
- Specified deterministic zero/singleton/multiple/explicit-known/explicit-unknown behavior with stable semantic categories equivalent to `NO_TEACHING_OFFERING`, `AMBIGUOUS_TEACHING_OFFERING` and `UNKNOWN_TEACHING_OFFERING`.
- Preserved `offering.id` as the sole TeachingOffering selection identity and `offering.graphId` as provenance/ownership evidence only.
- Explicitly prohibited selection by array order, IRI sort/local name, labels/locale, graph, content counts, path availability, SceneDocuments, renderer, URL/navigation state, learner state, file/RDF order or time.
- Preserved valid zero-path units: an offering remains discoverable/selectable even when one or every unit exposes `paths: []`; ADR-0009 owns the later no-path failure only after placement/unit selection.
- Kept ADR-0009 downstream and unchanged: ADR-0011 selects only one TeachingOffering document and does not select placement, unit, path, scene or learner progression.
- Kept normal selection offline over the validated runtime artifact; no live Fuseki/SPARQL lookup and no `datasetSnapshot.statements` reconstruction is permitted.
- Documented current single-offering compatibility as a justified singleton fallback without creating a permanent default, and future multi-offering omission as fail-closed ambiguity.
- Reconciled Draft PR #113 onto current `main` after the accepted Issue #116 / PR #117 lifecycle-aware validation-test correction. ADR-0011 itself was carried forward unchanged; the PR remains architecture-only and two-file scoped.

## Files or resources changed

- `docs/adr/0011-teaching-offering-discovery-selection.md`
- `.agents/handoffs/issue-112-teaching-offering-selection-architecture.md`

No production application/runtime, renderer, ontology/TriG, scientific-content, SceneDocument, learner-state, validator, workflow-governance or Chemometrics files were changed.

## Verification

- [ ] Root `npm test` — authoritative exact-head `agent-validator/project-chemie-digital` evidence is required on the reconciled Draft PR head.
- [x] Reconciliation review — the branch was rebuilt directly on current `main`, which already contains the merged Issue #116 shared lifecycle-test correction; ADR-0011 was reused byte-for-byte from the previously reviewed branch.
- [x] Scope review — the reconciled PR diff remains limited to ADR-0011 and this handoff.
- [x] Architecture boundary review — checked the decision against ADR-0008 course composition, ADR-0009 course/unit/path selection, ADR-0010 runtime-document identity/provenance and Issue #104 shared runtime validation.
- [x] Determinism review — all required zero/singleton/multiple/known/unknown rules and prohibited implicit heuristics are explicit.
- [x] Offline-boundary review — selection consumes only the already validated runtime collection and does not traverse the generic Dataset snapshot or require network services.
- [x] Zero-path compatibility review — `paths: []` remains valid at Offering selection and is delegated downstream only when ADR-0009 receives a later placement/unit context.
- [x] Accessibility review — no UI is added; authored multilingual display metadata is preserved for a later accessible chooser without locale selection or fabricated labels.
- [x] Privacy review — selection is ephemeral project-semantic application context with no learner/account/analytics data.
- [x] Documentation updated.
- [ ] Manual browser check — not applicable because no UI or production behavior was implemented.

## Decisions and assumptions

### Discovery is not selection

Enumerating validated `teachingOfferingDocuments[]` does not choose a current offering. Candidate serialization order, labels and metadata remain non-authoritative for selection.

### Singleton fallback is compatibility, not preference

An omitted `offeringId` succeeds only when the validated candidate set contains exactly one member. Once two or more documents exist, omission becomes `AMBIGUOUS_TEACHING_OFFERING`; no historical/current course becomes an implicit default.

### Offering identity remains singular

`offering.id` is the only selection identity. `offering.graphId` is retained as provenance/ownership evidence and cannot select, order or disambiguate an offering.

### Request and selection are ephemeral application context

Neither belongs in canonical RDF nor `LearnerStateDocument`. Selecting an offering does not imply placement, unit, path, scene, completion or progression state.

### ADR-0009 remains downstream

A later application boundary first identifies placement/unit context inside the selected runtime document and only then constructs `CourseUnitPathSelectionRequest`. ADR-0011 does not merge these responsibilities.

### Reconciliation changes integration basis, not architecture

Issue #116 changed shared repository validation infrastructure after PR #113 was first authored. The reconciled branch therefore uses current `main` as its parent while preserving the exact ADR-0011 content. The old exact-head validator result on `6f5d019a4488c88efedab35c6d7196e897bce4f6` is stale and must not be reused.

## Risks or unresolved questions

- Fresh exact-head `agent-validator/project-chemie-digital` evidence is required on the reconciled PR head before manager acceptance.
- No semantic/content blocker exists for the architecture contract itself. A future multi-offering UI could encounter missing authored human-readable offering/path metadata; such metadata must be handled by a separate semantic/content task rather than fabricated from IRIs.
- Production type/error names are intentionally not implemented here; a later bounded System issue should implement the decision in the shared application/core boundary without changing the semantic rules.

## Recommended manager action

`review` after fresh exact-head `agent-validator/project-chemie-digital` evidence is available. Verify the two-file architecture-only scope, current-main integration basis, deterministic fail-closed policy, sole `offering.id` identity, zero-path compatibility, ADR-0009 separation, offline boundary and absence of Chemometrics/content/runtime implementation changes before acceptance.
