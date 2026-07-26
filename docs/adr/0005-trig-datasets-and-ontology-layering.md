# ADR 0005: Canonical TriG datasets and Core–Concept–Specification layering

## Status

Proposed for acceptance with issue #51.

## Decision

TriG is the canonical authored RDF Dataset format. Stable project-owned graph IRIs use `https://w3id.org/project-chemie-digital/graph/` and separate the core Meta-TBox, concept vocabularies, shapes, knowledge specifications, scene specifications, path specifications, provenance specifications, and temporary legacy-import graphs. JSON-LD is transport or migration input only; compiled `SceneDocument` JSON is disposable output.

The repository defines a clean project-owned semantic core rather than depending on or copying the archived CogniFlow package. The verified CogniFlow pattern is used as architectural inspiration only. This avoids an undeclared GPL-3 source/runtime dependency, preserves offline reproducibility, and avoids the archive's unresolved `Relation` versus `Property` vocabulary drift. Future mappings may use `skos:closeMatch` or explicit RDFS mappings only after the corresponding external artifact, version, license and semantic hash are stable and reviewed.

The core grammar contains only ontology-module descriptors (`ConceptDomain`, concept, attribute, relation, controlled-value and shape descriptors). Scientific concept-to-concept relations remain ordinary domain relations in concept modules; they are not forced into structural attributes.

## Consequences

- New authored semantic content must be TriG.
- Canonical graph subjects require stable IRIs; blank-node subjects are rejected at the dataset boundary.
- Dataset assembly is repository-local, sorted by path, network-free and fingerprinted from canonical logical quads.
- Existing JSON-LD remains temporarily readable in explicit `graph/legacy/*` named graphs.
- The former `ontology/learning.ttl` and `ontology/shapes.ttl` compatibility sources are retired; active vocabulary and SHACL ownership now reside exclusively in canonical TriG named graphs.
- Learner and graph-exploration state is never written into the canonical Dataset.
