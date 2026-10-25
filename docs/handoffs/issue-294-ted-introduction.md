# Issue #294: visual TED-GC-MS introduction

## Scope and branch basis

Owner-requested Talks follow-up on platform commit
`380025955862812407178199e1b8fddd0178965e` (draft PR #293).
Branch: `agent/294-ted-gc-ms-introduction`. Review target: `talks`; #293 remains
an explicit dependency until integrated. No System/Chemometrics dispatcher state,
other worktree, existing lecture RDF, hosting settings, workflows or releases are
changed. No automatic merge or deployment is authorized by this handoff.

## Authored presentation

The existing title is preserved, followed by six English content scenes:

1. **TED-GC-MS: the sample journey**: five authored diagram states follow heating,
   capture, desorption/focusing/injection, GC separation and MS detection.
2. **Thermal decomposition**: an original vector illustration of heating a
   crucible, evolving smaller products and leaving residue; three concise bullets.
3. **Sorption and transfer**: gas-stream capture on the requested PDMS Twister
   configuration and physical transfer of the loaded sorbent, not liquid SBSE.
4. **Cryofocusing and injection**: three-part illustration separates thermal
   desorption, cold focusing and rapid release into the GC.
5. **GC separation → MS detection**: three authored diagram states distinguish
   compounds separating in the GC from ions forming in the MS and time-resolved
   signal acquisition.
6. **Markers → polymer mass**: a synthetic line chart with two point annotations
   and one area annotation; short bullets distinguish identity evidence,
   calibrated area and polymer/matrix/sample validation.

All displayed headings, bullets, alternatives, diagram labels/states, chart points
and annotations are authored in TriG. Detailed scientific explanation belongs to
definitions and authored narration, not paragraphs on the live slide. `**bold**`
and `==highlight==` reuse the existing safe teaching-text renderer. No formulas or
unexplained mathematical symbol conventions were added.

## Knowledge/renderer boundary

No ontology extension was needed. Reused `Concept`, `Definition`, `Interpretation`,
`KeyPoint`, `MediaAsset`, `Source`, `FlowDiagram`, `DiagramNode`, `DiagramEdge`,
`DiagramState`, `ChartDefinition`, `Dataset`, `Observation`, point/range annotations,
and normal `LearningPath`/`PathStep`/`SceneDefinition`/`SceneItem` selection.

The six new path steps append at positions 2–7 in the **existing exact path named
graph**. Their scientific knowledge, source records, diagrams, synthetic data and
scenes retain separate named graphs. JSON and HTML remain generated transports.
The three SVG files contain inert drawing geometry only: no embedded scientific
labels, scripts, animation engine or alternative metadata authority. RDF provides
the accessible descriptions and links each drawing to its concept.

Eight diagram states and the chart's reveal/annotation stages use the existing
D3/Reveal step runtime, including keyboard navigation and reduced motion. The
three apparatus drawings are static SVGs, not claimed to be animated device models.

## Scientific review boundaries and sources

- Thermal **decomposition products** are collected and GC-separated. MS **fragment
  ions** arise later in the ion source. A chromatogram is signal over time; it is
  not a mass spectrum or a count of intact particles.
- Sorption is used as the neutral term for PDMS collection. The Twister-based
  coupling follows the owner's setup, not an assertion that every TED system uses
  that device. The general method reference describes another PDMS sorbent; the
  manufacturer reference establishes Twister sorption/desorption, not validation
  of this specific gas-stream coupling. Actual setpoints and recovery need the
  laboratory method.
- The chromatogram is explicitly synthetic in its label, caption, dataset
  description and notes. Its 33 coordinates have arbitrary scales; no real
  retention time, ion channel, named marker assignment, calibration or detection
  limit is fabricated. Identification requires evidence; quantification requires
  suitable calibration and interference/recovery/blank checks.
- Original drawings use coloured schematic populations, not chemical structures,
  measured compositions or manufacturer apparatus drawings. No external image or
  logo was copied.

Consulted sources, retained as canonical Source resources:

- Wiesner, Altmann and Braun (2021), *Determination of Microplastic Mass Content by
  Thermal Extraction Desorption Gas Chromatography–Mass Spectrometry*,
  https://www.chromatographyonline.com/view/microplastic-mass-content-by-thermal-extraction-desorption-gas-chromatography-mass-spectrometry
- GERSTEL, Twister/PDMS sorptive extraction and thermal desorption description,
  https://www.gerstel.com/en/products/sample-preparation/extraction/microextraction
- Mansa and Zou (2021), *Thermogravimetric analysis of microplastics: A mini review*,
  https://doi.org/10.1016/j.envadv.2021.100117

## Renderer fixes demonstrated by the new content

The first real content exposed previously unused classic-deck layout limitations:
the 100vh Reveal canvas began below the controls; a chart's intrinsic height pushed
the footer off-screen; native portrait reused the full window dimensions and
projector typography. The increment fixes these structurally, not with TED scene
IDs: finite flex-allocated deck height and a return-control rail, measured native
presentation dimensions with observer cleanup, bounded chart/footer and portrait
media regions, and native lecture tokens. Scroll-view course behavior is excluded
from the finite-deck rules. Talks opts into the existing lecture readability profile.

An interactive SVG now uses `role="group"` instead of `role="img"`, so its keyboard
node buttons are not hidden by image semantics. Static flow diagrams keep `img`.
This was identified by the automated accessibility check, not a speculative change.

## Files

- `ontology/dataset/talks-ted-knowledge.trig`: concepts, explanations, concise
  KeyPoints, media alternatives and scientific sources.
- `ontology/dataset/talks-ted-diagrams.trig`: process relations and eight states.
- `ontology/dataset/talks-ted-chromatogram.trig`: clearly synthetic coordinates and
  trace annotations; no measured polymer assignment.
- `ontology/dataset/talks-ted-scenes.trig`: six scene compositions, narration and
  additive selection in the existing exact path graph.
- `apps/pitch/public/talks-media/ted-{heating,capture,injection}.svg`: original
  colourful schematic drawings, 800×520 viewBoxes.
- `apps/pitch/src/presentation-profile.ts`: existing lecture readability enabled for Talks.
- `apps/pitch/src/styles.css`: classic-deck viewport allocation and return rail.
- `apps/pitch/src/presentation-main.ts`: native presentation-area measurement and
  ResizeObserver lifecycle.
- `apps/pitch/src/presentation-mobile.css`: native typography and bounded media composition.
- `apps/pitch/src/visual-stage-primitives.css`: finite chart/footer deck composition.
- `packages/renderer-d3/src/flow-diagram.ts`: correct interactive SVG accessibility role.
- `tests/test_talks_ted_introduction.py`: six semantic/content/media/contract tests.
- `apps/pitch/test/ted-introduction-layout.test.ts`: four shared-layout/profile/a11y guards.
- `scripts/smoke_ted_introduction.mjs`: actual deck, all scenes/stages, geometry,
  emphasis, accessibility and static-content checks using externally supplied tools.
- `scripts/smoke_talks.mjs`: removes the obsolete one-slide-only assertion while
  retaining exactly-one-talk/title expectations.
- This handoff: scientific and implementation review record.

## Verification procedure and observed focused results

```text
python -m unittest discover -s tests -p test_talks_ted_introduction.py -v
node --experimental-strip-types --test apps/pitch/test/ted-introduction-layout.test.ts
npm run test:renderer-d3
npm run test:pitch
npm test
npm run build:talks
npm run check:talks-build
```

The six new Python tests, four new Node tests, D3 suite and Pitch suite were
executed successfully during implementation. The development browser matrix
passed 56 scene/view/theme/motion checks (7 scenes × 2 viewports × 2 themes ×
2 reduced-motion preferences), including step-by-step keyboard advancement,
emphasis rendering, no body overflow or clipped media, and no content overlapping
the return control. Supplied axe-core WCAG 2/2.1 A/AA checks passed in those states.

Before opening the draft PR, freeze the implementation and run the full `npm test`
on that exact commit, rebuild the scoped production artifact and rerun the same
browser matrix against the **production static output**, not just Vite. Exact-head
commands, exit codes and final outcome belong in the PR verification record.

Optional browser command, with Playwright/axe-core installed outside the repo:

```text
python -m http.server 4186 --bind 127.0.0.1 --directory dist/talks
node scripts/smoke_ted_introduction.mjs http://127.0.0.1:4186 <playwright/index.mjs> <browser.exe> <screenshots> <axe.min.js>
```

## Remaining review and next content

### FAIR principles and an everyday semantic-description example

Added two scenes after processing, at path positions 14 and 15. The first
explains Findable, Accessible, Interoperable and Reusable with concise cards and
connects these principles to inputs, outputs, parameters, units, software versions
and provenance across tools. Standardized semantics is central to interoperability
and reuse, not a substitute for access, persistence, discovery and licensing.
FAIR does not imply unrestricted public access. The scholarly source is recorded
in TriG (Wilkinson et al., 2016).

The second scene presents the speaker's two English affiliation sentences beside
their TriG representation. Four entities and four relations form an optional
knowledge-graph overlay. UDE remains an alternate name of the same university.
The example's nine RDF statements are authored in a preserved named graph; the
displayed CodeExample and diagram are checked against those assertions. The story
is attributed to the speaker, not claimed as verified institutional metadata.

Added a generic `cd:diagramPresentation` hint with SHACL, projection provenance
and core enum validation. Pitch reuses its explanation-dialog and D3 primitives;
the prose/code/dialog composition is based on block kinds, not scene identity.
The graph mounts only after opening, supports Escape/focus restoration and
reopening, and closes on hash navigation. Static alternatives retain all graph
content. Shared compact-network layout and read-only source styling were adjusted
to keep names and the complete small TriG example readable.

Runtime generation succeeded. Brief dark-theme preview showed both slides and
the four-node overlay without page errors; Escape restored focus and reopening
retained exactly four nodes. A read-only RDF audit matched the nine serialized
statements, graph identity and all four visual relations. Prepared guards now
expect 15 scenes including the title. Full suites remain deferred by the owner.
Light-theme/reduced-motion preview confirmed a fully visible code example without
vertical scrolling, keyboard focus contained in the overlay and closure on hash
navigation. Both overlay themes were visually inspected.
See `docs/talks-fair-semantics.md` for contracts and limitations. No deployment
or merge was performed.

### Stable FIFO transition and static processing overview

The shared regression renderer reserves the FIFO controls row in every stage
when any window uses replay. Inactive controls use visibility:hidden, so they
are neither visible nor keyboard-focusable while retaining identical geometry.
A brief browser check measured exactly equal SVG x/y/width/height in the 15-member
static stage and the FIFO stage (1226.856 by 572.080 CSS pixels at 1440 by 900).

`talks-ted-processing.trig` adds the next path step: Import, Find peaks, Form
components, Select markers and Calibrate. Five shared SVG visual motifs illustrate
the steps. Four new reusable motifs and their SHACL allowed values were added;
there is no slide-specific renderer, CSS or animation state. The shared
space-filling flow layout now reserves label-aware horizontal connector gaps,
preventing connector labels from being covered by adjacent cards.

The knowledge graph retains the author's qPeaks description: scans at multiple
window sizes, log-space asymmetric piecewise quadratic fitting, shared shape and
channel-specific intercepts, and precomputed inverse normal matrices. These
details are not displayed as formulas in the overview. Components are jointly
estimated groups of chromatographic features sharing an elution profile, not
automatically identified substances. GQD is retained as supplied. Seconds-scale
processing is attributed to the author, not presented as a verified benchmark.

Runtime generation succeeded. The brief dark-theme browser preview showed all
five motifs and no page errors; the FIFO geometry check passed. Prepared content
guards were updated for 13 scenes, including the title and a static flow with
no states. Comprehensive tests remain deferred by the owner. No deployment or
merge was performed.

### FIFO replay, heating-axis bound and sample comparison

Supersedes the earlier fixed five-position shift and no-replay implementation.
The heating-rate line chart now authors `cd:yAxisMinimum 20.0`; this uses the
generic chart option, not scene-specific geometry or styling. The compiler/core
reject clipping bounds, and the line renderer preserves the lower bound after
scale rounding.

Stage three of balanced calibration now replays a 15-standard FIFO window,
advancing exactly one position every 750 ms and wrapping from record 44 to 1.
Selected standards, fit and held-out errors update together. All cyclic frames
are validated and share fixed axes. Replay stops when the stage/slide becomes
inactive, when the document is hidden, and on teardown. Pause/resume is available;
reduced-motion users start paused. This is a common RegressionWindow capability,
not a TED-specific timer.

A new final scene first shows Influent/Effluent under local fits, then reveals
their eleven-neighbor-window means (offsets minus five through plus five). It
reuses the ordinary DotPlot and chart/footer composition. Added generic metadata
controls group reveal stages, numeric mean labels and descriptive error whiskers.
Coverage intervals remain unchanged; descriptive bars never show a fraction of
observations inside them or imply a confidence interval.

The supplied sample triplicates and masses are authored in TriG, alongside the
reproducible evaluation recipe and materialized normalized results. Local means
are about 15.69 and 13.65 µg/mg; eleven-window means about 15.31 and 12.93 µg/mg.
The source picks neighboring windows in balanced calibrant order, not proven
chronological sessions. This is an ensemble of simple regressions, not a
multi-predictor fit. The source SE calculations across three replicates and eleven
overlapping means have different sampling units; narrow bars are descriptive,
not evidence of superior precision or more realistic measurement uncertainty.

Runtime generation and a brief browser inspection confirmed the y minimum 20,
one-position FIFO advance with 15 members, pause behavior, slide-exit reset and
the two-to-four result reveal without page errors. Reduced-motion mode was checked
in a fresh browser context: replay begins paused. A read-only shared-core check
matched all materialized values, means and SE bounds within 6e-15, checked FIFO
offsets 1/43/44 for one-step advance and wrap, and found no Unicode U+2014 in the
selected artifact. Light/dark result plots were inspected. Comprehensive suites remain
deferred by the owner. Existing scientific provenance, no-em-dash rule and
workflow/deployment boundaries remain in force.

### Automatic first visual stage and calibration chapter

The owner requested two lasting rules, now recorded in `AGENTS.md`: do not use
Unicode U+2014 in authored presentation text/new prose, and do not enter an empty
diagram. Talks text has been cleaned accordingly without rewriting unrelated
historical collections. Chart and diagram-state hosts automatically start at stage
1 on entry; fragments represent only the remaining stages. Inactive visual hosts
stay at zero until entry so the first animation is not spent off-screen. Backward
navigation never creates a blank initial plot. There are no scene-ID exceptions.
The existing serial workflow therefore appears immediately on the comparison
slide, and heating-study data appear immediately on their slide.

Point-annotation labels in the shared line renderer now measure their text and
choose/clamp their placement within the plot bounds. The marker candidate no
longer collides with the y-axis title. No marker-specific CSS or coordinates were
authored in RDF.

Two calibration scenes append at positions 10 and 11:

- Calibration overhead reuses the **same** optimized schedule with five standards
  and five blanks. The correct derived completion time is **550 min, 9 h 10 min**.
  A preliminary 551-minute statement was corrected during source-model comparison.
  Schedule subsets can retain their original positive positions so reused
  scenarios do not need duplicate resources just to start their positions at 1.
- Balanced running calibration uses a new shared RegressionChart primitive with
  a window-membership strip, paired observations/ordinary least-squares fit and
  leave-one-out inverse-prediction errors. Data and explicit 5/15/shifted-15 windows
  are TriG-authored. The plot is not a slide-specific layout, and has no independent
  looping timer. SceneDocument 1.14 is additive; older documents remain accepted.

All 44 mass/area pairs from the supplied CSV are retained in a balanced display
order, not chronology. Source hashes and row identifiers are recorded without
original measurement file names or dates. The source does not specify physical
peak-area units. The old raw-peak panels, approximate confidence bands and claims
about neighboring-session uncertainty are not adopted. Internal leave-one-out
error is not independent validation and does not establish matrix equivalence,
drift correction or permission to omit blanks. No equations are printed.
The generated transport was compared to the supplied CSV: all 44 paired values
match exactly, the derived ten-run completion is 550 minutes, and the selected
artifact contains no Unicode U+2014 characters.

`docs/regression-charts.md` documents the shared standard and source boundaries.
Focused numerical/contract, content and automatic-entry checks are prepared for
final validation. Runtime generation and a brief preview checked automatic stage
1, marker placement, the new calibration views, advancing/reversing windows and
returning directly to the preceding slide, without browser page errors. Full
suites remain deferred. No merge, deployment or workflow-state changes.

### Throughput chapter and shared timeline standard

The owner requested more vertical slide space, removal of the opening overview,
a cyan glowing progress indicator, a thin grey TIC context and a thick solid EIC.
Deck panels now fill the available canvas. The overview is **not selected** by
the path (its reusable knowledge/scene resources are retained); heating follows
the title directly. Existing later steps were renumbered contiguously.

Three new chart-led scenes follow the marker introduction: measurement-time
bottleneck, nested/optimized schedules, and the heating-rate reproducibility study.
All content, timings, source credit and narration are authored in new TriG files.
The earlier author-supplied workshop HTML remains external and unchanged. No
HTML/CSS/JS chart code or personal filesystem paths were copied into public data.

The shared additive `TimelineChart` standard and SceneDocument 1.13 are documented
in `docs/timeline-charts.md`. It supports ordered scenarios, lanes, categories,
repeated interval templates and labelled runs; the compiler expands authored
timing rules with provenance. The shared D3 renderer compares schedules on one
time axis and reuses the ordinary stage runtime, chart theme, chart/footer
composition and accessible/static alternatives. There is no TED/slide-ID branch
or scene-specific layout/CSS. Core, Reveal and self-study accept the additive
version; prior versions and the separate Chemometrics content remain unchanged.

Scientific evidence boundaries:

- Schedule models end at 630, 423 and 338 min for 3 samples + 3 blanks, matching
  the supplied code. The initial serial/nested comparison changes TGA cleanup
  duration as well as overlap; this caveat is visible in the comparison caption.
- Five heating-study values are approximate digitizations credited by the old
  talk to Rajshree Jeewon's 2026 Master Thesis, Figure 11. The raw thesis/data were
  not available and the HTML does not supply the response unit. This is stated
  visibly; no physical unit is guessed. The line segments are guides, not a fit.
- The selected 15 °C/min rate is the lowest sampled value, not an independently
  validated 14.9 optimum or proof of equivalent recovery/throughput in every matrix.
- Both new Source records include the inspected HTML's SHA-256 and exact section/
  code identifiers, and explicit `cd:supportsResource` links. Scientific credit
  remains visible; no release or publication authorization is inferred.

Runtime generation succeeded. Brief light/dark desktop and narrow-screen previews
checked taller panels, new charts/stages, horizontally scrollable timelines and
absence of browser page errors or body-width overflow. Computed styles confirmed
the cyan progress fill/glow and thin-context/solid-EIC strokes. Extensive suites
were not run. Prepared regression cases cover new path order, source timings, trace
data/credit and rejection of invalid timeline contracts for the final review.
No workflow state, deployment, automatic merge or Chemometrics RDF was changed.

### Visual and chromatogram follow-up

Supersedes the original 33-point single-trace description above:

- Apparatus SVG surfaces and outlines now inherit the presentation's light/dark
  tokens. Coloured product populations retain their original schematic colours.
- Talks disables the upper appearance/summary/graph toolbar and script-view
  button through `showToolbar: false`; the floating theme lamp and Alt+T/Alt+B
  shortcuts remain. Other presentation profiles keep their existing controls.
- Background layers have optional validated `scale` and `offsetYVh` configuration.
  Only the Talks foreground uses 1.12 scale and +14vh displacement. Its source
  image includes a transparent bottom margin (opaque centre ends near pixel 612
  of 682); accounting for that margin avoids revealing the back layer below it.
- The RDF chart contains 81 explicit observations **per series** (162 total),
  with thirteen TIC peaks and three selected-EIC peaks on a shared arbitrary
  signal/time scale. EIC signal never exceeds TIC signal. No ion mass or named
  polymer is invented, and EIC selection does not imply freedom from interference.
- Stages are TIC → selected EIC with grey TIC context → characteristic marker
  candidate → area of **that same EIC peak**. The marker is `ted-e36`; the range
  spans `ted-e33`–`ted-e39`, both zero-signal endpoints surrounding that peak.
- Minimal additive semantic extension: optional boolean `cd:focusSeries` on a
  point annotation, declared and SHACL-constrained in `chart-series-focus.trig`.
  The existing target observation supplies series identity; the compiler projects
  it as optional `focusSeries` with source provenance. Focus-selectable series
  stay hidden until selection; context stays neutral. Ordinary charts without
  this metadata retain their stage sequence. SceneDocument validates the boolean.
  No scene IDs or TED-specific selection logic were added to the renderer.
- Existing content assertions were updated for the new point count, TIC/EIC
  relation and marker/range correspondence, ready for final validation.

Only runtime generation and a brief local visual inspection were performed for
this follow-up, not the full test suites or browser matrix. The local browser
showed white/dark SVG surfaces, no upper toolbar, and all four chart stages with
grey context and a coloured EIC, without page errors. Acceptance and comprehensive
validation remain deferred by the owner's instruction. No deployment or merge.

### Owner steering after the first full-suite run

The owner explicitly deferred comprehensive testing until the talk is complete.
Do not keep running full validation suites during ongoing content authoring.
The first frozen-head production build completed successfully (254 files). The
full npm run at `fe357512428bdd15fde98a094424a51483dcbe06` reached 571 Python tests:
570 passed and one failed because the new Source records lacked the project's
explicit `cd:supportsResource` links. Those provenance links were then authored;
no test expectations were weakened. No subsequent full-suite success is claimed.
Production-browser acceptance, the full-suite rerun and PR acceptance remain
deferred until the owner requests the end-of-talk review. The 56-case development
browser checks described above were completed before this steering instruction.

Owner/scientific review should confirm the actual Twister coupling and laboratory
method before adding numerical instrument parameters or specific marker identities.
Measured chromatograms, SBR-specific markers, heating-rate/throughput comparisons,
calibration evaluation and later processing chapters remain separate follow-ups.
No quantitative performance or matrix independence is claimed. Broader browsers,
assistive hardware and the external exact-head validator remain separate gates.
The inherited dependency advisories from #293 are not resolved by this content task.
