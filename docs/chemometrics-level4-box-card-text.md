# Boxplot cards: structured teaching text

Local follow-up covering the eight active Boxplot explanation slides:
construction, applications, run-order limits, extreme observations, symmetric,
skewed, bimodal and uniform examples. The R lab is already standardized and is
not changed again.

## Authoring standard

- Use short normal-weight context, selective **bold** labels and genuine list
  items rather than bullet glyphs embedded in a paragraph.
- Separate **what is observed** (median, quartiles, whiskers, raw points) from
  **what may be inferred**. Preserve all numerical values and qualifications.
- Use one short highlight per slide, such as “Not a normality test” or “Same
  boxplot, different run order”, rather than highlighting the whole explanation.
- Keep the existing coloured cards, chart composition, source identities and
  reading order. Colour supplements the written labels; it is not sole meaning.

All teaching text remains authored in canonical TriG. Prose cards explicitly
declare Markdown. Definition cards containing explicit paragraph/list structure
reuse the same safe `teachingTextMarkup` subset. The existing line-wise renderer
remains in place for legacy points, symbol legends and function glossaries.
Only intrinsic paragraph/list spacing is added to the rich definition cards.

## Verification

`apps/pitch/test/level4-box-card-text.test.ts` checks the eight authored scenes
and their actual shared projection: paragraphs, real lists, selective strong
text and one highlight. Existing teaching-text, teaching-primitives, projection,
R-lab, order-statistics and histogram tests cover adjacent contracts.

`scripts/check_level4_box_cards.cjs` checks all eight slides in Light/Dark and
1600×1000/1600×900, including normal/bold computed weights, visible card bounds,
no clipped contents and 32 review screenshots. The pre-edit baseline also
checks all 65 scene identities/order, identical scientific chart/table/formula/
code blocks and unchanged narration, plus all other 57 scenes unchanged.

Artifacts: `C:/Users/PCUser/AppData/Local/Temp/opencode/level4-box-card-review/`.
No lecture restructuring, commit, PR, external overall validation, merge or
deployment is included. Existing Desktop PDFs are not overwritten.

Recorded checks: 23 selected Node tests and all 21 bounded Python
order-statistics/histogram checks passed. `git diff --check` passed for the
changed tracked sources. Construction and coloured symmetry cards were also
visually inspected in the browser captures.
The full browser check passed all 32 theme/viewport/slide combinations, with
no card overflow or viewport clipping. The dark 16:9 uniform example was also
visually inspected; the baseline protection checks passed.
