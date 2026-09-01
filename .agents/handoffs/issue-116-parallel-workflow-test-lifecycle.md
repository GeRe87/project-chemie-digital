# Agent handoff

## Role

`QA, DevOps, Security, and Accessibility Engineer`

## Issue

`#116 — Make parallel workflow state contract test lifecycle-aware`

## Completed

- Refactored `tests/test_parallel_workflows.py` so live track states are validated against the existing state schema and documented lifecycle instead of the initial post-migration `ready/manager` snapshot.
- Added a reusable fail-closed lifecycle assertion covering exact state/lease/transition keys, allowed status/turn enums, ready/busy turn alignment, lease ownership/timestamps, revision/history bounds and parseable timestamps.
- Preserved the rule that `busy` requires a complete non-empty lease with `expiresAt > claimedAt`.
- Preserved the rule that non-`busy` track states retain no active lease.
- Removed the invalid global requirement that `activeIssue` and `activeRole` must always be null; populated assignments remain type/identity checked.
- Added copied regression fixtures showing legitimate `busy` and `blocked` states pass while ready turn mismatch, missing busy lease, retained blocked lease and malformed timestamps fail.
- Kept the System/Chemometrics mutation-independence test meaningful without assuming the Chemometrics lease owner is always null.

## Files or resources changed

- `tests/test_parallel_workflows.py`
- `.agents/handoffs/issue-116-parallel-workflow-test-lifecycle.md`

## Verification

- [ ] Automated tests — authoritative `npm test` / exact-head external validator result is required on the Draft PR head.
- [x] Test-contract review — assertions map to `.agents/state.schema.json` and `.agents/dispatcher-protocol.md` without changing either authority.
- [x] Regression cases — explicit copied fixtures cover valid `busy`/`blocked` and invalid lifecycle/lease/timestamp combinations.
- [ ] Semantic validation — not applicable to the source change; no RDF/TriG or semantic content changed.
- [ ] Manual browser check — not applicable; no UI/application code changed.
- [ ] Accessibility check — not applicable; no user-facing behavior changed.
- [x] Scope review — no workflow state/schema/protocol/config, validator, ADR, feature/runtime/content or Chemometrics-state change is included in the worker branch.

## Decisions and assumptions

- The live checked-in track states are test inputs, not immutable fixtures. Tests therefore validate lifecycle invariants rather than one transient workflow phase.
- `nextTurn == turn` is enforced for `ready` and `busy`, exactly as documented by the project protocol.
- `blocked` and `complete` are non-busy lifecycle states and therefore must have a cleared lease; this does not force their active assignment evidence to be null.
- Timestamp rejection is exercised through the same helper used for live state validation, so malformed fixture timestamps fail in the same way as malformed repository state.
- No workflow semantics were broadened or weakened; the correction removes only the stale initial-state assumptions.

## Risks or unresolved questions

- Fresh exact-head `agent-validator/project-chemie-digital` evidence is still required before manager acceptance.
- This shared validation change must merge before PR #113 and PR #115. After merge, both older PRs require reconciliation with current `main` and fresh exact-head validation as recorded in Issue #116.
- No semantic/content gap was introduced or discovered.

## Recommended manager action

`review` after fresh exact-head validator success; verify the two-file scope and merge this unblocker before reconciling PR #113 and PR #115.
