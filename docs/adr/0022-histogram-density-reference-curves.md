# ADR-0022: Density reference curves on existing histograms

- Status: Proposed, local Level-5 authoring review
- Date: 2026-10-31

## Gap and reuse

The existing histogram handles immutable observation values, density normalization,
numeric bin edges, optional controls and complete static rendering. Existing line
series carry authored coordinates and provenance. Neither a count histogram with a
density on an unrelated scale nor a separate imitation of histogram bars would be a
truthful model comparison. The existing histogram renderer had no reference-curve
layer.

## Decision

Add optional `curves: LineChartSeries[]` to one-dimensional density histograms in the
unpublished SceneDocument 1.13 proposal. Reuse `dct:hasPart` Dataset references,
canonical line-series projection and source references, not a new semantic property
or a distribution-specific runtime. No curve is inferred or fitted by the renderer.

Compiler, Core and SHACL require a 1D density chart with explicit density units.
The compiler also checks matching Dataset/x-axis measurement units, coordinate
coverage and disjoint data/curve point identities. Core validates unique identities,
provenance, finite nonnegative heights, ordered x coordinates and edge coverage.
Earlier document versions reject the new capability. Histograms without references
retain their existing behavior and version.

The renderer uses the maximum of both bin heights and curve heights for one shared
y scale. Curves render after bars, as unfilled lines without observation markers.
Static renderer and Python-generated HTML alternatives list reference labels and
all coordinates separately from sample observations. References do not enter bin
counts or normalization. Existing optional bin adjustment remains independent of
the reference coordinates and does not estimate a new model.

Only opted-in reference figures receive a capability attribute. On narrow screens,
that attribute removes the projection-sized SVG minimum height, retaining the bars,
curve and authored caption at their natural aspect ratio. No scene IDs, course
names, new theme tokens or per-slide CSS enter this rule. Legacy Levels 0-4 figures
do not carry the attribute and are unaffected.

## Verification

Core tests cover version gating, invalid scales, clipped/negative/nonfinite/unordered
coordinates, duplicate identities and complete numerical fallbacks. A renderer DOM
test uses a reference taller than the histogram to catch clipping and verifies
separate layers, count preservation, no markers, fallback content and cleanup.
Authoring tests verify numerical normal references, exact histogram counts/areas,
provenance, compiler/SHACL failure cases and the generated HTML alternative. Browser
reviews cover both engines, themes and narrow layouts.
