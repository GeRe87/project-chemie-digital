# Level 5: Theoretical Distribution Models

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
