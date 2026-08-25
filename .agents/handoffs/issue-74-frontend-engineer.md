# Agent handoff

## Role

Frontend / Semantic Web integration for Issue #74

## Issue

`#74 — Add executable R code blocks with CodeMirror and webR`

## Phase 2e integration status

PR #73 is merged. PR #75 was cleanly restacked onto `main`; its old stacked history was removed so the pull request contains only the bounded code-runtime increment plus the evidence-backed semantic repairs described below.

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
- Connected mode uses pinned `@codemirror/view@6.43.6` from jsDelivr and configures only `EditorView`-owned extensions, avoiding the duplicate `@codemirror/state` module graph seen in earlier prototypes.
- Lazily loads official webR `0.6.0` on first `Ausführen` and executes the current editor contents using base R and `ChannelType.PostMessage`.
- Captures output in an `aria-live` region and isolates editor/button keyboard events from Reveal navigation.
- Fails closed to the canonical static code representation if interactive enhancement cannot initialize.

## SceneItem SHACL repair

The old exact head `ade9b713a8e3a48e0512577e6cd4146beafc7a59` failed because the central `cd:SceneItemShape` allow-lists did not admit the already-authored code scene vocabulary. The integration repair:

- added `cd:CodeRole` to the permitted `cd:communicativeRole` values;
- added `"cd:hasCodeExample"` to the permitted `cd:selectionPath` values;
- added a positive semantic regression for `ex:scene9-code`;
- retained unsupported-role rejection and added unsupported-selection-path rejection.

The next exact-head validator run on `995f320c56b586f3e0d5028df0973b6444600b5c` confirmed this repair: SHACL reported `Conforms: True` and the new code-scene regressions passed.

## Canonical named-graph ownership repair

That same validator run exposed a second, separate contract defect: `interactive-code.trig` introduced three new named graph IRIs (`graph/concepts-code`, `graph/specifications/interactive-code`, `graph/scenes/interactive-code`) outside the repository's exact stable canonical graph inventory.

The Semantic Web worker repaired graph ownership without weakening the registry or changing resource IRIs:

- programming vocabulary assertions now live in the existing `https://w3id.org/project-chemie-digital/graph/concepts` owner;
- `ex:sd-r-code-example` and the exercise-to-code relation now live in the existing `https://w3id.org/project-chemie-digital/graph/specifications/standard-deviation` owner;
- `ex:scene9-code` and its scene membership now live in the existing `https://w3id.org/project-chemie-digital/graph/scenes/standard-deviation` owner;
- SHACL remains in the existing `graph/shapes/core` owner;
- `EXPECTED_CANONICAL_GRAPHS` was deliberately not expanded, so the existing exact-graph regression remains the guard for this repair.

The graph-ownership repair commit before this documentation-only handoff is `9acea3f73623c66ceafb97be6a1ef553dd6ba5a1`.

## Architecture boundaries

- TriG remains the sole authored source for audience-visible R code.
- `webR` is a browser execution provider, not part of the semantic domain contract.
- CodeMirror is a browser enhancement, not a semantic concept.
- Canonical public resource IRIs are unchanged.
- The exact canonical named-graph registry remains unchanged.
- No R package installation is required; the demonstration uses base R only.
- Ordinary pitch mode remains offline/no-network by default.
- D3 graph/projector behavior and accepted local KaTeX rendering are unchanged.
- No GitHub Actions were added.
- Poll/LimeSurvey issue #76 was not touched.

## Required exact-head verification

The connector cannot execute the installed Windows validator. After this handoff commit, query the current PR #75 head and run:

```powershell
$root = "$env:LOCALAPPDATA\AgentWorkflowValidator"
& "$root\scripts\run-validator.ps1" `
  -RootPath $root `
  -Mode validate `
  -Repository GeRe87/project-chemie-digital `
  -PullRequest 75 `
  -Force
```

Require `agent-validator/project-chemie-digital = success` on that exact head before browser acceptance.

## Required Firefox acceptance after validator success

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
   - runtime/enhancement failure leaves canonical static code readable.

## Worker result

The named-graph ownership defect from exact head `995f320c...` is repaired narrowly and the closed canonical graph registry is preserved. No merge was performed. A fresh exact-head validator result and subsequent Firefox evidence remain external gates for manager acceptance.
