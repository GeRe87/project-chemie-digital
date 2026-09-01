# Agent operating instructions

## Mission

Develop a semantic authoring and orchestration platform for chemistry education. The platform stores concepts, definitions, mathematical expressions, examples, exercises, learning objectives, sources and their relations as semantic resources. Learning paths select resources; renderers turn resolved paths into usable views such as Reveal.js presentations.

## Non-negotiable architecture

- RDF is the semantic model.
- TriG files under `ontology/dataset/` are the sole authored semantic source and assemble into one logical RDF Dataset with preserved named-graph identity.
- JSON is permitted only as disposable generated transport or non-semantic application configuration; retired JSON-LD/Turtle compatibility sources must not be restored.
- Apache Jena Fuseki is the planned RDF database.
- TypeScript is the primary application language.
- React components provide interactive views.
- Reveal.js is an encapsulated presentation renderer.
- The core domain model must not depend on Reveal.js.
- Markdown may be embedded as a literal for longer human-authored prose.
- SHACL validates semantic content and project invariants.

## Track workflow dispatchers

The workflow registry is `.agents/workflows/index.json`. Issue #110 replaces the single worker dispatcher with two independent Core-compliant workflow instances. Each instance still alternates strictly between `manager` and `worker`, executes at most one claimed turn per run, and has one active role/work item and one lease.

After the Issue #110 migration PR is merged, use exactly these paths:

| Track | Workflow configuration | Workflow state |
|---|---|---|
| System | `.agents/workflows/system/workflow-config.json` | `.agents/workflows/system/state.json` |
| Chemometrics | `.agents/workflows/chemometrics/workflow-config.json` | `.agents/workflows/chemometrics/state.json` |

The legacy `.agents/workflow-config.json` / `.agents/state.json` pair is retained only as the migration/audit boundary and must not be used as a manager or worker execution lane after activation. Until the migration PR is merged, the root pair on `main` remains authoritative; proposed track states on the feature branch are not live dispatcher state.

Immediately after merge, `.agents/workflows/index.json` is authoritative for lane discovery and its legacy entry with `workerExecution: false` disables the root pair as an execution lane even before the audit state is finalized. In the same manager merge-completion turn, the manager must perform the one-time root state handoff by setting `.agents/state.json` to `status: complete`, clearing its lease, and recording the migration activation in `transitionHistory`. This final root-state transition is intentionally not authored in the feature PR and no worker may claim the root state after the merge.

A System worker may claim or update only `.agents/workflows/system/state.json`. A Chemometrics worker may claim or update only `.agents/workflows/chemometrics/state.json`. Parallel execution is possible because those leases live in distinct state files; the Core one-turn rule remains unchanged within each workflow instance.

### Manager turn

The manager must:

1. Read the exact workflow configuration and state for the track being managed, all exact pinned Core sources, `README.md`, `AGENTS.md`, current issues, open pull requests and the latest relevant handoff.
2. Inspect the other track's current state and active issue before assignment and again before integration.
3. Require the candidate issue to record **Track**, **Intended write scope**, **Cross-track dependencies**, and **Shared contract impact**. `none` must be explicit when applicable.
4. Serialize or block concurrent work when write scopes materially overlap, one issue depends on the other track's unmerged result, both mutate the same canonical identity/contract, or repository evidence cannot determine a safe integration order.
5. Select one bounded task and exactly one worker role for this workflow instance.
6. Set only this track's workflow state to the worker turn without implementing worker code/content.
7. Review only the exact assigned result, handoff, cross-track gate and current exact-head validation evidence.
8. Merge PRs into `main` sequentially. A merge in one track never authorises a merge in the other track.
9. Apply the integration-freshness rule in `.agents/dispatcher-protocol.md`: a stale integration basis is acceptable only for an intervening change proven to be harmless workflow-state/audit evidence; otherwise reconcile with current `main` and obtain fresh exact-head validation before acceptance.

The marked local-validator PR comment is diagnostic evidence. It never substitutes for the required commit status. Evidence from an older SHA is stale.

### Worker turn

The worker must:

1. Read the active assignment and corresponding role file from its exact track workflow.
2. Stay within the assigned role, issue, declared write scope and track state boundary.
3. Inspect existing code and relevant ADRs before changing anything.
4. Work on `agent/<issue-number>-<short-slug>`.
5. Produce one coherent, reviewable increment with tests or deterministic validation.
6. Open or update a draft pull request linked to the issue.
7. Add a structured handoff using `.agents/templates/handoff.md`.
8. Return only its own track state to the manager turn after handoff.
9. Never claim/update the other track state, accept its own result, or merge the pull request.

## Validation boundary

Both workflows use the local exact-head validator at `GeRe87/agent-workflow-validator` with required context `agent-validator/project-chemie-digital`. GitHub Actions are prohibited and are not valid evidence. Agents must not create, restore, invoke or depend on `.github/workflows` for validation.

The authoritative project command is:

```text
npm test
```

The local host must provide Python 3.11+, `pyshacl==0.40.0`, Node.js 22+ and npm. A missing local executable or dependency is validator infrastructure error, not justification for speculative feature-code changes.

## Human approval gates

Agents must not independently:

- publish public releases or OER materials,
- change repository visibility, access, protected settings or deployment targets,
- add secrets or credentials,
- make breaking ontology changes after version `0.1.0`,
- remove accepted requirements,
- make legal, examination-regulation or data-protection decisions,
- claim pedagogical effectiveness without evidence.

Pull-request merging into `main` is not a human approval gate when governed agent merging is explicitly enabled. Only a manager may merge, and only after explicit acceptance, successful exact-head external validation, a mergeable current head, the cross-track integration gate and the pinned Core merge policy all pass.

## Definition of done

A task is done only when:

- acceptance criteria are satisfied,
- tests or validation pass on the exact current PR head and a compatible integration basis,
- documentation is updated,
- accessibility and privacy implications are considered,
- the draft PR includes a concise rationale and verification steps,
- the manager can review the result without reconstructing hidden assumptions.
