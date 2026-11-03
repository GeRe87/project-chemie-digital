# Level 5 optional reserve: V03 concentration-dependent detection

Local authoring review, 2026-11-01. No commit, push, publication or deployment.
Three complete English views extend the separate reserve from three to six scenes.
The main lecture remains exactly 64 scenes and is not extended or reordered.

## Complete views

| View | Explanation |
| --- | --- |
| V03a | Ten independent repeat decisions at fixed concentration: exact binomial count probabilities |
| V03b | A chosen logistic concentration-response family with dimensionally consistent log odds |
| V03c | Experimental unit, conditions, calibration evidence and limits of a model family |

The blueprint's V03 remains optional reserve material, not an extra live-lecture
timing commitment. All content is present on entry, without questions, controls,
quizzes or internal reveals. Both displayed formulas have separate complete authored
legends linked by `dct:hasPart` and visible on the same slide through the shared
formula component.

## Model, arithmetic and scientific distinctions

- This is a separate specified teaching model, not a fit to V02's sensitivity or
  false-positive rate. At fixed concentration 2 mg/L, choose positive probability
  0.50. Ten independent repeats with common probability give binomial masses
  choose(10,k)/1024 for counts zero through ten. The masses sum to one, with mean
  count five and variance 2.5. Five is an expectation, not a forced allocation.
- A constant concentration and stable conditions do not by themselves establish
  independent repeat errors. Drift, shared preparation, depletion and changing
  conditions can violate the binomial model. Technical repeats do not create new
  independently selected environmental samples.
- Choose logistic intercept -4 and slope 2 L/mg with concentration in mg/L. The
  natural log acts on dimensionless odds; the slope-concentration product and
  intercept are dimensionless. Subscripts identify parameters rather than powers.
  Recoding or changing concentration units requires corresponding coefficient changes.
- Probabilities at concentrations 1, 2 and 3 mg/L are about 0.119203, 0.5 and
  0.880797. All authored curve coordinates satisfy the model, remain strictly
  between zero and one, and increase for this chosen positive slope. Coordinates
  are rounded to twelve decimals and connected linearly, not fitted observations.
- The model has positive-finding probability about 0.017986 at zero concentration;
  this is an illustrative baseline, not an inferred false-positive rate. It is
  explicitly different from V02's chosen 0.05. No real performance is claimed.
- A one-half midpoint is not automatically an analytical detection limit, legal
  threshold or signal decision threshold. The display window 0 to 4 mg/L is not a
  validated calibration range. A logistic family is not a natural law and may not
  capture the asymptotes or structure needed for a real procedure.
- Calibration requires defined independent units, reference concentrations, repeats,
  uncertainty assessment and explicit scope for analyte, matrix, preparation,
  concentration coding and decision rule. A drawn sigmoid does not establish fit,
  absence of drift, transferability, accuracy or population prevalence.

## Shared implementation, accessibility and privacy

All new semantic content lives in
`ontology/dataset/chemometrics-level5-detection-reserve.trig`, with preserved named
graphs and derivation links. The existing optional offering/unit/path is extended
by three contiguous steps; V01/V02 content and the main lecture are unchanged.
Existing complete bar and line charts, formula units, legends, definition cards and
the explicit native-portrait preview option are reused. No CSS, application feature,
Core, compiler, renderer or SHACL changes are introduced in this increment.

Everything authored, including narration and static alternatives, is English. The
mobile layout retains numerical captions and full legends, and keyboard navigation
requires no on-slide interaction. No learner data, storage, external runtime service
or deployment is added. Accepted Levels 0-4 remain untouched. The unavailable
supplementary Markdown is not claimed as read. V04 and later reserve topics remain
separate future increments.

The generation command is unchanged from
[the V01/V02 review](chemometrics-level5-screening-reserve-review.md).

## Verification

- Reserve generation: six scenes. Main-path regression: exactly 64 scenes, with no
  reserve-scene overlap.
- All 124 targeted Level-5 Python tests pass, including seven V03 tests for exact
  binomial masses/moments, all logistic coordinates and inverse log odds, unit
  recoding, decimal datatypes, model scope, complete same-slide legends and static
  alternatives.
- Semantic validation conforms with fingerprint
  `d0fd91528d86708c66f35bd9c7b99ea2fa046977bc1983798d4f65cd0bc6a232`.
  Log: `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-v03-semantics.log`.
- Edge and Firefox pass all six reserve scenes at 1731 x 1006 light, 1280 x 720 dark
  and 390 x 844 light. Each configuration also passes native PageDown/PageUp traversal
  with no internal reveals, on-slide controls, formula errors or text overflow.
  Representative desktop and mobile screenshots reviewed.
- `git diff --check` passes with line-ending warnings only.
- The full `npm test` run on the current source completed successfully: all 680
  Python tests and all Node suites pass. Log:
  `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-v03-npm-test.log`.
  Semantic/feature sources remained unchanged during the run. This validates the
  64-scene main lecture and the separate six-scene reserve on the current source.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-reserve&viewport=native-portrait#/ex:l5-v03a-scene--scene>
