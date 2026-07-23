# Standardabweichung knowledge specification

## Scope

The canonical Standardabweichung example is authored as a connected RDF Dataset in `ontology/dataset/standard-deviation.trig`. It is deliberately broader than a single presentation scene: the same project-owned resource identities support presentation, self-study, graph exploration and later semantic authoring.

## Named graph ownership

- `graph/specifications/standard-deviation` owns scientific concepts and reusable learning resources.
- `graph/examples/standard-deviation` owns concrete observations, datasets and ordered calculation steps.
- `graph/sources/standard-deviation` owns bibliographic and provenance records.
- `graph/scenes/standard-deviation` owns scene definitions and ordered scene items.
- `graph/paths/standard-deviation` owns the nine-step default learning path.
- `graph/migration/standard-deviation` records deprecated legacy identities and replacements.
- `graph/shapes/core` contains the SHACL constraints, including the issue-specific shapes from `standard-deviation-shapes.trig`.

Every audience-visible scientific statement is stored on an authored RDF resource. Scenes only select resource identities and assign communicative roles; they do not copy definitions, formulas, examples or corrections.

## Scientific distinctions

The graph models sample and population standard deviation as separate concepts and formula families. It relates, but does not equate, standard deviation to variance, relative standard deviation, standard error, precision and measurement uncertainty. Explicit misconception/correction pairs preserve the distinctions between spread, precision, trueness/accuracy, systematic error and uncertainty.

The sample formula uses `n − 1` and the symbols `s`, `n`, `x_i` and `x̄`. The population formula uses `N` and the symbols `σ`, `N`, `x_i` and `μ`. Formula-to-symbol completeness is machine-tested.

## Source policy

Definitions, formula families and interpretation claims use paraphrased project-owned wording. Source resources identify the supporting publication or organization and the exact knowledge resources they support. No protected standards text is copied verbatim. The chemistry/statistics subject-matter review required by issue #54 remains a separate acceptance step.

## Migration

The existing `ex:standard-deviation` identity is preserved. Earlier definition, expression, source and scene identities are marked `owl:deprecated true` and linked to canonical replacements with `dct:isReplacedBy`. Legacy JSON-LD remains isolated under `graph/legacy/*`; new content is authored only in TriG.

## Determinism and validation

The existing Dataset assembler discovers canonical TriG sources in sorted path order, validates graph ownership and produces canonical N-Quads plus a SHA-256 fingerprint. Tests additionally reverse source order and require the same fingerprint. SHACL and semantic regressions cover multilingual labels, scoped definitions, formula families and symbols, source coverage, prerequisite acyclicity, forbidden equivalences, ordered observations/calculation steps and scene-resource resolution.
