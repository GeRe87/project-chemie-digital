# ADR-0011: Renderer-neutral TeachingOffering discovery and selection boundary

- Status: Proposed
- Date: 2026-09-01

## Context

ADR-0008 introduced renderer-neutral course-scale composition with stable `TeachingOffering`, `UnitPlacement` and `LearningUnit` identities while keeping application navigation and learner state outside authored RDF. ADR-0009 then defined the downstream `CourseUnitPathSelectionRequest` / `CourseUnitPathSelection` boundary for one already selected offering/placement/unit context and one exact available path reference. ADR-0010 added `TeachingOfferingRuntimeDocument 1.0`, a generated offline read model for one validated teaching offering, and Issue #104 added the shared TypeScript validation boundary for `CanonicalRuntimeArtifact 1.0` and its `teachingOfferingDocuments[]` collection.

The remaining application-level gap is intentionally narrower than course navigation: given an already validated `CanonicalRuntimeArtifact 1.0`, how does a renderer/framework-neutral consumer deterministically identify exactly one `TeachingOfferingRuntimeDocument 1.0` before any placement, unit or path choice is made?

The current runtime contains one teaching offering, so consumers have not yet needed to expose this decision. That cannot become an implicit permanent assumption. The canonical Dataset already supports multiple real teaching offerings, and future generated artifacts may therefore validly contain multiple `TeachingOfferingRuntimeDocument` values.

This ADR defines only the discovery/selection boundary over the already validated collection. It does not define a course catalog, menu, route, renderer shell, locale negotiation, placement navigation, path-choice UX, learner progress or scientific content.

## Decision

Introduce a renderer- and framework-neutral **TeachingOffering discovery and selection boundary** between canonical-runtime validation and later placement/unit/path navigation.

Conceptually:

```text
validated CanonicalRuntimeArtifact 1.0
        ↓
teachingOfferingDocuments[]
        ↓
TeachingOffering discovery
        ↓
TeachingOfferingSelectionRequest
        ↓
deterministic validation / normalization
        ↓
TeachingOfferingSelection
        ↓
one selected TeachingOfferingRuntimeDocument 1.0
        ↓
later application placement/unit choice
        ↓
CourseUnitPathSelectionRequest (ADR-0009)
        ↓
LearningPath resolution
        ↓
SceneDocument 1.0
```

The boundary consumes only the already validated `teachingOfferingDocuments[]` collection from the active canonical-runtime artifact. It performs no live Fuseki/SPARQL lookup and does not traverse `datasetSnapshot.statements` to reconstruct offering identity or composition.

A request has one optional semantic selector:

```ts
interface TeachingOfferingSelectionRequest {
  readonly offeringId?: string;
}
```

Successful normalization produces an explicit selected identity together with the exact validated runtime document selected from the supplied collection:

```ts
interface TeachingOfferingSelection {
  readonly offeringId: string;
  readonly document: TeachingOfferingRuntimeDocument;
}
```

This is an architecture sketch, not a production API commitment. Exact implementation names may vary, but the responsibilities and deterministic behavior defined here are normative.

`TeachingOfferingSelectionRequest` and `TeachingOfferingSelection` are ephemeral application/compiler context. They are not canonical RDF, generated authored semantics, learner state, analytics state or a persisted preference contract.

## Discovery boundary

Discovery means exposing the validated `teachingOfferingDocuments[]` candidate set without choosing a winner.

The discovery boundary may provide the collection to later application code for display or user interaction, but it must preserve the distinction between **candidate enumeration** and **selection policy**:

- collection order may be deterministic transport order but has no selection meaning;
- display labels may be rendered later but do not establish identity or preference;
- the presence or absence of authored translations does not change candidate validity;
- zero-path units do not remove an offering from discovery;
- scene availability does not determine whether an offering is discoverable.

Discovery therefore cannot silently return “the current course” merely because one candidate happens to appear first.

## Selection identity

`offering.id` is the sole TeachingOffering selection identity.

This follows ADR-0010 and the validated canonical-runtime boundary introduced by Issue #104, which already treats `offering.id` as the unique TeachingOffering-document identity inside one root collection.

`offering.graphId` remains provenance/ownership evidence only. It must not become:

- a second selection identity;
- a tie-breaker between offerings;
- a route key;
- a display label;
- a default-selection signal.

A successful normalized selection always satisfies:

```text
selection.offeringId == selection.document.offering.id
```

and `selection.document` is the exact validated candidate whose `offering.id` matches that identity.

The selected runtime document remains bound to the active canonical-runtime Dataset revision through the already validated `datasetFingerprint` equality from ADR-0010 / Issue #104. This ADR introduces no independent revision identifier, timestamp, generation id or session version.

## Deterministic selection policy

Selection is defined over the complete already validated candidate collection supplied to the boundary.

### 1. Zero offerings and omitted id

If the collection contains zero offerings and `offeringId` is omitted, selection fails closed with a stable failure category equivalent to:

```text
NO_TEACHING_OFFERING
```

No Dataset-snapshot traversal, remote lookup, filename inference or fallback artifact is attempted.

### 2. Exactly one offering and omitted id

If the collection contains exactly one valid runtime document and `offeringId` is omitted, select that singleton.

The normalized result makes the identity explicit:

```text
offeringId = singleton.offering.id
document   = singleton
```

This singleton rule is compatibility behavior, not preference behavior. It is valid only because the candidate set has exactly one member.

### 3. Two or more offerings and omitted id

If the collection contains two or more valid runtime documents and `offeringId` is omitted, selection fails closed with a stable failure category equivalent to:

```text
AMBIGUOUS_TEACHING_OFFERING
```

The selector must not sort, rank or inspect metadata to manufacture a default.

### 4. Explicit known offering id

If `offeringId` is supplied and exactly matches one candidate's `offering.id`, select that document regardless of candidate array position or metadata.

Because the shared canonical-runtime validator already enforces unique `offering.id` values in one root collection, a validated collection cannot contain two different candidate documents with the same offering identity.

### 5. Explicit unknown offering id

If `offeringId` is supplied but does not exactly match any candidate `offering.id`, selection fails closed with a stable failure category equivalent to:

```text
UNKNOWN_TEACHING_OFFERING
```

The selector must not substitute a singleton, closest label, graph, route or other candidate when an explicit identity was requested and is unknown.

## Omitted versus invalid request values

Omission and invalid explicit input are not equivalent.

A production boundary that accepts untyped input must validate the request shape before applying the rules above. An explicitly present but malformed/empty identity must not be normalized to “omitted” merely to trigger singleton selection. A later implementation may expose a separate stable request-validation category such as `INVALID_TEACHING_OFFERING_SELECTION_REQUEST`.

This ADR does not prescribe a concrete error class. It requires only that invalid explicit input fail closed and never acquire omission semantics.

## Prohibited implicit selection heuristics

No rule other than exact identity matching or the validated-singleton fallback may select a TeachingOffering.

The following must never choose among multiple candidates:

- array position or “first item”;
- lexical IRI sorting;
- IRI local name or prefix;
- label, title or description;
- locale, language tag, translation availability or missing translation;
- `offering.graphId`;
- placement count or unit count;
- curriculum position or placement ordering;
- whether one or more units have zero, one or multiple available paths;
- number, order or presence of `SceneDocument` values;
- renderer type such as Reveal.js or self-study;
- React/framework state;
- URL, route, route parameter, query string, menu, tab, breadcrumb or browser history;
- learner progress, answers, preferences, account state or personalization;
- file order, RDF statement order, generic Dataset-snapshot order or source filename;
- generation timestamp, wall-clock time or session identity.

A later UI may explicitly map an accessible user action or a route parameter to a concrete `offeringId` request. In that case the UI/route is merely a source of an explicit semantic request; it does not itself become selection identity or authored truth. URL/router design remains outside this ADR.

## Zero-path units remain valid

A valid `TeachingOfferingRuntimeDocument 1.0` may contain a `LearningUnit` with `paths: []`. Issue #104 explicitly validates zero-path units, and ADR-0010 does not make path availability a prerequisite for offering validity.

Therefore:

- an offering remains discoverable when any unit has `paths: []`;
- an offering remains selectable when every unit has `paths: []`;
- path count must not be used as a quality score, validity gate or default-selection heuristic;
- offering selection must not attempt to resolve a path.

Only after an offering has been selected and a later placement/unit context has been identified does ADR-0009 own path selection. At that downstream boundary, a zero-path unit may legitimately produce the ADR-0009 “no available path” failure. That does not retroactively invalidate the selected TeachingOffering.

## Separation from ADR-0009

ADR-0011 selects exactly one **TeachingOffering runtime document**. ADR-0009 selects and normalizes one **course/unit/path context** after the application has identified a placement and unit inside that offering.

The responsibilities must remain separate:

```text
ADR-0011
validated teachingOfferingDocuments[]
  + optional offeringId
        ↓
selected TeachingOfferingRuntimeDocument

later application boundary
        ↓
placementId + unitId + optional requestedPath

ADR-0009
        ↓
CourseUnitPathSelection
```

ADR-0011 does not add `placementId`, `unitId`, path ids or graph ids to `TeachingOfferingSelectionRequest`.

Selecting an offering does not imply:

- a current `UnitPlacement`;
- a current `LearningUnit`;
- a current or preferred `LearningPath`;
- a current `SceneDocument`;
- learner progression through curriculum order;
- completion, recommendation or resume state.

ADR-0009 remains unchanged and remains responsible for revalidating offering/placement/unit/path membership against the current semantic snapshot before path resolution.

## Offline and Dataset boundary

Normal discovery and selection use only the active validated `CanonicalRuntimeArtifact 1.0` value already available to the application.

The boundary requires no network service and specifically must not:

- query Fuseki merely to enumerate or choose offerings;
- execute SPARQL at selection time;
- traverse `datasetSnapshot.statements` to reconstruct course composition;
- inspect TriG filenames or named-graph serialization order;
- fetch a remote catalog or LMS record.

`datasetSnapshot` remains opaque for course navigation at this boundary, consistent with Issue #104.

If a future connected application obtains an equivalent validated runtime collection through another transport, it must still preserve the same coherent Dataset-revision boundary before this selector is applied.

## Current single-offering compatibility

The current generated artifact contains one TeachingOffering runtime document. A selection request that omits `offeringId` therefore remains deterministically compatible through the singleton rule.

This preserves existing application behavior without hardcoding a specific course IRI and without declaring the current offering to be a global permanent default.

The compatibility property is:

```text
candidate count == 1
        ↓
omitted offeringId is sufficient
        ↓
normalized explicit offeringId
```

It is **not**:

```text
Digital Chemistry is always the default
```

and it is not based on labels, course name, repository age or position.

## Future multi-offering behavior

When a future validated artifact contains two or more TeachingOffering documents, an omitted request becomes ambiguous by design.

For example:

```text
teachingOfferingDocuments = [
  { offering.id: ...digital-chemistry... },
  { offering.id: ...chemometrics... }
]
```

then:

```text
{}
→ AMBIGUOUS_TEACHING_OFFERING
```

while:

```text
{ offeringId: "<exact authored offering IRI>" }
→ selects that exact document
```

No code may retain the single-offering fallback as an implicit “pick first” behavior when the collection grows.

## Renderer and navigation boundary

The selection contract contains no renderer or navigation mechanics.

It defines no:

- React component;
- Reveal.js mode;
- self-study shell;
- menu structure;
- route schema;
- URL format;
- browser-history behavior;
- tab or breadcrumb;
- locale chooser;
- current-screen state;
- keyboard/pointer interaction.

A later application implementation may expose accessible controls that enumerate discovered TeachingOfferings and then construct an explicit `TeachingOfferingSelectionRequest`. Accessible labeling and interaction are responsibilities of that later UI. The architecture must not invent missing authored labels merely to satisfy this selector.

If multiple offerings need to be shown and adequate authored human-readable metadata is missing, that is a semantic/content gap to be handled separately. Selection identity remains `offering.id`; fabricated IRI-derived labels are not authorized.

## Learner-state and privacy boundary

The current selection is ephemeral application context and does not change `LearnerStateDocument`.

The selector reads no:

- learner identity;
- answer;
- score;
- completion/progress field;
- account/session profile;
- analytics event;
- personalization preference.

Learner-state may later reference stable semantic context only through a separately reviewed versioned contract. This ADR does not authorize persisting “current course” into learner-state or using progress to choose an offering.

The boundary contains project-authored semantic identities and generated read data only and creates no tracking, account or remote-service requirement.

## Failure categories

The following semantic failure distinctions are normative and must be stable/testable in a later implementation. Exact production names may vary while preserving their meaning:

### `NO_TEACHING_OFFERING`

No validated candidate exists and no explicit identity can be selected.

### `AMBIGUOUS_TEACHING_OFFERING`

More than one validated candidate exists and no explicit `offeringId` was supplied.

### `UNKNOWN_TEACHING_OFFERING`

An explicit `offeringId` was supplied but does not match any candidate's `offering.id`.

A later untyped-input implementation may additionally distinguish malformed request input, but it must not collapse invalid explicit input into omission.

These failures occur before placement/unit/path selection. ADR-0009 errors remain downstream and are not remapped to TeachingOffering-selection errors.

## Determinism requirements

For the same validated runtime artifact and the same request, selection must produce the same result independent of:

- source serialization order;
- candidate array ordering;
- display metadata ordering;
- renderer/application lifecycle;
- locale;
- network availability;
- wall-clock time;
- learner state.

An implementation may build an internal lookup map keyed by `offering.id` for efficiency. Such an index is derived application state and does not change selection semantics.

## Compatibility with the canonical-runtime validator

This ADR consumes the existing Issue #104 boundary and does not change `CanonicalRuntimeArtifact 1.0` or `TeachingOfferingRuntimeDocument 1.0`.

The shared validator already establishes prerequisites required by this selector, including:

- root/document Dataset fingerprint coherence;
- valid offering IRIs;
- unique `offering.id` identities in one root collection;
- valid composition graph provenance;
- normalized placements and units;
- valid zero-path units;
- deterministic path and localized-text representation.

ADR-0011 therefore does not duplicate those checks locally. Selection begins only after successful validation and fails closed if no validated collection is available.

## Accessibility

This ADR introduces no user interface. It preserves authored multilingual labels/descriptions for a future accessible course chooser but does not select a locale or invent missing display text.

A later UI that presents several offerings must provide accessible controls and comprehensible authored labels. That UI may create an explicit `offeringId` request, but accessibility behavior remains downstream of this architecture contract.

## Consequences

- The application can move from one to several TeachingOfferings without encoding “exactly one forever”.
- Current single-offering behavior remains deterministic through a narrowly justified singleton fallback.
- Multi-offering omission fails closed instead of silently selecting a default.
- `offering.id` remains the sole semantic selection identity while `graphId` stays provenance evidence.
- Offering selection remains independent of path availability, renderer state, route state and learner progress.
- ADR-0009 remains a separate downstream placement/unit/path revalidation boundary.
- Offline applications can select from validated generated runtime documents without live Fuseki or Dataset-snapshot reconstruction.
- No authored RDF, runtime-document version, `SceneDocument` or learner-state contract changes are required.

## Rejected alternatives

### Assume exactly one TeachingOffering forever

Rejected. The platform already hosts multiple real teaching offerings and `teachingOfferingDocuments[]` is explicitly a collection. Treating singleton state as a permanent invariant would turn a current fixture property into application architecture.

### Select the first array member

Rejected. Array order can be deterministic serialization without carrying semantic preference. “First” is not an authored selection rule.

### Sort by IRI and choose the first

Rejected. Lexical determinism does not create semantic preference. Sorting is not selection authority.

### Select by label, title or locale

Rejected. Display metadata is not identity; translations may be absent or multiple. Locale policy belongs to presentation, not semantic selection.

### Select by `offering.graphId`

Rejected. ADR-0010 defines graph identity as provenance/ownership evidence. Promoting it to selection identity would create two competing TeachingOffering identities.

### Select the offering with the most units, paths or scenes

Rejected. Content counts are not authored preference and would make selection change when unrelated content grows.

### Encode a default course in route/menu configuration

Rejected as architecture truth. A UI may create an explicit `offeringId` request from navigation state, but route/menu configuration cannot silently replace semantic identity or the fail-closed selection rules.

### Merge TeachingOffering selection into ADR-0009

Rejected. Offering discovery occurs before placement/unit context exists. Combining both boundaries would couple course choice to path choice and obscure separate failure/revalidation responsibilities.

### Persist current TeachingOffering in canonical RDF or LearnerStateDocument 1.0

Rejected. Current selection is ephemeral application state. Canonical RDF remains authored reusable semantics, and learner-state remains a separate bounded context.
