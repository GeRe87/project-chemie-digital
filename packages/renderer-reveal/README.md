# Reveal renderer adapter

`@project-chemie-digital/renderer-reveal` is the bounded, offline adapter from validated `SceneDocument 1.0` values to immutable `RevealRenderPlan 1.0` values.

The package owns all Reveal-specific planning metadata. It does not query semantic stores, download assets, capture learner state, or alter the renderer-neutral core model.

## Public API

- `createRevealRenderPlan(document, options)` validates and maps atomically.
- `canonicalSerializeRevealRenderPlan(plan)` emits deterministic JSON.
- `createPitchComponentDocument(plan)` maps a validated render plan to renderer-owned accessible component records.
- `canonicalSerializePitchComponentDocument(document)` emits byte-stable JSON for deterministic review.
- `mountPitchComponents(document, runtime)` owns keyboard listeners and optional animation cleanup through an injected browser-runtime port.
- `createPresenterModeDocument(document, configuration)` validates presenter notes and optional detail paths atomically.
- `reducePresenterState(document, configuration, state, action)` performs deterministic navigation transitions.
- `canonicalSerializePresenterModeDocument(document)` emits deterministic presenter output.
- `mountPresenterMode(document, configuration, runtime)` owns presenter keyboard, timer, focus and transition resources.
- `udeChemistryPitchTheme` provides versioned local tokens.

## UDE chemistry pitch theme

The `1.0` theme is a repository-owned design interpretation for the chemistry Studiendekanat pitch. It is not presented as an official or approved UDE corporate design. It uses system-local font stacks, a high-contrast light surface, restrained teal emphasis, an amber focus token, monotonic spacing and a structural-grid chemistry treatment. No logo, external font, remote stylesheet or other downloaded asset is required.

The theme contract covers typography, spacing, surfaces, emphasis, focus and contrast tokens. Tests enforce documented numerical readability invariants but do not claim accessibility certification.

## Accessible component contract

Each section maps to a labelled `region` landmark and a deterministic heading. Components preserve source identities, labels, explicit reading order and complete static fallbacks. Prompt components are keyboard-focusable. Reduced-motion render plans suppress optional animation startup.

DOM, Reveal.js initialization, React, timers, event listeners and animation resources remain behind injected runtime ports. Repeated destruction is idempotent and releases renderer-owned resources.

## Presenter mode and optional detail paths

Presenter configuration version `1.0` is renderer-owned. Presenter notes, elapsed time, canonical position, detail-path position and focus-restoration state are kept separate from audience output and are never written to RDF, resolved paths, `SceneDocument` or `RevealRenderPlan`.

Optional detail paths reference existing renderer-owned component identities. Definitions are validated atomically: path identifiers and component identifiers must be known and unique, paths must be non-empty and bounded, and return targets may not create a cycle. Entering a detail path records the canonical entry and return focus target; traversing it does not reorder or mutate the canonical section sequence; exiting restores the configured canonical component.

Keyboard behavior is deterministic: `PageDown` and `PageUp` move through canonical sections outside detail mode, arrow keys traverse an active detail path, and `Escape` returns to the canonical presentation. Complete static fallbacks remain audience-visible. Presenter-only notes are excluded from the audience record. Reduced-motion plans suppress optional transition startup.

The runtime port owns keyboard listeners, timers, focus operations and transitions. `destroy()` is idempotent and releases all registered resources. The contract performs no network requests, telemetry, analytics, remote synchronization or learner tracking.

## Boundaries

The package does not modify semantic pitch claims, narrative order, `SceneDocument 1.0` or `RevealRenderPlan 1.0`. Presenter mode is a local renderer capability, not semantic state. Deployment, public release, OER publication, accounts, analytics and Phase 2 review execution remain outside this package.
