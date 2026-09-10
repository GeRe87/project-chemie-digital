# System Issue #149 handoff — renderer-d3 canonical FlowDiagram

## Scope

Implemented the renderer-focused selective reconciliation increment for System Issue #149 on `agent/149-d3-flow-renderer`.

The implementation consumes the merged canonical SceneDocument 1.1 `DiagramBlock` directly. It does not query RDF/Fuseki and does not modify RDF/SHACL, the canonical compiler, the SceneDocument contract, CogniFlow prose, Eco City/theme behavior, Chemometrics or learner state.

The old `local/cogniflow-presentation-layout@5025221` branch was used only as a renderer-design reference. No commit was cherry-picked or merged wholesale.

## Render model

Added `packages/renderer-d3/src/flow-diagram.ts` with a dedicated `D3FlowRenderModel` projection from canonical `DiagramBlock`.

The mapping:

- supports `diagramType: "flow"` only and fails closed for other diagram types;
- retains canonical node and edge array order as renderer reading order;
- preserves node/edge ids, labels, source resource ids, provenance ids and relation paths;
- preserves optional node emphasis;
- preserves optional canonical `focusNodeId` explicitly;
- validates duplicate ids, minimum node/edge counts, edge endpoint membership and focus membership;
- reuses the existing renderer interaction option shape (`reducedMotion`, `keyboard | static`);
- creates a deterministic static fallback containing the diagram label/description, every node and every directed relation.

The package exports the flow API through `@project-chemie-digital/renderer-d3/flow` without changing the existing root knowledge-network API.

## Responsive layout

Added `packages/renderer-d3/src/flow-layout.ts` as a renderer-only deterministic geometry layer.

- host widths >= 900 use horizontal flow;
- narrower hosts use vertical flow;
- semantic node/edge ordering is never changed by layout;
- no force simulation is used for the linear flow primitive;
- text wrapping never truncates authored characters;
- long unspaced values split only at Unicode grapheme boundaries through `Intl.Segmenter` on supported Node/browser runtimes;
- layout geometry is deterministic from the render model and host width.

## SVG/runtime lifecycle

`createSvgD3FlowRuntime()` owns browser DOM/SVG behavior behind a runtime port:

- semantic `<figure>`/`<figcaption>` structure;
- SVG accessible label plus complete `<desc>` fallback;
- directed edge markers and generic `d3-flow-*` classes only;
- keyboard focus targets only when `interactionPolicy === "keyboard"`;
- no focusable flow nodes in static mode;
- responsive `ResizeObserver` / window-resize fallback;
- responsive rerender preserves the active node and restores DOM focus when appropriate;
- reduced-motion output has no animation dependency;
- destroy is idempotent and releases resize observation/listeners.

No CogniFlow-specific palette, pixel-art geometry, Eco City assets or presentation background/theme controls were introduced.

## Interaction behavior

`mountD3FlowDiagram()` prefers canonical `focusNodeId` as initial active/focused node when present. Without a semantic focus, keyboard mode starts deterministically at the first canonical node; static mode remains non-interactive.

Keyboard traversal supports:

- ArrowRight / ArrowDown → next canonical node;
- ArrowLeft / ArrowUp → previous canonical node;
- Home → first canonical node;
- End → last canonical node.

Responsive layout changes retain the current active semantic node.

## Focused regressions

Added `packages/renderer-d3/test/flow-diagram.test.ts` and `flow-layout.test.ts` covering:

- deterministic canonical block mapping without source mutation;
- preserved node/edge order, source/provenance/relationPath and emphasis;
- optional focus absent and exact focus present behavior;
- unsupported diagram type and unknown edge endpoint fail-closed behavior;
- horizontal wide-host and vertical narrow-host layout;
- complete text preservation during wrapping;
- Unicode-grapheme-safe splitting of long unspaced identifiers;
- canonical-focus preference;
- Arrow/Home/End traversal;
- static-mode non-interactivity;
- active-node preservation across responsive rerender;
- idempotent lifecycle cleanup;
- no mapping-time network requests;
- complete static node/relation fallback.

## Integration decision

No `apps/pitch` or Reveal adapter mutation was necessary in this increment. The merged Reveal/Self-Study adapters already recognize SceneDocument 1.1 `diagram` blocks and preserve their complete canonical payload/static fallback. This issue supplies the renderer-d3 flow API that a later presentation-runtime integration can mount without changing the semantic/compiler contract.

Keeping app wiring out of this PR also avoids mixing generic renderer mechanics with the later CogniFlow visual/theme reconciliation.

## Validation status

No local execution pass is claimed from this connector worker turn. The authored tests and package changes are committed on the issue branch. Fresh exact-head `agent-validator/project-chemie-digital` success and configured external review are mandatory before manager acceptance.

## Explicitly untouched

- `ontology/dataset/**`;
- `scripts/generate_canonical_runtime.py`;
- `packages/core/**`;
- `packages/renderer-reveal/**` and `packages/renderer-self-study/**`;
- `apps/pitch/**`;
- CogniFlow scientific/prose content;
- Eco City assets and light/dark/background/theme behavior;
- Chemometrics workflow/content/state;
- learner-state behavior.

## Manager review focus

Manager should verify the renderer-only boundary, exact-head validation, generic rather than CogniFlow-specific visual mechanics, deterministic order/focus preservation, static-mode accessibility and the package-export compatibility change before any Ready transition or merge.
