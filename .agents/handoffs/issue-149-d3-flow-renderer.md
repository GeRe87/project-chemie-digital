# System Issue #149 handoff — renderer-d3 canonical FlowDiagram

## Scope

Implemented the renderer-focused selective reconciliation increment for System Issue #149 on `agent/149-d3-flow-renderer`.

The implementation consumes the merged canonical SceneDocument 1.1 `DiagramBlock` directly. It does not query RDF/Fuseki and does not modify RDF/SHACL, the canonical compiler, the SceneDocument contract, CogniFlow prose, Eco City/theme behavior, Chemometrics or learner state. The old `local/cogniflow-presentation-layout@5025221` branch was used only as a renderer-design reference; no commit was cherry-picked or merged wholesale.

## Render model and layout

`packages/renderer-d3/src/flow-diagram.ts` maps canonical `DiagramBlock` values into a dedicated flow render model while preserving canonical node/edge order, ids, labels, source resource ids, provenance ids, relation paths, optional emphasis and optional `focusNodeId`. Invalid diagram types, duplicate ids, invalid edge endpoints and invalid focus references fail closed.

`packages/renderer-d3/src/flow-layout.ts` provides deterministic renderer-only geometry:

- effective widths >= 900 use horizontal flow; narrower widths use vertical flow;
- semantic node/edge order is never changed;
- no force simulation is used;
- long unspaced values split only at Unicode grapheme boundaries via `Intl.Segmenter`;
- if `Intl.Segmenter` is unavailable, grapheme-dependent layout fails closed instead of degrading to code-point splitting;
- wrapping preserves every authored character, including repeated/leading whitespace and, after the latest repair, exact LF/CRLF line-break delimiters.

For authored multiline labels, `wrapFlowText()` now splits with a capturing LF/CRLF delimiter. The delimiter is retained on the final wrapped line of its authored paragraph, so the visual line count remains unchanged while `lines.join("")` reconstructs the source text exactly. Empty and consecutive authored lines retain their explicit delimiter entries. The focused regression covers mixed LF and CRLF text under actual wrapping and asserts the exact line array plus lossless reconstruction.

## SVG/runtime lifecycle

`createSvgD3FlowRuntime()` owns concrete browser SVG behavior:

- semantic figure/caption and accessible SVG fallback;
- generic `d3-flow-*` classes only;
- namespaced `xml:space="preserve"` on generated SVG text so repeated/leading spaces survive concrete rendering;
- DOM-unique arrow marker ids allocated once per flow mount, combining sanitized `sourceBlockId` with a renderer-local mount sequence;
- marker ids remain stable across responsive rerender and every edge references its own mount-local marker;
- keyboard focus targets only for keyboard interaction policy;
- responsive rerender preserves the active semantic node and restores focus where appropriate;
- reduced-motion output has no animation dependency;
- destruction is idempotent and releases resize observation/listeners.

## Keyboard integration

`mountD3FlowDiagram()` uses canonical `focusNodeId` when present and otherwise the first canonical node in keyboard mode. ArrowRight/ArrowDown move to the next canonical node, ArrowLeft/ArrowUp to the previous node, Home to the first and End to the last.

The bounded Pitch integration forwards real host-level `keydown` events to the existing component traversal. Handled navigation keys prevent browser default and stop propagation so Reveal cannot also consume them; unsupported keys are untouched and static mode binds no keyboard listener.

## Pitch integration and latest partial-mount repair

`apps/pitch/src/preview.ts` emits a generic `d3-flow-host` for canonical diagram blocks. `apps/pitch/src/flow-runtime.ts` maps hosts back to the exact canonical block, invokes renderer-d3 and fails closed for unknown blocks or renderer diagnostics. `apps/pitch/src/main.ts` owns the minimum mount/pagehide lifecycle.

Configured Copilot review of exact validated head `14ca0a14d5c7068a00f23a9871275b3bb321aa27` identified that `mountPitchFlowDiagrams()` could leak already-mounted components/listeners when a later host failed. The bounded repair makes the multi-host mount transactional:

- one shared `cleanupMounted()` removes every registered keyboard listener and destroys every mounted component;
- the entire host loop is wrapped in `try/catch`;
- any synchronous failure after earlier successful mounts — including unknown block references, renderer diagnostics or a thrown mount-path error — triggers `cleanupMounted()` before rethrowing;
- normal returned cleanup reuses the same cleanup primitive and remains idempotent;
- arrays are drained with `splice(0)`, preventing later double-destruction of already-cleaned resources.

The focused Pitch regression mounts one valid keyboard host before a later unknown-block host, asserts the call fails closed, verifies the first host has zero remaining keydown listeners, confirms post-failure key dispatch is inert, and confirms the prior component was destroyed exactly once.

## Previous bounded review repairs

Earlier configured review/validation cycles also produced these accepted bounded repairs:

- real DOM keyboard wiring for Arrow/Home/End traversal in Pitch;
- concrete SVG whitespace preservation via `xml:space="preserve"`;
- strip-types-compatible syntax in the SVG regression harness;
- mount-stable DOM-unique SVG marker ids across concurrent diagrams reusing the same canonical block id;
- fail-closed grapheme behavior when `Intl.Segmenter` is unavailable.

No repair changed canonical mapping, semantic order, renderer theme/palette, CogniFlow scientific content or cross-track behavior.

## Focused regressions

Renderer coverage includes canonical mapping/order/provenance, optional focus, invalid endpoint/type failures, horizontal/vertical layout, viewport-aware mobile width, lossless wrapping, mixed LF/CRLF preservation, grapheme-safe long identifiers, fail-closed missing `Intl.Segmenter`, concrete SVG whitespace, DOM-unique marker ids, marker stability across rerender, keyboard/static behavior, responsive focus preservation, cleanup, no mapping-time network requests and complete static fallback.

Pitch coverage includes canonical host/static fallback creation, exact block handoff, real DOM keyboard containment, static-mode non-interactivity, normal idempotent cleanup, fail-closed unknown blocks/renderer diagnostics, and rollback of already-mounted components/listeners when a later host fails.

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

## Validation and manager handoff

No local execution pass is claimed from this connector worker turn. The latest newline-preservation and transactional partial-mount repairs change the PR head, so prior validator/review evidence is historical only.

Draft PR #150 retains `<!-- agent-workflow-validator:project-chemie-digital -->` and `Closes #149`. The worker does not resolve review threads, mark the PR Ready, self-accept or merge.

Manager must require fresh exact-head `agent-validator/project-chemie-digital` success, configured Copilot re-review on that same final head with no unresolved findings, zero unresolved review threads, mergeable/0-behind integration state and the expected-head squash guard before merge.
