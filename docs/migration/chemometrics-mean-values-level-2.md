# Mean Values: Level 2

## Authored source and boundaries

Level 2 expands the existing Mean Values path from eight to thirty scenes. The
learning unit, path identity and six scientific focus concepts are unchanged.
Level 1 still ends at Types of variable values.

The reviewed legacy input is `topics/MeanValue.md` from the supplied local
`elearning-elearning-mosaic` archive. Its SHA-256 is
`46fdbea022d65dba3c7d827716b0a13dd00216f2babdf5f0789d838a815f1dbb`.
The input is migration evidence, not scientific authority or a runtime dependency.
No legacy HTML, CSS, JavaScript, slide layout directive or CodeMirror integration
is imported. The Level 2 visual pass adds a newly authored, local five-dice SVG;
it does not copy legacy scientific illustrations without review.

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

Scenes select existing definition-list, formula, prompt, code, chart, table,
media and flow-diagram primitives. Adjacent singleton definition lists and
formulas use the existing shared infocard projection. Short theory facets use
formula-legend, definition-deck and main-aside-note compositions; water analysis
uses list-data evidence and diffusion uses formula-visual. All decisions remain
generic renderer inference, without scene-ID layout maps or new CSS.
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

## Issue #257: content-first visual pass

This is a stacked increment on the committed PR #185 head, not an independent
current-main integration. The owner-local Pitch HTML was excluded using an
isolated worktree. Level 1 and all shared renderer/SHACL/compiler contracts are
unchanged. The original scientific bodies and all 21 source-linked theory
KeyPoints remain intact and reusable. Their active scene selections now use
short independently authored card facets instead of sentence-wide marker lists.
Water formulas remain authored and path-selected; the slide shows their input
table and three short numeric results rather than three repeated formula cards.

Semantic vector motifs add visual anchors to cards. The existing subordinate
example convention (`|> ` in a card description) renders the already supported
Font Awesome arrow, without embedding HTML in RDF. A standalone local SVG on the
title represents five contributions to one sum; its shown faces are illustrative,
not a claim about the expected value. Diffusion's two equal-thickness layers keep
the steady-state, equal-area, series, no-reaction/no-partition qualifications.

### All-scene audit

The table records structural authoring/policy checks, **not browser acceptance**.
Wide/narrow geometry and reduced-motion visual review remain pending.

| Scene | Content/layout result | Remaining visual work |
| --- | --- | --- |
| Title | Local accessible five-dice SVG; no explanatory full-width prose | Browser sizing check |
| Five dice warmup | Existing prompt/code split retained | Dice visual beside lab needs supported composition |
| Arithmetic mean | Formula plus two bounded facet cards | Word-level marker capability |
| Five repeated experiments | Existing prompt/code split retained | Browser fit check |
| Expected value | Short context, formula, model/sample cards and short note | Word-level marker capability |
| Dice expectation | Paired formula cards with statistics/input motifs | Exact dice symbols inside cards unsupported |
| Law of large numbers | Three assumption/convergence/limitation cards | Word-level marker capability |
| Repetition lab | Existing prompt/code split retained | Browser fit check |
| Model versus data | Existing two paired infocards retained | Browser fit check |
| Water analysis | Five-row concentration table beside three short mean results | Browser table fit check |
| Iron practice | Existing prompt/code split retained | Browser fit check |
| Growth | Existing three-node semantic growth diagram retained | Browser diagram fit check |
| Geometric mean | Short context, formulas, positive-input/log-weight cards | Dense formula/card region needs browser review |
| Growth comparison | Two paired infocards retained | Browser fit check |
| Geometric practice | Existing accessible exercise retained | Optional sketch requires supported composition |
| Logarithmic expression | Existing standalone formula retained | Optional log-scale illustration deferred |
| Microbial counts | Two paired infocards retained | Optional count visual deferred |
| Ratios | Two paired infocards retained | Optional ratio visual deferred |
| Equal-distance speed | Existing prompt/calculation retained | Prompt/formula/sketch composition missing |
| Harmonic mean | Short context, reciprocal/equal-quantity cards and formula | Word markers; equal-distance sketch still deferred |
| Pumping lab | Existing prompt/code split retained | Optional pumping sketch deferred |
| Diffusion layers | Assumptions beside two-layer flow; full-width formula lead | Browser diagram/math fit check |
| Turbidity | Existing authored five-point chart retained | Narrow context/chart fit; sorted-value visual deferred |
| Median | Short context, middle-position/robustness cards and formula | Word-level marker capability |
| Odd/even order | Existing two paired infocards retained | Optional positional sketch deferred |
| Lead comparison | Existing two paired infocards retained | Optional concentration chart deferred |
| Median practice | Existing accessible exercise retained | Browser prompt fit check |
| Summary | Four intrinsic cards with semantic vector motifs | Browser wrapping check |
| Additive discussion | Three accessible question cards retained | Three exercise/SVG thumbnail groups unsupported |
| Multiplicative discussion | Three accessible question cards retained | Three exercise/SVG thumbnail groups unsupported |

### Exact shared-system gaps

1. `KeyPointRole` projects plain `text` items without authored inline ranges, and
   `lecture-readability.css` paints the entire `.pcd-list-item-text`. Definition
   descriptions also render through `textContent`. Markdown/HTML injected into
   TriG would therefore not create legitimate phrase highlights. This increment
   removes long automatically marked lists from theory scenes, but does **not**
   claim to implement word-level highlights. Only three short numerical results
   still use that list style.
2. The current scene compiler does not expose arbitrary authored group children
   for exercise+media pairs. The prompt-grid matcher accepts prompts only, and
   prompt-code support accepts explanatory prose only. Adding SVG siblings would
   fall back to an unsuitable stack instead of existing exercise cards. A System
   follow-up must provide generic accessible group/media composition before
   adding six discussion thumbnails or dice imagery beside the code lab.

Do not resolve either gap with content-ID CSS, a new layout name in RDF, or
renderer-owned scientific strings. Manager should split a bounded System
follow-up, retain this draft result for review, and require actual browser
evidence before accepting the full visual request.

### Verification additions

`tests/test_chemometrics_mean_values_visuals.py` exercises the real TypeScript
composition policy from the compiled TriG scene document. It checks the eight
changed structural compositions, unchanged thirty-scene count, all water table
cells and recomputed means, diffusion qualifications, SVG alternatives/locality,
motif source references and absence of sentence-length automatic marker lists.
Existing tests continue to pin exact paths/scenes, all long-form theory bodies,
the reusable KeyPoint projection, scientific values and exercise answers.
