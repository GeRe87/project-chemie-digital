# Level 4: readable comparisons and applied-moment grids

Local authoring increment, 2026-10-24. Supersedes the active sequence documented in
the earlier ECDF/moments review; earlier resources remain available but unselected.
No commit, PR, merge, deployment or full/external validation is included.

## Active sequence: 65 scenes

Scenes 1–55 retain the opening, order statistics, spread comparison, boxplots,
histograms and ECDF sequence, with these presentation corrections:

- Dot-plot legends reserve space above the numeric-axis title. Interval coverage
  labels have their own row below the axis title, above the data.
- Complete categorical names wrap according to available width; numeric plot
  geometry reserves the resulting label height rather than overlapping tick text.
- Formula legends color individual symbols with stable palette tokens. Common
  symbols retain their colors across legend terms and descriptions; prose stays
  ordinary text, and color is never the only identifier.
- The ECDF introduction motivates a bin-free empirical frequency representation:
  no bin width, origin, bandwidth or assumed family. It explicitly distinguishes
  cumulative frequencies from local density and does not claim to remove sampling
  bias or measurement limitations.
- Static ECDFs have no description/readout header boxes, controls or redundant
  single-series heading. Multi-series keys and full accessible data remain.

The revised continuation is:

| Position | Meaning/formula | Following 3×3 view |
|---|---|---|
| 56–57 | First moment: arithmetic mean | Mean lines in every view |
| 58–59 | Second central moment: descriptive variance | Mean and ±√m₂ scale guides |
| 60–61 | Skewness | Signed cubic contributions, mean and median guides |
| 62–63 | Kurtosis and excess | Fourth-power contribution emphasis and ±2√m₂ guides |
| 64 | Asymmetric zero-skewness counterexample | Retained exact 50-observation argument |
| 65 | Executable base-R lab | Three series × three views, selectable descriptor |

Each grid has rows **uniform, normal-like, strongly right-skewed**, with 100
synthetic observations per row. Columns are **points, type-7 boxplot, histogram**.
Each row's three views use identical observations. Measurement axes and histogram
edges/count scales are common, so differences are not artifacts of independent
scales or binning. Point height is only separation, not acquisition order or a
second measured variable.

## Scientific conventions

The constructed series share mean 50 a.u., descriptive variance m₂ = 99 a.u.² and
sample variance s² = 100 a.u.². This deliberately demonstrates that location and
variance do not determine shape. The relation is s² = n m₂/(n−1).

Kurtosis values are approximately 1.800, 2.834 and 6.662; descriptive skewness values
are approximately 0, 0 and 1.759. They are dimensionless coefficients, **not positions
or intervals on the measurement axis**. Mean/scale/median guides and relative
point contributions explain them without implying such an interpretation. Neither
scale band promises a fixed contained fraction; kurtosis is not peak height or a
tail probability. Zero variance makes standardized moments undefined.

The R lab reconstructs the same deterministic midpoint quantile grids, presents
the same three-view comparison, uses explicit **type-7** box boundaries and observed
1.5-IQR whisker endpoints, and prints descriptor/boxplot values. It uses base R
only. Offset/scale experiments distinguish changes in units/location from shape.

All 14 displayed formulas in the current path have visible authored symbol
legends; the invariant remains in `AGENTS.md` and a path-wide regression test.

## Verification

- 40 selected Python checks passed: path order/resource equality, TriG numerical
  values, targeted SHACL, formula symbol inventories, shared series and moments.
- 384 selected Core/D3/Reveal/self-study/Pitch Node tests passed: numerical moments,
  finite/zero-dispersion cases, version gating, complete label wrapping and symbol
  coloring/escaping, alongside existing chart/composition regressions.
- Full local browser run passed all 64 post-opening scenes in Light/Dark,
  including comparison legend/title separation, non-overlapping IQR labels,
  visible formula legends, four 3×3 grids, 300 observations/counts per grid,
  histogram controls and clean static ECDFs.
- All three real R labs passed, including the new 3×3 moment lab, real plot output,
  offset/scale edited reruns and legacy R text output.
- Normal-course and authoring transports were regenerated from the same TriG.
- The final visual rerun also checked at least three distinct computed symbol
  colors in each applied formula legend, with a darker text palette in Light mode.
- The accepted opening/Variance comparison and Overworld navigation browser check
  passed again. `git diff --check` passed without whitespace errors.

Screenshots and R outputs:
`C:/Users/PCUser/AppData/Local/Temp/opencode/level4-applied-moments/`.

Preview: <http://127.0.0.1:5173/authoring.html?theme=dark&background=none>.
