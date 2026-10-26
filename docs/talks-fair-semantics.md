# FAIR processing and the semantic-description example

Current revision: see `talks-visual-revision.md`. The talk now has 25 scenes.
Port dialogs use shorter source-aligned ProcessingStep/Port documentation
excerpts with SKOS names/definitions and small descriptor shapes. Their actual
source vocabulary IRIs and video metadata are intentionally visible with the
speaker's approval. Earlier detailed payload examples and masking decisions
below document the prior authoring increments, not the current audience view.

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

## Transfer to processing interfaces

`talks-ted-processing-units.trig` adds three consecutive static scenes:

1. A step receives input, performs a defined task and produces output.
2. Specialized steps compose when an output meets the following input contract.
   The TED excerpt covers peak detection, component formation and marker selection;
   it is not a replacement for the earlier complete pipeline overview.
3. Three semantic columns, inspired by the workshop: the shared ProcessingUnit,
   Port and PortRole model; atomic/composite specializations and PipelineNode;
    then the illustrative qalg:FindPeaks with an EIC vector input, Peak list output
    and FindPeaks_binding. This adapts the example, not a production-service claim.
   The arrows summarize specialization and specification, not data flow or the
   direction of subClassOf assertions. Input/output meaning, types, structure,
   units and constraints still precede implementation details in the explanation.
   Matching filenames or standardized ports alone do not establish FAIR compliance.

The source is the supplied `cogniflow_workshop.html`, section
`cf-concept-domain-diagram`, pinned by SHA-256 in the RDF Source. Its `ProcessingUnit`,
`Port`, and `PortRole` concepts distinguish Input, Output and Parameter roles.
An atomic `ProcessingStep` and composite `ProcessingPipeline` share the same
interface pattern. The adaptation aligns with the existing canonical CogniFlow
teaching definitions and does not import the workshop's historical meta-model
syntax as a new ontology contract.

The shared composition now supports an inline diagram plus takeaway list. Generic
highlighted-card sizing reserves space for the thumbnail and description in
horizontal and compact layouts. Shared SVG line groups use a central baseline,
so their centre coordinate denotes the visual centre rather than an alphabetic
baseline. Authored whitespace remains preserved.

Brief browser measurements put all four affiliation labels at zero vertical
offset from their node centres (horizontal offsets at most 0.17 SVG units).
All three new diagrams kept title/body text inside their cards without page
errors. Full-suite validation remains deferred.

The corrected workshop-style ProcessingUnit view uses three ordinary flow nodes,
each with three authored `DiagramNodePart` resources. The shared renderer lays
these out as stacked subcards, using the same measurement function for layout and
rendering. It does not add a scene-specific layout or a new semantic primitive.
The existing process-system view retains its horizontal node-part treatment.
Static HTML now preserves part labels, descriptions and provenance too. A brief
light-theme preview confirmed three columns, nine subcards, in-bounds subcard
text and no page errors; the dark view was also inspected.

## Apply the model and start it from a measurement event

`talks-ted-semantic-execution.trig` adds two static scenes after the model:

- The full TED workflow as five specialized ProcessingSteps, with explicit main
  input/output contracts. Four connections pass EICs, features, components and
  marker areas. Parameter configuration and additional calibration/sample-mass
  requirements are retained in the definitions and narration. Implementation
  bindings are separate from the workflow description.
- Event server, execution engine and pipeline execution as three compound cards.
  Acquisition must have ended and the file must be completely saved/available
  before a ready event triggers the engine. The engine loads the selected pipeline,
  checks its declared interfaces, resolves configured implementations and starts
  the run. Outputs retain their execution provenance.

The engine capability is attributed to the speaker. This authoring increment does
not configure or deploy an engine, watcher or executable processing workflow.
Readiness, permissions, duplicate-event handling, retries and failure reporting
remain real deployment requirements; no exactly-once guarantee is claimed. Event
arrows are control flow, distinct from the pipeline's output/input dependencies.

The presentation deliberately omits the underlying system's name. Audience text,
speaker notes and the workshop Source's public title/description/identifier are
neutral. Existing internal resource identities and the source hash are retained;
the original source-file mapping remains in this internal documentation history.
Prepared guards check the audience-text boundary, compatible connections and
the completed-measurement/fully-saved-file readiness order.

Generation, a brief dark-theme browser preview and a read-only artifact check
succeeded: 20 scenes including the title, four matching output/input contracts,
no system name in audience text or notes, and all execution subcard text inside
its panels without page errors. Comprehensive suites remain deferred.

## Illustrated models and inspectable ports

The model keeps its three semantic columns but adds reusable colored SVG
illustrations above shorter subcards. Event-driven execution now uses large
measurement/file, engine and result illustrations instead of another nine-card
text panel. The earlier detailed event resources remain linked as semantic parts;
speaker notes preserve the readiness and provenance requirements. No new scene
layout or third-party images are introduced.

The four pipeline connectors expose source-linked `codeDetail` content. Their
labels are underlined, focusable SVG buttons. Click, Enter or Space opens the
shared explanation dialog; Escape restores focus, and hash navigation closes it.
The runtime uses edge identities, not label strings or scene identities.

`talks-ted-port-contracts.trig` authors four separate named graphs for EICs,
features, components and marker areas. Each contains an Input/Output port pair,
one shared carried type, and a common SHACL data shape. The edge links its
`cd:PortContract`; `cd:contractGraph` selects the exact bounded authored graph.
The compiler serializes that graph as TriG, preserving named-graph identity,
rather than copying a manually maintained code literal. Core checks the detail
contract; SHACL checks paired roles and shared meaning/shape. Static and self-study
alternatives retain the descriptions and TriG source.

These schemas are explicitly proposed teaching minima, not published community
standards or the installed engine's production schemas. EICs retain m/z, time in
seconds, intensity and intensity units. Feature entries retain their EIC link,
time, area and units; components retain members and a shared-shape identifier;
marker areas retain component/assignment identity, area and units. Empty feature,
component or marker collections are permitted. Structural conformance does not
establish chemical identification, correct fits or calibration validity.

Bounded checks accepted a valid synthetic payload and rejected a missing required
field for each of the four shapes. Projected TriG graphs matched their authored
graphs isomorphically. A brief browser check opened every connector, restored
focus on Escape, and opened a contract by keyboard without advancing the slide.
Comprehensive project suites remain deferred.
