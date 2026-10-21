# Technical rendering audit and bounded hardening (#284)

## Scope and authority

Baseline: `585fa5a17fcfc423f6ac4e490291de97df34be43`, tree
`db23fb2eeb956796d37b75c7b3a6bf5cbc27db05`, on
`agent/chemometrics-level-4-quantiles-moments-distribution-shape`.
No Level 4 content, scientific edits, deployment, merge or governance edits.
ADRs 0002, 0003, 0004, both 0005 records and 0012 were read before implementation.

The course branch contains historical dispatcher instructions. Current Product
`main`, `d45e2d0918587f0fcd6c60c95494bb9451de709c`, explicitly retires those
instructions in favour of CDAC and owner-authorised bounded tasks. The owner
confirmed applying that current CDAC governance to this task without changing
old state or importing main. No lease/state was claimed. The available MCP
server reported another Product checkout at `70e2fe66...` (PR #280), not this
branch; its semantic/preflight output is **not** target-checkout evidence.
Product-owned local RDF assembly was used instead. This introduces no second
authored semantic source.

Issue #284 records write scope and shared-contract impact. The draft review must
target `chemometrics` to keep this increment separate from the existing course
stack. This is not acceptance of historical PRs #185–#277, #280 or #283, nor a
reconciliation of that stack with main. Integration needs independent review
and the exact-head external `agent-validator/project-chemie-digital` status.

## Confirmed findings and priority

| Priority | Evidence / location | Impact and bounded response |
|---|---|---|
| P0 | `composition-policy.ts::resolveDefinitionFormulaPairs` accepts a supporting singleton as a new card; `preview.ts::mountSceneDocuments` suppresses embedded formula ids independently of formula-unit ids. | A **valid synthetic scene**, context → formula A → its supporting legend → formula B, loses formula B in mounted DOM. This is not a claim of missing content in the published 102-scene corpus. Exclude supporting legends from the card/formula strategy; test actual mounted content, not just plan shape. |
| P1 | `composition-policy.ts::resolveFormulaLegendUnits` previously used only adjacency/kind/emphasis. | An unrelated definition collection could become a formula legend. Require the existing `dct:hasPart` owner evidence; unrelated content keeps ordinary rendering. No new RDF property. |
| P1 | `isAuthoredCodeFunctionLegend` previously compared only `code.source[0]`. | Adding/reordering a legitimate source reference changed grouping. A shared local predicate checks all owner references and keeps relation matching independent of source-array order. |
| P1 | `generate_canonical_runtime.py::dataset_snapshot` sorted statements by subject/predicate/object only. | An identical triple in two named graphs had an iteration-order tie. Full-corpus shuffled/reversed quad enumeration reproduced the difference. Add graph provenance as a final tie-break; retain both attributed records, not a union/deduplication. |
| P1, deferred | `presentation-main.ts` fixed 1440×900 canvas; native portrait is enabled only by an application profile. `composition-fit.ts::inferRevealCompositionFit` has no layout environment and changes variants only for `context-data-visual`. | At 390×844 the course scales down rather than reflows. Sampled effective text reaches roughly 4.3 CSS px; absence of overflow is **not** evidence of readability. Requires a separate responsive/readability increment with navigation and print checks, not more font shrinking. |
| P1, deferred | `line-chart.ts::mountD3LineChart` computes the default y-domain from zero and the maximum; `bar-chart.ts::mountD3BarChart` also computes bar height from the bottom of the plot. `scene-document.ts::validateChart` accepts finite negative values. | Code-confirmed contract/rendering gap for signed data; negative bars can have zero height. No signed chart is added here. Fix domains, zero baselines and annotation geometry together in a separately browser-tested increment. |
| P1, deferred | `live-chart-runtime.ts::updateCompanionTable`, `chartValues`, `withChartValues`. | Companion binding selects the first table, last cell and matching row count; line updates affect only the first series. This is not an explicit general linked-view contract. Existing jitter is runtime interaction with an injectable RNG, not compiler nondeterminism. |
| P1, investigate | Two initial concurrent browser navigation starts remained at the unenhanced shell; sequential repeats passed. | Preserve both failed and successful reports. No console/network root cause was captured for those initial starts, so do not label this definitively as infrastructure or a fixed Product defect. The dedicated all-scene harness subsequently completed. |
| P2 | `renderer-self-study/src/index.ts` imports `renderDerivationDetail` from the Reveal package. | The utility is shared in practice but located under one adapter. A future downstream renderer-support extraction is reasonable; moving it is unnecessary for this fix. |
| P2 | `npm audit` on the locked baseline reports KaTeX low, Vite high and two high transitive advisories. | An audit result, not proof of public-site exploitability. Review deployment/development exposure and compatible upgrades separately; no `audit fix --force`, dependency or lockfile edits here. |

## Composition / contracts assessment

`composition-policy.ts::inferRevealCompositionPlan` is an ordered rule system:
specific signatures precede broad signatures and stack fallback. Ordering is
documented and tested, but new signatures can interact with independent DOM
grouping strategies. Fixing ownership at those shared helpers reduces this
interaction without replacing the renderer or introducing a scoring framework.
Several exact-cardinality teaching signatures remain; their presence is not by
itself proof of a defect. Consolidation should follow demonstrated equivalent
behaviour, not remove working families speculatively.

No topic/scene-label template selector was found in the inspected composition
and D3 primitives. `presentation-profile.ts::resolveProfile` and background
asset registries are application/theme configuration, not scientific layout
selection. Resource **equality** for an explicit relation is legitimate;
interpreting a resource's name to select a template is not.

`SceneDocument` remains 1.7-compatible. Its `validateSceneDocument` checks
reading order, sibling identity/disclosure constraints, finite chart payloads
and source references. SHACL covers upstream identities, resource ownership and
ordered selections; compiler projection retains relation paths and graph
provenance. These layers have different responsibilities: a valid contract does
not guarantee a legible DOM, as the synthetic loss case and portrait baseline
demonstrate. No ontology or shape change is needed for this increment.

The part-legend helper deliberately remains adjacency-bounded: a declared part
can be grouped when next to its owner in semantic reading order. It does not
move a distant legend, invent an association, flatten an explicit group or
change disclosure. Missing/contradictory relation evidence leaves ordinary
content visible. Standalone singleton cards may still pair with adjacent math
as an existing presentation heuristic; this patch only prevents a supporting
legend from participating in both strategies.

## Implemented improvements

1. `packages/renderer-reveal/src/composition-policy.ts`:
   - exclude supporting legends from definition/formula pairing;
   - use one local `isAuthoredPartLegend` predicate for math and code;
   - require explicit `dct:hasPart` evidence and inspect every source reference.
2. `scripts/generate_canonical_runtime.py::dataset_snapshot`:
   - add the graph provenance tuple to the stable statement sort key;
   - preserve each quad's graph-attributed record and all other payload fields.
3. Regression coverage:
   - actual mounted DOM preservation for the overlapping-strategy counterexample;
   - unrelated/wrong-relation/wrong-owner fallbacks;
   - source-array and block-storage-order metamorphisms;
   - consistent IRI/label substitution, input immutability and provenance;
   - explicit same-triple/different-graph snapshot order under reversed enumeration;
   - an explicit immutable-build browser harness for all active documents.

Two synthetic policy fixtures were updated to carry their intended existing
owner relation. Scientific/integration expectations were not removed or loosened.
No CSS, chart geometry, navigation, R code, source dataset or persisted contract
was changed.

## Baseline and regression evidence

The baseline `npm test` completed successfully on `585fa5a1` using Node v25.6.1
and an isolated Python environment with `scripts/requirements-static-build.txt`.
The verified vendor cache was copied as ignored runtime infrastructure, checked
before use, not committed or fetched implicitly by rendering.

The immutable baseline and hardened builds both pass the official static build
helper and semantic validation. A before/after comparison establishes:

- all four complete `SceneDocument` objects are identical (7/12/35/48 scenes);
- offering, path/scene bindings and RDF fingerprint are identical;
- the graph-attributed statement **multiset** is identical;
- the generated no-JavaScript static course HTML is byte-identical;
- all 102 composition plans and formula/code grouping results are unchanged;
- all 11 authored R program strings, seeds, numbers, formulas, narration and
  derivation payloads are therefore unchanged.

The source fingerprint remains
`sha256:0f350478d2666ab9171272ab7f140d606463ff9f4c90a0264d44a0e937162794`.
The neutral counterexample now retains formula B; unrelated legends no longer
group, and extra code sources no longer break the function workbench. The
full-corpus order probes pass after the tie-break.

### Reproducible commands

```text
node --experimental-strip-types --test apps/pitch/test/semantic-grouping-regression.test.ts packages/renderer-reveal/test/composition-policy.test.ts
python -m unittest discover -s tests -p test_snapshot_graph_order.py -v
npm test
python scripts/build_static_course.py --offering-id https://w3id.org/project-chemie-digital/resource/teaching-offering-chemometrics-applied-statistics --offline --base / --out-dir dist/architecture-hardened
python -m http.server 5215 --bind 127.0.0.1 --directory dist/architecture-hardened
python tests/browser_pitch_architecture_regression.py --url http://127.0.0.1:5215/ --artifact dist/architecture-hardened/course-runtime.json --build-head <exact-build-source-SHA> --output <evidence-directory>
```

Use a Playwright-enabled Python with Chromium channel `msedge` for browser
commands. The immutable artifact is an explicit input; later default runtime
generation cannot change the tested scene set. The head argument must identify
the source actually used for the build; the harness also records artifact hash.

The baseline harness completed 408 inspections: 102 scenes × Dark/Light ×
1440×810 and 390×844, 11 actual R runs on desktop Dark, complete static scene
identity/order and generated print PDFs for all four levels. Separate existing
keyboard tests traverse all levels forward/backward, stages, return and restart;
initial cold-start failures and their successful retries are retained separately.
Representative images select first/last and first chart, diagram, table, math,
code and prompt scenes structurally, not by topic name.

Final exact-commit commands, exit codes, browser comparison, review status and
evidence hashes belong in the issue/PR handoff after running against the committed
head. A locally passing command is not the required external commit status or
an independent review. No acceptance or final full-regression result is implied
by this document alone.

### Visual and print limits

Do not use screenshot equality as acceptance. Compare complete content,
hierarchy, relations, drawing counts, typography, bounding observations and
operability on the same scenes. The expected corpus visual impact of this
increment is none: all existing layout/grouping decisions remain the same.

Baseline out-of-viewport measurements include scrollable function-glossary
entries in two Mean Values labs; those observations are not automatically
unreachable clipping. Portrait scales are genuinely too small for comfortable
reading. PDF files are generated and static identities checked, but full manual
pagination/accessibility approval is **not** claimed. No physical touch device,
additional browser engine or screen-reader session is covered.

## Level 4 follow-up, not implemented

- First repair signed numeric geometry and readable portrait recovery against
  existing and neutral fixtures; neither requires writing Level 4 material.
- The current line contract requires strictly increasing x and the renderer
  uses straight interpolation. ECDF/step geometry needs a separately reviewed
  general interpolation contract and static representation; do not encode it
  through resource names or force duplicate x through the existing validator.
- Boxplots and quantile summaries need semantic statistical-result/geometry
  contracts, assumptions and fallback data before renderer implementation.
- Linked views need explicit dataset/result identity, deterministic transforms
  and update scope, not the first-table/first-series heuristic.
- Prefer existing chart dispatch, local lifecycles, ResizeObserver cleanup,
  semantic disclosures and static fallbacks. There is no demonstrated need to
  replace the rendering architecture with a new framework.
