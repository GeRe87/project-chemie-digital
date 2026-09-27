# Agent handoff

## Role

`Semantic Web and Ontology Engineer`

## Issue

`#166 — Implement OfferingSection semantics and runtime projection`

## Completed

- Extended the stable course-scale vocabulary with exactly:
  - `cd:OfferingSection`
  - `cd:hasOfferingSection`
  - `cd:groupsUnitPlacement`
- Preserved the authoritative existing `TeachingOffering → UnitPlacement → LearningUnit` composition; OfferingSection is an additional grouping overlay over placement identities.
- Extended course-scale SHACL with section-aware invariants:
  - OfferingSection IRI identity;
  - exactly one positive integer section position;
  - unique section positions per TeachingOffering;
  - at least one authored `skos:prefLabel`;
  - exactly one owning TeachingOffering;
  - zero-or-more grouped placements, including valid empty sections;
  - grouped placements must be direct placements of the same offering;
  - once sections exist, every direct placement must be grouped;
  - no placement may be grouped by two sections of the same offering.
- Upgraded the active offline TeachingOffering projector to `TeachingOfferingRuntimeDocument 1.1`.
- Current section-free offerings now project explicit `sections: []`.
- Added deterministic section projection:
  - exact section IRI;
  - authored positive section position;
  - multilingual labels/descriptions using the existing localized-text policy;
  - grouped exact placement ids ordered by existing UnitPlacement position;
  - empty sections retained;
  - duplicate positions, missing labels, missing explicit type, multiple owners, unknown grouped placements, duplicate grouping and incomplete coverage fail closed.
- Extended the shared TypeScript runtime contract to an explicit tagged union:
  - legacy `TeachingOfferingRuntimeDocument 1.0` without section capability;
  - section-aware `TeachingOfferingRuntimeDocument 1.1` with required `sections[]`.
- Explicitly reject:
  - `1.0` documents carrying a `sections` field;
  - `1.1` documents omitting `sections`.
- Added `TeachingOfferingRuntimeSection` and shared validation for section id/position/metadata/membership/order/coverage.
- Kept outer `CanonicalRuntimeArtifact.artifactVersion: "1.0"` unchanged.
- Added focused SHACL, Python projector and TypeScript transport regressions, including empty sections, legacy compatibility, insertion-order independence and negative section evidence.
- Updated root/Core runtime documentation and appended the ADR-0015 implementation note.
- Did not add any real Chemometrics section instances, Self-Study region visuals, learner-state progress, scientific content, Pitch/Reveal feature changes or deployment configuration.

## Files changed

Expected implementation/source scope:
- `ontology/dataset/course-scale-vocabulary.trig`
- `ontology/dataset/course-scale-shapes.trig`
- `scripts/teaching_offering_runtime.py`
- `packages/core/src/canonical-runtime.ts`
- `tests/test_course_scale_semantics.py`
- `tests/test_teaching_offering_runtime.py`
- `packages/core/test/canonical-runtime.test.ts`
- `README.md`
- `packages/core/README.md`
- `docs/adr/0015-offering-section-boundary.md`
- `.agents/handoffs/issue-166-offering-section-runtime.md` — this handoff
- `.agents/workflows/system/state.json` — governed workflow evidence only

Generated runtime artifacts are intentionally not hand-authored through the connector. Local generation/tests may show deterministic tracked artifact changes from the 1.0 → 1.1 nested document upgrade; those must be inspected and committed only if they are genuine generator output.

## Verification

- [x] Static architecture review — implementation follows accepted ADR-0015 boundaries.
- [x] Vocabulary review — only OfferingSection and its two grouping relations were added; no Module/World/Chapter/progress/map vocabulary.
- [x] SHACL review — current offerings without sections remain valid; section-enabled offerings are total and unambiguous.
- [x] Runtime compatibility review — active projector emits 1.1; shared consumer accepts legacy 1.0 and current 1.1 with explicit capability distinction.
- [x] Determinism review — section order uses authored section position; member order uses existing UnitPlacement position; RDF insertion order is not semantic.
- [x] Empty-section review — empty authored sections project as `placementIds: []` and imply no future unit/content.
- [x] Renderer boundary review — no world/map/route/CSS/icon/terrain/animation field exists in semantic or runtime contracts.
- [x] Learner-state boundary review — no completion, progress or identity state was added.
- [x] Course-specific scope review — no Chemometrics or Digital Chemistry section instance was authored.
- [ ] Focused Python/Core tests — pending local execution.
- [ ] Root `npm test` — pending local execution after focused tests.
- [ ] Generated-artifact diff review — pending local generation through the normal test commands.
- [ ] Fresh exact-head `agent-validator/project-chemie-digital` — required after all local evidence and final manager claim.

## Decisions and assumptions

### The active projector emits 1.1 even for section-free offerings

A current validated offering with no authored sections is represented as `version: "1.1", sections: []`. This explicitly distinguishes current zero-section state from legacy 1.0 documents whose contract has no section capability.

### Legacy 1.0 remains a first-class compatibility case

The TypeScript contract is a tagged union rather than a single interface with optional `sections`. Existing flat 1.0 documents remain valid, and the existing isolated course-world test fixture can continue exercising that compatibility path.

### Total coverage applies only when sections are non-empty

`sections: []` is a valid section-capable flat offering. Once one or more sections exist, every placement must appear exactly once. Empty sections may coexist with populated sections as long as all placements are covered somewhere.

### Section membership is placement-specific

The runtime carries exact `placementIds`, never LearningUnit ids. Reusable units therefore remain reusable and can belong to different sections through different offering placements.

### Generated artifacts must come from generators, not manual edits

Changing the projector from 1.0 to 1.1 will update tracked generated runtime JSON when local generation runs. Those outputs should be reviewed and committed from the generator result only; unrelated generated Pitch/static diffs must not be pulled into this issue without evidence they are required.

## Risks or unresolved questions

- Local execution is still required; connector-side review cannot run pySHACL, Python unittest or Node tests.
- The normal generators may update tracked runtime artifacts because the nested document version and `sections: []` are now different. The exact artifact set must be determined from local `git status --short`, not guessed.
- No real section-enabled canonical offering exists yet; #167 will provide the first Chemometrics section instances after this generic contract is accepted.
- #168 remains responsible for consuming section-aware runtime state in the Self-Study region/world UI; this issue deliberately leaves the current flat UI unchanged.

## Recommended manager action

After local focused tests and generated-artifact review, independently verify:
1. exact generic scope;
2. SHACL total-coverage and empty-section behavior;
3. Python 1.1 projection and fail-closed invalid evidence;
4. TypeScript 1.0/1.1 tagged compatibility;
5. no Chemometrics/UI/progress leakage.

Then claim final acceptance and require fresh exact-head `agent-validator/project-chemie-digital` success before Ready/squash merge.
