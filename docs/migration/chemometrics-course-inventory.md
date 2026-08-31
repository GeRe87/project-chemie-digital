# Chemometrics and Applied Statistics legacy-content inventory

## Status and authority

This document records the first migration inventory for the legacy Reveal.js/Markdown course **Chemometrics and Applied Statistics**. The supplied source set contains 17 Markdown files, about 32,232 lines, and 426 explicit legacy `.slide:id` markers.

The Markdown files are **migration evidence only**. They are not canonical semantic authority and are not loaded by the new runtime. Canonical authored semantics remain in `ontology/dataset/*.trig`.

The legacy files mix several concerns that must be separated during migration:

- scientific concepts, definitions and explanatory prose;
- mathematical expressions and statistical procedures;
- worked examples, exercises and datasets;
- R/code examples;
- didactic ordering that may later become `LearningPath` structure;
- Reveal.js layout, HTML, JavaScript and visualization mechanics that belong to renderer/application layers rather than the knowledge graph.

For detailed migration turns, each legacy element should be classified as one of:

- **REUSE** — reference an existing canonical semantic resource;
- **CREATE** — create a new reusable canonical semantic resource;
- **PATH** — preserve didactic/narrative ordering in a later path specification;
- **RENDERER** — preserve presentation or interaction behavior outside scientific/course semantics.

Legacy `requirements` metadata is recorded below as source evidence. It is **not** promoted automatically to RDF prerequisite relations in this inventory.

## First bounded migration slice

Issue #106 establishes only this course-scale skeleton:

```text
Chemometrics and Applied Statistics
  10 -> Random Variables
  20 -> Mean Values
  30 -> Variance and Dispersion
```

Detailed prose, formulas, exercises, code and scenes remain outside that skeleton increment.

The initial reuse policy is:

- `Random Variables` uses a new minimal `ex:random-variable` focus concept because no matching canonical concept existed;
- `Mean Values` initially anchors to existing `ex:arithmetic-mean`;
- `Variance and Dispersion` reuses existing `ex:variance`, `ex:standard-deviation` and `ex:standard-error` rather than creating course-specific duplicates.

## Legacy source inventory

| Legacy file | Declared `requirements` metadata | Coarse educational scope | Likely later split? | Notable migration categories |
| --- | --- | --- | --- | --- |
| `chemometricsCourseIntro.md` | `none` | Course introduction, lecturer/context, schedule and introduction round | No; mostly offering/path-level material | PATH, RENDERER |
| `RandomVariable.md` | `none` | Random variables; discrete and continuous variables; measurement examples | Probably no for first pass | concepts/definitions, mathematics, R/code, renderer interaction |
| `MeanValue.md` | `none` | Arithmetic, expected, geometric and harmonic means; median; application examples | **Yes** — several reusable mean/location concepts are combined | concepts/definitions, mathematics, R/code, exercises/examples, media/renderer interaction |
| `Variance.md` | `Mean Values`, `Random Variables` | Variance, standard deviation, sample/population distinction, Bessel correction, standard error, variability examples | **Yes** — several existing reusable statistical concepts are combined | REUSE-heavy concepts, mathematics, R/code, exercises/examples, renderer interaction |
| `Quantiles.md` | `Mean Values`, `Variance` | Quantiles, interquartile range, robust spread and boxplots | Possibly | concepts/definitions, mathematics, R/code, examples, renderer interaction |
| `Distributions.md` | `Mean Values`, `Quantiles` | Histograms, empirical/theoretical distributions, PDF/CDF/ECDF and distribution testing | **Yes** | concepts/definitions, mathematics, R/code, renderer interaction |
| `Moments.md` | `Mean Values`, `Variance`, `Distributions` | Statistical moments, mean/variance recap, skewness and kurtosis | Possibly | concepts/definitions, mathematics, R/code, renderer interaction |
| `HypothesisTesting.md` | `Mean Values`, `Variance`, `Distributions` | Hypothesis-testing framework, test statistics, null distributions, p-values, significance and error types | **Yes** | concepts/definitions, mathematics, exercises/examples, renderer interaction |
| `tTest.md` | `Hypothesis Testing`, `Mean Values`, `Variance` | t-distribution, one-sample/two-sample/paired t-tests, assumptions and interpretation | **Yes** | concepts/definitions, mathematics, R/code, exercises/examples, renderer interaction |
| `anova1.md` | `Hypothesis Testing`, `Mean Values`, `Variance` | One-way ANOVA, multiple-testing motivation, sums of squares, F statistic and interpretation | **Yes** | concepts/definitions, mathematics, R/code, exercises/examples, media/renderer interaction |
| `linearRegression.md` | `Hypothesis Testing`, `Mean Values`, `Variance`, `t-Tests` | Linear model, least squares/SSE, matrix formulation, coefficient inference, model assessment and extensions | **Yes** | concepts/definitions, mathematics, R/code, exercises/examples, media/renderer interaction |
| `Uncertainty.md` | `Mean Values`, `Variance`, `Linear Regression` | Measurement uncertainty/error, propagation, confidence/prediction, bootstrap, Monte Carlo, validation and LOD/LOQ | **Yes — strongly** | concepts/definitions, mathematics, R/code, exercises/examples, renderer interaction |
| `FullFactorialDesign.md` | `Variance`, `Linear Regression` | DoE motivation, factors/levels, design space, full factorial designs, effects/interactions and optimization examples | **Yes** | concepts/definitions, mathematics, R/code, exercises/examples, renderer interaction |
| `advancedDOE.md` | `Full Factorial Design` | Fractional factorial design, aliasing, screening and response-surface/advanced designs | **Yes — strongly** | concepts/definitions, mathematics, exercises/examples, renderer interaction |
| `clusterAnalysis_I.md` | `Distances`, `Variance`, `ANOVA` | Distance/similarity, Minkowski-family distances, hierarchical clustering, linkage, dendrograms, k-means and validation | **Yes — strongly** | concepts/definitions, mathematics, R/code, exercises/examples, renderer interaction |
| `clusterAnalysis_II.md` | `Cluster Analysis I`, `Variance`, `Distances` | PCA/dimensionality reduction, eigenvalues, scores/loadings/biplots and multivariate extensions such as PLS-DA | **Yes — strongly** | concepts/definitions, mathematics, R/code, exercises/examples, renderer interaction |
| `machineLearning.md` | `regression`, `classification`, `cluster analysis`, `distance metrics` | Machine-learning foundations, prediction/classification, logistic regression, trees/random forests and validation/importance | **Yes — strongly** | concepts/definitions, mathematics, R/code, exercises/examples, media/renderer interaction |

### Requirements discrepancy retained as migration evidence

`Distributions.md` declares `Mean Values` and `Quantiles` in its frontmatter, while its visible legacy Requirements slide additionally lists `Variance`. This is intentionally **not normalized silently**. A later content migration/review must decide the intended prerequisite semantics.

Likewise, requirements such as `Distances`, `classification`, `cluster analysis` and `distance metrics` currently refer to legacy course terminology rather than stable `LearningUnit` IRIs. They require explicit semantic resolution before becoming canonical prerequisite relations.

## Known content gap

The legacy timetable includes **Non-linear Regression**, but no corresponding Markdown source was present in the supplied 17-file set. This remains an explicit content gap. No replacement content or inferred mapping to another lecture file should be fabricated.

## Migration-boundary observations

1. **One Markdown file is not necessarily one LearningUnit.** Large files such as `clusterAnalysis_I.md`, `Uncertainty.md`, `advancedDOE.md`, `clusterAnalysis_II.md` and `machineLearning.md` contain multiple reusable educational scopes.
2. **Existing canonical knowledge must win over legacy duplication.** For example, standard deviation, variance, standard error and arithmetic mean already exist in the canonical Dataset and should be referenced when semantic identity matches.
3. **Legacy slide order is evidence for a future path, not scientific truth.** Reveal slide ordering may inform lecture `LearningPath` authoring after reusable knowledge/resources have been migrated.
4. **Legacy JavaScript/HTML is not RDF course semantics.** Interactive distributions, regression plots, DoE design spaces, clustering/PCA visualizations and similar widgets must be represented through reusable resources plus renderer/application behavior, not copied as script markup into the knowledge graph.
5. **Migration should remain incremental and reviewable.** The recommended next content turn is the detailed `Random Variables -> Mean Values -> Variance and Dispersion` slice, followed only then by lecture-path and scene authoring.
