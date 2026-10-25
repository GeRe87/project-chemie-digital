# ADR-0018: Generic interval, bin and ECDF exploration options

- Status: Proposed (local Level-4 authoring)
- Date: 2026-10-24

## Decision

SceneDocument **1.11** adds three optional capabilities without changing previous
statistical conventions or coupling the core to a presentation framework:

- A categorical dot group may carry one source-linked **closed observation
  interval** with finite ordered bounds. The displayed fraction is counted from
  that group's actual observations, retaining ties. It is not inferred from the
  interval label and is not a confidence interval. Bounds expand the numeric
  domain; numeric scatter, stems and boxplot groups cannot carry this option.
- A 1D histogram may expose bounded **width and origin adjustments**. The
  initial grid must have equal widths. Adjusted grids extend across the entire
  authored domain, never silently dropping observations. Named starting rules
  are Freedman–Diaconis, Scott and Sturges; zero dispersion produces no positive
  proposal. Rule proposals are rounded/bounded explicitly by the UI. The
  covering grid can have an additional boundary bin.
- An ECDF may suppress observation-card rows (`compact`) and compare multiple
  explicitly ordered series. Each retains its own denominator and complete
  accessible data/step fallback. Threshold bounds cover **all** series and both
  tails. Ties enter together, with included right-continuous endpoints and
  excluded left limits. The plotted vertical connectors do not interpolate the
  step function.

An ECDF can additionally set `interactive: false`, authored as
`cd:interactiveObservations false`, to retain the same fixed curves, threshold
readout and accessible data while omitting every threshold input/reset control.
This option requires a compact ECDF. Static charts do not claim interactive host
focus or intercept presentation navigation keys. Earlier interactive ECDFs remain
supported when the option is absent.

RDF vocabulary and targeted shapes live in `ontology/dataset/exploration-options.trig`.
Intervals, chart settings, observations, series and explicit placements remain
TriG-authored. JSON is only generated transport. `cd:bodyFormat "markdown"`
explicitly opts prose into the existing safe Markdown subset; plain prose is not
reinterpreted. Static projections retain interval counts and all ECDF series.

The existing `info-visual` composition also handles one explanation alongside an
unaccompanied mathematical formula. Formula/legend collections retain their
existing composition. Colored explanatory cards and compact ECDF styling are
generic selectors, never scene- or resource-specific layouts. Keyboard/wheel
isolation and live textual readouts belong to the renderer.

## Scope

This remains an uncommitted local authoring increment. It does not enable a
dispatcher run, alter workflow state, publish content, or constitute exact-head
external validation. No learner data collection or remote statistical service is
introduced. The new final lab uses base R in the existing lazy local webR runtime.
