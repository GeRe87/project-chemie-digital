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

It rejects stale base Dataset fingerprints, default-graph data, wrong graph identity, multiple populated named graphs, malformed TriG and unsupported metadata/target identities.

No command writes `ontology/dataset/`, Git, GitHub or Fuseki.

### Existing Dataset contract and SHACL policy reused

`scripts/validate_semantics.py` exposes `validate_dataset(dataset)` using the same pySHACL configuration already used by canonical `check:semantics`: existing shapes graph, RDFS inference, no warning/info relaxation, meta-SHACL enabled and full report behavior. Authoring therefore does not maintain a parallel rule set.

### Structured validation feedback

A validation writes `validation.json` and `validation.txt`. The JSON result is authoritative for a future UI and contains deterministic diagnostics with severity, focus node, result path, source shape, source constraint component, value and message data. The pySHACL report graph is canonicalized before diagnostic extraction.

`packages/semantic-client/src/authoring-contract.mts` defines matching renderer-neutral TypeScript contracts and explicit `1.0` versions. It contains no Fuseki mutation or browser behavior.

### Deterministic renderer-neutral preview

For a conforming draft, `authoring:preview` calls the existing `generate_canonical_runtime.py::compile_scene_document(candidate_dataset)` and writes only `.local/authoring/standard-deviation-scenes/preview.scene-document.json`. It does not replace the normal generated runtime artifact.

### Review-only promotion preparation

`authoring:prepare-promotion` requires a non-stale conforming draft and writes a deterministic manifest containing exact base Dataset fingerprint, target graph IRI, candidate file SHA-256, candidate Dataset fingerprint, validation report identity, preview identity, `status: ready-for-human-review` and `canonicalWritePerformed: false`.

There is intentionally no automatic promote/write/commit/push/SPARQL Update command.

## Commands

```powershell
npm run authoring:checkout -- --force
npm run authoring:validate
npm run authoring:preview
npm run authoring:prepare-promotion
```

Detailed behavior and cleanup are documented in `docs/semantic-authoring.md`.

## Automated regression coverage

`tests/test_semantic_authoring.py` covers:

1. checkout candidate reparses to the same target-scene triple count and an RDF-isomorphic graph;
2. no-op rebuilt candidate Dataset fingerprint equals the canonical Dataset fingerprint;
3. `compile_scene_document()` leaves the supplied Dataset fingerprint unchanged;
4. valid no-op checkout validates with no diagnostics;
5. no-op preview equals the canonical compiled SceneDocument;
6. validation, preview and promotion outputs are byte/digest deterministic across repeated runs;
7. authoring commands leave every canonical TriG source byte-identical;
8. stale base fingerprints fail closed;
9. wrong and multiple named-graph candidates fail closed;
10. default-graph data fails closed;
11. a deliberately invalid scene item produces structured SHACL violation feedback and cannot preview/promote.

`packages/semantic-client/test/authoring-contract.test.mts` guards the explicit contract versions.

Because these tests are discovered by the existing Python/semantic-client test commands, ordinary root `npm test` remains Fuseki-service-free and authoring-network-free with respect to authoring. No authoring test requires Fuseki to be prepared or running.

## First validator repair — stable Dataset identity across fresh parses

The first published PR head `2884c9615c932867958949ebaadfca1e225a6900` failed because independently fresh canonical Dataset assemblies could receive different stale-base fingerprints when the old implementation hashed concrete canonical N-Quads blank-node labels.

Repair:

- `canonical_nquads()` remains the valid Fuseki snapshot serializer and retains the multiline/control-character escaping repair;
- `dataset_fingerprint()` is separate from concrete serialization;
- every populated named graph contributes RDFLib's blank-node-aware `IsomorphicGraph.graph_digest()` together with its named-graph IRI;
- SHACL content remains in scope, named-graph moves change Dataset identity, parser-local blank-node identifiers do not.

Additional `tests/test_rdf_dataset.py` regressions require independent fresh assemblies to converge, equivalent blank-node graphs to hash equally, distinct graph identities to hash differently, source-file-order independence and the valid N-Quads roundtrip to remain intact.

## Second validator repair — one canonical test module boundary plus explicit RDF roundtrip proof

The repaired head `cc072671d37ee06e7d0d23f9cfe53621a9749359` passed every new Dataset-fingerprint regression and all Fuseki N-Quads/Jena regressions. The only remaining failure was the no-op authoring equality assertion.

The second investigation found that `tests/test_semantic_authoring.py` executed `scripts/rdf_dataset.py` and `scripts/generate_canonical_runtime.py` a second time under duplicate test-only module objects even though `semantic_authoring.py` had already imported the canonical repository modules normally. The failing assertion therefore compared workflow output against a parallel test module boundary rather than the exact module boundary used by the workflow.

The second repair does not weaken semantic equality:

- the test reuses the exact `rdf_dataset` and `generate_canonical_runtime` module instances imported through the authoring workflow;
- checkout/reparse is explicitly required to preserve target graph triple count and RDF isomorphism;
- failures produce deterministic canonical-row missing/added diagnostics;
- the full rebuilt no-op candidate Dataset fingerprint must still equal the canonical Dataset fingerprint;
- the scene compiler is explicitly required not to mutate Dataset identity;
- the production fingerprint implementation from the first repair remains unchanged.

A separate repair note is recorded in `.agents/handoffs/issue-84-roundtrip-repair.md`.

No semantic source, SHACL rule, scene content, Fuseki write behavior or browser runtime was changed by either validator repair.

## Worker-side evidence and limitations

Static branch/diff inspection confirms no file under `ontology/dataset/`, no Reveal/browser/pitch file and no Fuseki runtime/start/query implementation changed. The feature diff remains limited to authoring workflow/contracts/tests/docs, the small canonical-SHACL-policy reuse refactor, the Dataset-fingerprint repair and its test/handoff evidence.

No repository-wide `npm test` result is claimed from this connector-oriented worker environment. The installed exact-head validator remains the authoritative automated merge gate.

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

Not implemented: automatic canonical TriG overwrite, automatic commit/PR generation, Fuseki/SPARQL mutation, browser/CodeMirror TriG editor, arbitrary specification/scientific-content editing, ontology/SHACL authoring, multi-user/concurrent authoring, self-study renderer, learner-state export, accounts, collaboration or telemetry.
