# Issue #203 — Chemometrics vector motifs

## Course organization
- TUESDAY: `visualMotif "discussion"`, `visualRole "highlight"`
- WEDNESDAY: `visualMotif "hands-on"`, `visualRole "highlight"`

The generic paired-card renderer therefore places a large vector motif between card heading and content.

## Course roadmap
The six DiagramNodes declare, in order:
`statistics`, `inference`, `regression`, `design-of-experiments`, `multivariate`, `machine-learning`.

No visualRole is needed on roadmap nodes: D3 information-card motifs default to supporting placement, avoiding propagation of a decorative role into semantic edge styling.

## Verification
```powershell
npm run check:semantics
npm run test:core
npm run test:renderer-d3
npm run test:pitch
python -m unittest tests.test_chemometrics_introduction -v
npm run pitch:intro
```
