# Issue #184 worker handoff — visual Chemometrics Introduction redesign

## Role

`Semantic Web and Ontology Engineer / Chemometrics Content Worker`

## Issue

`#184 — Redesign Chemometrics Introduction lecture with cards, bullets and roadmap diagram`

Branch: `agent/184-chemometrics-intro-redesign`

## Completed

The Introduction was redesigned from five mostly text/list scenes into exactly **six visually structured scenes** using only already-standardized semantic primitives and renderer-owned generic layout inference.

### 1. Chemometrics & Applied Statistics

New real opening scene:

- a single authored heading: `Chemometrics & Applied Statistics`
- no paragraph, card grid or diagram competing with the course title

Renderer-neutral block structure:

`prose`

This matches the existing generic full-screen `closing` layout and therefore acts as a true Hero title without any scene-specific renderer logic.

### 2. What is this course about?

Replaced the long overview paragraph with:

- banner: `CHEMOMETRICS = DATA + CHEMISTRY + DECISIONS`
- foundation statement: `METHOD + ASSUMPTIONS + INTERPRETATION`
- four `DefinitionListEntry` cards:
  - Statistics
  - Chemometrics
  - Analytical context
  - Reproducibility
- takeaway: `FROM RAW MEASUREMENTS → DEFENSIBLE INTERPRETATION`

Block structure:

`prose → prose → prose → definition-list(4) → prose`

This matches the existing generic `foundation-card-grid` layout.

### 3. About the Lecturer

Replaced attribution + paragraph presentation with three ordered KeyPoint cards:

- ANALYTICAL DATA SCIENCE
- INSTRUMENTAL ANALYTICAL CHEMISTRY
- RESEARCH + TEACHING

plus an affiliation takeaway.

Block structure:

`prose → unordered list(3) → prose`

This matches `concept-specification`.

The original `Attribution` resource remains available in the content graph for reuse.

### 4. Lecture and Tutorial

The visible slide is now a genuine four-stage semantic process:

1. LECTURE
2. TUTORIAL
3. REPRODUCE
4. DISCUSS

The nodes are connected by three ordered FlowDiagram edges. The original DefinitionList resources remain available semantically but are no longer the visible lecture scene.

Block structure:

`prose → prose → diagram(flow, 4 nodes) → prose`

This matches the existing generic `process-diagram` layout.

### 5. Course Roadmap

The previous six-entry plain definition list presentation was replaced by an authored `FlowDiagram`:

1. STATISTICAL FOUNDATIONS
2. INFERENCE
3. REGRESSION + UNCERTAINTY
4. DESIGN OF EXPERIMENTS
5. MULTIVARIATE ANALYSIS
6. MACHINE LEARNING

The six nodes are connected by exactly five ordered linear edges.

Block structure:

`prose → diagram(flow)`

This matches the generic `diagram-stage` layout and existing D3 diagram renderer.

### 6. Introduction Round

The previous one-paragraph free-text prompt is retained as a reusable Exercise but is no longer used as the lecture scene.

The visible lecture scene now contains four prompt cards:

- Your background
- Statistics & chemometrics
- Data-analysis tools
- Your goal

plus a banner, foundation statement and takeaway.

Block structure:

`prose → prose → prose → definition-list(4) → prose`

This matches `foundation-card-grid`.

## Path changes

`ex:path-chemometrics-introduction` now has exactly six contiguous PathSteps.

Order:

1. title
2. overview
3. lecturer
4. format
5. roadmap
6. introduction round

The Introduction LearningUnit now has six focus concepts because the title is an explicit semantic focus concept.

Existing unit/path IRIs remain stable.

## Renderer boundary

No renderer or CSS code changed.

The visual redesign relies entirely on existing generic structural inference:

- `closing`
- `concept-specification`
- `foundation-card-grid`
- `process-diagram`
- `diagram-stage`

There are no checks for Chemometrics labels, scene IDs or resource IDs in renderer code.

## Tests

`tests/test_chemometrics_introduction.py` now locks:

- unchanged course placement order;
- exactly six Introduction focus concepts;
- exact three-card title structure;
- exact four-card Course Overview;
- exact three-card Lecturer structure;
- exact four-card Lecture/Tutorial structure;
- exact six-node/five-edge linear roadmap;
- exact four-card Introduction Round;
- exactly six contiguous path steps;
- compiled SceneDocument block shapes that trigger the three existing generic layout families;
- exact course-path selection;
- continued discoverability of Random Variables / Mean Values / Variance paths;
- full canonical SHACL conformance.

## Files changed

- `ontology/dataset/chemometrics-introduction.trig`
- `ontology/dataset/chemometrics-introduction-path.trig`
- `ontology/dataset/chemometrics-introduction-scenes.trig`
- `ontology/dataset/course-scale.trig`
- `tests/test_chemometrics_introduction.py`
- `.agents/handoffs/issue-184-chemometrics-intro-redesign.md`
- `.agents/workflows/chemometrics/state.json`

Explicitly unchanged:

- renderer code/CSS;
- ontology vocabulary and SHACL contracts;
- learner state;
- application navigation;
- other Chemometrics scientific units/content.

## Local verification

Focused:

```powershell
python -m unittest tests.test_chemometrics_introduction -v
```

Then full:

```powershell
npm test
```

To preview this exact Introduction branch:

```powershell
python scripts/generate_canonical_runtime.py `
  --offering-id https://w3id.org/project-chemie-digital/resource/teaching-offering-chemometrics-applied-statistics `
  --placement-id https://w3id.org/project-chemie-digital/resource/unit-placement-chemometrics-introduction `
  --unit-id https://w3id.org/project-chemie-digital/resource/learning-unit-chemometrics-introduction `
  --path-id https://w3id.org/project-chemie-digital/resource/path-chemometrics-introduction `
  --path-graph-id https://w3id.org/project-chemie-digital/graph/paths/chemometrics-introduction

cd apps/pitch
npm exec vite -- --host 127.0.0.1 --port 5173 --strictPort
```

## Pending

- owner-local focused test;
- visual browser review of all six slides;
- full repository test;
- independent manager review;
- final exact-head validator;
- Ready / squash merge.
