# ADR-0006: Add a renderer-neutral knowledge-network projection before the D3 adapter

- Status: Proposed
- Date: 2026-07-17

## Context

The standard-deviation slice now compiles deterministic learning paths into `SceneDocument` 1.0 and then into an adapter-owned Reveal render plan. A knowledge-network view serves a different purpose: it exposes selected semantic relations as a graph rather than presenting a sequential didactic path. Forcing this view through `SceneDocument` would incorrectly introduce graph semantics into a sequential scene contract, while allowing D3 to query or interpret RDF directly would combine semantic selection, projection policy, layout and runtime behavior in one renderer.

The source remains one validated logical RDF dataset assembled from reviewable JSON-LD or Turtle files. Existing path-resolution, scene-composition, `SceneDocument` 1.0 and `RevealRenderPlan` 1.0 contracts remain unchanged.

## Decision

Introduce an additive renderer-neutral **KnowledgeNetworkDocument 1.0** projection contract in the core learning-compiler boundary. A pure deterministic projector consumes an explicitly supplied, already parsed and validated logical RDF dataset snapshot plus versioned projection options. It produces either one complete immutable document or stable diagnostics; partial documents are forbidden.

The two compatible downstream branches are:

```text
validated logical RDF dataset
├─ path template -> resolved path -> SceneDocument -> Reveal adapter
└─ network projection -> KnowledgeNetworkDocument -> D3 adapter
```

The network projection is not a didactic path, resolved path or scene document. It is an additive renderer-neutral view document derived from the same semantic authority. The projector owns semantic selection and normalization. The D3 adapter owns all force simulation, coordinates, zoom, drag, transitions, SVG/canvas/DOM choices, React integration and browser lifecycle.

No RDF resource, path template, resolved path or scene document may contain D3 component names, force parameters, coordinates, CSS classes or browser lifecycle concepts.

## Minimal contract

```ts
interface KnowledgeNetworkProjectionOptions {
  readonly rootEntityIds: readonly string[];
  readonly includedPredicates: readonly string[];
  readonly maximumDepth: number;
  readonly groupingPolicy: "none" | "semantic-type";
}

interface KnowledgeNetworkDocument {
  readonly version: "1.0";
  readonly id: string;
  readonly datasetIdentity: string;
  readonly projection: KnowledgeNetworkProjectionDescriptor;
  readonly nodes: readonly KnowledgeNetworkNode[];
  readonly edges: readonly KnowledgeNetworkEdge[];
  readonly groups?: readonly KnowledgeNetworkGroup[];
  readonly accessibility: KnowledgeNetworkAccessibility;
  readonly source: readonly SourceReference[];
}

interface KnowledgeNetworkNode {
  readonly id: string;
  readonly semanticEntityId: string;
  readonly semanticTypes: readonly string[];
  readonly label: string;
  readonly description?: string;
  readonly source: readonly SourceReference[];
  readonly externalReferences?: readonly VersionedExternalReference[];
  readonly groupIds?: readonly string[];
}

interface KnowledgeNetworkEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly predicateId: string;
  readonly label: string;
  readonly directed: boolean;
  readonly source: readonly SourceReference[];
}

interface KnowledgeNetworkGroup {
  readonly id: string;
  readonly label: string;
  readonly memberNodeIds: readonly string[];
}

interface KnowledgeNetworkAccessibility {
  readonly label: string;
  readonly description: string;
  readonly nodeReadingOrder: readonly string[];
  readonly edgeReadingOrder: readonly string[];
  readonly staticFallback: string;
}
```

`SourceReference` and `VersionedExternalReference` are neutral value objects compatible with ADR-0002. External references are inert metadata during projection; no network fetching is permitted.

## Projection rules

1. Validate the complete dataset snapshot and options before traversal.
2. Resolve root identities against the merged logical dataset, never against file boundaries.
3. Traverse only predicates explicitly allowed by the projection options and project policy.
4. Apply a deterministic breadth-first traversal ordered by canonical semantic identity and predicate identity.
5. Deduplicate nodes by semantic entity identity and edges by `(source, predicate, target)` identity.
6. Generate document, node, edge and group identifiers solely from canonical source identities and versioned projection parameters; random identifiers are forbidden.
7. Sort nodes by canonical semantic entity identity, edges by source identity, predicate identity and target identity, and groups by group identity.
8. Preserve labels, semantic types, provenance and source references without inventing missing metadata.
9. Optional grouping is descriptive metadata only. It must not prescribe screen position, cluster geometry or renderer components.
10. Canonical serialization of identical validated inputs and options must be byte-for-byte stable.

## Diagnostics

Projection fails atomically with stable codes including:

- `UNSUPPORTED_DATASET_CONTRACT_VERSION`
- `INVALID_DATASET`
- `INVALID_PROJECTION_OPTIONS`
- `UNKNOWN_ROOT_ENTITY`
- `UNSUPPORTED_PREDICATE`
- `MISSING_ACCESSIBLE_LABEL`
- `UNRESOLVED_REQUIRED_REFERENCE`
- `KNOWLEDGE_NETWORK_CONTRACT_VIOLATION`

Diagnostics identify relevant semantic entities or predicates where available, but do not include unstable parser or runtime text as normative identity.

## D3 adapter boundary

The future D3 adapter consumes only a validated `KnowledgeNetworkDocument` and adapter options. It may create an adapter-private render plan containing coordinates, simulation parameters, visual encodings and interaction bindings. These values must never be written back into the source document or RDF.

The adapter must provide:

- complete keyboard navigation and focus management;
- non-color-only distinctions and accessible node/edge labels;
- reduced-motion and static modes;
- a readable textual or tabular fallback using the document reading orders;
- local dependencies and explicitly supplied assets only;
- no analytics, learner-state capture or implicit external requests.

A force layout is not deterministic output of the semantic projector. Reproducible screenshots may later use a seeded adapter-local simulation, but that is a separate implementation decision.

## Didactic intent

Didactic intent remains renderer-neutral. A network projection may select or annotate semantic relations relevant to an instructional objective, but upstream records never request a named visual component. The D3 adapter chooses visual encodings while preserving semantic identity, provenance and accessibility alternatives.

## Privacy and offline behavior

The projector is pure and offline. It receives a dataset snapshot and options, performs no remote requests, executes no referenced content and captures no learner or presentation telemetry. Personal learner state remains a separate bounded context.

## Compatibility

This decision is additive. It does not modify ontology terms, SHACL constraints, resolver output, scene composition, `SceneDocument` 1.0 or the Reveal adapter. A future implementation may add neutral core types and a projector package without creating dependencies from existing upstream layers to D3 or React.

## Rejected alternatives

### Pass `SceneDocument` to the network renderer

Rejected because a sequential scene document does not authoritatively represent arbitrary semantic graph relations, and extending it with graph concepts would weaken its contract.

### Let the D3 adapter query RDF directly

Rejected because semantic projection, validation and deterministic diagnostics would become entangled with renderer-specific layout and browser behavior.

### Store graph coordinates or D3 settings in RDF

Rejected because layout is renderer-owned, volatile and unrelated to semantic authority.

## Consequences

- The sequential presentation pipeline remains unchanged.
- Multiple graph renderers can consume one neutral document.
- Semantic selection is deterministic and testable without a browser.
- D3 remains replaceable and isolated from domain content.
- The next bounded task is implementation of the pure offline dataset-to-`KnowledgeNetworkDocument` 1.0 projector with golden, determinism, dependency-direction, accessibility and no-network tests; D3 runtime integration follows separately.
