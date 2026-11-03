# Level 5: F17 variance ratios and the F reference

Local authoring review, 2026-10-31. No commit, push, publication or deployment.
Three complete English scenes extend the preview from 49 to 52 scenes.

## Lecture views

| Scene | Complete explanation |
| --- | --- |
| F17a | Method A sample SD 0.20 and B sample SD 0.40 mg/L: SD ratio 2 versus variance ratio 4 |
| F17b | Exact F reference under equal population variances and independent iid normal samples |
| F17c | Construction from two independent chi-square variables, each normalized by its own degrees of freedom |

The blueprint's five stages become three complete views, with no audience question,
control, quiz or internal reveal. A formal test and its decision rule are deferred,
as specified in F17. E18 and the later goodness-of-fit additions are not implemented
in this increment. Overall lecture timing remains unresolved.

## Scientific distinctions

- The method SDs are constructed sample summaries, not known population parameters.
  Their squared values are 0.04 and 0.16 (mg/L) squared. B over A gives a
  dimensionless variance ratio of 4, not proof of different population precision,
  absence of bias or method superiority.
- Ratio direction is fixed as B over A, not chosen after inspecting which value
  is larger. Reversing the quotient changes the reference by swapping its ordered
  degrees-of-freedom parameters.
- The exact equal-variance F reference requires two independent samples, each iid
  normal. Their means need not agree. First degrees of freedom belong to numerator
  B, second to denominator A. Paired/dependent samples do not meet this assumption.
- The blueprint does not give sample sizes for methods A and B. None are invented
  for those summaries. The plotted F density separately chooses numerator degrees
  of freedom 10 and denominator 5 for illustration. Narration explains the possible
  size correspondence of 11 and 6 without asserting it for the method example.
  No observed-ratio marker, p value, critical region or test decision is attached.
- The theoretical density is authored with beta/gamma normalization, rounded to
  twelve decimals and joined linearly. Its right tail extends beyond the 0 to 8
  display window, with no renormalization. Both axes are dimensionless. Numerical
  alternatives retain all theoretical coordinates without calling them raw data.
- The final normalization bars are a separate deterministic arithmetic example:
  chosen chi-square values 16 and 2 with degrees of freedom 10 and 5 give 1.6 and
  0.4, hence quotient 4. They are not simulated draws, evidence of independence or
  measurements from A and B. A chosen quotient does not demonstrate an F law.
- Independent chi-square components justify the F construction. For normal samples,
  equal population variances cancel in the variance ratio. Without that equality,
  the raw sample ratio has a population-variance scale factor multiplying an F
  variable, rather than the unscaled null reference.
- The classical variance comparison is sensitive to nonnormality, not a universally
  robust method. Precision and accuracy remain distinct.

## Reuse, accessibility and privacy

Resources live in `ontology/dataset/chemometrics-level5-f-distribution.trig` and
`chemometrics-level5-f-distribution-data.trig`, with preserved named-graph identity
and derivation links. Existing complete bar/line charts and formula units are reused.
All three formulas have complete, separate authored symbol legends connected by
`dct:hasPart` and visible on their respective slides. No CSS, renderer, Core,
compiler or SHACL changes are needed for F17.

Captions label the quantities and model status explicitly rather than relying on
color. Existing mobile layouts retain numerical captions and full legends. All
new authored text, narration and alternatives are English. No learner data,
persistence, network service or deployment change is introduced; accepted Levels
0-4 content remains untouched. The unavailable supplementary Markdown source is
not claimed as read.

## Verification

- Preview generation: 52 scenes.
- All 92 targeted Level-5 Python tests pass, including seven new F17 tests covering
  SD/variance arithmetic, ordered F parameters, every theoretical density coordinate,
  independent full-density normalization/mean checks, deterministic construction,
  same-slide legends, static alternatives and scientific guardrails.
- Edge and Firefox pass all three F17 scenes at 1731 x 1006 light, 1280 x 720 dark
  and 390 x 844 light. Checks cover full legends, no controls/questions/reveal steps,
  no apparent raw points on the theoretical density, and viewport/text fit.
  Representative desktop and phone screenshots reviewed.
- Native PageDown traversal passes all 52 slides in both engines with only the six
  existing comparison advances. PageUp reverses F17 and the preceding blocks without
  extra reveals.
- `git diff --check` passes with line-ending warnings only.
- F17-source semantic validation conforms with fingerprint
  `f53ca79bf5d357e0e991a25713f4488115fc603a30d73348fb5951d85d038d85`.
  Log: `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-f17-semantics.log`.
- The earlier T16 full `npm test` run completed successfully (641 Python tests and
  all Node suites), but predates F17. A fresh full run covering F17 and E18 is
  recorded in the closing review; older passing suites do not establish its result.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-f17a-scene--scene>

The following KS extension is documented in
[the KS review](chemometrics-level5-ks-review.md), followed by
[the closing review](chemometrics-level5-closing-review.md).
