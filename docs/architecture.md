# Architecture

```text
RDF / JSON-LD / Turtle source files
              |
              v
       semantic validation
           (SHACL)
              |
              v
      semantic repository
      (Apache Jena Fuseki)
              |
              v
         path resolver
              |
              v
        scene composer
              |
       +------+-------+
       |              |
       v              v
Reveal.js renderer  self-study renderer
       |
       v
interactive presentation
```

## Dependency rule

```text
renderer-reveal -> scene model -> path model -> semantic model
```

The reverse dependency is forbidden. The semantic model must not import or reference Reveal.js APIs.

## Planned packages

- `packages/core`: domain types for resources, paths, scenes, and renderer contracts.
- `packages/semantic-client`: RDF parsing, Fuseki access, SPARQL queries, and validation integration.
- `packages/renderer-reveal`: Reveal.js adapter and presentation components.
- `apps/pitch`: the first end-to-end application.
- `ontology`: ontology and SHACL source files.
- `content`: project-owned semantic examples and pitch content.
