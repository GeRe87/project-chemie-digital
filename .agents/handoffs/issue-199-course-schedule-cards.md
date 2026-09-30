# Issue #199 — Tuesday / Wednesday course organization

## Role

`Semantic Web and Ontology Engineer / Chemometrics Content Worker`

## Result

Slide 4 no longer presents course organization as a process flow. It uses the generic paired information-card structure from #198.

### Tuesday
```text
8.00 - 10.00 · S05 V02 E28
Interactive lecture + seminar
Theory inputs · group discussion · worked examples · questions
```

### Wednesday
```text
8.00 - 10.00 · S05 V02 E28
Hands-on tutorial
Principles · problem solving · calculations · programming
```

The banner explicitly states that Tuesday combines lecture and seminar and Wednesday is the tutorial. Time and room are placeholders as requested.

The takeaway remains:

```text
PROGRAMMING IS A TOOL — THE FOCUS IS STATISTICAL AND CHEMOMETRIC REASONING
```

The obsolete course-organization FlowDiagram was removed from canonical content; the scene now selects a two-entry DefinitionList through the existing DefinitionListRole.

## Verification

```powershell
npm run test:renderer-reveal
npm run test:pitch
python -m unittest tests.test_chemometrics_introduction -v
npm run pitch:intro
```

## Footer removal after owner review

The footer `PROGRAMMING IS A TOOL — ...` was removed because it describes a didactic emphasis rather than course organization. Slide 4 now ends with the Tuesday/Wednesday session cards. The removed resource is also gone from the scene definition and learning-path resource bindings.
