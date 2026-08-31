# Chemometrics basics detailed migration map

## Status and authority

This review covers the Issue #108 migration slice from the supplied legacy files `RandomVariable.md`, `MeanValue.md` and `Variance.md`.

The legacy Markdown is **migration evidence, not scientific authority**. Canonical authored semantics are written only to `ontology/dataset/*.trig`. This migration intentionally does not create a `LearningPath`, `SceneDefinition` or `SceneDocument`.

Each slide occurrence receives one **slide outcome**. Mixed slides additionally list embedded elements so that scientific content, didactic narration and renderer mechanics are not conflated. The allowed classifications are:

- `REUSE` — an existing canonical scientific identity is referenced or extended without another `rdf:type cd:Concept` assertion;
- `CREATE` — a missing reusable scientific or renderer-neutral learning resource is authored with a stable project IRI;
- `PATH` — didactic ordering, prompts, application narration or source material intentionally deferred to later LearningPath authoring/review;
- `RENDERER` — Reveal/HTML/CSS/JavaScript/CodeMirror/WebR/chart/media behavior that must stay outside scientific RDF semantics.

## Scientific review decisions applied across the slice

1. `ex:random-variable` is refined as a probabilistic mapping and explicitly distinguished from one observed realization. The legacy measurement equation is retained only as evidence for an **additive model**, not as a definition of randomness; measurement noise is not equated with measurement uncertainty.
2. `ex:expected-value` and existing `ex:arithmetic-mean` remain distinct. The sample mean can estimate an expected value under a sampling model but is not the expected value itself.
3. The Law of Large Numbers is scoped to standard conditions for convergence of sample means. The sampling-distribution narrowing/standard-error material in `Variance.md` is not used as the definition of LLN.
4. The arithmetic mean has no normality prerequisite. Strong skewness and extreme values can affect its usefulness as a representative center, but do not make the statistic mathematically undefined.
5. The geometric mean is authored for strictly positive values and multiplicative/log-scale interpretation. Legacy wording that treats the arithmetic mean as generically “wrong for rates” is rejected.
6. The harmonic mean is authored for reciprocal averaging and, for rate examples, equal quantities in the rate denominator such as equal distances. The legacy summary statement “rates over equal times” is reversed: equal time intervals imply an arithmetic mean of rates.
7. The median is authored as resistant to extreme observations, not immune to them. Claims that it is automatically the “more representative” value or automatically preferred for compliance remain contextual evidence only.
8. Existing `ex:variance`, `ex:sample-variance`, `ex:population-variance`, `ex:standard-deviation` and `ex:standard-error` are reused. Bessel correction is retained only in its estimator-specific context.
9. `s/sqrt(n)` is canonicalized only as a plug-in estimate of the standard error of the sample mean under iid/finite-variance assumptions. It is not a universal Standard Error formula and is not a synonym for measurement uncertainty.
10. The legacy “Coefficient of Variation” is mapped to existing `ex:relative-standard-deviation`; no duplicate `ex:coefficient-of-variation` concept is created. Cross-scale comparison is restricted to ratio-scale quantities with meaningful zero and a mean away from zero. The legacy example also contains a review defect: `2.5%` and `5%` are not “similar relative variability”.

## `RandomVariable.md`

| Slide occurrence | Title | Slide outcome | Canonical target(s) | Embedded element map and scientific review |
| --- | --- | --- | --- | --- |
| `requirements` | Requirements | `PATH` | — | `PATH`: “No prior knowledge required” is course/path prerequisite evidence, not a scientific concept relation. |
| `initial-thoughts-dice` | Initial Thoughts | `CREATE` | `ex:exercise-dice-realizations`, `ex:code-dice-roll-r` | `PATH`: opening question about the expected die result. `CREATE`: renderer-neutral R exercise/code. `RENDERER`: columns, icons, CodeMirror editors, run button, WebR import/execution, JavaScript fallback and DOM lifecycle. |
| `initial-thoughts-2` | Initial Thoughts - 2 | `CREATE` | `ex:random-variable-realization-interpretation` | `CREATE`: distinguish a random variable from one realized die/measurement result. `PATH`: transition question from dice to Fe measurement. `RENDERER`: icons/layout. Legacy “result … can be described by a random variable” is made precise rather than copied literally. |
| `measuring-sample` | Measuring a Sample - Example | `CREATE` | `ex:random-measurement-model-interpretation` | `CREATE`: reviewed statement that `X = θ + ε` is a conditional additive measurement model. `PATH`: the idealized constant/noisy narrative remains teaching evidence. `RENDERER`: toggle, signal chart and `resources/js/charts/random_variable_measurement.js`. “Noise and uncertainty” are not treated as synonyms. |
| `types-of-random-variables` | Types of Random Variables | `CREATE` | `ex:discrete-random-variable`, `ex:continuous-random-variable`, `ex:worked-example-discrete-colony-count`, `ex:worked-example-continuous-concentration` | `CREATE`: countable-support and continuous-distribution concepts plus conservative examples. `PATH`: encoded pH classes, fixed “pH 0–14”, and unrestricted HPLC/intensity claims are retained only as legacy examples because their wording is context-dependent or overbroad. `RENDERER`: two-column layout and styled cards/icons. |

## `MeanValue.md`

| Slide occurrence | Title | Slide outcome | Canonical target(s) | Embedded element map and scientific review |
| --- | --- | --- | --- | --- |
| `requirements` | Requirements | `PATH` | — | `PATH`: legacy prerequisite “Random Variables”; not promoted to course-path RDF in this issue. |
| `initial-thoughts-mean` | Initial Thoughts | `PATH` | — | `PATH`: five-dice warm-up and expectation prompt. `RENDERER`: CodeMirror/WebR/DOM execution and JavaScript fallback. The code is not retained separately because the reviewed expectation resources are authored on subsequent slides. |
| `arithmetic-mean-intro` | Arithmetic Mean - Introduction | `REUSE` | `ex:arithmetic-mean`, `ex:arithmetic-mean-formula` | `REUSE`: canonical arithmetic-mean identity. `CREATE`: formula resource. `PATH`: repeated-roll convergence activity. `RENDERER`: editor and interactive execution plumbing. |
| `expected-value-theory` | Expected Value - Theoretical Approach | `CREATE` | `ex:expected-value`, `ex:discrete-expected-value-formula` | `CREATE`: expected value as a distribution property and corrected discrete-support notation. `PATH`: fair-die numerical derivation remains an illustrative narrative. Legacy `P(x_i)` is normalized to `P(X=x)` rather than canonized verbatim. |
| `law-of-large-numbers` | Law of Large Numbers | `CREATE` | `ex:law-of-large-numbers`, `ex:def-law-of-large-numbers` | `CREATE`: assumption-scoped convergence concept. `PATH`: sample-size demonstration. `RENDERER`: simulation controls/WebR/JavaScript. Finite-sample equality is not implied. |
| `expected-value-problem` | The Real-World Challenge | `CREATE` | `ex:sample-mean-estimator-interpretation` | `CREATE`: sample mean may estimate expected value under an appropriate sampling model. `PATH`: dice-versus-real-process transition and examples. Legacy “must estimate” / `x̄ ≈ E[X]` is not made an identity assertion. |
| `arithmetic-mean-water-science` | Arithmetic Mean in Water Science | `REUSE` | `ex:arithmetic-mean`, `ex:arithmetic-mean-applicability-interpretation` | `REUSE`: concept; `CREATE`: corrected applicability interpretation. `PATH`: application examples and Fe exercise. `RENDERER`: R editor/execution. The claim “Best for data without extreme outliers or skewness” is replaced by a robustness qualification, not a normality prerequisite. |
| `geometric-mean-visual` | Bacterial Growth: Why Arithmetic Mean Fails | `PATH` | — | `PATH`: multiplicative-growth motivation/question. `RENDERER`: figure/layout. The title is intentionally not promoted as a universal scientific rule. |
| `geometric-mean-intro` | When Arithmetic Mean Fails | `CREATE` | `ex:geometric-mean`, `ex:geometric-mean-product-formula`, `ex:geometric-mean-log-formula`, `ex:geometric-mean-applicability-interpretation`, `ex:worked-example-multiplicative-growth` | `CREATE`: positive-input geometric mean, product/log forms, multiplicative interpretation and equal-period growth example. The phrase “rates, or ratios” is narrowed: ratios/multiplicative factors are valid contexts, “rate” alone is insufficient. |
| `geometric-mean-exercise` | Geometric Mean - R Example | `CREATE` | `ex:exercise-geometric-growth-factors`, `ex:expected-geometric-growth-factors`, `ex:code-geometric-mean-r` | `CREATE`: cleaned renderer-neutral R exercise/code. `RENDERER`: legacy editor/bootstrap/fallback mechanics. Legacy comments “WRONG for rates!” / “CORRECT!” are removed because appropriateness depends on the averaging problem. |
| `geometric-mean-water-science-1` | Geometric Mean in Water Science I | `REUSE` | `ex:geometric-mean` | `REUSE`: geometric mean. `PATH`: E. coli distribution/regulatory application narrative requires domain/regulatory sourcing and is not generalized here. The arithmetic mean is sensitive to the extreme value, but “biased” is not canonicalized without an estimand. `RENDERER`: icon/card layout. |
| `geometric-mean-water-science-2` | Geometric Mean in Water Science II | `REUSE` | `ex:geometric-mean`, `ex:geometric-mean-applicability-interpretation` | `REUSE`: positive ratio/multiplicative-change interpretation. `PATH`: campaign/spatial use cases and numerical narrative. No rule says every ratio must be summarized geometrically; scientific meaning of equal log weighting is required. |
| `harmonic-mean-problem#1` | Harmonic Mean I — Why Other Means Fail | `PATH` | — | `PATH`: equal-distance speed question. `RENDERER`: introductory SVG. This duplicate legacy slide ID is treated as a source occurrence, never as a canonical identifier. |
| `harmonic-mean-problem#2` | Harmonic Mean I — Why Other Means Fail | `CREATE` | `ex:worked-example-equal-distance-speed` | `CREATE`: equal-distance 10 m/s and 2 m/s worked example with 3.33 m/s overall speed. `REUSE`: arithmetic/geometric identities for comparison only. `RENDERER`: animation controls and `resources/js/charts/harmonic_mean_flow.js`. |
| `harmonic-mean-definition` | Harmonic Mean II — The Correct Approach | `CREATE` | `ex:harmonic-mean`, `ex:harmonic-mean-formula`, `ex:harmonic-mean-rate-interpretation` | `CREATE`: reciprocal definition/formula and equal-denominator-quantity rate rule. The valid equal-distance derivation is kept. The generic concentration wording is not treated as sufficient without a reciprocal/series model. |
| `harmonic-mean-exercise` | Harmonic Mean - R Exercise | `PATH` | `ex:harmonic-mean` | `REUSE`: mathematical harmonic-mean identity/formula. `PATH`: legacy “average flow rate” exercise omits the equal-volume/distance/quantity condition needed to justify harmonic averaging, so the exercise is not canonicalized. `RENDERER`: editor/WebR/fallback. |
| `harmonic-mean-water-science` | Harmonic Mean in Water Science | `REUSE` | `ex:harmonic-mean`, `ex:harmonic-mean-rate-interpretation` | `REUSE`: series-resistance interpretation. `PATH`: effective diffusion through equal layers is physically model-dependent (geometry, steady-state/series assumptions) and is retained for later domain-specific review rather than generalized. `RENDERER`: icons/cards. |
| `median-intro` | Median When Data Has Outliers | `PATH` | — | `PATH`: opening process-control question. `RENDERER`: `median_outlier_intro.svg`. |
| `median-problem` | Median When Data Has Outliers | `CREATE` | `ex:worked-example-turbidity-median` | `CREATE`: numerical mean/median contrast for `[2.1,2.3,2.0,2.2,45.0]`. `PATH`: process-control choice remains contextual. “Not representative” is not asserted universally. `RENDERER`: layout/icon. |
| `median-definition` | The Median | `CREATE` | `ex:median`, `ex:sample-median-formula`, `ex:median-robustness-interpretation` | `CREATE`: order-statistic definition/formula and resistance interpretation. Legacy “extreme values don't affect the median” is corrected to reduced sensitivity; “half below/half above” is formulated with `<=`/`>=` semantics. |
| `median-exercise` | Median - R Exercise | `CREATE` | `ex:exercise-mean-median-outlier`, `ex:expected-mean-median-outlier`, `ex:code-mean-median-r` | `CREATE`: cleaned exercise/code and expected result. `RENDERER`: CodeMirror/WebR/fallback. Removed the absolute output “Median is more representative!”. |
| `median-water-science` | Median in Water Science | `REUSE` | `ex:median` | `REUSE`: median identity/robustness. `PATH`: heavy-metal compliance claims, “baseline” preference and sediment `D50` practice require domain-specific/quantile review outside this issue. `RENDERER`: cards/layout. |
| `summary-means` | Summary: Choosing the Right Mean | `REUSE` | `ex:arithmetic-mean`, `ex:geometric-mean`, `ex:harmonic-mean`, `ex:median` | `REUSE`: concept/formula recap. `PATH`: selection heuristics are teaching guidance. Corrections: arithmetic mean does not require normality; geometric mean is not generically “for rates”; harmonic mean is **not** the correct equal-time rate average. |
| `case-scenarios` | Group Discussion: Which Mean to Use? | `PATH` | — | `PATH`: group-discussion selection exercise; detailed cases are encoded in figures rather than semantic text and therefore require later authored reconstruction/review. `RENDERER`: six case SVGs and grid layout. |

## `Variance.md`

| Slide occurrence | Title | Slide outcome | Canonical target(s) | Embedded element map and scientific review |
| --- | --- | --- | --- | --- |
| `requirements` | Requirements | `PATH` | — | `PATH`: legacy requirements “Mean Values” and “Random Variables”; no LearningPath/prerequisite migration here. |
| `why-more-than-mean` | Why Do We Need More Than a Mean? | `REUSE` | `ex:arithmetic-mean`, `ex:variance`, `ex:standard-deviation` | `REUSE`: center-versus-spread concepts. `PATH`: same-mean/different-spread motivation. `RENDERER`: `resources/js/charts/variance_intro_chart.js`. |
| `variance-definition` | Variance: Definition & Concept | `REUSE` | `ex:variance`, `ex:sample-variance`, `ex:population-variance`, `ex:sample-variance-formula`, `ex:population-variance-formula` | `REUSE`: established variance identities. `CREATE`: explicit finite-population and Bessel-corrected sample formulas. Existing squared-unit rule is reused; sample and population denominators remain distinct. |
| `standard-deviation` | Standard Deviation (SD) | `REUSE` | `ex:standard-deviation`, existing SD formulas/unit rule, `ex:normal-empirical-rule-interpretation` | `REUSE`: standard deviation. `CREATE`: qualified approximately-normal 68/95/99.7 interpretation. `RENDERER`: `resources/js/charts/sd_bands_chart.js`. The empirical rule is distribution-specific, not universal. |
| `sample-vs-population` | Sample vs Population & Bessel's Correction | `REUSE` | `ex:sample`, `ex:population`, `ex:sample-variance`, `ex:population-variance`, `ex:n-minus-one`, `ex:degrees-of-freedom` | `REUSE`: all scientific identities already exist. `PATH`: explanatory ordering. Bessel correction remains tied to estimating population variance, not every descriptive sample variance. |
| `bessel-example` | Bessel's Correction: The Bias Demonstrated | `REUSE` | `ex:n-minus-one`, `ex:sample-variance`, `ex:population-variance` | `REUSE`: existing correction/variance concepts. `PATH`: simulation narrative. `RENDERER`: `resources/js/charts/bessel_bias_chart.js`. The “unbiased on average” claim is retained only under random-sampling/finite-variance assumptions; no unconditional statement is added. |
| `standard-error` | Standard Error (SE) of the Mean | `REUSE` | `ex:standard-error`, `ex:sem-population-formula`, `ex:sem-estimated-formula`, `ex:sem-scope-interpretation` | `REUSE`: existing general Standard Error identity. `CREATE`: population and plug-in SEM formulas plus iid scope. “SE = uncertainty in the sample mean” is not equated to measurement uncertainty, and `s/sqrt(n)` is not universalized to all estimators. |
| `lln-intuition` | Law of Large Numbers | `REUSE` | `ex:law-of-large-numbers`, `ex:standard-error`, `ex:lln-not-standard-error-interpretation` | `REUSE`: LLN and SEM resources. `PATH`: teaching transition between convergence and sampling distributions. `RENDERER`: `resources/js/charts/sampling_distribution_chart.js`. The narrowing/normal approximation is not canonicalized as the definition of LLN. |
| `example-symmetric` | Example: Dissolved Oxygen (Near-Symmetric Data) | `REUSE` | `ex:arithmetic-mean`, `ex:standard-deviation`, `ex:standard-error` | `REUSE`: calculations use existing concepts. `PATH`: ten-day example is not promoted as an inference exercise because temporal independence/sampling assumptions are unstated. `RENDERER`: editable R execution and JavaScript fallback. |
| `skewed-data` | Skewed Data: E. coli Example | `REUSE` | `ex:arithmetic-mean`, `ex:standard-deviation`, `ex:geometric-mean` | `REUSE`: concepts and geometric positive-data interpretation. `PATH`: domain/distribution generalizations and “better approach” choice remain context-specific. The numerical outlier sensitivity is valid as an illustration but not generalized to all E. coli datasets. |
| `geometric-context` | Variability in Geometric Context | `REUSE` | `ex:geometric-mean` | `REUSE`: log-form geometric mean. `PATH`: `SD(log x)`, multiplicative interval presentation and potential geometric-standard-deviation concept are intentionally deferred; Issue #108 did not need a new spread concept and the slide mixes descriptive and model-specific interpretation. |
| `harmonic-context` | Variability in Harmonic Context | `REUSE` | `ex:harmonic-mean` | `REUSE`: harmonic mean formula/series context. `PATH`: “variability assessed using SD(1/x)”, “no simple formula” and “uncertainty … rarely reported” are not canonicalized as general statistical rules; uncertainty of a harmonic-mean estimator depends on the model/method. |
| `sd-vs-se-plots` | SD vs SE on Plots | `REUSE` | `ex:standard-deviation`, `ex:standard-error`, existing `ex:comparison-dispersion-measures`, existing SD/SE correction | `REUSE`: established distinction. `PATH`: error-bar communication warning. `RENDERER`: `resources/js/charts/sd_vs_se_chart.js`. |
| `units-scaling-cv` | Units, Scaling, and Coefficient of Variation | `REUSE` | `ex:relative-standard-deviation`, `ex:relative-standard-deviation-formula`, `ex:relative-standard-deviation-scope-interpretation` | `REUSE`: existing RSD concept; `CREATE`: CV/RSD formula, alt labels and ratio-scale/near-zero scope. No `ex:coefficient-of-variation` concept. Legacy “different means/units” is narrowed to ratio scales. Review defect: 2.5% vs 5% is a twofold difference, not “similar”. |
| `choosing-summary` | Choosing the Right Summary | `PATH` | reused mean/spread concepts | `PATH`: the matrix is didactic guidance, not a universal ontology rule. `REUSE`: arithmetic/geometric/harmonic means, SD/SE. “Additive/symmetric”, “log-normal” and “rates in series” need problem-specific assumptions rather than rigid routing. |
| `r-snippets` | Calculating Variance and SD in R | `CREATE` | `ex:exercise-summary-statistics-r`, `ex:code-summary-statistics-r` | `CREATE`: cleaned renderer-neutral R computation resource with explicit iid qualification for `s/sqrt(n)` and positive-data context. `RENDERER`: editor/bootstrap/JavaScript fallback. The code computes geometric/harmonic means but the exercise states that scientific appropriateness depends on scale/context. |
| `common-pitfalls` | Common Pitfalls | `REUSE` | existing SD/SE distinction, `ex:geometric-mean`, `ex:harmonic-mean`, variance unit rule | `REUSE`: reviewed concepts/corrections. `PATH`: summary framing. Rejected universal rules include “skewed -> geometric mean” and “rates -> harmonic mean”; both require the corresponding scientific data/model structure. |

## Renderer/system evidence for manager triage

The following requirements were found but **not implemented** in this Content Track issue:

```text
Classification: RENDERER
Need:
- editable R code presentation for selected renderer-neutral CodeExample resources
- WebR execution provider and deterministic reset/run behavior
- accessible textual output and error reporting
- offline-first behavior consistent with the project runtime boundary
- Reveal-compatible interactive chart/animation adapters for legacy concepts where retained
```

Legacy chart/script evidence in this slice:

- `resources/js/charts/random_variable_measurement.js`
- `resources/js/charts/harmonic_mean_flow.js`
- `resources/js/charts/variance_intro_chart.js`
- `resources/js/charts/sd_bands_chart.js`
- `resources/js/charts/bessel_bias_chart.js`
- `resources/js/charts/sampling_distribution_chart.js`
- `resources/js/charts/sd_vs_se_chart.js`

No renderer/application code is modified by Issue #108.

## Deferred content problems

- The two `harmonic-mean-problem` slides share the same legacy `.slide:id`; the canonical model deliberately does not inherit this unstable source identity.
- The microbial-water-quality regulatory statement, heavy-metal compliance guidance and sediment `D50` practice need domain-specific source review before canonicalization.
- The soil diffusion/hydraulic-conductivity examples require explicit physical series/geometry assumptions before becoming reusable scientific worked examples.
- `SD(log x)` / geometric standard deviation deserves its own later concept review if the course needs it; it is not created opportunistically in this slice.
- The legacy group-discussion cases are primarily encoded in SVG figures. Their scientific case text must be authored from an accessible source before semantic migration.
