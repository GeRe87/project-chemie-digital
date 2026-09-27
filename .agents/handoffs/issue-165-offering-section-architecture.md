# Agent handoff

## Role

`Software Architect`

## Issue

`#165 — Define OfferingSection boundary for course-world regions`

## Completed

- Added ADR-0015 defining `OfferingSection` as a renderer-neutral, offering-specific curriculum grouping overlay over existing `UnitPlacement` identities.
- Preserved the authoritative ADR-0008 composition `TeachingOffering → UnitPlacement → LearningUnit`; sections do not replace or nest away direct placement membership.
- Defined stable section identity, independent authored section order, same-offering membership, total placement coverage once an offering opts into sections, and exactly-one-section membership for each direct placement.
- Kept unit order inside a section on the existing `UnitPlacement.position`; no second unit-order field is introduced.
- Defined empty sections as valid curriculum planning metadata that create no placeholder LearningUnits, paths, scenes or scientific content.
- Kept path selection, SceneDocument packaging, learner progress, unlock logic, routes, map coordinates, terrain, icons, colors and animation outside the semantic boundary.
- Defined section-owned metadata narrowly: stable IRI, authored label/description, section position and grouped placement references.
- Chose `TeachingOfferingRuntimeDocument 1.1` as the explicit section-capable contract with required `sections[]`.
- Preserved support for `TeachingOfferingRuntimeDocument 1.0` as legacy flat composition and explicitly prohibited interpreting missing 1.0 sections as proof that an offering has no authored sections.
- Defined `version: "1.1", sections: []` as the unambiguous current-state representation of a validated offering with no authored sections.
- Kept outer `CanonicalRuntimeArtifact.artifactVersion: "1.0"` because the independently versioned nested TeachingOffering document can evolve without changing existing root-field semantics.
- Bounded the next implementation: #166 owns generic semantic/SHACL/runtime/type support, #167 owns Chemometrics section instances, #168 owns Self-Study region visuals, and #164 remains the separate learner-progress track.

## Files or resources changed

- `docs/adr/0015-offering-section-boundary.md` — complete OfferingSection and runtime-version architecture decision.
- `.agents/handoffs/issue-165-offering-section-architecture.md` — this structured handoff.
- `.agents/workflows/system/state.json` — governed System workflow turn evidence only.

## Verification

- [x] ADR-0008 compatibility review — direct TeachingOffering/UnitPlacement composition remains authoritative and reusable-unit semantics are unchanged.
- [x] ADR-0010 compatibility review — course runtime remains a renderer-neutral generated read model and outer canonical-runtime versioning remains independent.
- [x] Version ambiguity review — 1.1 is required so legacy 1.0 “section capability unavailable” cannot be confused with explicit 1.1 `sections: []`.
- [x] Ordering review — section position and UnitPlacement position remain separate authored orders with no RDF/file-order fallback.
- [x] Empty-section review — empty regions carry no implied unit/content/progress semantics.
- [x] Renderer boundary review — no route, coordinate, icon, terrain, color, lock or animation metadata is authorized.
- [x] Learner-state boundary review — no progress/completion aggregation rule is introduced.
- [x] Privacy review — section runtime data is project-authored curriculum metadata only.
- [x] Scope review — no ontology, SHACL, runtime/compiler, application, renderer, learner-state or Chemometrics content implementation is included.
- [ ] Root `npm test` — not executed by this connector-oriented architecture worker; authoritative exact-head validator evidence is required on the Draft PR head.
- [ ] Browser check — not applicable because this issue changes no renderer/application behavior.

## Decisions and assumptions

### OfferingSection groups placements, not units

Grouping `UnitPlacement` preserves offering-specific organization while keeping `LearningUnit` reusable. A reused unit can therefore belong to different sections in different offerings or occurrences without mutating the unit identity.

### Total coverage is opt-in but strict once sections exist

Offerings with no sections remain valid. Once any section is authored, every direct placement in that offering must belong to exactly one section. Applications must never guess where an ungrouped placement belongs.

### Empty sections are real authored roadmap structure

An empty section means only that the curriculum region exists but currently has no assigned UnitPlacement. It is not a placeholder unit and carries no learner-state meaning.

### TeachingOfferingRuntimeDocument 1.1 is deliberate

The new section capability is not represented as an optional field on 1.0. A 1.0 document means the legacy contract cannot carry section read state. A 1.1 document always carries `sections[]`, and an empty array explicitly means the validated offering currently has no sections.

### Outer artifactVersion stays 1.0

The canonical runtime root already owns an independently versioned `teachingOfferingDocuments[]` collection. Supporting 1.0 and 1.1 nested documents is additive and does not change existing root-field meaning.

## Risks or unresolved questions

- ADR-0015 remains `Status: Proposed`; the worker does not self-accept the architecture.
- Exact RDF property/shape names and transport implementation names remain #166 implementation details, though ADR-0015 records the expected semantic responsibilities.
- A future consumer supporting both 1.0 and 1.1 must preserve the distinction between legacy capability absence and explicit current zero-section state.
- No semantic section-completion rule exists. Any later aggregation of SceneDocument progress is a product/state decision and must not be inferred from this ADR.
- Exact-head `agent-validator/project-chemie-digital` evidence is still required before manager acceptance.

## Recommended manager action

`review` after fresh exact-head validator success. Verify the ADR-only scope, preservation of direct UnitPlacement composition, total-coverage and empty-section invariants, the 1.0/1.1 compatibility distinction, outer artifactVersion stability, and strict separation from #164 learner progress, #167 Chemometrics instances and #168 visual regions.
