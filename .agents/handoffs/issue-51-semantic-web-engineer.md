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
- Corrected the SHACL named graph from the invalid prefixed name `graph:shapes/core` to the absolute stable IRI `<https://w3id.org/project-chemie-digital/graph/shapes/core>`.
- Audited the introduced canonical TriG graph declarations and retained the exact stable graph identities `graph/core`, `graph/concepts` and `graph/shapes/core`.
- Strengthened regression coverage so every canonical TriG source must parse independently and the assembled canonical Dataset must expose exactly the three expected stable populated graph IRIs.
- Audited all embedded SHACL-SPARQL constraints in the canonical shapes graph. The single query now declares its `cd:` prefix inside the `sh:select` string and no longer relies on outer TriG prefix scope.
- Added an executable regression that assembles the complete repository Dataset, selects the named shapes graph, runs the authoritative pySHACL configuration and requires conformance plus a deterministic dataset fingerprint in the report.
- Replaced deprecated `Dataset.contexts()` ownership enumeration with quad-derived `populated_graph_ids()`, so rdflib's automatically materialized but empty default graph is not treated as authored ownership.
- Added explicit regressions proving that an empty default graph is ignored, while a populated default graph and any unexpected named graph remain rejected by the dataset contract.
- Updated canonical serialization to iterate only populated graph identities, preserving stable fingerprints without serializing an empty implementation context.
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

- [ ] Automated tests — new exact-head local validator evidence pending
- [x] Semantic validation regression executes the assembled Dataset against `graph/shapes/core`
- [x] Every embedded SHACL-SPARQL query has query-local prefixes
- [x] Canonical TriG parse regression added for every source
- [x] Exact stable populated graph-IRI regression added
- [x] Empty default graph excluded from ownership and canonical serialization
- [x] Populated default graph and unexpected named graph rejected
- [ ] Manual browser check — not applicable; browser runtime intentionally unchanged
- [x] Accessibility check — no audience-facing UI introduced
- [x] Documentation updated

## Decisions and assumptions

- TriG is the only format for newly authored semantic content.
- Existing JSON-LD is temporary migration input and remains independently readable only through explicitly named compatibility graphs.
- SHACL internal blank nodes are allowed only within `graph/shapes/*`; canonical resource identities elsewhere must be IRIs.
- Slash-bearing graph IRIs are written as absolute IRIs unless a syntactically suitable dedicated prefix is introduced; they are not encoded as invalid prefixed-name local parts.
- Every embedded SPARQL query is a self-contained query document; serialization-level prefix declarations are not assumed to propagate into `sh:select` literals.
- Dataset ownership is defined by populated quads, not by rdflib implementation contexts. An empty default context is harmless; any quad in the default graph is a contract violation.
- The clean project Meta-TBox uses descriptors to avoid collision between structural ontology grammar and scientific domain concepts.
- No external network access, imported ontology, package dependency or license-bearing archive content is used.

## Risks or unresolved questions

- The local exact-head validator must confirm the complete `npm test` command on the corrected PR head.
- The next issue must migrate concrete Standardabweichung knowledge, scene, path and provenance specifications from legacy JSON-LD into owned TriG graphs.
- `ontology/learning.ttl` and `ontology/shapes.ttl` remain compatibility files until all consumers have moved to the Dataset boundary.

## Recommended manager action

`review`
