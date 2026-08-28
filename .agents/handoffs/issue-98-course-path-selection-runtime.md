# Agent handoff

## Role

`Backend and Data Integration Engineer`

## Issue

`#98 — Implement explicit course/unit/path selection in canonical runtime`

## Completed

- Added `scripts/course_path_selection.py` as the renderer-neutral offline ADR-0009 selection boundary over one supplied immutable `rdflib.Dataset` snapshot.
- Added frozen typed request/result/path-reference structures and stable selector failure codes.
- Validated offering, placement and learning-unit context in one course named graph without using labels, positions, routes, renderer state or file boundaries as identity.
- Discovered available paths as exact `(path IRI, path graph IRI)` references only when `rdf:type cd:LearningPath` and `cd:forLearningUnit` occur in the same named graph.
- Implemented exact explicit path membership, true-singleton fallback, no-path failure and fail-closed multi-path ambiguity.
- Preserved duplicate path IRIs across different named graphs as distinct candidate references.
- Replaced global `LearningPath` cardinality discovery in `compile_scene_document` with an explicit selected path reference and expected named graph.
- Bound `cd:hasStep` discovery to the selected path graph while retaining the existing logical-Dataset scene/resource resolution and path-step ordering behavior.
- Updated `build_artifact` and the CLI so selection occurs before scene compilation. Existing zero-argument generation uses the current offering/placement/unit context and ADR-0009 singleton fallback.
- Added optional `--offering-id`, `--placement-id`, `--unit-id`, `--path-id` and `--path-graph-id` CLI inputs; path ID and graph ID must be supplied together.
- Preserved the existing `ResolvedLearningPath` and `SceneDocument 1.0` contracts and did not modify canonical RDF/SHACL or renderer contracts.
- Updated the semantic-authoring preview callsite to perform the same explicit default course selection before invoking the now-explicit compiler API. This additional production-file change is required to avoid breaking an existing consumer of `compile_scene_document`.
- Updated runtime and semantic-authoring tests for explicit selected-path delegation.
- Updated repository and core documentation for the offline selection/delegation boundary and CLI syntax.

## Files or resources changed

- `scripts/course_path_selection.py` — new renderer-neutral offline selector and stable failures.
- `scripts/generate_canonical_runtime.py` — explicit selected-path delegation, demonstrator defaults and CLI selection inputs.
- `tests/test_course_path_selection.py` — deterministic ADR-0009 selector coverage.
- `tests/test_canonical_runtime_path_resolution.py` — existing resolver coverage migrated to an explicit selected path plus multi-path isolation tests.
- `README.md` — offline course/unit/path selection and CLI documentation.
- `packages/core/README.md` — active Python selector/delegator boundary clarified; TypeScript contracts remain unchanged.
- `scripts/semantic_authoring.py` — necessary existing compiler callsite migration for deterministic preview generation.
- `tests/test_semantic_authoring.py` — expected preview compilation migrated to the same explicit selection flow.
- `.agents/handoffs/issue-98-course-path-selection-runtime.md` — this handoff.

## Verification

- [ ] Root `npm test` — not executed by this connector-oriented worker; authoritative exact-head `agent-validator/project-chemie-digital` evidence is required after the draft PR is opened.
- [x] Selector coverage added for current singleton selection, explicit exact selection, unrelated paths, same-unit ambiguity, wrong path/graph membership, wrong offering/placement/unit context, zero paths, incomplete path pairs, invalid non-HTTP identity, duplicate path IRI across graphs, RDF insertion-order independence and ambiguous offering ownership.
- [x] Runtime coverage retains the existing path-step/scene/resource/math/poll/code failure and ordering tests while passing an explicit selected path.
- [x] Runtime coverage adds an unrelated second valid `LearningPath` and an unresolvable unselected same-unit path to prove explicit selection isolates resolution from global path cardinality.
- [x] Existing semantic-authoring preview test was migrated so selector + compiler remain deterministic and do not mutate the supplied Dataset.
- [x] Scope review — no canonical TriG/SHACL, semantic-client contract, renderer, learner-state, LMS or GitHub Actions file changed.
- [x] Accessibility/privacy review — selection is non-visual semantic compiler context containing only project-owned IRIs; no personal data, tracking or accessibility surface is introduced.
- [x] Documentation updated.
- [ ] Browser check — not applicable because no UI/rendered contract or authored presentation content changed.

## Decisions and assumptions

### Implemented in the active Python runtime rather than a parallel TypeScript selector

The repository's active canonical path/scene compilation is `scripts/generate_canonical_runtime.py`; `packages/core/src/path-resolver.ts` currently retains renderer-neutral TypeScript contracts but explicitly points to the Python generator as the active canonical resolver. Implementing ADR-0009 here avoids a second unused source of selection policy.

### Named-graph membership is exact evidence

A path candidate exists only when its `rdf:type cd:LearningPath` and `cd:forLearningUnit` statements occur in the same named graph. File boundaries remain irrelevant, so the current Standardabweichung path works even though its course-scale relation and type/steps are authored in separate TriG files that assemble into the same logical path graph.

### Path resolution receives the selected graph explicitly

`compile_scene_document(dataset, selected_path)` verifies the path type in the expected selected graph and reads that path's `cd:hasStep` relations from the same graph. Scene/resource resolution continues across the logical Dataset exactly as before. This prevents unrelated same-IRI path statements in another graph from being folded into the selected path.

### Default behavior uses semantic singleton selection, not a hard-coded path winner

The CLI defaults identify the current offering, placement and unit. They do not hard-code a path winner. With current canonical data, the selector discovers one exact path reference and normalizes it through the ADR-0009 singleton rule. A future second path for that unit makes the default invocation ambiguous until an exact `--path-id` + `--path-graph-id` pair is supplied.

### Generated transport is expected to remain byte-compatible for the current fixture

No authored Dataset or output schema was changed. The current selected path and its ordered steps are the same path/graph/steps previously discovered globally, so the generated `SceneDocument 1.0`, dataset snapshot, fingerprint and static fallback are expected to remain byte-identical under the current canonical fixture. Exact project validation remains pending at worker handoff.

## Risks or unresolved questions

- Authoritative root validation is pending until the local validator publishes the required exact-head commit status after the draft PR is opened.
- This issue deliberately does not add path modality/audience/ranking semantics. Once a unit has multiple paths, an application must supply an explicit available path reference until a separately reviewed semantic/application contract defines another selection input.
- The additional `scripts/semantic_authoring.py` and `tests/test_semantic_authoring.py` changes were not in the normal expected-file list, but are required because that existing authoring preview directly consumed the changed compiler function signature. No authoring contract or RDF mutation behavior was otherwise changed.

## Recommended manager action

`review` after authoritative exact-head `agent-validator/project-chemie-digital` evidence is available. Verify the selector/error semantics, explicit compiler delegation, the justified semantic-authoring callsite migration, current generated-output compatibility and the exact changed-file scope before acceptance.
