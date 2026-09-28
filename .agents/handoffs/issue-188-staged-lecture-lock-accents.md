# Issue #188 handoff — staged lecture lock and accent styling

## Role

`Frontend and Reveal Renderer Engineer`

## Goal

Browser review after #187 identified three presentation-system requirements:

1. multi-stage slides must remain fixed in place while their stages evolve;
2. analysis/chart regions should use more of the available vertical lecture canvas;
3. lecture slides need richer generic colour and reusable marker-style emphasis.

All changes are structural/theme-driven. No Chemometrics, nitrate, scene-id or resource-id checks are present.

## Staged-slide lock

### Structural detection

`preparePresentationStepFragments()` already discovers all hosts with:

`data-presentation-step-count`

Those slides are now marked generically with:

- `data-has-stages="true"`
- `data-stage-lock="true"`

via the exported helper `markStageLockedSlide()`.

### Runtime lock

New `mountPresentationStageLock()`:

- activates only while the current Reveal slide has `data-stage-lock="true"`;
- adds `body.pcd-stage-lock-active`;
- captures window + Reveal viewport scroll positions;
- blocks `wheel` and `touchmove` with non-passive listeners;
- restores the captured scroll position immediately and on the next animation frame after `fragmentshown` / `fragmenthidden`;
- removes all listeners and classes on teardown.

Keyboard/Reveal fragment navigation is not blocked.

### CSS lock

`presentation-step-runtime.css` now:

- disables overflow on the active scroll container while staged;
- uses stable scrollbar gutter to avoid horizontal jumps;
- disables overscroll/touch panning;
- fixes staged scene overflow;
- keeps synthetic step fragments absolutely positioned and layout-neutral.

### Background / scroll transition lock

`main.ts` uses the same generic `isStageLockedSlide()` predicate to:

- activate the existing no-scroll-transition path for staged slides;
- freeze background-progress updates while a staged slide is current.

Thus the slide itself, viewport scroll position and parallax world remain stable while internal stages change.

## Larger lecture analysis area

The lecture case-study chart height is now:

`clamp(30rem, 60vh, 34rem)`

This replaces the former 20rem lecture override and uses substantially more of the available analysis region while preserving the lecture readability floor.

## Generic lecture accent palette

`lecture-readability.css` now defines:

- `--pcd-lecture-yellow`
- `--pcd-lecture-cyan`
- `--pcd-lecture-pink`
- `--pcd-lecture-green`

The palette is used generically for:

- key-point lists;
- definition-list cards;
- case-study problem/data/analysis regions;
- case-study discussion blocks;
- evidence-table row accents.

The existing D3 bar chart already cycles generic chart-series colours, so no content-specific series styling was added.

## Marker-style emphasis

Reusable projection-safe utilities:

- `.pcd-marker-highlight`
- `.pcd-marker-highlight--yellow`
- `.pcd-marker-highlight--cyan`
- `.pcd-marker-highlight--pink`
- `.pcd-marker-highlight--green`

The effect uses a translucent angled CSS gradient/highlighter stroke and can be applied to any inline phrase independent of scientific topic.

In addition, lecture `.keypoint-list > li` elements receive a subtle alternating marker stroke automatically, so current semantic KeyPoint content benefits without new content markup.

## Tests

Updated:
- `apps/pitch/test/presentation-step-runtime.test.ts`
  - structural stage marking;
  - staged predicate;
  - wheel prevention;
  - scroll restoration;
  - fragment restoration;
  - non-staged slides remain unaffected.

Added:
- `apps/pitch/test/lecture-stage-style.test.ts`
  - four-colour marker palette;
  - hand-marker CSS contract;
  - enlarged chart-height contract;
  - staged CSS scroll lock;
  - structural main/runtime freeze hooks;
  - no identity-specific implementation.

## Static review

Verified:
- PR remains mergeable;
- branch is 0 behind main;
- transition history remains at max 25;
- no `chemometrics`, `nitrate`, Chemometrics scene id or resource id appears in stage-lock or lecture-accent implementation.

## Local verification required

Focused:

```powershell
npm run test:pitch
npm run test:renderer-reveal
npm run test:renderer-d3
python -m unittest tests.test_chemometrics_introduction -v
```

Visual:

```powershell
npm run pitch:intro
```

Check on a slide with chart stages:

- the slide/viewport does not move during stage changes;
- wheel/touch scrolling is blocked while the staged slide is current;
- background does not move while stages change;
- chart uses more vertical height;
- lecture accents/marker strokes are visible but do not compromise readability.

Then run full `npm test`.
