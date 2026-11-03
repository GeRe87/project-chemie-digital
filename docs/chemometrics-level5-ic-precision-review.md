# Level 5: chi-square through an IC nitrate precision check

Historical 59-scene increment. The current
[61-scene inference bridge revision](chemometrics-level5-ic-inference-bridge-review.md)
corrects the teaching order: the reason a variance estimate is not a calibrated
decision is visible before arithmetic, and the raw-variance sampling experiment
now precedes the chi-square derivation and decision. Validation below records
the earlier sequence, not the revised one.

Local, uncommitted and unpublished. The main preview now selects the **59-scene**
`ex:path-level5-ic-precision`. It replaces the four-slide chi-square variance-interval
example with the instructor's eight-stage precision-check story. The preceding
55-scene storyline and earlier supporting paths remain available.

## One question, one dataset, one decision

The analytical question is whether nitrate repeatability in a hypothetical
ion-chromatography method has deteriorated, not whether its measured mean is correct.
Treat the earlier validated SD, 0.10 mg/L, as a fixed known reference for teaching.
An ageing column is a suspicion, not a test-established cause.

1. **Process and purpose:** prior precision → six independent repeats of one
   homogeneous water sample → observed spread → chance or deterioration?
2. **Actual results:** 9.9, 10.1, 9.8, 10.2, 9.9, 10.1 mg/L; fitted mean 10.00 mg/L.
3. **Inspectable deviations:** -0.10, +0.10, -0.20, +0.20, -0.10, +0.10 mg/L.
   The table retains duplicates and measurement order. Deviations sum to zero;
   squared deviations sum to 0.12 (mg/L)².
4. **Observed spread:** divide by five residual df for variance 0.024 (mg/L)².
   Sample SD is 0.1549193338 mg/L, rounded to 0.155. Larger than 0.10 alone is
   not evidence sufficient to decide deterioration: sample SD fluctuates.
5. **Reference scaling:** divide each residual by 0.10 mg/L, square and add.
   Scaled residuals -1,1,-2,2,-1,1 give squares 1,1,4,4,1,1, sum 12.
6. **Origin of the law:** six iid normal readings, one fitted mean, one residual
   constraint, five orthogonal normal residual directions. At true SD equal to
   reference SD, their squared scaled sum is chi-square with five df. The raw
   centered residuals are explicitly not six independent standard normals.
7. **One-sided decision:** null true SD at most 0.10 mg/L, alternative larger.
   Observed 12 exceeds the chi-square-five 95th percentile 11.0704976935. Boundary
   upper-tail probability is 0.0347877805, about 3.48%. Reject at the predeclared
   5% level under the assumptions. The plot marks the cutoff with a dashed line,
   observed statistic with an orange solid line and the observed upper tail in orange.
8. **Why a distribution is needed:** 10,000 simulated six-result series keep true
   precision constant but produce different means, sample variances and statistics.
   A saved histogram approximates the theoretical chi-square-five density. The
   distribution calibrates chance fluctuations in a statistic, not only raw readings.

The formal reference is exact **at the null boundary**. For smaller true SD,
the statistic is a smaller scale multiple of that chi-square, so the boundary
controls rejection probability over the whole upper-tail composite null. The
reference SD is not re-estimated from these six observations. If earlier validation
estimated it with material uncertainty, use a justified comparison accounting for
that estimate (for example an appropriate independent variance-ratio procedure),
not this known-reference calibration unchanged.

The result supports investigation of method repeatability under laboratory
procedures. It does not diagnose a column, establish bias, verify calibration or
authorize/prohibit release of real sample results. The data are constructed.

## No silent dataset change

The degrees-of-freedom overview now names six IC readings and five df explicitly.
The later Student-t section is introduced as a **different five-reading study**:
9.6,9.8,10.0,10.2,10.4 mg/L, sample variance 0.10 (mg/L)² and four df. It does not
reuse the IC data or its fixed 0.10 mg/L reference SD. The remaining t, F, Q-Q,
KS, Pearson, map and final live dilution case are retained. The generic five-residual
constraint picture remains a warm-up to the counting principle, not a claim that
the IC sample has five readings.

## Canonical sources and reproducibility

- `chemometrics-level5-ic-precision.trig`: case assumptions, actual readings,
  authored question cards, formulas and complete same-slide symbol legends.
- `chemometrics-level5-ic-data.trig`: native deviation table, dot plot, density
  coordinates and saved simulation counts/edges with a TriG-authored base-R protocol.
- `chemometrics-level5-ic-scenes.trig`: eight-step narrative, visible data questions,
  df overview and explicit t transition.
- `chemometrics-level5-ic-path.trig`: the curated 59-scene named-graph path.
- Four local SVGs provide process, scaled-residual tiles, residual-direction
  construction and the chi-square-five tail. Titles, descriptions, authored text
  alternatives and light/dark palettes remain self-contained and script-free.

The saved simulation uses the same explicitly authored Park-Miller generator style
as the existing Monte Carlo case: initial state 20261101, 10,000 series, six normal
inverse-CDF draws per series, true mean 10 and SD 0.10 mg/L. Every series fits its own
mean. All statistics lie in the displayed 0-32 window and all 10,000 are retained.
Mean statistic is 5.0080185869; 485 exceed the 5% cutoff. The observed 4.85% simulated
flag fraction is finite Monte Carlo variation, not an exactly 5% empirical result
or a proof of the theoretical law. Plot coordinates are drawing samples; exact tail
calculations do not integrate their finite polyline.

No compiler, renderer, layout contract, ontology shape or workflow configuration
changes are required. All semantic authoring and simulation code originate in TriG.
JSON remains disposable generated transport. The existing shared formula/legend,
table, infographic, histogram and reference-curve components are reused.

## Verification status

- Preview generation succeeds with 59 scenes.
- Seven new focused Python tests pass: arithmetic and residual ordering, table
  cells/units, exact five-df tail and cutoff, composite-null conservativeness,
  density coordinates/markers, every saved simulation count, main-path continuity,
  explicit dataset transition, formula legends and accessible local SVGs.
- The new section's first Firefox matrix passed all selected scenes in light
  desktop, dark desktop and light phone configurations before the final title and
  diagram-label shortening. The first Edge matrix also passed. The separate SHACL
  diagnostic completed with `Conforms: True` on fingerprint
  `3687d73faf052dad5b4bfd3528f339b3fcf311da14243b71cb93114d059b18b1`.
  It began before final title shortening, so the full run below checks final sources again.
- The previous full `level5-storyline-final-npm-test.log` was explicitly stopped
  before authoring this revision. Its exit code 1 records cancellation, not a final
  test failure or passing evidence. Older 55-scene browser results also do not
  validate this new main path.
- Native forward and reverse navigation now passes all 59 scenes in Edge and
  Firefox without mandatory reveals or opening an optional code editor.
- Actual execution of the authored simulation in browser R passes in Edge and
  Firefox: all 32 histogram counts, mean statistic, 485 upper-cutoff flags, the
  exact cutoff and p value agree with independent Python checks. Log:
  `level5-ic-actual-r.log` in the approved local temporary directory.
- Final full browser matrices are running on stabilized sources:
  `level5-ic-edge-final.log` and `level5-ic-firefox-final.log`. They cover every
  scene at 1731×1006 light, 1280×720 dark and 390×844 light. The audit now also
  checks native table, caption, header and cell boundaries, in addition to formulas,
  visible legends, question cards, media and ordinary content.
  Firefox has completed successfully: all 59 scenes pass in all three
  configurations on the stabilized sources, including native table boundaries.
  Edge has also completed successfully across all 59 scenes in those same three
  configurations. Both final browser matrices pass.
- The new authoritative `npm test` completed successfully on unchanged semantic/
  feature sources: **741 Python tests and all Node suites pass**.
  Log: `level5-ic-final-npm-test.log`. Final dataset fingerprint:
  `4e502d1ab992f5ef0995e078ec369f26e6504741a1e030dcd55b0f3260276ffb`.
  No semantic or feature sources were edited during the run.

No learner data, real validation evidence, public release or deployment is added.
Instructor rehearsal is still needed for total lecture timing.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:ic-process--scene>
