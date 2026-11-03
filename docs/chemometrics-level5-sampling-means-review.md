# Level 5: C13, from individual values to sample means

Local review, 2026-10-31. No commit, push, publication or deployment.
Three complete scenes extend the local preview from thirty to thirty-three scenes.

## Lecture sequence

| Scene | Complete explanation |
| --- | --- |
| C13a | A new synthetic lognormal population with individual expectation 10 and population SD 9 mg/L |
| C13b | First four independently drawn model values and their arithmetic mean, approximately 5.18 mg/L |
| C13c | A histogram of 5,000 means from 5,000 fresh four-value samples, with the unchanged individual-population density as reference |

All authored text, narration, labels and alternatives are English. Every scene is
complete on entry. There are no questions, controls, quizzes or additional reveal
fragments. The blueprint's staged simulation sequence is adapted to the agreed
three-view explanation; intermediate repetition counts do not create click steps.
Both formulas have complete linked authored symbol legends on the same slide.

## Model and reproducibility

- This uses the blueprint's new individual-value model, not the L12 example's
  parameters. Reference concentration is 1 mg/L; dimensionless log mean is
  2.0059216703551788 and log SD 0.7702771223902047. These imply expectation 10 and
  variance 81 on the original concentration scale.
- The authored protocol uses Mulberry32 seed 20261031 and the uncached cosine
  Box-Muller transform. The radial uniform is 1-u; each individual consumes two
  PRNG outputs. Each sample uses four new draws from the specified model. This is
  not a bootstrap from observed data, reuse of the same four values or a forced
  symmetric/balanced sample. Fixed pseudorandom output approximates the independent
  mathematical draws and is not evidence of physical sampling or independence.
- First sample: 3.6776570580960026, 10.308605666047372, 2.3947714985271094 and
  4.344605852877969 mg/L. Its unrounded mean is 5.181410018887113 mg/L. A separate
  labelled summary marker is not a fifth individual value. The first sample enters
  the 5,000-sample collection once.
- The histogram contains 5,000 means from 20,000 individual draws. All means are
  counted: minimum 2.0790953584438268 and maximum 44.51649509643375 mg/L. Bins span
  0 to 80 mg/L in widths of 2. No tail entries of this simulated collection are
  discarded, renormalized away or assigned to an arbitrary last bucket.
- This run's average of means is 9.99967656233794 mg/L and descriptive divisor-5000
  SD is 4.429316292559388 mg/L. These are simulation results, not forced exact
  population values. The mean distribution remains right-skewed at sample size four.
  No normality claim or CLT formula is introduced before C14.
- The exact published count vector is stored in TriG alongside the protocol. The
  histogram renderer does not fabricate bin-midpoint observations. Replaying the
  authored protocol reproduces the first sample, every mean and every bin count.
  The 100- and 1,000-sample replays preserve the same initial draws as the 5,000 run.

## Visual distinction and scales

C13a and C13c share concentration domain 0 to 80 mg/L and density units L/mg. The
reference in C13c is the exact same authored individual-population curve as C13a.
Bars are sample-mean frequencies; the caption explicitly identifies bars and line.
No raw individual observations are pooled into the means histogram. The population
itself is not changed or made symmetric.

C13b is explicitly a detail view of one sample, not a density-shape comparison.
Its numeric concentration axis and marker legend distinguish four individual values
from their statistic. On narrow screens the existing formula layout preserves its
numerical description and full formula/legend rather than shrinking the plot.

The finite theoretical curve drawing is not the complete model support: its right
tail continues beyond 80 mg/L. The population line is sampled for drawing and is
not an exact density polygon. C13c uses a single density scale for bars and reference,
with no secondary axis or unlabelled concentration zoom.

## Shared implementation and boundaries

See ADR-0023 for the additive published-count histogram capability. Existing line,
dot/summary, histogram/reference and formula/legend components are reused. The only
new semantic property is `cd:binCounts`, an RDF-list relation on Dataset. Existing
raw histograms and their document versions remain unchanged by omission.

Authored resources are in `ontology/dataset/chemometrics-level5-sampling-means.trig`.
The simulation protocol is an authored WorkedExample, not runtime lecture code or
a new code runner. Generated JSON remains disposable transport. No new CSS or
scene-ID styling is added. No accepted Levels 0-4 content, deployment, network
service, personal data or learner-state storage is changed. C14 and later tests
remain outside this increment; overall lecture timing is unresolved.

## Verification

- Preview generation produces thirty-three scenes.
- All 63 targeted Level-5 Python tests pass. Eight new tests cover replay, first sample/mean, model moments/density,
  all 5,000 published counts, unchanged comparison domains, complete legends,
  language, invalid counts through compiler/SHACL and numerical static alternatives.
- All 143 Core tests and 95 D3 tests pass, including published-count validation,
  no midpoint reconstruction, count preservation and mount cleanup.
- Edge and Firefox pass the three new scenes at 1731 x 1006 light, 1280 x 720 dark
  and 390 x 844 light. Browser checks cover no controls/questions/reveal fragments,
  full formula legends, four individual points plus one summary, forty bins summing
  to 5,000 and a separate population reference. Representative screenshots reviewed.
- All thirty-three scenes pass the same browser matrix in both engines. Native
  PageDown traversal reaches all thirty-three slides with only the six original
  binomial comparison advances; PageUp reverses C13 without extra reveals.
- Final semantic validation passes (`Conforms: True`) for dataset fingerprint
  `2ad93493ca2e2641c0232a0ce1e61398543cd67fe5d16e99f8821ef5bcab8c37`.
  Log: `C:/Users/PCUser/AppData/Local/Temp/opencode/level5-c13-current-semantics.log`.
- `git diff --check` passes with existing line-ending warnings only.
- The full `npm test` passes: 619 Python tests and all Node suites. Log:
  `C:/Users/PCUser/AppData/Local/Temp/opencode/level5-c13-final-npm-test.log`.
  Earlier L12 results are not evidence for this increment.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-c13a-scene--scene>

The following C14 increment is documented in
[the central-limit review](chemometrics-level5-clt-review.md).
