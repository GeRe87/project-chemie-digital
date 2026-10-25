# Level 4 — range, quartiles, quantiles, IQR, MAD and boxplots

**Historical checkpoint.** The subsequent analytical-cases revision replaced the
repeated QC examples and added notation foundations. The current [histogram revision](chemometrics-level4-histograms-review.md)
has 43 preview slides, 54 active path selections and 50-point analytical applications;
the 14/25 counts and former R-lab output below describe this earlier review.

## Local review scope

The accepted four-shape opening remains first. **Thirteen new slides** follow it:

| Positions | Topic | Structure |
|---|---|---|
| 2–3 | Range | Concept/formula; two worked examples |
| 4–5 | Quartiles | Concept; type-7 worked examples |
| 6–7 | Quantiles | General probability and interpolation; 10th/50th/90th percentiles |
| 8–9 | Interquartile range | Concept/formula; contrast with range |
| 10–11 | Median absolute deviation | Raw MAD concept; ordered absolute distances |
| 12–14 | Boxplots | Construction/reading; comparison; ggplot2 R lab |

The existing Variance composition rules are reused without changes: concept slides
use the formula/legend deck, examples use scenario/table/conclusion left and chart
right, and the R lab uses the prompt/code/function-glossary arrangement. There are
no slide-ID or dataset-ID layout rules. Dot plots and the new generic boxplot use
the shared chart skin, axes, fonts and series palette.

The active path now has **25 selections**. Five former type-7/poll/R/IQR/MAD selections
are unselected to avoid a duplicate introductory section; their scenes, scientific
resources and exercises are preserved. The existing ordering/count/ECDF material
follows the new block, with the later QC/moments section retained, not redesigned.
The isolated preview contains only the opening and new thirteen slides (**14**).

## Scientific conventions and checked results

All hand examples reuse the existing, canonical synthetic QC data, without creating
duplicate samples:

- Reference: `2, 4, 4, 5, 5, 6, 7 mg/L`.
- Modified: `2, 4, 4, 5, 5, 6, 30 mg/L`.

| Statistic | Reference | Modified |
|---|---:|---:|
| Range (width, not R's endpoint pair) | 5 | 28 |
| Type-7 Q1 / median / Q3 | 4 / 5 / 5.5 | 4 / 5 / 5.5 |
| Type-7 10th / 90th percentiles | 3.2 / 6.4 | 3.2 / 15.6 |
| Type-7 IQR | 1.5 | 1.5 |
| Raw MAD | 1 | 1 |
| 1.5×IQR fences | 1.75 / 7.75 | 1.75 / 7.75 |
| Observed boxplot whisker endpoints | 2 / 7 | 2 / 6 |
| Separately flagged values | none | 30 |

All values above are in mg/L. Raw MAD is median(|x−median(x)|), not mean absolute
deviation. R needs `mad(x, constant=1)` for raw MAD; its default scales by 1.4826,
which is an asymptotic normal-consistency convention, not a universal unbiasedness
correction. Ties can make MAD zero in nonconstant data.

Quantiles use declared **R type 7** consistently, including singleton/endpoints.
Quartiles need not split tied/interpolated finite samples into exactly equal counts.
Boxplots use ggplot2's usual type-7 quartiles and 1.5×IQR fences, not base R's
potentially different Tukey hinges. Whiskers are observed endpoints, not fences.
Flags do not justify automatic exclusion; a boxplot does not reveal modality, every
observation or a confidence interval. Robust does not mean immune to all changes.

Definitions/formulas reuse the accepted Level-4 scientific graph. New range content
reuses the existing NIST dispersion source; ggplot-specific statements cite the
official [ggplot2 documentation](https://ggplot2.tidyverse.org/reference/geom_boxplot.html).

## R lab and privacy/accessibility

The authored code loads ggplot2, draws `geom_boxplot(coef=1.5)`, explicitly prints
the plot and inspects `ggplot_build(p)$data[[1]]`. The learner changes 30 back to 7
and predicts what changes. The function glossary explains mapping, construction and
inspection. The first run in a webR session may download ggplot2 and its dependencies;
network access is required for that setup. Desktop R requires ggplot2 installed.
No learner inputs are uploaded by this example; R runs locally in the browser.

The generic code runtime now captures R graphics as well as text. **Show plots**
opens an accessible, focus-trapped shared dialog; Escape returns to its invoker.
Canvas plots have an alternative label and the lab prints the exact numerical
statistics, with expected answers available independently of execution. Reset clears
the plot and output. Package/runtime failures remain visible errors, not fake plots.

Actual local browser execution with **ggplot2 4.0.3** produced:

```text
  lower middle upper ymin ymax outliers
1     4      5   5.5    2    7
2     4      5   5.5    2    6       30
```

Changing 30 back to 7 was also executed: both upper whiskers became 7 and neither
series had flagged values. A subsequent text-only Variance calculation still
printed mean 10.66667, variance 4.333333 and SD 2.081666, without stale plots.

## Verification and preview

Focused Python checks cover the thirteen-slide order, all hand calculations, original
data, declared method, reused sources, lab semantics, inactive duplicate selections
and SHACL for the affected structural/boxplot shapes. Core tests cover version 1.9,
quantile endpoints/ties, whisker/fence distinctions, flags and static alternatives.
Code-runtime tests cover capture, cleanup and failure handling.

Local focused regression results: **49 Python tests and 169 Node tests passed**.
These are bounded checks, not the full project validation. The final browser run
also passed after the construction text and finite-range quantile guards changed.

`scripts/check_level4_order_statistics.cjs` checks all thirteen slides in Light/Dark
at 1600×1000, formulas, standard compositions and content bounds. With `RUN_R=1`,
it runs **real ggplot2**, checks numerical output and nonblank graphics, and tests
Show plots, Escape/focus return, Reset and the existing Variance text-only R example.
Screenshots and execution evidence live outside the authored dataset:
`C:/Users/PCUser/AppData/Local/Temp/opencode/level4-order-statistics/`.

Use the running Overworld at `http://127.0.0.1:5173/` → Level 4, or
`http://127.0.0.1:5173/authoring.html?theme=dark&background=none` for the bounded
14-slide review. `npm run preview:level4:generate` refreshes that transport;
`npm --workspace @project-chemie-digital/pitch run generate:introduction` refreshes
the normal course. `npm run prepare:interactive-runtime` prepares the pinned assets.

No PR, merge, deployment, external validation or full `npm test` is part of this local
review. Physical-projector, screen-reader and touch-device audits remain outstanding;
the checks do not establish pedagogical effectiveness. Stop for joint acceptance.
