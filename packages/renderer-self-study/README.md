# Self-study renderer

`@project-chemie-digital/renderer-self-study` is a sibling renderer adapter for validated SceneDocument contract versions supported by core.

It maps a renderer-neutral scene document to deterministic `SelfStudyRenderPlan 1.1`, preserving scene/block identities, source and provenance references, accessibility metadata, authored reading order, didactic intent, emphasis and disclosure semantics. Flow diagrams, charts, definition lists and tables are preserved as structured plan nodes with complete static HTML fallbacks. The package never queries RDF, Fuseki or SPARQL and never persists learner state.

## Disclosure behavior

- `initial` content is immediately visible.
- `optional` content is learner-controlled in the enhanced browser view.
- `progressive` content is revealed in authored disclosure order in the enhanced browser view.
- Static HTML always exposes the complete authored content, including optional and progressive blocks.

The browser mount uses native disclosure controls and ephemeral DOM state only. Reloading resets interaction state. There is no `localStorage`, IndexedDB, cookie, account, analytics or telemetry integration.

## Content boundary

Mathematical expressions render offline as native MathML using the pinned KaTeX dependency, with the complete source expression retained as an accessible fallback. Repeated explanation/math pairs (2–4, optionally preceded by shared context) render as responsive information cards. This adapter infers that structure independently from block kinds, intent and reading order; it does not import Reveal or inspect lecture identities. Authored mathematical spoken descriptions and their provenance are projected from TriG `cd:body` when present.

The renderer does not invent learning objectives, correctness feedback, assessment criteria or scientific explanations. Prose, mathematics, code, media descriptions, prompts and flow-diagram labels/relations are rendered from `SceneDocument`; renderer-owned text is limited to generic navigation/disclosure chrome and static structural labels.
