# Issue #153 — CogniFlow presentation handoff

## Status

Implementation is complete on `agent/153-bar-chart-draft` and ready for fresh exact-head validation and independent review. The branch must remain Draft/unmerged until those gates are complete.

## Original issue boundary

Issue #153 started as the first semantics-authored quantitative chart vertical slice:

`TriG + SHACL -> canonical ChartBlock -> renderer-d3 -> Pitch`

with one illustrative CogniFlow bar-chart example.

During owner-directed follow-up work, the same branch was intentionally expanded into the complete eight-scene CogniFlow presentation and its supporting generic presentation runtime behavior. This expanded presentation scope is deliberate and should be reviewed as such rather than treated as an accidental issue-scope leak.

## Final audience narrative

The selected CogniFlow path now compiles to exactly eight ordered scenes:

1. `Standardized Data Processing - Project CogniFlow`
2. `One Dependency Can Break the Workflow`
3. `One Interface. Specialized Providers.`
4. `Interfaces Need Shared Meaning`
5. `One Meaning. Multiple Views.`
6. `The Result Carries Its History`
7. `From Raw Signal to Reusable Result`
8. `Take-Home`

The speaker/reveal choreography is documented in `docs/cogniflow-talk-runbook.md`.

## Implemented semantic/runtime capabilities

- additive `ChartDefinition` / `ChartRole` semantics and SHACL coverage;
- renderer-neutral SceneDocument chart blocks with provenance-preserving ordered data;
- renderer-d3 bar chart support and later line-chart/annotation support used by the analytical proof scene;
- generic Pitch chart hosts and transactional mounting;
- generic DAG-derived progressive flow reveals;
- semantic-source reveal coupling between authored RDF and the semantic graph;
- same-semantics multi-view projection (`RDF -> TABLE -> CHART`) without duplicating the semantic source;
- synchronized analytical proof progression from raw signal to FAIR artifact;
- three-principle take-home scene with one explicit closing statement;
- responsive/light/dark presentation styling built on existing theme variables;
- static fallback and source/provenance identity remain downstream of canonical semantic content.

## Current presentation design

The final presentation deliberately keeps one claim per scene and low visible density:

- problem and architecture use matching four-step reveal cadence;
- semantics, views and provenance form one conceptual middle block;
- provenance scene is domain-neutral (`INPUT DATA -> PROCESSING -> DERIVED ARTIFACT -> REUSABLE RESULT`) so it does not duplicate the analytical proof;
- analytical proof distinguishes visible chart evidence (`Baseline estimate`, `Peak apex / model anchor`, `Integration window`) from scientific result states;
- final scene is reduced to `DECOUPLED. SEMANTIC. REPRODUCIBLE.` plus `Standardize the contract, not the implementation.`

## Focused validation evidence obtained in the worker environment

- branch comparison to `main`: ahead, zero commits behind at the time of handoff preparation;
- updated CogniFlow TriG files touched late in the presentation pass were individually syntax-smoke-checked with RDFLib where possible;
- isolated `analytical-proof-runtime` Node test: 4/4 passed;
- static inspection confirms semantic-source step count derives from exactly three shown resources;
- multi-view runtime is fixed at semantic/table/chart stages (two Reveal clicks after initial RDF state);
- flow reveal counts are derived from authored DAG topology;
- analytical proof keeps five synchronized result states with final chart state frozen while lineage advances to the FAIR artifact;
- Light/Dark presentation variables required by the new CogniFlow CSS are defined centrally in `apps/pitch/src/styles.css`.

## Validation that is NOT claimed

The worker environment cannot resolve `github.com` from the local execution container, so a full checkout cannot be obtained. Therefore this handoff does **not** claim:

- repository-wide `npm test`;
- full pySHACL validation on the exact final head;
- canonical runtime generation/check on the exact final head;
- full Pitch test suite;
- Vite production/dev browser build;
- Firefox/Chromium visual acceptance at 1440x900, narrow widths, Light mode and Dark mode.

GitHub currently reports no ordinary commit status checks on the branch. Per repository workflow, fresh exact-head `agent-validator/project-chemie-digital` evidence is required before acceptance.

## Known core follow-up

`scripts/generate_canonical_runtime.py` currently promotes a chart-bearing document to SceneDocument `1.2`, but a later `DiagramRole` assignment can overwrite the version back to `1.1`. The current CogniFlow analytical scene is authored with diagram before chart, so its final compiled document remains `1.2`, and the CogniFlow regression pins that contract.

This is a generic compiler robustness defect: version promotion should be monotonic (`1.0 < 1.1 < 1.2`) and independent of SceneItem order. It should be repaired in a separate bounded core/compiler follow-up rather than by a risky partial edit from the connector-only environment.

## Required next gates

1. Run the repository's exact-head validator on the Draft PR head.
2. If validator succeeds, run the owner/browser acceptance with `npm --workspace @project-chemie-digital/pitch run dev:cogniflow`.
3. Check the eight-scene sequence in both Light and Dark themes at the canonical 1440x900 deck size and a narrow viewport.
4. Walk all reveals forward and backward, especially scenes 2, 3, 4, 5, 6 and 7.
5. Confirm no content clipping, stale chart/flow state or duplicate fragments after slide revisit.
6. Keep the PR Draft until independent review is clean; do not self-accept or merge.

## PR metadata requirement

The Draft PR should include:

`<!-- agent-workflow-validator:project-chemie-digital -->`

and

`Closes #153`
