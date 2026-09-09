# System Issue #147 handoff — DiagramRole canonical flow projection

## Scope

Implemented the first selective reconciliation increment after the renderer-neutral flow-diagram contract from Issue #145 / PR #146 merged. This worker turn activates the already-versioned generic `FlowDiagram` semantics in authored `SceneItem`s and projects those resources through the canonical RDF-to-SceneDocument compiler.

Implementation reference only: `local/cogniflow-presentation-layout@5025221e7b150756668542a582b38ee09c44d73d`. The local branch is diverged from current `main` and was not cherry-picked or merged wholesale.

## Semantic activation

`ontology/dataset/concepts.trig` now registers `cd:DiagramRole` as a controlled `cd:CommunicativeRole`.

`ontology/dataset/shapes.trig` adds only the minimal SceneItem coupling required for activation:

- `cd:DiagramRole` is accepted by the existing role allowlist;
- `DiagramRole` requires selector `cd:body` and a selected `cd:FlowDiagram`;
- a selected `cd:FlowDiagram` requires `DiagramRole`.

The richer FlowDiagram constraints merged by #145 are preserved unchanged. In particular, `focusNode` remains optional (`maxCount 1` only), focus membership remains fail-closed, edge endpoints must belong to the owning diagram, and node/edge positions remain positive, unique and contiguous.

## Canonical compiler projection

`scripts/generate_canonical_runtime.py` now projects `DiagramRole` to the existing renderer-neutral SceneDocument `diagram` block.

The projection preserves:

- stable diagram/node/edge resource ids;
- deterministic node/edge order from `cd:position`;
- diagram label and description;
- directed edge source/target ids;
- source/provenance evidence;
- optional semantic focus as explicit `focusNodeId`;
- optional derived `primary` emphasis on the focused node without replacing the focus identity.

Compiler-side guards independently reject too-small diagrams, non-contiguous node/edge positions, focus outside the linked node set and edge endpoints outside the diagram node set.

## SceneDocument versioning

Version selection is content-based:

- canonical documents with no diagram continue to serialize as `SceneDocument 1.0`;
- once a `DiagramRole` compiles a diagram block, that document serializes as `SceneDocument 1.1`.

There is no unconditional 1.1 bump for existing paths.

The scene accessibility-label projection was also made primitive-safe: the first block may now supply `text`, diagram `label`, `spokenText`, `prompt`, or finally its id. Existing prose-first scenes remain unchanged, while a valid diagram-first scene no longer crashes on a missing `text` field.

## Effective-language provenance

The old local candidate hard-coded `skos:prefLabel@en`. That behavior was not copied.

Diagram/node/edge labels now follow the same effective selected-path language behavior established by System #141:

1. target-language `skos:prefLabel`;
2. authored `dct:title`;
3. authored `schema:name`;
4. deterministic local-name fallback.

When an RDF relation supplied the selected label, `source.relationPath` records the actual relation used, e.g. `skos:prefLabel@de`, `skos:prefLabel@en`, `dct:title`, or `schema:name`. A Diagram block itself retains the authored SceneItem `cd:body` selection source and, when distinct, the label-selection source.

This deliberately does not use an arbitrary foreign-language `skos:prefLabel` as fallback.

## Focus behavior

The pre-#145 local compiler required `focusNode` and omitted `focusNodeId`. This worker fixes both behaviors:

- no focus node is valid and emits no `focusNodeId`;
- a present focus node must belong to the diagram and is emitted exactly as `focusNodeId`.

## Manager-requested static fallback repair

Manager review of the first worker head found one bounded integration gap: `static_fallback()` had no explicit `diagram` branch, so a diagram-bearing canonical artifact would fall through to the prose path and attempt `block["text"]`.

The repair is limited to `scripts/generate_canonical_runtime.py` plus the focused flow-projection regression:

- `diagram` blocks now render to a semantic static `<figure>` rather than the prose fallback;
- diagram label and description are retained in the `<figcaption>`;
- node and edge arrays are emitted as ordered lists in the already-canonical order;
- edge text resolves source/target ids back to the canonical node labels;
- optional `focusNodeId` is preserved as `data-focus-node-id`;
- block, node and edge `source` evidence continues through the existing deterministic `fallback_attributes()` projection;
- no D3/SVG layout, styling contract, application theme or semantic/compiler behavior outside this fallback was changed.

`tests/test_flow_diagram_projection.py` now also creates a two-edge diagram and verifies that static fallback rendering succeeds without a prose `text` field, retains label/description/focus, preserves node and edge order, resolves relation text, and carries diagram/node/edge resource and relation-path evidence.

## Focused regressions

`tests/test_flow_diagram_semantics.py` now covers:

- optional focus remains SHACL-valid;
- valid DiagramRole SceneItem activation;
- FlowDiagram selection with a different role fails;
- DiagramRole with a non-`cd:body` selector fails;
- all pre-existing membership/order invariants remain covered.

New `tests/test_flow_diagram_projection.py` covers:

- valid flow projection emits SceneDocument 1.1;
- no focus is required and no bogus `focusNodeId` appears;
- authored node/edge order follows `cd:position`, independent of RDF insertion order;
- explicit focus id and derived node emphasis are preserved;
- actual effective-language relation paths are retained;
- target-language label fallback prefers `dct:title` over an arbitrary foreign-language `skos:prefLabel`;
- a diagram-first scene receives a valid accessibility label;
- static fallback preserves flow structure, order, focus and source evidence without requiring prose `text`;
- external edge endpoints fail closed;
- non-contiguous positions fail closed;
- FlowDiagram selection with a non-DiagramRole fails closed in the compiler.

`tests/test_formula_scene_semantics.py` updates the exact SceneItem role allowlist expectation for DiagramRole and explicitly proves representative non-diagram Formula and Chemometrics paths remain SceneDocument 1.0.

## Validation status

No local execution pass is claimed from this connector worker turn. The bounded static-fallback repair and regression are committed on `agent/147-diagramrole-canonical-projection`; a fresh exact-head `agent-validator/project-chemie-digital` result is mandatory before manager acceptance. Configured external review is also required on the repaired final head.

## Explicitly untouched

This worker did not modify:

- `packages/renderer-d3/**`;
- D3/SVG layout, text fitting or pixel/retro styling;
- CogniFlow scientific/prose content;
- Eco City assets or background/theme/light-dark behavior;
- `packages/core/src/scene-document.ts`;
- Chemometrics workflow/content/state;
- learner state.

The next reconciliation increment should consume this canonical 1.1 diagram output when reconciling the D3 flow renderer, rather than reintroducing semantic/compiler behavior from the old local branch.
