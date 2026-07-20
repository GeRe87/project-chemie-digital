# Project Chemie Digital - Scheduled Dispatcher Protocol

This protocol extends the pinned `agent-workflow-core` scheduled-dispatcher protocol for the repository's GitHub-Issue and draft-PR work model.

## Authoritative project files

- Workflow configuration: `.agents/workflow-config.json`
- Workflow state: `.agents/state.json`
- State schema: `.agents/state.schema.json`
- Operating instructions and human approval gates: `AGENTS.md`
- Detailed operating model: `docs/agent-operating-model.md`
- Worker role profiles: `.agents/roles/`
- Handoff template: `.agents/templates/handoff.md`
- Handoffs: `.agents/handoffs/`
- Planning sources: `docs/backlog.md` and current ADRs
- Work units: GitHub Issues, `agent/*` branches and draft pull requests

## Required read order

1. `.agents/workflow-config.json`.
2. The exact pinned Core schema, protocol and every listed governance file.
3. This project protocol.
4. The complete current state and state schema.
5. `AGENTS.md`, current issues, open pull requests, latest handoff, backlog and relevant ADRs.

## State mapping

- `status: ready`, `turn: manager` corresponds to `nextTurn: manager`.
- `status: ready`, `turn: worker` corresponds to `nextTurn: worker`.
- `status: busy` means the exact turn is claimed under the lease.
- `status: blocked` means no scheduled turn may proceed until the recorded blocker is resolved by authoritative evidence or explicit human governance.
- `status: complete` means no further scheduled project action is currently required.

`nextTurn` must agree with `turn` whenever status is `ready` or `busy`.

## Manager turn

The manager plans, assigns and reviews. It may change planning, issue metadata and workflow state, but it must not implement feature code.

Before assignment, the manager verifies the selected issue, role profile, dependencies, current branches and open pull requests. It assigns at most one issue and one role. A worker assignment sets both `turn: worker` and `nextTurn: worker`.

The manager may merge only the exact accepted pull request into `main`, only after the configured external status is `success` on the current head and every pinned merge-policy condition is satisfied. It must use the configured merge method and an expected-head guard when supported. A merge turn does not authorise another assignment or worker execution.

## Worker turn

The worker executes only `activeIssue` under `activeRole` on `agent/<issue-number>-<short-slug>`. It produces one coherent reviewable increment, deterministic tests or validation, a draft pull request and a structured handoff. It never merges.

After handoff, the worker returns control by setting both `turn: manager` and `nextTurn: manager`, clearing the lease and retaining enough assignment evidence for manager review.

## Validation evidence

Project Chemie Digital is pinned to Agent Workflow Core commit `e04fddc8cf6de6e03da6305a475ff0a04ae29521` and uses `external-commit-status`.

The required status context is `agent-validator/project-chemie-digital` on the exact current pull-request head SHA. The local validator publishes one bounded diagnostic comment identified by `<!-- agent-workflow-validator:project-chemie-digital -->`.

The manager must:

1. reload the pull request and obtain its current head SHA immediately before a verdict;
2. require `success` for the configured context on that exact SHA;
3. inspect the marked comment for diagnostics but never treat it alone as passing evidence;
4. reload the current head again immediately before merge.

Classifications:

- `missing`: no required status exists on the current head; block.
- `pending`: validation is running; block.
- `success`: all locally configured project commands passed; this is the only passing state.
- `failure`: a project validation command returned non-zero; use the diagnostic to plan a bounded correction.
- `error`: local validator infrastructure failed; do not invent a source-code correction.

Evidence from another SHA is stale and rejected. GitHub Actions are not an authorised validation provider. Managers and workers must not invoke, await, diagnose or recreate Actions workflows as project evidence.

## Lease and optimistic locking

- Use the lease duration from `.agents/workflow-config.json`.
- Before every state update, fetch the complete latest state and current SHA.
- Claim only a `ready` state by setting `status: busy` and populating `lease`.
- Never take over an unexpired lease.
- Increment `stateRevision` and append one `transitionHistory` entry for every successful transition.
- Retain only the configured number of transition entries.
- Do not store GitHub SHAs in state content.

## Human approval gates

All gates in `AGENTS.md` remain binding. Governed manager merging is allowed only when explicitly enabled in `.agents/workflow-config.json`. Agents do not publish releases or OER, alter visibility or access, add credentials, deploy, or make legal, examination-regulation or data-protection decisions.

## Notifications

Report only a completed or blocked worker result, a manager review verdict, a merge result, a new worker assignment, a workflow blocked or complete transition, or an expired lease requiring intervention. Do not notify for unchanged state, an unexpired lease or a genuine no-op.
