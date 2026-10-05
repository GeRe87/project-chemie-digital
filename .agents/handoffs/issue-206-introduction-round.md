# Issue #206 — Compact introduction-round prompt cards

## Decision

The previous five-region foundation-card composition was too dense for a spoken introduction round. The presentation scene now contains only:

```text
heading
three-entry DefinitionList
```

This structure selects the new generic `prompt-card-grid` renderer family. The rule is identity-free and depends only on block structure.

## Visible prompts

1. **BACKGROUND** — Chemistry · Water Science · Environmental Toxicology · other
2. **CHEMOMETRICS EXPERIENCE** — Linear regression · error propagation · multivariate methods · machine learning / AI · none yet
3. **PROGRAMMING** — Python · R · MATLAB · another language · no programming experience

The old banner, “four short prompts” foundation copy, goal card and takeaway are no longer authored for the presentation scene. The retained long-form exercise was aligned to the same three dimensions.

## Verification

```powershell
npm run check:semantics
npm run test:renderer-reveal
npm run test:pitch
python -m unittest tests.test_chemometrics_introduction -v
npm run pitch:intro
```
