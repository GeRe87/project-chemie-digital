# CogniFlow presentation diagram roadmap

Status: living roadmap  
Owner context: CogniFlow presentation in `project-chemie-digital`  
Last updated: 2026-09-17  
Current branch: `architecture/cogniflow-semantic-diagrams` (PR #155, draft)  
Current exact head: `3a7fa632f4365f5bb8c526e577bb211eb574695e`  
Reference implementation: legacy `cogniflow_workshop.html` presentation, especially `cf-layer-diagram`, `cf-concept-domain-diagram`, and `cf-service-process-diagram`

## 1. Goal

Rebuild the expressive, multi-stage D3 diagrams from the legacy CogniFlow presentation with the graph-backed presentation architecture of `project-chemie-digital`.

The legacy presentation is a **behavioral and visual reference, not an implementation template**. Its per-slide JavaScript, hard-coded coordinates, colors, fragment counts, and content-specific selectors must not be copied into the new system.

The target architecture remains:

> The graph describes content and authored visual/interaction intent; renderer and theme describe concrete visual realization.

In practical terms:

1. **TriG/RDF authors meaning and intentional structure**: entities, relations, groups/layers, roles, focus, ordered presentation states, shared annotations, participant roles, and other renderer-neutral intent.
2. **SceneDocument transports the authored semantics** without CSS, SVG, coordinates, colors, force constants, or animation timings.
3. **Renderer strategies own geometry**: radial/layered placement, sequence lanes, callout anchoring, focus/lens geometry, collision avoidance, responsive fallback, and transitions between stable identities.
4. **Themes own appearance**: palettes, card grammar, line treatment, shadows/glows, typography, state-transition timing/easing, and light/dark realization.
5. **Pitch/Reveal owns presentation navigation** and binds generic diagram state progression to click/keyboard interaction without embedding CogniFlow knowledge.

## 2. Reference behaviors to preserve

### 2.1 Architecture / ontology-to-runtime map (`cf-layer-diagram`)

The legacy diagram progressively changes one persistent scene rather than replacing it with independent slides. It demonstrates several reusable behaviors:

- start from an Ontology focal object;
- expand the ontology into explanatory text and examples;
- reveal a semantic relation graph;
- introduce a **concept layer** as a ring/cluster of nodes;
- promote selected members such as **Package** and **Service** from small nodes to labeled semantic focal nodes;
- introduce a second **specification layer** with nodes such as **Package template** and **Semantics runtime**;
- reveal relations between the layers;
- temporarily de-emphasize/blur the surrounding scene and zoom into one semantic subgraph;
- return to the overview without changing the authored identities.

This reference therefore requires more than a static network renderer. It requires generic support for **ordered diagram states, group/layer activation, semantic focus/lens behavior, stable-identity morphing, and contextual de-emphasis**.

### 2.2 Concept-domain drill-down (`cf-concept-domain-diagram`)

The legacy diagram progressively reveals three semantic regions:

1. **Concept domain**
2. **Processing concepts**
3. **Affordance model**

Within these regions it incrementally expands semantic relations from a concept domain through concepts/properties/attributes/ports, then processing steps/pipelines/run targets, and finally a concrete `qalg:Average` example with ports and service binding.

Reusable behaviors:

- ordered semantic regions/layers;
- staged reveal of nodes and edges;
- previous regions remain visible but become de-emphasized;
- stable semantic nodes can carry structured multi-row content;
- concrete instances can be introduced after abstract vocabulary;
- arrows are revealed according to authored state, not inferred from text;
- renderer can allocate more space as semantic depth increases.

This reference motivates a **layered semantic graph strategy** rather than a one-off ontology slide renderer.

### 2.3 Service-process / participant sequence (`cf-service-process-diagram`)

The legacy diagram starts from generic roles and progressively reveals a request/service interaction across four lanes:

- Provider
- Database
- Runtime
- Consumer

It then adds service semantics, discover/push/store/request/check/binding/call interactions, and later swaps the concrete Provider/Consumer participants while retaining the same process skeleton, for example:

- Package Template + Web UI
- Package Creator + AI Agent
- Step Basic + Pipeline Engine

Reusable behaviors:

- semantic participant roles;
- sequence/lifeline geometry;
- messages/actions between participants;
- state-based reveal of messages and artifacts;
- **role binding / participant substitution** without rebuilding the renderer;
- stable process semantics reused with different concrete actors.

This reference motivates a **sequence/interaction strategy with authored role bindings**, not content-specific transition code.

## 3. Architectural invariants

The following rules are non-negotiable for all roadmap increments:

- No CogniFlow resource IDs, labels, scene IDs, or string matching inside generic renderer/layout/theme code.
- No RDF/SceneDocument `x`, `y`, pixel dimensions, SVG paths, colors, CSS classes, transition durations, easing functions, or D3 force values.
- No semantic inference from duplicated labels such as “two equal edge labels should merge”. Such relations must be authored explicitly.
- Renderer layout must be deterministic for the same semantic input, host size, and theme capabilities.
- Stable authored IDs are used for identity, provenance, accessibility, state transitions, and tests — not as hidden styling selectors.
- Light/dark and visual families are theme concerns.
- Reduced-motion behavior must preserve the semantic state change while removing or minimizing motion.
- Static/self-study renderers must preserve the authored information even when they cannot reproduce animated D3 behavior.
- Existing diagrams without the new optional semantics must remain backward-compatible and visually stable.

## 4. Capability model

The roadmap should grow a small set of composable renderer-neutral capabilities rather than a large catalog of slide-specific diagram types.

| Capability | Authored in TriG / SceneDocument | Renderer responsibility | Legacy reference |
| --- | --- | --- | --- |
| Nodes / directed edges | identity, label, source, endpoints | geometry, routing | all diagrams |
| Semantic groups/layers | membership, order, label | cluster/ring/column realization | architecture, concept-domain |
| Visual roles | semantic token such as comparison/highlight | palette and chrome | current workflow |
| Diagram states | ordered state identity, label/description | transition between snapshots | all three D3 diagrams |
| State membership/visibility | which semantic objects participate in a state | enter/update/exit realization | concept-domain, architecture |
| Focus/lens | authored focus target/group and intent | zoom, de-emphasis, viewport composition | architecture depth stages |
| Shared edge annotation | label + explicit target edge IDs | common callout placement and stems | new workflow “Common custom Script?” |
| Structured node content | semantic rows/fields or referenced resource summary | card/table-like node realization | concept-domain |
| Participant roles | role identity and order | lane/lifeline geometry | service process |
| Role binding | state maps role to concrete participant | participant substitution/morph | service process swaps |
| Messages/actions | source role, target role, semantic action label/order | arrows, message placement | service process |
| Contextual de-emphasis | authored state says which group is context vs focus | grayscale/opacity/blur policy | concept-domain, architecture |

The exact ontology/property names must be decided through the corresponding ADR/contract increment. The table defines capabilities, not final vocabulary.

## 5. Renderer strategy model

Keep one reusable D3 renderer package with internal deterministic strategies. Do not create one renderer per CogniFlow slide.

Initial strategy families:

### `flow`

Already exists. Directed process/workflow presentation with horizontal/vertical responsive layout, semantic roles, labels/callouts, and current Eco City styling.

Required extension: authored diagram states and shared edge annotations.

### `network`

Already exists. Generic grouped network with semantic groups and focus.

Required extension: state-driven group activation and focus/lens realization.

### `layered-network` (working name)

A semantic relation graph in ordered groups/layers. The authored information is group membership/order; the renderer chooses columns, bands, rings, or another theme-supported layout policy.

Use cases:

- ontology → concept layer → specification layer;
- concept domain → processing concepts → affordance model.

Whether this becomes a new `diagramType` or a layout intent on `network` must be decided by ADR. Do not add a new type merely to reproduce old geometry.

### `sequence` (working name)

Ordered participants/lifelines plus semantic messages/actions. The content says who interacts with whom and in what order; renderer owns lane positions, message paths, and responsive fallback.

Use case: Provider / Database / Runtime / Consumer service process and later participant substitution.

## 6. Generic state model

State support is the central prerequisite for the legacy-style presentation behavior.

A candidate renderer-neutral model is:

```text
DiagramState
  id
  position/order
  label
  description
  source evidence
  active groups/nodes/edges or state selections
  optional focus intent
  optional de-emphasis intent
  optional shared edge annotations
  optional role bindings
```

This is a conceptual model only. The ADR must decide whether state participation is represented by explicit membership resources, state snapshots, or another normalized form.

Important design rule: **author the desired semantic state, not animation commands**.

Examples:

- “Package group is active” is valid authored state intent.
- “Focus the package concept domain” is valid renderer-neutral intent.
- “Fade to 22% over 820 ms and translate 150 px” is renderer implementation and must not enter RDF.
- “Provider role is bound to Package Creator in state 7” is authored semantic state.
- “Slide the participant down from y=-640” is renderer implementation.

## 7. Roadmap

Status legend:

- `[x]` available on the current branch
- `[~]` partially available / being hardened
- `[ ]` not implemented

### R0 — Current semantic diagram baseline

- [x] SceneDocument diagram primitive with nodes and edges.
- [x] `flow` and `network` diagram types.
- [x] renderer-neutral `visualRole`.
- [x] semantic `DiagramGroup` membership.
- [x] deterministic renderer-owned flow/network layout.
- [x] generic Eco City node/edge/callout visual grammar.
- [x] generic endpoint-derived edge role realization.
- [x] exact-head visual validation for current light workflow scene.
- [~] dark theme styling exists, but exact-head dark evidence still needs a first-class capture path.

**Gate:** existing static diagrams remain the regression baseline for every later milestone.

### R1 — Authored diagram states and generic interaction runtime

Goal: establish the reusable state machine before migrating complex legacy diagrams.

- [x] Decide SceneDocument version increment and write ADR.
- [x] Add RDF vocabulary + SHACL for ordered `DiagramState` resources.
- [x] Compiler preserves states and source evidence.
- [x] D3 render model preserves states without resolving geometry.
- [x] D3 component exposes `activeState` operations.
- [x] Reduced-motion state changes remain functional.
- [x] Self-study/static fallback exposes state content structurally.

**Canonical fixture:** use a synthetic diagram with no CogniFlow IDs to prove state progression first.

**Gate:** same state model can drive at least two different fixtures without renderer changes.

### R2 — Shared edge annotations

Goal: solve the current workflow interaction as the smallest real state feature.

- [x] Add explicit `SharedEdgeAnnotation` semantics with 2..N target edge IDs.
- [x] Renderer activation preserves annotations as one renderer-owned in-SVG callout with 2..N target stems; static structural fallback remains available.
- [x] Renderer-owned placement avoids node overlap with a deterministic displacement policy.
- [x] No duplicate-label inference.
- [x] Theme reuses standard callout grammar.

**CogniFlow acceptance:** one click replaces both `custom Script` callouts on `03→04` and `07→08` with one shared callout connected to both edges; nodes remain visible and do not jump.

**Gate:** N-edge generic test plus exact-head base/activated visual evidence.

### R3 — State selections, group activation, focus and contextual de-emphasis

Goal: support the architecture diagram’s semantic buildup without encoding animation instructions.

- [x] State can select/reveal authored nodes, edges, groups, and annotations.
- [x] State can identify one semantic focus node or group.
- [x] State can mark non-focused groups as context/de-emphasized.
- [x] Renderer resolves stable keyed identities and applies generic active/context visibility on state updates.
- [x] Renderer derives focus composition and bounded lens metadata from layout without authored geometry.
- [x] Theme applies generic focus/context opacity, grayscale and emphasis treatment, with reduced-motion transitions disabled.
- [x] Layout deterministically recomputes from the unchanged authored graph.

**Canonical fixture:** generic three-group network with one drill-down state.

**Gate:** focus/de-emphasis works for arbitrary groups and does not require resource-specific CSS/TS.

### R4 — Migrate the legacy architecture/layer diagram

Goal: recreate the conceptual behavior of `cf-layer-diagram` using TriG + generic state/network capabilities.

Suggested authored state sequence:

1. ontology focus;
2. ontology definition/annotation;
3. processing-step example;
4. interface-element example;
5. ontology relationship overview;
6. full ontology relation detail;
7. concept layer activated with Package focus;
8. package concept-domain drill-down;
9. package concept drill-down;
10. specification layer activated with Package Template;
11. Service + Semantics Runtime relations visible.

The exact number of states may be reduced when the new presentation narrative is finalized. The important part is that each state is content-driven and reusable.

- [x] First authored network vertical slice: interface, orchestration and provider groups with seven semantic buildup states.
- [x] Use existing network/group/state primitives; no CogniFlow identity or coordinate is introduced in the renderer.
- [x] Add only capabilities already justified by R1–R3.
- [x] Theme reproduces Eco City card language rather than legacy UDE styling.
- [x] Native Reveal click, Enter, Space and reverse navigation drives authored state positions without visible diagram controls; exact-head light/dark capture evidence available.

**Gate:** no code references any CogniFlow entity ID or old slide ID.

### R5 — Generic layered semantic graph (deferred)

Goal: cover the concept-domain drill-down without hard-coded three-column D3 code.

- [ ] ADR decides whether ordered semantic groups extend `network` or justify `layered-network`.
- [ ] Author ordered layer/group semantics.
- [ ] Support structured node summaries/cards without embedding renderer markup in TriG.
- [ ] Generic layer layout provides minimum width, spacing, edge clearance, and overflow policy.
- [ ] State activation can reveal one layer while de-emphasizing prior context layers.
- [ ] Renderer supports cross-layer edges and collision-safe labels.
- [ ] Responsive fallback remains readable on narrow viewports.

**Canonical fixture:** abstract A/B/C semantic layers with synthetic entities before CogniFlow migration.

**Gate:** pending R5: the same renderer can realize 2, 3, and 4 layers from content alone. R4 representative light/dark state evidence is the entry prerequisite.

**2026-09-17 structural decision:** defer this capability increment while the current generic `network` strategy is sufficient for the first R6 progression. It already realizes arbitrary semantic groups, state-selected visibility, focus/context treatment, cross-group edges and narrow-host stacking without content selectors. The current SceneDocument node label contract is sufficient for the initial ontology vocabulary; add ordered-layer semantics or structured node summaries only when a concrete R6 state cannot be expressed or remain readable with that contract.

**2026-09-17 visual decision:** R5 remains `DEFERRED / NOT REQUIRED FOR CURRENT ARCHITECTURE`. Representative R4 architecture and R6 concept-domain captures show the generic `network` strategy is structurally sufficient: groups read as distinct regions, focus creates readable emphasis, prior layers remain visible as context, and cross-group edges are understandable. No ordered-layer geometry or structured-node contract is required for the current authored progression.

### R6 — Migrate the legacy concept-domain diagram

Goal: reproduce the pedagogical progression, not the old coordinates or painted-column implementation.

Suggested progression:

1. ConceptDomain root;
2. Concept + Port/property/attribute/type semantics;
3. ProcessingStep + ProcessingPipeline layer;
4. PipelineNode / RunTarget / `runs` relations;
5. concrete `qalg:Average` + ports + service binding.

- [x] Current-ontology TriG progression contains explicit active groups/nodes/edges and focus/context membership for every state.
- [x] Current node label contract remains sufficient; structured nodes deferred until a concrete state cannot be expressed readably.
- [x] Prior groups remain as authored de-emphasized context where relevant.
- [x] No renderer knows terms such as `qalg:Average`, `cfproc:RunTarget`, or `cfproc:ProcessingPipeline`.
- [x] Theme controls layer palettes, card variants, shadow/glow, and transition grammar.

**Gate:** switching the TriG to another concept domain yields the same presentation grammar without renderer changes.

### R7 — Generic sequence/interaction diagram

Goal: model the service-process presentation as semantic roles/messages rather than hand-authored SVG paths.

Candidate semantics:

```text
ParticipantRole
ParticipantBinding
InteractionMessage
InteractionArtifact / optional annotation
DiagramState
```

- [x] SceneDocument 1.3 contract preserves participant roles, ordered messages and state-specific bindings.
- [x] RDF/SHACL/compiler contract is renderer-neutral and deterministic.
- [x] Deterministic wide lane and narrow compact layout model is available.
- [x] Message ordering and routing renderer-owned.
- [x] States reveal messages/actions progressively through the shared Pitch/Reveal state host.
- [x] Role bindings substitute concrete participants while preserving role/process identity.
- [x] Static fallback serializes participants and ordered messages.
- [x] Narrow viewport uses the compact sequence layout.

**Canonical fixture:** generic Client / Registry / Runtime / Consumer interaction.

**Gate:** participant substitution can change actors while all process-message semantics remain unchanged.

### R8 — Migrate the legacy service-process diagram

Goal: reproduce the reusable process demonstrated by `cf-service-process-diagram`.

- [x] Current ontology service terms are authored as Interface, Orchestration, Specialized provider and Consumer roles.
- [x] Request, dispatch, resolve capability and return result are authored messages.
- [x] State transitions swap MCP Server, CogniFlow Orchestrator and provider bindings generically.
- [x] Eco City light/dark theme realizes participant cards, lifelines, and messages without participant selectors.

**Gate:** adding a fourth provider/consumer pair requires only TriG content.

### R9 — Theme and transition grammar hardening

Goal: ensure all diagram strategies share one coherent visual system.

- [~] Common theme tokens for node/card roles, edge roles, callouts, layers, participants, messages, context/de-emphasis, shadows/glows — initial Eco City tokens cover all three diagram families; consolidation pass remains open.
- [x] Light and dark palettes for every semantic role — structurally supported; exact-head evidence captured for workflow, architecture and sequence.
- [x] Standard enter/update/exit timings and easing owned by theme/runtime.
- [x] Reduced-motion equivalents.
- [x] Focus/lens and de-emphasis treatment consistent across network/sequence strategies.
- [x] No selector uses content IDs or labels.

**Gate:** all three migrated legacy patterns look like one presentation system rather than three bespoke D3 demos.

### R10 — Visual evidence and regression system

- [x] Visual worker request schema supports bounded generic presentation-step capture; layout snapshots record requested and realized steps plus diagram state metadata.
- [x] Capture API can perform bounded generic interaction (`advance state N times`).
- [x] Exact source SHA is recorded in every visual manifest; representative captures exist for the current exact head.
- [x] Representative light + dark captures for workflow, architecture, concept-domain and sequence states.
- [x] Layout JSON includes presentation steps, active diagram state/focus metadata, and SVG element bounding boxes needed for non-overlap assertions.
- [x] Geometric tests cover generic flow/network callout envelopes and sequence participant lanes/messages.
- [~] Accessibility checks cover keyboard activation/state description — keyboard navigation is implemented and tested; screen-reader state description polish remains open.

**Gate:** a stateful diagram change cannot be accepted from tests alone; exact-head state evidence is available.

## 8. Recommended implementation order

Do not start by porting the largest legacy diagram. Build capabilities in increasing expressive power:

1. **R1 states** — generic state machine and interaction contract.
2. **R2 shared edge annotations** — current two-workflow example; smallest concrete stateful visual.
3. **R3 focus/group activation** — prerequisite for ontology/layer buildup.
4. **R4 architecture migration** — first rich multi-state content migration.
5. **R5 layered semantic graph** — formalize reusable semantic-layer layout.
6. **R6 concept-domain migration** — richest ontology-driven graph.
7. **R7 sequence renderer** — new structural diagram family.
8. **R8 service-process migration** — prove reusable role bindings.
9. **R9/R10 hardening** — shared theme, dark mode, reduced motion, and state-aware visual validation.

This order intentionally uses **synthetic generic fixtures before each CogniFlow migration**. If a capability cannot be demonstrated without CogniFlow IDs/content, its abstraction is not ready.

## 9. Contract/versioning policy

Each milestone must ask one question before implementation:

> Does this add authored semantics that downstream adapters are required to preserve?

If yes, it requires a documented SceneDocument version increment and compatibility plan. In particular, authored diagram states, shared annotations, participant roles/messages, and role bindings are stronger candidates for a versioned contract increment than pure D3 layout improvements.

Do not version for renderer-only changes such as:

- better collision avoidance;
- different ring radius;
- dark-mode glow;
- animation easing;
- responsive breakpoint changes;
- theme palette changes.

## 10. Testing pyramid for every new capability

1. **RDF/SHACL** — authored resources are structurally valid and cross-references remain inside the owning diagram.
2. **Core contract** — SceneDocument validates and preserves source/provenance.
3. **Compiler** — TriG projects deterministically into the contract.
4. **Render model** — renderer-neutral semantics survive adaptation.
5. **Layout** — deterministic geometry and quality invariants.
6. **Runtime** — state changes, interaction, cleanup, reduced motion.
7. **Pitch** — Reveal interaction and navigation coexist correctly.
8. **Static adapters** — information is not lost when animation is unavailable.
9. **Exact-head visual evidence** — representative base/state + light/dark captures.

Use impact-based testing during iteration; reserve broad/full-suite runs for contract/compiler changes and pre-merge verification.

## 11. Explicit anti-goals

We are not building:

- a generic “execute arbitrary D3 from RDF” mechanism;
- an RDF vocabulary for SVG/CSS;
- a slide-specific animation scripting language;
- automatic semantic inference from visual similarity or repeated text;
- one renderer component per CogniFlow slide;
- pixel-perfect preservation of the legacy presentation geometry;
- presentation state encoded as Reveal fragment count in content.

The goal is a **small, explicit semantic presentation vocabulary plus deterministic renderer strategies**.

## 12. Definition of done for the roadmap

The roadmap is complete when all three legacy reference patterns can be expressed by editing TriG content and choosing standard diagram semantics, while renderer/theme code remains unchanged for content substitutions:

- architecture/layer buildup + focus drill-down;
- concept-domain layered semantic expansion;
- service-process sequence + participant substitution.

At that point, a new presentation author should be able to create an equally rich multi-stage diagram by authoring content/state semantics — without writing D3, SVG, CSS, or scene-specific TypeScript.

## 13. Immediate next milestone

**R1–R8 are implemented and evidenced; R5 remains deferred. Current next action: finalize R9 token consolidation and R10 accessibility/state-description polish, then prepare PR #155 for final review.**

Representative exact-head evidence for the current branch is available at `C:\\Users\\PCUser\\AppData\\Local\\AgentWorkflowValidator\\evidence\\GeRe87\\project-chemie-digital\\visual\\cogniflow\\3a7fa632f4365f5bb8c526e577bb211eb574695e\\`, captured by the generic visual worker with request schema `1.2`. The matrix covers workflow base/activated, architecture base/focus/overview, concept-domain root/final, and sequence base/interaction/binding/final in light and dark modes. Layout JSON records active state, focus bounds, and SVG bounding boxes for regression assertions.
