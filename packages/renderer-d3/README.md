# D3 knowledge-network renderer

`@project-chemie-digital/renderer-d3` is the downstream adapter for `KnowledgeNetworkDocument 1.0`.

## Boundary

The package consumes a complete validated core document and creates an adapter-owned render model. It preserves semantic node and edge identities, labels, groups and source/provenance references. It never mutates the source document or writes coordinates, simulation state, zoom state, focus state or browser lifecycle data back into core records.

The neutral core does not import this package. D3, DOM, SVG/canvas, simulation and interaction implementations belong behind the `D3RuntimePort` supplied by the browser integration layer.

## Public API

- `createD3KnowledgeNetworkRenderModel(document, options)` performs deterministic mapping and returns either a complete render model or stable diagnostics.
- `mountD3KnowledgeNetwork(host, document, options, runtime)` owns mount, repeated render, keyboard focus and cleanup lifecycle.
- `canonicalSerializeD3RenderModel(model)` provides deterministic serialization for tests and snapshots.

## Accessibility

The adapter follows the document's authoritative node and edge reading orders, exposes the complete static fallback, marks nodes focusable only in keyboard mode and supports arrow, Home and End navigation through the runtime focus port. Visual implementations must provide meaningful labels and non-color-only distinctions.

## Lifecycle and interactions

The adapter destroys the previous runtime mount before every successful rerender and makes destroy idempotent. Layout coordinates, force simulation, timers, listeners, drag, zoom and transitions remain runtime-owned and must be released by `D3RuntimeMount.destroy()`.

## Offline behavior

Mapping and lifecycle orchestration perform no network requests, dereference no external references and capture no learner telemetry. Assets and runtime dependencies must be supplied locally by the embedding application.

## Explicit exclusions

This package does not query RDF or Fuseki, change ontology or SHACL content, alter `KnowledgeNetworkDocument 1.0`, render Reveal.js scenes, claim pedagogical effectiveness or publish a visual design system.
