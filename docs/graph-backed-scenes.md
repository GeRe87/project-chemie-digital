# Graph-backed scene definitions

Graph-backed scene definitions are semantic composition records. They select existing RDF resources and assign renderer-neutral communicative roles and ordering; they do not copy audience-visible prose and do not describe CSS, DOM structure or Reveal.js layouts.

## Four distinct layers

1. **Canonical knowledge resources** contain the authored concepts, labels, definitions, examples and sources. They remain reusable independently of any presentation.
2. **Graph-backed scene definitions** select those resources through explicit graph relations, order the selections and add renderer-neutral roles or optional pattern hints.
3. **Compiled `SceneDocument` snapshots** are deterministic application contracts resolved from the graph for a specific language and scene. They are derived artifacts, not authored content sources.
4. **Renderer output** applies concrete presentation mechanics to a `SceneDocument`. Reveal.js, HTML, CSS and DOM terms belong only here.

The reference scene `ex:scene-standard-deviation-definition-with-citation` resolves its heading from the German `skos:prefLabel` of `ex:standard-deviation`, reaches the definition through `cd:hasDefinition`, and reaches the citation through the selected definition's `cd:hasSource`. Its `cd:DefinitionWithCitation` value is only a renderer-neutral communicative pattern; it does not prescribe columns, typography or a concrete component.

## Authoring boundary

A later browser scene editor must edit graph-backed scene definitions: resource selectors, roles, order and optional pattern hints. It must not make Reveal.js HTML the authored source of truth. Renderer previews may display compiled snapshots, but any persistent audience-visible statement must originate from an RDF resource or a value resolved from one.

## Diagram states

`DiagramState` and `SharedEdgeAnnotation` are authored RDF resources. A state belongs to a `FlowDiagram`; each shared annotation names its member `DiagramEdge` resources through `cd:annotatesDiagramEdge`. The compiler preserves those exact identities in `SceneDocument 1.2`. Renderers may lay out and highlight the named edges, but must not infer a shared state from labels, identifiers, endpoints, or coordinates.
