# Level 4 — local authoring iteration A

**Historical snapshot:** The didactic opening was subsequently replaced by the [three-scene opening review](chemometrics-level4-opening-review.md). Its preview commands now open those three scenes. The ECDF/QC resources, calculation kernel and regression tests described here remain intact; positional references and the former four-scene browser script are not the current review entry point.

Implemented on `work/level4-authoring`, based on `811d09badfb6eb23e1dcb064d4a7e0f326d22a21`.
This is local content development, not a release, PR or external-validation result.

## Implemented teaching block

1. **One measurement changes. What changes with it?** Reveal the modified synthetic QC series, compare observations on one shared concentration scale, and predict which summaries might change. No summary results are shown.
2. **Keep every observation—then sort.** Select an observation and follow its identity from a deliberately permuted display position into the ordered sample. Tied measurements remain independent observations; tie ordering is stable, not an average-rank convention.
3. **How many measurements are at or below x?** Change the inclusive threshold with a slider or numeric input. The highlighted observations, exact count/total and rounded fraction/percentage update together. At 4 mg/L both observations equal to 4 enter together, changing 1/7 to 3/7. Reset restores 3.9 mg/L.
4. **The ECDF records those counts.** The same counting interaction drives a dedicated right-continuous step plot. Open points show excluded left limits; filled points show the function value. Dashed jump guides are not interpolated function values. Definition and formula appear only on request, in an accessible native dialog.

The active path now contains **16 scenes**: these four replace the previous three introductory selections; the remaining 12 existing scenes are preserved. Their later redesign is not part of this iteration. Retired introductory SceneDefinitions remain available for reuse. The authoring preview intentionally selects only the first four scenes; that limit is disposable preview configuration, not a second authored LearningPath.

## Semantic ownership

- Unchanged scientific sources: `ontology/dataset/level4-statistical-knowledge.trig` and `ontology/dataset/level4-synthetic-qc-example.trig`.
- Reused identities: `ex:l4-qc-reference`, `ex:l4-qc-extreme`, all their observations, `ex:order-statistic`, `ex:empirical-cdf`, `ex:l4-def-empirical-cdf`, `ex:l4-formula-empirical-cdf`.
- New teaching resources: `ontology/dataset/chemometrics-level4-observation-scenes.trig`. Four narrative headings, four ChartDefinitions, two ObservationSeries and explicit ObservationPlacements. The placements select existing observations; they do not duplicate measurements, assert acquisition order or store sorted results.
- Path selection: `ontology/dataset/chemometrics-level4-path.trig`.
- Generic vocabulary/SHACL: `ontology/dataset/observation-explorer.trig`, with an additive chart-kind branch in `shapes.trig`.

The available CDAC servers previously reported a different SHA/worktree. This iteration therefore uses the local canonical TriG Dataset; it does not treat that stale MCP snapshot as evidence.

## Technical contract

SceneDocument **1.8** adds `chartType: "observations"`, with `compare`, `order`, `count` and `ecdf` views. Each series retains dataset, observation and named-graph provenance. Authored controls specify a numeric domain, initial threshold and slider increment; the numeric field also permits intermediate thresholds. The 0–8 mg/L domain deliberately covers both tails of the reference sample. Neither view uses the ordinary line-chart contract.

`packages/core/src/empirical-distribution.ts` owns deterministic sorting, inclusive cumulative counts and tie-grouped ECDF jumps. It has no DOM or renderer dependencies. The renderer derives only geometry and ephemeral interaction state; no changed measurements, learner responses or thresholds are written into RDF or persisted.

`packages/renderer-d3/src/observation-explorer.ts` mounts the generic views. Pitch protects marked interactive regions from deck key/wheel/swipe interception. Explorer-containing presentations use native-size portrait controls, including after resizing. A bounded, internally scrollable chart surface preserves readable type on short/narrow viewports. The ECDF geometry responds to its actual container width.

Light/dark styling uses existing tokens. Highlighting includes a check mark, not color alone. Data descriptions, individual identities, jump limits and the initial count are available as text. Static Python, Reveal and self-study adapters retain the scientific content; their fallback is textual rather than an interactive explorer. No R/webR assets or poll service are required by this block.

## Open locally

```text
npm ci
npm run preview:level4
```

Open:

- `http://127.0.0.1:5173/authoring.html?theme=dark&background=none`
- `http://127.0.0.1:5173/authoring.html?theme=light&background=none`
- `http://127.0.0.1:5173/authoring-static.html`

Use Previous/Next or scroll outside the interaction to change scenes. Scroll **inside** the bordered chart surface when content exceeds its available height. Tab reaches controls and observation buttons; slider arrow keys change the threshold. The formula dialog closes with Close or Escape and returns focus to its invoker.

The command generates only ignored `authoring-runtime.json` and `authoring-static.html`, then starts Vite. It does not rewrite the ordinary course index or default runtime. Regenerate after TriG edits with `npm run preview:level4:generate`; TypeScript/CSS use Vite's normal refresh.

## Focused verification

```text
npm run preview:level4:generate
python -m unittest discover -s tests -p test_level4_observation_iteration.py -v
python -m unittest discover -s tests -p test_level4_graph.py -v
node --experimental-strip-types --test packages/core/test/empirical-distribution.test.ts packages/core/test/observation-explorer.test.ts packages/renderer-d3/test/observation-explorer.test.ts apps/pitch/test/observation-projection.test.ts apps/pitch/test/presentation-step-runtime.test.ts apps/pitch/test/live-chart-runtime.test.ts
```

The new Python tests validate only the new explorer SHACL graph, not all project shapes. Existing LearningPath tests can be run without `test_canonical_shacl_is_conformant` for bounded projection regression. No full `npm test` or external validator was run.

Browser acceptance is reproducible with `scripts/check_observation_preview.cjs` (Edge + externally installed Playwright). Set `PLAYWRIGHT_MODULE` to its module path if it is not on Node's resolution path. Optional `SCREENSHOT_DIR` saves seven screenshots; `PREVIEW_URL` defaults to `http://127.0.0.1:5173`.

Verified in headless Edge at 1440×1000 and 390×844: reveal/reset, stable sorting and identity, exact ties/tails, invalid-input feedback, keyboard slider, ECDF endpoints, formula disclosure/Escape, light/dark, portrait control sizes, static fallback and absence of page errors.

## Remaining boundaries

- On phones and shorter projection windows, use the chart's internal scroll area; not all controls, observations and explanations fit simultaneously without shrinking text.
- Automated browser checks are not a complete screen-reader or real-touch-device audit. Other browsers and physical projectors remain to be reviewed.
- The ordinary self-study/static output preserves content but does not yet mount this explorer interactively.
- This block does not include the later quantile-method scenes, boxplots, R graphics or a distribution generator. No scientific summary result is revealed in the opening scene.
