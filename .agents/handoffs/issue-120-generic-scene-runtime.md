# Agent handoff

## Role

`Backend and Data Integration Engineer`

## Issue

`#120 — Project generic graph-backed scene roles into SceneDocument 1.0`

## Completed

- Extended the existing `compile_scene_document()` graph-backed projection without changing `SceneDocument 1.0`.
- Added exact selector resolution for `HeadingRole` with both `skos:prefLabel@de` and `skos:prefLabel@en`.
- English heading selection now reads the exact English `skos:prefLabel`; it never falls back through the broad `resource_text()` helper to German or another predicate.
- Added direct `cd:body` projection for the three roles activated by System Issue #118:
  - `StatementRole` + `Definition` -> `prose` / `explain`;
  - `StatementRole` + `Interpretation` -> `prose` / `explain`;
  - `ExampleRole` + `WorkedExample` -> `prose` / `explain`;
  - `ExerciseRole` + `Exercise` -> `prompt` / `practice` / `free-text` with exact static fallback.
- Preserved source traceability for all new blocks, including the selected resource identity, provenance graph ids and the authored `relationPath`.
- Added focused synthetic/in-memory runtime regressions in `tests/test_generic_scene_runtime.py`; no canonical Chemometrics scene or content statement is introduced.

## Projection matrix

| SceneItem role | Required selected resource | Required selector | SceneDocument 1.0 block |
| --- | --- | --- | --- |
| `HeadingRole` | current scene `focusConcept` | `skos:prefLabel@de` | existing `prose` / `introduce`, exact German label |
| `HeadingRole` | current scene `focusConcept` | `skos:prefLabel@en` | existing `prose` / `introduce`, exact English label |
| `StatementRole` | `Definition` | `cd:body` | `prose` / `explain` |
| `StatementRole` | `Interpretation` | `cd:body` | `prose` / `explain` |
| `ExampleRole` | `WorkedExample` | `cd:body` | `prose` / `explain` |
| `ExerciseRole` | `Exercise` | `cd:body` | `prompt` / `practice` / `free-text`; fallback equals the complete prompt |

All prior MathExpression, CodeExample, AudiencePoll, QuotationRole and CitationRole projection branches remain in place and are not semantically redesigned by this issue.

## Exact direct-selection behavior

A new small `selected_literal()` helper resolves only the requested RDF predicate and optional requested language. It does not inspect alternative audience-visible predicates.

- For `skos:prefLabel@de` / `@en`, the language is derived from the selector itself.
- If `cd:language` is explicitly present on a heading item, it must agree with the selector language.
- For `cd:body`, an explicit item language selects only that language.
- Without an explicit body language, the requested predicate must still resolve to one unambiguous literal.
- Missing direct values fail instead of falling back to `skos:prefLabel`, `dct:title`, descriptions, formulas or other predicates.
- Ambiguous direct values fail through the existing deterministic literal cardinality boundary.

## Fail-closed coverage

Focused tests cover rejection of:

- English heading with no English label even when a German label exists;
- heading language inconsistent with its selector;
- unsupported heading selector;
- `StatementRole` selecting a resource other than `Definition` or `Interpretation`;
- `ExampleRole` selecting a non-`WorkedExample` resource;
- `ExerciseRole` selecting a non-`Exercise` resource;
- generic roles using a selector other than direct `cd:body`;
- missing `cd:body` even when another human-readable label exists;
- multiple directly selected body values in the requested language;
- multiple body-language values when no item language disambiguates them.

## Files changed

- `scripts/generate_canonical_runtime.py`
- `tests/test_generic_scene_runtime.py`
- `.agents/handoffs/issue-120-generic-scene-runtime.md`

## Explicitly unchanged

- `ontology/dataset/*.trig`, including SHACL and all canonical content;
- Chemometrics `SceneDefinition`, `SceneItem`, LearningPath and `cd:usesScene` statements;
- `packages/core` and the `SceneDocument 1.0` TypeScript contract;
- Reveal.js, self-study, D3, React/application/navigation surfaces;
- TeachingOffering/course/path selection contracts;
- learner-state;
- workflow governance/configuration and validator configuration.

## Compatibility evidence

- The implementation is additive at the role boundary: existing Standardabweichung HeadingRole (`skos:prefLabel@de`), MathExpression, CodeExample, AudiencePoll, QuotationRole and CitationRole branches remain intact.
- The branch is based on the System worker-claim commit on current `main`; before PR creation the feature diff is zero commits behind `main`.
- Existing generated Standardabweichung RDF/scene files are not edited.
- Generic runtime tests use a synthetic one-step LearningPath with a heading first, preserving the existing accessibility-label mechanism without redesigning accessibility.

## Verification

- [x] Scope review: only compiler, focused runtime tests and this handoff are changed.
- [x] Fail-closed review: exact selector/language and role/resource matching are explicit.
- [x] Source-traceability review: new blocks retain resource id, provenance and relation path.
- [x] SceneDocument boundary review: no block kind, field or version was added.
- [x] Chemometrics/content boundary review: no canonical Chemometrics scene/path/content statement was authored.
- [ ] Local `npm test`: not executed in the connector worker because the execution container cannot resolve the GitHub repository mirror. The repository exact-head external validator is required and is authoritative for acceptance.
- [ ] Fresh exact-head `agent-validator/project-chemie-digital`: required after the Draft PR is opened.

## Remaining dependency

This issue completes the second shared System prerequisite identified by the blocked Chemometrics workflow. The worker does not unblock or modify that workflow. After this PR is accepted and merged, a separate Chemometrics manager turn should re-read current `main`, re-evaluate the cross-track blocker, and only then assign the five Random Variables scene/`PathStep -> cd:usesScene` authoring increment if integration evidence remains clean.

## Recommended manager action

Review the exact three-file runtime-only scope after fresh exact-head validator success. Confirm existing Standardabweichung behavior remains green, verify the new projection/failure matrix, and merge only through the configured manager-only gate. Do not unblock Chemometrics before this System increment is integrated.
