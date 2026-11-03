# Level 5 optional reserve: V01/V02 screening decisions

Local authoring review, 2026-11-01. No commit, push, publication or deployment.
Three complete English views implement the blueprint's first two reserve topics.
They are a separately selectable offering/unit/path, not an extension to the main
64-scene lecture. The appendix is explicitly reserve/tutorial material in the
blueprint; no extra live-lecture timing is assumed.

The following [V03 increment](chemometrics-level5-detection-reserve-review.md) adds
three views to this same separate reserve, bringing it to six scenes. The generation
command below remains valid; V01/V02 and the main lecture content are unchanged.

## Complete views

| View | Explanation |
| --- | --- |
| V01 | True state, continuous analytical signal and binary classification are different levels |
| V02a | A positive-finding probability combines true-positive and false-positive routes, and need not equal true prevalence |
| V02b | Four expected classification counts in a hypothetical population of 10,000, showing the different denominators |

No audience questions, quizzes, controls or internal reveals are added. Supporting
explanations are in English narration. The mixture formula has a separate complete
authored symbol legend, connected by `dct:hasPart` and shown on the same slide with
the shared formula component.

## Worked model and scientific boundaries

- Specify true prevalence 1%, sensitivity 90% and false-positive rate 5%. These are
  hypothetical teaching assumptions, not measured PFAS prevalence or a validated
  method specification. The true-positive condition and reference standard must be
  defined; analyte presence and exceeding a chosen scientific threshold are not
  interchangeable. No legal or regulatory threshold is selected.
- Positive-finding probability is 0.01 times 0.90 plus 0.99 times 0.05, giving
  0.0585 or 5.85%. Sensitivity and false-positive rate condition on different
  true-state groups, not on all positive findings. The formula uses probabilities
  between zero and one; the bar chart explicitly uses percentages.
- In 10,000 randomly selected samples, expected true-positive, false-negative,
  false-positive and true-negative findings are respectively 90, 10, 495 and 9,405.
  The true-state totals are 100 and 9,900; expected positive findings total 585.
  These are expectations, not an observed confusion matrix or guaranteed allocation.
- False-negative rate is 10% and specificity 95% in this model. Among expected
  positive findings, 90 of 585 are truly positive, about 15.38%, distinct from
  sensitivity's denominator. This supporting calculation remains narration, not a
  new predictive-value formula or a claim about real assay performance.
- A large true-negative group can produce more false-positive findings than true
  positive findings when prevalence is low. No real-world prevalence, accuracy,
  regulatory conclusion or recovery of prevalence from observed positivity is claimed.
- The single-unit mixture identity follows total probability without requiring
  independent units. A binomial count model additionally needs fixed sample size,
  independent units and common marginal positive-result probability. Homogeneous
  performance within true-state groups is an explicit modelling assumption.
- Detection probability for repeat readings at a fixed concentration concerns that
  procedure, concentration, matrix and conditions, not environmental prevalence.
  Technical repeats do not create independent environmental sampling units, and
  negative findings do not prove absence.

## Reuse and separate preview

All semantic content lives in
`ontology/dataset/chemometrics-level5-screening-reserve.trig`, preserving named graphs.
The reserve has its own offering, placement, learning unit and graph-attributed path.
The main path, scene order, formula content and accepted Levels 0-4 are unchanged.
Existing definition cards, complete bar charts and formula components are reused.
No Core, compiler, renderer, SHACL or CSS extension is introduced.

The standalone reserve has no observation-explorer capability that would trigger
the main preview's native phone viewport. A generic explicit application query
`viewport=native-portrait` now opts into that existing layout. It makes a frozen
per-request profile copy, leaving shared profiles and all default URLs unchanged.
Unsupported values report a diagnostic and retain defaults. This is non-semantic
application configuration, with no scene-ID or course-specific style rule.
Two profile tests cover opt-in, immutability, default compatibility and diagnostics.

The existing authoring generator accepts this selection without another runtime or
an additional package script. Generate the ignored disposable preview with:

```powershell
python apps/pitch/scripts/generate-authoring-preview.py --offering-id https://w3id.org/project-chemie-digital/resource/offering-level5-screening-reserve --placement-id https://w3id.org/project-chemie-digital/resource/placement-level5-screening-reserve --unit-id https://w3id.org/project-chemie-digital/resource/unit-level5-screening-reserve --path-id https://w3id.org/project-chemie-digital/resource/path-level5-screening-reserve --path-graph-id https://w3id.org/project-chemie-digital/graph/paths/level5-screening-reserve --output-stem authoring-level5-reserve
```

No learner data, persistence, live external service or deployment is introduced.
All authored content, captions, narration and static alternatives are English.
Mobile views retain readable full cards, numerical captions and the formula legend.
The unavailable supplementary Markdown is not claimed as read. V03 and later
reserve topics remain separate future increments.

## Verification

- Reserve generation produces 3 scenes. A regression test confirms the main lecture
  still compiles to exactly 64 scenes with no reserve-scene overlap and that the
  reserve selection resolves through its own exact path/graph pair.
- All 117 targeted Level-5 Python tests pass, including seven new reserve tests for
  selection, English complete views, mixture arithmetic, probability/percent units,
  decimal literals, expected classification totals, denominators, same-slide legend,
  guardrails and static alternatives.
- All 16 presentation-profile Node tests pass, including the two new viewport tests.
- Current-source semantic validation conforms with fingerprint
  `52e5e1240f3eee25021014b15605d8c2e7a5f5cbec0e0dc66d8d0abce75cfb12`.
  Log: `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-reserve-current-semantics.log`.
- Edge and Firefox pass all 3 views at 1731 x 1006 light, 1280 x 720 dark and
  390 x 844 light, using the explicit native-portrait option. Each configuration
  passes direct view checks and PageDown/PageUp traversal with no internal reveal
  or on-slide controls. Screenshots reviewed; category/axis labels and full legends
  are readable without new CSS.
- Initial audit navigation changed only the hash and intermittently did not reach
  the requested scene. A unique diagnostic query per direct load resolves that
  audit issue; native keyboard traversal also passes without application navigation
  changes. The first mobile inspection exposed fixed-canvas scaling; the explicit
  existing-layout opt-in above fixes that preview limitation without changing defaults.
- The full `npm test` run on the current reserve source completed successfully:
  all 673 Python tests and all Node suites pass. Log:
  `C:\Users\PCUser\AppData\Local\Temp\opencode\level5-screening-reserve-npm-test.log`.
  Semantic/feature sources remained unchanged during the run. This validates the
  main 64-scene lecture and separate three-scene reserve on the current source,
  including the explicit native-portrait preview option.

## Preview

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-reserve&viewport=native-portrait#/ex:l5-v01-scene--scene>
