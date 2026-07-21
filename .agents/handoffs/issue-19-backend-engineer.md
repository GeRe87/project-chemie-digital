# Agent handoff

## Role

Backend and Data Integration Engineer

## Issue

#19 — Implement deterministic KnowledgeNetworkDocument projector

## Completed

- Added the renderer-neutral `RdfDatasetSnapshot 1.0` and `KnowledgeNetworkDocument 1.0` contracts to the core package.
- Implemented a pure atomic projector with dataset/options validation, deterministic breadth-first traversal, depth bounds, supported-predicate restriction, identity-based deduplication, canonical ordering and optional semantic-type grouping.
- Preserved labels, semantic types, source/provenance metadata and inert versioned external references without dereferencing or fabrication.
- Added deterministic identifiers, accessibility reading orders, a complete static textual fallback and canonical serialization.
- Added standard-deviation golden/determinism, depth-bound, accessibility, atomic diagnostics, dependency-direction and no-network tests.
- Documented the public contract, offline behavior and later D3 adapter boundary.
- Corrected the renderer-neutral dependency guard so ordinary `document` variable access cannot be mistaken for a DOM dependency.
- Replaced the source-substring dependency guard with a package-dependency assertion while retaining explicit D3, React and Reveal.js dependency-direction coverage.
- Used the former connector-readable diagnostic to identify and correct the missing parenthesis in the `MISSING_ACCESSIBLE_LABEL` test fixture.
- Corrected repeated-edge aggregation so edge identity deduplication retains every source/provenance reference and remains invariant under statement-order permutations.
- Replaced locale-dependent ordering with an explicit canonical comparator and added a duplicate-edge provenance regression test.
- Reconciled the branch with accepted ADR-0007 and the local exact-head validation contract.
- Removed the obsolete `.github/workflows/validate.yml` from the branch and retained `npm test` as the authoritative project command.

## Files or resources changed for issue #19

- `packages/core/src/knowledge-network.ts`
- `packages/core/src/index.ts`
- `packages/core/test/knowledge-network.test.ts`
- `packages/core/README.md`
- `.agents/handoffs/issue-19-backend-engineer.md`

The branch also contains the accepted validator-migration files from current `main` so the exact PR head can be tested against the same governance and workflow-configuration contract. Their content is synchronized with `main` and is not part of the projector design change.

## Verification

- [x] Automated tests added and wired through the root `npm test` command
- [x] Semantic validation remains part of the root test command
- [x] The previously diagnosed TypeScript syntax error was corrected with the smallest test-only change
- [x] Duplicate-edge provenance and statement-order invariance are covered by a regression test
- [x] GitHub Actions validation was removed from the branch
- [ ] `agent-validator/project-chemie-digital` must report `success` on the exact current PR head
- [ ] The marked local-validator diagnostic comment must correspond to the same exact head
- [ ] Manual browser check — excluded because this increment contains no D3, DOM, React or renderer runtime
- [x] Accessibility is represented by deterministic reading-order and complete static-fallback tests
- [x] Documentation updated

## Decisions and assumptions

- The projector accepts an explicitly supplied, already parsed and validated logical dataset snapshot; RDF parsing and SHACL execution remain separate upstream responsibilities.
- Traversal follows outgoing directed statements only and includes edges encountered before the configured maximum depth.
- Repeated edges are identified by `(source, predicate, target)` and aggregate all canonical source/provenance references instead of selecting one input occurrence.
- Predicate labels must be consistent for a predicate identity; conflicting labels fail atomically as an invalid dataset.
- Stable identifiers are reversible deterministic encodings of semantic identities and versioned projection parameters; no random or runtime-dependent values are used.
- Semantic-type groups are descriptive metadata only and carry no D3, layout or component semantics.
- The correction remains within the accepted ADR-0006 deterministic deduplication and provenance-preservation scope.
- The validator migration is governance and infrastructure reconciliation; it does not add feature behavior to the knowledge-network projector.

## Risks or unresolved questions

- Final acceptance remains blocked until the local validator publishes `success` for the exact current PR head.
- The fixture uses validated standard-deviation semantic identities in a normalized logical-dataset snapshot rather than adding a parser or modifying RDF source files, which are outside this issue.
- A later bounded task is still required for the D3 adapter and browser runtime.

## Recommended manager action

Keep PR #20 draft until exact-head local validation succeeds. Then reload the pull request and required status, inspect the marked diagnostic comment, review the bounded projector diff and accept or request changes without using GitHub Actions evidence.
