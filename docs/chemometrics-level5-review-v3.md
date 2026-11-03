# V3 review response

Source: `Review_Chemometrie_Verteilungen_V3_2026-11-02.md` and the actual
`Downloads/authoring.html_2.pdf`. Its page 22 was rasterized and inspected: the
final paragraph really extended below the page. This is not dismissed as a
reviewer or extraction error.

## Implemented changes

### Local overworld integration

The reviewed 41-scene path is now the sole path of the course learning unit
`learning-unit-theoretical-distributions`. Its placement follows Level 4 at
position 60 (displayed as Level 5) and belongs to Region 3, now labelled
“Theoretical Distributions & Similarity Analysis”. The description distinguishes
distribution foundations from the retained follow-up inference topics.
The earlier authoring unit and its draft paths remain separate and unchanged.
The level uses source-backed local island artwork with authored alternative text;
no learner tracking, network service or deployment was added.

Run `npm --workspace @project-chemie-digital/pitch run generate:introduction`
to refresh the disposable course manifest/transports, then open the local root
URL and start Level 5 in Region 3. The bounded review-preview command now selects
the same exact path/graph through its integrated course context.

“Where do the heavier tails come from?” starts at two measurements per series
(n=2, hence one Student degree of freedom). Reset restores this start value;
other experiments retain their own sample-size defaults.

The independent-square slide also shows the general chi-square density and the
Gamma integral defining its normalizer. Its linked Symbols legend distinguishes
random X from value x, integer component counts from positive-real degrees of
freedom, density from probability, support and the integration variable.

Latest local checks: 17 focused source tests and the Edge complete-selection
browser checks pass, including the two-component initial state. The chi-square
slide passes both light/dark PDF layout audits. The whole PDF audit is **not**
green: the separate descriptive-spread slide (`ex:rv-n32`) is flagged for using
less than 70% of page width. No full-suite certification is claimed here.

Mobile R workspaces temporarily move outside the transformed slide, preserving
their editor/output state and restoring their original location on close,
desktop resize, printing or teardown. Edge workspace checks cover all eight R
scenes plus resize, summary close, Escape and before-print restoration.

The independent-square experiment starts with two components (chi-square with
two degrees of freedom); its control range and deterministic simulation remain.

The descriptive spread calculation displays the independently known reference SD
0.10 mg/L alongside the sample SD about 0.155 mg/L. Its sigma-zero notation and
reference-versus-estimate distinction are included in the linked symbol legend.

Opened optional R experiments now use a bounded split workspace: code on the left,
an always-visible execution bar and a scrolling results/inline-graphics pane on
the right. The panel is fitted to the intersection of slide and viewport in
logical slide pixels; code typography is not scaled down. Narrow screens stack
the two independently scrolling panes. Static source/output placeholders remain
available if editor enhancement fails; graphics can still be enlarged separately.

The lognormal caveat slide uses three concise bullet lists. Bold lead-ins separate
mechanism and action; one highlighted caution per card distinguishes mixtures,
censored results and environmental sites without relying on color alone.

Panoramic media/formula views place the illustration full-width above its formula.
The renderer classifies loaded image geometry, not scene IDs or asset filenames;
this enlarges the two distance scales while keeping ordinary illustrations in
their existing compositions. Cached and asynchronous images share the hint and
its cleanup lifecycle.

The selected lecture is titled “Theoretical Distribution Models”; the method
comparison scene is titled “Compare Methods on a Standardized Scale”.

The five-family overview now emphasizes mechanisms and examples rather than only
transformation arrows: additive contributions, relative factors, independent
squares/scaled variances, standardized means and normalized variance ratios.
Five canonical formula/legend units reuse a generic overview matrix; every
expression retains its same-slide symbol key. Conditions distinguish exact
constructions from approximations. The original relationship-map media remains
available to the longer paths.

The Pearson count comparison uses observed-count bars and larger red expected-count
markers with a contrasting outline. The expected markers are drawn last, so bars
cannot hide them; legend color and shape match the plot in both themes. Counts,
category order and the resulting statistic are unchanged.

Editorial labels such as “Printed state:” and “Printed answer:” are removed
from the slide text. Physical measurements and measured values are described as
“measurements”, “measurement results” or “results”, including the experiment
controls, table headings, diagrams and result summaries. Technical reading-order
identifiers and prose about reading a plot are not renamed.

The standard-normal CDF scene also gives its error-function representation and
defines erf by the Gaussian-kernel integral. It distinguishes an antiderivative
of the normal density from an elementary antiderivative: erf is a special
function, and the half-offset/scaled argument gives Phi. Both symbol entries
are linked to the expression and available in the same-slide legend.

The Pearson decision scene explicitly explains that its initial statistic 11.6
exceeds the four-df 5% cutoff 9.49: the observed particle counts depart
significantly from the stated category proportions. Its visible interpretation
updates with the count outcome; non-rejection does not establish equal proportions.

### Interactive-box density pass

- Shared experiment rendering now emphasizes question-specific readouts rather
  than every computed diagnostic. Values are not recomputed or rounded in the
  scientific result; full-precision results remain in the numerical disclosure
  and in script/static fallbacks. The single Monte Carlo trial retains its
  complete draw/transform/result sequence and the repeated trial retains source
  SD comparisons.
- Detailed model notes use a keyboard-accessible, bounded disclosure over the
  widget, avoiding extra slide height when opened. Escape closes it. Empty error
  feedback occupies no space; non-adjustable demonstrations have no reset row.
- Experiments with supporting interpretations use reusable desktop columns;
  narrow screens stack them. Charts and controls retain their font sizes rather
  than solving overflow through whole-slide miniaturization.
- Shorter authored bullets replace repeated prose in lognormal probability,
  variance precision, device comparison, outlier, Pearson, Student and F views.
  Long text in the original model notes remains available, not truncated.
- Screen auditing now checks the actual viewport in deck mode, not only the
  potentially oversized slide rectangle, and inspects scroll scenes directly.
  This is separate from PDF fitting and does not by itself certify opened code
  editors or every possible parameter combination.

Current selection after the user's follow-up: **42 slides** including the title.
“The same phi and Phi, with a log-scale z-score” is deselected; its original
scene and lognormal formula resources remain authored for later use.
The complete dilution/Monte Carlo block (original scenes 64–66) is now deselected;
its equation, input models, deterministic replay and results remain authored.
The separate “Two df parameters, in a meaningful order” and
“Square a t variable and obtain an F variable” scenes are no longer selected.
Two new introductions explicitly show the repeated sampling experiments before
the t and F distributions. Shared RDF flow diagrams show sampling, estimation,
standardization/normalization and collection of one value per complete repeat.
The t introduction directly precedes “Where do the heavier tails come from?”.
The F introduction precedes the two-group example. Each formula has a complete
same-slide symbol legend; neither introduction makes a test decision.
“Why not use the familiar normal reference?” and
“Normal divided by an independent variance factor” are also deselected.
The t/F block now covers distributions only: construction, shape, ordered degrees
of freedom and the normal limit. The CRM bias setup,
observed t calculation, t decision and confidence interval, F decision, calibration
comparison sequence and test-assumption stress application are not selected.
Their original resources and numerical examples remain available for later use.
New distribution-only experiment views omit observed statistics, p-values,
rejection areas and critical-value markers, including in their numerical details.
The text below “Why the long right tail” is no longer selected; the title of
“Same method, different spreads” no longer contains “stable” or “estimated”.
The former nitrate dotplot, empirical-threshold and adjustable-bin warm-up slides,
the individual-versus-mean comparison, the early normal-model stress slide
“Apply a factor, then its reciprocal”, “Mode, median and mean no longer coincide”
“Next problem: the estimated log spread is random”,
“Six residuals, but the sixth cannot vary freely” and
“Unbiased variance is not yet an exact chi-square law”
are removed from this path only; their scenes, data and earlier paths remain.
References below use the original 66-page review numbering, not current pages.

The linked PDF/CDF scene now uses authored bullet points and a complete
symbol key. Following the approved rule change, formula legends globally start
collapsed under one keyboard-accessible “Symbols ▸” control per legend. Opening
it reveals both compact definitions and additional explanations, without nested
disclosures. Script, static and PDF views retain the complete legend.
This generic adapter capability reuses existing authored
`cd:presentationDefinition` for the visible definition and `cd:body` for expanded
prose. Script and static fallbacks retain both; slide printing retains the
complete visible key, without the optional prose. This does not authorize hiding
the symbol meanings required to read a displayed formula.

| Review items | Change |
| --- | --- |
| V3-01/29 | N22 now has one concise experimental question and conclusion. The full preparation/injection distinction remains in narration and the extended path. No scene-specific height or coordinates. |
| V3-02/09 | Six route questions explicitly distinguish three separate appointments. All 65 authored scenes have speaking/interaction planning estimates, session membership and one of five teaching roles in TriG. Estimates are not measured teaching times. |
| V3-05 | Main scientific readouts and marker labels use four significant figures, with scientific notation for small values. Full numerical precision remains in the core, the accessible data panel and the script's numerical fallback. Duplicate median/source rows and repeated Pearson contribution readouts no longer compete with their graphs. |
| V3-06/19/22/27 | N12 is a coordinate-only model and formula, without probability readouts, shaded tails or Phi. N13 retains only the two known-SD distances. N15 resolves the upper-tail question. N20 has observation-order/SD readouts only, with no F ratio, F p-value or inference notes; N58 retains the later nominal comparison. |
| V3-16 | N09 uses one series color and semantic emphasis on cancellation. A point annotation and the six explicit sign routes distinguish six paths to zero from one path to an extreme. Annotated ungrouped bars use the shared renderer, not scene CSS. |
| V3-17 | N10 begins at four contributions, includes a fixed 200-contribution comparison and permits 16/50/200 interactively. The central window is ±4.5 SD; every exact finite outcome remains in the numerical data, with outside-window mass reported. |
| V3-33 | N26 restores the full lognormal density/right tail and adds a magnified inset of the same three centers. Both views use the same parameters and density function. |
| V3-38 | N31 removes the duplicate cards and retains the single three-station process at full width. The fixed-reference teaching assumption and study boundary remain explicit. |
| V3-44 | N37 reuses the authored mathematical-derivation mechanism. The initial live state asks for the sixth residual; advancing reveals the operation and answer. The PDF includes question, operation, answer and their complete legend. |
| V3-52 | N45 has three compact rows showing Z, Q/nu and the quotient with the common sigma visible in numerator and denominator before it cancels. |
| V3-63 | N56 enlarges the common-scale residual comparison and shows only the RSS improvement before the test calculation. Full response fits remain in the extended material. |
| V3-64 | N57 adds the actual rounded RSS calculation, yielding 71.66, and explains the one added coefficient and nine residual df. |
| V3-69 | N63 displays the Pearson sum, the first category calculation and the five-term sum 11.6 beside the contribution graph. The test decision and calibration conditions remain visible. |
| V3-72 | N66 adds a labeled common-scale bar comparison of absorbance-only and volumes-only output SDs. These are separate propagated SDs, explicitly not additive shares. All modes retain the same uniform triples. |

The 66-slide selection, English text, raw datasets, exact CRM/device constants,
seeded numerical references and extended paths remain. No commit, push,
deployment, workflow-state update or publication is authorized or performed.

## Deliberate limits and remaining review items

### Subsequent user addenda: PDF/CDF first, standard z notation

These supersede the earlier V3-16/17 combinatorial revisions **in the complete
66-slide selection**, without deleting their authored scenes or extended paths:

- N03 introduces interval, cumulative and inverse questions instead of binomial
  recall. The same twenty nitrate observations remain on N04–06.
- N05 explicitly distinguishes the sample ECDF from a population CDF. N07 no
  longer switches to another six-reading vignette; N08 labels its growing
  histogram as simulation, not additional measurements.
- N09 overlays a model PDF on a finite histogram and lets the interval width
  change. Its general formula connects interval probability, density integral
  and a CDF difference.
- N10 couples density area and CDF ordinate to one threshold, explains the
  derivative relation with its conditions and provides the inverse question.
  Both a smooth bell model and a bounded flat model are executable, so these
  tools are visibly not exclusive to the Normal family. Parameters, seed and
  family selection are authored in TriG; numerical functions are in the pure
  core under the new generic `distribution` mechanism.
- N11 specializes general f to standard-normal phi; N14 specializes F to Phi.
  The central-limit motivation is brief and conditional, not a required
  combinatorial derivation.
- Normal standardization consistently distinguishes random X/Z from concrete
  x/z. Lognormal standardization uses z with subscript L. Formulas, legends,
  narratives, axes, media alternative text, SVG labels and R code are updated.
  Existing resource IRIs and media filenames remain stable; an opaque identifier
  containing the old spelling is not a displayed mathematical convention.

Focused regressions protect generic interval/CDF/quantile results for both model
families, PDF as local CDF slope, retained observation data and the absence of
the retired notation in authored teaching literals.

- V3-03/71's suggestion to hide complete symbol legends conflicts with the
  repository's same-slide authored-legend invariant. Legends remain visible;
  redundant surrounding displays are reduced instead. Neither source semantics
  nor required assumptions are silently deleted.
- The five-role taxonomy and timing/session metadata are authored planning aids.
  Layout still uses the existing component-signature compositions and shared
  derivation stages. A new universal role-controlled staging/layout contract is
  **not** claimed; that broader part of V3-07 remains open.
- Optional P2 changes such as additional mixture plots, merged slides, staged
  ECDF subtraction and process perturbation markers remain separate work. The
  optional second histogram on N22 is not added.
- Real teaching time, rear-row readability and pedagogical effectiveness require
  human observation. Native Firefox saved-PDF output is not manually certified.

## Verification

Regressions cover the two story gates, full-density/inset consistency, initial
four-versus-200 state, common stress axes, residual answer staging, numerical
formulas, role/session/timing coverage, control bounds and retained exact test
references. Browser QA exercises each scientific control and checks the N37
question/operation/answer progression rather than simply forcing fragments on.

PDF QA retains all-page width, graphics, clipping, formula and saved-text checks,
and additionally rejects explanatory paragraphs below 10 effective CSS pixels.
This is a conservative automated floor, not proof of classroom readability.

Final-source results and disposable evidence are recorded after validation;
earlier V2/Gate-1 results do not certify this source state.
