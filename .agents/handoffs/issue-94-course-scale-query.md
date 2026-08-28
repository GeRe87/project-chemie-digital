# Agent handoff

## Role

`Backend and Data Integration Engineer`

## Issue

`#94 — Expose course-scale composition through typed semantic client`

## Completed

- Extended the existing renderer-neutral `packages/semantic-client` read boundary with a generic `teachingOfferingComposition(offeringId)` API.
- Added `teachingOfferingCompositionQuery(offeringId)` as one SPARQL `SELECT` query over the already-authored course-scale relations.
- Added typed `TeachingOfferingComposition`, `CourseScaleUnitPlacement`, and `CourseScalePathReference` results.
- Preserved named-graph identity for the offering composition evidence and each available learning-path reference.
- Added deterministic grouping, deduplication and ordering independent of SPARQL result-row order.
- Added explicit rejection of contradictory placement rows, duplicate placement positions, split offering graph ownership, malformed identity bindings, and incomplete path/path-graph bindings.
- Preserved zero-path units as an empty path-reference list and missing offerings as `null`.
- Extended the opt-in Fuseki preflight to verify the canonical funded teaching offering → placement position `10` → Standardabweichung learning unit → existing Standardabweichung path relation.
- Updated semantic-client documentation with the new read-only boundary and its non-goals.
- Did not modify canonical TriG/SHACL, scientific content, path/scene compiler contracts, renderers, browser navigation, learner-state, analytics or LMS behavior.

## Files or resources changed

- `packages/semantic-client/src/index.mts` — generic course-scale SPARQL query, typed result interfaces and defensive decoder.
- `packages/semantic-client/test/semantic-query-client.test.mts` — deterministic offline mock-result coverage for ordering, grouping, invalid inputs and ambiguity rejection.
- `packages/semantic-client/src/preflight.mts` — opt-in local Fuseki reference-fixture verification.
- `packages/semantic-client/README.md` — course-scale query contract and boundary documentation.
- `.agents/handoffs/issue-94-course-scale-query.md` — this handoff.

## Verification

- [ ] Root `npm test` — not executed by this connector-oriented worker; authoritative exact-head validation is required after the draft PR is opened.
- [ ] `npm run test:semantic-client` — not executed against a repository checkout in this connector environment; the added tests are intended to run through the exact-head validator.
- [x] SPARQL query smoke check — the course-scale query shape was exercised against a minimal in-memory RDF Dataset with separate course-specification and path named graphs and returned the expected offering graph, placement position, learning-unit IRI, path graph and path IRI.
- [ ] Live Fuseki preflight — not executed because this worker does not have the project's prepared/running local Fuseki service; `npm run fuseki:check` remains opt-in and is not required by ordinary tests.
- [x] Scope/diff review — before this handoff, the branch differed from its `main` base only in the four semantic-client files listed above; no canonical semantic or renderer/application source changed.
- [x] Documentation updated.
- [x] Browser/accessibility gate not applicable to this increment because no browser/UI surface or rendered content changed.

## Decisions and assumptions

### One generic query, not a course runtime model

The new API accepts any absolute HTTP(S) `TeachingOffering` IRI. The only fixture-specific exported constant is `DIGITAL_CHEMISTRY_TEACHING_OFFERING`, used by the opt-in reference preflight. Query construction itself is not Standardabweichung-specific.

The query reads only existing authored course composition and path-association semantics:

```text
TeachingOffering
  → hasUnitPlacement
UnitPlacement
  → position
  → placesLearningUnit
LearningPath
  → forLearningUnit
```

It does not read path steps, scenes, renderer types, routes, progress or learner state.

### Named-graph ownership is returned explicitly

The offering composition triple pattern is matched inside one `GRAPH ?offeringGraph` block, so the typed result carries the graph that owns the queried composition evidence. Path discovery uses `GRAPH ?pathGraph`, and every returned path reference retains that graph identity.

If result rows claim that one offering composition spans multiple offering graphs, decoding fails rather than choosing a graph by row order.

### Course ordering remains authored semantic order

Placements are grouped by stable placement IRI and sorted by explicit positive safe-integer `cd:position`, with placement IRI only as a defensive deterministic tie-breaker. A duplicate position across distinct placements is still rejected; the tie-breaker never legitimizes ambiguous authored order.

Path references are deduplicated by path IRI plus path-graph IRI and sorted deterministically. Path ordering does not affect curriculum placement ordering.

### Defensive decoding does not replace SHACL

Canonical SHACL remains the authoring-time invariant authority. The client nevertheless rejects malformed or contradictory query results so a consumer cannot silently normalize corrupted, stale or non-canonical Fuseki data into a seemingly valid course structure.

### Read-only and input safety

The new query is `SELECT`-only. No SPARQL Update transport was added. Caller-supplied offering IDs pass through the existing absolute HTTP(S) IRI validator before interpolation; credentials and non-HTTP(S) schemes remain rejected.

## Risks or unresolved questions

- The authoritative validator must still execute `npm test`, including the new semantic-client tests, on the exact final PR head.
- The opt-in live Fuseki preflight should be considered supplementary local-service evidence only; it must not replace the configured exact-head commit status.
- The current API deliberately exposes available path references without selecting one. Application-context path selection and any resulting navigation state remain undefined by this issue.
- ADR-0008 itself still has `Status: Proposed` in its file; this worker did not change ADR status or architecture text.

## Exact recommended next boundary

If Phase 4 continues toward an application experience, the next boundary should first define a small renderer-neutral **course/unit/path selection contract** between the typed course-scale query and the existing path resolver. It should take stable semantic identities as input and select/delegate to an existing `LearningPath` without introducing authored navigation RDF, learner progress, or a replacement `ResolvedPath`/`SceneDocument` contract. Whether that boundary needs an ADR or can be an additive application-service contract is a manager planning decision.

This is a recommendation only; this worker does not assign or execute follow-up work.

## Recommended manager action

`review` after authoritative exact-head `agent-validator/project-chemie-digital` evidence is available.
