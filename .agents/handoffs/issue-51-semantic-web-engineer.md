# Agent handoff

## Role

`Semantic Web and Ontology Engineer`

## Issue

`#51 — Adopt TriG datasets and a Core–Concept–Specification ontology architecture`

## Completed

- Added project-owned canonical TriG graphs for the clean Meta-TBox, concept vocabulary and SHACL shapes.
- Recorded ADR 0005 choosing a clean project core with future explicit mappings instead of copying or depending on the GPL-3, vocabulary-drifting CogniFlow archive.
- Added a deterministic offline RDF Dataset assembler, named-graph ownership checks, canonical logical-quad serialization and SHA-256 fingerprinting.
- Isolated existing JSON-LD documents in deterministic `graph/legacy/*` compatibility graphs.
- Changed semantic validation to consume the assembled Dataset and its named SHACL graph.
- Added regression tests for stable graph IRIs, source-order-independent fingerprints, legacy isolation, foreign graph rejection, unsupported blank-node identities and duplicate canonical ownership.
- Documented graph ownership and migration rules; did not build the comprehensive Standardabweichung ABox.

## Files or resources changed

- `ontology/dataset/core.trig`
- `ontology/dataset/concepts.trig`
- `ontology/dataset/shapes.trig`
- `scripts/rdf_dataset.py`
- `scripts/validate_semantics.py`
- `tests/test_rdf_dataset.py`
- `docs/adr/0005-trig-datasets-and-ontology-layering.md`
- `docs/architecture/semantic-dataset-migration.md`

## Verification

- [ ] Automated tests — exact-head local validator pending
- [ ] Semantic validation — exact-head local validator pending
- [ ] Manual browser check — not applicable; browser runtime intentionally unchanged
- [x] Accessibility check — no audience-facing UI introduced
- [x] Documentation updated

## Decisions and assumptions

- TriG is the only format for newly authored semantic content.
- Existing JSON-LD is temporary migration input and remains independently readable only through explicitly named compatibility graphs.
- SHACL internal blank nodes are allowed only within `graph/shapes/*`; canonical resource identities elsewhere must be IRIs.
- The clean project Meta-TBox uses descriptors to avoid collision between structural ontology grammar and scientific domain concepts.
- No external network access, imported ontology, package dependency or license-bearing archive content is used.

## Risks or unresolved questions

- The local exact-head validator must confirm the complete `npm test` command on the PR head.
- The next issue must migrate concrete Standardabweichung knowledge, scene, path and provenance specifications from legacy JSON-LD into owned TriG graphs.
- `ontology/learning.ttl` and `ontology/shapes.ttl` remain compatibility files until all consumers have moved to the Dataset boundary.

## Recommended manager action

`review`
