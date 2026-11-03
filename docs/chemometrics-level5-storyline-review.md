# Level 5: visible data stories and model-checking decisions

Historical 55-scene revision. The main preview now selects the
[59-scene IC precision revision](chemometrics-level5-ic-precision-review.md). Its
chi-square section no longer shares the t section's five-reading dataset.

Local, uncommitted and unpublished. The main preview now selects the **55-scene**
`ex:path-level5-storyline` in its own named graph. Earlier 41/51-scene paths,
70-scene support and reserves remain available. This revision responds to the
instructor's criticism that narration alone did not give the slides a clear story.

## Teaching sequence

1. Merge the pipette questions and function diagrams onto one standard two-column
   slide. Three cards map the analytical purposes to PDF, CDF and inverse CDF;
   vertically arranged diagrams retain explicit input/output axes.
2. Begin Normal and Lognormal with their additive/multiplicative process pictures,
   before the detailed usecase and model. Quantitative slides now carry visible,
   authored question cards as well as same-slide symbol legends.
3. Introduce degrees of freedom before the sampling-distribution sections. Five
   centered residuals sum to zero, so four residual directions remain. Two method
   variances require two ordered df counts. Pearson's fixed-total category constraint
   leaves categories minus one, not observations minus one.
4. Begin chi-square, Student-t and F with dedicated process pictures. Each section
   then follows actual data through construction, reference law and application.
5. Inspect Q-Q plots before KS. Use the same compatible/departing examples for both
   visual checks and the numerical KS decision. Overlay ECDF and model CDF, mark
   the largest vertical gap, explain optional standardization and read the exact
   finite-sample table before comparing with a computed cutoff.
6. Use a separate grouped particle-count study for Pearson. Explain expected counts,
   add weighted discrepancies, read the chi-square table, reproduce its cutoff with
   a function, then contrast compatible and departing count outcomes.
7. Retain the relationship map and final eight-scene live dilution Monte Carlo case.

## A coherent chi-square and t example

The same five constructed nitrate repeats are used throughout both sections:
9.6, 9.8, 10.0, 10.2, 10.4 mg/L. Their mean is 10.0, squared deviations sum to
0.40 (mg/L)² and sample variance is 0.10 (mg/L)². Estimating one mean leaves
four independent residual directions; the original raw observations may still
be independent. Under iid normal sampling, an orthogonal residual construction
gives independent normal coordinates whose squared sum has the chi-square law.

The chi-square question is uncertainty in **true method repeatability variance**.
The observed estimate changes in a new five-result series; true variance is fixed
and unknown. Inverting chi-square quantiles produces its 95% confidence interval,
0.03590-0.82573 (mg/L)². This is explicitly not an interval of concentrations.
The new pivot shows the squared-deviation sum and scaled variance as the same
statistic; arbitrary unrelated normal coordinates are no longer the main example.

The t question changes the target to **the analytical mean**, not the dataset.
Under normal sampling the sample mean remains normal. Known population SD gives
a standard-normal standardized mean. Replacing it with the same series' sample
SD gives Student-t with four df. A chart compares df 4, 10, 30 and standard normal;
visible text explains why the estimated scale stabilizes as df grows. No finite
df equals normal and there is no universal sample-size-thirty rule. Estimated SE
is 0.141421 mg/L; the t-four multiplier 2.776445 yields mean interval
9.60735-10.39265 mg/L, distinct from individual-result model ranges.

## An explicit F dataset

Two new constructed six-result series, independent by model assumption rather
than paired, make the precision comparison inspectable:

- A: 9.7, 9.9, 10.0, 10.0, 10.1, 10.3 mg/L; variance 0.04 (mg/L)².
- B: 9.4, 9.8, 10.0, 10.0, 10.2, 10.6 mg/L; variance 0.16 (mg/L)².

Each fits one mean and leaves five df. Under equal true variances their common
scale cancels, yielding F(5,5) for the prespecified B/A ratio. Observed ratio 4
is below the upper 5% cutoff 5.050329: do not reject for the predeclared larger-B
alternative. The examples do not prove normality, independence or equal accuracy.

## Q-Q and KS share the same data

Fix the null normal CDF before observing either constructed sample: mean 10 mg/L,
SD 0.50 mg/L. These are separate from the repeatability study and its parameters.

- A: 9.4, 9.8, 10.0, 10.2, 10.6 mg/L, designed to look compatible.
- B: 10.3, 10.31, 10.32, 10.33, 12.0 mg/L, a deliberately skewed departure.

Q-Q probabilities are explicitly `(i-0.5)/5`. Plot theoretical fixed-model
quantiles horizontally and sorted observations vertically, both in mg/L. A is
near the identity line, while B bends strongly. Fitting a free location/scale
line is a different shape-only question. No finite plot proves a population family.

KS overlays empirical steps and the fixed smooth CDF on common axes. Check both
sides of every jump. A has D=0.1445782584; B has D=0.7257468822 just before its
first observation. The exact n=5 upper 5% cutoff is 0.5632751984. A is not rejected;
B is rejected. Non-rejection does not prove normality or independent sampling.

The ECDF already normalizes counts to fractions. Standardizing observations is
optional: transforming data and model with a fixed increasing affine transform
preserves D. Estimating mean and SD from the tested sample changes calibration;
use suitable Lilliefors or a bootstrap that refits each replicate, not the classical
fixed-CDF table. Ties, censoring and dependence also require matching procedures.

The authored KS table has n=4 and n=5 rows and upper-tail 0.10/0.05/0.01 columns.
The displayed base-R finite-sum function and `uniroot` reproduce the n=5 critical
value. The exact shortcut is explicitly restricted to candidate distances above
0.5, which includes all table entries, not advertised as a general KS CDF.

## Pearson: grouped counts, not a variance interval

Five fixed exhaustive particle-size categories have probabilities
0.10, 0.20, 0.40, 0.20, 0.10, giving expectations 10, 20, 40, 20, 10 for total 100.
The departing counts 4,12,44,24,16 give weighted squared discrepancy 11.6. The
compatible comparison 9,21,39,21,10 gives 0.225. Both use four df under the
fixed-total model with no estimated probabilities. Read df=4 and upper-tail 0.05
from the table, cutoff 9.487729; `qchisq(0.95, df=4)` gives the same value.
The approximate reference p value for 11.6 is 0.020587. Reject the departing
counts, not the compatible ones. This is an approximate multinomial reference,
unlike the exact normal-sample variance law. Expected counts, fitting, binning and
sampling assumptions determine whether that approximation is justified.

## Architecture and verification

- Scientific resources, numerical pairs, critical tables, code snippets, question
  cards, narration and path order are authored in TriG. JSON remains disposable
  generated transport. No schema, ontology contract or deployment setting changed.
- Existing `info-visual` columns now also accept infocards beside an illustration
  or chart. A contextual singleton following a visual remains with that visual in
  `visual-formula`, instead of enlarging the formula/legend column. No scene IDs,
  course labels or scientific assumptions enter composition inference or CSS.
- Tall media is contained by its standard column. Every displayed formula keeps
  its authored legend via `dct:hasPart` and the shared formula renderer.
- New SVGs have titles, descriptions, authored alternatives, theme-readable colors
  and no scripts or external requests. Q-Q plotted coordinates and KS distances
  are independently reproducible from the canonical TriG data/protocol.
- Nine new focused Python tests pass: ordering, visible questions, consistent data,
  Q-Q coordinates, both-sided KS and fixed-standardization invariance, every table
  entry's tail probability, Pearson examples, legends and accessible graphics.
- All 65 focused composition/layout Node tests pass.
- Initial broader tests found one old preview-selection expectation; it was updated
  for the new main path. Initial SHACL caught table-level `cd:language` inferring
  SceneItem, unsupported Python code language and direct `cd:code` selection paths.
  These were corrected in authored content using the existing contracts: language
  on SceneItems, base R and `cd:hasCodeExample`. No validation rule was weakened.
- Initial browser checks exposed stacking/overflow. Focused Edge checks now pass
  the merged opening, F decision, t convergence and both lookup slides in all three
  configurations. A small dark-desktop chi-square question overflow was shortened.
- The complete Student-t section subsequently passes all three configurations in
  Firefox. Both lookup slides, merged opening, F decision, t convergence and
  standardization pass their focused Edge checks. A structural chart-height limit
  reserves space for question cards beside formulas rather than hiding those cards.
- Native forward and reverse navigation passes all 55 scenes in Edge and Firefox.
- Final full browser matrices are running on stabilized sources:
  `level5-storyline-edge-final.log` and `level5-storyline-firefox-final.log` in the
  approved local temporary directory. They cover all 55 scenes at 1731×1006 light,
  1280×720 dark and 390×844 light with unique reload parameters, loaded images/fonts,
  formula/legend visibility and overflow checks.
  Firefox has completed successfully: all 55 scenes pass in all three
  configurations on the stabilized sources.
  Edge has also completed successfully for all 55 scenes in the same three
  configurations. Both final browser matrices pass.
- The authoritative `npm test` in `level5-storyline-final-npm-test.log` was stopped
  before implementing the instructor's subsequent IC precision revision. No final
  pass is claimed for that cancelled run.
  Previous passing 725-test evidence belongs to the 51-scene revision, not these
  new sources. The earlier targeted log had 177 passing tests and one stale preview
  expectation; the updated selection expectation is included in this fresh full run.
- The actual TriG-selected R snippets for both critical-value functions pass in
  separate disposable browser workbenches in Edge and Firefox:
  `level5-storyline-reference-r.log`. Assertions verify the exact KS cutoff
  0.5632751984 and Pearson reference tail 0.0205873723. The presentation snippets remain static
  references, not additional audience tasks or new executable slide controls.

No learner data is collected. No real analytical evidence, legal threshold or
pedagogical-effectiveness claim is introduced. Timing still needs instructor rehearsal.

Preview: <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:al-opening--scene>
