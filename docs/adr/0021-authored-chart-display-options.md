# ADR-0021: Authored display options for model charts

- Status: Proposed, local Level-5 authoring review
- Date: 2026-10-31

## Existing capability and actual gaps

BarChart and LineChart already provide canonical data, annotations, range shading,
static fallbacks, theme tokens and presentation lifecycle integration. Their default
annotation behavior progressively reveals content. Line charts connect coordinates
linearly and mark every coordinate. Those defaults cannot truthfully represent a
right-continuous discrete model CDF or a continuous density without apparent sample
markers, and they introduce unwanted reveal steps in the current lecture style.

## Decision

Extend the existing unpublished SceneDocument 1.13 proposal with optional, authored
chart display metadata. Do not add a distribution-specific slide/runtime type:

- `chartPresentation`: complete or the existing progressive behavior, for bar/line.
- `lineInterpolation`: linear or step-after, for line charts.
- `showChartPoints`: optional model-coordinate markers, for line charts.
- `chartYMinimum` / `chartYMaximum`: an exact, complete line-chart y domain.

TriG remains the authored source. SHACL, compiler and Core reject invalid values,
incomplete or clipping domains and invalid chart kinds. The compiler carries explicit
metadata provenance and promotes documents containing it to 1.13. Earlier document
versions reject these new fields. Omission preserves accepted renderer behavior.

Complete presentation shows traces, authored emphasis and annotations immediately,
with zero native fragments. It does not simulate clicks or create a parallel counter.
Step-after interpolation draws right-continuous horizontal segments, with optional
filled values and hollow left-limit markers at jumps. Hidden coordinate markers do
not hide authored focus annotations. Complete range annotations retain their existing
area highlight and add endpoint guides. Explicit y domains are not widened by nice
axis rounding, and take priority over application display defaults.

The renderer knows no course identities or probability-model names. Scientific values,
model status, interpretation and symbol legends remain authored resources. Ordinary
line-chart samples are not silently called observations or empirical distributions.

## Compatibility and verification

Existing chart defaults, progressive steps, markers and coordinate order remain the
same. The new marker fill and range-label contrast rules target only opted-in step or
complete charts. No new slide-specific CSS or Reveal dependency enters the core model.

Tests cover metadata validation/version gating, complete/default plans, scientific
coordinate preservation, right-continuous SVG geometry and markers, immediate area
and point annotations, exact domain bounds, static fallbacks and lifecycle behavior.
The Level-5 authoring review separately verifies numerical PMF/CDF/integral/quantile
relationships and the complete same-slide authored symbol legends.
