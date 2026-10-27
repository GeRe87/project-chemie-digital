# TED-GC-MS revision preview (#296)

## Owner review corrections a1–a9

- Solid TIC at every stage, thinner after EIC selection. Spectrum overlays the
  upper plot opposite its marker and switches light/dark assets without reload.
- Variance and FAIR SVGs use inert theme-aware drawing attributes; variance
  process/panel cards use the shared colorful presentation palette.
- Added the speaker-specified 15 K/min curve with unchanged 2/6 minute holds:
  a 20-minute ramp and 28-minute nominal total, versus the export's 38 minutes.
- Connector labels follow the theme in every layout, with explicit active-stage
  styling for the processing interfaces.
- PipelineNode's reference descends below the containing boxes, travels left
  of the vocabulary box and enters ProcessingUnit from the left.
- Failed SHACL stage uses a red document/cross; passed stage restores the shared
  green check motif.
- Closing slide retains its talk QR/address and adds the owner-specified name,
  institutional email and institute website. No remote contact lookup is used.

Earlier green full-suite evidence at `f9662fd4` does not validate these corrections.

## Boundary

Owner-requested follow-up to accepted PR #295, based on `talks`. The result is
for review on `agent/296-ted-talk-revisions`, not permission to merge or publish.
Neither `talks` nor `gh-pages-talks` is updated by this work. Chemometrics content,
branch, published website, build commands and hosting settings remain untouched.
No dispatcher state is claimed or changed.

The owner explicitly approved narrowly scoped reusable presentation changes after
disclosure that they can affect a future rebuild of other presentations. They
include evidence media attached to a chart point annotation, diagram edges with
optional source/target part identities, explicit run-label categories and their
renderer geometry. A structural visual-evidence composition keeps the existing
formula/legend renderer visible beside its main graphic. A dialog-launcher fix
prevents a button from reserving the space of an inline diagram. The six-node
semantic-tool hub reuses the existing illustrated system-card renderer through
an identity-independent topology rule. There are no scene-ID layout selectors.
Portrait source examples have independently scrollable explanation and code
panes, with a visible heading and graph launcher. Both panes are keyboard-focusable;
native scroll keys are isolated from deck shortcuts without cancelling scrolling.

## Request mapping

1. Setup SVG: removed the explanatory footer and changed the transfer label to
   “Manual transfer / Autosampler”.
2. Heating: instrument range 25–1000 °C is an indented subordinate point.
3. Sorption: qualitative partial capture and reconditioning with blank checks.
4. Markers: an additional authored spectrum/reference stage precedes integration.
   The mirror spectrum is explicitly synthetic and assigns no actual compound.
5. Nested schedules: identifiers select extraction and GC-MS, not reset phases.
   Short bars place the identifier above their own interval.
6. After heating optimization: the supplied TGA temperature-program chart.
7. Calibration schedule: the same extraction/GC-MS labeling rule.
8. The empty placement request is interpreted as the follow-up specified in 15.
9. Processing overview: a third stage highlights all four interface labels.
10. FAIR: two computer-pair comparisons, data handoffs and the requested contrast,
    with a visible authored symbol legend.
11. RDF example: full university name in `worksFor`, followed by its `alternateName`.
12. Specializations: pipeline on the left, step on the right. Stage two connects
    ProcessingUnit to the specialization box; stage three connects ProcessingStep
    to qalg:FindPeaks. These are semantic-description arrows, not execution order.
13. AI: illustrated semantics/algorithms → MCP tools → agent-authored validated
    pipeline → controlled execution architecture. Early-test and validity caveats
    remain; the slide does not promise autonomous analytical validation.
14. After markers: process-chain variability with five supplied calibrants and
    an explicitly artificial UV-visible comparator, plus a replicate takeaway.
15. After local sample calibration: source-transcribed synthetic FIFO-design
    comparison from the supplied PowerPoint notes, with limits preserved.
16. After the semantic pipeline: two-stage SHACL mismatch/correction with revision
    history, timestamps and retained validation evidence.

The path now contains 29 scenes including its title. Existing videos, closing
website/QR, English content and non-empty first diagram stages are retained.

## Scientific/source decisions

- `Methode_TGA.txt`: 200 °C for 2 min, then 10 K/min to 500 °C (30 min), followed
  by a 6 min hold. The 38 min axis excludes conditional settling, insertion,
  cooling and reset. Nitrogen changes from 20 to 30 mL/min. The export's settling
  band, duration and timeout are recorded in the source description and narration.
  This is not the earlier optimized 20-minute extraction schedule or a universal
  instrument program. The broader instrument range is speaker-reported.
- The variance illustration uses exactly the second non-overlapping five-point
  block in the existing balanced display order: standards 6–10, unchanged.
  Ordinary least squares with intercept gives a coefficient of determination
  about 0.741. This is an illustrative selected subset, not a population estimate.
- The UV-visible coordinates are explicitly artificial. Their perturbation from
  a straight line is proportional to `(1, -2, 1, 0, 0)`, orthogonal to the intercept
  and predictor; the resulting coefficient is 0.990 within stored precision.
  No actual UV-visible measurement or universal performance threshold is claimed.
- Process stages can contribute variability, but the drawing is not a measured
  variance decomposition. Replicates do not repair bias or invalid calibration.
- The FIFO PowerPoint assumes no drift, noise-free sample signal and a target
  correlation around 0.7, **not** a coefficient of determination of 0.7. The
  reported error percentile is conditional on accepted fits (illustrative slope
  threshold greater than 0.15). The notes give exact values only at window sizes
  5, 15 and 30; unsupported intermediate values are not invented. Simulation
  source code and seed were not supplied, so these are not reproduced simulations
  or validated laboratory uncertainty. Robustness to order does not imply
  robustness to drift; fifteen is a working choice under those assumptions.
- The SHACL teaching data use `example.org` identities, separate named revision
  graphs and an explicitly selected untargeted equality shape. Tests add a target
  only to their isolated shape copy and actually check failure and success.
  Production-wide validation is not weakened to accommodate the negative example.
  Versioning requires recorded metadata and system support; RDF/SHACL alone does
  not create history or prove analytical correctness. Example times are labeled
  illustrative, not represented as actual execution or acquisition times.
- Source hashes and basenames are recorded in TriG. Private absolute paths, raw
  PowerPoints, method-export metadata, measurement filenames and dates are not
  copied into the website. Existing calibration-data provenance remains intact.

## Authoring and verification

Canonical content remains under `ontology/dataset/`. The original teaching SVGs
are deterministic projections/illustrations, not another authored data store:

```text
python scripts/generate_ted_revision_assets.py
python scripts/generate_ted_revision_assets.py --check
npm run test:talks
npm test
npm run build:talks
npm run check:talks-build
```

`test_talks_ted_revisions.py` verifies source values, stage order, actual selected
SHACL outcomes, plot calculations, legends and asset packaging. Generic TypeScript
tests cover endpoint rejection, adapter preservation, label placement, source-linked
evidence, nested-point escaping, topology geometry and formula-caption composition.

Browser checks use the real built app, not a second presentation implementation:

```text
node scripts/smoke_ted_introduction.mjs <base> <playwright-index.mjs> <browser-exe> <screenshots> <axe.min.js>
node scripts/smoke_ted_revisions.mjs <base> <playwright-index.mjs> <browser-exe> <screenshots> <axe.min.js>
```

The revision-specific check traverses every stage of 15 affected scenes at two
viewports, both themes and motion modes, checks inset timing, endpoint arrows,
highlighted interfaces, nested bullets, selected interval labels, visible legends,
clipping, assets and WCAG rules. Each direct-entry test gets an isolated browser
context so previous fragment/learner state cannot authorize a false initial state.
Final exact-head results belong in the draft PR and handoff; a local preview is
not independent acceptance or authorization to update a publication branch.
