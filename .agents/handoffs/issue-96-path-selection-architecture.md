# Agent handoff

## Role

`Software Architect`

## Issue

`#96 — Define renderer-neutral course/unit/path selection boundary`

## Completed

- Added `ADR-0009` defining a renderer-neutral course/unit/path selection and delegation boundary downstream of `TeachingOffering` composition discovery and upstream of existing path resolution.
- Defined a minimal normalized selection context using stable `offeringId`, `placementId`, `unitId` and one exact path reference `{id, graphId}`.
- Classified path named-graph identity as ownership/provenance evidence used for exact membership validation, while the path IRI remains the semantic path identity.
- Resolved the singleton-selection question: an omitted requested path may be normalized only when exactly one available path reference exists; zero candidates fail as no-path and multiple candidates fail as ambiguous.
- Prohibited implicit winner selection by IRI sorting, named-graph/RDF/TriG/SPARQL order, path-step/course position, labels, renderer type, routes or timestamps.
- Defined fail-closed membership/integrity checks for offering, placement, unit and exact available path-reference membership.
- Defined deterministic failure categories for offering/placement not found, inconsistent unit context, no available path, selected path not available, incomplete identity context and ambiguous selection.
- Classified the current `compile_scene_document(dataset)` global `LearningPath` cardinality check as a single-topic demonstrator constraint that a later implementation should replace with explicit selected-path delegation.
- Preserved separate course-placement and path-step ordering responsibilities.
- Preserved `ResolvedLearningPath`, `SceneDocument 1.0`, canonical TriG authority, learner-state separation and renderer independence.
- Included current and hypothetical two-path Standardabweichung reference flows.

## Files or resources changed

- `docs/adr/0009-course-unit-path-selection.md` — normative selection/delegation architecture decision.
- `.agents/handoffs/issue-96-path-selection-architecture.md` — this structured handoff.

## Verification

- [ ] Root `npm test` — not executed by this connector-oriented ADR worker; authoritative exact-head validation is required after the draft PR is opened.
- [x] Architecture boundary review — checked ADR-0009 against ADR-0002 dependency direction, ADR-0008 course/path separation, the Issue #94 semantic-client result shape, the retained `ResolvedLearningPath` contract and the current runtime generator behavior.
- [x] Current runtime evidence — `scripts/generate_canonical_runtime.py` currently scans all `cd:LearningPath` resources and raises `Expected exactly one canonical LearningPath` when the global count differs from one; existing path-resolution tests explicitly cover the zero-path case.
- [x] Current semantic fixture evidence — the Standardabweichung `LearningPath` is associated with `ex:learning-unit-standard-deviation` through the existing course-scale/path named graph and is the sole current available path reference for that unit.
- [x] Scope review — no runtime/compiler, semantic-client, TriG/SHACL, renderer, learner-state, LMS or production contract implementation was modified.
- [x] Accessibility/privacy review — selection is non-visual stable semantic context with no personal data; downstream applications remain responsible for accessible controls if they expose multiple path choices.
- [x] Documentation updated through ADR-0009.
- [ ] Browser check — not applicable because this issue changes no UI or rendered behavior.

## Decisions and assumptions

### Singleton fallback is allowed only for a true singleton candidate set

The ADR permits a consumer to omit `requestedPath` when the selected unit exposes exactly one available `{id, graphId}` reference. The selector then returns that reference explicitly in the normalized result before resolution. This preserves current demonstrator behavior without introducing path ranking.

Zero candidates fail as unavailable. Two or more candidates without an explicit available reference fail as ambiguous. Sorting is never a semantic selection policy.

### Exact path-reference membership is validated as an IRI + named-graph pair

Issue #94 intentionally preserves path named-graph identity. ADR-0009 therefore validates an explicit request against the exact `(path.id, path.graphId)` pair returned for the selected unit. `path.id` remains the semantic identity; `graphId` remains evidence/ownership context and may later be passed as an expected resolution provenance constraint.

If the same path IRI appears as an available reference from more than one path graph, omission is not treated as a singleton and path IRI alone does not silently collapse the ambiguity.

### Offering + placement + unit identities remain explicit context

`offeringId` prevents reuse of stale selection context across offerings. `placementId` identifies the concrete reusable-unit occurrence. `unitId` is retained as an explicit integrity assertion and must match the unit referenced by the selected placement. Numeric placement position is deliberately excluded from identity because curriculum order may change without changing the placement occurrence.

### Selection remains ephemeral application/compiler context

The normalized selection is not new authored RDF, navigation state or learner state. It selects among already-authored paths and delegates one stable path identity to the existing resolution stage.

## Risks or unresolved questions

- ADR-0009 is `Status: Proposed`; this worker does not accept its own architecture decision.
- ADR-0008 and ADR-0002 also still contain `Status: Proposed`; this issue does not alter historical ADR status fields.
- The current runtime generator still has the global single-path assumption until a later accepted implementation task changes it.
- A later implementation must decide the exact package/function placement for the selector and whether the resolver receives `{pathId, pathGraphId}` directly or receives `pathId` plus a separately enforced expected graph constraint. ADR-0009 requires the exact discovered reference to be validated before resolution but deliberately does not prescribe a premature production API.
- No semantic modality/audience/path-ranking vocabulary exists yet. If later needed, it requires a separate semantic decision and must not be inferred from renderer type or labels.

## Exact recommended next boundary

After manager acceptance of ADR-0009, the next bounded implementation should replace the runtime generator's global single-`LearningPath` discovery with an additive renderer-neutral selector/delegator implementing the ADR rules. That follow-up should:

- operate on the current typed course-scale composition result or an equivalent immutable validated input;
- normalize singleton selection and fail closed for zero/multiple candidates as defined by ADR-0009;
- validate exact offering/placement/unit/path-reference membership;
- pass one selected path identity to deterministic path resolution;
- update the current canonical-runtime tests to prove that an unrelated second valid `LearningPath` no longer breaks resolution of an explicitly selected path;
- add ambiguity and wrong-unit/wrong-graph tests;
- preserve `ResolvedLearningPath`, `SceneDocument 1.0`, canonical TriG/SHACL, renderers and learner-state unchanged.

Whether that implementation belongs entirely in `packages/core`, partly in the runtime generator, or uses a small neutral selector module should be decided from the existing package dependency direction during the manager planning turn. This is a recommendation only; this worker does not assign follow-up work.

## Recommended manager action

`review` after authoritative exact-head `agent-validator/project-chemie-digital` evidence is available.
