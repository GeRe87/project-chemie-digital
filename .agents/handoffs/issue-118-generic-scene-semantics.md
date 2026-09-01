# Agent handoff

## Role

`Semantic Web and Ontology Engineer`

## Issue

`#118 — Generalize graph-backed scene semantics for reusable learning resources`

## Completed

- Additively generalized the central `cd:SceneItemShape` allow-lists in `ontology/dataset/shapes.trig` without changing the graph-backed scene model or introducing new ontology terms.
- Added the already-defined controlled communicative roles `cd:StatementRole`, `cd:ExampleRole`, and `cd:ExerciseRole` to the permitted `cd:communicativeRole` values.
- Added `skos:prefLabel@en` to the permitted heading selector paths while retaining the existing `skos:prefLabel@de` selector unchanged.
- Added direct `cd:body` to the permitted selector paths for authored reusable LearningResources.
- Preserved all pre-existing role and selector values unchanged: `HeadingRole`, `QuotationRole`, `CitationRole`, `CodeRole`, `PollRole`, `skos:prefLabel@de`, `cd:hasDefinition`, `cd:hasDefinition/cd:hasSource`, `cd:hasCodeExample`, and `cd:hasAudiencePoll`.
- Preserved the existing `cd:selectsResource` class restriction and the explicit selected-resource `cd:authoredResource true` requirement.
- Preserved positive and unique `cd:position` validation; no ordering rule was relaxed.
- Added in-memory semantic fixtures proving valid graph-backed items for an English heading, Definition prose via `StatementRole + cd:body`, a `WorkedExample` via `ExampleRole + cd:body`, and an `Exercise` via `ExerciseRole + cd:body`.
- Retained deterministic negative coverage for unsupported communicative roles and unsupported selector paths.

## Files or resources changed

- `ontology/dataset/shapes.trig`
- `tests/test_scene_semantics.py`
- `.agents/handoffs/issue-118-generic-scene-semantics.md`

`ontology/dataset/concepts.trig` is intentionally unchanged: repository evidence already defines and registers `StatementRole`, `ExampleRole`, and `ExerciseRole` as controlled `CommunicativeRole` values, so no vocabulary repair or new concept is required.

No Chemometrics dataset/content/path/scene file, runtime/compiler/application file, `SceneDocument 1.0` contract, learner-state contract, workflow configuration/state (other than the live System dispatcher handoff outside the PR), validator configuration, or renderer was changed by this feature branch.

## Exact SHACL allow-list delta

### `cd:communicativeRole`

Previous permitted values:

- `cd:HeadingRole`
- `cd:QuotationRole`
- `cd:CitationRole`
- `cd:CodeRole`
- `cd:PollRole`

Added values:

- `cd:StatementRole`
- `cd:ExampleRole`
- `cd:ExerciseRole`

No existing value was removed or renamed.

### `cd:selectionPath`

Previous permitted values:

- `skos:prefLabel@de`
- `cd:hasDefinition`
- `cd:hasDefinition/cd:hasSource`
- `cd:hasCodeExample`
- `cd:hasAudiencePoll`

Added values:

- `skos:prefLabel@en`
- `cd:body`

No existing value was removed or renamed. Unsupported strings remain invalid because `sh:in` remains closed.

## Compatibility evidence

- Existing canonical Standardabweichung scene statements were not edited.
- `test_reference_scene_conforms_and_traces_graph_relations` continues to validate the assembled canonical dataset and its authored-resource traceability.
- `test_all_nine_scene_definitions_are_renderer_neutral` remains unchanged and continues to assert the existing nine canonical graph-backed scenes are renderer-neutral.
- Existing code and poll tests remain unchanged and continue to require `CodeRole + cd:hasCodeExample` and `PollRole + cd:hasAudiencePoll`.
- Existing duplicate-position, missing selected-resource, missing authored-resource evidence, unsupported-role, and unsupported-selection-path negative tests remain in place.
- New fixtures are test-local only and do not add canonical scenes or scientific content.

## Verification

- [x] Scope review: only central SHACL, focused scene-semantic tests, and this handoff are changed.
- [x] Vocabulary review: all newly permitted roles were already defined and registered in `concepts.trig`; no ontology-term creation was necessary.
- [x] Compatibility review: all prior allowed roles/selectors remain byte-equivalent in the allow-lists, and authored Standardabweichung scene data is untouched.
- [x] Positive fixture coverage: English heading, Definition/Statement body, WorkedExample/Example body, Exercise/Exercise body.
- [x] Negative fixture coverage remains: unsupported communicative role and unsupported selector path fail closed.
- [x] Authorship boundary remains: selected resources require explicit `cd:authoredResource true`.
- [x] Position boundary remains: positions are positive and duplicate positions within one scene remain invalid.
- [ ] Root `npm test`: authoritative execution is expected from the repository exact-head validator; no local repository runtime is available through this connector-oriented worker.
- [ ] Exact-head `agent-validator/project-chemie-digital`: check after Draft PR creation.

## Decisions and assumptions

### Minimal additive activation

The issue requests activation of already-defined generic vocabulary, not a redesign. Therefore the allow-list was extended only with the three roles required by the next content slice and the two selector strings required for direct body/English-heading selection. Other existing controlled roles such as `ConceptRole`, `ComparisonRole`, `FormulaRole`, and `SymbolRole` remain outside `SceneItemShape` until a separately justified use case requires them.

### Selector/resource coupling remains unchanged

The current SHACL model validates `selectsResource`, explicit authorship evidence, role allow-list, and selector allow-list independently. This issue does not introduce a new cross-property role/resource/selector matrix, because that would redesign the existing contract rather than perform the requested compatibility-preserving activation. Runtime projection remains responsible for interpreting supported selectors after a separate reviewed implementation increment.

### No new architecture decision

ADR-0003 already provides renderer-neutral `prompt` semantics and ADR-0004 already establishes `Exercise -> prompt -> practice`. This SHACL change merely permits graph-backed authored Exercise resources to be represented faithfully for the later compiler increment.

## Remaining System follow-up

After Issue #118 is accepted and merged, a separate System manager turn should assign the **Backend and Data Integration Engineer** to extend the graph-to-`SceneDocument 1.0` projection for the newly valid generic role/selector combinations while preserving existing Standardabweichung output and the unchanged `SceneDocument 1.0` contract.

Only after that runtime/compiler increment is integrated should the Chemometrics manager unblock the separate content turn that authors the five Random Variables scenes and `PathStep -> cd:usesScene` bindings.

## Semantic/content gaps

No new scientific content is required by this System issue. The blocked Chemometrics lane already owns the later Random Variables scene authoring once both System prerequisites are integrated.

## Recommended manager action

`review` after fresh exact-head `agent-validator/project-chemie-digital` evidence is available. Verify the three-file scope, closed additive allow-list delta, unchanged existing scene data/code/poll semantics, positive/negative SHACL evidence, and the explicit deferral of runtime projection and Chemometrics scene authoring before acceptance.
