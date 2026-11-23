# Proposed native CAC agent operating model

## Authority and effective date

This owner-authorized documentation draft proposes regular native CAC for
owner-bound Project Chemie Digital work, with Codex coordination and OpenCode
implementation. The new governance wording takes effect only after
owner-approved integration. Until then the existing CDAC-only decision of
2026-10-17 remains in force; this candidate does not itself approve a cutover.

The owner supplies the objective, permitted paths and semantic/runtime contract
impact. Neither an inspection result nor a legacy binding grants editing or
automation authority. Agents must not self-approve, widen scope or introduce
hidden side effects. Draft submission and integration/release require explicit
owner authorization, separately from implementation permission.

## Task lifecycle

1. Owner authorizes a bounded objective, paths and contract impact.
2. Codex coordinates the authorized work; OpenCode implements through native CAC
   on a verified exact, clean, isolated Git base and fresh branch/worktree.
3. Inspect scoped Product sources and contracts through run-bound tools. Preserve
   canonical RDF/TriG, named-graph provenance and existing scientific corrections.
4. Produce an exact local commit, diff and reproducible evidence. Report actual
   check commands/tool calls, outcomes, failures and unrun gates.
5. Obtain independent review of the exact commit head; implementation is not
   approval. Submit a draft only if explicitly owner-authorized.
6. Before integration, reconcile with current `main` and overlapping PRs, obtain
   independent exact-current-head review, `npm test` success and the required
   external exact-head status. Any changed head requires renewed evidence.
7. The owner makes the explicit integration/release decision. No automatic merge,
   deployment, publication or release follows from worker completion.

No central `ready/worker`, `blocked/manager` or lease is needed to create a
single lecture scene. An issue is useful but not mandatory for routine lecture
editing. Authority remains bounded by the owner, approved paths and contract
impact, not scheduled workflow state.

## Isolation, inspection and native guards

- Product `main` and active draft PR heads are distinct integration references.
  Verify repository identity/origin, branch, clean status and exact HEAD before
  editing. Never replace or reset an owner's checkout or another PR's worktree.
- Protect remotes, shared configurations, access settings and credentials. No
  hidden network, push, PR creation or other side effect is implied by local
  inspection or implementation permission.
- Start native inspection with `agentctl_repo_info`; prefer
  `agentctl_implementation_checkpoint` and `agentctl_repo_map` for compact context.
- Use `agentctl_read_product_file` or `agentctl_read_context` for scoped source
  excerpts (for example `AGENTS.md`, `README.md` and this document), and
  `agentctl_search_product_context` for bounded relevant searches.
- Use `agentctl_diff_summary` and `agentctl_file_diff` with repository-relative
  scoped paths to inspect committed and uncommitted changes, rather than broad
  raw diff dumps. Never infer absolute paths or bypass path exclusions.
- Use `agentctl_historical_source_audit` only for a milestone-authorized historical
  range. Preserve native run identity, allowed paths, bounded reads, protected
  metadata exclusions, source-range authorization, expected content hashes and
  expected-head guards. A denied audit is not evidence of inspected content.
- Use run-bound guarded writes and `agentctl_commit_product_changes` only within
  authorized paths, preserving hooks; report the actual outcome with
  `agentctl_report_worker_outcome`. A local commit is not integration approval.
- Existing branches, especially the preserved #185–#277 chain and PR #280,
  must not be silently rebased, merged, deleted or overwritten. Check overlapping
  files and shared semantic/runtime contracts before integration.
- Keep ontology/dataset TriG authoritative; never author duplicate semantic truth
  in TypeScript views or generated JSON. A content-only task must not introduce
  renderer special cases. System/renderer/vocabulary changes need broader review.

## Retained CDAC binding and transition gates

`.cdac/project.json` retains the unchanged `chemie-digital.product-control.v2`
legacy binding for compatible existing read clients of
`GeRe87/chemie-digital-agent-control-` (CDAC). No editing or automation authority
is transferred by that binding. Existing semantic MCP and diff MCP profiles
remain separate and read-only; diff inspection may observe a dirty worktree
without restoring it. No CDAC worker-start or Product-writing service is implied.

This proposal neither edits the binding nor disables either global profile. It
is not a live migration or a universal CDAC replacement. Before deactivation,
identify remaining users and prove the semantic equivalence described below;
then obtain separate approval for a reversible change with a rollback plan.
Availability of generic file/diff tools alone does not satisfy that gate.

CDAC issue #5 records the prior cutover; CDAC PR #6 introduced the read-only
v2-compatible binding. These are external historical references, not proof here
of compatibility approval or operator availability. The existing requirement to
independently validate that compatibility and make it available to operators is
not waived by this proposal.

The old workflow registry and active dispatchers have been retired. Immutable
blob references are archived in `docs/legacy-agent-workflow-core/README.md`;
preexisting handoffs remain historical evidence only. Do not reinstate Agent
Workflow Core dispatchers, scheduled turns, claimable states, activeIssue
assignments, leases or retired state files as authorization.

## Evidence boundary: local PR #280 rehearsal

The following is supplied external rehearsal evidence, not a reproduction by
this documentation worker. The authorized source pin is
`d45e2d0918587f0fcd6c60c95494bb9451de709c` /
`db617dabf55cc0672a244c28906f0252be96b0f9`, supplied as confirmed from current main.
The local PR #280 rehearsal used head `70e2fe66`, merge base `25d8be85` and
observed target `d45e2d0`. It reproduced scope and Product diffs. Two intentionally
protected `.agents` metadata paths were checked only as Git path names, not read
as content. Current main had retired legacy state touched by that PR; historical
state must not be restored to make a comparison appear current.

This local result is not repository integration approval, acceptance of PR #280,
or universal CDAC replacement. It proves no semantic inspection parity. This
worker's run-bound historical audit request was denied for lack of unambiguous
historical audit authority; no historical source contents were independently
verified here.

## Read-only semantic compatibility acceptance

No Semantics MCP implementation is in scope. The following maps every offered
read-only CDAC semantic capability to a candidate Product-native inspection
route, not an already equivalent replacement:

| CDAC capability | Candidate inspection route and required semantics |
| --- | --- |
| `cdac_semantic_inventory` | `scripts/rdf_dataset.py` `assemble_dataset`, then named-graph typed counts and filters over that dataset; preserve graph ownership and count semantics, not just file counts. |
| `cdac_semantic_search` | RDFLib or read-only Fuseki `SELECT` over the same pinned assembled dataset; reproduce the original text/type/graph and other accepted filter semantics, rather than approximate grep. |
| `cdac_semantic_inspect` | Exact resource and graph RDF statements, including incoming/outgoing relations where applicable; preserve RDF terms and graph provenance rather than a label-only summary. |
| `cdac_learning_path_inspect` | Exact LearningPath/graph inspection plus existing Product selection in `scripts/generate_canonical_runtime.py`; reproduce ordered semantic steps and selection/revalidation behavior, not arbitrary RDF iteration order. |

Before calling any route equivalent, independently compare both implementations
on the exact same Git pin and dataset fingerprint, with recorded client/version
and query inputs. Establish parity for:

- Named-graph identity and owner/provenance; exact IRIs, blank-node handling and
  literal lexical forms, datatype and language metadata, including decimal values.
- Every supported input filter and its matching rules, graph/type restrictions,
  detail level, stable ordering, bounds/limits, pagination where applicable and
  explicit truncation indicators. A bounded subset is not a complete inventory.
- Exact resource/graph not-found behavior, invalid inputs and errors, and useful
  diagnostics without silently converting failures into empty success results.
- LearningPath identity and owning graph, authored integer step positions and
  ordered targets; exact offering/placement/unit/path selection and validation.
  `--path-id` and `--path-graph-id` must be supplied together, with absolute
  HTTP(S) IRIs; zero paths or ambiguous multi-path requests fail closed. Preserve
  the existing singleton fallback, never select by label/file/RDF iteration order.
- Path validation and repository-relative containment for file inputs, dataset
  assembly diagnostics and read-only query enforcement, as applicable. Do not
  introduce semantic writes, service changes or generated-content authority.

Supplied external local Chemometrics `--file` evidence at `a39c9434` verified only
a subset of scene/path/owner/decimal queries. It does not cover all four functions,
all branches or versions, all filters/detail levels/error paths, or validation
speed. It cannot establish full semantic equivalence or authorize deactivation.

## Validation and integration

Product command: `npm test`; semantic/SHACL, Python and frontend/runtime tests
must pass. Both this command and external commit status
`agent-validator/project-chemie-digital` must succeed on the **exact current PR
head** before integration. Missing, stale, pending, failure or error never count
as passing. The marker `<!-- agent-workflow-validator:project-chemie-digital -->`
is a diagnostic PR comment only, not status success. The external local validator
at `GeRe87/agent-workflow-validator` is a technical checker, not a second
agent-control authority. GitHub Actions remain prohibited.

Accurate scoped documentation checks may establish draft readiness without
claiming full validation. This milestone authorizes worker implementation only:
no full suite or GitHub invocation. The coordinator performs focused documentation
checks, independent source review and handoff; PCC alone owns the separately
authorized Draft PR step. The worker must report unrun tests and outstanding
integration gates rather than infer success. Reconciled heads require fresh
review and validation after relevant changes merge into `main`.

Keep direct owner approval for actual PR integration, publishing, deployments,
breaking ontology changes and legal/privacy/examination decisions. Do not change
visibility/access/protected settings or credentials, remove accepted requirements,
claim pedagogical effectiveness without evidence or expose secrets in evidence.

## Existing decisions and pending reviews

Existing draft PRs #185–#277 and #280, decisions, scientific corrections,
historical approvals, issues and handoffs retain their existing status. Neither
historical approval nor unresolved findings are silently invalidated or expanded
by this draft; unaccepted work remains subject to independent review. Branch-local
workflow state confers no new permission or acceptance. This proposal neither
completes Issue #184 nor accepts any existing draft PR.
