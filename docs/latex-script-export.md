# LaTeX script PDF (local authoring)

The PDF action in the thematic Script view opens a **precompiled LuaLaTeX PDF**.
It no longer invokes browser printing. The separate slide-PDF action is unchanged.
Nothing in this workflow publishes or deploys the output.

## Build and inspect

```text
npm run script:level5:pdf
npm run check:level5:pdf
```

The first command assembles the selected TriG path and independently authored
thematic script, generates LaTeX, and runs LuaLaTeX at least twice. It writes
content-addressed `.pdf` and `.tex` files plus `manifest.json` to the ignored,
disposable `apps/pitch/public/script-pdf/` directory. Reload the local preview;
switch to Script and use **PDF**. The Script header also links to the `.tex` file.
For scripts with SVG illustrations, **Source bundle with figures** downloads the
`.tex` and its neighboring vector PDF assets as one ZIP. Unzip it and run LuaLaTeX
on `script.tex` to rebuild the document.
`npm run preview:level5` now builds this PDF before starting the preview server.

Generic use, for a generated runtime containing captioned thematic scripts:

```text
npm run script:pdf -- --runtime PATH/runtime.json --out-dir PATH/public/script-pdf
```

Pass `--public-root PATH/public` when the source media live in a staged public tree.

For the complete local Level 0–5 offering, build the manifest in one operation:

```text
python apps/self-study/scripts/generate-runtime.py
npm run script:pdf -- --runtime apps/self-study/src/generated/canonical-runtime.json --out-dir apps/pitch/public/script-pdf
```

A manifest has exactly the scope of the supplied runtime. The single-Level-5
convenience command replaces that scope with Level 5 alone. Use the combined
command when all six local module PDF links should be available simultaneously.

Set `LUALATEX` or pass `--compiler` for an installed executable outside PATH.
No script compiler, CDN, remote conversion service or font download runs in the
interactive preview browser.

## Dependencies and failure boundary

Use Node.js 22+ and a working LuaLaTeX installation (MiKTeX or TeX Live) with
`geometry`, `fontspec`, Latin Modern text/math fonts, `amsmath`, `amssymb`,
`unicode-math`, `longtable`, `array`, `fvextra` (including `fancyvrb`, `upquote`,
`lineno`), `adjustbox`, `needspace`, `pgfplots`/TikZ, `pdflscape`, `hyperref` and `xurl`.

Scripts with authored SVG illustrations additionally require local Chromium or
Edge for **build-time SVG-to-vector-PDF conversion**. Windows Edge and standard
Linux/macOS Chromium/Chrome locations are discovered automatically. Set
`SCRIPT_PDF_BROWSER` for another executable path. The converter accepts a bounded
inert SVG subset, rejects active/external content, and uses a fresh local profile
and restrictive content-security policy. Vector paths and selectable text are
preserved. The complete document is typeset and assembled by LuaLaTeX, not printed
from HTML. Python's standard ZIP module packages the reusable source bundle.
No new npm or Python package is required.

Compilation uses no shell escape. On MiKTeX automatic package installation is
disabled for compiler runs; missing packages are explicit infrastructure errors.
The local pilot required installation of the user-local `fancyvrb`, `lineno` and `needspace`
packages. The build preserves its temporary TeX/log/PDF directory for diagnostics.
Errors, missing glyphs, unresolved references and substantial overfull boxes prevent publication of a new
manifest. Other generated content-addressed files are not deleted or overwritten.

The normal renderer tests inspect TeX without requiring a compiler:

```text
npm run test:renderer-latex
node --experimental-strip-types --test apps/pitch/test/script-pdf.test.ts
```

`scripts/check_latex_pdf_browser.cjs` checks the real local PDF link, PDF bytes,
navigation instead of HTML printing, and missing/stale/corrupt failure cases.

## One semantic source, independent output

- `cd:ScriptMaterial` occurrences supply identity and authored captions.
- Explicit `dct:references` links and inline markers produce native LaTeX
  labels/hyperlinks. Figure, equation, table and listing counters follow the same
  material order as HTML, using the shared Core numbering policy.
- Formulas and complete authored legends are reused. R source is preserved in
  literal, wrapping code blocks; the build does not execute R.
- Vector diagrams use PGFPlots. Experiment snapshots call the same deterministic
  Core calculations as the HTML/static views. Published histograms use their
  actual bin edges/counts; every authored saved histogram state is shown.
- Dot plots preserve every observation, including ties, with categorical groups
  or authored numerical group positions, reference curves and intervals. Static
  flow reading views retain each node, notation, composite part and explicit
  outgoing edge target, including branches. Authored local SVGs are embedded as vector PDFs; their actual
  source bytes are included in the freshness contract.
- Units, axes and trace labels remain visible. The important numerical findings
  are explained in authored caption sentences, at suitable display precision.
  A free-standing readout list or model-parameter dump is not emitted in the PDF.
  This is a static reference-state document, not an interactive control.
- Complete full-precision readouts, parameters and model notes remain in HTML
  Details and as one machine-readable JSON comment per experiment in the `.tex`
  source (also in the source ZIP). Computations and plotted coordinates are unchanged.
- Figure descriptions are authored in the TriG occurrence captions. The exporter
  does not infer caption prose from marker labels. Markers are drawn as dashed
  guides with their legend entries inside the graphic, rather than printed as
  disconnected label/value lines below it.
  Histogram-state descriptions serve as panel captions; no additional result-count
  line is appended. HTML Script figures retain their fixed reference states;
  interactive exploration remains available on the slides.
  On interactive slides, the changing readouts are structurally part of the
  figure's caption alongside its authored explanation, not separate prose blocks.
- The shared exporter also supports the Level 0–4 scripts: complete mathematical
  derivations and optional derivation details; grouped bar charts; boxplots with
  observed whiskers/flags; ECDF steps; two-dimensional count histograms; and the
  full point/boxplot/histogram moment matrices. Matrix observations, shared bins,
  means, median guides and cubic/fourth-power contribution encodings are retained
  on landscape pages. Other chart/diagram/media variants fail explicitly rather
  than disappearing. Add a tested adapter before using such material in a PDF script.

The projection fingerprint is `latex-script-1.2`. This invalidates earlier PDF
manifests after the expanded renderer contract; known older manifests can supply
digest-checked vector assets during a rebuild. Formula units include their actual
symbol terms as well as explanations. Structured authored symbol groups retain
their own definition rows instead of exposing internal group headings.

The PDF contains real text, vector formulas and diagrams, links and a contents
page. It is **not claimed to be a fully tagged/accessibility-certified PDF**;
the accessible HTML script remains available alongside it.

## Freshness and static builds

The manifest binds script IRI, exact path/graph pair, export-format version and a
SHA-256 of the complete canonical script transport. The browser verifies that
binding, the current SVG source bytes and the PDF bytes before enabling the link.
The build verifier also checks converted figure PDFs and the source ZIP.
An old/missing/corrupt PDF
leaves the PDF action unavailable, with an explanation. There is no silent
fallback to HTML printing. Rebuild and reload after semantic changes.

`scripts/build_static_course.py` generates current PDFs in its private staged
public tree for offerings with thematic scripts. It never copies leftover
development PDFs. `scripts/static_course_artifact.py` checks source binding,
PDF/TeX hashes and exact regenerated TeX before accepting the static output.
The export-format identifier in `packages/core/src/script-pdf.ts` must advance
when changing the compatibility contract of the PDF exporter.

## Reading flow and visual coverage

Both renderers place a chapter's materials immediately after their first explicit
local prose reference. Materials introduced in the same paragraph retain authored
relative order. Shared Core numbering follows this resolved reading flow;
cross-chapter references navigate without moving the target's ownership. Script
1.0 keeps its legacy paragraph/material order. Independent thematic chapters and
related-scene orientation links do not derive reading order from slides.

Level 5 selects 32 of the lecture's 35 visual resources, including nine SVGs, both
observed dot plots, the ECDF comparison and the Student/F construction flows.
Three live Normal variants intentionally remain slide-only:
`v3-normal-coordinate`, `p1-normal-cdf` and `p1-normal-inverse`. Their meaning is
covered by complete standardization/quantile formulas and linked density/CDF/tail
illustrations. A semantic regression test records this exact coverage decision
and detects newly missing visual dependencies.
