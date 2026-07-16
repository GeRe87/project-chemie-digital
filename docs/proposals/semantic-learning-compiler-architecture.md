# Semantic learning compiler architecture — planning proposal

This proposal records the user-approved direction for the next architecture increment. It is intentionally non-normative until reviewed and converted into an ADR.

## Vision

The lecture is not authored as a collection of slides. It is an executable didactic projection of a semantically described knowledge space.

## Required separation

1. **Domain knowledge graph** — scientific concepts and their subject-matter relations.
2. **Learning resources** — reusable definitions, expressions, symbols, examples, exercises, datasets, prose, media and interactive implementations.
3. **Didactic model** — learning objectives, prerequisites, target groups, didactic intents and path templates.
4. **Resolution and composition** — deterministic resolved paths and a renderer-neutral scene document.
5. **Renderer adapters** — Reveal.js, self-study, print, knowledge-network and later output channels.

## Design constraints

- RDF is one logical dataset, not necessarily one physical file.
- Short semantic content may be represented as RDF literals; larger prose, code, notebooks, datasets and media may be referenced as versioned external resources.
- A learning-path template may select resources by semantic constraints. A resolved learning path must record concrete resource identifiers and sufficient revision information for reproducibility.
- Path steps express didactic intent rather than renderer component names. Renderer-specific layout and lifecycle details remain outside the semantic core.
- The scene composer emits a renderer-neutral scene document. Reveal.js translates that document but does not define it.
- Executable React, D3, Python or renderer code is packaged separately and described semantically through capabilities and compatibility constraints.
- SHACL validates semantic completeness and project invariants without embedding application logic in the ontology.

## Proposed follow-up task

After the active deterministic path-resolution issue is completed, a Software Architect should convert this proposal into a reviewed ADR, define minimal interfaces and update the backlog. The task must remain documentation-first and must not introduce breaking ontology changes or renderer coupling.
