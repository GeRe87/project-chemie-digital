# Agent handoff

## Role

`Semantic Web and Ontology Engineer`

## Issue

`#43 — Model graph-backed scene definitions for the standard-deviation slice`

## Completed

- Added the minimal RDF vocabulary for scene definitions, ordered scene items, renderer-neutral communicative roles, selection paths and an optional presentation-pattern hint.
- Added a graph-backed standard-deviation definition-with-citation scene that selects the concept, existing definition and existing source without duplicating their prose.
- Added SHACL constraints for supported resource classes, explicit authored-resource evidence, supported roles and patterns, positive positions and unique ordering.
- Replaced the inference-sensitive generic outgoing-triple check with an explicit `cd:authoredResource true` authoring marker required through the `cd:selectsResource/cd:authoredResource` SHACL property path.
- Preserved the independent allowed-class boundary: selected resources must still conform as `cd:Concept`, `cd:LearningResource` or `cd:Source`.
- Marked the three resources selected by the reference scene—the concept, definition and source—as explicitly authored.
- Added deterministic positive and negative semantic tests, including an absent resource that remains reachable through an RDFS range relation, a typed-but-unmarked resource, a present typed-and-authored control, graph-relation trace checks and a no-duplicated-prose assertion.
- Documented the boundary among canonical RDF resources, graph-backed scene definitions, compiled `SceneDocument` snapshots and renderer output, including the later browser scene-editor boundary.

## Files or resources changed

- `ontology/learning.ttl`
- `ontology/shapes.ttl`
- `content/concepts/standard-deviation.jsonld`
- `content/resources/standard-deviation-resources.jsonld`
- `content/scenes/standard-deviation-definition-with-citation.jsonld`
- `scripts/validate_semantics.py`
- `tests/test_scene_semantics.py`
- `docs/graph-backed-scenes.md`
- `.agents/handoffs/issue-43-semantic-web-engineer.md`

## Verification

- [ ] Automated tests — new exact-head local validator result pending
- [ ] Semantic validation — new exact-head local validator result pending
- [x] Focused regression coverage — inference-only and typed-but-unmarked selected resources are rejected; a typed-and-authored selected resource remains accepted
- [x] Manual browser check — not applicable; renderer changes are excluded
- [x] Accessibility check — no rendered UI introduced; semantic roles and order remain renderer-neutral
- [x] Documentation updated

## Decisions and assumptions

- Reused `cd:hasSource`; no additional reference predicate was semantically necessary.
- `cd:selectionPath` is a constrained, inspectable selector description used to preserve traceability until the separate compiler increment defines executable resolution behavior.
- `cd:DefinitionWithCitation` is a communicative pattern hint only and does not encode a concrete renderer layout.
- The heading item selects the focus concept and requests its German `skos:prefLabel`; the definition and citation items select the existing resources reached through the documented graph path.
- RDFS-derived triples cannot establish authoring provenance. `cd:authoredResource true` is therefore explicit graph evidence and is not declared with a domain that could recreate the marker through inference.
- The existing `sh:or` class constraint remains authoritative for the allowed semantic resource classes and is evaluated independently of the authoring marker.

## Risks or unresolved questions

- The subsequent compiler issue must verify that each declared selector path actually resolves to the explicitly selected resource and must define deterministic language fallback behavior.
- Future scene-selectable canonical resources must carry the explicit authoring marker; this is intentional authoring evidence rather than a renderer concern.
- Exact-head `npm test` evidence must be published by `agent-validator/project-chemie-digital`; this worker did not use GitHub Actions.

## Recommended manager action

`review after new exact-head validator evidence`
