# Standardized regression-window charts

## Semantic authoring

`cd:RegressionChart` is a generic paired-observation chart in SceneDocument 1.14.
It is not tied to a talk, polymer, file name, scene ID or CSS layout. Use the
existing chart axis labels/units and `cd:usesDataset`. Each ordered Observation
has `cd:xValue` for the assigned predictor, `cd:numericValue` for the response,
`cd:position` for authored display order, and provenance. Repeated predictor
values are allowed, unlike a line series with strictly increasing x coordinates.

`cd:hasRegressionWindow` links ordered `cd:RegressionWindow` resources. Each has
a label, a positive contiguous position, explicit `cd:hasObservation` membership
and `cd:authoredResource true`. Windows only select observations from the chart's
dataset and contain at least three members. They can describe growth, replacement
or other explicit subsets without implying that the display order is chronological.
Labels and narration must explain what the order and the selections mean.

The compiler projects ordered data and window identities with source references.
SHACL checks vocabulary, units and membership. Core validation checks identities,
finite values, membership and the mathematical preconditions of every fit. A
singular predictor or a zero slope in a held-out inverse fit is an error, never
silently replaced by zero prediction error.

## Fixed, transparent statistical meaning

The shared core calculation fits ordinary least squares of response on predictor.
For each member of a selected window, a separate fit excludes that member and
inverse-predicts its predictor value from its held-out response. The chart displays
the absolute errors and their arithmetic mean, in predictor units. These are
leave-one-out **internal** checks, not training residuals, independent validation,
confidence/prediction intervals or evidence that a method is fit for every matrix.
No regression equation is printed, so no hidden formula legend is required.

The generic D3 primitive links three views of that same window:

1. Membership strip in the authored display order.
2. Paired observations and their ordinary least-squares line.
3. Held-out inverse-prediction errors and their mean.

Scales remain fixed across windows. Colours link observations between views;
labels, counts, tooltips and full text alternatives do not rely on colour alone.
The first window appears on entry, with later stages controlled by the existing
presentation-step runtime. A window may author `cd:cycleIntervalMs` (at least
100 ms). This enables the shared FIFO replay: advance by exactly one observation,
keep the window size fixed, and wrap modulo the dataset length. Initial members
must be contiguous. All possible frames are checked for valid fits and included
in the shared axis-domain calculation. There is no slide-specific state machine.
The timer stops on stage/slide exit, document hiding and teardown. A pause/resume
control is provided; reduced-motion mode starts paused and requires opt-in replay.
The heading/chart/takeaways composition, theme and narrow-screen horizontal
scrolling remain shared with the other chart primitives.

Core, Pitch, static Reveal and self-study retain full data/window alternatives.
The Python static export lists all paired values and window membership without
JavaScript; the TypeScript alternatives also report the derived error summaries.

## Talks migration and evidence limits

The calibration-overhead slide reuses the already authored optimized timeline
schedule, with five standards alternating with five blanks. Its tenth post-run
ends at **550 min (9 h 10 min)**. No duplicate schedule or hidden timing override
is introduced.

The running-calibration slide transcribes all 44 `mass_ug`/`area` pairs from the
author-supplied `sbr_mz104_peak_table.csv`. Source SHA-256:
`772240ea48f349f0089faae3ca9bb465744a0f51afc1a43694ee1815b7cf3f3c`.
Source row identifiers remain for audit; original measurement file names and
acquisition dates are not included in the public dataset. Mass units are µg;
peak-area units remain explicitly unspecified source units.

Display order follows the old talk's five near-equal-size mass strata (9/9/9/9/8), cycling
through one member per stratum. This is **not acquisition chronology**. Authored
windows select the first 5, first 15, then replay a 15-member FIFO window over all
44 standards, one position at a time, including wraparound. The old raw-peak panels
and fixed-t confidence-band shortcut are not copied. This is a teaching replay,
not a claim about real-time drift correction. No promise of decreasing error or
permission to omit blank/quality-control runs is made.

## Sample-evaluation comparison using the existing dot plot

`talks-ted-sample-comparison.trig` authors the supplied Influent/Effluent triplicate
areas and sample masses, the calibration reference, one-based local window starts
(16 and 15), window size 15, neighbor radius 5 and normalization factor 1000.
The latter converts predicted µg SBR per µg sample to µg/mg. No private measurement
file names or acquisition dates are exported.

Normalized results, means and descriptive error bounds are materialized RDF
scientific records, not authored JSON. They are reproducible with
`packages/core/src/calibration-evaluation.ts`. Input changes require recomputing
and validating these records, not editing generated transport. Each local result
averages three normalized replicates. Each neighboring result averages eleven
three-replicate means from the selected overlapping 15-standard windows. This
is an ensemble of simple fits, not multiple-predictor regression or averaging
regression coefficients. The source selects balanced-order windows, not verified
calendar-session matches. No repeated boundary windows are substituted.

There is no new result-specific chart kind or layout. Standard dot groups author
`cd:revealStep` (positive contiguous stages beginning at 1); the first two local
groups appear on entry, followed by the two eleven-window groups. The optional
`cd:showSummaryValues` displays numeric means. `cd:intervalRole cd:DescriptiveError`
renders whiskers, not a coverage band or a percentage-inside calculation, in both
interactive and text alternatives. Existing coverage intervals keep their behavior.
Legend rows are handled by the generic chart composition.

The local descriptive standard error is across three replicates; the ensemble
standard error is across eleven highly overlapping window means. Those are
different sampling units. Narrower bars do not establish lower measurement
uncertainty, better precision, independence or a confidence interval. The chart
and narration explicitly preserve that limitation.

The existing `cd:yAxisMinimum` option is also available on line charts. It is
projected with provenance, checked against clipping and preserved after scale
rounding. The heating-rate study uses 20 as its lower y boundary.

## Presentation rules

Project authoring rules in `AGENTS.md` now prohibit Unicode U+2014 in authored
presentation text and new prose. Talks content uses colons, commas or full stops
instead. Other unrelated historical collections are not rewritten by this task.

The shared presentation runtime gives chart and diagram-state hosts an automatic
initial stage of 1. Only stages 2 onward receive Reveal fragments. Inactive slides
remain at stage 0 until entry, so their first animation is not completed off-screen.
Backward navigation at the initial visible stage returns to the preceding slide,
not an empty plot. Nonvisual code/derivation hosts retain their previous behavior.

Regression/core and content checks are prepared for the final validation phase.
Comprehensive suites remain deferred at the owner's request.
