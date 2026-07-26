# Semantic Dataset migration

## Canonical ownership

TriG files under `ontology/dataset/` are the authored semantic source of truth. They own project graph IRIs for the core Meta-TBox, reusable concept vocabulary, shapes, knowledge specifications, examples, sources, scenes, paths and migration declarations.

JSON-LD may remain temporarily readable as an explicitly isolated compatibility input. It must not independently own canonical assertions or be maintained as an equivalent authored source.

## Current migration status

- Dataset assembly is repository-local, deterministic and network-free.
- Canonical TriG graphs preserve named-graph identity and produce a stable logical-quad fingerprint.
- Legacy JSON-LD inputs are isolated under `graph/legacy/*` and superseded canonical subject assertions are removed during assembly.
- Vocabulary assertions are owned by project TriG concept graphs; the former flat `ontology/learning.ttl` compatibility file has been removed.
- SHACL is owned by `graph/shapes/*` named graphs; the former `ontology/shapes.ttl` compatibility file has been removed.
- The browser pitch still consumes a generated TypeScript compatibility transport derived from legacy JSON-LD. That boundary remains temporary and must be replaced by deterministic artifacts generated from the canonical Dataset.

## Remaining migration rules

1. New semantic content is authored only in canonical TriG named graphs.
2. Existing JSON-LD may be read only through explicit legacy graph identities.
3. A legacy resource promoted into canonical ownership must have its competing subject assertions removed from compatibility graphs while object references remain intact.
4. Compilers must consume a typed Dataset/quad abstraction with named graph identity preserved.
5. Browser artifacts are disposable, deterministic outputs and may not become a second authored content store.
6. Remove a legacy file only after all active compiler, validator, browser and test consumers have migrated and semantic equivalence has been verified.
