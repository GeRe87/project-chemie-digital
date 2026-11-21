# Level 8 — Linear Regression, first appointment

## Handoff outcome

Full initial canonical teaching draft: **55 ordered scenes**, six topic-wise
script sections, 46 authored mathematical expressions with structured symbol
legends, 21 theme-aware SVG assets and five selected fitting experiments.
This is an owner-authorised local authoring increment, not a dispatcher turn.
No workflow state, shared runtime, policy, previous lecture or published offering
was edited by this authoring task. No commit, push, merge or deployment was made.
Coordinator-owned runtime changes were present during final compilation; they
were read but not modified here.

### Canonical files

- `ontology/dataset/chemometrics-level8-knowledge.trig`: concept, definitions,
  questions, observations, takeaways, media and source identities.
- `ontology/dataset/chemometrics-level8-mathematics.trig`: formulas, authored
  symbol notation, legends, rules and the connected two-step derivation.
- `ontology/dataset/chemometrics-level8-data.trig`: five paired datasets and
  five experiments, including all 25 parameter resources.
- `ontology/dataset/chemometrics-level8-scenes.trig`: scene selections,
  communicative roles, narration and semantic reveal anchors.
- `ontology/dataset/chemometrics-level8-paths.trig`: the isolated offering,
  placement, learning unit, path and question/answer links.
- `ontology/dataset/chemometrics-level8-scripts.trig`: continuous topic-wise
  prose with explicit figure, chart, code and formula references.
- `apps/pitch/public/chemometrics/level8/*.svg`: inert authored drawings.

The exact path graph is
`https://w3id.org/project-chemie-digital/graph/paths/level8-linear-regression`.
The selection chain is `ex:teaching-offering-level8-local` →
`ex:unit-placement-level8-local` →
`ex:learning-unit-linear-regression-foundations` →
`ex:path-level8-linear-regression`. It is not connected to the published offering.

## Important numerical correction

The owner-specified **observations are unchanged**. Their supplied derived drift
summary was internally inconsistent. Independent recomputation gives:

| Quantity | Supplied summary | Draft, computed from the five observations |
|---|---|---|
| sum of time × signal | 69.8 | **69.9 min·mV** |
| intercept | 1.04 | **1.02 mV** |
| slope | 1.98 | **1.99 mV/min** |
| fitted values | 1.04, 3.02, 5, 6.98, 8.96 | **1.02, 3.01, 5, 6.99, 8.98 mV** |
| residuals | .06, −.22, .20, −.08, .04 | **.08, −.21, .20, −.09, .02 mV** |
| SSE | .10 | **.099 mV²** |

The original proposed residuals have a nonzero time-weighted sum of 0.10
min·mV, so they cannot satisfy the claimed normal equations for these data.
The corrected fit has both required dot products zero. Interpolation at 2.5 min
is 5.995 mV. The supplied quadratic, straight-comparator, log-decay, reciprocal,
matrix-product, inverse and ANOVA-bridge results were independently confirmed.

## Progression and scene list

Scene IDs remain stable. The criterion-comparison scene `l8-scene-55` was inserted
at **path position 51**; the last four IDs consequently differ from positions.
Do not derive ordering from IDs or filenames.

| Position | Scene ID suffix | Purpose / title |
|---:|---|---|
| 1 | 01 | Linear Regression — heading only |
| 2 | 02 | A signal drifts during a run |
| 3 | 03 | What signal would you predict at 2.5 min? |
| 4 | 04 | Fit by eye: two coefficients — manual experiment |
| 5 | 05 | Give every vertical gap a sign |
| 6 | 06 | Does a signed total of zero mean a perfect fit? |
| 7 | 07 | Square first, then add |
| 8 | 08 | Matrices: language for many observations |
| 9 | 09 | Count rows before columns |
| 10 | 10 | Read an entry: row first |
| 11 | 11 | A column is not a row |
| 12 | 12 | Square matrices |
| 13 | 13 | Diagonal matrices |
| 14 | 14 | Identity matrices |
| 15 | 15 | Addition and subtraction |
| 16 | 16 | Multiply by one scalar |
| 17 | 17 | Transpose: rows become columns |
| 18 | 18 | Can these matrices be multiplied? |
| 19 | 19 | One output entry is one dot product |
| 20 | 20 | Changing order changes the result |
| 21 | 21 | Entrywise multiplication is different |
| 22 | 22 | An inverse undoes a matrix |
| 23 | 23 | Some square matrices have no inverse |
| 24 | 24 | Two equations, one matrix equation |
| 25 | 25 | Measurements outnumber coefficients |
| 26 | 26 | Build the design matrix |
| 27 | 27 | One observation supplies one row |
| 28 | 28 | One known term supplies one column |
| 29 | 29 | Multiply X by the coefficient column |
| 30 | 30 | Check the units of every term |
| 31 | 31 | From the criterion to normal equations |
| 32 | 32 | Minimise the squared residual column |
| 33 | 33 | Warm-up: the bottom of a bowl |
| 34 | 34 | Two coefficients, two zero-derivative conditions |
| 35 | 35 | Insert residuals and distribute — derivation section 1 |
| 36 | 36 | Rearrange: the normal equations — derivation section 2 |
| 37 | 37 | Compute the two sides from all five rows |
| 38 | 38 | A small inverse makes this example transparent |
| 39 | 39 | Solve for intercept and slope — automatic experiment |
| 40 | 40 | Return to the observations |
| 41 | 41 | Why duplicate columns fail |
| 42 | 42 | Read a small R fit without running R |
| 43 | 43 | Change the terms, keep the coefficient problem |
| 44 | 44 | A heating ramp is visibly curved — manual experiment |
| 45 | 45 | Build the columns [1, x, x squared] |
| 46 | 46 | Fit the quadratic ramp — automatic experiment |
| 47 | 47 | Linear refers to the coefficients |
| 48 | 48 | A positive concentration decays |
| 49 | 49 | Fit a dimensionless log ratio |
| 50 | 50 | Back-transform, but keep the criterion clear |
| 51 | 55 | Which residual scale are we minimising? |
| 52 | 51 | A reciprocal term gives a special hyperbola — automatic experiment |
| 53 | 52 | Optional bridge: categories also become columns |
| 54 | 53 | What stays the same across all examples? |
| 55 | 54 | How certain is our predicted signal? — deliberately unanswered |

The six script sections cover motivation/criterion, matrices, design matrix,
normal equations, applications and the closing open question. Reused figures
have one explicit script placement and subsequent prose references point to it.
All displayed formulas retain the full authored legend in their script unit.

Question 3 has its explicit answer at scene 39. Question 6 is answered by scene 7.
Their question scenes select no answer resource or takeaway. The final question
is graph-owned but deliberately does not use the closed-answer guiding-question
contract, which requires an answer within the selected path.

## Experiment integration contract

All five are selected `ChartDefinition` resources with
`cd:chartType cd:ScientificExperiment`, kind `"linear-regression"`, `ChartRole`
and selection path `"cd:body"`. Their scene contains **no duplicate MediaRole**.
Axis labels and units are authored; paired data use `numericValue` for predictor
and `pairedValue` for response, in `cd:position` order.

| Resource | Scene | Dataset | basis / mode | Initial or reference coefficients |
|---|---:|---|---|---|
| `ex:l8-fit-drift-manual` | 04 | `ex:l8-drift-data` | 0 / 0 | 0, 2.5, 0 |
| `ex:l8-fit-drift-auto` | 39 | `ex:l8-drift-data` | 0 / 1 | 1.02, 1.99, 0 |
| `ex:l8-fit-quadratic-manual` | 44 | `ex:l8-quadratic-data` | 1 / 0 | 20, 2, 0 |
| `ex:l8-fit-quadratic-auto` | 46 | `ex:l8-quadratic-data` | 1 / 1 | 21, .5, .8 |
| `ex:l8-fit-reciprocal-auto` | 51 | `ex:l8-reciprocal-data` | 2 / 1 | .4, 8, 0 |

Every experiment has exactly `basis`, `intercept`, `slope`, `quadratic`, `mode`.
Parameter IDs append `-<key>` to the experiment ID. All have labels, positions,
numeric values, minima, maxima, positive steps, adjustability and reciprocal source
links. Basis and mode never adjust; all automatic coefficients are non-adjustable
and computed by the coordinator's generic runtime. Manual drift intercept range
is −2…5 by .02, slope 0…4 by .02. Manual quadratic intercept is 15…25 by .02,
slope −2…6 by .02 and quadratic −1…2 by .01. Unused quadratic terms stay fixed.
Manual scenes do not disclose the automatic fitted coefficient values.

## Formula, accessibility and staging decisions

- Every expression has `dct:hasPart` pointing to an ordered DefinitionList.
  Entries reference authored MathSymbols, including indices/operators/conventions;
  symbols carry explicit `mathNotation`. The shared renderer supplies the
  responsive multi-column legend and disclosure, not scene-specific code.
- Scene 35 and scene 36 each select **one** `MathematicalDerivationSection` using
  `DerivationRole`. The first produces the exact input resource of the second.
  No font size was decreased to fit the derivation.
- Back-transformation and the two-line criterion comparison now occupy different
  scenes. The criterion scores have different units and are not ranked against
  one another. The back-transform is not claimed to be an unbiased raw mean.
- All SVGs contain only inert allowlisted tags/attributes. There are no style
  elements, classes, fallback-variable syntax, external frames, clip paths,
  scripts or external resources. Text uses `currentColor`; marks use approved
  `--pcd-*` tokens. Every SVG `desc` exactly equals its MediaAsset alternativeText.
- Cumulative SVG baselines are **untagged**, so advancing does not remove them.
  Staged additions use `data-svg-stage="1..N"`; N is at most three in this draft.
  Semantic reveal anchors point to the same selected MediaAsset, within bounds.
- The cover is only one HeadingRole with English title **Linear Regression**;
  the path has the same English label, avoiding the generic duplicate-cover rule.
- Synthetic data contain no personal information. Read-only R code requires no
  external runtime. No SE/coefficient uncertainty, inferential tests/bands,
  Gauss–Markov theorem, detection limits or residual diagnostics are taught.

## Sources checked

Read-only retrieval verified the titles and relevant content of these primary
sources during authoring on 2026-11-19:

- NIST/SEMATECH, [Linear Least Squares Regression](https://www.itl.nist.gov/div898/handbook/pmd/section1/pmd141.htm): linearity in coefficients and known model terms.
- NIST/SEMATECH, [Least Squares](https://www.itl.nist.gov/div898/handbook/pmd/section4/pmd431.htm): squared-residual criterion and coefficient differentiation.
- Gilbert Strang, MIT OCW 18.06, [Lecture 1: The geometry of linear equations](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/lecture-1-the-geometry-of-linear-equations/): scalar equations, columns and matrix equations.

The owner-specified synthetic examples have their own primary authored source;
they are not attributed to NIST. Source links are reciprocal through
`hasSource`/`supportsResource`; no unrelated reference buttons were inserted.

## Checks actually run

Final focused commands:

```powershell
python .local/level8/author.py
python .local/level8/preview.py
python -u .local/level8/validate.py
node .local/level8/check-math.cjs
```

`preview.py` invokes the exact provided generator and selection arguments. The
equivalent direct `generate-authoring-preview.py` command was also run after the
55-scene revision. The final authorised preview files are:

- `apps/pitch/public/authoring-level8-linear-regression-runtime.json`
- `apps/pitch/public/authoring-level8-linear-regression-static.html`

With the coordinator's local dev server, open
`/authoring.html?preview=authoring-level8-linear-regression`.

Results:

- **854 focused assertions passed**, covering RDF parsing, exact ordering and
  resource resolution, same-scene legends and reveal anchors, SVG allowlist/alt
  equality, all experiment parameters/selections, cover, independent numerical
  recomputation, reused Level 7 data and six-section script compilation.
- **Focused SHACL conforms: true; zero violations**, using 16 existing relevant
  shapes on the new content, with the existing ontology subclass hierarchy.
  The earlier isolated-data run omitted that hierarchy and produced 191
  `selectsResource` class failures; those were validation-context errors, not
  grounds to weaken shapes or add false authored classes. An earlier oversized
  focus/shape cross-product run timed out and is not counted as a pass.
- **100 formula and symbol-notation strings parsed in KaTeX** with errors enabled.
- The real compiler generated **55 scenes** and one six-section thematic script.

Evidence is in `.local/level8/focused-validation.json`, `shacl-report.txt`,
`shacl-summary.json`, `math-validation.txt` and `scene-manifest.json`.
Generation helpers and transport JSON are disposable, never semantic sources.
No full `npm test` or full-project SHACL suite was run.

## Remaining coordinator checks

Browser QA remains with the coordinator: both themes, portrait/landscape,
keyboard-accessible Symbols disclosure, full static/PDF legends, stage traversal,
manual coefficient controls and computed automatic results. The earlier overflow
reports for scenes 34/36/50 are not claimed resolved by a browser measurement:
36 now has one section, 50 one formula, and the comparison is on new scene 55.
Measure only visible fragments and opened details; hidden content can create
false overflow positives. Recheck scene 34 in particular without shrinking type.
No publication or pedagogical-effectiveness claim is made by this initial draft.
