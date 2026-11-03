# Level 5 revision: illustrated analytical cases and uniform foundations

Historical 41-scene review. The main preview now selects the
[51-scene depth revision](chemometrics-level5-depth-review.md); the validation below
applies to this earlier increment, not the new depth sources.

Local, uncommitted, unpushed and unpublished. Implements the instructor's ten
review points. The main path now has **41 scenes**, with the existing 70-scene
supporting path and six-scene reserve preserved separately.

## Review decisions implemented

| Review point | Implementation |
| --- | --- |
| 1. Overview thumbnails | Each of the three overview cards selects an existing SVG motif in TriG: distribution/statistics, analytical flasks, multiple inputs. |
| 2. General three-panel diagram | Remove the bottom warning/caption row. Label both axes of all panels. No concentration axis: PDF has value/density, CDF value/probability, inverse CDF probability/value. |
| 3. Uniform instead of triangular model | PDF, area calculation, CDF difference and inverse CDF all use the same dimensionless Uniform(0,1) model. This is also the source model for later Monte Carlo inputs. The former triangular quantile-data file is replaced, not left linked to a now-incompatible formula. |
| 4. Normal-case illustrations | Existing theme-colored SVG motifs accompany concise bullets in all three introductory normal cards. |
| 5. Additive process before the model | A separate preparation/detector/readout schematic motivates a candidate normal approximation. The following chart/formula scene introduces calligraphic capital N, mean as first parameter and variance as second. The instructor confirmed that N, not Greek Eta, was intended. |
| 6. Explain axes | Each foundational narration and visible legend explains what is on each axis, the difference between density height and probability, and which direction the function maps. The inverse function is actually plotted with probability horizontal and value vertical. |
| 7. Remove isolated density evaluation | The density-height arithmetic scene is no longer selected by the main path. Its former resources remain unselected; no unrelated cleanup is attempted. The PDF remains a model whose areas answer analytical probability questions. |
| 8. Clear analytical flag-rate case | Illustrated bullet cards introduce a homogeneous nitrate control, a hypothetical internal upper review rule and the reason to calculate its flag probability. Direct concentration CDF/inverse-CDF calculations follow; they use neither unexplained Z nor Phi. Standardization comes afterward as its own reusable tool. |
| 9. Lognormal pictures | Three existing motifs and short bullets introduce preparation/dilution factors, products becoming sums on the log scale, and model applicability. |
| 10. Consistent usecase pattern | Normal, Lognormal, chi-square, t, F and model-test case cards use authored thumbnail motifs and bullets; Monte Carlo input cards also use them. The final simulation process still has its larger linked SVG schematic. |

## Revised opening and normal sequence

1. Illustrated overview.
2. General three-panel function diagram with explicit axes.
3. Uniform PDF and general area rule.
4. Rectangle example: probability from 0.25 to 0.75 is width 0.50 times density 1.
5. Uniform CDF: 0.75 minus 0.25 gives the same 0.50 probability.
6. Uniform inverse CDF: input probability 0.75 returns value 0.75. Equal numbers
   are a special property of this model, not equal meanings for the axes.
7. Illustrated normal measurement case.
8. Additive-effects process schematic.
9. Normal model notation plus density diagram/formula.
10. Illustrated laboratory control question.
11. Direct CDF application: above 10.45 mg/L has model flag probability 0.0668072.
12. Direct inverse CDF: choose 10.49346 mg/L for a 5% upper flag rate.
13. Separate standardization tool: 10.30 mg/L becomes one SD above mean 10.00
    when SD is 0.30. Introduce uppercase Z, lowercase z and standard normal here.
14. Continue into Lognormal and the remaining analytical families, tests, map and
    the unchanged executable dilution Monte Carlo case.

The control example assumes a normal analytical expectation of 10.0 mg/L and
SD 0.30 mg/L; these are specified teaching parameters, not fitted from five values.
The review rule is hypothetical and internal, not a safety/legal threshold or a
validated control-chart procedure. A flag does not prove method failure.

The additive schematic is a rationale, not a proof: arbitrary sums need not be
normal. Many small non-dominant contributions under suitable variance/dependence
conditions can motivate an approximation. Bias, drift and dependence require
separate checks. Standardization does not make arbitrary data normal.

## Canonical implementation

- `chemometrics-level5-analytical-lecture.trig`: revised formulas, legends,
  introductory cards, selected resources, numerical examples and ordered path.
- `chemometrics-level5-uniform-foundations.trig`: exact uniform PDF/CDF/quantile
  chart coordinates, units and annotations. The step-after PDF has rectangle area
  one and is zero outside its support. Endpoint density convention does not affect
  probability. Quantile plot endpoints show one-sided limits; the formal quantile
  definition is used only for probabilities strictly between zero and one.
- `chemometrics-level5-illustrated-cases.trig`: existing card motif selections,
  normal/process/control resources, normal notation and the standardization tool.
- `chemometrics-level5-monte-carlo.trig`: path positions shifted by two, with the
  measurement equation, input models, seed and live code unchanged.
- `level5-pdf-cdf.svg`: general function/axis sketch; new
  `level5-additive-process.svg`: process-to-model illustration.

No new card/scene contract, compiler capability, motif family or renderer lookup
is introduced. The existing highlight SVG motif uses theme tokens and is now
ordered before its card title through the generic card primitive. The motif is
decorative/aria-hidden; all information remains in authored card text and static
alternatives. This is not scene-ID styling. Both larger SVGs have titles,
descriptions, TriG alternatives and self-contained light/dark palettes.

## Validation status

- Ten focused analytical-lecture Python tests pass. New assertions verify uniform
  normalization and exact CDF coordinates, distinct inverse axis roles, no triangle
  or concentration units in the general foundations, all same-scene formula
  legends, motif/bullet coverage, normal notation, removal of the density-height
  scene and no premature Z/Phi in the control application.
- Six focused Node tests pass, including thumbnail order and existing motif/layout
  coverage. No scientific content moved into CSS or application code.
- Native forward and reverse navigation passes all 41 scenes in Edge and Firefox
  without required reveals or opening the optional live code editor.
- The first full browser matrices (`level5-illustrated-edge.log` and
  `level5-illustrated-firefox.log`) found overlong legends on inverse-CDF and normal
  model/application scenes. The legends were shortened without dropping symbol
  meanings, and wide numeric-only legend headings were made compact. Both engines
  now pass the complete normal block in all three configurations; the inverse-CDF
  focused Edge check also passes. Long quantile/CDF point labels were shortened to
  avoid SVG clipping; captions retain the full numerical interpretation. The
  additive schematic uses visible plus signs and a labelled density axis.
- Final full matrices are running on unchanged sources:
  `level5-illustrated-edge-final.log` and `level5-illustrated-firefox-final.log`.
  Firefox subsequently completed successfully: all 41 scenes pass in light
  desktop, dark desktop and light phone configurations on the final source.
  Edge also completed successfully across all 41 scenes in those same three
  configurations. Both final layout matrices now pass.
- Broader Level-5 tests pass all **161 tests** before the final legend shortening:
  `level5-illustrated-targeted.log`, summary `OK` despite redirected PowerShell's
  exit code 1. The final full run below checks the final source again.
- SHACL conforms before the final legend shortening:
  `level5-illustrated-semantics.log`. Fresh exact-source semantic checks are
  included in the final full run.
- The previous full run `level5-analytical-final-npm-test.log` was explicitly
  stopped before this source revision. It is not passing evidence. The new
  authoritative `npm test` completed successfully on unchanged final semantic/
  feature sources: **717 Python tests and all Node suites pass**.
  Log: `level5-illustrated-final-npm-test.log`. Final dataset fingerprint:
  `53e4cd8f5b45ec0742a9fba100438821add189ef77527553f687cdd2c879733f`.
  No semantic or feature sources were edited during that run.

No new learner data, publication, deployment or real analytical evidence is
introduced. Rehearsal is still needed to establish final lecture timing.

## Local preview

- Main opening:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:al-opening--scene>
- Additive process:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:al-normal-process--scene>
- Control usecase:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:al-control-story--scene>
- Separate standardization:
  <http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:al-standardization--scene>
