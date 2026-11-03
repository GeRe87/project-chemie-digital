# Level 5: G19 Kolmogorov-Smirnov goodness of fit

Local authoring review, 2026-11-01. No commit, push, publication or deployment.
Five complete English scenes are inserted after F17 and before E18. Preview total:
59 scenes. Pearson chi-square remains the next separate addition, not implemented
here. The blueprint has no KS block; this implements the user's requested extension.

The subsequent [Pearson increment](chemometrics-level5-pearson-review.md) adds five
views between KS and E18, bringing the preview to 64 scenes. The statistics and
formulas of this KS block are unchanged.

## Complete views

| Scene | Explanation |
| --- | --- |
| G19a | Right-continuous empirical CDF of five new constructed concentrations |
| G19b | Fixed continuous model CDF and the supremum absolute vertical distance |
| G19c | Both sides of every empirical jump; complete directional-gap calculation |
| G19d | Exact finite-sample 5% rejection cutoff, worked non-rejection and interpretation |
| G19e | Fitted parameters, discrete/rounded data, dependence and limits of non-rejection |

All explanations are complete on entry, with no audience question, quiz, slider or
extra reveal. Three formulas have separate complete authored symbol legends linked
by `dct:hasPart`, shown on the same slide through the shared formula component.

## Example and mathematical safeguards

- Use new constructed readings 9.4, 9.8, 10.0, 10.2 and 10.6 mg/L, not S15's
  symmetric readings. Each contributes once to the right-continuous ECDF, with
  an included jump value and a distinct left limit.
- Specify a normal null CDF with mean 10 and SD 0.50 mg/L before seeing these data.
  Neither parameter is estimated here. The sample's matching mean is a deliberate
  construction coincidence, not a fitted mean; its sample SD is about 0.447214.
- The two-sided one-sample statistic compares cumulative probabilities, not density
  heights or horizontal distances. Calculation uses the analytic CDF, not the
  approximate drawing, a histogram or a finite scan grid.
- Model CDFs at the five ordered readings are approximately 0.115070, 0.344578,
  0.500000, 0.655422 and 0.884930. Right-side empirical-minus-model gaps peak at
  10.2 mg/L; model-minus-left-limit gaps peak at 9.8 mg/L. Both maxima are about
  0.1445782583896764. Checking only included values can miss a discrepancy on
  the other side of an empirical jump.
- Prespecify significance level 5%. The exact n-five continuous-null cutoff is
  0.5632751983660635. It is not the large-sample 1.36 divided by square root of
  size approximation. Observed D is below the cutoff, so do not reject this fixed
  model. No observed p value is claimed.
- The authored finite-sum calibration protocol uses the exact one-sided Smirnov
  tail doubled only where the two crossing events are disjoint, at distances
  above one half. That shortcut is explicitly rejected for the smaller observed D.
  Tests independently verify 95% null probability below the cutoff by exact
  piecewise-polynomial integration over the constrained ordered-uniform simplex.
- Non-rejection is not evidence that the model is true, nor a probability of its
  truth. Five observations give limited power. KS is not especially tail-sensitive
  and does not establish accuracy, independence or environmental representativeness.
- Fitting parameters from the same observations invalidates unchanged fixed-CDF
  calibration. Narration names an applicable Lilliefors correction or parametric
  bootstrap with the entire fitting step repeated in each replicate. Other fitted
  families, counts, rounding/ties, grouping, censoring and dependence require
  matching procedures and assumptions.

## Reuse, source and integration

Existing step-after and complete linear charts, point visibility, exact y domains,
definition cards and formula legends are reused. No Core, renderer, compiler, SHACL
or CSS capability is introduced. Because interpolation is chart-level, ECDF and
smooth null CDF use separate adjacent views with identical concentration domain
9 to 11 mg/L and probability domain 0 to 1, rather than misrendering either curve.
Normal support extends outside the plot. The separate two-trace gap figure contains
computed discrepancies, not raw observations or another CDF; solid/dashed styles
and captions distinguish directions without relying on color alone.

The calibration and interpretation use concise complete cards instead of a tall
bar-chart/prose combination, retaining all numbers visibly on phone screens without
new layout styling. All authored text, narration and alternatives are English.

NIST/SEMATECH's KS handbook page was read for the statistic and calibration caveats
and is authored as a semantic Source with support links. Its unrelated prose and
examples are not copied into the lecture. The missing supplementary blueprint
Markdown remains unavailable and is not claimed as read.

E18 moves to positions 58 and 59 so synthesis stays last. Its closing-test selection
uses exact scene identities instead of a fixed slice. Only its now-stale narration
about a still-planned KS extension is updated; its cards and reference calculation
are preserved. Accepted Levels 0-4 remain untouched. No personal data, learner
storage, network-dependent lecture component or deployment is introduced. Overall
lecture timing remains unresolved.

## Verification

- Preview generation: 59 scenes.
- All 103 targeted Level-5 Python tests pass, including seven new KS tests covering
  ECDF counts/right-continuity, analytic normal values, both directional gaps and
  maxima, exact cutoff replay plus independent order-statistic integration,
  complete same-slide legends, guardrails, placement and static alternatives.
- Edge and Firefox pass all five KS scenes at 1731 x 1006 light, 1280 x 720 dark and
  390 x 844 light. Checks include five open ECDF left-limit markers, no apparent
  observation points on the model curve, two computed-gap traces, complete legends,
  no questions/controls/reveals and text/viewport fit. Screenshots reviewed.
- Both E18 views pass the same browser configurations after reordering and narration
  updates. Native PageDown traversal passes all 59 slides in Edge and Firefox with
  only the six original comparison advances; reverse traversal of the added block
  and preceding slides requires no internal reveals. The combined native run timed
  out after the Edge pass; a separate Firefox run completed successfully.
- `git diff --check` passes with line-ending warnings only.
- Current-source semantic validation conforms with fingerprint
  `89af5ac0520aca026d132f8ca2b9e179291677351265d9123a3d738f36f123e8`.
  Log: `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-ks-semantics.log`.
- The earlier E18 full run failed on a mixed source basis during ongoing additions.
  A fresh stable-source full regression is recorded in the Pearson review. The older
  run is not accepted as validation evidence for this increment.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-g19a-scene--scene>
