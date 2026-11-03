# Lognormal distribution through complete LC-MS/MS preparation

## Selected story and scope

The local main preview now selects **95 scenes** through the exact pair
`ex:path-level5-multiplicative-story` /
`https://w3id.org/project-chemie-digital/graph/paths/level5-multiplicative-story`.

The order is **Normal → Lognormal → Chi-square**. The first 29 steps reuse the
CDF-first foundations and the first 18 normal-story scenes. The older normal-to-IC
bridge is not selected here because it would prematurely announce the next section.
Nineteen new lognormal scenes follow, then the existing IC precision, t, F,
model-check and dilution Monte Carlo sequences. Earlier paths and the particle-size
lognormal case remain authored supporting material; no accepted resource is deleted.

This is a new analytical story, not a relabelled particle-size example. It changes
from nitrate IC in mg/L to an organic trace analyte by LC-MS/MS in ng/L, then explicitly
returns to the separate nitrate case for the chi-square construction.

## Causal sequence

1. **Two different repeat experiments.** A reinjects an already prepared homogeneous
   control; B independently processes aliquots from one homogeneous water sample
   through extraction, concentration and analysis. A's simplified error is mostly additive;
   B's relative step influences motivate a multiplicative candidate, not an automatic
   assertion that complete preparations must be lognormal.
2. **The supplied ten-value illustration.** A is 9.9, 10.1, 10.0, 9.8, 10.1, 10.0,
   10.2, 9.9, 10.0, 10.1. B is 5.9, 7.8, 8.3, 8.9, 9.4, 9.7, 10.1, 11.4, 13.7,
   17.1. Units are ng/L. Columns are **unpaired**; B is sorted for display, not time
   order. Ten values establish neither a distribution nor later model parameters.
3. **Expand the experiment.** Optional R compares 1,000 instrument-only and complete
   preparations. Units agree but panel ranges differ. The default uses three independent
   normal log factors and is exactly lognormal by construction, not fitted validation
   evidence. Binary log factors at 4/16/50/200 steps remain finite discrete products;
   suitable many-small-log-contribution conditions motivate a normal approximation.
   A saved 1,000-preparation histogram supplies a static fallback.
4. **Absolute steps versus reciprocal factors.** Ten plus/minus two gives eight/twelve;
   reciprocal factors 0.8 and 1.25 give eight/twelve point five. The priority live
   experiment applies an editable sequence of those factors and shows both successive
   concentrations and log ratios. Three factors of 1.25 give 19.53125 ng/L; three of
   0.8 give 5.12. A reciprocal pair cancels.
5. **Logarithms follow the process.** The same 8/10/12.5 concentrations have unequal
   linear gaps but log ratios -0.22314355/0/+0.22314355 relative to ten. Products become
   sums of dimensionless log factors. This is a mechanism-based transformation, not
   a device for forcing any skewed histogram into normality.
6. **Define and generate the model.** Use reference concentration 10 ng/L, log-ratio
   mean zero and positive log SD 0.30, independently specified. Normal log ratios
   exponentiate to positive concentrations. Optional R compares log SD 0.15/0.30/0.60
   at fixed median ten. The comparison-density window ends at 35 ng/L; tails and
   population moments are not truncated or renormalized to that window.
7. **Centers separate.** With log SD 0.30: mode 9.13931185, median 10.00, arithmetic
   expectation 10.46027860 ng/L. A long right tail raises arithmetic expectation.
   These are population identities, not statistics estimated from the illustrative ten.
8. **Choose the scientific target.** The geometric sample mean averages log ratios
   and transforms back. It is reference-invariant. Under a lognormal population its
   population target equals the median; the sample statistic is not asserted unbiased.
   Mean amount per equal volume needs arithmetic expectation; a multiplicative center
   can use median/geometric mean. Matching a nominal median does not establish
   arithmetic unbiasedness or analytical trueness.
9. **Reuse eta, phi and Phi.** Standardize the natural log ratio, not raw concentration.
   The CDF is standard-normal Phi at eta L. The density adds the chain-rule factor
   one over concentration times log SD, with L/ng units. For nonpositive concentrations
   both lognormal functions are zero; do not evaluate their log arguments there.
10. **Tail and inverse question.** At median ten/log SD 0.30, threshold 15 ng/L gives
    eta L=1.3515503604 and upper probability 0.0882595996, approximately **8.83%**.
    The 95th percentile is **16.3796740847 ng/L**, approximately **16.38**. These are
    hypothetical per-result model thresholds, not legal limits or release rules.
    Parameter estimation, repeated checks, resolution and rounding require separate
    real-world calibration and authorization.
11. **Change population explicitly.** A new experiment models 100 river sites, with
    separate site log SD 0.60, not the method log SD 0.30. Compare the same values on
    linear/log scales and with a normal Q-Q plot. Mixtures and spatial dependence
    can invalidate a single iid lognormal model. Positive support/right skew or a
    roughly straight Q-Q plot proves neither lognormality nor independence.
12. **Censoring is information.** The site demonstration also has a censored mode.
    Values below an illustrative 5 ng/L quantification threshold are marked missing
    with their bound, not replaced by zero. Detected-only plots are explicitly marked
    selection-biased, not full-population model validation. No censored-data inference
    method or regulatory decision is invented here.
13. **Preview the next reference law.** For iid normal uncensored log ratios, their
    scaled sample variance has the chi-square law. The formula is marked as a preview,
    to be constructed next. It is not a law for raw lognormal concentration variance,
    correlated sites or censored observations. Return explicitly to the independent
    nitrate IC QC case in mg/L before deriving normal residual squares and df.

## Scientific boundaries

- The positive factors are **relative influences around a reference process**, not
  literal unbounded extraction-recovery fractions. Raw recovery is bounded. Additional
  additive detector noise need not preserve exact lognormality.
- Independent normal log factors are a sufficient exact construction. More general
  CLT arguments concern log contributions and require suitable conditions; positivity
  and multiplication alone are not proof.
- Every authored log argument is dimensionless. Even the R density call evaluates
  a concentration/reference ratio and divides by the reference to restore density
  units, instead of taking an unqualified logarithm of a dimensional concentration.
- Finite observed/simulated frequencies are distinguished from exact model probabilities.
  The default saved simulation has 100/1,000 results above fifteen, not exactly 8.83%.

## Implementation

- `ontology/dataset/chemometrics-level5-lognormal-workup.trig`: resources, numerical
  observations, formulas, complete visible linked legends and exact saved counts.
- `ontology/dataset/chemometrics-level5-lognormal-workup-code.trig`: four optional
  editable/executable base-R workbenches, not mandatory audience programming.
- `ontology/dataset/chemometrics-level5-lognormal-workup-scenes.trig`: narrative,
  table, media and standard scene items.
- `ontology/dataset/chemometrics-level5-multiplicative-path.trig`: curated path with
  preserved RDF identities/named-graph provenance, reusing the normal prerequisites.
- `apps/pitch/public/chemometrics/level5-lognormal-workup-process.svg` and
  `level5-lognormal-ratio-scales.svg`: local accessible light/dark diagrams.
- `tests/test_level5_lognormal_workup.py`: deterministic numerical and semantic tests.

The saved simulation uses Park-Miller seed 20261103, multiplier 16807 and modulus
2147483647. Each iteration consumes one standard-normal draw for A, then three
independent normal log contributions of SD 0.30 divided by root three for B. B is ten
times the product of their exponentials. Counts use left-closed/right-open bins
0,2,...,36 ng/L. All 18 counts sum to 1,000; mean B is 10.503003727232883 ng/L.
No artificial midpoint observations are reconstructed.

Existing infocard, table, chart, formula/legend and browser-R contracts are reused.
No renderer-specific scientific logic, ontology contract or deployment target is
changed. Inputs are fictional and contain no personal data. Text/data fallbacks,
media alternatives and theme styles are retained; timing and pedagogical effectiveness
are not claimed.

## Verification status

- Preview generation succeeds with 95 scenes.
- All **16 focused lognormal Python tests** pass: eight existing supporting-case tests
  and eight new workup tests. Coverage includes supplied values/table, saved counts,
  reference-invariant geometry, tail/quantile/centers, density chain rule, complete
  formula-legend bindings, scale/population/censoring boundaries and main-path order.
- Actual authored R passes **14 cases in each of Edge and Firefox**, with saved R
  graphics opened and verified: default comparison, four binary-factor sizes, three
  reciprocal-factor sequences, three log spreads, and three site modes. Evidence:
  `level5-lognormal-workup-r-retry.log` in the approved local temp folder. The first
  audit attempted to inspect the detached plot gallery before opening its modal;
  the driver was corrected, without changing application code.
- Initial browser matrices found two issues: a long first heading displaced a media
  bound in light desktop, and the center legend's notation line was four pixels too
  wide on phone. The heading and notation line were shortened without dropping
  explanations. Both corrected scenes pass fresh Firefox checks at light desktop,
  dark desktop and light phone sizes.
- Final full-path matrices run in `level5-lognormal-workup-edge-final.log` and
  `level5-lognormal-workup-firefox-final.log`. Forward/reverse navigation passes all
  95 scenes in Edge and Firefox without mandatory controls or reveals:
  `level5-lognormal-workup-native-final.log`. No complete layout-matrix pass is claimed yet.
  Firefox has completed: all 19 new lognormal scenes pass all three configurations,
  and all 95 scenes pass both desktop configurations. The full matrix fails on 17
  retained IC/F/model-check/Monte Carlo scenes at 390-pixel phone width. These are
  current recorded failures, not stale runs; the new lognormal section is not the
  source of those failures. Edge completed with passing desktop views, 16 retained
  phone failures and one additional phone overflow on the new `lg-bridge` scene.
  That card was shortened without changing the scale/population distinction. Fresh
  focused checks of the corrected bridge pass all three sizes in both Edge and
  Firefox. The full matrix logs predate this final one-card adjustment; the whole
  lecture is still not layout-passing because retained phone failures remain.
- Fresh authoritative `npm test` is running on the final stabilized sources:
  `level5-lognormal-workup-final-npm-test.log`. The preceding
  `level5-lognormal-workup-npm-test.log` run was intentionally stopped for the final
  bridge correction and is not a pass. The earlier normal-only run was also stopped
  for this requested rebuild and is not a passing full run.
- The previous 83-scene full audit documented phone overflows in retained IC/F/model-
  check/Monte Carlo scenes. They are outside this bounded authoring revision and
  were not broadly repaired here. The whole lecture must not be described as fully
  layout-validated merely because the new lognormal scenes pass focused checks.

The requested 75–85 minutes remains an instructor rehearsal target. All changes are
local, uncommitted, unpushed and unpublished.

Start at:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:lg-process--scene>
Add `&interactive=1` before the hash for optional browser-R execution.
