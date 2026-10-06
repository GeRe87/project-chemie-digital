# Issue #212 — Region 2 Level 1: Variables and Constants

The stable LearningPath IRI `ex:path-chemometrics-random-variables-lecture` is retained for compatibility, but its authored label, topics, PathSteps and SceneDefinitions now implement **Variables and Constants**.

## 14 scenes

1. Variables and Constants — scope
2. Variable
3. Constant
4. Independent and Dependent Variables
5. three analytical examples
6. semantic calibration Exercise + executable R CodeExample
7. Sample ↔ Variable
8. Distribution future anchor
9. Random Variable bridge
10. Discrete Random Variable
11. Continuous Random Variable
12. classify concentration
13. classify wavelength
14. classify temperature

The Level Complete buffer remains application-owned and follows scene 14 automatically.

Two umbrella Concepts provide graph-backed scene headings. Three AudiencePoll resources project the accepted classification Exercises into single-choice prompts with shared Variable / Constant PollOptions and the same ExpectedResult resources.

The dynamic experiment contains no scene-authored code: the SceneItem selects the accepted #209 CodeExample via CodeRole.

## Verify

```powershell
npm run check:semantics
python -m unittest tests.test_chemometrics_variables_constants_content tests.test_chemometrics_random_variables_path tests.test_chemometrics_random_variables_scenes -v
python -m unittest tests.test_learning_path_topic_semantics tests.test_formula_scene_semantics tests.test_chemometrics_mean_values_path tests.test_chemometrics_mean_values_scenes tests.test_chemometrics_variance_dispersion_path -v
npm run test:pitch
npm run pitch:intro
```

Browser target: Overworld → Level 1 Variables and Constants → 14 authored scenes → Level 1 Complete → Overworld.


## Focused test repair

Owner-local tests exposed a wording-only regression in `ex:variable-constant-comparison`: the text started with capitalized plural “Variables”, while the content contract intentionally checks that the explicit singular semantic terms `variable` and `constant` occur in the comparison prose. The sentence now reads “A variable …; a constant …”. No graph topology or presentation structure changed.
