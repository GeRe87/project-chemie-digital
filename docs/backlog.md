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

## Phase 2b — Graph-backed scene correction

20. Model graph-backed scene definitions and a complete standard-deviation definition-with-citation reference scene (#43).
21. Compile graph-backed scene definitions deterministically into renderer-neutral `SceneDocument` snapshots (#44).
22. Remove the renderer-authored `PitchSlide` content source and render compiled graph scenes in Reveal.js (#45).
23. Specify presentation/knowledge-graph view switching, separate exploration state and the future semantic scene editor (#46).

Every audience-visible scientific, explanatory or narrative statement must be authored as an RDF resource or resolved value. Renderers own presentation mechanics and generic UI chrome only; they must not become a second content store.

## Phase 2c — Canonical TriG knowledge architecture

24. Adopt TriG as the canonical RDF Dataset format and establish Core–Concept–Specification ontology layering with an explicit Cogniflow Meta-TBox reuse/mapping decision (#51).
25. Build a comprehensive, source-backed and reusable Standardabweichung knowledge specification in TriG, including concept relations, learning resources, scenes and paths (#52).
26. Perform a bounded chemistry/statistics and pedagogical review of the comprehensive Standardabweichung Dataset (#54).
27. Migrate path resolution, scene compilation, graph projection and browser transport to the canonical TriG Dataset and remove manually maintained JSON-LD/TypeScript semantic copies (#53).

TriG files are the authored semantic source. JSON-LD and compiled JSON/TypeScript artifacts may only be deterministic disposable transports generated from the canonical Dataset. Core ontology grammar, reusable concept vocabularies and concrete specifications must remain separate layers with stable named graph ownership.

## Phase 2d — Presentation/graph interaction implementation

28. Define renderer-neutral scene-to-RDF binding and view-switch state contracts.
29. Implement a deterministic one-hop scene graph projector.
30. Implement the accessible graph summary and presentation/graph switching shell.
31. Add the optional visual graph adapter using the same projection document.

## Phase 3 — Platform foundation

32. Add Fuseki local deployment and typed SPARQL query layer.
33. Add semantic authoring workflow and validation feedback.
34. Add self-study renderer.
35. Add local learner-state export without mandatory accounts.

## Phase 4 — Course-scale semantic architecture

36. Record the renderer-neutral course/module/learning-unit composition boundary before introducing course-scale ontology or application code.
37. Implement the minimal ADR-0008 course-scale semantic reference model: vocabulary, SHACL invariants, one Standardabweichung learning-unit fixture and deterministic semantic/query tests.
38. Expose the validated course-scale composition through the existing read-only typed SPARQL/data-integration boundary, returning deterministic TeachingOffering → UnitPlacement → LearningUnit → available LearningPath references without adding renderer navigation or a new compiler contract.
39. Record the renderer-neutral course/unit/path selection and delegation boundary before replacing the runtime generator's global single-LearningPath assumption: define explicit stable semantic selection identities, deterministic ambiguity/error rules and handoff to the existing path resolver without adding navigation, learner-state or LMS semantics.

Phase 4 scales the proven single-topic pipeline into the structure needed for the funded chemistry module. Course/module organization must select and relate reusable semantic resources and didactic paths without becoming a second content store, without embedding renderer navigation, and without coupling learner-state to authored course structure.
