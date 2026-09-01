# Agent handoff

## Role

`Software Architect`

## Issue

`#110 — Establish independent System and Chemometrics workflow instances`

## Completed

- Added a project-local workflow registry with exactly two worker-capable lanes: System and Chemometrics.
- Added independent Core-compliant workflow configurations with unique `workflow_id` and `state_file` values while preserving the pinned Core commit, state schema, project protocol, one-turn limit, exact-head external validator contract, and manager-only squash merge policy.
- Added independent initial `ready/manager` states with separate lease/revision boundaries and no migrated active work.
- Corrected the migration so the feature PR no longer authors or terminalizes the still-live root `.agents/state.json`.
- Made all four System/Chemometrics configuration and state paths literal and copyable in `AGENTS.md`, `.agents/dispatcher-protocol.md`, and `docs/agent-operating-model.md`.
- Defined registry-based root-lane deactivation at merge plus manager-only final root terminalization in the merge-completion handoff.
- Preserved cross-track assignment evidence, conflict/dependency gating, sequential integration, and integration-basis freshness.
- Added deterministic `unittest` coverage discovered by the existing `npm test` -> `test:semantics` path.

## Files or resources changed

- `.agents/workflows/index.json`
- `.agents/workflows/system/workflow-config.json`
- `.agents/workflows/system/state.json`
- `.agents/workflows/chemometrics/workflow-config.json`
- `.agents/workflows/chemometrics/state.json`
- `.agents/dispatcher-protocol.md`
- `AGENTS.md`
- `docs/agent-operating-model.md`
- `tests/test_parallel_workflows.py`
- `.agents/handoffs/issue-110-parallel-track-workflows.md`

`.agents/state.json` is intentionally absent from the feature-PR scope. The current root dispatcher state on `main` remains authoritative until the accepted PR merges.

## Verification

- [ ] Automated tests — focused deterministic coverage is present; authoritative `npm test` evidence is the external exact-head `agent-validator/project-chemie-digital` status on the final PR head.
- [ ] Semantic validation — no ontology/TriG or semantic contract content changed; the full validator remains authoritative.
- [ ] Manual browser check — not applicable; no application/UI files changed.
- [ ] Accessibility check — not applicable; no user-facing UI changed.
- [x] Documentation updated.

## Decisions and assumptions

- Parallelism is implemented with two independent workflow instances, not by broadening `.agents/state.schema.json` or allowing multiple roles/issues/leases in one state.
- Before this PR merges, `main`'s root config/state remains the sole live dispatcher. Track states in this branch must not be claimed before activation.
- At merge, `.agents/workflows/index.json` becomes authoritative for discovery and its legacy `workerExecution: false` value immediately prevents root-lane execution.
- The root state is not pre-terminalized in the PR because legitimate manager/worker transitions continue to mutate it during review. In the manager merge-completion handoff, after the accepted squash merge and before either new lane is assigned work, the manager performs one optimistic-locking root transition that sets `.agents/state.json` to `status: complete`, clears its lease, increments the revision and records the migration-completion transition. That manager-only state transition is the final audit closure of the legacy dispatcher.
- Both track configs intentionally preserve the same local validator status context and PR diagnostic marker because validation is PR-head scoped; they do not create validator-provider variants.
- Cross-track concurrency requires issue-level repository evidence for Track, Intended write scope, Cross-track dependencies, and Shared contract impact.
- An unchanged PR SHA is not sufficient when another merged result changes a relevant integration basis. Only proven harmless other-track workflow-state/audit changes may avoid reconciliation; relevant or uncertain intervening changes require reconciliation with current `main` and fresh exact-head validation.

## Risks or unresolved questions

- Fresh exact-head `agent-validator/project-chemie-digital` evidence must be checked on the corrected final PR head before manager acceptance.
- No semantic/content gap was introduced or discovered; this issue intentionally does not define the later System TeachingOffering selection boundary or Chemometrics LearningPath.

## Recommended manager action

`review after fresh exact-head validation; if accepted and merged, perform the documented one-time root-state terminalization before dispatching either new track`
