# Chemometrics Reveal preview

This app is the browser-visible Reveal.js renderer for the canonical course content. Audience-visible scientific content remains authored only in the TriG Dataset under `ontology/dataset/`.

For local presentation work, the default development script now selects the canonical **Chemometrics and Applied Statistics → Mean Values** learning path and applies the renderer-owned Chemometrics presentation profile:

- native Reveal.js scroll view by default;
- reusable multi-layer `chemometrics-neon-city` background pack;
- deck-view override for classical presenting;
- runtime background switching without changing semantic content.

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

Default Chemometrics scroll view with the neon-city parallax background:

```text
http://127.0.0.1:5173/
```

Explicit scroll view:

```text
http://127.0.0.1:5173/?view=scroll&background=chemometrics-neon-city
```

Classical Reveal deck view with the same background:

```text
http://127.0.0.1:5173/?view=deck&background=chemometrics-neon-city
```

Scroll view without a presentation background:

```text
http://127.0.0.1:5173/?view=scroll&background=none
```

To inspect the historical Standard Deviation preview instead:

```powershell
npm --workspace @project-chemie-digital/pitch run dev:standard-deviation
```

## Switching the background while presenting

The control bar contains a labelled **Background** selector. Changing it swaps the renderer-owned background pack while preserving the current Reveal navigation/scroll position.

`Alt+B` toggles between the first registered background pack and `None`.

The active selection is ephemeral presentation state. It is not written to `SceneDocument`, RDF, learner state or analytics.

## Background-pack architecture

```text
canonical RDF / TriG
        ↓
SceneDocument
        ↓
Reveal renderer / layout
        ↓
slide content

PresentationProfile
        ↓
BackgroundPack registry
        ↓
Background runtime
   ├── scroll progress source
   └── deck progress source
```

A `BackgroundPack 1.0` is a renderer-owned declarative bundle of local visual layers. The first pack lives at:

```text
apps/pitch/public/presentation-backgrounds/chemometrics-neon-city/
```

with:

```text
bg-skyline.webp
facade-left.webp
facade-right.webp
bridges.webp
rain-fog.webp
```

The five layers use independent vertical speed factors `0.08`, `0.22`, `0.27`, `0.44`, and `0.72`, matching the supplied parallax MWE. Images repeat vertically and are loaded only from the local Vite application; there is no remote image/CDN dependency.

To add another course background later:

1. place its local assets under `apps/pitch/public/presentation-backgrounds/<pack-id>/`;
2. add one `BackgroundPack` entry to `backgroundPackRegistry` in `src/presentation-profile.ts`;
3. reference that pack from the relevant renderer-owned `PresentationProfile`.

No scientific RDF, SceneDocument schema or layout semantics need to change.

## Reduced motion and accessibility

The background world is `aria-hidden`, non-focusable and pointer-inert. The appearance selector is keyboard reachable and labelled. When `prefers-reduced-motion: reduce` is active, the full background composition remains visible but parallax offsets and crossfade motion are disabled.

The slide DOM reading order, block identities, provenance and Reveal navigation remain independent of the presentation background.

## Runtime boundary

The runtime keeps the existing no-network guard. Generated `canonical-runtime.json` is disposable transport and is not an authored content source. The app may render the selected canonical path in Reveal and provide the existing accessible graph summary without querying Fuseki directly.
