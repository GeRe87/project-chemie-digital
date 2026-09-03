# Agent handoff

## Role

Backend and Data Integration Engineer

## Issue

`#128 — Activate explicit formula scene semantics and runtime projection`

## Completed

- Activated the already-defined `cd:FormulaRole` as a valid central `cd:SceneItem` communicative role.
- Added direct `"cd:latex"` selection to the existing closed SceneItem selector allow-list without adding vocabulary terms or changing `SceneDocument 1.0`.
- Migrated only the historical Standard Deviation formula item `ex:scene4-i2` from `QuotationRole` / `cd:hasDefinition` to `FormulaRole` / `cd:latex` while preserving position `2`, `ex:sample-sd-formula`, language `de` and authored-resource evidence.
- Changed graph-backed runtime compilation so a selected `cd:MathExpression` compiles only through the exact `FormulaRole` + `cd:latex` coupling.
- Preserved the existing renderer-neutral math block shape, canonical LaTeX expression, resource/provenance traceability, spoken alternative, disclosure, emphasis and `explain` intent.
- Made historical or malformed `MathExpression` role/selector combinations fail closed instead of compiling opportunistically by resource type.
- Made `FormulaRole` fail closed for a non-`MathExpression` resource or a non-`cd:latex` selector.
- Preserved Heading, Statement, Example, Exercise, Code, Poll, Quotation and Citation runtime branches unchanged.
- Added focused regressions for the exact SHACL allow-lists, canonical Standard Deviation metadata migration, canonical SHACL conformance, Standard Deviation math compatibility, valid formula compilation, all required negative formula couplings and existing Random Variables scene compilation.

## Files or resources changed

- `ontology/dataset/shapes.trig`
  - add existing `cd:FormulaRole` to the SceneItem role allow-list;
  - add direct `"cd:latex"` to the selector allow-list.
- `ontology/dataset/standard-deviation.trig`
  - migrate only `ex:scene4-i2` role and selector metadata.
- `scripts/generate_canonical_runtime.py`
  - enforce explicit FormulaRole/MathExpression/cd:latex coupling before generic role projection.
- `tests/test_canonical_runtime_path_resolution.py`
  - update the canonical formula source relation path to `cd:latex` while retaining the same math expression/output assertions.
- `tests/test_standard_deviation_knowledge.py`
  - admit the explicit Standard Deviation FormulaRole/cd:latex pair and assert the exact `ex:scene4-i2` compatibility migration.
- `tests/test_formula_scene_semantics.py`
  - add isolated formula-scene semantic/runtime regression fixtures and Random Variables compatibility coverage.
- `.agents/handoffs/issue-128-formula-scene-semantics.md`
  - this handoff.

## Verification

- [x] Branch diff inspected against `main`: before this handoff it contained exactly the six expected semantic/runtime/test files, was `0` commits behind `main`, and had no app/package/Chemometrics/workflow-governance changes.
- [x] Focused regression coverage authored for all Issue #128 required positive and negative formula cases.
- [x] Complete canonical SHACL conformance is asserted by the new focused regression using the repository validator boundary.
- [x] Existing Random Variables graph-backed compilation compatibility is asserted by the new focused regression.
- [ ] `npm test` execution: not claimable from this connector-only worker environment; authoritative execution must come from the configured exact-head local validator.
- [ ] `agent-validator/project-chemie-digital = success` on the final Draft PR head: required before manager acceptance and must be checked after PR creation.
- [ ] Browser check: not required by Issue #128 because no renderer/application behavior is changed; any unexpected direct renderer compatibility break must be reported rather than broadening this issue.

## Decisions and assumptions

- `cd:FormulaRole`, `cd:MathExpression` and `cd:latex` already exist in repository vocabulary, so no ontology vocabulary identity was created or edited.
- Formula semantics are enforced by both authored SceneItem metadata and runtime role/type/selector coupling; selected resource type alone is no longer sufficient to produce a math block.
- `cd:latex` is transported as the formula block source `relationPath`, replacing only the historical metadata path `cd:hasDefinition` for `ex:scene4-i2`.
- The underlying `ex:sample-sd-formula` scientific resource and its LaTeX literal are unchanged.
- Generated runtime JSON remains disposable and ignored. No generated application artifact or renderer source was added to this worker scope.
- No external research was performed.
- The Chemometrics workflow/state and Mean Values content were not modified.

## Risks or unresolved questions

- The sole remaining acceptance evidence is repository-wide exact-head validation. If the validator reveals a failure outside the declared scope, return it to the manager for classification rather than expanding this worker issue silently.
- Chemometrics Mean Values scene authoring remains blocked until Issue #128 is independently reviewed and merged. The later content issue should use `FormulaRole` + `cd:latex` for reviewed `MathExpression` resources and must not reproduce the historical QuotationRole workaround.

## Recommended manager action

`review`

After the Draft PR receives fresh exact-head `agent-validator/project-chemie-digital = success`, verify the bounded diff, review/thread state, mergeability and integration freshness. If all gates pass, accept and squash-merge Issue #128; only then may a separate Chemometrics manager turn unblock and assign the eight Mean Values scenes.
