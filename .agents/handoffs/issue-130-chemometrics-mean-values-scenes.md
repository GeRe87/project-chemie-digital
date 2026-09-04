# Agent handoff

## Role

`Semantic Web and Ontology Engineer`

## Issue

`#130 — Author eight graph-backed Chemometrics Mean Values scenes`

## Branch

`agent/130-chemometrics-mean-values-scenes`

## Scope completed

Authored the graph-backed scene layer for the existing eight-step Chemometrics Mean Values lecture path. The implementation adds exactly eight `cd:SceneDefinition` resources in one dedicated scene graph and binds each existing PathStep to exactly one scene with additive `cd:usesScene`.

All scientific resources are reused from the reviewed Chemometrics basics content graph without rewriting definitions, formulas, interpretations, examples, exercises, provenance, vocabulary or authored-resource evidence. No System workflow state, shared SHACL/runtime contract, renderer/application/package code, learner-state, workflow governance, validator configuration or external research was changed.

## Canonical scene graph

File:

`ontology/dataset/chemometrics-mean-values-scenes.trig`

Named graph:

`https://w3id.org/project-chemie-digital/graph/scenes/chemometrics-mean-values-lecture`

The graph authors only `cd:SceneDefinition` and `cd:SceneItem` typed identities plus scene metadata. It contains no scientific `cd:body` or `cd:latex` literals and no `cd:presentationPattern`.

## Exact scene identities and bindings

1. `ex:path-step-chemometrics-mean-values-arithmetic-mean` -> `ex:scene-chemometrics-mean-values-arithmetic-mean`
2. `ex:path-step-chemometrics-mean-values-expected-value` -> `ex:scene-chemometrics-mean-values-expected-value`
3. `ex:path-step-chemometrics-mean-values-law-of-large-numbers` -> `ex:scene-chemometrics-mean-values-law-of-large-numbers`
4. `ex:path-step-chemometrics-mean-values-geometric-mean` -> `ex:scene-chemometrics-mean-values-geometric-mean`
5. `ex:path-step-chemometrics-mean-values-geometric-practice` -> `ex:scene-chemometrics-mean-values-geometric-practice`
6. `ex:path-step-chemometrics-mean-values-harmonic-mean` -> `ex:scene-chemometrics-mean-values-harmonic-mean`
7. `ex:path-step-chemometrics-mean-values-median` -> `ex:scene-chemometrics-mean-values-median`
8. `ex:path-step-chemometrics-mean-values-median-practice` -> `ex:scene-chemometrics-mean-values-median-practice`

All existing Issue #126 `cd:position` and `cd:usesResource` values are retained byte-for-byte except for the eight additive `cd:usesScene` statements.

## Formula semantics

Every selected `cd:MathExpression` uses the merged explicit formula contract:

- `cd:communicativeRole cd:FormulaRole`
- `cd:selectionPath "cd:latex"`

This applies to:

- `ex:arithmetic-mean-formula`
- `ex:discrete-expected-value-formula`
- `ex:geometric-mean-product-formula`
- `ex:geometric-mean-log-formula`
- `ex:harmonic-mean-formula`
- `ex:sample-median-formula`

No `QuotationRole`, `StatementRole` or `cd:hasDefinition` workaround is used for formula resources.

## Scene composition

Each SceneDefinition has one focus Concept, `cd:authoredResource true`, and a deterministic ordered item list. Every SceneItem has a unique positive position, explicit language `"en"`, and `cd:authoredResource true`.

- Arithmetic Mean: heading, formula, interpretation.
- Expected Value: heading, definition, formula, interpretation.
- Law of Large Numbers: heading, definition, interpretation.
- Geometric Mean: heading, definition, product formula, log formula, interpretation, worked example.
- Geometric Practice: heading, exercise.
- Harmonic Mean: heading, worked example, definition, formula, interpretation.
- Median: heading, worked example, definition, formula, interpretation.
- Median Practice: heading, exercise.

## Files changed

Feature diff against current `main` before this handoff contains exactly:

- `ontology/dataset/chemometrics-mean-values-scenes.trig`
- `ontology/dataset/chemometrics-mean-values-path.trig`
- `tests/test_chemometrics_mean_values_scenes.py`
- `tests/test_chemometrics_mean_values_path.py`
- `tests/test_rdf_dataset.py`

This handoff is the sixth intended feature file.

Workflow state files were reconciled byte-for-byte with current `main` and are not part of the feature diff.

## Regression coverage

`tests/test_chemometrics_mean_values_scenes.py` verifies:

- exactly eight scene identities in the dedicated graph;
- exact focus Concepts and stable SceneItem/resource/role/selector/language/position matrix;
- every formula uses `FormulaRole + cd:latex` and selects an existing `cd:MathExpression`;
- selected resources retain authored-resource evidence;
- the scene graph authors no scientific `cd:body`/`cd:latex` content and no presentation pattern;
- complete canonical SHACL conformance;
- runtime compilation of the Mean Values path produces exactly eight ordered scenes;
- formula blocks preserve canonical LaTeX expressions and `relationPath: cd:latex`;
- Heading/Statement/Example/Exercise projections retain their existing block kinds;
- Random Variables runtime compilation remains compatible;
- Standard Deviation `ex:scene4-i2` retains explicit FormulaRole/cd:latex semantics.

`tests/test_chemometrics_mean_values_path.py` preserves the complete Issue #126 path/topic/position/resource assertions and replaces only the previous scene-free assertion with the exact eight one-to-one scene bindings while retaining the no-SceneDefinition/no-SceneItem path-graph boundary.

`tests/test_rdf_dataset.py` adds only the Mean Values scene graph IRI to the canonical graph whitelist.

## Verification state

- [x] Branch reconciled with current `main`; comparison is zero commits behind.
- [x] Feature diff before handoff is exactly five bounded files and contains no workflow-state, scientific-content, System-contract, runtime/compiler or app changes.
- [x] Focused RDF/SHACL/runtime regression coverage authored.
- [ ] `npm test`: authoritative execution is delegated to the configured exact-head validator because the GitHub connector worker has no repository execution environment.
- [ ] Fresh exact-head `agent-validator/project-chemie-digital = success` is required before manager acceptance.

If validation exposes a stale shared regression outside the declared Issue #130 scope, return it to the Manager for separate authorization rather than broadening the worker issue.

## Manager review requested

Review the exact bounded scene/path/test/handoff diff, fresh exact-head validator result, review/thread state, mergeability and integration freshness. Do not accept or merge until every configured gate passes and the PR is externally Ready for review.
