# Issue #200 — Space-filling long linear flows

## Role

`Presentation System Worker`

## Generic trigger

A flow selects `space-filling-flow` only when:
- it is a strict directed chain;
- it contains at least five nodes;
- the presentation host is wide;
- the normal horizontal intrinsic card width would exceed 108% of the host width.

Narrow/mobile hosts retain the existing vertical layered flow.

## Geometry

The renderer:
1. derives chain order from topology;
2. chooses the smallest power-of-two Hilbert grid that can contain the nodes;
3. samples node positions across the full Hilbert index range;
4. keeps cards at least 220px wide;
5. routes each semantic edge through its corresponding Hilbert subpath;
6. stores those orthogonal route points in the renderer-only layout model.

No RDF coordinates or presentation hints are authored.

## Visual grammar

`space-filling-flow` nodes use a renderer-owned information-card grammar:
- deterministic hue from canonical reading index;
- colored card face/stroke/shadow;
- title/body hierarchy;
- compact top-right sequence number;
- technical rail/status chrome removed for this strategy.

## Verification

```powershell
npm run test:renderer-d3
npm run test:pitch
```

The existing Chemometrics roadmap is already a strict six-node chain, so #201 should require no scientific RDF mutation if browser verification confirms the generic trigger behaves as intended.
