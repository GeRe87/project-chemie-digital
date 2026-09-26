# ADR-0010: Renderer-neutral TeachingOffering runtime document

- Status: Proposed
- Date: 2026-08-31

## Context

ADR-0008 introduced the authored course-scale composition boundary `TeachingOffering → UnitPlacement → LearningUnit` and deliberately kept renderer navigation, learner progress and delivery mechanics out of canonical RDF. Issue #94 then exposed that validated composition through the read-only `SemanticQueryClient.teachingOfferingComposition(offeringId)` boundary. ADR-0009 and Issue #98 completed the next compiler boundary: one offering/placement/unit context is validated, one exact `{pathId, pathGraphId}` is normalized, and only that selected path is delegated to scene compilation.

The platform can therefore now answer, deterministically and renderer-neutrally:

- which placements belong to one `TeachingOffering`;
- which `LearningUnit` each placement references;
- in which authored curriculum order those placements occur;
- which exact LearningPath references are available for a unit;
- and how one selected path is revalidated and compiled into `SceneDocument 1.0`.

What is still missing is the browser/application-facing offline read model between those layers.

The current generated `canonical-runtime` artifact contains a Dataset fingerprint, a generic graph/exploration snapshot and one or more `SceneDocument` values. The self-study application reads `sceneDocuments[]` directly. It has no typed renderer-neutral index for the containing teaching offering, placements, unit labels or available path references. A future multi-unit application would therefore otherwise have to do one of the following:

1. require a live Fuseki query merely to render course navigation;
2. reconstruct course composition ad hoc from generic `datasetSnapshot.statements`;
3. encode a menu/course tree as application configuration; or
4. merge course organization into `SceneDocument` or learner state.

All four options would create a second source of truth or reverse an existing dependency boundary.

The current authored fixture also exposes an important metadata constraint. The teaching offering and Standardabweichung learning unit have authored German `skos:prefLabel` values. The current `ex:path-standard-deviation` has no authored human-readable path label or modality descriptor. A runtime read model must preserve that absence. It must not turn an IRI local name, lexical sort position or renderer name into fabricated semantic display metadata.

## Decision

Introduce a versioned renderer-neutral generated read model named **`TeachingOfferingRuntimeDocument 1.0`**.

The document is a disposable projection of one validated canonical RDF Dataset revision. It exists so an offline application can discover one teaching offering's ordered placements, reusable learning units, authored display metadata and available exact path references without querying Fuseki at runtime and without treating the generic graph snapshot as an implicit navigation schema.

It is positioned as follows:

```text
canonical TriG Dataset
        ↓
SHACL + deterministic course-scale validation
        ↓
TeachingOffering composition
        ↓
TeachingOfferingRuntimeDocument 1.0
        ↓
application discovers placements / units / available paths
        ↓
CourseUnitPathSelectionRequest
        ↓
ADR-0009 selection revalidation
        ↓
CourseUnitPathSelection
        ↓
selected-path resolution / SceneDocument 1.0
        ↓
renderer/application navigation chrome
```

`TeachingOfferingRuntimeDocument 1.0` is **not** a seventh authored semantic layer. It is generated transport/read state over existing course-scale semantics. Canonical TriG remains the only authored semantic authority.

The document is also **not** a selection authority. Its available-path list supports discovery and accessible choice, but ADR-0009 remains responsible for validating offering/placement/unit membership and exact selected path membership against the current semantic snapshot before resolution.

## Contract sketch

The following TypeScript-like sketch is normative for responsibility, identity and field meaning. Exact production type names may vary only if they preserve this boundary.

```ts
interface RuntimeLocalizedText {
  readonly value: string;
  readonly language?: string;
}

interface TeachingOfferingRuntimePathReference {
  readonly id: string;
  readonly graphId: string;
  readonly labels: readonly RuntimeLocalizedText[];
  readonly descriptions: readonly RuntimeLocalizedText[];
}

interface TeachingOfferingRuntimeUnit {
  readonly id: string;
  readonly labels: readonly RuntimeLocalizedText[];
  readonly descriptions: readonly RuntimeLocalizedText[];
  readonly paths: readonly TeachingOfferingRuntimePathReference[];
}

interface TeachingOfferingRuntimePlacement {
  readonly id: string;
  readonly position: number;
  readonly unitId: string;
}

interface TeachingOfferingRuntimeDocument {
  readonly version: "1.0";
  readonly datasetFingerprint: string;
  readonly offering: {
    readonly id: string;
    readonly graphId: string;
    readonly labels: readonly RuntimeLocalizedText[];
    readonly descriptions: readonly RuntimeLocalizedText[];
  };
  readonly placements: readonly TeachingOfferingRuntimePlacement[];
  readonly units: readonly TeachingOfferingRuntimeUnit[];
}
```

The document contains one teaching offering. A generated artifact that needs several offerings may contain several independently versioned `TeachingOfferingRuntimeDocument` values. One document does not become a global course catalog.

## Why placements and units are normalized separately

`UnitPlacement` and `LearningUnit` have different identity and ownership semantics under ADR-0008.

A placement represents an occurrence of a reusable unit inside one teaching offering. The position therefore belongs to the placement. The unit owns reusable educational meaning and its available path relations.

The runtime document preserves that distinction instead of embedding a copied unit object inside each placement:

```text
placements[]
  placement A --unitId--> unit X
  placement B --unitId--> unit Y

units[]
  unit X --paths--> [...]
  unit Y --paths--> [...]
```

This matters when the same `LearningUnit` is reused. Its labels and available paths remain one unit record rather than duplicated placement-local data that could diverge.

A valid document must satisfy these integrity rules:

- every placement has a stable absolute HTTP(S) IRI;
- every placement has one positive authored integer `position`;
- placement positions are unique within the offering;
- every placement `unitId` identifies exactly one member of `units[]`;
- every unit in `units[]` is referenced by at least one placement in this document;
- every unit IRI occurs at most once in `units[]`;
- path references are exact absolute HTTP(S) `{id, graphId}` pairs;
- the same path IRI in two named graphs remains two path references;
- no array index or display label is an identity.

## Dataset revision binding

`datasetFingerprint` is required and uses the same `sha256:...` identity already emitted by the canonical runtime and used by `LearnerStateDocument 1.0`.

The fingerprint is revision evidence, not semantic identity. It binds the read model to the exact logical RDF Dataset snapshot from which it was generated.

A runtime consumer must fail closed on mixed context. In particular:

- a `TeachingOfferingRuntimeDocument` whose fingerprint differs from the active canonical runtime artifact must not be combined with that artifact's path/scene outputs;
- a stale document must be discarded or regenerated rather than reconciled by matching IRIs alone;
- when the generic Dataset snapshot is present in the same artifact, its identity and the teaching-offering document fingerprint must refer to the same Dataset revision;
- a learner-state document remains a separate contract, but its existing fingerprint check can independently establish whether it belongs to the same active Dataset revision.

ADR-0009's `CourseUnitPathSelectionRequest` remains unchanged and does not gain a fingerprint field in this ADR. The application/compiler boundary that owns both the active Dataset and the runtime document must check revision compatibility before creating or delegating a request. The ADR-0009 selector then still revalidates the supplied stable semantic identities against the current Dataset.

No wall-clock timestamp, generated UUID or session identifier is added to the course runtime document.

## Offering identity and composition graph

`offering.id` is the authored `TeachingOffering` IRI.

`offering.graphId` is the named graph that owns the validated offering composition evidence, corresponding to the `graphId` already preserved by `TeachingOfferingComposition`.

The graph identifier is provenance/ownership evidence. It is not part of the offering's semantic identity, an ordering key, a route, or a display label.

`TeachingOfferingRuntimeDocument 1.0` does not add separate `graphId` fields to every placement and unit. In the current course-composition model, placement membership and unit references are validated in the offering composition graph, while the stable IRIs remain the semantic identities. If a later requirement needs literal-level or multi-graph provenance for display metadata, that can be added through a separately reviewed compatible extension. The generic Dataset snapshot remains available for detailed graph/provenance exploration and must not force that exploration metadata into the minimal course navigation read model.

## Authored display metadata

The runtime document carries **authored semantic display metadata**, not renderer-generated labels.

For `offering`, `unit` and `path` records, `labels[]` and `descriptions[]` contain only values obtained from explicitly supported authored semantic predicates in the current Dataset. A later implementation should use a bounded, documented whitelist such as `skos:prefLabel` for labels and an appropriate authored descriptive predicate such as `dct:description` when present. It must not reuse broad display heuristics that silently fall back to an IRI local name.

The arrays are present even when empty. An empty array means that the canonical Dataset does not currently provide a supported authored display value for that object.

This is especially important for paths. The current Standardabweichung path has no authored `skos:prefLabel`. Its runtime path reference therefore has:

```json
{
  "labels": [],
  "descriptions": []
}
```

The runtime generator must not manufacture labels such as `"path standard deviation"`, `"Standardabweichung path"`, `"lecture"`, `"self-study"` or `"review"` from the IRI, renderer context or source filename.

A singleton path can still be selected under ADR-0009 without displaying a path chooser. If two or more paths later need to be presented as user choices and the canonical semantics do not contain adequate human-readable descriptors, the application must preserve that limitation rather than invent semantic meaning. A separate semantic task may later add path-owned labels, modality, audience or other path descriptors when those concepts are actually required and reviewed.

## Language handling

`RuntimeLocalizedText` preserves the RDF language tag when one is authored. Language-neutral literals remain language-neutral.

The generated document does not select one global display language. It preserves the available authored values so the downstream application can apply an explicit locale/display policy.

Canonical serialization must be independent of RDF iteration order. Localized values are deduplicated by their semantic value/language pair and sorted deterministically, for example by language tag and then lexical value.

That serialization order is **not** a language preference. A renderer must not treat `labels[0]` as the preferred language merely because it sorts first. The renderer/application owns locale negotiation.

No automatic translation is part of this contract.

## Deterministic ordering

The document has three distinct ordering rules with different semantics.

### Teaching-offering order

`placements[]` is ordered by authored `UnitPlacement.position` ascending. That is the one semantically meaningful course-scale order.

The placement IRI may be used only as a deterministic defensive tie-breaker during validation diagnostics; duplicate positions remain invalid and must not be legitimized by a tie-breaker.

Position is not placement identity and does not imply learner completion or current progress.

### Unit serialization order

`units[]` is serialized deterministically by stable unit IRI. This order has no curriculum meaning. Applications traverse `placements[]` to obtain teaching-offering order and join through `unitId`.

### Path-reference serialization order

A unit's `paths[]` is serialized deterministically by exact `(id, graphId)` pair.

This ordering creates stable bytes and predictable display input only. It **must never become path-selection preference**. If more than one path is available and no exact path is requested, ADR-0009 still fails as ambiguous.

Labels, descriptions, named-graph order, file order, path order, renderer type, route state and wall-clock time likewise cannot select a winner.

## Relationship to `TeachingOfferingComposition`

`TeachingOfferingComposition` and `TeachingOfferingRuntimeDocument 1.0` remain separate contracts because they serve different boundaries.

`TeachingOfferingComposition` is a typed query/data-integration DTO. It represents one read from the semantic-client/Fuseki boundary and currently contains:

```text
id
composition graphId
placements[]
  placement id
  position
  unitId
  paths[] { id, graphId }
```

It deliberately does not own application display metadata or browser packaging.

`TeachingOfferingRuntimeDocument 1.0` is a generated renderer/application-facing offline read model. It preserves the same semantic identities and ordering while adding only authored display values and Dataset revision binding needed by an offline application.

The runtime document does not replace the semantic-client API, and the semantic-client DTO does not become the serialized browser contract. Both are derived views over canonical TriG and neither is authored semantic authority.

The preferred first implementation path is to project the runtime document directly from the same validated immutable assembled Dataset used by the existing offline generator. This avoids mixing several live SPARQL reads from potentially different Dataset revisions. A future connected application may produce equivalent data through the semantic-client boundary only if it preserves one coherent snapshot/revision boundary.

## Relationship to ADR-0009 path selection

The runtime document exposes **available** path references. It stores no current path selection.

The application may use one placement and one unit record to construct an ephemeral request:

```text
TeachingOfferingRuntimeDocument
        ↓ user/application identifies placement + unit
CourseUnitPathSelectionRequest
        ↓ optional exact requested path from unit.paths[]
ADR-0009 selector
        ↓ revalidate current Dataset membership
CourseUnitPathSelection
```

The runtime document must never contain fields such as:

- `selectedPath`;
- `currentPath`;
- `preferredPath`;
- `defaultPath` derived from serialization order;
- `activeUnit`;
- `currentPlacement`.

The existing ADR-0009 singleton fallback remains the only implicit path choice: omission succeeds only when the revalidated current candidate set contains exactly one path reference.

## Relationship to `ResolvedLearningPath` and `SceneDocument 1.0`

The course runtime document does not embed resolved paths or SceneDocuments.

`ResolvedLearningPath` remains the output of path resolution. `SceneDocument 1.0` remains the renderer-neutral scene-composition contract for one resolved path.

The downstream compiler/application already knows the normalized `CourseUnitPathSelection` used to produce a SceneDocument. That normalized selection remains the authority connecting a compiled result to the selected semantic path.

The current `SceneDocument.sourcePathId` field remains unchanged by this ADR. The course runtime document must not depend on renderer/application code reverse-parsing or prefix-expanding that transport string to validate a course selection. Exact path membership is validated upstream through ADR-0009 using the absolute path IRI and path graph IRI.

If a future static artifact eagerly precompiles several path-specific SceneDocuments and needs random lookup among them, the packaging layer may require a separate deterministic path-reference-to-document index. Such an index would be generated packaging metadata, not a field inside `TeachingOfferingRuntimeDocument`, because the course read model must not gain a downstream dependency on SceneDocument production. That requirement is outside this ADR.

## `canonical-runtime` container compatibility

The current generated artifact root is `artifactVersion: "1.0"` and carries at least:

```text
datasetFingerprint
datasetSnapshot
sceneDocuments[]
```

The self-study consumers structurally read the fields they need and reject only an unsupported root version/fingerprint; they do not require exact root-key equality. The Python static fallback likewise reads the scene-document portion it needs.

Therefore the preferred later migration is additive:

```json
{
  "artifactVersion": "1.0",
  "datasetFingerprint": "sha256:...",
  "datasetSnapshot": { "...": "..." },
  "teachingOfferingDocuments": [
    { "version": "1.0", "datasetFingerprint": "sha256:...", "offering": {}, "placements": [], "units": [] }
  ],
  "sceneDocuments": []
}
```

Adding `teachingOfferingDocuments[]` alone does **not** require incrementing `artifactVersion`, because it is an additive field and existing consumers can continue reading the existing fields with unchanged semantics.

The new teaching-offering document has its own explicit version because its shape and compatibility lifecycle are independent of the generic artifact container.

A future implementation must bump the outer artifact version only when it makes an incompatible change to existing root-field meaning, removes/renames an existing required field, or adopts strict parsing rules that make the additive change incompatible. This ADR does not authorize such a migration.

The current single-path artifact may continue to contain only the selected/default SceneDocument. The presence of a course runtime document does not imply that every available path has been eagerly resolved or rendered.

## Generic Dataset snapshot is not the course navigation schema

The existing `datasetSnapshot` remains useful for graph exploration, provenance views and other generic semantic tooling.

It is intentionally not promoted into an application course schema.

Applications must not reconstruct authoritative teaching-offering navigation by traversing generic `datasetSnapshot.statements` when a typed `TeachingOfferingRuntimeDocument` is available. Doing so would duplicate composition logic and could accidentally depend on generic display fallbacks, statement order or graph-projection behavior.

In particular, the current generic Dataset snapshot is allowed to derive a fallback display label from an IRI local name for graph exploration. That fallback behavior is **not valid authored display metadata for course/unit/path controls** and must not leak into the teaching-offering runtime document.

## Explicitly excluded state and mechanics

`TeachingOfferingRuntimeDocument 1.0` contains no current application or learner state.

The following are excluded:

- URLs, route templates, slugs used as identity or router parameters;
- menu trees, breadcrumb models, tabs, accordions or navigation stacks;
- current screen, selected tab, open menu or viewport state;
- Reveal.js slide/fragment identifiers;
- self-study component identifiers;
- selected/current/preferred path state;
- learner identity;
- prompt answers;
- completion/progress percentage;
- score, grade or assessment result;
- timestamps or session identifiers;
- personalization or recommendation state;
- analytics/tracking fields;
- account/authentication fields;
- LMS/Moodle/LTI/SCORM identifiers or remote catalog state.

A renderer/application may derive navigation chrome from the document, but those mechanics stay downstream and ephemeral.

## Standardabweichung reference document

With the current canonical fixture, the generated document is conceptually:

```json
{
  "version": "1.0",
  "datasetFingerprint": "sha256:<current-canonical-dataset>",
  "offering": {
    "id": "https://w3id.org/project-chemie-digital/resource/teaching-offering-digital-chemistry",
    "graphId": "https://w3id.org/project-chemie-digital/graph/specifications/course-scale",
    "labels": [
      {
        "value": "Digitalisierung in der Chemie: Datenmanagement, Prozesse, KI",
        "language": "de"
      }
    ],
    "descriptions": []
  },
  "placements": [
    {
      "id": "https://w3id.org/project-chemie-digital/resource/unit-placement-standard-deviation",
      "position": 10,
      "unitId": "https://w3id.org/project-chemie-digital/resource/learning-unit-standard-deviation"
    }
  ],
  "units": [
    {
      "id": "https://w3id.org/project-chemie-digital/resource/learning-unit-standard-deviation",
      "labels": [
        { "value": "Standardabweichung", "language": "de" }
      ],
      "descriptions": [],
      "paths": [
        {
          "id": "https://w3id.org/project-chemie-digital/resource/path-standard-deviation",
          "graphId": "https://w3id.org/project-chemie-digital/graph/paths/standard-deviation",
          "labels": [],
          "descriptions": []
        }
      ]
    }
  ]
}
```

The empty path labels are intentional evidence of the current canonical Dataset, not an omission to be repaired by the runtime projector.

An application can present the authored offering/unit name. Because the unit has exactly one available path, it can omit a path chooser and let ADR-0009 revalidate the singleton before compilation. Nothing in the document states that this path is intrinsically a Reveal, lecture or self-study path.

## Hypothetical multi-unit and multi-path case

The following is illustrative architecture evidence only; these additional entities are **not** current authored project data.

Assume a later validated Dataset contains two placements:

```text
position 10 → Unit A
position 20 → Unit B
```

and Unit A exposes two exact paths:

```text
https://example.invalid/path/a
  graph https://example.invalid/graph/path/a

https://example.invalid/path/a-review
  graph https://example.invalid/graph/path/a-review
```

The runtime document serializes placements as `[10, 20]` because course position has semantic ordering meaning. It may serialize the two Unit A path references by `(id, graphId)` for stable bytes. That path serialization creates **no preference**.

If the application creates a selection request for Unit A without a requested path, ADR-0009 must still return `ambiguous selection` after revalidation. It cannot take the first serialized path.

If the application supplies the exact review path pair, the selector may accept it only if the pair remains available in the active Dataset revision.

If those hypothetical paths have no authored labels/descriptors, a user-facing multi-path chooser lacks adequate semantic display metadata. The application must not label them from their IRIs or guess `review` as a formal modality. That is a semantic-content gap for a later bounded task, not a reason to weaken selection or accessibility rules.

Unit B appearing at position `20` does not imply that the learner completed Unit A, should automatically progress to Unit B, or must follow a particular path inside either unit.

## Accessibility

The runtime document makes accessible course navigation possible by carrying authored human-readable values separately from stable identity.

Downstream applications must:

- use authored/semantically derived human-readable values for visible navigation controls and accessible names;
- preserve language information and apply an explicit locale policy;
- not expose a raw IRI local name as if it were authored course terminology;
- not create an inaccessible ambiguous path chooser when several paths lack usable authored names;
- provide keyboard-operable, focus-visible and semantically structured navigation when a later UI is implemented;
- retain a usable static/offline fallback consistent with the renderer's existing accessibility obligations.

This ADR defines no visual layout, menu structure or interaction widget.

## Privacy

`TeachingOfferingRuntimeDocument 1.0` contains only project-authored semantic/display data and deterministic Dataset revision evidence.

It contains no personal data, learner identifier, answer, score, progress, timestamp, analytics identifier, account state or remote-service identifier. Generating or consuming the document requires no tracking and no network access when the canonical Dataset is locally available.

`LearnerStateDocument 1.0` remains a separate bounded context. The two contracts may independently carry the same Dataset fingerprint for compatibility checks, but neither is nested into the other.

## Implementation handoff

A later bounded implementation should preserve the following seams.

### Offline projector

Add a small deterministic renderer-neutral projector over the same assembled immutable `rdflib.Dataset` used by the canonical runtime. It should validate the already-established course invariants and emit `TeachingOfferingRuntimeDocument 1.0` without relying on source filenames, RDF iteration order or generic Dataset-snapshot display fallbacks.

A dedicated module such as `scripts/teaching_offering_runtime.py` is preferable if it keeps projection policy separate from `generate_canonical_runtime.py`. The generator can then package its result.

### Runtime artifact packaging

Extend `build_artifact` additively with `teachingOfferingDocuments[]`, using the exact same `datasetFingerprint` as the existing root and Dataset snapshot.

Do not change existing SceneDocument generation merely because the course read model is added.

### TypeScript transport validation

A neutral TypeScript contract/validator may live in `packages/core` if browser consumers need runtime shape validation, analogous to the existing `SceneDocument` contract. Such a type validates generated transport only; it must not become a second semantic resolver or duplicate SPARQL/path-selection policy.

### Application consumer

The self-study application can later consume the typed course runtime document to derive accessible course navigation and construct ADR-0009 selection requests. Route/menu mechanics remain in the application/renderer layer.

### Semantic-client

`SemanticQueryClient.teachingOfferingComposition(...)` remains valid and need not change merely to support the first offline projector. A later connected course UI may require a bounded query extension for authored display metadata, but that is a separate data-integration task and must preserve one coherent Dataset revision.

### Tests

The implementation should add deterministic tests for:

- current Standardabweichung document bytes/shape;
- placement ordering independent of RDF insertion order;
- normalized unit reuse without duplicated inconsistent unit records;
- path-reference determinism without path preference;
- same path IRI in two graphs remaining distinct;
- multilingual display-value preservation and deterministic ordering;
- missing path labels remaining empty instead of receiving IRI fallbacks;
- fingerprint equality across root artifact, Dataset snapshot and teaching-offering document;
- stale fingerprint rejection in the application/compiler integration seam;
- unchanged `SceneDocument 1.0` and learner-state contracts;
- no network access for normal generation.

This implementation handoff does not authorize those changes in Issue #100.

## Compatibility

ADR-0010 is additive.

It does not rename, remove or change the semantics of:

- canonical TriG course-scale resources;
- `TeachingOfferingComposition`;
- `CourseUnitPathSelectionRequest` or `CourseUnitPathSelection`;
- `ResolvedLearningPath`;
- `SceneDocument 1.0`;
- `LearnerStateDocument 1.0`;
- existing renderer contracts.

The current Standardabweichung default compilation remains valid. The new document merely exposes the surrounding course context as generated read state.

## Consequences

- Offline applications can discover validated course-scale structure without requiring Fuseki at render time.
- Course navigation can be derived from stable semantic structure without being authored as RDF menu data.
- Reusable units remain distinct from their placements.
- Display metadata can be multilingual and accessibility-ready without making labels identities.
- Missing path metadata remains visible instead of being silently fabricated.
- Dataset fingerprints provide a deterministic stale-context boundary across generated read models.
- Path discovery remains separate from path selection and path resolution.
- SceneDocument and learner-state contracts remain focused instead of becoming a course/application "god object".
- The generic graph snapshot remains available for exploration without becoming the navigation API.

## Rejected alternatives

### Use `TeachingOfferingComposition` directly as the browser runtime contract

Rejected. It is a semantic-client query DTO, does not currently carry authored display metadata or Dataset revision binding, and should not couple offline browser transport to the connected SPARQL client boundary.

### Reconstruct course navigation from `datasetSnapshot.statements`

Rejected. The generic graph snapshot has different responsibilities and display fallbacks. Reconstructing the curriculum from it would duplicate semantic composition logic inside applications.

### Encode routes or menu structure in the runtime document

Rejected. Routes, menu trees, breadcrumbs and current navigation state are application/renderer mechanics. The document provides semantic read input from which different applications may derive different navigation chrome.

### Store the current selected path in the document

Rejected. Available-path discovery and current selection have different lifetimes. ADR-0009 selection remains ephemeral and must be revalidated against the current Dataset.

### Embed all SceneDocuments under units or paths

Rejected. That would reverse the dependency boundary by making the course read model depend on downstream path resolution and scene composition. A course document may list available paths without requiring them all to be resolved or rendered.

### Put learner progress/completion into unit records

Rejected. Learner state remains separate and may not be inferred from curriculum position.

### Generate missing labels from IRI local names

Rejected. An IRI local name is technical identity syntax, not authored educational terminology. Fabricating a path label would hide a real semantic/accessibility gap.

### Require a root `canonical-runtime` version bump for the additive document

Rejected for the current migration. Existing root fields keep the same semantics and current consumers ignore additional keys. The new document has its own version. A root version bump is reserved for incompatible container changes.

## Additive SceneDocument path bindings

Course-level application navigation needs an exact bridge between the absolute LearningPath identity exposed by `TeachingOfferingRuntimeDocument.units[].paths[]` and a compiled `SceneDocument`. It must not reverse-parse compact `SceneDocument.sourcePathId` values.

`CanonicalRuntimeArtifact 1.0` may therefore carry an additive `sceneDocumentBindings[]` collection. Each binding contains the exact absolute `pathId`, exact absolute `pathGraphId`, and the exact generated `sceneDocumentId`. Existing artifacts without this additive collection remain valid.

The collection is generated read state, not authored RDF and not learner state. Bindings are deterministic by exact path identity, one SceneDocument may belong to only one path binding, and a binding to an absent SceneDocument fails closed. Applications may use this collection to associate course navigation candidates with compiled content without assigning selection authority to labels, array order, IRI local names, compact-prefix expansion or renderer state.

