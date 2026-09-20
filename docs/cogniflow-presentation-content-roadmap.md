# CogniFlow Presentation Content Roadmap

**Status:** Narrative Freeze v1 — living roadmap  
**Owner context:** CogniFlow presentation in project-chemie-digital  
**Presentation format:** approximately 16 scenes, Reveal.js Scroll View  
**Visual language:** 16-bit Retro / Eco City / restrained HUD-inspired scientific presentation  
**Audience:** chemists and analytical scientists without prior knowledge of semantic workflow standardization  
**Companion roadmap:** docs/cogniflow-presentation-diagram-roadmap.md  
**Narrative baseline:** 2026-09-19

---

## 1. Purpose

This document is the content and narrative source of truth for the CogniFlow presentation.

It answers five questions for every scene:

1. Why does this scene exist?
2. What is the one statement the audience must understand?
3. What is revealed, and in which order?
4. Why does the next scene logically follow?
5. Which generic presentation primitive should realize the scene?

The technical companion roadmap answers a different question: which generic RDF, SceneDocument, renderer and theme capabilities are required to implement the accepted narrative.

The implemented slides must not silently become the specification. If the story changes, this roadmap changes with it.

---

## 2. Audience model

The primary audience consists of chemists and analytical scientists.

We assume that they understand:

- instruments, measurements, raw data and derived results;
- routine scientific data processing;
- scripts, software tools and reports at a practical level;
- reproducibility as a scientific requirement;
- the FAIR principles at least conceptually.

We do not assume prior knowledge of:

- semantic workflow descriptions;
- RDF or knowledge graphs;
- ontologies;
- machine-readable workflow contracts;
- service-oriented architecture;
- dependency decoupling;
- MCP;
- Apache Jena / Fuseki;
- CogniFlow Concept Domains;
- CogniFlow Services;
- Processing Units;
- semantic pipeline composition.

Therefore the talk must never start with architecture vocabulary. Every technical concept is introduced only after the audience has already understood the problem that requires it.

---

## 3. Narrative thesis

The presentation follows one argument:

> FAIR data are necessary, but they are not sufficient for transparent and reproducible data processing.

A scientific result is not defined by its input data alone. It also depends on the transformations, parameters, implementations, versions, interfaces and provenance between the measurement and the final result.

CogniFlow extends the FAIR idea from the data object to the complete digital processing context.

The central design principle is:

> Turn implicit knowledge into explicit, machine-readable knowledge.

Everything else in the architecture follows from this decision.

CogniFlow therefore aims to make processing:

- transparent;
- traceable;
- digital by design;
- modular;
- machine-readable;
- human-understandable;
- reproducible;
- discoverable;
- composable.

The final message is:

> **Standardize the meaning and the contract — not the implementation.**

The FAIR framing is:

> **From FAIR data to FAIR data processing.**

---

## 4. Narrative guardrails

### 4.1 Motivation before terminology

The talk must not introduce RDF, ontology, MCP, Fuseki, Consumer, Provider or ProcessingUnit before the audience understands why that abstraction is needed.

### 4.2 Chemistry before software architecture

Whenever possible, motivation starts from chemistry:

- analytical signals;
- instrument data;
- processing steps;
- quantitative results;
- reports;
- uncertainty;
- provenance.

Software architecture is the answer, not the opening topic.

### 4.3 Explicit knowledge does not replace scientific expertise

CogniFlow does not remove the need for scientific judgement.

The intended claim is:

> **No implicit integration knowledge should be required.**

A chemist must still decide whether a method is scientifically appropriate. CogniFlow aims to prevent technical and procedural knowledge from existing only in somebody's head, for example:

- which implementation was used;
- which version was used;
- which input structure is expected;
- which parameters were used;
- which capability an operation provides;
- which output it produces;
- where the implementation is defined;
- how the result was derived.

### 4.4 Architecture must appear inevitable

By the time MCP, Fuseki and Processing Units appear, the audience should think:

> “Of course we need this if components must understand one another without knowing one another.”

Not:

> “CogniFlow happens to use these technologies.”

### 4.5 Separate current implementation from architectural target

The talk may explain both currently implemented Stonecastle concepts and architectural goals, but it must not blur them.

If a capability is a design target rather than an implemented feature, the speaker wording must say so.

---

## 5. Terminology alignment with CogniFlow Stonecastle

The Narrative Freeze was checked against the current stonecastle branch of GeRe87/cogniflow-playground.

The presentation should use the following semantic structure as its technical anchor.

### 5.1 Core semantic grammar

Current core vocabulary includes:

- ConceptDomain
- Concept
- Attribute
- Relation
- ControlledValue
- Shape

For the audience, the important idea is simpler:

> A Concept is described through structured attributes and explicit relationships.

Do not turn this into an ontology lecture.

The exact Relation / Property terminology is still evolving across the current Stonecastle semantic sources. Resolve that vocabulary before Phase 2 semantic authoring. The presentation should not expose an internal naming inconsistency.

### 5.2 Package Concept

The current package concept models CfPackage as a versioned CogniFlow module.

Relevant semantic information includes:

- PackageManifest
- DistributionName
- PythonPackageName
- PackageVersion
- ImplementationLanguage
- PackageRole
- PackageContribution
- package templates and conformance information

Important narrative consequence:

> A package is not just code installed somewhere. It is a digitally described CogniFlow module.

Do not state that CfPackage itself contains a generic hasCapability relation unless such a relation exists in the accepted ontology. Package-local service descriptions provide the bridge to functionality.

### 5.3 Service Concept

The current service concept models Service as a semantic service specification.

Relevant structure includes:

- ServiceOperation
- OperationCapability
- OperationConstraint
- ServiceInterface
- ServiceInput
- ServiceParameter
- ServiceOutput
- ExecutionAffordance
- ServiceClient
- ServiceGateway
- ServiceProtocol

MCP is represented as a controlled service protocol.

The current client boundary explicitly supports calls by semantic capability rather than imports of concrete service implementations.

### 5.4 MCP and semantic authority

The current Rust MCP gateway exposes the cf_call_service boundary.

Its SemanticAuthority owns:

- semantic resolution;
- validation;
- Fuseki access;
- service invocation.

The presentation should therefore describe the request path as:

~~~text
Consumer
  ↓ capability request
MCP gateway
  ↓ semantic resolution
Semantic authority / Fuseki
  ↓ selected operation
Provider / executor
  ↓ result
Consumer
~~~

Fuseki is the semantic authority's data source, not a provider that directly talks to the Consumer.

### 5.5 Data Processing Concept

The current processing concept defines:

- ProcessingUnit
- ProcessingStep
- ProcessingPipeline
- Port
- PortRole
- Input
- Output
- Parameter
- PipelineNode
- RunTarget
- ProcessingConnection

ProcessingStep is an atomic ProcessingUnit.

ProcessingPipeline is a composite ProcessingUnit.

A PipelineNode runs a ProcessingUnit. Because a ProcessingPipeline is itself a ProcessingUnit, the model naturally supports nested composition.

### 5.6 Infrastructure-step terminology

The intended CogniFlow architecture also needs infrastructure-oriented processing operations.

However, the current checked Stonecastle processing vocabulary does not expose InfrastructureStep as a named class beside ProcessingStep and ProcessingPipeline.

Narrative rule for v1:

> Explain that Processing Steps may represent scientific or infrastructure-oriented operations, but do not present InfrastructureStep as an already-defined ontology class unless the ontology is extended before semantic authoring.

This is an explicit Phase 2 alignment item, not a reason to distort the story.

---

# 6. Frozen 16-scene narrative

The approximately 16-scene structure below is the Narrative Freeze v1.

A scene may still be refined, but changing the order or conceptual dependency requires an update to the decision log.

---

## Scene 01 — From FAIR Data to FAIR Data Processing

**Narrative:** [x] Frozen v1  
**RDF:** [x] Authored  
**Visual:** [ ]

### One statement

> CogniFlow asks what FAIRness means not only for scientific data, but for everything that happens to those data.

### Role in the story

Minimal title and promise. Do not explain the architecture yet.

### On-screen content

Primary title:

> **From FAIR Data to FAIR Data Processing**

Secondary line:

> Project CogniFlow

Optional small prompt:

> Can a processing workflow be as explicit as the data it processes?

### Reveal sequence

None. The opening should be visually quiet.

### Audience understanding after this scene

> “This talk is about extending FAIR thinking to processing.”

### Preferred primitive

Semantic hero / title scene.

### Transition

> We can start with a very ordinary analytical result.

---

## Scene 02 — What happened between the raw data and this result?

**Narrative:** [x] Frozen v1  
**RDF:** [x] Authored  
**Visual:** [ ]

### One statement

> A scientific result depends on a processing history that is often much less visible than the raw data and the result themselves.

### Role in the story

Create a problem every chemist recognizes before using the word standardization.

### Visual concept

~~~text
RAW SIGNAL  ─────────  BLACK BOX  ─────────▶  RESULT
chromatogram                                  value / table / PDF
~~~

The left and right sides should look familiar and trustworthy. The center should be deliberately opaque.

### Reveal sequence

1. Raw analytical data.
2. Final scientific result.
3. Black box appears between them.
4. Question appears: “What exactly happened here?”

### Audience understanding after this scene

> “To reproduce the result I need more than the input and output.”

### Preferred primitive

flow, with the processing node initially represented as an unresolved/opaque state.

### Transition

> We already know how to make data much more transparent: FAIR.

---

## Scene 03 — What FAIR Data Means in Practice

**Narrative:** [x] Frozen v1  
**RDF:** [x] Authored  
**Visual:** [ ]

### One statement

> FAIR data are findable, accessible, interoperable and reusable because the data object carries persistent identity, structured metadata and explicit access and reuse context.

### Role in the story

Create a shared FAIR baseline before arguing that FAIR data alone do not make the processing chain transparent.

The scene is intentionally positive: it shows what a well-described scientific data object looks like before the next scene exposes the remaining processing gap.

### Visual concept

Use a split composition.

Left half:

~~~text
F — FINDABLE
persistent identifier + searchable metadata

A — ACCESSIBLE
retrievable under clear access conditions

I — INTEROPERABLE
structured formats + shared vocabularies

R — REUSABLE
rich metadata + provenance + clear reuse conditions
~~~

Right half:

~~~text
FAIR DATA OBJECT
Illustrative LC-HRMS dataset

Identifier   doi:10.xxxx/sample.017
Data file    sample_017.mzML
Format       mzML
Sample       River water extract
Instrument   UHPLC-QTOF-MS
Metadata     structured + searchable
Vocabulary   controlled terms
Access       HTTPS / repository
Reuse        license + provenance
~~~

The right-hand object is illustrative. It demonstrates that FAIRness is more than the file itself without implying that any one metadata field or open-access condition is universally mandatory.

### Reveal sequence

1. The four FAIR letters establish the common vocabulary.
2. Their practical meaning appears in one short line each.
3. The concrete FAIR data object appears on the right.
4. Land on the idea: **the file and its context are explicit digital objects.**

### Audience understanding after this scene

> “FAIR data are not just files; they are data objects with enough identity and context to be found, accessed, interpreted and reused.”

### Preferred primitive

KeyPoint list + structured TSV/data-table block in a two-column composition.

### Transition

> Now assume we did all of this correctly. What happens when these FAIR data enter the processing chain?

---

## Scene 04 — FAIR data are not FAIR processing

**Narrative:** [x] Frozen v1  
**RDF:** [x] Authored  
**Visual:** [ ]

### One statement

> FAIR and open data can still pass through an opaque processing chain.

### Role in the story

Use the audience's FAIR knowledge as the bridge into the CogniFlow problem.

### Visual concept

Keep the scientific flow itself simple and horizontal:

~~~text
INSTRUMENT → FAIR / OPEN DATA → CUSTOM PROCESSING → RESULT
                                  │
                                  └── missing processing context
~~~

The missing context is not another process node. It is a separate problem panel beside the flow:

~~~text
MISSING CONTEXT
algorithm
implementation
version
parameters
environment
dependencies
~~~

The visual punch line is a separate statement:

> **FAIR data ≠ FAIR processing**

The FAIR/open-data portion should feel ordered and trustworthy. `CUSTOM PROCESSING` is the visual focus. The separate context panel makes the semantic gap explicit without cluttering the flow with overlapping relation labels.

### Reveal sequence

1. Instrument and FAIR/open data.
2. Custom processing appears.
3. Result appears.
4. Missing-context panel appears with the six explicit questions.
5. Key sentence appears: **FAIR data ≠ FAIR processing**

### Audience understanding after this scene

> “FAIRness can stop exactly where scientific interpretation starts.”

### Preferred primitive

flow + KeyPoint callout + statement.

### Transition

> So the first CogniFlow question is not “Which software should everybody use?” It is “Which knowledge must stop being implicit?”

---

## Scene 05 — Make nothing important implicit

**Narrative:** [x] Frozen v1  
**RDF:** [x] Authored  
**Visual:** [ ]

### One statement

> CogniFlow treats the processing context itself as digital scientific information.

### Role in the story

Introduce the philosophy before semantics or architecture.

### Visual concept

The Scene 02 black box opens into explicit questions and relationships.

~~~text
INPUT
  ↓
PROCESSING
  ↓
OUTPUT

What does it do?
What does it consume?
What does it produce?
Which parameters?
Which implementation?
Which version?
How was it executed?
~~~

Then condense these into the design principles:

~~~text
TRANSPARENT
TRACEABLE
DIGITAL
MODULAR
MACHINE-READABLE
HUMAN-UNDERSTANDABLE
~~~

### Reveal sequence

1. Reuse the black box.
2. Open the box into named processing information.
3. Connect information instead of presenting isolated labels.
4. Introduce “human + machine readable”.
5. Land on the design principles.

### Audience understanding after this scene

> “The workflow itself has to become a first-class digital object.”

### Preferred primitive

network or stateful flow.

### Transition

> To make that possible, every component first needs an explicit meaning.

---

## Scene 06 — CogniFlow starts with meaning

**Narrative:** [x] Frozen v1  
**RDF:** [ ]  
**Visual:** [ ]

### One statement

> The heart of CogniFlow is a small semantic grammar for describing what things are and how they relate.

### Role in the story

Introduce the core semantics without teaching RDF.

### Visual concept

Start with one Concept, then add its structure:

~~~text
CONCEPT
  ├─ ATTRIBUTES
  ├─ RELATIONSHIPS
  └─ CONTROLLED MEANING

CONCEPT DOMAIN = vocabulary scope around the concept
~~~

### Speaker wording

Audience-level explanation:

> “We define a thing, the information that describes it, and the explicit relationships that connect it to other things.”

Only if useful, mention that this is stored as machine-readable semantics.

Do not show RDF syntax yet.

### Reveal sequence

1. Concept.
2. Attributes.
3. Explicit relationships.
4. Controlled values / validation as the idea of unambiguous meaning.
5. Concept Domain as the scope around that vocabulary.

### Audience understanding after this scene

> “CogniFlow gives every important object a machine-readable meaning before any software tries to use it.”

### Preferred primitive

network + DiagramState.

### Transition

> Once the grammar is shared, very different parts of the system can be described without hard-wiring them together.

---

## Scene 07 — One semantic grammar. Different specifications.

**Narrative:** [x] Frozen v1  
**RDF:** [ ]  
**Visual:** [ ]

### One statement

> CogniFlow compatibility comes from shared semantics, not from every component depending on every other component.

### Role in the story

This is the architectural hinge between semantics and modularity.

### Visual concept

~~~text
                    COGNIFLOW CORE
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       PACKAGE         SERVICE      DATA PROCESSING
       CONCEPT         CONCEPT        CONCEPT
~~~

Each domain expands from the same grammar while remaining separately defined.

A second state contrasts this with a dependency graph.

~~~text
traditional:
A → B → C → D → ...

CogniFlow:
A ─┐
B ─┼─ shared semantic contract
C ─┘
~~~

### Reveal sequence

1. Semantic core.
2. Package Concept Domain.
3. Service Concept Domain.
4. Data Processing Concept Domain.
5. Replace direct cross-dependencies with shared semantic compatibility.

### Audience understanding after this scene

> “Different modules do not need a common implementation; they need a common language.”

### Preferred primitive

network + groups + focus/context states.

### Transition

> The package concept is a good first example of what this means in practice.

---

## Scene 08 — A package that explains itself

**Narrative:** [x] Frozen v1  
**RDF:** [ ]  
**Visual:** [ ]

### One statement

> A CogniFlow package is not only installable code; it is a versioned module that describes itself semantically.

### Role in the story

Turn the abstract core into a concrete object developers and scientists can understand.

### Visual concept

One package card grows semantic fields around it.

~~~text
CF PACKAGE
├─ identity
├─ distribution / module
├─ version
├─ implementation language
├─ architectural role
└─ semantic contributions
~~~

The visual should make the metadata feel like part of the object, not documentation beside it.

### Reveal sequence

1. Conventional “package = code”.
2. Add package identity.
3. Add version and implementation language.
4. Add role and semantic contributions.
5. Replace the conventional label with: **self-describing module**

### Audience understanding after this scene

> “A machine can inspect what this package is without reverse-engineering its code or relying on tribal knowledge.”

### Preferred primitive

structured semantic card; use generic prose/card primitive if available, otherwise network with a structured focal node.

### Transition

> Describing the package solves identity. We still need a way to describe what functionality it makes available.

---

## Scene 09 — Functionality becomes a Service

**Narrative:** [x] Frozen v1  
**RDF:** [ ]  
**Visual:** [ ]

### One statement

> Functionality in CogniFlow is exposed through semantically described Services rather than through direct package imports.

### Role in the story

Introduce the Service Concept as the mechanism that converts semantic modularity into usable functionality.

### Visual concept

~~~text
SERVICE
  │
  └─ OPERATION
       ├─ capability
       ├─ input
       ├─ parameters
       ├─ output
       └─ execution affordance
~~~

Use one chemistry-adjacent illustrative capability, for example:

> Generate analytical report

Do not imply that this exact service already ships unless it does.

### Reveal sequence

1. Service.
2. Service Operation.
3. Operation Capability.
4. Semantic interface: inputs, parameters, outputs.
5. Execution affordance appears last: meaning first, implementation second.

### Audience understanding after this scene

> “A Service says what can be done and how to interact with it, independently of who implements it.”

### Preferred primitive

network + structured node content.

### Transition

> If the request is defined by capability, the requester no longer needs to know the implementation.

---

## Scene 10 — Consumer and Provider do not need to know each other

**Narrative:** [x] Frozen v1  
**RDF:** [ ]  
**Visual:** [ ]

### One statement

> A Consumer depends on the Service contract, not on a concrete Provider package.

### Role in the story

Make dependency removal visually obvious before introducing MCP or Fuseki.

### Visual concept

First state:

~~~text
Consumer
   ↓ imports
Package A
   ↓
Package B
   ↓
Library C
~~~

Second state:

~~~text
Consumer
    │
    │ requests capability
    ▼
SERVICE CONTRACT
    ▲
    │ provides capability
Provider
~~~

The second state should look substantially simpler, not merely different.

### Reveal sequence

1. Direct dependency chain.
2. Highlight version/dependency coupling.
3. Collapse the chain.
4. Introduce Consumer + semantic Service contract.
5. Introduce replaceable Provider.
6. Swap Provider while Consumer remains unchanged.

### Audience understanding after this scene

> “Provider replacement should not require rewriting the Consumer.”

### Preferred primitive

network + DiagramState. Provider substitution may reuse role-binding semantics if that remains generic.

### Transition

> But if the Consumer does not know the Provider, something has to discover and connect them.

---

## Scene 11 — “I need a PDF report.”

**Narrative:** [x] Frozen v1  
**RDF:** [ ]  
**Visual:** [ ]

### One statement

> CogniFlow resolves a requested capability through a semantic service boundary and returns the result without exposing the Provider to the Consumer.

### Role in the story

Explain MCP, Fuseki and semantic discovery only after the audience already wants such a mechanism.

### Example

Illustrative Consumer request:

> **“I need an analytical report as PDF.”**

### Canonical interaction model

~~~text
Consumer
   │
   │ capability request
   ▼
MCP Gateway
   │
   │ semantic resolution
   ▼
Semantic Authority
   │
   ├──── query ────▶ Fuseki
   │                 service knowledge
   │
   │ selected operation
   ▼
Provider / Executor
   │
   │ result
   ▼
MCP Gateway
   │
   ▼
Consumer
~~~

### Reveal sequence

1. Consumer states capability request.
2. MCP Gateway appears as the stable boundary.
3. Semantic Authority resolves against Fuseki.
4. Matching Service Operation / Provider appears.
5. Provider executes.
6. PDF result returns through the same boundary.
7. Provider identity fades; capability + result remain.

### Speaker emphasis

MCP is not the source of semantics.

Fuseki is not a direct API the Consumer needs to understand.

The stable idea is:

> request by meaning → semantic resolution → execution → result

### Audience understanding after this scene

> “The Consumer can use functionality it did not import and does not need to know in advance.”

### Preferred primitive

sequence + participant roles + bindings.

### Transition

> This is useful for reports and utilities — but the important question is whether the same principle can describe scientific processing itself.

---

## Scene 12 — Data processing is a CogniFlow Concept too

**Narrative:** [x] Frozen v1  
**RDF:** [ ]  
**Visual:** [ ]

### One statement

> CogniFlow applies the same semantic philosophy to data processing instead of treating workflows as opaque scripts.

### Role in the story

Return from software architecture to the scientific core of the talk.

### Visual concept

Reuse the semantic-core visual from Scene 07, then focus only on the Data Processing Concept Domain.

~~~text
DATA PROCESSING CONCEPT DOMAIN
             │
      PROCESSING UNIT
         ├─ PROCESSING STEP
         └─ PROCESSING PIPELINE
~~~

### Reveal sequence

1. Recall the three Concept Domains from Scene 07.
2. De-emphasize Package and Service.
3. Focus Data Processing.
4. Reveal ProcessingUnit.
5. Reveal ProcessingStep and ProcessingPipeline.

### Audience understanding after this scene

> “A processing operation or workflow has an explicit semantic identity just like a Package or a Service.”

### Preferred primitive

network + focus/context DiagramState.

### Transition

> The key is that every Processing Unit exposes a structured interface.

---

## Scene 13 — A Processing Unit has an explicit interface

**Narrative:** [x] Frozen v1  
**RDF:** [ ]  
**Visual:** [ ]

### One statement

> Processing Units become composable because their inputs, outputs and parameters are explicit semantic Ports.

### Role in the story

Explain the interface contract that makes pipeline composition possible.

### Visual concept

Use a concrete but simple chemistry-relevant ProcessingStep, for example a baseline correction or arithmetic mean.

~~~text
                 PROCESSING STEP

INPUT  ─────────────▶ [ operation ] ─────────────▶ OUTPUT
PARAMETER ──────────▶ [           ]
~~~

Then map the visual ports to the current semantic terms:

- Port
- PortRole = Input
- PortRole = Output
- PortRole = Parameter
- stable PortKey

### Infrastructure note

A processing step may represent scientific processing or an infrastructure-oriented operation.

Do not label a node as the ontology class InfrastructureStep unless that class exists by implementation time.

### Reveal sequence

1. Bare ProcessingStep.
2. Input Port.
3. Output Port.
4. Parameter Port.
5. Stable keys / explicit interface.
6. Semantic description remains while implementation can change.

### Audience understanding after this scene

> “A machine can see how a processing unit can be connected without reading its source code.”

### Preferred primitive

network or flow with explicit ports; if ports require a new renderer capability, it must be generic and renderer-neutral.

### Transition

> Once Processing Units share this contract, a pipeline no longer has to be a hand-written chain of function calls.

---

## Scene 14 — A pipeline is a composition, not a script

**Narrative:** [x] Frozen v1  
**RDF:** [ ]  
**Visual:** [ ]

### One statement

> A CogniFlow Processing Pipeline is a semantic composition of Processing Units connected by explicit data flow.

### Role in the story

Show the major conceptual difference between conventional scripts and CogniFlow pipelines.

### Visual concept

First state:

~~~text
workflow.py

import A
import B
call A(...)
call B(...)
save(...)
~~~

Second state:

~~~text
INPUT
  │
  ▼
Pipeline Node ── runs ──▶ Processing Unit
  │
  ▼
Pipeline Node ── runs ──▶ Processing Unit
  │
  ▼
OUTPUT
~~~

Connections represent explicit data flow.

A final state reveals that a PipelineNode can run a ProcessingPipeline because ProcessingPipeline is itself a ProcessingUnit.

That enables nested composition.

### Reveal sequence

1. Conventional script.
2. Highlight implementation-coupled calls.
3. Replace with ProcessingPipeline.
4. Reveal PipelineNodes.
5. Reveal RunTargets / ProcessingUnits.
6. Reveal ProcessingConnections.
7. Zoom one node into another ProcessingPipeline to show composability.

### Audience understanding after this scene

> “The workflow definition can exist independently from a particular monolithic software environment.”

### Preferred primitive

flow + groups + focus state.

### Transition

> Once the workflow structure and interfaces are explicit, machines can finally assist with work that previously required hidden integration knowledge.

---

## Scene 15 — Explicit semantics enable machine-assisted execution

**Narrative:** [x] Frozen v1  
**RDF:** [ ]  
**Visual:** [ ]

### One statement

> Explicit semantic contracts allow CogniFlow to discover, connect and execute modular processing capabilities while retaining the information required to reproduce the result.

### Role in the story

Deliver the payoff without claiming that scientific judgement is automated away.

### Visual concept

Progress from semantic pipeline definition to an execution plan.

~~~text
SEMANTIC PIPELINE
       ↓
discover capabilities
       ↓
resolve implementations
       ↓
validate interfaces
       ↓
isolated execution contexts
       ↓
execute
       ↓
RESULT + PROVENANCE
~~~

A second visual layer may show separate sandbox-like execution environments around individual implementations to emphasize that implementation dependencies do not have to become one global dependency graph.

### Reveal sequence

1. Semantic pipeline.
2. Discover compatible implementations / Services.
3. Validate input-output contracts.
4. Resolve execution affordances.
5. Place implementations in isolated execution contexts.
6. Execute data flow.
7. Attach versions, parameters and provenance to the result.

### Claim boundary

The scene explains the architectural capability enabled by the model.

Do not imply that arbitrary scientific pipelines can already be generated correctly without expert input.

Scientific method selection remains a domain decision.

### Audience understanding after this scene

> “Machines can reason about the integration because the integration knowledge is explicit.”

### Preferred primitive

stateful flow or coordinated flow + sequence.

Potential generic need:

- coordinated SceneState across multiple blocks;
- generic port/interface rendering;
- generic execution-context grouping.

### Transition

> That brings us back to FAIR — but now FAIRness covers the path from data to result.

---

## Scene 16 — FAIRness does not stop at the file

**Narrative:** [x] Frozen v1  
**RDF:** [ ]  
**Visual:** [ ]

### One statement

> CogniFlow makes the meaning, functionality, processing structure and provenance around scientific data explicit so that workflows can be understood by humans and machines.

### Role in the story

Close the loop to Scene 01 and compress the entire architecture into one memorable picture.

### Visual concept

~~~text
FAIR DATA
    │
    ▼
SHARED MEANING
    │
    ▼
DISCOVERABLE FUNCTIONALITY
    │
    ▼
EXPLICIT PROCESSING
    │
    ▼
TRACEABLE RESULT
~~~

Around the progression:

~~~text
TRANSPARENT
MODULAR
MACHINE-READABLE
TRACEABLE
REPRODUCIBLE
~~~

Final line:

> **Standardize the meaning and the contract — not the implementation.**

Secondary line:

> **From FAIR data to FAIR data processing.**

### Reveal sequence

None, or one final synthesis reveal only. The conclusion should land as a complete statement rather than another technical build animation.

### Audience understanding after this scene

The audience should now be able to explain why CogniFlow contains:

- semantic Concepts and Concept Domains;
- self-describing Packages;
- semantic Services;
- capability-based Consumer/Provider decoupling;
- MCP as a stable gateway;
- Fuseki as semantic authority storage;
- Processing Units and semantic interfaces;
- Processing Pipelines;
- provenance and explicit execution context.

### Preferred primitive

semantic hero / summary composition.

---

# 7. Narrative dependency map

The story is intentionally causal.

~~~text
01 FAIR processing promise
        ↓
02 scientific black box
        ↓
03 FAIR data in practice
        ↓
04 FAIR data are not FAIR processing
        ↓
05 make processing context explicit
        ↓
06 shared semantic grammar
        ↓
07 independent specifications from one grammar
        ↓
08 self-describing Package
        ↓
09 semantic Service
        ↓
10 Consumer / Provider decoupling
        ↓
11 MCP + semantic discovery + Fuseki
        ↓
12 Data Processing Concept
        ↓
13 Processing Unit interface
        ↓
14 semantic Processing Pipeline
        ↓
15 machine-assisted modular execution
        ↓
16 FAIR data processing
~~~

Every scene must make the next scene feel necessary.

If a scene can be removed without breaking the argument, its purpose must be reconsidered.

---

# 8. Talk rhythm

The deck should not use clicks merely because the presentation system can animate them.

Recommended semantic reveal budget:

| Scene | Approx. states | Function |
|---|---:|---|
| 01 | 1 | promise |
| 02 | 4 | establish black box |
| 03 | 3–4 | FAIR baseline |
| 04 | 5 | FAIR gap |
| 05 | 5 | philosophy |
| 06 | 5 | semantic grammar |
| 07 | 5 | modular specifications |
| 08 | 5 | package example |
| 09 | 5 | service contract |
| 10 | 6 | dependency decoupling |
| 11 | 7 | concrete discovery/execution |
| 12 | 5 | processing domain |
| 13 | 6 | ports/interface |
| 14 | 7 | pipeline composition |
| 15 | 7 | execution payoff |
| 16 | 1–2 | synthesis |

These are narrative states, not mandatory fragment counts. Multiple closely related changes may be realized as one transition if that improves pacing.

---

# 9. Presentation-system mapping

| Scene | Preferred primitive | Existing capability | Potential gap |
|---|---|---|---|
| 01 | hero / prose | yes | none |
| 02 | flow | yes | optional unresolved/opaque visual role |
| 03 | KeyPoints + structured TSV/table | yes | none expected |
| 04 | flow + KeyPoint callout + statement | yes | none expected |
| 05 | network or stateful flow | yes | none expected |
| 06 | network + DiagramState | yes | structured semantic node may help |
| 07 | network + groups + focus/context | yes | none expected |
| 08 | structured semantic card | partial | generic structured-node/card content may be needed |
| 09 | network + structured node | partial | structured interface content may be needed |
| 10 | network + states / role substitution | yes | none expected |
| 11 | sequence + bindings | yes | none expected |
| 12 | network + focus/context | yes | none expected |
| 13 | port-aware node | partial | generic ports/interface rendering likely useful |
| 14 | flow + nested focus | mostly | nested pipeline focus may need generic support |
| 15 | coordinated stateful composition | partial | generic coordinated SceneState may be justified |
| 16 | hero / summary | yes | none |

No new diagram family should be introduced solely to reproduce a visual idea.

---

# 10. Architecture constraints

The accepted implementation boundary remains:

~~~text
TriG / RDF
    ↓
canonical SceneDocument
    ↓
generic renderer
    ↓
theme
    ↓
Reveal / Scroll presentation
~~~

## Semantic content

Audience-visible meaning and relationships belong in TriG/RDF.

## SceneDocument

SceneDocument carries renderer-neutral presentation structure.

## Renderer

The renderer owns geometry, routing, responsive layout and state realization.

## Theme

The theme owns:

- 16-bit visual language;
- palettes;
- borders;
- HUD treatment;
- typography;
- shadows and glow;
- transition timing;
- light/dark realization.

## Presentation runtime

Reveal/Pitch owns navigation and generic state progression.

Prohibited implementation shortcuts:

- CogniFlow IDs inside generic renderer logic;
- scene-title string matching;
- authored pixel coordinates in RDF;
- CSS classes encoded as semantic meaning;
- colors or animation durations in RDF;
- special renderer branches for individual CogniFlow scenes;
- inferring semantic relationships from duplicate labels.

---

# 11. Generic extension gate

A new system capability is justified only when all are true:

1. Existing primitives cannot express the semantic intent cleanly.
2. The capability is useful outside this CogniFlow talk.
3. The content can author the intent without geometry or theme details.
4. SceneDocument can transport it renderer-neutrally.
5. Static/self-study fallback preserves the information.
6. Tests do not require CogniFlow-specific IDs.

Potentially legitimate generic additions identified during Narrative Freeze:

- structured semantic node/card content;
- explicit port/interface presentation;
- coordinated SceneState across multiple blocks;
- reusable execution-context grouping.

These are candidates, not approved implementation tasks.

---

# 12. Definition of done for a scene

A scene is complete only when all layers are accepted.

## Narrative

- [ ] One primary statement.
- [ ] Understandable using only concepts introduced earlier.
- [ ] Clear audience takeaway.
- [ ] Intentional reveal sequence.
- [ ] Transition makes the next scene necessary.
- [ ] No terminology introduced before its motivation.

## Semantic model

- [ ] Visible meaning is authored in TriG.
- [ ] Stable semantic identities.
- [ ] Explicit relationships rather than label inference.
- [ ] Vocabulary matches accepted CogniFlow semantics.
- [ ] SHACL validation succeeds.
- [ ] No presentation-only ontology terms.

## Runtime

- [ ] SceneDocument contains required renderer-neutral structure.
- [ ] Existing generic primitives reused where possible.
- [ ] Forward and reverse state traversal works.
- [ ] Scroll View works correctly.
- [ ] Scene revisit resets/restores correctly.
- [ ] Static fallback preserves meaning.
- [ ] Reduced-motion mode preserves state semantics.

## Visual

- [ ] 16-bit / Eco City language is consistent.
- [ ] Information hierarchy is immediately obvious.
- [ ] Text is readable at presentation distance.
- [ ] Wide and narrow target viewports remain usable.
- [ ] Theme does not encode scientific meaning that belongs in RDF.
- [ ] Decoration does not compete with the scientific message.

---

# 13. Implementation phases

## Phase 1 — Narrative Freeze

**Status:** [x] v1 complete

Completed:

- [x] audience assumptions defined;
- [x] 16-scene causal narrative defined;
- [x] one statement per scene defined;
- [x] audience takeaway per scene defined;
- [x] reveal choreography per scene defined;
- [x] transitions defined;
- [x] preferred generic primitive mapped;
- [x] Package / Service / Processing terminology checked against current Stonecastle;
- [x] claim boundary between scientific expertise and integration knowledge defined.

Open alignment before Phase 2:

- [ ] resolve Relation / Property naming against the accepted CogniFlow core vocabulary;
- [ ] decide whether infrastructure-oriented processing remains a role of ProcessingStep or becomes an explicit ontology concept;
- [ ] confirm the exact presentation wording for provenance properties available in the CogniFlow model.

Exit criterion met for narrative work:

> The talk can be explained verbally from Scene 01 to Scene 16 as one causal argument without relying on implementation details.

---

## Phase 2 — Semantic Content Design

**Status:** [~] in progress — Cluster A authored

Goal:

Represent the frozen narrative as presentation semantics.

Tasks:

- [ ] audit old CogniFlow presentation resources and classify keep / rewrite / remove;
- [ ] define the new 15-step LearningPath;
- [ ] author or reuse Concepts required by each scene;
- [ ] author flow/network/sequence resources;
- [ ] author DiagramStates and participant bindings;
- [ ] keep audience-visible content in TriG;
- [ ] validate with SHACL;
- [ ] map each scene to the required SceneDocument version/capabilities;
- [ ] update this roadmap when implementation exposes a narrative assumption that is false.

---

### Cluster A semantic audit

**Status:** [x] implemented on the presentation roadmap branch

| Previous resource / scene | Decision | Cluster A action |
|---|---|---|
| Title scene | rewrite | Retitled to “From FAIR Data to FAIR Data Processing — Project CogniFlow”; attribution and funding structure retained. |
| A Common Analytical Workflow | retire from active path | Replaced at position 2 by the scientific processing black-box scene. Legacy resource remains unselected for now. |
| Laboratory Diversity | retire from active path | Replaced at position 3 by “FAIR Data Are Not FAIR Processing”. Legacy resource remains available but is no longer linked to the curated path. |
| One Interface. Specialized Providers. | retire from opening | Replaced at position 4 by “Make Nothing Important Implicit”. The legacy architecture resource is retained for later comparison while the new service story is authored. |
| Service Process and later scenes | keep temporarily | Positions 5–11 remain selected as placeholders until Clusters B–E replace them. |

New canonical semantic source:

- ontology/dataset/cogniflow-motivation.trig
- graph/specifications/cogniflow-motivation
- graph/paths/cogniflow-motivation-extension
- graph/scenes/cogniflow-motivation

Cluster A currently uses only existing generic primitives:

- Scene 01: title/prose;
- Scene 02: flow;
- Scene 04: flow;
- Scene 05: network + DiagramState + focus/context.

No CogniFlow-specific renderer behavior was introduced.
### Cluster A visual review — pass 1

**Result:** structural revision required before visual acceptance.

Observed at 1440×900 in Scroll View:

- Scene 01: readable and stable; generous unused vertical space is acceptable for the title pass.
- Scene 02: readable and stable; diagram is compact relative to the available scene area.
- Scene 04: failed vertically because five separate context questions created a six-node sibling layer after the processing node.
- Scene 05: failed vertically because the grouped radial network geometry exceeded the scene height; state filtering changes emphasis/visibility but does not recompute a smaller layout.
- Multi-scene screenshots are not a reliable review artifact in the current virtualized/snap Scroll View.

**Revision:** keep the semantic detail but reduce simultaneous layout complexity.

- Scene 04 now uses one compact “MISSING CONTEXT” node containing algorithm, version, parameters, environment and dependencies, plus five authored DiagramStates for the causal reveal.
- Scene 05 now mirrors that composition with one “EXPLICIT CONTEXT” node containing purpose, interface, parameters, implementation, version and execution/provenance.
- Scene 05 remains stateful, but uses the ordinary flow layout instead of the radial network layout.
- No renderer-specific workaround or authored geometry was introduced.

A second 1440×900 visual review is required before Cluster A is accepted.


## Phase 3 — Generic System Gap Analysis

**Status:** [ ] not started

Evaluate only gaps discovered while implementing the frozen semantics.

Priority candidates:

1. structured semantic cards/nodes;
2. semantic ports/interfaces;
3. coordinated SceneState;
4. nested pipeline focus.

Do not implement all candidates pre-emptively.

---

## Phase 4 — Scene Implementation

**Status:** [ ] not started

Implement in narrative clusters:

~~~text
Cluster A — Motivation
01 → 02 → 03 → 04

Cluster B — Semantic foundation
05 → 06

Cluster C — Modular services
07 → 08 → 09 → 10

Cluster D — Data processing
11 → 12 → 13 → 14

Cluster E — Synthesis
15
~~~

Each cluster receives semantic and visual review before moving on.

---

## Phase 5 — Visual System Pass

**Status:** [ ] not started

Once the semantic structure is stable:

- unify 16-bit typography;
- refine panel grammar;
- unify structured semantic cards;
- refine edges and port visuals;
- align Eco City background composition;
- tune scroll spacing;
- tune light/dark realization;
- remove decorative noise.

Visual polish must not move content knowledge into CSS or renderer-specific hacks.

---

## Phase 6 — Talk Acceptance

**Status:** [ ] not started

The final talk passes when:

- [ ] Scene 02 establishes a recognisable chemistry problem quickly;
- [ ] FAIR is used as a bridge, not re-taught;
- [ ] semantics appear as the necessary answer to implicit knowledge;
- [ ] the audience understands the shared semantic grammar before Package/Service terminology;
- [ ] Package identity and Service functionality are clearly distinct;
- [ ] Service discovery is understood before MCP/Fuseki implementation details;
- [ ] MCP is seen as a stable boundary, not the semantic model itself;
- [ ] ProcessingUnit clearly reuses the earlier modularity philosophy;
- [ ] the difference between a script and a semantic pipeline is visually obvious;
- [ ] machine assistance is not confused with replacement of scientific judgement;
- [ ] Scene 16 closes the exact question opened by Scene 01;
- [ ] no scene exists merely to demonstrate Project Chemie Digital technology.

---

# 14. Decision log

## D1 — Audience-first narrative

The presentation starts from the scientific processing black box rather than from software architecture.

## D2 — FAIR is the conceptual bridge

The audience already knows FAIR. The talk extends that idea to processing context instead of starting with “standardization”.

## D3 — Semantics precede architecture

Concepts and explicit meaning are introduced before Package, Service, MCP or Fuseki.

## D4 — Package and Service are separate ideas

Package answers “what module is this?”  
Service answers “what capability can be used?”

Do not collapse them into “package = service provider” as the semantic definition.

## D5 — Capability before Provider

The audience learns that a request targets a capability before seeing how a concrete Provider is resolved.

## D6 — MCP/Fuseki appear only in the concrete example

They are implementation mechanisms supporting the previously established service principle.

## D7 — Processing reuses the same philosophy

Data processing is not introduced as another subsystem. It is the same semantic/modular idea applied to the scientific workflow itself.

## D8 — ProcessingPipeline is a ProcessingUnit

This enables recursive composition and should become a visual “aha” moment in Scene 14.

## D9 — Scientific expertise remains essential

CogniFlow externalizes integration knowledge and processing context. It does not decide scientific suitability without domain judgement.

## D10 — Project Chemie Digital remains generic

No CogniFlow-specific renderer behavior is permitted. The presentation itself should demonstrate that semantically authored content can drive a generic presentation system.

---

# 15. Current next step

Proceed to **Phase 2 — Semantic Content Design**.

Cluster A (Scenes 01–04) has been semantically authored and wired into the curated path.

Next:

1. run exact-head semantic/runtime validation;
2. inspect Scenes 01–04 in Scroll View;
3. correct only generic layout/theme issues discovered by that review;
4. then begin Cluster B (Scenes 05–06: semantic grammar and independent specifications).
