# Chemometrics Reveal preview

This app is the browser-visible Reveal.js renderer for the canonical course content. Audience-visible scientific content remains authored only in the TriG Dataset under `ontology/dataset/`.

For local presentation work, the default development script selects the canonical **Chemometrics and Applied Statistics → Mean Values** learning path and applies the renderer-owned Chemometrics presentation profile:

- native Reveal.js scroll view by default;
- one logical `chemometrics-city` background family with paired dark/light variants;
- an independent `dark` / `light` presentation theme;
- deck-view override for classical presenting;
- runtime theme/background switching without changing semantic content.

## Start locally on Windows

From the repository root:

```powershell
npm install
npm run pitch:dev
```

Vite is pinned to:

```text
http://127.0.0.1:5173/
```

The command first generates the disposable runtime artifact for:

```text
TeachingOffering: ex:teaching-offering-chemometrics-applied-statistics
LearningUnit:     ex:learning-unit-mean-values
LearningPath:     ex:path-chemometrics-mean-values-lecture
```

and then starts Vite.

## Useful URLs

Default Chemometrics scroll view with the dark city variant:

```text
http://127.0.0.1:5173/
```

Explicit light theme with the same logical city background:

```text
http://127.0.0.1:5173/?view=scroll&background=chemometrics-city&theme=light
```

Explicit dark theme:

```text
http://127.0.0.1:5173/?view=scroll&background=chemometrics-city&theme=dark
```

Classical Reveal deck view with the city background:

```text
http://127.0.0.1:5173/?view=deck&background=chemometrics-city&theme=dark
```

Dark presentation without artwork:

```text
http://127.0.0.1:5173/?view=scroll&background=none&theme=dark
```

To inspect the historical Standard Deviation preview instead:

```powershell
npm --workspace @project-chemie-digital/pitch run dev:standard-deviation
```

## Switching appearance while presenting

The control bar contains labelled **Background** and **Theme** selectors. Theme and background enablement are independent renderer/runtime state.

- `Alt+B` toggles the current background family between enabled and `None` without changing theme.
- `Alt+T` toggles `dark ↔ light`. If a background is active, the runtime swaps only to that family's matching concrete variant.

If the background is disabled, switching theme still updates the presentation immediately. The selected family is retained so re-enabling the background uses the variant matching the current theme.

The active selection is ephemeral presentation state. It is not written to `SceneDocument`, RDF, learner state or analytics.

## Background-family architecture

```text
canonical RDF / TriG
        ↓
SceneDocument
        ↓
Reveal renderer / layout
        ↓
slide content

PresentationProfile
   ├── theme: dark | light
   └── Background family id
              ↓
ThemedBackgroundPackFamily
   ├── dark  → BackgroundPack 1.0
   └── light → BackgroundPack 1.0
              ↓
Background runtime
   ├── scroll progress source
   └── deck progress source
```

`BackgroundPack 1.0` remains the concrete renderer-owned declarative bundle of local visual layers. The family layer is responsible only for requiring and resolving the paired theme variants; it does not silently change the `BackgroundPack 1.0` contract.

The dark variant reuses the existing files under:

```text
apps/pitch/public/presentation-backgrounds/chemometrics-neon-city/
```

The approved light variant is resolved from:

```text
apps/pitch/public/presentation-backgrounds/chemometrics-city/light/
```

with stable names:

```text
bg-skyline.webp
facade-left.webp
facade-right.webp
bridges.webp
sunbeam-sky-overlay.webp
```

Both variants preserve the five parallax roles and speed factors `0.08`, `0.22`, `0.27`, `0.44`, and `0.72`. Images are loaded only from the local Vite application; there is no remote image/CDN dependency.

To add another selectable background later, define one family with **both** valid `dark` and `light` concrete `BackgroundPack` variants and register that family. No scientific RDF, SceneDocument schema or layout semantics need to change.

## Reduced motion and accessibility

The background world is `aria-hidden`, non-focusable and pointer-inert. Both appearance selectors are keyboard reachable and labelled. When `prefers-reduced-motion: reduce` is active, the full background composition remains visible but parallax offsets and crossfade motion are disabled.

The slide DOM reading order, block identities, provenance, D3 semantic ordering and Reveal navigation remain independent of presentation theme/background state.

## Runtime boundary

The runtime keeps the existing no-network guard. Generated `canonical-runtime.json` is disposable transport and is not an authored content source. The app may render the selected canonical path in Reveal and provide the existing accessible graph summary without querying Fuseki directly.

## CogniFlow slide 2 visual review

The coupling-problem scene's pixel card treatment lives in
`src/eco-city-flow-decoration.ts` and its paired CSS. Its scene-scoped shell uses
a paper-light face, integrated number segment and one round status LED, with
the same geometry in teal and amber. Revealed cards stay opaque; unrevealed
cards retain the existing progressive visibility. Decoration is aria-hidden
and introduces no network requests or persisted state.
In horizontal slide 2 flows, relation pills sit above their branch cards with
three separate SVG squares per stem. The lower branch uses the same downward
callout treatment; routing trunks and semantic edge identities are preserved.

Review on `visual/cogniflow` against the local `soll.png`. After each bounded
visual commit, compare `visual-evidence:cogniflow/latest.json`'s `source_sha`
with that exact commit, require zero page errors, and open the coupling scene's
`.review.webp` alongside its `.layout.json`. Pitch tests and a Vite build are
local checks; screenshots remain the visual acceptance evidence.
