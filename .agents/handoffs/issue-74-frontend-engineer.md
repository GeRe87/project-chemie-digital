# Agent handoff

## Role

Frontend / Interactive Learning Runtime Engineer

## Issue

`#74 — Add executable R code blocks with CodeMirror and webR`

## Dependency

This is a stacked increment on `agent/72-render-canonical-math` / PR #73. Review the diff against that branch until #73 is merged; after #73 merges, retarget this PR to `main`.

## Completed

- Added a renderer-neutral `CodeBlock` to the SceneDocument contract with `language`, `code`, `editable`, `executable` and static `fallback` fields.
- Added canonical TriG programming-resource vocabulary (`CodeExample`, `CodeRole`, `hasCodeExample`, code/language/editability/executability attributes) plus SHACL constraints.
- Authored the first R learning resource in TriG and attached it to the existing Standardabweichung exercise:
  ```r
  x <- c(6, 8, 10)
  sd(x)
  ```
- Added that resource as the fourth block of the existing ninth scene, preserving the accepted nine-scene learning path.
- Extended the canonical runtime compiler to emit `kind: "code"` from `cd:CodeExample`, preserving RDF identity, named-graph provenance and relation path.
- Added a stable Reveal/static code shell and `<noscript>` fallback before any interactive browser enhancement.
- Added an explicit connected-interactive mode selected with `?interactive=1`.
- In connected mode, loads pinned CodeMirror 6.0.2 and `codemirror-lang-r` 0.1.1 from jsDelivr.
- Lazily loads official webR 0.6.0 only on the first `Ausführen` click and executes the current editor contents with base R.
- Uses `ChannelType.PostMessage`, so the demo does not require COOP/COEP headers.
- Captures R output below the editor through an `aria-live` region.
- Stops editor/button keyboard events from bubbling to Reveal so typing, arrows and Space do not advance the deck.
- Fails closed to the static code block if CodeMirror enhancement cannot initialise; R execution errors are surfaced in the output panel.
- Added focused semantic, compiler, core-contract, renderer, pitch and runtime-boundary regressions.

## Runtime modes

### Default/offline mode

Start normally and browse to:

`http://127.0.0.1:5173/`

The existing no-network guard remains installed. Scene 9 shows the canonical R code as a static code block. No CodeMirror or webR CDN modules are loaded.

### Connected interactive mode

Browse to:

`http://127.0.0.1:5173/?interactive=1`

Scene 9 enhances the code block with CodeMirror and an `Ausführen` button. On the first run, webR 0.6.0 and its R/WASM assets are downloaded from the official webR CDN. With the authored code, the visible R result should be `[1] 2`.

A useful manual edit is:

```r
x <- c(9, 10, 11)
sd(x)
```

which should produce `[1] 1`.

## Deployment boundary

The connected prototype intentionally uses pinned remote browser modules:

- `https://cdn.jsdelivr.net/npm/codemirror@6.0.2/+esm`
- `https://cdn.jsdelivr.net/npm/codemirror-lang-r@0.1.1/+esm`
- `https://webr.r-wasm.org/v0.6.0/webr.mjs`
- webR assets under `https://webr.r-wasm.org/v0.6.0/`

This keeps the normal pitch offline and avoids introducing a large webR release payload into this bounded increment. Before a high-reliability final pitch, self-host/vendor the CodeMirror and webR release assets and introduce an explicit deployment-level network policy.

`PostMessage` has known webR limitations: running R cannot be interrupted and nested R REPLs such as `browser()` do not work. These limitations are acceptable for the deterministic base-R teaching demo.

## Content/architecture boundaries

- Audience-visible R code remains authored only in canonical TriG; app code contains no copy of the teaching example.
- `webR` is not represented in the semantic contract or ontology. It is a browser execution provider for `language: "r"`.
- No R package installation is needed or performed; the demo uses base R only.
- D3 graph/projector behavior is unchanged.
- PR #73's local KaTeX math rendering remains intact.
- Ordinary pitch mode retains the existing no-network behavior.

## Verification

Connector-side inspection confirms the issue-74 branch is stacked exactly on PR #73 and contains only the interactive-code increment.

The GitHub connector cannot run the repository's local Node/Python/SHACL toolchain. Required exact-head validation remains:

```powershell
npm test
```

Manual browser validation should cover both URLs above, editor keyboard isolation, first-run webR loading, output `[1] 2`, an edited calculation, and fail-closed static behavior without `?interactive=1`.

## Recommended manager action

1. Keep PR #73 available as the stacked base until this PR is retargeted.
2. Require `agent-validator/project-chemie-digital = success` on the exact current head.
3. Run the two-mode browser check above.
4. Merge #73 first, retarget this PR to `main`, revalidate exact head, then merge.
