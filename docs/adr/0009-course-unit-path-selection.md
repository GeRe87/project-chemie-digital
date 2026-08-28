# ADR-0009: Renderer-neutral course/unit/path selection and delegation

- Status: Proposed
- Date: 2026-08-28

## Context

ADR-0008 introduces renderer-neutral course-scale composition with stable `TeachingOffering`, `UnitPlacement` and `LearningUnit` identities. A `LearningPath` may declare the learning unit it serves, and one learning unit may have several paths for different teaching situations. Issue #94 added the read-only `SemanticQueryClient.teachingOfferingComposition(offeringId)` boundary, which returns ordered placements and the available learning-path references for each unit while preserving each path's named-graph identity.

That leaves one responsibility intentionally undefined: after an application has selected a concrete course placement/unit context, which available path is delegated to path resolution?

The current canonical runtime generator predates this course-scale model. `compile_scene_document(dataset)` scans the complete logical RDF Dataset for resources typed `cd:LearningPath` and requires exactly one globally. That demonstrator-era constraint is deterministic only while the Dataset contains one path. It cannot become the course-scale rule because ADR-0008 explicitly permits lecture, self-study, exercise, review or other reusable didactic paths for the same learning unit.

ADR-0002 requires path selection/resolution and scene composition to remain renderer-neutral and preserves the existing `ResolvedLearningPath` boundary. This ADR therefore defines a small selection/delegation boundary upstream of path resolution. It does not define navigation, add semantic content, rank paths or change `ResolvedLearningPath` or `SceneDocument 1.0`.

## Decision

Introduce a renderer-neutral **course/unit/path selection boundary** between course-scale path discovery and path resolution.

Conceptually:

```text
canonical RDF Dataset / Fuseki read view
        ↓
TeachingOffering composition discovery
        ↓
selected UnitPlacement / LearningUnit context
        ↓
available LearningPath references
        ↓
course/unit/path selector
        ↓
one validated selected LearningPath reference
        ↓
existing path resolution
        ↓
ResolvedLearningPath
        ↓
SceneDocument 1.0
        ↓
renderer adapter
```

The selector does not resolve path steps. It only validates stable semantic context and normalizes zero or one selected path reference. Path resolution then receives one explicit selected path identity rather than discovering a globally unique `LearningPath` from the entire Dataset.

## Input authority

Selection operates on a current, already validated course-composition result such as `TeachingOfferingComposition`. The composition read remains the authority for:

- the selected offering identity;
- which placement identities belong to that offering;
- which learning unit a placement references;
- which learning-path references are currently available for that unit;
- the named graph associated with each returned path reference.

The selection boundary must not reconstruct these relationships from filenames, labels, routes, scene indexes or renderer state.

Canonical TriG remains the authored semantic authority. A Fuseki/SPARQL result is a read view over that authority, not a second authored source.

## Minimal stable-identity selection context

The normalized selection context contains exactly these semantic/evidence identities:

```ts
interface CourseUnitPathSelection {
  readonly offeringId: string;
  readonly placementId: string;
  readonly unitId: string;
  readonly path: {
    readonly id: string;
    readonly graphId: string;
  };
}
```

This is an architecture sketch, not yet a production API.

### `offeringId`

Required to bind the selection to the `TeachingOffering` whose composition was queried. It prevents a caller from carrying a placement selection across a different offering context without revalidation.

### `placementId`

Required because a `LearningUnit` is reusable and can occur in different offering contexts. The placement identifies the concrete occurrence being selected without treating its numeric curriculum position as identity.

### `unitId`

Required as an integrity assertion against the selected placement. The selector verifies that the chosen placement actually references this learning unit. This makes stale or mixed application context fail explicitly instead of silently switching units.

### `path.id`

The stable semantic identity of the `LearningPath` that path resolution must resolve. This is the identity that replaces the current global "find the only LearningPath" assumption.

### `path.graphId`

Required in the normalized selection because Issue #94 deliberately preserves named-graph identity for every available path reference. The pair `(path.id, path.graphId)` is validated exactly against the discovered `paths[]` set. The graph identifier is evidence/ownership context, not a second path identity and not an ordering key.

A later resolver may use `graphId` as an expected provenance/ownership constraint when resolving the path, but the semantic path identity remains `path.id`. If the same path IRI is exposed from more than one named graph, those are distinct discovered references for selection purposes and must not be collapsed by path IRI alone.

## Selection request and normalization

A consumer identifies the offering/placement/unit context and may provide an explicit requested path reference. The available-path set is always taken from the selected placement in the current composition result; it is not supplied as independent caller-authored truth.

Conceptually:

```ts
interface CourseUnitPathSelectionRequest {
  readonly offeringId: string;
  readonly placementId: string;
  readonly unitId: string;
  readonly requestedPath?: {
    readonly id: string;
    readonly graphId: string;
  };
}
```

Successful normalization always produces a complete `CourseUnitPathSelection` with an explicit path reference, including when the request omitted `requestedPath` under the singleton rule below.

The request is ephemeral application/compiler input. It is not authored RDF and is not learner state.

## Singleton-selection policy

An explicit path reference is **not required when exactly one valid path reference is available for the selected learning unit**.

The selector uses these rules:

1. If `requestedPath` is present, validate its exact `(id, graphId)` pair against the available path references for the selected unit. If it matches, select it.
2. If `requestedPath` is absent and exactly one available path reference exists, select that singleton and return it explicitly in the normalized result.
3. If `requestedPath` is absent and no path is available, fail with a no-available-path/not-found result.
4. If `requestedPath` is absent and two or more path references are available, fail as ambiguous.

The singleton fallback is permitted because it does not rank or prefer alternatives: there is exactly one member of the validated candidate set. It preserves compatibility with the current Standardabweichung demonstrator while remaining deterministic as the Dataset grows.

The following must **never** select a winner among multiple available paths:

- lexical IRI order;
- path named-graph order;
- RDF statement or SPARQL response order;
- TriG filename or source-file order;
- path-step position/order;
- curriculum placement position;
- labels or titles;
- renderer type such as Reveal.js or self-study;
- URL/route/menu state;
- creation time or wall-clock time.

If a later product needs semantic modality, audience, objective or preference-based selection, that requires an explicit separately reviewed semantic/application contract. It must not be smuggled into this fallback rule.

## Membership and integrity validation

Before path resolution, the selector validates all context from the same current composition snapshot:

1. the requested `offeringId` equals the composition's offering identity;
2. the `placementId` exists in that offering composition;
3. that placement's `unitId` equals the requested `unitId`;
4. every candidate path comes only from that placement's discovered `paths[]` collection;
5. an explicit requested path must equal one available `(path.id, path.graphId)` pair;
6. the normalized selection contains exactly one path reference.

The selector must not silently substitute another offering, placement, unit, path or graph when a supplied identity fails validation.

A numeric `UnitPlacement.position` is not part of the selection identity contract. It remains curriculum ordering metadata and may be used by a separate course-navigation/application layer to display or traverse units. Using position as identity would make the selection unstable under curriculum reordering.

## Deterministic failure categories

A later implementation must expose stable, testable failure categories rather than generic fallback behavior. Exact production names may vary, but the semantic distinctions are normative:

### Offering context not found

The requested offering has no current composition result, or the selection refers to a different offering than the supplied composition.

### Placement context not found

The requested placement does not belong to the selected offering.

### Inconsistent unit context

The requested learning-unit IRI differs from the unit referenced by the selected placement.

### No available path

The selected unit has zero available path references and no path can be delegated to resolution.

### Selected path not available for unit

An explicit `(path.id, path.graphId)` reference is not a member of the selected unit's available path set.

### Incomplete or invalid identity context

A required identity is absent or invalid, or only one member of an explicit path-reference pair is supplied.

### Ambiguous selection

No explicit path is supplied and two or more available path references exist. The selector fails closed and does not order or rank them to manufacture a choice.

These failures occur before path-step resolution. A valid selection may still fail later during normal path resolution if the selected path itself is malformed or incomplete; those remain resolver diagnostics rather than selector diagnostics.

## Delegation to path resolution

The future runtime implementation must replace global path discovery with explicit delegation.

The current pattern is effectively:

```text
Dataset
  ↓
find every rdf:type cd:LearningPath
  ↓
require global count == 1
  ↓
resolve that path
```

The course-scale pattern is:

```text
TeachingOfferingComposition
  + CourseUnitPathSelectionRequest
        ↓
validate + normalize
        ↓
CourseUnitPathSelection.path
        ↓
resolve that exact LearningPath from the immutable Dataset snapshot
```

The resolver receives one selected path identity. It must not rescan the complete Dataset to choose among unrelated paths.

The selected path's named-graph identity may be passed as an expected ownership/provenance constraint if the implementation needs it to prevent graph ambiguity. This does not change `ResolvedLearningPath.id` and does not require graph identity to become authored navigation or renderer state.

## Current global single-path rule

`compile_scene_document(dataset)` currently raises `Expected exactly one canonical LearningPath` unless the complete Dataset contains one path. That rule is classified as a **single-topic demonstrator constraint**.

It remains valid only until the bounded implementation that introduces explicit selection/delegation. It must not be generalized into a SHACL constraint or course-scale semantic rule, and future addition of a second valid path must not make the canonical Dataset semantically invalid merely because the current demonstrator compiler has not yet been migrated.

The later implementation task should make path identity an explicit input to the path-resolution portion of the runtime generator and update the tests that currently assert global uniqueness.

## Course order and path order remain separate

Selection does not merge or reinterpret the two ordering domains from ADR-0008:

- `UnitPlacement.position` orders learning-unit occurrences inside a `TeachingOffering`.
- `PathStep.position` orders steps inside one selected `LearningPath`.

Selecting a path for a unit does not imply learner progression through the offering. Path-step order must not determine the next course unit, and course-unit position must not choose or reorder path steps.

## Renderer and application boundary

The selection contract is renderer-neutral. It contains no:

- URL or route;
- menu item or breadcrumb;
- tab, accordion or current-screen state;
- Reveal.js slide/fragment identity;
- self-study component identity;
- viewport or browser lifecycle state.

An application may map its own UI interaction to a `CourseUnitPathSelectionRequest`, but that UI mapping stays downstream and ephemeral. The same normalized selection can be delegated to the same path resolver regardless of whether the eventual consumer is Reveal.js, self-study, print or another renderer.

## Learner-state, personalization and LMS boundary

Selection contains no learner identity, answer, completion state, score, timestamp, recommendation profile or account data. It is semantic compilation/application context only.

`LearnerStateDocument 1.0` remains unchanged. A future version may reference offering/unit/path identities for context if separately decided, but learner progress must not become an input that mutates canonical RDF or silently changes path semantics under this ADR.

LMS/Moodle/LTI/SCORM fields and remote catalog lookups are outside this boundary. Normal selection and resolution remain network-free when operating on the supplied immutable Dataset/read snapshot.

## Compatibility

This decision is additive upstream of existing path resolution.

### `ResolvedLearningPath`

No field is renamed, removed or required to change. Its `id` continues to identify the path that was resolved, and its ordered steps retain existing semantics.

### `SceneDocument 1.0`

No change is required. Scene composition continues to consume one `ResolvedLearningPath`; `sourcePathId` continues to identify that resolved path.

### Standardabweichung demonstrator

With the current canonical data, the selected Standardabweichung learning unit exposes exactly one path reference. A request that omits `requestedPath` therefore resolves deterministically by the singleton rule and can produce the same path and scenes as today.

### Future multiple paths

Adding a second valid path for the Standardabweichung unit makes an omitted `requestedPath` ambiguous by design. The Dataset remains valid; only that underspecified selection request fails. An application must then supply one explicit available path reference.

Any future requirement to alter `ResolvedLearningPath` or `SceneDocument 1.0` requires a separate versioned migration decision and compatibility tests. This ADR does not authorize such a change.

## Standardabweichung reference flows

### Current single-path case

Current authored relationships conceptually provide:

```text
TeachingOffering
  ex:teaching-offering-digital-chemistry
        ↓
UnitPlacement
  ex:unit-placement-standard-deviation
  position 10
        ↓
LearningUnit
  ex:learning-unit-standard-deviation
        ↓ available paths
[
  {
    id: ex:path-standard-deviation,
    graphId: graph/paths/standard-deviation
  }
]
```

A selection request with the offering, placement and unit identities but without `requestedPath` has one candidate. The selector normalizes it to the existing Standardabweichung path reference, and path resolution receives `ex:path-standard-deviation` explicitly.

### Hypothetical future second-path case

Assume a later approved semantic task adds another valid path reference for the same unit:

```text
available paths = [
  { id: ex:path-standard-deviation, graphId: graph/paths/standard-deviation },
  { id: ex:path-standard-deviation-review, graphId: graph/paths/standard-deviation-review }
]
```

A request without `requestedPath` now fails with `ambiguous selection`. No sorting rule chooses one.

A request containing:

```text
requestedPath = {
  id: ex:path-standard-deviation-review,
  graphId: graph/paths/standard-deviation-review
}
```

succeeds only if that exact reference belongs to the selected unit. The normalized result delegates that path identity to resolution. Nothing in this process asserts that the path is a Reveal.js, self-study or review UI route; such application semantics remain outside this ADR unless separately modeled and approved.

## Accessibility and privacy

Path selection is non-visual semantic context. It introduces no presentation that requires an alternative rendering and no accessibility semantics are lost by moving selection upstream of renderer choice. Applications that expose several paths to users remain responsible for accessible controls and labels, but those controls are not part of this contract.

The selection contract contains project-owned semantic identities only and no personal data. It creates no tracking, account or remote-service requirement.

## Consequences

- Course-scale datasets may contain multiple valid `LearningPath` resources without violating a global runtime uniqueness rule.
- Current single-path behavior remains deterministic through a justified singleton fallback.
- Multi-path cases fail closed until an explicit available path reference is supplied.
- Stable offering, placement and unit identities prevent stale application context from silently selecting a path from another semantic scope.
- Named-graph identity remains available for exact membership/provenance validation without becoming renderer or navigation state.
- Existing `ResolvedLearningPath` and `SceneDocument 1.0` contracts remain intact.
- A later bounded backend/runtime task can replace the demonstrator's global path scan with explicit selected-path delegation and deterministic tests.

## Rejected alternatives

### Require a globally unique LearningPath in the complete Dataset

Rejected because course scale intentionally supports multiple paths across units and multiple didactic paths for one unit. Global uniqueness is a demonstrator implementation constraint, not semantic truth.

### Always require an explicit path even when exactly one is available

Rejected for this boundary. It adds caller ceremony without resolving ambiguity when the validated candidate set has exactly one member. The singleton fallback is deterministic and produces an explicit normalized result before resolution.

### Choose the first path after sorting

Rejected. Sorting makes output presentation deterministic but does not create semantic preference. It would silently turn an incidental ordering rule into path-selection policy.

### Select by renderer type, route or UI label

Rejected because renderer/application concerns are downstream and would reverse the dependency direction. A renderer may request a semantic selection but may not redefine canonical path identity or membership.

### Store the selected path on TeachingOffering or LearningUnit as mutable application state

Rejected. Available paths are authored semantic relations, while one current selection is ephemeral compilation/application context. Persisting the current choice in canonical RDF would conflate content with runtime state.

### Put path selection into LearnerStateDocument 1.0

Rejected. Path selection must also work for lectures, static compilation and non-personalized rendering. Learner-state remains a separate bounded context and must not become mandatory for normal path resolution.
