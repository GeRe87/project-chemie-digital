# Issue #216 — Nine-scene Variables and Constants story

## Scientific correction

A **variable** does not automatically have a probability distribution. Experimental inputs such as deliberately assigned calibration concentrations are variables because their values differ within the experiment, but they are not random variables merely for that reason.

The new narrative distinguishes:
- variable: characteristic/quantity that may take different values;
- observation/realization: one concrete recorded value x_i;
- sample: a collection of observations/observational units;
- random variable: stochastic-model quantity whose possible realizations are described by a probability distribution;
- constant: fixed within the stated scope.

The distribution resource now explicitly distinguishes empirical from probability distributions and no longer asserts Variable as a blanket prerequisite.

## Nine scenes

1. title only
2. Variable sourced definition card
3. live simulated repeated-measurement table + line chart
4. independent/dependent variables through y=f(x) + three example functions
5. x → x_i → sample, plus explicit optional random-variable model / distribution note
6. minimal read-only executable webR: rnorm(1, mean = 3.0, sd = 0.2)
7. Constant sourced definition card
8. UV/Vis example: assigned concentration variable, fixed 540 nm constant, measured absorbance response
9. three-question role quiz

## Generic runtime

ChartDefinition may opt into live illustrative jitter with:
- cd:liveUpdateIntervalMs
- cd:liveJitterAmplitude
- cd:liveDecimalPlaces

The SceneDocument exposes this as ChartBlock.liveUpdate. Static Pitch chart mounting skips such blocks and the generic live-chart runtime updates the first chart series/bar data plus its companion table. Reduced-motion mode disables periodic updates.

## Verify

```powershell
npm run check:semantics
python -m unittest tests.test_chemometrics_variables_constants_content tests.test_chemometrics_random_variables_path tests.test_chemometrics_random_variables_scenes -v
npm run test:core
npm run test:renderer-reveal
npm run test:pitch
npm run pitch:intro
```

For webR use the interactive query parameter supported by Pitch.


## Contract hardening before verification

The live-chart completeness SHACL query was rewritten using portable `UNION` / `FILTER NOT EXISTS` clauses rather than relying on SPARQL `BIND(EXISTS ...)` support. Core SceneDocument tests now explicitly accept valid live update metadata and reject too-fast intervals, non-positive jitter amplitudes and unsupported decimal precision.
