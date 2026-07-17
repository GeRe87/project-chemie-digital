# Reveal renderer adapter

`@project-chemie-digital/renderer-reveal` is the bounded, offline adapter from validated `SceneDocument 1.0` values to immutable `RevealRenderPlan 1.0` values.

The package owns all Reveal-specific planning metadata. It does not initialize Reveal.js, render DOM or React components, download assets, capture learner state, or alter the renderer-neutral core model.

## Public API

- `createRevealRenderPlan(document, options)` validates and maps atomically.
- `canonicalSerializeRevealRenderPlan(plan)` emits deterministic JSON for a plan produced by the adapter.
- `RevealAdapterOptions` selects static versus locally interactive planning and reduced-motion behavior.

Static and reduced-motion modes retain every node, semantic reading order, source reference, accessibility alternative and prompt fallback while omitting fragment metadata.
