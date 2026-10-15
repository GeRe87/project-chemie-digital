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

The abstract four-card overview was removed after visual review and replaced by one coherent nitrate mini case study.

The slide now combines:

- **Problem + illustration**
  - three illustrative water samples measured four times for nitrate;
  - a local transparent SVG asset at `apps/pitch/public/chemometrics/nitrate-water-samples.svg`;
  - media is linked semantically through `cd:hasMedia`, not injected by scene id.

- **Raw data**
  - a semantic `TableDefinition` with A upstream, B tap water and C runoff;
  - four replicate nitrate concentrations per sample in mg/L.

- **Analysis**
  - a semantic `BarChart` of the three means;
  - chart description explicitly states mean ± sample SD:
    - A = 2.20 ± 0.18 mg/L
    - B = 4.95 ± 0.13 mg/L
    - C = 18.93 ± 0.31 mg/L

- **Discussion**
  - three concise KeyPoints:
    1. C is clearly highest in this illustrative dataset;
    2. repeated measurements vary;
    3. Chemometrics turns measurement + variation + assumptions into a defensible decision.

- **Takeaway**
  - `MEASUREMENTS → SUMMARY → VARIATION → INTERPRETATION`

The actual media-aware SceneDocument structure is:

`prose → group(prose + media-reference) → table → chart → unordered list(3) → prose`

This triggers the new generic renderer-owned `case-study` layout. The layout is inferred purely from block structure and contains no Chemometrics, nitrate, scene-id or resource-id checks.

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

The final visual review required one additive generic renderer primitive: `case-study`.

Renderer-owned structural families used by the six-slide Introduction are now:

- `closing`
- `case-study`
- `concept-specification`
- `process-diagram`
- `diagram-stage`
- `foundation-card-grid`

The new `case-study` family is generic and recognizes only:
heading → prose/image group → table → chart → three-point list → takeaway.

There are no checks for Chemometrics labels, nitrate wording, scene IDs or resource IDs in renderer code.

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
- `apps/pitch/public/chemometrics/nitrate-water-samples.svg`
- `packages/renderer-reveal/src/layout-policy.ts`
- `packages/renderer-reveal/test/layout-policy.test.ts`
- `apps/pitch/src/case-study-layout.css`
- `apps/pitch/src/main.ts`
- `apps/pitch/package.json`
- `package.json`
- `.agents/handoffs/issue-184-chemometrics-intro-redesign.md`
- `.agents/workflows/chemometrics/state.json`

Explicitly unchanged:

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

To preview this exact Introduction branch with semantic media enrichment:

```powershell
npm run pitch:intro
```

This command regenerates the Introduction with `generate_canonical_runtime_media.py` and then starts Vite with `--force`.

## Pending

- owner-local focused test;
- visual browser review of all six slides;
- full repository test;
- independent manager review;
- final exact-head validator;
- Ready / squash merge.
