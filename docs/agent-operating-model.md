# CDAC-first agent operating model

As of the owner decision of 2026-10-17, **Chemie Digital Agent Control**
(`GeRe87/chemie-digital-agent-control-`) is the sole agent-control interface
for Project Chemie Digital. It replaces the old scheduled
`agent-workflow-core` manager/worker system.

## Task lifecycle

```text
Owner / ChatGPT
      |
      | bounded objective + permitted scope
      v
OpenCode on a fresh isolated Git worktree
      |                         ^
      |                         |
      +--- CDAC read-only Product and semantic inspection
      |
      v
Product canonical RDF/TriG + generic runtime
      |
      v
Focused tests + SHACL + npm test
      |
      v
Draft PR + current-head review + local validator
      |
      v
Explicit owner integration/release decision
```

No central `ready/worker`, `blocked/manager` or lease is needed to create a
single lecture scene. A task's authorisation comes from the owner, and is
bounded by the approved paths and contract impact.

## Isolation and integration

- Product `main` and active draft PR heads are distinct integration references.
- A new task uses a fresh branch/worktree based on a verified, deliberate base.
- Existing branches, especially the preserved #185–#277 chain and PR #280,
  must not be silently rebased, merged, deleted or overwritten.
- Check overlapping files and shared semantic/runtime contracts before integration.
- Keep ontology/dataset TriG authoritative; never author a duplicate semantic
  truth in a TypeScript view or ad hoc generated JSON.
- A content-only task must not introduce renderer special cases.

## CDAC roles and limits

CDAC reads current repository identity, exact HEAD, semantic resources and
LearningPaths; diff-only profiles can inspect a dirty worktree without restoring
it. Existing CDAC semantic MCP and diff MCP servers remain separate and
read-only until a future explicitly reviewed write capability exists.

`.cdac/project.json` declares the CDAC-native v2 Product binding. The old
`.agents/workflows/` registry and active dispatcher files have been removed
from current Product sources. Their former blobs are available via
`docs/legacy-agent-workflow-core/README.md`, and preexisting
`.agents/handoffs/` remain historical evidence only.

## Validation

Product command: `npm test`; semantic/SHACL validation must pass.
The external local validator writes
`agent-validator/project-chemie-digital` on the **exact current PR HEAD**.
Its diagnostic PR comment is not a substitute for status success.
The validator is a check runner, not a second agent-control system.
GitHub Actions remain prohibited.

Keep direct owner approval for actual PR integration, publishing, deployments,
breaking changes and legal/privacy/examination decisions. Always report tests
not run, incomplete previews and external validation still missing.

## Migration and pending reviews

CDAC issue #5 records the cutover. CDAC PR #6 introduces a read-only
v2-compatible binding; this Product migration must not be accepted before that
compatibility PR is independently validated and available to operators.

Historical issues, handoffs and branch-local workflow state are not invalidated
by this change. Their scientific claims and unresolved review findings remain
subject to ordinary review. This migration neither completes Issue #184 nor
accepts any existing draft PR.
