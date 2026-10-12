# Agent handoff

## Role

Frontend and Reveal Renderer Engineer (`.agents/roles/frontend-engineer.md`).

## Issue

#270 — Polish mean examples, trim redundant slides and correct course logistics.
Branch: `agent/270-mean-example-polish`, stacked on draft #269.
Draft PR: https://github.com/GeRe87/project-chemie-digital/pull/271
Feature commit: `a66c4bf`.

## Completed

- Removed arithmetic ADD AND DIVIDE / REPRESENTATIVE CENTER active cards; preserved formula and authored symbol legend, incorporating equal weighting/meaningful addition and no-normality requirement.
- Growth asks for one factor repeated in both equal periods, starting at 100 and matching observed 1600. Arithmetic factor 5 predicts 2500, explicitly fails this preservation question. Geometric factor 4 predicts observed 1600. Numerical math and spoken alternatives compare with original `100 × 2 × 8`.
- Deselected geometric (2/8/4) and median standalone practice slides; reusable Exercises/answers retained. Merged the six ending Exercises in original reading order into one three-column/two-row wide grid. Exact active sequence is 33 scenes; all seven R labs are unchanged.
- Marked worked/application headings `Example:`; clarified microbial upward pull and geometric log-scale suitability without claiming bias versus an unknown population mean or discarding extremes. Ratios are concentration comparisons, not silently assumed consecutive growth periods.
- Trimmed the pump task's final justification sentence; explained NTU as nephelometric turbidity units/light scattering, with the event-not-automatically-invalid qualification.
- Course-wide active-footer audit: removed lecturer tagline and redundant Variables paraphrase, plus geometric/expectation/harmonic/median/layers/turbidity/speed-comparison closing notes. Essential conditions were retained/moved into main content. Source citations, all 22 formula legends, seven function legends, necessary purpose sampling qualification and answers remain. No global footer hiding.
- Tuesday 10:00–13:00 and Wednesday 12:00–14:00; no room. Lecture/seminar and tutorial roles unchanged.

## Files or resources changed

- Exact Mean Values examples/scenes/path graphs, Introduction logistics/lecturer selection and Variables redundant-footer selection with its study-design caveat moved into the observed-variation card.
- Generic prompt-grid CSS caps wide columns at three and wraps further prompts. Owner approved the bounded scope extension to `packages/renderer-reveal/src/composition-policy.ts` and its tests in #270: recognize 2–6 generic prompts instead of 2–4. No public ontology/schema/compiler/SceneDocument/runtime API changes.
- Focused scientific/source/sequence/visual tests and mechanically dependent count expectations; README and migration audit include the exact heading set and complete footer decisions.
- This handoff and only System workflow state. Generated Pitch/self-study HTML excluded and preserved; Chemometrics state untouched.

## Verification

- [x] 45 focused Mean Values tests, including SHACL, exact sequence/source, numerical preservation and complete seven function glossaries.
- [x] 50 generic composition-policy tests and 8 teaching-primitive tests, including six opaque free-text prompts with reversed storage order but semantic reading order preserved.
- [x] Introduction suite: 14 tests pass. The full suite also passes the final Variables footer regression.
- [x] Production Vite build passes; pre-existing large-chunk warning remains.
- [x] Actual 5173 `pitch:intro` overworld, Levels 0/1/2 in both themes at 1440×900. Measured six-question grid: 3 columns × 2 rows, no prompt overflow. Growth, arithmetic/geometric, microbial/ratios, pump, NTU/median and logistics screenshots reviewed.
- [x] All seven R labs executed/reset in both themes; expected growth 4/1600, speed 10/50s and 3.333333m/s, pump 1/5/2min and 3.75L/min. Zero browser/math errors, no output/glossary overlap.
- [x] Accessibility/privacy: semantic reading order retained; source citations, math alternatives and static prompt answers preserved. No account, tracking, external data requests or new runtime interactions.
- [x] Full `npm test` passes on feature commit `a66c4bf0ab4816732dbfe178cd975da46b9947e1`: 412 Python tests, 105 Reveal, 75 D3, 184 Pitch and 29 self-study app tests, plus all other phases and canonical generation/checks. Completion evidence is published on PR #271. The subsequent handoff/state-only audit commit requires its own exact-head external status; feature-head evidence is not misrepresented as validation of a later head.
- [x] Documentation updated.

Evidence outside authored source: `C:/Users/PCUser/AppData/Local/Temp/opencode/browser-tools/verify270.cjs`, `270-report.json`, `270-*.png`.

## Decisions and assumptions

- User explicitly approved the generic six-prompt inference extension when the existing 2–4 bound was discovered. The issue comment records exact additional write scope.
- Wednesday “12 bis 2 Uhr” interpreted as 12:00–14:00; this was already stated in the assigned issue and acknowledged by the owner.
- Footer means redundant authored closing prose, not any DOM region named footer. Diagram regions and source citations are essential and remain.
- Microbial/ratio suitability is relative to a stated positive multiplicative/log-scale/product question; no universal superiority or inferred distribution is claimed.

## Risks or unresolved questions

- Required exact-current-head external `agent-validator/project-chemie-digital` and compatible-main stack integration remain manager gates. Local tests are not acceptance.
- Free-text discussion remains classroom questions, not a new electronic poll: existing Pitch free-text prompts have no answer buttons; authored ExpectedResults remain in canonical/static/self-study projections.
- 390×844 checks follow wide opening and confirm single-column reflow, not successful fresh portrait navigation. Whole-deck portrait scaling and quantitative river/tracer animation remain separate.
- Cross-track #257 edits serialized until this worker handoff; no Chemometrics state writes, self-acceptance or merge.

## Recommended manager action

Review the exact draft PR, final full-test evidence, qualified scientific comparisons and course screenshots. Keep draft until exact-head external status, compatible-main integration and independent review gates pass. Do not infer acceptance from this handoff.
