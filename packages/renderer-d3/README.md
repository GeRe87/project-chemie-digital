# D3 renderers

`@project-chemie-digital/renderer-d3` contains downstream D3/SVG renderers for validated neutral core contracts.

## Boundary

The package consumes complete core records and creates adapter-owned render models. It preserves semantic identities, labels and source/provenance references. It never queries RDF/Fuseki and never writes layout coordinates, focus state, browser lifecycle data or visual styling decisions back into core records.

The neutral core does not import this package. D3, DOM, SVG, responsive geometry and interaction implementations remain renderer-owned.

## Knowledge-network API

- `createD3KnowledgeNetworkRenderModel(document, options)` performs deterministic KnowledgeNetworkDocument 1.0 mapping and returns either a complete render model or stable diagnostics.
- `mountD3KnowledgeNetwork(host, document, options, runtime)` owns mount, repeated render, keyboard focus and cleanup lifecycle.
- `canonicalSerializeD3RenderModel(model)` provides deterministic serialization for tests and snapshots.

## Flow-diagram API

The `./flow` subpath consumes the canonical SceneDocument 1.1 `DiagramBlock` directly:

- `createD3FlowRenderModel(block, options)` preserves canonical node/edge order, ids, labels, source/provenance evidence, optional emphasis and optional `focusNodeId`.
- `mountD3FlowDiagram(host, block, options, runtime)` mounts a deterministic SVG flow, observes responsive width changes, preserves active focus across layout changes and owns cleanup.
- `createSvgD3FlowRuntime()` is the browser DOM/SVG implementation behind the runtime port.

The `./flow-layout` subpath exposes deterministic renderer-only layout helpers. Hosts at 900 CSS pixels or wider use horizontal flow; narrower hosts use vertical flow. Text wrapping never truncates characters and long unspaced identifiers split only at Unicode grapheme boundaries.

## Accessibility

Knowledge networks follow their authoritative node/edge reading orders and static fallback. Flow diagrams retain canonical array order as reading order and expose a complete textual fallback containing every node and directed relation. Keyboard mode supports Arrow keys plus Home/End; static mode creates no focusable flow nodes. Reduced-motion flow rendering has no animation dependency.

## Lifecycle and interactions

Knowledge-network force simulation remains runtime-owned and is cleaned up by its mount lifecycle. Flow diagrams use deterministic linear geometry rather than force simulation. Responsive flow rerendering changes only renderer geometry and keeps the same semantic reading order and active node whenever it still exists.

## Offline behavior

Mapping and lifecycle orchestration perform no network requests, dereference no external references and capture no learner telemetry. Assets and runtime dependencies must be supplied locally by the embedding application.

## Explicit exclusions

This package does not query RDF or Fuseki, change ontology/SHACL, alter SceneDocument or KnowledgeNetworkDocument contracts, author CogniFlow content, define Eco City/background themes, claim pedagogical effectiveness or publish a visual design system.
