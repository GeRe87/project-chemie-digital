# ADR-0002: Separate semantic learning-compiler layers and contracts

- Status: Proposed
- Date: 2026-07-16

## Context

The platform must turn semantic chemistry knowledge into multiple educational views without allowing any renderer to shape the core domain model. ADR-0001 already establishes Reveal.js as an encapsulated renderer. The deterministic path resolver introduced for issue #3 now provides a typed, renderer-neutral resolved-path output, but the contracts surrounding it must be made explicit before scene composition is implemented.

The source material is maintained as RDF. Individual JSON-LD or Turtle files are review units, not separate semantic authorities: together they form one logical RDF dataset whose merged graph is validated and compiled.

## Decision

The learning compiler is divided into six layers with one-way dependencies:

1. **Domain knowledge graph**
   - Contains chemistry concepts, relations, prerequisites, learning objectives, sources and provenance.
   - Uses RDF as the authoritative semantic model.
   - Must not contain presentation, scene-layout or renderer component names.

2. **Reusable learning resources**
   - Contains definitions, mathematical expressions, symbols, examples, exercises, media references and longer prose literals.
   - Resources are addressable and reusable across paths and renderers.
   - Resources may express didactic purpose, but not concrete renderer widgets.

3. **Didactic path templates**
   - Select and order concepts or resources for a target audience, objective and teaching situation.
   - May contain branching, optionality, prerequisites, emphasis and didactic intents.
   - Remain declarative and may reference semantic entities that still require resolution.

4. **Resolved paths**
   - Are deterministic, fully ordered compiler inputs produced from a path template and one immutable logical RDF dataset snapshot.
   - Contain resolved resource identities and normalized metadata required by downstream composition.
   - Preserve the existing `@project-chemie-digital/core` contract from issue #3. Additive fields may be introduced later; existing fields and ordering semantics must not be changed incompatibly.

5. **Renderer-neutral scene documents**
   - Transform resolved path entries into presentational states using generic scene primitives and accessibility metadata.
   - Express structure such as sequence, grouping, hierarchy, progressive disclosure, emphasis, narration and interaction intent.
   - Must not import Reveal.js types, fragment classes, plugin APIs or lifecycle concepts.

6. **Renderer adapters**
   - Translate scene documents into a concrete output channel such as Reveal.js, self-study web views, print or a knowledge-network view.
   - Own framework-specific component selection, lifecycle integration, layout constraints and fallbacks.
   - Reveal.js-specific behavior remains inside `packages/renderer-reveal` in accordance with ADR-0001.

The dependency direction is strictly:

`domain graph -> learning resources -> path templates -> resolved paths -> scene documents -> renderer adapters`

A downstream layer may depend on contracts from an upstream layer. An upstream layer must never import or encode concepts from a downstream layer. Shared low-level value objects may live in a neutral package only when they do not reverse this direction.

## Contract terminology

### Didactic intent

Didactic intent describes why or how material should be taught, for example:

- introduce a concept,
- contrast two statements,
- reveal an explanation progressively,
- prompt retrieval practice,
- request learner reflection,
- show an optional derivation.

It is not a component name. A domain or path record must not request a Reveal.js fragment, a React component or a CSS class. The scene composer later maps didactic intents to renderer-neutral primitives. Each renderer adapter then chooses an appropriate concrete implementation or an accessible fallback.

### Path template versus resolved path

A path template is declarative and may contain unresolved semantic references, alternatives and conditions. A resolved path is the deterministic result for a specific dataset snapshot and compilation context. It contains a total order and normalized references suitable for composition. Resolution and scene composition remain separate operations.

### Resolved path versus scene document

A resolved path states which learning resources appear and in what resolved order. A scene document states how that ordered material is grouped and disclosed as renderer-neutral presentation states. Scene composition may derive multiple scenes from one path entry or combine compatible entries, but it must preserve source identities and provenance.

## Minimal contract sketches

The following sketches are normative in dependency direction and terminology, but not yet production APIs:

```ts
interface VersionedExternalReference {
  uri: string;
  version?: string;
  integrity?: string;
  mediaType?: string;
  retrievedAt?: string;
  provenance?: readonly string[];
}

interface DidacticIntent {
  kind: string;
  parameters?: Readonly<Record<string, string | number | boolean>>;
}

interface SceneDocument {
  id: string;
  sourcePathId: string;
  scenes: readonly Scene[];
}

interface Scene {
  id: string;
  sourceResourceIds: readonly string[];
  intent?: DidacticIntent;
  blocks: readonly SceneBlock[];
  accessibility?: {
    label?: string;
    description?: string;
    readingOrder?: readonly string[];
  };
}
```

`SceneBlock` will be defined in a later bounded scene-model task. It must remain generic and renderer-neutral.

## External resources and deterministic offline compilation

Semantic records may reference external resources when the reference includes sufficient version or provenance metadata. A compiler run must not fetch network content implicitly.

Deterministic offline compilation requires one of the following:

1. the referenced content is vendored or cached in an explicitly supplied local input set and verified by integrity metadata;
2. the compiler uses only the reference metadata and produces a scene-level link or placeholder; or
3. compilation fails with an explicit unresolved-reference diagnostic when materialized content is required.

Network acquisition, cache refresh and rights review are separate workflows outside the compiler. A resolved path or scene document should record the source URI, selected version and integrity value when available so the same inputs produce the same result.

## Logical RDF dataset and source files

The compiler treats all configured RDF source files as one logical dataset. File boundaries exist for authorship, review and maintenance. They must not determine semantic scope, identity or compilation order. Parsing and merging occur before SHACL validation and path resolution. Duplicate or conflicting statements are handled by explicit validation rules rather than file precedence.

## Accessibility and privacy

- Didactic intents and scene contracts must allow semantic reading order, labels, descriptions, captions and non-visual alternatives to be preserved before renderer selection.
- Renderer adapters must provide accessible fallbacks when an interaction or progressive disclosure pattern is unsupported.
- The core six-layer pipeline contains educational content and provenance, not mandatory learner accounts or personal progress data.
- Learner-state, analytics or personalization data must remain a separate bounded context and must not be silently embedded in reusable resources, resolved paths or scene documents.
- External references must not introduce tracking or remote execution during offline compilation.

## Compatibility

The resolved-path output introduced in issue #3 remains the boundary between path resolution and scene composition. ADR-0002 does not rename or remove existing fields, alter `cd:position` ordering, or require ontology changes. Future extensions must be additive or introduced through an explicit versioned migration with compatibility tests.

## Consequences

- Scene composition can evolve without changing RDF content or path resolution.
- Reveal.js remains replaceable and cannot leak into domain records.
- Source files remain reviewable while compilation uses one coherent graph.
- External content can be referenced reproducibly without hidden network behavior.
- Additional renderers can consume the same scene document.
- A later task must define the minimal scene primitives and composer rules before any Reveal.js adapter work begins.

## Rejected alternatives

### Store authored slides in RDF

Rejected because slide structure couples content to one output format and weakens reuse across renderers.

### Put renderer component names in path records

Rejected because it reverses the dependency direction and creates framework lock-in.

### Let each RDF file act as an independent compilation unit

Rejected because semantic relations and SHACL constraints span file boundaries.

### Fetch external references during normal compilation

Rejected because it makes builds non-deterministic, network-dependent and harder to review.
