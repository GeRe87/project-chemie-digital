# Semantic client

`packages/semantic-client` is the renderer-neutral read-only semantic-query boundary introduced in Phase 3.

Current responsibilities:

- typed SPARQL `SELECT` query construction and result decoding;
- a small HTTP transport for a Fuseki-compatible SPARQL endpoint;
- deterministic typed lookup of canonical resources;
- deterministic Standardabweichung path/scene lookup;
- deterministic course-scale composition lookup for one `TeachingOffering`;
- named-graph-aware provenance lookup.

The package does **not** own semantic content. `ontology/dataset/*.trig` remains the sole authored semantic authority. The local Fuseki service is a derived query view over a deterministic snapshot produced from that Dataset.

No SPARQL Update, course navigation model, path/scene compiler, learner-state behavior or browser integration is provided by this boundary.

## Course-scale composition query

`SemanticQueryClient.teachingOfferingComposition(offeringId)` accepts one absolute HTTP(S) `TeachingOffering` IRI and returns either `null` or a typed read-only composition:

```text
TeachingOfferingComposition
  id
  graphId
  placements[]
    id
    position
    unitId
    paths[]
      id
      graphId
```

The query reads only the authored `TeachingOffering → UnitPlacement → LearningUnit` relations and `LearningPath → LearningUnit` associations. It does not resolve a path, compile scenes or derive routes, menus, progress or other renderer/application state.

Ordering comes exclusively from the explicit positive integer placement position. Result-row order is not trusted: placements and path references are sorted deterministically after decoding. Repeated path rows are deduplicated. Contradictory placement rows, duplicate positions, split offering-composition graph ownership, malformed IRI bindings, or incomplete path/path-graph bindings fail explicitly instead of being silently normalized.

Named-graph identity is preserved for both the offering composition evidence and each returned learning-path reference.

## Validation

Run the unit tests without Fuseki:

```powershell
npm run test:semantic-client
```

Run the opt-in local-service preflight after preparing/loading/starting Fuseki:

```powershell
npm run fuseki:check
```

The preflight verifies the canonical Standardabweichung resource/path plus the reference course-scale composition: the funded teaching offering contains the Standardabweichung learning unit at placement position `10`, and the existing Standardabweichung learning path is discoverable for that unit.

Ordinary unit tests and `npm test` do not require Fuseki to be running or network access.

The default query endpoint is:

```text
http://127.0.0.1:3030/chemie-digital/query
```

For a deliberately different local endpoint, set `CHEMIE_DIGITAL_SPARQL_ENDPOINT` for the preflight process.
