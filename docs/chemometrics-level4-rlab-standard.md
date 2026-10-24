# Level 4 R labs: the existing Variance standard

## Scope

This local follow-up standardizes the three active Level 4 labs (boxplots,
histograms and moments). It does not approve or implement the proposed lecture
restructuring. All 65 scene identities/order, scientific diagrams, R source code,
synthetic values and expected results are retained.

## Required structure

Use the **existing** Variance `prompt-code` composition and
`code-function-workbench`, not a second course-specific template:

1. Authored lecture heading.
2. Left: concise context in normal weight, then real task/question bullets with
   selective bold and one highlighted takeaway. The repeated task sequence is
   **Run → Change → Explain**. Colour supplements those text labels and markers;
   it is not the only indication of purpose.
3. Right: editable R code, Run/Reset/Show plots controls and numerical output.
4. **Below the output, on the same slide:** the source-backed, keyboard-scrollable
   R-function information box. Explain every called function, including package
   setup, data preparation, graphics, checks and locally defined helpers, as
   well as the selection/assignment/control syntax needed to read the example.

The two previously partial glossaries are expanded, preserving their identities.
The moment lab now has the missing `dct:hasPart` link to an authored
`cd:DefinitionList`. Counts are 16, 15 and 41 entries, respectively; entries may
group related functions when **each** is explained. Each entry belongs to one
list, with contiguous positions as required by the compiler. Explanations live
only in canonical TriG; generated JSON is disposable transport.

The shared prompt font now defaults to normal weight, leaving authored bold
meaningful in both courses. No resource-id/title-specific layout rule is added.
The shared rich-text renderer supplies proper lists, task/question markers and
the existing theme-aware highlight palette.

The glossary is marked as an interactive presentation surface. While it has
focus, Home/End, arrows, Page Up/Down and Space scroll its contents rather than
advancing Reveal. The existing code-runtime lifecycle attaches and removes this
handler for the shared workbench, including the Variance labs.

The moment-lab source is deliberately unchanged. Its final `stopifnot` checks
the last loop series only; the glossary describes this accurately and does not
claim an all-series check. A separate scientific/code correction remains outside
this formatting task.

## Regression checks

- `apps/pitch/test/level4-rlab-standard.test.ts` checks all three active labs for
  the shared composition, authored code/glossary relation, structured text and
  explanations of every called function (a bounded lexical authoring lint,
  not an R parser or a validator for arbitrary learner edits).
- `scripts/check_level4_rlabs.cjs` checks the actual course against a Variance
  reference in Light/Dark and 1600×1000/1600×900, including visible geometry,
  output-before-glossary placement, keyboard scrolling, genuine R execution,
  plot opening and reset. A saved local baseline also checks unchanged source
  code, scene order and all 62 non-lab scenes.
- Existing bounded order-statistics, histogram, moment, teaching-text and
  projection tests cover the surrounding contracts.

Review artifacts remain outside the repository:
`C:/Users/PCUser/AppData/Local/Temp/opencode/level4-rlab-review/`.
No commit, PR, external overall validation, merge or deployment is included.

## Recorded results

- 83 selected Node tests passed: code runtime, new R-lab standard, rich text,
  teaching primitives, observation/script projection and shared composition policy.
- Existing bounded Python suites: 12 order-statistics, nine histogram and nine
  ECDF/moment checks.
- Browser acceptance passed for all three labs in both themes and both aspect
  ratios, with 12 slide captures and two Variance reference captures. All three
  unmodified R programs executed successfully and produced real graphics; plot
  dialogs and Reset were exercised. Numerical outputs retain the expected
  quartiles, histogram total 100, and empirical moments/variance conventions.
- The optional pre-edit baseline comparison passed: 65 scene identities/order,
  identical R code/settings, and all 62 non-lab scenes unchanged.
- The Firefox compact-PDF regression also passed: 59 portrait pages, all raster
  checked, all four complete matrix plates, zero embedded images, 2,360,932 bytes.
  The fresh PDF is in the review directory's `print/` subdirectory; existing
  Desktop PDFs were not overwritten during this R-lab task.
- `git diff --check` passed for the changed tracked source files.

The standard is now documented and regression-tested. It is an authoring rule
for the initial lab source, not an assertion that an arbitrary learner-edited
program can automatically acquire complete explanations.
