# Issue #213 — Cross-level navigation / sentinel ownership

Browser testing showed a Level 1 Start action briefly displaying the previously current Introduction deck state and then immediately returning to the overworld.

## Cause

The course-world controller treated every synthetic return sentinel as globally authoritative. A cross-level `deck.slide(...)` can emit an intermediate/stale `slidechanged` state from the previously active document. Without active-level identity, an Introduction sentinel could close a Level 1 jump.

The deck was also made visible before the jump was confirmed, causing a one-frame flash of the previous level.

## Fix

- track `activeDocumentId` in the course-world controller;
- only return to the overworld when a sentinel belongs to that active document;
- keep `.pcd-course-world-active` in force while Reveal navigates, so the deck remains visually hidden;
- verify `deck.getCurrentSlide() === requestedFirstSlide` before hiding the overworld;
- clear the active document whenever the overworld becomes active.

No course/path identity is hardcoded.

## Verify

```powershell
npm run test:pitch
npm run pitch:intro
```

Browser:
`Overworld → Region 2 → Level 1 Variables and Constants` must open directly, without an Introduction flash or immediate map return.
