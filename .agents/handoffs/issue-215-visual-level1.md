# Issue #215 — Visual Variables and Constants lecture

The 14-scene Level 1 narrative now projects semantic resources into varied visual structures instead of prose-only slides.

## Reused generic layouts

- diagram-stage: Variable↔Constant opener, analytical-example network
- concept-specification: Variable key points
- paired-info-cards: Variable/Constant and Independent/Dependent
- data-explanation: Sample×Variable principles + table

## New generic structural layouts

- code-lab = heading + prompt + code
- concept-chart = heading + prose + chart (+ optional example)
- math-diagram = heading + math + diagram
- large-poll = heading + single-choice prompt

No scene/path/resource identities participate in renderer inference.

## New semantic visuals

- Variable/Constant contrast FlowDiagram
- three analytical examples NetworkDiagram
- sample-variable KeyPoints + TableDefinition
- empirical Distribution BarChart
- random-variable mapping MathExpression + three-node FlowDiagram
- discrete probability-mass BarChart
- continuous density-like LineChart

## Verify

```powershell
npm run check:semantics
python -m unittest tests.test_chemometrics_random_variables_path tests.test_chemometrics_random_variables_scenes -v
npm run test:renderer-reveal
npm run test:pitch
npm run pitch:intro
```
