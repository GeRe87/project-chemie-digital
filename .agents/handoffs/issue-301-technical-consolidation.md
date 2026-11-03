# Agent handoff

## Role

Interactive technical implementation requested by the repository owner, covering
the QA/DevOps and architecture review findings. This is not a claimed scheduled
dispatcher turn; no workflow state or lease was changed.

## Issue

[#301 — Technical consolidation of the chemometrics branch](https://github.com/GeRe87/project-chemie-digital/issues/301)

Base: `chemometrics` at `c8134c5313d8f2bc9866789fe7037334de46a7ca`.
Implementation branch: `agent/301-chemometrics-technical-consolidation`.

## Completed

- Corrected Dataset-wide blank-node export and fingerprinting. The full corpus
  roundtrip preserves 64,274 quads, 692 blank nodes and 274 populated named graphs.
- Added unknown-input SceneDocument structure validation and a shared capability
  table; both output adapters use the same supported-version check.
- Added recursive runtime traversal, signed chart geometry and updates to mounted
  live charts with visibility-aware scheduling.
- Preserved cached-page state, added final resource disposal, R Stop/Restart and
  stale-result rejection, and retained pinch zoom during presentation stage locks.
- Split course transport into a small manifest, content-addressed level
  neighborhoods and one full shared graph. The complete scene graph/provenance
  projection comparison covers all 208 selected scenes.
- Isolated production assets from preview leftovers and added verified lazy
  loading with accessible failure recovery.
- Extracted common teaching rendering and the Python static HTML adapter.
- Pinned portable dependencies, enabled strict TypeScript, and added toolchain
  preflight plus a local full release-verification command and portable browser
  launch configuration.

## Files or resources changed

- Core scene contracts, version capabilities, traversal and their regression tests.
- RDF assembly/export and identity regression tests.
- Pitch runtime, D3 charts and focused lifecycle/geometry/cancellation tests.
- Course generation, transport loader, production staging and artifact checks.
- Shared teaching-renderer package and existing adapter compatibility exports.
- Root dependency manifests, lockfile, TypeScript configuration and local
  verification scripts.
- README, current architecture and `docs/technical-verification.md`.

No authored TriG, learning-path selection, formula text or symbol legend was edited.
No deployment, Actions workflow, repository setting or workflow-state change is
included.

## Verification

Focused implementation evidence before the final integration run:

- 159 Core tests and 20 RDF tests passed; structural negative fixtures exercise
  more than 1,500 malformed field cases.
- 121 focused frontend tests passed. A real Chromium component probe exercised
  editor reset/late-result races, worker restart, nested live charts, hidden/script
  suspension, cached lifecycle and final disposal using a controlled R executor.
- 24 focused Python transport/build tests passed. The updated real-course
  integration loaded all levels through the client loader and compared all 208
  graph projections without skipping diagnostics.
- 28 Self-Study tests passed after sharing the math/legend implementation.
- Strict TypeScript and an independent clean Linux `npm ci --no-audit` plus Vite
  build passed.
- Three isolated subprocess regressions passed for release-report freshness:
  failed preflight, abrupt process-group termination and failed final Git metadata.
  A new run atomically invalidates old success and preserves distinct start/end
  revision metadata without changing validation coverage.

The full integration command is:

```bash
npm run verify:release -- --offline
```

It records the tested revision, worktree state, full `npm test`, production build,
artifact verification and real built-site browser results under
`.local/release-verification/`. The final PR description records the actual outcome
of that run and any corrections. Focused evidence above must not be interpreted as
the final release gate or the external acceptance status.

The browser gate includes both themes, all levels, keyboard legends, graph loading,
history and cached lifecycle events, real local R execution and stop recovery,
mobile stage zoom policy, JavaScript-disabled static access, PDF initialization,
and injected loading failure with Retry. Only explicitly executed browser engines
may be claimed as covered.

## Decisions and assumptions

- Keep the offline TriG-to-static architecture. Fuseki is not introduced as a
  production prerequisite.
- Keep canonical artifact version 1.0 and valid SceneDocument versions 1.0–1.14.
  The split course transport has its own explicit version 2.0.
- Retain exact scene graph behavior by shipping complete one-hop neighborhoods;
  the whole Dataset remains available once for explicit full-graph consumers.
- Blank-node canonicalization is project-specific, not an implementation claim
  for RDFC-1.0. Regenerate old fingerprints from unchanged TriG.
- R Stop/Restart clears the shared session. Reset clears that editor/output and
  prevents stale rendering; it does not silently stop unrelated shared work.

## Risks or unresolved questions

- Required external status `agent-validator/project-chemie-digital` must succeed
  on the exact current PR head before acceptance. Local evidence does not replace it.
- The repeated live `npm audit` was rejected by automatic approval review because
  it sends dependency metadata to the public registry. Known prior advisories were
  checked locally against the updated lockfile; no new clean-audit claim is made.
- Browser-cache admission, physical touch gestures, assistive technology and
  unexecuted browser engines remain device-review boundaries.
- Root-relative R/network guard integration still constrains subpath hosting.

## Recommended manager action

`review` — review the draft against `chemometrics`, inspect its final verification
evidence, and obtain the required exact-head external status before acceptance.
No self-acceptance, merge or publishing is requested by this increment.
