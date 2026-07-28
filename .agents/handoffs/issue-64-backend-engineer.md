# Agent handoff

## Role

`Backend and Data Integration Engineer`

## Issue

`#64 — Define scene-to-RDF bindings and view-switch state contracts`

## Completed

- Added versioned renderer-neutral `SceneResourceBinding`, `SceneGraphProjectionRequest` and `ViewSwitchState` contracts.
- Added pure fail-closed validation and canonicalization for absolute RDF identities, provenance identities, relation paths, allowlists, block identities and revision-keyed state.
- Added bounded revision reconciliation that preserves only identities present in an explicitly supplied snapshot and rejects state from another scene.
- Added canonical serializers with locale-independent lexical ordering and immutable outputs.
- Added focused tests for input-order independence, duplicate and malformed identities, relation-path preservation, matching and changed revisions, foreign-scene rejection, framework neutrality, no network access and input immutability.
- Reconciled active architecture guidance so canonical TriG under `ontology/dataset/` is the sole authored semantic source; no compatibility source was restored.

## Files or resources changed

- `packages/core/src/scene-graph-view-contracts.ts`
- `packages/core/test/scene-graph-view-contracts.test.ts`
- `packages/core/README.md`
- `AGENTS.md`
- `docs/adr/0002-semantic-learning-compiler-layers.md`
- `.agents/handoffs/issue-64-backend-engineer.md`

## Verification

- [ ] Automated tests — focused tests are wired into the existing core wildcard and therefore into `npm test`; exact-head external validation is pending.
- [ ] Semantic validation — no ontology or canonical TriG content changed; full exact-head validation remains pending.
- [ ] Manual browser check — not applicable to this contract-only increment.
- [x] Accessibility check — state preserves deterministic return-focus and accessible-summary mode identities without binding to a concrete interface implementation.
- [x] Documentation updated

## Decisions and assumptions

- Scene and cross-view RDF identities must be absolute IRIs; blank-node identifiers are rejected.
- `resourceIds`, provenance identities, bindings and relation allowlists are canonicalized lexically, while authored `relationPath` order is preserved.
- Revision changes are reconciled only within the same scene identity and only against explicit available resource and block identities; another scene is rejected atomically.
- The direct-relation allowlist is represented as versioned immutable configuration; traversal remains outside this issue.
- No compiler-output extension was necessary because the contract can consume identities and relation paths already present in canonical TriG-derived scene metadata.

## Risks or unresolved questions

- The exact relation allowlist contents and user-facing labels remain a later semantic/subject-matter decision.
- The contract does not yet create bindings from a `SceneDocument`; the pure projector/input-builder increment should do that only after this contract is accepted.
- Exact-head `agent-validator/project-chemie-digital` evidence is still required before acceptance.

## Recommended manager action

`review`
