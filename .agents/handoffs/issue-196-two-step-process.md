# Issue #196 — Generic two-step process diagrams

## Role

`Presentation System Worker`

## Change

The existing structural `process-diagram` inference now accepts any linear flow with at least two nodes:

```text
heading + explanatory prose + linear flow (>=2 nodes) + takeaway
→ process-diagram
```

The dedicated `hierarchy-flow` rule is evaluated first and still recognizes exactly three-node linear hierarchies. Existing four-node and sequence process scenes remain unchanged.

No label, scene id, resource id or Chemometrics identity is inspected.

## Verification

```powershell
npm run test:renderer-reveal
```
