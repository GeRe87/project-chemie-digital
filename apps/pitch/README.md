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

## Diagram runtime

Diagram appearance and geometry are owned by the generic D3 runtime. Canonical
RDF supplies source-linked roles and group membership only; it supplies neither
colors nor coordinates. The runtime derives deterministic flow and grouped
network layouts without inspecting CogniFlow scene, node, edge or path IDs.

Review on `visual/cogniflow` against the local `soll.png`. After each bounded
visual commit, compare `visual-evidence:cogniflow/latest.json`'s `source_sha`
with that exact commit, require zero page errors, and open the workflow scene's
`.review.webp` alongside its `.layout.json`. Pitch tests and a Vite build are
local checks; screenshots remain the visual acceptance evidence.

### Local worker configuration

On the current Windows review host, `config.toml` under
`%LOCALAPPDATA%/AgentWorkflowValidator/` selects `runtime-profiles/`.
The authoritative `runtime-profiles/project-chemie-digital.toml`
`[[visual_reviews]]` entry named `cogniflow` now uses:

```toml
start_argv = ["C:/Program Files/nodejs/npm.cmd", "--workspace", "@project-chemie-digital/pitch", "run", "dev:cogniflow", "--", "--port", "5175"]
ready_url = "http://127.0.0.1:5175/?view=scroll&background=chemometrics-city&theme=light"
scene_selector = "#pitch-slides section[id]"
```

Port 5175 isolates the worker's exact-head checkout from the developer's server
on 5173. Descendant scene discovery accounts for Reveal's scroll-page wrappers.
`cogniflow/request.json` supports the generic visual-worker schema `1.2` capture matrix: named scene/step captures crossed with the target's allowed light/dark themes. The project request template is maintained with the validator profile, not as authored presentation content.

The installed worker's `src/awv/visual.py` scroll branch navigates to the selected
page's final **native scroll snap point**, waits until its host steps equal their
counts, and repeats navigation after review-viewport resizing. It does not mark
fragments visible or dispatch synthetic presentation-step events in scroll mode.
`latest.json` records `render_url` and observed `presentation_state`; layout JSON
records actual URL, scroll/deck mode, scene visibility, scroll-page membership,
theme/background and host step/count. Require `view: scroll`, visible scene,
`scene_in_scroll_page: true` and step `4/4` as well as the exact source SHA.
The scheduled task `Agent Visual Review Worker` must be restarted after changing
installed Python code. These worker installation changes live outside this repo.

### Browser regression

With the CogniFlow development server running, use a Python environment with
Playwright and installed Edge (the local worker runtime supplies both):

```powershell
& "$env:LOCALAPPDATA/AgentWorkflowValidator/runtime/Scripts/python.exe" scripts/check_cogniflow_scroll.py --output "$env:TEMP/opencode"
```

The output directory must exist. The check compares deck/scroll geometry at
1440×900 and 1200×750, drives native steps forward/backward and revisits the
scene, verifies scene-local canvas isolation and zero page errors, and writes
disposable full/neighbor screenshots for inspection.
