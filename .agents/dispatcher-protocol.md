# Project Chemie Digital — Scheduled Dispatcher Protocol

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
- Work units: GitHub Issues, branches and draft pull requests

## State mapping

The common core state concepts map to the project state as follows:

- `status: ready`, `turn: manager` corresponds to `nextTurn: manager`.
- `status: ready`, `turn: worker` corresponds to `nextTurn: worker`.
- `status: busy` means the exact turn is claimed under the lease.
- `status: blocked` means no scheduled turn may proceed until the recorded blocker is resolved by authoritative repository evidence or explicit human governance.
- `status: complete` means no further scheduled project action is currently required.

`nextTurn` is retained for compatibility and must agree with `turn` whenever status is `ready` or `busy`.

## Manager turn

The manager follows `AGENTS.md` and may perform only planning, review, issue assignment and workflow-state changes. It must not implement feature code or merge a pull request.

Before assignment, the manager must verify the selected issue, role profile, dependencies, current branches and open pull requests. It assigns at most one issue and one role. A worker assignment sets both `turn: worker` and `nextTurn: worker`.

## Worker turn

The worker executes only `activeIssue` under `activeRole`, on the governed `agent/<issue-number>-<short-slug>` branch. It produces one coherent reviewable increment, validation evidence, a draft pull request and a structured handoff. It never merges.

After the handoff, the worker returns control by setting both `turn: manager` and `nextTurn: manager`, clearing the lease and retaining enough assignment evidence for manager review.

## Lease and optimistic locking

- Use the lease duration from `.agents/workflow-config.json`.
- Before every update to `.agents/state.json`, fetch its complete latest content and current SHA.
- Claim only a `ready` state by setting `status: busy` and populating `lease`.
- Never take over an unexpired lease.
- Increment `stateRevision` and append one `transitionHistory` entry for each successful state transition.
- Retain only the configured number of transition entries.
- Do not store GitHub SHAs in state content.

## Human approval gates

All gates in `AGENTS.md` remain binding. In particular, scheduled agents do not merge pull requests, publish releases or OER, alter visibility, add credentials, or make legal, examination-regulation or data-protection decisions.

## Notifications

Report only a completed or blocked worker result, a manager review verdict, a new worker assignment, a workflow blocked or complete transition, or an expired lease requiring intervention. Do not notify for unchanged state, an unexpired lease or a no-op check.
