# ADR-0019: Shared observation moment views

- Status: Proposed (local authoring)
- Date: 2026-10-24

SceneDocument **1.12** adds the observation view `moments`, with one explicitly
chosen `momentMetric`: mean, variance, kurtosis or skewness. It reuses existing
source-attributed datasets, ordered series and observation placements. No separate
SVG/JSON lesson source or scene-specific layout is authored.

The core computes descriptive empirical moments from all retained observations:
central moments use n, sample variance uses n−1, standardized moments are undefined
at zero dispersion. Computation is renderer-neutral, checks finite inputs/results,
and uses an origin-offset mean to keep constant samples exactly zero-dispersion.
The view supports 1–6 explicitly ordered series; the present lesson authors three.
Earlier versions reject the new view instead of silently misinterpreting it.

D3 projects each series as points, a type-7/1.5-IQR boxplot and a common-bin count
histogram. All panels share the measurement domain, bin edges and count scale.
Every row's three panels derive from the same observations, not copied statistics.
Mean and variance-scale guides have measurement units. Skewness/kurtosis remain
printed dimensionless coefficients, supported by contribution/scale/median cues;
they are never plotted as if they were measured values.

The generic existing visual-stage composition hosts the multi-view chart. Accessible
fallbacks retain all observations, coefficients, box summaries and bin counts.
SHACL and compiler checks constrain the metric/view relationship, series counts,
units, placements and provenance. Semantic content remains solely in TriG.
