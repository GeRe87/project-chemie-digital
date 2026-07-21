# Semantic pitch content slice

The first Phase 2 content increment models the repository-supported Studiendekanat pitch proposition as reusable semantic resources rather than authored slides.

## Files and identities

- `content/concepts/chemie-digital-platform.jsonld` defines the central `ex:chemie-digital-platform` concept and links the reusable pitch resources.
- `content/resources/pitch-content.jsonld` defines the proposition, architecture-layer descriptions, renderer-separation statement, multiple-output-channel statement, standard-deviation proof of concept and vertical-slice purpose.
- Every pitch statement is both a normal learning-resource subtype and `cd:PitchResource`.
- Repository documents are represented as `cd:PitchSource` resources with stable `cd:sourcePath` literals.

The files are review boundaries only. Semantic validation loads them together with the existing standard-deviation files into one logical RDF graph.

## Provenance and invariants

`cd:PitchResourceShape` requires each pitch resource to provide one body and at least one `cd:hasSource` relation. `cd:PitchSourceShape` requires one repository-relative source path. This keeps project claims traceable to accepted repository documents without external research or implicit dereferencing.

The additive `cd:PitchResource`, `cd:PitchSource` and `cd:sourcePath` terms do not change existing concept, path, scene or renderer contracts.

## Reuse by the next task

The later narrative-path increment may select these resource IRIs and assign order, optionality and didactic intent. This content slice intentionally defines no narrative sequence, slide structure, layout coordinates or renderer components.

## Validation

From the repository root:

```text
npm test
```

The semantic test suite also removes provenance from one pitch resource in memory and verifies that SHACL rejects the invalid graph deterministically.

## Accessibility and privacy

The pitch statements are language-tagged text resources suitable for accessible downstream reading order and static fallbacks. The slice introduces no personal data, learner state, analytics, tracking, remote execution or network access.
