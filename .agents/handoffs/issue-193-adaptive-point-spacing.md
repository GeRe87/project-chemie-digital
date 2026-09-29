# Issue #193 — Adaptive inter-point spacing

## Role

`Presentation System Worker`

## Generic rule

For multiline `DefinitionListEntry.description` values, the Pitch renderer now treats each explicit non-empty authored line as one logical point.

Rendered structure:

```text
definition-list-description
└─ definition-list-points
   ├─ definition-list-point
   ├─ definition-list-point-spacer
   ├─ definition-list-point
   ├─ definition-list-point-spacer
   └─ definition-list-point
```

Only the neutral spacer elements flex. Browser word wrapping stays inside a point and therefore cannot create additional separation.

## Spacing contract

```css
--pcd-point-gap-min: .6lh;
--pcd-point-gap-max: 2.5lh;
```

Each separator has `flex-grow: 1`, a minimum of `.6lh`, and a maximum of `2.5lh`. A layout can provide spare vertical height; once the cap is reached, any further space is not injected between points.

The generic `labeled-card-grid` opts its description region into consuming spare card height. No authored spacing metadata is added to RDF.

## Scope boundary

No Chemometrics content, lecturer resource, scene id, resource id, or topic-specific style was added. Single-line descriptions retain their existing direct text rendering.

## Verification handoff

```powershell
npm run test:pitch
npm run test:renderer-reveal
python -m unittest tests.test_chemometrics_introduction -v
npm run pitch:intro
```

Browser acceptance:
- wrapped lines within one Background/Teaching/Research point remain visually grouped;
- separate authored points gain additional vertical separation;
- gaps stop growing before they become visually excessive;
- no projection toggle returns;
- nitrate staged case study remains unchanged.

## Bounded syntax correction

A connector-side source review after the initial commit caught two representation mistakes before owner verification: the newline regex had been over-escaped and multiline TypeScript fixtures had been emitted as quoted strings. The follow-up restores `/\r?\n/u` and uses template literals in the test fixture. No spacing behavior or architecture changed.

## Owner-local regression follow-up

The first owner-local `npm run test:pitch` run failed only because the new synthetic DefinitionList preview fixture inherited a pre-1.4 SceneDocument version. The fixture now sets `version: "1.4"`, matching the minimum DefinitionList contract. Production code, CSS and authored content are unchanged by this correction.
