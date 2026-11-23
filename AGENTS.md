# Agent operating instructions

## Mission and scientific authority

Develop the semantic chemistry-education platform. Concepts, definitions,
mathematical expressions, examples, exercises, learning objectives and sources
are authored as linked semantic resources. LearningPaths select those resources;
renderer-neutral scenes are compiled into Reveal.js and other educational views.

**Non-negotiable architecture:**

- Canonical RDF/TriG under `ontology/dataset/` is the single authored semantic source.
- Preserve named-graph identities, semantic provenance and SHACL validation.
- JSON and SceneDocument exports are disposable generated transport, not a
  parallel hand-authored source of scientific truth.
- Product-owned semantic/compiler contracts must remain independent of Reveal.js.
- Apache Jena Fuseki is the planned RDF store; TypeScript is the primary
  application language, and React/Reveal.js are presentation boundaries.
- Do not hardcode a specific lecture concept or resource IRI in generic renderers.
- Scientific claims, statistical assumptions and citations must be reviewable.

## Agent control: owner-bound native CAC

Use regular native CAC for owner-bound work, with Codex coordination and OpenCode
implementation.

The owner defines the objective, permitted paths and semantic/runtime contract
impact. CAC execution uses an exact, clean, isolated Git base, an exact local
commit and reproducible evidence, with independent review of that exact head.
Agents cannot self-approve, widen scope or introduce hidden side effects.
Protect remotes and shared settings; do not alter them implicitly. A reviewable
draft PR or equivalent may be submitted within the authorized task's scope,
without another general advance approval when already covered by that authority.
Actual integration, publishing, deployment and release require explicit owner
approval.

`.cdac/project.json` (`chemie-digital.product-control.v2`) remains unchanged as a
legacy binding for compatible existing read clients of
`GeRe87/chemie-digital-agent-control-` (CDAC). It transfers no editing or automation
authority. Neither global profile is disabled and no live migration is implied.
Deactivation requires proven semantic equivalence, identified remaining users
and a separately approved, reversible change. See
`docs/agent-operating-model.md` for native inspection and compatibility gates.

**Do not use `agent-workflow-core`, a manager/worker dispatcher, scheduled
turns, claimable workflow states, activeIssue assignment, agent leases or legacy
track status as authorisation.** Historical Agent Workflow Core configuration
and state have been retired; their immutable Git blob references are archived in
`docs/legacy-agent-workflow-core/README.md`. Existing `.agents/handoffs/`
remain historical task evidence, not executable instructions. Do not reinstate
retired dispatchers or state files.

An owner may directly authorise a bounded OpenCode task in conversation or
issue form. CDAC supplies exact Product context, semantic discovery, diff
inspection and other *explicitly enabled* inspection tools; read-only CDAC
output never creates editing permission by itself. No CDAC worker-start or
Product-writing service is implied by the current MCP implementation.

## Owner-bound implementation through native CAC

For every nontrivial change:

1. Record the intended deliverable, permitted write scope and any affected
   semantic/runtime contracts. A GitHub issue is useful, **not** mandatory for
   each lecture-content edit.
2. Confirm the actual Product repository origin, branch, clean/dirty status and
   exact current HEAD; distinguish `main` from the heads of existing draft PRs.
3. Work in a new isolated branch/worktree from an exact clean base. Never replace
   or reset the owner's existing checkout or another PR's worktree.
4. Inspect relevant canonical RDF, ontology, SHACL, tests and prior work.
   Reuse resources and generic scene contracts before adding new ones. Use
   run-bound `agentctl_repo_info`, `agentctl_read_product_file` /
   `agentctl_read_context`, `agentctl_search_product_context` and
   `agentctl_diff_summary` / `agentctl_file_diff` with relative scoped paths.
   Use `agentctl_historical_source_audit` only where separately authorized;
   retain native run, path, source-range and expected-head/hash guards.
5. Modify only the authorised scope; preserve named-graph provenance, identity
   and existing scientific corrections.
6. Run authorized focused tests and, before integration, `npm test`; report actual
   commands, exit codes, failures and unrun checks without inventing a result.
   Accurately scoped document checks may establish draft readiness only, not
   full validation. Do not run checks outside the worker's authorization.
7. Commit the exact local changes and evidence for independent exact-head review.
   Submit a reviewable draft PR or user-requested equivalent within the authorized
   task, with rationale, changed paths, tests and an independent review decision
   before integration. No additional general advance approval is needed when
   submission is already covered by the task. No self-approval is permitted.
8. Reconcile the exact PR head against current `main` and any overlapping
   open PR stack. Never silently adopt unmerged results or overwrite other work.

System/renderer/vocabulary changes require broader integration review than a
bounded lecture-content edit. The owner retains release and integration
decisions; no automatic merge, deployment or publication is authorised.

## Validation and integration

Authoritative project command: `npm test`. This includes semantic/SHACL,
Python and frontend/runtime tests; focused tests do not replace the full suite.
The existing local validator at `GeRe87/agent-workflow-validator` is a
technical checker, **not** a second agent-control authority.

Required exact-current-head external commit status for a governed Product PR:

```text
agent-validator/project-chemie-digital
```

The diagnostic PR comment marker is
`<!-- agent-workflow-validator:project-chemie-digital -->`.
Only a `success` result on that exact head counts; missing, stale, pending,
failure or error does not. The diagnostic comment is not status success.
Both `npm test` and the external status must pass on the exact current PR head
before integration. No GitHub Actions workflow is authorised. When a
relevant change has merged into `main`, assess stale integration bases and
rerun validation on any reconciled PR head.

The host requirements are Python 3.11+, `pyshacl==0.40.0`, Node.js 22+ and npm.

## Human approvals and safe handling

Agents must not independently publish OER, release, deploy, change repository
visibility/access/protected settings or credentials, make binding legal,
regulatory, examination or data-protection decisions, remove previously accepted
requirements or make breaking ontology changes. Never claim pedagogy is
effective without evidence. Do not copy secrets into logs, issues or evidence.

Existing draft PRs #185–#277 and #280, historical reviews and Handoffs retain
their existing status; unaccepted work remains unaccepted unless reviewed
independently. Existing decisions, scientific corrections and historical
approvals must not be silently overturned or expanded. Old workflow state
records confer neither permission nor acceptance under CAC or CDAC.

## Definition of done

The deliverable matches its approved scope; RDF and SHACL remain valid;
semantic and runtime tests are actually verified; affected accessibility
and privacy boundaries are considered; and the exact diff, provenance,
limitations, review and integration evidence are reproducible.
