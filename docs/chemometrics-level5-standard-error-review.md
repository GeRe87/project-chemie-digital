# Level 5: S15 standard error

Local authoring review, 2026-10-31. No commit, push, publication or deployment.
Four complete English views extend the preview to forty-two scenes. T16 and
confidence intervals remain separate, not implemented in this increment.

## Lecture views

| Scene | Complete explanation |
| --- | --- |
| S15a | Five constructed nitrate repeat readings, mean 10.0 mg/L and individual-reading sample SD about 0.316 mg/L |
| S15b | 5,000 simulated five-reading means compared with a separately specified individual density |
| S15c | Sample SD versus estimated SE about 0.141 mg/L, with the estimation hat explicit |
| S15d | Constant bias shifts the center; more repeats do not correct it, repair dependence or cover all measurement uncertainty |

The blueprint's six stages are consolidated into four views. No on-slide controls,
audience questions, quizzes or internal reveal steps are needed. Full explanations
and calculations are available immediately, with supporting details in narration.
Formula legends are authored separately for each formula, linked by `dct:hasPart`
and shown on the same slide using the existing shared renderer. The final view
uses complete comparison cards, not a staged animation: reference 10.0 mg/L,
biased expected center 10.2 mg/L at both five and eighty repeats.

## Arithmetic and scientific boundaries

- The five idealized readings are 9.6, 9.8, 10.0, 10.2 and 10.4 mg/L. Their mean
  is 10.0; squared deviations sum to 0.40 (mg/L) squared. Dividing by four gives
  sample variance 0.10 (mg/L) squared and sample SD 0.31622776601683794 mg/L.
- Divide the unrounded SD by the square root of five to obtain estimated SE
  0.1414213562373095 mg/L. It is a data-dependent estimate of sampling SD, not
  individual spread, an exact known error, a confidence-interval half-width or
  the complete measurement uncertainty.
- The simulation explicitly switches from C13/C14's lognormal population to a
  separate normal teaching model: chosen mean 10 and individual SD the square
  root of 0.10. These constants match the example's scale but are not established
  true parameters inferred from the five readings. The readings do not establish
  normality. Under the specified iid normal model, means are exactly normal even
  at size five; this is not a size-five CLT guarantee.
- The fixed simulation uses Mulberry32 seed 20261031 and uncached cosine
  Box-Muller, two uniforms per individual. It draws 5,000 fresh samples of five,
  25,000 individual values in total, without resampling the observed readings,
  rejection or forcing realized moments. All 5,000 means lie inside 24 fixed
  width-0.1 bins over 8.8 to 11.2 mg/L. No means are dropped or renormalized.
- Published frequencies use named RDF lists and empty raw chart data. No
  artificial midpoint observations are reconstructed. The individual density
  uses separate theoretical coordinates and a common density scale, never enters
  observation totals, and has support beyond the plot. Linear drawing segments
  approximate the theoretical reference.
- The bias scenario is explicitly hypothetical, not inferred from the readings.
  A constant +0.2 mg/L offset keeps the expected mean at 10.2 when moving from
  five to eighty repeats. Only random sampling SD shrinks, from approximately
  0.1414 to 0.03536 mg/L under the specified independent-error assumptions.
- Dependence can invalidate the simple SE rule. Narration explains the sum of
  pairwise covariances, including off-diagonal terms. Technical repeats do not
  create independent environmental samples or establish representativeness.
  Calibration, reference values and preparation can add uncertainty.

## Reuse, accessibility and privacy

Only semantic content and tests are added. Existing dot plots, complete bar charts,
published-count histograms, density references, formula legends and definition cards
are reused without new CSS, scene-ID styling, renderer changes or schema changes.
All authored text, narration and numerical alternatives are English. Mobile formula
views retain numerical captions and full legends through the existing responsive
layout. The SD/SE comparison is labelled, not encoded only by color.

No personal data, learner storage or network service is introduced. Accepted
Levels 0-4 and deployment targets are unchanged. The blueprint's unavailable extra
Markdown source is not claimed as reviewed. Overall timing remains unresolved.

## Verification

- Preview generation: 42 scenes.
- All 77 targeted Level-5 Python tests pass, including seven new S15 tests for
  unrounded arithmetic, independent Python/JavaScript replay, every histogram
  count, theoretical reference coordinates, formula legends and guardrails.
- Edge and Firefox pass all four S15 scenes at 1731 x 1006 light, 1280 x 720 dark
  and 390 x 844 light. Checks include full legends, no questions/controls/reveals,
  five raw-reading points and a separate mean marker, and all 5,000 means in
  24 bins with a separate reference curve. Representative screenshots reviewed.
- Native PageDown traversal passes all 42 slides in both engines with only the
  six existing comparison advances. PageUp reverses S15 and C14 without extra reveals.
- `git diff --check` passes with line-ending warnings only.
- S15-source semantic validation conforms with fingerprint
  `1ad7811fa94e3daac5c79a32a5475c28aff90135d265701190fcd0064e4de367`.
- The earlier C14 full `npm test` process completed successfully (626 Python tests
  and all Node suites). It predates S15 and does not establish S15's full-suite
  result. Current validation status is recorded in the following T16 review.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-s15a-scene--scene>

The following increment is documented in
[the Student-t review](chemometrics-level5-student-t-review.md).
