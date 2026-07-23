# Semantic Dataset migration contract

## Graph ownership

| Graph IRI | Owner | Allowed content |
|---|---|---|
| `.../graph/core` | Meta-TBox | generic module grammar only |
| `.../graph/concepts` | concept modules | reusable classes, properties and controlled values |
| `.../graph/shapes/*` | validation modules | SHACL shapes |
| `.../graph/knowledge/*` | knowledge specifications | concrete scientific and learning resources |
| `.../graph/scenes/*` | scene specifications | scene instances and ordered items |
| `.../graph/paths/*` | path specifications | learning paths and steps |
| `.../graph/provenance/*` | provenance specifications | sources and provenance assertions |
| `.../graph/legacy/*` | compatibility loader | existing JSON-LD during migration only |

The core graph must not mention chemistry, statistics, scenes, Reveal.js, renderer state or learner state. Concept modules may depend on the core grammar. Specifications may depend on concept modules, never the reverse.

## Migration rules

1. Preserve existing public IRIs whenever their meaning is unchanged.
2. Move vocabulary assertions from `ontology/learning.ttl` into project-owned TriG concept graphs.
3. Move SHACL from `ontology/shapes.ttl` into one or more `graph/shapes/*` named graphs without changing constraints.
4. Convert each JSON-LD document to an owned TriG specification graph. Until converted, the compatibility loader assigns a deterministic `graph/legacy/<stem>` graph.
5. An IRI change requires an explicit mapping note and manager review; no silent rewriting is permitted.
6. Generated JSON-LD transport and `SceneDocument` JSON are reproducible derivatives, not authored authorities.
7. Local exploration, focus, expansion and presentation cursor state remain outside the Dataset.

## Determinism

`assemble_dataset()` sorts source paths, performs no network access, enforces project graph IRIs, rejects blank-node subjects and conflicting canonical subject/predicate definitions, serializes canonical logical quads and emits a SHA-256 fingerprint independent of source-file order.
