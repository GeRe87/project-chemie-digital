# Issue #189 handoff — semantic evidence-driven lecture disclosure

## Roles

- Chemometrics: `Semantic Web and Ontology Engineer`
- System: `Frontend and Reveal Renderer Engineer`

## Goal

Progressive lecture disclosure is now derived from semantic evidence relations instead of block type, scene id, topic label, or hand-authored stage numbers.

Canonical evidence chain:

```text
TableDefinition
  <- cd:derivedFromResource -
ChartDefinition
  - cd:hasChartAnnotation ->
ChartPointAnnotation
  <- cd:interpretsResource -
Interpretation
```

For the nitrate case study this yields:

- Stage 0: analytical question + illustration + chart frame/axes
- Stage 1: raw-data table appears together with the chart bars
- Stage 2: chart value-label stage
- Stage 3: authored chart focus + interpretation/conclusion appear together

The layout slot is reserved while content is hidden, so disclosure does not move the slide.

## Ontology

### New generic relations

`ontology/dataset/concepts.trig`

- `cd:derivedFromResource`
  - domain: `cd:LearningResource`
  - range: `cd:LearningResource`
- `cd:interpretsResource`
  - domain: `cd:Interpretation`
  - range: `cd:LearningResource`

Existing `cd:derivedFrom` remains Concept-oriented and unchanged.
Existing `cd:supportsResource` remains Source-oriented and unchanged.

### SHACL

`ontology/dataset/shapes.trig`

Added reusable validation for both relations. Repository validation uses RDFS inference, so subclasses such as TableDefinition, ChartDefinition, ChartAnnotation and Interpretation satisfy the LearningResource class constraints.

## Nitrate authored semantics

`ontology/dataset/chemometrics-introduction.trig`

- `ex:chart-chemometrics-nitrate-means cd:derivedFromResource ex:table-chemometrics-nitrate-replicates`
- chart owns `ex:annotation-chemometrics-nitrate-runoff-high`
- annotation is a `cd:ChartPointAnnotation`
- annotation targets `ex:observation-nitrate-mean-c`
- `ex:chemometrics-nitrate-case-discussion cd:interpretsResource ex:annotation-chemometrics-nitrate-runoff-high`

The final focus is therefore authored evidence, not inferred from the maximum numeric value.

## SceneDocument contract

`packages/core/src/scene-document.ts`

### Disclosure

`Disclosure` now optionally carries:

- `step`
- `triggerResourceId`

Rules:
- step must be a positive integer;
- step requires `mode: "progressive"`;
- step requires a non-empty semantic trigger resource id;
- `order` remains the unique sibling ordering field and is not repurposed as a stage number.

### Bar annotations

BarChartBlock now supports optional point annotations:

- id
- datumId
- label
- source

Validation fails closed for:
- duplicate annotation ids;
- unsupported annotation kind;
- annotation target outside the bar data.

LineChart annotation semantics are unchanged.

## Compiler

`scripts/generate_canonical_runtime.py`

### Bar annotation projection

BarChart projection now mirrors the existing line-chart annotation pipeline for point annotations:

- reads `cd:hasChartAnnotation`
- validates ChartPointAnnotation
- validates target belongs to chart dataset
- projects annotation id, datum id, label and source

Static no-JS fallback also retains bar annotation labels.

### Semantic disclosure derivation

After a scene is projected, the compiler reasons only over selected resource relations in that same scene.

For a selected BarChart:

1. selected resources referenced by `cd:derivedFromResource`
   become progressive at the first evidence stage:
   - `step: 1`
   - trigger = chart resource id

2. selected Interpretations whose `cd:interpretsResource` target is an annotation owned by that chart
   become progressive at the final annotation stage:
   - `step: 3`
   - trigger = annotation resource id

Without those relations, blocks remain `initial`.

There are no Chemometrics/nitrate/resource-id checks in this policy.

## D3 bar renderer

`packages/renderer-d3/src/bar-chart.ts`

Bar render models preserve semantic point annotations.

Final focus policy:
- if semantic annotations exist: emphasize their datum ids;
- if no annotation exists: retain the existing maximum-value fallback for backward compatibility.

`barChartEmphasisDatumIds()` is exported and regression-tested with a deliberately non-maximum annotated datum, proving the semantic annotation overrides numeric maximum inference.

## Pitch DOM

`apps/pitch/src/preview.ts`

Every progressive block emits:

- `data-presentation-disclosure-mode="progressive"`
- `data-presentation-disclosure-step`
- `data-presentation-disclosure-trigger-resource-id`
- initial `data-presentation-disclosure-visible="false"`
- `aria-hidden="true"`

Chart stage hosts publish:

`data-presentation-step-resource-id`

containing:
- chart resource ids
- chart annotation resource ids

This allows multiple staged components on one slide without cross-triggering unrelated disclosure.

## Pitch step runtime

`applySemanticDisclosure()`:

- gets the active stage host's semantic resource ids;
- finds progressive blocks in the same slide;
- changes visibility only when the block trigger matches a resource published by that host;
- applies `step >= requiredStep`;
- updates `aria-hidden`.

It is called from the existing absolute presentation-step dispatch, so reverse navigation hides the content again correctly.

## Geometry preservation

`presentation-step-runtime.css`

Progressive disclosure uses:

- `visibility`
- `opacity`
- `pointer-events`

It explicitly does not use `display:none`.

Therefore table/conclusion grid slots remain reserved and the slide does not move when stages change.

Reduced-motion disables the opacity transition.

## Tests

### Core
`packages/core/test/chart-block.test.ts`

- accepts bar point annotation
- rejects unknown annotation datum
- accepts semantic progressive disclosure
- rejects progressive step without semantic trigger

### D3
`packages/renderer-d3/test/bar-chart.test.ts`

- non-maximum authored annotation overrides numeric maximum
- unannotated chart retains maximum fallback

### Generic compiler
`tests/test_semantic_evidence_disclosure.py`

Uses neutral resources only:
- example-table
- example-chart
- example-annotation
- example-interpretation

Proves:
- resource relations generate the expected disclosure
- removing chart→table relation leaves table initial
- removing interpretation→annotation relation leaves interpretation initial

### Chemometrics
`tests/test_chemometrics_introduction.py`

Verifies exact nitrate RDF chain and compiled result:
- table step 1, chart trigger
- bar annotation targets observation C
- discussion step 3, annotation trigger

### Pitch
- runtime trigger matching
- unrelated trigger stays hidden
- reverse step hides content again
- preview DOM exposes disclosure trigger
- chart stage host publishes annotation ids
- CSS preserves geometry without display:none

## Identity boundary

Static review confirms the compiler disclosure policy and renderer/runtime logic contain no:
- Chemometrics labels
- nitrate labels
- Chemometrics scene ids
- nitrate resource ids

All coupling is derived from RDF resource relations and generic ChartAnnotation semantics.

## Local verification required

```powershell
npm run check:semantics
npm run test:core
npm run test:renderer-d3
npm run test:pitch
python -m unittest tests.test_semantic_evidence_disclosure -v
python -m unittest tests.test_chemometrics_introduction -v
```

Then browser smoke:

```powershell
npm run pitch:intro
```

Expected case-study progression:

1. Stage 0: analytical question + illustration; table and conclusions hidden.
2. Stage 1: table and bars appear together.
3. Stage 2: chart values appear.
4. Stage 3: semantic Sample-C focus and conclusion cards appear together.
5. Next: adjacent Intro slide.
6. Backwards: conclusions/table disappear again at their semantic boundaries without layout movement.

After browser acceptance run full `npm test`.
