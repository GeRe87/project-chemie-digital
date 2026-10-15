# Issue #205 — Chemometrics definition slide

The introduction path now has seven scenes. The new second scene uses `cd:DefinitionWithCitation`:

- heading: **What is chemometrics?**
- definition: an instructional paraphrase of the IUPAC Gold Book definition
- source: **IUPAC Gold Book · chemometrics · DOI 10.1351/goldbook.CT06948**

The Definition is linked to the Source with `cd:hasSource`; the Source reciprocally records `cd:supportsResource`.

## Verification

```powershell
npm run check:semantics
npm run test:renderer-reveal
npm run test:pitch
python -m unittest tests.test_chemometrics_introduction -v
npm run pitch:intro
```
