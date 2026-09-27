# Local self-study renderer prototype

The Self-Study app now uses the validated Chemometrics `TeachingOfferingRuntimeDocument` as its course-level entry point. It presents an original retro-inspired course world, then reuses the existing renderer for each fully scene-bound `SceneDocument`. Units whose paths exist but have no complete scene layer remain visible as `In preparation` rather than disappearing.

## Architecture boundary

```text
ontology/dataset/*.trig
        ↓
TeachingOfferingRuntimeDocument + exact path↔SceneDocument bindings
        ↓
course-world view model
        ↓
SceneDocument 1.x
        ↓
packages/renderer-self-study
        ↓
apps/self-study
```

The renderer and browser app do not query Fuseki/SPARQL. They do not persist learner state and do not use accounts, cookies, `localStorage`, IndexedDB, analytics or telemetry.

`apps/self-study/src/generated/canonical-runtime.json` is ignored disposable transport. `npm run generate:self-study` calls the dedicated `apps/self-study/scripts/generate-runtime.py` entry point, which reuses the canonical compiler but packages the explicit Chemometrics offering and all fully scene-bound paths without mutating the Pitch fallback. The command then regenerates the complete static course-world HTML fallback.

## Windows local review

From the repository root:

```powershell
npm ci
npm run self-study:dev
```

Open:

```text
http://127.0.0.1:4174/
```

The server is deliberately bound to localhost and uses a strict fixed port for reproducible review.

Review the following:

1. The page opens on the Chemometrics course map and unit stations follow authored `UnitPlacement.position` order.
2. Random Variables and Mean Values are startable on current main; Variance and Dispersion remains visible as `In preparation` until its scenes exist. After the Introduction content PR lands, Introduction should appear automatically as the first available station.
3. Starting a unit shows only its bound Self-Study document; `Back to course map` returns without resetting in-memory prompt/disclosure state.
4. Prose, mathematics, code and prompts remain readable. Code is shown as authored content; this prototype does not require execution.
5. Any `optional` content uses a keyboard-operable disclosure control and progressive sequences preserve authored order.
6. With JavaScript disabled, or if enhancement fails, the complete generated static course map and all available learning content remain readable.
7. The world remains usable in a narrow viewport and with `prefers-reduced-motion` enabled.
8. Browser developer tools should show no renderer-initiated Fuseki/SPARQL request, analytics or learner-state persistence.

Stop the local server with `Ctrl+C`.

## Automated checks

`npm test` includes the pure self-study render-plan tests and the generated self-study app checks. It requires neither a running Fuseki service nor network access beyond the already installed project dependencies.
