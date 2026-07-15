# Agent operating instructions

## Mission

Develop a semantic authoring and orchestration platform for chemistry education. The platform stores concepts, definitions, mathematical expressions, examples, exercises, learning objectives, sources, and their relations as semantic resources. Learning paths select resources; renderers turn resolved paths into usable views such as Reveal.js presentations.

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

The dispatcher alternates strictly between two turn types:

1. `manager`
2. `worker`

State is stored in `.agents/state.json`.

### Manager turn

The manager must:

1. Read `README.md`, `AGENTS.md`, `.agents/state.json`, current issues, open pull requests, and the latest worker handoff.
2. Review progress against `docs/backlog.md` and current ADRs.
3. Select one bounded task that can produce a reviewable artifact in one worker turn.
4. Select exactly one worker role from `.agents/roles/`.
5. Create or update one GitHub issue with acceptance criteria, constraints, relevant files, and the selected role.
6. Set `.agents/state.json` to `nextTurn: worker`, recording `activeRole`, `activeIssue`, and the expected deliverable.
7. Avoid implementation changes. The manager may update planning, state, issue metadata, and ADR proposals.

### Worker turn

The worker must:

1. Read the active assignment and the corresponding role file.
2. Stay within the assigned role and issue scope.
3. Inspect existing code and ADRs before changing anything.
4. Work on a dedicated branch named `agent/<issue-number>-<short-slug>`.
5. Produce one coherent, reviewable increment with tests or validation where applicable.
6. Open or update a draft pull request linked to the issue.
7. Add a structured handoff using `.agents/templates/handoff.md`.
8. Set `.agents/state.json` to `nextTurn: manager` and clear the active role only after the handoff is recorded.
9. Never merge the pull request.

## Human approval gates

Agents must not independently:

- merge pull requests,
- publish public releases or OER materials,
- change repository visibility,
- add secrets or credentials,
- make breaking ontology changes after version `0.1.0`,
- remove accepted requirements,
- make legal, examination-regulation, or data-protection decisions,
- claim pedagogical effectiveness without evidence.

## Definition of done

A task is done only when:

- acceptance criteria are satisfied,
- tests or validation pass,
- documentation is updated,
- accessibility and privacy implications are considered,
- the draft PR includes a concise rationale and verification steps,
- the manager can review the result without reconstructing hidden assumptions.
