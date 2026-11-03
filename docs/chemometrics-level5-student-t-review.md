# Level 5: T16 chi-square, Student-t and a mean interval

Local authoring review, 2026-10-31. No commit, push, publication or deployment.
Seven complete English scenes extend the preview to forty-nine scenes.
F17, goodness-of-fit tests and overall timing remain later work.

## Complete lecture views

| Scene | Explanation |
| --- | --- |
| T16a | Five realized sample variances; exact normal-model law for scaled sample variance |
| T16b | Chi-square as a sum of independent squared standard normals; theoretical four-degree density |
| T16c | Known population SD gives an exact standard-normal mean statistic under iid normal sampling |
| T16d | Estimating SD gives Student-t; normal versus four-degree t on the same axes |
| T16e | Normal versus t at 2 and 4 degrees of freedom |
| T16f | Normal versus t at 10 and 30 degrees of freedom, retaining identical axes |
| T16g | Fully calculated two-sided 95% t interval for S15's five nitrate readings |

The blueprint's stages are complete views, not internal reveals. The four-degree
comparison remains with its formula; the wider degree-of-freedom comparison is split
into two views so each plot has at most three traces. No questions, quiz, slider or
simulation control is needed. Supporting derivation and caveats are in narration.
Five formulas have separate authored complete symbol legends linked by `dct:hasPart`
and rendered visibly on the same slide using the existing shared formula unit.

## Scientific and numerical evidence

- The first five sample variances replay S15's same iid normal simulation, not a
  new independent collection, selected extrema or the variance of its constructed
  symmetric observations. The authored protocol retains seed 20261031, Mulberry32,
  uncached cosine Box-Muller and all 5,000 five-reading samples. Displayed variances
  are approximately 0.05217135, 0.01427660, 0.04344818, 0.03828845 and 0.06766674
  (mg/L) squared; the specified population variance is 0.10 (mg/L) squared.
- Under iid normal observations, scaled sample variance has an exact chi-square
  law with size minus one degrees of freedom. Centered residuals are dependent;
  independent normal coordinates in their residual subspace explain the count
  of independent squared terms. The Bessel correction is not rederived.
- The chi-square curve is theoretical, not a fit to five bars. It starts at zero
  and has a right tail beyond 32. Pearson goodness-of-fit testing is explicitly
  deferred, not confused with this variance-distribution construction.
- Known population SD yields an exact standard-normal statistic. Replacing it by
  random sample SD changes the reference law. Independence of sample mean and
  sample variance under the normal model is explicit in narration, as is the
  standard-normal divided by root-scaled-independent-chi-square construction.
- All t curves use the full theoretical density with gamma-function normalization,
  not fitted means or SDs. Coordinates are rounded to twelve decimal places and
  joined linearly. All standard-normal/t comparisons use the same -6 to 6 domain
  and exact 0 to 0.42 density range. Both axes are dimensionless. Tails extend
  beyond the window; curves are not renormalized to it. The t distribution with
  two degrees of freedom has no finite variance and is not described as unit variance.
- Degrees of freedom 2, 4, 10 and 30 are not sample sizes. Increasing degrees of
  freedom approaches normal without exact equality at a finite value and without
  a universal size-thirty rule or permission to ignore model assumptions.
- S15's observed mean is 10.0 mg/L and estimated SE is 0.1414213562373095 mg/L.
  The full-distribution 0.975 t quantile with four degrees of freedom is
  2.7764451051977987. Margin is 0.39264863229551217 mg/L, giving interval
  [9.607351367704488, 10.392648632295512] mg/L, displayed rounded to five decimals.
  Quantiles are not inferred by integrating the approximate drawing.
- The procedure has 95% long-run coverage under iid normal sampling. Narration
  rejects assigning 95% probability to the fixed unknown mean after the observed
  interval is fixed, and distinguishes mean inference from individual coverage
  and prediction. Normality, independence and absence of bias are not established
  by five observations. The target is the common expected reading, not automatically
  a true reference concentration when bias is uncontrolled.

## Shared implementation, accessibility and privacy

Content lives in `ontology/dataset/chemometrics-level5-student-t.trig` and numerical
coordinates in `chemometrics-level5-student-t-data.trig`, retaining named graphs and
derivation links. The standard-normal reference is reused from C14. Existing bar
charts, complete line charts, captions, narration, numerical alternatives and formula
components are reused without new renderer/Core/compiler/SHACL contracts.

One generic capability-scoped CSS rule distinguishes the third trace in complete
line charts by a dotted pattern and its existing series color. First and second
traces retain solid/dashed styles. Captions identify each pattern explicitly, so
comparison does not rely on color alone. No scene-ID styling is added. The earlier
N09 three-curve comparison is regression-checked in both engines. Accepted Levels
0-4 do not gain authored complete-chart options or content changes.

All new authored material and static alternatives are English. Existing mobile
formula layouts retain full legends and numerical captions. No personal data,
learner persistence, network service or deployment change is introduced. The
blueprint's unavailable supplementary Markdown source is not claimed as reviewed.

## Verification

- Preview generation produces 49 scenes.
- All 85 targeted Level-5 Python tests pass, including eight new T16 tests.
  Tests independently replay all 5,000 variances in Python, verify all theoretical
  coordinates and shared axes, inspect same-slide legends and scientific guardrails,
  and check static alternatives. An independent analytic t4 CDF verifies the
  0.975 quantile, interval arithmetic and endpoints.
- Edge and Firefox pass all seven T16 scenes at 1731 x 1006 light, 1280 x 720 dark
  and 390 x 844 light. Checks include complete legends, no extra reveals/controls/
  questions, no apparent raw-observation markers on theoretical curves and three
  distinct trace patterns. Representative desktop and phone screenshots reviewed.
- N09/N10a browser regression passes all three configurations in both engines.
- Native PageDown traversal passes all 49 slides in Edge and Firefox with only
  the six original comparison advances. PageUp reverses T16, S15 and C14 without
  additional reveals.
- `git diff --check` passes with line-ending warnings only.
- During refinement, adding chi-square drawing points initially left noncontiguous
  observation positions. Compiler/SHACL correctly rejected that intermediate source.
  Positions are corrected; current generation and all 85 targeted tests pass.
  T16-source semantic revalidation conforms with fingerprint
  `1ba814300c54195c71470c9b6df3c2bde3390798df1adf4081e7fabc24ae7068`.
  Log: `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-t16-current-semantics.log`.
- The T16-era full `npm test` run completed successfully: 641 Python tests and all
  Node suites pass. Log:
  `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-t16-npm-test.log`.
  It began before the final observation-order correction and later F17/E18 additions;
  a fresh full run on the E18 source is recorded in the closing review.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-t16a-scene--scene>

The following increment is documented in
[the F-distribution review](chemometrics-level5-f-distribution-review.md).
