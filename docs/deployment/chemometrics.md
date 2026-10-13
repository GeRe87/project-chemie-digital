# Chemometrics static production preparation

## Status and scope

Issue #276 prepares a **local domain-root build**, not a published or accepted
release. Its unchanged basis is draft #275, commit
`9d6b53ae89692ce1f1a9d6a6de49f9e64a1df4aa`. Current `main` does not yet contain
the Pitch course generator. No stack PR was merged, no `chemometrics` remote
branch was created, no Actions workflow/policy was changed, and no Pages/DNS/
credentials/publication operation was performed.

The implementation worktree is isolated:
`C:/Users/PCUser/AppData/Local/Temp/opencode/chemie-production-build-276`.
Neither existing worktree nor its port5173 server is changed by these commands.

**Not all hosting modes are accepted.** The root build is statically validated
and browser-tested. Nested project-path hosting remains blocked by existing
generic root-anchored CodeMirror/webR URLs and vendor network-guard paths. That
runtime reconciliation is outside #276; no bundler rewrite/alternate navigation
was introduced to conceal it. Existing portrait/scaling issues remain separate.

## Semantics First and unchanged renderer boundary

`npm run build:chemometrics` is an explicit offering-selection configuration of
`scripts/build_static_course.py`, not a second Chemometrics application. It calls
the **existing** `apps/pitch/scripts/generate-course-runtime.py` offering pipeline:

1. assemble the canonical named-graph TriG Dataset and validate SHACL;
2. resolve one explicit TeachingOffering and its authored placements/units/paths;
3. compile fully scene-bound paths with exact path/graph bindings;
4. reuse existing media enrichment, SceneDocuments and static fallback;
5. bundle the existing Pitch/Reveal/D3/KaTeX/course-world application with Vite;
6. verify the generated transport using the same Core validator and existing
   `createPitchCourseWorldModel` projection used by the browser.

No course labels, menus, scene lists, scientific values or active path choices
are authored in deployment helpers. The selected offering IRI is nonsemantic
application configuration. Course availability/order still comes from RDF. Units
without fully bound scene paths remain “In preparation”; no placeholder lecture
is invented. The current artifact exposes Introduction, Variables and Constants,
and Mean Values through their canonical bindings.

The course generator now accepts `--offering-id`/`--language`, derives document
title/accessibility shell metadata from the offering's authored labels, and
reuses the existing fallback renderer for **all** included documents. The ordinary
Pitch and single-path `generate:chemometrics` command are not changed. The
historical `generate:introduction` alias remains the same course-generation entry.
JavaScript creates the existing Overworld; without JavaScript the full authored
content is readable as a static fallback, not a second navigation implementation.

## Build and verification commands

Use an isolated checkout, Node.js **22.12+** (or compatible newer), Python3.11+
and a dedicated dependency environment. Validation here used Node25.6.1,
npm11.9.0 and Python3.14.3. Older supported versions were not separately exercised.

```text
npm ci --cache .local/npm-cache
python -m pip install -r scripts/requirements-static-build.txt
npm run build:chemometrics
npm run check:chemometrics-build
```

The first build downloads pinned CodeMirror/webR dependencies if absent. It does
not run a development server. For a previously prepared cache, explicitly disable
downloads:

```text
npm run build:chemometrics -- --offline
```

`--offline` requires a complete, integrity-verified **local worktree** vendor tree;
it fails on missing/changed bytes, never borrows another worktree's cache or fetches
a CDN fallback. This is offline build/normal presentation operation, not a promise
that arbitrary edited R code cannot attempt networking.

Default output: **`dist/chemometrics/`**. The default Vite base is **`/`**, suitable
for a future custom domain at `https://chemometrics.odea-project.org/`. No hostname
is encoded in the semantic model, renderer or build. A relative bundle at a domain
root can also be produced:

```text
npm run build:chemometrics -- --offline --base ./ --out-dir dist/chemometrics-relative
python scripts/static_course_artifact.py dist/chemometrics-relative
```

Both `/` and `./` were tested at an HTTP domain root. **`./` does not make the R
runtime portable to a nested subpath.** Explicit `/project/` bases are rejected
with an actionable error until generic runtime paths are reconciled. GitLab Pages
with a custom-domain root can use the same artifact. GitLab project-subpath hosting
is not yet approved and is not represented as a deployment-only toggle.

The helper accepts an explicit `--offering-id` and dedicated `dist/` subdirectory,
so the build orchestration is reusable without changing renderer/content contracts.
It refuses source directories, symlink escapes, unowned outputs and outputs with
unfamiliar changes. Previous validated-build evidence is invalidated before a
fresh build attempt; generation/validation/bundle failure cannot leave an old
success marker authorizing publication. Old files are preserved on failure, but
without valid evidence. Choose a new dedicated output directory after an invalidated
attempt rather than deleting unfamiliar files. Other offering/Pitch output stays intact.

## What is emitted and checked

Output contains compiled HTML/CSS/JS, bundled KaTeX fonts, copied public media/
background assets, the full pinned interactive vendor/worker/WASM/VFS tree,
`course-runtime.json` (disposable transport), and `validated-build.json` (disposable
file-hash/selection evidence). The marker has no timestamp or private local path.
It is a local validation record, **not** a signature or external acceptance status.

The validator checks the exact selected offering, Core transport contracts,
existing world/binding projection, offering title rather than German Pitch shell,
selected scene/fingerprint presence in the application, complete public-asset
copy hashes, semantic media, CSS font/image URLs, local mirrored module imports
and pinned vendor tree digest. All files are covered by SHA-256 inventory; changing
or deleting output invalidates the evidence. Dev entry/HMR markers and filesystem/
remote/missing/escaping runtime asset references fail. Scientific source URLs and
inert vendor metadata are not mistaken for runtime network imports.

Pinned runtime dependencies:

- CodeMirror view6.43.6 and its entire locally rewritten transitive module graph;
- webR0.6.0 npm archive, checked **before extraction** against SHA-256;
- whole extracted/mirrored vendor tree hash, covering missing/changed/extra files;
- explicit LF output for mirrored modules on Windows/Linux, eliminating host
  newline variation. A future CDN mutation/transitive version change fails closed
  rather than being silently accepted. Pin updates require a dependency review.

The npm lockfile and `scripts/requirements-static-build.txt` fix the application
and semantic-validation package versions. These are version/content pins, not a
complete signed supply-chain provenance claim. Python3.11 conditional dependencies
and a Linux build still need separate execution evidence before a release. The
tested Windows environment produced identical selection/fingerprint and SHA-256
for all **269 artifact files** across two fresh staged builds. This does not claim
identical bytes across every OS/Node/npm version.

## Local static browser test (no Vite dev)

```text
python -m http.server 4186 --bind 127.0.0.1 --directory dist/chemometrics
npm install --prefix .local/browser-tools --cache .local/npm-cache --no-save --package-lock=false playwright@1.58.2
node scripts/check_static_course_browser.cjs
```

The optional smoke helper uses installed Microsoft Edge via Playwright. It starts
no server and never depends on port5173. For a different root URL/output:

```text
node scripts/check_static_course_browser.cjs http://127.0.0.1:4188/ dist/chemometrics-relative relative-root
```

Normal static HTTP with JavaScript module/WASM MIME types suffices; the existing
webR PostMessage channel does not require SharedArrayBuffer/COOP/COEP in this
configuration. Serve production over HTTPS with same-origin worker/module/VFS
assets. `file://` opening is unsupported. Root dark/light checks passed: all three
levels opened and returned via their completion buffer; D3 charts/diagrams, KaTeX,
media and all eight Mean Values Run/Reset labs worked with **zero failed/remote
requests or page errors**. Deck keyboard navigation is exercised after leaving
the R control's intentional keyboard-isolation boundary. Portrait screenshots
show the world; lecture portrait/scaling acceptance is not inferred from them.

The negative subpath probe served the `./` bundle beneath
`/chemometrics-relative/`: root `/vendor/codemirror/view-6.43.6.mjs` returned404
and no Run controls mounted. This is a reproduced pre-existing runtime limitation,
not waived by successful root tests. The build rejects explicit nested bases.

Optional external live polls remain opt-in; their default local demo endpoint is
not a production service and is **not used** by ordinary course/R mode. A future
connected-poll deployment needs separate service/network authorization. No account,
tracking or student-data persistence was added.

## Tests and unresolved dependency risks

```text
python -m unittest discover -s tests -p test_static_course_build.py -v
npm run check:semantics
npm run build:chemometrics -- --offline
npm run check:chemometrics-build
npm test
```

The 14 focused tests cover wrong/missing semantic selection and bindings, complete
canonical availability, base restrictions, missing/remote/dev/escaping assets,
stale/changed output, unfamiliar output preservation, invalidated prior evidence,
missing offline cache and archive/tree integrity. Browser/repeated-build checks
are separate artifact integration evidence. After `npm test`, rebuild production
output: default test generation writes the ordinary Pitch transport in this
worktree. Neither published artifacts nor another worktree may be inferred current.

`npm audit --json` currently fails with three existing advisories: KaTeX(low),
nanoid(high), source-map-js(high). No automatic/force dependency update or lockfile
change was made outside assignment. Manager must review applicability and assign
dependency remediation before any release-security verdict. The existing Vite
large-chunk warning also remains. Actual final-head test counts/logs are recorded
in the structured issue handoff, not fabricated as publication approval here.

The full #276 `npm test` attempt on the isolated Windows checkout failed in the
unchanged `apps/pitch/test/card-motif-repair.test.ts:8`: its raw substring assertion
requires literal LF, but the new checkout has477 CRLF lines in `card-primitives.css`.
The normalized file is byte-identical to its canonical Git blob, and the assertion
passes against that blob. **433 Python tests passed; Pitch passed184/185** before
the top-level command stopped. Self-study was subsequently run separately and
passed29/29. This is an actual failed full gate, not a waived test. That existing
test/renderer file is outside #276, so it was not changed, globally monkey-patched,
skipped or normalized in-place. Manager must authorize a bounded portability fix
and a fresh full/exact-head rerun before project acceptance. The local Root
production build/static verification is a distinct successful check.

## Future release branch and host configuration (requirements only)

1. Obtain independent review, successful exact-current-head
   `agent-validator/project-chemie-digital` and compatible-main integration for
   this result **and its prerequisite stack**. No merge is authorized by this build.
2. Select an explicitly approved `main` commit. Inspect `chemometrics` if it exists;
   record its function/divergence rather than overwrite it. If absent, an authorized
   operator may create it from that approved commit. Do not publish the unaccepted
   feature branch or blindly merge main/head into a release branch.
3. Promotion is deliberate and reviewable (fast-forward only when safe, otherwise
   a reviewed reconciliation). Main stays development-only; no automatic main merges,
   force pushes or resets. Revalidate the exact promoted source and regenerate
   artifact/evidence; keep immutable source SHA, artifact hashes and validation logs.
4. Roll back by a new reviewed release commit/revert that restores a known approved
   source state, then rebuild/revalidate it. If the deployment platform can restore
   a retained validated artifact, require an explicitly approved matching source/
   artifact record. Never pretend a new source revision inherits an old head's status.
5. Configure protections, environments, domain/DNS/HTTPS/permissions/secrets only
   through their separate authorized human gates. None was changed here.

For **GitHub Pages**, a future workflow may run only on push to `chemometrics`, plus
manual dispatch guarded to that exact branch; use least-privilege permissions,
isolated Node/Python dependencies and reviewed action/version pins. Run the existing
build/static checks and upload **only** a successfully validated artifact; deploy
only after every required gate passes. No publish after semantic selection/SHACL/
vendor/build/artifact failure, and no fallback to a previous output. Domain-root
hosting uses base `/`. No workflow YAML is part of #276.

For **UDE-GitLab Pages**, keep the same host-neutral generator, semantic selection
and static artifact command. The CI adapter translates approved build/upload/
deployment gates to GitLab jobs/artifacts; the static output can be copied to that
host's Pages artifact directory. A custom-domain root needs no content-model change.
Nested project URLs need the separately authorized generic runtime fix first.

## Required authorized rule change before Actions integration

The binding repository `AGENTS.md` prohibits Actions/workflow creation and retains
external exact-head acceptance. Inherited `C:/Users/PCUser/AGENTS.md` additionally
prohibits automated `.github/workflows` edits. `.agents/dispatcher-protocol.md`
excludes Actions as validation evidence, and the pinned Core/project configuration
requires external exact-head statuses.

A separately authorized governance change must narrowly permit **deployment-only**
workflow creation/invocation in the applicable repository and inherited rules,
without replacing the external validation provider or weakening manager acceptance/
integration gates. Clarify any deployment-versus-validation wording conflict in
the project protocol, and define the exact permitted workflow path, release branch,
permissions and publication gate. An issue/user request alone must not be treated
as overriding binding higher-priority rules. Do not modify the Core, provider,
policies or workflow YAML speculatively. That subsequent governed change and the
public-release approval are remaining prerequisites, not results of this milestone.
