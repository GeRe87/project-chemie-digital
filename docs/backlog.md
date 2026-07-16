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
10. Implement the Reveal.js adapter for the scene-document contract without importing Reveal.js concepts into upstream layers.
11. Generate a D3 knowledge-network view from the same semantic resources.

## Phase 2 — Pitch vertical slice

12. Model the pitch content semantically.
13. Define the pitch narrative path.
14. Implement UDE/chemistry presentation theme and accessible components.
15. Add presenter mode and optional detail paths.
16. Perform lecturer, student, pedagogical, technical, privacy, and accessibility reviews.

## Phase 3 — Platform foundation

17. Add Fuseki local deployment and typed SPARQL query layer.
18. Add semantic authoring workflow and validation feedback.
19. Add self-study renderer.
20. Add local learner-state export without mandatory accounts.
