# Chemometrics Level 4 — first interactive teaching slice

**Local authoring update:** The new opening review adds three comparison scenes before the retained material and moves the QC-extreme comparison to the robustness section. The active local path now has 19 scenes, but only the first three are included in the review preview. Subsequent selections remain provisional. See [opening review](chemometrics-level4-opening-review.md); the 15-scene description below and [iteration A](chemometrics-level4-iteration-a.md) are historical development records.

**Issue #288 | Base:** `chemometrics` after accepted scientific graph PR #287.

## Scope and authorship

This draft adds an initial ordered **15-scene** `LearningPath` to the fifth Chemometrics learning unit, placed in *Data Characterization* directly after *Variance and Dispersion*. It adds no new ontology classes, renderer code, chart contracts or scientific formulas. The path, scenes and teaching interaction objects occupy three separate named RDF graphs:

- `ontology/dataset/chemometrics-level4-path.trig`: `LearningPath` and 15 ordered `PathStep` selectors.
- `ontology/dataset/chemometrics-level4-scenes.trig`: renderer-neutral `SceneDefinition` and `SceneItem` resources. Scientific words and formulas are selected by IRI rather than copied here.
- `ontology/dataset/chemometrics-level4-teaching.trig`: only newly authored teaching questions, answers, R snippets and exercise instructions.

Scientific definitions, source provenance, formulas, synthetic observations and statistical results remain anchored in `level4-statistical-knowledge.trig` and `level4-synthetic-qc-example.trig`. The new R snippets explicitly `cd:showsResource` the scientific concepts or datasets that they illustrate.

## Teaching progression

| Step(s) | Teaching focus | Interaction |
| --- | --- | --- |
| 1–2 | Quantile questions, population vs observed sample | Scientific resources selected |
| 3–4 | Empirical CDF, type-1 generalized inverse vs type-7 interpolation | Formula panels |
| 5–6 | Type-7 first quartile of 2,4,5,8 mg/L | Single-choice question then editable base-R experiment |
| 7–8 | Empirical type-7 IQR; raw MAD vs Gaussian-scaled MAD | Scientific formula panels |
| 9–10 | Same synthetic seven-observation QC series as scientific graph | Editable base-R comparison; outlier-diagnosis single-choice question |
| 11–13 | Empirical second central moment vs Bessel correction; sample skewness and excess kurtosis | Existing canonical moment definitions and formulas |
| 14–15 | Explicit unadjusted `g1`/`g2`; undefined values at zero variance; review | Editable base-R experiment and existing correction resources |

**Instructional method:** Ask–predict–calculate–interpret. Polls are deterministically answerable, and R snippets use only base R, no package downloads. Code outputs must never be taken as evidence for a real QC result; both datasets are synthetic. A Tukey-fence flag is not grounds for discarding a measurement.

## Publication and review boundary

This is **not** a completed or validated three-hour lecture and **not** a deployment. It does not yet include an ECDF step-chart, Tukey boxplot chart, linked live visual comparison, viewport/accessibility review or a dedicated new R lab route. Those require separately approved semantic chart contracts and presentation validation.

The offering's fifth unit becomes discoverable in generated local preview and self-study bundle, but `main` and `gh-pages` remain unchanged until separately authorized. Check scene semantics, snapshot determinism and regression of the existing four levels using the exact-head validator. Independently review the sequence, readability and R execution prior to integration.

### Validation commands

```text
python -m unittest discover -s tests -p test_chemometrics_level4_learning_path.py -v
python -m unittest discover -s tests -p test_chemometrics_course_skeleton.py -v
python -m unittest discover -s tests -p test_self_study_course_bundle.py -v
python scripts/validate_semantics.py
npm test
```
