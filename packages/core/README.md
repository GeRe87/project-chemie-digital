# Core package

Framework-independent domain types and deterministic transformations for semantic resources, learning paths, scenes, and renderer contracts.

## Offline path resolver

`resolveLearningPath` converts the repository's compact JSON-LD graphs into a typed, renderer-neutral `ResolvedLearningPath`. It operates locally and does not contact Fuseki or any external service.

### Input

Pass the concept, resource, and path JSON-LD documents together with the selected learning-path identifier. The current integration fixture is `ex:standard-deviation-default-path` from:

- `content/concepts/standard-deviation.jsonld`
- `content/resources/standard-deviation-resources.jsonld`
- `content/paths/standard-deviation-default.jsonld`

### Output and ordering

Resolved steps contain a stable identifier, positive integer position, renderer-neutral `viewType`, and referenced resource identifiers. Steps are sorted by ascending `cd:position`; the source order of `cd:hasStep` is not treated as RDF sequence semantics.

Multiple `cd:usesResource` values are represented as a lexicographically sorted identifier array. This provides reproducible output only and explicitly does **not** claim authored presentation order. The scene composer applies the accepted deterministic composition rules.

### Failure behavior

Resolution fails explicitly for a missing path, missing referenced step or resource, duplicate step position, non-integer position, or non-positive position. It never invents placeholder nodes.

## Offline scene composer

`composeSceneDocument` accepts a `ResolvedLearningPath` and an immutable map of normalized `ResolvedResource` values. It supports exactly the five didactic mappings defined by ADR-0004 and returns either one validated renderer-neutral `SceneDocument` 1.0 or stable diagnostics without a partial document.

Resource identifiers are sorted independently of map insertion order. Scene and block identities, source order, reading order, disclosure order, accessible alternatives, explicit narration, and available provenance are propagated deterministically. The composer performs no network access and contains no Reveal.js, React, HTML, CSS, browser, or concrete renderer concepts.

## Verification

From the repository root run:

```bash
npm test
```

The resolver and composer have no UI surface, user tracking, network access, or personal-data processing. Accessibility metadata and static interaction fallbacks are explicit inputs and are validated before successful composition.
