# Level 4: spread comparison, interactive bins, ECDF and moments

Historical authoring checkpoint. The current active sequence is documented in
[the applied-moment grid review](chemometrics-level4-applied-moments-review.md).

Local acceptance candidate, 2026-10-24. All semantic content is authored in TriG.
The accepted opening and previous resources remain; superseded continuation steps
are unselected, not deleted. No commit, PR, merge, deployment or full/external
validation is part of this authoring session.

## Active sequence: 74 scenes

- 1–18: preserved opening, notation and range/quantile/IQR/MAD sequence.
- 19–20: SD/IQR/MAD comparisons, with 100 actual points repeated per choice,
  numeric bounds and exact closed-interval coverage.
- 21–42: preserved boxplot/histogram teaching, with structured colored histogram
  prose and interactive bin width/origin at scene 41. All rule names are expanded.
- 43–45: sort eight teaching values, interpolate type-7 boundaries, then compute
  widths/counts/density heights/areas. This small hand calculation precedes the
  100-reading adaptive-bin application at 46–47 and histogram R lab at 48.
- 49–55: a previously unresolved threshold question, ECDF concept/formula,
  tied-value hand calculation, exact river threshold, four shape examples,
  crossing curves, and inverse-ECDF versus type-7 quantiles. Examples use the
  existing explanation-left/diagram-right composition, with no table.
- 56–67: raw moments 1–4, each with concept/formula, strength and limitation.
- 68–73: central moments, explicit numerical calculation, standardization,
  skewness and the asymmetric zero-skew counterexample, kurtosis and its limits.
- 74: executable base-R lab with 100 synthetic readings, offset/scale experiments,
  an optional extreme observation, histogram, ECDF and zero-skew counterexample.

## Numerical conventions and checks

- Same-data intervals are **mean ± sample SD**, **[Q1,Q3]**, **median ± raw MAD**.
  IQR is a width, not a radius. Type-7 quartiles; MAD constant 1. Actual contained
  counts are 68/50/50 for the normal-like sample and 85/50/50 for the skewed sample,
  each out of 100. These are not universal coverage claims.
- Unequal-bin hand example: 1,2,3,4,5,6,10,20 mg/L. Edges
  1,2.75,4.5,7,20; widths 1.75,1.75,2.5,13; counts 2 each; density areas .25 each.
- Tied ECDF example: 2,4,4,5,5,6,7 mg/L. F(3.9)=1/7; F(4)=F(4.1)=3/7.
- River application: 24/50 = 48% at 12.3 mg/L; inverse ECDF at .25 is 6.5 mg/L,
  whereas type-7 Q1 is 6.625 mg/L. Thresholds are illustrative, not legal limits.
- Empirical raw moments average x^r; central moments average (x−mean)^r with n.
  For 98,99,100,101,102: raw moments are
  100,10002,1000600,100120006.8; central moments 0,2,0,6.8. Sample variance is 2.5.
  Standardized skewness is 0, kurtosis 1.7, excess −1.3. Zero dispersion makes
  standardized moments undefined. Population existence and software estimator
  conventions are distinguished from these descriptive finite-sample values.

## Local verification

- `npm run preview:level4:generate` produces all 74 scenes.
- `npm --workspace @project-chemie-digital/pitch run generate:introduction`
  refreshes the normal course from the same semantic dataset.
- 38 selected Python checks passed, including targeted new-option SHACL, path
  resource equality, interval arithmetic, bin areas, ECDF fractions and moments;
  the full canonical-SHACL test was deliberately excluded from this bounded run.
- 378 selected Core/D3/Reveal/self-study/Pitch Node tests passed, including version gating,
  interval endpoints, shifted-grid coverage, unknown-rule rejection and independent
  multi-series ECDF denominators.
- `scripts/check_level4_order_statistics.cjs` checks all 73 post-opening scenes in
  both themes, including nested text bounds, formulas, counts and compositions.
  With `RUN_R=1` it also runs all three labs, edited reruns and legacy R output.
  Final run passed: all 73 post-opening scenes in both themes; bin widths .5,
  5.75 and 60 at both origin-shift extremes; all three named rules and reset;
  invariant 100-observation counts; keyboard isolation; exact river threshold
  changes; four independent ECDF readouts; all three real R labs, edited reruns,
  plot canvases and legacy text output. Screenshot review also caught and fixed
  a viewport-width/bin-width readout shadowing bug, now covered by the browser test.
- `scripts/check_level4_opening.cjs` passed again against the generated preview and
  normal course: opening/Variance styling in both themes, 400 observations,
  packing/legend bounds, keyboard details, static fallback and Overworld navigation.
- `git diff --check` passed (only the existing Windows LF/CRLF notices).

Screenshots and local R outputs are outside the repository at
`C:/Users/PCUser/AppData/Local/Temp/opencode/level4-ecdf-moments/`.

Preview: <http://127.0.0.1:5173/authoring.html?theme=dark&background=none>.
Normal course: <http://127.0.0.1:5173/> → Level 4.

## Follow-up: static ECDFs and mandatory formula legends

The five ECDF example scenes (worked calculation through inverse quantile) now
render fixed diagrams without sliders, numeric inputs or reset buttons. Their
counts, tied endpoints, series identities and accessible descriptions remain.
Histogram bin controls and executable R labs are unchanged.

`ontology/dataset/level4-formula-legends.trig` adds authored `dct:hasPart` legends
to the ECDF formula, raw moments 1–4, the central-moment formula and the standardized
moment formula. All 16 displayed formulas in the active lecture now have adjacent
symbol legends. The new legends explicitly cover observation indices/sums, sample
size, values/mean, moment orders, raw/central/standardized moments, units and
zero-dispersion conventions. A shared two-column formula-deck variant keeps
explanation, formula and legend on the same page without a footer or scene-ID rule.

The permanent authoring invariant is recorded in `AGENTS.md`. A focused regression
test requires a nonempty linked legend for every displayed formula in this path
and checks explicit symbol inventories for all seven new legends. Browser checks
require actual visible legend text, not just hidden DOM presence, and verify that
all five example ECDFs expose no chart controls or interactive host markers.

Follow-up verification: 39 selected Python checks and 379 selected Node tests
passed. The 73 post-opening scenes passed the Light/Dark browser run, including
all 16 visible formula/legend units and the absence of controls on all five ECDF
example scenes. The normal course was regenerated as well. Screenshots were
reviewed under
`C:/Users/PCUser/AppData/Local/Temp/opencode/level4-static-ecdf-legends/`.
R lab code was not changed or rerun in this follow-up; its preceding evidence is
kept separate above.
