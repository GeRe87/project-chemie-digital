# Reveal renderer adapter

`@project-chemie-digital/renderer-reveal` is the bounded, offline adapter from validated `SceneDocument 1.0` values to immutable `RevealRenderPlan 1.0` values.

The package owns all Reveal-specific planning metadata. It does not query semantic stores, download assets, capture learner state, or alter the renderer-neutral core model.

## Public API

- `createRevealRenderPlan(document, options)` validates and maps atomically.
- `canonicalSerializeRevealRenderPlan(plan)` emits deterministic JSON.
- `createPitchComponentDocument(plan)` maps a validated render plan to renderer-owned accessible component records.
- `canonicalSerializePitchComponentDocument(document)` emits byte-stable JSON for deterministic review.
- `mountPitchComponents(document, runtime)` owns keyboard listeners and optional animation cleanup through an injected browser-runtime port.
- `udeChemistryPitchTheme` provides versioned local tokens.

## UDE chemistry pitch theme

The `1.0` theme is a repository-owned design interpretation for the chemistry Studiendekanat pitch. It is not presented as an official or approved UDE corporate design. It uses system-local font stacks, a high-contrast light surface, restrained teal emphasis, an amber focus token, monotonic spacing and a structural-grid chemistry treatment. No logo, external font, remote stylesheet or other downloaded asset is required.

The theme contract covers typography, spacing, surfaces, emphasis, focus and contrast tokens. Tests enforce documented numerical readability invariants but do not claim accessibility certification.

## Accessible component contract

Each section maps to a labelled `region` landmark and a deterministic heading. Components preserve source identities, labels, reading order and complete static fallbacks. Prompt components are keyboard-focusable. Reduced-motion render plans suppress optional animation startup.

DOM, Reveal.js initialization, React, timers, event listeners and animation resources remain behind the injected runtime port. Repeated destruction is idempotent and releases renderer-owned resources.

## Boundaries

The package does not modify semantic pitch claims, narrative order, `SceneDocument 1.0` or `RevealRenderPlan 1.0`. Presenter mode, optional detail paths, learner-state persistence, analytics, deployment and public release remain later work.
