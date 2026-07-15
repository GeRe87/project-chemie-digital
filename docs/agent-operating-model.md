# Hourly agent operating model

## Alternating cadence

Every hourly run reads `.agents/state.json`.

```text
Hour N:     manager reviews and assigns
Hour N + 1: specialist executes and hands off
Hour N + 2: manager reviews and assigns
Hour N + 3: specialist executes and hands off
```

Only one issue may be active in the dispatcher state. This creates a deliberate review boundary between autonomous changes.

## Role selection

The manager chooses the role from the task's dominant risk:

| Dominant concern | Assigned role |
|---|---|
| Architecture and package boundaries | Software Architect |
| RDF, ontology, SHACL, SPARQL | Semantic Web Engineer |
| React, Reveal.js, D3, accessibility | Frontend Engineer |
| Fuseki, APIs, path resolution | Backend Engineer |
| Testing, CI, security, privacy | QA/DevOps Engineer |
| Scientific content | Chemistry Lecturer |
| Learning design and assessment | Instructional Designer |
| Learner usability | Student Reviewer |
| Independent acceptance review | Reviewer |

## GitHub workflow

- Manager creates or updates the task issue.
- Worker creates `agent/<issue>-<slug>` from `main`.
- Worker opens a draft PR.
- Manager reviews the next hour.
- Human owner decides when to merge until the governance model is explicitly changed.

## Run report

Each run should report only:

- turn type and role,
- issue selected or worked,
- concrete artifact created,
- PR or blocker,
- next turn.
