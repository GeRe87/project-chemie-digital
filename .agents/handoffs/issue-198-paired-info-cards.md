# Issue #198 — Generic paired information cards

## Role

`Presentation System Worker`

## Structural contract

```text
heading + explanatory prose + two-entry DefinitionList + takeaway
→ paired-info-cards
```

The layout is inferred only from validated block kinds, intent and cardinality.

## Visual grammar

- two equal-width information cards;
- DefinitionList term is the card heading;
- authored point 0 is styled as compact metadata;
- authored point 1 is a strong mode/subheading;
- authored point 2 is supporting detail;
- inter-point spacers remain simple spacing, with no process arrows;
- renderer-provided definition-entry hues remain the only per-card visual variation;
- mobile fallback stacks the cards.

No scene, resource, course or lecturer identity is inspected.

## Verification

```powershell
npm run test:renderer-reveal
npm run test:pitch
```

## Optional takeaway refinement

Owner review established that a paired information-card scene does not inherently need a takeaway. The generic structural contract now accepts both `heading + intro + cards` and `heading + intro + cards + takeaway`. CSS no longer reserves an empty fourth track when the takeaway is absent.
