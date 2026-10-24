# Agent handoff

## Role

Owner-directed Chemometrics publication assistance, not a dispatcher claim.

## Issue

#290, reviewed Level 4 publication increment, stacked on #289 at
`811d09badfb6eb23e1dcb064d4a7e0f326d22a21`.

## Completed

- Consolidated the owner-reviewed 65-scene lecture and its fifth overworld SVG.
- Included canonical narration, formula legends, linear-interpolation terminology,
  three standardized R labs, shared statistical views and compact script printing.
- Preserved numerical calculations and stable RDF identifiers. Additive shared
  contracts are documented in ADRs 0016 through 0019.
- Kept the proposed 22-question curation plan explicitly unapproved/unimplemented.
- Made Pitch tests generate their disposable Level 4 fixture themselves; thumbnail
  projection tests use that fixture instead of assuming the default runtime is a
  full course. Static no-JavaScript fallbacks also use linear-interpolation wording.

## Files or resources changed

Level 4 TriG resources and exact path selection, additive statistical vocabulary
and SHACL, Core statistical primitives, existing D3/Reveal/self-study/Pitch
adapters, tests, bounded preview/review tools, documentation and package metadata.
The AGENTS.md addition records the authored same-slide formula-legend invariant.
No workflow state, semantic-authoring tooling or GitHub Actions changes.

## Verification

- Earlier focused test, browser, actual R and PDF results are recorded in the
  lecture review documents. They are bounded evidence, not full acceptance.
- Full `npm test` is being rerun for this publication. The PR records its observed
  final result and exact source commit; pending execution is not a pass.
- Required external context: `agent-validator/project-chemie-digital` on the
  exact submitted head. Local tests do not replace it.
- Browser evidence includes keyboard R-glossary scrolling, non-color labels,
  numeric chart alternatives, light/dark desktop/mobile thumbnail navigation,
  and complete printed matrix plates. This is not a full accessibility audit.
- No new telemetry, personal learner records, external secrets or credentials.

## Decisions and assumptions

The owner explicitly authorized pushing and a PR, followed by build/Pages work.
This does not authorize merging, dispatcher reassignment or implementing the
curation proposal. Existing Desktop PDFs and external review artifacts remain
outside Git. Historical local-only statements in older reviews describe those
earlier turns, not the publication status of this increment.

## Risks or unresolved questions

The first production validation at `f77e7380` failed with 532 SHACL violations;
no merge or deployment followed. The owner then explicitly requested repair.
Corrections and regression evidence are recorded in
`docs/chemometrics-level4-semantic-integration-fix.md`. The PR now targets
`chemometrics` directly and includes #289, which is to be closed as superseded
only after successful integration. Full and external validation must be fresh
for the correction head; the original head's evidence is not reusable.

- Broad shared rendering/contract changes require independent review and fresh
  integration evidence before acceptance; the earlier source stack is unmerged.
- The final moment-lab `stopifnot` still checks the last loop series only, as
  documented in its glossary. No claim that it checks all series.
- System #279/#280 owns separate semantic-authoring tooling and is not modified.
- Deployment is separate from source publication. Preserve existing gh-pages
  CNAME, .nojekyll, unowned files, artifact hashes and native deployment settings.
- Nested-path hosting remains unsupported for the R runtime; use domain root.

## Recommended manager action

Review the exact draft head and validation evidence. Do not merge or accept on
the strength of focused screenshots, older SHA evidence or this handoff alone.
