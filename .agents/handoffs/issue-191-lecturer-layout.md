# Issue #191 — Chemometrics lecturer profile migration

## Role

`Semantic Web and Ontology Engineer / Chemometrics Content Worker`

## Source selection

Facts were selected from `GeRe87/project-cv` only where they help students place the lecturer in this course:

- B.Sc. Chemistry and Biotechnology;
- M.Sc. Applied Chemistry with Instrumental Analytics;
- Dr. rer. nat. in Instrumental Analytical Chemistry;
- lecturer for Chemometrics and Applied Statistics at UDE since 2020;
- broader analytical-chemistry teaching at B.Sc./M.Sc. level;
- Analytical Data Science / Instrumental Analytical Chemistry with concise themes in chemometrics, data workflows and machine learning.

Publication counts, awards, grants/funding, editorial roles and supervision metrics remain excluded.

## Semantic migration

The previous three KeyPoints embedded their headings into first-line body text. They are replaced by one canonical `cd:DefinitionList` with three `cd:DefinitionListEntry` resources:

1. `BACKGROUND`
2. `TEACHING`
3. `RESEARCH`

Each entry uses `skos:prefLabel` for the card heading and `cd:body` for its body. The scene selects the list with `cd:DefinitionListRole` and `cd:hasDefinitionListEntry`.

No renderer/layout/style/runtime file is modified by this Content-track commit.

## Expected generic realization

Issue #192 supplies the renderer-owned structural rule:

```text
prose heading
+ three-entry definition-list
+ prose takeaway
→ labeled-card-grid
```

No lecturer, Chemometrics, scene or resource identity participates in that decision.

The existing nitrate slide remains authored as the generic case-study chain and is unchanged in #191:

```text
question + media → table → chart → authored chart annotation → interpretation
```

## Verification handoff

```powershell
npm run test:renderer-reveal
npm run test:pitch
python -m unittest tests.test_chemometrics_introduction -v
npm run pitch:intro
```

Browser acceptance for Slide 3:
- no projection toggle;
- clearly distinct Background / Teaching / Research headings;
- no text overflow;
- three balanced cards at lecture distance;
- compact identity line.

Also re-check Slide 2:
- question → table + bars → values → Sample-C highlight + conclusion → next slide.
