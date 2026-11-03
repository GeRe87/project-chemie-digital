# Level 5: L12 lognormal lecture block

Local review, 2026-10-31. No commit, push, publication or deployment.
Four complete scenes extend the local preview from twenty-six to thirty scenes.

## Lecture sequence

| Scene | Complete explanation |
| --- | --- |
| L12a | Positive right-skewed concentrations and multiplicative influences motivate a candidate lognormal model, not proof |
| L12b | Exactly the same twenty values on a natural-log-ratio scale, with a specified normal reference |
| L12c | Population median/geometric mean 2.00 mg/L versus arithmetic expectation approximately 2.65 mg/L |
| L12d | True zeros, reporting limits, mixtures/dependence and the target of back-transformation |

All authored text, narration, labels and static alternatives are English. Each view
is complete on entry without questions, controls or reveal stages. Each of the two
displayed formulas has its own complete authored symbol legend linked by `dct:hasPart`
and displayed through the shared formula/legend renderer. The original six binomial
comparison advances remain the only internal advances.

## Scientific interpretation

- The new twenty-value illustration is not the forty-site dataset from N11. Its
  seven log-spaced levels have deliberately authored frequencies 1, 2, 4, 6, 4, 2, 1.
  Neither observations nor reference parameters are sampled or fitted at runtime.
  These are not environmental measurements or evidence of model fit.
- Original and transformed histograms use the same twenty paired observations.
  Every transformed Observation links to its original through `cd:derivedFromResource`.
  Ties, order and sample size are preserved; no resampling or deletion occurs.
- Logarithms apply to concentration divided by a fixed reference of 1 mg/L. This
  ratio is dimensionless; a change of reporting units must convert the reference
  as well. Negative log ratios mean concentrations below that positive reference,
  not negative concentrations. The blueprint's shorthand logarithm of concentration
  is thus made explicit without changing its statistical meaning.
- This is a histogram of transformed observations, not just logarithmic tick labels
  on the original histogram. Bin widths and density heights change scale. Original
  density units are L/mg, while log-ratio density is dimensionless, denoted by 1.
  Bar areas sum to one on both scales; heights are not comparable across scales.
- The specified model has log-ratio mean ln(2) and SD 0.75. The second normal
  parameter is log variance, not the concentration SD. Multiplicative mechanisms
  motivate considering the model, but arbitrary products or skewed data do not
  automatically follow it.
- The original density has strictly positive support. Its coordinate at zero is a
  limiting density value, not an observed zero or point mass. The plot stops at
  10 mg/L, beyond which about 1.5939792% of model probability remains. Normal
  log-ratio reference coordinates span four SDs either side of their mean. All
  reference lines use authored samples joined approximately for drawing; neither
  mathematical model is truncated or renormalized to the displayed domain.
- Population median and population geometric mean are both 2 mg/L. Their equality
  follows from the lognormal model; its normal log ratio has finite expectation.
  The arithmetic expectation is 2.649569517457731 mg/L. These are not the empirical
  sample summaries: the constructed sample has arithmetic mean 2.5898149491398517
  mg/L and geometric mean 2 mg/L. Equal geometric means here are by construction.
- Exponentiating an arithmetic mean of sample log ratios and restoring the reference
  gives the sample geometric mean, not generally the arithmetic concentration mean.
  The population expectation formula is not asserted as a universal bias correction
  for arbitrary transformations or fitted regressions.
- Real zeros have no finite log; adding an arbitrary offset changes the variable.
  Below-detection/quantification results are censored information, not known zeros;
  missing values differ again. Mixtures and dependence require investigation.
  Neither positivity nor a log transformation establishes normality.

## Reuse and scope

The sole new semantic source is `ontology/dataset/chemometrics-level5-lognormal.trig`.
It reuses the existing histogram reference curves from ADR-0022, complete line-chart
annotations from ADR-0021, definition cards and semantic layouts. No renderer, Core
contract, compiler, SHACL rule, CSS or accepted Levels 0-4 content is changed in this
increment. JSON remains disposable generated preview transport. The R stats
Lognormal manual was consulted for the model and summary relationships.

On narrow screens the original-scale histogram retains its bars, reference and
caption. The existing `visual-formula` layout prioritizes complete formulas/legends
and authored numerical chart descriptions for L12b/L12c rather than shrinking the
plots and mathematical text. Labels distinguish summary markers through text as
well as their position. No personal data, network service or learner-state storage
is added.

C13/C14 sampling distributions and the central limit theorem are not started here.
Their later specified simulation parameters are a separate teaching model, not an
implicit claim that this small L12 illustration has mean 10 and SD 9 mg/L. K-S and
Pearson tests and overall lecture timing remain later work.

## Verification

- Preview generation produces thirty scenes.
- All 55 targeted Level-5 Python tests pass. Eight new tests verify exact pairing,
  logarithms and reference units, preserved counts/areas, normal and lognormal
  coordinates, model tail probability, population versus sample summaries, complete
  same-slide legends, language, static alternatives and scientific guardrails.
- Edge and Firefox pass all four new scenes at 1731 x 1006 light, 1280 x 720 dark
  and 390 x 844 light. Checks cover no content controls/questions/reveal fragments,
  no KaTeX errors, complete visible formula legends, all twenty values counted in
  each histogram, separate reference curves, absence of observation markers and
  immediate median/mean annotations. Representative screenshots visually reviewed.
- The complete thirty-scene preview also passes that browser matrix in both
  engines. Native PageDown traversal reaches all thirty slides with only the six
  original comparison advances. PageUp reverses L12 without extra reveals.
- `git diff --check` passes, with existing line-ending warnings only.
- Final semantic validation passes (`Conforms: True`) for dataset fingerprint
  `73fd4ae7b9d3c7d167d427ecd261262c84c54b1f071f36497bb6e76819d3524d`.
  The full `npm test` passes for the L12 increment: 611 Python tests and all Node
  suites. Their logs are
  `C:/Users/PCUser/AppData/Local/Temp/opencode/level5-l12-final-semantics.log` and
  `C:/Users/PCUser/AppData/Local/Temp/opencode/level5-l12-final-npm-test.log`.
  The prior N10/N11 results are not evidence for this increment.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-l12a-scene--scene>

Run `npm run preview:level5` if the local preview server is not already running.

The following C13 increment is documented in
[the sampling-means review](chemometrics-level5-sampling-means-review.md).
