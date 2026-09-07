# Issue #138 worker handoff — reusable presentation background packs and Chemometrics scroll view

## Issue

`#138 — Implement reusable presentation background packs and Chemometrics parallax scroll view`

Draft PR: `#139`

## Implemented

- Added renderer-owned `BackgroundPack 1.0` validation and deterministic layer/runtime contracts under `packages/renderer-reveal/src/background/`.
- Added scroll and deck progress sources so the background engine is not hard-wired to `window.scrollY`.
- Added renderer-owned presentation profiles and a registry-driven `chemometrics-neon-city` pack.
- Switched the local `pitch:dev` default from the historical Standard Deviation fixture to the canonical **Chemometrics and Applied Statistics → Mean Values** selection while retaining a separate Standard Deviation dev command.
- Enabled native Reveal.js Scroll View by default for the Chemometrics profile with `?view=scroll|deck` override.
- Added `?background=chemometrics-neon-city|none`, an accessible Background selector and `Alt+B` runtime toggle without mutating semantic content.
- Added reduced-motion/static behavior and kept the background world non-semantic, pointer-inert and `aria-hidden`.
- Added Windows-friendly local usage documentation in `apps/pitch/README.md`.
- Added focused renderer/app tests for background-pack validation, deterministic offsets/progress sources and profile/query handling.

## Interactive browser fixes incorporated during user acceptance testing

The first implementation was exercised directly in Firefox at `http://127.0.0.1:5173/` and iteratively corrected from observed runtime evidence:

1. Asset URLs are resolved against the current HTTP page so no `file:///` URL can enter the CSS/runtime path.
2. Initial pack activation no longer depends on a delayed opacity flip; the first stage is visible immediately and crossfade is reserved for actual pack changes.
3. CSS `background-image` painting was replaced with real `<img>` tiles after Firefox showed valid HTTP image URLs and dimensions but did not paint the layer reliably.
4. Root stacking was made explicit: active Reveal viewport/background transparency, positive background-world layer, Reveal content above it, and explicit layer/vignette z-indices.
5. The hot scroll path was optimized for smoothness: no per-frame `getBoundingClientRect()`, cached tile heights, fewer repeated image tiles, compositor-friendly transforms/containment and reduced expensive scroll-mode effects.
6. Smooth Reveal Scroll View navigation was enabled while preserving reduced-motion behavior.
7. Reveal scroll snapping was restored as `mandatory` with `scroll-snap-stop: always` so repeated Next/Previous actions land on deterministic slide stops instead of accumulating partial-scroll offsets.

The user confirmed locally that:

- the Chemometrics Mean Values path renders;
- native Reveal Scroll View renders;
- the multi-layer parallax background becomes visible after the image-tile/stacking fixes;
- the performance optimization materially improves smoothness;
- smooth navigation works in principle;
- deterministic snap stops fix the observed one-and-a-half-slide navigation problem.

## Architecture boundary preserved

No changes were made to:

- `SceneDocument 1.0`;
- canonical RDF/TriG scientific content;
- ontology/SHACL semantics;
- learner-state contracts;
- ADR-0012 layout inference semantics;
- Chemometrics workflow state.

Presentation appearance remains renderer/runtime state orthogonal to semantic content and layout inference.

## Known blocker before Ready-for-review / merge

The five WebP layer files are present and tested in the user's local checkout under:

```text
apps/pitch/public/presentation-backgrounds/chemometrics-neon-city/
```

with the expected names:

```text
bg-skyline.webp
facade-left.webp
facade-right.webp
bridges.webp
rain-fog.webp
```

However, the binary files are **not yet versioned in the remote PR branch**. The Draft PR body already notes that binary asset packaging is still pending. This means a clean clone of PR #139 cannot yet reproduce the visual background without manually adding the supplied assets.

Do not mark PR #139 Ready-for-review or accept/merge #138 until the five local WebP assets are committed to the branch (or the manager explicitly authorizes an equivalent repository-owned asset packaging mechanism) and a clean-clone/local-server check confirms they are served from `/presentation-backgrounds/chemometrics-neon-city/...`.

## Current PR status at worker return

- PR #139 remains **Draft**.
- The branch implementation is functionally exercised locally by the user.
- The remaining blocker is repository packaging of the five binary assets plus the normal fresh exact-head validation/review gates after that packaging change.
- No self-acceptance or merge was performed.

## Follow-on discovered by Chemometrics Issue #140

A separate Chemometrics worker later identified an independent System prerequisite for the requested "KeyPoints on slides, detailed text in summary" behavior: the canonical dataset snapshot and graph-summary path currently hard-code German description/projection language and therefore drop existing English Mean Values `cd:body@en` detail prose. That prerequisite must remain a separate System issue after #138 is returned to manager control; it is not part of this presentation-background scope.
