# Agent handoff

## Role

`Semantic Web and Ontology Engineer`

## Issue

`#143 — Bootstrap CogniFlow presentation with a graph-backed title scene`

## Completed

- Added the minimal reusable `cd:Attribution` LearningResource subtype and `cd:AttributionRole` communicative role without changing SceneDocument 1.0.
- Added SHACL constraints requiring authored language-tagged attribution bodies and strict `AttributionRole` + `cd:body` + `Attribution` coupling.
- Added an isolated graph-backed CogniFlow presentation skeleton with one TeachingOffering, one LearningUnit, one UnitPlacement, one topic Concept with minimal Definition, one English LearningPath, one PathStep and exactly one SceneDefinition.
- Authored the requested visible title exactly as `Standardized Data Processing - Project CogniFlow` and the two source-linked attribution lines exactly as `Gerrit Renner — Instrumental Analytical Chemistry, University of Duisburg-Essen` and `Ricardo Cunha — IUTA`.
- Extended the canonical runtime compiler so AttributionRole compiles to an ordinary source-linked supporting prose block while retaining the RDF attribution identity and exact `cd:body` relation path.
- Added a source-path-selected CogniFlow presentation profile with Reveal scroll view and no default background; existing Chemometrics profile/default behavior remains unchanged.
- Added `generate:cogniflow` and `dev:cogniflow` Pitch scripts. The existing default `dev` command remains Chemometrics.
- Added focused Python regressions for canonical selection, effective English language, exact one-scene output, exact title/author strings, provenance/relation paths, static fallback, SHACL conformance and malformed attribution coupling.
- Extended the existing exact SceneItem role allow-list regression by the one new additive AttributionRole and added presentation-profile tests for CogniFlow/Chemometrics source-path resolution.

## Files or resources changed

- `ontology/dataset/concepts.trig`
- `ontology/dataset/shapes.trig`
- `ontology/dataset/cogniflow-presentation.trig`
- `scripts/generate_canonical_runtime.py`
- `tests/test_cogniflow_title_scene.py`
- `tests/test_formula_scene_semantics.py`
- `apps/pitch/package.json`
- `apps/pitch/src/presentation-profile.ts`
- `apps/pitch/src/main.ts`
- `apps/pitch/test/presentation-profile.test.ts`
- `.agents/handoffs/issue-143-cogniflow-title-scene.md`
- `.agents/workflows/system/state.json` (workflow lifecycle only)

## Verification

- [ ] Automated tests — not executed in the worker environment because no local repository checkout/runtime is available; the configured exact-head `agent-validator/project-chemie-digital` must run `npm test` on the final PR head.
- [ ] Semantic validation — covered by focused `validate_semantics`/SHACL regressions but not executed locally for the same environment reason; exact-head validator evidence remains required.
- [ ] Manual browser check — not yet performed. After checkout, run `npm --workspace @project-chemie-digital/pitch run dev:cogniflow` and verify the single title scene.
- [x] Accessibility check — the title remains the graph-backed HeadingRole and therefore supplies the scene heading/accessibility label; attribution text is plain source-linked text. No images or background media were introduced. Browser-level visual/a11y confirmation remains part of the manual check.
- [x] Documentation updated — this structured handoff records the new identities, runtime behavior and direct start command.

## Decisions and assumptions

- The initial presentation language is English because all user-requested visible content is English.
- A reusable Attribution primitive is preferable to misusing Interpretation, Source, Quotation or Citation semantics. This issue intentionally does not introduce Person/Organization/affiliation modeling.
- `cd:AttributionRole` compiles to existing SceneDocument `prose` with `emphasis: supporting` and `intent: emphasize`; this keeps SceneDocument 1.0 unchanged. The current Pitch HTML adapter maps generic emphasized prose through its existing non-introduce/non-explain prose branch; no renderer contract or layout change was made in this semantic worker turn.
- CogniFlow profile selection derives from the compiled `sourcePathId` (`ex:path-cogniflow-standardized-data-processing`), so the presentation cannot silently inherit the Chemometrics neon background. The profile defaults to `scroll` and no background.
- The existing default Pitch dev command remains Chemometrics for backward compatibility. CogniFlow is started explicitly with `dev:cogniflow`.
- `scripts/rdf_dataset.py` discovers canonical `ontology/dataset/*.trig` files dynamically; no graph whitelist update is required.

## Risks or unresolved questions

- Manual browser appearance is intentionally still a placeholder. No CogniFlow-specific title layout, logo, typography or background was added.
- The generic Pitch prose adapter currently uses HTML element choice based on didactic intent rather than the original communicative role. The RDF/runtime attribution semantics remain distinct and source-linked, but a future renderer-focused issue may choose dedicated visual treatment for attribution prose if desired.
- Exact-head validator evidence is pending and remains mandatory before manager acceptance.

## Recommended manager action

`review` — verify the bounded semantic/runtime/profile scope, require fresh exact-head validator success and configured external review, then request a manual CogniFlow browser check before or during presentation-design follow-up if visual acceptance is needed.
