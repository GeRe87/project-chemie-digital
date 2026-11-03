# Level 5: finish N10 and explain the limits of normality in N11

Local authoring review, 2026-10-31. No commit, push, publication or deployment.
Six complete scenes extend the preview from twenty to twenty-six scenes.

## Complete lecture views

| Scene | Explanation |
| --- | --- |
| N10b | Inverse normal CDF: the one-sided 95% threshold is approximately 10.49 mg/L |
| N10c | A population threshold for individual readings is not a confidence interval for an unknown mean |
| N11a | Same-sample technical repeats and concentrations across sites are different populations |
| N11b | Constructed symmetric technical readings with the specified normal density overlaid |
| N11c | Constructed right-skewed site values with a moment-matched normal reference exposing asymmetry and negative model mass |
| N11d | Reporting limits, unusual values, mixtures, dependence and distinct levels of variability before selecting a model |

All text, narration and static alternatives are English. Every view is complete on
entry with no quizzes, questions, sliders or extra reveal stages. The normal-quantile
formula has its complete linked authored symbol legend on the same slide. N10c does
not introduce an unexplained confidence-interval formula. Remaining explanations
use the existing definition-card or info/visual layouts rather than new slide CSS.

## Numerical and scientific boundaries

- The teaching model keeps mean 10.0 mg/L and SD 0.30 mg/L. Its exact 95% quantile
  is 10.493456088085441 mg/L, displayed as approximately 10.49 mg/L. The CDF marks
  the unrounded threshold at 0.95; at rounded 10.49 the probability is approximately
  94.88%. Sampled line segments approximate the theoretical curve.
- This is a one-sided population threshold, not a central 95% interval. Using the
  same distance on both sides would contain 90%. A confidence procedure targets a
  fixed unknown mean with repeated-sample coverage; it does not contain 95% of
  individual readings or assign a post-data frequentist probability to that mean.
  Estimating model parameters introduces additional prediction uncertainty.
- Each histogram contains exactly forty constructed values. Midpoint ties are
  deliberate. Neither dataset is a random draw, an instrument result or field data.
  Values are authored in TriG; they are not generated during the presentation.
- Histogram areas sum to one using relative-frequency density. References are
  separately identified theoretical coordinates, never added to histogram counts.
  Reference and histogram share units and one y scale. There is no secondary axis.
- The technical-repeat reference is the specified model with mean 10.0 and SD
  0.30 mg/L, not a fitted normal distribution. Visual resemblance establishes no fit.
- The site reference matches the displayed mean 1.5125 and divisor-n descriptive
  SD 1.3369157602481916 mg/L. The divisor is forty, not thirty-nine. Matching two
  moments establishes no fit. The reference has approximately 12.89569949%
  probability below zero, displayed as 12.90%, while every constructed value is
  positive. The model is not silently truncated or renormalized at zero.
- The two population charts have different x domains, so they compare mechanisms
  and shape, not absolute bar heights across slides. Both continue to distinguish
  finite plotted coordinates from full normal support.
- Missing and below-limit results are not automatically true zeros. Mixtures and
  censoring may cause apparent skewness. Check provenance before removing outliers;
  drift and dependence matter. Normal analytical errors can coexist with non-normal
  between-site concentrations.
- Positivity/right skew does not prove lognormality. L12 remains the next section;
  no lognormal distribution, K-S test or Pearson chi-square result is claimed here.
  The optional pause is not a new content slide. Total lecture timing remains open.

## Shared implementation and privacy

Authored content lives in `ontology/dataset/chemometrics-level5-normal-interpretation.trig`.
The new capability reuses existing histogram bars and canonical line series; see
ADR-0022 for the additive 1.13 contract, compiler/SHACL checks and separate numerical
fallbacks. No new semantic vocabulary or renderer-specific core dependencies are
introduced. One opt-in mobile rule removes the inherited projection-sized SVG minimum
height only from histograms with reference curves. Legacy figures are unaffected.

The shorter chart-point label uses the caption for the full quantile value, avoiding
text clipping. Long card wording was shortened for mobile rather than shrinking
the whole lecture. No personal data, network service or learner-state storage is
added. All changes remain in the existing local uncommitted authoring branch.

## Verification

- Preview generation produces twenty-six scenes.
- All 47 targeted Level-5 Python tests pass. Eight new tests cover ordering, quantile/CDF agreement, rounding, complete
  symbol legends, confidence interpretation, all eighty constructed values, density
  areas, moment matching, negative normal mass, source provenance, English text,
  static HTML and compiler/SHACL rejection of invalid curve scales/units.
- Core's 142 tests and all 95 D3 tests pass. The new renderer DOM
  test covers a reference taller than the bins, layer identities, count preservation,
  complete fallback and mount/destroy behavior.
- Edge and Firefox pass all twenty-six scenes at 1731 x 1006 light, 1280 x 720
  dark and 390 x 844 light. New scenes additionally verify all forty observations
  per histogram, visible reference curves without observation markers, complete
  same-slide formula legends, no controls/questions/reveal fragments, and viewport
  bounds. Representative desktop and mobile screenshots have been visually reviewed.
- Native PageDown traversal reaches all twenty-six slides in both engines with only
  the six original binomial comparison advances. PageUp reverses N10/N11 without
  extra uncovering.
- Final semantic validation passes (`Conforms: True`) for dataset fingerprint
  `b6cc14ae6744167f3a29a9b3b22f88fe4c3055e9f1cff0dce27573fdd885c499`.
  Log: `C:/Users/PCUser/AppData/Local/Temp/opencode/level5-n10-n11-current-semantics.log`.
- `git diff --check` passes with existing line-ending warnings only.
- The full `npm test` passes: 603 Python tests and all Node suites. Log:
  `C:/Users/PCUser/AppData/Local/Temp/opencode/level5-n10-n11-final-npm-test.log`.
  Earlier N09/N10a results are not evidence for this increment.

## Preview

Continue N10:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-n10b-scene--scene>

Start N11:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-n11a-scene--scene>

The following four-slide L12 increment is documented in
[the lognormal review](chemometrics-level5-lognormal-review.md).
