# Agent handoff

## Role

`Frontend and Reveal Renderer Engineer`

## Issue

`#168 — Render OfferingSections as regions in the Self-Study overworld`

## Completed

- Extended the existing generic `course-world.ts` view-model layer to consume section-aware `TeachingOfferingRuntimeDocument 1.1`.
- Added `CourseWorldSection` projection derived only from runtime section identities, positions, localized labels/descriptions and exact `placementIds`.
- Preserved the existing authoritative UnitPlacement ordering and path-to-SceneDocument binding behavior.
- Section member units are always ordered by existing UnitPlacement.position, independent of runtime membership list order.
- Added fail-closed checks for:
  - duplicate OfferingSection ids;
  - non-increasing section positions;
  - unknown placement references;
  - duplicate placement grouping within/across sections;
  - uncovered placements once sections exist.
- Preserved the pre-section flat-world behavior for:
  - legacy TeachingOfferingRuntimeDocument 1.0;
  - section-capable 1.1 documents with `sections: []`.
- Added sectioned rendering through the same `renderCourseWorldHtml` function used by both browser enhancement and static generation.
- Sectioned rendering includes:
  - authored region title and description;
  - generic derived region numbering;
  - exact member unit routes;
  - empty authored sections as `In preparation`;
  - no Start control for empty sections;
  - existing unit/path Start links/buttons unchanged.
- Added keyboard-semantic interactive region focus:
  - native `button type="button"`;
  - `aria-controls`;
  - `aria-pressed`;
  - programmatic focus to the selected region;
  - existing Back-from-unit behavior still returns focus to the original Start button inside its region.
- Added presentation-only region styling with generic `nth-child` terrain variants; no semantic labels or visual-theme data are encoded in RDF/runtime.
- Added narrow/mobile region layout and retained the existing reduced-motion override.
- Preserved repeated-placement behavior: repeated placements remain separate stations while shared SceneDocuments mount once.
- Added regressions covering:
  - generic section projection/order/metadata;
  - exact membership and empty sections;
  - fail-closed malformed section evidence;
  - legacy/sectionless flat fallback;
  - repeated LearningUnit placements in sectioned offerings;
  - real generated Chemometrics 1.1 section coverage;
  - static/browser region parity;
  - no hardcoded Chemometrics labels in projection/CSS;
  - keyboard focus semantics;
  - responsive/reduced-motion region CSS.

## Files changed

- `apps/self-study/src/course-world.ts`
- `apps/self-study/src/main.ts`
- `apps/self-study/src/styles.css`
- `apps/self-study/test/course-world.test.ts`
- `apps/self-study/test/app.test.ts`
- `.agents/handoffs/issue-168-self-study-section-regions.md`
- `.agents/workflows/system/state.json` — governed workflow evidence only

Expected generated artifact after local execution:
- `apps/self-study/index.html` — should change because the static-first fallback must now contain all seven authored regions and their descriptions/member routes. Commit only the deterministic Self-Study generated output; unrelated Pitch output remains out of scope.

## Verification status

- [x] Static architecture review: one shared view-model/render path serves browser and static output.
- [x] No RDF/course content mutation.
- [x] No learner-state/progress contract mutation.
- [x] No Chemometrics section-label hardcoding in projection or CSS.
- [x] Flat fallback remains available for 1.0 and 1.1 `sections: []`.
- [x] Existing exact path-binding and repeated-placement rules preserved.
- [ ] Local `npm run test:self-study` — required.
- [ ] Generated `apps/self-study/index.html` review/commit — required after local generation.
- [ ] Full repository `npm test` — required after generated fallback is committed.
- [ ] Browser visual smoke on narrow and desktop viewport — required.
- [ ] Fresh exact-head `agent-validator/project-chemie-digital` — required after final manager claim.
- [ ] Ready-for-review lifecycle — manager-only final gate.

## Recommended local sequence

```powershell
git switch agent/168-self-study-section-regions
git pull --ff-only
npm run test:self-study
git status --short
```

Expected source-generated change is `apps/self-study/index.html`. If `apps/pitch/index.html` also changes during broader tests later, restore it unless evidence shows it belongs to #168.

After reviewing the generated Self-Study fallback, commit/push that generated file on this branch, then run:

```powershell
npm test
git status --short
```

## Scope boundary

Issue #168 intentionally does not:
- change OfferingSection RDF instances or vocabulary;
- add progress/completion/unlock semantics;
- add or migrate scientific LearningUnits;
- infer section membership from labels/local names;
- add routing/history/persistence;
- copy third-party game assets or trade dress.
