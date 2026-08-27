# Self-study renderer

`@project-chemie-digital/renderer-self-study` is a sibling renderer adapter for validated `SceneDocument 1.0` values.

It maps a renderer-neutral scene document to deterministic `SelfStudyRenderPlan 1.0`, preserving scene/block identities, source and provenance references, accessibility metadata, authored reading order, didactic intent, emphasis and disclosure semantics. The package never queries RDF, Fuseki or SPARQL and never persists learner state.

## Disclosure behavior

- `initial` content is immediately visible.
- `optional` content is learner-controlled in the enhanced browser view.
- `progressive` content is revealed in authored disclosure order in the enhanced browser view.
- Static HTML always exposes the complete authored content, including optional and progressive blocks.

The browser mount uses native disclosure controls and ephemeral DOM state only. Reloading resets interaction state. There is no `localStorage`, IndexedDB, cookie, account, analytics or telemetry integration.

## Content boundary

The renderer does not invent learning objectives, correctness feedback, assessment criteria or scientific explanations. Prose, mathematics, code, media descriptions and prompts are rendered from `SceneDocument`; renderer-owned text is limited to generic navigation/disclosure chrome.
