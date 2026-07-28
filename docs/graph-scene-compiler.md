# Graph-backed scene compilation

The former JSON-LD-specific `compileGraphBackedScene()` implementation has been retired. Canonical scene compilation now starts from the assembled TriG RDF Dataset and produces renderer-neutral `SceneDocument 1.0` output through the deterministic runtime-generation pipeline.

## Authoritative input

All authored semantic content, scene specifications, path specifications and provenance are stored in canonical TriG files under `ontology/dataset/`. JSON-LD compatibility documents and the parity-maintained TypeScript semantic copy are no longer active inputs.

## Current pipeline

```text
canonical TriG files
        ↓
deterministic RDF Dataset assembly
        ↓
SHACL and semantic validation
        ↓
path and scene resolution
        ↓
renderer-neutral SceneDocument output
        ↓
disposable browser runtime artifact
```

Compilation preserves RDF resource identities, named-graph identities, relation paths and provenance. Audience-visible scientific wording remains authored in RDF resources rather than compiler or renderer source.

The generated browser artifact is disposable output. It may be regenerated, checked and consumed by renderer adapters, but it must not be edited or maintained as a parallel source of truth.

## Validation and failure behavior

Generation is offline and deterministic. Missing resources, invalid ordering, unsupported role mappings, incomplete relation paths, malformed Dataset dependencies or stale generated output fail the generation/check boundary rather than producing a partial silently substituted presentation.

See `docs/architecture/canonical-trig-runtime.md` for the active implementation contract and deletion inventory.
