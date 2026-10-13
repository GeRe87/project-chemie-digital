# Agent handoff

## Role

Frontend and Reveal Renderer Engineer.

## Issue

#272 — Add experiment sketches and an authored turbidity mean reference.
Branch: `agent/272-mean-experiment-sketches`, stacked on draft #271.
Draft PR: https://github.com/GeRe87/project-chemie-digital/pull/273
Feature commit: `673a5a0`.

## Completed

- Eight local original SVGs with transparent backgrounds, currentColor strokes/text, titles/descriptions and source-linked MediaAsset alternatives. Equal-distance journey sketch reused on case and R; three equal-volume batches below pumping task; nitrate/sensor/load/microplastic/site/reactor sketch in each corresponding discussion card.
- Explicit authored media parts project to existing GroupBlock children ordered prompt → media; prompt IDs, ExpectedResults, fallbacks and graph-source references remain. Generic composition treats the group as one prompt surface, preserving task-left/workbench-right and six-card 3×2 wide layout. Recursive static fallback preserves nested content/series labels; self-study uses its existing GroupBlock rendering.
- Owner approved recursive SVG URI discovery in `apps/pitch/src/main.ts` in the issue comment. No-network guard still accepts only explicitly authored same-origin SVG GETs; sanitizer remains unchanged. No URI inference, external artwork, custom interaction runtime or core contract added.
- Turbidity retains observed values/order 2.1, 2.3, 2.0, 2.2, 45.0 NTU. Sum 53.6 / 5 = 10.72 NTU with authored formula/legend; separate derived-reference Dataset provides two endpoints at days 1/5, both 10.72. Generic supplementary `dct:hasPart` Dataset projection reuses existing series array, never appends reference endpoints to measured observations.
- Secondary-series color/dash pattern and caption distinguish reference from observations. Formula/legend and table remain separate in the left evidence rail; chart on the right. Conclusion states strong upward influence of the extreme event without invalidation, discarding or claims about an unknown population mean.
- Preserve 33 scenes, seven executable R labs, all earlier scientific conditions/values and clean theory/footer selections. Active formula count increases from 22 to 23, with complete authored legends.

## Files or resources changed

- Exact Mean Values examples/scenes/path TriG, eight `apps/pitch/public/chemometrics/mean-values-*.svg` assets.
- Generic runtime generator (illustrated prompts/supplementary series/static groups), renderer composition, prompt/evidence styles, approved SVG URI discovery.
- Focused content/source/numerical/asset/composition/network-boundary tests, README and migration audit.
- This handoff and only System workflow state; generated Pitch/self-study HTML excluded/preserved, Chemometrics state unchanged.

## Verification

- [x] 48 focused Mean Values tests, including SHACL, unchanged observations/sequence, media-part/answer/provenance checks, eight asset-label/inertness checks and malformed supplementary endpoint rejection.
- [x] 52 composition and nine teaching-primitive tests, including opaque identity-independent illustrated prompt grid/task-column treatment, authored supporting evidence math and recursive explicit SVG discovery.
- [x] Production Vite build; existing large-chunk warning remains.
- [x] Actual 5173 overworld → Level 2, dark/light 1440×900, resized 390×844 after wide entry. Nine inline illustration placements with no prompt overflow, six illustrations inside 3×2 cards, distinct chart series colors and measured formula/table separation.
- [x] Seven R Run/Reset checks in both themes; zero page/KaTeX errors or code-output/glossary overlap. Journey times 10/50s, total60s, overall/harmonic3.333333m/s; pumping1/5/2min,3.75L/min.
- [x] Accessibility/privacy: prompt/media reading order, source references, SVG alternatives and math spoken forms retained; no tracking, new external requests, accounts or personal data.
- [x] Full `npm test` passed on feature commit `673a5a0f82535c6ae0f5a66a6f055dbd0ba0fc19`: 415 Python tests, 107 Reveal, 75 D3, 185 Pitch and 29 self-study app tests, plus all other phases and canonical generation/checks. Log: `C:/Users/PCUser/.local/share/opencode/shell/a3b85f872e73014280a9ca9a4796ccf73a107175/sh_13253972d001WH0lKK6fbSDe9J.out`. Subsequent handoff/state commit is audit-only; required external status must still target the exact current PR head.
- [x] Documentation updated.

Local evidence: `C:/Users/PCUser/AppData/Local/Temp/opencode/browser-tools/verify272.cjs`, `272-report.json`, `272-*.png`.

## Decisions and assumptions

- SVG numbers/units are illustrative labels verified against the authored case values, not a second observation store. Particle/tank icons do not imply actual particle counts, equal reactor volumes or a distribution/model not in RDF.
- Reference endpoints are explicitly derived chart coordinates, not new measurements. Chart uses exactly one primary Dataset; secondary series is a semantic part. The renderer never recognizes turbidity identity to compute an average.
- Generic formula-deck matching defers to data+chart evidence composition when both kinds exist, so a supporting sourced calculation remains in the evidence rail rather than turning the whole slide into a formula stack.

## Risks or unresolved questions

- Missing external exact-current-head validator evidence and compatible-main stack integration remain manager gates; local checks are not acceptance.
- Fresh portrait opening/scaling remains independent; narrow-after-wide screenshots do not establish a fix.
- Static speed SVG does not complete the separately pending quantitative river/tracer animation.
- #257 overlap serialized until this worker handoff. No Chemometrics state writes, self-acceptance or merge.

## Recommended manager action

Review exact draft result, source-linked reference and final full-test evidence. Keep draft until external exact-head/integration and independent reviews pass; do not infer acceptance from handoff.
