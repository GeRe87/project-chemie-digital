# Agent handoff

## Role

Software Architect

## Issue

#17 — Define bounded knowledge-network renderer architecture

## Completed

- Proposed ADR-0006 with an additive renderer-neutral `KnowledgeNetworkDocument 1.0` boundary.
- Selected the validated logical RDF dataset as projector input while keeping D3 behind a separate adapter.
- Preserved the existing resolved-path, scene-document and Reveal pipelines unchanged.
- Defined deterministic traversal, identities, ordering, canonical serialization, diagnostics, provenance, external-reference, accessibility, privacy and offline requirements.
- Sequenced the pure projector implementation before the D3 runtime implementation in the backlog.

## Files or resources changed

- `docs/adr/0006-knowledge-network-projection-boundary.md`
- `docs/backlog.md`
- `.agents/handoffs/issue-17-software-architect.md`

## Verification

- [ ] Automated tests — not added; this increment changes architecture documentation only
- [x] Semantic validation — no ontology, RDF or SHACL content changed
- [ ] Manual browser check — excluded; no browser runtime is included
- [x] Accessibility check — explicit reading orders, keyboard, reduced-motion and static-fallback obligations defined
- [x] Documentation updated

Repository validation is delegated to the draft pull request's required GitHub Actions check.

## Decisions and assumptions

- A graph view is a sibling projection from the validated logical RDF dataset, not a transformation of the sequential `SceneDocument` contract.
- The pure projector owns semantic selection and deterministic normalization.
- The D3 adapter owns coordinates, force simulation, visual encodings, interactions, React/DOM integration and lifecycle.
- RDF source-file boundaries remain review units only; projection operates on one merged validated dataset snapshot.
- External references remain inert and versioned; projection performs no implicit fetching.

## Risks or unresolved questions

- The subsequent implementation issue must choose the exact neutral package location and dataset snapshot interface without introducing a D3 dependency.
- Seeded adapter-local force layouts may be useful for reproducible screenshots, but are intentionally deferred from the semantic projection contract.
- Remote GitHub Actions validation is pending on the draft PR.

## Recommended manager action

review
