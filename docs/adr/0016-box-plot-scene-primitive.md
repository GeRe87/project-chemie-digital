# ADR-0016: Add renderer-neutral box plots in SceneDocument 1.9

- Status: Proposed (local Level-4 authoring increment)
- Date: 2026-10-23

## Context and decision

The requested boxplot construction/examples need a real statistical chart, not an
authored SVG, dataset-specific renderer branch or R-generated slide layout.
SceneDocument **1.9** therefore adds `chartType: "box"`. It is additive to 1.8,
including observation explorers, dot plots, tables and derivations. Older declared
versions reject this primitive.

The chart contains ordered, source-attributed groups of original finite observations,
axis labels/units, an explicit `quantileMethod: "type7"`, a finite nonnegative
`fenceMultiplier`, and an optional numeric lower axis bound. It contains no layout,
CSS, coordinates, Reveal identities or dataset-specific calculation instructions.
Numeric input is equally weighted; missing/nonfinite values are rejected, not dropped.

RDF uses `cd:BoxPlot`, existing `cd:ChartGroup`/`cd:usesDataset`, explicit
`cd:dependsOn ex:sample-quantile-type-7` and `cd:fenceMultiplier`. The compiler reuses
the existing dataset/group projection and rejects dot-only options or undeclared
quantile conventions. SHACL covers authored structure and explicit conventions.

The pure core calculation preserves ties, singleton/constant cases, observed
whisker endpoints and the indices of flagged observations. It never changes or
excludes the original data. Fences and whiskers are distinct. A combination with
no observed value inside the fences is rejected rather than inventing endpoints.
The lecture uses multiplier **1.5** throughout.

D3 renders the primitive using the existing dot-chart theme/axes and the existing
renderer-owned composition policy. Self-study and Reveal transport adapters retain
a complete numerical text alternative; the Pitch chart adapter supplies the visual.
The Python static compiler emits original values, quartiles, fences, whiskers and
flagged observations. Tests verify numerical agreement and fail-closed versioning.

## R-lab boundary

R graphics are generic executable-code output, not semantic chart sources. The
existing pinned webR runtime now captures text and ImageBitmap graphics. Protected R
objects are purged; bitmap resources are closed after drawing; executions are queued.
Plots open through the existing accessible explanation dialog, with Escape/focus
return. Reset clears both text and graphics. R stays lazy until Run. No code parsing,
scene-specific dependency installation or automatic package downloads were added to
the renderer: the authored R example explicitly handles its ggplot2 dependency.

In webR 0.6.0, the default R device is set to `webr::canvas` so that captureR can
restore a valid browser device after a capture. Text-only Variance examples remain
compatible and are exercised alongside a real ggplot2 run.
