# Core package

Framework-independent domain types and deterministic transformations for semantic resources, learning paths, scenes and renderer contracts.

## Canonical RDF Dataset boundary

The active runtime is authored exclusively in canonical TriG files under `ontology/dataset/`. Repository-local Dataset assembly preserves named graph identity and supplies validated logical statements to the path, scene and knowledge-network transformations. JSON-LD compatibility documents are not active core inputs.

Generated JSON is disposable renderer transport only and must not become a parallel authored source.

## Offline path and scene compilation

The active Python runtime first validates a renderer-neutral course/unit/path selection against one assembled Dataset snapshot. Offering, placement and learning-unit identities are checked before an exact path IRI + named-graph reference is normalized. Omitted path selection is permitted only for a true singleton candidate set; ambiguous multi-path contexts fail closed.

The selected path reference is then delegated explicitly to scene compilation. The compiler no longer chooses a `LearningPath` by requiring global Dataset cardinality to equal one. It orders only the selected path's `cd:PathStep` resources by their positive integer `cd:position`, resolves the referenced semantic resources and produces the existing renderer-neutral `SceneDocument 1.0` value. The TypeScript `ResolvedLearningPath` and scene contracts remain unchanged.

Compilation preserves stable RDF identifiers, named-graph provenance, relation paths, reading order and accessible alternatives. It fails atomically for missing or ambiguous resources, invalid ordering, unsupported mappings or incomplete dependencies. The core performs no network access and contains no Reveal.js, React, HTML, CSS, browser or concrete renderer concepts.

## Offline scene composer

`composeSceneDocument` accepts a `ResolvedLearningPath` and an immutable map of normalized `ResolvedResource` values. It supports the didactic mappings defined by ADR-0004 and returns either one validated renderer-neutral `SceneDocument 1.0` or stable diagnostics without a partial document.

Resource identifiers are sorted independently of map insertion order. Scene and block identities, source order, reading order, disclosure order, accessible alternatives, explicit narration and available provenance are propagated deterministically.

## Scene-to-RDF bindings and view state

`scene-graph-view-contracts.ts` defines versioned `SceneResourceBinding`, `SceneGraphProjectionRequest` and `ViewSwitchState` contracts. Cross-view mappings use only stable absolute RDF identities, explicit provenance identities and authored relation paths. Identity collections are validated, deduplicated and canonically ordered before serialization.

View state is keyed by the exact scene identity and deterministic scene revision. Matching revisions are preserved unchanged. A changed revision may be reconciled only against an explicit snapshot of available resource and block identities; state from another scene is rejected. The contracts contain no presentation-framework, graph-layout or persistence implementation concepts and perform no network access or canonical RDF mutation.

## Offline knowledge-network projector

`projectKnowledgeNetwork` accepts an explicitly supplied, already parsed and validated logical RDF Dataset snapshot and versioned projection options. It performs deterministic breadth-first traversal across the merged Dataset, restricts traversal to declared predicates and depth, deduplicates semantic entities and relations, and returns either one immutable `KnowledgeNetworkDocument 1.0` or one stable atomic diagnostic.

Nodes, edges and optional semantic-type groups use canonical semantic identities and ordering. Labels, semantic types, source/provenance records and inert versioned external references are preserved. Accessibility metadata includes deterministic node and edge reading orders plus a complete textual fallback. `canonicalSerializeKnowledgeNetworkDocument` provides byte-stable canonical JSON independent of input statement or file ordering.

The projector performs no network access or external-reference dereferencing. D3, React, DOM, coordinates, force simulation and browser lifecycle remain the responsibility of renderer adapters and do not enter the core contract.

## Verification

From the repository root run:

```bash
npm test
```

The path, scene and knowledge-network transformations have no UI surface, user tracking, network access or personal-data processing. Accessibility metadata and static alternatives are explicit contract values and are validated before successful transformation.
