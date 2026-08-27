# Issue #84 repair note — no-op authoring roundtrip

## Trigger

The second exact-head validator run on PR #85 head `cc072671d37ee06e7d0d23f9cfe53621a9749359` left exactly one failing assertion in the no-op authoring test. The already-repaired Dataset fingerprint regressions all passed, as did the Fuseki N-Quads/Jena regressions.

The failure compared a fingerprint produced by the authoring workflow's normally imported `rdf_dataset` module with an expected fingerprint produced by a second test-only execution of the same `scripts/rdf_dataset.py` source under a separate module object.

## Corrected diagnosis

Static inspection of the complete supported scene graph shows that the target graph contains named resources and RDF literals but no blank-node subjects. The checkout serializer writes URIRefs and literals using RDF term syntax and preserves integer/boolean datatype metadata. The remaining failure therefore did not provide evidence of a concrete RDF term mutation in `candidate.trig`.

The test harness nevertheless loaded the same repository modules twice:

1. `semantic_authoring.py` imported `rdf_dataset` and `generate_canonical_runtime` through the normal scripts-path module boundary;
2. `tests/test_semantic_authoring.py` independently executed those same source files again with `importlib.util.module_from_spec()`.

That split meant the no-op equality assertion did not compare the workflow against its actual canonical module boundary.

## Repair

`tests/test_semantic_authoring.py` now reuses the exact `rdf_dataset` and `generate_canonical_runtime` module instances imported by the authoring workflow.

The semantic gate is not weakened. New regressions explicitly require:

- `checkout_draft()` followed by `_parse_candidate()` to preserve the target scene graph triple count;
- the reparsed target scene graph to be RDF-isomorphic to the canonical target graph;
- failures to print a deterministic canonical-row semantic delta;
- the full no-op rebuilt candidate Dataset fingerprint to equal the canonical Dataset fingerprint;
- `compile_scene_document()` to leave the supplied Dataset fingerprint unchanged;
- the existing validation/preview/promotion determinism assertions to continue to pass.

The production `dataset_fingerprint()` repair from the previous head is unchanged. No semantic source, SHACL rule, Fuseki runtime, browser runtime or canonical TriG content was modified by this second repair.

## Pending gate

No repository-wide `npm test` is claimed from the connector worker. The next gate is a fresh authoritative `agent-validator/project-chemie-digital` run on the new exact PR head. Owner authoring acceptance remains blocked until that validator succeeds.
