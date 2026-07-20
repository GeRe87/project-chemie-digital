# Hourly agent operating model

## Alternating cadence

Every hourly ChatGPT run reads `.agents/state.json` through the workflow configuration and executes at most one claimed turn.

```text
Hour N:     manager reviews and assigns
Hour N + 1: specialist executes and hands off
Hour N + 2: manager reviews and assigns
Hour N + 3: specialist executes and hands off
```

Only one issue may be active in dispatcher state. This creates a deliberate review boundary between autonomous changes.

## Role selection

The manager chooses the role from the task's dominant risk:

| Dominant concern | Assigned role |
|---|---|
| Architecture and package boundaries | Software Architect |
| RDF, ontology, SHACL, SPARQL | Semantic Web Engineer |
| React, Reveal.js, D3, accessibility | Frontend Engineer |
| Fuseki, APIs, path resolution | Backend Engineer |
| Testing, local validation, security, privacy | QA/DevOps Engineer |
| Scientific content | Chemistry Lecturer |
| Learning design and assessment | Instructional Designer |
| Learner usability | Student Reviewer |
| Independent acceptance review | Reviewer |

## GitHub workflow

- Manager creates or updates one task issue.
- Worker creates `agent/<issue>-<slug>` from `main`.
- Worker opens or updates a draft PR and records a handoff.
- The local Windows validator polls open `agent/*` PRs independently of ChatGPT.
- The validator executes `npm test` on the exact head and writes `agent-validator/project-chemie-digital` plus a bounded diagnostic comment.
- Manager reviews in the next eligible hourly turn.
- Only exact-head `success`, an explicit acceptance verdict and the configured merge policy permit a manager merge.

GitHub Actions are not used. The local validator has no assignment, planning, review or merge intelligence; it only produces deterministic exact-head evidence.

## Run report

Each ChatGPT run should report only:

- turn type and role,
- issue selected or worked,
- concrete artifact created,
- PR, verdict or blocker,
- next turn.
