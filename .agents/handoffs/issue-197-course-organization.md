# Issue #197 — Chemometrics course organization

## Role

`Semantic Web and Ontology Engineer / Chemometrics Content Worker`

## Result

Slide 4 now communicates two weekly teaching modes:

1. **Interactive Lecture + Seminar** — one day
   - theory inputs
   - group discussion
   - worked examples
   - questions

2. **Hands-on Tutorial** — another day
   - principles
   - problem solving
   - calculations
   - programming

The semantic edge `deepen & apply` links the interactive session to the tutorial.

The slide explicitly states:

```text
PROGRAMMING IS A TOOL — THE FOCUS IS STATISTICAL AND CHEMOMETRIC REASONING
```

This prevents the tutorial from being framed as primarily a coding class.

The obsolete unrendered four-format DefinitionList resources were removed. No scene structure or renderer identity special case was added.

## Verification

```powershell
npm run test:renderer-reveal
npm run test:pitch
python -m unittest tests.test_chemometrics_introduction -v
npm run pitch:intro
```
