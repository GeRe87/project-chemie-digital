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

## Local feedback and release checks

```sh
npm run test:talks
npm run check:talks-local
npm run check:talks-release
```

`test:talks` runs the explicit Talks Python/content/transport and TypeScript
metadata/world tests. `check:talks-local` adds the existing production build and
artifact verification. These are fast feedback, not substitutes for acceptance.
`check:talks-release` runs the unchanged `npm test` first, then only the Talks
build/check. It stops on failure. Logs, exit codes, elapsed seconds, source SHA
and dirty-source information are written to ignored `dist/talks-checks/`.
A successful release receipt additionally binds the build-manifest hash and
requires clean, unchanged source. The generator-owned Pitch and self-study HTML
shells are the only end-of-run tracked-file exceptions; their before/after hashes
are recorded explicitly. Validation runs in an isolated checkout, never a course
publication checkout. Browser acceptance and independent review
remain separate gates. No existing test or Chemometrics command is removed.

The observed GitHub run at `7cefac37` failed after 590 Python tests in 3069.972
seconds, with 20 failures and one error. It was not merely a timeout. Repeated
reports of one invalid canonical dataset must be fixed at their Talks source,
not hidden by excluding the failing tests. GitHub Actions are not the prescribed
validation provider and are neither added nor invoked by the local commands.

`npm run prepare:talks-publication` is a fail-closed dry run. It requires the
successful clean exact-head full release receipt, all three exit codes and the
matching build-manifest hash. It revalidates the artifact, rejects teaching
offerings, CNAME and Git/hosting metadata, and reports only `gh-pages-talks` as
the destination. `npm run prepare:talks-publication -- --stage` copies the files
into a new `dist/talks-publication` directory. Existing staging is never erased.
Neither mode writes Git refs, pushes branches, merges PRs or changes hosting.
Do not publish that local staging until browser/independent acceptance and
integration into `talks` are complete.

### Talks source fixes required by the local gate

Talks port examples previously mixed descriptor data and SHACL inside shapes
graphs. The global validator correctly excludes shapes graphs from its data
union, so those examples appeared to lack metadata and port values. The fix
separates descriptor data into one owned knowledge graph and keeps SHACL in its
original shapes graphs. Optional `contractDataGraph`, used only by the new port
contract projection, includes both exact named graphs in each inspectable TriG
popup. No global validation rule or Chemometrics content/build is changed.
Focused tests still reject missing port definitions, and compare both serialized
graphs isomorphically against the authored RDF.

FAIR card literals retain their `@en` tags without misusing the SceneItem-only
`cd:language` property. The EIC, which owns the annotations, is now the primary
chart dataset with the TIC retained as the contextual series; staged visibility
still starts with the TIC. Missing source support links and an incomplete
logo-staging fixture are corrected in Talks-only files/tests.
The semantics code SceneItem now uses the existing `cd:hasCodeExample` selection
path rather than the unsupported `cd:code` path. A focused regression checks all
Talks selection paths against the unchanged authored SHACL enumeration.

## Cloudflare Pages configuration (owner action; not deployed by this task)

Create a **Pages** project using Cloudflare's Git integration:

| Setting | Value |
|---|---|
| Repository | `GeRe87/project-chemie-digital` |
| Production branch | `gh-pages-talks` (built static files only) |
| Root directory | repository root (empty) |
| Framework preset | None |
| Build command | empty (or `exit 0` if required by the UI) |
| Output directory | `/` (repository root) |
| `SKIP_DEPENDENCY_INSTALL` | `true` (the branch contains an already-built artifact) |

The `talks` branch remains source-only. After exact-head local tests, artifact
verification, production-browser acceptance and independent review pass, publish
only the contents of `dist/talks` to `gh-pages-talks`. Never publish the source
checkout, logs, credentials or another offering's `dist` directory. A branch
named `gh-pages-talks` is not a request to change GitHub Pages settings: Cloudflare
Pages reads it directly using Git integration. No Cloudflare token belongs in Git.

After review, integration into `talks` and static-branch publication, connect the repository, apply the
settings, and verify the generated Pages preview at its root. Then add
`talks.odea-project.org` under the Pages project's **Custom domains** and follow
Cloudflare's DNS validation instructions. Verify HTTPS, root assets, light/dark
mode and the return link on the custom domain. Do not change the Chemometrics DNS,
`gh-pages`, GitHub Pages configuration or existing CNAME. This task creates no
GitHub Actions and does not publish or merge anything automatically.

Rollback: use Pages' previous successful Talks deployment, or publish a reviewed
previous Talks artifact as a new commit on `gh-pages-talks`. Do not roll back,
force-push or write `gh-pages`, Chemometrics sources/builds, Pages settings or DNS.

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
