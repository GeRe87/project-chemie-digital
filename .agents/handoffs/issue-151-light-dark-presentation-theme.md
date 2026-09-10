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

| Source file | Size | SHA-256 |
| --- | ---: | --- |
| `01-seamless-eco-city-skyline.webp` | 345552 B | `8341890d443d2b6f221409121c1ec047df3db1698b0a897ecd3847455c0cba56` |
| `03-left-facade-slice.webp` | 195930 B | `e947ca792b399c9d44a56b8b16d7fea786fce2f665bf7c6ad4059182446a4dc3` |
| `04-right-facade-slice.webp` | 206888 B | `0e36374ff98b5a4e8ad8ffd7b730ba7d6d57efe33c0bb17b011b1cc47862976e` |
| `05-bridge-tile.webp` | 448792 B | `1ff179cb5d42ff412c780e74a1818cf57027c2c0b95ab0eb7ffb9748c658499a` |
| `06-sunbeam-sky-overlay.webp` | 51314 B | `3b7810d8ad8b13a65215287155729a309de8316efd407b7880839f1a43af9ad1` |

All five have RIFF/WEBP signatures and dimensions 1024×1536. The facade and bridge files are RGBA; skyline and sunbeam overlay are RGB.

Target repository names are:

```text
apps/pitch/public/presentation-backgrounds/chemometrics-city/light/bg-skyline.webp
apps/pitch/public/presentation-backgrounds/chemometrics-city/light/facade-left.webp
apps/pitch/public/presentation-backgrounds/chemometrics-city/light/facade-right.webp
apps/pitch/public/presentation-backgrounds/chemometrics-city/light/bridges.webp
apps/pitch/public/presentation-backgrounds/chemometrics-city/light/sunbeam-sky-overlay.webp
```

The available GitHub connector exposes binary blob creation only by supplying the entire Base64 payload as a string; it cannot consume the mounted chat files as file parameters. The available container also has no GitHub network access, so a clean checkout/push path is unavailable here. To avoid corruption or placeholder substitution, the five binaries are **not yet committed**.

This is the only known implementation-completeness blocker before visual acceptance. The runtime intentionally points at the final stable local URLs already.

Do not mark the PR Ready or merge until the five approved binary files are committed at the target paths and the final exact head passes configured validation/review.

## Validation status

- Branch scope was compared against manager dispatch base `e9969d3d6ad205ca3b0134e4cc71c86173bc4de2`: 0 behind and only System #151 renderer/app/test/handoff/state files are changed.
- A container clean-clone test was attempted but the container cannot resolve `github.com`; therefore no local npm test claim is made.
- Fresh exact-head `agent-validator/project-chemie-digital` validation is required after the final worker head, as usual.

## Architecture boundary preserved

No changes were made to canonical RDF/TriG, ontology/SHACL, SceneDocument contracts, canonical compiler scripts, learner state, Chemometrics workflow state/content, or D3 semantic/render-model contracts.

## Manager focus

1. Package the five exact approved light WebPs at the documented paths through a binary-capable repository channel.
2. Re-check that the final branch remains 0 behind and scoped.
3. Require exact-head configured validator success.
4. Only after the binary gate and validator success, mark Ready and request configured external review.
5. Do not merge while the binary packaging blocker remains.
