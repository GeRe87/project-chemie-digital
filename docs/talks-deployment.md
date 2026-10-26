# Talks: authoring, build and Cloudflare Pages preparation

## Scope

Issue #292 integrates Talks into Pitch's existing semantic compiler, lazy manifest,
Reveal presentation renderer and background engine. Source base:
`origin/talks` at `eecd210a2288385fe2ec77613084fc5a235e3dfd`.
The independent Level 4 worktree and all agent workflow states are out of scope.

Canonical authoring: `ontology/dataset/talks.trig`. Add future collection members
with a ScientificTalk, exact unambiguous LearningPath, ordered steps and normal
scene definitions. Set `cd:presentationTitleOf` on a title scene to use the shared
layout. Author content only in TriG; never edit generated JSON. See ADR-0020 for
metadata fields and optional values. There is no invented date, location or logo.
For local authoring, `npm run talks:dev` generates the same semantic manifest and
starts the shared Pitch Vite app on port 5186; `npm run generate:talks` only generates.

## Production build

Required: Node.js **22.12+**, npm, Python **3.11+**. The lockfile currently selects
Vite 7.3.6, Reveal.js 5.2.1 and KaTeX 0.16.22. Production Python dependencies are
exactly pinned in `scripts/requirements-static-build.txt`, including pySHACL 0.40.0
and RDFLib 7.6.0. Do not replace the lockfile with an unpinned install.

```sh
python -m pip install -r scripts/requirements-static-build.txt
npm ci
npm run build:talks
npm run check:talks-build
```

Output: `dist/talks`, with root `index.html`, compiled chunks, canonical
`course-runtime.json`, lazy `course-runtime/manifest.json` and per-presentation
transports, `course-runtime/static-course.html`, six WebP background layers, pinned
vendor assets and `validated-build.json` hashes. The build uses `/` as its base:
serve this directory at a domain root, not a nested path. The shared course build
still uses `npm run build:chemometrics` and `dist/chemometrics`.

The existing pinned webR/CodeMirror vendor preparation requires Internet access on
the first build. Later offline builds may invoke the same Python builder with
`--offline --collection --offering-id https://w3id.org/project-chemie-digital/resource/talks --out-dir dist/talks`.
No talk currently runs code, but the shared inherited capabilities remain available.

Generation updates the disposable Pitch HTML fallback and ignored runtime files
inside the **current worktree**. Run family generators/builds sequentially in that
worktree, or use separate worktrees; never point them at another agent's checkout.
Rebuild Talks after running the general test suite, which generates lecture previews.

## Cloudflare Pages configuration (owner action; not deployed by this task)

Create a **Pages** project using Cloudflare's Git integration:

| Setting | Value |
|---|---|
| Repository | `GeRe87/project-chemie-digital` |
| Production branch | `talks` |
| Root directory | repository root (empty) |
| Framework preset | None |
| Build command | `python -m pip install -r scripts/requirements-static-build.txt && npm ci && npm run build:talks` |
| Output directory | `dist/talks` |
| `NODE_VERSION` | `22.22.0` (at least 22.12 required by the locked Vite) |
| `PYTHON_VERSION` | `3.12.12` (3.11+ supported) |
| `SKIP_DEPENDENCY_INSTALL` | `true` (the build command installs the locked dependencies explicitly) |

Use Cloudflare Pages' current Linux build image; ensure the selected Node/Python
versions are available in its version manager. No npm/Python credentials are
required for the pinned public dependencies. No Cloudflare token belongs in Git.

After review and owner integration into `talks`, connect the repository, apply the
settings, and verify the generated Pages preview at its root. Then add
`talks.odea-project.org` under the Pages project's **Custom domains** and follow
Cloudflare's DNS validation instructions. Verify HTTPS, root assets, light/dark
mode and the return link on the custom domain. Do not change the Chemometrics DNS,
`gh-pages`, GitHub Pages configuration or existing CNAME. This task creates no
GitHub Actions and does not publish or merge anything automatically.

Rollback: use Pages' previous successful deployment, or revert the accepted Talks
change through review and rebuild. Do not roll back or force-push Chemometrics.

## Verification

```sh
npm test
python scripts/validate_semantics.py
python -m unittest discover -s tests -p test_presentation_collection.py -v
node --experimental-strip-types --test apps/pitch/test/talks-world.test.ts
npm run build:talks
npm run check:talks-build
python -m http.server 4186 --bind 127.0.0.1 --directory dist/talks
```

The optional production-browser smoke script uses Playwright installed outside
this repository (it is not a production dependency):

```sh
node scripts/smoke_talks.mjs http://127.0.0.1:4186 /absolute/path/to/playwright/index.mjs /absolute/path/to/browser.exe
```

See the issue-292 handoff for actual commands, exit codes, screenshots and known
limitations. Deployment is a separate owner action, not established by a passing build.
