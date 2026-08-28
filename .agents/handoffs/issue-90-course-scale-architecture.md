# Agent handoff

## Role

`Software Architect`

## Issue

`#90 — Define course-scale semantic composition boundary`

## Completed

- Added ADR-0008 defining a renderer-neutral course-scale semantic composition boundary.
- Selected the minimal architecture terminology `TeachingOffering`, `LearningUnit`, and `UnitPlacement` to avoid overloading institution-specific `Course` / `Module` terms.
- Refined ADR-0002 without reversing its dependency direction: course-scale composition sits upstream of didactic path templates and downstream of reusable semantic resources.
- Separated offering/unit composition order from didactic `LearningPath` / `PathStep` order.
- Assigned curriculum order to explicit stable `UnitPlacement` occurrences rather than reusable `LearningUnit` identities, RDF statement order, or file order.
- Defined metadata ownership for offering, unit, path, and reusable resource/concept layers.
- Defined renderer/navigation and learner-state boundaries; `LearnerStateDocument 1.0` remains unchanged.
- Defined named-graph expectations consistent with canonical TriG and Core–Concept–Specification layering.
- Mapped the current Standardabweichung demonstrator into the proposed model without changing scientific content or existing runtime contracts.
- Included required rejected alternatives and an additive migration boundary for the next implementation turn.

## Files or resources changed

- `docs/adr/0008-course-scale-semantic-composition.md`
- `.agents/handoffs/issue-90-course-scale-architecture.md`

No ontology, SHACL, TypeScript, renderer, application, learner-state, package or test files were changed.

## Verification

- [ ] Automated tests — not executed by this connector-oriented architecture worker; the authoritative exact-head `agent-validator/project-chemie-digital` result is required before manager acceptance.
- [ ] Semantic validation — no RDF/SHACL source changed; authoritative root `npm test` still must confirm the exact PR head.
- [ ] Manual browser check — not requested; no runtime/browser behavior changed.
- [ ] Accessibility check — architecture preserves renderer-owned accessible navigation/fallback responsibility; no UI changed.
- [x] Documentation updated — ADR-0008 and this structured handoff are present.

## Decisions and assumptions

- The funded teaching offering is modeled internally as a `TeachingOffering`, not as an institution-specific `Module` class.
- A reusable `LearningUnit` is organizational/didactic scope and does not replace a scientific concept or reusable learning resource.
- `UnitPlacement` is the occurrence-level composition record that owns deterministic curriculum position, allowing the same unit to be reused in multiple offerings/orders.
- Didactic paths remain delivery-specific routes. A path may identify the upstream learning unit it realizes; the unit does not embed an ordered path list.
- Duration normally belongs to the concrete path because lecture/self-study/review durations differ; unit-level duration is deferred unless a delivery-independent meaning is later justified.
- Renderer URLs, menus, tabs, breadcrumbs and router state are derived UI artifacts, not authored RDF.
- Learner progress remains a separate non-semantic bounded context. ADR-0008 does not alter `LearnerStateDocument 1.0`.

## Risks or unresolved questions

- Exact RDF class/property names and SHACL constraints are intentionally deferred to the next semantic-web implementation issue.
- Whether the new vocabulary descriptors should live in the existing `graph:concepts` graph or a dedicated stable curriculum-vocabulary graph should be decided during implementation based on ownership clarity; either choice must preserve one logical dataset and stable named-graph identity.
- The first implementation fixture should remain deliberately small so that course-scale semantics are validated before navigation or curriculum-authoring UI is attempted.

## Exact next implementation boundary

Assign a **Semantic Web Engineer** a bounded follow-up that implements only the ADR-0008 semantic contract:

1. add project-owned vocabulary descriptors for `TeachingOffering`, `LearningUnit`, `UnitPlacement` and the minimum required relations/attributes;
2. add SHACL constraints for stable membership, exactly-one unit per placement, explicit unique deterministic position within an offering, and valid path-to-unit references;
3. add one minimal authored fixture containing the funded teaching offering, one Standardabweichung learning unit and one placement around the existing content;
4. associate an existing or dedicated `LearningPath` with that unit without altering current path-step or scene semantics;
5. add deterministic semantic/query tests only;
6. do not add navigation UI, renderer changes, learner-state changes, LMS integration or full curriculum content.

## Recommended manager action

`review`
