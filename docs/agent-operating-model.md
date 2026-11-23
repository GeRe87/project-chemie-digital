# Native CAC agent operating model

## Authority

Regular native CAC supports owner-bound Project Chemie Digital work, with Codex
coordination and OpenCode implementation.

The owner supplies the objective, permitted paths and semantic/runtime contract
impact. Neither an inspection result nor a legacy binding grants editing or
automation authority. Agents must not self-approve, widen scope or introduce
hidden side effects. A reviewable draft PR or equivalent may be submitted within
the authorized task's scope; routine draft submission needs no additional general
advance approval when already covered by that authorization. Actual integration,
publishing, deployment and release require explicit owner approval.

## Task lifecycle

1. Owner authorizes a bounded objective, paths and contract impact.
2. Codex coordinates the authorized work; OpenCode implements through native CAC
   on a verified exact, clean, isolated Git base and fresh branch/worktree.
3. Inspect scoped Product sources and contracts through run-bound tools. Preserve
   canonical RDF/TriG, named-graph provenance and existing scientific corrections.
4. Produce an exact local commit, diff and reproducible evidence. Report actual
   check commands/tool calls, outcomes, failures and unrun gates.
5. Submit a reviewable draft PR or user-requested equivalent within the authorized
   task and obtain independent review of the exact commit head; implementation is
   not approval.
6. Before integration, reconcile with current `main` and overlapping PRs, obtain
   independent exact-current-head review, `npm test` success and the required
   external exact-head status. Any changed head requires renewed evidence.
7. The owner makes the explicit integration/release decision. No automatic merge,
   deployment, publication or release follows from implementation completion.

No central `ready/worker`, `blocked/manager` or lease is needed to create a
single lecture scene. An issue is useful but not mandatory for routine lecture
editing. Authority remains bounded by the owner, approved paths and contract
impact, not scheduled workflow state.

## Isolation, inspection and native guards

- Product `main` and active draft PR heads are distinct integration references.
  Verify repository identity/origin, branch, clean status and exact HEAD before
  editing. Never replace or reset an owner's checkout or another PR's worktree.
- Protect remotes, shared configurations, access settings and credentials. Local
  inspection or implementation permission implies no hidden network, push, PR
  creation or other side effect. Draft submission must be covered by the task's
  authorization; it never implies changes to remotes or shared settings.
- Start native inspection with `agentctl_repo_info`; prefer
  `agentctl_implementation_checkpoint` and `agentctl_repo_map` for compact context.
- Use `agentctl_read_product_file` or `agentctl_read_context` for scoped source
  excerpts (for example `AGENTS.md`, `README.md` and this document), and
  `agentctl_search_product_context` for bounded relevant searches.
- Use `agentctl_diff_summary` and `agentctl_file_diff` with repository-relative
  scoped paths to inspect committed and uncommitted changes, rather than broad
  raw diff dumps. Never infer absolute paths or bypass path exclusions.
- Use `agentctl_historical_source_audit` only for an explicitly authorized historical
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

The binding remains unchanged and neither global profile is disabled. Native CAC
use is not a live migration or a universal CDAC replacement. Eligibility for
CDAC deactivation remains unresolved: identify remaining users and prove the
semantic equivalence described below, then obtain separate approval for a
reversible change with a rollback plan. Availability of generic file/diff tools
alone does not satisfy that gate.

CDAC issue #5 records the prior cutover; CDAC PR #6 introduced the read-only
v2-compatible binding. These are external historical references, not proof here
of compatibility approval or operator availability. The requirement to
independently validate that compatibility and make it available to operators
remains in force.

The old workflow registry and active dispatchers have been retired. Immutable
blob references are archived in `docs/legacy-agent-workflow-core/README.md`;
preexisting handoffs remain historical evidence only. Do not reinstate Agent
Workflow Core dispatchers, scheduled turns, claimable states, activeIssue
assignments, leases or retired state files as authorization.

## Read-only semantic compatibility acceptance

The following maps every offered read-only CDAC semantic capability to a candidate
Product-native inspection route, not an already equivalent replacement. It does
not implement a Semantics MCP:

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

A local check of a subset of scene/path/owner/decimal queries cannot establish
full equivalence across all four functions, branches, versions, filters, detail
levels or error paths. It proves neither validation speed nor eligibility for
deactivation; broader claims require independent evidence.

## Product authoring preview and CAC parity

The separately existing Product CLI `npm run authoring:preview` yields a
deterministic renderer-neutral SceneDocument preview for a conforming draft
within the supported authoring boundary. See [semantic authoring](semantic-authoring.md)
for draft preparation, validation, preview outputs and limitations. This preview
does not write canonical TriG, commit changes, call GitHub or perform SPARQL Update.

CAC-native preview parity is a separate open check, not one of the four existing
CDAC semantic read tools. Establishing it requires independent comparison against
the Product CLI on the same Git pin, dataset fingerprint and candidate draft,
including conformance, output semantics, diagnostics and failure behavior. CLI
availability alone establishes neither CAC preview parity nor semantic read-tool
equivalence, and a preview is not integration or publication approval.

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
claiming full validation. Run only authorized checks and report actual outcomes,
unrun tests and outstanding integration gates rather than infer success.
Reconciled heads require fresh review and validation after relevant changes
merge into `main`.

Keep direct owner approval for actual PR integration, publishing, deployments,
breaking ontology changes and legal/privacy/examination decisions. Do not change
visibility/access/protected settings or credentials, remove accepted requirements,
claim pedagogical effectiveness without evidence or expose secrets in evidence.

## Existing decisions and pending reviews

Existing draft PRs #185–#277 and #280, decisions, scientific corrections,
historical approvals, issues and handoffs retain their existing status. Neither
historical approval nor unresolved findings may be silently invalidated or
expanded; unaccepted work remains subject to independent review. Branch-local
workflow state confers no new permission or acceptance. Issue #184 and existing
draft PRs retain their respective open review and acceptance gates.
