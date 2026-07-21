# Agent handoff

## Role

Semantic Web and Ontology Engineer

## Issue

#26 — Model the bounded pitch content semantically

## Completed

- Added the central `ex:chemie-digital-platform` concept and eight reusable, language-tagged pitch resources covering the knowledge-first proposition, semantic resources, path and scene layers, renderer separation, multiple output channels, the standard-deviation proof of concept and the Studiendekanat vertical-slice purpose.
- Added repository-backed provenance resources with stable repository-relative source paths; no external research or network dereferencing was used.
- Added the narrowly additive `cd:PitchResource`, `cd:PitchSource` and `cd:sourcePath` vocabulary.
- Added SHACL invariants requiring pitch-resource bodies and repository provenance, and requiring one source path per pitch source.
- Extended the complete logical-dataset validation to load the pitch concept and resources together with the existing standard-deviation slice.
- Added a deterministic negative test that removes the required provenance relation in memory and requires SHACL non-conformance.
- Documented file boundaries, identifiers, provenance, validation, later narrative-path reuse, accessibility and privacy.

## Files or resources changed

- `content/concepts/chemie-digital-platform.jsonld`
- `content/resources/pitch-content.jsonld`
- `ontology/learning.ttl`
- `ontology/shapes.ttl`
- `scripts/validate_semantics.py`
- `tests/test_semantic_validation.py`
- `docs/pitch-content.md`
- `.agents/handoffs/issue-26-semantic-web-engineer.md`

## Verification

- [x] Automated semantic tests added and wired through the existing root `npm test` command
- [x] Complete semantic validation now includes both semantic slices
- [x] Deterministic negative provenance validation added
- [ ] Exact-head `agent-validator/project-chemie-digital` status pending after draft PR creation
- [ ] Manual browser check not applicable: no application or renderer runtime changed
- [x] Accessibility check: language-tagged reusable text and downstream static-fallback compatibility recorded
- [x] Documentation updated

## Decisions and assumptions

- Pitch statements use existing `Definition` and `WorkedExample` resource types while also carrying the additive `PitchResource` type, preserving compatibility with existing resource consumers.
- Concrete renderer APIs, component names, layout coordinates and narrative order remain absent from the semantic content. Renderer separation is expressed as an architectural property rather than a concrete implementation request.
- Repository-relative paths are provenance identifiers only and are not implicitly fetched during compilation.
- Source-file boundaries remain review units; validation treats all configured files as one logical RDF graph.

## Risks or unresolved questions

- The exact-head local validator must confirm JSON-LD parsing, SHACL conformance and all existing repository tests on the current PR head.
- The next narrative-path task must select and order these resources without changing their semantic identities or embedding renderer-specific terms.

## Recommended manager action

Review the bounded semantic content, additive vocabulary and SHACL invariants against issue #26. Require `agent-validator/project-chemie-digital` success on the exact current PR head before acceptance or merge.
