# System #279 — structured worker handoff

## Role

Semantic Web and Ontology Engineer — single assigned System-track worker turn.

## Issue and isolation

- Issue: [#279](https://github.com/GeRe87/project-chemie-digital/issues/279)
- Draft PR: [#280](https://github.com/GeRe87/project-chemie-digital/pull/280)
- Remote worker branch: `agent/279-semantic-authoring-graph-targets`
- Exact assignment main base: `25d8be85cc08c71907e0acdbd7e5d7e091f06ced`.
- The chat worker used the GitHub connector; no local Windows OpenCode session/worktree was created or used.
- Product `main`, the Chemometrics-track state, the unaccepted PR #185→#277 stack, and the paused #276 worktree were not edited by this worker.

## Completed implementation

Within the approved System source scope:

1. Extended `scripts/semantic_authoring.py` with closed, explicit allowlisted two-graph target `variance-dispersion-scenes`, preserving original Standardabweichung target and version 1.0 contract.
2. New draft v1.1 contains exact LearningUnit, TeachingOffering, placement, path, step, path named graph, proposed scene named graph, and immutable source file allocation. Unknown/ad hoc graph IDs and metadata tampering are refused.
3. Checkout serializes the existing authored Variance path graph and a new empty scene graph into one ignored local TriG candidate; the empty scene cannot be misrepresented as validated.
4. Candidate assembly permits only one new `cd:usesScene` relation for a previously unbound first PathStep. Once the approved SceneDefinition/path link is canonical, the binding must remain unchanged on later drafts; the two owned graph sources are checked for canonical ownership.
5. All other canonical graphs remain intact in memory; stale base and default/third-graph candidates fail closed. Product-owned `rdf_dataset.py` and SHACL policy are used; no second semantic authority.
6. New preview selects the pinned exact `CourseUnitPathSelectionRequest` instead of assuming the Standardabweichung default. Failure to compile a conformant scene is reported as a refusal, not a rendered slide.
7. Bounded SHACL diagnostics (50 max plus truncation flag), review-only promotion manifest with two graph/source IDs and `canonicalWritePerformed:false`. No promotion implementation or canonical source write.
8. Added 11 explicit negative/ownership/nonconformance tests in `tests/test_semantic_authoring_graph_targets.py`, and documentation in `docs/semantic-authoring.md`.

## Changed-file inventory

- `scripts/semantic_authoring.py`
- `tests/test_semantic_authoring_graph_targets.py`
- `docs/semantic-authoring.md`
- `.agents/workflows/system/state.json` (only on this issue branch)
- This handoff file.

No renderer, compiler, ontology, SHACL, authored TriG, unrelated test, lockfile or other track write.

## Verification evidence

- [x] GitHub compare from original exact base `25d8be85...` reports one ahead-only work branch, zero behind and only assigned paths; this will need repeating on exact final PR head.
- [x] GitHub remote files were read back for source-level review and explicit scope checking.
- [ ] Python syntax / new focused Product tests **NOT run**. The connected chat cannot access the owner's isolated Windows worktree or a complete network-connected Product checkout.
- [ ] Existing Standardabweichung compatibility tests **NOT run** after these changes.
- [ ] Full Product `npm test` **NOT run**.
- [ ] Real canonical SHACL and SceneDocument preview **NOT run**.
- [ ] Exact-head `agent-validator/project-chemie-digital` external status **NOT obtained**.
- [ ] Human screenshot/visible slide review **NOT performed**.

**Therefore this worker result is implementation-complete as a reviewable Draft PR but VALIDATION-BLOCKED.** No success status, SHACL conformance, visual preview or merge is claimed.

## Manager/operator acceptance commands (isolated local checkout of exact PR head)

```powershell
python -m unittest discover -s tests -p "test_semantic_authoring*.py" -v
npm test

# Only after focused/full checks, and without replacing an existing workspace:
python scripts/semantic_authoring.py checkout --target-id variance-dispersion-scenes
# The initial candidate has no new scene triples. It MUST NOT validate yet.
python scripts/semantic_authoring.py validate --draft-root .local/authoring/variance-dispersion-scenes
# Expected initial validation refusal: no populated authorized scene graph.
```

Run the established Standardabweichung no-op checkout/validate/preview/prepare-promotion regressions on the exact head and check `git status --short`: no canonical TriG should change.

## Decisions and assumptions

- First increment is an explicitly allowlisted Product-owned target. Generic extension occurs by adding later reviewed target contracts, not by accepting arbitrary model-proposed graph identities or file paths.
- A candidate with only a placeholder typed SceneDefinition may pass structural graph assembly but **must not be represented as a conforming complete scene**; SHACL decides and the compiler refuses unsupported paths.
- No new scientific demonstration values, chart model, presentation-specific layout, or SceneDocument contract was added. These remain under separately governed Variance content Issue #278 or reviewed System follow-ups.
- Open PRs #185→#277 contain a different `generate_canonical_runtime.py`; even a passing authoring test on the current main basis does not establish stacked compiler compatibility.

## Risks, unresolved tasks and blockers

1. **Blocking:** owner/operator must run focused Python tests plus full `npm test` on the exact PR head, report actual results and repair only within the assigned issue scope. These tests were not executed in this remote connector-only turn.
2. **Blocking:** independent code review of the new target registry, path ownership guard, and whether the v1.1 contract needs a policy/ADR before merge.
3. **Blocking:** latest PR-head exact external validator status and compatible main integration; draft PR cannot be accepted or merged now.
4. **Blocked future demonstration:** no authored Variance SceneDefinition is present in the reviewed canonical Product. The new target intentionally seeds an empty scene graph, which is invalid until Issue #278 authors an approved scene.
5. **Integration risk:** current main vs stacked #277 compiler behavior differs; reconcile/validate without editing paused #276 or claiming #278.

## Recommended manager action

**Request tests and independent review, do not merge.** Preserve branch/PR as-is until actual evidence arrives; authorize only narrowly bounded follow-up repairs if tests reveal defects. Do not assign a second Worker turn during this same worker run.


## Follow-up correction #279 — 2026-10-15

**Owner-approved scope:** only `tests/test_semantic_authoring_graph_targets.py` plus this handoff and System state on the isolated PR branch, under the fresh System manager assignment.

**Owner-local reported failure:** `test_two_graph_candidate_assembles_without_mutating_other_named_graphs` generated a very long RDF SHACL `BNode` identity assertion diff; the user-uploaded error output was truncated before the total test summary.

**Correction committed:** `0907bbc67867304caa2eb2dbb5aa9b2bea6be6a5`. Imported `rdflib.compare.isomorphic` and replaced `set(candidate.graph(gid)) == set(original.graph(gid))` for unrelated named graphs with a per-graph RDF isomorphism assertion. This preserves detection of real semantic graph changes while ignoring parser-local blank node identifiers.

**Validation actually performed:** small isolated Python/RDFLib experiment confirmed unequal raw BNode triple sets compare isomorphically for identical RDF structures; this does NOT execute the Product tests or validate full Product code.

**Validation still required on the final exact PR head:** `python -m unittest discover -s tests -p "test_semantic_authoring*.py" -v`, `npm test`, exact-head `agent-validator/project-chemie-digital`, manager review, and full path/positive Preview contract checks. All remain incomplete; prior CDAC 376-test acceptance does not apply. PR #280 remains a Draft; no merge, release, main Product source change or other-track mutation.

**Return to manager:** Corrected the single test assertion and handoff only. Preserve existing draft PR/branch, request operator's concise rerun summary; do not self-accept.
