# Issue #210 — Fix Pitch overworld Start-level navigation

Owner browser smoke found that the course overworld rendered but its Start controls did not open the presentation.

## Repair

The controller no longer assumes raw DOM-child position equals Reveal's horizontal slide index. It resolves the exact first authored slide through Reveal's public `getIndices(slide)` contract and uses those `h/v/f` coordinates for navigation.

The transition now:
1. resolves the bound authored slide;
2. makes the Reveal deck measurable;
3. enables Reveal keyboard handling;
4. navigates via Reveal-owned indices;
5. lays out the deck;
6. hides the overworld.

World controls use one delegated click listener. Remaining navigation failures are rendered visibly in the overworld through an aria-live status instead of appearing only in DevTools.

World `hidden` behavior is also explicit in CSS.

## Verification

```powershell
npm run test:pitch
npm run pitch:intro
```

Browser:
`Overworld → Start Level 0 → Introduction → final authored slide → Level complete → Next → Overworld`.
