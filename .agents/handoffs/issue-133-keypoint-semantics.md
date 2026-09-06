# Issue #133 worker handoff — source-linked KeyPoint semantics

## Issue

`#133 — Add source-linked KeyPoint semantics and renderer-neutral list blocks`

## Completed

- Added `cd:KeyPoint` as a reusable `cd:LearningResource` subtype.
- Added `cd:hasKeyPoint` from an owning `cd:LearningResource` to one or more addressable `cd:KeyPoint` resources.
- Added `cd:KeyPointRole` and the exact `"cd:hasKeyPoint"` SceneItem selector.
- Added SHACL constraints for KeyPoint body, positive position, authored-resource evidence, exactly one owner, unique/contiguous per-owner positions, and strict role/selector coupling.
- Extended renderer-neutral `SceneDocument 1.0` additively with `ListBlock` / `ListItem`; existing block semantics and the document version are unchanged.
- Added canonical runtime compilation for `KeyPointRole + cd:hasKeyPoint` into exactly one unordered list block.
- Runtime compilation resolves points only through the selected owner, preserves owner source identity at block level and KeyPoint source identity/provenance at item level, and fails closed for missing points, duplicate/non-contiguous positions, multi-owner points, malformed types and wrong selectors.
- Added semantic list rendering to the Reveal/pitch preview, Reveal adapter/component layer and self-study adapter/HTML renderer without rewriting KeyPoint text.
- Added neutral/system-owned tests for semantic constraints, runtime projection, core list-block validation, Reveal mapping, self-study rendering and pitch-preview DOM output.
- Updated existing exact SceneItem role/selector allow-list regression expectations for the additive KeyPoint values.

## Contract decisions

### Source-linked concise representation

The authoritative relationship is:

```text
LearningResource
  ├── cd:body        -> full authored prose
  └── cd:hasKeyPoint
        ├── KeyPoint(position=1, cd:body=...)
        └── KeyPoint(position=2, cd:body=...)
```

KeyPoints are not renderer-owned slide copy. The inverse owner relationship is queried from incoming `cd:hasKeyPoint`; no duplicate inverse property was introduced.

### Drift control

The shared contract prevents structural drift (orphan/multi-owner points, ambiguous order, invalid SceneItem selection) but deliberately does not claim to prove semantic equivalence between the long prose and its concise points. Review remains responsible for semantic consistency when either representation changes.

### Language scope

For v1, each `cd:KeyPoint` has exactly one `cd:body` language literal. This keeps KeyPoint identity/order and selection deterministic. A future multilingual extension should be designed explicitly rather than weakening the initial contract implicitly.

### Renderer-neutral list primitive

`ListBlock` carries the owning resource in block-level `source`; each `ListItem` carries its own KeyPoint source/provenance. Renderers may choose semantic `<ul>`/`<ol>` presentation but must not shorten, paraphrase, merge, split or invent item text.

## Files changed

- `.agents/workflows/system/state.json`
- `ontology/dataset/concepts.trig`
- `ontology/dataset/shapes.trig`
- `packages/core/src/scene-document.ts`
- `scripts/generate_canonical_runtime.py`
- `apps/pitch/src/preview.ts`
- `packages/renderer-reveal/src/index.ts`
- `packages/renderer-reveal/src/pitch-theme.ts`
- `packages/renderer-self-study/src/index.ts`
- `tests/test_formula_scene_semantics.py`
- `tests/test_keypoint_scene_semantics.py`
- `packages/core/test/list-block.test.ts`
- `packages/renderer-reveal/test/list-block.test.ts`
- `packages/renderer-reveal/test/pitch-theme.test.ts`
- `packages/renderer-self-study/test/list-block.test.ts`
- `apps/pitch/test/list-preview.test.ts`
- `.agents/handoffs/issue-133-keypoint-semantics.md`

## Review follow-up

The post-reconciliation review identified two bounded #133 defects and one independent #132 defect.

Addressed in the #133 review-fix turn:

- `PitchComponentKind` now includes the already-supported Reveal `code` node kind; a focused regression maps a real code node through `createPitchComponentDocument()` and asserts the resulting component kind remains `code`.
- Static KeyPoint list fallback now retains each stable `ListItem.id` as `data-list-item-id`; a focused runtime regression asserts both fixture item identities are present in the generated markup.

Explicitly not addressed here:

- The free-text prompt fallback defect remains owned by Issue #132 and branch `agent/132-generic-scene-preview`.

## Validation

Focused regression tests were authored, but this interactive environment could not execute the repository test suite locally because no repository checkout/runtime was available to the container. External exact-head validation is therefore required before manager acceptance.

Required manager evidence remains:

- fresh `agent-validator/project-chemie-digital` success on the exact PR head;
- PR scope/review/thread/mergeability checks;
- accepted external review before merge.

## Boundaries preserved

- No Chemometrics scientific KeyPoints were authored or migrated.
- No Chemometrics workflow state was modified.
- No learner-state contract was changed.
- No course-selection/navigation work was performed.
- Issue #132 and branch `agent/132-generic-scene-preview` remain independent; their local-preview/free-text fixes are not folded into this issue.

## Follow-on after merge

A separate Chemometrics content issue can author source-linked KeyPoints for Mean Values and define lecture-oriented scenes that select them while self-study scenes continue to select full `cd:body` resources.
