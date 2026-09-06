# Issue #132 handoff — generic SceneDocument preview and free-text prompt fallback

## Worker scope

System-owned Runtime/Application Engineer turn for Issue #132. The existing historical branch implementation was first rebased/reset onto the current `main` assigned by the manager, so the final diff is based on merged Issue #133 rather than the pre-KeyPoint September 4 snapshot.

Draft PR: #135 — `Fix generic SceneDocument preview and free-text fallback`
Branch: `agent/132-generic-scene-preview`

## Implemented

### 1. Response-mode-aware static prompt fallback

`scripts/generate_canonical_runtime.py` now branches `prompt` fallback rendering by `responseMode`:

- `single-choice` retains the existing `poll-fallback`, `data-poll-key`, `data-poll-option-ids`, option list and source/provenance behavior;
- `free-text` emits a `prompt-fallback` containing the authored prompt and source/provenance without accessing or requiring `options`;
- any unsupported response mode raises `ValueError` and therefore fails closed.

The merged #133 `list` fallback remains immediately before the prompt branch and is unchanged, including stable `data-list-item-id` identity and per-item source/provenance.

### 2. Generic single-SceneDocument pitch loading

`apps/pitch/src/graph-scene-data.ts` now exposes a small `compilePitchSceneDocumentsFromArtifact()` boundary used by the normal `compilePitchSceneDocuments()` path.

The loader still enforces:

- runtime artifact version `1.0`;
- `sha256:` Dataset fingerprint presence;
- exactly one SceneDocument;
- non-missing document;
- `validateSceneDocument()`.

It no longer requires the document's `sourcePathId` to equal `ex:path-standard-deviation`. `STANDARD_DEVIATION_PATH_ID` remains only as the historical fixture identity used by existing Standard Deviation regression assertions; it is not a loader gate.

## Regression coverage

### Python

New `tests/test_prompt_static_fallback.py` covers:

- actual Chemometrics Mean Values selection through `CourseUnitPathSelectionRequest`, confirming eight scenes and a generated `prompt-fallback` without the previous `KeyError: 'options'`;
- isolated free-text prompt fallback without an `options` field;
- unchanged single-choice poll fallback metadata/options;
- fail-closed unsupported prompt response modes;
- preservation of the #133 KeyPoint list fallback and stable list-item identity.

### Pitch / TypeScript

`apps/pitch/test/preview.test.ts` adds coverage that:

- a valid single SceneDocument whose `sourcePathId` is changed to `ex:path-chemometrics-mean-values-lecture` is accepted by the generic loader;
- exactly-one-SceneDocument cardinality remains enforced;
- the existing Standard Deviation fixture tests remain unchanged and continue to exercise backwards compatibility.

## Boundaries preserved

No changes were made to:

- Chemometrics scientific TriG/content;
- `.agents/workflows/chemometrics/state.json`;
- ontology or SHACL semantics;
- learner state;
- renderer-neutral `SceneDocument 1.0`;
- KeyPoint semantic contracts introduced by #133;
- `apps/pitch/package.json` or the separate `npm run pitch:dev` selected-runtime overwrite behavior.

That dev-start overwrite remains a separate follow-on concern and is not part of Issue #132.

## Validation / manager gates

The worker environment did not provide an executable repository checkout, so no local test-success claim is made. The focused regressions are committed and PR #135 must receive fresh exact-head `agent-validator/project-chemie-digital` success before manager acceptance.

Manager review should additionally verify:

1. final PR diff remains bounded to the two production fixes, focused regressions, this handoff and System workflow state;
2. #133 list fallback remains unchanged in substance;
3. no Chemometrics state/content or ontology/SHACL changes entered the PR;
4. review/thread state and mergeability are clean;
5. Ready-for-review/external review policy is satisfied before merge.

The worker does not self-accept or merge.
