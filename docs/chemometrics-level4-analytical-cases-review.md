# Level 4 — measurement order, analytical uses and limitations

**Historical checkpoint.** The [histogram revision](chemometrics-level4-histograms-review.md)
expands the main analytical cases to 50 observations, fixes legend readability,
adds a default table palette and extended boxplot/histogram interpretation. Current
counts are 43 preview slides and 54 path selections; the 22/33 counts and numerical
results below refer to the preceding checkpoint.

## Current local review (2026-10-24)

This revision supersedes the repeated two-QC-series example sequence in the
[earlier order-statistics checkpoint](chemometrics-level4-order-statistics-review.md).
The accepted four-shape opening is unchanged. The bounded preview now has **22
slides**; the full path has **33 selections**, with the later ECDF/QC/moments material
retained. Previous example scenes remain in RDF but are no longer selected.

The opening is followed by two foundations:

1. A measurement dataset, its question, observation count, identity and physical unit.
   `x_i` labels an observation; in this example it retains acquisition order.
2. Sort the same observations: `x_(i)` is the value at rank i, not the original
   observation i. Values and ties are retained; acquisition order cannot be recovered
   from sorted values alone. The worked nitrate series is
   `10.2, 9.8, 10.0, 10.0, 10.1 mg/L`, sorted as
   `9.8, 10.0, 10.0, 10.1, 10.2 mg/L`.

Range, quartiles, quantiles, IQR and raw MAD each then have **concept → two analytical
uses → separate limitations**. Boxplots have construction → two comparisons →
limitations → R lab. These are ordinary formula/legend, scenario/table/conclusion +
chart and prompt/code compositions from Variance, without new layout rules, renderer
changes or scene-specific CSS.

## Case inventory and independently checked numbers

Every new series contains five finite observations and is explicitly labelled
**synthetic teaching data**. These are realistic measurement questions, not reported
experiments, validated methods or evidence of pedagogical effectiveness.

| Topic | Analytical uses | Separate counterexample |
|---|---|---|
| Range | Repeat determinations of one prepared nitrate sample: span 0.4 mg/L; different river grab samples: span 8 mg/L | Centre-heavy and endpoint-heavy profiles both span 10 mg/L; range misses the interior. Also report n. |
| Quartiles | River concentrations: 2/3/4 mg/L; effluent samples: 10/12/14 mg/L | Changing the largest concentration from 9 to 90 leaves all three quartiles at 2/3/4. |
| Quantiles | Describe the river upper tail (90th percentile 7 mg/L); summarize high blank-equivalent signals (0.36 mg/L) | At n=5, 95th percentiles 0.38 and 1.66 depend strongly on the maximum. A blank quantile alone is not a detection limit. |
| IQR | Compare extraction recoveries A/B: 4/20 percentage points; summarize a control series: 2 percentage points | A control series near 100% and one near 110% both have IQR 2: central spread is not trueness. |
| Raw MAD | Typical departures in repeat determinations; central scatter when investigating one unusually high reading | Both application MADs are 0.1 mg/L; rounded `10,10,10,10,11` instead has MAD 0 and range 1. Zero MAD is not perfect repeatability. |
| Boxplots | Compare extraction A/B within one matrix; compare extraction A between matrices | Increasing and reordered control sequences have identical quartiles 99/100/101% and whiskers 98/102%, hiding the chronological trend. |

All quantiles use R type 7. Recovery differences are expressed in **percentage
points**, not relative percent changes. Fortification levels are held equal for
the method/matrix examples. Neither small groups nor boxplots establish a causal
matrix effect, statistical significance, method superiority or compliance.
Repeat determinations of one preparation do not estimate between-sample variability.

The full original observations, positions, units and descriptions are authored in
`ontology/dataset/level4-analytical-case-data.trig`. Chart groups reference these
datasets; tables retain source links to their input datasets. No authored semantic
JSON or generated observations were introduced.

## Same-case ggplot2 lab

The executable lab uses the same three recovery datasets as the boxplot applications:

- A / matrix 1: `94,98,100,102,106%`.
- B / matrix 1: `80,90,100,110,120%`.
- A / matrix 2: `70,80,90,100,110%`.

Expected `lower/middle/upper; ymin/ymax` values are:

```text
98 / 100 / 102; 94 / 106
90 / 100 / 110; 80 / 120
80 /  90 / 100; 70 / 110
```

The learner changes the final **110 to 140**. The third box remains 80/90/100%,
its upper whisker moves to the observed 100%, and 140% is flagged beyond the 130%
upper fence. The point is not automatically excluded or declared erroneous.
The existing generic webR text/plot capture and accessible Show plots dialog are
unchanged. Initial package installation needs network access; code runs locally
without uploading learner observations. Exact numeric results remain available
without graphics or execution. Reset, keyboard/Escape and focus return are checked.

## Verification and local delivery

- **52 focused Python tests passed**, including the affected-shape SHACL check,
  numerical recomputation, notation/ties, declared case units, preserved earlier
  scenes, ordering and scientific/ECDF regressions. Full-project SHACL is excluded.
- **169 selected Node tests passed**, including identity-independent composition,
  transport, static alternatives, numerical kernels and R capture/cleanup.
- `scripts/check_level4_order_statistics.cjs` checks the **21 post-opening slides**
  at 1600×1000 in Light/Dark; `RUN_R=1` also executes the ggplot2 lab and edited
  rerun, plus the older text-only Variance example.
- Screenshots and actual R outputs are stored outside the repository in
  `C:/Users/PCUser/AppData/Local/Temp/opencode/level4-analytical-cases/`.

Run `npm run preview:level4:generate` for the isolated transport, or
`npm --workspace @project-chemie-digital/pitch run generate:introduction` for the
normal Overworld. Review at `http://127.0.0.1:5173/` → Level 4, or directly at
`http://127.0.0.1:5173/authoring.html?theme=dark&background=none`.

All work remains local on `work/level4-authoring`. No full `npm test`, external
validator, PR, commit, merge or deployment is part of this revision. Physical
projector, assistive-technology and touch-device audits remain outstanding.
