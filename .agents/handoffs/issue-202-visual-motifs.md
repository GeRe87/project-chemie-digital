# Issue #202 — Semantic vector motifs

## Generic contract
`cd:visualMotif` is a controlled string attribute with eight initial keys: discussion, hands-on, statistics, inference, regression, design-of-experiments, multivariate and machine-learning.

DefinitionListEntry supports `visualMotif` plus `visualRole = supporting|highlight`. DiagramNode supports `visualMotif` and continues to use its generic visualRole token.

## Rendering
- HTML definition cards render vector motifs through CSS SVG masks; highlight motifs sit between heading and content, supporting motifs occupy the upper-right.
- D3 space-filling information cards render the same semantic motifs as native SVG path geometry; supporting motifs sit below the card index in the upper-right.
- No external assets, icon fonts, emoji, scene ids or topic identities are inspected.

## Handoff
Run:
```powershell
npm run check:semantics
npm run test:core
npm run test:renderer-d3
npm run test:pitch
```
Then #203 may author motif keys in Chemometrics TriG.

## Motif-role separation refinement

`visualRole` already carries graph-level visual semantics and may propagate from equal endpoint roles to edges. Icon placement is therefore now represented separately as `cd:visualMotifRole = supporting|highlight`. D3 highlight motifs reserve actual card height and render in the generic order **title → divider → large centered motif → body**. Supporting motifs remain compact in the upper-right.
