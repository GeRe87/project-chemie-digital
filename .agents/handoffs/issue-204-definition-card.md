# Issue #204 — Generic definition card

## Decision

No new learning-resource class was required. The repository already has `cd:Definition`, `cd:Source`, `cd:DefinitionWithCitation`, and the Heading/Quotation/Citation communicative roles.

The renderer now infers `definition-card` from the identity-free SceneDocument signature:

```text
prose introduce
prose explain
prose emphasize
```

The definition and citation remain independent provenance-bearing prose blocks; CSS composes them into one centered visual card.

## Verification

```powershell
npm run test:renderer-reveal
npm run test:pitch
```
