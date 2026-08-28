# ADR-0008: Course-scale semantic composition boundary

- Status: Proposed
- Date: 2026-08-28

## Context

The platform has proven a complete single-topic pipeline around Standardabweichung: canonical TriG is validated and resolved into didactic paths, compiled into renderer-neutral `SceneDocument` snapshots, and consumed by Reveal.js and self-study adapters. The platform also has a separate local learner-state boundary. The next scaling step is not another renderer feature; it is an authored semantic structure that can organize many reusable topics into the funded chemistry teaching offering without turning one path, one renderer, or one application menu into the curriculum model.

ADR-0002 defines the one-way learning-compiler dependency direction from domain knowledge and reusable learning resources through didactic path templates, resolved paths and scene documents to renderer adapters. ADR-0005 establishes canonical TriG and stable named-graph ownership. This ADR refines that architecture with one additional authored organizational boundary while preserving those dependency rules.

The terms `Course` and especially `Module` are deliberately avoided as normative class names in this decision. They are institution-dependent and may later map to external module-handbook, LMS or accreditation concepts. The internal architecture instead uses terminology that describes semantic responsibility.

## Decision

Introduce a renderer-neutral **course-scale composition boundary** with three minimal concepts for the next implementation turn:

1. **TeachingOffering**
   - Represents one coherent authored educational offering, such as the funded chemistry teaching offering.
   - Owns the offering-level identity and descriptive curriculum metadata.
   - Contains an explicit ordered composition of learning-unit placements.
   - Does not contain renderer navigation, learner progress, account data, institutional examination rules or delivery-specific scene structure.

2. **LearningUnit**
   - Represents a reusable, bounded educational scope or topic that can occur in one or more offerings.
   - May identify its focus concepts and relevant reusable learning resources without copying their content.
   - Owns unit-level educational meaning that remains valid independently of a particular lecture, self-study or review delivery.
   - Does not define the ordered sequence of resources shown to a learner; that remains the responsibility of didactic path templates.

3. **UnitPlacement**
   - Represents one occurrence of a `LearningUnit` inside a `TeachingOffering`.
   - Owns the explicit curriculum position of that occurrence.
   - Exists because order belongs to the offering composition, not intrinsically to a reusable `LearningUnit`.
   - Allows the same learning unit to be reused in another offering or placed in a different position without changing the unit identity.

These are architecture terms in this ADR. Issue #90 does not add RDF classes, properties, SHACL shapes or runtime code.

## Refinement of ADR-0002

The course-scale composition boundary is an authored upstream refinement between reusable resources and didactic path templates:

```text
domain knowledge graph
        ↓
reusable learning resources
        ↓
course-scale composition
TeachingOffering → UnitPlacement → LearningUnit
        ↓
didactic path templates
        ↓
resolved paths
        ↓
SceneDocument
        ↓
renderer adapters
```

This does not permit reverse dependencies. In particular:

- concepts and reusable learning resources must not depend on a `TeachingOffering` or renderer;
- a `LearningUnit` may reference upstream concepts/resources as semantic scope anchors;
- a didactic path template may declare the `LearningUnit` it serves because the path is downstream of course composition;
- a `TeachingOffering` or `LearningUnit` must not depend on `ResolvedPath`, `SceneDocument`, Reveal.js, React, browser routing or learner-state;
- renderers may read resolved course/unit identities and derive navigation, but may not write renderer-specific navigation semantics back into authored RDF.

The existing six ADR-0002 compiler stages remain intact. Course-scale composition is an additional authored semantic boundary used to scope and select path templates; it is not a new renderer or a replacement for path resolution.

## TeachingOffering versus didactic path

A `TeachingOffering` answers questions such as:

- Which reusable learning units belong to this educational offering?
- In what authored curriculum order are those units recommended?
- What offering-level objectives, prerequisites or audience statements characterize the offering?

A didactic path template answers a different question:

- In what order should concepts/resources be encountered for a specific teaching situation such as lecture, self-study, exercise or review?

Therefore one offering is not one giant `LearningPath`.

A single `LearningUnit` may have multiple path templates, for example:

```text
LearningUnit: Standardabweichung
  ├─ lecture path
  ├─ self-study path
  ├─ exercise path
  └─ review path
```

The path-to-unit relation points downstream-to-upstream: a path declares which unit it realizes. A learning unit does not need to embed an ordered list of paths. Consumers may deterministically query available paths for a unit and then select one according to application context.

## Identity rules

All authored course-scale entities require stable project-owned RDF IRIs. Blank-node identity is not sufficient for `TeachingOffering`, `LearningUnit` or `UnitPlacement` because these identities may be referenced by validation, generated transports, renderers and future compatible learner-state versions.

Identity must not depend on:

- TriG filename;
- source-file position;
- RDF serialization order;
- renderer URL or route;
- generated scene index;
- wall-clock timestamps;
- learner identity or session identity.

A `UnitPlacement` has its own stable identity rather than deriving identity from a numeric array index. Its position is mutable curriculum metadata; its identity is the occurrence being positioned.

## Ordering rules

Course ordering and path ordering are separate authored orders.

### Course-scale order

A `TeachingOffering` composes `UnitPlacement` records. Each placement carries one explicit integer position and references exactly one `LearningUnit`.

Conceptually:

```text
TeachingOffering
  hasPlacement → UnitPlacement A
                  position 10
                  unit → LearningUnit X
  hasPlacement → UnitPlacement B
                  position 20
                  unit → LearningUnit Y
```

The exact RDF property names are deferred to the implementation issue. The semantic invariant is normative: ordering must be explicit, total for the selected offering composition, deterministic, and independent of RDF statement order. Sparse integer positions are acceptable if later SHACL/compiler rules define uniqueness and deterministic comparison.

### Didactic path order

The existing `LearningPath` / `PathStep` order remains authoritative inside a concrete didactic path. `cd:hasStep` remains an unordered RDF relation; `cd:position` on path steps supplies the order.

Course order must not be inferred from path-step order, and path order must not be inferred from course unit position.

## Metadata ownership

Metadata belongs to the semantic object whose meaning remains valid when other layers or renderers change.

### TeachingOffering owns

- stable identity;
- title and concise description of the offering;
- offering-level learning objectives when they describe the offering as a whole;
- entry prerequisites when they apply to participation in the offering as a whole;
- target audience when it is a property of the offering rather than one delivery path;
- ordered membership through `UnitPlacement`;
- optional descriptive provenance/source metadata when required.

This ADR does not require institutional module codes, credit points, examination regulations, semester schedules or accreditation metadata.

### LearningUnit owns

- stable identity;
- unit title and concise description;
- unit-level learning objectives;
- semantic focus concepts;
- unordered references to reusable resources when useful to define the unit scope;
- prerequisite concepts or prerequisite learning units when the prerequisite expresses curriculum meaning independent of one delivery path.

A `LearningUnit` does not own a fixed slide count, page count, route, menu label, completion state or renderer layout.

### Didactic path template owns

- the concrete teaching situation or modality;
- target-audience refinement when a path is specialized for one audience;
- estimated duration when duration depends on the concrete lecture/self-study/exercise path;
- ordered resource/scene selection through the existing path-step semantics;
- branching, optionality, emphasis and didactic intents that belong to that path.

A path may have path-specific objectives when those objectives genuinely differ from the broader learning-unit objectives, but objectives must not be duplicated merely for convenience.

### Reusable concepts/resources own

Scientific meaning, authored explanatory content, source/provenance, reusable examples, exercises, definitions, formulas and other content that remains valid outside any one offering or path.

## Duration and audience

`estimatedDuration` and `targetAudience` are not globally owned by one class. Their semantic owner depends on what is being asserted:

- an offering may state its overall target audience;
- a path may refine that audience for one delivery;
- duration should normally live on the concrete path because lecture, self-study and review routes through the same unit can take different amounts of time;
- a unit-level duration should only be introduced later if it can be defined independently of delivery mode and has a clear interpretation.

The implementation must not require metadata whose owner is ambiguous.

## Renderer and navigation boundary

Renderer adapters and applications may derive navigation from stable authored structure, for example:

```text
TeachingOffering order
        ↓
LearningUnit labels
        ↓
available path for selected mode
        ↓
ResolvedPath / SceneDocument
        ↓
renderer-specific navigation chrome
```

Generated navigation may include URLs, router state, menus, tabs, breadcrumbs, accordions or presentation controls. Those are renderer/application artifacts and must not become canonical authored RDF semantics.

The same `TeachingOffering` must remain usable by a Reveal-based lecture application, a self-study site, a print export or a future renderer even when those outputs use different navigation patterns.

Renderer state such as current route, selected tab, current scene, open menu or viewport remains ephemeral application state unless a separate non-semantic state contract explicitly owns it.

## Learner-state boundary

`LearnerStateDocument 1.0` remains unchanged by this decision.

Learner-state continues to be a separate bounded context. It may not be embedded into `TeachingOffering`, `LearningUnit`, `UnitPlacement`, path templates, resolved paths or scene documents.

A future versioned learner-state contract may reference stable offering/unit/path identities when this is required for compatibility or navigation context. Such references would identify the semantic context only. They would not make progress, completion, answers, timestamps or personalization part of authored RDF.

No completion percentage or implied progression may be derived merely because a unit has a curriculum position.

## Named-graph and dataset expectations

Canonical TriG remains the sole authored semantic authority and all files under `ontology/dataset/` continue to assemble into one logical RDF Dataset.

The later ontology implementation should preserve the Core–Concept–Specification layering from ADR-0005:

- vocabulary descriptors for `TeachingOffering`, `LearningUnit`, `UnitPlacement` and their relations belong in a stable project-owned concept-vocabulary graph, either the existing concepts graph or a dedicated curriculum-vocabulary graph if that improves ownership;
- concrete offering/unit instances belong in project-owned specification graph(s), for example a future course-scale specification graph;
- path specifications remain path semantics and do not become file-local children of a course file;
- named-graph identity may express ownership/provenance but must not determine ordering or semantic scope;
- file boundaries remain review and maintenance units only.

A future implementation must not rely on filename conventions to infer offering membership, unit order or path availability.

## Deterministic resolution expectations

This ADR does not define a new runtime compiler contract, but it establishes the invariants a later implementation must preserve:

1. assemble the complete logical RDF Dataset before interpreting course composition;
2. validate stable identities, placement membership and explicit positions;
3. resolve the ordered placement sequence deterministically;
4. select/query path templates for a unit without renderer-specific semantics;
5. resolve the selected path with the existing path resolver;
6. compile scenes with the existing scene composer;
7. let the selected renderer derive its own navigation chrome.

Normal compilation remains network-free. No course-scale lookup may silently fetch remote LMS or catalog data.

## Mapping the current Standardabweichung demonstrator

The current scientific and interactive Standardabweichung content does not need to change.

A later implementation can wrap the existing demonstrator with additive course-scale statements such as the following conceptual model:

```text
TeachingOffering
  "Digitalisierung in der Chemie: Datenmanagement, Prozesse, KI"
        │
        └─ UnitPlacement
             position: 10
             unit: StandardabweichungUnit

StandardabweichungUnit
  focus concept: ex:standard-deviation

existing LearningPath(s)
  for unit: StandardabweichungUnit
        ↓
existing PathStep order
        ↓
existing ResolvedPath
        ↓
existing SceneDocument
        ↓
Reveal.js / self-study
```

The existing `ex:standard-deviation` concept, definitions, formulas, examples, exercises, scenes and path-step positions remain reusable semantic resources. The future `StandardabweichungUnit` is an organizational teaching scope, not a replacement for the scientific concept.

The current pitch path may remain a presentation-specific didactic path. Associating it with a learning unit does not turn the pitch itself into the course curriculum.

## Compatibility and migration

The next implementation should be additive:

- add course-scale vocabulary and SHACL constraints;
- add one minimal `TeachingOffering`, one `LearningUnit` and one `UnitPlacement` as a reference fixture around existing Standardabweichung content;
- associate an existing or dedicated path template with the unit;
- add deterministic query/resolution tests without changing existing scene or learner-state contracts.

Existing `LearningPath`, `PathStep`, `SceneDocument 1.0` and `LearnerStateDocument 1.0` contracts must remain valid. A future need to change one of those contracts requires its own versioned migration decision.

## Consequences

- The platform can scale from one topic to many units without making one giant path the curriculum.
- Reusable units can occur in multiple offerings and positions because order belongs to `UnitPlacement`.
- Lecture, self-study and review paths remain separate reusable didactic routes.
- Renderers can generate different navigation without polluting canonical RDF with UI structure.
- Learner progress remains separate from authored course semantics.
- Stable identity and explicit position preserve deterministic offline behavior.
- The next implementation turn has a bounded semantic target instead of an open-ended course-management feature.

## Rejected alternatives

### Treat the complete course as one giant LearningPath

Rejected. A path encodes one didactic route for one teaching situation. A course-scale offering needs reusable units and may expose multiple lecture, self-study, exercise and review paths per unit. A giant path would conflate curriculum composition with delivery order and would make reuse difficult.

### Encode application navigation or menu trees in RDF

Rejected. URLs, menus, tabs, router state and screen hierarchies are renderer/application mechanics. Encoding them as authored semantic truth would reverse the dependency direction and lock the content to one application.

### Put learner progress into course RDF

Rejected. Progress, answers and personalization belong to the separate learner-state bounded context. Canonical authored RDF must remain reusable and independent of any learner.

### Use TriG file order or unordered `hasPart` statement order as curriculum order

Rejected. RDF statement order and source-file order have no semantic sequencing meaning. Curriculum order must be represented by explicit authored placement records with deterministic positions.

### Put one intrinsic position directly on LearningUnit

Rejected. A reusable unit can appear at different positions in different offerings. Position is a property of the unit occurrence within an offering and therefore belongs to `UnitPlacement`.

### Make LearningUnit a replacement for concepts or learning resources

Rejected. A learning unit is organizational/didactic scope. Scientific concepts and reusable resources remain independently addressable semantic assets and must not be copied into the unit as a second content store.
