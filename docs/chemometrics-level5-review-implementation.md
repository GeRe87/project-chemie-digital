# Independent review: implementation status

Source: `Review_Chemometrie_Verteilungen_2026-11-02.md`, reviewed 2 November
2026, sections B–E. The report's page numbers refer to the original **112-page**
PDF. They are not scene IDs or future slide numbers.

**This is an incremental revision, not a completed 66-slide lecture.** The local
default still contains 111 authored scenes plus the title. No content is deleted,
committed, pushed or published. No deployment is authorized.

The next increment now provides [a compact N01–N09 pilot](chemometrics-level5-compact-pilot-review.md):
six opening slides, then the IC vignette, four normal-simulation prefix states and
the exact four-sign experiment. The 66-slide selection remains incomplete; the
111-scene default is unchanged.

## Implemented in this increment

### R-01 / R-54: repair the generic export mechanism

Reproduced the miniaturized pages in the old PDF and inspected corresponding live
scenes. Two independent defects were found:

1. The fitter measured internal KaTeX radical SVG paths and visually clipped
   MathML as if they occupied the slide. Nominal widths far larger than the visible
   expression reduced some slides to about 7–11% scale. Measure rendered formula
   containers and outer graphics, not those internal representations. Keep the
   accessible MathML; do not delete it.
2. Reveal's print stylesheet changed grid compositions to block flow. Additionally,
   width-only responsive rules were applied by the native PDF print viewport,
   although the desktop print preview did not show that rearrangement. Some chart
   bodies/captions disappeared in the saved PDF. Preserve the renderer's original
   grid/flex display, use the fixed desktop canvas, and make composition breakpoints
   screen-only. Refit when native print media activates.

Reveal also retains `hidden` attributes on offscreen sections that its print styles
explicitly display. The fitter now uses computed visibility instead of treating
that attribute as proof that the printed content is absent.

The fix contains no scene-ID-specific geometry. Formula legends remain visible.
This closes the reproduced miniaturization/layout-loss defects, **not** all of
R-54: systematic axis/font legibility, long-code accessibility and target-deck QA
remain open. A minimum occupied width is not evidence of teaching readability.

### R-04: announce the full route

The title now covers analytical measurements, distributions, decisions and
uncertainty. The opening route explicitly includes the lognormal branch, precision,
CRM means, devices/calibration, model checks and dilution Monte Carlo. It explicitly
states that the complete package is not one 90-minute session. The existing paths
reuse this opening; the 111-scene selection itself is unchanged.

### R-51: render the saved result summary correctly

The Monte Carlo summary now declares its existing Markdown format through
`cd:bodyFormat`. The default mean, SD, interval, seed and physical input assumptions
are unchanged. The output-interval versus confidence-interval warning is retained.

### Section E: numerical reference coverage

Seven standard-library-only tests independently check normal density/CDF/tail and
quantile, lognormal mean/tail/quantile, chi-square-five survival, Student t and CI,
two-sided F and squared-t linkage, Pearson contributions and tail, and the named
seed's Monte Carlo mean/SD. These complement the existing RDF and saved-bin replay
tests. They do not imply that the new R workbenches have been executed.

## Verification and reproducible local QA

- Preview generation: 111 scenes.
- Six focused PDF adapter tests and the production build pass. Earlier pitch
  test runs passed, but the latest two `npm run test:pitch` attempts exceeded
  120/180-second limits without a final summary. They are not passing evidence.
- Seven independent section-E numerical tests pass.
- Existing focused IC and t/F content tests pass; the t/F test suite additionally
  checks the complete roadmap and explicit Markdown result format.
- Edge and Firefox: all 112 print pages in light and dark; no page errors,
  miniaturization below 25% page width, headings below 18 effective CSS px, or
  measured heading/formula/legend/table/caption boundaries outside the page.
  The measured minimum scale after restoring the composition is about **72.6%**.
- Actual Edge PDF: 112 landscape pages. A saved-PDF text check compares visible
  prose/legend/caption excerpts with every page, rather than checking only titles
  or empty pages. Actual raster inspection includes all nine reported miniature
  pages and the final Monte Carlo graphic. A scrolling composition region also
  needed print-only visible overflow so that the last term of a long formula was
  not cropped; formula base-container bounds are now part of the automated check.
  Text extraction does not validate formula glyphs.
- No fresh authoritative full `npm test` pass. The earlier process was deliberately
  stopped before this revision; its exit status is cancellation, not acceptance.

Optional browser QA requires an already installed Playwright module and local
preview server. No GitHub Actions or deployment is used:

```powershell
$env:PLAYWRIGHT_MODULE = '<installed Playwright module directory>'
$env:PDF_QA_EXPORT = '0' # omit for a real Edge PDF export
node scripts/check_slides_pdf_browser.cjs '<preview URL>' '<local audit directory>' edge
node scripts/check_slides_pdf_browser.cjs '<preview URL>' '<local audit directory>' firefox
python scripts/check_slides_pdf_text.py '<edge-report.json>' '<saved.pdf>' light
```

Set `PDF_QA_SCREENSHOTS=all` to retain an image of every print page; otherwise retain
the reviewed problem pages, title, Monte Carlo result and any failed pages. Reports
and PDFs are disposable local evidence. The text probe requires `pypdf`; native
Firefox PDF saving is not automated by Playwright and remains a manual check.

## Remaining implementation, in review order

| Phase | Scope | Status |
|---|---|---|
| 0 | Generic export defects | Reproduced defects repaired; wider R-54 font/code QA still open |
| 1 | New compact path, N01–N66; one question and observation per scene | N01–N09 pilot implemented; N10–N66 open |
| 1 | R details as a standard secondary mode; no code-only main scenes | Shared mechanism implemented and applied in the pilot; rest open |
| 1 | Provenance/status markers on every dataset change | Visible pilot labels; rest open |
| 2 | Eight linked, R-independent experiments with deterministic PDF states | First normal-prefix experiment implemented; others open. ECDF/bin exploration also works without R |
| 3 | Numerical references | Independent checks added; bind again to final scenes |
| 3 | Light/dark browser/PDF QA for the new compact selection | Waiting for selection |
| 3 | Instructor rehearsal and measured timing | Requires a teaching run; not inferred from slide count |

### Compact-path boundary

Keep the preserved 95- and 111-scene selections as reference/extended material.
Author a separate TriG path/scene graph for the reviewed selection. Do not achieve
the count by hiding navigation entries or placing all merged source cards on an
overloaded slide. N01 is the renderer's title: the target is **65 content scenes
plus that title = 66 navigable slides**, not 66 plus a title.

| Target IDs | Visible slides | Subject |
|---|---:|---|
| N01–N06 | 6 | Title, route, binomial activation, nitrate data, ECDF, density/area |
| N07–N20 | 14 | Additive errors and normal experiments; standardization, Phi, limits and means |
| N21–N30 | 10 | Separate LC-MS/MS protocols; factors, log transformation, centers and tails |
| N31–N41 | 11 | Nitrate precision; variance simulation, independent squares, df and decision |
| N42–N48 | 7 | New CRM data; random denominator, Student reference, test and mean CI |
| N49–N59 | 11 | Same A versus B; ordered F df, two-sided tails, calibration and knowledge map |
| N60–N63 | 4 | Q-Q/KS and categorical Pearson, with calibration/design restrictions |
| N64–N66 | 3 | Live dilution model, inverse-CDF trials and uncertainty budget/result |

The review's row-by-row mapping in section C is the source for scene regrouping;
all original pages remain reachable in the extended material. The target must
retain exact device A/B values, known versus estimated SD, fixed B/A orientation,
two tails, ordered df, independent regression quadratic forms, and the distinction
between model assumptions, simulations and empirical evidence.

### Required adaptations rather than literal adoption

R-03's suggestion to move all repeated symbol explanations elsewhere conflicts
with `AGENTS.md`. Every displayed formula must still have a complete authored,
linked, visible same-slide legend. Reduce formula scope and introduce a formula
only when useful; do not hide its legend in a glossary or rely on an earlier slide.
Long derivations and executable R can be secondary, but the substantive explanation
and a representative experimental result must remain on the main slide.

The eight required R-independent experiments are: nitrate sample size; signed
contributions; linked eta/density/CDF; additive versus multiplicative changes;
variance sampling; studentization; two independent variances; and dilution Monte
Carlo with one-source/all-source comparisons. None is considered complete merely
because an R code block exists.
