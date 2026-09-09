# ADR-0013: Version the renderer-neutral flow-diagram scene primitive

- Status: Proposed
- Date: 2026-09-09

## Context

`SceneDocument 1.0` deliberately started with a small renderer-neutral primitive set. ADR-0005 requires an explicit adapter-version update and compatibility tests when a new primitive changes what a renderer must preserve. The CogniFlow presentation prototype needs a source-linked process diagram whose nodes, directed relations and optional semantic focus remain reusable across presentation, self-study and D3 realizations.

Encoding that diagram as renderer-specific SVG, D3 coordinates, CSS classes or presentation layout upstream would violate ADR-0003 and ADR-0012. Adding `diagram` silently to `SceneDocument 1.0` would also make existing 1.0 adapters appear compatible while allowing source content they do not understand.

## Decision

Introduce `SceneDocument 1.1` as the first contract version that may contain a renderer-neutral `diagram` block. Existing `SceneDocument 1.0` remains valid and continues to be produced by existing composition paths that do not require diagrams.

The 1.1 flow-diagram primitive contains only semantic and accessibility-relevant structure:

- stable block identity and source references;
- `diagramType: "flow"`;
- authored label and description;
- ordered, source-linked nodes with stable ids and labels;
- ordered, source-linked directed edges with stable ids, endpoint ids and labels;
- optional semantic focus through `focusNodeId` and/or node emphasis.

It contains no coordinates, pixel dimensions, orientation, colors, CSS classes, SVG paths, D3 force parameters, breakpoints, theme names or other renderer layout instructions.

## Core compatibility

`validateSceneDocument` accepts versions `1.0` and `1.1`. A `diagram` block is invalid in a document declaring `1.0`; this prevents an old-version document from carrying semantics that 1.0 adapters were never required to preserve.

Flow validation is fail-closed:

- at least two nodes and one edge are required;
- node and edge ids are unique;
- every node and edge retains source evidence;
- every edge endpoint references a node in the same diagram;
- an optional `focusNodeId` references a node in the same diagram.

The existing generic scene composer remains a `1.0` producer until a bounded content/compiler increment actually requires a 1.1 primitive.

## RDF authoring boundary

The reusable RDF vocabulary defines `FlowDiagram`, `DiagramNode`, `DiagramEdge` and their structural relations. SHACL requires positive deterministic positions and validates node/edge sequence uniqueness and contiguity, edge membership and optional focus membership.

This architecture increment intentionally does **not** activate a new SceneItem communicative role or canonical RDF-to-SceneDocument compiler branch. That authoring activation belongs to the bounded presentation increment that first selects a diagram into a scene; it must then emit `SceneDocument 1.1` and preserve the effective path language. This avoids a temporary state in which SHACL accepts a selectable diagram scene that the canonical compiler cannot yet project.

## Reveal compatibility

The Reveal adapter accepts both `SceneDocument 1.0` and `1.1` and now emits `RevealRenderPlan 1.1`. A flow diagram maps to an adapter-owned diagram node that retains the complete semantic structure and a deterministic readable static fallback. The downstream pitch component contract recognizes `diagram` as a component kind without introducing D3 or SVG into the semantic contract.

Existing 1.0 scene documents therefore remain consumable; their Reveal render plans are normalized to adapter version 1.1.

## Self-study compatibility

The Self-Study adapter accepts both scene-document versions and emits `SelfStudyRenderPlan 1.1`. A flow diagram maps to a structured self-study diagram plan and semantic static HTML (`figure`, caption, node list and relation list) with source/provenance/relation-path evidence. Self-Study does not depend on D3.

Existing 1.0 scene documents remain consumable and are normalized to the current adapter plan version.

## D3 boundary

A D3 flow renderer may realize the same `DiagramBlock` visually. D3 owns geometry, text measurement, responsive orientation, pixel styling, focus interaction and SVG lifecycle. None of those decisions are written back into RDF or `SceneDocument`.

The user-developed `local/cogniflow-presentation-layout` branch is an implementation reference for this later renderer realization, not part of this architecture increment.

## Consequences

- Existing courses and SceneDocument 1.0 fixtures do not require migration.
- A diagram cannot be silently smuggled into a 1.0 document.
- Reveal and Self-Study retain complete readable content even without a graphical D3 realization.
- The upcoming CogniFlow presentation follow-up can activate DiagramRole/compiler projection and D3 styling on top of a stable contract.
- Presentation-specific layout remains renderer-owned under ADR-0012.
