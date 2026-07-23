# Agent handoff

## Role

Software Architect

## Issue

#46 — Design presentation and knowledge-graph view switching

## Completed

- Added a bounded product and architecture specification for switching between presentation, visual graph exploration, and an accessible graph summary.
- Defined cursor preservation, deterministic return-to-scene behavior, focus restoration, stale-scene reconciliation, and failure-safe transitions.
- Separated canonical RDF knowledge, graph-backed scene definitions, compiled `SceneDocument`, graph projection documents, renderer state, local exploration state, and future editor drafts.
- Defined deterministic block-to-RDF identity and provenance bindings using expanded IRIs, canonical ordering, explicit relation paths, and rejection of unstable blank-node identities.
- Defined one-hop related-resource expansion with an explicit relation allowlist and a clear distinction between resources used in the scene and resources merely related to it.
- Added concrete keyboard, screen-reader, reduced-motion, non-color, and non-graph fallback requirements.
- Added privacy boundaries for session-local state, opt-in persistence, versioned export/import, and explicit clear behavior without mandatory accounts, telemetry, or network services.
- Documented failure modes and a six-stage implementation plan. The first bounded increment is renderer-neutral identity/state contracts and pure validation helpers, not UI implementation.

## Files or resources changed

- `docs/architecture/presentation-graph-view-switching.md`
- `.agents/handoffs/issue-46-software-architect.md`

## Verification

- [ ] Automated tests — no feature code was added; exact-head repository validation remains manager-gated through `agent-validator/project-chemie-digital`.
- [ ] Semantic validation — no ontology, RDF, SHACL, or canonical content was changed.
- [ ] Manual browser check — not applicable; no UI was implemented.
- [x] Accessibility check — specification includes testable keyboard, focus, screen-reader, reduced-motion, visual-semantics, and fallback contracts.
- [x] Documentation updated.

## Decisions and assumptions

- The application shell, not Reveal.js or a graph adapter, owns cross-view mode and cursor state.
- Local exploration state is keyed by scene identity and deterministic scene revision; it never mutates canonical RDF.
- The accessible graph summary is a first-class rendering of the same projection document and precedes an optional visual graph adapter in the staged plan.
- Directly related resources are limited to explicit one-hop expansion through a versioned predicate allowlist.
- Compiled scene and graph documents are disposable snapshots, not authoring sources.
- A future editor uses a separate validated draft graph and an explicit promotion gate; exploration state is never promoted automatically.

## Risks or unresolved questions

- The exact relation allowlist, user-facing relation labels, and skolemization policy require later Semantic Web and subject-matter review.
- Local persistence defaults and retention duration require privacy and human product review.
- Visual layout and interaction vocabulary require frontend and accessibility review.
- Remote-store outage behavior belongs to a later Fuseki/deployment decision.

## Recommended manager action

review
