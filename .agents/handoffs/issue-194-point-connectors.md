# Issue #194 — Generic ordered point connectors

## Role

`Presentation System Worker`

## Implementation

The existing adaptive spacer between authored DefinitionList points remains the only spacing primitive. In the generic `labeled-card-grid` realization, that spacer now displays a centered downward relation connector via CSS pseudo-content.

The connector is renderer-owned presentation:
- no arrow character is authored in RDF;
- no scene/resource/topic/person selector exists;
- browser wrapping inside a point still creates no connector;
- one-point descriptions still create no spacer/connector;
- adaptive spacer growth remains capped by the existing `2.5lh` rule.

## Verification handoff

```powershell
npm run test:pitch
npm run pitch:intro
```

Browser acceptance should confirm that short authored points read as connected chains while wrapped lines within each point remain grouped.

## Visual refinement after owner browser review

The original connector used the font glyph `↓`, which rendered too thin at lecture distance. The generic spacer pseudo-element now draws a filled downward CSS triangle using transparent side borders and a `.74rem` colored top border. This keeps the connector independent of font rendering and makes it more legible without changing the point-order or adaptive-spacing semantics.

## Dashed-line refinement after owner browser review

The filled triangle was clearer than the font glyph but still read as a floating marker. The generic labeled-card spacer now draws a centered dashed vertical relation line across the available gap and overlays the filled triangle at the midpoint. The spacer still owns the adaptive min/max height, so the line stretches with available space while wrapped lines inside a logical point remain untouched.
