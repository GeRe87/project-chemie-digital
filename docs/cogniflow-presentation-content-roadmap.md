# CogniFlow Presentation Content Roadmap

**Status:** Living roadmap  
**Owner context:** CogniFlow presentation in `project-chemie-digital`  
**Presentation format:** ~15 scenes, Reveal.js Scroll View  
**Visual language:** 16-bit Retro / Eco City / HUD-inspired scientific presentation  
**Audience:** Chemists and analytical scientists without prior knowledge of semantic workflow standardization  
**Companion roadmap:** `docs/cogniflow-presentation-diagram-roadmap.md`

---

## 1. Purpose of this roadmap

This document is the **content and narrative source of truth** for the CogniFlow presentation.

It defines:

- the audience assumptions;
- the central argument of the presentation;
- the intended learning progression;
- the approximately 15 presentation scenes;
- the semantic and visual role of every scene;
- which existing presentation primitives should be used;
- where generic system extensions may be required;
- acceptance criteria for narrative, semantic and visual completion.

This roadmap is intentionally separate from the technical diagram roadmap.

The responsibilities are:

```text
cogniflow-presentation-content-roadmap.md
    ↓
What do we want to explain?
Why is each scene necessary?
What should the audience understand?

cogniflow-presentation-diagram-roadmap.md
    ↓
Which generic presentation capabilities are required?
How are they represented in RDF / SceneDocument / renderer / theme?
```

The presentation must not drive presentation-specific special cases into the generic runtime.

---

## 2. Audience

The primary audience consists of chemists and analytical scientists.

We assume that the audience:

- understands scientific data processing in practice;
- understands analytical workflows involving instruments, raw data, processing and reports;
- is familiar with FAIR principles at least conceptually;
- understands reproducibility as a scientific requirement.

We **do not** assume prior knowledge of:

- semantic workflow descriptions;
- RDF or knowledge graphs;
- ontologies;
- machine-readable workflow contracts;
- service-oriented architectures;
- dependency decoupling;
- MCP;
- Apache Jena / Fuseki;
- CogniFlow Concepts;
- CogniFlow Services;
- Processing Units;
- semantic pipeline composition.

The presentation must therefore introduce these concepts **only after the problem requiring them has become clear**.

---

## 3. Central narrative

The presentation follows one main argument:

> Scientific data may be FAIR while the processing that transforms those data into scientific results remains implicit, software-dependent and difficult to reproduce.

CogniFlow extends the FAIR idea from data to the **complete digital processing context**.

The fundamental design principle is:

> Turn implicit knowledge into explicit, machine-readable knowledge.

CogniFlow therefore aims to make scientific data processing:

- transparent;
- traceable;
- FAIR;
- digital by design;
- modular;
- machine-readable;
- human-readable;
- reproducible;
- composable.

The architecture follows from this principle.

CogniFlow does **not** begin with a specific programming language, package manager, workflow engine or user interface.

It begins with a shared semantic core.

---

## 4. Core message

The final audience understanding should be:

> CogniFlow does not standardize one implementation of scientific data processing.

Instead:

> CogniFlow standardizes how concepts, capabilities, processing steps, interfaces and provenance are described.

This allows different implementations to remain independent while still being discoverable, understandable and interoperable.

A useful final formulation is:

> **Standardize the meaning and the contract — not the implementation.**

And at the FAIR level:

> **From FAIR data to FAIR data processing.**

---

## 5. Narrative progression

The presentation should deliberately move through five conceptual stages.

### Stage A — The familiar scientific problem

The audience first sees a situation it already knows:

```text
RAW DATA → ? → RESULT
```

The processing between data and result contains important scientific knowledge, but much of it is frequently implicit.

### Stage B — The CogniFlow philosophy

The proposed solution is not initially technical.

Everything relevant to processing should become:

```text
explicit
digital
machine-readable
human-readable
traceable
```

This leads naturally to semantics.

### Stage C — The semantic core

CogniFlow introduces a small common semantic grammar:

```text
Concept
 ├── Attributes
 └── Properties
```

From this grammar, compatible specifications can be defined.

Examples include:

```text
Package
Service
ProcessingUnit
Artifact
...
```

The common semantic core is the heart of CogniFlow.

### Stage D — Decoupled functionality

Because functionality is described semantically, components do not need direct software dependencies.

Packages expose functionality as Services.

Consumers request capabilities.

Providers implement capabilities.

Service discovery and invocation happen through the CogniFlow infrastructure.

### Stage E — FAIR data processing

The same principle is applied to scientific processing.

Processing Units describe individual operations and infrastructure steps.

Processing Pipelines combine Processing Units into complete workflows.

Each component remains explicitly described with identity, version, inputs, outputs, parameters, implementation and provenance.

The processing workflow itself therefore becomes a digital and reusable scientific object.

---

## 6. Presentation rules

### 6.1 Motivation before terminology

Never introduce terms such as:

- ontology;
- RDF;
- MCP;
- Provider;
- Consumer;
- ProcessingUnit;

before the audience understands what problem that concept solves.

### 6.2 Chemistry before software architecture

Examples should originate from realistic scientific work:

- analytical signals;
- instrument data;
- processing;
- reports;
- quantitative results;
- uncertainty;
- provenance.

Software architecture is introduced as an enabling mechanism.

### 6.3 Explicit knowledge, not elimination of expertise

Do not claim that CogniFlow eliminates scientific expertise.

The intended claim is:

> **No implicit integration knowledge should be required.**

Scientific judgement remains necessary.

Knowledge such as the following should not remain implicit:

> Package X requires version Y.  
> Algorithm A expects this input structure.  
> Parameter Z was set to 0.05.  
> This processing step produced this result.  
> This implementation corresponds to this capability.

Such information belongs in the digital description.

### 6.4 Architecture must appear inevitable

The audience should reach:

> “Now I understand why CogniFlow needs semantics, Services, the MCP interface and Processing Units.”

rather than:

> “CogniFlow happens to use RDF, MCP and Fuseki.”

---

## 7. Planned scene set

## Scene 01 — What happened between the raw data and this result?

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Start from a familiar scientific situation.

### Core message

A scientific result depends on everything that happened between the original measurement and the final result.

### Visual concept

```text
RAW DATA                        RESULT
chromatogram                    PDF / value / table
     │                               ▲
     └────────── BLACK BOX ──────────┘
```

The black box contains no technical detail initially.

### Audience takeaway

> “Yes. I know the result, but reconstructing exactly how we got there can be difficult.”

### Possible presentation primitive

`flow`

### Transition

> What if the data themselves are already FAIR?

---

## Scene 02 — FAIR data are not enough

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Connect CogniFlow to a concept familiar to the audience.

### Core message

FAIR data do not automatically imply FAIR processing.

Open formats and metadata can describe the input data while the transformation into a scientific result remains implicit.

### Example

```text
Instrument
    ↓
  mzML
    ↓
 custom script
    ↓
processed result
```

Possible hidden knowledge:

- software package;
- exact version;
- algorithm;
- parameters;
- execution environment;
- dependencies;
- manual decisions.

### Audience takeaway

> FAIRness must also include the processing context.

### Possible presentation primitive

`flow`

### Transition

> What would processing look like if we treated it as digital scientific information from the beginning?

---

## Scene 03 — Make the complete workflow explicit

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Introduce the CogniFlow philosophy before introducing CogniFlow technology.

### Core message

Every scientifically relevant relationship should be explicit enough to be understood by both humans and machines.

### Visual progression

The previous black box opens.

```text
DATA
 ↓
PROCESSING
 ↓
RESULT
```

becomes progressively annotated with:

```text
what?
which implementation?
which version?
which parameters?
which input?
which output?
how was it produced?
```

### Key terms

```text
TRANSPARENT
TRACEABLE
DIGITAL
MODULAR
MACHINE-READABLE
```

### Audience takeaway

> We first need a digital description of what things mean and how they relate.

### Transition

> That is why CogniFlow does not start with software. It starts with semantics.

---

## 8. The semantic core

## Scene 04 — CogniFlow starts with meaning

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Introduce the heart of CogniFlow.

### Core message

The center of CogniFlow is a shared semantic model.

Not:

```text
Python
Rust
Java
MCP
Fuseki
```

but:

```text
COGNIFLOW CORE SEMANTICS
```

### Visual concept

One central object:

```text
┌───────────────────────┐
│ COGNIFLOW SEMANTICS   │
│                       │
│       CONCEPT         │
└───────────────────────┘
```

Everything else remains hidden.

### Audience takeaway

> CogniFlow first defines what something is.

### Possible primitive

`network` or a simple semantic hero scene.

### Transition

> The basic building block is surprisingly small.

---

## Scene 05 — Concepts are the building blocks

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Explain the fundamental semantic grammar without requiring ontology knowledge.

### Core message

CogniFlow describes things as Concepts.

Concepts can have:

- Attributes;
- Properties.

Concepts and their relationships allow specifications to be defined.

### Conceptual model

```text
                 CONCEPT
                /       \
               /         \
       ATTRIBUTES       PROPERTIES
```

### Important narrative constraint

Do not turn this into an ontology lecture.

The audience only needs to understand:

> We use one consistent language for describing what things are and how they relate.

### Possible primitive

`network` + `DiagramState`

### Audience takeaway

> Everything in CogniFlow follows the same semantic grammar.

### Transition

> Once we have that common grammar, very different things can become CogniFlow-compatible.

---

## Scene 06 — One semantic core. Many specifications.

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Explain why the small core is architecturally powerful.

### Core message

Different specifications can be derived from the same semantic core.

Examples:

```text
                     COGNIFLOW CORE
                          │
          ┌───────────────┼────────────────┐
          │               │                │
       PACKAGE          SERVICE      PROCESSING UNIT
```

Potential later extensions:

```text
Artifact
Dataset
Environment
...
```

### Critical message

These specifications are not made interoperable by directly depending on one another.

They are interoperable because they understand the same semantic model.

### Comparison

Avoid:

```text
A → B → C → D
```

Prefer:

```text
A ─┐
B ─┼─→ shared semantic contract
C ─┘
```

### Audience takeaway

> Common meaning replaces many implicit assumptions between components.

### Possible primitive

`network`

### Transition

> Let us make this concrete with something familiar from software: a package.

---

## 9. Packages and Services

## Scene 07 — A CogniFlow Package is more than code

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Move from abstract semantics to the first concrete CogniFlow Concept.

### Core message

A CogniFlow Package is formally described.

Its description may include concepts such as:

- identity;
- version;
- implementation;
- capabilities;
- offered Services;
- provenance.

### Key distinction

Conventional interpretation:

```text
PACKAGE = code I can import
```

CogniFlow interpretation:

```text
PACKAGE = semantically described provider of capabilities
```

### Audience takeaway

> A machine can understand what a Package offers without inspecting or knowing its internal code.

### Transition

> But packages should not have to import each other to use those capabilities.

---

## Scene 08 — Functionality becomes a Service

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Introduce the Service Concept.

### Core message

CogniFlow Packages expose functionality as Services.

A Service describes a capability through a stable semantic contract.

### Visual concept

```text
PACKAGE
   │
   ├── SERVICE A
   ├── SERVICE B
   └── SERVICE C
```

Examples may include:

```text
create report
store artifact
read dataset
calculate average
fit peak
```

### Critical message

The Service is the contract.

The implementation remains replaceable.

### Audience takeaway

> Functionality can be used without creating a direct package dependency.

### Transition

> This means the component requesting a capability does not need to know who implements it.

---

## Scene 09 — Consumer and Provider do not need to know each other

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Explain dependency decoupling conceptually before showing infrastructure details.

### Core message

A Consumer asks for a capability.

A Provider offers a capability.

They interact through the CogniFlow service infrastructure rather than through a direct dependency.

### Visual comparison

Problem:

```text
Consumer
   ↓ import
Provider
   ↓ dependency
Library
   ↓
...
```

CogniFlow:

```text
Consumer
    ↓
SERVICE CONTRACT
    ↑
Provider
```

### Audience takeaway

> Consumer and Provider only need to share the contract.

### Possible primitive

`network`

### Transition

> So how does the Consumer actually find the Provider?

---

## 10. Service discovery and execution

## Scene 10 — “I need a PDF report.”

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Explain MCP, Fuseki and service discovery through one concrete example.

### Example

The Consumer requests:

> “I need a report as PDF.”

### Intended sequence

```text
Consumer
   │
   │ request capability
   ▼
MCP Server
   │
   │ query available Services
   ▼
CogniFlow semantic/service registry
Apache Jena Fuseki
   │
   │ matching Service
   ▼
Provider
   │
   │ PDF result
   ▼
Consumer
```

### Important technical message

The Consumer does not need to know:

- provider package identity in advance;
- provider implementation language;
- provider internal dependencies;
- provider location within the modular CogniFlow environment.

It asks for a semantically described capability.

### Terminology introduced here

Only now introduce:

- Consumer;
- Provider;
- Service;
- MCP Server;
- local Fuseki/Jena semantic database.

### Possible primitive

`sequence`

### Audience takeaway

> Service discovery replaces direct software dependency.

### Transition

> And CogniFlow applies exactly the same idea to scientific data processing.

---

## 11. Data processing as a first-class semantic object

## Scene 11 — Data processing follows the same philosophy

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Connect the Service architecture with the main scientific goal.

### Core message

Data processing is not treated as a special exception.

It uses the same semantic philosophy.

Introduce:

```text
DataProcessingConcept
```

and:

```text
ProcessingUnit
```

### Audience takeaway

> A processing operation is another explicitly described CogniFlow object.

### Transition

> Processing Units give us a common language for everything that can happen inside a workflow.

---

## Scene 12 — The Processing Unit

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Introduce the structural model underlying CogniFlow processing.

### Core message

A Processing Unit can represent different processing roles while sharing a common contract.

Initial conceptual structure:

```text
PROCESSING UNIT
      │
      ├── elementary processing step
      │
      ├── infrastructure step
      │
      └── processing pipeline
```

A pipeline is itself composed of Processing Units.

### Important semantic properties

A Processing Unit should be describable in terms of concepts such as:

- identity;
- purpose / capability;
- input;
- output;
- parameters;
- implementation;
- version;
- provenance;
- execution requirements.

The final vocabulary must follow the actual CogniFlow ontology and must not be invented solely for the presentation.

### Possible primitive

`network`

### Audience takeaway

> All processing components obey the same semantic contract.

### Transition

> This changes what we mean by a processing pipeline.

---

## 12. Pipelines

## Scene 13 — A pipeline is not a script

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Make the main distinction between conventional workflow scripts and CogniFlow pipelines.

### Conventional workflow

```text
script.py
 ├── import package A
 ├── import package B
 ├── call function C
 └── save result
```

Much knowledge remains encoded in implementation details.

### CogniFlow pipeline

```text
INPUT
  ↓
ProcessingUnit
  ↓
ProcessingUnit
  ↓
InfrastructureUnit
  ↓
ProcessingUnit
  ↓
OUTPUT
```

Each unit is semantically described.

### Critical message

A pipeline is:

> A semantic composition of processing capabilities.

not merely:

> A sequence of function calls.

### Possible primitive

`flow`

### Audience takeaway

> The structure and meaning of the workflow exist independently from one specific implementation.

### Transition

> Once every step is explicit, a machine can reason about the workflow as well.

---

## 13. Machine-composable processing

## Scene 14 — Machines can compose and execute the workflow

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Show the payoff of the preceding semantic architecture.

### Core message

When every Processing Unit explicitly describes its role and interfaces, CogniFlow can support machine-assisted workflow composition and execution.

Possible responsibilities include:

- discover suitable Processing Units;
- match capabilities;
- inspect input/output compatibility;
- resolve implementations;
- construct Processing Pipelines;
- create isolated execution contexts;
- execute the workflow;
- capture versions and parameters;
- retain provenance.

### Sandbox concept

Execution may be organized in isolated/sandbox-like environments so that individual implementations can retain their own dependencies without creating one global dependency graph.

### Critical wording

Do not imply that arbitrary scientific workflows can be generated correctly without scientific judgement.

The machine can reason over the **explicit technical and semantic contract**.

Scientific suitability remains a domain decision.

### Possible primitive

`flow` + `sequence` or stateful `network`

### Audience takeaway

> Explicit semantics allow software to reason about relationships that previously existed only in developer knowledge.

### Transition

> The result is that FAIRness no longer ends at the input data.

---

## 14. Final synthesis

## Scene 15 — From FAIR data to FAIR data processing

**Status:** [ ] Narrative  
**Implementation:** [ ] RDF  
**Visual:** [ ] Accepted

### Purpose

Compress the complete presentation into one final mental model.

### Core progression

```text
FAIR DATA
    ↓
FAIR MEANING
    ↓
FAIR FUNCTIONALITY
    ↓
FAIR PROCESSING
    ↓
REPRODUCIBLE RESULT
```

Alternative visual structure:

```text
DATA
SEMANTICS
SERVICES
PROCESSING
PROVENANCE
```

all connected through one common semantic model.

### Final principles

```text
TRANSPARENT
MODULAR
MACHINE-READABLE
TRACEABLE
REPRODUCIBLE
```

### Final statement

> **Standardize the meaning and the contract — not the implementation.**

Optional secondary line:

> **From FAIR data to FAIR data processing.**

### Audience takeaway

The audience should now understand why CogniFlow contains:

- semantic Concepts;
- semantic specifications;
- Packages;
- Services;
- Consumer/Provider separation;
- MCP;
- Fuseki;
- Processing Units;
- Processing Pipelines;
- provenance.

These should appear as consequences of the original design philosophy rather than as unrelated technologies.

---

## 15. Scene dependency map

The scenes form a strict explanatory chain.

```text
01 Scientific black box
        ↓
02 FAIR data are not enough
        ↓
03 Make processing explicit
        ↓
04 CogniFlow starts with semantics
        ↓
05 Concepts + Attributes + Properties
        ↓
06 Specifications from one semantic core
        ↓
07 Package Concept
        ↓
08 Service Concept
        ↓
09 Consumer / Provider decoupling
        ↓
10 MCP + Fuseki concrete example
        ↓
11 Apply the same model to processing
        ↓
12 Processing Unit
        ↓
13 Processing Pipeline
        ↓
14 Machine composition / execution
        ↓
15 FAIR data processing
```

A scene should not be implemented merely because it is visually attractive.

Every scene must make the next scene logically necessary.

---

## 16. Presentation-system mapping

The current generic architecture should be reused wherever possible.

| Presentation requirement | Preferred primitive |
|---|---|
| Linear scientific workflow | `flow` |
| Semantic Concept relationships | `network` |
| Concept / specification progression | `network` + `DiagramState` |
| Consumer / Provider architecture | `network` |
| Service request lifecycle | `sequence` |
| Role substitution | `sequence` + Participant Bindings |
| Processing pipeline | `flow` |
| Focus / context progression | `DiagramState` |
| Shared annotations | Shared Edge Annotation |
| Final summary | prose / semantic hero composition |

No new diagram type should be introduced unless the semantic structure cannot be represented correctly by the existing generic primitives.

---

## 17. Architecture constraints

All implementation work for this presentation must respect the existing project architecture.

### Content

Audience-visible scientific and architectural meaning belongs in:

```text
TriG / RDF
```

### Transport

Renderer-neutral presentation structure belongs in:

```text
SceneDocument
```

### Geometry

Layout belongs in:

```text
renderer-d3
```

### Appearance

Visual language belongs in:

```text
Theme / CSS
```

### Navigation

Presentation progression belongs in:

```text
Reveal / generic presentation-state runtime
```

The following are prohibited:

- CogniFlow resource IDs in generic renderer code;
- scene-specific string matching;
- authored pixel coordinates in RDF;
- authored CSS classes in RDF;
- presentation-specific colors in semantic data;
- special renderer branches for individual CogniFlow slides;
- hard-coded slide labels used as runtime behavior selectors.

---

## 18. Generic extension gate

A new system capability may be introduced only when all of the following are true:

1. The desired behavior cannot be expressed cleanly with existing primitives.
2. The behavior is useful outside the CogniFlow presentation.
3. The semantic intent can be represented without visual implementation details.
4. SceneDocument can transport it renderer-neutrally.
5. Static/self-study fallback can preserve its information.
6. Tests can be written without CogniFlow-specific IDs.

Examples of potentially legitimate generic extensions:

- coordinated SceneStates across multiple blocks;
- generic semantic projection relationships;
- reusable structured semantic cards;
- generic capability/interface visual roles.

A visual preference alone does not justify a schema or renderer extension.

---

## 19. Definition of done for one scene

A scene is complete only when all four layers are accepted.

### Narrative

- [ ] The scene has exactly one primary message.
- [ ] The audience can understand it without knowledge introduced later.
- [ ] Its relationship to the previous scene is explicit.
- [ ] Its transition makes the following scene necessary.
- [ ] No unnecessary terminology is introduced.

### Semantic model

- [ ] Audience-visible meaning is authored in TriG.
- [ ] Semantic identities are stable.
- [ ] Relationships are explicit rather than inferred from labels.
- [ ] SHACL validates the authored structure.
- [ ] No presentation-only semantics were introduced.

### Runtime

- [ ] SceneDocument contains all required renderer-neutral information.
- [ ] Existing generic renderer primitives are used where possible.
- [ ] Forward and reverse state traversal works.
- [ ] Scroll View works correctly.
- [ ] Static fallback preserves the information.

### Visual acceptance

- [ ] 16-bit / Eco City visual language is consistent.
- [ ] Light and dark variants remain legible where supported.
- [ ] The scene works at the target presentation viewport.
- [ ] Information hierarchy is obvious within seconds.
- [ ] Text remains readable at presentation distance.
- [ ] No decorative element competes with the core message.

---

## 20. Overall implementation phases

## Phase 1 — Narrative freeze

Goal:

Finalize the scientific story before implementation work.

Tasks:

- [ ] Accept the 15-scene narrative spine.
- [ ] Confirm terminology.
- [ ] Confirm the Package / Service / ProcessingUnit conceptual progression against the actual CogniFlow ontology.
- [ ] Define one sentence of audience understanding for every scene.
- [ ] Remove obsolete content from the previous CogniFlow presentation plan.

Exit criterion:

> The complete talk can be delivered verbally without slides and follows one coherent argument.

---

## Phase 2 — Semantic content design

Goal:

Represent the accepted narrative as CogniFlow presentation content in RDF.

Tasks:

- [ ] Identify reusable existing semantic resources.
- [ ] Author required Concepts.
- [ ] Author diagrams and relationships.
- [ ] Author DiagramStates.
- [ ] Author the new LearningPath / scene ordering.
- [ ] Validate through SHACL.
- [ ] Avoid presentation-only vocabulary.

Exit criterion:

> The complete narrative exists semantically without relying on custom renderer code.

---

## Phase 3 — Generic system gap analysis

Goal:

Determine whether any accepted scene requires missing generic presentation functionality.

Tasks:

- [ ] Map every scene to existing SceneDocument primitives.
- [ ] Map every scene to renderer strategies.
- [ ] Identify genuine generic gaps.
- [ ] Reject CogniFlow-only special cases.
- [ ] Create bounded architecture issues where required.

Exit criterion:

> Every required system extension has a generic use case and explicit semantic contract.

---

## Phase 4 — Scene implementation

Goal:

Build the presentation sequentially.

Recommended implementation order:

```text
01 → 02 → 03
04 → 05 → 06
07 → 08 → 09 → 10
11 → 12 → 13 → 14
15
```

Do not implement all scenes before reviewing them.

Each small group should be reviewed for:

- narrative;
- semantic correctness;
- scroll rhythm;
- visual hierarchy.

---

## Phase 5 — Visual system pass

Goal:

Make the completed semantic presentation visually coherent.

Focus:

- 16-bit typography;
- panel grammar;
- HUD elements;
- node cards;
- connection lines;
- spacing;
- Eco City integration;
- scroll composition;
- visual state transitions.

The Theme layer owns appearance.

No visual polish should modify the scientific semantic model.

---

## Phase 6 — Talk acceptance

Goal:

Validate the presentation as an actual ~15-slide scientific talk.

Checks:

- [ ] Opening establishes the problem quickly.
- [ ] FAIR is connected to processing rather than explained from scratch.
- [ ] Semantics appear as a solution, not as ontology theory.
- [ ] MCP/Fuseki are introduced only after their purpose is understood.
- [ ] ProcessingUnit is clearly connected to the earlier Service philosophy.
- [ ] The distinction between a script and a semantic pipeline is obvious.
- [ ] Scientific expertise is not presented as unnecessary.
- [ ] Final scene closes the argument introduced by Scene 01.
- [ ] No scene exists primarily to demonstrate Project Chemie Digital technology.
- [ ] The presentation remains understandable without seeing implementation code.

---

## 21. Roadmap maintenance

This file is a living roadmap.

Whenever presentation work changes the planned narrative:

1. update this roadmap first or in the same PR;
2. update scene status;
3. document major narrative decisions;
4. record newly discovered generic system requirements;
5. keep implementation details in the technical roadmap or ADRs.

Do not let the implemented slides silently become the specification.

The roadmap should remain sufficient to answer:

> Why does this scene exist?

> What should the audience understand afterwards?

> Which semantic information does it require?

> Which generic presentation primitive implements it?

---

## 22. Decision log

### D1 — Audience-first narrative

**Decision:** The presentation starts from the scientific reproducibility problem rather than from CogniFlow architecture.

**Reason:** The audience consists primarily of chemists without prior knowledge of semantic workflow standardization.

### D2 — FAIR processing as framing

**Decision:** FAIR data are used as the familiar conceptual bridge toward FAIR processing.

**Reason:** The audience already understands FAIR principles, while CogniFlow extends those principles into processing semantics, interfaces and provenance.

### D3 — Semantics before architecture

**Decision:** CogniFlow Concepts are introduced before Packages, Services, MCP or Fuseki.

**Reason:** The technical architecture should be understood as a consequence of the semantic philosophy.

### D4 — Services before Processing Units

**Decision:** The Service architecture is explained before DataProcessingConcept / ProcessingUnit.

**Reason:** Consumer/Provider decoupling provides an intuitive explanation for the modularity principle that is later reused for data processing.

### D5 — No claim that expertise becomes unnecessary

**Decision:** CogniFlow removes implicit integration knowledge, not scientific expertise.

**Reason:** Scientific suitability and interpretation remain expert responsibilities even when technical relationships are machine-readable.

### D6 — Existing presentation system remains generic

**Decision:** CogniFlow content must not create CogniFlow-specific renderer behavior.

**Reason:** The presentation is also intended to demonstrate the capability of Project Chemie Digital as a semantic presentation system.

---

## 23. Current next step

The next work item is **Phase 1 — Narrative freeze**.

Before changing presentation RDF or renderer code, refine Scenes 01–15 until each scene has:

- one core statement;
- one audience takeaway;
- one transition;
- one intended reveal sequence;
- one preferred generic presentation primitive.

Only after that narrative is accepted should the old CogniFlow content be migrated or replaced.
