# Issue #84 repair note — SHACL validation purity

## Trigger

The authoritative validator on PR #85 exact head `011632492cb63a20d19f1921049fb5c0cb74758b` confirmed that the scene checkout/reparse roundtrip is RDF-isomorphic and preserves its triple count, while the no-op candidate Dataset equality still failed.

The decisive evidence was the stable difference between the Dataset fingerprint calculated before canonical SHACL validation and the fingerprint calculated after it. `validate_semantics.py::validate_dataset()` already built a detached data-union graph, but passed `dataset.graph(SHAPES_GRAPH)` directly to pySHACL. That object is a live view backed by the supplied Dataset store.

## Root cause boundary

Canonical SHACL validation was not observationally pure with respect to the caller-owned Dataset. pySHACL is allowed to enrich or otherwise mutate graph objects during inference/meta-SHACL processing; a live Dataset-backed shapes graph therefore allowed validator-internal graph changes to become visible to subsequent Dataset fingerprint calculations.

No evidence remains of scene-candidate serialization loss:

- checkout/reparse target scene triple count is preserved;
- checkout/reparse target scene graph is RDF-isomorphic;
- the Dataset fingerprint implementation's fresh-assembly, blank-node and named-graph regressions are green;
- Fuseki N-Quads/Jena regressions are green.

## Repair

`scripts/validate_semantics.py` now establishes two detached validation inputs:

1. `dataset_union(dataset)` remains a new independent Graph for non-shapes data;
2. `detached_graph(dataset.graph(SHAPES_GRAPH))` copies the canonical shapes triples into a new independent Graph before invoking pySHACL.

No live Dataset graph view crosses the pySHACL boundary.

`run_validation()` captures the canonical Dataset fingerprint before validation. Because validation is now required to be pure, the before/after identity is expected to remain equal; calculating the report identity before validation also prevents validator-internal behavior from defining repository Dataset identity.

## Regression

`tests/test_semantic_validation.py::test_canonical_validation_is_observationally_pure` now requires all of the following to be unchanged before versus after `validate_dataset(dataset)` on the same canonical Dataset object:

- logical Dataset fingerprint;
- populated named-graph identities;
- total quad count;
- RDF isomorphism of the canonical shapes graph.

The existing semantic-negative tests use detached shapes graphs as well.

The existing no-op authoring assertion remains unchanged in meaning: a checkout/reparse/replacement candidate must produce the same logical Dataset fingerprint as the canonical Dataset.

## Preserved invariants

This repair does not change:

- any `ontology/dataset/*.trig` content;
- SHACL rules or validation policy;
- scientific or teaching content;
- `dataset_fingerprint()`;
- scene draft serialization;
- structured authoring diagnostics;
- Fuseki runtime/read-only behavior;
- browser/Reveal behavior.

No repository-wide `npm test` result is claimed from the connector worker. A fresh authoritative exact-head validator run is required before owner authoring acceptance or merge.
