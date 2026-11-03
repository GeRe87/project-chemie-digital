# Level 5: PMF, PDF, CDF and theoretical quantiles

Local review, 2026-10-31. No commit, push, publication or deployment. This adds five
complete D08 slides after the existing eleven-scene binomial/Poisson preview. Earlier
slides and the six existing comparison advances remain in place. No questions,
quizzes, sliders or additional internal reveal stages are introduced.

## Lecture sequence

| Scene | Complete explanation |
| --- | --- |
| D08a | A PMF assigns probability to each count: exactly two positives is about 30.20%; all binomial masses sum to one |
| D08b | Adding masses gives a right-continuous CDF: at most two positives is about 67.78%, not 30.20% |
| D08c | A continuous concentration model uses density area: the marked interval has probability 75%, not the peak density value |
| D08d | The same interval gives 0.875 minus 0.125 = 0.75 from the continuous CDF |
| D08e | A theoretical quantile reverses the CDF: the binomial median is count 2 even though its CDF exceeds 0.5 |

The PMF/CDF examples reuse ten independent trials at 20% positive probability. The
discrete CDF has genuine horizontal segments and jumps, not sloped interpolation.
Filled markers show its included values; hollow markers show left limits. The graphs
are theoretical model curves, not an ECDF constructed from the earlier simulations.

## Continuous illustration and scientific boundaries

Before introducing a normal model, D08 uses a deliberately constructed, normalized
piecewise-linear density on 9.5 to 10.5 mg/L, peaking at 2 L/mg at 10 mg/L, and zero
elsewhere. It is neither measured/fitted data nor a claim about nitrate measurement
errors. This is a new concentration-area illustration, not the retired pump, uniform
or wheel material. No named-distribution derivation is added here.

The total triangular area is exactly one. Area from 9.75 to 10.25 mg/L is exactly
0.75. Density has reciprocal concentration units, so its height can exceed one while
area probabilities cannot. Multiplying density by concentration width cancels the
units. Exact point probability is zero; a rounded instrument reading instead refers
to a finite resolution interval.

The continuous CDF is derived from that same density. Its 17 authored samples are
exact values used for drawing; connecting segments approximate its curved shape
between samples. The marked endpoints and the interval probability are exact. Area
under a CDF is not presented as probability. The inclusive-endpoint identity is
explicitly restricted to this continuous model; the script explains that a discrete
inclusive lower endpoint instead requires the left limit.

The quantile definition uses an infimum over real thresholds and works at jumps.
Probability q is strictly between zero and one. In the binomial example F(1) is about
0.3758 and F(2) about 0.6778, so the 0.5 quantile is 2. The horizontal probability
reference is not another measured series. Empirical R quantile types and the Level-4
ECDF lesson are not repeated. The normal measurement-error model remains next work.
The horizontal reference is identified by the chart description; point annotations
target the primary CDF dataset, respecting the existing annotation-owner invariant.

## Reuse, language and layout

- Existing bar/line chart and range/point annotation components are reused. Small
  general display options support complete presentation, step-after interpolation,
  optional coordinate markers and exact y domains. See ADR-0021.
- Scientific content and numeric tables are authored only in TriG, with sources and
  derived-resource links. Generated JSON remains disposable transport.
- All titles, narration, chart text, fallbacks and spoken formulas are English.
- Each formula is a MathExpression with a linked complete authored symbol legend,
  including indices, operators, units and endpoint conventions. Both are visible
  together immediately through the existing shared renderer.
- The existing `visual-formula` layout is reused without new slide CSS. Desktop
  shows the plot beside its formula unit. On narrow screens the authored numerical
  chart summary replaces the plot while preserving the complete formula and legend.
- Legacy chart presentation behavior and accepted course content are not changed
  by omission of the new options. No scene-ID styling or runtime branches are added.

## Verification

- Preview generation produces sixteen scenes.
- Targeted Python tests verify ordering, model normalization, PMF/CDF equality,
  exact density area, continuous CDF samples, quantile crossing, metadata provenance,
  language, same-slide legends and invalid chart options via compiler/SHACL.
- Core and D3 tests verify version gating, invalid/clipping domains, retained
  default progression, complete presentation and explicit model display metadata.
  All 141 Core tests and 94 D3 tests pass, as does the 32-test targeted Python suite.
- Browser audit uses `check-level5-poisson.cjs edge functions` and the Firefox
  equivalent in the approved OpenCode temp directory. Both pass all five new slides
  at 1731 x 1006 light, 1280 x 720 dark and 390 x 844 light. Checks include no content
  controls or reveal fragments, no questions, complete legends, exact SVG staircase
  geometry, 11 hollow and 13 included CDF markers, visible annotations, area/boundary
  guides, no apparent observation markers on continuous curves, and visible bounds.
  Representative desktop and mobile screenshots have also been read. The complete
  sixteen-scene preview additionally passes the same matrix in both browsers, and
  native PageDown traversal reaches all sixteen slides with only the original six
  comparison advances.
- Full semantic validation passes for dataset fingerprint
  `f41d19f2b434a311060cff821aacdf886976296ade0bda6a28ae2e25ac6e6afd`.
- The full `npm test` run passes: 588 Python tests and all Node suites. Its local log is
  `C:/Users/PCUser/AppData/Local/Temp/opencode/level5-functions-final-npm-test.log`.
  Earlier successful binomial/Poisson test runs are not evidence for this increment.

## Preview

Run `npm run preview:level5`, then open directly at the new section:

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-d08a-scene--scene>

Use ordinary PageDown/PageUp or arrow navigation. Each of the five new slides is
complete on entry and requires no further uncovering. K-S/Pearson additions and the
overall lecture timing remain separate, unresolved later decisions.
