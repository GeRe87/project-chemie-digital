# Agent handoff

## Role

`Semantic Web and Ontology Engineer`

## Issue

`#52 — Build a comprehensive Standardabweichung knowledge specification in TriG`

## Completed

- Added a connected canonical TriG knowledge network for Standardabweichung with separate specification, example, source, scene, path and migration graphs.
- Preserved `ex:standard-deviation` and distinguished sample and population standard deviation, formulas, symbols, denominators and units.
- Added independently addressable definitions, interpretations, misconception/correction pairs, a comparison resource, two chemistry-context examples and two exercises with separate expected-result or assessment resources.
- Added an explicit repeated-pH-measurement dataset with ordered observations and intermediate calculation steps.
- Added four stable source/provenance resources and explicit `cd:supportsResource` coverage for definitions, formula families and interpretation claims.
- Added nine graph-backed scenes and a nine-step learning path that reuse canonical knowledge identities without duplicating audience-visible bodies.
- Extended the reusable vocabulary with learning-resource classes, communicative roles, scientific relations and attributes required by the bounded example.
- Added SHACL constraints and deterministic semantic regressions for multilingual labels, definition scopes, formula-to-symbol completeness, source coverage, prerequisite acyclicity, forbidden equivalence, calculation ordering, authored scene targets and source-order-independent fingerprints.
- Replaced the SHACL-meta-invalid `VALUES` clause in `NoForbiddenEquivalenceShape` with a deterministic `FILTER ... IN (...)` formulation while preserving bidirectional `owl:sameAs` rejection for variance, standard error, accuracy and measurement uncertainty.
- Audited every embedded `sh:select` query and added regression coverage rejecting SHACL-SPARQL `VALUES`, `MINUS` and `SERVICE` clauses.
- Added an explicit regression that meta-validates the complete named shapes graph before semantic mutation checks.
- Added migration/deprecation mappings for the earlier definition, expression, source and scene resources.

## Files or resources changed

- `ontology/dataset/concepts.trig`
- `ontology/dataset/standard-deviation.trig`
- `ontology/dataset/standard-deviation-shapes.trig`
- `tests/test_rdf_dataset.py`
- `tests/test_standard_deviation_knowledge.py`
- `docs/architecture/standard-deviation-knowledge-specification.md`
- `.agents/handoffs/issue-52-semantic-web-engineer.md`

## Verification

- [ ] Automated tests — new exact-head local validator evidence pending
- [x] Complete named-shapes-graph SHACL meta-validation regression added
- [x] Embedded SHACL-SPARQL prohibited-clause audit regression added
- [x] Forbidden scientific-equivalence mutation regression retained
- [ ] Manual browser check — not applicable; no browser feature changed
- [x] Accessibility check — no renderer or audience interaction changed; all scene-visible wording remains RDF-authored
- [x] Documentation updated

## Decisions and assumptions

- External web research was not used because the assigned role and workflow governance did not authorise it.
- Source records use stable, widely established publications and paraphrased project-owned wording; no protected standard definition is copied verbatim.
- `ex:standard-deviation` remains the canonical compatibility identity.
- The forbidden-equivalence constraint remains closed over the exact four scientifically prohibited targets named by issue #52; only its SHACL-SPARQL syntax changed.
- The new graphs remain draft semantic content until the required Chemistry Lecturer/Statistics Subject-Matter review in issue #54.
- Scenes contain only resource selection, order and communicative role; scientific bodies stay in reusable specification resources.

## Risks or unresolved questions

- The local exact-head validator must confirm TriG parsing, SHACL meta-validation, pySHACL conformance and the full `npm test` command on the corrected head.
- The scientific wording, numerical example and pedagogical sequencing require the separately mandated issue #54 subject-matter review before pedagogical acceptance.
- The existing browser compiler still consumes the earlier compatibility transport; consumer migration is outside this issue.

## Recommended manager action

`review`
