# Issue #201 — Chemometrics roadmap adoption

## Role

`Semantic Web and Ontology Engineer / Chemometrics Content Worker`

## Audit result

No Chemometrics content mutation is required.

The existing roadmap is already exactly the generic semantic structure required by #200:
- `cd:FlowDiagram`;
- six ordered nodes;
- five directed edges;
- one strict linear chain;
- labels and descriptions authored semantically;
- no coordinates or layout metadata.

At lecture width, the renderer-derived intrinsic one-row width exceeds the readability threshold, so the generic D3 layout selects `space-filling-flow`. On narrow/mobile hosts it falls back to the existing vertical layered flow.

## Existing semantic progression

1. Statistical Foundations
2. Inference
3. Regression + Uncertainty
4. Design of Experiments
5. Multivariate Analysis
6. Machine Learning

The `builds on` relations remain unchanged.

## Verification

```powershell
npm run test:renderer-d3
npm run test:pitch
python -m unittest tests.test_chemometrics_introduction -v
npm run pitch:intro
```

Browser acceptance is the remaining gate for #201.
