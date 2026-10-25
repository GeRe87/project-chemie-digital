# ADR-0017: Native histogram and paired 2D-histogram primitives

- Status: Proposed (local Level-4 authoring)
- Date: 2026-10-24

## Decision

SceneDocument **1.10** adds `chartType: "histogram"` and `"histogram2d"` without
changing the meanings of the earlier primitives. The core remains independent of
D3, React, Reveal.js, webR and course/scene identities.

A 1D histogram contains original, uniquely identified source-attributed observations,
numeric bin edges, axes/units and explicit normalization (`count` or relative-frequency
`density`). A 2D histogram contains paired x/y values on each observation, two sets
of edges and both measurement units. It never independently sorts or joins x and y.

All bins are left-closed/right-open except the last bin, which includes the final
upper endpoint. Inputs must be finite, nonempty, and fully covered by strictly
increasing edges. Unsupported or ambiguous input fails closed: no discarded tails,
silent NA removal, invented observations, zero-width bins or implicit bin rules.
Current bounds are 512 bins per axis and 4096 cells per 2D grid.

Unequal-width 1D bins **require density heights** `count / (n * width)`, so their
areas equal sample fractions and total area is one. The current 2D primitive uses
equal-width cells within each axis and count normalization only. Unequal-area 2D
density maps would need a separately reviewed extension, not accidental reuse of
the count-color scale.

RDF uses `cd:Histogram`/`cd:Histogram2D`, `cd:usesDataset`, ordered `cd:binEdges` /
`cd:yBinEdges`, `cd:histogramNormalization`, and per-observation `cd:pairedValue`.
`cd:yMeasurementUnit` declares the second dataset coordinate unit. Edge lists use
**named RDF list cells**: blank-node subjects outside SHACL graphs remain prohibited.
SHACL checks structure; the compiler and core validate numeric geometry, units,
coverage, normalization, paired provenance and bounds. Numeric calculations are
mirrored in bounded Python and TypeScript tests, including endpoint/tie cases.

D3 draws bars with actual interval widths on a numeric axis. The density axis scales
to the actual heights, not a minimum height of one. The 2D view exposes numeric cell
counts as well as a color/count range and a full text alternative. All renderers
retain numerical bin/cell tables; core/static projections never depend on a canvas
or a successful R session. Existing shared composition signatures select the layout.

## Related presentation fixes

- Native boxplots optionally expose all original observations alongside the box via
  `showObservations`, while retaining separate flagged observations and observed
  whisker endpoints. This is a generic chart option, not a distribution-specific view.
- Formula legends wrap long terms and descriptions without overlap. Multi-row
  expressions share an intrinsic, readable size rather than a scene-specific scale.
- Semantic tables receive the shared theme-aware row palette by default, regardless
  of column count or slide composition. Text and numerical labels remain intact;
  color is not the only encoding.

## Semantic source boundary

TriG remains the sole authored semantic source. One-shot drafting recipes were
archived outside the repository after creating the static synthetic snapshot; no
parallel Python-authored lesson or semantic generator is retained. Applications,
preview generation and tests read the TriG only. The synthetic grids' arithmetic
is independently checked in tests, alongside SHACL and browser evidence. No retired
JSON-LD/Turtle source or GitHub Actions workflow is restored.
