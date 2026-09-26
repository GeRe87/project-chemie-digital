# Issue #162 worker handoff — Self-Study course overworld

## Role

`Frontend and Reveal Renderer Engineer / System Worker`

## Issue

`#162 — Add Self-Study course overworld and exact path-to-scene navigation`

Branch: `agent/162-course-overworld`

## Completed

### Exact course-path → SceneDocument runtime binding

Extended `CanonicalRuntimeArtifact 1.0` additively with optional:

```ts
interface CanonicalRuntimeSceneDocumentBinding {
  readonly pathId: string;
  readonly pathGraphId: string;
  readonly sceneDocumentId: string;
}
```

The shared Core validator now:
- accepts legacy artifacts without the field;
- requires absolute HTTP(S) path and path-graph identities;
- requires every binding to reference an existing validated SceneDocument id;
- rejects duplicate exact path bindings;
- rejects one SceneDocument bound to multiple paths;
- rejects duplicate SceneDocument ids;
- requires deterministic exact `(pathId, pathGraphId)` ordering.

This prevents Self-Study from reverse-parsing compact `SceneDocument.sourcePathId` transport strings.

### Generic offering-bundle generation

Added a generic `build_offering_artifact()` path to the canonical Python generator.

For every exact LearningPath in one explicit TeachingOffering:
- no PathStep has `cd:usesScene` → valid scene-free path, retained in the course model but not compiled;
- every PathStep has exactly one `cd:usesScene` → compile one SceneDocument and emit one exact binding;
- mixed missing/present scene bindings or multiple scene bindings → fail closed.

The existing selected-path `build_artifact()` remains compatible and now emits one exact binding for its selected SceneDocument.

### Dedicated Chemometrics Self-Study bundle

Added `apps/self-study/scripts/generate-runtime.py`.

`npm run generate:self-study` now:
1. creates an explicit Chemometrics offering bundle;
2. writes the ignored disposable runtime JSON;
3. generates the static Self-Study fallback.

It no longer invokes the Pitch-oriented CLI path and therefore does not mutate `apps/pitch/index.html` as a side effect.

### Course-world view model

Added pure `apps/self-study/src/course-world.ts` derived only from:
- one validated TeachingOfferingRuntimeDocument;
- validated SceneDocuments;
- validated exact bindings.

The projection:
- follows authored UnitPlacement positions;
- is independent of normalized units array order;
- uses authored labels;
- marks exactly bound paths `available`;
- marks unbound semantic paths `in-preparation`;
- preserves repeated UnitPlacements as separate world stations while deduplicating bound SceneDocument ids for browser/static mounting in first authored occurrence order;
- rejects bindings outside the selected course;
- rejects missing or unbound compiled documents;
- never derives identity from label, local name, array position, or compact `sourcePathId`.

### Browser overworld navigation

Self-Study now opens on the course world.

All renderable documents are mounted once:
- Start opens the exactly bound document;
- all other documents remain hidden;
- Back to course map restores the world and the originating control focus;
- documents/controllers are not destroyed/recreated during navigation;
- prompt/disclosure state therefore remains live in memory;
- learner-state export/import still receives all mounted renderable plans/controllers.

Current course-map behavior on this branch/base:

1. Random Variables — available
2. Mean Values — available
3. Variance and Dispersion — In preparation

The implementation is intentionally compatible with pending Chemometrics #160. Once its Introduction path/scenes exist on the same base, the generic bundle/map will automatically place Introduction before Random Variables without a hardcoded unit list.

### Static-first fallback

The no-JavaScript generated HTML contains:
- the same ordered course world;
- available/in-preparation states;
- real anchors for available paths;
- all compiled Self-Study documents below the map;
- Back-to-course-map links for every static document.

JavaScript remains an enhancement, not a requirement for course discovery or reading content.

### Visual language

Added an original CSS-only retro platform-game overworld treatment:
- sky/terrain atmosphere;
- central route;
- alternating level stations;
- numbered markers;
- available/in-preparation status;
- responsive narrow-screen single-column route;
- keyboard focus;
- `prefers-reduced-motion` fallback.

No Nintendo/Mario artwork, names, sprites, music, tiles, characters, external game assets or copied trade dress are used.

## Tests authored/updated

### Core
`packages/core/test/canonical-runtime.test.ts` covers:
- legacy artifact compatibility;
- exact binding acceptance;
- invalid path identity;
- unknown SceneDocument id;
- duplicate exact binding;
- one SceneDocument bound to multiple paths;
- deterministic binding ordering.

### Python
`tests/test_self_study_course_bundle.py` covers:
- selected-path exact binding;
- current Chemometrics offering bundle;
- Random Variables + Mean Values renderability;
- Variance/Dispersion retained but scene-free;
- partial scene binding fail-closed;
- forward compatibility with the pending Introduction unit when present.

### Self-Study
`apps/self-study/test/course-world.test.ts` covers:
- authored placement order over unit-array order;
- exact binding independent of opaque/nonmatching `sourcePathId`;
- available/in-preparation projection;
- static links vs interactive buttons;
- unavailable paths non-clickable;
- outside-course/missing-document/unbound-document failures.

`apps/self-study/test/app.test.ts` now covers:
- Chemometrics generated course bundle;
- Introduction-compatible relative placement assertions;
- exact renderable binding expectations;
- static world presence and fallback content;
- browser visibility switching without remount;
- no sourcePathId reverse parsing;
- no Fuseki/SPARQL/persistence/account/telemetry/fetch integration;
- explicit reduced-motion CSS fallback;
- existing learner-state behavior over all renderable documents.

## Files changed

- `.agents/workflows/system/state.json`
- `README.md`
- `apps/self-study/index.html`
- `apps/self-study/scripts/generate-runtime.py` — new
- `apps/self-study/scripts/generate-static.mts`
- `apps/self-study/src/course-world.ts` — new
- `apps/self-study/src/main.ts`
- `apps/self-study/src/scene-data.ts`
- `apps/self-study/src/styles.css`
- `apps/self-study/test/app.test.ts`
- `apps/self-study/test/course-world.test.ts` — new
- `docs/adr/0010-teaching-offering-runtime-document.md`
- `docs/self-study-local.md`
- `package.json`
- `packages/core/README.md`
- `packages/core/src/canonical-runtime.ts`
- `packages/core/test/canonical-runtime.test.ts`
- `scripts/generate_canonical_runtime.py`
- `tests/test_self_study_course_bundle.py` — new

Explicitly unchanged:
- all Chemometrics RDF/course/path/scene content;
- `.agents/workflows/chemometrics/state.json`;
- learner-state package/schema contract;
- Pitch app and generated Pitch fallback;
- Reveal renderer;
- ontology/SHACL;
- deployment workflows.

## Static review evidence

- feature diff is 0 behind its System-worker base;
- no cross-track prohibited files are present;
- repository search finds no Self-Study `sourcePathId.replace/split/endsWith` reverse-parsing path;
- browser and static world share one pure projection;
- static generated document-id HTML attribute is escaped;
- reduced-motion behavior has an explicit regression;
- System and Chemometrics lanes remain separate.

## Verification still required

The GitHub connector worker cannot execute the repository-local toolchain.

Recommended focused local checks:

```powershell
python -m unittest tests.test_self_study_course_bundle -v
npm run test:core
npm run test:self-study
```

Then full authoritative gate:

```text
npm test
agent-validator/project-chemie-digital = success on the exact final PR head
```

A local browser visual review is also recommended because this increment intentionally introduces a visible map layout:
- desktop route;
- narrow/mobile route;
- Start → unit → Back flow;
- Variance/Dispersion `In preparation`;
- keyboard focus;
- reduced motion.

## Deferred work

Not included in this first overworld slice:
- completion/progress badges;
- locking/unlocking;
- resume/recommendation logic;
- learner-state current-unit persistence;
- multiple-course catalog;
- URL/router/history state;
- rewards, coins, XP or game mechanics;
- map coordinates authored in RDF;
- visual assets/sprites;
- presentation/Pitch course navigation.

Those can be added later over the stable exact-binding/course-world boundary.

## Recommended manager action

`review` after repository-local focused tests and visual smoke review. Verify exact-head validation, 19-file System-only scope, current-main freshness, browser/static parity, runtime binding compatibility, no cross-track mutation, and Ready-for-review before merge.
