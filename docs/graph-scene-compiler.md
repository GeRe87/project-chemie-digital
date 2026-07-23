# Graph-backed scene compiler

The graph scene compiler is the local application boundary between authored semantic resources and renderer-neutral `SceneDocument 1.0` output.

## Authoritative input

For the bounded standard-deviation reference scene, the compiler reads only these repository-local JSON-LD documents:

- `content/concepts/standard-deviation.jsonld`
- `content/resources/standard-deviation-resources.jsonld`
- `content/scenes/standard-deviation-definition-with-citation.jsonld`

The scene definition selects resources and relation paths. Audience-visible wording remains authored only in RDF resources: the German heading is resolved from `skos:prefLabel`, the definition body from the target of `cd:hasDefinition`, and the citation label from the source reached through `cd:hasDefinition/cd:hasSource`. The compiler source contains no fallback audience wording.

## Output contract

`compileGraphBackedScene()` materializes one `SceneDocument 1.0` with ordered prose blocks. Every block retains the selected RDF resource ID. The definition block additionally retains the source resource as provenance. Scene-level sources retain both the scene-definition identity and focus-concept identity.

`canonicalSceneDocumentJson()` recursively sorts object keys while preserving semantically ordered arrays. Identical logical datasets and scene IDs therefore produce byte-stable JSON even when JSON-LD graph nodes or set-valued scene-item references are reordered.

The compiled document is disposable output. It may be cached, inspected or passed to any renderer, but it is not an authored source of truth and must not be edited as a replacement for the RDF resources.

## Atomic rejection

Compilation returns no partial document when any required invariant fails. A single bounded diagnostic is returned for:

- unresolved resources;
- ambiguous language selection;
- missing `cd:hasDefinition` or `cd:hasSource` targets;
- duplicate, non-positive or non-contiguous positions;
- unsupported communicative roles;
- unsupported or inconsistent selection paths;
- malformed input or a final `SceneDocument` contract violation.

## Local operation

`loadRepositoryStandardDeviationScene()` uses Node's local file API only. It does not use HTTP, Fuseki or any network client. Fuseki integration and compilation of the full nine-step pitch remain follow-up work.
