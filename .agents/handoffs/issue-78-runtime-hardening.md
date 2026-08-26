# Issue #78 handoff — connected interactive runtime hardening

## Branch / scope

- Branch: `agent/78-runtime-hardening`
- Issue: #78
- Role: Frontend and Reveal Renderer Engineer
- Scope is limited to presentation-time CodeMirror/webR runtime delivery, tests and documentation. No TriG, SHACL, scientific content, SceneDocument contract or poll semantics were changed.

## Implemented runtime boundary

`apps/pitch/src/code-runtime.ts` contains no public CodeMirror or webR runtime URLs.

Pinned browser destinations are local Vite public paths:

- CodeMirror view 6.43.6: `/vendor/codemirror/view-6.43.6.mjs`
- webR 0.6.0 browser loader: `/vendor/webr/v0.6.0/webr.js`
- webR 0.6.0 base: `/vendor/webr/v0.6.0/`

Connected mode remains explicit through `?interactive=1`. The normal pitch never imports either interactive runtime. CodeMirror is loaded only when connected executable blocks are mounted; webR remains lazy behind the Run button. `ChannelType.PostMessage`, keyboard propagation isolation, accessible `aria-live` output and the canonical static code fallback remain unchanged.

## Firefox browser-entry repair

The first validated PR #79 head `62b929ed68d4b18aec15775c991a5aa10323cbf6` passed the exact-head validator but failed manual Firefox execution with:

```text
The specifier “module” was a bare specifier, but was not remapped to anything.
```

The failure was caused by serving `dist/webr.mjs` directly to the browser. `webr@0.6.0` declares `./dist/webr.js` as its package `browser` export, while `./dist/webr.mjs` is the general ESM `import` export. The bounded repair therefore switches only the browser entry to `webr.js`.

The preparation script now also validates that the downloaded `webr@0.6.0` package metadata declares `exports["."].browser == "./dist/webr.js"`. The generated manifest records this browser export, the preflight requires `webr.js`, and pitch regressions reject any return to `webr.mjs` as the browser module.

## Explicit vendor preparation

Script: `scripts/prepare_interactive_runtime.py`.

Preparation remains intentionally separate from `pitch:dev`:

```powershell
npm run prepare:interactive-runtime
npm run check:interactive-runtime
```

Preparation requires public Internet once, ahead of presentation time. It:

1. mirrors the jsDelivr ESM graph rooted at `@codemirror/view@6.43.6` into local `.mjs` files and rewrites discovered `/npm/.../+esm` imports to local vendor paths;
2. downloads the exact `webr-0.6.0.tgz` npm artifact, validates package name/version and browser export, and extracts its complete `dist/` tree including `webr.js`, `R.wasm`, `R.js`, worker and VFS assets to the local Vite public tree.

The generated cache remains ignored at `apps/pitch/public/vendor/`. `runtime-manifest.json` records pinned versions, local destinations, the mirrored CodeMirror graph, the webR tarball source, browser export and archive SHA-256.

`npm run check:interactive-runtime` is network-free. No preparation command is hidden inside `pitch:dev`; a fresh checkout cannot silently contact public runtime CDNs at presentation startup.

## Fail-closed behavior

If the CodeMirror vendor entry is missing, `mountExecutableCodeBlocks()` rejects before the static fallback is hidden and the top-level connected-runtime catch keeps canonical code readable.

If webR assets are missing after CodeMirror has mounted, the editor retains canonical code and the execution surface reports the local runtime failure rather than falling back to a public URL.

The audience-poll provider remains a genuine service boundary and was not changed.

## Regression coverage

`apps/pitch/test/code-runtime.test.ts` asserts:

- exact pinned versions and local destinations;
- webR browser module is `/vendor/webr/v0.6.0/webr.js`;
- `webr.mjs` is not used by `code-runtime.ts`;
- no `cdn.jsdelivr.net`, `webr.r-wasm.org` or other HTTP URL remains in `code-runtime.ts`;
- webR still uses `ChannelType.PostMessage`;
- CodeMirror keeps the accepted single prepared dependency graph and keyboard isolation;
- vendor preparation pins webR 0.6.0 and validates `./dist/webr.js` as its browser export;
- `prepare:interactive-runtime` / `check:interactive-runtime` remain explicit and `pitch:dev` does not invoke preparation automatically.

## Validation status

The previous exact head `62b929ed68d4b18aec15775c991a5aa10323cbf6` had authoritative validator success but failed the browser gate above, so that evidence is stale for merge purposes after this repair.

No local `npm test` result is claimed from the GitHub-connector worker environment. The new final PR head must receive fresh `agent-validator/project-chemie-digital` success before Firefox retest.

## Required manual acceptance after fresh validator success

Because the vendor manifest contract changed from `webr.mjs` to `webr.js`, refresh the prepared cache while online:

```powershell
npm run prepare:interactive-runtime -- --force
npm run check:interactive-runtime
```

Then disable public Internet access and verify `npm run check:interactive-runtime` still succeeds without downloads.

Start the pitch and verify in Firefox:

1. ordinary `http://127.0.0.1:5173/` remains static and does not request interactive vendor assets;
2. `http://127.0.0.1:5173/?interactive=1` mounts CodeMirror entirely from local `/vendor/` resources;
3. first R execution loads `/vendor/webr/v0.6.0/webr.js` with no bare-specifier error and `x <- c(6, 8, 10); sd(x)` yields `[1] 2`;
4. editing to `x <- c(9, 10, 11); sd(x)` yields `[1] 1`;
5. editor/button keyboard input does not navigate Reveal;
6. temporarily renaming/removing the local vendor cache fails closed while authored code remains readable;
7. poll demo/fail-closed behavior remains unchanged.

Do not merge in the worker turn. Final Phase 2e end-to-end acceptance remains a separate subsequent milestone step.
