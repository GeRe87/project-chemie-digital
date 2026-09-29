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
