# Historical Agent Workflow Core records — retired control plane

Owner decision: 2026-10-17. This Product uses **CDAC only** for agent-control
context. The legacy scheduled dispatcher/manager-worker/lease system is
**retired**, not migrated into a new executable state. Records remain
recoverable from Git history, not from live workflow files.

Last pre-cutover Product `main`: `2a398130683d23109520e21297d7e5422a7f7e39`.

| Former operative path | Historical Git blob SHA |
|---|---|
| `.agents/dispatcher-protocol.md` | `5852712a25c104c4d5c65d3f0ff3dd7c30da9698` |
| `.agents/workflow-config.json` | `a0654d2febd936e6e8ee711e8dcd9d37a0e0b5d2` |
| `.agents/state.json` | `98a65986df116bab969b46c9969d01c53afc21e4` |
| `.agents/state.schema.json` | `45d4517b3e1141beb0d9b1eb5153b8f24af911e4` |
| `.agents/workflows/index.json` | `61e341b9497ab838e8789190364482479d00a598` |
| `.agents/workflows/system/workflow-config.json` | `3894811c13967395fed5f09b2db5d9af521759a8` |
| `.agents/workflows/system/state.json` | `f893846a871297991a15ad3ed9677ae072efc6a4` |
| `.agents/workflows/chemometrics/workflow-config.json` | `918ab0cf1920edb351198a4e9f2adf7b2eb39fd4` |
| `.agents/workflows/chemometrics/state.json` | `870719661545d7d67bdadd41eb733e7d01063825` |

Git history and preserved `.agents/handoffs/` are the auditable source for old
assignments, decisions and unmerged PR results. The old records are **not**
claimable, cannot grant a lease or authorise a worker, and must never be
reconstructed as active state by any automation.

Outstanding Draft PRs #185–#277 and #280 retain their original independent
review/integration obligations; no acceptance, rebasing or closure is implied
by this migration. PR #281 was closed unmerged as superseded by CDAC issue #5.

Migration prerequisites: accepted CDAC native binding (CDAC PR #6), Product
semantic tests/SHACL and full `npm test`, an exact-head validation status for
this Product PR, and explicit human integration decision. Old validator output
from unrelated PR heads is not transferable.
