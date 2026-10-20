# Semantic mathematical derivations

The existing pipeline remains TriG → canonical compiler → SceneDocument → generic presentation renderer → Reveal. Mathematical transformations are authored, never inferred from LaTeX differences.

## Current compact revision

The current active variance path has **48 scenes**, including four closing
standard-error scenes and deferring degrees of freedom to later statistical tests.
See [the presenter/script review](variance-presenter-review.md),
[the standard-error review](variance-standard-error-review.md) and
[the earlier compact review](variance-compact-review.md)
for the current sequence, exact old/new counts, validation and known limits.

`cd:hasDerivationDetail` optionally links a MathExpression or displayed section
to a full MathematicalDerivation. Its authored sections must cover every step
exactly once. The compiler resolves these as SceneDocument 1.7
`MathBlock.derivationDetails`, with complete rules, assumptions and provenance.
Full proofs use the existing native explanation dialog and generic per-operation
disclosures, not additional LearningPath scenes or Reveal stages. Ordinary
formulas and existing staged derivations remain valid without a detail link.

## Authoring contract

`cd:MathematicalDerivation` owns `cd:inputFormula`, `cd:resultFormula` and `cd:hasDerivationStep`. Steps use the existing integer `cd:position` convention, beginning at 1 without gaps or duplicates. `cd:fromFormula` must equal the preceding step's `cd:toFormula` by resource identity.

Each `cd:DerivationStep` references one `cd:MathematicalRule` through `cd:appliesRule`. Its language-tagged `skos:prefLabel` is the applied operation label. `cd:hasExplanation` selects an Interpretation with authored `cd:body` and `cd:applicationFormula`. A rule has its own label, description and `cd:ruleFormula`; composite rules may reference reusable constituent rules through `dct:hasPart`. Rules and steps may reference `cd:requiresAssumption` resources.

`cd:transformationKind` distinguishes `cd:EquivalentTransformation`, `cd:ImpliedTransformation`, and `cd:StatisticalTransformation`. Statistical steps require explicitly referenced assumptions. Squaring or summing individual equalities is not presented as a reversible equivalence.

Equations are existing `cd:MathExpression` resources. Every symbol in visible equations and rule formulas is linked through `cd:hasSymbol` and covered by a selected legend entry's `dct:references`. Longer explanations and application formulas remain available to self-study and static transports.

## Explicit scene sections and layout

`cd:MathematicalDerivationSection` references its owner through `cd:partOfDerivation` and selects a contiguous range through `cd:firstDerivationStep`/`cd:lastDerivationStep`. `cd:usesLegend` references a shared DefinitionList. A SceneItem uses `cd:DerivationRole` and selection path `cd:partOfDerivation`.

The current conservative presentation contract accepts one or two transformations per section. Longer derivations require authored sections and explicit LearningPath steps. This is not automatic pagination and never mutates the path in the browser. All active reference sections use one transformation after the visual review found two too crowded.

SceneDocument 1.7 additively extends MathBlock with an optional derivation section; ordinary formulas are unchanged. Existing `learning-stage`/`formula-deck` composition is reused. Expression extent and authored line count select vertical or column geometry. Measured horizontal overflow may place operations below equations rather than reducing type. Available space, section length and legend count affect the grid/flex layout; no content identity is consulted. A `data-derivation-fits` measurement supports review but is not an algebra solver or an automatic semantic splitter. Extremely large authored formulas still require a shorter explicit section or authored equivalent multiline presentation.

Main formulas use 1.35em over the normal lecture text size; visible rules use .85em. The ordinary formula primitive's 1.5em multiplier is deliberately neutralized on derivation containers to avoid accidental nested scaling. Theme tokens supply surfaces, foreground and accents. There are no scientific-IRI, title or scene-number selectors.

## Stages and interaction

The existing semantic-disclosure stage system shows input → operation → result. Each transformation adds two Reveal fragment stages; hidden cards are disabled. Operations open one native HTML dialog whose content is rendered from the resolved semantic resources with KaTeX. Because the existing graph panel replaces the presentation rather than displaying a small modal, it is not reused for this interaction.

The dialog supports X, Escape, Enter/Space activation, explicit Tab/Shift+Tab focus cycling and focus return. Capture-phase keyboard and wheel shielding prevent Reveal navigation while preserving internal explanation scrolling. Closing does not reinitialize Reveal or change fragment state. Plain formula rendering is unaffected.

Print CSS exposes all equations and rules, hides dialogs and click hints, and a beforeprint handler closes an open explanation. Explanations remain in the semantic payload and self-study adapter. The review PDF is a single-scene excerpt of the actual rendered DOM; full-deck PDF pagination is not covered by this increment.

## Reference coverage

Variance now has 71 active scenes. Existing residual algebra (6–10), lake motivation (11), repeated sampling (13–15) and centers/squared-sum algebra (16–21) are retained. Scene 12 distinguishes observable inputs from unknown parameters and shifts. The normalized MSD identity is 22; definitions and rules are 23–27; the return to the identity is 28. Expectation steps are 29–31. Mean expectation, variance and squared error are derived one rule at a time in 32–38, followed by bias, correction and practical interpretation in 39–43. The theory chart is 44; the df transfer is 48. The existing later analytical material follows unchanged. Eight superseded expectation scenes and the earlier population-definition scene remain reusable but unselected. No fixed scene-count constraint was used. Original simulation data, instructor programs and seeds remain unchanged.

`mean-derivation-reference.trig` adds an unselected integration path that explains the existing arithmetic-mean/dice calculation without changing published Mean Values scenes or its path. The two reused formulas gain symbol links, so generated provenance includes the new graph while their scientific content remains unchanged.

Focused tests: `tests/test_mathematical_derivations.py`, `packages/renderer-reveal/test/mathematical-derivation.test.ts`, existing composition/stage and statistical-chart tests. The full suite was intentionally not run during this iteration.

## Navigation and deferred course loading

`main.ts` is a lightweight bootstrap. The course generator marks course HTML and writes a disposable public `course-runtime/manifest.json` with offering metadata, exact bindings and scene identities, plus one transport per selected path. Scene bodies and the shared semantic snapshot are absent from the world manifest. A Start action changes the existing page URL with a `level` query parameter, loads only its transport and dynamically imports `presentation-main.ts`. A full document navigation deliberately tears down all previous runtime listeners and Reveal state. Shared styles and the existing world renderer are reused; no new router framework is introduced.

Standalone generators remain supported through a separate dynamic import of their original canonical artifact. Authored scene-ID links and legacy numeric course links are resolved at bootstrap. Public URLs use the existing Base Path resolver. Accessible static content remains available through a generated linked HTML fallback, instead of embedding all lectures in the world page.

The selected presentation creates one Reveal instance. A Start action clears Reveal's pathname-scoped stored scroll position; explicit scene links are placed at their actual scroll-page boundary after initialization. It does not rely on a proportional scroll-trigger offset in a fragment-rich deck.

Operations retain Enter/Space activation while arrows/Page keys use the existing presentation navigation command even after focus returns to a card. Scroll-view Previous/Next buttons and staged swipes use that same command. Wheel input now uses it on **both staged and plain pages**: native mandatory scroll snapping could undo small detents on plain pages, while an idle-based debounce could indefinitely suppress a sustained stream on stages. Repeats are bounded from the last accepted command (180 ms), not from the last event; small deltas accumulate to 64 normalized pixels, and reversal resets the accumulation. Ctrl-wheel and editor/dialog input are not commandeered. Commanded page-boundary moves are explicitly instant: releasing the stage lock otherwise restored smooth-scroll CSS, leaving an outgoing scene active during an asynchronous transition. This does not disable intentional scrolling inside dialogs or code editors. Closing an overlay does not change the scene or fragment count.

`tests/browser_pitch_navigation.py` traverses the actual world → Start path with real keyboard, click, touch/swipe and wheel input, records scene identities and fragment positions, completes both directions, opens/closes explanations, oscillates between staged neighbors and restarts the level. It never drives navigation through the internal Reveal API. `tests/browser_pitch_loading.py` measures resource/DOM/heap counts, asserts that the world loads no presentation module, verifies selected-document isolation and exercises direct links. Both support a deployed Base Path URL.

## Symbol legends and deviation stems

Formula legends can project individually referenced MathSymbols into DefinitionList entries marked `symbol: true`. `cd:presentationDefinition` optionally supplies concise authored wording while retaining the full `cd:body`. Symbols use an accent and bold weight; explanations use normal theme foreground text. Each symbol has its own entry and responsive column layout. Derivation main legends cover the actual equations; generic-rule-only placeholders stay in the rule/application explanation instead of expanding the main slide legend. Original long legend resources remain canonical and reusable.

The existing categorical DotPlotBlock additively supports `drawStems`. The semantic `cd:drawStems` option requires a shared reference line and authored category labels for individual observations. The renderer draws one vertical segment from the reference value to each point, preserves series colors, and displays signed numeric distances. It does not assume a zero baseline, alter values or contain authored scientific datasets. Geometry and category selection are generic; regular dot plots are unchanged. The lake scenario uses a separately authored R seed 1904 draw, with canonical observations/results and no inference of bias from a single sample.

## Mathematical notation, labels and analytical evidence

`cd:mathNotation` stores explicit LaTeX on an existing MathSymbol. The compiler projects it as `DefinitionListEntry.expression` with graph-attributed provenance; the existing KaTeX renderer displays symbols in both ordinary and derivation legends. There is no Unicode-to-LaTeX heuristic or formula-specific rendering branch. Unannotated resources remain compatible with their original symbol strings. `cd:formulaLabel` is an optional localized label on a MathExpression, projected to `MathBlock.label` or `DerivationFormula.label`; it stays with the formula in generic units, including comparison columns. Both properties have additive SHACL constraints.

The generic ordered signatures list + table + chart/media + list and diagram + table + list select `scenario-data-visual` and `process-matrix`. A concise list + chart + list places scenario context above the chart without changing its scientific layers. These signatures use block kinds and order only. Definition descriptions allow the existing safe bold subset and `==highlight==` mapped to the established marker utility; prose stays normal weight. The precision SVG uses canonical schematic coordinates and distinct crosses/circles, with a neutral high-contrast canvas in both themes. It is not a QC dataset and explicitly does not establish trueness.

The corrected Monte Carlo chart reuses the seed-1903 mean observations and attaches derived StatisticalResults through the existing summary contract. Multiplication by n/(n−1) gives paired corrected means from the same samples; inherited six-decimal source rounding is documented. The original MC data and theoretical curve file is byte-for-byte unchanged. Five lake sample SDs use n−1 and retain all fifteen observations. A derived QC B dataset stores the same concentrations in g/L, explicit `cd:unitScaleFactor 0.001`, and observation-level source links. RSD is unchanged by the positive scale factor. Independent variance addition is an explicitly assumed additive model, with illustrative numbers and covariance caveats, not components inferred from pooled SDs.

## Local webR assets and deployment paths

webR remains the prepared local v0.6.0 runtime, loaded only when Run is pressed after a level is selected. The dev command runs the pinned vendor-preparation/check process before Vite. Both entry module and worker/base URLs use `resolvePublicAssetUrl`; a native import-map prefix resolves the reviewed CodeMirror modules' internal root-relative vendor specifiers below the same deployment base, without rewriting their pinned bytes. The preview fetch allowlist uses that local vendor prefix too. No new CDN, second R runtime or world-start dependency was added.

The reproducible production defect was root-relative `/vendor/` requests receiving HTTP 404 when files were served below `/chemie-review/vendor/`. The reported root-server import failure was not reproducible with the current prepared cache. Evidence preserves that distinction. The R capture wrapper now prints every visible top-level expression and closes its text connection, while variables retain the existing shared runtime environment. A failed initialization clears the cached promise so a later Run can retry.

Targeted evidence additionally includes `tests/test_variance_uncertainty.py` (lake SDs, unit conversion, paired correction, variance rules, math labels, order), `tests/browser_pitch_webr.py` (real UI runs/repeats/restarts/themes/viewports), and `tests/browser_pitch_visual.py` (both themes/viewports, regions, legends, stage/overlay screenshots). Use `tests/browser_pitch_navigation.py` separately, without concurrent course-generation writes, to prevent Vite reloads invalidating traversal. No full suite is required for this review round.

## Shared moment-rule library and estimation-first sequence

`statistical-moment-rules.trig` extends the existing `graph/mathematics/rules`, not a topic-specific rule engine. Stable `rule-*` IRIs cover constant expectation, expectation under location/scale changes, variance under scaling/translation, variance-covariance and independent-sum identities, finite-average linearity, and elementary normalization/substitution. Existing expectation-addition/factor and variance-definition resources are reused. The earlier `rule-expectation-affine` and its formula retain their IRIs and move from the lecture graph into the shared graph. Applications and numerical examples are separate from the general identities. A two-variable independent-sum formula is an authored specialization of the same finite-sum rule, not a second lecture-owned rule.

`bessel-teaching-contexts.trig`, `bessel-estimation-derivations.trig` and `bessel-learning-sequence.trig` author the problem, definitions, formulas, four connected derivations and selected scene sections. The main chain is squared-sum decomposition → normalized MSD identity → expectation linearity → population-centered second moments → mean-error substitution → bias factor → unbiased correction. A separate, explicitly referenced branch derives the mean expectation, its variance via squared scaling and independent variance addition, then its expected squared error. One transformation is displayed per section. The observed formula and final interpretation distinguish unknown μ/σ²/δ from observable xᵢ/x̄/n, and never claim that Δ was calculated from one real sample.

Main derivation conditions display semantic assumption labels; full explanations remain in the same rule dialog and payload. This avoids overflowing an entire paragraph below equations without deleting prerequisites. Shared rule assumptions use labels that retain independence, finite variance and n > 1 explicitly. Three formula/legend units use an identity-free two-column arrangement; the third unit spans the next row. Scenario + table + conclusion in one rail with a chart in the other uses the existing `scenario-data-visual` profile. Neither layout depends on a title, equation string or scientific IRI.

`tests/test_bessel_learning_sequence.py` checks complete rule resolution, graph provenance, reuse from a second LearningPath, order before application, all new sections and exact finite-population expectations without normality. `tests/browser_pitch_wheel.py` uses actual native wheel input even on plain pages; it has no click fallback, tests sustained streams without idle gaps, and records scene, stage, expected/actual state, wheel input, focus, overlay, scroll and Reveal indices. The previous wheel traversal that substituted clicks on plain pages is insufficient evidence for this defect. `browser_pitch_navigation.py --normal-motion` additionally exercises the formerly masked smooth-transition behavior.
