# Agent handoff

## Role

Frontend and Reveal Renderer Engineer.

## Issue

#266 — owner-amended Variables/Mean Values purposes, question/task markers,
expectation-before-empirical teaching order and formula-stage diagram containment.
Draft PR: https://github.com/GeRe87/project-chemie-digital/pull/267
Feature commit: `2e92518`; branch `agent/266-level2-markers-diagram-fit`,
stacked on #265 → #262 → #260 → #258 → #185.

## Completed

- Level 1 inserts an authored three-point Variables purpose card directly after
  the definition; 12 contiguous active scenes, with existing inactive resources retained.
- Level 2 inserts a purpose card after the heading-only title and an illustrative
  sums/question scene after warmup. Existing expectation theory/calculation now
  precede empirical arithmetic mean. Standalone LLN theory selection is removed,
  while its reusable content, topic coverage and repeated-experiment practice remain.
  The active path has 32 scenes, with exact identity/order regressions.
- Authored sums 10, 13, 18, 10, 23 reproduce the unchanged seed-42 five-repeat R
  example; sample mean 14.8 is distinguished from model expectation 17.5.
- Warmup uses two explicit question tokens. Single-item prompt lists also render
  safely. Shared task circles draw one vector stem/dot rather than a heavy font
  glyph; no plus/cross/triangle is drawn inside them. Decorative markers stay hidden.
- Formula-stage diagrams use bounded runtime/figure/SVG geometry with zero
  intrinsic minimum height, preserving the entire graph rather than cropping it.
  No scene-specific renderer selectors or scientific formula/value changes.

## Files or resources changed

- Exact Variables basics/path/scenes and Mean Values examples/path/scenes TriG.
- Shared Pitch teaching styles and prompt projection, Reveal structural composition,
  focused tests, exact semantic sequence/count expectations and mechanical dependent counts.
- README and Level 2 migration audit; this handoff and only System workflow state.
- Generated Pitch/self-study HTML and unrelated owner work are excluded from commits.

## Verification

- [x] Focused Mean Values (38 tests before the last two added regressions), Variables
  (24 tests before the final new purpose regression), Reveal (104) and Pitch (183)
  suites pass. Full `npm test` is running on final feature commit `2e92518`;
  read the final completion comment on PR #267 before treating full validation as passed.
- [x] Assembled SHACL conforms; no ontology/SceneDocument vocabulary change.
- [x] Production Pitch build passes; existing large-chunk warning remains.
- [x] Actual `npm run pitch:intro`, 5173 overworld → Levels 1 and 2, dark/light
  1440×900. New cards, exact 12/32 counts/order, warmup and sums question markers,
  shared task glyph and both diagrams inspected. All five R labs execute and Reset
  in both themes with no browser errors; seeded output independently confirms the sums.
- [x] Responsive 390×844 screenshots after wide opening show full diagram bounds.
  Wide SVG bottom changes from 921.94px (outside slide) to 862.81px inside the
  882.19px slide bottom. Narrow SVG bottom 533.72px is inside slide bottom 538.97px.
  Whole-deck portrait scale remains small; fresh portrait opening is not claimed fixed.
- [x] Accessibility: semantic ordered reading route, source-linked lists, retained
  answers/static fallbacks and decorative hidden markers. No persistence/telemetry added.
- [x] Documentation updated.

Browser evidence: `C:/Users/PCUser/AppData/Local/Temp/opencode/browser-tools/266-report.json`,
`266-before.json`, dark/light purpose/warmup/sums/LLN/diagram screenshots and responsive
screenshots. `verify266.cjs` reproduces actual course checks and asserts counts,
diagram containment and real seeded R output. The previous `stress263.cjs` remains
available for code-workbench containment; this increment does not alter its geometry.

## Decisions and assumptions

- Purpose prose is owner-directed educational framing, not a new scientific
  definition or invented source endorsement. Averaging stability is qualified by
  independent fluctuations around the same target and explicitly excludes guaranteed
  outlier resistance/systematic-error correction.
- Generic compact-list composition requires explanatory KeyPoint relation provenance;
  unrelated legacy card progressions retain their existing layout. It uses no lexical IDs.
- New cards suppress whole-sentence marker highlighting; semantic content is retained.
- The clipping cause was the 344px minimum-height SVG inside a 288px host, not missing
  authored node/body content. Fix is isolated to formula-stage diagram sizing.

## Risks or unresolved questions

- Final full-test completion is pending PR-comment evidence. Required external
  exact-current-head `agent-validator/project-chemie-digital` is separate and must
  be checked by the manager; local results never authorize acceptance/merge.
- Stack integration with current main is not established. #257 overlapping writes
  were serialized; Chemometrics state is untouched. Independent reviews remain.
- Fresh portrait navigation, small portrait readability and separate quantitative
  river/tracer animation remain unresolved and out of scope.

## Recommended manager action

Review exact #266 scope/result and final full-test comment, then apply external
exact-head, compatible-main integration and cross-track gates. No worker acceptance or merge.
