# Parallel track agent operating model

## Workflow instances

Project Chemie Digital uses two independent Agent Workflow Core instances after Issue #110 activation. The exact copyable paths are:

- System workflow configuration: `.agents/workflows/system/workflow-config.json`
- System workflow state: `.agents/workflows/system/state.json`
- Chemometrics workflow configuration: `.agents/workflows/chemometrics/workflow-config.json`
- Chemometrics workflow state: `.agents/workflows/chemometrics/state.json`

```text
System workflow                         Chemometrics workflow
       |                                         |
separate config/state                    separate config/state
       |                                         |
       +--------- independent leases ------------+
                         |
                sequential manager
                  integration to main
```

Each workflow independently enforces `maximum_turns_per_run = 1`, one role/work item per claimed turn, optimistic state locking and manager review. Parallelism comes only from separate workflow state/lease files; it never comes from multiple active roles, issues or leases in one state document.

`.agents/workflows/index.json` is the discovery registry. After activation, the legacy entry has `workerExecution: false`; therefore `.agents/workflow-config.json` / `.agents/state.json` must not be scheduled as a third worker workflow.

## Migration boundary

Before the Issue #110 PR merges, the root workflow on `main` remains the only live authority. The new track files in the feature branch are proposed migration artifacts only.

The feature PR intentionally does not modify `.agents/state.json`. That live state continues to record the manager/worker review cycle until merge, so carrying a terminalized copy on the feature branch would create an avoidable merge conflict.

Activation occurs in two ordered steps:

1. The accepted Issue #110 PR is squash-merged. At that instant `.agents/workflows/index.json` becomes the authoritative discovery source, and `workerExecution: false` deactivates the root pair as an execution lane. The System and Chemometrics states are available independently at `ready/manager` with no active issue and no lease.
2. In the manager merge-completion handoff, before dispatching either track, the manager performs the one-time root audit transition: `.agents/state.json` is updated through normal optimistic locking to `status: complete`, its lease is cleared, its revision is incremented, and a migration-completion transition is appended. This manager-only state mutation is deliberately not part of the feature PR.

Repository history plus the retained root transition history preserves pre-migration audit evidence. No active worker lease or feature/content PR is transferred because none existed at Issue #110 assignment time.

## Per-track cadence

Each workflow may advance independently:

```text
Track A: manager -> worker -> manager -> ...
Track B: manager -> worker -> manager -> ...
```

A System worker and Chemometrics worker may therefore both hold unexpired leases at the same time. Neither may claim or mutate the other state.

## Assignment evidence and cross-track gate

Before assignment, every issue must contain repository-backed values for:

| Field | Required evidence |
|---|---|
| Track | `system` or `chemometrics` |
| Intended write scope | concrete paths/globs or bounded repository areas |
| Cross-track dependencies | issue/PR references or explicit `none` |
| Shared contract impact | affected canonical semantic/runtime/application/workflow contract or explicit `none` |

The manager reads the other track before assignment. Concurrent work is allowed only when scopes and contracts are independent. Material write overlap, dependency on an unmerged result, mutation of the same canonical identity/contract, or uncertain integration order forces serialization/blocking.

## Integration freshness

Merges into `main` are manager-only and sequential. If one track merges while the other has an open PR, the second PR is evaluated against the intervening merged diff.

Only an intervening change proven to be harmless other-track workflow-state/audit evidence may leave the existing branch basis and exact-head status usable. Shared workflow config/protocol/schema/instructions, feature/content changes, or any change capable of affecting the second issue's declared scope, dependencies, tests or semantic/runtime/application contract requires reconciliation with current `main` followed by fresh exact-head validation. Uncertain impact is treated as incompatible, not harmless.

This separates SHA freshness from integration-basis freshness: an unchanged PR head can still be stale relative to newly merged relevant work.

## Role selection

The manager chooses the role from the task's dominant risk while remaining within the selected track. Typical roles include Software Architect, Semantic Web Engineer, Frontend Engineer, Backend Engineer, QA/DevOps Engineer, Chemistry Lecturer, Instructional Designer, Student Reviewer and Reviewer.

## GitHub workflow

- Track manager creates/updates one task issue with the required assignment evidence.
- Track worker creates `agent/<issue>-<slug>` from `main`.
- Worker opens/updates a draft PR and records a handoff.
- The local Windows validator polls open `agent/*` PRs independently of ChatGPT and executes `npm test` on the exact head.
- The validator writes `agent-validator/project-chemie-digital` plus the bounded diagnostic comment.
- The same track manager reviews in the next eligible turn and applies the cross-track/integration-freshness gate.
- Only exact-head `success`, a compatible integration basis, an explicit acceptance verdict and the configured merge policy permit merge.

GitHub Actions are not used. The local validator has no assignment, planning, review or merge intelligence.

## Run report

Each run reports only its track, turn/role, issue, concrete artifact or blocker, PR/verdict and next turn for that workflow instance.
