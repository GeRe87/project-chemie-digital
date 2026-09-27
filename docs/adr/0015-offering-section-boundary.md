# ADR-0015: OfferingSection boundary for course-world regions

- Status: Proposed
- Date: 2026-09-27

## Context

ADR-0008 established the renderer-neutral course-scale composition boundary:

```text
TeachingOffering
  → UnitPlacement(position)
      → LearningUnit
```

That model intentionally keeps course composition separate from didactic path order, renderer navigation and learner state. ADR-0010 then exposed the validated composition as `TeachingOfferingRuntimeDocument 1.0`, while Issue #162 proved that a Self-Study application can derive a functional course map from the authored placement order and exact path-to-SceneDocument bindings.

The next scaling requirement is a higher-level authored grouping of placements. The Chemometrics course should be able to express curriculum regions such as “Data Characterization”, “Signal Processing” or “Experimental Design”, including planned regions that do not yet contain migrated LearningUnits.

This grouping is curriculum meaning. It must therefore not be hardcoded as application state, inferred from numeric position ranges, or reconstructed from a presentational roadmap resource.

The terms `Course`, `Module` and `World` are deliberately not introduced as normative semantic class names here. `Course` and `Module` are institution-dependent; `World` is a renderer metaphor.

## Decision

Introduce the renderer-neutral architecture term **OfferingSection**.

An `OfferingSection` is one authored, offering-specific curriculum grouping over existing `UnitPlacement` identities.

Conceptually:

```text
TeachingOffering
  ├─ UnitPlacement(position) ──→ LearningUnit
  ├─ UnitPlacement(position) ──→ LearningUnit
  └─ OfferingSection(position)
       ├─ groups → UnitPlacement
       └─ groups → UnitPlacement
```

The existing direct `TeachingOffering → UnitPlacement` composition remains authoritative and unchanged.

`OfferingSection` is an **additional grouping overlay**. It does not replace UnitPlacement, does not make LearningUnit section-owned, and does not create a second composition tree.

A reusable LearningUnit can therefore still occur in multiple TeachingOfferings or multiple UnitPlacements without inheriting one global section identity.

## Semantic responsibility

An OfferingSection answers:

- Which authored curriculum region exists in this TeachingOffering?
- In what authored order do those regions occur?
- Which existing UnitPlacement occurrences belong to this region?
- What human-readable label and concise description identify the region?

It does not answer:

- which LearningPath is selected;
- which SceneDocument is currently rendered;
- whether a learner started or completed anything;
- which UI route, map coordinate, icon, terrain or color should be used;
- whether another section is unlocked;
- which placement should be recommended next.

Those remain downstream application, path-selection or learner-state concerns.

## Identity and ownership

Every OfferingSection requires a stable project-owned IRI.

Identity must not depend on:

- RDF serialization order;
- TriG filename;
- section position;
- member count;
- labels;
- renderer routes or coordinates;
- current learner state.

OfferingSection is **offering-specific**. The same reusable LearningUnit may appear under a different section in another TeachingOffering because section membership groups UnitPlacement occurrences, not LearningUnit identities.

## Composition invariants

A later semantic implementation must enforce all of the following.

1. Every OfferingSection has stable IRI identity.
2. Every OfferingSection belongs to exactly one TeachingOffering.
3. Every OfferingSection has exactly one positive integer section position.
4. Section positions are unique within one TeachingOffering.
5. Every OfferingSection has authored human-readable label metadata.
6. An OfferingSection may group zero or more UnitPlacements.
7. Every grouped UnitPlacement must already be a direct UnitPlacement member of the same TeachingOffering.
8. If a TeachingOffering declares at least one OfferingSection, every direct UnitPlacement of that TeachingOffering must be grouped by exactly one OfferingSection.
9. One UnitPlacement may not be grouped into two OfferingSections of the same TeachingOffering.
10. Unit order inside a section remains the existing `UnitPlacement.position`; OfferingSection introduces no second placement-order field.
11. Section order and UnitPlacement order are separate authored orders.
12. Empty OfferingSections imply no LearningUnits, paths, scenes or placeholder scientific content.
13. Section membership carries no prerequisite, unlock, completion, recommendation or path-selection semantics.
14. OfferingSections have no dependency on SceneDocument, renderer, application routes or learner-state.

The total-coverage rule is intentional. Once a TeachingOffering opts into sections, a consumer must never guess where an otherwise ungrouped placement belongs.

## Ordering

Section order is authored independently of placement order.

Example:

```text
OfferingSection position 10  “Getting Started”
OfferingSection position 20  “Data Characterization”
OfferingSection position 30  “Similarity Analysis”
```

Within “Data Characterization”, the order of its grouped placements is still obtained from each existing `UnitPlacement.position`.

A future projector must therefore:

1. validate unique positive section positions;
2. sort sections by authored section position;
3. preserve exact placement identities;
4. order each section's `placementIds` by the already validated UnitPlacement positions;
5. reject impossible or ambiguous membership instead of falling back to RDF iteration order.

No second unit-position value is introduced.

## Metadata ownership

OfferingSection may own only metadata whose meaning remains valid independently of a renderer:

- stable IRI;
- `skos:prefLabel`;
- concise authored description;
- explicit section position;
- references to grouped UnitPlacement identities.

OfferingSection must not own:

- copied LearningUnit scientific content;
- copied path resources;
- SceneDocument ids;
- current/selected path;
- progress or completion;
- unlock rules;
- recommendations;
- UI coordinates;
- map topology;
- terrain;
- color;
- icon;
- animation;
- CSS theme;
- route/URL;
- learner identity;
- analytics or timestamps.

## Empty-section semantics

An empty OfferingSection is valid authored curriculum planning metadata.

It means only:

> This curriculum region exists in the TeachingOffering, but no current UnitPlacement has yet been assigned to it.

It does not imply hidden, locked or incomplete LearningUnits and does not fabricate future content.

This allows an incrementally migrated course to expose its complete high-level organization while retaining truthful detail-level semantics.

Applications may present an empty section as “In preparation”, but that phrase is application language rather than authored RDF state.

## Renderer boundary

OfferingSection is renderer-neutral.

A downstream application may map it to:

- an overworld region or “world”;
- chapter heading;
- sidebar group;
- accordion section;
- breadcrumb group;
- print section;
- other navigation grouping.

The visual term `World` is permitted only in application language.

No renderer may infer section membership from:

- CSS classes;
- section labels;
- UnitPlacement position ranges;
- file paths;
- the Introduction roadmap DefinitionList;
- current SceneDocument order.

Likewise, no renderer-specific visual metadata belongs in OfferingSection RDF.

## Learner-state boundary

OfferingSections own no learner state.

Issue #164 may later add exact SceneDocument progress. A UI may then aggregate display information for convenience, but this ADR defines no semantic rule that makes a section “completed” or “in progress”.

In particular:

- opening one unit does not change OfferingSection semantics;
- completing one SceneDocument does not semantically complete its section;
- empty sections are not incomplete learner work;
- no section progress is written back into canonical RDF.

Any future normative aggregation rule requires a separate product/state decision.

## Path and SceneDocument boundary

OfferingSection groups UnitPlacement occurrences only.

It does not reference:

- LearningPath;
- path graph;
- CourseUnitPathSelection;
- ResolvedLearningPath;
- SceneDocument;
- `sceneDocumentBindings`.

Path discovery and selection continue through ADR-0009 / ADR-0010 responsibilities. Exact path-to-SceneDocument packaging remains the additive runtime binding introduced after ADR-0010.

This preserves the dependency direction:

```text
TeachingOffering
  ├─ OfferingSection → UnitPlacement
  └─ UnitPlacement → LearningUnit
                    ↓
               available paths
                    ↓
               path selection
                    ↓
               SceneDocument
                    ↓
                 renderer
```

## Runtime contract decision

OfferingSection requires an explicit runtime capability boundary.

### TeachingOfferingRuntimeDocument 1.1

Introduce `TeachingOfferingRuntimeDocument 1.1` with an explicit `sections` collection:

```ts
interface TeachingOfferingRuntimeSection {
  readonly id: string;
  readonly position: number;
  readonly labels: readonly RuntimeLocalizedText[];
  readonly descriptions: readonly RuntimeLocalizedText[];
  readonly placementIds: readonly string[];
}

interface TeachingOfferingRuntimeDocumentV1_1 {
  readonly version: "1.1";
  readonly datasetFingerprint: string;
  readonly offering: RuntimeOffering;
  readonly placements: readonly RuntimePlacement[];
  readonly units: readonly RuntimeUnit[];
  readonly sections: readonly TeachingOfferingRuntimeSection[];
}
```

The exact TypeScript names are illustrative architecture terms; Issue #166 owns implementation details.

### Why 1.1 instead of silently extending 1.0

The distinction is semantically important.

For a legacy `TeachingOfferingRuntimeDocument 1.0`, absence of `sections` means:

> this producer/version does not carry OfferingSection read state.

It must **not** be interpreted as proof that the current TeachingOffering has no authored sections.

For `TeachingOfferingRuntimeDocument 1.1`, `sections` is required. Therefore:

- `sections: []` means the validated current TeachingOffering declares no OfferingSections;
- a non-empty array means section semantics were projected and validated;
- consumers can distinguish legacy capability from explicit current read state.

Making `sections` merely optional on `version: "1.0"` would destroy this distinction.

### Compatibility rule

Consumers and validators must continue to accept `TeachingOfferingRuntimeDocument 1.0`.

A 1.0 document is treated as **legacy flat course composition**:

- existing placement/unit/path behavior remains valid;
- applications preserve their pre-section flat navigation behavior;
- applications must not infer section absence as semantic evidence;
- no synthetic section is generated from position ranges or labels.

A 1.1 document uses explicit section-aware behavior.

A consumer may normalize 1.0 and 1.1 into an internal tagged union or compatibility model, but must preserve whether section capability was present in the source contract.

### Outer canonical-runtime compatibility

The outer `CanonicalRuntimeArtifact` may remain `artifactVersion: "1.0"`.

The root already treats `teachingOfferingDocuments[]` as an independently versioned nested contract. Allowing that collection to contain supported TeachingOffering runtime document versions does not rename, remove or change the meaning of existing root fields.

A root version bump is therefore not required by this ADR.

## Runtime projection requirements

The Issue #166 implementation must project section state from the same immutable canonical Dataset revision as the surrounding TeachingOffering document.

For 1.1:

- `sections[]` is always present;
- sections are ordered by authored positive section position;
- section identity is exact absolute IRI identity;
- labels/descriptions preserve authored language tags under the existing runtime localized-text rules;
- `placementIds[]` contains exact existing placement identities;
- member placement order follows existing UnitPlacement positions;
- empty sections are preserved;
- total placement coverage is revalidated;
- duplicate membership fails closed;
- cross-offering membership fails closed;
- missing/duplicate/invalid section positions fail closed;
- no IRI-local-name display fallback is introduced;
- the document carries the same Dataset fingerprint as the containing artifact;
- no renderer-specific `world`, coordinate, color, icon, lock or progress fields are added.

## Compatibility with offerings without sections

Canonical authored TeachingOfferings are not required to declare OfferingSections.

Such offerings remain valid.

After the 1.1 projector exists, a current offering with no authored sections is represented explicitly as:

```json
{
  "version": "1.1",
  "sections": []
}
```

A section-aware application may then use its defined flat fallback presentation.

This differs from receiving a 1.0 document, where section capability is unavailable because of the legacy contract version.

## Accessibility

OfferingSection metadata supports accessible grouping but does not prescribe UI.

Downstream applications must:

- use authored human-readable section labels for visible and accessible group names;
- preserve language metadata and locale policy;
- maintain keyboard-accessible navigation independently of visual map treatment;
- not expose raw IRI fragments as authored labels;
- preserve a usable flat/static fallback when section-aware enhancement is unavailable.

Empty sections must not be represented as broken links to nonexistent content.

## Privacy

OfferingSection and `TeachingOfferingRuntimeDocument 1.1.sections[]` contain only project-authored curriculum metadata and stable placement references.

They contain no:

- learner identity;
- answers;
- progress;
- completion;
- grades;
- timestamps;
- analytics ids;
- account state;
- remote-service identifiers.

Normal projection and consumption remain network-free.

## Implementation handoff

Issue #166 should implement only the generic semantic/runtime boundary defined here.

Expected implementation surfaces include:

- a semantic class equivalent to `cd:OfferingSection`;
- offering-to-section relation equivalent to `cd:hasOfferingSection`;
- section-to-placement relation equivalent to `cd:groupsUnitPlacement`;
- SHACL constraints for identity, same-offering membership, positions, uniqueness, total coverage and duplicate-membership rejection;
- deterministic Python/runtime projection;
- TypeScript transport validation supporting both 1.0 and 1.1;
- focused synthetic fixtures and compatibility tests.

Issue #166 must not author Chemometrics-specific section instances. Those belong to Issue #167.

Issue #166 must not implement Self-Study region visuals. Those belong to Issue #168.

Issue #166 must not add learner progress. That remains Issue #164.

## Consequences

- Curriculum grouping becomes authored semantic structure rather than application configuration.
- Existing UnitPlacement composition remains stable and reusable.
- A TeachingOffering can expose its complete high-level roadmap before every detailed LearningUnit is migrated.
- Empty curriculum regions can be represented truthfully without placeholder scientific content.
- Renderers can map the same section semantics to different navigation metaphors.
- TeachingOffering runtime consumers can distinguish legacy no-section-capability from explicit current zero-section state.
- Old 1.0 runtime documents remain supported.
- The outer canonical-runtime container remains compatible at version 1.0.
- Progress, path selection and visual layout remain in their existing bounded contexts.

## Rejected alternatives

### Hardcode Chemometrics worlds in Self-Study

Rejected. Curriculum grouping would become application-specific state and other renderers could not reuse it.

### Infer sections from UnitPlacement position ranges

Rejected. Position expresses ordering, not semantic grouping. Numeric ranges would create an undocumented second curriculum model.

### Infer sections from the Introduction roadmap DefinitionList

Rejected. A learning resource explains the course; it is not the authoritative course-composition graph.

### Put section identity directly on LearningUnit

Rejected. Sections are offering-specific while LearningUnits are reusable across offerings.

### Replace TeachingOffering → UnitPlacement with nested section children

Rejected. It would break the validated placement/reuse model established by ADR-0008. Sections are an overlay over existing placements.

### Create future LearningUnits to fill empty regions

Rejected. Empty OfferingSections express the roadmap without fabricating detailed content.

### Store world/map presentation metadata in RDF

Rejected. Coordinates, terrain, color, icons and animation are renderer concerns.

### Treat `sections` as an optional field on TeachingOfferingRuntimeDocument 1.0

Rejected. Missing `sections` would be ambiguous between a legacy producer that cannot express sections and a current offering that genuinely has zero sections. Version 1.1 makes capability explicit.

### Bump outer CanonicalRuntimeArtifact solely for sections

Rejected. The independently versioned TeachingOffering document can evolve to 1.1 while existing outer root-field semantics remain unchanged.
