# Issue #86 handoff — self-study renderer foundation

## Worker

- Role: Frontend and Reveal Renderer Engineer
- Branch: `agent/86-self-study-renderer`
- Scope: Phase 3 backlog item 34 only

## Delivered

- Added `packages/renderer-self-study/` as a sibling renderer module over validated `SceneDocument 1.0`.
- Added deterministic `SelfStudyRenderPlan 1.0` mapping preserving document/scene/block identities, source/provenance references, scene/group reading order, accessibility metadata, didactic intent, emphasis and disclosure semantics.
- Added representations for every current `SceneBlock` kind: prose, math, code, media reference, group and prompt.
- Added static HTML rendering that always exposes complete authored content.
- Added enhanced browser rendering using native `<details>` for optional/progressive disclosure.
- Progressive disclosure sequencing is scoped per sibling container, so nested group sequences do not interfere with top-level sequences.
- Added `apps/self-study/` as a standalone Vite root consuming its own disposable canonical-runtime JSON generated directly by `scripts/generate_canonical_runtime.py`.
- The static-first shell remains visible until the enhanced renderer mounts successfully and remains/falls back when enhancement fails.
- Added section navigation, semantic headings/landmarks, visible keyboard focus and reduced-motion-safe CSS.
- Prompt inputs are local ephemeral DOM controls only. No correctness/assessment feedback is invented.
- Code is displayed with authored fallback; no execution runtime is required.
- Added root commands `generate:self-study`, `test:renderer-self-study`, `test:self-study` and `self-study:dev`.
- Added `docs/self-study-local.md` with the fixed localhost review URL `http://127.0.0.1:4174/`.
- Added ignored `apps/self-study/src/generated/canonical-runtime.json`; canonical TriG remains the sole authored semantic authority.

## Explicit invariants

- No direct RDF/Fuseki/SPARQL access from the renderer or browser app.
- No change to `packages/core`, `packages/renderer-reveal`, canonical TriG, SHACL or Fuseki runtime.
- No `localStorage`, IndexedDB, cookies, learner account/session model, analytics, telemetry or remote synchronization.
- No learner-state export/persistence; that remains Phase 3 backlog item 35.
- No new scientific/statistical/chemistry claims, learning objectives, assessment criteria or correctness feedback.
- No implicit remote media fetch; media references are represented as authored links/alternatives.
- `package-lock.json` is unchanged. The new bounded TypeScript modules are run from root scripts using the already installed repository toolchain.

## Automated coverage added

`packages/renderer-self-study/test/adapter.test.ts` covers:

- byte-stable render-plan generation;
- scene/block/source identity and reading-order preservation;
- all six current block kinds;
- nested group reading order;
- optional/progressive disclosure metadata and order;
- atomic rejection of invalid/unsupported SceneDocuments;
- complete leaf static fallback without script-only `<details>` hiding;
- interactive native disclosure representation;
- absence of semantic-store/network/persistence/analytics dependencies;
- absence of reverse core -> self-study renderer imports.

`apps/self-study/test/app.test.ts` covers:

- generated canonical SceneDocument transport;
- generated static-first shell containing all leaf fallback content;
- absence of semantic-store/persistence/account/telemetry integration;
- preservation of the static fallback when enhancement is unavailable.

Root `npm test` now includes renderer and app checks. The self-study generation path runs the existing canonical compiler with an explicit disposable output path and requires no Fuseki service.

## Worker evidence boundary

This connector-oriented worker did not execute repository-wide `npm test` locally and does not claim browser acceptance. The authoritative external validator must run `npm test` on the exact frozen PR head.

## Required manager/owner gates

1. Require `agent-validator/project-chemie-digital` success on the exact unchanged PR head.
2. On the same head, owner runs from repository root:

```powershell
npm ci
npm run self-study:dev
```

3. Open `http://127.0.0.1:4174/` and verify:
   - canonical Standardabweichung sections render in authored order;
   - section navigation, math, code and prompt representations are readable;
   - keyboard focus is visible and disclosure controls (where present) are operable;
   - prompt selection/input disappears after reload;
   - disabling JavaScript leaves the complete generated static fallback readable;
   - no renderer-initiated Fuseki/SPARQL request or learner-state persistence appears.
4. Stop with `Ctrl+C`.
5. Merge only after validator and owner gates succeed on the same exact head.
