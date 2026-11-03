# IC experiment rebuild: from normal readings to random variance estimates

The subsequent [CDF-first opening revision](chemometrics-level5-cdf-first-review.md)
expands the selected path to 74 scenes without changing the relative IC/t/F/closing
sequence. The 70-scene counts and browser records below refer to this historical
increment. Its full `npm test` was intentionally stopped when the new opening was
requested; it must not be treated as a passing full run.

## Selected lecture

`npm run preview:level5:generate` now selects the exact named-graph pair
`ex:path-level5-ic-experiments` /
`https://w3id.org/project-chemie-digital/graph/paths/level5-ic-experiments`.
The path has **70 scenes**. Earlier paths remain supporting authored selections;
the old 61-scene path is not the current main lecture.

All semantic content and executable examples are authored in TriG. This increment
adds no renderer-specific scientific calculations or ontology contracts.

## Teaching sequence

1. Opening: identify the random quantity behind normal, chi-square, t and F.
   Normality is a model assumption, not a statement about all analytical readings.
2. Uniform-model PDF, integrated CDF and inverse CDF.
3. Generic standardization immediately afterward: center and scale, without claiming
   that the transformation makes an arbitrary distribution normal.
4. Additive measurement process, normal model, its standardization, explicit
   lowercase phi density / uppercase Phi CDF / inverse Phi, then control applications.
5. Retain the particle-size lognormal case.
6. Rebuild IC around the six experimental acts below. The abstract df overview is
   no longer a prerequisite that gives away the residual experiment.
7. Keep the explicit transition to the separate five-reading t example, F, model
   checks and final live dilution Monte Carlo case.

### Six IC acts

- **QC problem and observed spread:** six nitrate results are 9.95, 10.15, 9.85,
  10.25, 9.95, 10.15 mg/L. Their fitted mean is 10.05 mg/L. Residuals are -0.10,
  +0.10, -0.20, +0.20, -0.10, +0.10 mg/L. Squared sum 0.12 (mg/L)², variance
  0.024 (mg/L)² and SD 0.154919 mg/L describe this series but do not decide whether
  true repeatability worsened. The reference SD 0.10 mg/L is treated as fixed/known.
- **Repeat the whole experiment:** three illustrative series visibly give different
  estimates under one stable model. An optional instructor-operated R workbench
  shows points and histograms for 100, 1,000 and 10,000 complete six-reading series.
  The saved 10,000-series raw-variance histogram remains a noninteractive fallback.
  More simulated series stabilize the picture, not the precision of one estimate.
- **Construct the new law:** standard-normal draw, square, one-df chi-square,
  then sums of two, three and k independent squared standard normals. The local SVG
  explicitly labels its density shapes as schematic, not sampled coordinates.
  The general Gamma-function chi-square density is absent from the selected path.
- **Residual constraint:** cover the sixth residual and infer it from the first
  five and the zero-sum condition. The fitted mean is not the nominal concentration;
  bias is possible. Five independent orthonormal residual coordinates, not six
  independent raw residuals, justify the normal-model law. Separate Bessel
  unbiasedness (finite variance, no normality needed) from the exact chi-square law
  (independent normal readings with common variance). The general true-variance law
  precedes the fixed-reference boundary calibration.
- **Decision:** scaled variance gives observed Q=12; rescaling does not add evidence.
  At the composite-null boundary, cutoff 11.07049769351635 and upper tail
  0.03478778050624185 imply rejection at the prespecified 5% level. This is evidence
  about repeatability, not a cause diagnosis, proof of bias or release authorization.
  If the reference SD has material estimation uncertainty, the calibration is not
  sufficient. Drift, dependence and nonnormal errors need separate assessment.
- **Sample size and outlook:** compare n=6 / 30, df=5 / 29, expected Q=5 / 29,
  variance of Q=10 / 58, relative SD of sample variance=63.2% / 26.3%. A second
  optional view reuses the R experiment to change n at fixed simulation count.
  Increasing raw Q with df does not mean worsening precision. Close by asking how
  to compare two methods when neither true variance is known, motivating F; t first
  uses the related uncertainty in an estimated standard error.

## Sources and implementation

- `ontology/dataset/chemometrics-level5-ic-experiments.trig`: new resources,
  mathematical expressions, complete linked visible legends and scenes.
- `ontology/dataset/chemometrics-level5-ic-experiment-code.trig`: optional editable
  base-R experiment, Park-Miller seed 20261101, inverse normal draws, fresh mean and
  variance per series. No chi-square density is used in the pre-construction lab.
- `ontology/dataset/chemometrics-level5-ic-experiment-path.trig`: curated ordering.
- Existing IC observations, table, chart summaries, narration, legends and residual
  SVG are updated consistently to the new data. Existing 10,000-series simulation
  remains centered at 10 mg/L: changing the population mean does not affect its
  centered variance distribution. The normal control SD remains 0.30 mg/L.
- All graphics have accessible text alternatives and light/dark styles. Interactive
  execution is optional, with static saved/theoretical alternatives. No personal
  measurements or private student information are used.

## Verification status

- Initial preview generation succeeds: 70 scenes.
- Final focused Python run: 13 tests pass for the new experiment path and retained
  IC reference path, including complete visible formula-legend bindings and numerical
  replay of all 32 saved histogram bins.
- Actual TriG-authored R execution passes in **Edge and Firefox**, separately for
  M=100, 1,000 and 10,000 at n=6, and M=10,000 at n=30. The six-reading run reproduces
  all 32 saved counts and 342 variances at least 0.024. Empirical relative SD is
  0.6339731 at n=6 and 0.2615246 at n=30, compared with theoretical 0.6324555 and
  0.2626129. Evidence: `level5-ic-experiments-r.log` in the approved local temp folder.
- An initial browser audit found an overflowing long Bessel card. The authored
  wording was shortened and the general sample-variance formula/legend added to
  the same scene before final validation started. Initial audits are not final evidence.
  The corrected Bessel scene passes a fresh focused Firefox check at all three sizes;
  the new four-family opening passes the corresponding focused Edge check.
- Final full browser matrices are running in Edge and Firefox across light desktop,
  dark desktop and light phone sizes: `level5-ic-experiments-edge-final.log` and
  `level5-ic-experiments-firefox-final.log`. Native forward/reverse navigation passes
  all 70 scenes in both Edge and Firefox, with no mandatory controls or reveals.
  Evidence: `level5-ic-experiments-native.log`. The earlier foreground attempt
  timed out during Firefox and is superseded by this completed two-browser run.
- A fresh authoritative `npm test` is running on stabilized semantic/code/test sources:
  `level5-ic-experiments-npm-test.log`. No full pass is claimed yet. Older 59/61-scene
  results are not evidence for this rebuild. The earlier 61-scene full test was
  cancelled, not passed.

Timing of 60–75 minutes for the IC section is an instructor target, not a measured
duration. Rehearsal is still needed. No pedagogical effectiveness is claimed.
Everything remains local, uncommitted, unpushed and unpublished.

Preview:
<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:ic-process--scene>
Add `&interactive=1` before the hash for the optional browser-R demonstrations.
