# Agent handoff

## Role

`Backend and Data Integration Engineer`

## Issue

`#66 — Implement deterministic one-hop scene graph projection`

## Completed

- Added a pure renderer-neutral `projectSceneKnowledgeNetwork` boundary over the accepted RDF dataset snapshot and `SceneGraphProjectionRequest` contracts.
- Derived selected identities from the union of scene resource and provenance bindings.
- Added deterministic incoming and outgoing one-hop traversal restricted to the request's explicit relation allowlist.
- Added selected/related classification with selected-resource precedence, canonical node and edge identities, deduplication and stable lexical ordering.
- Preserved scene revision, block bindings, relation paths, RDF identities and source/named-graph provenance in the projected document.
- Added atomic stable diagnostics for malformed requests, unknown selected identities, unsupported predicates, incomplete dataset metadata and conflicting metadata.
- Added byte-stable canonical serialization, immutable output and no-network/renderer-neutral regression coverage.
- Reconciled active README and ADR-0006 statements so canonical TriG under `ontology/dataset/` is the sole authored semantic source and retired JSON-LD/Turtle compatibility inputs are not described as active.

## Files or resources changed

- `packages/core/src/scene-graph-projector.ts`
- `packages/core/src/index.ts`
- `packages/core/test/scene-graph-projector.test.ts`
- `README.md`
- `docs/adr/0006-knowledge-network-projection-boundary.md`
- `.agents/handoffs/issue-66-backend-engineer.md`

## Verification

- [ ] Automated tests — exact-head external validator pending
- [ ] Semantic validation — exact-head external validator pending; no ontology content changed
- [ ] Manual browser check — not applicable to this renderer-neutral core increment
- [x] Accessibility check — deterministic reading orders and static fallback preserved in the neutral document
- [x] Documentation updated

## Decisions and assumptions

- Reused `KnowledgeNetworkDocument 1.0` structurally and added only scene-context node metadata and a scene revision descriptor.
- The request-supplied allowlist remains fixture/integration policy; no permanent product-wide relation vocabulary was selected.
- Provenance identities explicitly present in scene bindings are selected resources, not inferred scientific source relations.
- Traversal is exactly one hop in both directions; deeper resources remain excluded even when connected by an allowlisted predicate.
- Generated transport remains disposable and no JSON-LD, retired Turtle, old resolver or renderer-specific vocabulary was restored.

## Risks or unresolved questions

- The connector-only worker environment cannot execute `npm test`; the local exact-head validator must confirm TypeScript compilation and the complete project suite.
- Later semantic and chemistry review must establish any production relation allowlist.
- Accessible summary, view-switch UI and visual D3 adapter remain separate stages.

## Recommended manager action

`review after agent-validator/project-chemie-digital succeeds on the exact PR head; request bounded changes for any compile or contract regression`
