# Issue #84 handoff — validated semantic authoring draft workflow

## Worker scope

Role: Semantic Web and Ontology Engineer.

Branch:

```text
agent/84-semantic-authoring-foundation
```

This increment implements the foundation of Phase 3 backlog item 33. It does not implement a graphical editor, canonical write-back, SPARQL Update, self-study rendering or learner-state persistence.

## Implemented boundary

### Canonical authority remains unchanged

`ontology/dataset/*.trig` remains the sole authored semantic authority.

Authoring state is generated under ignored local state:

```text
.local/authoring/standard-deviation-scenes/
```

The v0.1 target is exactly:

```text
https://w3id.org/project-chemie-digital/graph/scenes/standard-deviation
```

A draft is a complete candidate replacement for that one graph, not a patch. Checkout assembles the graph from the same canonical Dataset used by validation, so contributions from multiple canonical TriG files are represented without inventing a second source.

### Exact-base / fail-closed draft contract

`scripts/semantic_authoring.py` records:

- contract version;
- stable draft ID;
- exact canonical Dataset SHA-256 fingerprint;
- one allowed target graph IRI;
- candidate TriG path and checkout content SHA-256;
- deterministic output paths for validation, preview and promotion review artifacts.

Candidate assembly starts from the current canonical Dataset and replaces the supported scene graph **in memory only**.

It rejects:

- stale base Dataset fingerprints;
- default-graph data;
- wrong graph identity;
- multiple populated named graphs;
- malformed TriG;
- unsupported metadata/target identities.

No command writes `ontology/dataset/`, Git, GitHub or Fuseki.

### Existing Dataset contract and SHACL policy reused

`scripts/validate_semantics.py` now exposes:

```python
validate_dataset(dataset)
```

using the same pySHACL configuration already used by canonical `check:semantics`:

- existing shapes graph;
- RDFS inference;
- no warning/info acceptance relaxation;
- meta-SHACL enabled;
- full report rather than abort-on-first.

The existing canonical `run_validation()` and CLI behavior remain on top of this same function.

Authoring therefore does not maintain a parallel rule set.

### Structured validation feedback

A validation writes:

```text
validation.json
validation.txt
```

The JSON result is authoritative for a future UI and contains deterministic diagnostics with:

```text
severity
focusNode
resultPath
sourceShape
sourceConstraintComponent
value
message[]
```

The pySHACL report graph is canonicalized before diagnostic extraction so blank-node-backed result identities are stable. Diagnostics/messages are sorted by RDF identity/path/message data rather than report iteration order.

`packages/semantic-client/src/authoring-contract.mts` defines matching renderer-neutral TypeScript contracts and explicit `1.0` versions. It contains no Fuseki mutation or browser behavior.

### Deterministic renderer-neutral preview

For a conforming draft, `authoring:preview` calls the existing:

```python
generate_canonical_runtime.py::compile_scene_document(candidate_dataset)
```

and writes only:

```text
.local/authoring/standard-deviation-scenes/preview.scene-document.json
```

It does not replace the normal generated runtime artifact. A no-op checkout is regression-tested against the canonical compiled `SceneDocument`.

### Review-only promotion preparation

`authoring:prepare-promotion` requires a non-stale conforming draft and writes a deterministic manifest containing:

- exact base Dataset fingerprint;
- target graph IRI;
- candidate file SHA-256;
- candidate Dataset fingerprint;
- validation report SHA-256/conformance;
- preview SHA-256/SceneDocument identity;
- `status: ready-for-human-review`;
- `canonicalWritePerformed: false`.

There is intentionally no automatic promote/write/commit/push/SPARQL Update command.

## Commands

```powershell
npm run authoring:checkout -- --force
npm run authoring:validate
npm run authoring:preview
npm run authoring:prepare-promotion
```

Detailed behavior and cleanup are documented in `docs/semantic-authoring.md`.

## Automated regression coverage added

`tests/test_semantic_authoring.py` covers:

1. valid no-op checkout validates with no diagnostics;
2. no-op candidate Dataset fingerprint equals the canonical Dataset fingerprint;
3. no-op preview equals the canonical compiled SceneDocument;
4. validation, preview and promotion outputs are byte/digest deterministic across repeated runs;
5. authoring commands leave every canonical TriG source byte-identical;
6. stale base fingerprints fail closed;
7. wrong and multiple named-graph candidates fail closed;
8. default-graph data fails closed;
9. a deliberately invalid scene item with missing `cd:selectionPath` produces structured SHACL violation feedback containing stable focus/path/source identities;
10. invalid drafts cannot produce preview or promotion artifacts.

`packages/semantic-client/test/authoring-contract.test.mts` guards the explicit contract versions.

Because these tests are discovered by the existing Python/semantic-client test commands, ordinary root `npm test` remains service-free and network-free with respect to authoring. No authoring test requires Fuseki to be prepared or running.

## Worker-side evidence and limitations

Static branch/diff inspection confirms:

- no file under `ontology/dataset/` changed;
- no Reveal/browser/pitch file changed;
- no Fuseki runtime/start/query implementation changed;
- `.local/` was already ignored before this increment;
- the feature diff is limited to authoring workflow/contracts/tests/docs plus the small canonical-SHACL-policy reuse refactor.

No repository-wide `npm test` result is claimed from this connector-only worker environment. The installed exact-head validator remains the authoritative automated merge gate.

## Owner acceptance after exact-head validator success

On the unchanged validated PR head:

```powershell
git fetch origin
git switch agent/84-semantic-authoring-foundation
git reset --hard origin/agent/84-semantic-authoring-foundation
npm run authoring:checkout -- --force
npm run authoring:validate
npm run authoring:preview
npm run authoring:prepare-promotion
git status --short
```

Expected:

- `authoring:validate` reports `Conforms: yes` and `Diagnostics: none`;
- preview writes a Standardabweichung SceneDocument artifact;
- promotion reports `Status: ready-for-human-review` and `Canonical write performed: no`;
- `promotion-manifest.json` contains `"canonicalWritePerformed": false`;
- `git status --short` shows no source/canonical changes caused by authoring because generated draft state is below ignored `.local/`.

The local workspace can then be deleted safely:

```powershell
Remove-Item -Recurse -Force .local\authoring\standard-deviation-scenes
```

## Explicit non-goals preserved

Not implemented:

- automatic canonical TriG overwrite;
- automatic commit/PR generation;
- Fuseki/SPARQL mutation;
- browser/CodeMirror TriG editor;
- arbitrary specification/scientific-content editing;
- ontology/SHACL authoring;
- multi-user/concurrent authoring or merge conflict resolution;
- self-study renderer;
- learner-state export;
- accounts, collaboration or telemetry.
