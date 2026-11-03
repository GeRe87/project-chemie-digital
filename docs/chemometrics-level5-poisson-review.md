# Level 5: direct explanations and first Poisson section

Local review, 2026-10-31. No commit, push, publication or deployment.
This supersedes the detailed questioning/stage choreography in
`chemometrics-level5-lecture-stages-review.md`.

## Revised lecture style

There are currently no audience questions in slide titles, visible explanations,
stage text or narration. Answers and calculations can be presented immediately.
Substantial discussion questions can be authored later, sparingly; none are inserted
as placeholders in this increment. Controls and free parameter sliders remain absent.

The seven binomial scenes now contain 13 complete views rather than 39: only six
additional advances instead of 32. B01, B03a, B03b and B05 are complete on entry.
B02 compares three complete series, B04 three complete parameter settings, and B06
three fully explained laboratory cases. Previous restores those comparisons exactly.
Formulas and complete authored legends are visible together immediately, not unlocked
by a sequence of small prompts. A singleton authored snapshot declares zero fragments.

## Four new Poisson slides

| Scene | Complete explanation, no internal reveals |
| --- | --- |
| P07a | Detected microplastic counts in a fixed 100 mL exposure; three constructed filter illustrations |
| P07b | Poisson probability law at expected count 4, zero and at-least-one probabilities |
| P07c | Volume scaling together with the expectation/variance identities: 100 mL gives expected count 4 and 200 mL gives 8 |
| P07d | Fixed binary trial count versus fixed exposure, and the binomial rare-event limit |

The illustrations contain 2, 4 and 6 particles. They are explicitly **constructed**,
not a measured or simulated dataset and not evidence estimating the parameter.
The probability charts are model calculations, never frequencies from those drawings.
Their authored TriG tables contain point probabilities for counts 0 through 16 and a
17+ category aggregating the complete remaining tail. No probability is discarded or
renormalized and no finite upper support bound is implied. Values are rounded to
twelve decimal places in percent and tested against the Poisson formula.

For expected count 4, zero has probability 0.01831563889 and at least one has
probability 0.98168436111. Expected count and variance are numerically equal under
the model but have count and squared-count units. Doubling volume doubles the expected
count only under homogeneous intensity and comparable sampling/detection performance.
Clustering, heterogeneity, preparation losses, detection errors and overdispersion are
explained in the script. A negative-binomial alternative is mentioned without claiming
it is automatically appropriate. Integer-valued observations alone do not justify Poisson.

The rare-event limit explicitly requires increasing independent binomial trials,
decreasing common success probability and a finite limiting expected count. It is
not an exact finite-sample identity or a universal tail approximation. Poisson-binomial
counts with unequal Bernoulli probabilities remain a different model.

## Reuse and layout

- Standard BarChart, MediaAsset, MathExpression and linked DefinitionList resources.
  No Poisson-specific runtime capability, controls or scene-ID branches were added.
- Every new formula has a complete authored same-slide symbol legend, including
  operators, factorial convention, indices/parameters and units. Spoken math text is
  authored in English without changing accepted-course fallback behavior.
- Shared `visual-formula` layout keeps navigation clear of the complete formula unit.
  On narrow screens its plot is replaced by the authored numerical chart summary,
  retaining the entire formula and legend without shrinking their text to fit.
- The standard explanation-plus-formula layout now stacks its two surfaces on narrow
  screens instead of retaining desktop half-widths. No per-slide CSS was introduced.
- Grouped-bar legends measure their labels using the existing SVG measurement pattern,
  rather than always allocating 132 units and overlapping descriptive series names.
- Natural-language detail remains in the script. The existing presentation navigation
  works normally across the four Poisson slides, without internal click-through steps.

## Verification and preview

- `npm run preview:level5:generate`: eleven scenes, with accepted course placements unchanged.
- Final `npm run check:semantics`: conforms. Dataset fingerprint:
  `9f66c0ae10e86e2425cd1b59d7d3750d6c483be96bdbad2868cc68b7f3fc32e5`.
- 25 targeted Python tests pass: model calculations, complete tails, chart encoding,
  moments, rare-event reference values, source language, complete legends, direct
  initial display and the removal of question prompts.
- Targeted Core, D3 bridge and shared layout tests pass. The final full `npm test`
  run also passed: 581 Python tests and all Node suites, including runtime generation,
  Pitch and self-study. The previous 574-test success is an older baseline and is
  not used as evidence for this increment.
- All 92 D3 renderer tests pass, including the shared chart renderer. The final
  Edge/Firefox matrix passes all eleven scenes in each of the three specified
  theme/viewport combinations, including every remaining comparison forward and
  backward, initial complete formula units, absence of questions/controls, and
  non-overlapping grouped-series legends. Representative screenshots were read.
  A separate native PageDown traversal passes all eleven slides in both browsers,
  including singleton snapshots and exactly six comparison advances.
- Final full-regression log (passed):
  `C:/Users/PCUser/AppData/Local/Temp/opencode/level5-direct-poisson-final-npm-test.log`.
  Intermediate runs stopped while authoring/layout changed are not acceptance evidence.
- Local browser audit: `check-level5-poisson.cjs` in the approved OpenCode temp folder.
  Wait for chart mounting and font readiness before checking final bounds. Check light
  desktop (1731 x 1006), dark desktop (1280 x 720) and light mobile (390 x 844) in Edge
  and Firefox, all initial solutions, comparison stages, no content controls, no question
  prompts, formulas and complete legends, and no navigation overlap. Screenshots use
  the prefix `direct-`.

Direct Poisson preview:

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-p07a-scene--scene>

Start of the simplified lecture:

<http://127.0.0.1:5173/authoring.html?preview=authoring-level5-block1#/ex:l5-b01-scene--scene>

The subsequent PMF/PDF/CDF increment is documented in
[the distribution-functions review](chemometrics-level5-distribution-functions-review.md).
K-S and Pearson goodness-of-fit tests remain later work; overall timing is not
silently resolved.
