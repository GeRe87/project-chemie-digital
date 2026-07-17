# Initial backlog

## Phase 0 — Governance and architecture

1. Record ADR-0001: Reveal.js as an encapsulated renderer, not the domain model.
2. Define repository conventions, CI expectations, and agent permissions.
3. Define the minimal semantic vocabulary and SHACL validation rules.
4. Record ADR-0002: semantic learning-compiler layers, dependency direction, renderer-neutral contracts, and deterministic external-reference policy.

## Phase 1 — Standard-deviation semantic slice

5. Model `StandardDeviation` with definitions, expression, symbols, examples, exercise, source, and prerequisites.
6. Define a default Bachelor chemistry learning path.
7. Implement deterministic path resolution.
8. Define the minimal renderer-neutral scene-document contract and scene primitives in accordance with ADR-0002.
9. Implement scene-composition rules from resolved paths to scene documents.
10. Record ADR-0005: deterministic Reveal.js adapter boundary, adapter-owned render plan, lifecycle ownership, accessibility and offline fallback rules.
11. Implement the bounded Reveal.js adapter for `SceneDocument` 1.0 according to ADR-0005 without importing Reveal.js concepts into upstream layers.
12. Record ADR-0006: deterministic renderer-neutral knowledge-network projection and D3 adapter boundary.
13. Implement the pure offline logical-RDF-dataset to `KnowledgeNetworkDocument` 1.0 projector with determinism, dependency-direction, accessibility and no-network tests.
14. Implement the bounded D3 adapter and accessible static fallback without importing D3, React, DOM or force-layout concepts into upstream layers.

## Phase 2 — Pitch vertical slice

15. Model the pitch content semantically.
16. Define the pitch narrative path.
17. Implement UDE/chemistry presentation theme and accessible components.
18. Add presenter mode and optional detail paths.
19. Perform lecturer, student, pedagogical, technical, privacy, and accessibility reviews.

## Phase 3 — Platform foundation

20. Add Fuseki local deployment and typed SPARQL query layer.
21. Add semantic authoring workflow and validation feedback.
22. Add self-study renderer.
23. Add local learner-state export without mandatory accounts.
