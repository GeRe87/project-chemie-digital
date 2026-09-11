# Issue #151 worker handoff — paired light/dark presentation themes

## Issue

`#151 — Add paired light/dark presentation themes and Alt+T switching`

Branch: `agent/151-light-dark-presentation-theme`
PR: `#152 — Add paired light/dark presentation themes and Alt+T switching`

## Implemented

- Kept concrete `BackgroundPack 1.0` unchanged and added a renderer-owned `ThemedBackgroundPackFamily` contract with mandatory `dark` and `light` variants.
- Added validation that fails closed for missing/invalid variants, duplicate family ids and duplicate concrete pack ids.
- Reframed the existing Chemometrics background as one selectable `chemometrics-city` family:
  - `chemometrics-city-dark` reuses the existing neon-city assets;
  - `chemometrics-city-light` uses the approved Eco City artwork under `/presentation-backgrounds/chemometrics-city/light/`.
- Added explicit `PresentationThemeMode = "dark" | "light"` state independent from background enablement.
- Added deterministic `?theme=dark|light` handling and diagnostics for unsupported values.
- Preserved legacy `?background=chemometrics-neon-city` links by mapping the old id to the new family.
- Added labelled Theme and Background selectors.
- `Alt+T` toggles only `dark ↔ light`; `Alt+B` retains background enable/disable behavior and remembers the selected family while disabled.
- Active theme is written to `body[data-presentation-theme]`; theme switching updates URL state through `history.replaceState`.
- Theme switching resolves the same background family to the matching concrete variant when artwork is active; theme still changes when background artwork is disabled.
- Tokenized presentation, graph/flow-visible, shell, appearance-control and code-runtime surfaces so dark/light styling no longer depends on `pcd-background-active`.
- Background activation controls only world/transparency/panel treatment; vignette treatment is theme-tokenized.
- Preserved reduced-motion handling and idempotent appearance-control teardown.

## Light assets — committed and verified

The five approved WebPs are committed at the final repository paths. Their Git blob SHA-1 values match the independently precomputed values from the user-supplied originals byte-for-byte:

| Repository path | SHA-256 | Git blob SHA-1 |
| --- | --- | --- |
| `apps/pitch/public/presentation-backgrounds/chemometrics-city/light/bg-skyline.webp` | `8341890d443d2b6f221409121c1ec047df3db1698b0a897ecd3847455c0cba56` | `e12958677112c59689f5087e947902359bb5e78a` |
| `apps/pitch/public/presentation-backgrounds/chemometrics-city/light/facade-left.webp` | `e947ca792b399c9d44a56b8b16d7fea786fce2f665bf7c6ad4059182446a4dc3` | `970793c0c960e24d4e1f8d83b3153e9cd203dd12` |
| `apps/pitch/public/presentation-backgrounds/chemometrics-city/light/facade-right.webp` | `0e36374ff98b5a4e8ad8ffd7b730ba7d6d57efe33c0bb17b011b1cc47862976e` | `646b03e83f8dba2b9ecea492dd46de06a2e97df7` |
| `apps/pitch/public/presentation-backgrounds/chemometrics-city/light/bridges.webp` | `1ff179cb5d42ff412c780e74a1818cf57027c2c0b95ab0eb7ffb9748c658499a` | `cddf72ddd0ce3c89ab4484ac18b56d4c8740ab3d` |
| `apps/pitch/public/presentation-backgrounds/chemometrics-city/light/sunbeam-sky-overlay.webp` | `3b7810d8ad8b13a65215287155729a309de8316efd407b7880839f1a43af9ad1` | `c22798742559aaf2dc2163ffc11434cc0e19ebad` |

The binary packaging blocker is closed.

## Focused regressions

- `packages/renderer-reveal/test/themed-background.test.ts`
  - paired variant validation;
  - dark/light deterministic resolution;
  - duplicate family/concrete pack rejection.
- `apps/pitch/test/presentation-profile.test.ts`
  - profile theme defaults;
  - family identity vs concrete variant ids;
  - deterministic theme query behavior;
  - invalid query fallback diagnostics;
  - `background=none` retaining the family while disabling artwork;
  - legacy background alias;
  - general registry invariant: every registered themed family validates and both dark/light concrete variant ids occur in the flattened pack registry;
  - Chemometrics-specific five-role/speed model for both variants;
  - exact local light-asset URLs;
  - CSS theme/background state separation.
- `apps/pitch/test/appearance-theme-wiring.test.ts`
  - distinct Alt+B / Alt+T wiring;
  - dark/light toggle expression;
  - idempotent listener teardown;
  - independent runtime theme/background state;
  - body theme marker and URL updates.

## Copilot review repair

Copilot review `PRR_kwDOTZakQ88AAAABNHV1ow` produced one accepted inline finding in thread `PRRT_kwDOTZakQ86hWAVF` / comment `3986032009`: the registry regression hard-coded `backgroundFamilyRegistry.length === 1` and an exact ordered list of flattened pack ids.

The bounded repair changed only `apps/pitch/test/presentation-profile.test.ts`:

- removed the single-family count assertion;
- removed the exact ordered flattened-pack assertion;
- builds a set of flattened concrete pack ids;
- for every registered family, still validates the family, confirms distinct dark/light ids, and asserts both variant ids are present in the flattened registry;
- preserves the separate Chemometrics-specific URL, role and speed assertions.

No runtime, CSS, asset, semantic/compiler or unrelated-test changes were made for this repair.

The review thread remains intentionally unresolved for manager verification. PR #152 remains Draft.

## Validation status

- Exact-head `agent-validator/project-chemie-digital` was successful on pre-repair head `3fbad827ec9024d5f821d7eba47eccf62888c2d7`.
- The test-only repair changes the PR head, so **fresh exact-head validation is required** before Ready/merge.
- A fresh configured Copilot re-review is required after validator success.
- Do not use GitHub Actions as validation evidence.

## Architecture boundary preserved

No changes were made to canonical RDF/TriG, ontology/SHACL, SceneDocument contracts, canonical compiler scripts, learner state, Chemometrics workflow state/content, or D3 semantic/render-model contracts.

## Manager focus

1. Verify the final worker diff is limited to the authorized test repair plus Handoff/System state bookkeeping and remains `behind_by=0`.
2. Verify the accepted Copilot finding is addressed, then resolve thread `PRRT_kwDOTZakQ86hWAVF` only after review of the repaired diff.
3. Require fresh exact-head `agent-validator/project-chemie-digital = success`.
4. Mark PR #152 Ready and request a fresh configured Copilot review only after exact-head validation succeeds.
5. Require a clean review, zero unresolved threads, mergeable PR and `behind_by=0` on the exact final head before manager-only squash merge with expected-head guard.
