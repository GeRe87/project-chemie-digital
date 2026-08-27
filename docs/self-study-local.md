# Local self-study renderer prototype

Phase 3 backlog item 34 adds a second browser renderer over the existing canonical `SceneDocument 1.0`. It is a renderer-reuse prototype, not a claim that the current Standardabweichung path is already a complete pedagogically approved self-study unit.

## Architecture boundary

```text
ontology/dataset/*.trig
        ↓
canonical semantic compiler
        ↓
SceneDocument 1.0
        ↓
packages/renderer-self-study
        ↓
apps/self-study
```

The renderer and browser app do not query Fuseki/SPARQL. They do not persist learner state and do not use accounts, cookies, `localStorage`, IndexedDB, analytics or telemetry.

`apps/self-study/src/generated/canonical-runtime.json` is ignored disposable transport. `npm run generate:self-study` creates it directly with `scripts/generate_canonical_runtime.py`, the same canonical compiler used by the pitch, and regenerates the complete static HTML fallback.

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

1. The canonical Standardabweichung scenes appear in their authored order with section navigation.
2. Prose, mathematics, code and prompts remain readable. Code is shown as authored content; this prototype does not require execution.
3. Any `optional` content uses a keyboard-operable disclosure control.
4. Any `progressive` sibling sequence is revealed in authored disclosure order. Nested groups manage their own sequence independently.
5. Prompt inputs may be used locally but no correctness feedback is invented. Reloading the page resets selections/input.
6. With JavaScript disabled, or if enhancement fails, the complete generated static fallback remains readable rather than hiding authored content.
7. Browser developer tools should show no renderer-initiated Fuseki/SPARQL request, analytics or learner-state persistence.

Stop the local server with `Ctrl+C`.

## Automated checks

`npm test` includes the pure self-study render-plan tests and the generated self-study app checks. It requires neither a running Fuseki service nor network access beyond the already installed project dependencies.
