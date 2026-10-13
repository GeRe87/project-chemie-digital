# Agent handoff

## Role

QA, DevOps, Security, and Accessibility Engineer — exact System worker #276.

## Issue

#276 — Prepare isolated host-neutral Chemometrics production build.
Branch: `agent/276-chemometrics-production-build`.
Draft PR: https://github.com/GeRe87/project-chemie-digital/pull/277
Worktree: `C:/Users/PCUser/AppData/Local/Temp/opencode/chemie-production-build-276`.
Planning commit: `d76bb6f`; unchanged prerequisite basis: draft #275,
`9d6b53ae89692ce1f1a9d6a6de49f9e64a1df4aa`.
Feature commit: `48b08c85b740fdcdd1514a364cfcd336035d0e16`.
Subsequent documentation/state handoff is audit-only. This is not an accepted
release, main reconciliation or stack acceptance.

## Completed

- Additive root `npm run build:chemometrics`: existing offering generator → SHACL,
  semantic selection, pinned vendor preparation/check → existing Vite application
  → static asset/Core/world-binding validation → deterministic evidence.
- Configured offering IRI is nonsemantic selection configuration. No second world,
  course menu, content model or hardcoded renderer course behavior. Existing
  single-path generator/Pitch/CogniFlow commands preserved; RDF unchanged.
- Existing course generator accepts explicit offering/language, derives shell
  title/accessibility metadata from authored offering labels and renders every
  included document through existing static fallback. No legacy Pitch title on
  course entry. Existing JavaScript world mounts as before.
- Domain-root `/` and relative `./` bundle at a domain root succeed. Dedicated
  output, staging and stale-evidence invalidation protect other outputs/unfamiliar
  files. Missing semantic/vendor/build/static checks fail nonzero.
- Core validator + existing world projection verify exact selection/bindings;
  static verifier checks complete copied media/background/vendor tree, fonts/CSS,
  module imports, selected scene/fingerprint identity, dev-entry exclusion and
  whole-output SHA-256 evidence. Local URLs checked as asset requests, not by
  rejecting legitimate inert RDF/source IRIs.
- webR archive pinned before extraction; complete CodeMirror transitive/extracted
  vendor tree fixed by SHA-256. Mirrored module LF is explicit across platforms.
  Production Python packages and npm lockfile inputs checked. Missing offline
  cache never silently fetches. Fresh isolated cache downloaded and verified,
  never copied/symlinked from existing worktrees.
- Two staged root builds and a post-full-test rebuild have identical canonical
  fingerprint, bindings and SHA-256 for all269 output files. Documented host/version
  limits rather than claiming universal byte identity.
- Static HTTP root browser tests: all available7/12/35-scene levels open and return;
  Reveal/D3/KaTeX/media work; eight Mean Values R Run/Reset per dark/light theme;
  no page errors, failed requests or external runtime requests. `./` at another
  domain-root port also passes. Keyboard/reduced-motion and portrait world exercised.
- Deployment documentation covers outputs/commands, evidence, dependency/network/
  MIME/HTTPS conditions, deliberate future release promotion/rollback, GitHub/GitLab
  mapping and narrowly authorized future deployment-only Actions policy exception.
  No workflow/policy/settings/DNS/credentials/publication operation performed.

## Files or resources changed

- `package.json`: build/check entry points.
- `apps/pitch/scripts/generate-course-runtime.py`: same existing offering-level
  pipeline, generic explicit configuration and source-derived course shell/fallback.
- `scripts/build_static_course.py`: isolated staged build and dependency/failure gates.
- `scripts/static_course_artifact.py`, `scripts/validate_course_transport.mts`:
  static evidence and existing Core/world projection checks.
- `scripts/prepare_interactive_runtime.py`: archive/tree integrity and portable LF.
- `scripts/requirements-static-build.txt`: fixed production Python dependency versions.
- `scripts/check_static_course_browser.cjs`: optional real-static-HTTP browser probe.
- `tests/test_static_course_build.py`:14 deterministic positive/negative tests.
- `README.md`, `docs/deployment/chemometrics.md`, this handoff and only this NEW
  worktree's System result state. Generated HTML, runtime/cache/dist/.local outputs
  excluded from commits. Neither existing worktree nor port5173 changed.

## Verification

Environment: Windows; Node25.6.1, npm11.9.0, Python3.14.3, pyshacl0.40.0;
isolated `npm ci --cache .local/npm-cache`. No Linux/Node22/Python3.11 run claimed.

| Exact command/check | Actual result |
| --- | --- |
| `python -m unittest discover -s tests -p test_static_course_build.py -v` |14/14 pass. |
| `npm run check:semantics` |Conforms True; `.local/check-semantics.log`. |
| `python scripts/prepare_interactive_runtime.py --force` / `--check` |Fresh isolated pinned vendor tree passes, archive/tree digests checked. |
| `npm run build:chemometrics -- --offline` |Root build succeeds;269 artifact files; existing Vite large-chunk warning. |
| `npm run check:chemometrics-build` |Pass; typed selection/assets/evidence verified. |
| `npm run build:chemometrics -- --offline --base ./ --out-dir dist/chemometrics-relative` |Pass at domain root; not nested-hosting acceptance. |
| Repeat staged build + inventory comparison |Exact same fingerprint/bindings/all269 file hashes, including post-test rebuild. |
| `node scripts/check_static_course_browser.cjs` |Root smoke passes all3 levels and16 R Run/Reset checks, zero error/failed/remote requests. |
| `node scripts/check_static_course_browser.cjs http://127.0.0.1:4188/ dist/chemometrics-relative relative-root` |Same checks pass for relative bundle at root. |
| `node scripts/check_static_course_browser.cjs http://127.0.0.1:4186/ dist/chemometrics post-test-root` |Pass after full-test generation/rebuild. |
| Negative nested-path HTTP probe |Expected limitation reproduced: `/vendor/codemirror/view-6.43.6.mjs`404, zero Run buttons. Explicit nested bases rejected, not mislabeled validated. |
| `npm test` on feature48b08c8 |**FAIL**:433 Python tests pass; other reached phases pass except Pitch184/185. Unchanged card-motif-repair test requires raw LF but new checkout CSS has CRLF. `.local/full-test-276.log`. |
| `npm run test:self-study` after full-test stop |29/29 pass separately; `.local/self-study-276.log`. |
| `npm audit --json` |**FAIL**:existing KaTeX(low), nanoid(high), source-map-js(high). No unauthorized dependency/lockfile fix. |

Artifact location:
`C:/Users/PCUser/AppData/Local/Temp/opencode/chemie-production-build-276/dist/chemometrics/`.
269 hashed files plus `validated-build.json`, approximately71MB total.
Fingerprint: `sha256:a46ee8cabe0481fbf2815d2141f8115db88c2cf05c24ce3a7b789e87cf2d4903`.
Optional comparison artifact: `dist/chemometrics-relative/`.
Local static servers4186/4187/4188 are separate from the existing5173 server.
Reproduction/evidence: `.local/production-browser-report.json`,
`.local/relative-root-browser-report.json`, `.local/post-test-root-browser-report.json`,
`.local/subpath-diagnostic.json`, `.local/build-first-evidence.json`, build logs and
portrait-world screenshots. No generated artifact/publication commit.

## Decisions and assumptions

- Reused generic application and semantic selection end-to-end; one configured IRI
  does not duplicate authored course structure. Build scripts never compute lecture
  content or invent missing bindings.
- Exact failed-test diagnostic: `apps/pitch/test/card-motif-repair.test.ts:8` reads
  `card-primitives.css` and matches literal `\n`. Disk has477 CRLF lines; normalized
  bytes equal canonical Git blob, and canonical/normalized substring succeeds.
  No source alteration, skipped assertion, monkey-patch or normalization workaround.
- The successful Root build/static verification is distinct from the **failed**
  full project gate. Its generated marker is not an external status or approval.
- `./` relates emitted Vite assets, not the existing origin-root R/network paths.
  Root-only constraint is explicit and fail-closed instead of adding out-of-scope
  runtime edits or course-specific bundler rewrites.

## Risks or unresolved questions

1. Full npm test EOL-sensitive existing test is outside #276. Manager must authorize
   bounded portability maintenance and obtain fresh full/exact-head evidence.
2. Nested GitHub/GitLab project-path hosting requires separately authorized generic
   code-runtime/network-guard reconciliation and static subpath validation. Domain
   roots are locally tested; unrestricted host portability is not claimed.
3. Existing npm advisories need applicability/dependency-remediation review before
   release-security acceptance. Existing large-chunk and portrait/scaling limits remain.
4. Exact-head external validator, independent review and compatible-main integration
   of result/prerequisite stack remain missing. No accepted release source yet.
5. Later Actions integration needs authorized deployment-only exception in applicable
   repository/inherited rules, preserving external acceptance/provider. No policies,
   workflows, permissions, DNS/Pages/settings/secrets were edited.
6. No website/public OER release, deployment, remote chemometrics branch, force push,
   main change, PR merge or existing-worktree mutation. Static output is preparation.

## Recommended manager action

Review the scoped Root artifact and exact tests; keep draft/blocked overall. Assign
bounded EOL-portability and generic subpath/dependency follow-ups only with explicit
scope. Obtain accepted integration/external validation before later release planning.
Do not infer universal deployment readiness from the successful Root build.
