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


## Browser follow-up: delayed lock activation

A browser smoke revealed that the first #188 lock activated too early: the staged slide was frozen before Reveal had finished positioning it in scroll view. This caused the entered slide to be partially visible and could disrupt subsequent navigation.

The follow-up changes the lifecycle to:

1. slide change immediately unlocks;
2. Reveal is allowed to position the newly entered slide normally;
3. two animation frames are awaited;
4. the final window + Reveal viewport scroll positions are captured;
5. only then is `pcd-stage-lock-active` enabled;
6. fragment changes restore that settled position;
7. leaving the slide unlocks immediately before the next slide is positioned.

The global `overflow:hidden` rule on body/Reveal viewport was removed. Only the staged slide itself remains overflow-clipped, and wheel/touch user scrolling is blocked after the lock becomes active.

Background progress now freezes only when `pcd-stage-lock-active` is actually active, so the background can move to the correct new-slide position before stage locking begins.

## Browser follow-up: layered marker strokes

The initial marker accent was rejected as too dark and blob-like.

The replacement uses:
- three independent horizontal gradient strokes for inline marker utilities;
- varying opacity along each stroke;
- slightly different angles and vertical offsets;
- no oval/border-radius blob;
- two irregular polygon-clipped layers for automatic KeyPoint highlights;
- deliberately lighter colour mixes to preserve text contrast.

Focused regressions now require:
- staged entry remains unlocked until two animation frames have settled;
- scroll is captured only after settling;
- slide exit unlocks immediately;
- global body/viewport overflow is not suppressed;
- marker utilities contain at least three gradient layers;
- automatic KeyPoint marker uses two polygon-clipped layers;
- no course/topic identity checks.


## Browser follow-up 2: restore full scroll-view deck

Fresh browser smoke after the settled-entry fix showed the staged slide itself was stable, but the Introduction appeared to contain only the title plus the case-study slide.

The authored Introduction remained correct at all times:
- six SceneDefinitions;
- six ordered PathSteps;
- six projected scene shapes covered by the Chemometrics Introduction regression.

The renderer regression was caused by a global CSS workaround:

`#pitch-slides > section:not(.present) { display: none !important; }`

Chemometrics defaults to Reveal `view: "scroll"`. Scroll view intentionally keeps all slides in the document flow, so hiding every non-`.present` section collapses the scroll deck/navigation.

The fix is generic:
- `body[data-presentation-view]` now exposes the resolved Reveal view;
- hard inactive-slide hiding is scoped to `body[data-presentation-view="deck"]` only;
- scroll view has no hard `.present` visibility override and remains under Reveal ownership.

This preserves the original reason for the workaround in classic deck mode: scene layout CSS may use `display:grid !important`, which must not surface inactive deck siblings.

## Browser follow-up 2: marker visibility

The previous pseudo-element marker strokes remained too weak and could visually cross the glyphs.

List rendering now wraps each semantic list item text in a neutral:

`<span class="pcd-list-item-text">…</span>`

The semantic list/item/provenance structure is unchanged.

Automatic lecture markers are applied directly as the span background, therefore always behind the glyphs. The marker now uses:
- three independent horizontal gradient layers;
- approximately 50–64% peak colour contribution in the main stroke;
- a 0.78em main marker band;
- different angle/direction, vertical position, length and opacity per layer;
- `box-decoration-break: clone` so multi-line statements receive marker strokes per line;
- no pseudo-element blob, no border radius and no clip-path oval.

The explicit `.pcd-marker-highlight` utility was strengthened in the same direction.

Regression coverage now asserts:
- inactive slide hiding is deck-view-only;
- main exports `data-presentation-view`;
- list text is wrapped in `.pcd-list-item-text`;
- automatic marker contains exactly three strong gradient layers behind the text;
- no legacy pseudo-element marker remains.


## Browser follow-up 3: fragment-first staged navigation

Fresh browser smoke confirmed the slide entry/exit regression was fixed, but the chart remained at stage 0. The root cause is architectural:

- Chemometrics uses Reveal `view: "scroll"`;
- Reveal scroll view normally advances fragments through its scroll/navigation path;
- staged slides deliberately block scrolling to keep their geometry fixed.

This creates a deadlock if staged navigation remains entirely scroll-driven.

The generic fix adds `mountPresentationStageNavigation()`.

While the current slide is structurally marked `data-stage-lock="true"`:

- forward keys (`ArrowRight`, `ArrowDown`, `PageDown`, Space) first inspect `deck.availableFragments()`;
- if `next` is available, the event is consumed and `deck.nextFragment()` is called;
- backward keys analogously use `prevFragment()`;
- Reveal navigation-control clicks (`.navigate-right`, `.navigate-down`, `.navigate-next` and reverse controls) use the same fragment-first policy;
- once no internal fragment remains, the event is **not consumed**, so Reveal performs normal slide navigation;
- at stage 0, backward navigation likewise falls through to the previous slide.

The listener runs in capture phase so scroll-view keyboard movement cannot occur before fragment navigation.

This preserves:
- the existing synthetic Reveal fragment model;
- the existing `mountPresentationStepRuntime()` event dispatch;
- D3/flow/knowledge-network listeners on `pcd-presentation-step`;
- settled-entry stage lock;
- normal slide navigation after the final stage.

Focused regressions cover:
- three internal stages consumed before slide movement;
- final forward key falls through;
- backward staged navigation;
- capture-phase keyboard interception;
- Reveal next-control click interception;
- no topic/scene/resource identity checks.


## Browser follow-up 4: terminal stage navigation

Browser smoke after fragment-first navigation showed a terminal loop:
- stages 0 → 1 → 2 → 3 worked;
- the next forward action fell back to Reveal scroll navigation;
- stage lock prevented the scroll transition from completing;
- Reveal reset synthetic fragment visibility, returning the same slide to stage 0.

The staged controller now owns the entire forward/back lifecycle for structurally staged slides:

- if a forward fragment exists → `deck.nextFragment()`;
- otherwise → `deck.next()`;
- if a backward fragment exists → `deck.prevFragment()`;
- otherwise → `deck.prev()`.

The originating keyboard/control event is consumed in all staged cases, so Reveal cannot run a second scroll-navigation path.

Non-staged slides are untouched.

Focused regressions require:
- internal stages are consumed first;
- final forward action calls exactly one explicit slide transition;
- initial backward action uses explicit previous-slide transition;
- keyboard and Reveal-control events remain consumed at the terminal stage;
- no topic/scene/resource identity checks.


## Browser follow-up 5: direct adjacent-slide navigation

The prior terminal fix used Reveal `next()/prev()`, but browser smoke showed those relative APIs still re-enter the staged fragment cycle in scroll view.

Reveal 5.2 exposes direct navigation via:
- `getSlides()`
- `getIndices(targetSlide)`
- `slide(h, v, f)`

The staged controller now uses those APIs at terminal boundaries.

Forward:
1. internal fragments still use `nextFragment()`;
2. when no next fragment remains, find the next linear DOM slide via `getSlides()`;
3. resolve its Reveal coordinates with `getIndices(target)`;
4. call `slide(h, v, -1)` to enter that slide before its fragments.

Backward:
1. internal fragments still use `prevFragment()`;
2. at stage 0, find the previous linear slide;
3. call `slide(h, v, lastFragmentIndex)` so backwards navigation lands at the previous slide's final fragment state when it has fragments.

No relative `next()/prev()` remains in staged terminal navigation.

Regression coverage asserts:
- stage 0 → 1 → 2 → 3 stays fragment-local;
- the next action invokes exactly `slide(1, 0, -1)`;
- backwards terminal navigation targets the previous slide's final fragment index;
- keyboard and Reveal-control paths use the same direct terminal navigation.


## Browser follow-up 6: unlock on Reveal beforeslidechange

Browser smoke showed that direct `slide(h,v,f)` removed the fragment loop but still could not leave the staged slide.

Reveal 5.2 dispatches `beforeslidechange` synchronously before scroll-view `scrollToSlide(...)`. The outgoing stage lock was still active until `slidechanged`, so fragment/scroll restoration could pull the viewport back before the programmatic transition completed.

The stage lock now subscribes to Reveal's own `beforeslidechange` lifecycle and calls `unlock()` there.

Resulting terminal lifecycle:

1. staged navigation exhausts internal fragments;
2. direct target slide coordinates are resolved;
3. `deck.slide(h,v,f)` is invoked;
4. Reveal emits `beforeslidechange`;
5. stage lock is synchronously released;
6. Reveal scroll view can move to the target slide without old-position restoration;
7. after arrival, `slidechanged` runs and any newly staged target slide is relocked only after the existing two-frame settle period.

The earlier custom DOM exit signal was removed; Reveal's lifecycle event is now the single canonical unlock boundary.

Regression coverage requires:
- `beforeslidechange` listener registration;
- synchronous lock removal before the slide transition proceeds;
- listener teardown;
- direct `slide(...)` terminal navigation remains;
- no relative `next()/prev()` or custom exit event remains.
