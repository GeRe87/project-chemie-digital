# Mean Values: Level 2

## Authored source and boundaries

Level 2 expands the existing Mean Values path from eight to thirty-three scenes. The
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
formulas retain the shared infocard projection when no separate symbol parts are
authored. Selected formulas with authored DefinitionList parts use the shared
formula-deck projection: each centered formula keeps its legend immediately below
it, with theory cards separate. Water analysis uses list-data evidence and one
intrinsic results surface. All decisions remain generic renderer inference,
without scene-ID layout maps or authored CSS/layout names.
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

### Issue #270: compact examples and course-wide footer audit

The current active route is **33 scenes**, with **seven unchanged executable R labs**.
The standalone geometric/median practice selections are omitted; their reusable
Exercises and ExpectedResults remain authored. The six discussion Exercises share
one scene, preserving their original order and answers. Generic prompt-grid
recognition now supports up to six prompts; wide CSS caps columns at three and
wraps later prompts into a second row, with a single-column narrow fallback.
The owner explicitly approved the composition-policy scope extension in #270.
No content identity, scientific label or course name selects renderer behavior.

The growth question is now explicit: replace the two observed factors with one
constant factor applied in both equal periods. Starting from 100 cells, arithmetic
factor 5 predicts 2500 rather than observed 1600; geometric factor 4 predicts
exactly 1600. Both calculation slides show the original `100 × 2 × 8` comparison.
Microbial arithmetic 3370 is marked as pulled upward by 10000, unsuitable for the
stated positive/log-scale typical-value question; geometric 215.44 describes that
log-scale center better. This does not assert bias relative to an unknown population
mean, universal superiority, safety or permission to discard the extreme count.
For the three concentration comparisons 0.5, 2, 5, arithmetic 2.5 fails the product
criterion (`2.5³ = 15.625 ≠ 5`); the geometric cube root of 5 preserves it. No
sequential-growth model is inferred from these comparisons.

NTU is explained on the turbidity slide as nephelometric turbidity units, a
light-scattering measure of water turbidity. The large event remains visible and
is not automatically classified as invalid. Pumping keeps its equal-volume task,
rates, answer and R, without the extra justification sentence. Level 0 logistics
are Tuesday 10:00–13:00 and Wednesday 12:00–14:00, without a room.

All active Levels 0/1/2 were audited for redundant closing prose:

| Level | Removed active selection | Essential content retained |
| --- | --- | --- |
| 0 | Lecturer's repeated name/institution tagline | Profile cards and IUPAC definition citation. Nitrate questions remain substantive practice, not a slogan. |
| 1 | Why-values-differ closing paraphrase | Designed/observed cards; study-design role qualification moved into observed card. Definition citation and all model/formula legends retained. No other active slide has redundant closing prose. Later deselected scenes are not changed. |
| 2 | Arithmetic ADD AND DIVIDE / REPRESENTATIVE CENTER cards; geometric general footer; expectation, harmonic, median, layers, turbidity and speed-comparison closing notes | Equal numerical weighting/meaningful addition/non-normality in arithmetic legend; finite expected absolute value in expectation context; positivity in geometric legend; equal quantities versus times in harmonic context; median qualification in robust card; full layer assumptions/legend; turbidity event caveat in context; actual 60 s in both speed candidate cards. |
| 2 | None on purpose or model/data bridge | Purpose sampling/bias/outlier condition and bridge estimation/answer are necessary, not disposable slogans. All 22 formula legends, seven function legends and optional authored answers remain. |

Removed prose resources remain reusable in RDF; no global footer CSS hiding was
introduced. Example headings are explicitly prefixed in authored RDF for:
`dice-flow`, `dice-warmup`, `dice-sums`, `dice-expectation`, `real-world`,
`dice-practice`, `lln-practice`, `water`, `growth`, `growth-comparison`,
`growth-calculation`, `growth-r`, `microbial`, `ratios`, `speed`,
`speed-comparison`, `speed-solution`, `speed-r`, `harmonic-practice`, `layers`,
`turbidity`, `order`, `lead`. Concept, logarithmic-theory, summary and discussion
headings are not mislabeled as examples.

Validation uses the actual 5173 course overworld, not a standalone preview.
Free-text discussion remains spoken classroom interaction: Pitch has no answer
buttons for these existing prompts; their ExpectedResults remain in transport and
the static/self-study projection. No new voting or answer-entry runtime is claimed.
Fresh portrait opening and quantitative river/tracer animation remain separate.
Earlier sections below are historical and their counts/order are superseded here.

### Issue #268: coherent mean-value teaching sequences

The current route is 36 scenes: four new scenes split numerical calculation and
R demonstrations from general theory. The flow now shows only five outcomes →
one sum. Repeated experiments remain in the exercises, not a redundant third card.
The discrete expectation legend explicitly explains `P(X=x)` as the probability
that X takes outcome x; probabilities weight possible values and sum to 1, rather
than being the observed sample frequencies. The theory selection no longer contains
the ambiguous MODEL/OBSERVATIONS cards; the reusable resources remain authored.

Immediately after the five-dice calculation, the moved `real-world` scene contrasts
model expectation 17.5 with actual sums 10, 13, 18, 10, 23, asks why they differ and
bridges to estimation from appropriately sampled data. Arithmetic-mean theory and
practice follow. Finite observations are not presented as guaranteed expectations.

Growth now proceeds: 100 → 200 → 1600 cells over equal periods; arithmetic factor
5 would instead produce 2500; general geometric formula/legend; geometric factor
sqrt(2×8) = 4 preserves 1600; same-case R. Inputs are multiplicative factors,
not untransformed percentage rates. Existing practice/log/microbial/ratio content follows.

Speed now proceeds: two equal 100 m sections at 10 and 2 m/s; arithmetic and geometric
candidate speeds predict 33.33 and 44.72 s rather than 60 s; general harmonic
formula with reciprocal units; total distance/total time equals the harmonic
calculation; same-case R. The pumping lab and diffusion example follow unchanged.
The other means are defined, but do not preserve travel time for equal distances.

There are seven executable labs. New code, answers and complete function lists are
authored RDF resources derived from the existing worked cases, not falsely credited
as quoted source code. All seven executed/reset in dark/light via the actual 5173
course; growth returns factor 4 and 1600 cells, speed returns times 10/50 s, total
60 s and matching overall/harmonic speed 3.333333 m/s. No frontend, ontology vocabulary,
Level 1 or runtime-code changes are part of this content-only increment. Existing
portrait-navigation/small-scale limitations and separate tracer animation remain.

Older sections below retain historical audit context; this section supersedes their
previous scene/lab counts and active selection order.

### Issue #266: purpose, teaching order and diagram containment

The current active route contains 32 scenes (31 minus the standalone LLN theory
scene plus purpose and illustrative-sums scenes). Reusable LLN definitions and
interpretations remain authored, and repeated-experiment practice is retained.
The opening is title → purpose → experiment flow → warmup → observed sums →
expected-value theory → five-dice expectation calculation → arithmetic-mean
theory → empirical practice → repeated sampling. The new sums are 10, 13, 18,
10 and 23, reproduced with the unchanged `set.seed(42)` five-repeat R example.
Their empirical average is 14.8, not the model expectation 17.5.

Level 1 adds a short purpose list immediately after the variable definition,
bringing its active route to 12 scenes (17 authored scenes including retained
inactive resources). Both purpose cards and the sums list use existing RDF
KeyPoints and a generic source-linked explanatory-list composition. Compact
lists do not automatically highlight entire sentences. Stability of averaging
is qualified by independent random fluctuations around the same target; it is
not presented as resistance to arbitrary outliers or systematic errors.

Warmup questions now explicitly author `[?]`. The shared task-circle draws a
font-independent exclamation stem/dot rather than a potentially ambiguous heavy
font glyph. A single authored question item also uses the safe Markdown renderer.

The clipped speed-solution/layer diagrams were reproduced at 1440×900: their SVG
minimum height was 344 logical px inside a 288px allocated host, extending below
the slide. Formula-stage rules now constrain the runtime/figure/SVG chain with
zero minimum height and full-viewBox scaling. Wide SVG bottoms measure 862.81px
inside the slide bottom 882.19px; narrow checks after wide entry also retain the
complete viewBox, but whole-deck portrait scaling remains small. This is not a
fresh-portrait-navigation repair or completion of the separate tracer animation.

Earlier increment sections below retain historical implementation/audit context;
their prior active counts/order are superseded by this section.

### Issue #261: shared teaching primitives

- Teaching textboxes, definition cards, editor/output surfaces and slide panels
  use a common square-corner default. Definition entries retain their wrapper
  everywhere, not only in a selected main-region layout. Supporting motifs stay
  anchored to their own card. Prompt/code columns both start at the top.
- The editor uses 24 px logical presentation type, matching the unchanged output
  scale. CodeMirror wrapping and local Run/Reset remain intact.
- Authored prompt literals may use an inert Markdown subset: paragraphs, strong
  text and unordered bullets. The warmup has one bold instruction, then two
  indented questions. Question, emphasized-statement and ordinary-list markers
  share theme tokens (cyan/teal question circle, amber exclamation circle, violet
  triangle). They are decorative and hidden from assistive technology. No
  punctuation or scientific label is used to infer marker purpose. Explicit
  prose `format: plain` remains plain.
- Local SVGs are copied into inert drawing primitives through an allowlist,
  never inserted as raw fetched HTML. Only exact same-origin SVG URLs present in
  the compiled scene transport supplement the pinned-vendor fetch allowlist;
  external SVG reads, writes, scripts, event handlers, foreignObject and external
  paints are not enabled. Unsupported drawings retain their accessible image
  fallback. Dice and cells have transparent canvases and inherit active theme
  color through the inline drawing. The source image is replaced, not shown
  twice. Live Alt+T switching updates their color without changing scientific
  content. Static source images/alternatives remain available without JavaScript.
- All 23 active Level 2 formulas now own source-linked DefinitionList legends
  through existing `dct:hasPart` relationships. The generic compiler preserves
  these explicitly authored parts after the selected math block. No symbols or
  scientific explanations are inferred from LaTeX. Each entry has one owning
  list, stable identity, English label/body and source traceability. Formula
  values, spoken descriptions, all 31 scenes and their ordering are retained.
- The cell sketch represents populations, not literal cell counts; its labels
  agree with the existing 100 → 200 → 1600 experiment over equal periods.

### Issue #263: remaining shared Level 2 corrections

The active path now has 31 scenes: the standalone Fe scene was merged into the
water-analysis scene, which retains the five-row table, the three separate mean
results, the Fe exercise and its executable R block. The renderer infers a
2×2 wide four-cell practice grid by component order, without scene identifiers.

Flow information cards are one outer SVG box with transparent semantic header
and body groups and one divider. A notation/motif occupies a fixed two-line
header band and the label starts below it; this works for one-line and wrapped
titles. The dice-flow nodes author `5×`, `∑` and `⟳` in `skos:notation`; the
renderer places those values in the symbol area rather than a fixed corner.
Authored slides headings use generic CSS capitalization while RDF labels remain
unchanged.

Exercise Markdown uses explicit list-item tokens: `- [!]` for a task,
`- [?]` for a question and plain `-` for an ordinary point. The renderer removes
the token from visible/accessible wording, escapes all inline text, and draws
decorative marks with theme colors. The five-dice practice instructions and the
repeat-more-often task/question now use the source-authored
bold-first-sentence/typed-list structure; no punctuation inference is used.

Each of the five executable R examples links an authored DefinitionList of
function explanations through `dct:hasPart`. Generic compilation preserves
entry identity/provenance; the Reveal renderer groups it under the code editor,
Run/Reset and bounded, scrollable output in a separately scrollable lower
glossary area. Static fallback retains the authored glossary. This grouping
keeps arbitrary output from pushing the function reference off the slide.

Focused Mean Values/SHACL, renderer tests and the normal course browser are
required before completion; fresh portrait-level opening remains the separate
known #214 navigation failure. The earlier #257 all-scene audit below records
that increment's state and is superseded for the merged water/Fe scene, typed
task prompts, flow icon placement and active R function glossaries by #263.

Browser evidence uses the ordinary 5173 course with actual overworld selection.
Wide dark/light opening and active-slide theme switching were verified. Portrait
reflow is reviewed after opening at wide size and resizing to 390×844: a fresh
portrait opening also exhibited the independent course-navigation settlement
failure and is **not** reported as passing. Whole-deck portrait scaling remains
small. Quantitative TypeScript river/tracer animation is a separate pending
assignment, not delivered by these static illustrations.

Run `npm test`. The regression expectations pin all thirty-one scene identities,
positions, focus concepts, selected resources, roles, selectors and block kinds.
SHACL validates the assembled named-graph dataset. Generic heading tests check
the additive projection and rejection cases. New content tests check authored
mathematical descriptions, infocard pairing, numerical examples, answers,
provenance and the absence of legacy layout/runtime markup.

## Issue #257: content-first visual pass

### Issue #259: normal course preview corrections

Use `npm run pitch:intro`, open `http://localhost:5173`, and choose Level 2
from the overworld. This command prepares the pinned local CodeMirror/webR
assets before generating the complete course. Local Run/Reset controls do not
require `?interactive=1`. A standalone build without prepared assets is not
equivalent evidence. All five executable Level 2 R blocks were executed through
this course entry point, including the 50,000-experiment simulation.

The title now selects only the Mean Values heading. A separate next scene
retains the experiment flow below the accessible local five-dice SVG; the
warmup repeats that illustration beside its prompt and code. Generic
`visual-media` and illustrated `prompt-code` compositions retain reading order
without scene-identity selectors. Direct media now has an escaped static fallback.
Supporting card motifs reserve title space; the four previously missing motif
families have SVG masks and unknown decoration is hidden rather than boxed.
Desktop and portrait screenshots remain review evidence, not a claim that all
existing portrait typography or course-wide lecture-budget issues are resolved.

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
Font Awesome arrow, without embedding HTML in RDF. The title now selects a
supported three-node diagram (five outcomes → one sum → repeated sample).
The local accessible SVG remains authored for later reuse, not active selection.
Diffusion's two equal-thickness layers keep
the steady-state, equal-area, series, no-reaction/no-partition qualifications.

### All-scene audit

The table records authoring/policy checks. A browser review of nine representative
scenes at 1440×900 and 390×844 with reduced motion has been performed (details
below); this is not full-deck acceptance.

| Scene | Content/layout result | Remaining visual work |
| --- | --- | --- |
| Title | Supported outcomes/sum/repetition diagram | Desktop checked; mobile scaling needs shared review |
| Five dice warmup | Existing prompt/code split retained | Dice visual beside lab needs supported composition |
| Arithmetic mean | Formula plus two bounded facet cards | Word-level marker capability |
| Five repeated experiments | Existing prompt/code split retained | Browser fit check |
| Expected value | Short context, formula, model/sample cards and short note | Word-level marker capability |
| Dice expectation | Paired formula cards with statistics/input motifs | Exact dice symbols inside cards unsupported |
| Law of large numbers | Three assumption/convergence/limitation cards | Word-level marker capability |
| Repetition lab | Existing prompt/code split retained | Browser fit check |
| Model versus data | Existing two paired infocards retained | Browser fit check |
| Water analysis | Five-row concentration table beside three short mean results | Merged with Fe practice by #263 |
| Iron practice | Existing prompt/code split retained | Merged into water analysis by #263 |
| Growth | Existing three-node semantic growth diagram retained | Browser diagram fit check |
| Geometric mean | Two paired formula cards; compact equivalent log expression | Horizontal formula overflow corrected in desktop review |
| Growth comparison | Two paired infocards retained | Browser fit check |
| Geometric practice | Existing accessible exercise retained | Optional sketch requires supported composition |
| Logarithmic expression | Existing standalone formula retained | Optional log-scale illustration deferred |
| Microbial counts | Two paired infocards retained | Optional count visual deferred |
| Ratios | Two paired infocards retained | Optional ratio visual deferred |
| Equal-distance speed | Original exercise/answer retained on its own card | Desktop checked |
| Speed calculation | Separate solution with formula and two-section diagram | Added after measured overflow; desktop checked |
| Harmonic mean | Short context, reciprocal/equal-quantity cards and formula | Word markers; equal-distance sketch still deferred |
| Pumping lab | Existing prompt/code split retained | Optional pumping sketch deferred |
| Diffusion layers | Assumptions beside two-layer flow; full-width formula lead | Browser diagram/math fit check |
| Turbidity | Separate day/rank-order table beside original five-point chart | Desktop checked; no observations removed or reordered |
| Median | Short context, middle-position/robustness cards and formula | Word-level marker capability |
| Odd/even order | Paired cards identify bracketed middle value/pair and retain formulas | Desktop checked; small math vertical-overflow diagnostic remains |
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

3. Full `npm test` found an additional shared static-fallback gap: the general
   `generate_canonical_runtime.static_fallback()` falls through to prose for a
   `media-reference`, then reads the nonexistent `text` property. The selected
   title SVG triggered `KeyError: 'text'` in the existing Mean Values prompt
   fallback test in the first draft (394/395 Python tests passed). The manager
   authorised a supported diagram instead of active media selection. Ordinary
   Mean Values generation and the fallback regression now pass without compiler
   changes or test suppression. General media fallback support is still a shared
   future capability, but no longer blocks the active Level 2 selection.

Do not resolve these gaps with content-ID CSS, a new layout name in RDF, or
renderer-owned scientific strings. Manager should split a bounded System
follow-up, retain this draft result for review, and require actual browser
evidence before accepting the full visual request.

### Verification additions

`tests/test_chemometrics_mean_values_visuals.py` exercises the real TypeScript
composition policy from the compiled TriG scene document. It checks supported
structural compositions, exact thirty-one-scene count, all water table
cells and recomputed means, diffusion qualifications, SVG alternatives/locality,
motif source references and absence of sentence-length automatic marker lists.
Existing tests continue to pin exact paths/scenes, all long-form theory bodies,
the reusable KeyPoint projection, scientific values and exercise answers.

### Slide-first follow-up and browser evidence

The first browser review confirmed that prompt + calculation + diagram made the
speed slide too tall, and geometric-mean formulas overflowed the narrow main
column. Following the manager's explicit permission for a bounded readability
split, one solution scene was added immediately after the unchanged speed
exercise: positions 19/20, with subsequent positions shifted by one. Scientific
unit/path identities and focus concepts remain unchanged. The existing generic
static-fallback test's scene-count assertion was updated mechanically to 31;
the test itself remains active and passes.

Geometric mean now pairs each independently authored card with its formula.
The compact log-card expression introduces ell as the mean logarithm, then
G = exp(ell), explicitly for positive inputs. It is linked to the unchanged
original log formula, which remains selected on the logarithmic-expression scene.
The turbidity table compares two **separate** orderings, not paired days and
sorted values; all five original chart observations including 45.0 NTU remain.

Browser: headless installed Microsoft Edge through Playwright, deck view, no
background, reduced motion; 1440×900 and 390×844. Nine scene targets: title,
arithmetic mean, water, geometric mean, speed exercise, speed solution, diffusion,
turbidity and odd/even order. Screenshots and measured overflow data are retained
locally under `level2-257-browser/` in the approved OpenCode temporary directory.
No page errors occurred. Desktop geometric horizontal clipping was corrected;
the speed solution now shows a readable diagram separately from the question.

Remaining **measured**, not hypothetical, issues: the shared deck scales very
small on portrait phones; diffusion's formula lead has narrow-view overflow and
its diagram is undersized; arithmetic mean is close to the desktop height budget;
minor math vertical-overflow diagnostics remain in paired cards. No generic CSS
or runtime workaround was authored in this content task. These limits remain
review blockers for full visual acceptance, not reasons to claim all slides fit.

Local verification: 33 focused Mean Values tests passed; the seven existing
prompt/static-fallback tests passed before the readability split and the complete
fallback is additionally checked in the focused suite. Ordinary Mean Values
runtime generation and a production Vite build passed. Full `npm test` is rerun
on the revised content; final outcome and exact-head external evidence remain
required. A built local preview is isolated from test-generated runtime changes.
