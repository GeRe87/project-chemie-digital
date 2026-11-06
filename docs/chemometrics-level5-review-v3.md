# Level 5: Theoretical Distribution Models

## Local rules-led authoring preview (2026-11-04)

The working branch applies the [authoring rules](teaching-authoring-rules-draft.md)
to the full Level 5 preview. Headlines name the scientific point rather than only
the topic. One explicitly linked question/answer pair connects interval probability
to the model quantile; its fixed 95% example is distinguished from live controls.

The Script switch now opens ten independently authored thematic chapters from
`chemometrics-level5-script.trig`, not 41 per-slide narrations. Its contents menu
provides internal navigation, and return restores the original slide. All 30
original formula units and 43 complete symbol groups remain available. The script
can be printed with the existing PDF control; this is not yet a LaTeX output.
See [ADR-0027](adr/0027-thematic-script-and-teaching-questions.md) for the additive
RDF/compiler/transport boundary and current limitations.

Initial local verification of this first application: 324 focused Core/Reveal/Self-Study
and ribbon tests pass, as do 28 Level 5, five thematic-script and six transport
Python tests. SHACL conforms (complete initial run and focused final extension
checks). Edge verifies both thematic themes, contents navigation, return, mobile
width and complete printed legends. All 18 ribbon stages pass desktop/scroll/
mobile checks; the ordinary deck/scroll layout audit has no clipping or scrolling
surfaces. The slide PDF audit passes all 42 pages in both themes. All optional R
source remains available in the thematic document (the same variance example,
used on two slides, appears once). The live execution controls remain on slides.
The complete `npm test` release gate has not been run for this uncommitted preview.

Live-review refinements add G1 (positive explanations) and G2 (actual mathematical
symbols). Diagram descriptions and experiment Details follow G1 alongside the
headlines and thematic prose. The standard-Normal headings display authored
`$\varphi$` and `$\Phi$` through the shared safe renderer, with contextual math
size matching the heading and retained accessible MathML. The repeated warning
“This is not a universal measurement law or proof from a histogram” is removed.
Following these refinements, 28 Level 5 tests, six thematic-authoring tests and
40 focused mathematical/runtime/rendering tests pass. The 18 ribbons pass again
across desktop/scroll/mobile; the thematic script passes both themes, contents,
return, mobile width and complete printed legends. Actual symbol headings have
been inspected in both themes with matching 48px text/math sizing and MathML.

Further local review adds G3: one illustration with 2–3 concise explanation
cards uses a full-width visual followed by a card row (single cards on narrow
screens). The selector is content-based, with a 420-character per-card budget,
and preserves symbol-legend/formula profiles. Card colors now follow component
identity rather than the `main` layout region. Visual-first DOM order matches
the displayed order without changing the canonical scene or thematic script.
Two current Level 5 slides select this profile. The local
`scripts/check_visual_cards_browser.cjs` passes light/dark at 1642, 1280 and
390px; the 18 ribbon slides also pass their existing desktop/mobile checks.
74 focused composition/fit/teaching-text tests, 28 Level 5 tests and six thematic
tests pass. Full `npm test` remains outstanding for this local preview.

Nested histogram-state captions are now included in the editorial regression
and scientific-content mask. Applying the same updated mask to fetched
`a07792de` and current content yields identical protected payloads and digest
`a7edd1c8ea6fd2f9f0d58204930a5a204f0a243c1b166c89a783616af3ffcd0c`.

Subsequent live-review rules G4–G6 and the concrete calculation check extend this
preview further:

- The nitrate spread calculation has an authored question and visible answer:
  sample SD about 0.155 mg/L, roughly 55% above the independently known reference
  of 0.10 mg/L. Its interpretation explicitly leads to repeated-sampling
  assessment. Table, formula and full legend remain unchanged; the exact new
  answer cue is excluded from the existing scientific-content digest.
- A reusable `worked-calculation` composition keeps table and complete formula
  unit top-aligned, with the authored interpretation below. Narrow screens stack
  intrinsic-height rows. Print retains a two-column table/formula split and the
  complete visible legend.
- Ordinary layered flow nodes use numbered colored headers and a quiet body;
  plain horizontal linear steps share card heights. This is renderer-owned;
  node identities, labels, relationships, accessibility and static fallback stay
  intact. Specialized composite/motif/network chrome is preserved.
- Single-column and two-column experiment surfaces give the flexible remainder
  to the actual SVG plot. The existing resize/viewBox recalculation handles the
  larger plotting area. Controls, legends, readouts and actions retain intrinsic
  height. Print restores intrinsic diagram geometry rather than a screen flex
  remainder; illustration/card profiles reserve a bounded print image region.

Verification: 110 focused composition/flow/experiment tests, 28 Level 5 tests
and six thematic tests pass. All 292 Pitch tests also pass after restricting the
new narrow-screen card rule to screen media. The surface-rule browser check passes at 1580,
1280 and 390px in light/dark; all five affected single/split experiment surfaces
also keep their actions inside the desktop slide. Existing 18-ribbon checks
pass. The final print audit passes all 42 pages in both themes, with complete
legends, no clipped components and no undersized explanatory text.

The full `npm test` command was attempted: JSON validation passed, then the
typecheck stopped because local `tsc` is unavailable. This is an infrastructure
blocker, not a passing full gate. No dependency or infrastructure changes were
made for that failure. The separate full flow semantic check required a longer
timeout and is recorded independently from the focused tests above.

Caption/reference refinement: thematic transport 1.1 now retains occurrence
identity, authored caption and provenance, plus the section's explicit
`dct:references` links. The script has 9 figures, 30 equation units, one reused
nitrate deviation table and 9 listings. All 49 materials have captions and prose
references. Numbering is generated separately by category in script order;
identity-based HTML anchors remain stable when order changes. The shared safe
inline renderer expands explicit markers outside code/math, and script link
navigation moves focus without changing the Reveal hash. Existing 1.0 transport
remains readable. LaTeX output remains a future adapter.

The ordinary layered-flow refinement places number and left-aligned title in
one header, aligns title/body baselines, overrides the pixel theme's square
corners, and reserves measured arrow gutters for transition labels. Specialized
process, motif and network nodes retain their previous appearance and semantics.

Latest checks: 10 thematic Python tests (including focused SHACL, missing caption,
missing relation and foreign-target failures), 28 Level 5 tests, six transport
tests and 102 focused Core/flow/self-study tests pass. Canonical runtime generation
and deterministic `--check` pass. Both-theme browser tests verify 49 captions,
49 resolvable links, all 43 complete symbol groups, focus/hash behavior, mobile
width and printed captions/legends. The surface-rule checks cover both themes at
1580/1280/390px; all 18 ribbon checks pass again. The unrelated full-dataset flow
SHACL run timed out at 300 seconds; it is not passing full validation. The known
missing local `tsc` blocker also remains open. Everything remains local/unpublished.
Final regression rerun also passes all 292 Pitch tests and the 42-page slide PDF
audit in both themes after the flow header/gutter refinement.

## Local LaTeX script PDF

The Script PDF action now opens an actual precompiled LuaLaTeX PDF, separate from
the slide PDF and browser printing. The current pilot has 42 A4 pages (245,168
bytes), selectable text on every page, native references and vector plots.
All 30 equation units, 43 symbol groups, the authored table and nine complete R
listings are exported from the same captioned thematic transport. Published
histogram states retain their bin counts, axis units and sample sizes. Model
parameters retain authored labels/units. Formulas and their legends stay together;
caption starts reserve room for the following diagram/table/listing.

Run `npm run script:level5:pdf` to regenerate and `npm run check:level5:pdf` to
verify the exact source/PDF/TeX binding. Reload the Script view afterward. The
header exposes the generated `.tex` source too. Artifacts under public/script-pdf
are ignored, generated and local; no publication occurred. See
[LaTeX export](latex-script-export.md) for dependencies and the supported scope.

Verification: actual LuaLaTeX compilation and artifact verification pass, with no
missing glyphs, unresolved references or overfull boxes. Browser tests pass in
both themes for exact-content PDF selection and native PDF navigation (zero HTML
print calls), plus disabled behavior for missing/stale/corrupt outputs. All 300
Pitch/LaTeX tests, ten thematic semantic tests and six transport tests pass; the
existing HTML script browser regression retains all 49 captions/references and
43 complete legends. `npm test` was attempted again: JSON checks pass, then the
known missing local `tsc` executable blocks the full gate. This is not full release
validation or an accessibility certification of the PDF.

## G7 applied locally: captions versus independent argument

Level 5 now separates descriptions of the actual figure from the independent
explanatory argument in slides and the thematic script. All nine Script figure
occurrences have authored, self-contained captions, including the concrete
reference conditions. The HTML and LaTeX projections use those captions directly;
LaTeX no longer manufactures caption sentences from marker labels. All 49 material
captions and references and all 43 complete symbol groups remain present.

The live chart descriptions explain how to read the selected visual state and
are visible in a figure caption, rather than hidden in Details. Statements about
the general construction or interpretation remain in the explanatory text/cards.
The nine SVG illustrations now have authored `dct:description` captions, projected
as optional renderer-neutral `MediaReferenceBlock.caption` with graph provenance;
their independent accessible alternatives are retained. Static HTML preserves
these captions too. More specific Q-Q and residual descriptions moved to their
figures; their cards explain the general assessment and scaling principles.

Interactive slides retain their parameter controls. Script figures remain at the
reference states described by their authored captions; their parameter inputs are
disabled and exploration controls hidden. The Student reference caption was
checked against the actual defaults: samples of 4 and 30, hence 3 and 29 degrees
of freedom. Controls, plots, captions and legends remain separate readable parts;
the flexible plot area and generic captioned-media layout reserve space for captions.
Printed panoramic figures reserve room for their complete symbol legends.

Verification: 579 Pitch/renderer tests, 12 thematic semantic tests, 20 Level 5
scientific tests and five cleanup tests pass. Edge checks all 41 scenes and all
adjustable parameters at three viewport/theme configurations, including visible
media captions and fixed Script reference figures. HTML Script checks pass in
both themes; both 42-page slide-PDF audits pass without clipping or page-width
failures. LuaLaTeX regeneration and exact-artifact checking pass.
The full `npm test` gate still stops at the missing local `tsc` executable.

The scientific-content mask now also treats media captions/their added description
provenance and the R function glossary as editorial prose. Applying that identical
mask to `a07792de` and current sources gives equal protected content and digest
`75e68ccb91926d41197c244e5b06ea1d49418621cbbc50ef9fdf0ed6865bcbf8`.
Formula expressions, observations, model defaults/bounds, units, symbol identities,
R code and scene order remain protected. All changes and artifacts remain local;
no commit, push or publication was performed.

## Script visual-coverage correction

The earlier 49-material script had only nine figures. Formula and caption
validation did not detect visual dependencies omitted at the authored selection
layer: for example, A/B/C variance markers referred to illustrative series whose
dot plot was absent, and the Q-Q/KS argument had no corresponding plots.

The thematic source now selects 23 additional illustrations, giving **32 figures,
30 complete equation units, one table and nine R listings** (72 captioned,
explicitly referenced materials). Additions cover the measurement/preparation
paths, density/sample and ECDF comparisons, Normal spread and band comparisons,
lognormal sample/scales/tasks, A/B/C observations, sample-size comparison,
residual/chi-square precision views, Student/F constructions and observed groups,
and Q-Q/KS/count assessments. Three redundant live Normal views intentionally stay
slide-only; their content is covered by the complete formulas and other selected
plots. A new exact visual-coverage test records those three exclusions and rejects
any other newly missing visual dependency.

Shared Core reading-flow resolution puts each chapter's material after its first
explicit local paragraph reference; materials introduced together retain authored
relative order. HTML and LaTeX numbering follow the same resolved flow. A reference
to another chapter does not relocate its target. Script 1.0 keeps its legacy order.
The result is a connected thematic argument with nearby illustrations, not prose
followed by a separate material catalogue or a projection of the slide sequence.

The LaTeX exporter now renders categorical dot observations and linear flows
natively, and embeds the nine authored SVGs as vector PDFs. Their bytes are hashed
in the generated thematic transport and checked by build and browser availability
validation. Offline Chromium/Edge is a build-time SVG converter only; LuaLaTeX
still typesets the whole document. Active/external SVG content is rejected. The
downloadable source ZIP includes `script.tex` and all nine converted figure assets.
The export-format contract advances to `latex-script-1.1`.

HTML now renders media as actual images and the selected ordinary line chart as
a chart rather than only a data table. Supplementary numerical tables remain
accessible in Details. Both process diagrams preserve their node descriptions.
The independent Self-Study static fallback was regenerated; its section-label
regression accepts authored inline mathematics as well as escaped plain text.

Verification: 742 Core/Pitch/renderer tests, 29 Self-Study app tests, 13 thematic
semantic tests, cleanup invariance and six transport tests pass. Browser checks
retain all 72 captions/references and 43 complete symbol groups in both themes,
verify all nine media images load and every selected chart has an SVG projection,
and pass the 41-scene/parameter slide regression at three viewport/theme settings.
The current LuaLaTeX PDF has 59 pages, selectable text on every page and no
unresolved references. The nine source figure PDFs contain no raster images; all
ten files in the source ZIP were verified against their published counterparts.
Missing, stale, corrupt and changed-SVG cases disable the PDF action. Full
`npm test` remains blocked at the known missing local `tsc` executable. The changes
remain local, uncommitted and unpublished.

## Figure-specific numerical findings belong to captions

G7 now explicitly includes figure-specific counts, calculated probabilities and
empirical/theoretical summaries. The sixteen experiment illustrations no longer
emit a free-standing readout catalogue, repeated model-parameter paragraph or
automatic model note in the PDF. Relevant findings are authored as connected
caption prose. In particular, the sample-size comparison states the 1,000 series
per group and the relative-SD comparison (63.25% versus 26.26%, with empirical
61.79% for six-result series) in its caption.

Full-precision readouts, parameters, model notes and markers remain recoverable
in JSON comments in the generated TeX/source ZIP and in HTML Details. A regression
test compares those preserved values with every Core experiment result and checks
the authored variance percentages against the fixed reference calculation. The
Script HTML hides duplicate result grids. Live slide readouts are now structurally
inside the same figcaption as the authored explanation. Marker values no longer
float beneath PDF plots: dashed guides and the corresponding legend entries show
their relation to the graphic. Saved histogram-state captions have caption styling.

The resulting LaTeX PDF has 52 pages, with no unresolved references or free-standing
model/readout lists. The sample-size and sampling-distribution pages were inspected.
All 743 Core/Pitch/renderer tests and thirteen thematic semantic tests pass. Edge
checks retain 72 captions/references and 43 complete symbol groups in both themes;
the 41-scene/parameter regression passes at all three viewport/theme settings.
Full `npm test` remains subject to the previously recorded missing `tsc` blocker.

Local views (no publication):

- [Slides](http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-complete&view=scroll&appearance-controls=hidden)
- [Thematic script](http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-complete&view=scroll&appearance-controls=hidden&mode=script)

The following source-cleanup and publication notes describe the earlier accepted
baseline; the extra thematic-script source is an intentional addition to its
four-file content structure.

The course contains **41 authored scenes plus its title**, in Region 3.
The source cleanup preserved the exact selected scene documents. Subsequent
owner-requested copy editing changes explanatory text while preserving scene
order, mathematics, complete symbol coverage, datasets, numerical defaults and
optional R source.

## Source cleanup

The owner's cleanup request supersedes the earlier decision to retain unselected
drafts in the shipped Dataset. Retired drafts, their dedicated tests, review notes,
preview commands and unused illustrations are removed; their history remains in Git.
Generic numerical algorithms, renderer contracts and tests remain reusable.

Level 5 is authored in four TriG files, not generated JSON:

- `chemometrics-level5-knowledge.trig`: models, expressions, symbols and sources;
- `chemometrics-level5-data.trig`: the required observations and model parameters;
- `chemometrics-level5-scenes.trig`: the selected scene definitions and items;
- `chemometrics-level5-review-complete.trig`: the sole selected learning path.

Original resource IRIs and named-graph identities are preserved. Reachability was
computed from the selected path and all resources outside the Level 5 draft files.
Historical `dct:references` links to retired scene/path drafts were excluded from
the retained graph. A detached before/after comparison verified identical compiled
Level 5 content and unchanged other compilable learning paths before any deletion.
Level 5 shrank from 31,610 to 5,629 RDF statements (about 82% fewer).

## Shared presentation surfaces

`apps/pitch/src/teaching-surfaces.css` owns one common content panel, an unboxed
nested-content variant and the shared workspace treatment. Composition styles
retain only their geometry, sizing and overflow responsibilities. They no longer
invent different card gradients, shadows or frame widths for each layout.
Standard cards use a shared coloured header with decorative two-digit numbering
and a lightly tinted content area. This owner-requested refinement supersedes the
cleanup's initial removal of decorative counters. Card headings use the common
bold typeface; body text uses normal weight, with authored emphasis retained.
Numbers follow the renderer's existing entry order without changing RDF content
or authored heading text. Symbol legends and nested formula explanations remain
unnumbered; colour is not required to understand the card sequence.

Layout selection remains structural and identity-independent. Cards, a chart with
interpretation, a formula with illustration and a code/output workspace may require
different arrangements, but reuse the same surface system. Broad illustrations
still stack above equations according to intrinsic image geometry. No Level 5 or
scene-ID selector is introduced.

The native Symbols control, complete static/script/PDF legends, independently
scrollable code/output panes, keyboard handling and light/dark graphics remain.
For paper, a table and its formula/complete legend use one reusable two-column
arrangement. This fixes the earlier descriptive-spread page-width warning without
a scene-specific selector or changing scientific content.

### Readable interactive layouts

`teaching-layouts.css` provides a common slide inset, balanced visual/formula
columns and responsive card matrix. Lecture headings use a restrained size to
leave space for readable body content rather than dominating the slide.

Scientific distribution widgets inherit the shared 22px logical type floor and
44px controls. At most two parameters are immediately visible; additional
parameters and simulation settings remain editable under **Settings**. **Details**
contains the authored model description and all numerical results. Both controls
work with the keyboard; Escape closes the overlay and returns focus to its summary.
Closed disclosures do not reserve space for their contents.

Plot coordinates follow the measured content cell, not a fixed 960px canvas.
Axes wrap full titles; plots stack in narrow cells. Markers retain their lines,
accessible titles and complete values in Details, without duplicate labels above
the plots. Resize redraws cached results without re-running the experiment.
These are intentional changes to interactive information visibility, not a claim
that the rendered text is unchanged. Scientific data, calculations, authored
scenes and the complete static/script fallback remain unchanged.

Scroll-view regression coverage also checks non-collapsed chart SVGs, aligned
side-by-side panel tops and formula-panel insets. Auto-height evidence charts use
their intrinsic SVG ratio instead of a zero-height flex remainder. Region gaps
own external spacing, and formula panels use the shared interior padding.

### Diagram/formula ribbon

Chart/flow-plus-formula stages now use two presentation tabs, **Diagram** and
**Formula & symbols**, instead of squeezing both into adjacent half-width cells.
The signature is structural: a chart or flow diagram in the primary region and a complete
formula/legend unit in the secondary region of a visual/formula composition.
Ordinary illustrations and panoramic media keep their existing layouts.

Click a ribbon tab, use Left/Right or Home/End while the ribbon is focused, or
use **Alt+Down / Alt+Up** to change the current slide's view. Editing controls
retain their native keys. Tabs use linked ARIA tab/panel roles, visible focus
and a single tab stop. They reuse the original DOM and preserve experiment
values, results and the slide identity. The stage does not expand when switching;
long opened legends remain readable inside the bounded panel.

There are no tabs in the PDF export or script projection: both semantic regions
and complete authored legends remain included. Native printing also exposes
both regions. The renderer-neutral scene model and authored TriG are unchanged.

The ribbon browser regression exercises all 18 matching Level 5 stages in Edge
and Firefox across deck, scroll, smaller desktop and mobile viewports. It checks
click/keyboard selection, fixed stage height with opened legends, retained edited
parameters, unchanged slide identity, native input keys, complete native-print
panels and idempotent teardown with restoration of existing DOM attributes.

On desktop, single-column chart/image stages and active ribbon panels fill the
remaining slide height. Controls and readouts keep their natural size; plots
receive the remaining space and redraw against the measured canvas height.
Paired plots reserve equal legend heights to preserve aligned axes. Images keep
their aspect ratio. Mobile, script and print remain content-driven.

## Preview and verification

### Reader-facing copy edit

All 41 authored narrations now explain the content directly rather than giving
presenter instructions. The revision removes old scene-number prefixes, references
to retired extended paths and repeated warnings. Essential conditions remain at
the relevant explanation: assumed simulation models, independent Normal sampling,
known versus estimated reference quantities and matching goodness-of-fit calibration.
Narration length falls from 2,380 to 1,791 words (about 25%); the longest section
is 74 words. Ordinary slide cards and the process/simulation text boxes are also
shorter. Formula expressions and executable examples remain unchanged.

All 43 symbol groups now use the same definitions-list style: a symbol, its brief
meaning and its unit. Necessary assumptions and conventions follow separately.
The authored `cd:body` uses explicit `- **symbol**: meaning` Markdown rows. A shared,
safe display helper renders these as paired `dt`/`dd` elements in Pitch,
the script and static self-study. It never guesses definitions from legacy prose.
The full authored definition replaces duplicate brief/full presentations. Explicit
`$...$` or `\(...\)` delimiters render inline mathematics in labels, meanings and
conventions through the same KaTeX HTML/MathML helper. Code stays literal and raw
HTML is escaped. Subscripts are authored in math mode, never inferred from prose.
Mathematical labels retain violet colouring in both themes; meanings stay neutral.

The original complete-document digest applies to the source-cleanup snapshot.
The copy-edit guard permits narration, explanatory prose, ordinary card bodies
and symbol-definition wording to differ. Its pre-edit scientific/structural digest is
`750c192cea55047603ac4d67c66dd475542d5fcc39fc77d3b02ecadadff2b2fd`.
Formula expressions, symbol notation and identities, chart descriptions, observations, units,
parameter bounds/defaults, R code, identities and ordering remain exact. The only
permitted R-flag changes enable execution for the existing KS and Pearson short
examples; their code and read-only editing flags remain unchanged.
Separate tests require definitions for all 43 groups, retain key assumptions,
reject presenter residue and bound narration length. Paper uses compact definition
rows rather than shrinking text to make the full legends fit.

All ten optional R examples now expose Run/Reset controls and an output area.
The browser regression checks every example, including those previously marked
non-executable. Its execution mode verifies an inline plot and runs the original
KS/Pearson calculations: `0.563275…`, `9.487729…` and `0.020587…`.

Run `npm run preview:level5:generate`, then open
`http://127.0.0.1:5173/authoring.html?preview=authoring-level5-review-complete`.
Run `npm run pitch:intro` for the full course overworld.

Authoritative regression gate: `npm test`. Browser, PDF and deterministic content
checks supplement rather than replace it. Cleanup validation evidence is recorded
in the follow-up pull request; a pending test run is not a successful gate.

Local cleanup checks so far: unchanged 41-scene compiled content; 16 retained
scientific tests plus four cleanup tests; Pitch and 29 Self-Study app tests;
Edge deck/scroll audits without clipping or scrolling content; R workspace checks;
and all 42 PDF pages in both themes without errors or page-width warnings.

Layout follow-up checks: 268 Pitch tests, 131 Reveal tests, 28 self-study renderer
tests, 28 Level 5 Python tests and 101 D3 renderer tests pass; Edge and
Firefox exercise every adjustable experiment parameter in three viewport/theme
configurations, including disclosure keyboard controls and resize invariance.
The Edge deck/scroll audit reports no clipping or scrolling content; real R
execution/inline plots and all 42 PDF pages in both themes pass. No new network
service or learner-data storage is introduced.

The inline-math follow-up rechecks all 42 PDF pages in both themes with no errors,
collapsed graphics or miniature pages (minimum fit scale `0.7301619639401039`).
Dense formula-overview cards reclaim paper-only padding, not smaller legend text.
The browser also verifies KaTeX labels and violet descendant colours in light and
dark presentations; no KaTeX errors occur anywhere in the complete lecture.

The isolated cleanup `npm test` on `0892a68a` is **not green**: 578 of 579 Python
tests pass, but `test_placements_use_their_own_relation_not_annotation_targeting`
still expects 494 placements rather than the retained 474. Later npm phases did
not run. The focused checks above do not replace that unresolved full-suite gate;
neither cleanup nor layout work should be accepted on that evidence alone.

Owner-authorized publication preflight updates that obsolete placement count to
474, reflecting removal of the twenty draft-only placements. The relation/domain
assertions remain unchanged. A fresh complete `npm test` on the committed result
is required before merging into `chemometrics` and rebuilding the full Overworld
site for the existing `gh-pages` domain; `main` is not a publication target.

The first complete follow-up run reaches Self-Study after all earlier phases pass,
but its two app-level static-content assertions still expect the replaced symbol
group heading and brief prose. Those assertions now require the complete shared
authored `dl`/`dt`/`dd` output for definition-row legends, retaining the original
term/description coverage for ordinary and legacy entries. This changes test
expectations only; full validation must be repeated on the new committed head.
