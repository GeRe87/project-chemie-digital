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
- The static-first shell remains visible and complete until the enhanced renderer mounts successfully and remains/falls back when enhancement fails.
- After every canonical document mounts successfully, the browser lifecycle removes the generated static fallback subtree before revealing the enhanced root. This prevents hidden duplicate `self-study-section-*` ids from shadowing visible navigation targets while preserving the complete no-JavaScript/failure fallback.
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
- successful enhancement removes the static fallback subtree only after all mounts, before the enhanced root becomes visible, preventing duplicate hidden anchor targets;
- enhancement failure does not remove static fallback content and restores the static root.

Root `npm test` includes renderer and app checks. The self-study generation path runs the existing canonical compiler with an explicit disposable output path and requires no Fuseki service.

## Owner browser evidence already collected on previous validated head

On exact head `e04bcc9ebe4b2a184219e51c8e8419f98104e09a`, owner browser review confirmed:

- the canonical section-9 `single-choice` prompt is enhanced to selectable radio controls for `Messreihe A` / `Messreihe B`;
- the selection disappears after page reload, confirming ephemeral non-persistent learner UI state;
- no correctness feedback appears, as intentionally required by Issue #86;
- navigation links did not navigate, which exposed the duplicate-id lifecycle defect now repaired.

The canonical compiler currently emits `disclosure.mode = initial` for every block in the real Standardabweichung path, so the real demonstrator is not expected to contain optional/progressive disclosure controls. Those renderer semantics are covered by deterministic adapter fixtures and are not a missing browser feature in this issue.

## Worker evidence boundary

This connector-oriented worker did not execute repository-wide `npm test` locally and does not claim browser acceptance for the repaired head. The authoritative external validator must run `npm test` on the new exact frozen PR head.

## Required manager/owner gates after navigation repair

1. Require fresh `agent-validator/project-chemie-digital` success on the new exact unchanged PR head.
2. On the same head, owner runs from repository root:

```powershell
npm ci
npm run self-study:dev
```

3. Open `http://127.0.0.1:4174/` and verify only the remaining repaired browser gates:
   - clicking section navigation links jumps to the corresponding visible section;
   - disabling JavaScript leaves the complete generated static fallback readable, including section 9 prompt/options/code.
4. The already-confirmed radio selection/reset behavior need not be reinterpreted as assessment feedback; no correctness feedback is expected.
5. Stop with `Ctrl+C`.
6. Merge only after fresh validator and repaired owner gates succeed on the same exact head.
