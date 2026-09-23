# CogniFlow presentation standardization roadmap

## Purpose

The completed CogniFlow talk on `visual/cogniflow-d3-restart` is the reference implementation for this migration.

The target is **not** to preserve its implementation structure. The target is to preserve its authored meaning and useful presentation capabilities while moving them behind reusable Project Chemie Digital contracts.

End-state rule:

> Audience-visible CogniFlow content is authored in canonical TriG. Generic compilers project it into renderer-neutral SceneDocuments. Generic renderer components and renderer-owned deterministic layout policies render it. No renderer code or stylesheet selects behavior from CogniFlow scene/path/resource ids or contains CogniFlow audience content.

The migration branch is:

`standardization/cogniflow-trig-rendering`

The talk branch remains the visual/reference baseline.

---

## Architectural guardrails

The migration must preserve the existing project boundaries.

1. TriG under `ontology/dataset/` remains the sole authored semantic source.
2. Generated JSON is disposable transport.
3. SceneDocument remains renderer-neutral.
4. Pixel coordinates, CSS classes, breakpoints, Reveal concepts and concrete layout names do **not** move into RDF.
5. Responsive layout remains renderer-owned and deterministic as specified by ADR-0012.
6. Renderer-local style/theme tokens may exist outside RDF, but they must be reusable and must not contain audience content.
7. Source identity, provenance, reading order, accessibility alternatives and static fallbacks remain preserved.
8. Existing Standard Deviation and Chemometrics paths are regression targets; CogniFlow standardization must not create a second renderer architecture.

---

## What is already standardized and reusable

The CogniFlow talk is not starting from zero. The following foundations already belong to the common platform:

- canonical TriG authoring and named-graph ownership;
- LearningPath / PathStep / SceneDefinition / SceneItem compilation;
- renderer-neutral `SceneDocument`;
- prose, math, code, media-reference, list, group and prompt blocks;
- FlowDiagram / NetworkDiagram / SequenceDiagram scene primitives;
- ChartDefinition with bar/line data and annotations;
- D3 flow, sequence, graph and chart renderers;
- source/provenance propagation;
- generic presentation-media vocabulary;
- light/dark presentation theme infrastructure;
- background pack infrastructure;
- reduced-motion and accessibility fallbacks;
- ADR-0012 deterministic responsive layout architecture.

The migration should prefer these contracts over inventing new ones.

---

## Baseline audit

### 1. Scene-specific CSS is still the dominant layout system

The reference talk currently contains roughly 5.1k lines across `apps/pitch/src/cogniflow-*.css`.

The styles repeatedly select concrete scene ids, DOM sibling positions and `:nth-child()` positions. Examples include:

- `cogniflow-semantics-first.css`
- `cogniflow-semantic-triples.css`
- `cogniflow-core-grammar.css`
- `cogniflow-semantic-hierarchy.css`
- `cogniflow-domain-specifications.css`
- `cogniflow-ui-specifications.css`
- `cogniflow-presentation-specifications.css`
- `cogniflow-processing-pipeline.css`
- `cogniflow-service-system.css`
- `cogniflow-extension-system.css`
- `cogniflow-take-home.css`
- `cogniflow-showcase.css`
- `cogniflow-title-media.css`

This makes scene identity and DOM order act as hidden layout semantics.

**Target:** replace these rules with reusable renderer component styles plus deterministic renderer-local layout decisions derived from SceneDocument evidence.

### 2. Dark mode is duplicated per CogniFlow scene

`cogniflow-dark-cards.css` contains scene-specific overrides and repeated per-card color assignments.

**Target:** one reusable renderer theme/token system. Card/node tone assignment must be generic and stable. Dark mode must be expressed by theme tokens rather than a parallel CogniFlow stylesheet.

### 3. Mobile behavior is duplicated per CogniFlow scene

`cogniflow-mobile.css` contains many scene-id-specific layout corrections.

**Target:** implement ADR-0012 layout environments and deterministic wide/compact/narrow realization. A logical scene must not require a second CogniFlow-specific mobile stylesheet.

### 4. Audience-visible text exists outside TriG

`cogniflow-presentation-projection.ts` currently authors visible content in TypeScript, including:

- projection labels;
- publication heading/meta/footer;
- four publication paragraphs.

CSS also injects audience-visible text, for example the Core Grammar code label and the Take Home pip suffix.

**Target:** no CogniFlow audience content in TypeScript or CSS. If text is content, it is a TriG resource. Generic renderer chrome may contain generic UI labels only.

### 5. Explicit-context highlighting infers semantics from strings

`cogniflow-explicit-context.ts` finds words such as `purpose`, `input`, `output`, `parameters`, `implementation`, `version`, `execution` and `provenance` by regex over rendered text and then assigns presentation tones.

That is presentation-specific lexical parsing.

**Target:** represent the structure explicitly before rendering. Prefer an existing block where possible; otherwise add one small reusable structured primitive rather than parsing prose.

Candidate: a renderer-neutral key/value or definition-list block if existing list/group semantics prove insufficient.

### 6. The semantic-rings view is a bespoke runtime

`cogniflow-semantic-rings-runtime.ts` is a dedicated ~350-line visualization runtime. It contains concrete resource/package ids, special focus package ids and fixed angular/radius behavior.

**Target:** express the graph as standard diagram resources and render it through the generic D3 diagram system.

Preferred route:

- model core/concept/specification membership as standard diagram nodes/groups/edges;
- reuse `NetworkDiagram` / `DiagramGroup`;
- add a renderer-local layered/radial network layout strategy only if the existing generic network renderer cannot express the view;
- no CogniFlow resource ids in the layout algorithm.

### 7. Main application behavior is selected by scene ids

`apps/pitch/src/main.ts` currently contains concrete CogniFlow scene-id sets for:

- hard-cut transitions;
- frozen background movement;
- showcase/fullscreen mode.

It also conditionally mounts CogniFlow-only shell behavior.

**Target:** renderer/application behavior is selected from generic runtime state:

- layout decision;
- block/media composition;
- consecutive scene structural compatibility;
- presentation profile capabilities.

No concrete scene ids may select transition, backdrop or fullscreen behavior.

### 8. Presentation profile selection is path-id-specific

`presentation-profile.ts` chooses the CogniFlow profile by matching the CogniFlow source path id.

**Target:** presentation-profile selection becomes explicit application configuration or a generic supplied profile choice. Path lexical identity must not be layout/style semantics.

### 9. The alternate presentation projection is a hard-coded demo

The InfoBox/Publications toggle demonstrates an important architectural idea, but the alternate publication projection is manually authored DOM and text.

**Target:** make multi-projection a reusable renderer capability. Both projections must consume the same compiled semantic content; switching projection must not introduce hidden content.

### 10. Several visual diagrams are actually lists styled as diagrams

The following scenes use list items plus CSS arrows/card positioning to create semantic structures:

- Semantics First;
- Semantic Triples;
- A Hierarchy of Meaning;
- Domain/UI/Presentation concept → specification examples;
- parts of Take Home and Extension System.

**Target:** decide per scene whether the structure is:

- a true graph/process → migrate to `FlowDiagram` / `NetworkDiagram`;
- a short set of peer key points → render the existing list through a generic card-grid family;
- a hierarchy → prefer a standard diagram/group representation rather than CSS-generated arrows.

### 11. Sequence diagram presentation still has local fixes

The service slide uses the standardized SequenceDiagram data model, but its participant boxes and label geometry still receive CogniFlow-specific CSS corrections.

**Target:** participant sizing, label fit and tone selection become generic sequence-renderer behavior derived from content length and visual role.

### 12. Tabular data is currently disguised as code

The FAIR intro relies on a TSV code block that the preview layer recognizes and turns into a table.

**Target:** evaluate promotion of a real table/data-grid SceneDocument primitive. Tabular information should not need to pretend to be executable/static code merely to obtain a table rendering.

### 13. Clock and laser pointer are reusable capabilities with CogniFlow names

The clock panel and laser pointer do not represent scientific/content semantics. They are presentation-shell capabilities and should **not** be moved into RDF.

**Target:** move them into reusable renderer/application presentation utilities, rename them generically, and enable them through an explicit renderer profile/capability configuration.

### 14. Legacy scene-id layout mapping still exists in the preview renderer

`preview.ts::layoutByScene` still maps historical Standard Deviation scene ids to `opening`, `process` and `split-proof` layouts.

This is not CogniFlow-specific, but it is the same architectural smell.

**Target:** the CogniFlow migration should finish the ADR-0012 implementation rather than adding a second scene-id map.

---

## Standard components required by the migration

### A. Deterministic Reveal layout resolver

Implement the ADR-0012 pipeline in the Reveal/application rendering boundary:

`SceneDocument scene → LayoutAnalysis → candidates → LayoutDecision → realization`

Initial reusable families should cover the actual reference talk without knowing its ids:

- single-focus;
- opening/title;
- statement;
- concept-grid/card-grid;
- comparison;
- text/code split;
- data-explanation;
- process/sequence;
- semantic-stack;
- media-focus/full-bleed;
- summary/CTA.

The family names are renderer-owned and are not written to RDF.

### B. Reusable card system

Replace scene-local colored cards with one standard card component/token set.

Required capabilities:

- primary/supporting emphasis;
- stable tone sequence;
- header/body hierarchy;
- compact and wide variants;
- dark/light tokens;
- card-grid realization from list/group blocks;
- no `:nth-child()` meaning outside a generic deterministic tone assignment policy.

### C. Reusable structured key/value component

Decision gate: first try to express Explicit Context using existing group/list semantics.

If that is not sufficient without parsing prose, introduce one additive renderer-neutral structured block (e.g. key/value or definition-list) with:

- explicit key;
- explicit value;
- source references for each entry;
- reading order;
- static textual fallback.

Do not encode colors or typography upstream.

### D. Real tabular-data primitive

Evaluate and, if accepted, add a table block/version increment so FAIR data tables are compiled as table data rather than TSV code.

Minimum contract:

- column labels;
- ordered rows/cells;
- source/provenance bindings;
- accessible caption/description;
- deterministic fallback.

### E. Generic layered/radial network layout

Migrate the semantic rings to standard diagram data.

Only add a new D3 layout strategy if the existing network layout cannot deterministically represent nested semantic layers. The algorithm may use diagram group structure and measured label lengths, but never CogniFlow ids.

### F. Generic multi-projection/view switch

Create a renderer capability that can render the same compiled content through multiple renderer-owned projections.

Requirements:

- same source blocks;
- no hidden hard-coded prose;
- keyboard-accessible toggle;
- deterministic default;
- static fallback;
- projection state remains renderer state, not RDF learner/content state.

### G. Generic media-focus/fullscreen behavior

A scene dominated by one media block should be rendered by a reusable media-focus family.

This replaces:

- showcase scene-id mode switching;
- scene-id-specific fullscreen CSS;
- hard-coded city/background hiding;
- per-scene video crop rules where a generic asset/media rule can suffice.

If an asset needs a special crop to be usable, prefer an appropriately prepared asset or explicit renderer asset metadata rather than a scene-id selector.

### H. Generic transition policy

Hard cuts and background freezing are renderer behavior.

Derive them from renderer state such as:

- consecutive compatible layout decisions;
- media-focus sequences;
- reduced-motion mode.

No scene-id allowlists.

### I. Presentation-shell capability registry

Move clock, laser pointer, appearance controls and similar controls behind generic presentation-shell capabilities.

These are renderer/application configuration, not semantic content.

---

## Slide-family migration map

| Reference-talk area | Current implementation | Standard target |
| --- | --- | --- |
| Title / attribution / logos | `cogniflow-title-media.css` | opening/title layout + media/attribution blocks |
| Opening motivation | `cogniflow-opening-sequence.css` | opening / statement / process families |
| FAIR intro | structural CSS + TSV code-table trick | data-explanation + table primitive |
| FAIR processing gap | DOM sibling-chain CSS | comparison/process family |
| Explicit Context | scene CSS + regex runtime | structured key/value component |
| Semantics First | list cards + CSS arrows | FlowDiagram or generic card sequence |
| Semantic Triples | list cards + CSS arrows | FlowDiagram / graph-backed sequence |
| Semantic Rings | bespoke D3 runtime | NetworkDiagram + groups + generic layered/radial layout |
| Hierarchy of Meaning | list cards + CSS arrow | FlowDiagram / hierarchy realization |
| Small Grammar | scene card grid + code split | concept-grid + text/code split |
| Domain/UI/Presentation examples | three near-duplicate scene styles | one generic concept/specification pattern |
| Processing Pipeline | generic D3 data + scene shell CSS | generic process family + D3 flow |
| Services | SequenceDiagram + local participant fixes | generic sequence renderer |
| Extension System | six hard-coded card positions/icons | generic card-grid |
| Semantic source / multi-view / provenance | mostly generic runtime primitives | retain, remove CogniFlow wrapper styling |
| Showcase | scene-id fullscreen/hard-cut mode | media-focus + generic transition policy |
| Take Home | scene-specific summary cards/CTA | summary/CTA family |
| Closing | scene-specific centering | single-focus family |

---

## Implementation roadmap

### Phase 0 — Freeze baseline and add anti-hardcoding guardrails

Goal: make the current talk a measurable reference and prevent new special cases.

Work:

1. Keep `visual/cogniflow-d3-restart` as reference only.
2. Work exclusively on `standardization/cogniflow-trig-rendering`.
3. Add an audit test/script that reports:
   - CogniFlow scene/path/resource ids in renderer/app code;
   - audience-visible strings in CogniFlow-specific TypeScript/CSS;
   - scene-specific CSS selectors;
   - `:nth-child()`/sibling-chain rules used as semantic styling.
4. Capture deterministic render/SceneDocument fixtures for representative scene families.

Exit criterion: new migration work cannot silently increase presentation-specific coupling.

### Phase 1 — Implement the ADR-0012 layout engine

Goal: remove scene identity from layout choice.

Work:

1. Introduce renderer-local `LayoutAnalysis`, `LayoutEnvironment`, `LayoutCandidate`, `LayoutDecision`.
2. Replace `preview.ts::layoutByScene`.
3. Implement initial generic families needed by Standard Deviation, Chemometrics and CogniFlow.
4. Add wide/compact/narrow regression tests.
5. Preserve semantic reading order independently from visual order.

Exit criterion: an unseen valid scene can obtain a deterministic layout without its id appearing in renderer code.

### Phase 2 — Consolidate themes, cards and responsive behavior

Goal: delete the bulk of CogniFlow scene CSS.

Work:

1. Create generic card/tone tokens in the renderer/theme layer.
2. Move dark-mode behavior into reusable theme tokens.
3. Replace CogniFlow mobile overrides with layout-environment variants.
4. Convert repeated three-card and card-grid scenes first.

Exit criterion: Domain/UI/Presentation specification slides share one renderer component implementation and have no scene-specific styles.

### Phase 3 — Close structured-content gaps

Goal: stop deriving structure from literal text.

Work:

1. Migrate Explicit Context away from regex parsing.
2. Decide/add key-value/definition-list primitive only if existing group/list blocks are insufficient.
3. Replace TSV-as-code tables with a real table primitive if approved.
4. Add compiler, SceneDocument, Reveal and self-study fallbacks plus SHACL/tests for every new primitive.

Exit criterion: no audience semantics are inferred from punctuation, capitalization or keywords in rendered strings.

### Phase 4 — Standardize diagrams and graph-like slides

Goal: remove CSS-made and bespoke diagrams.

Work:

1. Convert Hierarchy of Meaning to standard diagram data.
2. Convert Semantics First / Semantic Triples where graph structure is real.
3. Convert semantic rings to NetworkDiagram + groups.
4. Generalize D3 network layout if a layered/radial strategy is required.
5. Fix SequenceDiagram participant sizing generically.

Exit criterion: diagram geometry/layout code contains no CogniFlow resource ids.

### Phase 5 — Standardize media, projections and transitions

Goal: remove scene-id runtime lists from `main.ts`.

Work:

1. Add generic media-focus/full-bleed realization.
2. Generalize hard-cut and background-freeze policy.
3. Replace hard-coded publication projection with a generic multi-projection capability using the same compiled content.
4. Remove showcase scene-id mode sets.

Exit criterion: `main.ts` contains no CogniFlow scene-id allowlists.

### Phase 6 — Move shell features out of CogniFlow

Goal: separate presentation tools from presentation content.

Work:

1. Rename/move laser pointer into reusable presentation-shell code.
2. Rename/move clock panel likewise.
3. Replace path-id-driven profile selection with explicit generic application/profile configuration.
4. Keep these features outside RDF unless they later become authored pedagogical content.

Exit criterion: reusable presentation tools have no CogniFlow names or ids.

### Phase 7 — TriG-only CogniFlow content migration

Goal: make the standardized presentation demonstrably content-driven.

For every CogniFlow scene:

1. confirm all visible content exists in TriG;
2. ensure scene resources compile to generic SceneDocument blocks;
3. remove corresponding `cogniflow-*.css/ts` specialization;
4. render through the common layout/component runtime;
5. validate desktop, narrow/mobile, dark, light and reduced-motion behavior;
6. verify provenance and accessibility fallbacks.

Exit criterion: changing CogniFlow wording/structure in TriG changes the presentation without editing TypeScript/CSS.

### Phase 8 — Delete the compatibility layer and enforce the invariant

Delete obsolete CogniFlow-specialized files after the last consumer is migrated.

Final automated invariants should include:

- no `ex:scene-cogniflow-*` / CogniFlow path/resource ids in renderer/application implementation;
- no CogniFlow audience text in TypeScript or CSS;
- no CogniFlow-only layout stylesheet;
- no CogniFlow-only mobile stylesheet;
- no renderer behavior selected by scene/path lexical identity;
- all canonical TriG passes SHACL;
- CogniFlow generation succeeds from clean checkout;
- `npm test` passes;
- Standard Deviation and Chemometrics renderer regressions pass.

---

## Implementation status

### Increment 1 — generic Concept → Structure → Specification layout

Status: **implemented on this branch**

Completed:

- added renderer-owned structural layout inference in `packages/renderer-reveal/src/layout-policy.ts`;
- inference uses only block kind/order/intent/list cardinality and deliberately ignores scene/path/resource ids and labels;
- introduced the reusable `concept-specification` layout;
- migrated the Data Processing, Web Interface and Presentation semantic-model scenes to that shared layout automatically;
- deleted their three obsolete per-scene layout stylesheets;
- moved light/dark and narrow rendering into the generic layout;
- removed those three scene ids from shared dark/mobile styling;
- replaced scene-id-driven hard cuts/background freezing for the three-scene sequence with layout-driven behavior;
- isolated the still-bespoke InfoBox/Publication projection into its own compatibility stylesheet/runtime;
- added renderer and pitch regression tests using opaque/non-CogniFlow scene ids;
- added a guardrail test preventing the migrated scene ids from returning to shared layout/navigation code.

Remaining known exception for this group:

- `cogniflow-presentation-projection.ts/css` still selects the meta-presentation scene by id and authors alternate-projection content outside TriG. This is intentionally retained until the generic multi-projection phase.

Next migration target: `A Hierarchy of Meaning` followed by `A Small Grammar for Meaning`.

---

### Increment 2 — hierarchy + reference/code standardization

Status: **implemented on this branch**

Completed:

- migrated `A Hierarchy of Meaning` from CSS-generated list arrows to a canonical `cd:FlowDiagram`;
- hierarchy levels and relations now exist as `DiagramNode` / `DiagramEdge` resources in TriG;
- added generic `hierarchy-flow` inference based on a three-node linear flow topology, not on scene/resource identity;
- added renderer-owned layout slots and exposed them as `data-layout-slot` only after SceneDocument compilation;
- added generic `hierarchy-flow-layout.css`; its narrow host deliberately selects the existing D3 renderer's vertical flow realization;
- migrated `A Small Grammar for Meaning` to a generic `reference-code` layout inferred from block structure;
- moved the visible `READING TRIG · CONCEPT DOMAIN` label from CSS into canonical TriG;
- added generic `reference-code-layout.css` with desktop/mobile and light/dark realization;
- deleted `cogniflow-semantic-hierarchy.css` and `cogniflow-core-grammar.css`;
- removed the Grammar scene id from shared dark/mobile styles;
- upgraded the earlier `concept-specification` layout to renderer-owned slots as well;
- added identity-independent renderer tests, slot-projection tests and anti-hardcoding guardrails.

The standardized layout pipeline now demonstrates three reusable families:

- `concept-specification`;
- `hierarchy-flow`;
- `reference-code`.

Next migration target: **Explicit Context**, because it currently reconstructs semantics with a regex over rendered prose. This is the first case where we must decide whether existing list/group semantics are sufficient or whether a small structured key/value primitive is justified.

---



### Increment 3 — structured Explicit Context

Status: **implemented on this branch**

Completed:

- introduced the reusable `DefinitionList` / `DefinitionListEntry` semantic vocabulary and `DefinitionListRole`;
- added `SceneDocument 1.4` with a renderer-neutral `definition-list` block;
- added canonical compiler support including ownership, order, language, provenance and version promotion;
- added SHACL constraints for definition-list ownership, selectors and scene roles;
- added Reveal render-plan support for definition lists;
- added semantic `<dl>/<dt>/<dd>` rendering in the pitch preview;
- migrated the S/N example and general explicit-context panel from free-text KeyPoints to explicit term/description entries in TriG;
- added the generic `process-context` layout inferred from block structure only;
- moved colored signal emphasis to structured definition terms instead of regex-parsed words;
- removed `cogniflow-explicit-context.ts` and its lexical signal-word parser;
- removed the scene-specific `cogniflow-explicit-context.css`;
- added opaque-id layout inference tests, definition-list rendering tests and anti-hardcoding guardrails.

Result:

The presentation no longer has to reconstruct `purpose`, `input`, `output`, `parameters`, `implementation`, `version` or provenance semantics from rendered strings. Those distinctions are now authored explicitly in TriG and survive into the SceneDocument.

Next migration target: FAIR tabular data and the remaining motivation/semantics card layouts.

---

### Increment 4 — semantic tables and generic data explanation

Status: **implemented on this branch**

Completed:

- introduced `TableDefinition`, `TableColumn`, `TableRow`, `TableCell` and `TableRole`;
- added `SceneDocument 1.5` with renderer-neutral `table` blocks;
- added canonical compiler, ownership/order validation, provenance propagation and SHACL constraints;
- added Reveal render-plan support plus semantic `<table>/<caption>/<thead>/<tbody>` pitch rendering;
- migrated the FAIR DATA OBJECT from a TSV `CodeExample` to a canonical `TableDefinition`;
- removed the TSV-language rendering heuristic from `preview.ts`;
- migrated the opening feature-results table to the same table primitive;
- added generic `data-explanation` layout inference for heading + four principles + table;
- added generic `analysis-result` layout inference for heading + chart + table + process diagram;
- removed the legacy FAIR intro/gap scene-specific styles;
- converted the FAIR processing-gap structured lists to DefinitionList semantics and reused the generic process-context family;
- added anti-TSV and anti-scene-id guardrails.

Result:

Tabular scientific content is now authored as table structure in TriG rather than masquerading as source code. The same table contract is reused across two different presentation narratives.

Next migration target: Semantics First and Semantic Triples, replacing CSS-made semantic diagrams with standard diagram data.

---

### Increment 5 — semantics progression and explicit knowledge graph

Status: **implemented on this branch**

Completed:

- added generic `card-sequence` layout inference for heading + banner + three ordered cards + takeaway;
- migrated `Semantics First — Meaning Before Implementation` to that reusable layout;
- removed its scene-specific stylesheet and mobile/dark overrides;
- kept sequence arrows, numbering and tone assignment as renderer-owned decoration rather than authored RDF;
- added generic `text-network-progression` inference for heading + banner + two textual representations + NetworkDiagram + takeaway;
- replaced the CSS-injected Anna knowledge-graph SVG with a canonical `NetworkDiagram` in TriG;
- modeled Anna, Essen and University as DiagramNodes and `livesIn`, `worksAt`, `locatedIn` as DiagramEdges;
- removed the obsolete third Knowledge Graph KeyPoint and the scene-specific Semantic Triples stylesheet;
- reused the existing generic D3 diagram runtime for `diagramType="network"`;
- added opaque-id renderer tests and anti-hardcoding guardrails.

Result:

The Semantic Triples slide no longer contains audience-visible scientific relationships in CSS or a presentation-specific image asset. The graph is part of the canonical semantic source and reaches the renderer as standard diagram data.

Next migration target: the semantic-ring view, which remains the largest bespoke visualization runtime.

---

### Increment 6 — generic concentric semantic networks

Status: **implemented on this branch**

Completed:

- migrated `CogniFlow Starts with Meaning` from three prose/list payloads to one canonical `cd:NetworkDiagram`;
- modeled the core as the authored `focusNode` and concept/specification layers as ordinary `DiagramGroup` memberships;
- added optional semantic ordering for diagram groups through the existing `cd:position` attribute;
- allowed relation-free `NetworkDiagram` instances while retaining the edge requirement for ordinary `FlowDiagram` content;
- added a renderer-owned `concentric-network` strategy inferred only from graph structure: focused node + ordered groups + no authored edges;
- added generic concentric ring geometry, group labels and responsive SVG rendering to the shared D3 flow/network renderer;
- added generic Reveal `concentric-network` layout inference and styling with no scene, resource or CogniFlow identity checks;
- removed `cogniflow-semantic-rings-runtime.ts`, `cogniflow-semantic-core.css` and their presentation-specific parser/projection test;
- removed the bespoke semantic-ring mount from `main.ts`;
- extended anti-hardcoding, renderer-layout and network-contract regression tests.

Result:

The semantic-ring view is now an ordinary semantic network. TriG owns the nodes, focus and layer membership; the renderer alone decides that this topology is best realized as concentric layers. Changing package labels, membership or group order no longer requires a CogniFlow TypeScript runtime.

Next migration target: the remaining processing/service/extension presentation shells before the publication projection and shell capabilities are generalized.

---

## Recommended first implementation slice

Do **not** start with the semantic rings or the publication projection. They are the hardest cases and would encourage premature new contracts.

Start with the repeated specification slides:

1. `A Semantic Model for Data Processing`
2. `A Semantic Model for Web Interfaces`
3. `A Semantic Model for This Presentation`

They have nearly identical structure but currently have separate scene-specific styling. Converting these three to one generic card/flow layout gives an immediate proof that:

- TriG content can vary;
- SceneDocument structure stays generic;
- one renderer component handles all three;
- desktop/mobile/light/dark behavior can be unified;
- scene ids are unnecessary.

After that, migrate `A Hierarchy of Meaning` and `A Small Grammar for Meaning`, then tackle structured data and the semantic rings.

---

## Definition of done for the standardized CogniFlow presentation

The migration is complete when a clean checkout can:

1. select the CogniFlow LearningPath;
2. compile its canonical TriG to SceneDocument;
3. render every scene with generic Project Chemie Digital renderer components;
4. render narrow/mobile and desktop from the same logical scenes;
5. switch light/dark without scene overrides;
6. preserve all source/provenance/accessibility metadata;
7. contain no CogniFlow-specific audience content or scene-id behavior in renderer code;
8. pass the same platform tests used by other presentations.

At that point CogniFlow is no longer a special presentation implementation. It is a comprehensive integration fixture demonstrating the reusable Project Chemie Digital presentation standard.


### Increment 7a — generic process and service diagrams

Status: **implemented on this branch**

Completed:

- migrated the Processing Pipeline from a CSS-connected KeyPoint list to a canonical four-node `FlowDiagram` with explicit data-transfer edges;
- added generic `process-diagram` Reveal layout inference for heading + explanatory statement + longer linear FlowDiagram or SequenceDiagram + takeaway;
- moved the Processing Pipeline and Service Process presentation shells onto the shared `process-diagram` layout;
- removed their CogniFlow-specific stylesheet imports;
- generalized SequenceDiagram participant width from authored/bound label length instead of role-id-specific scaling;
- added renderer-owned deterministic participant tones by participant order rather than concrete service role ids;
- updated compact sequence routing to attach to the actual dynamic participant-card bounds;
- extended opaque-id layout and renderer regression tests plus CogniFlow anti-hardcoding guardrails.

Result:

Processing and service presentation geometry no longer depends on CogniFlow scene ids, participant ids or CSS-made process connectors. The processing topology is semantic diagram data, while service participant sizing and tone assignment are generic renderer behavior.

Next migration target: the Extension System, currently a six-item list whose architecture-board geometry and glyphs are encoded through CogniFlow-specific `:nth-child()` CSS.


### Increment 7b — structured FlowDiagram node content

Status: **implemented on this branch**

Completed:

- reused the existing canonical DiagramNode contract as structured content: `label` is the node title and optional `description` is the node body;
- made FlowDiagram layout geometry body-aware while leaving NetworkDiagram descriptions non-visual;
- added separate title/body wrapping, typography and a renderer-owned divider for structured flow cards;
- kept plain FlowDiagram nodes backward-compatible with the existing single-label rendering path;
- migrated the Processing Pipeline nodes from multiline `skos:prefLabel` blobs to concise titles plus authored `cd:body` content;
- added regression coverage for title/body geometry and anti-hardcoding checks.

Result:

A FlowDiagram node can now carry a readable title and a lower-emphasis body without encoding visual hierarchy inside one label string. The capability is generic and can be reused by future workflow and architecture diagrams.


### Increment 7c — generic foundation + extension card grid

Status: **implemented on this branch**

Completed:

- separated the extension-system rulebook from the module collection as its own semantic statement;
- migrated five extension modules from multiline KeyPoints to structured `DefinitionListEntry` resources with explicit term + body;
- added generic `foundation-card-grid` layout inference from block structure only;
- grouped DefinitionList term/description pairs into semantic entry wrappers in the pitch renderer while retaining `display: contents` compatibility for existing table-like definition lists;
- added renderer-derived deterministic card tones and index badges from canonical entry order, with no module-name or scene-id checks;
- replaced the six-position `:nth-child()` architecture board and CSS-authored module glyphs with a responsive 3+2 flex grid;
- removed the Extension System stylesheet from the application runtime;
- removed stale Processing, Service and Extension scene-id overrides from shared mobile/dark compatibility styles;
- added opaque-id layout tests, preview entry-wrapper coverage and anti-hardcoding guardrails.

Result:

The Extension System is now authored as one foundation statement plus a structured set of conforming modules. Module names and details live in TriG; card arrangement, color and responsive behavior are generic renderer concerns.

Next migration target: publication projection / remaining presentation-shell and showcase special cases.


### Increment 8a — generic alternate publication projection

Status: **implemented on this branch**

Completed:

- replaced the CogniFlow scene-id projection runtime with a generic projection runtime selected only by the inferred `concept-specification` layout;
- removed the hard-coded publication article and its audience-visible scientific prose from TypeScript;
- publication mode now reuses the already compiled heading, card texts and takeaway from the same SceneDocument;
- made the projection control available to every structurally compatible concept/specification scene rather than one named scene;
- moved all projection styling to generic `presentation-projection.css` selectors based on layout and projection mode;
- removed CogniFlow scene/resource identity from projection behavior and styling;
- removed the accepted obsolete Extension System stylesheet together with the old CogniFlow projection runtime/style files;
- added anti-hardcoding checks that prohibit the previous authored article prose from returning to runtime code.

Result:

The same compiled semantic scene can now be realized as cards or publication prose without a second content source. Projection changes presentation only; it no longer changes or duplicates the authored semantics.

Next migration target: presentation-shell capabilities (clock and laser pointer), followed by showcase transition/background policy.
