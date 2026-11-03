# Level 5: analytical distribution lecture and live Monte Carlo case

**Superseded where noted by the instructor's illustrated-usecase review:**
[41-scene revision](chemometrics-level5-illustrated-usecases-review.md).
That revision replaces triangular foundations with uniform ones, removes the
isolated normal-density evaluation, adds an additive-process schematic, introduces
normal notation explicitly, and moves standardization after the completed normal
control case. The 39-scene count and stopped-run statuses below describe the
previous increment, not the current preview or current validation evidence.

Local, uncommitted, unpushed and unpublished. This implements the instructor's
revised scope, superseding the water-body-first structure of the earlier draft.
It does not modify accepted Levels 0-4 or deploy anything.

## Active selection and preservation

The main local preview now explicitly selects
`ex:path-level5-analytical-distributions` in named graph
`https://w3id.org/project-chemie-digital/graph/paths/level5-analytical-distributions`.
It has **39 scenes**, without required reveal stages. The existing 70-scene path
remains a supporting material collection with its own exact path/graph identity.
The separate six-scene screening reserve remains unchanged. No prior content is
silently deleted or reinterpreted as a different dataset.

```text
npm run preview:level5:generate
npm run preview:level5:support:generate
```

Both are disposable transport generation, not new semantic sources. The second
command uses output stem `authoring-level5-support`; the ordinary main preview
retains `authoring-level5-block1`. In particular, the binomial-coefficient popup
and the samples-versus-repeats sketch remain available in the supporting path.

## Sequence and analytical purpose

| Scenes | Content and concrete calculation |
| --- | --- |
| 1-2 | Overview and formula-free PDF/CDF/inverse-CDF sketch. Distinguish density area, cumulative probability and inversion. |
| 3-6 | General PDF area rule, a constructed triangular-model area of 0.75, the same CDF difference 0.875 minus 0.125, and its 75th percentile 10.14645 mg/L. The inverse-CDF plot marks that quantile, not an unrelated interval. CDF and generalized inverse also apply to discrete laws; a continuous PDF does not. |
| 7-11 | Normal analytical repeats, rationale from additive errors, density formula, numerical density height 1.3298 L/mg, upper-tail probability 6.68%, and inverse-CDF threshold 10.49346 mg/L. Specified mean 10 and SD 0.30 mg/L are not fitted from five points. |
| 12-14 | Multiplicative concentration factors motivate a lognormal candidate. Log ratios are dimensionless; positivity alone is insufficient. Reference 1 mg/L, log mean approximately 0.69315 and log SD 0.75 give median approximately 2.00 and arithmetic expectation approximately 2.65 mg/L. |
| 15-17 | Uncertainty of analytical precision. Normal-sample scaled variance has an exact chi-square reference. Five constructed lab repeats with observed variance 0.10 (mg/L) squared give a 95% variance interval approximately 0.03590-0.82573 (mg/L) squared. |
| 18-20 | Mean inference with estimated SD. Explain the random denominator and exact iid-normal t reference; apply the 0.975 t quantile with four degrees of freedom to obtain the existing analytical mean interval 9.60735-10.39265 mg/L. |
| 21-23 | A new, explicitly hypothetical independent normal design with six measurements per method. SDs 0.20 and 0.40 mg/L give variance ratio four. For a prespecified upper-tail comparison, the 0.95 F(5,5) quantile is 5.0503: do not reject at 5%, without claiming equivalence or accuracy. The sample sizes are not inferred from the older incomplete illustration. |
| 24-30 | Explain what model-fit tests check. Reuse the authored KS empirical-CDF/gap calculation and calibrated decision, followed by Pearson category expectations, contribution calculation and decision. Distinguish fitted versus fully specified nulls, exact versus approximate references, and non-rejection versus proof. |
| 31 | SVG relationship map plus canonical RDF diagram nodes/edges: lognormal to normal by log ratio; independent standardized squares to chi-square; independent standard-normal numerator and square-root scaled chi-square denominator to t; ratio of two independent scaled chi-squares to F. |
| 32-39 | Complete dilution/photometry Monte Carlo case, described below. |

For variance, t and F, the primary formulas are the analytically useful statistic
and its reference law, followed by quantile-based calculations. Long gamma-function
density expressions are not added as an unexplained second formula catalogue.
Every displayed formula has a same-scene authored legend covering symbols,
indices, operators, units and conventions. Numerical CDFs/quantiles come from
software or tables; no elementary antiderivative is implied.

## Monte Carlo case

The target is concentration in **one collected homogeneous sample**, not a
water-body mean. Pipette 10 mL, dilute to 100 mL, then measure absorbance using a
linear calibration. Correct absorbance by fixed intercept 0.010, divide by fixed
slope 0.095 L/mg, and multiply by final/pipetted volume. Nominal absorbance 0.200
gives 20.000 mg/L.

The illustrative input budget assumes:

- Normal absorbance with centre 0.200 and SD 0.003;
- uniform pipetted volume on 9.98-10.02 mL;
- uniform final volume on 99.92-100.08 mL;
- independent inputs, fixed calibration parameters and no additional bias/recovery
  contribution. Uniform half-widths are not SDs. Bounded positive volumes also avoid
  using an unrestricted normal denominator in the concentration ratio.

The inverse-CDF scene transforms independent uniform inputs into those models.
A deliberately selected illustrative triple is traced through the measurement
equation before any large run; it is explicitly not the first seeded result.
The live case reuses the existing editable, executable browser R workbench. Its
entire code, inputs, seed and equation live in TriG, not in a renderer or JSON.
The Park-Miller stream starts at 20261101, with multiplier 16807 and modulus
2147483647. Successive numbers form rows of three uniforms. This deterministic
stream approximates the independent-input mathematical model; it is not physical
evidence or a claim of perfect pseudo-random independence.

Default 10,000-trial reference, independently replayed in Python and executed in R:

| Quantity | Reference |
| --- | --- |
| First output | 20.07153641990245 mg/L |
| Output mean | 19.998622364856406 mg/L |
| Output sample SD | 0.3167447836124746 mg/L |
| Type-seven 2.5% output quantile | 19.37110491120053 mg/L |
| Type-seven 97.5% output quantile | 20.62749774955301 mg/L |

The saved reference publishes 24 counts aligned with 25 bin edges; all 10,000
outputs are retained. No bin midpoint is invented as an observation. It is visibly
a saved simulated reference, available if live execution is unavailable.

Increasing trials to 50,000 stabilizes numerical summaries without reducing the
physical input uncertainty. Doubling signal SD gives output SD about 0.63214 mg/L,
demonstrating a real change to the assumed uncertainty budget. The final scope
cards explicitly exclude calibration uncertainty/covariance, systematic bias,
recovery and environmental selection. The central 95% output interval is
conditional uncertainty coverage, **not automatically a frequentist confidence
interval**. All five core distributions need not become process inputs.

## Semantic and presentation implementation

New canonical sources under `ontology/dataset/`:

- `chemometrics-level5-analytical-lecture.trig`: curated path, scene narration,
  reusable cards, general formulas and additional analytical worked examples;
- `chemometrics-level5-inverse-cdf.trig`: exact quantile coordinate and chart;
- `chemometrics-level5-distribution-relations.trig`: canonical relationship map,
  distinct chi-square concept and source references;
- `chemometrics-level5-monte-carlo.trig`: measurement equation, uncertainty inputs,
  transformations, one-trial example, executable R and scope;
- `chemometrics-level5-monte-carlo-reference.trig`: default saved histogram and
  readable summaries, linked to the code and equations that produce them.

The three SVGs in `apps/pitch/public/chemometrics/` are linked MediaAssets with
English alternatives. They have titles/descriptions, self-contained contrasting
surfaces and a dark-color-scheme palette; manual application theme changes remain
readable even when browser/OS color scheme differs. Scientific map relationships
also exist as RDF, rather than being stored only in image labels.

Shared cards, diagram/chart, formula/legend, media and exercise/code layouts are
reused. No scene-ID layout switch, new composition, new renderer dependency or
new interaction controller is introduced. One generic symbol-legend correction
prevents an odd last symbol from inheriting the full-row infocard span, allowing
three symbol entries to use three columns rather than overflow below the slide.
It is scoped to symbol legends and has a regression test. The existing R editor's
accessible label is now English. Charts retain theme tokens; SVGs need no remote
image service. No learner data collection or privacy decision is introduced.

## Validation status

- Eight focused Python tests pass: sequence, all formula/legend bindings, analytical
  arithmetic, numerical inverse-CDF checks, full default Monte Carlo replay/counts,
  canonical map edges, SVG accessibility and static alternatives.
- The broader Level-5 recheck passed 159 tests before the final small quantile/
  legend rounding and result-layout edits: `level5-analytical-targeted-final.log`.
  Its unittest summary is `OK`; the redirected PowerShell invocation reports
  exit code 1 despite that summary. The eight new tests also pass again on the
  final source. The full run below remains authoritative for combined regression.
- Four shared-layout Node tests pass, including the new legend regression.
- Both Edge and Firefox execute the actual live R code, return matching default
  numbers and graphics, reproduce repeated runs, execute 50,000 trials, respond to
  changed signal SD and restore default code/results with Reset.
- Both engines pass native forward/reverse traversal of all 39 main scenes,
  without required reveals or opening the live lab.
- Layout review found and corrected overlong formulas, a full-height story chart,
  and inherited odd-card spanning in symbol legends. The browser audit was also
  tightened to reload each exact scene and await media reflow before assertions;
  interrupted earlier runs are not acceptance evidence.
- Both complete matrices in `level5-analytical-{edge,firefox}-final.log` found only
  two failures: the CDF legend and the saved output layout at 1280 x 720. The CDF
  example legend was shortened; the output now reuses the standard info-plus-visual
  composition instead of falling back to a stacked chart/cards layout. Focused
  checks pass for the corrected sections, and the eight new tests pass again.
  Fresh full matrices on final source are active in
  `level5-analytical-edge-exact.log` and `level5-analytical-firefox-exact.log`.
  The Firefox exact-source matrix subsequently completed successfully: all 39
  scenes pass in light desktop, dark desktop and light phone configurations.
  Edge's complete matrix passed all checks except a 0.0052-pixel excess over the
  audit's reserved footer boundary on the dark-desktop inverse-CDF legend. This
  was subpixel rounding, not viewport overflow. The temporary audit now allows
  one pixel of rounding at that boundary, consistent with its horizontal checks.
  The inverse-CDF scene then passes all three Edge configurations without any
  repository source change. All other Edge scene/configuration checks passed in
  the original exact-source matrix. The authoritative test run remains untouched.
  The earlier failed runs are diagnostic evidence, not passes.
- Initial SHACL exposed missing definitions on the two new concepts; definitions
  were authored. The recheck conforms (`level5-analytical-semantics-recheck.log`)
  before the final source refinements. Fresh exact-source semantic validation is
  included in the authoritative run below.
- Authoritative `npm test` is running on unchanged final semantic/feature sources:
  `level5-analytical-final-npm-test.log`. Do not edit those sources during the run.
  Earlier stopped full runs do not validate this increment.

Total lecture timing still needs instructor rehearsal. The course no longer
requires traversing the 70-scene supporting draft before the main lecture.

## Local review links

- Main lecture:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:al-opening--scene>
- Inverse CDF:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:al-quantile--scene>
- Relationship map:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:al-map--scene>
- Live R, explicitly enable the existing connected/local-runtime mode:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1&interactive=1#/ex:mc-live--scene>
- Saved result:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:mc-result--scene>
- Supporting binomial popup:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-support#/ex:l5-b03b-scene--scene>
