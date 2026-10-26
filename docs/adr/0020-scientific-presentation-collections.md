# ADR-0020: Scientific presentation collections and reusable title metadata

- Status: Proposed
- Date: 2026-10-25
- Issue: #292

## Decision

Talks is a presentation family of the existing Pitch application, not another
application. Its independent scientific works are **not** teaching offerings,
curriculum placements or learning units. Reuse `schema:Collection/hasPart`,
`schema:CreativeWork`, `schema:Person`, `schema:Organization`, `schema:Event`,
`schema:Role` and `schema:ImageObject`. Introduce only:

- `cd:ScientificTalk`, a subclass of `schema:CreativeWork`;
- `cd:presentationPath`, linking a talk to an existing `cd:LearningPath`;
- `cd:presentationTitleOf`, linking a scene to the work whose title metadata it presents.

Existing `LearningPath`, `PathStep`, `SceneDefinition`, `SceneItem`, `HeadingRole`,
`cd:position`, selection and provenance remain authoritative. The compiler requires
one exact named graph defining each presentation path; ambiguous graph identity
fails closed rather than choosing by labels or filenames. No fabricated offering
or unit is introduced to satisfy course discovery. Existing course selection is unchanged.
The existing SceneItem selector SHACL union is extended additively to admit a
ScientificTalk, so the authored title heading can select the work without
misclassifying it as a concept or curriculum unit.

Titles use `skos:prefLabel`, optional subtitles `dct:alternative`. Events use
`schema:recordedAt`, with `name`, optional `startDate` (ISO date) and literal
`location`. Authors are ordered `schema:Role` records (`position`, `author`),
pointing to reusable persons. Persons link to organizations through `affiliation`;
`parentOrganization` preserves institutional hierarchy. Multiple affiliations are
allowed; their display order is deterministic by IRI. Cyclic hierarchies fail
compilation. No unknown event date or location is invented.

Institutional or project logos are ordered `schema:logo` ImageObjects with an
accessible `name` and optional local `contentUrl`. Without an approved asset, the
authored name explicitly identifies a placeholder. No unofficial logo is fetched.
Roles and logos have positive, unique positions within each work.

## Generated contracts and rendering

`PresentationCollection 1.0` contains the exact collection/graph identity, authored
title and member work/path/graph references. It is generated into the existing
lazy course-runtime manifest. The same `sceneDocumentBindings` select a compiled
document; the browser rejects missing, duplicate, wrong-graph and unbound records.

`PresentationTitleMetadata 1.0` is an additive optional `Scene.presentationTitle`
field. It contains no CSS, coordinates or renderer instructions. Core validation
checks it; the shared scientific-title renderer uses it for a consistent layout.
The ordinary heading block is retained for older consumers, and the generated
static fallback includes the full title, event, authors, affiliations and logos.
JSON remains disposable compiler output, never a second authored title source.

Collection transports export only the selected resource closure with attributed
quad provenance, not the full repository snapshot. The source dataset fingerprint
still identifies the complete validated source revision. Public asset staging is
bounded to selected runtime files/media/logos, Talks backgrounds and the existing
pinned interactive vendor tree. Unrelated private presentation metadata and assets
must not be carried into this public artifact.

## Visual configuration boundary

The existing background engine adds `repeat: x` and `cover-height`. Geometry uses
the same intrinsic image scale across all layers, modular absolute transforms,
existing finite-duration interpolation, and no idle animation loop. Reduced motion
freezes parallax. Light/dark assets differ only in image content. The Talks profile
selects horizontal deck navigation and viewport-width-based background progress;
Chemometrics retains its existing vertical packs and scroll profile.

The shared static build gains a collection selector and dedicated output directory.
It still validates SHACL, dependencies, vendor integrity, transport, asset paths
and final file hashes. No hosting settings or existing deployment workflows change.
