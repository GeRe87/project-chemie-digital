# Private Fuseki draft MCP (Windows, opt-in)

`scripts/fuseki_dev.py` is a narrow stdio sidecar for an **operator-authorized,
single English language-tagged literal replacement**. It is not a repository
control plane, installer, general editor, SPARQL console or publishing tool.
The normal `scripts/fuseki_local.py` launcher remains read-only and unchanged.
No RDF content or external service is changed by installing these three files.
Python 3.11+ is required.

## Local serial Windows M6 read-only check

This separate operator procedure uses the existing read-only launcher, not the
private write adapter below. Run one pinned checkout/profile at a time:

1. Use a clean checkout at an independently approved exact commit. Record
   `git rev-parse HEAD` and `git status --porcelain` (must be empty). Provision a
   fresh local Python virtual environment with the existing Product dependencies,
   activate it, and use Node.js 22+ and Java 21+. Do not reuse an old NQ snapshot.
2. Generate a new NQ using the existing writer with RDFLib literal normalization
   disabled for the whole assembly. From the checkout root in PowerShell:

   ```powershell
   python -c "import sys, rdflib; sys.path.insert(0, 'scripts'); rdflib.NORMALIZE_LITERALS=False; from fuseki_local import write_snapshot; write_snapshot()"
   Get-FileHash .local\fuseki\canonical-dataset.nq -Algorithm SHA256
   Get-FileHash .local\fuseki\apache-jena-fuseki-6.2.0\fuseki-server.jar -Algorithm SHA256
   ```

   Compare the new NQ byte SHA-256 with the independently approved snapshot pin,
   not just the generated fingerprint sidecar. Require the pinned Fuseki 6.2.0
   JAR SHA-256 `2c92c598e65ab69d99820052e05f4277ed1d77980a8845f87545ad35b71a76ee`.
   Stop on any mismatch; do not approve a new pin merely because it was generated.
3. Require port 3030 to be free before starting. Inspect
   `Get-NetTCPConnection -State Listen -LocalPort 3030 -ErrorAction SilentlyContinue`;
   an inspection error is not evidence that the port is free. Do not stop a foreign
   process. Start `npm run fuseki:start` in the foreground and retain its console
   output in an operator-owned log. In a second terminal, verify the listener is
   loopback-only and record its `OwningProcess`. Inspect that PID with
   `Get-CimInstance Win32_Process -Filter "ProcessId = <owned-PID>"`: bind the owned
   JVM command line to this checkout's pinned JAR and freshly hashed snapshot.
   Retain checkout, PID, JAR, snapshot and log evidence together.
4. In that second terminal select the explicit local endpoint and profile:

   ```powershell
   $env:CHEMIE_DIGITAL_SPARQL_ENDPOINT = 'http://127.0.0.1:3030/chemie-digital/query'
   npm run fuseki:check -- --profile talks
   # For the Chemometrics snapshot instead:
   # npm run fuseki:check -- --profile chemometrics
   ```

   Zero arguments still select Chemometrics. Unknown, extra or missing profile
   arguments are refused before HTTP. Talks checks the canonical thanks scene's
   `SceneDefinition` type in its named graph with ASK. Success is a liveness/profile
   proof, not snapshot identity: the separately approved NQ hash remains necessary.
   Full pySHACL validation with RDFS inference and Meta-SHACL remains binding.
5. Stop the foreground launcher with Ctrl+C. Verify the owned launcher/JVM have
   exited and port 3030 has no listener before switching checkout, snapshot or
   profile. If cleanup is incomplete, stop and investigate only owned processes.

This procedure changes no port or dataset configuration, RDF, Jena/TDB2 setup,
external service or hosting. The private write adapter and its authorization
requirements remain unchanged. Operator validation commands for the CLI tests are
`node --experimental-strip-types --test packages/semantic-client/test/preflight.test.mts`
and the existing `npm run test:semantic-client`; these are not live Fuseki proof.

## Operator prerequisites and trust boundary

Run only in an active native CAC Product attempt on Windows. Use the existing
CAC MCP opt-in mechanism to register this executable as a **stdio** server for
that attempt; do not add a daemon, TCP MCP transport, repository configuration,
new gate or globally enabled server. The coordinator provisions the manifest,
private files and authorization independently of the agent. Tool arguments
cannot supply any authorization, paths, queries or replacement text.

The operator must provide:

- A clean, committed native Product worktree containing the reviewed tools,
  with independently approved exact HEAD and tree pins. Execute the script
  from that worktree, not a copied script or historical Lab checkout.
- A separately pinned, clean Product source worktree and its canonical NQ
  baseline. The baseline may be at the original content commit while the
  native tools checkout includes this adapter. There is no hardcoded content
  commit, graph, lesson, subject or source-file fixture.
- Trusted, normalized absolute paths (including canonical Windows casing),
  without symlinks, junctions or other reparse points. Provision private ACLs
  restricting the manifest, baseline, receipts, logs, checkpoint and outputs
  to the operator/CAC identity. `trusted_roots` is an operator assertion, not
  an ACL installer or defense against a malicious operator/administrator.
- An already installed Java 21+ executable with an independently approved
  SHA-256, the supported Fuseki 6.2.0 `fuseki-server.jar` (SHA-256
  `2c92c598e65ab69d99820052e05f4277ed1d77980a8845f87545ad35b71a76ee`),
  and PowerShell 7 (`pwsh`) with working `Get-NetTCPConnection` access.
  This adapter never downloads or installs anything.
- A fresh isolated Python environment with existing Product dependencies and
  the optional operator SDK pinned to **`mcp==2.0.0`**. MCP imports occur only in
  the stdio entry point. The SDK is deliberately not added to Product requirements.
  No editable installation is needed.

Example operator provisioning commands (not executed by the implementation
worker; use independently approved local paths and SDK provisioning):

```powershell
py -3.11 -m venv C:\private\fuseki-draft-env
C:\private\fuseki-draft-env\Scripts\python.exe -m pip install -r scripts\requirements-static-build.txt
C:\private\fuseki-draft-env\Scripts\python.exe -m pip install mcp==2.0.0
```

The transport uses MCP 2.0.0 low-level constructor callbacks (`on_list_tools`
and `on_call_tool`), not decorator registration. Discovery returns a typed
`ListToolsResult`, empty on a stale binding. Calls return typed `CallToolResult`
values; omitted protocol arguments (`None`) mean `{}`, while explicit non-object
arguments, extra keys and unknown tools are refused. Full RDF preflight remains
at startup; this transport-only correction does not defer authorization checks.

Clear `JAVA_TOOL_OPTIONS`, `_JAVA_OPTIONS`, `JDK_JAVA_OPTIONS` and `CLASSPATH`;
their presence, even with empty values, is refused. Use the pinned Java path,
not a shell wrapper. Keep the source, native worktree and private inputs
unchanged and inaccessible to concurrent untrusted writers throughout a run.
OS checks cannot eliminate all adversarial check/use races.

## Startup and native binding

For the existing CAC stdio registration, the command is the isolated Python
executable, and the argument array is equivalent to:

```powershell
C:\private\fuseki-draft-env\Scripts\python.exe scripts\fuseki_dev.py --manifest C:\private\open.json --manifest-sha256 <independently-approved-64-hex-digest>
```

Use the script's absolute path from the pinned native worktree in the actual
registration. The working directory is that worktree. Do not launch it as an
unbound interactive substitute for CAC. Never put a private token in command
arguments. Supply the manifest hash through the operator's trusted launch
configuration, not by having the agent compute and approve its own manifest.
The hash authenticates the exact UTF-8 manifest bytes, including whitespace.

Startup reads the **actual inherited** `CF_AGENTCTL_ATTEMPT_IDENTITY` JSON
array: `[outcome-token, positive-attempt-number, artifact-directory,
outcome-path]`. It checks all four exact values and their types against the
current native `state.json` fields `active_worker_outcome_token`,
`active_agent_attempt`, `active_agent_artifact_dir`, and
`active_worker_outcome_path`. The state must be physically the same file,
`status: running`, project `project-chemie-digital`, with exact `run_id`,
`run_dir`, `worktree` and selected `head_sha` (or `base_sha` when null).
Git root, HEAD, tree and cleanliness are checked independently. An absent or
stale native identity is refused; no manifest/tool field substitutes for it.
The attempt SHA is SHA-256 of `packed(identity)`, as defined below; the token
itself is never returned in MCP results or checkpoint receipts.

Both worktrees must be clean, including untracked files; assume-unchanged and
skip-worktree index entries are refused. The source assembly inputs come from
Git's pinned `ontology/dataset/` tree, not an agent path list. Their bytes are
checked against Git (allowing checkout CRLF only), assembled with the existing
`rdf_dataset.assemble_dataset`, and pinned throughout the process. Existing
`parse_trig_path` newline semantics apply. Executed tool-module bytes, source
bytes, native state, manifest and Java/JAR pins are rechecked around operations.
Source parsing, patch preflight and export reassembly temporarily disable RDFLib
literal normalization, preserving spellings such as `"09.80"^^xsd:decimal`.
The synchronous workflow restores the prior setting even on failure; importing
the adapter does not change it. Live SELECT decoding uses `normalize=False`.
Do not share a workflow operation with concurrent in-process RDFLib parsing.

## Manifest schema 1

Unknown or missing fields and duplicate JSON keys are refused. All digest
strings are lowercase hex (40 characters for Git SHA-1 HEAD/tree, 64 for
SHA-256). There are no optional fields: the three resume approvals are JSON
`null` in open phase. `packed(value)` means UTF-8 of
`json.dumps(value, sort_keys=True, indent=2) + "\n"`, using Python's default
ASCII escaping. Receipts must have exactly these canonical bytes.

Top-level fields:

| Fields | Contract |
| --- | --- |
| `schema` | Integer `1` (not boolean). |
| `trusted_roots` | Nonempty array of private trusted absolute roots containing all configured paths and the manifest. |
| `state_path` | Current actual native run's `state.json`. |
| `run_id` | Current native run identifier. |
| `native_root`, `native_head`, `native_tree` | Exact executing Product tools worktree and independently approved Git pins. |
| `phase` | `open` or `resume`. |
| `product_root` | Clean, separately pinned original source worktree. |
| `baseline_path` | Existing canonical original NQ bytes, equal to fresh source assembly. |
| `java`, `java_sha256`, `jar`, `jar_sha256` | Existing executable/JAR absolute paths and byte pins. |
| `output_dir` | Fresh nonexistent private directory, outside and non-overlapping with both checkouts and trusted inputs. |
| `checkpoint_path`, `receipt_path` | Open: exactly `output_dir/checkpoint/dataset.nq` and `output_dir/checkpoint/receipt.json`. Resume: existing independently approved open artifacts, non-overlapping with the new output directory. |
| `prior_receipt_sha256` | Open: null. Resume: independently approved digest of the original receipt bytes. |
| `opening_run_id` | Open: null. Resume: independently approved opening run ID, different from current run. |
| `opening_attempt_sha256` | Open: null. Resume: independently approved opening attempt digest, different from actual current attempt digest. |
| `material` | Object with exactly the fields below. Identical in both runs. |

All material values are nonempty strings:

| Fields | Contract |
| --- | --- |
| `product_head`, `product_tree` | Exact original source Git pins. |
| `baseline_nquads_sha256` | SHA-256 of canonical original assembled NQ. |
| `source_file` | One existing tracked direct `ontology/dataset/*.trig` relative POSIX path. |
| `source_file_sha256` | Exact original checkout file-byte digest, including its physical line endings. |
| `graph`, `subject`, `predicate`, `owner_type` | Exact safe absolute IRIs in `https://w3id.org/project-chemie-digital/`. No fixture is hardcoded. |
| `language`, `datatype` | Exactly `en` and `http://www.w3.org/1999/02/22-rdf-syntax-ns#langString`. Plain/other typed literals are deliberately unsupported. |
| `old_sha256` | Digest of the **whole decoded original literal's** UTF-8 lexical value, not its TriG encoding. |
| `lexical_old`, `lexical_new` | One unique decoded lexical substring and its replacement. Must differ. |
| `raw_old`, `raw_new` | One unique concrete UTF-8 TriG byte substring and replacement. Must differ. JSON encoding adds its own escape layer. |

For example, inserting a decoded line break may use `lexical_new` containing
JSON `\n`, but `raw_new` containing JSON `\\n` when the TriG uses escaped
line breaks. Long-string physical line breaks work too. The whole pinned old
literal, exact language metadata, raw anchor and full reassembly jointly bind
the patch. Comments, quoting, prefix spelling, escapes, syntax and unrelated
bytes remain untouched; the file is never reserialized.

The target must have an explicit `owner_type` in the exact named graph and
unique typed ownership across graphs. The owner file must contain that type
and old literal; no other assembly file may define the subject's type or old
term. Exactly one English value at the target is required. Other predicates,
languages, graphs, shapes, blank nodes and typed lexical values are preserved
by complete canonical dataset comparison. Existing dataset ownership rules
also apply.

## Four tools and phase/checkpoint binding

Each call accepts **only `{}`**. No arbitrary SPARQL, file path, literal or
configuration input is exposed. Wrong phase, repeated calls, stale pins and
out-of-order operations are refused. A partially executed operation is
terminally failed; start a new independently authorized run rather than retry.

1. **Open run: `draft_open({})`.** Before private output or Java creation,
   authenticate manifest, native binding, clean source, canonical baseline,
   owner, whole lexical old/new terms and concrete patch reassembly. Launch a
   fresh in-memory JVM from the baseline. Read the complete named dataset and
   verify the original fingerprint/owner, then recheck native binding and all
   pins immediately before sending the one fixed generated SPARQL DELETE/INSERT. Read back and verify exact expected
   dataset-wide RDF term equality, then terminate the owned JVM and prove
   cleanup. Only then write canonical private `dataset.nq` and `receipt.json`.
2. The operator reviews those artifacts, their operation/material pins and the
   proposed minimal replacement. Independently approve the receipt digest,
   opening run and opening attempt digest. The opening attempt ends. Do not
   treat self-described receipt hashes as authorization.
3. **Independent resume run: `draft_resume({})`.** Use a new actual CAC run
   and attempt, the same reviewed native tools HEAD/tree and material pins,
   a new fresh output directory and the independently approved receipt fields.
   Checkpoint and canonical receipt bytes must bind the complete operation,
   opening identity and exact expected canonical NQ. Wrong/stale authorization
   fails before directory creation or Popen. A new read-only JVM loads the
   checkpoint with `--file` and **without `--update`**, reads back the full exact
   draft, and proves cleanup. The client also refuses any resume mutation POST.
4. **`draft_validate({})`.** Validate that real resume live read-back with
   existing `validate_semantics.validate_dataset(dataset)` defaults: full
   pySHACL, RDFS inference and meta-SHACL. No cache, shortcut or new validator.
   Preserve and reverify the input; bind the successful fingerprint. Private
   `validation.txt` records the existing report. A failure prevents export.
5. **`draft_export({})`.** Require the exact validated fingerprint. Stage one
   owner-file copy with exactly the concrete raw replacement in a temporary
   private directory outside `output_dir/export`. Reassemble the original
   complete source using that override through `assemble_dataset(trig_paths=...)`.
   Require exact candidate bytes, canonical equality to validated live NQ and
   a final binding/pin recheck. Only then atomically rename the verified file
   into `output_dir/export/<source_file>` and emit deterministic UTF-8
   `authored.diff`. Staging is cleaned on success and refusal; failed comparison
   leaves neither an eligible export nor a diff. Never write the source,
   clone/commit a candidate, edit further, publish or merge.

Receipt schema (canonical JSON) has exactly `schema: 1`, `opening_run_id`,
`opening_native_head`, `opening_native_tree`, `opening_attempt_sha256`,
`operation`, `operation_sha256`, and `dataset_sha256`. `operation` contains the
complete `material` object, whole decoded `old_sha256` and `new_sha256`, and
expected canonical `dataset_sha256`. Its digest is SHA-256 of `packed(operation)`.
Receipt digest approval is over **all receipt bytes**, not an embedded field.

Each successful tool also writes a private `<tool-name>.json` evidence file.
Open/resume evidence includes the actual JVM PID, selected port, mutation attempt
count (`updates`), actual mutation HTTP `update_status` (null if no response),
and proved `cleanup`. A private `<tool-name>-server.json` also records these
fields and the child return code after cleanup, including failed operations.
Only open enables `--update`; at most one mutation attempt is allowed, with no
retry after an ambiguous send. Resume records zero updates and null status.
MCP results include hashes and process evidence, not literal content or tokens.
Startup/transport errors are generic on stderr; tool errors return only
`{"status":"refused"}`. Discovery is empty on stale native binding. Retain
private failure artifacts for operator diagnosis; an incomplete output directory
or candidate without a successful export result is **not an approved export**.

## Process and network limits

Each JVM uses the existing Fuseki supported main class and file-backed memory
configuration, never TDB2 or CDAC. It binds localhost on an internally selected
random port and random dataset path. Before **every HTTP POST**, including
readiness, queries and mutation, PowerShell OS listener inspection must confirm
that the live owned Popen PID owns the exact IPv4 loopback listener and that no
foreign or wildcard listener shares the port. Empty startup inspection alone
may be retried; malformed/foreign inspection fails closed. The HTTP client
ignores proxy environment settings and refuses all redirects, including 307/308.
Responses are bounded. No endpoint is returned as an agent capability.

Only the child created by this process is terminated/killed. Cleanup requires
its exit and the disappearance of the selected IPv4 listener, even after a
partially failed start. A cleanup failure refuses the operation. Nothing
survives as a supported daemon; no unrelated process is signalled.

## Tests and coordinator proof

Focused offline tests live in `tests/test_fuseki_dev.py`. They exercise SDK-free
import, exact empty arguments, schema/pin refusal before side effects, native
state/attempt binding, receipt authorization, unique owner, full canonical
blank-node equality, escaped multiline SPARQL replacement, lexical preservation,
validation ordering/failure, candidate reassembly, source-byte preservation,
redirect refusal, listener ownership and owned-child cleanup.

In a fresh Product dependency environment, the coordinator can run:

```powershell
python -m unittest discover -s tests -p test_fuseki_dev.py
```

These tests mock process/network/native provisioning and the validator result
for contract tests; they do **not** establish actual MCP compatibility, Java
startup, Windows listener permissions or semantic conformance of a live draft.
No Product tests were run by the implementation worker: this workspace exposes
no configured validation mechanism. No environment or SDK installation was
performed by that worker either.

The coordinator must execute the real two-run native stdio proof, including the
actual malformed/stale pin refusal, independent resume JVM, full existing
pySHACL validation, cleanup evidence, and exact preapproved candidate diff. The
Level-8 `ex:l8-script-ch3` / `cd:body` / `@en` fixture and preapproved diff
`a68b842b` are coordinator inputs only, not implementation defaults or claimed
proof. Operator review and authorization remain required; passing focused tests
never approves content, publication or integration.
