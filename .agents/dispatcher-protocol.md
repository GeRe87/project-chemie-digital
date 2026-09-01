# Project Chemie Digital - Scheduled Dispatcher Protocol

This protocol extends the pinned `agent-workflow-core` scheduled-dispatcher protocol for the repository's GitHub-Issue and draft-PR work model.

## Workflow registry and authority

The project workflow registry is `.agents/workflows/index.json`.

After Issue #110 activation there are exactly two worker-capable workflow instances:

- System workflow configuration: `.agents/workflows/system/workflow-config.json`
- System workflow state: `.agents/workflows/system/state.json`
- Chemometrics workflow configuration: `.agents/workflows/chemometrics/workflow-config.json`
- Chemometrics workflow state: `.agents/workflows/chemometrics/state.json`

Both reuse `.agents/state.schema.json`, this project protocol, `AGENTS.md`, the same pinned Core commit, the same external validator context and the same manager-only squash-merge policy.

Before the Issue #110 PR merges, `.agents/workflow-config.json` with `.agents/state.json` remains the live root dispatcher on `main`; the proposed track states are not live dispatcher state.

At merge activation, `.agents/workflows/index.json` becomes the authoritative lane registry. Its legacy record has `workerExecution: false`, so the root pair is immediately not a third execution lane. The feature PR deliberately does not modify the still-live `.agents/state.json`. In the manager merge-completion handoff, after the accepted squash merge and before any new track assignment, the manager performs one final optimistic-locking transition on `.agents/state.json`: set `status: complete`, set `turn` and `nextTurn` to `manager`, clear the lease, retain the Issue #110 migration evidence, increment `stateRevision`, and append a migration-completion transition. No worker may claim the root state after the merge.

This manager-only final terminalization preserves the pre-migration audit history while avoiding a feature-branch conflict with the dispatcher state that legitimately changes during review. Repository history and the retained transition history preserve the migration boundary.

## Required read order

For every post-migration run:

1. Select exactly one track from `.agents/workflows/index.json` and read that track's workflow configuration.
2. Read the exact pinned Core schema, protocol and every listed governance file.
3. Read this project protocol.
4. Read the complete selected track state and `.agents/state.schema.json`.
5. Read `AGENTS.md`, current issues, open pull requests, latest relevant handoff, backlog and relevant ADRs.
6. For a manager assignment/review/integration decision, also read the other track state and its active issue/PR evidence.

Do not fall back to the root legacy state when a track state is unavailable; fail closed.

## State mapping

The mapping applies independently to each track state:

- `status: ready`, `turn: manager` corresponds to `nextTurn: manager`.
- `status: ready`, `turn: worker` corresponds to `nextTurn: worker`.
- `status: busy` means the exact turn is claimed under that track's lease.
- `status: blocked` means that track may not proceed until its recorded blocker is resolved.
- `status: complete` means no further action is required for that workflow instance.

`nextTurn` must agree with `turn` whenever status is `ready` or `busy`.

## Cross-track conflict and dependency gate

Before assigning work and again before integrating a PR, the manager must inspect repository-backed evidence for both tracks. Every active/candidate issue must state:

- **Track**: `system` or `chemometrics`;
- **Intended write scope**: concrete repository paths, globs or bounded areas expected to change;
- **Cross-track dependencies**: issue/PR references or explicit `none`;
- **Shared contract impact**: canonical semantic identities, runtime/application contracts, workflow governance contracts or explicit `none`.

Concurrent work is permitted only when the evidence establishes independence. The manager must serialize or block when write scopes materially overlap, one track depends on the other's unmerged result, both mutate the same canonical identity/contract, or safe order cannot be established from repository evidence. Workers may never resolve this gate by editing the other track's state or by inventing undeclared semantics.

## Integration freshness

PR merges into `main` are always sequential and independently accepted.

When one track merges before the other track's open PR, the manager must inspect the intervening merged diff against the second issue's Intended write scope, Cross-track dependencies, Shared contract impact and tests.

An existing exact-head result may remain usable without branch reconciliation only when repository evidence proves the intervening merge is limited to harmless workflow-state/audit changes in the other track and does not change shared workflow configuration/protocol/schema/instructions, the second PR's write scope/dependencies/tests, or any semantic/runtime/application contract relevant to it.

If the intervening merge can affect any of those surfaces, the second PR is on an incompatible stale integration basis. The manager must withhold acceptance/merge and return that track for bounded reconciliation with current `main`; after reconciliation the changed head requires fresh `agent-validator/project-chemie-digital` success. Exact-head success on the older branch basis is insufficient. If harmlessness cannot be proven, treat the basis as incompatible and require reconciliation with current `main`.

## Manager turn

The manager plans, assigns and reviews within one selected workflow instance. It may change that track's planning, issue metadata and state but must not implement worker feature/content code.

Before assignment it applies the cross-track gate above and assigns at most one issue and one role in the selected workflow. A worker assignment sets both `turn: worker` and `nextTurn: worker` only in that track state.

The manager may merge only the exact accepted pull request into `main`, only after the cross-track/integration-freshness gate and every pinned merge-policy condition pass and the configured external status is `success` on the current head. It must use squash merge and an expected-head guard when supported. Merges remain sequential across tracks.

## Worker turn

The worker executes only `activeIssue` under `activeRole` from its selected track state on `agent/<issue-number>-<short-slug>`. It modifies only the issue-declared scope, produces tests/validation, a draft PR and a structured handoff, and never merges.

After handoff, the worker returns control by setting only its own track state to `turn: manager` and `nextTurn: manager`, clearing that track lease and retaining assignment evidence for review. A worker must not claim, update or recover the other track state.

## Validation evidence

Both workflows are pinned to Agent Workflow Core commit `e04fddc8cf6de6e03da6305a475ff0a04ae29521` and use `external-commit-status`.

The required status context is `agent-validator/project-chemie-digital` on the exact current pull-request head SHA. The local validator publishes one bounded diagnostic comment identified by `<!-- agent-workflow-validator:project-chemie-digital -->`.

The manager must reload the PR head immediately before a verdict, require `success` for the configured context on exactly that SHA, inspect the marked comment only as diagnostics, apply the integration-freshness rule, and reload the current head again immediately before merge. Missing, pending, failure, error or stale evidence blocks acceptance.

GitHub Actions are not an authorised validation provider. Managers and workers must not invoke, await, diagnose or recreate Actions workflows as project evidence.

## Lease and optimistic locking

- Use the lease duration from the selected track workflow configuration.
- Before every state update, fetch the complete latest selected track state and current content identifier.
- Claim only a `ready` state by setting `status: busy` and populating that track lease.
- Never take over an unexpired lease.
- Increment only that track's `stateRevision` and append only that track's transition history.
- Retain only the configured number of transition entries.
- Do not store GitHub SHAs in state content.

Because the state files are distinct, a valid System lease and a valid Chemometrics lease may coexist. This does not permit two turns inside either individual workflow instance.

## Human approval gates

All gates in `AGENTS.md` remain binding. Governed manager merging is allowed only when explicitly enabled in the selected track configuration. Agents do not publish releases or OER, alter visibility or access, add credentials, deploy, or make legal, examination-regulation or data-protection decisions.

## Notifications

Report only a completed or blocked worker result, a manager review verdict, a merge result, a new worker assignment, a workflow blocked or complete transition, or an expired lease requiring intervention. Do not notify for unchanged state, an unexpired lease or a genuine no-op.
