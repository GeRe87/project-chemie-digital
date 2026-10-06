# Issue #209 — Variables and Constants knowledge resource

## Scope

This turn deliberately stops at the scientific/knowledge-resource layer. The existing five-step Random Variables LearningPath and its five scenes are unchanged so the next turn can redesign presentation sequencing against an accepted resource graph.

## Chapter identity

The existing stable LearningUnit IRI `ex:learning-unit-random-variables` is retained but its authored label is now **Variables and Constants**.

Its focus set is now exactly:
- variable
- independent variable
- dependent variable
- constant
- random variable
- discrete random variable
- continuous random variable
- sample
- distribution

## New concepts and relations

- `ex:variable` — generic within-scope data/experiment variable
- `ex:independent-variable` — explanatory/predictor role; manipulated in designed experiments or observed/selected in observational studies
- `ex:dependent-variable` — response/outcome role
- `ex:constant` — within-scope fixed quantity/setting
- `ex:distribution` — intentionally minimal future anchor

Independent and dependent variables are both `skos:broader ex:variable`, reciprocally `cd:contrastsWith`, and joined by an explicit Comparison. Their shared interpretation states that these are study/model roles: “independent” does not mean statistical independence and does not by itself establish causality.

Variable and constant are reciprocal `cd:contrastsWith` concepts and are joined by `ex:variable-constant-comparison`. A separate interpretation records the crucial scope dependency: the same physical quantity can be constant in one experiment and variable in another.

The existing `ex:random-variable` is now `skos:broader ex:variable` and related to Distribution.

## Examples and exercises

Exactly three shared WorkedExamples now identify independent, dependent and constant roles:
1. UV/Vis calibration: concentration → independent; absorbance → dependent; 540 nm → constant
2. chromatographic calibration: standard concentration → independent; peak area → dependent; nominal injection volume → constant
3. environmental comparison: sampling site → independent/explanatory grouping role; nitrate concentration → dependent response; nominal aliquot → constant, with an explicit observational/non-causal caveat

The executable R exercise is now a small calibration experiment: concentration is the independent variable, wavelength is constant at 540 nm, and absorbance is the dependent response with random measurement variation. Its CodeExample semantically `cd:showsResource` variable, independent variable, dependent variable, constant, sample and distribution.

Exactly three separate classification Exercises ask Variable vs Constant and each has one ExpectedResult.

## Sample and Distribution

The canonical existing `ex:sample` identity is reused, not duplicated. A new interpretation states that a sample contains observations and a variable defines a characteristic recorded for each observation; observed values can be summarized by an empirical distribution.

The new Distribution concept is intentionally shallow and says detailed theory comes later.

## Explicitly deferred

- no PathStep changes
- no SceneDefinition/SceneItem changes
- no renderer changes
- no new ontology property
- no IRI rename of the existing LearningUnit or Random Variables path

## Verification

```powershell
python -m unittest tests.test_chemometrics_variables_constants_content -v
python -m unittest tests.test_chemometrics_basics_content tests.test_chemometrics_course_skeleton -v
npm run check:semantics
```
