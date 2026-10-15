# Issue #214 — Event-driven course level opening

## Observed failure

Level 1 target resolution succeeded, but the controller immediately failed because `getCurrentSlide()` did not yet equal the target after `deck.slide(...)`.

This was a false failure caused by treating Reveal navigation as synchronous. In scroll mode the current slide can update only after the scroll transition settles.

## Lifecycle

Starting a level now creates pending state:

- pending SceneDocument id
- exact first authored slide
- originating Start control

The Reveal deck is made measurable but remains visually hidden behind the overworld. Keyboard navigation remains disabled. The controller issues `deck.slide(...)` and does **not** fail if `getCurrentSlide()` is still the previous slide.

Completion happens when:
- normal mode already reports the exact target immediately, or
- `slidechanged` later reports that exact target.

Only then:
- pending → active SceneDocument
- overworld hides
- Reveal becomes visible
- keyboard is enabled
- focus moves to the first authored slide

All sentinels are ignored while a level open is pending.

## Verify

```powershell
npm run test:pitch
npm run pitch:intro
```

Then verify Level 0 and Region 2 Level 1 starts, followed by Level 1 Complete → Overworld.
