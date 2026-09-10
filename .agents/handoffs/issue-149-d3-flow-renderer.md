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

The package exports the flow API through `@project-chemie-digital/renderer-d3/flow` and deterministic layout helpers through `./flow-layout`, while preserving the existing root knowledge-network export.

## Responsive layout

Added `packages/renderer-d3/src/flow-layout.ts` as a renderer-only deterministic geometry layer.

- effective widths >= 900 use horizontal flow;
- narrower widths use vertical flow;
- semantic node/edge ordering is never changed by layout;
- no force simulation is used for the linear flow primitive;
- text wrapping never truncates authored characters;
- long unspaced values split only at Unicode grapheme boundaries through `Intl.Segmenter` on supported Node/browser runtimes;
- layout geometry is deterministic from the render model and effective host width.

The browser runtime resolves the effective width as the narrower usable value of the renderer host and current viewport. This is important for Reveal, whose internal presentation host can remain 1440 px wide while the browser viewport is substantially narrower because the deck is transformed/scaled. The renderer therefore still switches to the vertical mobile layout in that case.

## SVG/runtime lifecycle

`createSvgD3FlowRuntime()` owns browser DOM/SVG behavior behind a runtime port:

- semantic `<figure>`/`<figcaption>` structure;
- SVG accessible label plus complete `<desc>` fallback;
- directed edge markers and generic `d3-flow-*` classes only;
- keyboard focus targets only when `interactionPolicy === "keyboard"`;
- no focusable flow nodes in static mode;
- viewport-aware `ResizeObserver` / window-resize fallback;
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

### Manager-requested keyboard repair

Manager review of Draft PR #150 on head `8ca4a2bcd7c5da630b1632d1abb6480cff9119de` found that the component exposed the deterministic `handleKey()` traversal but the concrete Pitch mount route did not forward real DOM keyboard events to it. The bounded repair changes only `apps/pitch/src/flow-runtime.ts` plus its focused test:

- the flow host listens for bubbled `keydown` events only in `interactionPolicy: "keyboard"`;
- each event delegates its key to the existing `D3FlowComponent.handleKey()` implementation rather than duplicating traversal logic;
- browser default behavior is prevented only when `handleKey()` reports that the key was handled;
- handled flow-navigation keys also stop propagation so Reveal cannot simultaneously advance the deck; this matches the existing Pitch keyboard-containment pattern used by code and poll runtimes;
- unsupported keys remain untouched and continue to propagate normally;
- static mode binds no keyboard listener;
- the listener is removed before component destruction and cleanup remains idempotent.

No renderer semantics, layout, theme, content or cross-track behavior changed in this repair.

### Copilot-requested SVG whitespace repair

Configured Copilot review of the repaired exact head `c098365490d88604ed895d13dee274a5a3f100f9` reviewed 13/13 files and raised one renderer finding: the wrapping layer preserved authored repeated/leading spaces as strings, but SVG rendering could collapse them because the generated `<text>` elements did not request XML whitespace preservation.

The bounded follow-up changes only the concrete text-rendering primitive and one focused renderer test:

- `addTextLines()` now sets namespaced `xml:space="preserve"` on every generated SVG `<text>` element;
- both node and edge label `<tspan>` children inherit that preservation behavior;
- authored repeated/leading spaces remain unchanged in the wrapped line strings and concrete SVG text tree;
- `packages/renderer-d3/test/flow-svg-whitespace.test.ts` exercises the real `createSvgD3FlowRuntime().mount(...)` path with labels containing leading and repeated spaces and asserts both the `xml:space` attribute and exact reconstructed `<tspan>` content;
- no wrapping policy, node/edge order, layout geometry, keyboard behavior or semantic mapping changed.

The Copilot thread remains for manager resolution/re-review after a fresh exact-head validator pass; the worker does not resolve or self-accept the review finding.

## Minimal Pitch integration

Repository review found that the existing Reveal/Self-Study adapters already preserve SceneDocument 1.1 diagram payloads, but the concrete `apps/pitch` preview path still rejected every block kind other than its explicitly handled prose/math/code/list/prompt cases. A canonical diagram would therefore fail before the new D3 renderer could mount.

The bounded integration repair is limited to the existing presentation mount path:

- `apps/pitch/src/preview.ts` recognizes canonical `diagram` blocks and emits a generic `d3-flow-host` identified by `data-flow-block-id`, retaining block source/provenance/relation-path attributes and a complete static fallback;
- new `apps/pitch/src/flow-runtime.ts` resolves those hosts back to the exact canonical `DiagramBlock`, invokes renderer-d3, fails closed for missing blocks or renderer diagnostics, forwards keyboard-mode DOM keydown events into the component traversal, contains handled flow-navigation keys inside the host, and owns idempotent listener/component cleanup;
- `apps/pitch/src/main.ts` mounts all generated flow hosts after canonical scene mounting using the already-derived reduced-motion setting and keyboard interaction policy, and tears them down on `pagehide`;
- no Pitch theme/profile/background/layout selection, authored content or visual palette is changed.

This is only the minimum route needed to prove the renderer is consumable from the current SceneDocument-backed presentation runtime. The later CogniFlow/Eco-City visual increment remains separate.

## Focused regressions

Added renderer tests covering:

- deterministic canonical block mapping without source mutation;
- preserved node/edge order, source/provenance/relationPath and emphasis;
- optional focus absent and exact focus present behavior;
- unsupported diagram type and unknown edge endpoint fail-closed behavior;
- horizontal wide-host and vertical narrow-host layout;
- viewport-aware mobile selection when a Reveal-style host is wider than the actual viewport;
- complete text preservation during wrapping;
- Unicode-grapheme-safe splitting of long unspaced identifiers;
- concrete SVG preservation of leading/repeated whitespace for both node and edge labels;
- canonical-focus preference;
- Arrow/Home/End traversal;
- static-mode non-interactivity;
- active-node preservation across responsive rerender;
- idempotent lifecycle cleanup;
- no mapping-time network requests;
- complete static node/relation fallback.

Added `apps/pitch/test/flow-runtime.test.ts` proving:

- the scene preview creates the expected generic flow host and source-linked static fallback from a synthetic valid SceneDocument 1.1;
- the Pitch flow runtime passes the exact canonical `DiagramBlock` and options to renderer-d3;
- a real host-level `keydown` event drives the actual `mountD3FlowDiagram()` Arrow/Home/End traversal;
- handled navigation keys prevent browser default and stop propagation before Reveal can consume them;
- unsupported keys are neither prevented nor propagation-stopped;
- static mode registers no keydown listener;
- unmount removes the keydown listener and cleanup remains idempotent;
- unknown block references and renderer diagnostics fail closed.

## Validation status

The validator success on pre-whitespace-repair head `c098365490d88604ed895d13dee274a5a3f100f9` is historical only. This SVG repair changes the PR head, so fresh exact-head `agent-validator/project-chemie-digital` success and configured Copilot re-review are mandatory before manager acceptance.

No local execution pass is claimed from this connector repair turn.

## Explicitly untouched

- `ontology/dataset/**`;
- `scripts/generate_canonical_runtime.py`;
- `packages/core/**`;
- `packages/renderer-reveal/**` and `packages/renderer-self-study/**`;
- CogniFlow scientific/prose content;
- Eco City assets and light/dark/background/theme behavior;
- Pitch theme/profile/background CSS and broad visual redesign;
- Chemometrics workflow/content/state;
- learner-state behavior.

The only application files changed across #149 are the minimum generic flow host/mount lifecycle in `apps/pitch/src/preview.ts`, `apps/pitch/src/flow-runtime.ts`, `apps/pitch/src/main.ts` and its focused test. The Copilot-requested SVG whitespace repair itself touches only `packages/renderer-d3/src/flow-diagram.ts`, `packages/renderer-d3/test/flow-svg-whitespace.test.ts`, this handoff and workflow state.

## Pull request

Draft PR #150 contains `<!-- agent-workflow-validator:project-chemie-digital -->` and `Closes #149`. It must remain Draft until manager review. The worker does not self-accept or merge.

## Manager review focus

Manager should verify the renderer-first boundary, the necessity and boundedness of the Pitch mount route, package export compatibility, viewport-aware responsive behavior, deterministic order/focus preservation, repaired real DOM keyboard traversal/Reveal containment, concrete SVG whitespace preservation, static-mode accessibility, fresh exact-head configured validation and configured Copilot re-review before any Ready transition or merge.
