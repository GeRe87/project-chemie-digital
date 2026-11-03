# ADR-0024: Authored primary topic context for scene orientation

- Status: Proposed, local Level-5 review
- Date: 2026-11-01

## Gap

Specific slide headings explain the current step but do not consistently name the
distribution or broader subject. Learners need a small stable orientation cue across
a topic block. Inferring it from scene IDs, heading keywords or renderer-owned course
maps would move authored semantic decisions into the renderer. Replacing headings
or inserting another content block would disturb accepted layouts, formula legends,
reading orders and reveal stages.

## Decision

Optionally author one primary `dct:subject` on a SceneDefinition, referencing an
authored `skos:Concept` with a short language-tagged `skos:prefLabel`. This is the
scene's teaching context, independent of its existing `cd:focusConcept`. Reuse a
subject across scenes within a block, or deliberately change it at a distribution
transition. No renderer positions, CSS classes or scene-ID conventions enter RDF.

Extend the existing unpublished SceneDocument 1.13 proposal with optional
`scene.topic: { label, source }`. Preserve both the subject relationship and label
provenance. Prefer the path language, with deterministic authored-label fallback;
never substitute a resource identifier when a label is absent. Topic metadata
promotes affected documents to 1.13 but does not add blocks, modify readingOrder,
change titles/narration, or add disclosure stages. Older documents without the field
retain their behavior and version.

SHACL enforces at most one primary subject, IRI/type/authored-resource evidence,
language-tagged labels, unique labels per language and a maximum of 80 characters.
Compiler and Core reject missing/empty/overlong/unsourced context and unsupported
document versions. Authored Level-5 labels are shorter than 40 characters.

Reveal and self-study plans preserve this metadata. The pitch adapter renders one
plain-text, source-linked footer paragraph per opted-in scene; the section references
it through `aria-describedby`. It is not a control or a fragment. Generic CSS places
it in the existing bottom margin, left of navigation controls, without resizing
content regions or hiding formula legends. Its text, not color alone, identifies the
topic. Static HTML and self-study alternatives retain escaped text and provenance.

## Compatibility

No subject is inferred from focus concepts, sourcePathId, scene IDs or displayed
titles. A dedicated TriG graph authors all 64 main-lecture and six reserve-scene
assignments. Scenes in accepted Levels 0-4 have no added subject, retain their
default DOM/layout, and do not receive the footer. Existing semantic graph identity,
formula units, slide order and remote navigation remain unchanged.

## Verification

Tests cover contract version gating and malformed values, authored RDF selection and
provenance, stable block assignments, changes at distribution boundaries, rejection
of duplicate/untyped/unlabelled subjects, unchanged content blocks/reading order,
absence on accepted paths, adapter preservation, escaped static alternatives and
accessible DOM mounting. Browser audits check full text without truncation, viewport
fit and navigation-control separation, alongside existing content checks.
