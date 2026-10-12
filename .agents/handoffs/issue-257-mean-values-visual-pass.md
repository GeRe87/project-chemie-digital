# Agent handoff

## Role

Semantic Web and Ontology Engineer / Chemometrics content worker

## Issue

#257 — Polish Level 2 Mean Values with semantic visual resources and targeted emphasis

Branch: `agent/257-mean-values-visual-pass`, stacked on committed PR #185 head.
The isolated worktree excludes the owner's uncommitted Pitch HTML. Main and
System workflow states are unchanged; #217 remains unaccepted.

## Completed

- Short reusable facets replace all eleven active sentence-length theory
  KeyPoint selections, preserving the scientific bodies and all 21 original
  source-linked KeyPoints for other views.
- Arithmetic mean, expectation, LLN, geometric/harmonic mean and median now
  infer existing card/aside compositions instead of unconstrained theory stacks.
- Water analysis selects a five-row table plus three short numerical results.
  All concentrations, units, equal weighting and original formulas are retained.
- Diffusion selects a two-layer flow in the generic formula/visual composition,
  retaining the model-specific assumptions and coefficient.
- A supported title FlowDiagram shows five outcomes → sum → repeated sample;
  the local accessible SVG is retained for reuse, not selected by the active deck.
  Existing growth flow and turbidity chart are preserved.
- Cards carry supported source-backed vector motifs and subordinate examples
  using the existing Font Awesome-arrow convention.
- Added nine tests exercising the actual TypeScript composition policy over
  compiled TriG, table arithmetic, SVG alternatives/locality, diagram assumptions,
  motif provenance and removal of long automatic marker lists.
- Documented all thirty-one scenes with explicit completed/retained/deferred visual
  behavior rather than claiming full browser acceptance.

## Files or resources changed

- `ontology/dataset/chemometrics-mean-values-{examples,scenes,path}.trig`
- `apps/pitch/public/chemometrics/mean-values-five-dice.svg`
- `tests/mean_values_expectations.py`
- `tests/test_chemometrics_mean_values_{examples,keypoints,path,scenes,visuals}.py`
- `tests/test_prompt_static_fallback.py`: only the exact scene count changed to
  31 following the explicitly authorised speed exercise/solution split.
- `docs/migration/chemometrics-mean-values-level-2.md`, Level 2 README paragraph
- This handoff and only Chemometrics workflow state

No ontology/SHACL/compiler/renderer/application source changes; no Level 1 or
owner-local HTML changes. Water's original detailed resources remain in the
path even though the presentation now uses a table.

## Verification

- [x] Focused automated tests: revised slide-first run passed all 33 tests
  (`python -m unittest discover -s tests -p "test_chemometrics_mean_values*.py"
  -v`, 60.567 seconds). Subsequent polish shortened only the speed diagram caption
  and removed a duplicate note from the displayed solution. The seven existing
  static-fallback tests were rerun successfully on that final content (3.413 s).
  The new visual/fallback tests and full project suite are rerun as final evidence.
- [x] Semantic validation: both focused SHACL tests passed with pyshacl 0.40.0.
- [ ] Full `npm test`: revised content run is in progress. The **earlier draft**
  failed, exit 1. Python semantic suite: 395 tests,
  one error (394 passed), 399.731 seconds. The failing test is
  `test_prompt_static_fallback.PromptStaticFallbackTests.test_mean_values_runtime_static_fallback_handles_free_text_exercises`.
  `scripts/generate_canonical_runtime.py:1779` accesses `block["text"]` for the
  new `media-reference` title block and raises `KeyError: 'text'`. This is a
  reproducible shared static-fallback implementation gap, not an infrastructure
  error. Later TypeScript/core/renderer/Pitch phases were **not reached**.
  The preliminary run began before final small example/documentation polish;
  no passing exact-head/full-suite evidence exists.
- [x] Representative browser check performed: installed Edge via Playwright,
  reduced motion, deck view, 1440×900 and 390×844, nine scene targets, screenshots
  and geometry report in approved temporary `level2-257-browser/`. No page
  errors. This is not full visual acceptance; measured limits remain below.
- [x] Accessibility authoring check: local SVG title/description/alternative;
  semantic table headers/caption; reading order and math spoken alternatives
  retained. This is not a browser/accessibility audit.
- [x] Documentation updated with complete scene audit and exact limitations.

## Decisions and assumptions

- No new scientific claims; facets restate accepted definitions/examples and
  remain connected to their original owners using existing semantic relations.
- The 30 original scene identities remain; one speed-solution scene was added
  after the unchanged exercise under explicit manager readability-split authority.
  Unit/path identities and six focus concepts remain unchanged. This avoids a
  measured 1099px-high combined speed slide at a 900px desktop viewport.
- npm dependencies were installed in the isolated worktree without changing the
  lockfile. npm reported three existing dependency advisories (one low, two high);
  dependency upgrades are out of scope and no audit fix was run.
- Generated outputs from validation are disposable, not authored content and
  must be excluded from the PR.

## Risks or unresolved questions

1. Word-level marker ranges are unsupported by the current RDF/compiler/renderer
   path. KeyPoint items and card descriptions project plain text, while lecture
   CSS highlights entire list-item spans. Long automatic highlights are removed
   from theory scenes, not replaced with falsely claimed phrase highlights.
2. Generic exercise+media grouping is not authorable through the current compiler;
   prompt-grid accepts only prompts and prompt-code supports only surrounding
   explanatory prose. Six discussion thumbnails, dice visuals beside code and
   some lab sketches cannot be mounted as combined exercise cards without a
   shared System follow-up. The speed diagram is now shown on its own solution
   scene; the original exercise and answer remain unchanged.
3. Actual browser review found phone deck scaling too small, narrow diffusion
   formula overflow/undersized diagram, arithmetic near the desktop height limit,
   and minor vertical math overflow in paired cards. Geometric horizontal clipping
   was fixed by an independently authored equivalent compact log expression;
   the original formula is preserved. See the 31-scene audit.
4. PR #185 is unmerged; final integration requires compatible reconciliation and
   fresh exact-head `agent-validator/project-chemie-digital` success. This worker
    does not accept or merge its own result.
5. The general `static_fallback()` handles neither `media-reference` nor a
   generic unknown-block error before its terminal prose branch. Selecting the
   local title SVG caused the original failure. The manager-authorised content
   replacement with a supported FlowDiagram now restores ordinary generation and
   static fallback. The shared media limitation still exists, but is not an active
   Level 2 blocker. No compiler edit or failing-test suppression was performed.

## Slide-first implementation

- Speed: separate unchanged exercise from a solution with calculation and a
  readable two-section diagram. Keep 100 m/100 m, 10/2 m/s, 10/50 s and 3.33 m/s.
- Geometric mean: two existing-style paired infocards, with source-linked compact
  log math (`ell = mean(log x)`, `G = exp(ell)`, positive inputs). No clipping by
  arbitrary font shrinking and no shared formula overwrite.
- Turbidity: side-by-side table/chart; original day-order and separately sorted
  rank-order values, middle 2.2 NTU and extreme 45.0 NTU all explicit.
- Odd/even cards: bracketed middle observation/pair; unchanged median formulas.
- Built preview at localhost port 5176 is isolated from disposable test outputs.
  Production build succeeded; files stay outside the repository. No deployment.

## Recommended manager action

`review / split follow-up` — review the visible slide-first increment and browser
evidence; retain measured fit issues and deferred phrase/thumbnail capabilities.
Require the final full-suite result, compatible integration and exact-head external
validation before acceptance. Do not mark the complete owner request done yet.
