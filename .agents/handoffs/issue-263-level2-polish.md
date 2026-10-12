# Agent handoff

## Role

Frontend and Reveal Renderer Engineer.

## Issue

#263 — Level 2 flow cards, task prompts and bounded R function workbenches.
Draft PR: https://github.com/GeRe87/project-chemie-digital/pull/265
Branch: `agent/263-level2-flow-prompts-workbench`, stacked on #262 → #260 → #258 → #185.
Feature commit: `1b28802`.

## Completed

- Generic flow information cards expose borderless header/body SVG groups and a divider; symbol/motif headers reserve two lines above the title. Dice nodes author `5×`, `∑`, `⟳`, not label-selected renderer icons.
- Safe Markdown list items explicitly author `[!]` tasks, `[?]` questions or ordinary triangle bullets. Decorative marks are hidden from assistive technology; static/live wording matches. Dice-practice and LLN first instructions are bold.
- Generic CSS capitalizes slide headings without changing authored RDF labels or copied text.
- Combined water results/table and Fe prompt/code in an inferred four-cell grid with responsive stacking; 31 contiguous active scenes. Reusable Fe exercise, code, answer and heading remain available.
- Five authored `CodeExample` function DefinitionLists expand via `dct:hasPart`; no R parsing or prose inference. Code editor, controls and output occupy a bounded upper row; glossary occupies a separately scrollable, keyboard-focusable lower row. Run/Reset behavior and 24px output/editor are preserved.

## Files or resources changed

- Shared D3 flow geometry/SVG and tests; Reveal composition and tests; Pitch projection, teaching text/styles and tests.
- Generic canonical runtime compiler/static fallback.
- Only Mean Values examples/scenes/path TriG and exact regression expectations; mechanical dependent scene count in the variance path test.
- README, Level 2 migration audit and only System workflow state. Generated Pitch/self-study HTML is excluded from commits.

## Verification

- [x] Focused Mean Values, static fallback, D3, Reveal and Pitch tests pass; earlier full `npm test` completed successfully (103 Reveal, 75 D3, 181 Pitch tests). A fresh full run on feature commit `1b28802` is running without a foreground timeout; see the final PR comment for its conclusive result. One foreground attempt timed out at 300 seconds during Python validation, not a diagnosed test failure.
- [x] Assembled dataset SHACL conforms; no ontology or SceneDocument vocabulary change.
- [x] Production `npx vite build --base=./` from `apps/pitch` passes; existing large-chunk warning remains.
- [x] Actual `npm run pitch:intro` on 5173, overworld → Level 2; both themes at 1440×900 and responsive 390×844 after wide opening. All five R examples execute/reset in each theme with no browser errors. Fresh portrait opening is **not** reported as passing.
- [x] Long-output test executes `print(seq_len(2000))` twice through the real Fe editor. Output scroll height 17,865px in a 65px viewport; output stays above glossary, glossary remains inside the workbench, focus/PageDown works, Reset restores `mean(fe)`. Both editor and output report 24px. Level 1 wide opening remains functional.
- [x] Accessibility checks cover decorative hidden markers, source identities, semantic definition markup and focusable scrollable glossary. No learner persistence, accounts or telemetry introduced; this is not a comprehensive assistive-technology audit.
- [x] Documentation updated.

Browser evidence resides outside authored sources at `C:/Users/PCUser/AppData/Local/Temp/opencode/browser-tools/`: `263-report.json`, `263-stress.json`, wide dark/light screenshots, responsive screenshots, and `263-long-output-water.png`. `verify263.cjs` and `stress263.cjs` reproduce the checks. The worker-owned standard course server is PID 11764, started by `npm run pitch:intro`; tests regenerate the default preview artifact, so rerun `npm --workspace @project-chemie-digital/pitch run generate:introduction` before inspecting the course.

## Decisions and assumptions

- Structural component order and source-linked ownership select the grid/workbench; no course/scene/label identity selectors.
- Long code, output and glossaries scroll rather than reducing output typography. Narrow inspection is after wide entry and still inherits small whole-deck portrait scaling.
- No code behavior, measurements, means, units or source answers changed. Bold/list formatting only changes the selected exercise presentation.
- An accidental duplicate issue #264 was immediately explained and closed; #263 remains the sole assignment.

## Risks or unresolved questions

- Required external exact-head status is not replaced by local tests, screenshots or this handoff. Manager must inspect the current PR head and compatible current-main integration basis before acceptance.
- The entire stack remains draft/unaccepted. Chemometrics #257 overlapping writes were serialized; its state was not changed. Independent #214/#217/#257 review obligations remain.
- Fresh portrait opening settlement and small portrait scaling remain unresolved. Quantitative river/tracer animation remains a separate pending task.
- Final full feature-head rerun evidence must be read from the PR completion comment; missing or failed evidence blocks acceptance.

## Recommended manager action

Review the exact #263 result and final full-test comment; retain external exact-head/integration and cross-track gates. Do not treat this worker handoff as acceptance or permission to merge.
