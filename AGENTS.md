# Agent operating instructions

## Mission

Develop a semantic authoring and orchestration platform for chemistry education. The platform stores concepts, definitions, mathematical expressions, examples, exercises, learning objectives, sources and their relations as semantic resources. Learning paths select resources; renderers turn resolved paths into usable views such as Reveal.js presentations.

## Non-negotiable architecture

- RDF is the semantic model.
- JSON-LD and Turtle are accepted source serializations.
- Apache Jena Fuseki is the planned RDF database.
- TypeScript is the primary application language.
- React components provide interactive views.
- Reveal.js is an encapsulated presentation renderer.
- The core domain model must not depend on Reveal.js.
- Markdown may be embedded as a literal for longer human-authored prose.
- SHACL validates semantic content and project invariants.

## Hourly dispatcher protocol

The dispatcher alternates strictly between `manager` and `worker` turns. State is stored in `.agents/state.json` and must be interpreted through `.agents/workflow-config.json`, the pinned Core files and `.agents/dispatcher-protocol.md`.

### Manager turn

The manager must:

1. Read the complete workflow configuration and all exact pinned Core sources.
2. Read `README.md`, `AGENTS.md`, the complete current state, current issues, open pull requests and the latest worker handoff.
3. Review progress against `docs/backlog.md` and current ADRs.
4. Select one bounded task that can produce a reviewable artifact in one worker turn.
5. Select exactly one worker role from `.agents/roles/`.
6. Create or update one GitHub issue with acceptance criteria, constraints, relevant files and the selected role.
7. Set the workflow state to the worker turn without implementing feature code.
8. Review worker pull requests against the exact issue, handoff and current exact-head validation evidence.
9. Merge only when governed merging is enabled, the manager has recorded an acceptance verdict and `agent-validator/project-chemie-digital` is `success` on the exact current pull-request head.

The marked local-validator PR comment is diagnostic evidence. It never substitutes for the required commit status. Evidence from an older SHA is stale.

### Worker turn

The worker must:

1. Read the active assignment and corresponding role file.
2. Stay within the assigned role and issue scope.
3. Inspect existing code and ADRs before changing anything.
4. Work on `agent/<issue-number>-<short-slug>`.
5. Produce one coherent, reviewable increment with tests or deterministic validation.
6. Open or update a draft pull request linked to the issue.
7. Add a structured handoff using `.agents/templates/handoff.md`.
8. Return the state to the manager turn only after handoff.
9. Never merge the pull request.

## Validation boundary

The project uses the local exact-head validator at `GeRe87/agent-workflow-validator`. GitHub Actions are prohibited and are not valid evidence. Agents must not create, restore, invoke or depend on `.github/workflows` for validation.

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

Pull-request merging into `main` is not a human approval gate when governed agent merging is explicitly enabled. Only the manager may merge, and only after explicit acceptance, successful exact-head external validation, a mergeable current head and satisfaction of the pinned Core merge policy.

## Definition of done

A task is done only when:

- acceptance criteria are satisfied,
- tests or validation pass on the exact current PR head,
- documentation is updated,
- accessibility and privacy implications are considered,
- the draft PR includes a concise rationale and verification steps,
- the manager can review the result without reconstructing hidden assumptions.
