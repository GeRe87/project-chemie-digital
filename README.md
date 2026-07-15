# project-chemie-digital

Private development project for the FCI-funded module **Digitalisierung in der Chemie: Datenmanagement, Prozesse, KI**.

The project follows a knowledge-first architecture:

1. Educational knowledge and resources are described semantically.
2. Learning and narrative paths select and order relevant resources.
3. A scene composer transforms a path into presentation states.
4. Reveal.js renders live presentations as one output channel.
5. Additional renderers may provide self-study, knowledge-network, print, and OER views.

## Initial vertical slice

The first demonstrator is the pitch presentation for the Studiendekanat. It will be rendered with the same platform architecture planned for the later course.

The technical proof of concept uses the topic **standard deviation**:

- concept and relations in RDF/JSON-LD,
- definition, formula, symbols, examples, and exercises as reusable resources,
- a default learning path,
- scene composition,
- Reveal.js rendering,
- a generated knowledge-network view.

## Semantic validation

The complete standard-deviation slice is validated as one RDF graph against the repository's SHACL shapes. The graph includes `ontology/learning.ttl` and all three JSON-LD files under `content/` for the concept, resources, and default path.

```bash
python -m pip install -r requirements-dev.txt
npm run check:semantics
```

The command exits with status `0` when the graph conforms, `1` for SHACL violations, and `2` when parsing or validation cannot run. Positive and deliberately invalid negative cases can be checked with:

```bash
npm run test:semantics
```

Path order is represented by each `cd:PathStep`'s integer `cd:position`; `cd:hasStep` is an unordered RDF relation and does not create an RDF list node.

## Repository principles

- `main` remains reviewable and stable.
- Agents do not merge their own work.
- Every implementation task is linked to an issue.
- Architectural decisions are recorded as ADRs.
- Semantic content is validated with SHACL.
- Content, didactic paths, scenes, and rendering remain separate layers.
- Reveal.js is a renderer dependency, not the platform's domain model.

See [AGENTS.md](AGENTS.md) and [docs/agent-operating-model.md](docs/agent-operating-model.md).
