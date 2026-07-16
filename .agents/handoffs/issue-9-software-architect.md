# Agent handoff

## Role

`software-architect`

## Issue

`#9 — Define deterministic scene-composition rules for the standard-deviation slice`

## Completed

- Added ADR-0004 defining the pure offline composition boundary, deterministic scene and block identities, ordering, provenance propagation, accessibility requirements, stable diagnostics, and all current `viewType` mappings.
- Added a complete five-scene `SceneDocument` 1.0 golden example for the current standard-deviation path.
- Preserved the existing resolved-path and SceneDocument contracts without ontology, SHACL, semantic-content, composer, or renderer changes.

## Files or resources changed

- `docs/adr/0004-deterministic-scene-composition-policy.md`
- `docs/examples/standard-deviation-scene-document-1.0.json`
- `.agents/handoffs/issue-9-software-architect.md`

## Verification

- [ ] Automated tests — no production implementation was added; remote repository validation is pending on the draft PR.
- [ ] Semantic validation — semantic source files were not modified.
- [ ] Manual browser check — not applicable; no renderer or browser work.
- [x] Accessibility check — ADR requires spoken math, semantic labels, static prompt fallbacks, and atomic failure when accessible alternatives are unavailable.
- [x] Documentation updated
- [x] Golden example inspected against `SceneDocument` 1.0 invariants: unique scene/block ids, non-empty sources, complete reading orders, and unique sibling disclosure orders.
- [x] Golden example inspected for prohibited renderer-specific terminology.

## Decisions and assumptions

- The five current steps map one-to-one to scenes; this is a bounded policy for the current slice, not a universal grouping rule.
- Resource order follows the resolver's lexicographically sorted `resourceIds`.
- Spoken math in the fixture is normative fixture data. Production composition must receive equivalent accessible data from normalized resources or an explicit versioned policy input rather than inventing it.
- Existing `viewType` strings are interpreted as didactic composition intents only.

## Risks or unresolved questions

- The future `ResolvedResource` normalization contract remains intentionally undefined beyond the minimal fields named in ADR-0004 and should be specified with the bounded composer implementation.
- Remote CI evidence is pending.

## Recommended manager action

`review`
