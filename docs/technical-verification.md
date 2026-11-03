# Technical verification and release preparation

Issue #301 consolidates the technical boundaries of the `chemometrics` branch.
Teaching TriG, learning-path selections and authored formula legends are unchanged.

## Reproducible environment

Use Node.js **22.12 or newer**, npm and Python **3.11 or newer**. The exact JavaScript
tooling and native platform packages are recorded in `package-lock.json`. Install
from that lockfile; do not regenerate it from a platform-specific `node_modules`
tree. Production Python dependencies are pinned separately.

```bash
python -m venv .local/venv
# Linux/macOS:
source .local/venv/bin/activate
# Windows PowerShell: .local/venv/Scripts/Activate.ps1
python -m pip install -r scripts/requirements-static-build.txt
npm ci --no-audit
npm run doctor
```

The doctor command checks Node, npm, the pinned TypeScript/Playwright installation,
native Rollup/esbuild loading and Python dependencies. It does not install packages
or contact a service. `npm run typecheck` can run before generating runtime JSON;
generated imports enter the application as `unknown` and require runtime validation.

## Local validation

```bash
npm test
```

This remains the repository's authoritative validation command. It now includes
strict `tsc --noEmit`, not only execution with type stripping. The semantic suite
validates the full Dataset and intentional negative fixtures and can take much
longer than the TypeScript unit tests. Do not mistake an interrupted run for success.

Useful bounded checks while developing are `npm run test:core`,
`npm run test:renderer-d3`, `npm run test:pitch` and `npm run typecheck`. They do not
replace the final project command.

## Built-site browser gate

Install the browser once while downloads are available, then prepare the reviewed
editor/R vendor assets:

```bash
npx playwright install chromium
npm run prepare:interactive-runtime
npm run check:interactive-runtime
npm run verify:release -- --offline
```

The release verifier performs these steps in order and stops on failure:

1. Read-only toolchain and browser preflight.
2. Full `npm test`.
3. Production Chemometrics build in an isolated staging directory.
4. Verification of generated transport, source identities, assets and file hashes.
5. A temporary localhost server and smoke checks against the actual built files.

The smoke gate opens every level in light and dark themes, checks scene coverage,
chart mounting, formula rendering and keyboard-accessible symbol legends, exercises
navigation and cached-page lifecycle events, runs real local R code, stops a running
R session and verifies recovery, opens the course on a mobile viewport and injects a
manifest failure to check Retry and the static content link. It also follows the
static escape with JavaScript disabled and checks a representative Slides PDF view
for complete scene coverage and open legends. The mobile zoom policy is checked
while an authored presentation stage is actually locked. Ordinary navigation
must not download the shared full graph. Unexpected browser errors, failed requests
or external requests fail the gate.

Reports and stage logs are written under `.local/release-verification/`; the server
is closed on completion or failure. A new run atomically replaces the previous
report with `status: running` and `ok: false` before any preflight subprocess. An
abrupt termination therefore leaves an incomplete report instead of stale success.
The report records start/end Git revisions and timestamps, worktree state, stage
durations, browser version and coverage. The start revision is never relabeled as
the ending revision. It is diagnostic evidence, not a deployment or acceptance
certificate.

To include a second installed browser engine:

```bash
npx playwright install firefox
npm run verify:release -- --offline --browser chromium --browser firefox
```

For an already built artifact and a running local server, the bounded smoke check
can be invoked directly:

```bash
npm run test:browser -- http://127.0.0.1:4186/ dist/chemometrics .local/browser-check chromium
```

The older exhaustive course probe remains available as `npm run test:browser:extended`.
It executes all discovered R workbenches and takes longer. Focused authoring probes
in `scripts/*_browser.cjs` share the same launcher. They may still require their
documented preview and local port. The release gate itself uses no development
server or direct source imports.

Optional environment configuration for an existing host installation:

| Variable | Purpose |
| --- | --- |
| `PLAYWRIGHT_BROWSER` | Default engine: `chromium`, `firefox` or `webkit`. |
| `PLAYWRIGHT_EXECUTABLE_PATH` | Explicit compatible browser binary; use one engine per run. |
| `PLAYWRIGHT_CHANNEL` | Installed browser channel such as `msedge`, if explicitly wanted. |
| `PLAYWRIGHT_MODULE` | Optional alternate installed Playwright module. The pinned repository package is the default. |
| `PLAYWRIGHT_LAUNCH_ARGS` | Explicit JSON array of host-specific browser flags. No web-security override is applied by default. |

## Contract and behavior changes

| Area | Result | Regression evidence |
| --- | --- | --- |
| RDF export | Dataset-wide blank-node identity is preserved, including cross-graph sharing. Export and fingerprint use the same canonical representation. | Independent round-trip, node counts, graph context, deterministic renaming and shared-versus-split identity fixtures. |
| Raw scenes | Unknown kinds and malformed fields fail at the input boundary with a field path. A central table declares supported version capabilities. | Negative raw fixtures alongside existing valid contracts. |
| Nested blocks | Runtime mounts use common recursive traversal; rendering retains authored reading order. | Nested group and renderer tests. |
| Signed charts | Automatic domains include negative values and zero; bar geometry extends from the zero baseline. | Negative-only, mixed-sign and zero-value cases. |
| Live charts | Data updates reuse mounted SVG; inactive/hidden work pauses. | Renderer update and lifecycle checks. |
| R execution | Stop/Restart cancel the shared session. Reset and disposal reject late results. | Cancellation, queue, stale-result and real-browser recovery checks. |
| Course delivery | One full graph is stored separately; levels carry their required semantic neighborhood and verified hashes. | Projection equivalence, tampering, revision mismatch and clean staging checks. |
| Failure recovery | Visible loading/error state, Retry and a static content link. | Injected manifest failure and successful retry. |
| Shared rendering | Self-Study imports common teaching rendering directly. Static HTML rendering is separate from RDF compilation. | Existing formula, legend, derivation and static-output tests. |

Fingerprint values change because the previous per-graph representation could
merge unrelated blank nodes. Regenerate transport from TriG; do not preserve or
hand-edit old generated fingerprints. This changes generated transport identity,
not the authored ontology or learning content.

The canonical RDF representation is project-specific and is not advertised as an
implementation of W3C RDFC-1.0. A standard interoperable canonicalizer can be adopted
separately if signed external RDF exchange becomes a requirement.

## Boundaries

The built-site smoke gate is a repeatable minimum. Synthetic cached-page events
exercise lifecycle handling but cannot guarantee that every browser chooses to put
a particular page in its back/forward cache. Physical pinch gestures, assistive
technology and unusual device sizes still benefit from device review. Add an
explicit browser engine to the gate before claiming coverage for it.

Subpath hosting remains constrained by the existing root-relative local R/network
guard integration. The supported production base remains `/`, or `./` at a domain
root. No deployment, GitHub Actions workflow, branch-protection change or automatic
dependency audit is part of these commands.

The exact-head external status `agent-validator/project-chemie-digital` remains
required before acceptance. A successful local run must not be substituted for
that status or reused after material source changes.
