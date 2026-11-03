# Level 5: population inference as the lecture's governing purpose

Local, uncommitted, unpushed and unpublished. Implements the instructor-approved
[whole-lecture review](chemometrics-level5-population-inference-review.md), rather
than limiting the change to the Normal introduction. All 70 main and six reserve
scenes were revisited. This document distinguishes implementation from completed
validation; pending checks below are not passing evidence.

## The investigation story

The lesson now asks what selected, analysed samples tell us about a defined
investigation target. In the hypothetical nitrate example the target is the
volume-weighted mean concentration in a defined water body at one fixed survey time.
It is not a claim that concentration is spatially constant, nor a legal definition,
real monitoring design or measured field result.

The recurring sequence is target and scope, selection of environmental units,
analysis of collected samples, estimation and uncertainty, then a scoped report.
Distribution names remain in the subtle topic footer. Headings, existing cards,
chart context and narration now explain each block's role in that sequence.
There are no new scenes, hidden stages, runtime features or styles in this increment.

| Block | Implemented role |
| --- | --- |
| B01-B06 | Selected samples inform population positive-finding frequency. Binomial describes sampling-count variation; assay findings are not automatically true prevalence. The starting story remains PFAS, not a general recap. |
| P07 | A selected water volume informs detected particle intensity. The denominator/exposure and limits of environmental transfer are explicit. Assumed intensity is not fitted to the three filter illustrations. |
| D08 | PMF, PDF, CDF and quantiles are probability tools supporting subsequent sampling/reference calculations. A probability range is not an interval for an unknown mean. |
| N09-N10 | Laboratory variation is one component of a water investigation. Normal-error assumptions and probability/quantile exercises remain, but next-result prediction is no longer the motivating investigation goal. |
| N11 | Within-sample analytical variation and between-unit environmental heterogeneity are distinct. Selection of locations/depths must relate to the target volume. |
| L12 | The model/scale may change without silently changing the investigation target. A geometric mean or median cannot replace the requested arithmetic mean merely because the data are skewed. |
| C13 | The existing independent simulation becomes the central environmental-estimation illustration. Four simulated water units give an estimate, not guaranteed truth. |
| C14 | Sampling distributions and CLT explain estimator precision under assumptions, not creation of representativeness or removal of selection bias. |
| S15 | Explicit return to the separate laboratory component. Its normal SD 0.316 is distinguished from the earlier analytical SD 0.30 and environmental SD 9 mg/L. Its estimated SE is not environmental SE. |
| T16 | Chi-square/t explain uncertainty from estimated analytical spread under iid normal sampling. The existing interval is explicitly analytical, not a water-body interval. |
| F17 | Method-precision comparison informs the analytical component, not environmental representativeness. Missing method sample sizes are still not invented. |
| G19 | Model discrepancy is distinguished from estimation error and representative selection. KS non-rejection cannot verify the sampling design. |
| P20 | Particle-size proportions are a separate target. Pearson's conditional decision concerns those probabilities, not water quality or representativeness. |
| E18 | Report target, selection model, simulated estimate and the uncertainty actually covered. End with an explicit prohibition on turning a laboratory interval into an environmental claim. |
| V01-V03 reserve | Classification, true-state prevalence and concentration-dependent detection are analytical/observation layers, not interchangeable population estimates or sampling validation. |

## Concrete result and its limits

The existing C13 sample remains four independent simulated draws, approximately
3.677657, 10.308606, 2.394771 and 4.344606 mg/L. Their arithmetic mean is
5.181410018887113 mg/L, shown as 5.18. The added interpretation assumes independent
equal-chance selection of equal-volume water units at the fixed survey time.
This idealized model connects the sample arithmetic mean to the volume-weighted
target. Unequal selection, stratification or spatial dependence would require the
corresponding weighting and uncertainty calculations. No validated field design
or environmental measurements have been supplied or claimed.

The population mean 10 and SD 9 mg/L remain specified simulation benchmarks, known
only so that the estimator can be studied against truth. In an actual investigation
they are unknown. The 5,000 simulated investigations illustrate repeated-sampling
variation; 5,000 physical surveys are not required to report one estimate.

The closing report now returns to that same 5.18 mg/L estimate. At sample size four,
the existing C14 calculation gives model sampling SD 4.5 mg/L. This is not a
confidence interval estimated from the four values and not total measurement
uncertainty. In particular, no exact Student-t interval is asserted for the four-value
lognormal environmental example. The simulation isolates sampling variation by
assuming the analytical contribution negligible for this demonstration.

The original five nitrate values 9.6, 9.8, 10.0, 10.2 and 10.4 mg/L remain repeats
of one collected homogeneous sample. They are never relabelled as five independent
environmental units. Their SE 0.141421 and t interval about 9.60735-10.39265 mg/L
describe the common analytical expectation under the stated normal assumptions.
They exclude environmental sampling variation and systematic bias. Without bias
control that interval need not cover even the collected sample's true concentration.
The existing comparison with 9.5 mg/L remains in that analytical scope.

## Preservation and accessibility

- Both generated paths retain their scene identities and order, 70 main plus six
  reserve scenes. There are still only six original comparison advances.
- A deterministic before/after comparison of the main transport confirms every
  numeric value, every mathematical expression and every block reading order is
  unchanged. The baseline is disposable local evidence, not a semantic source.
- All formula resources retain their linked, same-slide authored symbol legends.
  Some legends now explicitly identify laboratory versus environmental units.
- All rendered main/reserve text, narration and static projection use English
  measurement language; no human-facing “reading”/“readings”, em dashes or audience
  questions remain in the 76 compiled scenes. Semantic IDs remain stable.
- Existing cards, chart types and composition families are reused. No application,
  renderer, compiler or CSS change is made for this increment. Accepted Levels 0-4
  and deployments are not modified by these content edits.
- There is no new learner data collection, network dependency, persistence or
  pedagogical-effectiveness claim. Existing fixed legends and static alternatives
  remain available. Layout and navigation are checked separately from subject review.

## Verification status

Six new population-inference tests pass, covering all 76 scenes' terminology/topic
coverage, visible target-selection-analysis separation, environmental versus laboratory
data identity, analytical-interval scope, honest final reporting and the limits of
model-fit/method comparisons. Five updated continuity tests pass separately.

The first broader test run exposed stale text assertions, not numeric failures.
Those assertions were revised to test the new instructor-approved purpose while
preserving the calculations, assumptions and coverage checks. It also caught the
old future-result framing assertions. The first browser runs caught one unintended
question in the sampling card; it has been made declarative.

Current evidence and pending runs, all logs under
`C:\Users\PCUser\AppData\Local\Temp\opencode`:

- Main and reserve preview generation succeed with 70 and six scenes.
- Before/after deterministic main comparison passes for numeric transport values,
  formulas, scene order and reading orders. Baseline: `level5-before-population-main.json`.
- Edge passes all six revised stories at desktop light 1731 x 1006, desktop dark
  1280 x 720 and phone light 390 x 844, including formula-free stories and separation
  of topic/story text from navigation controls.
- Both Edge and Firefox pass the full reserve matrix and native forward/reverse
  reserve traversal in those three configurations.
- Both engines pass native main traversal of all 70 slides with six comparison
  advances. Edge also passes the full C13 and E18 block matrices; representative
  target/sampling/analysis, estimate and closing-report screenshots were inspected
  in desktop, dark and phone views.
- Broader targeted regression passes all 147 tests before the final mobile card
  shortening:
  `level5-inference-targeted-final.log`. Its unittest summary is `OK`; PowerShell's
  redirected invocation nevertheless reports exit code 1, as in earlier local runs.
- The Firefox matrix passed all 70 scenes in both desktop configurations and the
  first 23 phone scenes, then exposed horizontal overflow in the two-card N10c view.
  The card heading/body were shortened without changing the target or calculation.
  `level5-inference-firefox-phone-recheck.log` passes N10c through the final scene
  on the corrected phone view; its screenshot was inspected. Edge passes the full
  N10/N11 block in all three configurations after the correction. The six
  population-inference tests also pass again after that edit.
- Edge's phone suffix recheck passed N10c through G19c before the foreground command
  timeout, with no assertion failure. The remaining tail subsequently passed in
  `level5-inference-edge-phone-tail.log`; the timeout itself is not a pass.
  The original complete Edge run also finished successfully across all 70 scenes
  in all three configurations: `level5-inference-edge-final.log`. Since the N10c
  correction occurred during that long run, its exact corrected view is supported
  separately by the completed N10/N11 matrix and phone suffix checks above.
- SHACL validation conformed before the final card shortening:
  `level5-inference-semantics.log`.
  Dataset fingerprint:
  `c1a5cdbebac4d68196067f26a3e768aec93d5f15d48058a12df444fef5d0b76c`.
- The initial authoritative run `level5-inference-npm-test.log` was explicitly
  stopped before the mobile card correction and is not acceptance evidence.
  The new authoritative `npm test` completed successfully on the corrected,
  unchanged source: all 703 Python tests and all Node suites pass.
  Log: `level5-inference-final-npm-test.log`. It includes semantic validation and
  the full application/Core/renderer regressions. Semantic/feature sources remained
  unchanged during the run. Final dataset fingerprint:
  `ef403e202b74f238d0b40705defc873026bc8fa29746c97a3a6306bcb017c60b`.
- `git diff --check` passes with line-ending warnings only.

The hypothetical target scope is a teaching assumption, not a decision for a real
sampling programme. Total lecture timing still needs review; no extra duration or
removal of accepted material is assumed.

## Local review links

- Investigation opening:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-b01-scene--scene>
- Target, sampling and analysis:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-n09-story2-scene--scene>
- The environmental mean estimate:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-c13b-scene--scene>
- Scoped closing report:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-e18a-scene--scene>
