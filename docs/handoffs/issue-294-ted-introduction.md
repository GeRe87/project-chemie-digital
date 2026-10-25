# Issue #294 — visual TED-GC-MS introduction

## Scope and branch basis

Owner-requested Talks follow-up on platform commit
`380025955862812407178199e1b8fddd0178965e` (draft PR #293).
Branch: `agent/294-ted-gc-ms-introduction`. Review target: `talks`; #293 remains
an explicit dependency until integrated. No System/Chemometrics dispatcher state,
other worktree, existing lecture RDF, hosting settings, workflows or releases are
changed. No automatic merge or deployment is authorized by this handoff.

## Authored presentation

The existing title is preserved, followed by six English content scenes:

1. **TED-GC-MS: the sample journey** — five authored diagram states follow heating,
   capture, desorption/focusing/injection, GC separation and MS detection.
2. **Thermal decomposition** — an original vector illustration of heating a
   crucible, evolving smaller products and leaving residue; three concise bullets.
3. **Sorption and transfer** — gas-stream capture on the requested PDMS Twister
   configuration and physical transfer of the loaded sorbent, not liquid SBSE.
4. **Cryofocusing and injection** — three-part illustration separates thermal
   desorption, cold focusing and rapid release into the GC.
5. **GC separation → MS detection** — three authored diagram states distinguish
   compounds separating in the GC from ions forming in the MS and time-resolved
   signal acquisition.
6. **Markers → polymer mass** — a synthetic line chart with two point annotations
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
