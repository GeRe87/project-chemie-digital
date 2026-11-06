# Level 0–4: thematic Script and shared-renderer review

Local, uncommitted work on `work/level5-authoring-rules`, 2026-11-06.
This supersedes the **scope** of the earlier caption/alignment-only pass, not its
historical evidence. **The complete teaching-rule review is still open.**

## Implemented

Five authored TriG scripts use the existing independent thematic Script contract:

| Level | Chapters | Captioned materials |
| --- | ---: | ---: |
| 0 | 3 | 3 |
| 1 | 4 | 16 |
| 2 | 5 | 49 |
| 3 | 6 | 43 |
| 4 | 7 | 45 |

Sources are `ontology/dataset/chemometrics-levelN-script.trig`. Every selected
scene is related to a thematic chapter. All selected formula and optional R-code
resource identities are represented in their module Script. Chapters have
independent multi-paragraph reasoning and explicit material references; they are
not a projection of scene-wise narration. Level 2 also reuses exercise illustrations
through exact media-URI provenance, including nested illustrated exercises.

The common compiler traverses nested groups, deduplicates canonical formula
legends across repeated scene occurrences, and retains embedded derivation
legends. Level 1 formulas now have explicit authored legend attachments; their
definitions explain indices, operators, domains, units and notation. Directly
selected copies of the same attached legend retain their provenance without
being displayed twice.

Common numbered Flow cards now cover ordinary flows, motif-bearing roadmaps,
hierarchies and process-system nodes. Composite process nodes retain their
labelled internal columns. Notation and motifs have a reserved band, and peer
titles and explanations have common height budgets. Layout is derived from
structure and text measurements, with no resource-ID/scene-ID selectors.
Long-word width calculations include a small measurement margin to prevent
floating-point boundary splits such as `MULTIVARIAT` / `E`.

Rich definition-card titles have one explicit title container beside the number,
including the mathematical fragments in `f(cᵢ)`. This is tested through the
production minimal-DOM renderer rather than relying on browser-only node moves.

Reading-view charts explicitly show their complete state. Screenshot review found
and corrected a Level 0 bar chart that previously displayed axes with hidden bars.
The source observations and the slide's progressive presentation remain unchanged.

Real LuaLaTeX PDFs build for all six Level 0–5 scripts in one exact-scope local
manifest. Current Level 0–4 PDFs have 4, 9, 21, 26 and 34 pages respectively.
The exporter retains complete derivations, grouped bars, boxplots, ECDFs, 2D
counts and moment matrices. The matrices retain all three graphical columns,
common bins and the authored metric-specific encodings on landscape pages.
Tables budget their actual column padding; Unicode symbol terms and micro-unit
prefixes retain glyphs. See [LaTeX export](latex-script-export.md) for regeneration.

## Evidence

### Script diagram duplication correction

The shared Script renderer mounts the graphical diagram once. Complete node,
edge, notation and composite-part text remains inside a native optional
“Diagram as text” disclosure. It stays open until SVG mounting succeeds; enhanced
print output suppresses the duplicate alternative. No authored relations were removed.

- 147 focused Self-Study, Script and D3 tests pass after this correction.
- Browser checks cover all nine Script diagrams in both themes: exact node/edge
  counts, closed initial alternatives, Enter-key disclosure and print suppression;
  no browser errors. Screenshots and report are in
  `C:/Users/PCUser/AppData/Local/Temp/opencode/script-diagram-duplication-review/`.
- The offline static course build succeeds with SHACL conformity and all six
  real LaTeX PDFs: `dist/chemometrics-review-20261106` (338 files).
  Whole-course navigation, Script/PDF access and return to the overworld pass for
  all six levels in both themes, with no browser errors or failed responses.
  Evidence: `C:/Users/PCUser/AppData/Local/Temp/opencode/whole-course-production-review/`.
- `git -c core.safecrlf=false diff --check` passes. This does not replace the
  still-blocked full `npm test` gate described below.

- 748 focused Core/Pitch/renderer tests pass, including production compilation
  and LaTeX projection of all five new scripts.
- All 16 thematic-script Python tests pass. These include exact path bindings,
  scene coverage, formula/code resource coverage, reordered-scene independence,
  nested media provenance, complete legends and SHACL Script shapes.
- All 167 Level 0–4 slides were captured in light/1560 px and dark/1280 px.
  The final audits pass after correcting a newly detected Flow text-boundary
  problem in the five-dice diagram. Audits now detect fragmented title markup,
  legacy Flow cards and text extending beyond a Flow node, in addition to region
  overflow. They advance real keyboard stages and open native symbol legends.
- Browser Script audits pass in both themes for all five modules, including
  material/caption/reference counts, complete reading-state charts, mobile width,
  reference navigation and print visibility. Overlapping reading-pane tiles and
  contact sheets were captured; selected sheets and full-resolution problem
  regions were visually inspected. This is not a claim that every tile has
  received a final editorial review.
- LaTeX compilation rejects missing glyphs, unresolved references and substantial
  overfull boxes. Individual PDFs and the combined six-module manifest built
  successfully. Generated PDF contact sheets were inspected for representative
  chapters, derivations and moment matrices; a grouped-bar label problem was
  corrected after that review.
- Final exact-scope PDF checks pass for the combined six-module manifest. Browser
  checks confirm that each Level 0–5 Script PDF link is enabled and serves actual
  PDF bytes for the current Script identity and path/graph binding.
- A fresh comparison with the saved pre-review runtime checked 205 scientific
  blocks in Levels 0–4: formula expressions, executable code and numeric payloads
  are unchanged. This comparison permits editorial prose/legend changes and
  removal of duplicate presentations of the same canonical legend.
- Level 5's full experiment/browser regression passes at three viewport/theme
  configurations. Current slide-PDF audits have not yet been rerun after every
  change in this broader pass; older slide-PDF results remain historical evidence.
- `npm test` still stops at the unavailable local `tsc`. Passing focused tests
  does not certify the full project command, production build or external status.

## Remaining before full acceptance

1. Finish the G1 editorial review across remaining slide text, details, alternative
   text, symbol explanations and legacy narration. Several negative/warning-style
   explanations were rewritten in Levels 0–4, but that work is **not complete**.
   Preserve scientific conditions and legitimate distinctions; word occurrence
   alone is neither an error nor evidence of compliance.
2. Strengthen the remaining generic Script figure captions with their relevant
   authored numerical findings, and review caption/prose separation consistently.
   Reusing scientific material and having a caption are necessary, not sufficient,
   for the accepted Level 5 editorial standard.
3. Review the remaining Script/PDF tiles and all slide contact sheets editorially,
   rerun slide-PDF checks, and repeat screenshots after further text changes.
4. Resolve the local typecheck infrastructure and obtain full validation evidence.

No commit, push, pull request, release or public publication has been made.
The work is deliberately **not labelled ready for final acceptance** yet.

## Local review artifacts

Under `C:/Users/PCUser/AppData/Local/Temp/opencode/`:

- `levelN-broad-review-final-light` / `levelN-broad-review-final-dark`: slide images,
  initial stages, legend ends, contact sheets and geometry/rule reports.
- `levelN-script-review-v2`: full reading-pane tiles in both themes; these precede
  the last small Level 2 editorial changes.
- `levelN-latex-review`: rendered PDF pages and contact sheets, with subsequent
  grouped-bar re-rendering still to be incorporated into the contact sheets.
- `level0-5-script-runtime.json`: complete disposable offering used for the build.
- `level0-4-final-tests.txt`: focused test output.
- `level0-5-positive-language-remaining-v2.txt`: expanded open review inventory,
  including narration and Script materials. Its 465 occurrences / 307 distinct
  texts are keyword candidates requiring judgment, not a count of rule failures.

Use the existing local `authoring-levelN-caption-review` preview names for
Levels 0–4. Their Script toggles now select the independent thematic scripts.
