# Issue #140 worker handoff — blocked on summary language contract

## Issue

`#140 — Author source-linked KeyPoints for Chemometrics Mean Values lecture`

## Worker verdict

**Blocked before scientific content mutation.**

The merged KeyPoint semantics from Issue #133 are sufficient for the presentation side of the requested behavior, but the current System-owned dataset-snapshot / pitch-summary path cannot expose the existing English Mean Values detail prose as requested.

## Confirmed working contract

Issue #133 already provides:

```text
LearningResource
  ├── cd:body        -> full authored prose
  └── cd:hasKeyPoint
        ├── KeyPoint(position=1, cd:body=...)
        └── KeyPoint(position=2, cd:body=...)
```

`KeyPointRole + cd:hasKeyPoint` compiles to one renderer-neutral `ListBlock`. The block-level source remains the owning LearningResource and each list item retains the individual KeyPoint source. This is the correct slide-side contract and does not need a new ontology or SceneDocument change.

## Blocking System behavior

### 1. Canonical dataset snapshot drops English detail bodies

`scripts/generate_canonical_runtime.py::dataset_snapshot()` currently sets an entity description only from:

```python
description = literal(dataset, subject, iri(CD, "body"), "de") \
    or literal(dataset, subject, DCTERMS.description, "de")
```

The eleven Mean Values explanatory owner resources in scope for #140 are authored with `cd:body@en`. Their detailed prose therefore does not become the `description` field of the `datasetSnapshot` used by the knowledge-network/text-summary path.

### 2. Pitch summary projection hard-codes German

`apps/pitch/src/graph-summary-shell.ts::projectSceneSummary()` currently constructs the projection request with:

```ts
language: "de"
```

That is incompatible with the current English Chemometrics lecture path when the summary is expected to show the detailed owner prose.

## Consequence

If #140 now changed the eleven Mean Values SceneItems from:

```text
StatementRole + cd:body
```

to:

```text
KeyPointRole + cd:hasKeyPoint
```

then the slides would correctly show concise KeyPoint lists, but the text summary would **not** reliably show the original detailed English owner text. That would violate the central acceptance invariant:

```text
slide   -> concise KeyPoints
summary -> original detailed cd:body
```

## Boundaries respected

No changes were made to:

- `ontology/dataset/chemometrics-basics.trig`;
- `ontology/dataset/chemometrics-mean-values-scenes.trig`;
- any scientific definition, interpretation, formula, example, exercise or KeyPoint;
- shared ontology/SHACL/SceneDocument/runtime code;
- System workflow state;
- active System Issue #138 / PR #139;
- learner state.

No external research was performed.

## Required manager follow-up

Create a bounded **System** prerequisite that makes the canonical dataset snapshot and pitch summary language-aware for the selected presentation/course language, or defines a deterministic supported-language fallback that preserves authored text without inventing translations.

The System increment should at minimum prove that an English `cd:body@en` selected-owner resource can appear as the detailed text/description in the current text-summary path, while existing German paths remain compatible.

After that System prerequisite is merged to `main`, resume Issue #140. Its content scope can remain unchanged: author source-linked KeyPoints for the eleven specified Mean Values resources and switch only their existing StatementRole SceneItems to `KeyPointRole + cd:hasKeyPoint`.
