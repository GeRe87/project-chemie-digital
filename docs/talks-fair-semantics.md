# FAIR processing and the semantic-description example

The TED talk continues with two TriG-authored scenes:

1. `talks-ted-fair.trig`: the four FAIR principles, applied to a multi-step,
   multi-tool processing pipeline. Each step needs identified inputs and outputs,
   parameters, units, software versions and execution provenance. Shared formal
   semantics supports interoperability and reuse; it does not replace persistent
   identifiers, searchable metadata, retrieval infrastructure, access conditions
   or explicit reuse licenses. FAIR does not require unrestricted public access.
   The source is Wilkinson et al. (2016), DOI `10.1038/sdata.2016.18`.
2. `talks-ted-semantics.trig`: English prose, an equivalent TriG serialization and
   an on-demand relationship graph. The source statements are the speaker's
   illustrative affiliation story, not an independently verified directory.

## One example, consistent identities

Four entities use illustrative `https://example.org/fair-demo/` identifiers:
Gerrit, the University of Duisburg-Essen, its Instrumental Analytical Chemistry
group and Torsten C. Schmidt. `schema:alternateName "UDE"` belongs to the existing
university entity. It must not introduce a second university. The four relations
are `schema:worksFor`, `org:memberOf`, `org:unitOf` and `org:headOf`.

The nine actual RDF statements live in the named graph
`https://w3id.org/project-chemie-digital/graph/ted-demo-affiliations`.
The authored CodeExample serializes that exact graph, including graph identity.
Diagram nodes reference those entities and edges reference their predicates.
The prepared content guard parses the displayed TriG and compares all triples
and all four visual relationships against the authored graph.

Names and aliases are literals, identifiers name entities, and predicates give
the relationships their meaning. `@base` and prefix declarations only abbreviate
IRIs. The example is not a demonstration of production identifier persistence or
FAIR compliance by syntax alone.

## Reusable on-demand diagram presentation

`cd:diagramPresentation` accepts `"inline"` (default) or `"dialog"` for flow,
network and sequence diagrams. It projects to `DiagramBlock.presentation` with
provenance and has both SHACL and core contract checks.

Pitch renders a dialog diagram as a compact launcher. The graph mounts on first
open, after the modal has a measurable width. It reuses the shared D3 renderer,
diagram theme and explanation-dialog lifecycle. Escape and the close button
dismiss it, focus returns to its launcher, and Tab remains in the dialog.
Hash navigation closes it; teardown removes listeners and components. Full graph
alternatives remain in generated static exports and self-study output.

The shared composition policy places prose and code in two columns and the
dialog launcher in the footer. This depends on block kinds and presentation
metadata, not lesson or resource identifiers. Compact network layout now gives
long entity names more room and measures their bold titles conservatively.

## Current verification boundary

Runtime generation and brief browser inspection succeeded. The overlay showed
four nodes, closed on Escape with focus restored, and reopened without duplicate
nodes or page errors. A read-only RDF check matched all nine displayed statements
and all four graph edges to their authored assertions. Comprehensive tests remain
deferred while the talk is being authored; no full-suite success is claimed.
