# CogniFlow talk runbook

> **Superseded narrative.** This runbook documents the previous eight-scene CogniFlow story and is retained only as historical implementation context. The current content and narrative source of truth is `docs/cogniflow-presentation-content-roadmap.md`. Do not use this file to determine current scene order or presentation claims.

This runbook describes the intended audience narrative for the canonical eight-scene CogniFlow presentation. It is speaker guidance, not an additional semantic content source: scientific claims and visible slide content remain authored in RDF.

## Narrative spine

The talk follows one argument:

> A scientific workflow should not be standardized by freezing one software stack. Standardize the interface and meaning instead, keep provenance attached to derived results, and the same contract can support replaceable implementations and reusable scientific artifacts.

## 1 · Standardized Data Processing — Project CogniFlow

**Core message:** CogniFlow is about standardizing scientific data processing without standardizing one monolithic implementation.

**Reveal:** none. The title slide is intentionally static and sparse.

**Speaker transition:** “Standardization sounds attractive — until the whole workflow depends on one tightly coupled software environment.”

## 2 · One Dependency Can Break the Workflow

**Core message:** Tight runtime coupling turns an ordinary dependency mismatch into a workflow-level failure.

**Reveal sequence:**

1. Scientific workflow.
2. Package A and Package B.
3. The packages pin incompatible versions of the same library.
4. The collision becomes a dependency conflict for the shared environment.

**Speaker transition:** “So the answer is not another better monolith. The stable part has to move from the implementation to the interface.”

## 3 · One Interface. Specialized Providers.

**Core message:** A stable MCP-facing contract decouples consumers from specialized, replaceable providers.

**Reveal sequence:**

1. User / AI Agent.
2. MCP Server as the stable entry point.
3. CogniFlow Orchestrator.
4. Specialized semantic, data and artifact/provenance providers.

**Speaker transition:** “But a stable interface only tells us how to talk. Scientific systems also need to agree on what the data mean.”

## 4 · Interfaces Need Shared Meaning

**Core message:** Machine-readable semantics form the scientific contract between data, services and views.

**Reveal sequence:**

1. Chart resource.
2. Dataset resource.
3. Observation resource.

The RDF snippet and semantic graph are two views of the same authored meaning.

**Speaker transition:** “Once the meaning is explicit, presentation stops being a second source of truth.”

## 5 · One Meaning. Multiple Views.

**Core message:** RDF, table and chart are projections of one semantic resource, not duplicated datasets.

**Reveal sequence:**

1. RDF is the initial state.
2. Table projection.
3. Chart projection.

**Speaker transition:** “Different views solve presentation. Reproducibility needs one more thing: the result must remember how it came into existence.”

## 6 · The Result Carries Its History

**Core message:** Provenance is part of the derived artifact, not a report reconstructed afterwards.

**Reveal sequence:**

1. Input data.
2. Processing identity: method, version and parameters.
3. Derived artifact linked to its input and process.
4. Reusable result containing data plus provenance.

This slide is deliberately domain-agnostic. It states the provenance principle without repeating the analytical example on the next slide.

**Speaker transition:** “That is the principle. Now let’s make it concrete on an analytical signal.”

## 7 · From Raw Signal to Reusable Result

**Core message:** The abstract contract becomes scientifically useful when every interpretation step remains explicit from the raw trace to the reusable artifact.

**Reveal sequence:**

1. Raw signal.
2. Baseline estimate.
3. Asymmetric model state; the chart marks the peak apex/model anchor rather than claiming to render a fitted curve.
4. Integration window leading to area plus uncertainty.
5. FAIR artifact; the interpreted chart recedes and the reusable result becomes the endpoint.

**Speaker transition:** “The details can change — algorithms, providers and visualizations can all evolve. The three things that must remain are the contract.”

## 8 · Take-Home

**Core message:** DECOUPLED. SEMANTIC. REPRODUCIBLE.

**Reveal:** none. All three principles appear together as one final statement.

**Closing line:** “Standardize the contract, not the implementation.”

## Click rhythm

The intended interactive rhythm is:

| Scene | Clicks | Purpose |
| --- | ---: | --- |
| 1 · Title | 0 | Orientation |
| 2 · Coupling problem | 4 | Build the failure chain |
| 3 · Architecture | 4 | Build the answer with matching cadence |
| 4 · Shared meaning | 3 | Reveal semantic resources |
| 5 · Multiple views | 2 | RDF → table → chart |
| 6 · Provenance principle | 4 | Grow result history |
| 7 · Analytical proof | 5 | Raw signal → FAIR artifact |
| 8 · Take-home | 0 | Land the conclusion at once |

No click should exist merely for animation. Every reveal must add one new causal or scientific idea.
