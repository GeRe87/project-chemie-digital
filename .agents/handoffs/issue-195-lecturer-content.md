# Issue #195 — Lecturer content refinement

## Role

`Semantic Web and Ontology Engineer / Chemometrics Content Worker`

## Content changes

The accepted three-entry DefinitionList remains unchanged structurally.

### Background
- B.Sc. Chemistry & Biotechnology · 2012
- M.Sc. Applied Chemistry · Instrumental Analytics · 2015
- Dr. rer. nat. · Instrumental Analytical Chemistry · 2020

### Teaching
- Chemometrics & Applied Statistics
- UDE · since 2020
- B.Sc. + M.Sc. teaching

### Research
- Instrumental Analytical Chemistry
- Junior Research Group “Analytical Data Science”
- Chemometrics · data workflows · machine learning

The Research order is intentionally authored from organizational context to group to topics. Generic connector rendering from #194 visualizes that order; no arrow character or presentation metadata is authored in the Chemometrics TriG.

No unexplained `ADS` or `IAC` abbreviations are used.

## Verification handoff

```powershell
npm run test:pitch
python -m unittest tests.test_chemometrics_introduction -v
npm run pitch:intro
```
