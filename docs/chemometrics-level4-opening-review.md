# Level 4 — opening comparison review

The opening data/composition remain unchanged in the current [histogram revision](chemometrics-level4-histograms-review.md);
its table now uses the default shared palette. The bounded preview contains 43 slides;
the active path has 54 selections.
The one-scene preview/17-selection counts below describe the earlier checkpoint.

## Current review: quiet four-shape comparison

### Shared dot-plot styling (current)

The diagram now uses the **same chart surface and visual classes** as existing
Variance dot plots: `retro-neon-chart-window`, `d3-dot-plot-figure`,
`d3-dot-plot-svg`, grid/tick/category/axis classes, outlined `d3-dot-point` marks,
`d3-dot-summary` diamonds, chart caption and icon legend. The mean diamond sits on
the mean±SD bar. Legend entries and diamond geometry are shared functions used by
both renderers, not a separately copied skin. SD bars extend the common dot-plot
primitives and use the summary palette. The previous distribution-specific `sc-*`
graphics styling has been removed; legacy interactive comparison modes remain
supported separately. Distribution geometry remains horizontal so all four sets
share the authored numeric scale without changing observations.

The shared presentation stylesheet also keeps Reveal's viewport/scroll-page
background aligned with the theme when backgrounds are disabled; this removes the
old dependence on a chart-specific background override. The two-column composition,
scientific data and following scenes are unchanged.

Verification: 108 focused Node tests, 11 opening Python tests and browser acceptance
passed. The browser compares actual computed point, grid, category and axis styles
against the existing Variance lecture in **both Light and Dark**, and captures the
reference slide “Same Mean, Different Spread” as well as the new opening. Screenshots:
`C:/Users/PCUser/AppData/Local/Temp/opencode/level4-shared-dot-style/`
(`opening-four-shapes-dark.png`, `opening-four-shapes-light.png`,
`variance-dot-reference-dark.png`, `variance-dot-reference-light.png`).
Normal Overworld transport is regenerated; no full project/external validation,
PR, merge or deployment was performed.

### Standard Variance composition (current)

The scene now uses the **existing** `scenario-data-visual` composition, exactly as
the Variance lecture's extreme-measurement comparison: left scenario card, summary
table, conclusion box; right diagram. TriG selects ordinary DefinitionList, Table,
KeyPoint and Chart resources in that order. The composition policy already infers
this structure from block kinds, so no new slide template, layout vocabulary,
scene-ID switch or subject-specific composition rule was added.

The table has four rows and columns for set, mean and sample SD. Cell values are
authored presentation text linked to canonical results via `dct:source` and checked
against those results in tests. The conclusion contains the scientific takeaway and
ECDF/quantile/shape bridge. The chart renderer now contributes only the diagram,
its legend and optional details/accessibility output; it does not reproduce the
slide's question, summaries or conclusion. The earlier heading-token override was
removed. A shared CSS selector now also spans direct heading blocks across both
columns, consistent with the composition policy's existing unwrapped heading
contract. Static plots no longer claim the host-wide interactive keyboard region.

Current screenshots: `C:/Users/PCUser/AppData/Local/Temp/opencode/level4-standard-composition/`
(`opening-four-shapes-dark.png`, `opening-four-shapes-light.png`). Browser checks
assert the actual shared composition regions, four table rows, left/right geometry,
full-width heading and absence of chart-owned slide prose. Final focused results:
22 Python tests and 100 Node tests passed, including the existing composition/fit,
navigation and ECDF suites; browser checks passed in both themes and through the
refreshed Overworld. No continuation scene was changed. The descriptions of the
earlier full-width view below are historical.

The user superseded the disclosure/menu approach below with a **static comparison**.
The single opening now shows four sets of **100 synthetic observations**: uniform,
normal-like, strongly right-skewed, and bimodal. All have empirical mean **50 a.u.**
and sample SD **10 a.u.**, with n−1 as variance divisor. A shared x axis, mean
markers and mean±SD bars make equal summaries and different shapes visible at once.
There are no per-point value labels, overlay, reset, investigation menu or internal
disclosure steps. Scientific details and the accessible description remain optional.
The brief bridge introduces ECDF, quantiles and empirical distribution shape, without
developing the next scene.

`ontology/dataset/level4-distribution-comparison.trig` is the new authored semantic
snapshot, separating example data/results from presentation series/placements in
named graphs. `scripts/prepare_distribution_comparison.py` reproduces and checks
it, but is **not** a compiler/runtime data source. Construction uses midpoint
quantile grids (uniform, normal, exponential, and two narrow normal-like groups),
then x = 50 + 10(z−mean(z))/s(z). Stored decimal summaries agree within 1e-10.
These are constructed shape illustrations, not random samples, observed analytical
measurements or proofs of population distribution families. The vertical dot packing
preserves every x value and only separates overlapping points; it does not encode
a second measured quantity or a fitted density.

The generic comparison contract now permits at least two series and supports a
`distribution` mode. Earlier optional investigations remain supported for other uses;
they are not selected here. Both original five-point canonical samples/results remain
unchanged and regression-tested. The path still has 17 selections; the following
16 scenes, including QC and ECDF, have not been redesigned.

Focused verification: 11 opening tests (including focused SHACL, construction,
empirical summaries and shapes), 11 LearningPath tests excluding full-project SHACL,
and 38 selected Node tests including packing geometry and retained ECDF behavior.
Browser acceptance verifies 400 dots, four mean/SD guides, absent labels/menus,
projection bounds, details keyboard/Escape, static fallback, Light/Dark and Overworld.
Screenshots: `C:/Users/PCUser/AppData/Local/Temp/opencode/level4-four-shapes/`
(`opening-four-shapes-dark.png`, `opening-four-shapes-light.png`).
Preview: `http://127.0.0.1:5173/` → Level 4, or the isolated
`http://127.0.0.1:5173/authoring.html?theme=dark&background=none`.
No full project/external validation, PR, merge or deployment. Stop for joint review.

## Historical checkpoint: progressive disclosure (superseded)

The remainder records the earlier consolidated interactive design, not the current UI.

## Local checkpoint and scope

Worktree: `project-chemie-digital-level4-authoring`; branch: `work/level4-authoring`.
HEAD remains `811d09badfb6eb23e1dcb064d4a7e0f326d22a21`. Existing uncommitted iteration-A changes were preserved. No PR, commit, merge, deployment, full project validation or external validator run is part of this checkpoint.

**Level title:** Quantiles & Statistical Moments.
**Guiding question:** How can we describe our data beyond mean and variance?
**Course envelope:** 75 minutes instruction, 15-minute break, 45 minutes instruction (120 teaching minutes, 135 minutes elapsed). The earlier three-hour/28-scene proposal is not the current timetable. General distribution theory belongs to the next level.

The earlier three-scene checkpoint has been consolidated into **one** interactive opening, “Same mean. Same variance. Same distribution?”. The path now has 17 selections, **not** 17 newly approved finished lecture scenes. The following 16 selections retain their order and content; only their positions shift. The old QC-extreme opening remains beside the robustness/QC activities. Later scenes and timing remain provisional and are excluded from the isolated preview. Adapting the retained ordering scene to the new opening is explicitly deferred until visual/didactic acceptance.

## Reference to existing lecture style

Inspected `chemometrics-same-mean.trig`, `chemometrics-variance-foundations.trig`, `chemometrics-variance-visual-review.trig`, `variance-ui-review.trig`, `variance-compact-scenes.trig`, and the shared dot-plot/composition/stage runtime. Reused their principles: shared numerical scale and explicit reference quantities, large observation plots, short staged questions, corrected sample-statistic notation, theme tokens and optional scientific details. No CSS/layout identifiers or concrete scene-ID branches are authored into RDF.

## Actual interaction sequence

1. **Known summaries:** show the identical mean, sample variance and sample SD, with observations hidden. Ask whether identical summaries can hide different measurements. Mean±SD bars are not confidence intervals or the data range.
2. **Reveal observations:** show both samples on the same 0–12 mg/L axis. An optional overlay aligns the lanes without changing x coordinates. Equal summaries do not uniquely determine the empirical distribution; this does not identify a population distribution family.
3. **Explore what is missing:** one compact “Optional view” dropdown offers independent probes, not compulsory substages:
   - Position: select a one-based rank and compare observed values.
   - Interval: change inclusive endpoints; `[3,6] mg/L` contains 2/5 A values and 3/5 B values.
   - Symmetry: optionally reflect observations about their mean, using hollow/dashed marks. This probes finite samples, not population symmetry.
   - The overview and probes retain a brief bridge: Position → Quantiles; Concentration → Quartiles & IQR; Shape → Statistical moments.

There is one title, one persistent SVG diagram, one summary block and one navigation/reset set, with no nested stage counters. Overlay remains enabled across compatible disclosures. Reset clears overlay, reflections, rank and interval edits and hides observations again. Ordinary presentation Previous/Next changes scenes; local labelled controls advance disclosure. Scientific details remain optional in a native modal dialog with Close/Escape and focus return. An accessible data description/static fallback is available. No learner input is persisted.

### Checked removals

Inbound RDF references and TriG usages were checked before removing 16 redundant presentation resources: two SceneDefinitions, two headings, two ChartDefinitions, four SceneItems, two PathSteps and four unused ComparisonStages. Tests assert that no inbound or authored references remain. `ex:l4-scene-summary-gap`, `ex:l4-gap-chart` and `ex:l4-gap-heading` remain the consolidated entry; scientific resources, observation placements and optional probes are retained.

## Canonical resources

### New reusable science/example content

`ontology/dataset/level4-opening-comparison.trig`, named graph `graph/examples/level4-opening-comparison`:

- `ex:l4-opening-data-a`: 1, 3, 5, 7, 9 mg/L.
- `ex:l4-opening-data-b`: 2, 3, 4, 6, 10 mg/L.
- Ten individually identified observations, explicitly equally weighted and synthetic.
- Shared `StatisticalResult` resources: arithmetic mean 5 mg/L; sample variance 10 (mg/L)²; sample SD approximately 3.162277660168379 mg/L. A separate worked `MathExpression` retains exactly √10 mg/L; the finite stored decimal is explicitly approximate.
- Method-bound results for both medians, Q1, Q3 and IQR. For type 7, Q1 is **the same** (3 mg/L), Q3 is 7 versus 6 mg/L, IQR is 4 versus 3 mg/L, and the medians are 5 versus 4 mg/L. No claim that all quartiles differ.
- Worked verification: each sum is 25 and each sum of squared deviations is 40; the variance divisor is n−1=4.
- An interpretation resource describes observed symmetry/asymmetry without asserting population symmetry.

### Reused scientific resources

`ex:arithmetic-mean`, `ex:sample-variance`, `ex:sample-standard-deviation`, `ex:arithmetic-mean-formula`, `ex:sample-variance-formula`, `ex:sample-sd-formula`, and the existing English `ex:sd-definition-university-en`. The latter is reused rather than silently displaying the German-only basic definitions. Future-topic links reuse `ex:order-statistic`, `ex:sample-quantile`, `ex:quartile`, `ex:interquartile-range`, `ex:distribution-symmetry`, and `ex:empirical-central-moment`.

The accepted Level-4 scientific graph and QC dataset files are unchanged. The ECDF kernel, step geometry and threshold/tie/endpoint handling are preserved. Earlier scenes remain compiled and covered by regression tests, selected by scientific view/identity rather than assumed opening positions.

### Teaching and contracts

- `ontology/dataset/chemometrics-level4-opening.trig`: one heading/ChartDefinition/SceneDefinition, two ObservationSeries, ten placements, three ordered disclosures and three independent optional probes.
- `ontology/dataset/summary-comparison.trig`: generic stage/result/domain vocabulary and focused SHACL, including `cd:hasInvestigation` and `cd:allowSeriesOverlay`.
- `ObservationExplorerBlock` gains a `summary` view within the still-local additive 1.8 contract. Series carry explicit typed mean/variance/SD result references; stages carry authored labels, prompts, modes and provenance. The compiler rejects mismatched dataset/property/unit references.
- `packages/core/src/summary-comparison.ts`: pure rank, closed-interval and reflection calculations.
- `packages/renderer-d3/src/summary-comparison.ts`: generic staged horizontal comparison surface. It contains no example values, authored scientific definitions or scene-ID layout switches.
- `apps/pitch/src/summary-comparison.css`: projection-sized plots and concise controls, with separate light/dark series colors. There are no individual observation cards.

## Preview

```text
npm run preview:level4
```

- Dark: `http://127.0.0.1:5173/authoring.html?theme=dark&background=none`
- Light: `http://127.0.0.1:5173/authoring.html?theme=light&background=none`
- No-JavaScript content: `http://127.0.0.1:5173/authoring-static.html`

`npm run preview:level4:generate` regenerates only ignored preview transports, limited to **one** scene. It does not rewrite the normal course index. The isolated preview requires neither webR assets nor a poll service. The normal Overworld bundle was also refreshed with `npm --workspace @project-chemie-digital/pitch run generate:introduction`; enter via `http://127.0.0.1:5173/` and select Level 4.

## Focused verification

```text
python -m unittest discover -s tests -p test_level4_opening.py -v
python -m unittest discover -s tests -p test_level4_observation_iteration.py -v
node --experimental-strip-types --test packages/core/test/summary-comparison.test.ts packages/core/test/empirical-distribution.test.ts packages/core/test/observation-explorer.test.ts packages/renderer-d3/test/observation-explorer.test.ts apps/pitch/test/observation-projection.test.ts apps/pitch/test/presentation-step-runtime.test.ts
```

`tests/test_level4_opening.py` verifies authored data/results, method conventions, sources, single-scene selection, optional-probe contract, removal references, QC retention and only the relevant SHACL graphs. Focused results: opening 10 tests; observation/ECDF iteration 7; scientific graph 11; LearningPath 11 (full-project SHACL excluded); affected Node suites 39. No full `npm test` or external validation was run.

Browser acceptance: `scripts/check_level4_opening.cjs`, using externally installed Playwright/Edge. Set `PLAYWRIGHT_MODULE` when needed, optionally `SCREENSHOT_DIR` and `PREVIEW_URL`; set `CHECK_OVERWORLD=1` to verify the normal course entry. Checks cover hidden initial observations, three disclosures, persistent SVG/coordinates, overlay, arbitrary probe order, keyboard input, inclusive interval limits/invalid-input feedback, reflections, topic bridge, complete reset/back, modal/Escape, static output, light/dark and 1600×1000 projection bounds.

Screenshots are generated into `C:/Users/PCUser/AppData/Local/Temp/opencode/level4-consolidated-opening/`, not authored as a second content source: `opening-initial-dark.png`, `opening-expanded-dark.png`, `opening-expanded-light.png`, optional-probe captures and `opening-overview.png`.

## Review limits

The user should now review **this single consolidated scene only**. No subsequent quantile, ECDF, robustness or moment scene has been redesigned here. Physical-projector, screen-reader, touch-device and non-Edge audits remain outstanding. The numerical data/result assertions and browser checks are not evidence of pedagogical effectiveness. Stop here for joint visual/didactic acceptance.
