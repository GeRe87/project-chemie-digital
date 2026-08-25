# Agent handoff

## Role

Frontend and Reveal Renderer Engineer

## Issue

`#74 — Add executable R code blocks with CodeMirror and webR`

## Phase 2e integration status

PR #73 is merged. PR #75 has been cleanly restacked onto current `main`; its old 27-commit stacked history was replaced by a single feature commit whose parent is the worker-claimed main commit `c813bd0e24d1e663be20bdebf83654e75ce2f23f`.

The restack commit is `2689d496437c9371ae060e34e2a43146d7030397`. A `main..agent/74-codemirror-webr` comparison immediately after the restack showed exactly one commit, zero commits behind, and exactly the original 16 issue-74 files. No pre-squash PR #73 history or `.agents/state.json` change was copied into the feature branch.

## Implemented feature

- Added a renderer-neutral `CodeBlock` to the SceneDocument contract with language, source code, editability, executability and static fallback metadata.
- Added canonical TriG programming-resource vocabulary (`CodeExample`, `CodeRole`, `hasCodeExample`, code/language/editability/executability attributes).
- Authored the first R learning resource in TriG and attached it to the existing Standardabweichung exercise:
  ```r
  x <- c(6, 8, 10)
  sd(x)
  ```
- Added the resource as the fourth block of scene 9 while preserving the accepted nine-scene learning path.
- Extended the canonical compiler to emit `kind: "code"` from `cd:CodeExample`, preserving RDF identity, named-graph provenance and relation-path metadata.
- Added a stable Reveal/static code shell and complete `<noscript>` fallback before interactive enhancement.
- Added explicit connected-interactive mode via `?interactive=1`.
- Connected mode uses pinned `@codemirror/view@6.43.6` from jsDelivr and configures only `EditorView`-owned extensions, avoiding the duplicate `@codemirror/state` module graph seen in earlier prototypes. R syntax highlighting remains intentionally deferred to the later local-bundling hardening increment.
- Lazily loads official webR `0.6.0` on first `Ausführen` and executes the current editor contents using base R and `ChannelType.PostMessage`.
- Captures output in an `aria-live` region and isolates editor/button keyboard events from Reveal navigation.
- Fails closed to the canonical static code representation if interactive enhancement cannot initialize.

## Semantic contract repair in this integration turn

The old exact head `ade9b713a8e3a48e0512577e6cd4146beafc7a59` failed SHACL before runtime tests because the central `cd:SceneItemShape` allow-lists did not know the already-authored code scene vocabulary:

1. `cd:selectionPath = "cd:hasCodeExample"` was rejected.
2. `cd:communicativeRole = cd:CodeRole` was rejected.

The integration turn repaired the central SceneItem contract rather than bypassing validation:

- added `cd:CodeRole` to the permitted `cd:communicativeRole` values;
- added `"cd:hasCodeExample"` to the permitted `cd:selectionPath` values;
- added a targeted semantic test proving `ex:scene9-code` with that exact role/path is accepted;
- retained the existing unsupported-role rejection and added an unsupported-selection-path rejection.

Semantic repair head before this documentation-only handoff: `38a2cb51fb7c14cfdf8569b5e7eb5463c989f18b`.

## Architecture boundaries

- TriG remains the sole authored source for audience-visible R code.
- `webR` is a browser execution provider, not part of the semantic domain contract.
- CodeMirror is a browser enhancement, not a semantic concept.
- No R package installation is required; the demonstration uses base R only.
- Ordinary pitch mode remains offline/no-network by default.
- D3 graph/projector behavior and the accepted local KaTeX math rendering are unchanged.
- No GitHub Actions were added.
- Poll/LimeSurvey issue #76 is not part of this turn.

## Required exact-head verification

The connector cannot execute the local Node/Python/SHACL toolchain or Firefox. The final PR head after this handoff therefore still requires external evidence.

Run the authoritative validator against PR #75:

```powershell
$root = "$env:LOCALAPPDATA\AgentWorkflowValidator"
& "$root\scripts\run-validator.ps1" `
  -RootPath $root `
  -Mode validate `
  -Repository GeRe87/project-chemie-digital `
  -PullRequest 75 `
  -Force
```

The exact current PR head must publish `agent-validator/project-chemie-digital = success`.

## Required Firefox acceptance

From a normal project checkout of the exact PR head:

```powershell
git fetch origin
git switch agent/74-codemirror-webr
npm run pitch:dev
```

Check both modes:

1. `http://127.0.0.1:5173/`
   - scene 9 shows canonical static R code;
   - no CodeMirror or webR runtime request is made;
   - normal Reveal navigation remains intact.
2. `http://127.0.0.1:5173/?interactive=1`
   - scene 9 enhances to CodeMirror without duplicate-state errors;
   - arrow/Space keys while using the editor/button do not navigate Reveal;
   - first `Ausführen` lazily loads webR and displays `[1] 2`;
   - editing to `x <- c(9, 10, 11); sd(x)` displays `[1] 1`;
   - runtime/enhancement failure leaves the canonical static code readable.

## Worker result

The bounded restack and evidence-backed semantic repair are implemented. No merge was performed. Exact-head validator and Firefox evidence remain external gates for manager acceptance.
