# Private CAC semantic reads

`scripts/cac_semantic_read.py` is a read-only Product stdio MCP server. It exposes
exactly `semantic_inventory`, `semantic_search`, `semantic_inspect`, and
`learning_path_inspect`. It does not replace agentctl repository/diff tools or
Product CLI `authoring:preview`. It does not expose Content/Preview, SPARQL,
shell execution, file arguments, URLs to fetch, GitHub, or a listening service.
There is no automatic installation, activation, migration, or deactivation.

## Trust and launch

An operator must review the exact committed source before execution. Load trusted
server code from a separate, reviewed, operator-controlled Product checkout, **not
from the mutable writer's workspace**. Data comes from a separately bound clean
checkout. Both reused Product modules must be byte-identical between those
checkouts; an existing candidate server file must also match resident code. Only
trusted code is imported by absolute module location. No query/data directory is
added to `sys.path`; legacy Control code is never imported or invoked.

Use Python 3.11+ with the CAC host's approved **mcp 2** low-level package and the
Product RDF dependencies already provisioned in a private virtual environment.
There are no Product manifest changes or runtime installers. The environment
must be prepared and reviewed by the operator; do not silently use a global or
editable Product installation. For development, create a fresh local environment:

```text
python -m venv <PRIVATE_DEVELOPMENT_VENV>
```

Provision its dependencies through the operator's approved local process, then
run the focused test command below. The server itself never installs anything.

Controlled invocation (all angle-bracket values are **literal operator-bound
placeholders**, not shell substitutions supplied by the agent):

```text
<PRIVATE_VENV_PYTHON> -I -B <REVIEWED_EXTERNAL_CHECKOUT>/scripts/cac_semantic_read.py --state-path <CANONICAL_NATIVE_RUN_DIR>/state.json --run-id <EXACT_NATIVE_RUN_ID> --worktree <PHYSICAL_BOUND_DATA_CHECKOUT> --expected-head <EXACT_40_LOWERCASE_HEX_HEAD>
```

The native OpenCode child must inherit `CF_AGENTCTL_ATTEMPT_IDENTITY` from CAC.
Never print, copy into configuration, synthesize, or persist its secret values in
test evidence. Startup, catalog requests, and calls check the binding. Calls check
again even after query errors; partial data is not returned after a failed check.
Refusals are noninteractive and sanitized. Startup errors emit only a fixed
message to stderr; stdout is reserved for MCP. EOF closes the stdio context; no
background process, database, network server, or temporary dataset is created.

### Explicit state contract (operator compatibility gate)

This implementation requires a JSON object in the regular canonical file
`<run_dir>/state.json`, with these exact fields:

| Field | Required value/type |
| --- | --- |
| `status` | `"running"` |
| `project` | `"project-chemie-digital"` |
| `run_id` | exact launch run ID |
| `run_dir` | canonical physical state parent, absolute string |
| `worktree` | exact canonical physical data checkout, absolute string |
| `head_sha` | exact launch SHA |
| `active_worker_outcome_token` | nonempty string |
| `active_agent_attempt` | positive integer, not boolean |
| `active_agent_artifact_dir` | nonempty string |
| `active_worker_outcome_path` | nonempty string |

The inherited identity must be a JSON array of exactly the last four values in
that order, with exact types. All native state bytes are pinned for the process
lifetime; even unrelated state changes require a fresh launch. Paths must be
absolute and canonical, with no symlinks, junctions, or reparse ancestors. The
operator must verify these field names, types, and canonical filename against
the actual native CAC state before enabling this candidate. The worker has no
control-plane state read API: native schema compatibility is **not yet proven**.
Do not create a fake state wrapper, relax the checks, or claim native availability
if this contract differs; arrange a separately reviewed Product correction.

No GitHub origin URL is required. A CAC local seed origin is legitimate. Authority
is the reviewed code, physical verified data checkout, native state and inherited
attempt identity—not a caller-selected origin. Git uses a pinned executable,
fixed read-only command forms, explicit semantic source paths, sanitized Git
routing environment and 15-second command timeouts. The canonical top-level TriG
set must be nonempty, regular and tracked. Ignored additions, nested TriG,
redirected directories, dirty sources (including status-hidden changes), stale
HEAD, foreign roots, source drift, resident code drift, and attempt drift fail
closed. Source blobs are compared with HEAD, permitting only CRLF checkout
normalization. Source signatures still hash actual checkout bytes in legacy order.

## Native OpenCode configuration

Ordinary native CAC `agent_environment` retains an extra local MCP entry in
`OPENCODE_CONFIG_CONTENT`, and its isolated OpenCode child inherits the attempt
environment. The configuration diagnostic has already established the extra
catalog's pending-to-connected transition and inherited sentinel. No CAC change
is needed for that ordinary run profile. This does **not** establish availability
in capability-specific scoped/release modes: `scoped_revision` deliberately strips
extra servers. Do not edit global OpenCode configuration.

Operator-provided run-local fragment, merged with the existing native agentctl
entry rather than replacing it:

```json
{
  "mcp": {
    "pcd": {
      "type": "local",
      "command": [
        "<PRIVATE_VENV_PYTHON>", "-I", "-B",
        "<REVIEWED_EXTERNAL_CHECKOUT>/scripts/cac_semantic_read.py",
        "--state-path", "<CANONICAL_NATIVE_RUN_DIR>/state.json",
        "--run-id", "<EXACT_NATIVE_RUN_ID>",
        "--worktree", "<PHYSICAL_BOUND_DATA_CHECKOUT>",
        "--expected-head", "<EXACT_40_LOWERCASE_HEX_HEAD>"
      ],
      "enabled": true
    }
  },
  "permission": {
    "*": "deny",
    "agentctl_*": "allow",
    "pcd_semantic_inventory": "allow",
    "pcd_semantic_search": "allow",
    "pcd_semantic_inspect": "allow",
    "pcd_learning_path_inspect": "allow"
  }
}
```

Keep deny-by-default permissions. OpenCode prefixes each advertised tool with
`pcd_`: the first three are `pcd_semantic_*`; the fourth is literally
`pcd_learning_path_inspect`, preserving the required `learning_path_inspect` name.
There are no aliases or fifth tool. The catalog/permission names must be checked
in the real native child. Do not include the identity in the configuration.

## Bounded response contract

Responses preserve `chemie-digital.semantic-discovery.v1`. Inventory returns
metadata pages, overview and type counts; search supports identity, type,
owner-graph, case-insensitive label/IRI and exact directed relationship filters.
Inspect returns compact outgoing identity/label/IRI statements or fuller outgoing
and incoming statements. Learning-path inspection requires the exact path and
named graph, uses Product `available_path_references`, orders positive contiguous
positions, retains graph ownership and link identities, and diagnoses all steps
even when the visible page is limited. It does not validate or compile content.

Limits are integer 1..50 (default 20), detail is compact/normal/full (default
compact). Literal limits are 120/600/2400 characters; language, datatype, full
length and truncation remain explicit. Decimal lexical strings are not converted
through float. Response budgets are 16/32/64 KiB minus 256 envelope-reserve bytes.
`response_bytes` is the fixed-point UTF-8 size of sorted, compact, unescaped-Unicode
canonical JSON, not MCP's duplicated envelope. Whole top-level items alone are
dropped for byte limits; total counts and nested page semantics remain stable.
Blank-node statements outside the excluded shapes scope fail closed. Strict
schemas reject arbitrary fields; tool inputs cannot select a filesystem root,
SHA, state path, implementation, or query language.

Known query errors retain bounded legacy error envelopes (`INVALID_ARGUMENT`,
`RESOURCE_NOT_FOUND`, `PATH_NOT_FOUND`, `AMBIGUOUS_POSITION`, `DATASET_INVALID`,
`RESPONSE_TOO_LARGE`). Binding errors include `STALE_HEAD`, `DIRTY_WORKTREE`,
`UNAUTHORIZED_ROOT`, `BINDING_REJECTED`, and `SNAPSHOT_CHANGED`. Raw exceptions,
tokens and host/home paths are not returned. The dataset/fingerprint is assembled
once per process only after binding and manifest checks; every call rechecks
sources and the envelope. Any failure clears the cached dataset.

## Verification and current evidence

Added lightweight tests in `tests/test_cac_semantic_read.py` exercise all four
methods, filters, named-graph metadata, decimal/language metadata, literal and byte
truncation, ordered path diagnostics beyond the page, invalid arguments, independent
binding invariants, cleanup, and cached assembly. Proposed focused command:

```text
<PRIVATE_DEVELOPMENT_VENV_PYTHON> -I -B -m unittest discover -s tests -p test_cac_semantic_read.py -v
```

**Worker execution record:** no test, environment-creation, install, service,
historical-audit or full-suite command was executed. This run exposes no validation
or generator IDs and no shell execution API. Source edits and commit use run-bound
agentctl only. Tests, mcp 2 API compatibility, native state compatibility, real tool
calls and parity are pending; no pass is asserted.

After independent review of the exact committed head, the operator should:

1. Verify the state/identity contract above against real native CAC; verify the
   pinned mcp 2 low-level `Server`, list/call handlers and stdio lifecycle. Run the
   focused tests in a fresh private environment and record exact commands/exits.
2. Compare legacy and candidate using **the same complete Product pin beginning
   `70e2fe66`**, identical dataset bytes/platform and tool arguments. Resolve and
   record the full SHA independently. The legacy oracle cannot read new main
   because it requires the retired workflow registry; do not restore that registry
   or use a historical audit to work around it. The candidate imports no legacy
   code. Compare payloads, including fingerprint, source signature, bytes,
   graph/term metadata, truncation and invalid known errors, not just labels.
3. Run candidate-only checks separately on new main and the exact candidate head.
   Do not compare different oracle/native heads or datasets and call that parity.
   The reviewed external server and the bound data modules must pass parity checks
   before importing Product code; an older pin with differing modules is a refusal,
   not permission to load unreviewed code.
4. In an ordinary native CAC run, make actual calls to all four tools, check the
   isolated server catalog/allowlist, then independently demonstrate refusals for
   stale attempts/HEAD, foreign roots, dirty and ignored TriG, links/reparse escapes
   and state/source/resident drift. Redact secrets and paths from evidence. Stop
   the child by closing its stdio; do not launch an HTTP or database service.
5. Record the independent exact-head review and operator evidence. No self-approval,
   push, merge, global profile removal or automatic legacy deactivation is implied.
