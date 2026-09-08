# Issue #141 worker handoff — language-aware canonical summary metadata

## Role

`Backend and Data Integration Engineer`

## Issue

`#141 — Make canonical graph-summary metadata language-aware for selected lecture`

Branch: `agent/141-summary-language`

## Implemented

- Added deterministic selected-path language resolution in `scripts/generate_canonical_runtime.py` by traversing the selected LearningPath → PathSteps → SceneDefinitions → SceneItems and collecting authored `cd:language` values.
- SceneItems without an explicit language are ignored for language resolution; a path with no explicit language fails closed, and conflicting explicit languages fail closed with a bounded diagnostic instead of guessing.
- Passed the resolved language into canonical `datasetSnapshot` generation.
- Snapshot entity labels prefer `skos:prefLabel` in the effective selected-path language and then preserve the historical fallback order `dct:title` → `schema:name` → local identity. An arbitrary `skos:prefLabel` in another language no longer displaces that historical fallback chain.
- Snapshot entity descriptions prefer `cd:body` in the effective language, then `dct:description` in that language, followed only by deterministic authored-language fallback from those same predicates. No translation or generated text is introduced.
- Preserved `RdfDatasetSnapshot 1.0`; no schema/version field was added.
- Replaced the hard-coded `language: "de"` in `apps/pitch/src/graph-summary-shell.ts` with `sceneProjectionLanguage(scene)`, derived from authored language-bearing relation paths such as `skos:prefLabel@de` / `skos:prefLabel@en`. Missing or conflicting scene-language evidence fails closed.

## Focused regression coverage

### Python — `tests/test_summary_language_projection.py`

- Mean Values selected path resolves to `en`.
- All eleven explanatory owner resources required by Chemometrics #140 retain their exact existing `cd:body@en` as `datasetSnapshot.entities[].description`.
- Default Standard Deviation selected path resolves to `de`, keeps German detail projection and still compiles nine scenes.
- Missing requested language on one resource uses a deterministic authored description fallback and remains stable across repeated snapshot generation.
- Label fallback explicitly proves that a foreign-language `skos:prefLabel` cannot displace `dct:title`, `schema:name`, or local-name fallback; `dct:title` also remains ahead of `schema:name`.
- Conflicting explicit selected-path languages fail closed.
- Repeated Mean Values artifact generation serializes identically.

### TypeScript — `apps/pitch/test/graph-summary-shell.test.ts`

- Synthetic scene fixtures now expose the same authored language-bearing heading selector used by canonical scenes.
- `sceneProjectionLanguage()` is covered for both German and English selectors.
- Conflicting authored scene languages fail closed.
- Existing graph-summary projection/controller tests remain in place.

## Manager review repair

The first manager review of Draft PR #142 found one pre-Ready contract mismatch: the initial implementation used an arbitrary other-language `skos:prefLabel` before the historical `dct:title` / `schema:name` / local-name fallback chain. The bounded repair removes that displacement and adds a focused regression. No other #141 behavior was changed in the repair turn.

## Acceptance evidence

The implementation directly establishes the prerequisite needed by Chemometrics #140:

```text
selected English Mean Values path
        ↓
effective language = en
        ↓
datasetSnapshot entity description
        ↓
exact existing owner cd:body@en
```

The graph/text-summary request no longer injects German independently of the selected lecture; it derives its language from the compiled authored scene selector.

## Validation status

This connector-oriented worker cannot execute the repository-local `npm test` command itself. The focused regressions were authored for the repository validator. Because the bounded repair changes the PR head, fresh exact-head `agent-validator/project-chemie-digital` success remains mandatory before manager acceptance. The Draft PR retains the configured validator marker so the local validator can publish authoritative exact-head evidence.

## Architecture / scope boundary

No changes were made to:

- `ontology/dataset/*.trig` scientific or scene content;
- ontology classes or SHACL;
- KeyPoint semantics from #133;
- `SceneDocument 1.0`;
- `RdfDatasetSnapshot 1.0` schema/version;
- Chemometrics workflow state;
- learner-state contracts;
- presentation background/parallax behavior from #138;
- ADR-0012 renderer layout inference;
- GitHub Actions or deployment/publication configuration.

## Manager review checklist

1. Require fresh `agent-validator/project-chemie-digital = success` on the exact final PR head.
2. Verify the bounded repair is limited to restoring the label fallback order plus its focused regression and this handoff update.
3. Verify no unresolved external review finding remains and the branch is integration-fresh before squash merge.
4. After #141 is merged, Chemometrics #140 may be returned to its bounded KeyPoint-content worker scope on a fresh `main` basis.
