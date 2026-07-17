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
12. Generate a D3 knowledge-network view from the same semantic resources.

## Phase 2 — Pitch vertical slice

13. Model the pitch content semantically.
14. Define the pitch narrative path.
15. Implement UDE/chemistry presentation theme and accessible components.
16. Add presenter mode and optional detail paths.
17. Perform lecturer, student, pedagogical, technical, privacy, and accessibility reviews.

## Phase 3 — Platform foundation

18. Add Fuseki local deployment and typed SPARQL query layer.
19. Add semantic authoring workflow and validation feedback.
20. Add self-study renderer.
21. Add local learner-state export without mandatory accounts.
