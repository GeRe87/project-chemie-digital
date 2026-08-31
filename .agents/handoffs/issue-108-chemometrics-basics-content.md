# Agent handoff

## Role

`Semantic Web and Ontology Engineer + scientific content migration worker`

## Issue

`#108 — Migrate Chemometrics basics into reusable canonical knowledge resources`

## Scope completed

The detailed first Chemometrics content slice was migrated from the supplied legacy evidence:

- `RandomVariable.md`
- `MeanValue.md`
- `Variance.md`

The migration remains strictly upstream of lecture-path/scene/runtime composition. No `LearningPath`, `SceneDefinition` or `SceneDocument` was created for the Chemometrics units, and no renderer/application package was modified.

## Canonical scientific identities

### Newly authored concepts

- `ex:discrete-random-variable`
- `ex:continuous-random-variable`
- `ex:expected-value`
- `ex:law-of-large-numbers`
- `ex:geometric-mean`
- `ex:harmonic-mean`
- `ex:median`

`ex:random-variable` from Issue #106 was expanded rather than replaced.

### Reused identities

The migration deliberately reuses the existing canonical identities, including:

- `ex:arithmetic-mean`
- `ex:variance`
- `ex:sample-variance`
- `ex:population-variance`
- `ex:standard-deviation`
- `ex:standard-error`
- `ex:relative-standard-deviation`
- `ex:sample`
- `ex:population`
- `ex:degrees-of-freedom`
- `ex:n-minus-one`

No course-prefixed scientific duplicates were created. In particular, no new `ex:coefficient-of-variation` concept is authored; “coefficient of variation” is attached as an alternative label to existing `ex:relative-standard-deviation` together with a reviewed formula and scope interpretation.

## Reusable authored resources

The Chemometrics specification graph now includes reviewed reusable:

- definitions for the new concepts;
- arithmetic, expected-value, geometric, harmonic, median, population/sample variance, SEM and CV/RSD expressions;
- interpretations that distinguish random variables from realizations, sample means from expected values, LLN from sampling-distribution results, and SD from estimator-specific SE;
- selected worked examples for discrete/continuous variables, multiplicative growth, equal-distance speed and median robustness;
- renderer-neutral R `CodeExample` resources attached to explicit `Exercise` resources;
- real NIST source resources for location, geometric mean, harmonic mean and coefficient of variation, plus reuse of the existing OpenStax source identity.

## Course-scale links

The three existing LearningUnits retain their identities and positions but now reference the reviewed scientific concept set:

- `Random Variables` -> random variable + discrete/continuous random variables;
- `Mean Values` -> arithmetic mean + expected value + LLN + geometric mean + harmonic mean + median;
- `Variance and Dispersion` -> variance + standard deviation + standard error + relative standard deviation.

This does not create a lecture path. It only makes the already-existing organizational units point to the reusable scientific concepts established by this content migration.

## Scientific decisions and corrections

### Random variable vs realization

The legacy wording around one die result is made precise: an observed result is a realization under a random-variable model, not the random variable itself.

The measurement slide is not copied as a law of measurement. `X = θ + ε` is treated only as an additive model under stated assumptions. The legacy phrase coupling “noise and uncertainty” is not canonicalized as equivalence.

### Discrete vs continuous

Discrete variables are modeled with finite/countable support. Continuous variables receive a distribution-based definition. The legacy universal pH range `0–14`, unrestricted positive concentration range, and HPLC-intensity claim are not promoted to canonical scientific statements.

### Expected value vs arithmetic mean

`ex:expected-value` is distinct from `ex:arithmetic-mean`. The sample arithmetic mean is explicitly described as a statistic that may estimate an expected value under an appropriate sampling model; the two identities are not conflated.

### Law of Large Numbers

The LLN definition is assumption-scoped and concerns convergence of sample averages. The `Variance.md` slide titled “Law of Large Numbers” also contains standard-error and sampling-distribution narrowing material; this is documented as a conceptual mixture rather than being used to redefine LLN.

### Arithmetic mean applicability

The legacy rule “Best for normal data without extreme outliers or skewness” is rejected as a definition/applicability prerequisite. The arithmetic mean can be computed without normality; extreme observations and skewness instead affect robustness and interpretation.

### Geometric mean

The canonical geometric mean is restricted to strictly positive data in its product/log representation and tied to scientifically meaningful multiplicative/log-scale averaging. The legacy comments “WRONG for rates!” / “CORRECT!” are not preserved because “rate” alone does not determine the correct averaging operator.

### Harmonic mean

The rate interpretation is corrected to equal distances or, more generally, equal quantities in the rate denominator. For equal time intervals, arithmetic averaging of rates is the relevant average. The legacy summary line “Averaging rates over equal times” is therefore explicitly not canonicalized.

The legacy harmonic-flow R exercise omits the denominator-quantity condition and is not promoted as a reusable exercise. The equal-distance speed worked example is retained because its assumptions are explicit.

### Median

The median is authored as an order-based, outlier-resistant statistic, not as a statistic that extreme values can never affect. Statements that the median is automatically “more representative” or preferable for regulatory/compliance work remain contextual legacy evidence.

### Variance and Bessel correction

Existing sample/population variance identities are reused, with explicit formulas added. `n-1` remains estimator-specific: the unbiasedness statement applies to the conventional Bessel-corrected estimator of population variance under the required sampling assumptions, not to every descriptive variance calculation.

### Standard Error

The general `ex:standard-error` identity is reused. Two distinct expressions are authored for the sample mean:

- population SD known: `SE(X̄) = σ/sqrt(n)`;
- plug-in estimate: `SE-hat(X̄) = s/sqrt(n)`.

The interpretation explicitly scopes these formulas to iid observations with finite variance and rejects a universal `SD/sqrt(n)` definition of Standard Error or equivalence with measurement uncertainty.

### Coefficient of variation / relative standard deviation

The existing `ex:relative-standard-deviation` concept is reused and receives the alternative label “coefficient of variation”. Its use is restricted to ratio-scale data with meaningful zero and a mean sufficiently separated from zero.

A legacy numerical interpretation is flagged: `CV = 2.5%` and `CV = 5%` are not “similar relative variability”; one is twice the other.

## Migration review

`docs/migration/chemometrics-basics-content-map.md` records all 46 explicit slide occurrences from the three source files, including the duplicate `harmonic-mean-problem` slide ID as two separate source occurrences.

Mixed slides explicitly separate scientific reuse/create decisions from `PATH` narration and `RENDERER` mechanics. No legacy slide ID is promoted as a canonical scientific identity.

Renderer-only evidence includes the seven legacy chart scripts named in Issue #108 and CodeMirror/WebR/DOM execution mechanics. These are documented for manager triage only; no System Track implementation is included.

## Files changed

- `ontology/dataset/chemometrics-basics.trig` — expanded reusable Chemometrics scientific/resource graph.
- `ontology/dataset/course-scale.trig` — additive focus-concept links from the existing three Chemometrics LearningUnits to the reviewed reusable concepts.
- `docs/migration/chemometrics-basics-content-map.md` — complete 46-slide migration map and scientific review.
- `tests/test_chemometrics_basics_content.py` — focused semantic identity, formula, correction, renderer-boundary and SHACL regression tests.
- `tests/test_chemometrics_course_skeleton.py` — updates the exact focus-concept expectations to the now-expanded reviewed concept sets while preserving the original offering/order/no-path assertions.
- `.agents/handoffs/issue-108-chemometrics-basics-content.md` — this handoff.

## Verification performed before PR

- [x] Source ZIP was recovered from the supplied conversation/library artifact and the three legacy Markdown files were inspected directly.
- [x] Exactly 46 explicit slide occurrences are present in the detailed migration map: 5 Random Variables + 24 Mean Values + 17 Variance/Dispersion.
- [x] New TriG syntax was parsed locally with RDFLib.
- [x] Updated `course-scale.trig` syntax was parsed locally with RDFLib.
- [x] New/updated Python test modules were syntax-compiled locally.
- [x] Reuse was checked against the current canonical `standard-deviation.trig`, `concepts.trig`, `interactive-code.trig` and existing Chemometrics skeleton.
- [x] Scientific corrections were checked against the existing OpenStax source conventions and current NIST material for measures of location, geometric mean, harmonic mean and coefficient of variation.
- [ ] Authoritative repository-wide tests and exact-head validator evidence must come from the PR head after all files are committed.

## Open content problems intentionally deferred

- Microbial-water-quality regulation, heavy-metal compliance statements and sediment `D50` practice need dedicated domain/source review before canonicalization.
- Soil diffusion and hydraulic-conductivity harmonic-mean examples require explicit physical geometry/series assumptions before becoming reusable worked examples.
- Geometric standard deviation / `SD(log x)` deserves its own concept review if later lecture content depends on it; it is not created opportunistically here.
- The six final group-discussion cases are encoded primarily as SVG figures; their semantic case text needs an accessible authored source before migration.
- The wider course still has the previously documented missing Non-linear Regression legacy source; Issue #108 does not fabricate it.

## Validator status

Pending exact-head `agent-validator/project-chemie-digital` evidence for the final Draft PR head. The worker must not accept or merge its own work.

## Manager review requested

After the exact-head validator reports success, review:

1. no duplicate scientific concept identities were introduced;
2. the seven new concepts and `ex:random-variable` expansion are scientifically scoped as described;
3. Mean/expected value, harmonic/geometric mean, median, SEM and CV corrections are acceptable;
4. the 46-slide migration map covers the complete bounded source slice and preserves disputed legacy statements as review evidence rather than authority;
5. the three LearningUnit focus sets are expanded without creating any Chemometrics `LearningPath` or Scene;
6. no renderer/application/runtime file is changed;
7. only after those checks should the Manager decide acceptance/merge.
