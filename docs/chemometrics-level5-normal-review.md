# Level 5: first normal-model lecture block

Local authoring review, 2026-10-31. No commit, push, publication or deployment.
Four complete views extend the local preview from sixteen to twenty scenes.

## Scope and lecture delivery

| Scene | Explanation |
| --- | --- |
| N09a | Repeated UV/Vis nitrate readings of one homogeneous sample: fixed concentration, constant bias and random error |
| N09b | Three theoretical curves compare location and spread on shared axes: change one parameter at a time |
| N09c | Normal density formula after the graphical interpretation, with its complete authored symbol legend |
| N10a | Standardize 10.45 mg/L under mean 10.0 and SD 0.30 mg/L: z = 1.5 and upper-tail probability about 6.68% |

This follows the approved four-slide increment using N09 and the first part of N10
from the lecture blueprint. The blueprint's many reveal stages are adapted to the
agreed direct-explanation format. No simulated histogram is claimed or introduced:
these are explicitly authored theoretical density curves. The normal quantile and
individual-measurement versus confidence-interval contrast remain the next increment;
the distinction is already stated in N10a's legend and narration. No later normal,
lognormal or goodness-of-fit section is added here. Lecture timing remains unresolved.

All text, captions, narration, spoken formulas and static alternatives are English.
Each scene is complete on entry, without questions, quizzes, controls or reveal
fragments. Ordinary PageDown/PageUp navigation is sufficient. The original six
binomial comparison advances are unchanged.

## Scientific and numerical boundaries

- A zero-mean normal error is an assumption, not a natural law. Normal-looking
  repeats do not establish zero bias or accuracy. The measurement mean is c + b.
- Repeats of the same homogeneous sample are not a population of environmental
  sites, and an individual reading is not a sample mean. Independence is not implied
  by normal marginals. The script names drift, matrix effects, outliers, range limits,
  mixtures and correlation as possible model failures.
- The second normal-distribution parameter in authored mathematics is variance.
  SD has units mg/L; variance has squared concentration units; density has L/mg.
  Standardized readings and thresholds are dimensionless.
- Baseline: mean 10.0, SD 0.30 mg/L. Shifted: mean 10.6, same SD. Broad: mean
  10.0, SD 0.60 mg/L. The broader density has half the baseline peak, not half its
  probability. Every complete mathematical model integrates to one.
- Each model has 33 authored theoretical coordinates over its own four-SD span.
  Coordinates are exact normal-density evaluations rounded to authored precision;
  connecting line segments approximate the shape. They are not measured or simulated
  observations. Normal tails continue on the real line, including negative values;
  the script cautions against uncritical use near physical or detection boundaries.
- A four-SD plot omits approximately 0.006334% total probability. The right-tail
  annotation begins at an exact authored coordinate, 10.45 mg/L, and ends at the plot
  boundary 11.2 mg/L. About 0.003167% lies beyond that upper plotting boundary.
  The quoted 6.68% uses the full normal CDF, not numerical integration of the shaded
  drawing polygon. Its unrounded value is 0.06680720126885809.
- The concentration threshold is a teaching example, not a regulatory decision.
  The upper-tail probability is not a confidence interval for an unknown mean.

## Architecture, accessibility and privacy

The sole new semantic source is `ontology/dataset/chemometrics-level5-normal.trig`.
It reuses the existing complete LineChart, range annotation, mathematical formula,
linked symbol legend and `visual-formula` layout. No renderer, schema, application
logic, CSS or accepted Levels 0-4 content is changed. The preview remains disposable
generated JSON. Sources and derivation links are authored with the resources.

The parameter comparison identifies narrow left/right peaks and the broad central
curve in text, not solely through color. On narrow screens the existing layout uses
the numerical chart description while preserving the entire formula and symbol
legend. No personal data, analytics, remote requests or learner storage are added.

## Verification

- Preview generation produces twenty scenes.
- All 39 targeted Level-5 Python tests pass, including seven new tests for scene
  order, complete linked legends, English text, normal-density coordinates,
  symmetry, approximate plotted normalization, parameter effects and full-CDF tails.
- Edge and Firefox pass all four new scenes at 1731 x 1006 light, 1280 x 720 dark
  and 390 x 844 light. Browser checks cover complete formula legends, viewport
  bounds, no content controls/questions/reveal fragments, no KaTeX errors, one/three
  traces, absence of misleading observation markers and immediate tail shading with
  two boundary guides. Representative desktop, dark and mobile screenshots reviewed.
  All twenty scenes also pass that matrix in both browsers. Native PageDown traversal
  reaches all twenty slides with only six original comparison advances; PageUp
  reverses the new block without extra reveals.
- `git diff --check` passes, with existing line-ending warnings only.
- Final semantic validation passes (`Conforms: True`) for dataset fingerprint
  `7f28ca9f899c1f6e07c36fdc7d346525b7aa858e6d34fd79c8b1c1de54c98c31`.
  The full `npm test` passes for this original N09/N10a increment. Its logs are
  `C:/Users/PCUser/AppData/Local/Temp/opencode/level5-normal-final-semantics.log` and
  `C:/Users/PCUser/AppData/Local/Temp/opencode/level5-normal-final-npm-test.log`.
  Results from the earlier D08 increment do not establish this result.

The subsequent N10 conclusion and N11 are documented separately in
[the N10/N11 review](chemometrics-level5-n10-n11-review.md).

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-n09a-scene--scene>

Run `npm run preview:level5` if the local preview server is not already running.
