# CDF-first probability foundations

Historical 74-scene selection. The current
[83-scene normal/IC rebuild](chemometrics-level5-normal-ic-story-review.md) retains
these foundations and reorders quantile/standardization before the binomial-to-normal
transition. The full `npm test` below was intentionally stopped for that new request;
it is not a passing full run. Its old full browser matrices were superseded during
the new selection's authoring and are not current validation evidence.

The local main path `ex:path-level5-ic-experiments` now contains **74 scenes**.
Its previous five-scene uniform-function introduction is replaced by nine scenes
following a nitrate measurement experiment. The later standardization, phi/Phi,
normal/lognormal, IC, t, F, model-check and dilution Monte Carlo sequences retain
their relative order. No accepted deployment or authored supporting path is removed.

## The experiment and its exact arithmetic

Twenty **fictional** readings of one 10.0 mg/L nitrate standard, sorted by value:

9.55, 9.65, 9.75, 9.80, 9.85, 9.90, 9.90, 9.95, 9.95, 10.00,
10.00, 10.05, 10.10, 10.15, 10.20, 10.25, 10.30, 10.35, 10.40, 10.50 mg/L.

The data are an authored example, not a field dataset, fit, validated accuracy
claim or additional IC six-reading series. Exactly 15/20 are at most 10.20, 4/20
are at most 9.80, and 11/20 are **strictly above 9.80 and at most 10.20**. Thus the
empirical interval estimate is 55%. Including the lower endpoint would instead
give 12/20: endpoint conventions are not silently discarded for rounded data.

Each duplicate retains its own Observation identity. Dot offsets separate points,
not another measured quantity. The optional ECDF threshold control reuses the
existing ObservationExplorer, starts at 10.20 and is not required for navigation.

## Visible narrative

1. **Next measurement:** start with the dotplot, not a bell curve. Describing twenty
   results cannot name the next exact result. Probability statements require stable,
   comparable conditions; this small sample does not establish them.
2. **CDF first:** recall the ECDF briefly. Its observed 75% estimates the unknown
   population probability of a future result at most 10.20. Hat versus un-hatted
   notation and units are explained on the slide.
3. **Intervals:** subtract the lower CDF from the upper. Separate the model identity
   from the empirical estimate of 55%; no named theoretical family is needed.
4. **Histogram to density:** same twenty observations, fixed left-closed/right-open
   0.20 mg/L bins. Counts are 2, 3, 7, 4, 3, 1. The central bin has relative frequency
   0.35 and density 1.75 L/mg. Total histogram area is one, not the sum of heights.
5. **PDF/CDF link:** a separate conceptual triangular model and its integrated CDF
   appear side by side. It is explicitly **not fitted to the observations** and not
   normal. The PDF is the CDF's slope where it exists; the CDF integrates the PDF.
   Do not differentiate the step ECDF into a population PDF. Qualify these identities
   by absolute continuity, rather than claiming every CDF has an ordinary density.
6. **Height, area, rounding:** conceptual density height 1.2 L/mg is not 120%.
   Interval area gives probability, full area is one, and an exact idealized continuous
   value has probability zero. A nearest-0.1 display of 10.0 represents approximately
   9.95–10.05 mg/L, with tie-dependent endpoints. This display example is distinct
   from the more finely reported twenty readings.
7. **Change variables:** count positive classifications in ten separate assays.
   Integers 0–10 have PMF masses, not continuous density heights. A compact table
   contrasts mass, density, sums and integration; both descriptions have a CDF.
8. **First discrete family:** an existing exact binomial PMF chart/formula provides
   a short application. Independence, ten trials and a common 20% positive-result
   probability are explicit teaching assumptions, not measured prevalence. A positive
   classification is not an infallible true-state measurement. The full existing
   binomial workshop remains supporting material, without mandatory interaction here.
9. **Inverse CDF:** reverse the input/output question before standardization.
   The empirical generalized-inverse 75% threshold is 10.20 mg/L, not an established
   population quantile or a promise about interpolation-based sample quantiles.

## Implementation and accessibility

- Semantic observations, chart declarations, expressions, complete linked visible
  legends and scenes: `ontology/dataset/chemometrics-level5-cdf-first.trig`.
- Main selection/order: `ontology/dataset/chemometrics-level5-ic-experiment-path.trig`.
- Theme-aware local model diagram: `apps/pitch/public/chemometrics/level5-cdf-first-pair.svg`.
  Its support is 10 ± 5/6 mg/L, peak 1.2 L/mg, and area one. The CDF is quadratic
  on each side, with value one half at 10. Axis endpoint labels are rounded.
- Tests: `tests/test_level5_cdf_first.py`; main-path IC order tests updated to the
  new positions, without weakening the six-act IC ordering assertions.
- Existing table, chart, formula/legend and infocard primitives are reused. No new
  renderer logic or domain-specific runtime calculations are introduced.
- Accessible data descriptions retain all readings. Existing phone chart/formula
  compositions use numeric/text fallbacks; the ECDF's threshold readout remains
  operable there. Full plots are shown in desktop views. No personal data are used.

## Validation

- Preview generation succeeds with 74 scenes.
- Six new focused tests pass: threshold counts/ties, interval endpoints, quantile,
  histogram counts/normalization, ordering, visible legend coverage, model separation,
  rounding and diagram geometry/accessibility. The thirteen IC tests also pass.
- Actual ECDF control execution passes in Edge and Firefox: 15/20 at 10.20, 4/20 at
  9.80, tied jumps at 9.90, reset, and no unintended slide navigation.
- Initial desktop checks passed, but the phone audit identified long legends,
  table cells and wide formula lines. Wording was shortened without removing symbol
  explanations, and formulas were broken into readable rows. Revised browser checks
  found residual phone overflow in the opening/ECDF/interval scenes. The opening now
  uses the chart without an extra card, with a shorter heading; the interval calculation
  follows the ECDF without duplicating its controls. Fresh focused Firefox checks
  pass these three scenes in all three sizes. Six focused Python tests pass again
  on the stabilized content.
- Final full browser matrices are running in `level5-cdf-first-edge-final.log` and
  `level5-cdf-first-firefox-final.log`. Final forward/reverse navigation passes all
  74 scenes in both Edge and Firefox, without mandatory controls or reveals:
  `level5-cdf-first-native-final.log`, in the approved local temp folder.
- A fresh authoritative `npm test` is running on stabilized content and test sources:
  `level5-cdf-first-npm-test.log`. No full pass is claimed yet. The prior IC-only full
  test was intentionally stopped for this requested rebuild and is not a pass.
  Older browser evidence belongs to the earlier 70-scene selection.

The requested roughly twenty-minute introduction still needs instructor rehearsal;
no timing or pedagogical-effectiveness claim is made. All work remains local,
uncommitted, unpushed and unpublished.

Start at:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:cf-experiment--scene>
