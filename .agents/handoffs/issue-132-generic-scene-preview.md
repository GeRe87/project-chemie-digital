# Issue #132 handoff — generic SceneDocument preview and free-text prompt fallback

## Worker scope

System-owned Runtime/Application Engineer turn for Issue #132. The existing historical branch implementation was first rebased/reset onto the current `main` assigned by the manager, so the final diff is based on merged Issue #133 rather than the pre-KeyPoint September 4 snapshot. The final mini-fix turn also incorporated current `main` ancestry through `2cb298bc9a479bbc7450d74aaa48a9c7a6ede818` before changing code.

PR: #135 — `Fix generic SceneDocument preview and free-text fallback`
Branch: `agent/132-generic-scene-preview`

## Implemented

### 1. Response-mode-aware static prompt fallback

`scripts/generate_canonical_runtime.py` now branches `prompt` fallback rendering by `responseMode`:

- `responseMode` is obtained through a guarded lookup; if it is missing, fallback generation raises `ValueError("Prompt block requires responseMode")` instead of leaking `KeyError`;
- `single-choice` retains the existing `poll-fallback`, `data-poll-key`, `data-poll-option-ids`, option list and source/provenance behavior;
- `single-choice` fails closed with a clear `ValueError` before rendering when `options` is missing or empty, without changing the SceneDocument contract;
- `free-text` emits a `prompt-fallback` containing the authored prompt and source/provenance without accessing or requiring `options`;
- any unsupported response mode raises `ValueError` and therefore fails closed.

The merged #133 `list` fallback remains immediately before the prompt branch and is unchanged, including stable `data-list-item-id` identity and per-item source/provenance.

### 2. Generic single-SceneDocument pitch loading

`apps/pitch/src/graph-scene-data.ts` exposes a small `compilePitchSceneDocumentsFromArtifact()` boundary used by the normal `compilePitchSceneDocuments()` path.

The loader still enforces:

- runtime artifact version `1.0`;
- `sha256:` Dataset fingerprint presence;
- exactly one SceneDocument;
- non-missing document;
- `validateSceneDocument()`.

`CanonicalRuntimeArtifact.artifactVersion` is typed as `string` rather than the literal `"1.0"`, so the explicit version guard remains meaningful for arbitrary candidate artifacts. This addresses the accepted Copilot review finding without changing `SceneDocument 1.0`.

The loader no longer requires the document's `sourcePathId` to equal `ex:path-standard-deviation`. `STANDARD_DEVIATION_PATH_ID` remains only as the historical fixture identity used by existing Standard Deviation regression assertions; it is not a loader gate.

## Regression coverage

### Python

`tests/test_prompt_static_fallback.py` covers:

- actual Chemometrics Mean Values selection through `CourseUnitPathSelectionRequest`, confirming eight scenes and a generated `prompt-fallback` without the previous `KeyError: 'options'`;
- isolated free-text prompt fallback without an `options` field;
- unchanged valid single-choice poll fallback metadata/options;
- missing and empty single-choice `options` fail closed with the intended `ValueError`;
- a prompt missing `responseMode` fails closed with `ValueError("Prompt block requires responseMode")`;
- fail-closed unsupported prompt response modes;
- preservation of the #133 KeyPoint list fallback and stable list-item identity.

### Pitch / TypeScript

`apps/pitch/test/preview.test.ts` covers that:

- a valid single SceneDocument whose `sourcePathId` is changed to `ex:path-chemometrics-mean-values-lecture` is accepted by the generic loader;
- exactly-one-SceneDocument cardinality remains enforced;
- a candidate artifact with `artifactVersion: "2.0"` is rejected at runtime;
- the existing Standard Deviation fixture tests remain unchanged and continue to exercise backwards compatibility.

## Review resolution

Three bounded Copilot findings were accepted by the manager across the Ready-for-review reviews and addressed without broadening Issue #132:

1. missing/empty single-choice `options` now fail closed before rendering;
2. runtime artifact version typing no longer makes the explicit version guard type-level dead code;
3. missing prompt `responseMode` now fails closed with a clear `ValueError` rather than leaking `KeyError`.

All three inline review threads have been replied to with the implemented fix/regression and resolved. A fresh exact-head validator result and a clean external re-review on the final worker-completion head remain required before manager merge.

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

The worker environment does not provide an executable repository checkout, so no local test-success claim is made. The focused regressions are committed and PR #135 must receive fresh exact-head `agent-validator/project-chemie-digital` success after the final workflow-state commit before manager acceptance.

Manager review should additionally verify:

1. final PR diff remains bounded to the existing six files: two production files, two focused regression-test files, this handoff and System workflow state;
2. all three accepted Copilot review findings remain resolved and external re-review reports no new blockers;
3. #133 list fallback remains unchanged in substance;
4. no Chemometrics state/content or ontology/SHACL changes entered the PR;
5. mergeability and integration freshness remain clean.

The worker does not self-accept or merge.
