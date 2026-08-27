# Validated semantic authoring draft workflow

Phase 3 provides a first local authoring boundary for graph-backed scene definitions. It is intentionally **not** a graphical editor and it does not make Fuseki writable.

The canonical authority remains:

```text
ontology/dataset/*.trig
```

The authoring v0.1 flow is:

```text
canonical Dataset (read only)
        +
complete local scene-graph candidate
        |
        v
Dataset contract + canonical SHACL policy
        |
        v
deterministic renderer-neutral SceneDocument preview
        |
        v
review-only promotion manifest
        |
        v
explicit human/repository review
```

No authoring command writes canonical TriG, commits Git changes, calls GitHub, or performs SPARQL Update.

## Scope

The first supported target is exactly one named graph:

```text
https://w3id.org/project-chemie-digital/graph/scenes/standard-deviation
```

The draft is a **complete candidate replacement** for that graph. Patch/merge semantics, ontology editing, specification/scientific-content editing and concurrent authoring are outside this increment.

Generated draft state lives under:

```text
.local/authoring/standard-deviation-scenes/
```

`.local/` is ignored by git and may be deleted at any time without changing the canonical project.

## 1. Create or refresh the local draft

From the repository root:

```powershell
npm run authoring:checkout
```

If the workspace already exists and you intentionally want to discard it:

```powershell
npm run authoring:checkout -- --force
```

The command writes:

```text
.local/authoring/standard-deviation-scenes/draft.json
.local/authoring/standard-deviation-scenes/candidate.trig
```

`draft.json` records the exact canonical Dataset fingerprint used for checkout. `candidate.trig` contains only the complete Standardabweichung scene named graph assembled from all canonical TriG inputs that contribute to that graph.

The command does not modify any file under `ontology/dataset/`.

## 2. Edit the local candidate

Edit only:

```text
.local/authoring/standard-deviation-scenes/candidate.trig
```

The v0.1 boundary rejects candidates that:

- contain default-graph data;
- contain another named graph;
- omit or rename the supported scene graph;
- target multiple graphs;
- were checked out from a stale canonical Dataset fingerprint.

The scene graph may refer to canonical concepts/resources in other graphs, but those other graphs are not copied into or authored through the draft.

## 3. Validate with structured SHACL feedback

Run:

```powershell
npm run authoring:validate
```

The command first assembles the current canonical Dataset and fails closed if its fingerprint differs from the draft base fingerprint. It then replaces the supported scene graph **in memory only**, applies the existing Dataset contract, and uses the same SHACL policy as `npm run check:semantics`.

Outputs:

```text
.local/authoring/standard-deviation-scenes/validation.json
.local/authoring/standard-deviation-scenes/validation.txt
```

`validation.json` is the authoritative future-UI contract. Each diagnostic preserves stable RDF-oriented fields when supplied by SHACL:

```text
severity
focusNode
resultPath
sourceShape
sourceConstraintComponent
value
message[]
```

Diagnostics are deterministically ordered by RDF identity/path/message data. The CLI text file is only a human-readable rendering of the same structured result.

Exit codes:

- `0`: candidate conforms;
- `1`: candidate is valid TriG/authoring input but does not conform;
- `2`: the authoring boundary itself rejects the draft, for example stale base, wrong graph identity or malformed TriG.

## 4. Compile the renderer-neutral preview

For a conforming candidate:

```powershell
npm run authoring:preview
```

Output:

```text
.local/authoring/standard-deviation-scenes/preview.scene-document.json
```

The preview uses the existing canonical `compile_scene_document()` path. It does not write or replace:

```text
apps/pitch/src/generated/canonical-runtime.json
```

A no-op draft therefore compiles to the same semantic `SceneDocument` as the canonical Dataset.

## 5. Prepare a review-only promotion bundle

For a conforming, non-stale candidate:

```powershell
npm run authoring:prepare-promotion
```

Output:

```text
.local/authoring/standard-deviation-scenes/promotion-manifest.json
```

The deterministic manifest records:

- exact base Dataset fingerprint;
- target graph IRI;
- candidate file SHA-256;
- candidate Dataset fingerprint;
- validation report SHA-256 and conformance state;
- preview SHA-256 and SceneDocument identity;
- `canonicalWritePerformed: false`.

`status: ready-for-human-review` means only that the candidate has passed the local authoring gate. It does **not** mean that the candidate has been published, committed or copied into canonical TriG.

There is deliberately no automatic `promote`, `commit`, `push` or SPARQL Update command in v0.1.

## 6. Canonical changes after review

Canonical write-back remains an explicit repository/human workflow outside this increment. Because the target named graph is currently assembled from more than one canonical TriG file, promotion cannot safely be modeled as an automatic file overwrite without a separately reviewed source-allocation policy.

Any later write path must preserve:

1. TriG as sole authored authority;
2. named-graph ownership;
3. SHACL validation;
4. deterministic compiler output;
5. explicit human review;
6. stale-base/conflict rejection.

## 7. Normal project behavior remains independent

The authoritative repository validation remains:

```powershell
npm test
```

It exercises authoring regressions without requiring:

- a running Fuseki service;
- prepared Fuseki binaries;
- public network access;
- an existing `.local/authoring/` draft.

Fuseki remains localhost/read-only as introduced by Issue #82. Authoring v0.1 performs no HTTP request to Fuseki.

## 8. Suggested owner acceptance after exact-head validation

On the exact validated PR branch:

```powershell
npm run authoring:checkout -- --force
npm run authoring:validate
npm run authoring:preview
npm run authoring:prepare-promotion
```

Expected:

- validation reports `Conforms: yes` and no diagnostics;
- preview identifies the canonical Standardabweichung SceneDocument;
- promotion status is `ready-for-human-review`;
- `promotion-manifest.json` contains `"canonicalWritePerformed": false`;
- `git status --short` shows no canonical/source change caused by the commands because `.local/` is ignored.

The local draft may then be removed safely:

```powershell
Remove-Item -Recurse -Force .local\authoring\standard-deviation-scenes
```
