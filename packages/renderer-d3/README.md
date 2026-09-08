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

## Flow diagrams

`createD3FlowRenderModel` and `mountD3FlowDiagram` consume neutral `DiagramBlock` content. The SVG runtime preserves labels, directed relations, emphasis and provenance. Pitch supplies light/dark teal/amber pixel palettes, stepped vector frames and hard offset shadows; no image, remote font or new dependency is required. Live theme switching changes CSS color variables only, so text metrics and geometry remain stable.

Text is measured with SVG font metrics outside potentially hidden presentation slides. Node titles have reserved space for the number panel, status marker and frame. Relation capsules grow to their measured text width; longer labels wrap into `tspan` lines and increase shape height, including unspaced identifiers. Actual text bounding boxes determine vertical centering. Font loading triggers remeasurement. Text sizes use SVG user units rather than Reveal-dependent `rem` values.

Below 900 pixels of available host/viewport width the renderer changes from a horizontal row to a vertical sequence with relation capsules in the gaps. `viewBox` and `preserveAspectRatio` scale the entire layout consistently. Pitch lets diagram-only vertical scroll pages grow naturally instead of clipping them in Reveal's transformed viewport-sized wrapper. Use scroll view on phones to read the full vertical sequence; a fixed-height deck shows a scaled overview. Resize/font observers are disposed on unmount. Keyboard focus remains separate from the authored primary emphasis.

Validation: `npm run test:renderer-d3`. For a browser check, run `npm --workspace @project-chemie-digital/pitch run dev:cogniflow` and inspect the second scene in scroll and `?view=deck` modes, at desktop and phone widths, with both themes. Check title/number/capsule bounding boxes, long labels, arrow-key focus and the browser console. The start command regenerates disposable runtime content and the HTML static fallback.
