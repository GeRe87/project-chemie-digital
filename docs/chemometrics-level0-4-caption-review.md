# Levels 0–4: first caption/text review

Local, uncommitted and unpublished authoring review. This is an editorial
increment, not final acceptance of every slide or PDF layout.

## Inventory and decisions

| Level | Scenes | Existing Script prose | Changes in this increment |
| --- | ---: | --- | --- |
| 0 | 7 | none | Nitrate finding and SDs in the chart caption; remove the selected duplicate finding, retain the independent argument about level and variation. |
| 1 | 12 | none | Caption both scientific images; separate the variable/design explanations from the concrete standards and sampling illustration. |
| 2 | 35 | none | Caption all twelve image occurrences, including images nested in exercises. Retain questions, inputs and worked calculations as independently meaningful content. |
| 3 | 48 | scene-wise narration | Separate selected same-mean, residual, Monte Carlo, reference-shift and extreme-value descriptions from independent explanations; caption the precision sketch. |
| 4 | 65 | scene-wise narration | Separate selected opening, spread, boxplot and histogram descriptions from the argument; remove two detached descriptive cards from each of twelve boxplot/histogram scenes. |

Captions use authored prose, not automatically concatenated numerical readouts.
Original resource identities and scientific resources remain; detached card
resources are no longer selected in the reviewed active scenes. The active path's
resource selections follow those scene selections. Exercise inputs are not moved
merely because they contain numbers.

The IQR-limits narration incorrectly described paired river tails although its
figure shows two recovery groups with equal IQR and shifted medians. The narration
now explains width versus reference-relative location. Neither observation set
nor the IQR calculation changed.

## Shared rendering

- Direct, `cd:hasMedia` and exercise `dct:hasPart` media preserve authored
  `dct:description` captions and their named-graph provenance, separately from alt text.
- Existing narrative Script rendering can project ordinary bar/line charts as
  graphics while retaining their captions and complete numerical tables in Details.
  This option propagates into nested groups. Ordinary static self-study tables
  remain unchanged.
- Flow rendering already owns its figure/caption DOM. Composition and eco-city
  CSS must not hide that authored caption; no caption is inserted into a mount
  host that the D3 runtime subsequently replaces.
- Level 0–2 Script buttons remain disabled: no continuous prose or thematic
  scripts were invented. Level 3–4 remain scene-wise Script views. This increment
  does not create new thematic LaTeX scripts or PDF exports for those levels.

## Evidence

- 743 Core, Pitch and renderer tests pass.
- All 64 `test_level4_*.py` tests pass, including targeted SHACL, original
  observations, formulas, symbol legends, quantile conventions and chart counts.
- Seven variance-uncertainty tests, two media-caption tests and 29 self-study app
  tests pass. The caption tests cover linked-media provenance and both nested
  journey-image occurrences through the real compiler.
- A comparison against the externally saved pre-edit runtime preserves all 353
  chart/table/math/code/prompt/definition-list/media/diagram blocks in Levels 0–4,
  excluding only chart/diagram labels/descriptions, media captions and their added
  caption provenance. No protected block is added, removed or changed. Prose,
  narration and scene selection are deliberately editorial, not covered by that mask.
- Edge checks traverse all 167 slides in light and dark themes, load the images,
  verify media and flow captions, and check the two available Script views. All 54
  selected Script charts mount as graphics; captions remain visible, there are no
  KaTeX errors, and the Script panes fit a 390-pixel viewport.
- Slide-PDF audits pass for Level 0 (7 pages) and Level 1 (12 pages), both themes.
  Level 2 has six flagged pages, Level 3 thirteen, and Level 4 seven (66 PDF pages
  including its title). The identical failure sets also occur with the saved
  pre-edit runtime projected through the current renderer. No new flagged page
  appears in that content-baseline comparison. This is **not** a passing PDF gate.
- `npm test` still stops after JSON checks because local `tsc` is unavailable.
  A broad `test_chemometrics_*.py` run timed out at 240 seconds; a narrower follow-up
  timed out at 180 seconds. Neither is reported as passing.

## Remaining review work

This first increment does not certify complete G7 compliance of every original
card. In particular, finish the mixed-text review of the Level 3 slide lists and
Level 4 analytical-case, ECDF and moment-matrix narration/cards. Keep hand-worked
calculations distinct from mere descriptions of a rendered figure.

Resolve the recorded PDF readability failures without hiding formulas, legends,
code or scientific content. The worst Level 3 formula and Level 4 R-lab pages need
layout work rather than further automatic shrinking. Obtain full test-gate and
complete static-course build evidence before claiming final acceptance.

## Local previews

Use `authoring-level0-caption-review` through `authoring-level4-caption-review`
as the `preview` query parameter, for example:

<http://127.0.0.1:5173/authoring.html?preview=authoring-level4-caption-review&view=scroll&appearance-controls=hidden>

The generated preview transports and PDF/browser reports are disposable local
artifacts. `scripts/check_level0_4_caption_browser.cjs OUTPUT_DIR` checks all five
previews with Edge; set `PLAYWRIGHT_MODULE` to the local Playwright installation.

## Screenshot-based Level 4 alignment correction

The previous browser checks did not establish visible vertical alignment. A
follow-up captured every Level 4 slide and reviewed the contact sheets, with
full-resolution inspections of the application, ECDF and moment-formula slides.
The application columns had equal-height grid cells but independently centred
children; formula explanations had another explicit centring rule. Checking the
container bounds alone therefore missed the actual offset.

`teaching-primitives.css` now top-aligns the scenario text/visual children, the
formula-deck units and the explanatory column beside a single formula. No scene
identity, scientific content, formula or symbol legend was changed. Captions
remain attached to their figures. Whitespace below shorter content is intentional;
it must not cause the shorter column to float vertically beside its peer.

`scripts/check_level4_visual_alignment_browser.cjs OUTPUT_DIR [theme] [width]`
captures all 65 slides, full-size PNGs, six contact sheets and geometry evidence.
It checks the first actual content surfaces of side-by-side regions, not merely
their equal-height parent containers. The corrected deck passes at 1560 px/light
and 1280 px/dark with no alignment failures or browser errors. All six light
contact sheets and selected full-resolution/dark views were visually inspected.
The 430 Pitch/Reveal tests pass. This screen correction does not certify the
separately recorded PDF readability issues as resolved.

## Autonomous screenshot/layout review: Levels 0–3

Follow-up completed locally on 2026-11-05, without intermediate questions,
commits or publication. This pass changes shared rendering/layout, tests and the
visual audit, not scientific RDF, observations, formulas, simulations or R code.

All 102 slides (7 + 12 + 35 + 48) were captured in light at 1560 px and dark at
1280 px. All contact sheets were visually reviewed, with full-resolution checks
of the problematic comparisons, legends and printed precision example. Progressive
slides retain initial-state screenshots as well; the main screenshots advance
through real keyboard navigation to the complete state. Images finish loading
before capture. Native symbol disclosures are opened for the review; long ones
also have end-of-legend screenshots rather than being mistaken for missing text.

### Corrections

- Definition decks and standalone formula/legend collections start at a common
  content edge. Sparse two-card decks no longer accidentally allocate a large
  empty prelude row or vertically centre each card's contents independently.
- Captioned images in evidence rails reserve their own image height. The caption
  no longer compresses calibration flasks or the lake map to almost zero height.
- Flow figures budget space for both the SVG and its visible caption. Their SVGs
  no longer take 100% of a region *plus* an additional caption outside that region.
- Two/three complete formula units use a responsive comparison matrix instead of
  a forced tall stack that hides subsequent calculations. This restores both
  arithmetic/geometric comparisons, harmonic speed/time and odd/even median
  calculations without deleting any example or symbol explanation.
- Legacy symbol disclosures use compact glossary geometry rather than large
  presentation-card spacing. Equations and disclosure controls stay visible;
  exceptionally long legends scroll inside the existing interactive disclosure,
  not inside an entire collection that could hide the next formula. Every authored
  entry remains available on the same slide. Printed legends are fully expanded.
- Mathematical derivations use the available height with bounded work regions
  and reduced empty equation spacing rather than overflowing their parent.
- Paper preserves the scenario/table/visual grid after Reveal's block reset.
  Printed legend lists retain their grid instead of being forced to a vertical
  block stack; function glossaries lose repeated card-title padding, not entries.
  Printed table cells retain separation. Dense overview cards reclaim inter-card
  spacing without reducing symbol typography or omitting definitions.

### Current evidence and acceptance boundary

- The enhanced visual audit checks actual peer content edges, top alignment in
  definition decks and formula/legend stages, loaded images and region/formula/media
  overflow. All 102 slides pass in both reviewed viewport/theme combinations.
- All Level 0–3 slide-PDF audits now pass in both themes: 7, 12, 35 and 48 pages
  respectively. This supersedes the earlier Level 2/3 PDF failure counts above.
  The smallest audited scale is 0.7441 for Level 2 and 0.7574 for Level 3; the
  audit retains its original 70%-page-width, minimum-text-size, complete-graphic,
  page-boundary and formula-collision checks. No threshold was relaxed.
- All 743 Core/Pitch/renderer tests pass. The old CSS assertion requiring stacked
  comparisons now checks responsive complete units; the browser audit separately
  checks that no collection is clipped.
- Regression checks pass for Level 4's 65-slide screenshot audit and all Level 5
  scenes/experiment parameters at three viewport/theme configurations. Level 5's
  42-page slide-PDF audits pass in both themes. The shared caption/Script browser
  regression across Levels 0–4 also passes.
- Full `npm test` is not certified by these focused checks; its previously recorded
  unavailable local `tsc` remains an infrastructure limitation. This pass does not
  claim a production build, pedagogical acceptance or completion of the separate
  mixed-text authoring work listed earlier. Human final visual acceptance remains
  outstanding, as requested.

The existing audit entry point now accepts an optional level:
`check_level4_visual_alignment_browser.cjs OUTPUT_DIR [theme] [width] [level=4] --legends`.
It retains its original Level 4 default. Final local screenshot/report directories
are `level0-alignment-after` through `level3-alignment-after`, plus the corresponding
`levelN-alignment-dark`, under the approved OpenCode temporary directory. PDF reports
are under `levelN-alignment-pdf`; Level 3's final rerun is `level3-alignment-pdf-final`.
