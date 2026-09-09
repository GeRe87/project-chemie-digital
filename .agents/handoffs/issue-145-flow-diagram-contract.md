# System Issue #145 handoff — versioned flow-diagram contract

## Scope

Implemented the bounded Software Architect prerequisite for the user-developed CogniFlow flow-diagram work. This branch formalizes the renderer-neutral diagram primitive and static adapter compatibility only. It does not absorb CogniFlow-specific second-slide prose, D3 pixel styling, Eco City assets, presentation theme controls, or Chemometrics content.

Implementation reference only: `local/cogniflow-presentation-layout@5025221`.

## Versioning decision

- Existing `SceneDocument 1.0` remains valid and remains the version produced by current composition/compiler paths that do not contain diagrams.
- New renderer-neutral `diagram` blocks require `SceneDocument 1.1`.
- Reveal accepts SceneDocument 1.0 and 1.1 and normalizes both to `RevealRenderPlan 1.1`.
- Self-Study accepts SceneDocument 1.0 and 1.1 and normalizes both to `SelfStudyRenderPlan 1.1`.
- Existing 1.0 content therefore requires no migration.

The decision is recorded in `docs/adr/0013-version-flow-diagram-scene-primitive.md`.

## Renderer-neutral contract

`packages/core/src/scene-document.ts` adds:

- `SCENE_DOCUMENT_FLOW_VERSION = "1.1"`;
- `DiagramNode` with stable id, authored label, source evidence and optional semantic emphasis;
- `DiagramEdge` with stable id, source/target node ids, authored relation label and source evidence;
- `DiagramBlock` with `diagramType: "flow"`, authored label/description, ordered nodes/edges and optional `focusNodeId`.

Validation fails closed for duplicate ids, unknown edge endpoints, unknown focus nodes, missing source evidence, fewer than two nodes or no edges. A diagram inside a document declaring 1.0 is rejected explicitly.

No layout or renderer fields were added: no coordinates, dimensions, orientation, color, CSS/SVG/D3 fields or theme controls are present in the SceneDocument contract.

## RDF/SHACL semantic structure

Added reusable structural vocabulary only:

- `cd:FlowDiagram`
- `cd:DiagramNode`
- `cd:DiagramEdge`
- `cd:hasDiagram`
- `cd:hasDiagramNode`
- `cd:hasDiagramEdge`
- `cd:sourceNode`
- `cd:targetNode`
- `cd:focusNode`

SHACL validates authored labels/body, positive node/edge positions, unique and contiguous node/edge ordering, edge endpoint membership and optional focus membership.

Important boundary: this issue intentionally does **not** add `cd:DiagramRole` to the SceneItem role allowlist and does not modify `scripts/generate_canonical_runtime.py`. RDF SceneItem activation and canonical compiler projection belong to the later bounded CogniFlow presentation increment, which must emit SceneDocument 1.1 and preserve the effective selected-path language. This avoids authoring semantics that the canonical compiler cannot yet project.

## Reveal compatibility

`packages/renderer-reveal/src/index.ts` adds a renderer-owned diagram plan preserving block/node/edge source evidence, label/description, focus and a deterministic readable static fallback. The existing pitch-component layer recognizes `diagram` as a component kind. No D3 dependency enters Reveal.

Focused coverage is in `packages/renderer-reveal/test/diagram-block.test.ts`; existing adapter/pitch/presenter fixtures were moved to RevealRenderPlan 1.1.

## Self-Study compatibility

`packages/renderer-self-study/src/index.ts` adds a structured diagram plan and static semantic HTML using `figure`, caption, ordered nodes and relation list. Node/edge source/provenance/relation-path identities are emitted as data attributes. No D3 dependency is introduced.

Focused coverage is in `packages/renderer-self-study/test/diagram-block.test.ts`.

## Semantic regressions

`tests/test_flow_diagram_semantics.py` exercises canonical SHACL plus isolated valid/invalid flow fixtures for:

- valid renderer-neutral flow structure;
- focus membership;
- edge endpoint membership;
- node position uniqueness/contiguity;
- edge position uniqueness/contiguity.

Core tests also prove existing SceneDocument 1.0 remains valid and 1.1 flow references fail closed.

## Validation state

No local command execution environment was used in this connector worker turn, so no test pass is claimed here. The branch is intended to be submitted as Draft PR and must receive a fresh exact-head `agent-validator/project-chemie-digital` result before manager acceptance. Configured external review is also still required before merge.

## Follow-up after merge

Reconcile `local/cogniflow-presentation-layout` onto the new main. The follow-up should then:

1. activate `DiagramRole` + RDF-to-SceneDocument compiler projection with effective path language and SceneDocument 1.1;
2. reconcile the existing D3 flow renderer/pixel text-fitting implementation with the now-merged core primitive;
3. review the authored CogniFlow second-slide claims separately;
4. review theme/Eco-City/background and generated `apps/pitch/index.html` separately.

Do not copy the local branch wholesale before those boundaries are reviewed.
