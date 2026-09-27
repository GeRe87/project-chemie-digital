# Issue #160 worker handoff — Chemometrics Introduction vertical slice

## Role

`Semantic Web and Ontology Engineer / Chemometrics Content Worker`

## Issue

`#160 — Add Chemometrics Introduction unit with lecturer, tutorial and course roadmap`

Branch: `agent/160-chemometrics-introduction`

## Completed

- Added a real first Chemometrics LearningUnit:
  - `ex:learning-unit-chemometrics-introduction`
  - label `Introduction`@en
  - placement `ex:unit-placement-chemometrics-introduction`
- Shifted only the existing Chemometrics placement positions:
  - 10 Introduction
  - 20 Random Variables
  - 30 Mean Values
  - 40 Variance and Dispersion
- Added exactly five course-orientation focus concepts:
  - Course Overview
  - About the Lecturer
  - Lecture and Tutorial
  - Course Roadmap
  - Introduction Round
- Added the manager-approved authored Introduction resources:
  - overview interpretation;
  - lecturer Attribution plus lecturer-context interpretation;
  - four-entry Lecture/Tutorial DefinitionList;
  - six-entry course-roadmap DefinitionList;
  - Introduction Round Exercise.
- Added five minimal `cd:Definition` resources because the existing generic `cd:ConceptShape` requires every Concept to carry at least one `cd:hasDefinition`. This is contract conformance only; no ontology/SHACL term was added or changed.
- Added `ex:path-chemometrics-introduction` with exactly five contiguous PathSteps.
- Bound every PathStep to exactly one graph-backed Introduction Scene.
- Added exactly five SceneDefinitions using only existing generic roles:
  - StatementRole
  - AttributionRole
  - DefinitionListRole
  - ExerciseRole
  - HeadingRole
- Added focused regressions for course order, focus concepts, exact authored bodies/lists, path/resource/scene matrix, runtime course composition, runtime generic block kinds, course-path selection, existing subject-path compatibility and full canonical SHACL.
- Updated the existing course-skeleton regression only where the new first unit/order and fourth path make previous expectations stale.

## Authored content boundary

The repository migration inventory proves that the legacy source set contained `chemometricsCourseIntro.md` and classifies it as course introduction, lecturer/context, schedule and introduction-round material.

The original Markdown source is not available in the current repository/library context. Therefore this increment does **not** claim verbatim recovery.

The visible Introduction prose is deliberate new course authorship. It does not invent:
- dates;
- rooms;
- tutorial frequency;
- attendance rules;
- examination rules;
- mandatory software.

The course roadmap is derived from the existing repository migration inventory. The known legacy timetable entry `Non-linear Regression` is intentionally not represented as migrated/available roadmap content because the inventory explicitly records that no corresponding source Markdown was supplied.

## Exact course order

```text
10  Introduction
20  Random Variables
30  Mean Values
40  Variance and Dispersion
```

Existing LearningUnit and UnitPlacement IRIs remain stable.

## Exact five-step Introduction path

1. Course Overview
   - `ex:chemometrics-course-overview-note`
   - scene `ex:scene-chemometrics-introduction-overview`
2. About the Lecturer
   - `ex:attribution-chemometrics-gerrit-renner`
   - `ex:chemometrics-lecturer-context-note`
   - scene `ex:scene-chemometrics-introduction-lecturer`
3. Lecture and Tutorial
   - `ex:chemometrics-course-format-list`
   - scene `ex:scene-chemometrics-introduction-format`
4. Course Roadmap
   - `ex:chemometrics-course-roadmap-list`
   - scene `ex:scene-chemometrics-introduction-roadmap`
5. Introduction Round
   - `ex:exercise-chemometrics-introduction-round`
   - scene `ex:scene-chemometrics-introduction-round`

## Static audit

Current branch evidence before handoff:

- 5 Introduction Concepts
- 5 required Concept Definitions
- 2 DefinitionLists
- 10 contiguous DefinitionListEntries (4 course-format + 6 roadmap)
- 1 Attribution
- 1 Exercise
- 1 LearningPath
- 5 PathSteps
- 5 `cd:usesScene` bindings
- 5 SceneDefinitions
- 11 SceneItems
- roles: 5 Heading / 2 Statement / 1 Attribution / 2 DefinitionList / 1 Exercise
- Chemometrics placement positions: 10 / 20 / 30 / 40
- System lane remained idle and untouched

## Files changed

- `ontology/dataset/course-scale.trig`
- `ontology/dataset/chemometrics-introduction.trig` — new
- `ontology/dataset/chemometrics-introduction-path.trig` — new
- `ontology/dataset/chemometrics-introduction-scenes.trig` — new
- `tests/test_chemometrics_course_skeleton.py`
- `tests/test_chemometrics_introduction.py` — new
- `.agents/handoffs/issue-160-chemometrics-introduction.md`
- `.agents/workflows/chemometrics/state.json`

Explicitly unchanged:
- all existing scientific Chemometrics resource bodies;
- existing Random Variables / Mean Values / Variance-and-Dispersion path and scene TriG;
- ontology vocabulary;
- SHACL vocabulary/contracts;
- runtime/compiler;
- renderer/apps/packages;
- System state;
- learner state;
- validator configuration.

## Verification

- [ ] Repository-local focused tests — not executable by this GitHub connector worker.
- [ ] Full exact-head external validator — pending.
- [x] Static semantic structure audit.
- [x] Existing-contract audit: all required primitives already exist.
- [x] Runtime contract audit against `generate_canonical_runtime.py`:
  - HeadingRole -> prose/introduce
  - StatementRole -> prose/explain
  - AttributionRole -> prose/emphasize
  - DefinitionListRole -> definition-list
  - ExerciseRole -> free-text prompt/practice
- [x] Cross-track audit: no System mutation.

Recommended focused local command:

```powershell
python -m unittest `
  tests.test_chemometrics_introduction `
  tests.test_chemometrics_course_skeleton `
  tests.test_chemometrics_random_variables_path `
  tests.test_chemometrics_mean_values_path `
  tests.test_chemometrics_variance_dispersion_path `
  -v
```

Authoritative gate remains fresh exact-head:

`agent-validator/project-chemie-digital = success`

## Deferred System concern

This content increment makes the Introduction fully selectable and renderable through the existing canonical runtime.

It intentionally does **not** change:
- the default `apps/pitch` Chemometrics selection, which currently targets Mean Values;
- whole-course unit navigation;
- application-level default/current-unit state.

Those are System/application-shell responsibilities and should be handled separately after this content PR is accepted.

## Recommended manager action

`review` — verify exact authored wording, 10/20/30/40 course composition, five-concept/five-step/five-scene scope, generic role usage, absence of unverified schedule/exam claims, unchanged scientific content and fresh exact-head validation before acceptance.
