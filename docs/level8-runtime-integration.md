# Level 8 shared runtime integration (local)

- Branch: `codex/chemometrics-level8-linear-regression-20261119`.
- Basis: `a41b00e96cf8d217422f26c3596ecda8284f5889`.
- Authoring worker: OpenCode CLI, `openai/gpt-6.1-sol`, manual owner-authorized local task. No CDAC/CAC execution is claimed.
- Preview: port 5208, `authoring-level8-linear-regression`; separate local offering; published offering untouched.

## Reused and extended components

The existing mathematical-derivation renderer provides input, operation and result stages, explanations and symbol legends. An additive `linear-regression` scientific experiment consumes authored paired observations and model-basis parameters. One generic split layout keeps a large plot on the left and controls/results on the right. Residual segments are computed from the same observations and coefficients. Manual fitting supports negative coefficients; automatic fitting uses Householder QR, requiring finite full-column-rank designs. No t/F inference or coefficient uncertainty is computed in this introductory mechanism.

Authored SVG root metadata declares a bounded stage count and cumulative/exclusive presentation. The inert drawing sanitizer accepts only the two bounded metadata attributes, retaining the existing drawing-only restrictions. SVGs are loaded before fragment preparation; there is no Level 8 media-URI registry. Static images remain fallback if enhancement fails. Print selects the final SVG stage. Existing media continue through the same shared loader, so ANOVA staging needs regression checking before any future publication.

## Evidence

- `npm run typecheck`: passed.
- `npm run test:core`: 206 passed.
- `npm run test:renderer-d3`: 123 passed.
- Focused regression, authored-stage and media checks: 11 passed.
- Numerical checks verify drift OLS intercept 1.02, slope 1.99, SSE 0.099 from the actual five observations; the initial assignment's 1.04/1.98 was inconsistent and was corrected.
- First browser pass traversed all 54 draft scenes in dark and light mode, exposed SVG fallback and duplicate-cover issues; this pass is diagnostic, not final visual approval. Follow-up content revision requested.
- No full npm test or publication/release validation performed. This is a local draft.

## Use-case pattern used in the opening scene

The first frame introduces a concrete apparatus, what was recorded, and how
often. The next frame reveals the resulting measurements and poses a question
whose answer is still open. Keep this as one scene while both frames serve the
same experiment and learner task. The authored path stores the observation and
guiding question as distinct roles, links the question to its later answer, and
uses the visual stage to control the reveal.

The shared visual composition reserves its main area for the illustration and
data. An initial explanation and a prompted explanation revealed by that same
visual share the footer. They sit next to each other when the available width
allows it and wrap into rows on narrower layouts. Both retain their role labels.
This is a pattern for introductions to unfamiliar experiments, where learners
need the measurement context before interpreting the plot.

## Deferred

Term 2: Gauss-Markov assumptions and covariance/uncertainties, t/F tests, confidence/prediction bands, calibration limits and residual diagnostics. No publication, merge, gh-pages or talks changes are authorized by this draft request.

## Final local draft check

55 scenes are now selected. All 55 were traversed in both light and dark mode at 1440 × 900, with zero main-view overflow findings, zero KaTeX errors, zero media fallback findings and zero browser errors. Closed Symbols disclosures and hidden fragments are excluded from visible-overflow checks; opened long legends and PDF pagination are not certified by this traversal. Evidence: `.local/level8/visual/report.json` and screenshots. Live manual controls updated the fitted curve, five residual segments and SSE; keyboard navigation advanced an authored SVG from stage 0 to stage 1 without leaving the scene. The slope step was refined to 0.01 so the worked optimum 1.99 is selectable.

After that parameter change: 854 focused assertions passed again, focused SHACL returned true / zero results, and the TypeScript canonical transport validator accepted all 55 scenes and all five live experiments. Automatic drift, quadratic and reciprocal fits reproduce the independent numerical checks. Worker handoff contains the 100-expression KaTeX check. This remains an initial teaching draft rather than an approved lecture or release.

Review boundary: no portrait, PDF, full-course regression or independent pedagogy acceptance is claimed. A headless direct scene-hash startup sometimes painted a blank initial frame until the next navigation despite a populated present scene; the deck opened from its beginning and subsequent normal traversal rendered correctly. Use the beginning-of-deck URL for this initial review; investigate direct-hash startup before publication.
