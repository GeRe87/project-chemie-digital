# Level 4 semantic integration correction

The first complete production validation of PR #291 at `f77e7380` rejected
the dataset with 532 SHACL violations. Focused compiler/browser evidence did
not establish full RDF conformance. No merge or Pages publication followed.

## Causes and corrections

- The new observation placements reused `cd:targetObservation`, whose established
  RDFS domain is `cd:ChartPointAnnotation`. All 474 placements now use the additive
  `cd:placedObservation` relation with domain `cd:ObservationPlacement`. Existing
  chart annotations and their required bodies are unchanged. The compiler and
  extension shapes use the new relation, including its exact provenance.
- Non-code charts, comparison stages and key points reused `cd:showsResource`,
  whose established domain is `cd:CodeExample`. They now use `dct:references`.
  Genuine R examples retain the code-specific relation and all required fields.
- Two preserved comparison stages owned one KeyPoint, violating the single-owner
  invariant. They now own separate authored points with the same explanation.
- The existing grouped-plot shape assumed every `cd:hasChartGroup` subject was a
  dot plot. It now admits the additive BoxPlot primitive as well, retaining group
  ordering, observation ordering, axis-unit and reference checks. BoxPlotShape
  separately enforces the declared quantile convention and fence multiplier.
- The public validator previously loaded only `graph/shapes/core`. It now builds
  a detached union of every `graph/shapes/` named graph. Named-graph identities
  in the canonical dataset are preserved; RDFS inference and meta-SHACL remain
  enabled. Extension constraints are no longer silently omitted.

No established property domain was widened or removed, no missing code fields
or annotation bodies were fabricated, and no scientific values were changed.
The deterministic distribution snapshot helper has a guarded, idempotent
placement migration: it accepts only the exact old or new snapshot and refuses
unfamiliar authored content.

## Verification

Five focused integration regressions pass: placement domains, code-only relation
use, KeyPoint ownership, detached all-graph shape collection, public enforcement
of a non-Core extension shape, plus valid/invalid boxplot conventions and ordering.
A comparison against the pre-correction preview confirms all 65 SceneDocuments
are byte-equivalent after normalizing only the provenance predicate
`cd:placedObservation` back to `cd:targetObservation`. This covers teaching text,
formula bodies, numerical data, chart parameters, scene order and R source.

Full semantic, project, external exact-head and build results remain separate
gates. Pending runs are not success, and evidence for `f77e7380` is stale after
this correction. See the PR for observed results on the submitted head.
