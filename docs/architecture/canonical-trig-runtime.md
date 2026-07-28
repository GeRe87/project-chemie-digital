# Canonical TriG runtime

## Runtime flow

The active semantic pipeline is now:

```text
ontology/dataset/*.trig
  -> deterministic RDF Dataset assembly and SHACL validation
  -> deterministic path and scene compilation
  -> disposable canonical-runtime.json
  -> renderer-neutral SceneDocument / RdfDatasetSnapshot
  -> Reveal.js and knowledge-network consumers
```

TriG is the only authored semantic source. The generated JSON artifact is ignored by Git, recreated before local pitch development and tests, and checked byte-for-byte for staleness. Runtime generation is offline and does not fetch external references.

## Preservation boundaries

The generated transport retains:

- the canonical Dataset fingerprint;
- RDF resource identities;
- named-graph provenance identities;
- authored relation-selection paths;
- the complete ordered nine-scene Standardabweichung path;
- a renderer-neutral Dataset snapshot for knowledge-network projection.

Reveal.js receives compiled scene documents and remains independent of the domain ontology and source serialization.

## Deleted compatibility inventory

The following retired parallel semantic sources were removed after canonical TriG coverage and deterministic generation were established:

- `content/concepts/standard-deviation.jsonld`
- `content/concepts/chemie-digital-platform.jsonld`
- `content/resources/standard-deviation-resources.jsonld`
- `content/resources/pitch-content.jsonld`
- `content/paths/standard-deviation-default.jsonld`
- `content/paths/studiendekanat-pitch.jsonld`
- `content/scenes/standard-deviation-definition-with-citation.jsonld`
- `apps/pitch/src/generated/standard-deviation-scene-data.ts`
- the JSON-LD-specific graph scene compiler and its tests.

Historical review documents and agent handoffs may mention these paths as historical evidence; they are not active runtime or authoring inputs.

## Commands

```bash
npm run generate:runtime
npm run check:runtime
npm test
npm run pitch:dev
```

`check:runtime` fails when the disposable browser artifact does not exactly match the canonical TriG Dataset. Local development regenerates the artifact before Vite starts.
