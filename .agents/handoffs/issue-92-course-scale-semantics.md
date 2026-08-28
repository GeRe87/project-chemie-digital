# Agent handoff

## Role

`Semantic Web and Ontology Engineer`

## Issue

`#92 — Implement course-scale semantic reference model`

## Completed

- Added a dedicated stable course-scale vocabulary graph inside the existing canonical TriG Dataset.
- Added project-owned `TeachingOffering`, `LearningUnit`, and `UnitPlacement` concept descriptors.
- Added only the four relations required by ADR-0008: `hasUnitPlacement`, `placesLearningUnit`, `hasFocusConcept`, and `forLearningUnit`; the existing generic `cd:position` attribute is reused for placement order.
- Added SHACL invariants for stable IRI identities, offering membership, exactly-one learning unit per placement, positive integer positions, unique positions within an offering, single-offering ownership of a placement, focus-concept typing, and optional-but-valid path-to-unit references.
- Added one minimal canonical course-scale fixture for `Digitalisierung in der Chemie: Datenmanagement, Prozesse, KI`, containing exactly one Standardabweichung unit and one placement at position `10`.
- Added the path-to-unit association to the existing `graph/paths/standard-deviation` named graph without changing the existing path steps or scenes.
- Added deterministic semantic/query tests, including reversed TriG-source-order verification and negative SHACL cases for every Issue #92 invalid-case requirement.
- Extended the exact stable named-graph contract with only the two new owned graph IRIs.

## Files or resources changed

- `ontology/dataset/course-scale-vocabulary.trig` — new stable curriculum-vocabulary graph.
- `ontology/dataset/course-scale-shapes.trig` — additional shapes in the existing `graph/shapes/core` named graph.
- `ontology/dataset/course-scale.trig` — one offering/unit/placement specification plus the path association in the existing Standardabweichung path graph.
- `tests/test_course_scale_semantics.py` — deterministic query/order and negative SHACL coverage.
- `tests/test_rdf_dataset.py` — registers the two new stable named graph identities.
- `.agents/handoffs/issue-92-course-scale-semantics.md` — this handoff.

No existing Standardabweichung scientific resource, path-step order, scene definition, renderer, application, learner-state schema/runtime, LMS integration or curriculum-wide content was changed.

## Semantic design decisions

### Graph ownership

The new vocabulary uses the dedicated stable graph:

`https://w3id.org/project-chemie-digital/graph/concepts/course-scale`

This was chosen instead of extending `graph:concepts` because course-scale composition is an organizational curriculum vocabulary with a distinct ownership concern from the reusable scientific/learning-resource vocabulary. It still lives under `ontology/dataset/*.trig`, assembles into the same canonical logical Dataset and is therefore not a second semantic authority.

Concrete offering/unit/placement instances use:

`https://w3id.org/project-chemie-digital/graph/specifications/course-scale`

The `ex:path-standard-deviation cd:forLearningUnit ...` statement is authored in the already existing `https://w3id.org/project-chemie-digital/graph/paths/standard-deviation` graph. File boundaries remain review units only; the path association therefore keeps path semantics in the path-owned graph even though it is physically added from the new course-scale TriG review file.

### Relation typing and RDFS inference

The four new relations declare their subject `rdfs:domain` but intentionally do not declare an `rdfs:range`. Repository SHACL validation runs with `inference="rdfs"`. If `rdfs:range cd:LearningUnit` (or the corresponding target class) were declared, an invalid relation to an arbitrary IRI would itself infer the expected target type before SHACL runs, making a mistyped IRI appear valid to a `sh:class` constraint. Target typing is therefore normative in SHACL (`sh:class` plus `sh:nodeKind sh:IRI`) rather than materialized by RDFS range inference.

### Ordering

`UnitPlacement` reuses the existing serialization-independent integer `cd:position` attribute. The canonical fixture uses sparse position `10`. `LearningUnit` has no intrinsic position. A SHACL-SPARQL constraint rejects duplicate positions within one `TeachingOffering`, and tests verify that reversing canonical TriG source-file order does not change the resolved offering/placement/unit sequence.

### Reuse boundary

`ex:learning-unit-standard-deviation` contains only organizational metadata and `cd:hasFocusConcept ex:standard-deviation`. Definitions, formulas, examples, exercises, scenes and other scientific resources remain in their existing upstream resources and are not copied into the unit.

## Verification

- [x] RDF syntax smoke check — the exact three newly authored TriG document bodies were parsed successfully with RDFLib in the worker tool environment before repository publication.
- [x] Python syntax smoke check — the new `tests/test_course_scale_semantics.py` module was parsed successfully with Python AST in the worker tool environment before repository publication.
- [x] Scope/diff review — branch comparison against its `main` base showed only the five implementation/test files before this handoff; no renderer, application, learner-state or compiler files were changed.
- [ ] Root `npm test` — not executed by this connector-oriented worker; the worker environment does not expose the repository checkout plus the project's required Python/Node validation stack.
- [ ] Authoritative exact-head validation — required from `agent-validator/project-chemie-digital` after the draft PR is opened. Worker does not self-accept it.
- [ ] Manual browser check — not requested because no browser/UI contract is changed.

## Acceptance coverage

The new SHACL/test contract covers:

- blank-node/non-IRI identities for all three course-scale authored entity classes;
- missing or multiple learning-unit targets on a placement;
- missing, non-integer, zero and negative placement positions;
- duplicate placement positions inside one offering;
- one placement reused by multiple offerings;
- a `LearningPath` whose `forLearningUnit` target is an IRI that is not asserted as a `LearningUnit`;
- deterministic offering → placement → unit querying;
- Standardabweichung unit → existing focus concept querying;
- existing path → unit querying without renderer semantics;
- course order independence from TriG source-file order.

## Risks or unresolved questions

- The authoritative validator must still confirm meta-SHACL conformance and the complete root `npm test` suite on the exact PR head.
- Adding course-scale semantics changes the canonical Dataset fingerprint, as any authored Dataset change should. `LearnerStateDocument 1.0` itself is unchanged; older exported state bound to an older dataset fingerprint may correctly be treated as stale by the existing compatibility boundary.
- This issue deliberately does not define a course-scale runtime/compiler document or application navigation model.

## Exact recommended next boundary

After manager acceptance of this semantic layer, the next bounded technical increment should remain read-only and renderer-neutral: expose the validated `TeachingOffering → UnitPlacement → LearningUnit → available LearningPath` structure through the existing typed SPARQL/data-integration boundary. Such a follow-up should return stable semantic identities and explicit positions only; it should not introduce course navigation UI, a new scene contract, learner progress, LMS semantics or full curriculum authoring.

This is a recommendation for manager planning only; this worker does not assign or execute the follow-up.

## Recommended manager action

`review` after authoritative exact-head validator evidence is available.
