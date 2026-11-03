# Level 5: P20 Pearson chi-square goodness of fit

Local authoring review, 2026-11-01. No commit, push, publication or deployment.
Five complete English views follow KS and precede the closing E18 views. Preview
total: 64 scenes. This is the user's requested addition, not a block specified in
the original blueprint. Overall lecture timing remains unresolved.

## Complete views

| Scene | Explanation |
| --- | --- |
| P20a | Observed and null-expected counts in five predeclared particle-size bands |
| P20b | All five Pearson contributions and their sum |
| P20c | Approximate chi-square reference and category-based degrees of freedom |
| P20d | Fully worked conditional rejection, reference cutoff and approximate p value |
| P20e | Expected-count checks, fitting, classes, sampling and distinction from classical KS |

No audience question, quiz, slider, extra reveal or unsolved calculation is added.
Three formulas have separate complete authored legends linked by `dct:hasPart`,
visible on the same slide through the shared renderer.

## Constructed example and scientific distinctions

- The example uses 100 hypothetical iid particle classifications, not measured
  monitoring data or a regrouping of the five KS concentrations. Diameter bands
  are below 5, 5 to below 10, 10 to below 20, 20 to below 40 and at least 40
  micrometres. Diameters are nonnegative, lower bounds are included, finite upper
  bounds excluded, and the last band retains the entire upper tail.
- Prespecified probabilities are 0.10, 0.20, 0.40, 0.20, 0.10. Multiplying by fixed
  total 100 gives expected counts 10, 20, 40, 20, 10. Observed counts are
  4, 12, 44, 24, 16. Both totals are 100; expected counts are not extra observations.
- Contributions are 3.6, 3.2, 0.4, 0.8, 3.6, summing to dimensionless Q = 11.6.
  The largest observed count need not produce the largest weighted discrepancy.
  Squaring loses the direction of departure, so preserve the original comparison.
- With five fixed positive category probabilities and no fitted parameters, the
  approximate reference has four degrees of freedom, not 99. The fixed total gives
  one constraint. The existing chi-square-four curve is reused, but here it is an
  asymptotic multinomial reference, not T16's exact normal-sample variance law.
- The reference upper-tail 5% cutoff is 9.487729036781154. At Q = 11.6 its survival
  probability is 0.020587372268555542. The survival calculation is exact for the
  chi-square-four reference, but applying it to finite multinomial counts gives
  an approximate p value, not an exact finite-sample multinomial result.
- Reject these specified category probabilities at the prespecified nominal 5%
  level using the approximation and assumptions. This is not a probability that
  the null is false, proof of a particular alternative distribution or a diagnosis
  of contamination, dependence or measurement bias. Global rejection is not five
  separate post-hoc class tests or a measure of practical importance.
- Expected counts, not observed counts, govern the usual approximation check.
  The first observed count is 4 but its expected count is 10; all expectations
  are at least 10. A common expected-count guide of 5 is not a universal guarantee.
  Observed-zero categories with positive null probabilities remain in the sum.
  A positive observation in a zero-probability category is a null-impossible event,
  not a denominator to divide by.
- Sparse expectations may require justified pooling or exact/simulation calibration.
  Pooling changes category count and must be reflected in the reference. Do not
  discard tail bins or optimize classes after inspecting departures.
- The familiar subtraction of fitted parameter count requires appropriate regular
  estimation of identifiable parameters, commonly from grouped multinomial likelihood.
  It is not automatically valid for ungrouped estimation or arbitrary fitting rules.
  Simulation must reproduce fitting and any adaptive category-selection procedure.
- Dependence invalidates the simple iid reference. Pearson can compare discrete
  category outcomes, whereas the classical KS calibration uses a fixed continuous
  CDF and unbinned data. Grouped counts lose within-band information and cannot
  reconstruct a KS statistic or raw observations.

## Reuse, sources, accessibility and privacy

Content lives in `ontology/dataset/chemometrics-level5-pearson.trig` and numeric
counts/contributions in `chemometrics-level5-pearson-data.trig`, with named-graph
identity and derivation links preserved. Existing complete grouped bar charts,
single-series bars, chi-square reference coordinates, formula units and definition
cards are reused. No new CSS, Core, renderer, compiler or SHACL capability is needed.

NIST/SEMATECH's chi-square goodness-of-fit handbook page was read and recorded as
a semantic Source. Its distinction between grouped fitting and ungrouped parameter
estimation is retained, rather than presenting an unconditional degrees-of-freedom
subtraction. The unavailable supplementary blueprint Markdown is not claimed as read.

Observed/expected series have an explicit legend and numerical caption, not just
different colors. All authored text, narration and static alternatives are English;
existing mobile layouts preserve captions and formula legends. No learner data,
persistence, live network-dependent lecture element or deployment is introduced.
Accepted Levels 0-4 remain untouched.

E18 moves to positions 63 and 64, retaining its cards and reference calculation.
Only its stale narration about a planned Pearson addition is updated to summarize
the implemented KS/Pearson distinction. KS tests now locate the closing scene by
identity rather than assuming that no later extension can be inserted before it.

## Verification

- Preview generation: 64 scenes.
- All 110 targeted Level-5 Python tests pass, including seven new Pearson tests for
  grouped counts, total preservation, expected probabilities, each contribution,
  ordered categories, reference degrees of freedom, cutoff and approximate p value,
  same-slide legends, static alternatives and scientific guardrails. Independent
  Simpson integration checks the reference survival calculations.
- Edge and Firefox pass all five new scenes at 1731 x 1006 light, 1280 x 720 dark
  and 390 x 844 light. Checks include ten grouped observed/expected bars, two
  non-overlapping legend items, five contribution bars, the shared reference trace,
  full legends and no questions/controls/reveal stages or text overflow. Representative
  desktop and mobile screenshots reviewed.
- Native PageDown traversal passes all 64 slides in Edge and Firefox, with only
  the six original comparison advances. PageUp reverses the additions and preceding
  blocks without extra internal reveals.
- `git diff --check` passes with line-ending warnings only.
- The earlier E18 full regression failed while source was changing: fourteen setup
  errors reported noncontiguous path positions, and deterministic serialization
  compared different source fingerprints. Current preview generation and all 110
  Level-5 tests pass on the now-stable source. All seven language-projection tests,
  including the failed deterministic serialization case, also pass when rerun on
  this unchanged source. No speculative feature-code fix is made for that mixed-basis
  run; it is not accepted as validation evidence.
- The full `npm test` run started on the initial Pearson source completed with
  18 SHACL-related failures across 666 Python tests, reflecting the integer literals
  in its pre-correction dataset snapshot. Log:
  `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-pearson-current-npm-test.log`.
  This is not current-source evidence. The fresh `npm test` run on the corrected
  source completed successfully: all 666 Python tests and all Node suites pass. Log:
  `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-pearson-corrected-npm-test.log`.
  Semantic/feature sources remained unchanged during this run. This is the final
  current-source full-regression result for the 64-scene preview.
- Initial semantic validation rejected ten integer-typed count literals because the
  existing Observation contract requires `xsd:decimal`. They are corrected to decimal
  literals without changing values or arithmetic. Regression assertions now check all
  fifteen observed/expected/contribution datatypes, without weakening the schema.
- Corrected-source semantic validation conforms with fingerprint
  `da4782d3fefaf1e0810b9ff774dc159d44c3c0467eece3ae1acec275b9405bf6`.
  Log: `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-pearson-corrected-semantics.log`.
  All 110 targeted tests pass again, preview generation still produces 64 scenes,
  and both browser matrices pass all five Pearson views on this corrected source.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-p20a-scene--scene>
