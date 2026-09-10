# Issue #151 worker handoff — paired light/dark presentation themes

## Issue

`#151 — Add paired light/dark presentation themes and Alt+T switching`

Branch: `agent/151-light-dark-presentation-theme`

## Implemented

- Kept concrete `BackgroundPack 1.0` unchanged and added a renderer-owned `ThemedBackgroundPackFamily` contract with mandatory `dark` and `light` variants.
- Added validation that fails closed for missing/invalid variants, duplicate family ids and duplicate concrete pack ids.
- Reframed the existing Chemometrics background as one selectable `chemometrics-city` family:
  - `chemometrics-city-dark` reuses the five existing neon-city assets on `main`;
  - `chemometrics-city-light` resolves the approved Eco City artwork from stable local URLs under `/presentation-backgrounds/chemometrics-city/light/`.
- Added explicit renderer/runtime `PresentationThemeMode = "dark" | "light"` state, independent from background enablement.
- Added deterministic `?theme=dark|light` resolution and diagnostics for unsupported values.
- Preserved old `?background=chemometrics-neon-city` links by mapping the legacy id to the new family while only exposing `chemometrics-city` going forward.
- Added labelled Theme and Background selectors.
- `Alt+T` toggles only `dark ↔ light`; `Alt+B` retains background enable/disable behavior and remembers the selected family while disabled.
- Active theme is written to `body[data-presentation-theme]`; theme switching updates URL state through `history.replaceState`.
- If a background is active, a theme switch resolves the same family to the matching concrete variant. If disabled, theme still changes immediately and the family is retained for later re-enable.
- Tokenized main pitch, graph/flow-visible, shell, appearance-control and code-runtime surfaces so dark/light styling no longer depends on `pcd-background-active`.
- Background activation now controls only world/transparency/panel treatment; the vignette is theme-tokenized so the light Eco City is not forced through the night vignette.
- Preserved reduced-motion handling and idempotent appearance-control teardown.
- Updated local presentation documentation.

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
  - five-role/speed model for both variants;
  - exact local light-asset URLs;
  - CSS theme/background state separation.
- `apps/pitch/test/appearance-theme-wiring.test.ts`
  - distinct Alt+B / Alt+T wiring;
  - dark/light toggle expression;
  - idempotent listener teardown;
  - independent main-runtime theme/background state;
  - body theme marker and URL updates.

## Light asset source and packaging blocker

The user supplied these five approved WebPs in the current implementation context:

| Source file | Size | SHA-256 | Expected Git blob SHA-1 |
| --- | ---: | --- | --- |
| `01-seamless-eco-city-skyline.webp` | 345552 B | `8341890d443d2b6f221409121c1ec047df3db1698b0a897ecd3847455c0cba56` | `e12958677112c59689f5087e947902359bb5e78a` |
| `03-left-facade-slice.webp` | 195930 B | `e947ca792b399c9d44a56b8b16d7fea786fce2f665bf7c6ad4059182446a4dc3` | `970793c0c960e24d4e1f8d83b3153e9cd203dd12` |
| `04-right-facade-slice.webp` | 206888 B | `0e36374ff98b5a4e8ad8ffd7b730ba7d6d57efe33c0bb17b011b1cc47862976e` | `646b03e83f8dba2b9ecea492dd46de06a2e97df7` |
| `05-bridge-tile.webp` | 448792 B | `1ff179cb5d42ff412c780e74a1818cf57027c2c0b95ab0eb7ffb9748c658499a` | `cddf72ddd0ce3c89ab4484ac18b56d4c8740ab3d` |
| `06-sunbeam-sky-overlay.webp` | 51314 B | `3b7810d8ad8b13a65215287155729a309de8316efd407b7880839f1a43af9ad1` | `c22798742559aaf2dc2163ffc11434cc0e19ebad` |

All five have RIFF/WEBP signatures and dimensions 1024×1536. The facade and bridge files are RGBA; skyline and sunbeam overlay are RGB.

Target repository names are:

```text
apps/pitch/public/presentation-backgrounds/chemometrics-city/light/bg-skyline.webp
apps/pitch/public/presentation-backgrounds/chemometrics-city/light/facade-left.webp
apps/pitch/public/presentation-backgrounds/chemometrics-city/light/facade-right.webp
apps/pitch/public/presentation-backgrounds/chemometrics-city/light/bridges.webp
apps/pitch/public/presentation-backgrounds/chemometrics-city/light/sunbeam-sky-overlay.webp
```

### Binary transfer verification performed in the bounded packaging turn

The GitHub connector's `create_blob(..., encoding="base64")` endpoint itself was verified with an unreferenced one-byte probe: Base64 `eA==` returned Git blob SHA `c1b0730e0133447badcfd47fd144e254807b06e1`, exactly matching the independently calculated Git object SHA for byte `x`.

The smallest approved WebP was then attempted only as an **unreferenced** blob, with the local expected Git blob SHA precomputed as `c22798742559aaf2dc2163ffc11434cc0e19ebad`. The connector returned `5b7a3b5f669c8a38480801fe98908de7f8fa34be`, proving that transferring the large mounted-file payload through an inline model-generated Base64 argument is not byte-preserving/reliable in this environment. The mismatching blob was therefore never referenced by a tree or branch commit.

All temporary branch-visible transfer probes/staging artifacts were removed again. A final branch comparison confirmed that none remain in the net PR diff.

The connector has no action accepting a mounted local file as a binary file parameter, and the container has no direct GitHub network/push path. Therefore the five exact binaries remain **not committed** rather than accepting silent corruption or substituting placeholders.

This remains the only known implementation-completeness blocker before visual acceptance. The runtime intentionally points at the final stable local URLs already.

Do not mark the PR Ready or merge until the five approved binary files are committed at the target paths through a binary-capable file transfer path and the final exact head passes configured validation/review.

## Validation status

- Final net branch scope after cleanup remains 0 behind `main` and contains only the 12 authorized System #151 renderer/app/test/handoff/state paths; no temporary transfer files remain.
- A container clean-clone test was attempted in the earlier worker turn but the container cannot resolve `github.com`; therefore no local npm test claim is made.
- Fresh exact-head `agent-validator/project-chemie-digital` validation is required after the final binary-inclusive worker head, as usual.

## Architecture boundary preserved

No changes were made to canonical RDF/TriG, ontology/SHACL, SceneDocument contracts, canonical compiler scripts, learner state, Chemometrics workflow state/content, or D3 semantic/render-model contracts.

## Manager focus

1. Package the five exact approved light WebPs at the documented paths through a binary-capable repository channel that accepts file bytes directly.
2. Verify each repository blob against the expected Git blob SHA-1 / SHA-256 table above.
3. Re-check that the final branch remains 0 behind and scoped.
4. Require exact-head configured validator success.
5. Only after the binary gate and validator success, mark Ready and request configured external review.
6. Do not merge while the binary packaging blocker remains.
