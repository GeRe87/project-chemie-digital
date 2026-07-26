# project-chemie-digital

Private development project for the FCI-funded module **Digitalisierung in der Chemie: Datenmanagement, Prozesse, KI**.

The project follows a knowledge-first architecture:

1. Educational knowledge and resources are described semantically.
2. Learning and narrative paths select and order relevant resources.
3. A scene composer transforms a path into presentation states.
4. Reveal.js renders live presentations as one output channel.
5. Additional renderers may provide self-study, knowledge-network, print and OER views.

## Initial vertical slice

The first demonstrator is the pitch presentation for the Studiendekanat. It will be rendered with the same platform architecture planned for the later course.

The technical proof of concept uses **standard deviation**:

- concept and relations in RDF/JSON-LD,
- definition, formula, symbols, examples and exercises as reusable resources,
- a default learning path,
- scene composition,
- Reveal.js rendering,
- a generated knowledge-network view.

## Local validation

The repository is validated without GitHub Actions. The sole authorised automated provider is the local exact-head validator at `GeRe87/agent-workflow-validator`.

Required commit-status context:

```text
agent-validator/project-chemie-digital
```

Required diagnostic marker:

```html
<!-- agent-workflow-validator:project-chemie-digital -->
```

The status must be `success` on the exact current pull-request head. The marked comment is diagnostic only; an older-head status or comment is stale and non-passing.

The local project command is:

```bash
npm test
```

The host requires Python 3.11+, `pyshacl==0.40.0`, Node.js 22+ and npm. `npm test` performs JSON checks, SHACL semantic validation, Python semantic tests, core tests and Reveal renderer tests.

## Semantic validation

The complete semantic slice is assembled from canonical TriG files under `ontology/dataset/` plus explicitly isolated JSON-LD compatibility inputs that have not yet migrated. SHACL validation reads the named `graph/shapes/*` graphs from the assembled Dataset. The retired flat `ontology/learning.ttl` and `ontology/shapes.ttl` files are no longer validation inputs.

```bash
python -m pip install -r requirements-dev.txt
npm run check:semantics
npm run test:semantics
```

Path order is represented by each `cd:PathStep` integer `cd:position`; `cd:hasStep` is an unordered RDF relation and does not create an RDF list node.

## Repository principles

- `main` remains reviewable and stable.
- Agents work through issues, `agent/*` branches and draft pull requests.
- Workers never merge their own work.
- Architectural decisions are recorded as ADRs.
- Semantic content is validated with SHACL.
- Content, didactic paths, scenes and rendering remain separate layers.
- Reveal.js is a renderer dependency, not the platform domain model.
- GitHub Actions workflows must not be added or restored.

See `AGENTS.md` and `docs/agent-operating-model.md`.
