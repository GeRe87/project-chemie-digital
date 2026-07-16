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

Multiple `cd:usesResource` values are represented as a lexicographically sorted identifier array. This provides reproducible output only and explicitly does **not** claim authored presentation order. A later scene composer must apply its own composition rules.

### Failure behavior

Resolution fails explicitly for a missing path, missing referenced step or resource, duplicate step position, non-integer position, or non-positive position. It never invents placeholder nodes.

### Verification

From the repository root run:

```bash
npm test
```

The resolver has no UI surface, user tracking, network access, or personal-data processing. This increment therefore has no material accessibility or privacy impact.
