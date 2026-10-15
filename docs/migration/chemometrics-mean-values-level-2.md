# Mean Values: Level 2

## Authored source and boundaries

Level 2 expands the existing Mean Values path from eight to thirty scenes. The
learning unit, path identity and six scientific focus concepts are unchanged.
Level 1 still ends at Types of variable values.

The reviewed legacy input is `topics/MeanValue.md` from the supplied local
`elearning-elearning-mosaic` archive. Its SHA-256 is
`46fdbea022d65dba3c7d827716b0a13dd00216f2babdf5f0789d838a815f1dbb`.
The input is migration evidence, not scientific authority or a runtime dependency.
No legacy HTML, CSS, JavaScript, SVG illustration, slide layout directive or
CodeMirror integration is imported.

Canonical authoring is exclusively in these named TriG graphs:

- `ontology/dataset/chemometrics-basics.trig`: existing scientific concepts,
  definitions, formulas, applicability statements and exercises;
- `ontology/dataset/chemometrics-mean-values-examples.trig`: additional examples,
  questions, answers, code, data, diagram and infocard resources;
- `ontology/dataset/chemometrics-mean-values-scenes.trig`: communicative selection;
- `ontology/dataset/chemometrics-mean-values-path.trig`: selection and ordering.

Generated SceneDocument JSON and application pages are disposable outputs.

## Content migration

| Legacy content | New sequence | Treatment |
| --- | --- | --- |
| Requirements / initial thoughts | Title and five-dice warmup | Level 1 is the preceding course unit; warmup is an Exercise with an ExpectedResult and base-R CodeExample. |
| Arithmetic mean and five repetitions | Arithmetic formula, five-experiment practice | Existing formula and applicability resources are reused. Random sums are averages of experiments, not averages of five individual faces. |
| Expected value | Definition and one-die / five-dice cards | Distribution expectation is distinguished from realized outcomes and observed sample means. |
| Many repetitions | Law of large numbers and simulation | Compare nested samples of 5, 50 and 50,000 independent experiments with a reproducible seed. No convergence plot is fabricated. |
| Real-world measurements | Known model versus observed data | Separate model expectation from sample-based estimation. |
| Oxygen, nitrate and Fe | Water-analysis cards and Fe practice | Retain illustrative values and units with explicit equal weighting. |
| Bacterial growth | Generic flow diagram and factor comparison | Equal periods, factors 2 and 8, count 100 to 1600; equivalent factor 4 rather than 5. |
| Geometric mean and logarithms | Definition, practice and logarithmic expression | Existing scientific identities are reused. |
| Microbial counts and proportional changes | Paired arithmetic / geometric cards | Retain numbers; show that additive and logarithmic questions differ. |
| Rates and harmonic mean | Equal-distance speed example, definition and equal-volume pumping practice | Averaging assumptions and total-quantity / total-time reasoning are explicit. |
| Diffusion through layers | Model assumptions and effective-coefficient formula | State equal thickness/area, series geometry, steady state and no reaction or partition discontinuity. |
| Turbidity and median | Data chart, definition, odd/even cards, Pb comparison and practice | Preserve the large observation; sorting and units remain explicit. |
| Summary | Four existing-style infocards | Compare the question, scale and assumptions rather than assign one mean automatically. |
| Six discussion illustrations | Two discussion scenes with three questions each | Reconstruct the numerical cases as accessible Exercises and ExpectedResults, not image-only content. |

## Scientific review

- Computing an arithmetic mean does not require normality.
- Linearity of expectation does not require independence; the repeated fair-dice
  simulation and stated iid law-of-large-numbers model do use independence.
- Larger finite samples need not be closer on every run. More repetition does
  not correct sampling bias or calibration error.
- Geometric means use positive inputs and equal logarithmic weighting here.
  Large observations cannot simply be declared irrelevant or removed.
  For counts 10, 100 and 10,000, the geometric mean is approximately 215.44;
  this result is recomputed independently rather than copied from a slide.
- Harmonic averaging of rates is justified for equal traversed quantities,
  not merely because the values carry rate units. Equal times instead imply
  arithmetic weighting.
- Three reactors in series do not, without a physical/kinetic model, justify
  a harmonic effective reaction constant.
- Simultaneous input loads must be summed when the question asks for total load.
- Neither a mean nor a median establishes safety or regulatory compliance.
  No distribution family is inferred from three illustrative concentrations.

## Generic rendering and accessibility

Scenes select existing definition-list, formula, prompt, code, chart and flow
diagram primitives. Adjacent singleton definition lists and formulas use the
existing shared infocard projection, without scene-ID layout maps or new CSS.
Long formulas retain authored English spoken descriptions. Data charts and
diagrams carry textual alternatives; prompts carry static fallbacks and answers.
Base-R examples use local seeded synthetic data, no installation commands,
external data requests or learner information.

`HeadingRole` now additionally accepts an explicitly authored `Interpretation`
with an exact language-selected `skos:prefLabel`. The scientific `focusConcept`
remains unchanged. This generic compiler rule avoids inventing scientific
concepts solely to obtain narrative scene titles. Other nonfocus resource types,
unauthored prose, missing labels and mismatched selectors/languages are rejected.
The SceneDocument contract and renderer APIs do not change.

Free-text Exercises with a `cd:hasExpectedResult` now also project that authored
answer into the existing optional prompt `expectedResult` field, with its own
source reference. This uses the same generic answer-disclosure interface as
other prompts; an exercise without an answer continues to compile unchanged.

## Verification

Run `npm test`. The regression expectations pin all thirty scene identities,
positions, focus concepts, selected resources, roles, selectors and block kinds.
SHACL validates the assembled named-graph dataset. Generic heading tests check
the additive projection and rejection cases. New content tests check authored
mathematical descriptions, infocard pairing, numerical examples, answers,
provenance and the absence of legacy layout/runtime markup.
