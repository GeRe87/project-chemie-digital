# Talks Reveal preview

Run `npm run talks:dev` from the repository root and open http://127.0.0.1:5186. The collection is compiled from the Talks RDF sources. Use `npm run check:talks-local` for focused checks and a verified local build.

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

## Diagram runtime

Diagram appearance and geometry are owned by the generic D3 runtime. Canonical
RDF supplies source-linked roles and group membership only; it supplies neither
colors nor coordinates. The runtime derives deterministic flow and grouped
network layouts without inspecting CogniFlow scene, node, edge or path IDs.
