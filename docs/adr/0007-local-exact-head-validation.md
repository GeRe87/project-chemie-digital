# ADR 0007: Local exact-head validation without GitHub Actions

- Status: Accepted
- Date: 2026-07-20

## Context

Project Chemie Digital requires deterministic validation of JSON, RDF/SHACL content, Python tests and TypeScript package tests. GitHub Actions runs were unavailable and produced no reliable executable evidence through the available repository workflow. The project is also subject to the explicit requirement that GitHub Actions must not be used.

Agent Workflow Core commit `e04fddc8cf6de6e03da6305a475ff0a04ae29521` defines a closed `external-commit-status` provider. `GeRe87/agent-workflow-validator` provides a local, non-intelligent poller that downloads an exact pull-request head, executes locally trusted commands and publishes a commit status plus a bounded diagnostic comment.

## Decision

The project uses:

- provider: `external-commit-status`
- required context: `agent-validator/project-chemie-digital`
- exact-head requirement: `true`
- diagnostic marker: `<!-- agent-workflow-validator:project-chemie-digital -->`
- local command: `npm test`

Only `success` on the exact current pull-request head is passing. The diagnostic comment is required for bounded context but is not itself the merge gate. Missing, pending, failure, error and stale-head evidence block acceptance and merge.

The local host supplies Python 3.11+, `pyshacl==0.40.0`, Node.js 22+ and npm. The validator does not plan work, alter workflow state, review code or merge pull requests.

## Consequences

- `.github/workflows/validate.yml` is removed.
- No GitHub Actions workflow may be added or restored as project validation evidence.
- Workers continue to use `agent/*` branches and draft pull requests.
- Managers inspect the current head immediately before verdict and merge.
- Local validator infrastructure errors do not justify speculative source-code changes.
- The Windows validator task and ChatGPT dispatcher remain disabled until the migration PR passes local exact-head validation and is accepted.
- Any change to the required context, marker, provider or immutable Core pin requires a controlled ADR update.
