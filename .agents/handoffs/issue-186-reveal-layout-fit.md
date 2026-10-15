# Issue #186 handoff — generic Reveal layout fit

## Role

`Frontend and Reveal Renderer Engineer`

## Context

Issue #186 was created from browser feedback on #184 / PR #185. The dense case-study slide demonstrated that layout-family inference alone is insufficient when mixed evidence (media + table + chart + discussion) must fit a fixed 1440×900 presentation viewport.

The solution is generic and renderer-owned. No Chemometrics, nitrate, scene-id or resource-id knowledge is used.

## Architecture

### Stage 1 — existing layout family inference

`packages/renderer-reveal/src/layout-policy.ts`

Still decides only the renderer-neutral family and semantic slots.

For the worked example:

`case-study`

with slots:

1. heading
2. problem
3. data
4. analysis
5. discussion
6. takeaway

### Stage 2 — new fit inference

`packages/renderer-reveal/src/layout-fit.ts`

Deterministically estimates block footprint from validated SceneDocument content:

- prose length;
- list item count/text;
- definition-list count/text;
- table rows, columns and cell text;
- chart type/data count/labels;
- media presence/alternative text;
- group child footprints;
- diagrams/prompts/code/math.

The fit output contains:

- `family`
- `variant`
- `density`
- total/evidence score
- per-block footprint details

## Case-study variants

- `balanced`
- `evidence-right`
- `stacked`

Selection is based on the evidence share and table footprint.

The current nitrate case selects `evidence-right`.

Large tables / high total footprint select `stacked`.

## Density

- `comfortable`
- `dense`
- `compact`

The current nitrate case falls into `dense`.

Adaptive density is deliberately enabled only for `case-study` in this issue. Existing layout families receive `default / comfortable` so #186 cannot silently restyle established presentations. The fit framework can be adopted by additional families later.

## DOM contract

`apps/pitch/src/preview.ts` now emits, for structurally inferred layouts:

- `data-layout`
- `data-layout-variant`
- `data-layout-density`

Density is also propagated to block hosts and nested group children.

## Case-study CSS

`apps/pitch/src/case-study-layout.css` is now variant/density aware.

Important generic behavior:

- every grid child is `min-width: 0` / bounded to the slide;
- evidence-right allocates more width to table/chart;
- stacked stops squeezing high-footprint evidence into three columns;
- table uses fixed layout and readable density-specific typography;
- chart host is forced to the actual slot width instead of the global full-slide chart width;
- discussion remains a three-column summary where space permits;
- narrow viewports stack vertically.

The screenshot overflow root cause was the generic chart window width (`min(1120px, 92vw)`) being used inside a much narrower grid slot. The case-study scope now overrides this to the slot width.

## Chart density

The fit density is forwarded through `apps/pitch/src/chart-runtime.ts` to renderer-d3.

`packages/renderer-d3/src/bar-chart.ts` now exposes `barChartGeometryForDensity()` and uses density-specific:

- minimum width;
- minimum height;
- aspect ratio;
- plot margins.

This reduces chrome/margins before shrinking the data display.

Other chart layouts stay `comfortable` unless a future layout family explicitly adopts adaptive density.

## Regressions

Added/updated:

- `packages/renderer-reveal/test/layout-fit.test.ts`
  - footprint ordering;
  - evidence-right/dense;
  - balanced;
  - stacked/compact;
  - identity independence.
- `packages/renderer-reveal/test/layout-policy.test.ts`
  - generic case-study family inference.
- `apps/pitch/test/preview.test.ts`
  - DOM variant/density markers.
- `apps/pitch/test/chart-density.test.ts`
  - density forwarding to renderer-d3.
- `packages/renderer-d3/test/bar-chart.test.ts`
  - density geometry reduces margins/minimum dimensions.
- `tests/test_chemometrics_introduction.py`
  - media-aware worked-example structure remains canonical.

## Identity boundary

Static review confirms no occurrence of:

- `chemometrics`
- `nitrate`
- Chemometrics scene IDs
- Chemometrics resource IDs

inside the fit policy, case-study layout policy, density propagation or chart-density implementation.

## Local verification required

Focused:

```powershell
npm run test:renderer-reveal
npm run test:renderer-d3
npm run test:pitch
python -m unittest tests.test_chemometrics_introduction -v
```

Visual:

```powershell
npm run pitch:intro
```

At 1440×900 / normal desktop presentation view verify:

- no horizontal overflow;
- table values readable from presentation distance;
- chart stays inside its evidence slot;
- plot uses most of the chart window rather than a tiny center region;
- problem illustration remains large enough to read A/B/C;
- discussion cards are readable;
- all content remains on one slide.

Then run full `npm test` before final manager acceptance.
