# Level 4 – native-print overlay correction and lecture title

**Current follow-up:** see “Compact PDF and driver-independent matrix plates”
below. The mixed-orientation exports and checksums in the initial report are
historical; the current print layout uses portrait paper throughout.

The current authored lecture title is **Quantiles & Statistical Moments**,
without the course/level prefix. The shared title card and script header resolve
this label directly from the same canonical RDF path metadata. Course identity
and path identifiers are unchanged; the earlier title quoted below is historical.
The title slide now shows that heading alone, using the same centred
heading-only stack composition as Variables, Mean Values and Variance. It no
longer adds a separate course subtitle or a bespoke title-card stylesheet.
The course label remains available as metadata and in the script header.

Local, bounded follow-up to the reported empty `C:/Users/PCUser/Desktop/test.pdf`.
The proposed 22-scene curation is still awaiting approval and is **not implemented**.
No RDF files, scientific scene selections or statistical calculations changed.

## Diagnosis

The supplied PDF was produced by **Microsoft: Print To PDF** and has 56 pages.
It contains extractable script text, but its page images are visually empty.
PDF text extraction alone was therefore insufficient evidence of successful printing.
The file is preserved unchanged (SHA-256
`84d849c83e6226646f7b157f9c54119f126eee430173501515b5da915f41f2e4`).

The normal course enables a fixed, z-indexed `.pcd-background-world` sibling of
the script pane. Print CSS correctly makes the pane static for pagination, but
previously left that presentation background enabled. It then paints **over**
the script. With printer backgrounds enabled the reproduction is an opaque dark
page; disabled backgrounds can leave an opaque white page. The earlier review
used `authoring.html?...&background=none`, masking this normal-course regression.

The correction isolates `.pcd-script-view` during script printing: every other
body child is hidden, including background layers, Reveal's sticky scrollbar,
controls, dialogs and skip link. HTML/body are explicitly white, overriding the
background-enabled body's transparent `!important` rule. Screen visibility and
keyboard focus styles remain unchanged, and normal backgrounds return when
printing ends or is cancelled. The native print/Save-as-PDF button is retained.

## Lecture title, without reordering the learning content

`apps/pitch/src/lecture-title.ts` resolves the exact document-to-path/graph
binding against existing authored teaching-offering metadata. It projects a
leading title card using the existing labels:

- **Chemometrics Level 4: Quantiles & Statistical Moments**
- **Chemometrics and Applied Statistics**

The title card retains path-IRI and named-graph provenance. It is presentation
chrome, analogous to the course boundary view, **not** an invented scientific
SceneDefinition or extra learning question. The 65 authored scenes and their
positions remain unchanged. Existing authored heading-only introduction/title
slides are not duplicated (checked against the Variance module). The script
heading also uses the same path title instead of only the generic “Lecture script”.

## Bounded local verification

`scripts/check_level4_print_fix.cjs` tests the **normal course with its actual
background enabled**, Light/Dark at 1600×1000 and 1600×900. It checks:

- one source-attributed title card, title bounds and transition to the opening;
- all 65 script sections and 44 mounted scientific chart SVGs;
- print button invocation and absence of visible non-script body layers in print;
- restoration of screen backgrounds and the presentation toggle;
- no duplicate Variance title and its existing 48 script sections;
- full PDF export with printer backgrounds disabled in Light and enabled in Dark;
- exactly four landscape matrix pages, content text and nonblank page structure;
- **independent rasterization of every PDF page with local `pdftoppm`**, followed
  by pixel checks excluding printer-header/footer regions. This catches both
  white/empty pages and an opaque dark background covering the text.

Artifacts remain outside the repository under:
`C:/Users/PCUser/AppData/Local/Temp/opencode/level4-print-fix/`.

Primary corrected PDF: `chemometrics-level4-script-fixed.pdf`.
Additional dark/background-on PDF, four title screenshots, bounded PDF samples,
raster pages and `print-fix-manifest.json` are in the same directory.
The original `test.pdf` is not overwritten.

Reproduce with external `PLAYWRIGHT_MODULE` and that `REVIEW_DIR`, then
`node scripts/check_level4_print_fix.cjs`. Python/pypdf and pdftoppm are existing
local inspection tools, not new product dependencies. The test uses the browser
print engine and intercepts the button solely to observe invocation; it does
**not** automate the Windows printer driver or claim that a fresh manual
Microsoft Print to PDF run was performed.

The existing full-content screenshot checks now deep-link to the authored
opening explicitly instead of assuming it is the presentation's first page.
No new mass screenshot export, external overall validation, PR, merge or deployment.

### Recorded results

- All 25 selected Node tests passed (lecture title, course world, presenter tools
  and observation projection).
- `check_level4_print_fix.cjs` passed all browser and independent raster checks.
  Both PDFs have 46 pages; landscape matrix pages are 38, 40, 42 and 44.
  The minimum central ink fraction is approximately 0.0608 in both outputs,
  compared with 0.0 on the supplied blank PDF's first page.
- The four-page `print-fix-visual-proof.pdf` (first and first landscape pages in
  both themes) was also visually inspected successfully.
- `check_level4_opening.cjs` passed the existing opening/Variance appearance,
  data, geometry, keyboard/detail, static fallback and course-world checks.
- `git diff --check` passed. All changes remain local and uncommitted.

Primary corrected PDF SHA-256:
`9b43a181e6d16f450ca90ca7d3d911ca2b92fa40810c70571ae60cac04cb0d1c`.

Dark/background-on PDF SHA-256:
`30d9d30e42b642e6dd6630b12ad59c849daa6628f8ef5f8f380a41d07b7b3a64`.

Manual follow-up: reload the course, switch to the script and retry the PDF
button with Microsoft Print to PDF. That Windows-driver test remains separate
from the successful browser print-engine and raster verification above.

## Compact PDF and driver-independent matrix plates

The user's subsequent Desktop `test.pdf` is a **different** 56-page file,
36,752,944 bytes, SHA-256
`b9f66beccc94956d61f0c9aaae58c6b671b4b4b901d39f9e524926db6e98aa7d`.
It is also preserved unchanged. Its 56 JPEG page images (2481×3508 pixels,
approximately 300 dpi) consume 35,974,799 encoded bytes. This is not primarily
large scientific datasets or uncompressed chart paths: the Windows printer
output embeds a high-resolution raster image of **every page**.

The browser's own Save to PDF path retains text and vector diagrams. The script
now explicitly recommends **Save to PDF / Save as PDF**, not **Microsoft Print
to PDF**, together with A4, 100% scale and disabled browser headers/footers.
The PDF button still opens the native dialog; browser security does not allow
application JavaScript to force its destination. No compression service,
external upload, new PDF dependency or lossy downsampling has been introduced.
This changes the recommended export route, not the Windows driver's behavior.

The user's physical paper stayed portrait even for CSS named landscape pages,
clipping the histogram column and the descriptor table. Named landscape pages
are no longer required. Each matrix is a **244 mm-wide landscape plate rotated
within a portrait A4 page**, including its heading, table, nine panels and
caption. An outer page box reserves its full height; the entire plate stays
inside the printable rectangle with slack. The actual figure/figcaption DOM
relationship, accessible SVG labels, all observations, scales, coefficients and
screen interactions are preserved. Print-only shadows and filters are disabled.

### Verification and current artifacts

Current artifacts: `C:/Users/PCUser/AppData/Local/Temp/opencode/level4-print-compact/`.

- Firefox's own print engine is exercised with `scripts/check_level4_firefox_print.cjs`
  through WebDriver BiDi, against an isolated headless Firefox profile. It uses
  **explicit portrait paper** and inspects every output page independently.
- Firefox output: **56 pages, 2,240,133 bytes (about 94% smaller)**, no embedded
  raster images. All four matrix plates retain the three column headings,
  all nine panel labels, numeric table and complete caption on one page each
  (pages 48, 50, 52 and 54). Every page passed raster nonblank/overlay checks.
- `firefox-matrix-proof.pdf` contains the four full plate pages for visual review.
- Edge/Chromium checks cover both themes, portrait page geometry, all nine
  panels' transformed bounds, 65 sections, 44 chart hosts, print restoration and
  the unchanged Variance module. Both pass: 46 pages, 3,447,731 bytes in Light
  and 3,449,791 bytes in Dark. A 5 MB output budget is now enforced.
- All 25 selected Node tests passed again. These are bounded local checks,
  not external overall validation or a new manual Windows printer-driver run.

The four final Firefox matrix pages were also visually inspected. A byte-identical
copy is available at `C:/Users/PCUser/Desktop/Chemometrics-Level4-kompakt.pdf`,
SHA-256 `db0bf78dd92c66782e794202f5b33aaef27e28cd1f3922a4e1cf5e20f2349c6e`.
The current Desktop `test.pdf` checksum was rechecked after creating that copy.

The canonical RDF fingerprint remains
`sha256:fdee268043460d04de535da3df3dc182bf990e33e5df7b05aafe63ca0a4d4188`.
No scientific restructuring, commit, PR, merge or deployment is included.
