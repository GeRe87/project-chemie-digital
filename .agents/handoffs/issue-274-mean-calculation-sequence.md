# Agent handoff

## Role

Chemistry Lecturer and Subject-Matter Expert.

## Issue

#274 — Refine mean calculation sequences and application examples.
Branch: `agent/274-mean-calculation-sequence`, stacked on draft #273.
Draft PR: https://github.com/GeRe87/project-chemie-digital/pull/275
Feature commit: `91339e8`.

## Completed

- Omitted purpose-note SceneItem selection and kept the reusable note explicitly linked as a semantic part. Removed no accepted scientific qualification, and introduced no global footer hiding.
- Arithmetic theory now leads to a new authored math substitution with exact existing sums 10,13,18,10,23: 74/5=14.8, followed by unchanged seeded same-case R. Distinguish observed sums from single die faces and possible outcomes/model expectation17.5; authored spoken math/symbol legend and derivation links retained.
- Speed solution renamed and selects only two sourced MathExpressions: harmonic speed2/(1/10+1/2)=10/3≈3.333m/s first; total time200/(10/3)=60s second. Two equal100m sections/positive speeds explicit in legend; exact versus rounded distinction stated. Original section-time formula/diagram remain authored but not active on this calculation slide; comparison/journey R/sketch unchanged.
- Pb median R inserted immediately after Pb comparison, using0.5,0.7,0.6,0.8,15.0µg/L. Returns sorted observations and median through a named list, because the existing R runtime displays the final expression. All four functions (`c`, `sort`, `median`, `list`) have authored glossary entries. Median0.7µg/L; retain/investigate15.0 and do not infer safety/compliance from either center. Unrelated standalone median practice remains inactive.
- Summary cards list application examples with compact parenthetical comparability/weighting/log-scale/positive-factor/equal-distance/extreme-event conditions. Large range alone does not justify geometric averaging or establish log-normality; equal times do not imply harmonic speed averaging.
- 35 active Mean Values scenes, eight R labs and25 active formulas with legends. Level1 remains12; prior SVG assets/nine placements, turbidity10.72NTU reference and six-card3×2 ending preserved.

## Files or resources changed

- Mean Values examples/scenes/path TriG, independent exact expectations and focused Mean Values tests.
- Exact Mean Values step-count maintenance in variance-path compatibility test; owner-approved exact count maintenance in `tests/test_prompt_static_fallback.py`.
- Level2 README/migration audit and this handoff; only System workflow state. Generated Pitch/self-study HTML preserved/excluded. No renderer/compiler/ontology/schema/other-track-state edits.

## Verification

- [x] 52 focused Mean Values tests pass, including SHACL, source/spoken math/legend/answer/static fallback and exact sequence/count/numerical/scientific-condition regressions.
- [x] Production Vite build, with pre-existing large-chunk warning.
- [x] Actual5173 overworld→Level2 dark/light1440×900: no formula/card overflow or workbench/output/glossary overlap, zero page/KaTeX errors. All eight R Run/Reset pass per theme. New median output includes sorted0.5,0.6,0.7,0.8,15.0 and median0.7.
- [x] Resized390×844 screenshots after wide entry; complete new calculation content remains visible, with existing small whole-deck scaling unresolved. Not a fresh-portrait-opening/scaling fix.
- [x] Accessibility/privacy: reading order, source-linked symbols/functions, spoken math, complete observations, ExpectedResults and static fallback preserved; no network/personal data/account additions.
- [x] Documentation updated.
- [x] Full `npm test` passed on feature head `91339e83cf699cd067df7c7f0b192bb3315d0786`:419 Python,107 Reveal,75 D3,185 Pitch,29 self-study app tests and all other phases/canonical generation/checks. Log: `C:/Users/PCUser/.local/share/opencode/shell/a3b85f872e73014280a9ca9a4796ccf73a107175/sh_133a607ab001Yy2tWoNZl7Jwk3.out`. Subsequent handoff/state commit is audit-only; required external validation still must target exact current PR head.
- [x] After full tests, regenerated course bundle and reran `verify274.cjs`:35 scenes, three available overworld starts, eight R Run/Reset per theme, zero page/KaTeX errors or clipping/overlap. Actual5173 is restored to Chemometrics overworld, not the German pitch.

Local evidence: `C:/Users/PCUser/AppData/Local/Temp/opencode/browser-tools/verify274.cjs`, `274-report.json`, `274-*.png`.

## Decisions and assumptions

- All new content is locally derived from existing authored examples and formulas, not falsely credited as quoted external material. No external research.
- Arithmetic worked example deliberately reuses the exact five-dice R sums, not unrelated water data. Median deliberately reuses the immediately preceding Pb case.
- Two ordered formula/legend units use the existing generic formula-deck composition. Summary copy stays one compact paragraph per card, avoiding unintended newline progression arrows.
- Mathematical equality uses the exact harmonic speed10/3; rounding to3.333 before division produces only an approximate60s.

## Risks or unresolved questions

- Required external exact-current-head status, compatible-main stack integration and independent reviews remain acceptance gates; local tests never substitute for them.
- Fresh portrait opening/scaling and separate quantitative tracer animation remain unresolved.
- #257 overlapping writes serialized until this worker handoff. Chemometrics state untouched; no self-acceptance/merge.

## Recommended manager action

Review exact draft content, final test/restoration evidence and cross-track gate. Keep draft pending external exact-head/integration and independent review; no acceptance implied by delivery.
